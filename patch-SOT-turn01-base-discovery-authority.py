#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-discovery-authority.py <base3-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()
required = [
    "const BUILD = '2026.08.28.sot-turn01-base-3';",
    '// TURN01_BASE_DIRECT_INTEGRATION',
    'function windowsDriveLetters() {',
    'function driveMounted(letter) {',
    'function ensureWindowsDriveMounted(letter) {',
    'function volumeRecord(letter) {',
    'function volumeRoots() {',
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'clean Base-3 marker missing: {marker}')
for rejected in ['normalizeWindowsMountSource', 'mount helper completed but SOT rejected mount state']:
    if rejected in src:
        raise SystemExit(f'rejected mount-authority lineage detected: {rejected}')

old = """function windowsDriveLetters() {
  try {
    const output = execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      \"(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','\"
    ], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 }).trim();
    return [...new Set(output.split(',').map(v => v.trim().toLowerCase()).filter(v => /^[a-z]$/.test(v)))].sort();
  } catch {
    return [];
  }
}
"""
new = """function windowsDriveLetters() {
  try {
    const powershell = [
      '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
      '/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe'
    ].find(candidate => fs.existsSync(candidate));
    if (!powershell) return [];
    const output = execFileSync(powershell, [
      '-NoProfile', '-NonInteractive', '-Command',
      \"(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','\"
    ], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 }).trim();
    return [...new Set(output.split(',').map(v => v.trim().toLowerCase()).filter(v => /^[a-z]$/.test(v)))].sort();
  } catch {
    return [];
  }
}
"""
if src.count(old) != 1:
    raise SystemExit('clean Base-3 Windows discovery block changed unexpectedly')
src = src.replace(old, new, 1)

old = """function driveMounted(letter) {
  const root = `/mnt/${String(letter).toLowerCase()}`;
  const mount = mountInfo(root);
  return mount.target === root;
}
"""
new = """function driveMounted(letter) {
  const root = `/mnt/${String(letter).toLowerCase()}`;
  const mount = mountInfo(root);
  return mount.target === root;
}
"""
if src.count(old) != 1:
    raise SystemExit('clean Base-3 mount observation block changed unexpectedly')
# Deliberately retain Base-3 mount observation. It is status, not volume authority.

old = """  if (!driveMounted(lower)) throw httpError(409, `${lower.toUpperCase()}: is visible in Windows but is not mounted in WSL`);
  return root;
}"""
new = """  // Windows discovery is authoritative for volume existence. Mount/read access is
  // validated only when an operation actually needs filesystem access.
  return root;
}"""
if src.count(old) != 1:
    raise SystemExit('clean Base-3 post-mount rejection point changed unexpectedly')
src = src.replace(old, new, 1)

src = src.replace("const BUILD = '2026.08.28.sot-turn01-base-3';", "const BUILD = '2026.08.29.sot-turn01-base-12';", 1)

checks = [
    "const BUILD = '2026.08.29.sot-turn01-base-12';",
    '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
    'const locations = windowsDriveLetters().map(volumeRecord);',
    'Windows discovery is authoritative for volume existence.',
]
for marker in checks:
    if marker not in src:
        raise SystemExit(f'generated Base contract missing: {marker}')
for rejected in ['normalizeWindowsMountSource', 'mount helper completed but SOT rejected mount state']:
    if rejected in src:
        raise SystemExit(f'rejected mount-authority marker survived: {rejected}')

Path(sys.argv[2]).write_text(src)
print('Base-12 discovery-authority correction generated from clean Base-3')
