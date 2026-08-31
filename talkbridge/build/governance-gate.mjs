#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STATE_PATH = 'talkbridge/governance/r10-cycle.json';
const GRAVEYARD_PATH = 'talkbridge/TALKBRIDGE-GRAVEYARD.md';
const PLAN_PATH = 'talkbridge/TALKBRIDGE-PLAN-v9.md';
const DEPLOY_WORKFLOW = '.github/workflows/deploy-relay.yml';
const GOVERNANCE_WORKFLOW = '.github/workflows/talkbridge-governance.yml';

const GOVERNANCE_PATHS = new Set([
  STATE_PATH,
  GRAVEYARD_PATH,
  PLAN_PATH,
  'talkbridge/TALKBRIDGE-R10-WHOLE-RELEASE-ROOT-CAUSE.md',
  'talkbridge/governance/OWNER-GO.md',
  'talkbridge/build/governance-gate.mjs',
  'talkbridge/build/governance-gate.test.mjs',
  DEPLOY_WORKFLOW,
  GOVERNANCE_WORKFLOW
]);

const BOOTSTRAP_PATHS = new Set([
  STATE_PATH,
  'talkbridge/build/governance-gate.mjs',
  'talkbridge/build/governance-gate.test.mjs',
  DEPLOY_WORKFLOW,
  GOVERNANCE_WORKFLOW
]);

const FORBIDDEN_R106 = [
  /tb_auth_v1/,
  /\/service\/deepgram-token/,
  /\/service\/turn-credentials/,
  /server-issued\s+(?:Deepgram|TURN)/i
];

function readText(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function readJson(root, rel) {
  return JSON.parse(readText(root, rel));
}

function sha256File(root, rel) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function isImplementationPath(rel) {
  if (['bridge-turn24-post-ship.html', 'tb-sw.js'].includes(rel)) return true;
  if (!rel.startsWith('talkbridge/')) return false;
  return !GOVERNANCE_PATHS.has(rel) && !rel.startsWith('talkbridge/device-logs/') && !rel.startsWith('talkbridge/governance/evidence/');
}

function stageIndex(state, stage) {
  return Array.isArray(state.stage_order) ? state.stage_order.indexOf(stage) : -1;
}

function versionAtLeast(actual, minimum) {
  const left = String(actual).split('.').map(Number);
  const right = String(minimum).split('.').map(Number);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (left[index] || 0) - (right[index] || 0);
    if (delta !== 0) return delta > 0;
  }
  return true;
}

function validateEvidence(root, state, errors) {
  const index = stageIndex(state, state.stage);
  const stages = state.stage_order || [];
  assert(index >= 0, `unknown governance stage: ${state.stage}`, errors);
  assert(new Set(stages).size === stages.length, 'stage_order contains duplicates', errors);
  assert(stages.join('|') === 'root_cause_required|plan_required|owner_go_required|build_authorized|candidate_ready|device_gate|accepted', 'stage_order is not the canonical fail-closed sequence', errors);

  if (index < stageIndex(state, 'owner_go_required')) {
    assert(state.owner_authorization?.status !== 'authorized', 'false authorization: owner GO cannot exist before root cause and replacement plan', errors);
  }
  if (index < stageIndex(state, 'build_authorized')) {
    assert(state.candidate?.status === 'blocked', 'candidate must remain blocked before build authorization', errors);
    assert((state.candidate?.allowed_output_files || []).length === 0, 'candidate output files cannot be declared before build authorization', errors);
  }

  if (index >= stageIndex(state, 'plan_required')) {
    const evidence = state.root_cause;
    assert(evidence?.status === 'complete', 'whole-release root cause must be complete before the plan stage', errors);
    assert(typeof evidence?.sha256 === 'string' && evidence.sha256.length === 64, 'root-cause evidence must be SHA-256 pinned', errors);
    if (evidence?.file && fs.existsSync(path.join(root, evidence.file))) {
      assert(sha256File(root, evidence.file) === evidence.sha256, 'root-cause evidence hash does not match', errors);
    } else {
      errors.push('root-cause evidence file is missing');
    }
  }

  if (index >= stageIndex(state, 'owner_go_required')) {
    const evidence = state.replacement_plan;
    assert(evidence?.status === 'complete', 'replacement plan must be complete before owner GO', errors);
    assert(typeof evidence?.version === 'string' && evidence.version.length > 0, 'replacement plan version is missing', errors);
    assert(typeof evidence?.sha256 === 'string' && evidence.sha256.length === 64, 'replacement plan must be SHA-256 pinned', errors);
    if (evidence?.file && fs.existsSync(path.join(root, evidence.file))) {
      assert(sha256File(root, evidence.file) === evidence.sha256, 'replacement plan hash does not match', errors);
    } else {
      errors.push('replacement plan file is missing');
    }
  }

  if (index >= stageIndex(state, 'build_authorized')) {
    const auth = state.owner_authorization;
    assert(auth?.status === 'authorized', 'build is blocked without explicit owner authorization', errors);
    assert(typeof auth?.approved_at === 'string' && auth.approved_at.length > 0, 'owner authorization timestamp is missing', errors);
    assert(typeof auth?.evidence === 'string' && auth.evidence.length > 0, 'owner authorization evidence is missing', errors);
    assert(typeof auth?.exact_words === 'string' && auth.exact_words.trim().length > 0, 'owner authorization must preserve the exact words', errors);
    assert(['authorized', 'built', 'testing', 'accepted'].includes(state.candidate?.status), 'candidate status is not authorized for build work', errors);
    assert(Array.isArray(state.candidate?.allowed_output_files) && state.candidate.allowed_output_files.length > 0, 'authorized build must declare its exact output files', errors);
  }
}

function allowedForStage(state, governingStage) {
  /* The gate's tests are proof, not enforcement: CI re-runs them on every
     change, so they may be corrected at any stage. The gate itself locks
     once the first governed transition is banked. */
  const statePath = new Set([STATE_PATH, 'talkbridge/build/governance-gate.test.mjs']);
  if (governingStage === 'root_cause_required') {
    statePath.add(state.root_cause?.file);
    statePath.add(GRAVEYARD_PATH);
    /* The gate may be corrected only before the first governed transition.
       Once root cause is banked, later stages lock the enforcement files. */
    statePath.add('talkbridge/build/governance-gate.mjs');
    statePath.add('talkbridge/build/governance-gate.test.mjs');
  } else if (governingStage === 'plan_required') {
    statePath.add(state.replacement_plan?.file);
  } else if (governingStage === 'owner_go_required') {
    statePath.add('talkbridge/governance/OWNER-GO.md');
  } else if (governingStage === 'build_authorized') {
    for (const rel of state.candidate?.allowed_output_files || []) statePath.add(rel);
    /* §4.11.7: an internal failing invariant of the gate itself is corrected
       before a candidate exists — the enforcement files may be repaired here. */
    statePath.add('talkbridge/build/governance-gate.mjs');
    statePath.add('talkbridge/build/governance-gate.test.mjs');
  } else if (['candidate_ready', 'device_gate', 'accepted'].includes(governingStage)) {
    statePath.add('talkbridge/governance/evidence/');
  }
  return statePath;
}

function allowedPath(allowed, rel) {
  if (allowed.has(rel)) return true;
  return [...allowed].some(prefix => prefix.endsWith('/') && rel.startsWith(prefix));
}

export function validateSnapshot({ root, changedFiles = [], previousState = null, bootstrap = false }) {
  const errors = [];
  const state = readJson(root, STATE_PATH);

  assert(state.schema === 1, 'unsupported governance schema', errors);
  assert(state.cycle === 'r10-recovery-2026-08-30', 'unexpected R10 recovery cycle', errors);

  /* §4.11.1 / §4.11.7: once the owner GO is banked, the declared output files
     are the candidate and may diverge from the frozen bytes; every other
     baseline file (wrangler.jsonc) stays byte-frozen through acceptance. */
  const buildAuthorized = stageIndex(state, state.stage) >= stageIndex(state, 'build_authorized');
  const candidateOutputs = new Set(buildAuthorized ? (state.candidate?.allowed_output_files || []) : []);
  for (const [rel, expected] of Object.entries(state.baseline?.files || {})) {
    const full = path.join(root, rel);
    assert(fs.existsSync(full), `frozen baseline file is missing: ${rel}`, errors);
    if (candidateOutputs.has(rel)) continue;
    if (fs.existsSync(full)) assert(sha256File(root, rel) === expected, `frozen baseline modified: ${rel}`, errors);
  }

  const graveyard = readText(root, GRAVEYARD_PATH);
  const graveyardVersion = graveyard.match(/\*\*Version:\s*([0-9]+(?:\.[0-9]+)*)\s*\|/)?.[1];
  assert(graveyardVersion && versionAtLeast(graveyardVersion, state.graveyard?.minimum_version), 'graveyard version was lowered or erased', errors);
  for (const marker of state.graveyard?.required_markers || []) {
    assert(graveyard.includes(marker), `graveyard burial marker missing: ${marker}`, errors);
  }

  const plan = readText(root, PLAN_PATH);
  assert(plan.includes('R10.6 rejected and buried whole'), 'plan no longer preserves the R10.6 burial', errors);
  assert(plan.includes('no corrective build authorized'), 'plan falsely authorizes implementation before root cause and replacement plan', errors);

  const deploy = readText(root, DEPLOY_WORKFLOW);
  assert(deploy.includes('name: Enforce TalkBridge release state'), 'relay deployment no longer invokes the governance gate', errors);
  assert(deploy.includes('node talkbridge/build/governance-gate.mjs'), 'relay deployment gate command was removed', errors);

  const workflow = readText(root, GOVERNANCE_WORKFLOW);
  assert(workflow.includes('node talkbridge/build/governance-gate.mjs'), 'pull-request governance workflow no longer invokes the gate', errors);
  assert(workflow.includes('node --test talkbridge/build/governance-gate.test.mjs'), 'governance mutation tests were removed from CI', errors);

  validateEvidence(root, state, errors);

  /* §4.11.7: a machine, live, or device failure rejects the whole pair. The
     only backward transition is the rejection restart — from candidate_ready
     or device_gate straight to root_cause_required of a NEW cycle, with every
     frozen product file restored (the hash rule above applies again below
     build_authorized) and the candidate blocked. */
  const rejectionRestart = Boolean(previousState
    && ['candidate_ready', 'device_gate'].includes(previousState.stage)
    && state.stage === 'root_cause_required'
    && state.candidate?.status === 'blocked'
    && state.owner_authorization?.status !== 'authorized');
  if (previousState) {
    const previousIndex = stageIndex(previousState, previousState.stage);
    const currentIndex = stageIndex(state, state.stage);
    assert(rejectionRestart || currentIndex === previousIndex || currentIndex === previousIndex + 1, `illegal stage transition: ${previousState.stage} -> ${state.stage}`, errors);
    assert(rejectionRestart || state.cycle === previousState.cycle, 'cycle identity changed during an active recovery', errors);
    assert(JSON.stringify(state.baseline) === JSON.stringify(previousState.baseline), 'frozen baseline manifest changed', errors);
    if (rejectionRestart) assert(state.cycle !== previousState.cycle, 'a rejection restart must open a new cycle', errors);
  } else if (!bootstrap) {
    assert(state.stage === 'root_cause_required', 'base state is unavailable; only root_cause_required is fail-closed', errors);
  }

  if (bootstrap) {
    for (const rel of changedFiles) assert(BOOTSTRAP_PATHS.has(rel), `bootstrap changed a non-enforcement file: ${rel}`, errors);
  } else {
    const governingStage = previousState?.stage || state.stage;
    const allowed = allowedForStage(state, governingStage);
    if (rejectionRestart) {
      for (const rel of Object.keys(state.baseline?.files || {})) allowed.add(rel);
      allowed.add(GRAVEYARD_PATH); allowed.add(PLAN_PATH); allowed.add(state.root_cause?.file);
      allowed.add('talkbridge/governance/evidence/');
    }
    for (const rel of changedFiles) {
      assert(allowedPath(allowed, rel), `file is out of order for ${governingStage}: ${rel}`, errors);
    }
  }

  const buildIndex = stageIndex(state, 'build_authorized');
  const previouslyAuthorized = previousState ? stageIndex(previousState, previousState.stage) >= buildIndex : stageIndex(state, state.stage) >= buildIndex;
  if (!previouslyAuthorized) {
    for (const rel of changedFiles) assert(!isImplementationPath(rel), `implementation changed before build authorization: ${rel}`, errors);
  }

  for (const rel of changedFiles.filter(isImplementationPath)) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    const content = fs.readFileSync(full, 'utf8');
    for (const pattern of FORBIDDEN_R106) {
      assert(!pattern.test(content), `buried R10.6 mechanism resurrected in ${rel}: ${pattern}`, errors);
    }
  }

  return { ok: errors.length === 0, stage: state.stage, errors };
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function stateAt(root, baseSha) {
  if (!baseSha || /^0+$/.test(baseSha)) return null;
  try {
    return JSON.parse(git(root, ['show', `${baseSha}:${STATE_PATH}`]));
  } catch {
    return null;
  }
}

function changedAt(root, baseSha) {
  if (!baseSha || /^0+$/.test(baseSha)) return [];
  try {
    return git(root, ['diff', '--name-only', `${baseSha}...HEAD`]).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const baseFlag = process.argv.indexOf('--base');
  const baseSha = baseFlag >= 0 ? process.argv[baseFlag + 1] : process.env.TALKBRIDGE_BASE_SHA;
  const previousState = stateAt(root, baseSha);
  const changedFiles = changedAt(root, baseSha);
  const bootstrap = Boolean(baseSha && !previousState);
  const result = validateSnapshot({ root, changedFiles, previousState, bootstrap });
  if (!result.ok) {
    console.error(`TalkBridge governance gate: FAIL (${result.stage})`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`TalkBridge governance gate: PASS (${result.stage})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
