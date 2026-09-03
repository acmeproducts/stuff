'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = process.env.SOT_COORDINATION_ROOT || path.join(process.env.SOT_ROOT || path.join(os.homedir(), '.openclaw', 'sot'), 'coordination');
const POLL_MS = Math.max(50, Number(process.env.SOT_COORDINATION_POLL_MS || 200));
const STALE_MS = Math.max(60000, Number(process.env.SOT_COORDINATION_STALE_MS || 6 * 60 * 60 * 1000));

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function tokenKey(projectToken) { return crypto.createHash('sha256').update(String(projectToken)).digest('hex').slice(0, 32); }
function lockPath(projectToken) { return path.join(ROOT, `${tokenKey(projectToken)}.lock`); }
function ownerPath(lockDir) { return path.join(lockDir, 'owner.json'); }
function pidAlive(pid) {
  if (!Number.isInteger(Number(pid)) || Number(pid) <= 0) return false;
  try { process.kill(Number(pid), 0); return true; }
  catch (error) { return error && error.code === 'EPERM'; }
}
function readOwner(lockDir) {
  try { return JSON.parse(fs.readFileSync(ownerPath(lockDir), 'utf8')); }
  catch { return null; }
}
function stale(lockDir) {
  const owner = readOwner(lockDir);
  if (owner && pidAlive(owner.pid)) return false;
  try { return Date.now() - fs.statSync(lockDir).mtimeMs > STALE_MS; }
  catch { return true; }
}
function removeLock(lockDir) {
  try { fs.rmSync(lockDir, { recursive: true, force: true }); }
  catch {}
}

async function acquire(projectToken, detail = {}) {
  if (!projectToken) throw new Error('project token required for coordination');
  fs.mkdirSync(ROOT, { recursive: true });
  const dir = lockPath(projectToken);
  for (;;) {
    try {
      fs.mkdirSync(dir);
      const owner = {
        project_token: String(projectToken),
        pid: process.pid,
        kind: String(detail.kind || ''),
        operation_id: String(detail.operationId || detail.id || ''),
        acquired_at: new Date().toISOString()
      };
      fs.writeFileSync(ownerPath(dir), JSON.stringify(owner, null, 2), { flag: 'wx' });
      let released = false;
      return {
        owner,
        release() {
          if (released) return;
          released = true;
          const current = readOwner(dir);
          if (!current || Number(current.pid) === process.pid) removeLock(dir);
        }
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (stale(dir)) { removeLock(dir); continue; }
      await sleep(POLL_MS);
    }
  }
}

async function withProjectLease(projectToken, detail, fn) {
  const lease = await acquire(projectToken, detail);
  try { return await fn(lease.owner); }
  finally { lease.release(); }
}

module.exports = { acquire, withProjectLease, lockPath };
