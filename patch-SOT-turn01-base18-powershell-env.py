#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base18-powershell-env.py <generated-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()

replacements = [
    (
        '"$p=$args[0]; if (Test-Path -LiteralPath $p -PathType Container) { \'1\' } else { \'0\' }",\n      winPath\n    ], { encoding:\'utf8\', timeout:10000, maxBuffer:1024*1024 }).trim();',
        '"$p=$env:SOT_PATH; if (Test-Path -LiteralPath $p -PathType Container) { \'1\' } else { \'0\' }"\n    ], { encoding:\'utf8\', timeout:10000, maxBuffer:1024*1024, env:{...process.env,SOT_PATH:winPath} }).trim();'
    ),
    (
        '"$ErrorActionPreference=\'Stop\'; $p=$args[0]; if (!(Test-Path -LiteralPath $p -PathType Container)) { throw \'Folder does not exist\' }; @(Get-ChildItem -LiteralPath $p -Directory -Force | Where-Object { $_.Name -ne \'$RECYCLE.BIN\' } | Select-Object -ExpandProperty Name) | ConvertTo-Json -Compress",\n      winPath\n    ], { encoding:\'utf8\', timeout:20000, maxBuffer:16*1024*1024 }).trim();',
        '"$ErrorActionPreference=\'Stop\'; $p=$env:SOT_PATH; if (!(Test-Path -LiteralPath $p -PathType Container)) { throw \'Folder does not exist\' }; @(Get-ChildItem -LiteralPath $p -Directory -Force | Where-Object { $_.Name -ne \'$RECYCLE.BIN\' } | Select-Object -ExpandProperty Name) | ConvertTo-Json -Compress"\n    ], { encoding:\'utf8\', timeout:20000, maxBuffer:16*1024*1024, env:{...process.env,SOT_PATH:winPath} }).trim();'
    ),
    (
        '"$ErrorActionPreference=\'Stop\'; $p=$args[0]; $n=$args[1]; if (!(Test-Path -LiteralPath $p -PathType Container)) { throw \'Parent folder does not exist\' }; $dest=Join-Path -Path $p -ChildPath $n; New-Item -ItemType Directory -Path $dest -ErrorAction Stop | Out-Null",\n      winParent, String(name)\n    ], { encoding:\'utf8\', timeout:20000, maxBuffer:1024*1024 });',
        '"$ErrorActionPreference=\'Stop\'; $p=$env:SOT_PATH; $n=$env:SOT_NAME; if (!(Test-Path -LiteralPath $p -PathType Container)) { throw \'Parent folder does not exist\' }; $dest=Join-Path -Path $p -ChildPath $n; New-Item -ItemType Directory -Path $dest -ErrorAction Stop | Out-Null"\n    ], { encoding:\'utf8\', timeout:20000, maxBuffer:1024*1024, env:{...process.env,SOT_PATH:winParent,SOT_NAME:String(name)} });'
    ),
]

for old, new in replacements:
    count = src.count(old)
    if count != 1:
        raise SystemExit(f'PowerShell transport source contract changed: expected 1 match, got {count}')
    src = src.replace(old, new, 1)

if '$args[0]' in src or '$args[1]' in src:
    raise SystemExit('rejected PowerShell trailing-argument transport survived')
for marker in ['$env:SOT_PATH', '$env:SOT_NAME', 'env:{...process.env,SOT_PATH:winPath}', 'SOT_NAME:String(name)']:
    if marker not in src:
        raise SystemExit(f'Base-18 transport marker missing: {marker}')

src = src.replace("const BUILD = '2026.08.29.sot-turn01-base-14';", "const BUILD = '2026.08.29.sot-turn01-base-18';", 1)
if "const BUILD = '2026.08.29.sot-turn01-base-18';" not in src:
    raise SystemExit('Base-18 build marker missing')

Path(sys.argv[2]).write_text(src)
print('Base-18 PowerShell transport corrected: environment-variable path/name transport')
