#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-volume-union.py <base6-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()

start = src.index('function windowsDriveLetters() {')
end = src.index('\nfunction driveLetterForPath', start)
old = src[start:end]

new = r'''function windowsDriveLetters() {
  const letters = new Set();
  try {
    const powershell = [
      '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
      '/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe'
    ].find(candidate => fs.existsSync(candidate));
    if (powershell) {
      const output = execFileSync(powershell, [
        '-NoProfile', '-NonInteractive', '-Command',
        "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','"
      ], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 }).trim();
      for (const value of output.split(',')) {
        const letter = value.trim().toLowerCase();
        if (/^[a-z]$/.test(letter)) letters.add(letter);
      }
    }
  } catch { /* Windows discovery is additive; mounted WSL drives still count. */ }

  // WSL2 can expose real Windows drives as 9p or drvfs. Include only mounts
  // whose target and source agree on the same drive letter. A plain /mnt/x
  // directory is deliberately excluded.
  try {
    const output = execFileSync('findmnt', ['-rn', '-o', 'TARGET,FSTYPE,SOURCE'], {
      encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024
    });
    for (const line of output.split(/\r?\n/)) {
      const match = line.trim().match(/^\/mnt\/([a-z])\s+(9p|drvfs)\s+([a-z]):(?:\s|$)/i);
      if (!match) continue;
      if (match[1].toLowerCase() === match[3].toLowerCase()) letters.add(match[1].toLowerCase());
    }
  } catch { /* no mounted Windows volumes discovered */ }

  return [...letters].sort();
}'''

src = src[:start] + new + src[end:]

old_build = "const BUILD = '2026.08.28.sot-turn01-base-6';"
new_build = "const BUILD = '2026.08.28.sot-turn01-base-7';"
if src.count(old_build) != 1:
    raise SystemExit('unexpected Base-6 build marker')
src = src.replace(old_build, new_build, 1)

required = [
    "execFileSync('findmnt'",
    "(9p|drvfs)",
    "letters.add(match[1].toLowerCase())",
    "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe",
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'volume union marker missing: {marker}')

Path(sys.argv[2]).write_text(src)
print('Windows + real WSL-mounted drive inventory union applied; Base build 7 generated')
