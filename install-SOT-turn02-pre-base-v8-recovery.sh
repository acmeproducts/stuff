#!/usr/bin/env bash
set -euo pipefail
REF="a5d50f2b78291ee73c54236c76b85cfa23622750"
ROOT="$HOME/.sot-turn02/v8r"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
for f in sot-turn02-v8-engine.py sot-turn02-pre-base-v8-server.py; do curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"; done
curl -fsSL "$BASE/SOT/sot-turn02-v8-recovery.service" -o "$HOME/.config/systemd/user/sot-turn02-v8-recovery.service"
python3 -m py_compile "$ROOT/SOT/sot-turn02-v8-engine.py" "$ROOT/SOT/sot-turn02-pre-base-v8-server.py"
systemctl --user disable --now sot-turn02-v8.service 2>/dev/null || true
systemctl --user disable --now sot-turn02-v7.service 2>/dev/null || true
pkill -f 'sot-turn02-.*server.py' 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user enable --now sot-turn02-v8-recovery.service
for _ in $(seq 1 60); do curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-v8r-health.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v8r-health.json'))
assert x['ok'] and x['schema']==7 and x['version']=='turn02-pre-base-v8',x
print('PASS backend',x['version'],'schema',x['schema'])
PY
tailscale serve --bg --https=443 http://127.0.0.1:8765 >/dev/null
DNS="$(tailscale status --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
for _ in $(seq 1 40); do curl -fsS "https://$DNS/api/health" >/tmp/sot-v8r-https.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v8r-https.json'))
assert x['ok'] and x['version']=='turn02-pre-base-v8',x
print('PASS HTTPS backend',x['version'])
PY
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v8.html?v=%s&api=https%%3A%%2F%%2F%s\n' "$REF" "$DNS"
