#!/usr/bin/env bash
# SOT Turn 02 clean pre-base installer v3
set -Eeuo pipefail
APP="$HOME/.sot-turn02"; mkdir -p "$APP"
BASE='https://raw.githubusercontent.com/acmeproducts/stuff/main'
curl -fsSL "$BASE/SOT/sot-turn02-clean-server.py" -o "$APP/server.py"
python3 -m py_compile "$APP/server.py"
pkill -f "$APP/server.py" 2>/dev/null || true
nohup python3 "$APP/server.py" >"$APP/server.log" 2>&1 & echo $! >"$APP/server.pid"
for i in {1..30}; do if OUT="$(curl -fsS http://127.0.0.1:8765/api/health 2>/dev/null)"; then echo "$OUT"; exit 0; fi; sleep 1; done
echo 'SOT backend failed to become healthy.' >&2
tail -100 "$APP/server.log" >&2 || true
exit 1
