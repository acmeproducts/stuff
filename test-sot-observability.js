#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const fsp = fs.promises;
const http = require('http');
const os = require('os');
const path = require('path');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sot-observability-'));
const databasePath = path.join(temporaryRoot, 'state', 'sot.sqlite');
const fixtureRoot = path.join(temporaryRoot, 'fixture');

process.env.SOT_ROOT = path.join(temporaryRoot, 'state');
process.env.SOT_DB_PATH = databasePath;
process.env.SOT_SQLITE_ADAPTER = path.join(__dirname, 'sot-sqlite.py');
process.env.SOT_TEST_HASH_DELAY_MS = '3000';

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

async function poll(work, accept, description, timeoutMilliseconds = 30000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const value = await work();
    if (accept(value)) return value;
    await sleep(15);
  }
  throw new Error(`poll timed out: ${description}`);
}

async function main() {
  await fsp.mkdir(fixtureRoot, { recursive: true });
  const largePath = path.join(fixtureRoot, 'large-current-file.bin');
  const descriptor = await fsp.open(largePath, 'w');
  try { await descriptor.truncate(8 * 1024 * 1024); }
  finally { await descriptor.close(); }

  const server = http.createServer(async (req, res) => {
    const handled = await api.handle(req, res, new URL(req.url, 'http://127.0.0.1'));
    if (!handled && !res.writableEnded) { res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    await request(base, 'PUT', '/api/sot/admin/settings', { hash_workers: 1 });
    const created = await request(base, 'POST', '/api/sot/turn01/projects', { project_name: 'Observable project' }, [201]);
    const token = created.payload.project_token;
    const encoded = encodeURIComponent(token);
    await request(base, 'PUT', `/api/sot/turn01/projects/${encoded}/sources`, { sources: [{ path: fixtureRoot }] });
    await request(base, 'GET', `/api/sot/admin/projects/${encoded}/preflight`);
    await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/start`, {}, [202]);

    const liveRow = await poll(async () => {
      const list = await request(base, 'GET', '/api/sot/turn01/projects');
      return list.payload.projects.find(project => project.project_token === token);
    }, row => row?.processing_phase === 'fingerprinting' && Number(row.active_workers) === 1 && row.workers?.[0]?.path === largePath, 'project row live worker path');
    assert.equal(liveRow.files_discovered, 1);
    assert.equal(liveRow.files_processed, 0);
    assert.equal(liveRow.workers[0].item, 'large-current-file.bin');

    const rollup = (await request(base, 'GET', '/api/sot/rollup')).payload;
    assert.equal(rollup.active.active_jobs, 1);
    assert.equal(rollup.active.active_workers, 1);
    assert.equal(rollup.active.files_discovered, 1);
    assert.equal(rollup.active.files_processed, 0);
    assert.equal(rollup.phases.fingerprinting, 1);

    const before = (await request(base, 'GET', `/api/sot/activity?project_token=${encoded}&limit=100`)).payload.events;
    const beforeTypes = new Set(before.map(item => item.event_type));
    for (const required of ['processing.started', 'processing.worker.launched', 'processing.worker.started', 'processing.phase', 'processing.discovery.progress']) {
      assert.ok(beforeTypes.has(required), `missing activity event ${required}`);
    }

    const liveStatus = (await request(base, 'GET', `/api/sot/projects/${encoded}/fingerprint/status`)).payload;
    const workerPid = Number(liveStatus.run.worker_pid);
    assert.ok(Number.isInteger(workerPid) && workerPid > 1);
    process.kill(workerPid, 'SIGKILL');

    const failed = await poll(async () => (await request(base, 'GET', `/api/sot/projects/${encoded}/fingerprint/status`)).payload,
      value => value.state === 'Error' && value.phase === 'worker_exit', 'unexpected worker exit');
    assert.match(failed.run.error_message, /exited unexpectedly/);
    assert.equal(failed.run.worker_pid, null);

    const exitEvent = await poll(async () => {
      const activity = (await request(base, 'GET', `/api/sot/activity?project_token=${encoded}&limit=100`)).payload.events;
      return activity.find(item => item.event_type === 'processing.worker.exited' && item.detail?.unexpected);
    }, Boolean, 'worker exit activity');
    assert.equal(exitEvent.detail.signal, 'SIGKILL');
    assert.equal(exitEvent.detail.state, 'Error');
    assert.ok(String(exitEvent.detail.stderr || '').length <= 16384);

    const failedRow = (await request(base, 'GET', '/api/sot/turn01/projects')).payload.projects.find(project => project.project_token === token);
    assert.equal(failedRow.processing_state, 'Error');
    assert.equal(failedRow.active_workers, 0);
    assert.deepEqual(failedRow.workers, []);

    const health = await request(base, 'GET', '/api/sot/health');
    assert.ok(health.milliseconds < 1000, `health took ${health.milliseconds}ms`);

    console.log(JSON.stringify({
      live_worker_path: liveRow.workers[0].path,
      sot_active_workers: rollup.active.active_workers,
      durable_events_before_exit: before.length,
      exit_signal: exitEvent.detail.signal,
      failed_state: `${failed.state}/${failed.phase}`,
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
