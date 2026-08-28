#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Rebuild from the archived Base-3 installer source. Base-4 is failed evidence,
# not a build input. Apply the PowerShell-path and drvfs-mount corrections as
# explicit, mechanically checked deltas.
BASE_INSTALLER_URL='https://raw.githubusercontent.com/acmeproducts/stuff/db340dbf6e76a1b55e5d38a0248397b277632f8b/install-SOT-turn01-base.sh'
POWERSHELL_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/81a11d9ec0e79a529e27db80da74511f0b2ce908/patch-SOT-turn01-base-powershell.py'
DRVFS_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/a8cb8b109a2500821825aa854841b7057e3937b2/patch-SOT-turn01-base-drvfs.py'

curl --max-time 30 -fsSL "$BASE_INSTALLER_URL" -o "$TMP/base-installer.sh"
curl --max-time 30 -fsSL "$POWERSHELL_PATCH_URL" -o "$TMP/patch-powershell.py"
curl --max-time 30 -fsSL "$DRVFS_PATCH_URL" -o "$TMP/patch-drvfs.py"

python3 - "$TMP/base-installer.sh" "$TMP/patched-installer.sh" "$POWERSHELL_PATCH_URL" "$DRVFS_PATCH_URL" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1]).read_text()
powershell_patch_url = sys.argv[3]
drvfs_patch_url = sys.argv[4]

source = source.replace("EXPECTED_BUILD='2026.08.28.sot-turn01-base-3'", "EXPECTED_BUILD='2026.08.28.sot-turn01-base-5'", 1)
source = source.replace("if(api.BUILD!=='2026.08.28.sot-turn01-base-3')", "if(api.BUILD!=='2026.08.28.sot-turn01-base-5')", 1)
source = source.replace("assert x.get('build')=='2026.08.28.sot-turn01-base-3',x", "assert x.get('build')=='2026.08.28.sot-turn01-base-5',x")

needle = 'python3 "$TMP/integrate-backend.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api.js"\n'
replacement = needle + f'''cp "$TMP/sot-api.js" "$TMP/sot-api-base3.js"\ncurl --max-time 30 -fsSL "{powershell_patch_url}" -o "$TMP/patch-powershell.py"\npython3 "$TMP/patch-powershell.py" "$TMP/sot-api-base3.js" "$TMP/sot-api-base4.js"\ncurl --max-time 30 -fsSL "{drvfs_patch_url}" -o "$TMP/patch-drvfs.py"\npython3 "$TMP/patch-drvfs.py" "$TMP/sot-api-base4.js" "$TMP/sot-api.js"\n'''
if source.count(needle) != 1:
    raise SystemExit('backend integration insertion point changed unexpectedly')
source = source.replace(needle, replacement, 1)

# The service and installer must use the absolute Windows PowerShell path; a
# systemd/non-login environment is not allowed to depend on WSL PATH interop.
old_gate = '''echo '=== WINDOWS DRIVE DISCOVERY GATE ==='\npowershell.exe -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\\r' > "$TMP/windows-drives.txt"\n'''
new_gate = '''echo '=== WINDOWS DRIVE DISCOVERY GATE ==='\nPOWERSHELL='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'\nif [ ! -x "$POWERSHELL" ]; then\n  echo "PowerShell executable not available at $POWERSHELL"\n  false\nfi\necho "PowerShell: $POWERSHELL"\n"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\\r' > "$TMP/windows-drives.txt"\n'''
if source.count(old_gate) != 1:
    raise SystemExit('PowerShell discovery gate changed unexpectedly')
source = source.replace(old_gate, new_gate, 1)

# Fix the privileged lazy-mount helper. A placeholder directory, root ext4
# filesystem, or stale non-drvfs mount must never be mistaken for the Windows
# drive. If the mountpoint is occupied by the wrong filesystem, clear it first.
old_helper = '''mkdir -p "$ROOT"\nif [ "$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)" = "$ROOT" ]; then\n  exit 0\nfi\nmount -t drvfs "${LETTER}:" "$ROOT"\nif [ "$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)" != "$ROOT" ]; then\n  echo "failed to mount ${LETTER}: at $ROOT" >&2\n  exit 1\nfi\n'''
new_helper = '''mkdir -p "$ROOT"\nTARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"\nFSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"\nSOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"\nif [ "$TARGET" = "$ROOT" ] && [ "$FSTYPE" = "drvfs" ] && [ "${SOURCE^^}" = "${LETTER}:" ]; then\n  exit 0\nfi\nif mountpoint -q "$ROOT"; then\n  umount "$ROOT"\nfi\nmount -t drvfs "${LETTER}:" "$ROOT"\nTARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"\nFSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"\nSOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"\nif [ "$TARGET" != "$ROOT" ] || [ "$FSTYPE" != "drvfs" ] || [ "${SOURCE^^}" != "${LETTER}:" ]; then\n  echo "failed to establish real drvfs mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2\n  exit 1\nfi\n'''
if source.count(old_helper) != 1:
    raise SystemExit('mount helper block changed unexpectedly')
source = source.replace(old_helper, new_helper, 1)

# Mechanical guards for the generated backend.
source = source.replace(
    'grep -q "windowsDriveLetters" "$TMP/sot-api.js"',
    'grep -q "windowsDriveLetters" "$TMP/sot-api.js"\ngrep -q "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" "$TMP/sot-api.js"\ngrep -q "fstype !== \'drvfs\'" "$TMP/sot-api.js"\nif grep -q "execFileSync(\'powershell.exe\'" "$TMP/sot-api.js"; then echo \'FAIL: PATH-based PowerShell call remains\'; false; fi',
    1
)

# Preserve an HTTP error body on drive browse failure so the next gate cannot
# collapse into an opaque curl 404.
old_curl = 'curl --max-time 20 -fsSG --data-urlencode "path=$VOL_PATH" http://127.0.0.1:18080/api/sot/turn01/fs -o "$TMP/$DRIVE-folders.json"'
new_curl = '''HTTP_CODE="$(curl --max-time 20 -sSG --data-urlencode "path=$VOL_PATH" -o "$TMP/$DRIVE-folders.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs)"\n    if [ "$HTTP_CODE" != "200" ]; then\n      echo "browse HTTP $HTTP_CODE for $DRIVE:"\n      cat "$TMP/$DRIVE-folders.json" || true\n      echo\n      false\n    fi'''
if source.count(old_curl) != 1:
    raise SystemExit('D/F/Q browse curl gate changed unexpectedly')
source = source.replace(old_curl, new_curl, 1)

Path(sys.argv[2]).write_text(source)
PY

bash -n "$TMP/patched-installer.sh"
grep -q "EXPECTED_BUILD='2026.08.28.sot-turn01-base-5'" "$TMP/patched-installer.sh"
grep -q "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" "$TMP/patched-installer.sh"
grep -q 'FSTYPE.*drvfs' "$TMP/patched-installer.sh"
grep -q 'browse HTTP' "$TMP/patched-installer.sh"

exec bash "$TMP/patched-installer.sh"
