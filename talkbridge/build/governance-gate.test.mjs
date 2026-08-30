import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
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

test('catches frozen baseline modification of an undeclared file', () => {
  const root = fixture();
  fs.appendFileSync(path.join(root, 'talkbridge/wrangler.jsonc'), '\n// mutation\n');
  expectFailure(root, ['talkbridge/wrangler.jsonc'], /frozen baseline modified/);
});

test('declared product output may change after build authorization', () => {
  const root = fixture();
  mutateJson(root, state => { state.stage = 'build_authorized'; state.candidate.status = 'authorized'; });
  fs.appendFileSync(path.join(root, 'bridge-turn24-post-ship.html'), '\n<!-- r10-cr1 -->\n');
  const previousState = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  const result = validateSnapshot({ root, changedFiles: ['bridge-turn24-post-ship.html'], previousState });
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('product change before authorization is still pinned', () => {
  const root = rootStageFixture();
  fs.appendFileSync(path.join(root, 'bridge-turn24-post-ship.html'), '\nmutation\n');
  expectFailure(root, ['bridge-turn24-post-ship.html'], /frozen baseline modified/);
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
