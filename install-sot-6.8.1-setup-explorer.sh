#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BACKEND_BUILD=2026.08.19.6.8-wsl-multiproject-reporting
UI_BUILD=2026.08.19.6.8.1-wsl-setup-explorer
ADDON=sot-ui-6.8.1-setup-explorer-addon.js
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"
python3 - "$TMP/health.json" "$BACKEND_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]:
    raise SystemExit('Refusing UI patch: backend is not the accepted 6.8 runtime: '+repr(x))
print('Backend verified:',x['build'])
PY

echo '=== DOWNLOAD + SYNTAX CHECK ==='
curl -fsSL "$BASE/$ADDON" -o "$TMP/$ADDON"
node --check "$TMP/$ADDON"
cp -a "$UI" "$TMP/project.candidate.html"
python3 - "$TMP/project.candidate.html" "$TMP/$ADDON" <<'PY'
import pathlib,sys
ui=pathlib.Path(sys.argv[1]); addon=pathlib.Path(sys.argv[2]).read_text(); h=ui.read_text()
if '2026.08.19.6.8-wsl-multiproject-reporting' not in h:
    raise SystemExit('Live UI is not 6.8; refusing to patch unknown UI')
if '2026.08.19.6.8.1-wsl-setup-explorer' in h:
    raise SystemExit('6.8.1 is already installed')
marker='</body></html>'
if marker not in h: raise SystemExit('UI body marker missing')
h=h.replace(marker,'<script>\n'+addon+'\n</script>\n'+marker,1)
ui.write_text(h)
PY
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/project-scripts.js"
grep -q "$UI_BUILD" "$TMP/project.candidate.html"

echo '=== INSTALL UI ONLY ==='
STAMP="$(date +%Y%m%d-%H%M%S)"
BAK="$UI.before-6.8.1-$STAMP"
cp -a "$UI" "$BAK"
rollback(){
  echo '=== UI GATE FAILED — RESTORE 6.8 UI ===' >&2
  cp -a "$BAK" "$UI" || true
  exit 1
}
trap rollback ERR
cp -a "$TMP/project.candidate.html" "$UI"

echo '=== LOCAL + BACKEND GATES ==='
grep -q "$UI_BUILD" "$UI"
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health2.json"
python3 - "$TMP/health2.json" "$BACKEND_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Backend changed unexpectedly: '+repr(x))
PY

echo '=== PUBLIC UI GATE ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260819-681"
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q "$UI_BUILD" "$TMP/public.html"

echo '=== SUCCESS ==='
echo "Backend unchanged: $BACKEND_BUILD"
echo "UI:                $UI_BUILD"
echo 'Project Setup: explorer-first folder pane with ribbon, search, sortable metadata columns, and mobile-primary layout'
echo "URL:               $PUBLIC"
trap - ERR
