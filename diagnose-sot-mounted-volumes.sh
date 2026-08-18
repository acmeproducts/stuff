#!/usr/bin/env bash
set -euo pipefail
SVC=openclaw-report-server.service
PID="$(systemctl show -p MainPID --value "$SVC")"
[[ "$PID" =~ ^[0-9]+$ ]] && [[ "$PID" -gt 1 ]] || { echo 'No service PID' >&2; exit 1; }

echo '=== SERVICE ==='
echo "PID=$PID"
systemctl is-active "$SVC"

echo '=== SHELL MOUNTS P/Q/R/S ==='
for d in p q r s; do
  echo "--- /mnt/$d"
  findmnt -T "/mnt/$d" -o TARGET,SOURCE,FSTYPE,OPTIONS -n 2>&1 || true
  printf 'shell entries='; find "/mnt/$d" -mindepth 1 -maxdepth 1 -printf . 2>/dev/null | wc -c
  ls -la "/mnt/$d" 2>&1 | sed -n '1,12p'
done

echo '=== SERVICE MOUNT NAMESPACE P/Q/R/S ==='
for d in p q r s; do
  echo "--- /mnt/$d"
  sudo nsenter -t "$PID" -m -- findmnt -T "/mnt/$d" -o TARGET,SOURCE,FSTYPE,OPTIONS -n 2>&1 || true
  printf 'service entries='; sudo nsenter -t "$PID" -m -- sh -lc "find /mnt/$d -mindepth 1 -maxdepth 1 -printf . 2>/dev/null | wc -c" || true
  sudo nsenter -t "$PID" -m -- ls -la "/mnt/$d" 2>&1 | sed -n '1,12p' || true
done

echo '=== API ==='
for d in p q r s; do
  printf '/mnt/%s -> ' "$d"
  curl -fsS "http://127.0.0.1:18080/api/sot/fs?path=%2Fmnt%2F$d" || true
  echo
done
