#!/usr/bin/env bash
# SOT Project Portal deployment
# Version: 0.3.0
# Build: 2026.08.09.1
# Architecture: ONE SOT helper process on 127.0.0.1:8081
#
# This deploys project.html plus the unified file_browser.py helper.
# It does NOT create another HTTP service, daemon, or port.
# Existing OpenClaw and report-server routes are preserved.
set -euo pipefail

VERSION="0.3.0"
BUILD="2026.08.09.1"
REPO_DIR="${1:-$PWD}"
WORKSPACE="${HOME}/.openclaw/workspace"
REPORT_DIR="${HOME}/.openclaw/https/report"
HELPER_DST="${WORKSPACE}/file_browser.py"
PORTAL_DST="${REPORT_DIR}/project.html"
LOG="${WORKSPACE}/file_browser.log"

need() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: missing command: $1" >&2; exit 1; }; }
need python3
need curl
need tailscale
need pgrep

python3 - <<'PY'
import fastapi, uvicorn, pydantic
print("Python dependencies OK")
PY

test -f "${REPO_DIR}/project.html" || { echo "ERROR: ${REPO_DIR}/project.html not found" >&2; exit 1; }
test -f "${REPO_DIR}/file_browser.py" || { echo "ERROR: ${REPO_DIR}/file_browser.py not found" >&2; exit 1; }

mkdir -p "$WORKSPACE" "$REPORT_DIR" "${HOME}/.openclaw/sot-project"
STAMP="$(date +%Y%m%d-%H%M%S)"

[ -f "$PORTAL_DST" ] && cp -a "$PORTAL_DST" "${PORTAL_DST}.before-v${VERSION}-${STAMP}" || true
[ -f "$HELPER_DST" ] && cp -a "$HELPER_DST" "${HELPER_DST}.before-v${VERSION}-${STAMP}" || true

install -m 0644 "${REPO_DIR}/project.html" "$PORTAL_DST"
install -m 0644 "${REPO_DIR}/file_browser.py" "$HELPER_DST"
python3 -m py_compile "$HELPER_DST"

echo
echo "=== RESTART EXISTING SOT HELPER ON 8081 ==="
PIDS="$(pgrep -f 'python3 -m uvicorn file_browser:app --host 127.0.0.1 --port 8081' || true)"
if [ -n "$PIDS" ]; then
  echo "Stopping existing helper PID(s): $PIDS"
  for PID in $PIDS; do kill "$PID" 2>/dev/null || true; done
  sleep 2
else
  echo "No matching helper process was running."
fi

cd "$WORKSPACE"
nohup python3 -m uvicorn file_browser:app \
  --host 127.0.0.1 \
  --port 8081 \
  >"$LOG" 2>&1 &
NEWPID=$!
echo "Started helper PID: $NEWPID"

for _ in $(seq 1 20); do
  curl -fsS --max-time 2 http://127.0.0.1:8081/healthz >/dev/null 2>&1 && break
  sleep 0.5
done

curl -fsS --max-time 5 http://127.0.0.1:8081/healthz >/dev/null || {
  echo "ERROR: unified helper failed health check"
  tail -60 "$LOG" || true
  exit 1
}

echo
echo "=== TAILSCALE ROUTING ==="
# Preserve / and /report. Point all SOT API surfaces to the SAME existing helper.
tailscale serve --bg --set-path=/api/fs       http://127.0.0.1:8081
tailscale serve --bg --set-path=/api/projects http://127.0.0.1:8081
tailscale serve --bg --set-path=/api/reports  http://127.0.0.1:8081

# Clean up the abandoned standalone 8082 design if it was ever deployed.
if systemctl --user list-unit-files 2>/dev/null | grep -q '^sot-project-api.service'; then
  systemctl --user disable --now sot-project-api.service >/dev/null 2>&1 || true
  rm -f "${HOME}/.config/systemd/user/sot-project-api.service"
  systemctl --user daemon-reload || true
fi

echo
echo "=== LOCAL HEALTH ==="
curl -fsS http://127.0.0.1:8081/healthz
echo

echo
echo "=== LOCAL PROJECT API ==="
curl -fsS http://127.0.0.1:8081/api/projects/health
echo

echo
echo "=== DEPLOYED ==="
echo "Portal version: ${VERSION}"
echo "Portal build:   ${BUILD}"
echo "Portal file:    ${PORTAL_DST}"
echo "Helper file:    ${HELPER_DST}"
echo "Helper port:    8081"
echo "Project DB:     ${HOME}/.openclaw/sot-project/projects.sqlite"
echo "Extra API port: NONE"
echo
echo "=== TAILSCALE SERVE ==="
tailscale serve status

echo
echo "Open /report/project.html"
echo "Verify the visible UI version and Settings → API version/build."
