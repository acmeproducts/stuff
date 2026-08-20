#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BACKEND=2026.08.20.6.9.1-wsl-path-centric-analysis
BUILD=2026.08.20.6.9.2-wsl-project-workspace
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"
python3 - "$TMP/health.json" "$BACKEND" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]:raise SystemExit('Refusing UI-only 6.9.2: backend is not accepted 6.9.1: '+repr(x))
print('Backend verified:',x['build'])
PY
curl -fsSL "$BASE/sot-ui-6.9.2-project-workspace.js" -o "$TMP/ui.js"
node --check "$TMP/ui.js"
cp -a "$UI" "$TMP/project.candidate.html"
python3 - "$TMP/project.candidate.html" "$TMP/ui.js" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]);h=p.read_text();js=pathlib.Path(sys.argv[2]).read_text();build='2026.08.20.6.9.2-wsl-project-workspace'
if build in h:raise SystemExit('6.9.2 UI already present')
marker='</body></html>'
if marker not in h:raise SystemExit('body marker missing')
h=h.replace(marker,'<script>\n'+js+'\n</script>\n'+marker,1);p.write_text(h)
PY
python3 - "$TMP/project.candidate.html" "$TMP/scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/scripts.js"
grep -q "$BUILD" "$TMP/project.candidate.html"
grep -q 'Search projects…' "$TMP/project.candidate.html"
grep -q 'Add Paths' "$TMP/project.candidate.html"
grep -q 'Changes to name/note save on blur or Enter' "$TMP/project.candidate.html"
STAMP="$(date +%Y%m%d-%H%M%S)";BAK="$UI.before-6.9.2-$STAMP";cp -a "$UI" "$BAK"
rollback(){ cp -a "$BAK" "$UI" || true; exit 1; }
trap rollback ERR
cp -a "$TMP/project.candidate.html" "$UI"
curl -fsS 'http://127.0.0.1:18080/SOT/project.html?v=20260820-692' -o "$TMP/local.html"
grep -q "$BUILD" "$TMP/local.html"
PUBLIC='https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260820-692'
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q "$BUILD" "$TMP/public.html"
# Backend must remain unchanged.
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/after.json"
python3 - "$TMP/after.json" "$BACKEND" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('build')!=sys.argv[2]:raise SystemExit('backend changed unexpectedly: '+repr(x))
PY
echo '=== SUCCESS ==='
echo "Backend unchanged: $BACKEND"
echo "UI: $BUILD"
echo 'Project Setup: one project omni + separate Project/Add Paths workspaces'
echo "URL: $PUBLIC"
trap - ERR
