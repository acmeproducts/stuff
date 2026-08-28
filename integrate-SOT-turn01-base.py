#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: integrate-SOT-turn01-base.py <source-sot-api.js> <output-sot-api.js>')

src = Path(sys.argv[1]).read_text()

required = [
    "const BUILD = '2026.08.24.sot-live-progress-5';",
    'const EXPECTED_MIGRATION = 4;',
    'function sourcePreflight(source) {',
    "if (pathname === '/api/sot/health'",
    'function generatePlan(projectToken) {',
    'async function executePlan(planId) {',
    'function startExecution(projectToken) {',
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'pre-base marker missing: {marker}')

if 'TURN01_BASE_DIRECT_INTEGRATION' in src:
    raise SystemExit('refusing to integrate an already-integrated candidate')

src = src.replace("const BUILD = '2026.08.24.sot-live-progress-5';", "const BUILD = '2026.08.28.sot-turn01-base-3';", 1)

helpers = r'''
// TURN01_BASE_DIRECT_INTEGRATION
function windowsDriveLetters() {
  try {
    const output = execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','"
    ], { encoding: 'utf8', timeout: 5000, maxBuffer: 1024 * 1024 }).trim();
    return [...new Set(output.split(',').map(v => v.trim().toLowerCase()).filter(v => /^[a-z]$/.test(v)))].sort();
  } catch {
    return [];
  }
}

function driveLetterForPath(value) {
  const match = path.resolve(String(value || '')).match(/^\/mnt\/([a-z])(?:\/|$)/i);
  return match ? match[1].toLowerCase() : null;
}

function driveMounted(letter) {
  const root = `/mnt/${String(letter).toLowerCase()}`;
  const mount = mountInfo(root);
  return mount.target === root;
}

function ensureWindowsDriveMounted(letter) {
  const lower = String(letter || '').toLowerCase();
  if (!/^[a-z]$/.test(lower)) throw httpError(400, 'invalid Windows drive');
  const available = windowsDriveLetters();
  if (!available.includes(lower)) throw httpError(409, `${lower.toUpperCase()}: is not currently available in Windows`);
  const root = `/mnt/${lower}`;
  if (!driveMounted(lower)) {
    try {
      execFileSync('sudo', ['-n', '/usr/local/sbin/sot-mount-drive', lower.toUpperCase()], {
        encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024
      });
    } catch (error) {
      throw httpError(409, `Could not mount ${lower.toUpperCase()}: into WSL: ${String(error.stderr || error.message || error).trim()}`);
    }
  }
  if (!driveMounted(lower)) throw httpError(409, `${lower.toUpperCase()}: is visible in Windows but is not mounted in WSL`);
  return root;
}

function volumeRecord(letter) {
  const lower = String(letter).toLowerCase();
  const root = `/mnt/${lower}`;
  const mounted = driveMounted(lower);
  let free = null, total = null;
  if (mounted) {
    try {
      const stats = fs.statfsSync(root);
      free = Number(stats.bavail) * Number(stats.bsize);
      total = Number(stats.blocks) * Number(stats.bsize);
    } catch { /* live status remains mounted even if statfs is unavailable */ }
  }
  return {
    name: `${lower.toUpperCase()}:`,
    path: root,
    kind: 'drive',
    mounted,
    free_bytes: free,
    total_bytes: total,
    mount: mounted ? mountInfo(root) : null
  };
}

function volumeRoots() {
  const locations = windowsDriveLetters().map(volumeRecord);
  try {
    const home = os.homedir();
    const stats = fs.statfsSync(home);
    locations.push({
      name: 'WSL Home',
      path: home,
      kind: 'wsl',
      mounted: true,
      free_bytes: Number(stats.bavail) * Number(stats.bsize),
      total_bytes: Number(stats.blocks) * Number(stats.bsize),
      mount: mountInfo(home)
    });
  } catch { /* unavailable */ }
  return locations;
}

function volumeFor(candidate, mountIfNeeded = false) {
  const resolved = path.resolve(String(candidate || ''));
  const letter = driveLetterForPath(resolved);
  if (letter) {
    const available = windowsDriveLetters();
    if (!available.includes(letter)) return null;
    if (mountIfNeeded) ensureWindowsDriveMounted(letter);
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
}

function validateDestination(candidate, label) {
  const raw = String(candidate || '').trim();
  if (!raw) return '';
  const resolved = path.resolve(raw);
  const volume = volumeFor(resolved, true);
  if (!volume) throw httpError(400, `${label} must be on a Windows drive currently available to Windows/WSL or WSL Home`);
  let stat;
  try { stat = fs.statSync(resolved); }
  catch { throw httpError(400, `${label} folder does not exist`); }
  if (!stat.isDirectory()) throw httpError(400, `${label} must be a folder`);
  try { fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK); }
  catch { throw httpError(400, `${label} folder is not readable/writable`); }
  return resolved;
}

function pathWithin(root, candidate) {
  const base = path.resolve(String(root || ''));
  const value = path.resolve(String(candidate || ''));
  return value === base || value.startsWith(base.endsWith(path.sep) ? base : base + path.sep);
}

function storageKey(projectToken, kind) {
  return `project.${projectToken}.${kind}_root`;
}

function storageFor(projectToken, revalidate = false) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const targetKey = storageKey(projectToken, 'target');
  const backupKey = storageKey(projectToken, 'backup');
  const stored = rows(`SELECT key,value,updated_at FROM settings WHERE key IN (${sqlQuote(targetKey)},${sqlQuote(backupKey)});`);
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
    target_volume: target ? volumeFor(target) : null,
    backup_volume: backup ? volumeFor(backup) : null,
    target_available: !target || Boolean(volumeFor(target)),
    backup_available: !backup || Boolean(volumeFor(backup)),
    updated_at: [map[targetKey]?.updated_at, map[backupKey]?.updated_at].filter(Boolean).sort().at(-1) || null
  };
}

function saveStorage(projectToken, input) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const current = storageFor(projectToken);
  const target = input.target_root === undefined ? current.target_root : validateDestination(input.target_root, 'Target');
  const backup = input.backup_root === undefined ? current.backup_root : validateDestination(input.backup_root, 'Backup');
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
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.storage.updated',${sqlQuote(at)},${sqlQuote(JSON.stringify({target_root:target,backup_root:backup}))});`
  ];
  if (changed) statements.push(`UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved');`);
  transaction(statements);
  return storageFor(projectToken);
}

async function createStorageFolder(input) {
  const parent = path.resolve(String(input.parent || '').trim());
  const volume = volumeFor(parent, true);
  if (!volume) throw httpError(400, 'Parent must be on a Windows drive currently available to Windows/WSL or WSL Home');
  let stat;
  try { stat = fs.statSync(parent); }
  catch { throw httpError(400, 'Parent folder does not exist'); }
  if (!stat.isDirectory()) throw httpError(400, 'Parent must be a folder');
  const name = String(input.name || '').trim();
  if (!name || name === '.' || name === '..' || /[\\/\0]/.test(name)) throw httpError(400, 'Invalid folder name');
  const folder = path.join(parent, name);
  const destinationVolume = volumeFor(folder, true);
  if (!destinationVolume || destinationVolume.path !== volume.path) throw httpError(400, 'Folder must remain on the selected volume');
  await fsp.mkdir(folder, { recursive: false });
  return { build: BUILD, path: folder, parent, name, volume: destinationVolume };
}

function listStorageFolder(inputPath) {
  const requested = path.resolve(String(inputPath || '').trim());
  const volume = volumeFor(requested, true);
  if (!volume) throw httpError(400, 'Folder must be on a Windows drive currently available to Windows/WSL or WSL Home');
  let stat;
  try { stat = fs.statSync(requested); }
  catch { throw httpError(404, 'Folder does not exist'); }
  if (!stat.isDirectory()) throw httpError(400, 'Path is not a folder');
  const entries = fs.readdirSync(requested, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !recycleBinPath(entry.name))
    .map(entry => ({ name: entry.name, path: path.join(requested, entry.name) }))
    .sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const parent = requested === volume.path ? null : path.dirname(requested);
  return { build: BUILD, path: requested, parent, volume: volumeFor(requested), folders: entries };
}
'''

src = src.replace('function sourcePreflight(source) {', helpers + '\nfunction sourcePreflight(source) {', 1)

route_marker = "if (pathname === '/api/sot/health'"
idx = src.index(route_marker)
route_block = r'''if (pathname === '/api/sot/turn01/volumes' && req.method === 'GET') {
      json(res, 200, { build: BUILD, volumes: volumeRoots() }); return true;
    }
    if (pathname === '/api/sot/turn01/fs' && req.method === 'GET') {
      json(res, 200, listStorageFolder(url.searchParams.get('path') || os.homedir())); return true;
    }
    if (pathname === '/api/sot/turn01/fs/folder' && req.method === 'POST') {
      json(res, 201, await createStorageFolder(await requestBody(req))); return true;
    }
    let storageMatch = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/storage$/);
    if (storageMatch) {
      const projectToken = decodeURIComponent(storageMatch[1]);
      if (req.method === 'GET') { json(res, 200, storageFor(projectToken)); return true; }
      if (req.method === 'PUT') { json(res, 200, saveStorage(projectToken, await requestBody(req))); return true; }
    }
    '''
src = src[:idx] + route_block + src[idx:]

# Bind plan generation to the selected project storage instead of global settings.
start = src.index('function generatePlan(projectToken) {')
end = src.index('\nfunction latestPlan(projectToken)', start)
plan = src[start:end]
if plan.count('const config = settings();') != 1:
    raise SystemExit('generatePlan global settings binding changed unexpectedly')
plan = plan.replace('const config = settings();', 'const storage = storageFor(projectToken, true);', 1)
plan = plan.replace('config.target_root', 'storage.target_root').replace('config.backup_root', 'storage.backup_root')
src = src[:start] + plan + src[end:]

# Fail synchronously before marking the immutable plan executing if storage changed or vanished.
start = src.index('function startExecution(projectToken) {')
end = src.index('\nfunction certify(projectToken)', start)
starter = src[start:end]
needle = "  if (Number(plan.evidence_revision) !== Number(project.evidence_revision)) throw httpError(409, 'plan is stale');\n  const at = now();"
if starter.count(needle) != 1:
    raise SystemExit('startExecution validation point changed unexpectedly')
replacement = "  if (Number(plan.evidence_revision) !== Number(project.evidence_revision)) throw httpError(409, 'plan is stale');\n  const storage = storageFor(projectToken, true);\n  for (const item of plan.items) {\n    if (item.action === 'establish_target_backup' && !pathWithin(storage.target_root, item.target_path)) throw httpError(409, 'plan Target no longer matches project Target; regenerate plan');\n    if (item.action !== 'none' && !pathWithin(storage.backup_root, item.backup_path)) throw httpError(409, 'plan Backup no longer matches project Backup; regenerate plan');\n  }\n  const at = now();"
starter = starter.replace(needle, replacement, 1)
src = src[:start] + starter + src[end:]

# Revalidate once more inside the worker to close the cutover/race window.
start = src.index('async function executePlan(planId) {')
end = src.index('\nfunction startExecution(projectToken)', start)
execution = src[start:end]
needle = "  const projectToken = plan.project_token;\n  try {"
if execution.count(needle) != 1:
    raise SystemExit('executePlan insertion point changed unexpectedly')
replacement = "  const projectToken = plan.project_token;\n  try {\n    const storage = storageFor(projectToken, true);\n    for (const item of plan.items) {\n      if (item.action === 'establish_target_backup' && !pathWithin(storage.target_root, item.target_path)) throw httpError(409, 'plan Target no longer matches project Target; regenerate plan');\n      if (item.action !== 'none' && !pathWithin(storage.backup_root, item.backup_path)) throw httpError(409, 'plan Backup no longer matches project Backup; regenerate plan');\n    }"
execution = execution.replace(needle, replacement, 1)
src = src[:start] + execution + src[end:]

Path(sys.argv[2]).write_text(src)
print('direct integration complete: dynamic Windows drives + project storage')
