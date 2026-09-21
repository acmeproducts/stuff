#!/usr/bin/env node
/* 27·post-ship mutation gate (§7.14 M5).

   Each mutation reintroduces, in one part's source, exactly the defect one
   harness test claims to catch. The harness must fail, and it must fail on the
   NAMED test. Nothing on disk is modified: each mutation is assembled into a
   scratch build under the system temp directory and thrown away.

   Usage: node mutate-27ps.mjs                                                */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PARTS } from './assemble-27ps.mjs';

const P = { d1: 0, c1: 1, c3: 2, c2: 3 };
const src = PARTS.map((p) => readFileSync(p, 'utf8'));

const MUTATIONS = [
  { part: P.c1, catches: 'M3a.1', name: 'C-1 once-guard removed → every retry enqueues a fresh retry chain (storm)',
    apply: (s) => s.replace('if (!ok && !m._c1) {', 'if (!ok) {') },
  { part: P.c1, catches: 'M3a.2', name: 'C-1 queues every dropped message, not just signalling',
    apply: (s) => s.replace("if (m && m.type === 'webrtc-signal') {", 'if (m) {') },
  { part: P.c3, catches: 'M3b.2', name: 'C-3 joiner step 2 calls through instead of returning → the dead end is back',
    apply: (s) => s.replace("log('c3_restart_requested', { reason: reason, sent: !!sent }, 'warn');", "log('c3_restart_requested', { reason: reason, sent: !!sent }, 'warn'); this.recoveryLock = false; this.recoveryStep = 1; return _runRecovery.apply(this, arguments);") },
  { part: P.c3, catches: 'M3b.4', name: 'C-3 joiner cannot answer a restart offer (ufrag branch removed)',
    apply: (s) => s.replace('if (cur && nxt && cur !== nxt) {', 'if (false) {') },
  { part: P.c3, catches: 'M3b.6', name: 'C-3 creator rate limit removed → served twice',
    apply: (s) => s.replace('if (now - this._c3LastServed < C3_MIN_GAP_MS) {', 'if (false) {') },
  { part: P.c3, catches: 'M3b.8', name: 'C-3 fires on the creator too → creator asks itself for a restart',
    apply: (s) => s.replace("if (this.active && r && r.role !== 'creator' && !this.recoveryLock &&", 'if (this.active && r && !this.recoveryLock &&') },
  { part: P.c3, catches: 'M2.2', name: 'C-3 replaces runRecovery outright instead of wrapping it',
    apply: (s) => s.replace('return _runRecovery.apply(this, arguments);', 'return;') },
  { part: P.c2, catches: 'M3d.1', name: 'C-2 arms before the first decoded frame',
    apply: (s) => s.replace('if (!armed) { if (frames > 0) { armed = true; last = frames; } return; }', 'if (!armed) { armed = true; last = frames; return; }') },
  { part: P.c2, catches: 'M3c.1', name: 'C-2 stall threshold is one sample',
    apply: (s) => s.replace('var C2_STILL = 3;', 'var C2_STILL = 1;') },
  { part: P.c2, catches: 'M3c.4', name: 'C-2 fires while the connection is already disconnected → double repair',
    apply: (s) => s.replace("if (pc.connectionState !== 'connected') { still = 0; return; }", '') },
  { part: P.c2, catches: 'M3c.5', name: 'C-2 sampler survives stopVideoWatchdog',
    apply: (s) => s.replace('clearInterval(this.c2Timer); this.c2Timer = null;\n    return _stop.apply(this, arguments);', 'return _stop.apply(this, arguments);') },
  { part: P.c2, catches: 'M6.1', name: 'a part retunes the baseline connect timeout',
    apply: (s) => s + '\nCALL.CONNECT_TIMEOUT_MS = 9000;\n' },
  { part: P.c3, catches: 'M1.2', name: 'the baseline is edited instead of appended to',
    apply: (s) => s, mangleBuild: (html) => html.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 20001;') }
];

const dir = mkdtempSync(path.join(tmpdir(), 'tb-27ps-mut-'));
let caught = 0, missed = 0;

for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  const mutated = m.apply(src[m.part]);
  if (!m.mangleBuild && mutated === src[m.part]) { console.log('MISS  ' + m.catches + ' — mutation did not apply (source moved?): ' + m.name); missed++; continue; }
  const overrides = src.slice(); overrides[m.part] = mutated;
  const partPaths = overrides.map((s, k) => { const p = path.join(dir, 'part-' + i + '-' + k + '.js'); writeFileSync(p, s); return p; });
  let html = assemble(overrides);
  if (m.mangleBuild) html = m.mangleBuild(html);
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);

  let out = '', exit = 0;
  try {
    out = execFileSync('node', ['talkbridge/build/harness-27ps.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_PART_OVERRIDE: JSON.stringify(partPaths) } });
  } catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }

  const named = new RegExp('FAIL\\s+' + m.catches.replace(/\./g, '\\.') + '(?![\\w.])').test(out);
  if (exit !== 0 && named) { console.log('  ok  ' + m.catches + ' catches: ' + m.name); caught++; }
  else { console.log('MISS  ' + m.catches + ' did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed)')); missed++; }
}

rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + MUTATIONS.length + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
