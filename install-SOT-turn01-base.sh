#!/usr/bin/env bash
set -Eeuo pipefail

# Canonical SOT Turn 01 Base qualifier launcher.
# Mechanical iteration: preserve the exact qualified product candidate lineage
# while replacing only the Windows browser-profile cleanup implementation that
# failed the 2026-09-02 host harness self-test before cutover.

SOURCE_COMMIT='0ac5325d70d3597746207e6998df84b165b8ed52'
SOURCE_BLOB_SHA1='0f78d2c5d945139f7197221ab0e99fe8252b6ddd'
RAW_URL="https://raw.githubusercontent.com/acmeproducts/stuff/$SOURCE_COMMIT/install-SOT-turn01-base.sh"
TMP="$(mktemp -d -t sot-base-launcher.XXXXXXXX)"
SOURCE="$TMP/source.sh"
PATCHED="$TMP/qualifier.sh"

cleanup_launcher(){ rm -rf "$TMP"; }
trap cleanup_launcher EXIT HUP INT TERM

for tool in bash curl python3 sha1sum wc; do
  command -v "$tool" >/dev/null 2>&1 || { echo "missing required tool: $tool" >&2; exit 1; }
done

curl --max-time 30 -fsSL "$RAW_URL" -o "$SOURCE"
ACTUAL_BLOB="$({ printf 'blob %s\0' "$(wc -c < "$SOURCE")"; cat "$SOURCE"; } | sha1sum | awk '{print $1}')"
[ "$ACTUAL_BLOB" = "$SOURCE_BLOB_SHA1" ] || {
  echo "source installer identity mismatch expected=$SOURCE_BLOB_SHA1 actual=$ACTUAL_BLOB" >&2
  exit 1
}

python3 - "$SOURCE" "$PATCHED" <<'PY'
from pathlib import Path
import re,sys
src=Path(sys.argv[1]).read_text()
new=r'''remove_windows_profile(){
  local profile
  profile="$1"
  [ -n "$profile" ] || return 0
  printf '%s' "$profile" | "$POWERSHELL" -NoProfile -NonInteractive -Command '
    $p=[Console]::In.ReadToEnd()
    if([string]::IsNullOrWhiteSpace($p)){exit 2}
    function Get-ProfileBrowserProcess {
      @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
        Where-Object {
          $_.Name -match "^(msedge|chrome)(\\.exe)?$" -and
          $_.CommandLine -and
          $_.CommandLine.IndexOf($p,[StringComparison]::OrdinalIgnoreCase) -ge 0
        })
    }
    $taskkill=Join-Path $env:SystemRoot "System32\\taskkill.exe"
    if(!(Test-Path -LiteralPath $taskkill)){Write-Error "taskkill.exe not found";exit 5}
    for($i=0;$i -lt 40;$i++){
      $procs=@(Get-ProfileBrowserProcess)
      if($procs.Count -eq 0){break}
      foreach($proc in $procs){
        & $taskkill /PID ([string]$proc.ProcessId) /T /F 2>$null | Out-Null
      }
      Start-Sleep -Milliseconds 250
    }
    $remaining=@(Get-ProfileBrowserProcess)
    if($remaining.Count -gt 0){
      $ids=($remaining|ForEach-Object{$_.ProcessId}) -join ","
      Write-Error "browser profile process tree remained: $ids"
      exit 4
    }
    for($i=0;$i -lt 60 -and (Test-Path -LiteralPath $p);$i++){
      try{Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction Stop}catch{}
      if(Test-Path -LiteralPath $p){Start-Sleep -Milliseconds 250}
    }
    if(Test-Path -LiteralPath $p){Write-Error "browser profile cleanup failed: $p";exit 3}
  '
}
'''
pattern=r'(?ms)^remove_windows_profile\(\)\{.*?^\}\n\n(?=cleanup\(\)\{)'
patched,n=re.subn(pattern,new+'\n',src,count=1)
if n!=1:
    raise SystemExit(f'cleanup replacement count={n}')
if 'taskkill.exe' not in patched or 'Get-ProfileBrowserProcess' not in patched:
    raise SystemExit('patched cleanup contract missing')
if 'Get-ProfileProcess {' in patched:
    raise SystemExit('obsolete cleanup matcher retained')
Path(sys.argv[2]).write_text(patched)
PY

bash -n "$PATCHED"
python3 - "$PATCHED" <<'PY'
from pathlib import Path
import re,sys
s=Path(sys.argv[1]).read_text()
required=[
  'set -Eeuo pipefail',
  'taskkill.exe',
  'Get-ProfileBrowserProcess',
  '/T /F',
  'Join-Path $env:TEMP',
  'JS_BROWSER_HARNESS_SELFTEST',
  'JS_GENERATED_PER_SCRIPT_PARSE',
  'JS_GENERATED_COMBINED_PARSE',
  'JS_PUBLIC_BROWSER_BOOT',
  'PUBLIC_ARTIFACT_IDENTITY',
  '=== TURN 01 BASE MECHANICALLY QUALIFIED ===',
]
for marker in required:
    if marker not in s:
        raise SystemExit('patched canonical qualifier missing '+marker)
if re.search(r'(?m)^[ \t]*async[ \t]*(?:;)?[ \t]*$',s):
    raise SystemExit('standalone async hazard in qualifier source')
PY

echo '=== TURN 01 CANONICAL BASE QUALIFIER — BROWSER CLEANUP R2 ==='
exec bash "$PATCHED"
