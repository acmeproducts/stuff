#!/usr/bin/env bash
set -euo pipefail
REF="dd1b105cb3e3bf8cdcaabbd14cc656c5fa04483e"
ROOT="$HOME/.sot-turn02/v5"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.sot-turn02"
for f in sot-turn02-v5-engine.py sot-turn02-v5-server.py; do curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"; done
python3 -m py_compile "$ROOT/SOT/sot-turn02-v5-engine.py" "$ROOT/SOT/sot-turn02-v5-server.py"
pkill -f "$ROOT/SOT/sot-turn02-v5-server.py" 2>/dev/null || true
nohup env SOT_PORT=8765 python3 "$ROOT/SOT/sot-turn02-v5-server.py" >"$HOME/.sot-turn02/v5-server.log" 2>&1 &
for _ in $(seq 1 40); do if curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-v5-health.json 2>/dev/null; then break; fi; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v5-health.json'));assert x['ok'] and x['schema']==5,x
print('PASS backend',x['version'],'schema',x['schema'])
PY
if command -v tailscale >/dev/null 2>&1; then
 tailscale serve --bg --https=443 http://127.0.0.1:8765 >/dev/null
 DNS="$(tailscale status --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("Self",{}).get("DNSName","").rstrip("."))' || true)"
else DNS=""; fi
APP="https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v5.html"
if [[ -n "$DNS" ]]; then APP="$APP?api=https%3A%2F%2F$DNS"; fi
printf 'SOT v5 installed from %s\nAPP %s\n' "$REF" "$APP"
