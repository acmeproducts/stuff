'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const core = require('./sot-api-core-pre-base.js');

const BUILD = '2026.08.27.sot-turn01-base-1';

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
function httpError(status, message) { const error = new Error(message); error.status = status; return error; }
function sqlQuote(value) { return `'${String(value ?? '').replace(/'/g, "''")}'`; }
function now() { return new Date().toISOString(); }
function requestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) { reject(httpError(413, 'request too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(httpError(400, 'invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
function sqliteRows(sql) {
  const out = core._test.sqlite(sql, true);
  return Array.isArray(out) ? out : [];
}
function sqliteExec(sql) { core._test.sqlite(sql, false); }
function mountInfo(value) {
  try {
    const output = execFileSync('findmnt', ['-T', String(value), '-n', '-o', 'TARGET,FSTYPE,SOURCE'], { encoding: 'utf8', timeout: 2500 }).trim();
    const parts = output.split(/\s+/);
    return { target: parts[0] || '', fstype: parts[1] || '', source: parts.slice(2).join(' ') };
  } catch { return { target: '', fstype: '', source: '' }; }
}
function volumeRoots() {
  const locations = [];
  for (const letter of 'cdefghijklmnopqrstuvwxyz') {
    const root = `/mnt/${letter}`;
    try {
      if (fs.statSync(root).isDirectory() && mountInfo(root).target === root) {
        const stats = fs.statfsSync(root);
        locations.push({
          name: `${letter.toUpperCase()}:`, path: root, kind: 'drive',
          free_bytes: Number(stats.bavail) * Number(stats.bsize),
          total_bytes: Number(stats.blocks) * Number(stats.bsize)
        });
      }
    } catch { /* unavailable */ }
  }
  try {
    const home = os.homedir(), stats = fs.statfsSync(home);
    locations.push({ name: 'WSL Home', path: home, kind: 'wsl', free_bytes: Number(stats.bavail) * Number(stats.bsize), total_bytes: Number(stats.blocks) * Number(stats.bsize) });
  } catch { /* unavailable */ }
  return locations;
}
function volumeFor(candidate) {
  const resolved = path.resolve(String(candidate || ''));
  return volumeRoots().filter(v => resolved === v.path || resolved.startsWith(v.path + path.sep)).sort((a,b)=>b.path.length-a.path.length)[0] || null;
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
function storageKey(token, kind) { return `project.${token}.${kind}_root`; }
function storageFor(token) {
  if (!core._test.projectDetail(token)) throw httpError(404, 'project not found');
  const keys = [storageKey(token,'target'), storageKey(token,'backup')];
  const rows = sqliteRows(`SELECT key,value,updated_at FROM settings WHERE key IN (${keys.map(sqlQuote).join(',')});`);
  const map = Object.fromEntries(rows.map(r => [r.key, r]));
  const target = map[keys[0]]?.value || '';
  const backup = map[keys[1]]?.value || '';
  return {
    build: BUILD,
    project_token: token,
    target_root: target,
    backup_root: backup,
    target_volume: target ? volumeFor(target) : null,
    backup_volume: backup ? volumeFor(backup) : null,
    updated_at: [map[keys[0]]?.updated_at, map[keys[1]]?.updated_at].filter(Boolean).sort().at(-1) || null
  };
}
function saveStorage(token, input) {
  if (!core._test.projectDetail(token)) throw httpError(404, 'project not found');
  const current = storageFor(token);
  const target = input.target_root === undefined ? current.target_root : validateDestination(input.target_root, 'Target');
  const backup = input.backup_root === undefined ? current.backup_root : validateDestination(input.backup_root, 'Backup');
  if (target && backup && target === backup) throw httpError(400, 'Target and Backup cannot be the same folder');
  const at = now();
  const values = [[storageKey(token,'target'),target],[storageKey(token,'backup'),backup]];
  sqliteExec(`BEGIN IMMEDIATE;\n${values.map(([key,value])=>`INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(key)},${sqlQuote(value)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`).join('\n')}\nINSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(token)},'project.storage.updated',${sqlQuote(at)},${sqlQuote(JSON.stringify({target_root:target,backup_root:backup}))});\nCOMMIT;`);
  return storageFor(token);
}
async function createFolder(input) {
  const parent = path.resolve(String(input.parent || ''));
  const volume = volumeFor(parent);
  if (!volume) throw httpError(400, 'Parent must be on a volume currently available to WSL');
  let stat;
  try { stat = fs.statSync(parent); } catch { throw httpError(400, 'Parent folder does not exist'); }
  if (!stat.isDirectory()) throw httpError(400, 'Parent must be a folder');
  const name = String(input.name || '').trim();
  if (!name || name === '.' || name === '..' || /[\\/\0]/.test(name)) throw httpError(400, 'Invalid folder name');
  const folder = path.join(parent, name);
  if (volumeFor(folder)?.path !== volume.path) throw httpError(400, 'Folder must remain on the selected volume');
  await fs.promises.mkdir(folder, { recursive: false });
  return { build: BUILD, path: folder, parent, name, volume };
}

async function handle(req, res, inputUrl) {
  const url = inputUrl instanceof URL ? inputUrl : new URL(inputUrl, 'http://127.0.0.1');
  let pathname = url.pathname;
  if (pathname.startsWith('/report/api/sot/')) pathname = pathname.slice('/report'.length);
  try {
    if (pathname === '/api/sot/turn01/volumes' && req.method === 'GET') {
      json(res, 200, { build: BUILD, volumes: volumeRoots() }); return true;
    }
    if (pathname === '/api/sot/turn01/fs/folder' && req.method === 'POST') {
      json(res, 201, await createFolder(await requestBody(req))); return true;
    }
    let match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/storage$/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      if (req.method === 'GET') { json(res, 200, storageFor(token)); return true; }
      if (req.method === 'PUT') { json(res, 200, saveStorage(token, await requestBody(req))); return true; }
    }
    return await core.handle(req, res, inputUrl);
  } catch (error) {
    json(res, error.status || 500, { error: error.message, build: BUILD });
    return true;
  }
}

module.exports = {
  ...core,
  handle,
  BUILD,
  _test: { ...core._test, volumeRoots, storageFor, saveStorage }
};
