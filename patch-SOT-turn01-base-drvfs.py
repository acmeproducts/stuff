#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-drvfs.py <base4-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()

old = """function driveMounted(letter) {\n  const root = `/mnt/${String(letter).toLowerCase()}`;\n  const mount = mountInfo(root);\n  return mount.target === root;\n}"""
new = """function driveMounted(letter) {\n  const lower = String(letter || '').toLowerCase();\n  if (!/^[a-z]$/.test(lower)) return false;\n  const root = `/mnt/${lower}`;\n  const mount = mountInfo(root);\n  const source = String(mount.source || '').trim().toUpperCase();\n  const fstype = String(mount.fstype || '').trim().toLowerCase();\n  if (mount.target !== root || fstype !== 'drvfs' || source !== `${lower.toUpperCase()}:`) return false;\n  try {\n    const stat = fs.statSync(root);\n    return stat.isDirectory();\n  } catch {\n    return false;\n  }\n}"""
if src.count(old) != 1:
    raise SystemExit(f'driveMounted marker changed unexpectedly: {src.count(old)}')
src = src.replace(old, new, 1)

old_build = "const BUILD = '2026.08.28.sot-turn01-base-4';"
new_build = "const BUILD = '2026.08.28.sot-turn01-base-5';"
if src.count(old_build) != 1:
    raise SystemExit('unexpected Base-4 build marker')
src = src.replace(old_build, new_build, 1)

if "fstype !== 'drvfs'" not in src:
    raise SystemExit('strict drvfs mount verification missing')

Path(sys.argv[2]).write_text(src)
print('drvfs mount verification correction applied; Base build 5 generated')
