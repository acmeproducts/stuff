#!/usr/bin/env node
'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const fsp = fs.promises;
const http = require('http');
const os = require('os');
const path = require('path');

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sot-concurrency-'));
const databasePath = path.join(temporaryRoot, 'state', 'sot.sqlite');
const sharedRoot = path.join(temporaryRoot, 'shared');
const fixtureA = path.join(temporaryRoot, 'fixture-a');
const fixtureB = path.join(temporaryRoot, 'fixture-b');

process.env.SOT_ROOT = path.join(temporaryRoot, 'state');
process.env.SOT_DB_PATH = databasePath;
process.env.SOT_SNAPSHOT_DIR = path.join(temporaryRoot, 'snapshots');
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

async function poll(base, pathname, accept, timeoutMilliseconds = 60000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const result = await request(base, 'GET', pathname, null);
    if (accept(result.payload)) return result.payload;
    await sleep(40);
  }
  throw new Error(`poll timed out: ${pathname}`);
}

async function createProject(base, name, sourcePath) {
  const created = await request(base, 'POST', '/api/sot/turn01/projects', { project_name: name }, [201]);
  const token = created.payload.project_token;
  const encoded = encodeURIComponent(token);
  await request(base, 'PUT', `/api/sot/turn01/projects/${encoded}/sources`, { sources: [{ path: sourcePath }] });
  const preflight = await request(base, 'GET', `/api/sot/admin/projects/${encoded}/preflight`);
  assert.equal(preflight.payload.ready, true);
  return { token, encoded };
}

async function startAndClose(base, project) {
  await request(base, 'POST', `/api/sot/projects/${project.encoded}/fingerprint/start`, {}, [202]);
  const status = await poll(base, `/api/sot/projects/${project.encoded}/fingerprint/status`, value => ['Closed', 'Error'].includes(value.state));
  assert.equal(status.state, 'Closed', JSON.stringify(status));
  return status;
}

async function buildFolderFixture(root) {
  await fsp.mkdir(root, { recursive: true });
  for (let index = 0; index < 120; index += 1) {
    const folder = path.join(root, `folder-${String(index).padStart(3, '0')}`);
    await fsp.mkdir(folder);
    await fsp.writeFile(path.join(folder, 'payload.txt'), `shared-payload-${index}\n`);
  }
}

async function main() {
  await fsp.mkdir(sharedRoot, { recursive: true });
  await fsp.writeFile(path.join(sharedRoot, 'shared.txt'), 'one authoritative fingerprint\n');
  await Promise.all([buildFolderFixture(fixtureA), buildFolderFixture(fixtureB)]);

  const server = http.createServer(async (req, res) => {
    const handled = await api.handle(req, res, new URL(req.url, 'http://127.0.0.1'));
    if (!handled && !res.writableEnded) { res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const targetRoot = path.join(temporaryRoot, 'target');
    const backupRoot = path.join(temporaryRoot, 'backup');
    await request(base, 'PUT', '/api/sot/admin/settings', { target_root: targetRoot, backup_root: backupRoot, hash_workers: 1 });

    const sharedOne = await createProject(base, 'Shared one', sharedRoot);
    const firstRun = await startAndClose(base, sharedOne);
    assert.equal(Number(firstRun.run.hashes_computed), 1);

    const sharedTwo = await createProject(base, 'Shared two', sharedRoot);
    const secondRun = await startAndClose(base, sharedTwo);
    assert.equal(Number(secondRun.run.hashes_reused), 1);
    assert.equal(Number(secondRun.run.hashes_computed), 0);

    const projectA = await createProject(base, 'Concurrent A', fixtureA);
    const projectB = await createProject(base, 'Concurrent B', fixtureB);
    await request(base, 'POST', `/api/sot/projects/${projectA.encoded}/fingerprint/start`, {}, [202]);
    await request(base, 'POST', `/api/sot/projects/${projectB.encoded}/fingerprint/start`, {}, [202]);

    const overlap = await poll(base, '/api/sot/scheduler/status', value => value.active?.length >= 2);
    assert.equal(overlap.architecture, 'background-process-per-project');

    const health = await request(base, 'GET', '/api/sot/health');
    const projects = await request(base, 'GET', '/api/sot/turn01/projects');
    const liveRollup = await request(base, 'GET', '/api/sot/rollup');
    const review = await request(base, 'GET', `/api/sot/turn01/projects/${sharedOne.encoded}/review`);
    const plan = await request(base, 'POST', `/api/sot/turn01/projects/${sharedOne.encoded}/plan`, {}, [201]);
    const execution = await request(base, 'POST', `/api/sot/turn01/projects/${sharedOne.encoded}/execute`, {}, [202]);
    assert.equal(health.payload.status, 'ok');
    assert.equal(projects.payload.projects.length, 4);
    assert.ok(liveRollup.payload.active.active_jobs >= 2);
    assert.equal(review.payload.files, 1);
    assert.equal(plan.payload.totals.items, 1);
    assert.equal(execution.payload.status, 'executing');
    assert.ok(health.milliseconds < 1500, `health blocked for ${health.milliseconds}ms`);
    assert.ok(projects.milliseconds < 1500, `project list blocked for ${projects.milliseconds}ms`);
    assert.ok(liveRollup.milliseconds < 1500, `rollup blocked for ${liveRollup.milliseconds}ms`);
    assert.ok(review.milliseconds < 1500, `review blocked for ${review.milliseconds}ms`);
    assert.ok(plan.milliseconds < 1500, `plan blocked for ${plan.milliseconds}ms`);

    const [closedA, closedB] = await Promise.all([
      poll(base, `/api/sot/projects/${projectA.encoded}/fingerprint/status`, value => ['Closed', 'Error'].includes(value.state)),
      poll(base, `/api/sot/projects/${projectB.encoded}/fingerprint/status`, value => ['Closed', 'Error'].includes(value.state))
    ]);
    assert.equal(closedA.state, 'Closed', JSON.stringify(closedA));
    assert.equal(closedB.state, 'Closed', JSON.stringify(closedB));
    await poll(base, `/api/sot/turn01/projects/${sharedOne.encoded}/plan`, value => ['complete', 'error'].includes(value.state));

    const foldersA = await request(base, 'GET', `/api/sot/projects/${projectA.encoded}/fingerprint/folders`);
    assert.equal(foldersA.payload.folders.length, 121);
    assert.equal(Number(closedA.run.folder_count), 121);
    assert.equal(Number(closedA.run.top_level_item_count), 120);

    const finalRollup = await request(base, 'GET', '/api/sot/rollup');
    assert.equal(finalRollup.payload.active.active_jobs, 0);
    assert.equal(finalRollup.payload.corpus.files, 241);
    assert.equal(finalRollup.payload.corpus.duplicate_groups, 120);
    assert.equal(finalRollup.payload.corpus.duplicate_copies, 120);

    console.log(JSON.stringify({
      concurrent_index_jobs: overlap.active.length,
      unchanged_path_hashes_reused: Number(secondRun.run.hashes_reused),
      ui_process_latency_ms: {
        health: health.milliseconds,
        projects: projects.milliseconds,
        rollup: liveRollup.milliseconds,
        review: review.milliseconds,
        plan: plan.milliseconds
      },
      project_a: { folders: Number(closedA.run.folder_count), files: Number(closedA.run.files_processed) },
      sot_duplicates: {
        groups: finalRollup.payload.corpus.duplicate_groups,
        copies: finalRollup.payload.corpus.duplicate_copies,
        bytes: finalRollup.payload.corpus.duplicate_bytes
      },
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
