#!/usr/bin/env bash
# SOT Turn 02 pre-base v4 installer — preserves all predecessor databases
set -Eeuo pipefail
APP="$HOME/.sot-turn02"
mkdir -p "$APP"
BASE='https://raw.githubusercontent.com/acmeproducts/stuff/main'
SRC="$APP/server-v4.py"
curl -fsSL "$BASE/SOT/sot-turn02-pre-base-v4-server.py" -o "$SRC"
python3 -m py_compile "$SRC"
# Never delete/migrate/rename historical SOT databases. v4 owns sot-v4.db only.
pkill -f "$APP/server.py" 2>/dev/null || true
pkill -f "$APP/server-v4.py" 2>/dev/null || true
nohup python3 "$SRC" >"$APP/server-v4.log" 2>&1 & echo $! >"$APP/server-v4.pid"
for i in {1..30}; do
  if OUT="$(curl -fsS http://127.0.0.1:8765/api/health 2>/dev/null)"; then
    printf '%s\n' "$OUT"
    case "$OUT" in *'"version": "turn02-pre-base-v4"'*|*'"version":"turn02-pre-base-v4"'*) exit 0;; esac
    echo 'Unexpected SOT backend version on port 8765.' >&2
    exit 1
  fi
  sleep 1
done
echo 'SOT v4 backend failed to become healthy.' >&2
tail -100 "$APP/server-v4.log" >&2 || true
exit 1
