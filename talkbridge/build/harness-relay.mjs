#!/usr/bin/env node
/* Relay v2 gate — RV2.1/2.2/2.3 on the R7 body, per plan v16.0.0 §4a. */
import { readFileSync } from 'fs';
const src = readFileSync(new URL('../worker-talk.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + e.message); } };
const A = (c, m) => { if (!c) throw new Error(m); };

T('RV2.1 socket alone is not presence — freshness required', () => {
  A(src.includes('connected.has(clientId) && fresh'), 'freshness not in the wake decision');
  A(!src.includes("if (connected.has(clientId)) continue;             /* already listening */"), 'R7 socket-only line still live');
});
T('RV2.1 every inbound message stamps lastSeen', () =>
  A(src.includes('this.lastSeen.set(clientId, Date.now())'), 'stamp missing'));
T('RV2.1 threshold 105s; missing entry = stale = wake (safe after restart)', () => {
  A(src.includes('SOCKET_STALE_MS = 105 * 1000'), 'threshold wrong');
  A(src.includes('this.lastSeen.has(clientId) &&'), 'missing-entry direction wrong');
});
T('RV2.2 Urgency high + Topic merge on every wake', () => {
  A(src.includes("Urgency: 'high'") && src.includes('Topic: MERGE_TOPIC'), 'headers missing');
});
T('RV2.2 wakes stay payload-free', () => A(src.includes("'Content-Length': '0'"), 'payload appeared'));
T('RV2.3 diag action exists, read-only, reports connected/subs/lastSeen/lastWake', () => {
  A(src.includes("body.type === 'diag'"), 'diag missing');
  A(src.includes('lastWake: this.lastWake'), 'lastWake not reported');
  A(!/diag[\s\S]{0,400}(this\.subs\[[^\]]*\]\s*=|_persist|_broadcast)/.test(src), 'diag is not read-only');
});
T('RV2.3 wake attempts recorded with their result', () => {
  A(src.includes("result: 'attempting'") && src.includes("'status-' + res.status"), 'attempt evidence missing');
});
T('R7 body otherwise intact: broadcast, history, hello, PUSH_WORTHY unchanged', () => {
  for (const t of ["'chat-msg'", "'call-start'", '_broadcast', 'history']) A(src.includes(t), t + ' missing');
  A(!src.includes('_did') && !src.includes('ACK_GRACE'), 'buried designs leaked back in');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
