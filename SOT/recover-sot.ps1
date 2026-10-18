# SOT recovery: stops the restart loop, saves the evidence, reinstalls SOT in safe mode.
# Run in Windows PowerShell:  irm <raw url of this file> | iex
$ErrorActionPreference = 'Continue'
$out = Join-Path ([Environment]::GetFolderPath('Desktop')) 'sot-recovery.txt'
function Log { process { $_ | Out-Host; "$_" | Out-File -FilePath $out -Append -Encoding utf8 } }
function Say($m) { $m | Log }
# scripts go to Ubuntu base64-encoded so Windows never mangles their quotes or pipes
function InUbuntu($who, $script, $shell = 'bash') {
  $b = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($script -replace "`r", '')))
  wsl -u $who -e bash -c "echo $b | base64 -d | $shell"
}
"SOT recovery $(Get-Date)" | Out-File -FilePath $out -Encoding utf8

Say '1/4 Stopping Ubuntu'
wsl --shutdown
Start-Sleep 2

Say '2/4 Holding SOT in safe mode and parking its service (nothing else is touched)'
$park = @'
for d in /home/*; do
  [ -d "$d" ] || continue
  mkdir -p "$d/.sot-turn02"; date +%s > "$d/.sot-turn02/startup.inprogress"; chown --reference="$d" "$d/.sot-turn02" "$d/.sot-turn02/startup.inprogress"
  f="$d/.config/systemd/user/sot-turn02-release-d.service"; [ -f "$f" ] && mv -f "$f" "$d/.sot-service-off"
done
sync
getent passwd 1000 | cut -d: -f1
'@
$user = ((InUbuntu 'root' $park) | Select-Object -Last 1)
if ($user) { $user = $user.Trim() }
if (-not $user) { $user = 'support' }
Say "   Ubuntu user: $user"

Say '3/4 Saving what happened before the crash'
$diag = @'
echo "== SOT startup trace"; tail -n 60 /home/USER/.sot-turn02/startup-trace.log 2>/dev/null
echo "== SOT service, previous boot"; journalctl _UID=$(id -u USER) -b -1 --no-pager -n 120 2>/dev/null | grep -iE "sot|python|error|killed" | tail -n 60
echo "== system warnings, previous boot"; journalctl -b -1 -p warning --no-pager -n 60 2>/dev/null
echo "== memory"; free -h
echo "== target"; cat /home/USER/.sot-turn02/target.json 2>/dev/null; echo
echo "== installed files"; ls -la /home/USER/.sot-turn02/release-d/SOT/ 2>/dev/null
'@ -replace 'USER', $user
InUbuntu 'root' $diag 2>&1 | Log

Say '4/4 Reinstalling SOT (safe mode: it starts no scans on its own)'
$inst = 'export XDG_RUNTIME_DIR=/run/user/$(id -u); curl -fsSL https://raw.githubusercontent.com/acmeproducts/stuff/main/install-SOT-turn02-release-d-autosync.sh | bash'
InUbuntu $user $inst 'bash -l' 2>&1 | Log

Say ''
Say "Done. Everything above is saved in $out - send that file back."
