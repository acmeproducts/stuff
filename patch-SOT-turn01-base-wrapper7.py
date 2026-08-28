#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-wrapper7.py <base6-wrapper.sh> <base7-wrapper.sh>')

src = Path(sys.argv[1]).read_text()

def once(old, new, label):
    global src
    n = src.count(old)
    if n != 1:
        raise SystemExit(f'{label} changed unexpectedly: found {n}')
    src = src.replace(old, new, 1)

for old, new, label in [
    ("EXPECTED_BUILD='2026.08.28.sot-turn01-base-6'", "EXPECTED_BUILD='2026.08.28.sot-turn01-base-7'", 'expected build'),
    ("if(api.BUILD!=='2026.08.28.sot-turn01-base-6')", "if(api.BUILD!=='2026.08.28.sot-turn01-base-7')", 'temp build gate'),
    ("assert x.get('build')=='2026.08.28.sot-turn01-base-6',x", "assert x.get('build')=='2026.08.28.sot-turn01-base-7',x", 'live build gate'),
]:
    once(old, new, label)

old = 'python3 "$TMP/patch-wsl9p.py" "$TMP/sot-api-base5.js" "$TMP/sot-api.js"'
new = ('python3 "$TMP/patch-wsl9p.py" "$TMP/sot-api-base5.js" "$TMP/sot-api-base6.js"\\n'
       'curl --max-time 30 -fsSL "https://raw.githubusercontent.com/acmeproducts/stuff/edfa82ecdcf436b0b46567903890b98036915b1d/patch-SOT-turn01-base-volume-union.py" -o "$TMP/patch-volume-union.py"\\n'
       'python3 "$TMP/patch-volume-union.py" "$TMP/sot-api-base6.js" "$TMP/sot-api.js"')
once(old, new, 'Base-6 backend final patch step')

anchor = 'Path(sys.argv[2]).write_text(source)\nPY\n\nbash -n "$TMP/patched-installer.sh"'
injection = '''ui_old = 'python3 "$TMP/integrate-ui.py" "$TMP/SOT-turn01-pre-base.html" "$TMP/SOT-turn01-base.html"'\nui_new = ui_old + '\\ncurl --max-time 30 -fsSL "https://raw.githubusercontent.com/acmeproducts/stuff/94d5ecdd4d71bd5f9ea58b7dbade952093f548f9/patch-SOT-turn01-base-idle-refresh.py" -o "$TMP/patch-idle-refresh.py"\\ncp "$TMP/SOT-turn01-base.html" "$TMP/SOT-turn01-base-before-idle.html"\\npython3 "$TMP/patch-idle-refresh.py" "$TMP/SOT-turn01-base-before-idle.html" "$TMP/SOT-turn01-base.html"'\nif source.count(ui_old) != 1:\n    raise SystemExit(f'generated UI integration point changed unexpectedly: {source.count(ui_old)}')\nsource = source.replace(ui_old, ui_new, 1)\n\nPath(sys.argv[2]).write_text(source)\nPY\n\nbash -n "$TMP/patched-installer.sh"'''
once(anchor, injection, 'generated installer write point')

once('grep -q \'browse HTTP\' "$TMP/patched-installer.sh"',
     'grep -q \'browse HTTP\' "$TMP/patched-installer.sh"\ngrep -q \'patch-SOT-turn01-base-volume-union.py\' "$TMP/patched-installer.sh"\ngrep -q \'patch-SOT-turn01-base-idle-refresh.py\' "$TMP/patched-installer.sh"',
     'generated installer delta gates')

old_loop = '''for DRIVE in D F Q; do
  if tr ',' '\\n' < "$TMP/windows-drives.txt" | tr '[:lower:]' '[:upper:]' | grep -qx "$DRIVE"; then'''
new_loop = '''for DRIVE in C D E F G I P Q; do
  if python3 - "$TMP/volumes.json" "$DRIVE" <<'PYDRIVE'
import json,sys
x=json.load(open(sys.argv[1])); drive=sys.argv[2]+':'
raise SystemExit(0 if any(v.get('kind')=='drive' and v.get('name')==drive for v in x.get('volumes',[])) else 1)
PYDRIVE
  then'''
once(old_loop, new_loop, 'drive browse gate loop')

for marker in ['2026.08.28.sot-turn01-base-7','patch-SOT-turn01-base-volume-union.py','patch-SOT-turn01-base-idle-refresh.py','for DRIVE in C D E F G I P Q']:
    if marker not in src:
        raise SystemExit(f'Base-7 wrapper marker missing: {marker}')

Path(sys.argv[2]).write_text(src)
print('Base-6 wrapper corrected for volume union + idle refresh; Base-7 wrapper generated')
