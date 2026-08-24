#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const fsp = fs.promises;
const http = require('http');
const os = require('os');
const path = require('path');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sot-row-controls-'));
const databasePath = path.join(temporaryRoot, 'state', 'sot.sqlite');
const fixtureRoot = path.join(temporaryRoot, 'fixture');

process.env.SOT_ROOT = path.join(temporaryRoot, 'state');
process.env.SOT_DB_PATH = databasePath;
process.env.SOT_SQLITE_ADAPTER = path.join(__dirname, 'sot-sqlite.py');

require('./sot-db-manage').create(databasePath);
const api = require('./sot-api');

function sleep(milliseconds) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }

async function request(base, method, pathname, body, expected = [200]) {
  const started = Date.now();
  const response = await fetch(base + pathname, {
    method,
    headers: body == null ? {} : { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!expected.includes(response.status)) throw new Error(`${method} ${pathname} returned ${response.status}: ${text}`);
  return { payload, milliseconds: Date.now() - started };
}

async function poll(base, pathname, accept, timeoutMilliseconds = 30000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const result = await request(base, 'GET', pathname, null);
    if (accept(result.payload)) return result.payload;
    await sleep(35);
  }
  throw new Error(`poll timed out: ${pathname}`);
}

async function main() {
  await fsp.mkdir(fixtureRoot, { recursive: true });
  for (let index = 0; index < 30; index += 1) {
    await fsp.writeFile(path.join(fixtureRoot, `file-${String(index).padStart(3, '0')}.bin`), Buffer.alloc(64 * 1024, index));
  }

  const server = http.createServer(async (req, res) => {
    const handled = await api.handle(req, res, new URL(req.url, 'http://127.0.0.1'));
    if (!handled && !res.writableEnded) { res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await request(base, 'PUT', '/api/sot/admin/settings', { hash_workers: 1 });
    const created = await request(base, 'POST', '/api/sot/turn01/projects', { project_name: 'Controlled project' }, [201]);
    const token = created.payload.project_token;
    const encoded = encodeURIComponent(token);
    await request(base, 'PUT', `/api/sot/turn01/projects/${encoded}/sources`, { sources: [{ path: fixtureRoot }] });
    await request(base, 'GET', `/api/sot/admin/projects/${encoded}/preflight`);

    await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/start`, {}, [202]);
    await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, value => value.state === 'WIP' && Number(value.run.files_processed) >= 1);
    const pauseRequested = await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/pause`, {}, [202]);
    const paused = await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, value => value.state === 'Paused');
    assert.equal(pauseRequested.payload.status, 'pausing');
    assert.equal(paused.phase, 'paused');
    const completedBeforeResume = Number(paused.run.files_processed);
    assert.ok(completedBeforeResume >= 1);

    await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/continue`, {}, [202]);
    await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, value => value.state === 'WIP' && Number(value.run.hashes_reused) >= 1);
    const stopRequested = await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/stop`, {}, [202]);
    const stopped = await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, value => value.state === 'Interrupted' && value.phase === 'stopped');
    assert.equal(stopRequested.payload.status, 'stopping');
    assert.equal(stopped.run.error_message, 'Stopped by operator');

    const list = await request(base, 'GET', '/api/sot/turn01/projects');
    const row = list.payload.projects.find(project => project.project_token === token);
    assert.equal(row.processing_state, 'Interrupted');
    assert.equal(row.processing_phase, 'stopped');
    assert.ok(Number(row.files_discovered) >= 1);
    assert.ok(Number(row.folder_count) >= 1);
    assert.ok(row.progress_updated_at);

    const preserved = Number(api._test.sqlite('SELECT COUNT(*) count FROM path_fingerprints;', true)[0].count);
    assert.ok(preserved >= 1);
    await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/start`, {}, [202]);
    const restarted = await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, value => ['Closed', 'Error'].includes(value.state));
    assert.equal(restarted.state, 'Closed', JSON.stringify(restarted));
    assert.ok(Number(restarted.run.hashes_reused) >= preserved);
    assert.equal(Number(restarted.run.files_processed), 30);

    const health = await request(base, 'GET', '/api/sot/health');
    assert.equal(health.payload.database_version, 4);
    assert.ok(health.milliseconds < 1000, `health took ${health.milliseconds}ms`);

    console.log(JSON.stringify({
      paused_after_files: completedBeforeResume,
      stopped_state: `${stopped.state}/${stopped.phase}`,
      fingerprints_preserved: preserved,
      restart_hashes_reused: Number(restarted.run.hashes_reused),
      final_files: Number(restarted.run.files_processed),
      health_ms: health.milliseconds,
      result: 'PASS'
    }, null, 2));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
