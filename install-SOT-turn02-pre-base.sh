#!/usr/bin/env bash
set -Eeuo pipefail
APP="$HOME/.sot-turn02"; mkdir -p "$APP"
curl -fsSL 'https://raw.githubusercontent.com/acmeproducts/stuff/main/SOT/sot-turn02-server.py' -o "$APP/server.py"
python3 -m py_compile "$APP/server.py"
pkill -f "$APP/server.py" 2>/dev/null || true
nohup python3 "$APP/server.py" >"$APP/server.log" 2>&1 & echo $! >"$APP/server.pid"
for i in {1..30}; do curl -fsS http://127.0.0.1:8765/api/health && break || sleep 1; done
echo
echo 'SOT backend installed and running on port 8765.'
echo 'Open the SOT Pages app, set Backend URL to your WSL Tailscale URL/IP on port 8765, then add storage sources.'
