#!/usr/bin/env bash
set -euo pipefail
REF="09880afc339998408e293fcf341102c23b402773"
ROOT="$HOME/.sot-turn02/v6"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
curl -fsSL "$BASE/SOT/sot-turn02-v5-engine.py" -o "$ROOT/SOT/sot-turn02-v5-engine.py"
curl -fsSL "$BASE/SOT/sot-turn02-pre-base-v6-server.py" -o "$ROOT/SOT/sot-turn02-pre-base-v6-server.py"
curl -fsSL "$BASE/SOT/sot-turn02-v6.service" -o "$HOME/.config/systemd/user/sot-turn02-v6.service"
python3 -m py_compile "$ROOT/SOT/sot-turn02-v5-engine.py" "$ROOT/SOT/sot-turn02-pre-base-v6-server.py"
pkill -f 'sot-turn02-v5-server.py' 2>/dev/null || true
pkill -f 'sot-turn02-pre-base-v6-server.py' 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user enable --now sot-turn02-v6.service
for _ in $(seq 1 60); do
 if curl -fsS http://127.0.0.1:8765/api/health > /tmp/sot-v6-health.json 2>/dev/null; then break; fi
 sleep .25
done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v6-health.json'))
assert x['ok'] and x['schema']==5 and x['version']=='turn02-pre-base-v6',x
print('PASS backend',x['version'],'schema',x['schema'])
PY
if command -v tailscale >/dev/null 2>&1; then
 tailscale serve --bg --https=443 http://127.0.0.1:8765 >/dev/null
 DNS="$(tailscale status --json 2>/dev/null | python3 -c 'import json,sys; print(json.load(sys.stdin).get("Self",{}).get("DNSName","").rstrip("."))' || true)"
else DNS=""; fi
if [[ -n "$DNS" ]]; then
 for _ in $(seq 1 40); do curl -fsS "https://$DNS/api/health" >/tmp/sot-v6-https-health.json 2>/dev/null && break; sleep .25; done
 python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v6-https-health.json'))
assert x['ok'] and x['version']=='turn02-pre-base-v6',x
print('PASS HTTPS backend',x['version'])
PY
fi
APP="https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v6.html?v=$REF"
if [[ -n "$DNS" ]]; then APP="$APP&api=https%3A%2F%2F$DNS"; fi
printf 'APP %s\n' "$APP"
