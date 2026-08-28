#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# DIRECT BASE-7 REBUILD
# Source is the frozen Base-3 installer, which itself rebuilds from accepted
# pre-base. Rejected Base-4/5/6/7 candidates are not used as runtime baselines.
BASE3_INSTALLER_URL='https://raw.githubusercontent.com/acmeproducts/stuff/db340dbf6e76a1b55e5d38a0248397b277632f8b/install-SOT-turn01-base.sh'
POWERSHELL_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/81a11d9ec0e79a529e27db80da74511f0b2ce908/patch-SOT-turn01-base-powershell.py'
DRVFS_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/a8cb8b109a2500821825aa854841b7057e3937b2/patch-SOT-turn01-base-drvfs.py'
WSL9P_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/f60d33eb5f1deaa250637a9e35f59a516ce73d96/patch-SOT-turn01-base-wsl9p.py'
VOLUME_UNION_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/edfa82ecdcf436b0b46567903890b98036915b1d/patch-SOT-turn01-base-volume-union.py'
IDLE_REFRESH_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/94d5ecdd4d71bd5f9ea58b7dbade952093f548f9/patch-SOT-turn01-base-idle-refresh.py'

curl --max-time 30 -fsSL "$BASE3_INSTALLER_URL" -o "$TMP/base3-installer.sh"

python3 - "$TMP/base3-installer.sh" "$TMP/base7-installer.sh" \
  "$POWERSHELL_PATCH_URL" "$DRVFS_PATCH_URL" "$WSL9P_PATCH_URL" \
  "$VOLUME_UNION_PATCH_URL" "$IDLE_REFRESH_PATCH_URL" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text()
powershell_url, drvfs_url, wsl9p_url, volume_url, idle_url = sys.argv[3:8]

def once(old, new, label):
    global src
    n = src.count(old)
    if n != 1:
        raise SystemExit(f'{label} changed unexpectedly: found {n}')
    src = src.replace(old, new, 1)

# Final build identity. Base-3 installer contains each of these once.
once("EXPECTED_BUILD='2026.08.28.sot-turn01-base-3'",
     "EXPECTED_BUILD='2026.08.28.sot-turn01-base-7'", 'expected build')
once("if(api.BUILD!=='2026.08.28.sot-turn01-base-3')",
     "if(api.BUILD!=='2026.08.28.sot-turn01-base-7')", 'temp API build gate')
once("assert x.get('build')=='2026.08.28.sot-turn01-base-3',x",
     "assert x.get('build')=='2026.08.28.sot-turn01-base-7',x", 'live API build gate')
once("assert x.get('build')=='2026.08.28.sot-turn01-base-3',x",
     "assert x.get('build')=='2026.08.28.sot-turn01-base-7',x", 'volume API build gate')

# Backend: accepted pre-base -> Base-3 integration -> governed corrections -> Base-7.
needle = 'python3 "$TMP/integrate-backend.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api.js"\n'
replacement = needle + f'''cp "$TMP/sot-api.js" "$TMP/sot-api-base3.js"\ncurl --max-time 30 -fsSL "{powershell_url}" -o "$TMP/patch-powershell.py"\npython3 "$TMP/patch-powershell.py" "$TMP/sot-api-base3.js" "$TMP/sot-api-base4.js"\ncurl --max-time 30 -fsSL "{drvfs_url}" -o "$TMP/patch-drvfs.py"\npython3 "$TMP/patch-drvfs.py" "$TMP/sot-api-base4.js" "$TMP/sot-api-base5.js"\ncurl --max-time 30 -fsSL "{wsl9p_url}" -o "$TMP/patch-wsl9p.py"\npython3 "$TMP/patch-wsl9p.py" "$TMP/sot-api-base5.js" "$TMP/sot-api-base6.js"\ncurl --max-time 30 -fsSL "{volume_url}" -o "$TMP/patch-volume-union.py"\npython3 "$TMP/patch-volume-union.py" "$TMP/sot-api-base6.js" "$TMP/sot-api.js"\n'''
once(needle, replacement, 'backend integration point')

# UI: accepted pre-base -> Base UI integration -> completed-project refresh suppression.
ui = 'python3 "$TMP/integrate-ui.py" "$TMP/SOT-turn01-pre-base.html" "$TMP/SOT-turn01-base.html"\n'
ui_replacement = ui + f'''cp "$TMP/SOT-turn01-base.html" "$TMP/SOT-turn01-base-before-idle.html"\ncurl --max-time 30 -fsSL "{idle_url}" -o "$TMP/patch-idle-refresh.py"\npython3 "$TMP/patch-idle-refresh.py" "$TMP/SOT-turn01-base-before-idle.html" "$TMP/SOT-turn01-base.html"\n'''
once(ui, ui_replacement, 'UI integration point')

# systemd/non-login execution must not depend on Windows PATH interop.
old_gate = '''echo '=== WINDOWS DRIVE DISCOVERY GATE ==='\npowershell.exe -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\\r' > "$TMP/windows-drives.txt"\n'''
new_gate = '''echo '=== WINDOWS DRIVE DISCOVERY GATE ==='\nPOWERSHELL='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'\nif [ ! -x "$POWERSHELL" ]; then\n  echo "PowerShell executable not available at $POWERSHELL"\n  false\nfi\necho "PowerShell: $POWERSHELL"\n"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\\r' > "$TMP/windows-drives.txt"\n'''
once(old_gate, new_gate, 'PowerShell discovery gate')

# Real Windows mount helper. Accept the host's observed WSL2 9p representation
# or drvfs, but require exact /mnt/<letter> target and exact <LETTER>: source.
old_helper = '''mkdir -p "$ROOT"\nif [ "$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)" = "$ROOT" ]; then\n  exit 0\nfi\nmount -t drvfs "${LETTER}:" "$ROOT"\nif [ "$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)" != "$ROOT" ]; then\n  echo "failed to mount ${LETTER}: at $ROOT" >&2\n  exit 1\nfi\n'''
new_helper = '''mkdir -p "$ROOT"\nTARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"\nFSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"\nSOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"\nif [ "$TARGET" = "$ROOT" ] && { [ "$FSTYPE" = "9p" ] || [ "$FSTYPE" = "drvfs" ]; } && [ "${SOURCE^^}" = "${LETTER}:" ]; then\n  exit 0\nfi\nif mountpoint -q "$ROOT"; then\n  umount "$ROOT"\nfi\nmount -t drvfs "${LETTER}:" "$ROOT"\nTARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"\nFSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"\nSOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"\nif [ "$TARGET" != "$ROOT" ] || { [ "$FSTYPE" != "9p" ] && [ "$FSTYPE" != "drvfs" ]; } || [ "${SOURCE^^}" != "${LETTER}:" ]; then\n  echo "failed to establish real Windows mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2\n  exit 1\nfi\n'''
once(old_helper, new_helper, 'mount helper')

# Preserve browse error bodies rather than failing as an opaque curl 404/409.
old_curl = 'curl --max-time 20 -fsSG --data-urlencode "path=$VOL_PATH" http://127.0.0.1:18080/api/sot/turn01/fs -o "$TMP/$DRIVE-folders.json"'
new_curl = '''HTTP_CODE="$(curl --max-time 20 -sSG --data-urlencode "path=$VOL_PATH" -o "$TMP/$DRIVE-folders.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs)"\n    if [ "$HTTP_CODE" != "200" ]; then\n      echo "browse HTTP $HTTP_CODE for $DRIVE:"\n      cat "$TMP/$DRIVE-folders.json" || true\n      echo\n      false\n    fi'''
once(old_curl, new_curl, 'browse curl gate')

# Gate all known/current candidates from the SOT volume API, including P when
# it is a genuine Windows-backed WSL mount even if Windows Get-PSDrive omits it.
old_loop = '''for DRIVE in D F Q; do\n  if tr ',' '\\n' < "$TMP/windows-drives.txt" | tr '[:lower:]' '[:upper:]' | grep -qx "$DRIVE"; then'''
new_loop = '''for DRIVE in C D E F G I P Q; do\n  if python3 - "$TMP/volumes.json" "$DRIVE" <<'PYDRIVE'\nimport json,sys\nx=json.load(open(sys.argv[1])); drive=sys.argv[2]+':'\nraise SystemExit(0 if any(v.get('kind')=='drive' and v.get('name')==drive for v in x.get('volumes',[])) else 1)\nPYDRIVE\n  then'''
once(old_loop, new_loop, 'drive browse gate loop')

# Mechanical markers in the generated installer before owner/device testing.
old_marker = 'grep -q "windowsDriveLetters" "$TMP/sot-api.js"\n'
new_marker = old_marker + '''grep -q "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" "$TMP/sot-api.js"\ngrep -q "fstype === '9p' || fstype === 'drvfs'" "$TMP/sot-api.js"\ngrep -q "TURN01_BASE_VOLUME_UNION" "$TMP/sot-api.js"\ngrep -q "TURN01_BASE_IDLE_REFRESH" "$TMP/SOT-turn01-base.html"\n'''
once(old_marker, new_marker, 'generated artifact marker gates')

Path(sys.argv[2]).write_text(src)
PY

bash -n "$TMP/base7-installer.sh"
grep -q "EXPECTED_BUILD='2026.08.28.sot-turn01-base-7'" "$TMP/base7-installer.sh"
grep -q 'patch-volume-union.py' "$TMP/base7-installer.sh"
grep -q 'patch-idle-refresh.py' "$TMP/base7-installer.sh"
grep -q 'for DRIVE in C D E F G I P Q' "$TMP/base7-installer.sh"
grep -q 'FSTYPE.*9p' "$TMP/base7-installer.sh"
grep -q 'FSTYPE.*drvfs' "$TMP/base7-installer.sh"

exec bash "$TMP/base7-installer.sh"
