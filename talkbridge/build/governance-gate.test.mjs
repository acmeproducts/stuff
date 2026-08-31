import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateSnapshot } from './governance-gate.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILES = [
  'bridge-turn24-post-ship.html',
  'tb-sw.js',
  'talkbridge/worker-talk.js',
  'talkbridge/wrangler.jsonc',
  'talkbridge/TALKBRIDGE-GRAVEYARD.md',
  'talkbridge/TALKBRIDGE-PLAN-v9.md',
  'talkbridge/governance/r10-cycle.json',
  '.github/workflows/deploy-relay.yml',
  '.github/workflows/talkbridge-governance.yml'
];
const ROOT_CAUSE = 'talkbridge/TALKBRIDGE-R10-WHOLE-RELEASE-ROOT-CAUSE.md';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-governance-'));
  for (const rel of FILES) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), target);
  }
  if (fs.existsSync(path.join(REPO, ROOT_CAUSE))) {
    const target = path.join(root, ROOT_CAUSE);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(REPO, ROOT_CAUSE), target);
  }
  return root;
}

function rootStageFixture() {
  const root = fixture();
  mutateJson(root, state => {
    state.stage = 'root_cause_required';
    state.root_cause = { status: 'required', file: ROOT_CAUSE, sha256: null };
    state.replacement_plan = { status: 'blocked', file: 'talkbridge/TALKBRIDGE-PLAN-v9.md', version: null, sha256: null };
    state.owner_authorization = { status: 'not_requested', approved_at: null, evidence: null, exact_words: null };
    state.candidate = { status: 'blocked', allowed_output_files: [] };
  });
  return root;
}

/* A self-contained build_authorized state: root cause and plan pinned to the fixture's own bytes. */
function authorizeFixture(root) {
  const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
  mutateJson(root, state => {
    state.stage = 'build_authorized';
    state.root_cause = { status: 'complete', file: ROOT_CAUSE, sha256: sha(ROOT_CAUSE) };
    state.replacement_plan = { status: 'complete', file: 'talkbridge/TALKBRIDGE-PLAN-v9.md', version: '20.9.0', sha256: sha('talkbridge/TALKBRIDGE-PLAN-v9.md') };
    state.owner_authorization = { status: 'authorized', approved_at: '2026-08-30T14:06:48-07:00', evidence: 'fixture', exact_words: 'Go' };
    state.candidate = { status: 'authorized', allowed_output_files: ['bridge-turn24-post-ship.html', 'tb-sw.js', 'talkbridge/worker-talk.js'] };
  });
}

function mutateJson(root, fn) {
  const rel = 'talkbridge/governance/r10-cycle.json';
  const file = path.join(root, rel);
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  fn(value);
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function expectFailure(root, changedFiles, message) {
  const result = validateSnapshot({ root, changedFiles, bootstrap: true });
  assert.equal(result.ok, false, 'mutation unexpectedly passed');
  assert.match(result.errors.join('\n'), message);
}

test('current governed snapshot is legal', () => {
  const root = fixture();
  const result = validateSnapshot({ root, changedFiles: [], bootstrap: true });
  const state = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  assert.deepEqual(result, { ok: true, stage: state.stage, errors: [] });
});

test('catches frozen baseline modification before authorization', () => {
  const root = rootStageFixture();
  fs.appendFileSync(path.join(root, 'bridge-turn24-post-ship.html'), '\nmutation\n');
  expectFailure(root, ['bridge-turn24-post-ship.html'], /frozen baseline modified/);
});

test('wrangler.jsonc stays frozen even after build authorization', () => {
  const root = fixture();
  fs.appendFileSync(path.join(root, 'talkbridge/wrangler.jsonc'), '\n// mutation\n');
  expectFailure(root, ['talkbridge/wrangler.jsonc'], /frozen baseline modified: talkbridge\/wrangler.jsonc/);
});

test('authorized candidate outputs may diverge from the frozen bytes', () => {
  const root = fixture();
  authorizeFixture(root);
  fs.appendFileSync(path.join(root, 'bridge-turn24-post-ship.html'), '\n/* candidate */\n');
  fs.appendFileSync(path.join(root, 'talkbridge/worker-talk.js'), '\n/* candidate */\n');
  const state = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  const result = validateSnapshot({ root, changedFiles: ['bridge-turn24-post-ship.html', 'talkbridge/worker-talk.js'], previousState: state });
  assert.deepEqual(result.errors, []);
});

test('candidate outputs are not exempt before build authorization', () => {
  const root = fixture();
  mutateJson(root, state => {
    state.stage = 'owner_go_required';
    state.owner_authorization = { status: 'not_requested', approved_at: null, evidence: null, exact_words: null };
    state.candidate = { status: 'blocked', allowed_output_files: [] };
  });
  fs.appendFileSync(path.join(root, 'talkbridge/worker-talk.js'), '\n/* candidate */\n');
  expectFailure(root, ['talkbridge/worker-talk.js'], /frozen baseline modified/);
});

test('catches stage skipping', () => {
  const root = rootStageFixture();
  const previousState = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  mutateJson(root, state => { state.stage = 'owner_go_required'; });
  const result = validateSnapshot({ root, changedFiles: ['talkbridge/governance/r10-cycle.json'], previousState });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /illegal stage transition/);
});

test('catches false owner authorization', () => {
  const root = rootStageFixture();
  mutateJson(root, state => { state.owner_authorization.status = 'authorized'; });
  expectFailure(root, ['talkbridge/governance/r10-cycle.json'], /false authorization/);
});

test('catches buried R10.6 resurrection', () => {
  const root = rootStageFixture();
  const rel = 'talkbridge/new-candidate.js';
  fs.writeFileSync(path.join(root, rel), "fetch('/service/deepgram-token');\n");
  expectFailure(root, [rel], /buried R10\.6 mechanism resurrected/);
});

test('catches implementation before authorization', () => {
  const root = rootStageFixture();
  const rel = 'talkbridge/new-candidate.js';
  fs.writeFileSync(path.join(root, rel), 'export const candidate = true;\n');
  expectFailure(root, [rel], /implementation changed before build authorization/);
});

test('catches replacement-plan edits before root cause is complete', () => {
  const root = rootStageFixture();
  const rel = 'talkbridge/TALKBRIDGE-PLAN-v9.md';
  fs.appendFileSync(path.join(root, rel), '\nPremature replacement plan.\n');
  const state = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  const result = validateSnapshot({ root, changedFiles: [rel], previousState: state });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /file is out of order for root_cause_required/);
});

test('catches erased graveyard burial', () => {
  const root = fixture();
  const rel = 'talkbridge/TALKBRIDGE-GRAVEYARD.md';
  const file = path.join(root, rel);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('The whole R10.6 release is buried', 'The release may be retried'));
  expectFailure(root, [rel], /graveyard burial marker missing/);
});

test('catches weakened relay deployment gate', () => {
  const root = fixture();
  const rel = '.github/workflows/deploy-relay.yml';
  const file = path.join(root, rel);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('node talkbridge/build/governance-gate.mjs', 'echo bypassed'));
  expectFailure(root, [rel], /deployment gate command was removed/);
});

test('a device-gate failure may restart as a new cycle only with the frozen pair restored', () => {
  const root = fixture();
  const previous = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  previous.stage = 'device_gate'; previous.candidate.status = 'testing';
  mutateJson(root, state => {
    state.stage = 'root_cause_required'; state.cycle = 'r10-recovery-2026-09-01';
    state.root_cause = { status: 'required', file: ROOT_CAUSE, sha256: null };
    state.replacement_plan = { status: 'blocked', file: 'talkbridge/TALKBRIDGE-PLAN-v9.md', version: null, sha256: null };
    state.owner_authorization = { status: 'not_requested', approved_at: null, evidence: null, exact_words: null };
    state.candidate = { status: 'blocked', allowed_output_files: [] };
  });
  for (const rel of Object.keys(previous.baseline.files)) {   /* the restart restores the frozen bytes */
    fs.writeFileSync(path.join(root, rel), execFileSync('git', ['show', `${previous.baseline.rollback_merge_commit}:${rel}`], { cwd: REPO, maxBuffer: 64 * 1024 * 1024 }));
  }
  const changed = ['talkbridge/governance/r10-cycle.json', 'bridge-turn24-post-ship.html', 'tb-sw.js', 'talkbridge/worker-talk.js', 'talkbridge/TALKBRIDGE-GRAVEYARD.md'];
  const ok = validateSnapshot({ root, changedFiles: changed, previousState: previous });
  assert.deepEqual(ok.errors, []);
  fs.appendFileSync(path.join(root, 'talkbridge/worker-talk.js'), '\n/* not restored */\n');
  const bad = validateSnapshot({ root, changedFiles: changed, previousState: previous });
  assert.match(bad.errors.join('\n'), /frozen baseline modified: talkbridge\/worker-talk.js/);
});

test('a backward transition that keeps the candidate live is still illegal', () => {
  const root = fixture();
  const previous = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  previous.stage = 'device_gate';
  mutateJson(root, state => { state.stage = 'build_authorized'; });
  const result = validateSnapshot({ root, changedFiles: ['talkbridge/governance/r10-cycle.json'], previousState: previous });
  assert.match(result.errors.join('\n'), /illegal stage transition/);
});

test('before GO is banked the proposal may be revised; after GO it may not', () => {
  const root = fixture();
  const previous = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  previous.stage = 'owner_go_required';
  previous.owner_authorization = { status: 'not_requested', approved_at: null, evidence: null, exact_words: null };
  mutateJson(root, state => { state.stage = 'owner_go_required'; state.owner_authorization = previous.owner_authorization; });
  fs.appendFileSync(path.join(root, 'talkbridge/TALKBRIDGE-PLAN-v9.md'), '\nrevision\n');
  mutateJson(root, state => { state.replacement_plan.sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'talkbridge/TALKBRIDGE-PLAN-v9.md'))).digest('hex'); });
  const ok = validateSnapshot({ root, changedFiles: ['talkbridge/governance/r10-cycle.json', 'talkbridge/TALKBRIDGE-PLAN-v9.md'], previousState: previous });
  assert.deepEqual(ok.errors, []);
  const authorized = Object.assign({}, previous, { owner_authorization: { status: 'authorized', approved_at: 'x', evidence: 'x', exact_words: 'Go' } });
  const bad = validateSnapshot({ root, changedFiles: ['talkbridge/governance/r10-cycle.json', 'talkbridge/TALKBRIDGE-PLAN-v9.md'], previousState: authorized });
  assert.match(bad.errors.join('\n'), /out of order for owner_go_required: talkbridge\/TALKBRIDGE-PLAN-v9.md/);
});
