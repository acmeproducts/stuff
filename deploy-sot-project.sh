#!/usr/bin/env bash
# SOT Project Portal release activation
# Version: 0.3.1
# Build: 2026.08.10.4
# Uses ONLY the already-established report server and 8081 helper.
# Does not create/change ports, services, or Tailscale routes.
set -euo pipefail

VERSION="0.3.1"
BUILD="2026.08.10.4"
RAW="https://raw.githubusercontent.com/acmeproducts/stuff/main"
WORK="$HOME/.openclaw/workspace"
REPORT="$WORK/https/report/SOT"
PORTAL="$REPORT/project.html"
HELPER="$WORK/file_browser.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$REPORT"
curl -fsSL "$RAW/project.html" -o "$TMP/project.html"
curl -fsSL "$RAW/file_browser.py" -o "$TMP/file_browser.py"
grep -q "UI Version: $VERSION" "$TMP/project.html"
grep -q "Build: $BUILD" "$TMP/project.html"
grep -q "API_VERSION = \"$VERSION\"" "$TMP/file_browser.py"
grep -q "BUILD_ID = \"$BUILD\"" "$TMP/file_browser.py"
python3 -m py_compile "$TMP/file_browser.py"

# Existing helper is required; no new helper is ever created.
mapfile -t PIDS < <(pgrep -f 'python3 -m uvicorn file_browser:app --host 127.0.0.1 --port 8081' || true)
if [[ ${#PIDS[@]} -ne 1 ]]; then
  echo "FAIL: expected one existing 8081 helper; found ${#PIDS[@]}"
  exit 1
fi
PID="${PIDS[0]}"
CWD="$(readlink -f "/proc/$PID/cwd")"
mapfile -d '' -t CMD < "/proc/$PID/cmdline"
UNIT="$(sed -n 's#.*\/\([^/]*\.service\).*#\1#p' "/proc/$PID/cgroup" | tail -1 || true)"

cp -a "$PORTAL" "$TMP/old-project.html" 2>/dev/null || true
cp -a "$HELPER" "$TMP/old-file_browser.py" 2>/dev/null || true
install -m 0644 "$TMP/project.html" "$PORTAL.new" && mv -f "$PORTAL.new" "$PORTAL"
install -m 0644 "$TMP/file_browser.py" "$HELPER.new" && mv -f "$HELPER.new" "$HELPER"

if [[ -n "$UNIT" ]] && command -v systemctl >/dev/null 2>&1; then
  systemctl --user restart "$UNIT"
else
  kill "$PID"
  for _ in $(seq 1 20); do kill -0 "$PID" 2>/dev/null || break; sleep .25; done
  cd "$CWD"
  nohup "${CMD[@]}" >"$WORK/file_browser.log" 2>&1 &
fi

OK=0
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 http://127.0.0.1:8081/healthz >/dev/null 2>&1; then OK=1; break; fi
  sleep .5
done
if [[ $OK -ne 1 ]]; then
  echo "FAIL: existing 8081 helper did not reload healthy"
  exit 1
fi

echo "SUCCESS"
echo "SOT $VERSION · $BUILD"
echo "URL: https://oc-ref.fell-dojo.ts.net/report/SOT/project.html"
