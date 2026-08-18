#!/usr/bin/env bash
set -euo pipefail

echo '=== IDENTIFY P/S AUTHORITATIVE WINDOWS VOLUMES ==='
PS='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'

if [[ ! -x "$PS" ]]; then
  echo 'FAIL: PowerShell bridge unavailable' >&2
  exit 1
fi

WIN_TMP='C:\\Windows\\Temp\\sot-ps-identify.ps1'
WSL_TMP='/mnt/c/Windows/Temp/sot-ps-identify.ps1'
cat > "$WSL_TMP" <<'PS1'
$ErrorActionPreference='SilentlyContinue'
Write-Output '--- MountedDevices P/S registry values ---'
$key='Registry::HKEY_LOCAL_MACHINE\SYSTEM\MountedDevices'
$item=Get-Item $key
foreach($name in '\DosDevices\P:','\DosDevices\S:'){
  try {
    $v=$item.GetValue($name,$null,'DoNotExpandEnvironmentNames')
    if($null -eq $v){ Write-Output "$name = <missing>" }
    elseif($v -is [byte[]]){ Write-Output ("{0} = {1}" -f $name, (($v|ForEach-Object {$_.ToString('X2')}) -join '')) }
    else { Write-Output ("{0} = {1}" -f $name,$v) }
  } catch { Write-Output "$name = <error>" }
}

Write-Output '--- MountedDevices Volume GUID registry values ---'
foreach($pn in $item.GetValueNames() | Where-Object {$_ -like '\??\Volume*'}){
  $v=$item.GetValue($pn,$null,'DoNotExpandEnvironmentNames')
  if($v -is [byte[]]){
    $hex=(($v|ForEach-Object {$_.ToString('X2')}) -join '')
    Write-Output ("{0} = {1}" -f $pn,$hex)
  }
}

Write-Output '--- Win32_Volume ---'
Get-CimInstance Win32_Volume | Sort-Object DeviceID | Select-Object DeviceID,DriveLetter,Label,FileSystem,Capacity,FreeSpace | Format-List

Write-Output '--- Get-Partition / Get-Disk ---'
Get-Disk | ForEach-Object {
  $d=$_
  Get-Partition -DiskNumber $d.Number | ForEach-Object {
    [pscustomobject]@{
      DiskNumber=$d.Number; FriendlyName=$d.FriendlyName; SerialNumber=$d.SerialNumber;
      BusType=$d.BusType; DiskSize=$d.Size; PartitionNumber=$_.PartitionNumber;
      DriveLetter=$_.DriveLetter; PartitionSize=$_.Size; Type=$_.Type; Guid=$_.Guid
    }
  }
} | Format-Table -AutoSize
PS1

"$PS" -NoProfile -ExecutionPolicy Bypass -File "$WIN_TMP" 2>/dev/null | tr -d '\r'
rm -f "$WSL_TMP"

echo
echo '=== LINUX BLOCK / USB VIEW ==='
lsblk -o NAME,TYPE,SIZE,FSTYPE,LABEL,UUID,MOUNTPOINTS,MODEL,SERIAL,TRAN 2>/dev/null || true

echo
echo '=== BY-ID / BY-UUID ==='
find -L /dev/disk/by-id -maxdepth 1 -type l -printf '%f -> %l\n' 2>/dev/null | sort || true
find -L /dev/disk/by-uuid -maxdepth 1 -type l -printf '%f -> %l\n' 2>/dev/null | sort || true

echo
echo '=== CURRENT P/S TARGETS ==='
for d in p s; do
  echo "--- /mnt/$d"
  findmnt -T "/mnt/$d" -o TARGET,SOURCE,FSTYPE,OPTIONS || true
  ls -la "/mnt/$d" | head -20 || true
done

echo
echo '=== END IDENTIFY ==='
