#!/usr/bin/env bash
# SOT Turn 02 pre-base v4.1 installer — HTTPS over Tailscale Serve, preserves sot-v4.db
set -Eeuo pipefail
APP="$HOME/.sot-turn02"; mkdir -p "$APP"
BASE='https://raw.githubusercontent.com/acmeproducts/stuff/main'
SRC="$APP/server-v4-1.py"
curl -fsSL "$BASE/SOT/sot-turn02-pre-base-v4-1-server.py" -o "$SRC"
python3 -m py_compile "$SRC"
command -v tailscale >/dev/null || { echo 'Tailscale CLI is required.' >&2; exit 1; }
pkill -f "$APP/server-v4.py" 2>/dev/null || true
pkill -f "$APP/server-v4-1.py" 2>/dev/null || true
nohup python3 "$SRC" >"$APP/server-v4-1.log" 2>&1 & echo $! >"$APP/server-v4-1.pid"
for i in {1..30}; do curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-health.$$ 2>/dev/null && break; sleep 1; done
OUT="$(cat /tmp/sot-health.$$ 2>/dev/null || true)"; rm -f /tmp/sot-health.$$
case "$OUT" in *'turn02-pre-base-v4.1'*) ;; *) echo 'SOT v4.1 backend failed to become healthy.' >&2; tail -100 "$APP/server-v4-1.log" >&2 || true; exit 1;; esac
# Publish only to this user's tailnet over HTTPS; no public internet exposure.
tailscale serve --bg --https=443 http://127.0.0.1:8765 >/dev/null
DNS="$(tailscale status --json | python3 -c 'import sys,json; print(json.load(sys.stdin).get("Self",{}).get("DNSName","").rstrip("."))')"
[ -n "$DNS" ] || { echo 'Could not determine Tailscale DNS name.' >&2; exit 1; }
API="https://$DNS"
curl -fsS "$API/api/health" >/dev/null || { echo "HTTPS health check failed: $API" >&2; exit 1; }
printf '%s\n' "$OUT"
printf 'SOT HTTPS backend: %s\n' "$API"
printf 'Open: https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v4-1.html?api=%s\n' "$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' "$API")"
