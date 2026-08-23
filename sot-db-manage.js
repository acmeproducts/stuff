#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const MIGRATIONS_DIR = process.env.SOT_MIGRATIONS_DIR || path.join(__dirname, 'sot-db', 'migrations');
const SQLITE_ADAPTER = process.env.SOT_SQLITE_ADAPTER || path.join(__dirname, 'sot-sqlite.py');
const SQLITE3_AVAILABLE = !spawnSync('sqlite3', ['-version'], { encoding: 'utf8' }).error;

function fail(message) {
  throw new Error(message);
}

function sqlQuote(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function sqlite(databasePath, script, json = false) {
  const command = SQLITE3_AVAILABLE ? 'sqlite3' : 'python3';
  const args = SQLITE3_AVAILABLE
    ? (json ? ['-json', databasePath] : [databasePath])
    : [SQLITE_ADAPTER, databasePath, ...(json ? ['--json'] : [])];
  const result = spawnSync(command, args, {
    input: SQLITE3_AVAILABLE ? `.bail on\n.timeout 10000\n${script}\n` : `${script}\n`,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error) fail(`SQLite process failed to start: ${result.error.message}`);
  if (result.status !== 0) fail((result.stderr || result.stdout || `sqlite3 exited ${result.status}`).trim());
  const output = (result.stdout || '').trim();
  if (!json) return output;
  return output ? JSON.parse(output) : [];
}

function migrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) fail(`migration directory not found: ${MIGRATIONS_DIR}`);
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(name => /^\d{3}-[a-z0-9][a-z0-9-]*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
  if (!files.length) fail('no migrations found');
  const seen = new Set();
  return files.map(name => {
    const version = Number(name.slice(0, 3));
    if (seen.has(version)) fail(`duplicate migration version: ${version}`);
    seen.add(version);
    const fullPath = path.join(MIGRATIONS_DIR, name);
    const sql = fs.readFileSync(fullPath, 'utf8');
    if (!sql.trim()) fail(`empty migration: ${name}`);
    return {
      version,
      name,
      fullPath,
      sql,
      checksum: crypto.createHash('sha256').update(sql).digest('hex')
    };
  });
}

function hasMigrationTable(databasePath) {
  if (!fs.existsSync(databasePath) || fs.statSync(databasePath).size === 0) return false;
  const rows = sqlite(databasePath, "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations';", true);
  return rows.length === 1;
}

function appliedMigrations(databasePath) {
  if (!hasMigrationTable(databasePath)) return new Map();
  const rows = sqlite(databasePath, 'SELECT version,name,checksum_sha256,applied_at FROM schema_migrations ORDER BY version;', true);
  return new Map(rows.map(row => [Number(row.version), row]));
}

function migrate(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const migrations = migrationFiles();
  const applied = appliedMigrations(databasePath);
  const appliedNow = [];

  for (const migration of migrations) {
    const existing = applied.get(migration.version);
    if (existing) {
      if (existing.name !== migration.name || existing.checksum_sha256 !== migration.checksum) {
        fail(`published migration changed: ${migration.name}`);
      }
      continue;
    }
    const appliedAt = new Date().toISOString();
    sqlite(databasePath, [
      'PRAGMA foreign_keys=ON;',
      'BEGIN IMMEDIATE;',
      migration.sql,
      `INSERT INTO schema_migrations(version,name,checksum_sha256,applied_at) VALUES(${migration.version},${sqlQuote(migration.name)},${sqlQuote(migration.checksum)},${sqlQuote(appliedAt)});`,
      'COMMIT;'
    ].join('\n'));
    appliedNow.push(migration.name);
  }

  sqlite(databasePath, 'PRAGMA journal_mode=WAL;');
  return { database_path: databasePath, applied: appliedNow, status: status(databasePath) };
}

function create(databasePath) {
  if (fs.existsSync(databasePath) && fs.statSync(databasePath).size > 0) {
    fail(`create refused: database already exists: ${databasePath}`);
  }
  return migrate(databasePath);
}

function status(databasePath) {
  if (!fs.existsSync(databasePath) || fs.statSync(databasePath).size === 0) fail(`database not found: ${databasePath}`);
  const available = migrationFiles();
  const applied = appliedMigrations(databasePath);
  const pending = [];
  for (const migration of available) {
    const row = applied.get(migration.version);
    if (!row) pending.push(migration.name);
    else if (row.name !== migration.name || row.checksum_sha256 !== migration.checksum) {
      fail(`published migration changed: ${migration.name}`);
    }
  }
  for (const version of applied.keys()) {
    if (!available.some(item => item.version === version)) fail(`database contains unknown migration version: ${version}`);
  }
  const integrityRows = sqlite(databasePath, 'PRAGMA integrity_check;', true);
  const integrity = String(integrityRows[0]?.integrity_check || Object.values(integrityRows[0] || {})[0] || 'unknown');
  const journalRows = sqlite(databasePath, 'PRAGMA journal_mode;', true);
  return {
    database_path: databasePath,
    size: fs.statSync(databasePath).size,
    integrity,
    ok: integrity.toLowerCase() === 'ok' && pending.length === 0,
    journal_mode: String(journalRows[0]?.journal_mode || Object.values(journalRows[0] || {})[0] || ''),
    current_version: Math.max(0, ...applied.keys()),
    available_version: Math.max(...available.map(item => item.version)),
    applied: [...applied.values()],
    pending
  };
}

function main() {
  const [command, databaseArg] = process.argv.slice(2);
  if (!['create', 'migrate', 'status'].includes(command) || !databaseArg) {
    console.error('Usage: node sot-db-manage.js <create|migrate|status> <database-path>');
    process.exit(2);
  }
  const databasePath = path.resolve(databaseArg);
  const result = command === 'create' ? create(databasePath) : command === 'migrate' ? migrate(databasePath) : status(databasePath);
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  try { main(); }
  catch (error) {
    console.error(`SOT database ${process.argv[2] || 'command'} failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { create, migrate, status, migrationFiles, sqlite };
