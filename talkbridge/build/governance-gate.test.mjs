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

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-governance-'));
  for (const rel of FILES) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), target);
  }
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

test('legal current state is root_cause_required', () => {
  const root = fixture();
  const result = validateSnapshot({ root, changedFiles: [], bootstrap: true });
  assert.deepEqual(result, { ok: true, stage: 'root_cause_required', errors: [] });
});

test('catches frozen baseline modification', () => {
  const root = fixture();
  fs.appendFileSync(path.join(root, 'bridge-turn24-post-ship.html'), '\nmutation\n');
  expectFailure(root, ['bridge-turn24-post-ship.html'], /frozen baseline modified/);
});

test('catches stage skipping', () => {
  const root = fixture();
  const previousState = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
  mutateJson(root, state => { state.stage = 'owner_go_required'; });
  const result = validateSnapshot({ root, changedFiles: ['talkbridge/governance/r10-cycle.json'], previousState });
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /illegal stage transition/);
});

test('catches false owner authorization', () => {
  const root = fixture();
  mutateJson(root, state => { state.owner_authorization.status = 'authorized'; });
  expectFailure(root, ['talkbridge/governance/r10-cycle.json'], /false authorization/);
});

test('catches buried R10.6 resurrection', () => {
  const root = fixture();
  const rel = 'talkbridge/new-candidate.js';
  fs.writeFileSync(path.join(root, rel), "fetch('/service/deepgram-token');\n");
  expectFailure(root, [rel], /buried R10\.6 mechanism resurrected/);
});

test('catches implementation before authorization', () => {
  const root = fixture();
  const rel = 'talkbridge/new-candidate.js';
  fs.writeFileSync(path.join(root, rel), 'export const candidate = true;\n');
  expectFailure(root, [rel], /implementation changed before build authorization/);
});

test('catches replacement-plan edits before root cause is complete', () => {
  const root = fixture();
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
