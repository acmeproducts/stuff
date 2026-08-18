#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
DB=/home/support/.openclaw/sot/sot.sqlite
API=http://127.0.0.1:18080/api/sot
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo '=== VERIFY Q/R RECOVERY ==='
for d in q r; do
  echo "--- ${d^^}: /mnt/$d"
  findmnt -T "/mnt/$d" -o TARGET,SOURCE,FSTYPE,OPTIONS -n || true
  n=$(find "/mnt/$d" -mindepth 1 -maxdepth 1 -printf . 2>/dev/null | wc -c)
  echo "entries=$n"
  if [[ "$n" -le 0 ]]; then echo "FAIL: ${d^^}: still empty" >&2; exit 1; fi
done

echo '=== INVALIDATE STALE SOT FS CACHE FOR P/Q/R/S ==='
if [[ -f "$DB" ]] && command -v sqlite3 >/dev/null 2>&1; then
  cp -a "$DB" "$DB.before-volume-cache-refresh-$(date +%Y%m%d-%H%M%S)"
  sqlite3 "$DB" "DELETE FROM fs_scope_cache WHERE path IN ('/mnt/p','/mnt/q','/mnt/r','/mnt/s');" || true
else
  echo 'sqlite3/db unavailable; continuing without direct cache invalidation'
fi
sudo systemctl restart openclaw-report-server.service
for i in {1..12}; do sleep 1; curl -fsS "$API/health" >/dev/null 2>&1 && break; done

echo '=== API PROOF Q/R ==='
for d in q r; do
  enc=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "/mnt/$d")
  curl -fsS "$API/fs?path=$enc" -o "$TMP/$d.json"
  python3 - "$TMP/$d.json" "$d" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); d=sys.argv[2].upper()
f=len(x.get('folders',[])); r=len(x.get('files',[]))
print(f'{d}: folders={f} root_files={r} status={x.get("status")}')
if f+r <= 0: raise SystemExit(f'FAIL: API still sees {d}: empty')
PY
done

echo '=== DEEP DISCOVERY P/S ==='
PS=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
if [[ -x "$PS" ]]; then
  "$PS" -NoProfile -Command '$ErrorActionPreference="SilentlyContinue"; "-- Get-PSDrive filesystem --"; Get-PSDrive -PSProvider FileSystem | Format-List Name,Root,DisplayRoot,Description; "-- Logical disks --"; Get-CimInstance Win32_LogicalDisk | Format-List DeviceID,DriveType,VolumeName,ProviderName,FileSystem,Size,FreeSpace; "-- Volumes --"; Get-Volume | Sort-Object DriveLetter | Format-Table DriveLetter,FileSystemLabel,FileSystemType,DriveType,HealthStatus,Size,SizeRemaining -Auto; "-- SUBST --"; cmd /c subst; "-- NET USE --"; cmd /c net use; "-- MOUNTVOL --"; cmd /c mountvol' || true
else
  echo 'PowerShell unavailable from WSL'
fi

echo '=== LINUX BLOCK/MOUNT EVIDENCE ==='
lsblk -o NAME,PATH,FSTYPE,LABEL,UUID,SIZE,MODEL,MOUNTPOINTS || true
echo '-- blkid --'
sudo blkid || true
echo '-- findmnt P/S --'
for d in p s; do
  echo "--- ${d^^}:"
  findmnt -T "/mnt/$d" -o TARGET,SOURCE,FSTYPE,OPTIONS || true
  ls -la "/mnt/$d" | head -20 || true
done

echo '-- candidate history --'
for f in ~/.bash_history /root/.bash_history; do
  [[ -r "$f" ]] || continue
  echo "### $f"
  grep -Ei '(/mnt/[ps]|mount .*[- ]t (drvfs|ntfs|ext4)|mount .* /mnt/[ps]|P:|S:)' "$f" | tail -80 || true
done

echo '-- fstab/systemd --'
grep -RniE '(/mnt/[ps]|[[:space:]]P:|[[:space:]]S:)' /etc/fstab /etc/systemd/system 2>/dev/null || true

echo '=== RESULT ==='
echo 'Q/R are finalized if the API proof above passed.'
echo 'P/S were not modified. Use the evidence above to identify their authoritative source before mounting.'
