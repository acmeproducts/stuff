#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
EXPECTED_BACKEND=2026.08.18.6.7.1-wsl-parallel
EXPECTED_UI=2026.08.18.6.7.1-wsl-parallel
BUILD=2026.08.18.6.7.2-wsl-telemetry
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

echo "=== PRECHECK 6.7.1 ==="
systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"
python3 - "$TMP/health.json" "$EXPECTED_BACKEND" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Expected healthy 6.7.1 backend; got '+repr(x))
PY
grep -q "$EXPECTED_UI" "$UI"

echo "=== DOWNLOAD UI HOTFIX ==="
curl -fsSL "$BASE/sot-ui-6.7.2-telemetry-hotfix.js" -o "$TMP/hotfix.js"
node --check "$TMP/hotfix.js"

echo "=== BUILD UI CANDIDATE OFFLINE ==="
cp -a "$UI" "$TMP/project.candidate.html"
HOTFIX="$TMP/hotfix.js" UI_CAND="$TMP/project.candidate.html" python3 - <<'PY'
import os,pathlib
ui=pathlib.Path(os.environ['UI_CAND']); h=ui.read_text(); addon=pathlib.Path(os.environ['HOTFIX']).read_text()
if '2026.08.18.6.7.2-wsl-telemetry' not in h:
    if '2026.08.18.6.7.1-wsl-parallel' not in h: raise SystemExit('UI is not expected 6.7.1 base')
    marker='</body></html>'
    if marker not in h: raise SystemExit('UI body marker missing')
    h=h.replace(marker,'<script>\n'+addon+'\n</script>\n'+marker,1)
ui.write_text(h)
PY
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();s='\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I));pathlib.Path(sys.argv[2]).write_text(s)
PY
node --check "$TMP/project-scripts.js"
grep -q "$BUILD" "$TMP/project.candidate.html"

echo "=== BACKUP + INSTALL UI ONLY ==="
STAMP="$(date +%Y%m%d-%H%M%S)"
UI_BAK="$UI.before-6.7.2-$STAMP"
cp -a "$UI" "$UI_BAK"
rollback(){ echo "=== UI GATE FAILED — ROLLBACK ===" >&2; cp -a "$UI_BAK" "$UI"; exit 1; }
trap rollback ERR
cp -a "$TMP/project.candidate.html" "$UI"

echo "=== LOCAL UI GATE ==="
grep -m1 "$BUILD" "$UI"

echo "=== BACKEND STILL HEALTHY ==="
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/posthealth.json"
python3 - "$TMP/posthealth.json" "$EXPECTED_BACKEND" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Backend changed or unhealthy: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo "=== PUBLIC UI GATE ==="
curl -fsS "https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260818-672" -o "$TMP/public-ui.html"
grep -q "$BUILD" "$TMP/public-ui.html"
echo "Public UI build verified: $BUILD"

echo "=== SUCCESS ==="
echo "Backend unchanged: $EXPECTED_BACKEND"
echo "UI:               $BUILD"
echo "URL:              https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260818-672"
trap - ERR
