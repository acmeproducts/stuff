#!/usr/bin/env bash
# SOT Project Portal deployment
# Version: 0.3.1
# Build: 2026.08.10.1
# Architecture: ONE SOT helper process on 127.0.0.1:8081
set -euo pipefail

VERSION="0.3.1"
BUILD="2026.08.10.1"
REPO_RAW="https://raw.githubusercontent.com/acmeproducts/stuff/main"
WORKSPACE="${HOME}/.openclaw/workspace"
REPORT_DIR="${WORKSPACE}/https/report/SOT"
PORTAL_DST="${REPORT_DIR}/project.html"
HELPER_DST="${WORKSPACE}/file_browser.py"
STATE_DIR="${HOME}/.openclaw/sot-project"
ROLLBACK_DIR="${STATE_DIR}/rollback-v0.3.0"
LOG="${WORKSPACE}/file_browser.log"
PUBLIC_BASE="https://oc-ref.fell-dojo.ts.net"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

need(){ command -v "$1" >/dev/null 2>&1 || { echo "FAIL: missing command: $1" >&2; exit 1; }; }
need python3
need curl
need tailscale
need pgrep

python3 - <<'PY'
import fastapi, uvicorn, pydantic
print("Python dependencies OK")
PY

mkdir -p "$WORKSPACE" "$REPORT_DIR" "$STATE_DIR" "$ROLLBACK_DIR"

# Fetch the exact current GitHub candidates. No local repository clone is required.
curl -fsSL "${REPO_RAW}/project.html" -o "${TMP}/project.html"
curl -fsSL "${REPO_RAW}/file_browser.py" -o "${TMP}/file_browser.py"

# Refuse to deploy mixed or unexpected versions.
grep -q "UI Version: ${VERSION}" "${TMP}/project.html" || { echo "FAIL: project.html version mismatch"; exit 1; }
grep -q "Build: ${BUILD}" "${TMP}/project.html" || { echo "FAIL: project.html build mismatch"; exit 1; }
grep -q "API_VERSION = \"${VERSION}\"" "${TMP}/file_browser.py" || { echo "FAIL: file_browser.py version mismatch"; exit 1; }
grep -q "BUILD_ID = \"${BUILD}\"" "${TMP}/file_browser.py" || { echo "FAIL: file_browser.py build mismatch"; exit 1; }
python3 -m py_compile "${TMP}/file_browser.py"

# Keep one explicit rollback floor outside the served report tree.
if [[ -f "$PORTAL_DST" && ! -f "$ROLLBACK_DIR/project.html" ]]; then
  cp -a "$PORTAL_DST" "$ROLLBACK_DIR/project.html"
fi
if [[ -f "$HELPER_DST" && ! -f "$ROLLBACK_DIR/file_browser.py" ]]; then
  cp -a "$HELPER_DST" "$ROLLBACK_DIR/file_browser.py"
fi

install -m 0644 "${TMP}/project.html" "$PORTAL_DST"
install -m 0644 "${TMP}/file_browser.py" "$HELPER_DST"
python3 -m py_compile "$HELPER_DST"

# Restart only the already-established 8081 helper process pattern.
echo "=== RESTART SOT HELPER :8081 ==="
PIDS="$(pgrep -f 'python3 -m uvicorn file_browser:app --host 127.0.0.1 --port 8081' || true)"
if [[ -n "$PIDS" ]]; then
  echo "Stopping helper PID(s): $PIDS"
  for PID in $PIDS; do kill "$PID" 2>/dev/null || true; done
  sleep 2
fi
cd "$WORKSPACE"
nohup python3 -m uvicorn file_browser:app --host 127.0.0.1 --port 8081 >"$LOG" 2>&1 &
NEWPID=$!
echo "Started helper PID: $NEWPID"

for _ in $(seq 1 30); do
  curl -fsS --max-time 2 http://127.0.0.1:8081/healthz >/dev/null 2>&1 && break
  sleep 0.5
done
curl -fsS --max-time 5 http://127.0.0.1:8081/healthz >/dev/null || {
  echo "FAIL: helper did not become healthy"
  tail -80 "$LOG" || true
  exit 1
}

# ONE public API mount. The helper intentionally accepts both /api/* and
# stripped /fs,/projects,/reports paths, so either proxy path behavior is safe.
if tailscale serve status >/dev/null 2>&1; then
  ts(){ tailscale "$@"; }
else
  ts(){ sudo tailscale "$@"; }
fi

# Remove only obsolete SOT child mounts if they exist. Never reset Serve.
ts serve --set-path=/api/fs off >/dev/null 2>&1 || true
ts serve --set-path=/api/projects off >/dev/null 2>&1 || true
ts serve --set-path=/api/reports off >/dev/null 2>&1 || true
ts serve --bg --set-path=/api http://127.0.0.1:8081

# Remove the abandoned 8082 unit only if it exists; do not touch unrelated services.
if systemctl --user list-unit-files 2>/dev/null | grep -q '^sot-project-api.service'; then
  systemctl --user disable --now sot-project-api.service >/dev/null 2>&1 || true
  rm -f "${HOME}/.config/systemd/user/sot-project-api.service"
  systemctl --user daemon-reload || true
fi

# Local proof.
echo "=== LOCAL ==="
curl -fsS http://127.0.0.1:8081/healthz; echo
curl -fsS 'http://127.0.0.1:8081/api/fs?path=/'; echo
curl -fsS http://127.0.0.1:8081/api/projects/health; echo
curl -fsS http://127.0.0.1:8081/api/projects; echo
curl -fsS http://127.0.0.1:8081/api/reports/aggregate; echo

# Public proof through the actual Tailscale route.
echo "=== PUBLIC ==="
curl -fsS "${PUBLIC_BASE}/api/health"; echo
curl -fsS "${PUBLIC_BASE}/api/fs?path=/"; echo
curl -fsS "${PUBLIC_BASE}/api/projects/health"; echo
curl -fsS "${PUBLIC_BASE}/api/projects"; echo
curl -fsS "${PUBLIC_BASE}/api/reports/aggregate"; echo

# Deployed artifact/version proof.
echo "=== PORTAL ==="
grep -m1 -A3 'SOT Project Portal' "$PORTAL_DST"
curl -fsS "${PUBLIC_BASE}/report/SOT/project.html" | grep -E -m4 'UI Version|Build:|APP_VERSION|BUILD_ID'

echo "=== PORTS ==="
ss -ltnp | grep -E ':(8081|8082|18080|18789)\b' || true

echo "=== SERVE ==="
ts serve status

echo "SUCCESS"
echo "Version: ${VERSION}"
echo "Build:   ${BUILD}"
echo "URL: ${PUBLIC_BASE}/report/SOT/project.html"
