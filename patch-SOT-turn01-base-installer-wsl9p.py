#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 4:
    raise SystemExit('usage: patch-SOT-turn01-base-installer-wsl9p.py <base5-wrapper.sh> <output-wrapper.sh> <wsl9p-patch-url>')

src = Path(sys.argv[1]).read_text()
wsl9p_url = sys.argv[3]

# This patcher operates on the archived Base-5 wrapper definition. Use small,
# unique anchors rather than matching a generated multi-line f-string block.
def replace_once(old, new, label):
    global src
    count = src.count(old)
    if count != 1:
        raise SystemExit(f'{label} changed unexpectedly: found {count}')
    src = src.replace(old, new, 1)

replace_once(
    "DRVFS_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/a8cb8b109a2500821825aa854841b7057e3937b2/patch-SOT-turn01-base-drvfs.py'\n",
    "DRVFS_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/a8cb8b109a2500821825aa854841b7057e3937b2/patch-SOT-turn01-base-drvfs.py'\n" + f"WSL9P_PATCH_URL='{wsl9p_url}'\n",
    'Base-5 drvfs resource marker'
)
replace_once(
    'curl --max-time 30 -fsSL "$DRVFS_PATCH_URL" -o "$TMP/patch-drvfs.py"\n',
    'curl --max-time 30 -fsSL "$DRVFS_PATCH_URL" -o "$TMP/patch-drvfs.py"\n' +
    'curl --max-time 30 -fsSL "$WSL9P_PATCH_URL" -o "$TMP/patch-wsl9p.py"\n',
    'Base-5 drvfs fetch marker'
)
replace_once(
    'python3 - "$TMP/base-installer.sh" "$TMP/patched-installer.sh" "$POWERSHELL_PATCH_URL" "$DRVFS_PATCH_URL" <<\'PY\'',
    'python3 - "$TMP/base-installer.sh" "$TMP/patched-installer.sh" "$POWERSHELL_PATCH_URL" "$DRVFS_PATCH_URL" "$WSL9P_PATCH_URL" <<\'PY\'',
    'generated-installer Python invocation'
)
replace_once(
    'drvfs_patch_url = sys.argv[4]\n',
    'drvfs_patch_url = sys.argv[4]\nwsl9p_patch_url = sys.argv[5]\n',
    'generated-installer argument binding'
)

# Generated candidate becomes Base-6.
for old, new, label in [
    ("EXPECTED_BUILD='2026.08.28.sot-turn01-base-5'", "EXPECTED_BUILD='2026.08.28.sot-turn01-base-6'", 'expected build'),
    ("if(api.BUILD!=='2026.08.28.sot-turn01-base-5')", "if(api.BUILD!=='2026.08.28.sot-turn01-base-6')", 'temp API build gate'),
    ("assert x.get('build')=='2026.08.28.sot-turn01-base-5',x", "assert x.get('build')=='2026.08.28.sot-turn01-base-6',x", 'live API build gate'),
]:
    replace_once(old, new, label)

# Split the Base-5 output line, then apply the WSL2 9p patch as a new final step.
replace_once(
    'python3 "$TMP/patch-drvfs.py" "$TMP/sot-api-base4.js" "$TMP/sot-api.js"',
    'python3 "$TMP/patch-drvfs.py" "$TMP/sot-api-base4.js" "$TMP/sot-api-base5.js"\n' +
    'curl --max-time 30 -fsSL "{wsl9p_patch_url}" -o "$TMP/patch-wsl9p.py"\n' +
    'python3 "$TMP/patch-wsl9p.py" "$TMP/sot-api-base5.js" "$TMP/sot-api.js"',
    'Base-5 generated backend final patch step'
)

# WSL2 on this host reports mounted Windows drives as fstype=9p, source=D: etc.
# Exact target and source-letter checks remain mandatory.
replace_once(
    'if [ "$TARGET" = "$ROOT" ] && [ "$FSTYPE" = "drvfs" ] && [ "${SOURCE^^}" = "${LETTER}:" ]; then',
    'if [ "$TARGET" = "$ROOT" ] && { [ "$FSTYPE" = "9p" ] || [ "$FSTYPE" = "drvfs" ]; } && [ "${SOURCE^^}" = "${LETTER}:" ]; then',
    'mount helper ready check'
)
replace_once(
    'if [ "$TARGET" != "$ROOT" ] || [ "$FSTYPE" != "drvfs" ] || [ "${SOURCE^^}" != "${LETTER}:" ]; then\n  echo "failed to establish real drvfs mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2',
    'if [ "$TARGET" != "$ROOT" ] || { [ "$FSTYPE" != "9p" ] && [ "$FSTYPE" != "drvfs" ]; } || [ "${SOURCE^^}" != "${LETTER}:" ]; then\n  echo "failed to establish real Windows mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2',
    'mount helper verification check'
)

replace_once(
    'grep -q "fstype !== \'drvfs\'" "$TMP/sot-api.js"',
    'grep -q "fstype === \'9p\' || fstype === \'drvfs\'" "$TMP/sot-api.js"',
    'generated API filesystem gate'
)
replace_once(
    'grep -q "EXPECTED_BUILD=\'2026.08.28.sot-turn01-base-5\'" "$TMP/patched-installer.sh"',
    'grep -q "EXPECTED_BUILD=\'2026.08.28.sot-turn01-base-6\'" "$TMP/patched-installer.sh"',
    'wrapper build gate'
)
replace_once(
    "grep -q 'FSTYPE.*drvfs' \"$TMP/patched-installer.sh\"",
    "grep -q 'FSTYPE.*9p' \"$TMP/patched-installer.sh\"\ngrep -q 'FSTYPE.*drvfs' \"$TMP/patched-installer.sh\"",
    'wrapper filesystem gate'
)

required = [
    '2026.08.28.sot-turn01-base-6',
    'WSL9P_PATCH_URL',
    'sot-api-base5.js',
    'FSTYPE\" = \"9p',
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'generated Base-6 wrapper marker missing: {marker}')

Path(sys.argv[2]).write_text(src)
print('Base-5 wrapper corrected for WSL2 9p Windows mounts; Base-6 wrapper generated')
