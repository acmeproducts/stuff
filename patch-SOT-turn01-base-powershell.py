#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-powershell.py <generated-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()

old = """function windowsDriveLetters() {\n  try {\n    const output = execFileSync('powershell.exe', ["""
new = """function windowsDriveLetters() {\n  try {\n    const powershell = [\n      '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',\n      '/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe'\n    ].find(candidate => fs.existsSync(candidate));\n    if (!powershell) return [];\n    const output = execFileSync(powershell, ["""

if src.count(old) != 1:
    raise SystemExit(f'expected exactly one PATH-based powershell discovery call, found {src.count(old)}')
src = src.replace(old, new, 1)

old_build = "const BUILD = '2026.08.28.sot-turn01-base-3';"
new_build = "const BUILD = '2026.08.28.sot-turn01-base-4';"
if src.count(old_build) != 1:
    raise SystemExit('unexpected Base build marker')
src = src.replace(old_build, new_build, 1)

if "execFileSync('powershell.exe'" in src:
    raise SystemExit('PATH-based powershell invocation remains')
if '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe' not in src:
    raise SystemExit('absolute PowerShell path marker missing')

Path(sys.argv[2]).write_text(src)
print('PowerShell path correction applied; Base build 4 generated')
