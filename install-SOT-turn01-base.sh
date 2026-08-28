#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Rebuild the installer from the archived pre-patch installer rather than editing
# the failed deployed candidate. The underlying installer still owns runtime
# archive, rollback, accepted-pre-base reconstruction, health, drive and UI gates.
BASE_INSTALLER_URL='https://raw.githubusercontent.com/acmeproducts/stuff/db340dbf6e76a1b55e5d38a0248397b277632f8b/install-SOT-turn01-base.sh'
POWERSHELL_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/81a11d9ec0e79a529e27db80da74511f0b2ce908/patch-SOT-turn01-base-powershell.py'

curl --max-time 30 -fsSL "$BASE_INSTALLER_URL" -o "$TMP/base-installer.sh"
curl --max-time 30 -fsSL "$POWERSHELL_PATCH_URL" -o "$TMP/patch-powershell.py"

python3 - "$TMP/base-installer.sh" "$TMP/patched-installer.sh" "$POWERSHELL_PATCH_URL" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1]).read_text()
patch_url = sys.argv[3]

source = source.replace("EXPECTED_BUILD='2026.08.28.sot-turn01-base-3'", "EXPECTED_BUILD='2026.08.28.sot-turn01-base-4'", 1)
source = source.replace("if(api.BUILD!=='2026.08.28.sot-turn01-base-3')", "if(api.BUILD!=='2026.08.28.sot-turn01-base-4')", 1)
source = source.replace("assert x.get('build')=='2026.08.28.sot-turn01-base-3',x", "assert x.get('build')=='2026.08.28.sot-turn01-base-4',x")

needle = 'python3 "$TMP/integrate-backend.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api.js"\n'
replacement = needle + f'''cp "$TMP/sot-api.js" "$TMP/sot-api-base3.js"\ncurl --max-time 30 -fsSL "{patch_url}" -o "$TMP/patch-powershell.py"\npython3 "$TMP/patch-powershell.py" "$TMP/sot-api-base3.js" "$TMP/sot-api.js"\n'''
if source.count(needle) != 1:
    raise SystemExit('backend integration insertion point changed unexpectedly')
source = source.replace(needle, replacement, 1)

old_gate = '''echo '=== WINDOWS DRIVE DISCOVERY GATE ==='\npowershell.exe -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\\r' > "$TMP/windows-drives.txt"\n'''
new_gate = '''echo '=== WINDOWS DRIVE DISCOVERY GATE ==='\nPOWERSHELL='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'\nif [ ! -x "$POWERSHELL" ]; then\n  echo "PowerShell executable not available at $POWERSHELL"\n  false\nfi\necho "PowerShell: $POWERSHELL"\n"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\\r' > "$TMP/windows-drives.txt"\n'''
if source.count(old_gate) != 1:
    raise SystemExit('PowerShell discovery gate changed unexpectedly')
source = source.replace(old_gate, new_gate, 1)

# Mechanical guards: the generated installer and generated backend must not rely
# on Windows PATH propagation from an interactive WSL login shell.
source = source.replace("grep -q \"windowsDriveLetters\" \"$TMP/sot-api.js\"", "grep -q \"windowsDriveLetters\" \"$TMP/sot-api.js\"\ngrep -q \"/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe\" \"$TMP/sot-api.js\"\nif grep -q \"execFileSync('powershell.exe'\" \"$TMP/sot-api.js\"; then echo 'FAIL: PATH-based PowerShell call remains'; false; fi", 1)

Path(sys.argv[2]).write_text(source)
PY

bash -n "$TMP/patched-installer.sh"
grep -q "EXPECTED_BUILD='2026.08.28.sot-turn01-base-4'" "$TMP/patched-installer.sh"
grep -q "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" "$TMP/patched-installer.sh"

exec bash "$TMP/patched-installer.sh"
