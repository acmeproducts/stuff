#!/usr/bin/env bash
# SOT Project Portal deployment
# Version: 0.3.0
# Build: 2026.08.09.1
#
# Deploys the version-controlled GitHub checkout into the local WSL/OpenClaw
# environment without modifying openclaw.json. Tailscale Serve owns API routing.
set -euo pipefail

VERSION="0.3.0"
BUILD="2026.08.09.1"
REPO_DIR="${1:-$PWD}"
WORKSPACE="${HOME}/.openclaw/workspace"
REPORT_DIR="${HOME}/.openclaw/https/report"
SERVICE_DIR="${HOME}/.config/systemd/user"
API_DST="${WORKSPACE}/sot_project_api.py"
PORTAL_DST="${REPORT_DIR}/project.html"
SERVICE_FILE="${SERVICE_DIR}/sot-project-api.service"

need() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: missing command: $1" >&2; exit 1; }; }
need python3
need curl
need systemctl
need tailscale

python3 - <<'PY'
import fastapi, uvicorn, pydantic
print("Python dependencies OK")
PY

test -f "${REPO_DIR}/project.html" || { echo "ERROR: ${REPO_DIR}/project.html not found" >&2; exit 1; }
test -f "${REPO_DIR}/sot_project_api.py" || { echo "ERROR: ${REPO_DIR}/sot_project_api.py not found" >&2; exit 1; }

mkdir -p "$WORKSPACE" "$REPORT_DIR" "$SERVICE_DIR" "${HOME}/.openclaw/sot-project"

STAMP="$(date +%Y%m%d-%H%M%S)"
[ -f "$PORTAL_DST" ] && cp -a "$PORTAL_DST" "${PORTAL_DST}.before-v${VERSION}-${STAMP}" || true
[ -f "$API_DST" ] && cp -a "$API_DST" "${API_DST}.before-v${VERSION}-${STAMP}" || true

install -m 0644 "${REPO_DIR}/project.html" "$PORTAL_DST"
install -m 0644 "${REPO_DIR}/sot_project_api.py" "$API_DST"
python3 -m py_compile "$API_DST"

cat > "$SERVICE_FILE" <<SERVICE
[Unit]
Description=SOT Project Control API v${VERSION} build ${BUILD}
After=network.target

[Service]
Type=simple
WorkingDirectory=${WORKSPACE}
Environment=SOT_PROJECT_DB=${HOME}/.openclaw/sot-project/projects.sqlite
Environment=SOT_ENGINE_ENABLED=0
ExecStart=/usr/bin/python3 -m uvicorn sot_project_api:app --host 127.0.0.1 --port 8082
Restart=on-failure
RestartSec=2

[Install]
WantedBy=default.target
SERVICE

systemctl --user daemon-reload
systemctl --user enable --now sot-project-api.service
systemctl --user restart sot-project-api.service

for _ in $(seq 1 20); do
  if curl -fsS --max-time 2 http://127.0.0.1:8082/health >/dev/null; then break; fi
  sleep 0.5
done
curl -fsS --max-time 5 http://127.0.0.1:8082/health >/dev/null || {
  echo "ERROR: project API failed health check"
  systemctl --user status sot-project-api.service --no-pager || true
  exit 1
}

# Preserve existing / and /report handlers. Add only the SOT API path handlers.
# /api/fs points at the already-running dynamic file browser.
if curl -fsS --max-time 3 http://127.0.0.1:8081/healthz >/dev/null; then
  tailscale serve --bg --set-path=/api/fs http://127.0.0.1:8081
else
  echo "WARNING: file browser on 127.0.0.1:8081 is not healthy; /api/fs route not changed"
fi

tailscale serve --bg --set-path=/api/projects http://127.0.0.1:8082
tailscale serve --bg --set-path=/api/reports http://127.0.0.1:8082

echo
echo "=== DEPLOYED ==="
echo "Portal version: ${VERSION}"
echo "Portal build:   ${BUILD}"
echo "Portal file:    ${PORTAL_DST}"
echo "Project DB:     ${HOME}/.openclaw/sot-project/projects.sqlite"
echo
echo "=== LOCAL API ==="
curl -fsS http://127.0.0.1:8082/health
echo
echo
echo "=== TAILSCALE SERVE ==="
tailscale serve status
echo
echo "Open /report/project.html and verify the visible UI/API version indicators."
