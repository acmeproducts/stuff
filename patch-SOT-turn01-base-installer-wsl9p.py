#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 4:
    raise SystemExit('usage: patch-SOT-turn01-base-installer-wsl9p.py <base5-wrapper.sh> <output-wrapper.sh> <wsl9p-patch-url>')

src = Path(sys.argv[1]).read_text()
wsl9p_url = sys.argv[3]

# Outer wrapper resources.
needle = "DRVFS_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/a8cb8b109a2500821825aa854841b7057e3937b2/patch-SOT-turn01-base-drvfs.py'\n"
replacement = needle + f"WSL9P_PATCH_URL='{wsl9p_url}'\n"
if src.count(needle) != 1:
    raise SystemExit('Base-5 drvfs resource marker changed unexpectedly')
src = src.replace(needle, replacement, 1)

needle = 'curl --max-time 30 -fsSL "$DRVFS_PATCH_URL" -o "$TMP/patch-drvfs.py"\n'
replacement = needle + 'curl --max-time 30 -fsSL "$WSL9P_PATCH_URL" -o "$TMP/patch-wsl9p.py"\n'
if src.count(needle) != 1:
    raise SystemExit('Base-5 drvfs fetch marker changed unexpectedly')
src = src.replace(needle, replacement, 1)

src = src.replace(
    'python3 - "$TMP/base-installer.sh" "$TMP/patched-installer.sh" "$POWERSHELL_PATCH_URL" "$DRVFS_PATCH_URL" <<\'PY\'',
    'python3 - "$TMP/base-installer.sh" "$TMP/patched-installer.sh" "$POWERSHELL_PATCH_URL" "$DRVFS_PATCH_URL" "$WSL9P_PATCH_URL" <<\'PY\'',
    1
)
src = src.replace('drvfs_patch_url = sys.argv[4]\n', 'drvfs_patch_url = sys.argv[4]\nwsl9p_patch_url = sys.argv[5]\n', 1)

# Generated candidate becomes Base-6.
src = src.replace("EXPECTED_BUILD='2026.08.28.sot-turn01-base-5'", "EXPECTED_BUILD='2026.08.28.sot-turn01-base-6'")
src = src.replace("if(api.BUILD!=='2026.08.28.sot-turn01-base-5')", "if(api.BUILD!=='2026.08.28.sot-turn01-base-6')")
src = src.replace("assert x.get('build')=='2026.08.28.sot-turn01-base-5',x", "assert x.get('build')=='2026.08.28.sot-turn01-base-6',x")

needle = '''curl --max-time 30 -fsSL "{drvfs_patch_url}" -o "$TMP/patch-drvfs.py"\npython3 "$TMP/patch-drvfs.py" "$TMP/sot-api-base4.js" "$TMP/sot-api.js"\n'''
replacement = '''curl --max-time 30 -fsSL "{drvfs_patch_url}" -o "$TMP/patch-drvfs.py"\npython3 "$TMP/patch-drvfs.py" "$TMP/sot-api-base4.js" "$TMP/sot-api-base5.js"\ncurl --max-time 30 -fsSL "{wsl9p_patch_url}" -o "$TMP/patch-wsl9p.py"\npython3 "$TMP/patch-wsl9p.py" "$TMP/sot-api-base5.js" "$TMP/sot-api.js"\n'''
if src.count(needle) != 1:
    raise SystemExit('Base-5 generated backend patch chain changed unexpectedly')
src = src.replace(needle, replacement, 1)

# WSL2 presents real Windows drvfs mounts as fstype=9p on this host. Preserve
# exact target and source-letter checks; only the filesystem representation is broadened.
src = src.replace(
    '''if [ "$TARGET" = "$ROOT" ] && [ "$FSTYPE" = "drvfs" ] && [ "${SOURCE^^}" = "${LETTER}:" ]; then''',
    '''if [ "$TARGET" = "$ROOT" ] && { [ "$FSTYPE" = "9p" ] || [ "$FSTYPE" = "drvfs" ]; } && [ "${SOURCE^^}" = "${LETTER}:" ]; then''',
    1
)
src = src.replace(
    '''if [ "$TARGET" != "$ROOT" ] || [ "$FSTYPE" != "drvfs" ] || [ "${SOURCE^^}" != "${LETTER}:" ]; then\n  echo "failed to establish real drvfs mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2''',
    '''if [ "$TARGET" != "$ROOT" ] || { [ "$FSTYPE" != "9p" ] && [ "$FSTYPE" != "drvfs" ]; } || [ "${SOURCE^^}" != "${LETTER}:" ]; then\n  echo "failed to establish real Windows mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2''',
    1
)

# Generated API guards must prove 9p compatibility rather than the rejected strict-drvfs test.
src = src.replace(
    '''grep -q "fstype !== \'drvfs\'" "$TMP/sot-api.js"''',
    '''grep -q "fstype === '9p' || fstype === 'drvfs'" "$TMP/sot-api.js"''',
    1
)

# Wrapper-level mechanical gates.
src = src.replace(
    '''grep -q "EXPECTED_BUILD='2026.08.28.sot-turn01-base-5'" "$TMP/patched-installer.sh"''',
    '''grep -q "EXPECTED_BUILD='2026.08.28.sot-turn01-base-6'" "$TMP/patched-installer.sh"''',
    1
)
src = src.replace(
    '''grep -q 'FSTYPE.*drvfs' "$TMP/patched-installer.sh"''',
    '''grep -q 'FSTYPE.*9p' "$TMP/patched-installer.sh"\ngrep -q 'FSTYPE.*drvfs' "$TMP/patched-installer.sh"''',
    1
)

if '2026.08.28.sot-turn01-base-6' not in src:
    raise SystemExit('Base-6 build marker missing')
if 'WSL9P_PATCH_URL' not in src:
    raise SystemExit('WSL 9p patch resource missing')

Path(sys.argv[2]).write_text(src)
print('Base-5 wrapper corrected for WSL2 9p Windows mounts; Base-6 wrapper generated')
