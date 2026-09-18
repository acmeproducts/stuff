#!/usr/bin/env bash
set -euo pipefail
REF="182dc0576b3dbb2c539c0c96b614fc9bc3897877"
ROOT="$HOME/.sot-turn02/v7"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
for f in sot-turn02-v7-engine.py sot-turn02-pre-base-v7-server.py sot-turn02-v7.service; do curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"; done
cp "$ROOT/SOT/sot-turn02-v7.service" "$HOME/.config/systemd/user/sot-turn02-v7.service"
python3 -m py_compile "$ROOT/SOT/sot-turn02-v7-engine.py" "$ROOT/SOT/sot-turn02-pre-base-v7-server.py"
systemctl --user disable --now sot-turn02-v6.service 2>/dev/null || true
pkill -f 'sot-turn02-v5-server.py|sot-turn02-pre-base-v6-server.py|sot-turn02-pre-base-v7-server.py' 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user enable --now sot-turn02-v7.service
rm -f /tmp/sot-v7-health.json
for _ in $(seq 1 80); do curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-v7-health.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v7-health.json'))
assert x['ok'] and x['schema']==6 and x['version']=='turn02-pre-base-v7',x
print('PASS backend',x['version'],'schema',x['schema'])
PY
tailscale serve --bg --https=443 http://127.0.0.1:8765 >/dev/null
DNS="$(tailscale status --json | python3 -c 'import json,sys;print(json.load(sys.stdin).get("Self",{}).get("DNSName","").rstrip("."))')"
rm -f /tmp/sot-v7-https.json
for _ in $(seq 1 40); do curl -fsS "https://$DNS/api/health" >/tmp/sot-v7-https.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v7-https.json'));assert x['ok'] and x['version']=='turn02-pre-base-v7',x
print('PASS HTTPS backend',x['version'])
PY
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v7.html?v=%s&api=https%%3A%%2F%%2F%s\n' "$REF" "$DNS"
