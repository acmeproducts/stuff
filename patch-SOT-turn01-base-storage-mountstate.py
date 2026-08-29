#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-storage-mountstate.py <base3-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()
if "const BUILD = '2026.08.28.sot-turn01-base-3';" not in src:
    raise SystemExit('expected frozen Base-3 integrated source')
if 'TURN01_BASE_DIRECT_INTEGRATION' not in src:
    raise SystemExit('Base direct integration marker missing')

start = src.index('function windowsDriveLetters() {')
end = src.index('\nfunction driveLetterForPath', start)
windows_fn = r'''function windowsDriveLetters() {
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
  } catch { /* Windows inventory is additive. */ }

  try {
    const output = execFileSync('findmnt', ['-rn', '-o', 'TARGET,FSTYPE,SOURCE'], {
      encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024
    });
    for (const line of output.split(/\r?\n/)) {
      const match = line.trim().match(/^\/mnt\/([a-z])\s+(9p|drvfs)\s+([a-z]):(?:\\x5c|\\x2f|[\\/])?(?:\s|$)/i);
      if (match && match[1].toLowerCase() === match[3].toLowerCase()) letters.add(match[1].toLowerCase());
    }
  } catch { /* no additional real Windows-backed WSL mounts */ }
  return [...letters].sort();
}

function normalizeWindowsMountSource(value) {
  let source = String(value || '').trim();
  source = source.split('\\x5c').join('\\').split('\\x2f').join('/');
  while (source.endsWith('\\') || source.endsWith('/')) source = source.slice(0, -1);
  return source.toUpperCase();
}'''
src = src[:start] + windows_fn + src[end:]

start = src.index('function driveMounted(letter) {')
end = src.index('\nfunction ensureWindowsDriveMounted', start)
drive_fn = r'''function driveMounted(letter) {
  const lower = String(letter || '').toLowerCase();
  if (!/^[a-z]$/.test(lower)) return false;
  const root = `/mnt/${lower}`;
  const mount = mountInfo(root);
  const source = normalizeWindowsMountSource(mount.source);
  const fstype = String(mount.fstype || '').trim().toLowerCase();
  if (mount.target !== root || !['9p','drvfs'].includes(fstype) || source !== `${lower.toUpperCase()}:`) return false;
  try {
    fs.readdirSync(root);
    return true;
  } catch {
    return false;
  }
}'''
src = src[:start] + drive_fn + src[end:]

old_build = "const BUILD = '2026.08.28.sot-turn01-base-3';"
new_build = "const BUILD = '2026.08.28.sot-turn01-base-10';"
if src.count(old_build) != 1:
    raise SystemExit(f'Base-3 build marker changed unexpectedly: {src.count(old_build)}')
src = src.replace(old_build, new_build, 1)

required = [
    '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
    'function normalizeWindowsMountSource(value)',
    "split('\\\\x5c').join('\\\\')",
    "['9p','drvfs'].includes(fstype)",
    'fs.readdirSync(root)',
    "const BUILD = '2026.08.28.sot-turn01-base-10';",
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'mount-state correction marker missing: {marker}')

if "execFileSync('powershell.exe'" in src:
    raise SystemExit('PATH-based PowerShell invocation remains')

Path(sys.argv[2]).write_text(src)
print('Turn 01 Base mount-state correction applied directly to frozen Base-3 integration; Base build 10 generated')
