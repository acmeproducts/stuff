#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const fsp = fs.promises;
const http = require('http');
const os = require('os');
const path = require('path');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sot-clean-e2e-'));
const databasePath = path.join(temporaryRoot, 'state', 'sot.sqlite');
const fixtureRoot = path.join(temporaryRoot, 'fixture');
const targetRoot = path.join(temporaryRoot, 'target');
const backupRoot = path.join(temporaryRoot, 'backup');

process.env.SOT_ROOT = path.join(temporaryRoot, 'state');
process.env.SOT_DB_PATH = databasePath;
process.env.SOT_SNAPSHOT_DIR = path.join(temporaryRoot, 'snapshots');
process.env.SOT_SQLITE_ADAPTER = path.join(__dirname, 'sot-sqlite.py');

const database = require('./sot-db-manage');
database.create(databasePath);
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
  let payload;
  try { payload = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`${method} ${pathname} returned non-JSON: ${text}`); }
  if (!expected.includes(response.status)) throw new Error(`${method} ${pathname} returned ${response.status}: ${JSON.stringify(payload)}`);
  return { status: response.status, payload, milliseconds: Date.now() - started };
}

async function poll(base, pathname, accept, timeoutMilliseconds = 20000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const result = await request(base, 'GET', pathname, null);
    if (accept(result.payload)) return result.payload;
    await sleep(50);
  }
  throw new Error(`poll timed out: ${pathname}`);
}

async function filesUnder(root) {
  const output = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of await fsp.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile()) output.push(full);
    }
  }
  return output.sort();
}

async function main() {
  await fsp.mkdir(path.join(fixtureRoot, 'nested'), { recursive: true });
  const alpha = 'alpha\n';
  const bravo = 'bravo\n';
  await fsp.writeFile(path.join(fixtureRoot, 'alpha.txt'), alpha);
  await fsp.writeFile(path.join(fixtureRoot, 'nested', 'alpha-copy.txt'), alpha);
  await fsp.writeFile(path.join(fixtureRoot, 'bravo.txt'), bravo);

  const server = http.createServer(async (req, res) => {
    const handled = await api.handle(req, res, new URL(req.url, 'http://127.0.0.1'));
    if (!handled && !res.writableEnded) { res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const report = {};

  try {
    const health = await request(base, 'GET', '/api/sot/health');
    assert.equal(health.payload.build, '2026.08.24.sot-live-progress-5');
    report.health_ms = health.milliseconds;

    const configured = await request(base, 'PUT', '/api/sot/admin/settings', { target_root: targetRoot, backup_root: backupRoot, hash_workers: 4 });
    assert.equal(configured.payload.target_root, targetRoot);
    assert.equal(configured.payload.backup_root, backupRoot);

    const created = await request(base, 'POST', '/api/sot/turn01/projects', { project_name: 'Fixture project', project_note: 'initial' }, [201]);
    const token = created.payload.project_token;
    assert.ok(token);
    const encoded = encodeURIComponent(token);

    const updated = await request(base, 'PATCH', `/api/sot/turn01/projects/${encoded}`, { project_name: 'Fixture corpus', project_note: 'clean end-to-end test' });
    assert.equal(updated.payload.project_name, 'Fixture corpus');
    assert.equal(updated.payload.project_note, 'clean end-to-end test');

    const sourceUpdate = await request(base, 'PUT', `/api/sot/turn01/projects/${encoded}/sources`, { sources: [{ path: fixtureRoot, operator_label: 'Fixture' }] });
    assert.equal(sourceUpdate.payload.sources.length, 1);

    const preflight = await request(base, 'GET', `/api/sot/admin/projects/${encoded}/preflight`);
    assert.equal(preflight.payload.ready, true);
    assert.equal(preflight.payload.sources[0].status, 'ready');

    await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/start`, {}, [202]);
    const firstRun = await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, payload => ['Closed', 'Error'].includes(payload.state));
    assert.equal(firstRun.state, 'Closed', JSON.stringify(firstRun));

    const firstReview = (await request(base, 'GET', `/api/sot/turn01/projects/${encoded}/review`)).payload;
    assert.equal(firstReview.files, 3);
    assert.equal(firstReview.bytes, Buffer.byteLength(alpha) * 2 + Buffer.byteLength(bravo));
    assert.equal(firstReview.unique_content, 2);
    assert.equal(firstReview.unique_bytes, Buffer.byteLength(alpha) + Buffer.byteLength(bravo));
    assert.equal(firstReview.duplicate_groups, 1);
    assert.equal(firstReview.duplicate_copies, 1);
    assert.equal(firstReview.duplicate_bytes, Buffer.byteLength(alpha));
    assert.equal(firstReview.target_missing_content, 2);
    assert.equal(firstReview.backup_missing_content, 2);

    const firstPlan = (await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/plan`, {}, [201])).payload;
    assert.equal(firstPlan.totals.items, 2);
    assert.equal(firstPlan.totals.target_files, 2);
    assert.equal(firstPlan.totals.backup_files, 2);
    await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/certify`, {}, [409]);

    await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/execute`, {}, [202]);
    const executed = await poll(base, `/api/sot/turn01/projects/${encoded}/plan`, payload => ['complete', 'error'].includes(payload.state));
    assert.equal(executed.state, 'complete', JSON.stringify(executed));
    assert.equal((await filesUnder(targetRoot)).length, 2);
    assert.equal((await filesUnder(backupRoot)).length, 2);

    const firstCertification = (await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/certify`, {})).payload;
    assert.equal(firstCertification.status, 'certified');

    await sleep(25);
    const changedBravo = 'bravo changed\n';
    await fsp.writeFile(path.join(fixtureRoot, 'bravo.txt'), changedBravo);
    await request(base, 'POST', `/api/sot/projects/${encoded}/fingerprint/start`, {}, [202]);
    const secondRun = await poll(base, `/api/sot/projects/${encoded}/fingerprint/status`, payload => ['Closed', 'Error'].includes(payload.state));
    assert.equal(secondRun.state, 'Closed', JSON.stringify(secondRun));

    const secondReview = (await request(base, 'GET', `/api/sot/turn01/projects/${encoded}/review`)).payload;
    assert.equal(secondReview.files, 3);
    assert.equal(secondReview.unique_content, 2);
    assert.ok(secondReview.changed_paths >= 1);
    assert.equal(secondReview.target_missing_content, 1);
    assert.equal(secondReview.backup_missing_content, 1);

    const invalidated = (await request(base, 'GET', `/api/sot/turn01/projects/${encoded}/certification`)).payload;
    assert.equal(invalidated.status, 'invalidated');
    const secondPlan = (await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/plan`, {}, [201])).payload;
    assert.equal(secondPlan.totals.no_action, 1);
    assert.equal(secondPlan.totals.target_files, 1);
    assert.equal(secondPlan.totals.backup_files, 1);

    await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/execute`, {}, [202]);
    const secondExecution = await poll(base, `/api/sot/turn01/projects/${encoded}/plan`, payload => ['complete', 'error'].includes(payload.state));
    assert.equal(secondExecution.state, 'complete', JSON.stringify(secondExecution));
    const secondCertification = (await request(base, 'POST', `/api/sot/turn01/projects/${encoded}/certify`, {})).payload;
    assert.equal(secondCertification.status, 'certified');
    assert.equal((await filesUnder(targetRoot)).length, 3);
    assert.equal((await filesUnder(backupRoot)).length, 3);

    const projectList = await request(base, 'GET', '/api/sot/turn01/projects');
    assert.equal(projectList.payload.projects.length, 1);
    assert.equal(projectList.payload.projects[0].size_bytes, Buffer.byteLength(alpha) * 2 + Buffer.byteLength(changedBravo));
    assert.equal(projectList.payload.projects[0].folder_count, 2);
    assert.equal(projectList.payload.projects[0].top_level_item_count, 3);
    assert.ok(projectList.payload.projects[0].indexed_at);
    assert.ok(projectList.milliseconds < 1000, `project list took ${projectList.milliseconds}ms`);
    report.project_list_ms = projectList.milliseconds;

    const backup = await request(base, 'POST', '/api/sot/admin/db/backup', {});
    const dump = await request(base, 'POST', '/api/sot/admin/db/dump', {});
    assert.ok(backup.payload.size > 0 && fs.existsSync(backup.payload.path));
    assert.ok(dump.payload.size > 0 && fs.existsSync(dump.payload.path));
    const dbStatus = await request(base, 'GET', '/api/sot/admin/db/status');
    assert.equal(dbStatus.payload.integrity.ok, true);
    assert.equal(dbStatus.payload.migrations.length, 4);

    const migrationStatus = database.status(databasePath);
    assert.equal(migrationStatus.ok, true);
    report.final_review = secondReview;
    assert.equal(migrationStatus.current_version, 4);
    report.project_metrics = {
      size_bytes: projectList.payload.projects[0].size_bytes,
      folder_count: projectList.payload.projects[0].folder_count,
      top_level_item_count: projectList.payload.projects[0].top_level_item_count,
      indexed_at: projectList.payload.projects[0].indexed_at
    };
    report.migration = { current_version: migrationStatus.current_version, integrity: migrationStatus.integrity };
    report.result = 'PASS';
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
