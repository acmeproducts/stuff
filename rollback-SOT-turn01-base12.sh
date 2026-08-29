#!/usr/bin/env bash
set -euo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
SERVICE=openclaw-report-server.service
ARCHIVE="$(find "$ARCHIVE_ROOT" -maxdepth 1 -type d -name '*-turn01-accepted-before-base12' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)"
[ -n "$ARCHIVE" ] || { echo 'No accepted-before-base12 archive found'; exit 1; }
[ -f "$ARCHIVE/sot-api.js" ] || { echo "Archive missing sot-api.js: $ARCHIVE"; exit 1; }
echo "Restoring accepted state from: $ARCHIVE"
sudo systemctl stop "$SERVICE"
install -m 0644 "$ARCHIVE/sot-api.js" "$REPORT_ROOT/sot-api.js"
if [ -f "$ARCHIVE/SOT-turn01-base.html" ]; then
  install -m 0644 "$ARCHIVE/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
else
  rm -f "$SOT_DIR/SOT-turn01-base.html"
fi
sudo systemctl start "$SERVICE"
for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o /tmp/sot-rollback-health.json; then break; fi
  sleep 1
done
cat /tmp/sot-rollback-health.json; echo
echo 'BASE-12 ROLLBACK COMPLETE'
