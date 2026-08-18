#!/usr/bin/env bash
set -euo pipefail

LETTERS=(p q r s)
PS=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe

if [[ ! -x "$PS" ]]; then
  echo "FAIL: Windows PowerShell bridge not available at $PS" >&2
  exit 1
fi

echo "=== VERIFY WINDOWS VOLUMES ==="
for d in "${LETTERS[@]}"; do
  L=${d^^}
  if ! "$PS" -NoProfile -Command "if (Test-Path '${L}:\\') { exit 0 } else { exit 2 }" >/dev/null 2>&1; then
    echo "FAIL: Windows does not currently expose ${L}:" >&2
    exit 1
  fi
  echo "${L}: present in Windows"
done

echo
echo "=== REPAIR WSL DRVFS MOUNTS ==="
for d in "${LETTERS[@]}"; do
  L=${d^^}
  p="/mnt/$d"
  echo "--- ${L}: -> $p"

  # If this path resolves to the WSL root filesystem, it is only the directory
  # under /mnt, not the Windows volume. Replace that view with a drvfs mount.
  if findmnt -rn -T "$p" -o TARGET,FSTYPE,SOURCE | grep -Eq "^/ (ext4|xfs|btrfs) "; then
    sudo umount -l "$p" 2>/dev/null || true
  fi

  sudo mkdir -p "$p"

  # Re-establish the Windows drive in WSL. This is idempotent for a healthy drvfs mount.
  if findmnt -rn -T "$p" -o FSTYPE,SOURCE | grep -Eq '^(9p|drvfs) '; then
    echo "already mounted: $(findmnt -rn -T "$p" -o FSTYPE,SOURCE)"
  else
    sudo umount -l "$p" 2>/dev/null || true
    sudo mount -t drvfs "${L}:" "$p"
  fi

  count=$(find "$p" -mindepth 1 -maxdepth 1 -printf . 2>/dev/null | wc -c)
  echo "entries=$count  mount=$(findmnt -rn -T "$p" -o FSTYPE,SOURCE)"
  if [[ "$count" -eq 0 ]]; then
    echo "FAIL: ${L}: mounted but still enumerates zero entries in WSL" >&2
    exit 1
  fi
done

echo
echo "=== RESTART SOT REPORT SERVER ==="
sudo systemctl restart openclaw-report-server.service
for i in {1..12}; do
  sleep 1
  if curl -fsS http://127.0.0.1:18080/api/sot/health >/tmp/sot-health.json 2>/dev/null; then break; fi
done
cat /tmp/sot-health.json

echo
echo "=== VERIFY SOT API VOLUMES ==="
for d in "${LETTERS[@]}"; do
  p="/mnt/$d"
  enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$p")
  curl -fsS "http://127.0.0.1:18080/api/sot/fs?path=$enc&force=1" -o /tmp/sot-root.json
  python3 - /tmp/sot-root.json "$p" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); p=sys.argv[2]
f=len(x.get('folders',[])); r=len(x.get('files',[]))
print(f"{p}: folders={f} root_files={r} status={x.get('status')}")
if f+r == 0:
    raise SystemExit(f"FAIL: SOT API still sees {p} as empty")
PY
done

echo
echo "SUCCESS: P:/Q:/R:/S: are mounted through drvfs and visible to SOT."
