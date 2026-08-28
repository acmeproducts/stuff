#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-mount-source.py <base7-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()

old = """  const source = String(mount.source || '').trim().toUpperCase();\n  const fstype = String(mount.fstype || '').trim().toLowerCase();\n  const windowsFs = fstype === '9p' || fstype === 'drvfs';\n  if (mount.target !== root || !windowsFs || source !== `${lower.toUpperCase()}:`) return false;"""
new = """  const source = String(mount.source || '').trim().toUpperCase().replace(/[\\\\/]+$/, '');\n  const fstype = String(mount.fstype || '').trim().toLowerCase();\n  const windowsFs = fstype === '9p' || fstype === 'drvfs';\n  if (mount.target !== root || !windowsFs || source !== `${lower.toUpperCase()}:`) return false;"""
if src.count(old) != 1:
    raise SystemExit(f'Base-7 drive source marker changed unexpectedly: {src.count(old)}')
src = src.replace(old, new, 1)

old_regex = "const match = line.trim().match(/^\\/mnt\\/([a-z])\\s+(9p|drvfs)\\s+([a-z]):(?:\\s|$)/i);"
new_regex = "const match = line.trim().match(/^\\/mnt\\/([a-z])\\s+(9p|drvfs)\\s+([a-z]):(?:[\\\\/])?(?:\\s|$)/i);"
if src.count(old_regex) != 1:
    raise SystemExit(f'Base-7 mounted-drive regex changed unexpectedly: {src.count(old_regex)}')
src = src.replace(old_regex, new_regex, 1)

old_build = "const BUILD = '2026.08.28.sot-turn01-base-7';"
new_build = "const BUILD = '2026.08.28.sot-turn01-base-8';"
if src.count(old_build) != 1:
    raise SystemExit('unexpected Base-7 build marker')
src = src.replace(old_build, new_build, 1)

required = [
    ".replace(/[\\\\/]+$/, '')",
    "(?:[\\\\/])?",
    "const BUILD = '2026.08.28.sot-turn01-base-8';",
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'mount source correction marker missing: {marker}')

Path(sys.argv[2]).write_text(src)
print('Windows mount source normalization applied; Base build 8 generated')
