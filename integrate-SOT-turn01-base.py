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
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'pre-base marker missing: {marker}')

if 'TURN01_BASE_DIRECT_INTEGRATION' in src:
    raise SystemExit('refusing to integrate an already-integrated candidate')

src = src.replace("const BUILD = '2026.08.24.sot-live-progress-5';", "const BUILD = '2026.08.27.sot-turn01-base-2';", 1)

helpers = r'''
// TURN01_BASE_DIRECT_INTEGRATION
function volumeRoots() {
  const locations = [];
  for (const letter of 'cdefghijklmnopqrstuvwxyz') {
    const root = `/mnt/${letter}`;
    try {
      if (fs.statSync(root).isDirectory() && mountInfo(root).target === root) {
        const stats = fs.statfsSync(root);
        locations.push({
          name: `${letter.toUpperCase()}:`,
          path: root,
          kind: 'drive',
          free_bytes: Number(stats.bavail) * Number(stats.bsize),
          total_bytes: Number(stats.blocks) * Number(stats.bsize),
          mount: mountInfo(root)
        });
      }
    } catch { /* unavailable */ }
  }
  try {
    const home = os.homedir();
    const stats = fs.statfsSync(home);
    locations.push({
      name: 'WSL Home',
      path: home,
      kind: 'wsl',
      free_bytes: Number(stats.bavail) * Number(stats.bsize),
      total_bytes: Number(stats.blocks) * Number(stats.bsize),
      mount: mountInfo(home)
    });
  } catch { /* unavailable */ }
  return locations;
}

function volumeFor(candidate) {
  const resolved = path.resolve(String(candidate || ''));
  return volumeRoots()
    .filter(v => resolved === v.path || resolved.startsWith(v.path + path.sep))
    .sort((a,b) => b.path.length - a.path.length)[0] || null;
}

function validateDestination(candidate, label) {
  const raw = String(candidate || '').trim();
  if (!raw) return '';
  const resolved = path.resolve(raw);
  const volume = volumeFor(resolved);
  if (!volume) throw httpError(400, `${label} must be on a volume currently available to WSL`);
  let stat;
  try { stat = fs.statSync(resolved); }
  catch { throw httpError(400, `${label} folder does not exist`); }
  if (!stat.isDirectory()) throw httpError(400, `${label} must be a folder`);
  try { fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK); }
  catch { throw httpError(400, `${label} folder is not readable/writable`); }
  return resolved;
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
  const at = now();
  transaction([
    `INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(storageKey(projectToken,'target'))},${sqlQuote(target)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(storageKey(projectToken,'backup'))},${sqlQuote(backup)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.storage.updated',${sqlQuote(at)},${sqlQuote(JSON.stringify({target_root:target,backup_root:backup}))});`
  ]);
  return storageFor(projectToken);
}

async function createStorageFolder(input) {
  const parent = path.resolve(String(input.parent || '').trim());
  const volume = volumeFor(parent);
  if (!volume) throw httpError(400, 'Parent must be on a volume currently available to WSL');
  let stat;
  try { stat = fs.statSync(parent); }
  catch { throw httpError(400, 'Parent folder does not exist'); }
  if (!stat.isDirectory()) throw httpError(400, 'Parent must be a folder');
  const name = String(input.name || '').trim();
  if (!name || name === '.' || name === '..' || /[\\/\0]/.test(name)) throw httpError(400, 'Invalid folder name');
  const folder = path.join(parent, name);
  if (volumeFor(folder)?.path !== volume.path) throw httpError(400, 'Folder must remain on the selected volume');
  await fsp.mkdir(folder, { recursive: false });
  return { build: BUILD, path: folder, parent, name, volume };
}

function listStorageFolder(inputPath) {
  const requested = path.resolve(String(inputPath || '').trim());
  const volume = volumeFor(requested);
  if (!volume) throw httpError(400, 'Folder must be on a volume currently available to WSL');
  let stat;
  try { stat = fs.statSync(requested); }
  catch { throw httpError(404, 'Folder does not exist'); }
  if (!stat.isDirectory()) throw httpError(400, 'Path is not a folder');
  const entries = fs.readdirSync(requested, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !recycleBinPath(entry.name))
    .map(entry => ({ name: entry.name, path: path.join(requested, entry.name) }))
    .sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const parent = requested === volume.path ? null : path.dirname(requested);
  return { build: BUILD, path: requested, parent, volume, folders: entries };
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

old_plan = "const config = settings();\n  const targetRoot = config.target_root;\n  const backupRoot = config.backup_root;"
new_plan = "const storage = storageFor(projectToken, true);\n  const targetRoot = storage.target_root;\n  const backupRoot = storage.backup_root;"
count = src.count(old_plan)
if count != 1:
    raise SystemExit(f'expected exactly one global target/backup plan binding, found {count}')
src = src.replace(old_plan, new_plan, 1)

Path(sys.argv[2]).write_text(src)
print('direct integration complete')
