#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
API="$ROOT/sot-api.js"
EXPECTED_BASE=2026.08.17.6.6-wsl-recovery
BUILD=2026.08.18.6.7.1-wsl-parallel
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

echo "=== PRECHECK HEALTHY 6.6 BASE ==="
systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/prehealth.json"
python3 - "$TMP/prehealth.json" "$EXPECTED_BASE" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Expected healthy 6.6 base; got '+repr(x))
PY

echo "=== DOWNLOAD 6.7 + 6.7.1 ADDONS ==="
curl -fsSL "$BASE/sot-backend-6.7-addon.js" -o "$TMP/backend-67.js"
curl -fsSL "$BASE/sot-backend-6.7.1-hotfix.js" -o "$TMP/backend-hotfix.js"
curl -fsSL "$BASE/sot-ui-6.7-addon.js" -o "$TMP/ui-67.js"
curl -fsSL "$BASE/sot-ui-6.7.1-hotfix.js" -o "$TMP/ui-hotfix.js"
node --check "$TMP/backend-67.js"
node --check "$TMP/backend-hotfix.js"
node --check "$TMP/ui-67.js"
node --check "$TMP/ui-hotfix.js"

echo "=== BUILD CANDIDATES OFFLINE ==="
cp -a "$API" "$TMP/sot-api.candidate.js"
cp -a "$UI" "$TMP/project.candidate.html"
BACK67="$TMP/backend-67.js" BACKFIX="$TMP/backend-hotfix.js" UI67="$TMP/ui-67.js" UIFIX="$TMP/ui-hotfix.js" API_CAND="$TMP/sot-api.candidate.js" UI_CAND="$TMP/project.candidate.html" python3 - <<'PY'
import os,pathlib
api=pathlib.Path(os.environ['API_CAND']);ui=pathlib.Path(os.environ['UI_CAND'])
s=api.read_text();h=ui.read_text()
if "2026.08.17.6.6-wsl-recovery" not in s: raise SystemExit('Backend is not expected 6.6 base')
if "2026.08.17.6.6-wsl-recovery" not in h: raise SystemExit('UI is not expected 6.6 base')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('Backend export marker missing')
ba=pathlib.Path(os.environ['BACK67']).read_text();bf=pathlib.Path(os.environ['BACKFIX']).read_text()
s=s.replace(marker,ba+'\n'+bf+'\n'+marker,1)
api.write_text(s)
marker='</body></html>'
if marker not in h: raise SystemExit('UI body marker missing')
ua=pathlib.Path(os.environ['UI67']).read_text();uf=pathlib.Path(os.environ['UIFIX']).read_text()
h=h.replace(marker,'<script>\n'+ua+'\n</script>\n<script>\n'+uf+'\n</script>\n'+marker,1)
ui.write_text(h)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();s='\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I));pathlib.Path(sys.argv[2]).write_text(s)
PY
node --check "$TMP/project-scripts.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/project.candidate.html"

echo "=== BACKUP LIVE FILES ==="
STAMP="$(date +%Y%m%d-%H%M%S)"
API_BAK="$API.before-6.7.1-$STAMP";UI_BAK="$UI.before-6.7.1-$STAMP"
cp -a "$API" "$API_BAK";cp -a "$UI" "$UI_BAK"
rollback(){
 echo "=== 6.7.1 GATE FAILED — AUTOMATIC ROLLBACK ===" >&2
 cp -a "$API_BAK" "$API";cp -a "$UI_BAK" "$UI"
 sudo systemctl restart openclaw-report-server.service || true;sleep 2
 curl -fsS http://127.0.0.1:18080/api/sot/health || true;echo
 exit 1
}
trap rollback ERR

echo "=== INSTALL + RESTART ==="
cp -a "$TMP/sot-api.candidate.js" "$API";cp -a "$TMP/project.candidate.html" "$UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..12};do sleep 1;if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null;then break;fi;done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('No health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Wrong health/build: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo "=== DB INFO GATE ==="
curl -fsS http://127.0.0.1:18080/api/sot/db/info -o "$TMP/dbinfo.json"
python3 - "$TMP/dbinfo.json" "$BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if not x.get('integrity',{}).get('ok'): raise SystemExit('DB integrity failed: '+repr(x))
if x.get('build')!=sys.argv[2]: raise SystemExit('DB endpoint wrong build: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo "=== ROOT GATE ==="
curl -fsS 'http://127.0.0.1:18080/api/sot/fs?path=/' -o "$TMP/roots.json"
python3 - "$TMP/roots.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));print(json.dumps(x,indent=2))
PY

echo "=== LOG GATE ==="
curl -fsS 'http://127.0.0.1:18080/api/sot/logs?limit=100' -o "$TMP/logs.json"
python3 - "$TMP/logs.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));print('log rows:',len(x))
PY

echo "=== UI GATE ==="
grep -m1 "$BUILD" "$UI"
curl -fsS "https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260818-671" -o "$TMP/public-ui.html"
grep -q "$BUILD" "$TMP/public-ui.html"
echo "Public UI build verified: $BUILD"

echo "=== SUCCESS ==="
echo "Backend: $BUILD"
echo "UI:      $BUILD"
echo "DB:      /home/support/.openclaw/sot/sot.sqlite"
echo "URL:     https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260818-671"
trap - ERR
