#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-windows-browse.py <base3-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()
for marker in [
    "const BUILD = '2026.08.28.sot-turn01-base-3';",
    '// TURN01_BASE_DIRECT_INTEGRATION',
    'function windowsDriveLetters() {',
    'function driveLetterForPath(value) {',
    'function volumeRoots() {',
    'function storageFor(projectToken, revalidate = false) {',
    'function saveStorage(projectToken, input) {',
    'async function createStorageFolder(input) {',
    'function listStorageFolder(inputPath) {'
]:
    if marker not in src:
        raise SystemExit(f'clean Base-3 marker missing: {marker}')
for rejected in ['normalizeWindowsMountSource', 'mount helper completed but SOT rejected mount state']:
    if rejected in src:
        raise SystemExit(f'rejected generated lineage detected: {rejected}')


def replace_function(text, name, next_name, replacement):
    start = text.index(f'function {name}')
    end = text.index(f'\nfunction {next_name}', start)
    return text[:start] + replacement.rstrip() + '\n' + text[end+1:]

# Absolute Windows PowerShell; Windows discovery remains the inventory authority.
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
    const powershell = windowsPowerShell();
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
    raise SystemExit('Base-3 Windows discovery block changed unexpectedly')
src = src.replace(old, new, 1)

# Insert Windows-native filesystem helpers before driveMounted.
insert_marker = 'function driveMounted(letter) {'
idx = src.index(insert_marker)
helpers = r'''function windowsPowerShell() {
  return [
    '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',
    '/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe'
  ].find(candidate => fs.existsSync(candidate)) || '';
}

function windowsPathForPosix(value) {
  const resolved = path.resolve(String(value || ''));
  const match = resolved.match(/^\/mnt\/([a-z])(?:\/(.*))?$/i);
  if (!match) return '';
  const tail = String(match[2] || '').split('/').filter(Boolean).join('\\');
  return `${match[1].toUpperCase()}:\\${tail}`;
}

function windowsDirectoryExists(value) {
  const powershell = windowsPowerShell();
  const winPath = windowsPathForPosix(value);
  if (!powershell || !winPath) return false;
  try {
    const output = execFileSync(powershell, [
      '-NoProfile','-NonInteractive','-Command',
      "$p=$args[0]; if ((Test-Path -LiteralPath $p -PathType Container)) { '1' } else { '0' }",
      winPath
    ], { encoding:'utf8', timeout:10000, maxBuffer:1024*1024 }).trim();
    return output === '1';
  } catch { return false; }
}

function windowsListDirectories(value) {
  const powershell = windowsPowerShell();
  const winPath = windowsPathForPosix(value);
  if (!powershell || !winPath) throw httpError(409, 'Windows filesystem access is unavailable');
  try {
    const output = execFileSync(powershell, [
      '-NoProfile','-NonInteractive','-Command',
      "$ErrorActionPreference='Stop'; $p=$args[0]; if (!(Test-Path -LiteralPath $p -PathType Container)) { throw 'Folder does not exist' }; @(Get-ChildItem -LiteralPath $p -Directory -Force | Where-Object { $_.Name -ne '$RECYCLE.BIN' } | Select-Object -ExpandProperty Name) | ConvertTo-Json -Compress",
      winPath
    ], { encoding:'utf8', timeout:20000, maxBuffer:16*1024*1024 }).trim();
    if (!output) return [];
    const parsed = JSON.parse(output);
    return (Array.isArray(parsed) ? parsed : [parsed]).map(String);
  } catch (error) {
    throw httpError(409, `Windows cannot enumerate ${winPath}: ${String(error.stderr || error.message || error).trim()}`);
  }
}

function windowsCreateDirectory(parent, name) {
  const powershell = windowsPowerShell();
  const winParent = windowsPathForPosix(parent);
  if (!powershell || !winParent) throw httpError(409, 'Windows filesystem access is unavailable');
  try {
    execFileSync(powershell, [
      '-NoProfile','-NonInteractive','-Command',
      "$ErrorActionPreference='Stop'; $p=$args[0]; $n=$args[1]; if (!(Test-Path -LiteralPath $p -PathType Container)) { throw 'Parent folder does not exist' }; $dest=Join-Path -Path $p -ChildPath $n; New-Item -ItemType Directory -Path $dest -ErrorAction Stop | Out-Null",
      winParent, String(name)
    ], { encoding:'utf8', timeout:20000, maxBuffer:1024*1024 });
  } catch (error) {
    throw httpError(409, `Windows could not create folder: ${String(error.stderr || error.message || error).trim()}`);
  }
}

function browsePathKey(projectToken, kind) {
  return `project.${projectToken}.${kind}_browse_root`;
}

function validateBrowseLocation(candidate, label='Folder') {
  const raw = String(candidate || '').trim();
  if (!raw) return '';
  const resolved = path.resolve(raw);
  const letter = driveLetterForPath(resolved);
  if (letter) {
    if (!windowsDriveLetters().includes(letter)) throw httpError(409, `${letter.toUpperCase()}: is not currently available in Windows`);
    if (!windowsDirectoryExists(resolved)) throw httpError(400, `${label} does not exist in Windows`);
    return resolved;
  }
  const home = os.homedir();
  if (!(resolved === home || resolved.startsWith(home + path.sep))) throw httpError(400, `${label} must be on a discovered Windows drive or WSL Home`);
  let stat;
  try { stat = fs.statSync(resolved); } catch { throw httpError(400, `${label} does not exist`); }
  if (!stat.isDirectory()) throw httpError(400, `${label} must be a folder`);
  return resolved;
}

'''
src = src[:idx] + helpers + src[idx:]

# Windows volumes exist because Windows discovers them. WSL mount status is observational only.
volume_for = r'''function volumeFor(candidate, mountIfNeeded = false) {
  const resolved = path.resolve(String(candidate || ''));
  const letter = driveLetterForPath(resolved);
  if (letter) {
    const available = windowsDriveLetters();
    if (!available.includes(letter)) return null;
    return volumeRecord(letter);
  }
  const home = os.homedir();
  if (resolved === home || resolved.startsWith(home + path.sep)) {
    try {
      const stats = fs.statfsSync(home);
      return {
        name: 'WSL Home', path: home, kind: 'wsl', mounted: true,
        free_bytes: Number(stats.bavail) * Number(stats.bsize),
        total_bytes: Number(stats.blocks) * Number(stats.bsize), mount: mountInfo(home)
      };
    } catch { return null; }
  }
  return null;
}'''
src = replace_function(src, 'volumeFor(candidate, mountIfNeeded = false) {'.split('(')[0], 'validateDestination(candidate, label) {'.split('(')[0], volume_for)

validate_destination = r'''function validateDestination(candidate, label) {
  const resolved = validateBrowseLocation(candidate, label);
  if (!resolved) return '';
  const letter = driveLetterForPath(resolved);
  if (letter) return resolved;
  try { fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK); }
  catch { throw httpError(400, `${label} folder is not readable/writable`); }
  return resolved;
}'''
src = replace_function(src, 'validateDestination', 'pathWithin', validate_destination)

storage_for = r'''function storageFor(projectToken, revalidate = false) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const targetKey = storageKey(projectToken, 'target');
  const backupKey = storageKey(projectToken, 'backup');
  const targetBrowseKey = browsePathKey(projectToken, 'target');
  const backupBrowseKey = browsePathKey(projectToken, 'backup');
  const stored = rows(`SELECT key,value,updated_at FROM settings WHERE key IN (${sqlQuote(targetKey)},${sqlQuote(backupKey)},${sqlQuote(targetBrowseKey)},${sqlQuote(backupBrowseKey)});`);
  const map = Object.fromEntries(stored.map(row => [row.key, row]));
  let target = map[targetKey]?.value || '';
  let backup = map[backupKey]?.value || '';
  if (revalidate) {
    if (!target || !backup) throw httpError(409, 'select project Target and Backup before planning or execution');
    target = validateDestination(target, 'Target');
    backup = validateDestination(backup, 'Backup');
  }
  return {
    build: BUILD,
    project_token: projectToken,
    target_root: target,
    backup_root: backup,
    target_browse_root: map[targetBrowseKey]?.value || '',
    backup_browse_root: map[backupBrowseKey]?.value || '',
    target_volume: target ? volumeFor(target) : null,
    backup_volume: backup ? volumeFor(backup) : null,
    target_available: !target || Boolean(volumeFor(target)),
    backup_available: !backup || Boolean(volumeFor(backup)),
    updated_at: [map[targetKey]?.updated_at, map[backupKey]?.updated_at, map[targetBrowseKey]?.updated_at, map[backupBrowseKey]?.updated_at].filter(Boolean).sort().at(-1) || null
  };
}'''
src = replace_function(src, 'storageFor', 'saveStorage', storage_for)

save_storage = r'''function saveStorage(projectToken, input) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const current = storageFor(projectToken);
  const target = input.target_root === undefined ? current.target_root : validateDestination(input.target_root, 'Target');
  const backup = input.backup_root === undefined ? current.backup_root : validateDestination(input.backup_root, 'Backup');
  const targetBrowse = input.target_browse_root === undefined ? current.target_browse_root : validateBrowseLocation(input.target_browse_root, 'Target browse folder');
  const backupBrowse = input.backup_browse_root === undefined ? current.backup_browse_root : validateBrowseLocation(input.backup_browse_root, 'Backup browse folder');
  if (target && backup) {
    const targetPrefix = target.endsWith(path.sep) ? target : target + path.sep;
    const backupPrefix = backup.endsWith(path.sep) ? backup : backup + path.sep;
    if (target === backup || target.startsWith(backupPrefix) || backup.startsWith(targetPrefix)) {
      throw httpError(400, 'Target and Backup must be separate, non-nested folders');
    }
  }
  const changed = target !== current.target_root || backup !== current.backup_root;
  const at = now();
  const statements = [
    `INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(storageKey(projectToken,'target'))},${sqlQuote(target)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(storageKey(projectToken,'backup'))},${sqlQuote(backup)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(browsePathKey(projectToken,'target'))},${sqlQuote(targetBrowse)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(browsePathKey(projectToken,'backup'))},${sqlQuote(backupBrowse)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.storage.updated',${sqlQuote(at)},${sqlQuote(JSON.stringify({target_root:target,backup_root:backup,target_browse_root:targetBrowse,backup_browse_root:backupBrowse}))});`
  ];
  if (changed) statements.push(`UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved');`);
  transaction(statements);
  return storageFor(projectToken);
}'''
src = replace_function(src, 'saveStorage', 'createStorageFolder', save_storage)

create_folder = r'''async function createStorageFolder(input) {
  const parent = validateBrowseLocation(input.parent, 'Parent folder');
  const name = String(input.name || '').trim();
  if (!name || name === '.' || name === '..' || /[\\/\0]/.test(name)) throw httpError(400, 'Invalid folder name');
  const folder = path.join(parent, name);
  const letter = driveLetterForPath(parent);
  if (letter) {
    windowsCreateDirectory(parent, name);
  } else {
    await fsp.mkdir(folder, { recursive: false });
  }
  return { build: BUILD, path: folder, parent, name, volume: volumeFor(folder) };
}'''
src = replace_function(src, 'createStorageFolder', 'listStorageFolder', create_folder)

list_folder = r'''function listStorageFolder(inputPath) {
  const requested = path.resolve(String(inputPath || '').trim());
  const letter = driveLetterForPath(requested);
  let folders;
  if (letter) {
    if (!windowsDriveLetters().includes(letter)) throw httpError(409, `${letter.toUpperCase()}: is not currently available in Windows`);
    folders = windowsListDirectories(requested).map(name => ({ name, path: path.join(requested, name) }));
  } else {
    const volume = volumeFor(requested);
    if (!volume) throw httpError(400, 'Folder must be on a discovered Windows drive or WSL Home');
    let stat;
    try { stat = fs.statSync(requested); } catch { throw httpError(404, 'Folder does not exist'); }
    if (!stat.isDirectory()) throw httpError(400, 'Path is not a folder');
    folders = fs.readdirSync(requested, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !recycleBinPath(entry.name))
      .map(entry => ({ name: entry.name, path: path.join(requested, entry.name) }));
  }
  folders.sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const volume = volumeFor(requested);
  if (!volume) throw httpError(409, 'Volume is no longer available');
  const parent = requested === volume.path ? null : path.dirname(requested);
  return { build: BUILD, path: requested, parent, volume, folders };
}'''
# listStorageFolder is followed by sourcePreflight rather than another inserted helper.
start = src.index('function listStorageFolder')
end = src.index('\nfunction sourcePreflight', start)
src = src[:start] + list_folder + '\n' + src[end+1:]

src = src.replace("const BUILD = '2026.08.28.sot-turn01-base-3';", "const BUILD = '2026.08.29.sot-turn01-base-13';", 1)

for marker in [
    "const BUILD = '2026.08.29.sot-turn01-base-13';",
    'function windowsListDirectories(value)',
    'function windowsDirectoryExists(value)',
    'target_browse_root:',
    'backup_browse_root:',
    'windowsListDirectories(requested)',
    '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
]:
    if marker not in src:
        raise SystemExit(f'Base-13 contract missing: {marker}')
for rejected in ['normalizeWindowsMountSource', 'mount helper completed but SOT rejected mount state']:
    if rejected in src:
        raise SystemExit(f'rejected mount-authority marker survived: {rejected}')

Path(sys.argv[2]).write_text(src)
print('Base-13 generated from clean Base-3: Windows-native browse + durable picker state')
