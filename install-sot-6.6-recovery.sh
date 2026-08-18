#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
API="$ROOT/sot-api.js"
BUILD=2026.08.17.6.6-wsl-recovery
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

echo "=== PRECHECK CURRENT SERVICE ==="
if ! systemctl is-active --quiet openclaw-report-server.service; then
  echo "Report server is not active. Refusing deployment." >&2
  exit 1
fi
curl -fsS http://127.0.0.1:18080/api/sot/health >/dev/null

echo "=== DOWNLOAD VALIDATED 6.6 ADDONS ==="
curl -fsSL "$BASE/sot-backend-6.6-addon.js" -o "$TMP/backend-addon.js"
curl -fsSL "$BASE/sot-ui-6.6-addon.js" -o "$TMP/ui-addon.js"
node --check "$TMP/backend-addon.js"
node --check "$TMP/ui-addon.js"

echo "=== BUILD CANDIDATES OFFLINE ==="
cp -a "$API" "$TMP/sot-api.candidate.js"
cp -a "$UI" "$TMP/project.candidate.html"
BACKEND_ADDON="$TMP/backend-addon.js" UI_ADDON="$TMP/ui-addon.js" \
API_CAND="$TMP/sot-api.candidate.js" UI_CAND="$TMP/project.candidate.html" \
python3 - <<'PY'
import os,pathlib
api=pathlib.Path(os.environ['API_CAND']); ui=pathlib.Path(os.environ['UI_CAND'])
ba=pathlib.Path(os.environ['BACKEND_ADDON']).read_text(); ua=pathlib.Path(os.environ['UI_ADDON']).read_text()
s=api.read_text()
if "BUILD='2026.08.17.6.6-wsl-recovery'" not in s:
    if "BUILD='2026.08.17.6.4-wsl-live'" not in s:
        raise SystemExit('Backend is not known-good 6.4; refusing to patch')
    s=s.replace("BUILD='2026.08.17.6.4-wsl-live'","BUILD='2026.08.17.6.6-wsl-recovery'",1)
    marker='module.exports={handle,VERSION,BUILD};'
    if marker not in s: raise SystemExit('Backend export marker missing')
    s=s.replace(marker,ba+'\n'+marker,1)
api.write_text(s)

h=ui.read_text()
if "BUILD='2026.08.17.6.6-wsl-recovery'" not in h:
    if "BUILD='2026.08.17.6.4-wsl-live'" not in h:
        raise SystemExit('UI is not known-good 6.4; refusing to patch')
    h=h.replace("BUILD='2026.08.17.6.4-wsl-live'","BUILD='2026.08.17.6.6-wsl-recovery'",1)
    h=h.replace('UI v0.4.1 · 2026.08.12.6.1','UI v0.4.1 · 2026.08.17.6.6-wsl-recovery',1)
    marker='</body></html>'
    if marker not in h: raise SystemExit('UI body marker missing')
    h=h.replace(marker,'<script>\n'+ua+'\n</script>\n'+marker,1)
ui.write_text(h)
PY

node --check "$TMP/sot-api.candidate.js"
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text()
s='\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I))
pathlib.Path(sys.argv[2]).write_text(s)
PY
node --check "$TMP/project-scripts.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/project.candidate.html"

echo "=== BACKUP LIVE FILES ==="
STAMP="$(date +%Y%m%d-%H%M%S)"
API_BAK="$API.before-6.6-$STAMP"
UI_BAK="$UI.before-6.6-$STAMP"
cp -a "$API" "$API_BAK"
cp -a "$UI" "$UI_BAK"

echo "=== INSTALL CANDIDATES ==="
cp -a "$TMP/sot-api.candidate.js" "$API"
cp -a "$TMP/project.candidate.html" "$UI"

rollback(){
  echo "=== HEALTH GATE FAILED — AUTOMATIC ROLLBACK ===" >&2
  cp -a "$API_BAK" "$API"
  cp -a "$UI_BAK" "$UI"
  sudo systemctl restart openclaw-report-server.service || true
  sleep 2
  systemctl is-active openclaw-report-server.service || true
  exit 1
}
trap rollback ERR

echo "=== RESTART + HEALTH GATE ==="
sudo systemctl restart openclaw-report-server.service
for i in {1..10}; do
  sleep 1
  if curl -fsS http://127.0.0.1:18080/api/sot/health >"$TMP/health.json" 2>/dev/null; then break; fi
done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('No health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Wrong health/build: '+repr(x))
print(json.dumps(x,indent=2))
PY
curl -fsS http://127.0.0.1:18080/api/sot/db/info | python3 -m json.tool
curl -fsS 'http://127.0.0.1:18080/api/sot/logs?limit=3' | python3 -m json.tool

echo "=== UI GATE ==="
grep -m1 "$BUILD" "$UI"
curl -fsS "https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260817-66" | grep -m1 "$BUILD" >/dev/null

echo "=== SUCCESS ==="
echo "Backend: $BUILD"
echo "UI:      $BUILD"
echo "DB:      /home/support/.openclaw/sot/sot.sqlite"
echo "URL:     https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260817-66"
trap - ERR
