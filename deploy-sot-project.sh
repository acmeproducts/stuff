#!/usr/bin/env bash
# SOT Project Portal release installer
# Release: 0.3.1
# Build: 2026.08.10.1
#
# GOVERNANCE / ARCHITECTURE CONTRACT
# ----------------------------------
# This script installs release files ONLY.
# It MUST NOT create, start, stop, restart, replace, or reconfigure servers.
# It MUST NOT add/remove/change ports.
# It MUST NOT change Tailscale Serve routes.
#
# Existing infrastructure is authoritative:
#   - existing report/static server serves the report tree
#   - existing SOT helper/API already owns 127.0.0.1:8081
#
# If the running Python helper does not automatically reload an overwritten
# file_browser.py, reloading that EXISTING process is an operational action,
# not part of this release installer and not a new architecture decision.
set -euo pipefail

VERSION="0.3.1"
BUILD="2026.08.10.1"
REPO_RAW="https://raw.githubusercontent.com/acmeproducts/stuff/main"
WORKSPACE="${HOME}/.openclaw/workspace"
REPORT_DIR="${WORKSPACE}/https/report/SOT"
PORTAL_DST="${REPORT_DIR}/project.html"
HELPER_DST="${WORKSPACE}/file_browser.py"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

need(){ command -v "$1" >/dev/null 2>&1 || { echo "FAIL: missing command: $1" >&2; exit 1; }; }
need python3
need curl

mkdir -p "$REPORT_DIR"

# Fetch canonical release files directly from GitHub. No local repo clone.
curl -fsSL "${REPO_RAW}/project.html" -o "${TMP}/project.html"
curl -fsSL "${REPO_RAW}/file_browser.py" -o "${TMP}/file_browser.py"

# Refuse mixed/unexpected release files.
grep -q "UI Version: ${VERSION}" "${TMP}/project.html" || { echo "FAIL: project.html version mismatch"; exit 1; }
grep -q "Build: ${BUILD}" "${TMP}/project.html" || { echo "FAIL: project.html build mismatch"; exit 1; }
grep -q "API_VERSION = \"${VERSION}\"" "${TMP}/file_browser.py" || { echo "FAIL: file_browser.py version mismatch"; exit 1; }
grep -q "BUILD_ID = \"${BUILD}\"" "${TMP}/file_browser.py" || { echo "FAIL: file_browser.py build mismatch"; exit 1; }
python3 -m py_compile "${TMP}/file_browser.py"

# Atomic overwrite in the already-established served/runtime locations.
install -m 0644 "${TMP}/project.html" "${PORTAL_DST}.new"
mv -f "${PORTAL_DST}.new" "$PORTAL_DST"

install -m 0644 "${TMP}/file_browser.py" "${HELPER_DST}.new"
mv -f "${HELPER_DST}.new" "$HELPER_DST"
python3 -m py_compile "$HELPER_DST"

echo "SUCCESS"
echo "Version: ${VERSION}"
echo "Build:   ${BUILD}"
echo "Portal:  ${PORTAL_DST}"
echo "Helper:  ${HELPER_DST}"
echo "URL:     https://oc-ref.fell-dojo.ts.net/report/SOT/project.html"
echo
echo "Infrastructure changed: NONE"
echo "Existing servers: unchanged"
echo "Existing port 8081: unchanged"
echo "Tailscale routing: unchanged"
