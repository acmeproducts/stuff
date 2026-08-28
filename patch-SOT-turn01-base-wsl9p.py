#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-wsl9p.py <base5-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()

old = """  const source = String(mount.source || '').trim().toUpperCase();\n  const fstype = String(mount.fstype || '').trim().toLowerCase();\n  if (mount.target !== root || fstype !== 'drvfs' || source !== `${lower.toUpperCase()}:`) return false;"""
new = """  const source = String(mount.source || '').trim().toUpperCase();\n  const fstype = String(mount.fstype || '').trim().toLowerCase();\n  const windowsFs = fstype === '9p' || fstype === 'drvfs';\n  if (mount.target !== root || !windowsFs || source !== `${lower.toUpperCase()}:`) return false;"""
if src.count(old) != 1:
    raise SystemExit(f'Base-5 strict drvfs marker changed unexpectedly: {src.count(old)}')
src = src.replace(old, new, 1)

old_build = "const BUILD = '2026.08.28.sot-turn01-base-5';"
new_build = "const BUILD = '2026.08.28.sot-turn01-base-6';"
if src.count(old_build) != 1:
    raise SystemExit('unexpected Base-5 build marker')
src = src.replace(old_build, new_build, 1)

if "fstype === '9p' || fstype === 'drvfs'" not in src:
    raise SystemExit('WSL2 9p/drvfs compatibility marker missing')
if "source !== `${lower.toUpperCase()}:`" not in src:
    raise SystemExit('exact Windows drive-source validation missing')

Path(sys.argv[2]).write_text(src)
print('WSL2 9p/drive-source mount correction applied; Base build 6 generated')
