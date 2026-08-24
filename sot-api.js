'use strict';

const crypto = require('crypto');
const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { execFileSync, spawn, spawnSync } = require('child_process');

const VERSION = '1.0.0';
const BUILD = '2026.08.23.sot-observability-4';
const EXPECTED_MIGRATION = 3;
const SOT_ROOT = process.env.SOT_ROOT || path.join(os.homedir(), '.openclaw', 'sot');
const DATABASE_PATH = process.env.SOT_DB_PATH || path.join(SOT_ROOT, 'sot.sqlite');
const SNAPSHOT_DIR = process.env.SOT_SNAPSHOT_DIR || path.join(SOT_ROOT, 'db-snapshots');
const SQLITE_ADAPTER = process.env.SOT_SQLITE_ADAPTER || path.join(__dirname, 'sot-sqlite.py');
const SQLITE3_AVAILABLE = !spawnSync('sqlite3', ['-version'], { encoding: 'utf8' }).error;
const STEP_NAMES = { 1: 'project', 2: 'sources', 3: 'process', 4: 'review', 5: 'plan', 6: 'execute', 7: 'certify' };
const runtime = {
  schemaReady: false,
  jobs: new Map(),
  progressEvents: new Map()
};
let workerPauseSignal = false;
let workerStopSignal = false;
if (process.env.SOT_WORKER_PROCESS === '1' && process.env.SOT_WORKER_KIND === 'index') {
  process.on('SIGUSR1', () => { workerPauseSignal = true; });
  process.on('SIGUSR2', () => { workerStopSignal = true; });
}

function now() { return new Date().toISOString(); }
function randomId(bytes = 16) { return crypto.randomBytes(bytes).toString('hex'); }
function sha(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function sqlQuote(value) { return `'${String(value ?? '').replace(/'/g, "''")}'`; }
function safeIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw httpError(400, 'invalid identifier');
  return value;
}
function httpError(status, message) { const error = new Error(message); error.status = status; return error; }

function sqlite(script, json = false, databasePath = DATABASE_PATH) {
  const command = SQLITE3_AVAILABLE ? 'sqlite3' : 'python3';
  const args = SQLITE3_AVAILABLE
    ? (json ? ['-json', databasePath] : [databasePath])
    : [SQLITE_ADAPTER, databasePath, ...(json ? ['--json'] : [])];
  const result = spawnSync(command, args, {
    input: SQLITE3_AVAILABLE ? `.bail on\n.timeout 10000\n${script}\n` : `${script}\n`,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024
  });
  if (result.error) throw new Error(`SQLite process failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `sqlite3 exited ${result.status}`).trim());
  const output = (result.stdout || '').trim();
  return json ? (output ? JSON.parse(output) : []) : output;
}

function rawRows(query) { return sqlite(query, true); }

function ensureSchema() {
  if (runtime.schemaReady) return;
  if (!fs.existsSync(DATABASE_PATH) || fs.statSync(DATABASE_PATH).size === 0) {
    throw new Error(`SOT database has not been created: ${DATABASE_PATH}`);
  }
  const tables = rawRows("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations';");
  if (tables.length !== 1) throw new Error('SOT schema is unmanaged: schema_migrations is missing');
  const applied = rawRows('SELECT version,name,checksum_sha256 FROM schema_migrations ORDER BY version;');
  const version = Number(applied.at(-1)?.version || 0);
  if (version !== EXPECTED_MIGRATION) {
    throw new Error(`SOT schema version ${version} does not match required version ${EXPECTED_MIGRATION}`);
  }
  const migrationDirectory = path.join(__dirname, 'sot-db', 'migrations');
  const available = fs.readdirSync(migrationDirectory).filter(name => /^\d{3}-[a-z0-9][a-z0-9-]*\.sql$/i.test(name)).sort();
  if (available.length !== applied.length) throw new Error('SOT migration set does not match the database');
  for (let index = 0; index < available.length; index += 1) {
    const name = available[index], row = applied[index], versionFromName = Number(name.slice(0, 3));
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(path.join(migrationDirectory, name), 'utf8')).digest('hex');
    if (Number(row.version) !== versionFromName || row.name !== name || row.checksum_sha256 !== checksum) {
      throw new Error(`published migration changed: ${name}`);
    }
  }
  runtime.schemaReady = true;
  if (process.env.SOT_WORKER_PROCESS === '1') return;
  const interruptedAt = now();
  sqlite(`PRAGMA foreign_keys=ON;
    BEGIN IMMEDIATE;
    INSERT INTO events(project_token,event_type,created_at,detail_json)
      SELECT project_token,'processing.interrupted',${sqlQuote(interruptedAt)},'{"reason":"Service restarted during processing","run_id":"'||run_id||'"}' FROM processing_runs WHERE state IN ('Queued','WIP');
    UPDATE processing_workers SET phase='interrupted',updated_at=${sqlQuote(interruptedAt)} WHERE run_id IN (SELECT run_id FROM processing_runs WHERE state IN ('Queued','WIP'));
    UPDATE processing_runs SET state='Interrupted',phase='interrupted',worker_pid=NULL,pause_requested=0,stop_requested=0,error_message='Service restarted during processing',updated_at=${sqlQuote(interruptedAt)},ended_at=${sqlQuote(interruptedAt)} WHERE state IN ('Queued','WIP');
    UPDATE projects SET workflow_step=3,status='Interrupted',updated_at=${sqlQuote(interruptedAt)} WHERE project_token IN (SELECT project_token FROM processing_runs WHERE state='Interrupted' AND ended_at=${sqlQuote(interruptedAt)});
    UPDATE projects SET workflow_step=6,status='ExecutionInterrupted',updated_at=${sqlQuote(interruptedAt)} WHERE project_token IN (SELECT project_token FROM plans WHERE state='executing');
    UPDATE plan_items SET state='error',error_message='Service restarted during execution' WHERE plan_id IN (SELECT plan_id FROM plans WHERE state='executing') AND state='WIP';
    UPDATE plans SET state='error' WHERE state='executing';
    COMMIT;`);
}

function rows(query) { ensureSchema(); return rawRows(query); }
function execute(script) { ensureSchema(); return sqlite(`PRAGMA foreign_keys=ON;\n${script}`); }
function transaction(statements) {
  const list = Array.isArray(statements) ? statements : [statements];
  return execute(`BEGIN IMMEDIATE;\n${list.join('\n')}\nCOMMIT;`);
}

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function requestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) { reject(httpError(413, 'request too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(httpError(400, 'invalid JSON body')); }
    });
    req.on('error', reject);
  });
}

function event(projectToken, type, detail = {}) {
  execute(`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${projectToken ? sqlQuote(projectToken) : 'NULL'},${sqlQuote(type)},${sqlQuote(now())},${sqlQuote(JSON.stringify(detail))});`);
}

function activityLog(projectToken = '', requestedLimit = 100) {
  const limit = Math.max(1, Math.min(250, Number(requestedLimit) || 100));
  if (projectToken && !projectRow(projectToken)) throw httpError(404, 'project not found');
  const where = projectToken ? `WHERE e.project_token=${sqlQuote(projectToken)}` : '';
  const activity = rows(`SELECT e.event_id,e.project_token,COALESCE(p.project_name,'SOT') project_name,e.event_type,e.created_at,e.detail_json
    FROM events e LEFT JOIN projects p ON p.project_token=e.project_token
    ${where} ORDER BY e.event_id DESC LIMIT ${limit};`).map(item => {
    let detail = {};
    try { detail = JSON.parse(item.detail_json || '{}'); }
    catch { detail = { raw: item.detail_json || '' }; }
    const { detail_json, ...record } = item;
    return { ...record, detail };
  });
  return { build: BUILD, project_token: projectToken || null, events: activity };
}

function processingProgressEvent(runId, projectToken, type, force = false) {
  const key = `${runId}:${type}`;
  const timestamp = Date.now();
  if (!force && timestamp - Number(runtime.progressEvents.get(key) || 0) < 3000) return;
  runtime.progressEvents.set(key, timestamp);
  const progress = rows(`SELECT run_id,state,phase,folder_count,top_level_item_count,files_discovered,bytes_discovered,files_processed,bytes_processed,hashes_reused,hashes_computed,warning_count,error_count,current_source,current_item,updated_at FROM processing_runs WHERE run_id=${sqlQuote(runId)} LIMIT 1;`)[0];
  if (progress) event(projectToken, type, progress);
}

function settings() {
  return Object.fromEntries(rows('SELECT key,value FROM settings ORDER BY key;').map(item => [item.key, item.value]));
}

function configure(input) {
  const current = settings();
  const targetRoot = input.target_root == null ? current.target_root : path.resolve(String(input.target_root || ''));
  const backupRoot = input.backup_root == null ? current.backup_root : path.resolve(String(input.backup_root || ''));
  const workers = input.hash_workers == null ? Number(current.hash_workers || 4) : Number(input.hash_workers);
  if (!Number.isInteger(workers) || workers < 1 || workers > 16) throw httpError(400, 'hash_workers must be an integer from 1 to 16');
  if ((targetRoot || backupRoot) && (!targetRoot || !backupRoot)) throw httpError(400, 'target_root and backup_root must be configured together');
  if (targetRoot && backupRoot) {
    const targetPrefix = targetRoot.endsWith(path.sep) ? targetRoot : targetRoot + path.sep;
    const backupPrefix = backupRoot.endsWith(path.sep) ? backupRoot : backupRoot + path.sep;
    if (targetRoot === backupRoot || targetRoot.startsWith(backupPrefix) || backupRoot.startsWith(targetPrefix)) {
      throw httpError(400, 'Target and Backup must be separate, non-nested paths');
    }
  }
  const at = now();
  transaction([
    `INSERT INTO settings(key,value,updated_at) VALUES('target_root',${sqlQuote(targetRoot)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO settings(key,value,updated_at) VALUES('backup_root',${sqlQuote(backupRoot)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`,
    `INSERT INTO settings(key,value,updated_at) VALUES('hash_workers',${sqlQuote(workers)},${sqlQuote(at)}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at;`
  ]);
  return settings();
}

function recycleBinPath(value) { return /(^|[\\/])\$RECYCLE\.BIN([\\/]|$)/i.test(String(value || '')); }
function normalizedSourcePath(value) {
  const raw = String(value || '').trim();
  if (!raw) throw httpError(400, 'source path is required');
  return path.resolve(raw);
}
function windowsDriveRoot(value) {
  const match = String(value || '').match(/^\/mnt\/([a-z])(?:\/|$)/i);
  return match ? `/mnt/${match[1].toLowerCase()}` : null;
}
function mountInfo(value) {
  try {
    const output = execFileSync('findmnt', ['-T', String(value), '-n', '-o', 'TARGET,FSTYPE,SOURCE'], {
      encoding: 'utf8', timeout: 2500, maxBuffer: 1024 * 1024
    }).trim();
    const parts = output.split(/\s+/);
    return { target: parts[0] || '', fstype: parts[1] || '', source: parts.slice(2).join(' ') };
  } catch (error) {
    return { target: '', fstype: '', source: '', error: String(error.message || error) };
  }
}

function sourcePreflight(source) {
  const sourcePath = String(source.normalized_path || source.path || '');
  if (recycleBinPath(sourcePath)) {
    return { source_id: source.source_id, path: sourcePath, status: 'ignored_recycle_bin', blocking: false, warning: 'Legacy $RECYCLE.BIN source is skipped.' };
  }
  const driveRoot = windowsDriveRoot(sourcePath);
  const mount = driveRoot ? mountInfo(sourcePath) : null;
  if (driveRoot && mount.target !== driveRoot) {
    return { source_id: source.source_id, path: sourcePath, status: 'not_mounted', blocking: true, message: `${driveRoot} is not mounted`, mount };
  }
  let stat = null;
  try { stat = fs.statSync(sourcePath); }
  catch { return { source_id: source.source_id, path: sourcePath, status: 'missing', blocking: true, message: 'Source path does not exist.' }; }
  if (!stat.isDirectory()) return { source_id: source.source_id, path: sourcePath, status: 'unreadable', blocking: true, message: 'Source path is not a directory.' };
  try { fs.accessSync(sourcePath, fs.constants.R_OK); }
  catch { return { source_id: source.source_id, path: sourcePath, status: 'unreadable', blocking: true, message: 'Source path is not readable.' }; }
  return { source_id: source.source_id, path: sourcePath, status: 'ready', blocking: false, mount };
}

function activeSources(projectToken) {
  return rows(`SELECT source_id,project_token,normalized_path,operator_label,operator_note,preflight_status,preflight_message,last_preflight_at,created_at,updated_at FROM sources WHERE project_token=${sqlQuote(projectToken)} AND removed_at IS NULL ORDER BY created_at,source_id;`);
}

function projectRow(projectToken) {
  return rows(`SELECT * FROM projects WHERE project_token=${sqlQuote(projectToken)} AND deleted_at IS NULL LIMIT 1;`)[0] || null;
}

function listProjects(query = '') {
  const needle = String(query || '').trim().toLowerCase();
  const where = needle ? ` AND (lower(project_name) LIKE ${sqlQuote(`%${needle}%`)} OR lower(project_note) LIKE ${sqlQuote(`%${needle}%`)})` : '';
  const projects = rows(`WITH latest AS (
      SELECT r.*,ROW_NUMBER() OVER(PARTITION BY r.project_token ORDER BY r.started_at DESC) choice
      FROM processing_runs r
    ) SELECT p.*,
    (SELECT COUNT(*) FROM sources s WHERE s.project_token=p.project_token AND s.removed_at IS NULL) source_count,
    r.run_id processing_run_id,r.state processing_state,r.phase processing_phase,
    r.bytes_discovered size_bytes,r.folder_count,r.top_level_item_count,r.files_discovered,r.files_processed,r.bytes_processed,
    r.hashes_reused,r.hashes_computed,r.error_count processing_errors,r.warning_count processing_warnings,
    r.current_source,r.current_item,r.updated_at progress_updated_at,r.ended_at indexed_at,
    (SELECT COUNT(*) FROM processing_workers pw WHERE pw.run_id=r.run_id AND pw.phase<>'idle' AND r.state IN ('Queued','WIP')) active_workers,
    (SELECT group_concat(CAST(pw.worker_id AS TEXT)||char(31)||pw.phase||char(31)||pw.path||char(31)||pw.item,char(30))
      FROM processing_workers pw WHERE pw.run_id=r.run_id AND pw.phase<>'idle' AND r.state IN ('Queued','WIP')) worker_activity
    FROM projects p LEFT JOIN latest r ON r.project_token=p.project_token AND r.choice=1
    WHERE p.deleted_at IS NULL${where} ORDER BY p.updated_at DESC, p.project_name COLLATE NOCASE;`);
  return projects.map(project => {
    const { worker_activity: workerActivity, ...summary } = project;
    return {
      ...summary,
      workers: String(workerActivity || '').split(String.fromCharCode(30)).filter(Boolean).map(record => {
        const [workerId, phase, workerPath, item] = record.split(String.fromCharCode(31));
        return { worker_id: Number(workerId), phase, path: workerPath, item };
      })
    };
  });
}

function projectDetail(projectToken) {
  const project = projectRow(projectToken);
  if (!project) return null;
  const latestRun = rows(`SELECT * FROM processing_runs WHERE project_token=${sqlQuote(projectToken)} ORDER BY started_at DESC LIMIT 1;`)[0] || null;
  return { ...project, notes: project.project_note, sources: activeSources(projectToken), processing: latestRun };
}

function createProject(input) {
  const name = String(input.project_name || '').trim();
  if (!name) throw httpError(400, 'project_name is required');
  const projectToken = randomId(12);
  const at = now();
  transaction([
    `INSERT INTO projects(project_token,project_name,project_note,workflow_step,scope_revision,evidence_revision,status,created_at,updated_at) VALUES(${sqlQuote(projectToken)},${sqlQuote(name)},${sqlQuote(input.project_note ?? input.notes ?? '')},1,0,0,'Pending',${sqlQuote(at)},${sqlQuote(at)});`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.created',${sqlQuote(at)},'{}');`
  ]);
  if (Array.isArray(input.sources) && input.sources.length) replaceSources(projectToken, input.sources);
  return projectDetail(projectToken);
}

function updateProject(projectToken, input) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const name = input.project_name == null ? project.project_name : String(input.project_name).trim();
  const note = input.project_note == null && input.notes == null ? project.project_note : String(input.project_note ?? input.notes ?? '');
  if (!name) throw httpError(400, 'project_name is required');
  const at = now();
  transaction([
    `UPDATE projects SET project_name=${sqlQuote(name)},project_note=${sqlQuote(note)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.updated',${sqlQuote(at)},${sqlQuote(JSON.stringify({ project_name: name }))});`
  ]);
  return projectDetail(projectToken);
}

function deleteProject(projectToken) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const at = now();
  transaction([
    `UPDATE projects SET deleted_at=${sqlQuote(at)},status='Deleted',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved');`,
    `UPDATE certifications SET status='invalidated',invalidated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND status='certified';`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.deleted',${sqlQuote(at)},'{}');`
  ]);
  return { project_token: projectToken, deleted_at: at };
}

function replaceSources(projectToken, inputSources) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  if (!Array.isArray(inputSources)) throw httpError(400, 'sources must be an array');
  const at = now();
  const desired = [];
  const seen = new Set();
  for (const input of inputSources) {
    const raw = typeof input === 'string' ? input : input.path ?? input.normalized_path;
    const sourcePath = normalizedSourcePath(raw);
    if (recycleBinPath(sourcePath)) throw httpError(400, '$RECYCLE.BIN cannot be added as a source');
    if (seen.has(sourcePath)) continue;
    seen.add(sourcePath);
    desired.push({
      source_id: sha(`${projectToken}\0${sourcePath}`).slice(0, 32),
      path: sourcePath,
      label: String((typeof input === 'object' && (input.operator_label ?? input.name)) || path.basename(sourcePath) || sourcePath),
      note: String((typeof input === 'object' && (input.operator_note ?? input.note)) || '')
    });
  }
  const keep = desired.length ? desired.map(item => sqlQuote(item.path)).join(',') : '';
  const statements = [
    desired.length
      ? `UPDATE sources SET removed_at=${sqlQuote(at)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND removed_at IS NULL AND normalized_path NOT IN (${keep});`
      : `UPDATE sources SET removed_at=${sqlQuote(at)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND removed_at IS NULL;`
  ];
  for (const source of desired) {
    statements.push(`INSERT INTO sources(source_id,project_token,normalized_path,operator_label,operator_note,preflight_status,preflight_message,created_at,updated_at,removed_at) VALUES(${sqlQuote(source.source_id)},${sqlQuote(projectToken)},${sqlQuote(source.path)},${sqlQuote(source.label)},${sqlQuote(source.note)},'unknown','',${sqlQuote(at)},${sqlQuote(at)},NULL) ON CONFLICT(project_token,normalized_path) DO UPDATE SET operator_label=excluded.operator_label,operator_note=excluded.operator_note,preflight_status='unknown',preflight_message='',updated_at=excluded.updated_at,removed_at=NULL;`);
  }
  statements.push(
    `UPDATE projects SET workflow_step=2,scope_revision=scope_revision+1,status='ScopeChanged',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved','complete');`,
    `UPDATE certifications SET status='invalidated',invalidated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND status='certified';`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'sources.replaced',${sqlQuote(at)},${sqlQuote(JSON.stringify({ count: desired.length }))});`
  );
  transaction(statements);
  return activeSources(projectToken);
}

function preflightProject(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const sources = activeSources(projectToken);
  const results = sources.map(sourcePreflight);
  const at = now();
  if (results.length) transaction(results.map(result => `UPDATE sources SET preflight_status=${sqlQuote(result.status)},preflight_message=${sqlQuote(result.message || result.warning || '')},last_preflight_at=${sqlQuote(at)},updated_at=${sqlQuote(at)} WHERE source_id=${sqlQuote(result.source_id)};`));
  const blocking = results.filter(result => result.blocking);
  const warnings = results.filter(result => !result.blocking && (result.warning || result.status !== 'ready'));
  return {
    build: BUILD,
    project_token: projectToken,
    project_name: project.project_name,
    ready: results.length > 0 && blocking.length === 0,
    blocking_count: blocking.length + (results.length ? 0 : 1),
    warning_count: warnings.length,
    message: results.length ? '' : 'Add at least one source.',
    checked_at: at,
    sources: results
  };
}

function roots() {
  const locations = [];
  for (const letter of 'cdefghijklmnopqrstuvwxyz') {
    const root = `/mnt/${letter}`;
    try { if (fs.statSync(root).isDirectory() && mountInfo(root).target === root) locations.push({ name: `${letter.toUpperCase()}:`, path: root, kind: 'drive' }); }
    catch { /* unavailable */ }
  }
  locations.push({ name: 'WSL Home', path: os.homedir(), kind: 'wsl' });
  return locations;
}

async function browse(value) {
  if (!value || value === '/') return { path: '/', parent: '/', locations: roots(), folders: [] };
  const resolved = path.resolve(String(value));
  const stat = await fsp.stat(resolved);
  if (!stat.isDirectory()) throw httpError(400, 'path is not a directory');
  const entries = await fsp.readdir(resolved, { withFileTypes: true });
  const folders = entries.filter(entry => entry.isDirectory() && !recycleBinPath(path.join(resolved, entry.name)))
    .map(entry => ({ name: entry.name, path: path.join(resolved, entry.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { path: resolved, parent: path.dirname(resolved), locations: [], folders };
}

function latestRun(projectToken) {
  return rows(`SELECT * FROM processing_runs WHERE project_token=${sqlQuote(projectToken)} ORDER BY started_at DESC LIMIT 1;`)[0] || null;
}

function runStatus(projectToken) {
  const run = latestRun(projectToken);
  if (!run) return { project_token: projectToken, run: null, state: 'NotStarted', workers: [] };
  const elapsed = Math.max(0.001, (Date.now() - Date.parse(run.started_at)) / 1000);
  const bytesPerSecond = Number(run.bytes_processed || 0) / elapsed;
  const remaining = Math.max(0, Number(run.bytes_discovered || 0) - Number(run.bytes_processed || 0));
  return {
    project_token: projectToken,
    run,
    state: run.state,
    phase: run.phase,
    progress: {
      files_percent: Number(run.files_discovered) ? Number(run.files_processed) / Number(run.files_discovered) * 100 : 0,
      bytes_percent: Number(run.bytes_discovered) ? Number(run.bytes_processed) / Number(run.bytes_discovered) * 100 : 0,
      bytes_per_second: bytesPerSecond,
      eta_seconds: bytesPerSecond > 0 ? remaining / bytesPerSecond : null
    },
    workers: rows(`SELECT worker_id,phase,path,item,started_at,updated_at FROM processing_workers WHERE run_id=${sqlQuote(run.run_id)} ORDER BY worker_id;`)
  };
}

class PauseRequested extends Error {}
class StopRequested extends Error {}

async function hashFile(fullPath) {
  const testDelay = Math.max(0, Math.min(10000, Number(process.env.SOT_TEST_HASH_DELAY_MS || 0)));
  if (testDelay) await new Promise(resolve => setTimeout(resolve, testDelay));
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(fullPath);
    stream.on('data', chunk => {
      if (workerStopSignal) { stream.destroy(new StopRequested('stop requested')); return; }
      if (workerPauseSignal) { stream.destroy(new PauseRequested('pause requested')); return; }
      hash.update(chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function launchBackground(kind, id, projectToken, replace = false) {
  const key = `${kind}:${id}`;
  if (runtime.jobs.has(key) && !replace) return runtime.jobs.get(key);
  let stderr = '';
  let settled = false;
  const child = spawn(process.execPath, [path.join(__dirname, 'sot-worker.js'), kind, id, projectToken], {
    cwd: __dirname,
    env: { ...process.env, SOT_WORKER_PROCESS: '1', SOT_WORKER_KIND: kind },
    stdio: ['ignore', 'ignore', 'pipe']
  });
  runtime.jobs.set(key, { kind, id, project_token: projectToken, pid: child.pid, started_at: now() });
  child.stderr?.setEncoding('utf8');
  child.stderr?.on('data', chunk => { stderr = `${stderr}${chunk}`.slice(-16384); });
  const finish = (code, signal, spawnError = null) => {
    if (settled) return;
    settled = true;
    if (runtime.jobs.get(key)?.pid === child.pid) runtime.jobs.delete(key);
    if (kind !== 'index') return;
    try {
      const run = rows(`SELECT state,phase FROM processing_runs WHERE run_id=${sqlQuote(id)} LIMIT 1;`)[0] || {};
      const abnormal = spawnError || code !== 0 || signal || ['Queued', 'WIP'].includes(run.state);
      const detail = {
        run_id: id,
        pid: child.pid || null,
        code: code == null ? null : Number(code),
        signal: signal || null,
        state: run.state || 'missing',
        phase: run.phase || 'unknown',
        error: spawnError ? String(spawnError.message || spawnError) : '',
        stderr: stderr.trim()
      };
      if (abnormal && ['Queued', 'WIP'].includes(run.state)) {
        const at = now();
        const message = `Index worker exited unexpectedly${signal ? ` (${signal})` : code == null ? '' : ` (code ${code})`}${detail.error ? `: ${detail.error}` : ''}${detail.stderr ? `: ${detail.stderr}` : ''}`.slice(0, 4096);
        transaction([
          `UPDATE run_files SET state='pending' WHERE run_id=${sqlQuote(id)} AND state='WIP';`,
          `UPDATE processing_workers SET phase='error',updated_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(id)} AND phase<>'idle';`,
          `UPDATE processing_runs SET state='Error',phase='worker_exit',worker_pid=NULL,pause_requested=0,stop_requested=0,error_count=error_count+1,error_message=${sqlQuote(message)},updated_at=${sqlQuote(at)},ended_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(id)} AND state IN ('Queued','WIP');`,
          `UPDATE projects SET workflow_step=3,status='Error',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
          `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.worker.exited',${sqlQuote(at)},${sqlQuote(JSON.stringify({ ...detail, state: 'Error', phase: 'worker_exit', unexpected: true }))});`
        ]);
      } else {
        event(projectToken, 'processing.worker.exited', { ...detail, unexpected: Boolean(abnormal) });
      }
    } catch (error) {
      console.error(`SOT could not record ${key} exit:`, error);
    }
  };
  child.once('close', (code, signal) => finish(code, signal));
  child.once('error', error => finish(null, null, error));
  return runtime.jobs.get(key);
}

function enforceRunControl(runId) {
  if (workerStopSignal) throw new StopRequested('stop requested');
  if (workerPauseSignal) throw new PauseRequested('pause requested');
  const request = rows(`SELECT pause_requested,stop_requested FROM processing_runs WHERE run_id=${sqlQuote(runId)} LIMIT 1;`)[0] || {};
  if (Number(request.stop_requested || 0) === 1) throw new StopRequested('stop requested');
  if (Number(request.pause_requested || 0) === 1) throw new PauseRequested('pause requested');
}

function insertRunFiles(runId, sourceId, files) {
  if (!files.length) return;
  const statements = files.map(file => `INSERT OR REPLACE INTO run_files(run_id,source_id,relative_path,full_path,size,modified_ms,state,reused,error_message) VALUES(${sqlQuote(runId)},${sqlQuote(sourceId)},${sqlQuote(file.relative)},${sqlQuote(file.full)},${Number(file.size)},${Number(file.modified)},'pending',0,'');`);
  statements.push(`UPDATE processing_runs SET files_discovered=files_discovered+${files.length},bytes_discovered=bytes_discovered+${files.reduce((sum, file) => sum + Number(file.size), 0)},updated_at=${sqlQuote(now())} WHERE run_id=${sqlQuote(runId)};`);
  transaction(statements);
}

async function enumerateSource(runId, source) {
  const stack = [{ full: source.normalized_path, relative: '' }];
  let batch = [];
  while (stack.length) {
    enforceRunControl(runId);
    const current = stack.pop();
    execute(`UPDATE processing_runs SET current_source=${sqlQuote(source.normalized_path)},current_item=${sqlQuote(current.full)},updated_at=${sqlQuote(now())} WHERE run_id=${sqlQuote(runId)};`);
    let entries;
    try { entries = await fsp.readdir(current.full, { withFileTypes: true }); }
    catch (error) {
      execute(`UPDATE processing_runs SET warning_count=warning_count+1,updated_at=${sqlQuote(now())} WHERE run_id=${sqlQuote(runId)};`);
      continue;
    }
    let childFolders = 0, directFiles = 0, directBytes = 0;
    for (const entry of entries) {
      const full = path.join(current.full, entry.name);
      if (recycleBinPath(full)) continue;
      const relative = current.relative ? `${current.relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { childFolders += 1; stack.push({ full, relative }); }
      else if (entry.isFile()) {
        try {
          const stat = await fsp.stat(full);
          directFiles += 1;
          directBytes += Number(stat.size || 0);
          batch.push({ full, relative: relative.replace(/\\/g, '/'), size: stat.size, modified: stat.mtimeMs });
          if (batch.length >= 250) { insertRunFiles(runId, source.source_id, batch); batch = []; await new Promise(resolve => setImmediate(resolve)); }
        } catch {
          execute(`UPDATE processing_runs SET warning_count=warning_count+1,updated_at=${sqlQuote(now())} WHERE run_id=${sqlQuote(runId)};`);
        }
      }
    }
    const updatedAt = now();
    const topLevelIncrement = current.relative ? 0 : childFolders + directFiles;
    transaction([
      `INSERT INTO folder_progress(run_id,source_id,folder_path,relative_path,child_folders,files_discovered,bytes_discovered,updated_at) VALUES(${sqlQuote(runId)},${sqlQuote(source.source_id)},${sqlQuote(current.full)},${sqlQuote(current.relative)},${childFolders},${directFiles},${directBytes},${sqlQuote(updatedAt)}) ON CONFLICT(run_id,source_id,folder_path) DO UPDATE SET child_folders=excluded.child_folders,files_discovered=excluded.files_discovered,bytes_discovered=excluded.bytes_discovered,updated_at=excluded.updated_at;`,
      `UPDATE processing_runs SET folder_count=folder_count+${childFolders},top_level_item_count=top_level_item_count+${topLevelIncrement},updated_at=${sqlQuote(updatedAt)} WHERE run_id=${sqlQuote(runId)};`
    ]);
    processingProgressEvent(runId, source.project_token, 'processing.discovery.progress');
  }
  insertRunFiles(runId, source.source_id, batch);
  processingProgressEvent(runId, source.project_token, 'processing.discovery.progress', true);
}

async function processHashRow(runId, projectToken, item, workerId) {
  const workerNumber = workerId + 1;
  const startedAt = now();
  execute(`INSERT INTO processing_workers(run_id,worker_id,phase,path,item,started_at,updated_at) VALUES(${sqlQuote(runId)},${workerNumber},'fingerprinting',${sqlQuote(item.full_path)},${sqlQuote(item.relative_path)},${sqlQuote(startedAt)},${sqlQuote(startedAt)}) ON CONFLICT(run_id,worker_id) DO UPDATE SET phase='fingerprinting',path=excluded.path,item=excluded.item,started_at=excluded.started_at,updated_at=excluded.updated_at;`);
  try {
    const reusable = item.current_sha256 && Number(item.current_size) === Number(item.size) && Number(item.current_modified_ms) === Number(item.modified_ms);
    const contentSha = reusable ? item.current_sha256 : await hashFile(item.full_path);
    return { item, contentSha, reused: reusable ? 1 : 0, error: null };
  } catch (error) {
    if (error instanceof StopRequested || error instanceof PauseRequested) throw error;
    return { item, contentSha: null, reused: 0, error: String(error.message || error) };
  } finally {
    execute(`UPDATE processing_workers SET phase='idle',path='',item='',started_at=NULL,updated_at=${sqlQuote(now())} WHERE run_id=${sqlQuote(runId)} AND worker_id=${workerNumber};`);
  }
}

function persistHashResults(runId, projectToken, results) {
  const at = now();
  const statements = [];
  const folderTotals = new Map();
  let processed = 0, bytes = 0, reused = 0, computed = 0, errors = 0;
  for (const result of results) {
    const item = result.item;
    processed += 1;
    bytes += Number(item.size || 0);
    const folderPath = path.dirname(item.full_path);
    const folderKey = `${item.source_id}\0${folderPath}`;
    const folderTotal = folderTotals.get(folderKey) || { source_id: item.source_id, folder_path: folderPath, files: 0, bytes: 0 };
    folderTotal.files += 1;
    folderTotal.bytes += Number(item.size || 0);
    folderTotals.set(folderKey, folderTotal);
    if (result.error) {
      errors += 1;
      statements.push(`UPDATE run_files SET state='error',error_message=${sqlQuote(result.error)} WHERE run_id=${sqlQuote(runId)} AND source_id=${sqlQuote(item.source_id)} AND relative_path=${sqlQuote(item.relative_path)};`);
      continue;
    }
    reused += result.reused;
    computed += result.reused ? 0 : 1;
    const pathHash = sha(`${item.source_id}\0${item.relative_path}`);
    const observationHash = sha(`${pathHash}\0${item.size}\0${item.modified_ms}\0${result.contentSha}`);
    const observationId = sha(`${item.source_id}\0${item.relative_path}\0${observationHash}`);
    statements.push(
      `INSERT INTO content(content_sha256,size,first_observed_at,last_observed_at) VALUES(${sqlQuote(result.contentSha)},${Number(item.size)},${sqlQuote(at)},${sqlQuote(at)}) ON CONFLICT(content_sha256) DO UPDATE SET last_observed_at=excluded.last_observed_at;`,
      `INSERT INTO path_fingerprints(normalized_path,size,modified_ms,content_sha256,last_run_id,verified_at) VALUES(${sqlQuote(item.full_path)},${Number(item.size)},${Number(item.modified_ms)},${sqlQuote(result.contentSha)},${sqlQuote(runId)},${sqlQuote(at)}) ON CONFLICT(normalized_path) DO UPDATE SET size=excluded.size,modified_ms=excluded.modified_ms,content_sha256=excluded.content_sha256,last_run_id=excluded.last_run_id,verified_at=excluded.verified_at;`,
      `INSERT INTO observations(observation_id,project_token,source_id,run_id,normalized_path,relative_path,filename,size,modified_ms,content_sha256,path_hash,observation_hash,first_observed_at,last_observed_at) VALUES(${sqlQuote(observationId)},${sqlQuote(projectToken)},${sqlQuote(item.source_id)},${sqlQuote(runId)},${sqlQuote(item.full_path)},${sqlQuote(item.relative_path)},${sqlQuote(path.basename(item.relative_path))},${Number(item.size)},${Number(item.modified_ms)},${sqlQuote(result.contentSha)},${sqlQuote(pathHash)},${sqlQuote(observationHash)},${sqlQuote(at)},${sqlQuote(at)}) ON CONFLICT(source_id,relative_path,observation_hash) DO UPDATE SET last_observed_at=excluded.last_observed_at;`,
      `UPDATE run_files SET state='done',content_sha256=${sqlQuote(result.contentSha)},observation_id=${sqlQuote(observationId)},reused=${result.reused},error_message='' WHERE run_id=${sqlQuote(runId)} AND source_id=${sqlQuote(item.source_id)} AND relative_path=${sqlQuote(item.relative_path)};`
    );
  }
  for (const folder of folderTotals.values()) {
    statements.push(`UPDATE folder_progress SET files_processed=files_processed+${folder.files},bytes_processed=bytes_processed+${folder.bytes},updated_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(runId)} AND source_id=${sqlQuote(folder.source_id)} AND folder_path=${sqlQuote(folder.folder_path)};`);
  }
  statements.push(`UPDATE processing_runs SET files_processed=files_processed+${processed},bytes_processed=bytes_processed+${bytes},hashes_reused=hashes_reused+${reused},hashes_computed=hashes_computed+${computed},error_count=error_count+${errors},current_item=${sqlQuote(results.at(-1)?.item?.full_path || '')},updated_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(runId)};`);
  transaction(statements);
  processingProgressEvent(runId, projectToken, 'processing.fingerprint.progress');
}

async function processRun(runId, projectToken) {
  try {
    const sources = activeSources(projectToken).filter(source => source.preflight_status === 'ready');
    const workerStartedAt = now();
    transaction([
      `UPDATE processing_runs SET state='WIP',phase='enumerating',worker_pid=${Number(process.pid)},folder_count=${sources.length},top_level_item_count=0,updated_at=${sqlQuote(workerStartedAt)} WHERE run_id=${sqlQuote(runId)};`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.worker.started',${sqlQuote(workerStartedAt)},${sqlQuote(JSON.stringify({ run_id: runId, pid: process.pid }))});`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.phase',${sqlQuote(workerStartedAt)},${sqlQuote(JSON.stringify({ run_id: runId, phase: 'enumerating' }))});`
    ]);
    processingProgressEvent(runId, projectToken, 'processing.discovery.progress', true);
    enforceRunControl(runId);
    for (const source of sources) {
      await enumerateSource(runId, source);
    }
    enforceRunControl(runId);
    const fingerprintAt = now();
    transaction([
      `UPDATE processing_runs SET phase='fingerprinting',current_item='',updated_at=${sqlQuote(fingerprintAt)} WHERE run_id=${sqlQuote(runId)};`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.phase',${sqlQuote(fingerprintAt)},${sqlQuote(JSON.stringify({ run_id: runId, phase: 'fingerprinting' }))});`
    ]);
    const workerCount = Math.max(1, Math.min(16, Number(settings().hash_workers || 4)));
    const workerAt = now();
    transaction(Array.from({ length: workerCount }, (_, index) => `INSERT INTO processing_workers(run_id,worker_id,phase,path,item,started_at,updated_at) VALUES(${sqlQuote(runId)},${index + 1},'idle','','',NULL,${sqlQuote(workerAt)}) ON CONFLICT(run_id,worker_id) DO UPDATE SET phase='idle',path='',item='',started_at=NULL,updated_at=excluded.updated_at;`));
    while (true) {
      enforceRunControl(runId);
      const batch = rows(`SELECT rf.*,pf.size current_size,pf.modified_ms current_modified_ms,pf.content_sha256 current_sha256
        FROM run_files rf
        LEFT JOIN path_fingerprints pf ON pf.normalized_path=rf.full_path
        WHERE rf.run_id=${sqlQuote(runId)} AND rf.state='pending'
        ORDER BY rf.source_id,rf.relative_path LIMIT ${workerCount};`);
      if (!batch.length) break;
      transaction(batch.map(item => `UPDATE run_files SET state='WIP' WHERE run_id=${sqlQuote(runId)} AND source_id=${sqlQuote(item.source_id)} AND relative_path=${sqlQuote(item.relative_path)} AND state='pending';`));
      const results = await Promise.all(batch.map((item, index) => processHashRow(runId, projectToken, item, index)));
      persistHashResults(runId, projectToken, results);
      await new Promise(resolve => setImmediate(resolve));
    }
    processingProgressEvent(runId, projectToken, 'processing.fingerprint.progress', true);
    const summary = rows(`SELECT error_count FROM processing_runs WHERE run_id=${sqlQuote(runId)} LIMIT 1;`)[0] || {};
    if (Number(summary.error_count || 0) > 0) throw new Error(`${summary.error_count} file(s) could not be processed`);
    const sourceIds = sources.map(source => sqlQuote(source.source_id)).join(',');
    const at = now();
    const statements = [];
    if (sourceIds) {
      statements.push(
        `DELETE FROM current_observations WHERE source_id IN (${sourceIds});`,
        `INSERT INTO current_observations(source_id,relative_path,observation_id,last_run_id) SELECT source_id,relative_path,observation_id,run_id FROM run_files WHERE run_id=${sqlQuote(runId)} AND state='done';`
      );
    }
    statements.push(
      `UPDATE processing_runs SET state='Closed',phase='complete',worker_pid=NULL,pause_requested=0,stop_requested=0,current_source='',current_item='',updated_at=${sqlQuote(at)},ended_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(runId)};`,
      `UPDATE projects SET workflow_step=4,evidence_revision=evidence_revision+1,status='Review',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
      `UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved','complete');`,
      `UPDATE certifications SET status='invalidated',invalidated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND status='certified';`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.completed',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: runId }))});`
    );
    transaction(statements);
  } catch (error) {
    const at = now();
    if (error instanceof StopRequested) {
      transaction([
        `UPDATE run_files SET state='pending' WHERE run_id=${sqlQuote(runId)} AND state='WIP';`,
        `UPDATE processing_runs SET state='Interrupted',phase='stopped',worker_pid=NULL,pause_requested=0,stop_requested=0,current_source='',current_item='',error_message='Stopped by operator',updated_at=${sqlQuote(at)},ended_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(runId)};`,
        `UPDATE projects SET workflow_step=3,status='Stopped',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
        `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.stopped',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: runId }))});`
      ]);
    } else if (error instanceof PauseRequested) {
      transaction([
        `UPDATE run_files SET state='pending' WHERE run_id=${sqlQuote(runId)} AND state='WIP';`,
        `UPDATE processing_runs SET state='Paused',phase='paused',worker_pid=NULL,pause_requested=0,stop_requested=0,updated_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(runId)};`,
        `UPDATE projects SET status='Paused',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
        `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.paused',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: runId }))});`
      ]);
    } else {
      transaction([
        `UPDATE run_files SET state='pending' WHERE run_id=${sqlQuote(runId)} AND state='WIP';`,
        `UPDATE processing_runs SET state='Error',phase='error',worker_pid=NULL,pause_requested=0,stop_requested=0,error_message=${sqlQuote(error.message)},updated_at=${sqlQuote(at)},ended_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(runId)};`,
        `UPDATE projects SET workflow_step=3,status='Error',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
        `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.error',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: runId, error: error.message }))});`
      ]);
    }
  } finally {
    for (const key of runtime.progressEvents.keys()) if (key.startsWith(`${runId}:`)) runtime.progressEvents.delete(key);
  }
}

function startProcessing(projectToken) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const active = rows(`SELECT run_id FROM processing_runs WHERE project_token=${sqlQuote(projectToken)} AND state IN ('Queued','WIP','Paused') LIMIT 1;`)[0];
  if (active) throw httpError(409, 'project is already processing');
  const preflight = preflightProject(projectToken);
  if (!preflight.ready) throw httpError(409, `source preflight blocked processing: ${preflight.message || `${preflight.blocking_count} source(s) blocked`}`);
  const runId = randomId(12);
  const at = now();
  transaction([
    `INSERT INTO processing_runs(run_id,project_token,state,phase,started_at,updated_at) VALUES(${sqlQuote(runId)},${sqlQuote(projectToken)},'Queued','queued',${sqlQuote(at)},${sqlQuote(at)});`,
    `UPDATE projects SET workflow_step=3,status='Processing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.started',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: runId }))});`
  ]);
  const job = launchBackground('index', runId, projectToken);
  event(projectToken, 'processing.worker.launched', { run_id: runId, pid: job?.pid || null });
  return { project_token: projectToken, run_id: runId, status: 'Queued', worker_pid: job?.pid || null };
}

function signalIndexWorker(run, signal) {
  const pid = Number(run?.worker_pid || 0);
  if (!Number.isInteger(pid) || pid <= 1) return false;
  try { process.kill(pid, signal); return true; }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
}

function pauseProcessing(projectToken) {
  const run = latestRun(projectToken);
  if (!run || !['Queued', 'WIP'].includes(run.state)) throw httpError(409, 'no active processing run');
  const at = now();
  transaction([
    `UPDATE processing_runs SET pause_requested=1,phase='pausing',updated_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(run.run_id)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.pause.requested',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: run.run_id }))});`
  ]);
  const signaled = signalIndexWorker(run, 'SIGUSR1');
  return { project_token: projectToken, run_id: run.run_id, status: 'pausing', worker_signaled: signaled };
}

function stopProcessing(projectToken) {
  const run = latestRun(projectToken);
  if (!run || !['Queued', 'WIP', 'Paused'].includes(run.state)) throw httpError(409, 'no active or paused processing run');
  const at = now();
  if (run.state === 'Paused') {
    transaction([
      `UPDATE processing_runs SET state='Interrupted',phase='stopped',worker_pid=NULL,pause_requested=0,stop_requested=0,current_source='',current_item='',error_message='Stopped by operator',updated_at=${sqlQuote(at)},ended_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(run.run_id)};`,
      `UPDATE projects SET workflow_step=3,status='Stopped',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.stopped',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: run.run_id }))});`
    ]);
    return { project_token: projectToken, run_id: run.run_id, status: 'stopped', worker_signaled: false };
  }
  transaction([
    `UPDATE processing_runs SET stop_requested=1,pause_requested=0,phase='stopping',updated_at=${sqlQuote(at)} WHERE run_id=${sqlQuote(run.run_id)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.stop.requested',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: run.run_id }))});`
  ]);
  const signaled = signalIndexWorker(run, 'SIGUSR2');
  return { project_token: projectToken, run_id: run.run_id, status: 'stopping', worker_signaled: signaled };
}

function resumeProcessing(projectToken) {
  const run = latestRun(projectToken);
  if (!run || run.state !== 'Paused') throw httpError(409, 'no paused processing run');
  const at = now();
  transaction([
    `DELETE FROM run_files WHERE run_id=${sqlQuote(run.run_id)};`,
    `DELETE FROM folder_progress WHERE run_id=${sqlQuote(run.run_id)};`,
    `DELETE FROM processing_workers WHERE run_id=${sqlQuote(run.run_id)};`,
    `UPDATE processing_runs SET state='Queued',phase='queued',files_discovered=0,bytes_discovered=0,files_processed=0,bytes_processed=0,hashes_reused=0,hashes_computed=0,warning_count=0,error_count=0,folder_count=0,top_level_item_count=0,worker_pid=NULL,pause_requested=0,stop_requested=0,current_source='',current_item='',updated_at=${sqlQuote(at)},ended_at=NULL,error_message='' WHERE run_id=${sqlQuote(run.run_id)};`,
    `UPDATE projects SET workflow_step=3,status='Processing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.resumed',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: run.run_id }))});`
  ]);
  const job = launchBackground('index', run.run_id, projectToken, true);
  event(projectToken, 'processing.worker.launched', { run_id: run.run_id, pid: job?.pid || null, resumed: true });
  return { project_token: projectToken, run_id: run.run_id, status: 'Queued', resumed: true, worker_pid: job?.pid || null };
}

function review(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const base = `FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id JOIN sources s ON s.source_id=co.source_id WHERE s.project_token=${sqlQuote(projectToken)} AND s.removed_at IS NULL`;
  const totals = rows(`SELECT COUNT(*) files,COALESCE(SUM(o.size),0) bytes ${base};`)[0] || {};
  const unique = rows(`SELECT COUNT(*) unique_content,COALESCE(SUM(size),0) unique_bytes FROM (SELECT o.content_sha256,MAX(o.size) size ${base} GROUP BY o.content_sha256);`)[0] || {};
  const duplicates = rows(`SELECT COUNT(*) duplicate_groups,COALESCE(SUM(copies-1),0) duplicate_copies,COALESCE(SUM((copies-1)*size),0) duplicate_bytes FROM (SELECT o.content_sha256,COUNT(*) copies,MAX(o.size) size ${base} GROUP BY o.content_sha256 HAVING COUNT(*)>1);`)[0] || {};
  const coverage = rows(`SELECT
      COUNT(DISTINCT CASE WHEN th.verification_status='verified' THEN o.content_sha256 END) target_content,
      COALESCE(SUM(CASE WHEN th.verification_status='verified' AND first_content=1 THEN o.size ELSE 0 END),0) target_bytes,
      COUNT(DISTINCT CASE WHEN bh.verification_status='verified' THEN o.content_sha256 END) backup_content,
      COALESCE(SUM(CASE WHEN bh.verification_status='verified' AND first_content=1 THEN o.size ELSE 0 END),0) backup_bytes
    FROM (SELECT o.*,ROW_NUMBER() OVER(PARTITION BY o.content_sha256 ORDER BY o.observation_id) first_content ${base}) o
    LEFT JOIN target_holdings th ON th.content_sha256=o.content_sha256
    LEFT JOIN backup_holdings bh ON bh.content_sha256=o.content_sha256;`)[0] || {};
  const changed = rows(`SELECT COUNT(*) changed_paths FROM (SELECT o.source_id,o.relative_path,COUNT(DISTINCT o.observation_hash) versions FROM observations o JOIN sources s ON s.source_id=o.source_id WHERE s.project_token=${sqlQuote(projectToken)} AND s.removed_at IS NULL GROUP BY o.source_id,o.relative_path HAVING versions>1);`)[0]?.changed_paths || 0;
  const sourceStates = activeSources(projectToken);
  const blocking = sourceStates.filter(source => !['ready', 'ignored_recycle_bin'].includes(source.preflight_status));
  const uniqueContent = Number(unique.unique_content || 0);
  return {
    build: BUILD,
    project_token: projectToken,
    evidence_revision: Number(project.evidence_revision || 0),
    files: Number(totals.files || 0),
    bytes: Number(totals.bytes || 0),
    unique_content: uniqueContent,
    unique_bytes: Number(unique.unique_bytes || 0),
    duplicate_groups: Number(duplicates.duplicate_groups || 0),
    duplicate_copies: Number(duplicates.duplicate_copies || 0),
    duplicate_bytes: Number(duplicates.duplicate_bytes || 0),
    changed_paths: Number(changed || 0),
    target_content: Number(coverage.target_content || 0),
    target_bytes: Number(coverage.target_bytes || 0),
    target_missing_content: Math.max(0, uniqueContent - Number(coverage.target_content || 0)),
    target_missing_bytes: Math.max(0, Number(unique.unique_bytes || 0) - Number(coverage.target_bytes || 0)),
    backup_content: Number(coverage.backup_content || 0),
    backup_bytes: Number(coverage.backup_bytes || 0),
    backup_missing_content: Math.max(0, uniqueContent - Number(coverage.backup_content || 0)),
    backup_missing_bytes: Math.max(0, Number(unique.unique_bytes || 0) - Number(coverage.backup_bytes || 0)),
    blocking_sources: blocking.length,
    warnings: sourceStates.filter(source => source.preflight_status === 'ignored_recycle_bin').length
  };
}

function contentDestination(root, contentSha) { return path.join(root, contentSha.slice(0, 2), contentSha); }

function generatePlan(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const findings = review(projectToken);
  if (!findings.files) throw httpError(409, 'no current evidence is available');
  if (findings.blocking_sources) throw httpError(409, 'source preflight is not ready');
  const config = settings();
  const contentRows = rows(`WITH ranked AS (
      SELECT o.*,ROW_NUMBER() OVER(PARTITION BY o.content_sha256 ORDER BY o.normalized_path,o.observation_id) choice
      FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id JOIN sources s ON s.source_id=co.source_id
      WHERE s.project_token=${sqlQuote(projectToken)} AND s.removed_at IS NULL
    ) SELECT r.observation_id,r.normalized_path,r.size,r.content_sha256,
      th.verification_status target_status,th.target_path existing_target_path,
      bh.verification_status backup_status,bh.backup_path existing_backup_path
      FROM ranked r
      LEFT JOIN target_holdings th ON th.content_sha256=r.content_sha256
      LEFT JOIN backup_holdings bh ON bh.content_sha256=r.content_sha256
      WHERE r.choice=1 ORDER BY r.content_sha256;`);
  const needsStorage = contentRows.some(item => item.target_status !== 'verified' || item.backup_status !== 'verified');
  if (needsStorage && (!config.target_root || !config.backup_root)) throw httpError(409, 'configure separate Target and Backup roots before generating this plan');
  const planId = randomId(16);
  const at = now();
  const statements = [
    `UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved');`,
    `INSERT INTO plans(plan_id,project_token,evidence_revision,state,created_at) VALUES(${sqlQuote(planId)},${sqlQuote(projectToken)},${Number(project.evidence_revision)},'draft',${sqlQuote(at)});`
  ];
  for (const item of contentRows) {
    const targetReady = item.target_status === 'verified';
    const backupReady = item.backup_status === 'verified';
    const action = targetReady && backupReady ? 'none' : targetReady ? 'establish_backup' : 'establish_target_backup';
    const targetPath = targetReady ? item.existing_target_path : contentDestination(config.target_root, item.content_sha256);
    const backupPath = backupReady ? item.existing_backup_path : contentDestination(config.backup_root, item.content_sha256);
    statements.push(`INSERT INTO plan_items(item_id,plan_id,content_sha256,source_observation_id,action,size,source_path,target_path,backup_path,state) VALUES(${sqlQuote(randomId(16))},${sqlQuote(planId)},${sqlQuote(item.content_sha256)},${sqlQuote(item.observation_id)},${sqlQuote(action)},${Number(item.size)},${sqlQuote(item.normalized_path)},${sqlQuote(targetPath || '')},${sqlQuote(backupPath || '')},'pending');`);
  }
  statements.push(
    `UPDATE projects SET workflow_step=5,status='Plan',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'plan.generated',${sqlQuote(at)},${sqlQuote(JSON.stringify({ plan_id: planId, items: contentRows.length }))});`
  );
  transaction(statements);
  return planDetail(planId);
}

function latestPlan(projectToken) {
  const row = rows(`SELECT plan_id FROM plans WHERE project_token=${sqlQuote(projectToken)} ORDER BY created_at DESC LIMIT 1;`)[0];
  return row ? planDetail(row.plan_id) : null;
}

function planDetail(planId) {
  const plan = rows(`SELECT * FROM plans WHERE plan_id=${sqlQuote(planId)} LIMIT 1;`)[0];
  if (!plan) return null;
  const items = rows(`SELECT * FROM plan_items WHERE plan_id=${sqlQuote(planId)} ORDER BY content_sha256;`);
  const totals = { items: items.length, no_action: 0, target_files: 0, target_bytes: 0, backup_files: 0, backup_bytes: 0, complete: 0, errors: 0 };
  for (const item of items) {
    if (item.action === 'none') totals.no_action += 1;
    if (item.action === 'establish_target_backup') { totals.target_files += 1; totals.target_bytes += Number(item.size); totals.backup_files += 1; totals.backup_bytes += Number(item.size); }
    if (item.action === 'establish_backup') { totals.backup_files += 1; totals.backup_bytes += Number(item.size); }
    if (item.state === 'complete') totals.complete += 1;
    if (item.state === 'error') totals.errors += 1;
  }
  return { ...plan, items, totals };
}

async function copyVerified(sourcePath, destinationPath, expectedSha) {
  await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
  try {
    const existing = await fsp.stat(destinationPath);
    if (existing.isFile()) {
      const actual = await hashFile(destinationPath);
      if (actual !== expectedSha) throw new Error(`destination exists with unexpected content: ${destinationPath}`);
      return actual;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const partial = `${destinationPath}.partial-${randomId(6)}`;
  try {
    await fsp.copyFile(sourcePath, partial, fs.constants.COPYFILE_EXCL);
    const actual = await hashFile(partial);
    if (actual !== expectedSha) throw new Error(`verification failed for ${destinationPath}`);
    await fsp.rename(partial, destinationPath);
    return actual;
  } catch (error) {
    try { await fsp.unlink(partial); } catch { /* no partial */ }
    throw error;
  }
}

function actionStart(planId, itemId, type, sourcePath, destinationPath, expectedSha) {
  const actionId = randomId(16);
  execute(`INSERT INTO actions(action_id,plan_id,item_id,action_type,state,source_path,destination_path,expected_sha256,started_at) VALUES(${sqlQuote(actionId)},${sqlQuote(planId)},${sqlQuote(itemId)},${sqlQuote(type)},'WIP',${sqlQuote(sourcePath)},${sqlQuote(destinationPath)},${sqlQuote(expectedSha)},${sqlQuote(now())});`);
  return actionId;
}

function actionFinish(actionId, state, actualSha = '', errorMessage = '') {
  execute(`UPDATE actions SET state=${sqlQuote(state)},actual_sha256=${sqlQuote(actualSha)},error_message=${sqlQuote(errorMessage)},ended_at=${sqlQuote(now())} WHERE action_id=${sqlQuote(actionId)};`);
}

async function executePlan(planId) {
  const plan = planDetail(planId);
  if (!plan) return;
  const projectToken = plan.project_token;
  try {
    for (const item of plan.items) {
      execute(`UPDATE plan_items SET state='WIP',error_message='' WHERE item_id=${sqlQuote(item.item_id)};`);
      if (item.action === 'none') {
        const actionId = actionStart(planId, item.item_id, 'none', item.source_path, '', item.content_sha256);
        actionFinish(actionId, 'complete', item.content_sha256);
      } else {
        let targetPath = item.target_path;
        if (item.action === 'establish_target_backup') {
          const copyAction = actionStart(planId, item.item_id, 'copy_target', item.source_path, targetPath, item.content_sha256);
          const actual = await copyVerified(item.source_path, targetPath, item.content_sha256);
          actionFinish(copyAction, 'complete', actual);
          const verifyAction = actionStart(planId, item.item_id, 'verify_target', targetPath, targetPath, item.content_sha256);
          const verified = await hashFile(targetPath);
          if (verified !== item.content_sha256) throw new Error(`Target verification failed: ${targetPath}`);
          actionFinish(verifyAction, 'complete', verified);
          const at = now();
          execute(`INSERT INTO target_holdings(content_sha256,target_path,verification_status,verified_sha256,established_at,verified_at,last_error) VALUES(${sqlQuote(item.content_sha256)},${sqlQuote(targetPath)},'verified',${sqlQuote(verified)},${sqlQuote(at)},${sqlQuote(at)},'') ON CONFLICT(content_sha256) DO UPDATE SET target_path=excluded.target_path,verification_status='verified',verified_sha256=excluded.verified_sha256,verified_at=excluded.verified_at,last_error='';`);
        } else {
          const holding = rows(`SELECT target_path FROM target_holdings WHERE content_sha256=${sqlQuote(item.content_sha256)} AND verification_status='verified' LIMIT 1;`)[0];
          if (!holding) throw new Error(`verified Target holding missing for ${item.content_sha256}`);
          targetPath = holding.target_path;
        }
        const backupAction = actionStart(planId, item.item_id, 'copy_backup', targetPath, item.backup_path, item.content_sha256);
        const backupActual = await copyVerified(targetPath, item.backup_path, item.content_sha256);
        actionFinish(backupAction, 'complete', backupActual);
        const backupVerifyAction = actionStart(planId, item.item_id, 'verify_backup', item.backup_path, item.backup_path, item.content_sha256);
        const backupVerified = await hashFile(item.backup_path);
        if (backupVerified !== item.content_sha256) throw new Error(`Backup verification failed: ${item.backup_path}`);
        actionFinish(backupVerifyAction, 'complete', backupVerified);
        const at = now();
        execute(`INSERT INTO backup_holdings(content_sha256,backup_path,verification_status,verified_sha256,established_at,verified_at,last_error) VALUES(${sqlQuote(item.content_sha256)},${sqlQuote(item.backup_path)},'verified',${sqlQuote(backupVerified)},${sqlQuote(at)},${sqlQuote(at)},'') ON CONFLICT(content_sha256) DO UPDATE SET backup_path=excluded.backup_path,verification_status='verified',verified_sha256=excluded.verified_sha256,verified_at=excluded.verified_at,last_error='';`);
      }
      execute(`UPDATE plan_items SET state='complete',error_message='' WHERE item_id=${sqlQuote(item.item_id)};`);
    }
    const at = now();
    transaction([
      `UPDATE plans SET state='complete',completed_at=${sqlQuote(at)} WHERE plan_id=${sqlQuote(planId)};`,
      `UPDATE projects SET workflow_step=7,status='ReadyToCertify',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'execution.completed',${sqlQuote(at)},${sqlQuote(JSON.stringify({ plan_id: planId }))});`
    ]);
  } catch (error) {
    const at = now();
    transaction([
      `UPDATE plan_items SET state='error',error_message=${sqlQuote(error.message)} WHERE plan_id=${sqlQuote(planId)} AND state='WIP';`,
      `UPDATE plans SET state='error' WHERE plan_id=${sqlQuote(planId)};`,
      `UPDATE projects SET workflow_step=6,status='ExecutionError',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
      `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'execution.error',${sqlQuote(at)},${sqlQuote(JSON.stringify({ plan_id: planId, error: error.message }))});`
    ]);
  } finally { /* durable plan/action rows are the execution authority */ }
}

function startExecution(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const plan = latestPlan(projectToken);
  if (!plan || plan.state !== 'draft') throw httpError(409, 'a current draft plan is required');
  if (Number(plan.evidence_revision) !== Number(project.evidence_revision)) throw httpError(409, 'plan is stale');
  const at = now();
  transaction([
    `UPDATE plans SET state='executing',approved_at=${sqlQuote(at)} WHERE plan_id=${sqlQuote(plan.plan_id)};`,
    `UPDATE projects SET workflow_step=6,status='Executing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`
  ]);
  const job = launchBackground('execute', plan.plan_id, projectToken);
  return { project_token: projectToken, plan_id: plan.plan_id, status: 'executing', worker_pid: job?.pid || null };
}

function certify(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const preflight = preflightProject(projectToken);
  if (!preflight.ready) throw httpError(409, 'source preflight is not ready');
  const findings = review(projectToken);
  if (!findings.files) throw httpError(409, 'no current evidence is available');
  if (findings.target_missing_content || findings.backup_missing_content) throw httpError(409, 'Target and Backup coverage must both be complete');
  const plan = latestPlan(projectToken);
  if (!plan || plan.state !== 'complete' || Number(plan.evidence_revision) !== Number(project.evidence_revision)) throw httpError(409, 'current execution evidence is incomplete');
  const certificationId = randomId(16);
  const at = now();
  const detail = { files: findings.files, bytes: findings.bytes, unique_content: findings.unique_content, target_content: findings.target_content, backup_content: findings.backup_content };
  transaction([
    `INSERT INTO certifications(certification_id,project_token,evidence_revision,status,certified_at,detail_json) VALUES(${sqlQuote(certificationId)},${sqlQuote(projectToken)},${Number(project.evidence_revision)},'certified',${sqlQuote(at)},${sqlQuote(JSON.stringify(detail))});`,
    `UPDATE projects SET workflow_step=7,status='Certified',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'project.certified',${sqlQuote(at)},${sqlQuote(JSON.stringify({ certification_id: certificationId }))});`
  ]);
  return { certification_id: certificationId, project_token: projectToken, evidence_revision: Number(project.evidence_revision), status: 'certified', certified_at: at, detail };
}

function certificationStatus(projectToken) {
  return rows(`SELECT * FROM certifications WHERE project_token=${sqlQuote(projectToken)} ORDER BY certified_at DESC LIMIT 1;`)[0] || null;
}

function workflow(projectToken) {
  const project = projectDetail(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const step = Number(project.workflow_step || 1);
  const preflight = step >= 2 ? {
    ready: project.sources.length > 0 && project.sources.every(source => ['ready', 'ignored_recycle_bin'].includes(source.preflight_status)),
    blocking_count: project.sources.filter(source => !['ready', 'ignored_recycle_bin'].includes(source.preflight_status)).length + (project.sources.length ? 0 : 1)
  } : null;
  const processing = step >= 3 ? runStatus(projectToken) : { state: 'NotStarted', run: null, workers: [] };
  const findings = step >= 4 ? review(projectToken) : {};
  const plan = step >= 5 ? latestPlan(projectToken) : null;
  const certification = step >= 7 ? certificationStatus(projectToken) : null;
  const gates = {
    1: { ok: !!project.project_name.trim(), reason: 'Enter a project name.' },
    2: { ok: !!preflight?.ready, reason: preflight?.ready ? '' : 'Add and preflight at least one ready source.' },
    3: { ok: processing.state === 'Closed', reason: processing.state === 'Closed' ? '' : 'Processing must complete.' },
    4: { ok: Number(findings.files || 0) > 0, reason: Number(findings.files || 0) > 0 ? '' : 'No current evidence is available.' },
    5: { ok: !!plan && Number(plan.evidence_revision) === Number(project.evidence_revision), reason: 'Generate a current plan.' },
    6: { ok: plan?.state === 'complete', reason: 'Execute and verify the current plan.' },
    7: { ok: certification?.status === 'certified' && Number(certification.evidence_revision) === Number(project.evidence_revision), reason: 'Certification evidence is incomplete.' }
  };
  return { build: BUILD, project, workflow: { current_step: step, step_name: STEP_NAMES[step] }, sources: project.sources, preflight, processing, review: findings, intelligence: findings, plan, certification, gates };
}

function moveBack(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const step = Math.max(1, Number(project.workflow_step || 1) - 1);
  execute(`UPDATE projects SET workflow_step=${step},status=${sqlQuote(STEP_NAMES[step])},updated_at=${sqlQuote(now())} WHERE project_token=${sqlQuote(projectToken)};`);
  return workflow(projectToken);
}

function moveForward(projectToken) {
  const project = projectRow(projectToken);
  if (!project) throw httpError(404, 'project not found');
  const step = Number(project.workflow_step || 1);
  if (step === 1) {
    execute(`UPDATE projects SET workflow_step=2,status='Sources',updated_at=${sqlQuote(now())} WHERE project_token=${sqlQuote(projectToken)};`);
    return workflow(projectToken);
  }
  if (step === 2) return startProcessing(projectToken);
  if (step === 3) {
    const status = runStatus(projectToken);
    if (status.state !== 'Closed') throw httpError(409, 'processing must complete before Review');
    execute(`UPDATE projects SET workflow_step=4,status='Review',updated_at=${sqlQuote(now())} WHERE project_token=${sqlQuote(projectToken)};`);
    return workflow(projectToken);
  }
  if (step === 4) return generatePlan(projectToken);
  if (step === 5) return startExecution(projectToken);
  if (step === 6) {
    const plan = latestPlan(projectToken);
    if (plan?.state !== 'complete') throw httpError(409, 'execution must complete before Certify');
    execute(`UPDATE projects SET workflow_step=7,status='ReadyToCertify',updated_at=${sqlQuote(now())} WHERE project_token=${sqlQuote(projectToken)};`);
    return workflow(projectToken);
  }
  if (step === 7) return certify(projectToken);
  throw httpError(409, 'invalid workflow step');
}

function evidenceStatus() {
  const result = rows(`SELECT
    (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) projects,
    (SELECT COUNT(*) FROM sources WHERE removed_at IS NULL) sources,
    (SELECT COUNT(*) FROM observations) observations,
    (SELECT COUNT(*) FROM current_observations) current_observations,
    (SELECT COUNT(*) FROM content) content,
    (SELECT COUNT(*) FROM target_holdings WHERE verification_status='verified') target_holdings,
    (SELECT COUNT(*) FROM backup_holdings WHERE verification_status='verified') backup_holdings;`)[0] || {};
  return Object.fromEntries(Object.entries(result).map(([key, value]) => [key, Number(value || 0)]));
}

function folderProgress(projectToken) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const run = latestRun(projectToken);
  if (!run) return { project_token: projectToken, run_id: null, folders: [] };
  const folders = rows(`SELECT fp.*,s.normalized_path source_path
    FROM folder_progress fp JOIN sources s ON s.source_id=fp.source_id
    WHERE fp.run_id=${sqlQuote(run.run_id)}
    ORDER BY fp.updated_at DESC,fp.folder_path LIMIT 500;`);
  return { project_token: projectToken, run_id: run.run_id, state: run.state, folders };
}

function sotRollup() {
  const active = rows(`WITH latest AS (
      SELECT r.*,ROW_NUMBER() OVER(PARTITION BY project_token ORDER BY started_at DESC) choice FROM processing_runs r
    ) SELECT
    COUNT(CASE WHEN state IN ('Queued','WIP') THEN 1 END) active_jobs,
    COUNT(CASE WHEN state='Paused' THEN 1 END) paused_jobs,
    COUNT(CASE WHEN state='Error' THEN 1 END) failed_jobs,
    (SELECT COUNT(*) FROM processing_workers pw JOIN latest ar ON ar.run_id=pw.run_id AND ar.choice=1 WHERE ar.state IN ('Queued','WIP') AND pw.phase<>'idle') active_workers,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN folder_count ELSE 0 END),0) folders_discovered,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN files_discovered ELSE 0 END),0) files_discovered,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN bytes_discovered ELSE 0 END),0) bytes_discovered,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN files_processed ELSE 0 END),0) files_processed,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN bytes_processed ELSE 0 END),0) bytes_processed,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN hashes_reused ELSE 0 END),0) hashes_reused,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused') THEN hashes_computed ELSE 0 END),0) hashes_computed,
    COALESCE(SUM(CASE WHEN state IN ('Queued','WIP','Paused','Error') THEN error_count ELSE 0 END),0) errors
    FROM latest WHERE choice=1;`)[0] || {};
  const phases = rows(`WITH latest AS (
      SELECT state,phase,ROW_NUMBER() OVER(PARTITION BY project_token ORDER BY started_at DESC) choice FROM processing_runs
    ) SELECT phase,COUNT(*) jobs FROM latest WHERE choice=1 AND state IN ('Queued','WIP','Paused') GROUP BY phase ORDER BY phase;`);
  const corpusBase = `FROM (SELECT DISTINCT o.normalized_path,o.content_sha256,o.size
    FROM current_observations co
    JOIN observations o ON o.observation_id=co.observation_id
    JOIN sources s ON s.source_id=co.source_id AND s.removed_at IS NULL
    JOIN projects p ON p.project_token=s.project_token AND p.deleted_at IS NULL) corpus`;
  const totals = rows(`SELECT COUNT(*) files,COALESCE(SUM(size),0) bytes,COUNT(DISTINCT content_sha256) unique_content ${corpusBase};`)[0] || {};
  const duplicates = rows(`SELECT COUNT(*) duplicate_groups,COALESCE(SUM(copies-1),0) duplicate_copies,COALESCE(SUM((copies-1)*size),0) duplicate_bytes FROM (SELECT content_sha256,COUNT(*) copies,MAX(size) size ${corpusBase} GROUP BY content_sha256 HAVING COUNT(*)>1);`)[0] || {};
  const scope = rows(`WITH ranked AS (SELECT run_id,project_token,ROW_NUMBER() OVER(PARTITION BY project_token ORDER BY started_at DESC) choice FROM processing_runs WHERE state='Closed')
    SELECT (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) projects,
      COUNT(DISTINCT fp.folder_path) folders
    FROM folder_progress fp JOIN ranked r ON r.run_id=fp.run_id AND r.choice=1;`)[0] || {};
  const numberValues = value => Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Number(item || 0)]));
  return { build: BUILD, updated_at: now(), active: numberValues(active), phases: Object.fromEntries(phases.map(item => [item.phase, Number(item.jobs || 0)])), corpus: { ...numberValues(scope), ...numberValues(totals), ...numberValues(duplicates) } };
}

function schedulerStatus() {
  const jobs = rows(`SELECT run_id,project_token,state,phase,folder_count,files_discovered,bytes_discovered,files_processed,bytes_processed,hashes_reused,hashes_computed,error_count,current_item,worker_pid,updated_at
    FROM processing_runs WHERE state IN ('Queued','WIP','Paused') ORDER BY started_at;`);
  return {
    build: BUILD,
    worker_pool: Math.max(1, Math.min(16, Number(settings().hash_workers || 4))),
    architecture: 'background-process-per-project',
    running: jobs.some(job => ['Queued','WIP'].includes(job.state)),
    active: jobs.filter(job => job.state === 'WIP'),
    queued: jobs.filter(job => job.state === 'Queued'),
    paused: jobs.filter(job => job.state === 'Paused')
  };
}

function databaseStatus() {
  const stat = fs.statSync(DATABASE_PATH);
  const integrityRows = rows('PRAGMA integrity_check;');
  const integrityValue = String(integrityRows[0]?.integrity_check || Object.values(integrityRows[0] || {})[0] || 'unknown');
  const journalRows = rows('PRAGMA journal_mode;');
  const migrationRows = rows('SELECT version,name,checksum_sha256,applied_at FROM schema_migrations ORDER BY version;');
  const tables = rows("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;").map(row => row.name);
  const counts = {};
  for (const table of tables) counts[table] = Number(rows(`SELECT COUNT(*) count FROM ${safeIdentifier(table)};`)[0]?.count || 0);
  return {
    build: BUILD,
    database_path: DATABASE_PATH,
    size: stat.size,
    modified_at: stat.mtime.toISOString(),
    integrity: { ok: integrityValue.toLowerCase() === 'ok', result: integrityValue },
    journal_mode: String(journalRows[0]?.journal_mode || Object.values(journalRows[0] || {})[0] || ''),
    migrations: migrationRows,
    tables: counts
  };
}

function snapshotStamp() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'); }
function databaseBackup() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const destination = path.join(SNAPSHOT_DIR, `sot-${snapshotStamp()}.sqlite`);
  const command = SQLITE3_AVAILABLE ? 'sqlite3' : 'python3';
  const args = SQLITE3_AVAILABLE ? [DATABASE_PATH, `.backup '${destination.replace(/'/g, "''")}'`] : [SQLITE_ADAPTER, DATABASE_PATH, '--backup', destination];
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120000 });
  if (result.error || result.status !== 0) throw new Error(`backup failed: ${result.error?.message || result.stderr || result.status}`);
  const stat = fs.statSync(destination);
  return { ok: true, path: destination, size: stat.size, created_at: stat.mtime.toISOString() };
}
function databaseDump() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const destination = path.join(SNAPSHOT_DIR, `sot-${snapshotStamp()}.sql`);
  if (SQLITE3_AVAILABLE) {
    const descriptor = fs.openSync(destination, 'w');
    try {
      const result = spawnSync('sqlite3', [DATABASE_PATH, '.dump'], { stdio: ['ignore', descriptor, 'pipe'], encoding: 'utf8', timeout: 120000 });
      if (result.error || result.status !== 0) throw new Error(`dump failed: ${result.error?.message || result.stderr || result.status}`);
    } finally { fs.closeSync(descriptor); }
  } else {
    const result = spawnSync('python3', [SQLITE_ADAPTER, DATABASE_PATH, '--dump', destination], { encoding: 'utf8', timeout: 120000 });
    if (result.error || result.status !== 0) throw new Error(`dump failed: ${result.error?.message || result.stderr || result.status}`);
  }
  const stat = fs.statSync(destination);
  return { ok: true, path: destination, size: stat.size, created_at: stat.mtime.toISOString() };
}
function databaseSnapshots() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const files = fs.readdirSync(SNAPSHOT_DIR).filter(name => /^sot-.*\.(sqlite|sql)$/i.test(name)).map(name => {
    const fullPath = path.join(SNAPSHOT_DIR, name); const stat = fs.statSync(fullPath);
    return { name, path: fullPath, size: stat.size, modified_at: stat.mtime.toISOString() };
  }).sort((a, b) => b.modified_at.localeCompare(a.modified_at));
  return { path: SNAPSHOT_DIR, files };
}

async function handle(req, res, inputUrl) {
  const url = inputUrl instanceof URL ? inputUrl : new URL(inputUrl, 'http://127.0.0.1');
  let pathname = url.pathname;
  if (pathname.startsWith('/report/api/sot/')) pathname = pathname.slice('/report'.length);
  if (!pathname.startsWith('/api/sot/')) return false;
  try {
    if (pathname === '/api/sot/health' && req.method === 'GET') {
      ensureSchema();
      json(res, 200, { service: 'sot', status: 'ok', version: VERSION, build: BUILD, database_version: EXPECTED_MIGRATION, port: 18080, capabilities: ['clean-schema-migrations', 'projects', 'source-preflight', 'non-blocking-background-workers', 'concurrent-project-indexing', 'project-row-play-pause-stop', 'global-path-fingerprint-reuse', 'realtime-folder-project-sot-rollups', 'live-worker-paths', 'durable-activity-log', 'worker-exit-fail-closed', 'incremental-sha256', 'deterministic-review', 'immutable-plans', 'verified-target-backup', 'certification', 'db-admin'] }); return true;
    }
    if (pathname === '/api/sot/fs' && req.method === 'GET') { json(res, 200, await browse(url.searchParams.get('path') || '/')); return true; }
    if (pathname === '/api/sot/config' && req.method === 'GET') { json(res, 200, { database_path: DATABASE_PATH, ...settings() }); return true; }
    if (pathname === '/api/sot/admin/settings' && req.method === 'GET') { json(res, 200, settings()); return true; }
    if (pathname === '/api/sot/admin/settings' && req.method === 'PUT') { json(res, 200, configure(await requestBody(req))); return true; }
    if (pathname === '/api/sot/admin/db/status' && req.method === 'GET') { json(res, 200, databaseStatus()); return true; }
    if (pathname === '/api/sot/admin/db/backup' && req.method === 'POST') { json(res, 200, databaseBackup()); return true; }
    if (pathname === '/api/sot/admin/db/dump' && req.method === 'POST') { json(res, 200, databaseDump()); return true; }
    if (pathname === '/api/sot/admin/db/backups' && req.method === 'GET') { json(res, 200, databaseSnapshots()); return true; }
    if (pathname === '/api/sot/turn01/r1/evidence-status' && req.method === 'GET') { json(res, 200, { build: BUILD, ...evidenceStatus() }); return true; }
    if (pathname === '/api/sot/scheduler/status' && req.method === 'GET') { json(res, 200, schedulerStatus()); return true; }
    if (pathname === '/api/sot/rollup' && req.method === 'GET') { json(res, 200, sotRollup()); return true; }
    if (pathname === '/api/sot/activity' && req.method === 'GET') { json(res, 200, activityLog(url.searchParams.get('project_token') || '', url.searchParams.get('limit') || 100)); return true; }
    if ((pathname === '/api/sot/turn01/projects' || pathname === '/api/sot/projects') && req.method === 'GET') {
      const projects = listProjects(url.searchParams.get('q') || '');
      json(res, 200, pathname.includes('/turn01/') ? { projects } : projects); return true;
    }
    if ((pathname === '/api/sot/turn01/projects' || pathname === '/api/sot/projects') && req.method === 'POST') { json(res, 201, createProject(await requestBody(req))); return true; }

    let match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)$/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      if (req.method === 'GET') { const project = projectDetail(token); json(res, project ? 200 : 404, project || { error: 'project not found' }); return true; }
      if (req.method === 'PATCH') { json(res, 200, updateProject(token, await requestBody(req))); return true; }
      if (req.method === 'DELETE') { json(res, 200, deleteProject(token)); return true; }
    }
    match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/sources$/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      if (req.method === 'GET') { json(res, 200, { project_token: token, sources: activeSources(token) }); return true; }
      if (req.method === 'PUT') { const body = await requestBody(req); json(res, 200, { project_token: token, sources: replaceSources(token, body.sources || body.paths || []) }); return true; }
    }
    match = pathname.match(/^\/api\/sot\/(?:admin\/projects|turn01\/projects)\/([^/]+)\/preflight$/);
    if (match && req.method === 'GET') { json(res, 200, preflightProject(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/turn01\/workflow\/([^/]+)$/);
    if (match && req.method === 'GET') { json(res, 200, workflow(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/turn01\/workflow\/([^/]+)\/(forward|back)$/);
    if (match && req.method === 'POST') {
      const result = match[2] === 'back' ? moveBack(decodeURIComponent(match[1])) : moveForward(decodeURIComponent(match[1]));
      json(res, result?.status === 'Queued' || result?.status === 'executing' ? 202 : 200, result); return true;
    }
    match = pathname.match(/^\/api\/sot\/projects\/([^/]+)\/fingerprint\/(start|restart|continue|pause|stop)$/);
    if (match && req.method === 'POST') {
      const token = decodeURIComponent(match[1]); const action = match[2];
      const result = action === 'pause' ? pauseProcessing(token) : action === 'stop' ? stopProcessing(token) : action === 'continue' ? resumeProcessing(token) : startProcessing(token);
      json(res, 202, result); return true;
    }
    match = pathname.match(/^\/api\/sot\/projects\/([^/]+)\/fingerprint\/status$/);
    if (match && req.method === 'GET') { json(res, 200, runStatus(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/projects\/([^/]+)\/fingerprint\/folders$/);
    if (match && req.method === 'GET') { json(res, 200, folderProgress(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/review$/);
    if (match && req.method === 'GET') { json(res, 200, review(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/plan$/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      if (req.method === 'GET') { json(res, 200, latestPlan(token) || { project_token: token, state: 'none', items: [], totals: {} }); return true; }
      if (req.method === 'POST') { json(res, 201, generatePlan(token)); return true; }
    }
    match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/execute$/);
    if (match && req.method === 'POST') { json(res, 202, startExecution(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/certify$/);
    if (match && req.method === 'POST') { json(res, 200, certify(decodeURIComponent(match[1]))); return true; }
    match = pathname.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/certification$/);
    if (match && req.method === 'GET') { json(res, 200, certificationStatus(decodeURIComponent(match[1])) || { status: 'not_certified' }); return true; }
    json(res, 404, { error: 'SOT route not found', path: pathname }); return true;
  } catch (error) {
    json(res, error.status || 500, { error: error.message, build: BUILD });
    return true;
  }
}

module.exports = {
  handle,
  VERSION,
  BUILD,
  EXPECTED_MIGRATION,
  _test: { review, generatePlan, startProcessing, pauseProcessing, stopProcessing, resumeProcessing, runStatus, startExecution, certify, configure, projectDetail, listProjects, folderProgress, sotRollup, schedulerStatus, activityLog, runtime, sqlite },
  _worker: { processRun, executePlan }
};
