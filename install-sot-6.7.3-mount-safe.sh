#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
API="$ROOT/sot-api.js"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BASE66=2026.08.17.6.6-wsl-recovery
BUILD=2026.08.18.6.7.3-wsl-mount-safe
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service

STAMP="$(date +%Y%m%d-%H%M%S)"
CURRENT_API_BAK="$API.before-6.7.3-rollback-$STAMP"
CURRENT_UI_BAK="$UI.before-6.7.3-rollback-$STAMP"
cp -a "$API" "$CURRENT_API_BAK"
cp -a "$UI" "$CURRENT_UI_BAK"

API66="$(ls -1t "$API".before-6.7.1-* 2>/dev/null | head -1 || true)"
UI66="$(ls -1t "$UI".before-6.7.1-* 2>/dev/null | head -1 || true)"
if [[ -z "$API66" || -z "$UI66" ]]; then
  echo "FAIL: exact pre-6.7.1 rollback pair not found; refusing to guess." >&2
  exit 1
fi
grep -q "$BASE66" "$API66"
grep -q "$BASE66" "$UI66"

echo "=== ROLLBACK TO VERIFIED 6.6 ==="
cp -a "$API66" "$API"
cp -a "$UI66" "$UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..12}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/66health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/66health.json" "$BASE66" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('No health after rollback')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Rollback did not reach 6.6: '+repr(x))
print('Rollback verified:',x.get('build'))
PY

echo "=== DOWNLOAD RETRY COMPONENTS ==="
for f in sot-backend-6.7-addon.js sot-backend-6.7.1-hotfix.js sot-backend-6.7.3-mount-safe-addon.js sot-ui-6.7-addon.js sot-ui-6.7.1-hotfix.js sot-ui-6.7.2-telemetry-hotfix.js sot-ui-6.7.3-mount-safe-addon.js; do
  curl -fsSL "$BASE/$f" -o "$TMP/$f"
done
node --check "$TMP/sot-backend-6.7-addon.js"
node --check "$TMP/sot-backend-6.7.1-hotfix.js"
node --check "$TMP/sot-backend-6.7.3-mount-safe-addon.js"
node --check "$TMP/sot-ui-6.7-addon.js"
node --check "$TMP/sot-ui-6.7.1-hotfix.js"
node --check "$TMP/sot-ui-6.7.2-telemetry-hotfix.js"
node --check "$TMP/sot-ui-6.7.3-mount-safe-addon.js"

echo "=== REBUILD RETRY CANDIDATE FROM 6.6 ==="
cp -a "$API" "$TMP/sot-api.candidate.js"
cp -a "$UI" "$TMP/project.candidate.html"
TMP="$TMP" python3 - <<'PY'
import os,pathlib,re
T=pathlib.Path(os.environ['TMP'])
api=T/'sot-api.candidate.js'; ui=T/'project.candidate.html'
s=api.read_text(); h=ui.read_text()
if '2026.08.17.6.6-wsl-recovery' not in s: raise SystemExit('backend candidate is not 6.6')
if '2026.08.17.6.6-wsl-recovery' not in h: raise SystemExit('UI candidate is not 6.6')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
parts=[(T/'sot-backend-6.7-addon.js').read_text(),(T/'sot-backend-6.7.1-hotfix.js').read_text(),(T/'sot-backend-6.7.3-mount-safe-addon.js').read_text()]
s=s.replace(marker,'\n'.join(parts)+'\n'+marker,1)
api.write_text(s)
marker='</body></html>'
if marker not in h: raise SystemExit('UI body marker missing')
parts=[(T/'sot-ui-6.7-addon.js').read_text(),(T/'sot-ui-6.7.1-hotfix.js').read_text(),(T/'sot-ui-6.7.2-telemetry-hotfix.js').read_text(),(T/'sot-ui-6.7.3-mount-safe-addon.js').read_text()]
h=h.replace(marker,''.join('<script>\n'+x+'\n</script>\n' for x in parts)+marker,1)
ui.write_text(h)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text(); pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/project-scripts.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/project.candidate.html"

echo "=== INSTALL RETRY ==="
rollback(){
  echo "=== 6.7.3 GATE FAILED — RESTORE 6.6 ===" >&2
  cp -a "$API66" "$API"; cp -a "$UI66" "$UI"
  sudo systemctl restart openclaw-report-server.service || true
  sleep 2
  curl -fsS http://127.0.0.1:18080/api/sot/health || true; echo
  exit 1
}
trap rollback ERR
cp -a "$TMP/sot-api.candidate.js" "$API"
cp -a "$TMP/project.candidate.html" "$UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..12}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('No retry health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Wrong retry build: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo "=== MOUNTED-VOLUME CONTRACT GATE ==="
curl -fsS 'http://127.0.0.1:18080/api/sot/fs?path=/' -o "$TMP/roots.json"
python3 - "$TMP/roots.json" "$TMP" <<'PY'
import json,sys,subprocess,urllib.parse,pathlib
x=json.load(open(sys.argv[1])); roots=x.get('locations') or []
if not roots: raise SystemExit('No source roots returned')
for r in roots:
    p=r.get('path'); label=r.get('label') or r.get('name') or p
    if not p: continue
    if r.get('available') is False:
        print('UNAVAILABLE (correctly explicit):',label,p,r.get('error'))
        continue
    url='http://127.0.0.1:18080/api/sot/fs?path='+urllib.parse.quote(p,safe='')
    out=subprocess.check_output(['curl','-fsS',url],text=True)
    b=json.loads(out)
    if 'folders' not in b or 'files' not in b: raise SystemExit('Browse contract missing folders/files for '+label)
    print(label,p,'folders=',len(b.get('folders') or []),'root_files=',len(b.get('files') or []))
PY

echo "=== DB + UI GATES ==="
curl -fsS http://127.0.0.1:18080/api/sot/db/info -o "$TMP/db.json"
python3 - "$TMP/db.json" "$BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('build')!=sys.argv[2] or not x.get('integrity',{}).get('ok'): raise SystemExit('DB gate failed: '+repr(x))
PY
curl -fsS "https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260818-673" -o "$TMP/public-ui.html"
grep -q "$BUILD" "$TMP/public-ui.html"

echo "=== SUCCESS ==="
echo "Rollback baseline: $BASE66"
echo "Backend/UI:       $BUILD"
echo "Server:           existing openclaw-report-server.service only"
echo "URL:              https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260818-673"
trap - ERR
