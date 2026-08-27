#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

CORE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
WRAPPER_URL='https://raw.githubusercontent.com/acmeproducts/stuff/eea590a55ac14a0fcfd194fb94c648069436485c/sot-api-turn01-base.js'
HTML_URL='https://raw.githubusercontent.com/acmeproducts/stuff/41f18cd9088bd16f80a682c59ce0be937b794779/SOT-turn01-base.html'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'

mkdir -p "$SOT_DIR"

echo '=== FETCH TURN 01 BASE ==='
curl --max-time 30 -fsSL "$CORE_URL" -o "$TMP/sot-api-core-pre-base.js"
curl --max-time 30 -fsSL "$WRAPPER_URL" -o "$TMP/sot-api-turn01-base.js"
curl --max-time 30 -fsSL "$HTML_URL" -o "$TMP/SOT-turn01-base.html"

node --check "$TMP/sot-api-core-pre-base.js"
node --check "$TMP/sot-api-turn01-base.js"
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
import pathlib,re,sys
html=pathlib.Path(sys.argv[1]).read_text()
assert 'SOT-turn01-base' in html
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
if not scripts: raise SystemExit('no executable script found')
pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
node --check "$TMP/ui.js"

echo '=== INSTALL ==='
sudo systemctl stop "$SERVICE"
install -m 0644 "$TMP/sot-api-core-pre-base.js" "$REPORT_ROOT/sot-api-core-pre-base.js"
install -m 0644 "$TMP/sot-api-turn01-base.js" "$REPORT_ROOT/sot-api.js"
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"

echo '=== LIVE GATES ==='
for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"; then break; fi
  sleep 1
done
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok': raise SystemExit('SOT health failed: '+repr(x))
print('health:',x.get('status'),'core build:',x.get('build'))
PY

curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/volumes.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('build')!='2026.08.27.sot-turn01-base-1': raise SystemExit('wrong turn01 base API build')
if not isinstance(x.get('volumes'),list): raise SystemExit('volumes response malformed')
print('WSL-visible volumes:',len(x['volumes']))
for v in x['volumes']: print(' -',v.get('name'),v.get('path'))
PY

curl --max-time 5 -fsS "http://127.0.0.1:18080/SOT/SOT-turn01-base.html" -o "$TMP/live.html" || true
if [ -s "$TMP/live.html" ]; then grep -q 'SOT-turn01-base' "$TMP/live.html"; fi

echo '=== TURN 01 BASE INSTALLED ==='
echo "FILE: $SOT_DIR/SOT-turn01-base.html"
echo "TEST: $PUBLIC_URL"
