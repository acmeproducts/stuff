#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BACKEND_BUILD=2026.08.19.6.8-wsl-multiproject-reporting
UI_BUILD=2026.08.19.6.8.2-wsl-mobile-explorer
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"
python3 - "$TMP/health.json" "$BACKEND_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Refusing UI release: backend is not accepted 6.8: '+repr(x))
print('Backend verified:',x['build'])
PY

curl -fsSL "$BASE/sot-ui-6.8.2-mobile-explorer-fix.js" -o "$TMP/fix.js"
node --check "$TMP/fix.js"
cp -a "$UI" "$TMP/project.candidate.html"
python3 - "$TMP/project.candidate.html" "$TMP/fix.js" <<'PY'
import pathlib,sys
ui=pathlib.Path(sys.argv[1]); h=ui.read_text(); fix=pathlib.Path(sys.argv[2]).read_text()
if '2026.08.19.6.8-wsl-multiproject-reporting' not in h: raise SystemExit('Live UI is not on 6.8 line')
if '2026.08.19.6.8.2-wsl-mobile-explorer' in h: raise SystemExit('6.8.2 already installed')
marker='</body></html>'
if marker not in h: raise SystemExit('UI body marker missing')
h=h.replace(marker,'<script>\n'+fix+'\n</script>\n'+marker,1)
ui.write_text(h)
PY
python3 - "$TMP/project.candidate.html" "$TMP/scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/scripts.js"
grep -q "$UI_BUILD" "$TMP/project.candidate.html"

STAMP="$(date +%Y%m%d-%H%M%S)"
BAK="$UI.before-6.8.2-$STAMP"
cp -a "$UI" "$BAK"
rollback(){ echo '=== 6.8.2 UI GATE FAILED — RESTORE PRE-6.8.2 UI ===' >&2; cp -a "$BAK" "$UI" || true; exit 1; }
trap rollback ERR
cp -a "$TMP/project.candidate.html" "$UI"
grep -q "$UI_BUILD" "$UI"

PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260819-682"
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q "$UI_BUILD" "$TMP/public.html"

echo '=== SUCCESS ==='
echo "Backend unchanged: $BACKEND_BUILD"
echo "UI:                $UI_BUILD"
echo 'Mobile Pane 2: full-height explorer body, compact drive rail, top ribbon, no horizontal desktop canvas'
echo "URL:               $PUBLIC"
trap - ERR
