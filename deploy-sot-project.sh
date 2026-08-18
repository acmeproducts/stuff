#!/usr/bin/env bash
# SOT UI release-file installer. Existing report-server topology only.
set -euo pipefail
RAW="https://raw.githubusercontent.com/acmeproducts/stuff/main"
WORK="$HOME/.openclaw/workspace"
REPORT="$WORK/https/report/SOT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$REPORT"
curl -fsSL "$RAW/project.html" -o "$TMP/project.html"
grep -q "2026.08.18.6.4-rebuild" "$TMP/project.html"
install -m 0644 "$TMP/project.html" "$REPORT/project.html.new"
mv -f "$REPORT/project.html.new" "$REPORT/project.html"
printf '%s\n' "SUCCESS: installed project.html only" "No service, port, proxy, Tailscale, or server restart performed."
