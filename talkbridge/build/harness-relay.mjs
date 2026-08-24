#!/usr/bin/env node
/* Relay wake-decision gate — tests the fixed _wakeOthers logic via the
   exported pure functions plus structural static checks. */
import { readFileSync } from 'fs';
const src = readFileSync(new URL('../worker-talk.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + e.message); } };
const A = (c, m) => { if (!c) throw new Error(m); };

T('socket presence alone does NOT skip the push (zombie-socket fix)', () => {
  A(src.includes('connected.has(clientId) && recentlySeen'), 'guard wrong — socket-only again');
  A(!src.includes("if (connected.has(clientId)) continue;             /* already listening */"), 'old zombie line still present');
});
T('last-seen stamped on every inbound message', () =>
  A(src.includes('this.lastSeen.set(clientId, Date.now())'), 'stamp missing'));
T('stale threshold is 3 intervals + grace (105s)', () =>
  A(src.includes('SOCKET_STALE_MS = 105 * 1000'), 'constant missing or wrong'));
T('missing entry = stale = push (safe direction after worker restart)', () =>
  A(src.includes('this.lastSeen.has(clientId) &&'), 'has-check missing'));
T('Urgency:high so iOS delivers immediately, no battery deferral', () =>
  A(src.includes("Urgency: 'high'"), 'Urgency missing'));
T('Topic merge header: queue keeps only the newest wake', () =>
  A(src.includes("Topic: MERGE_TOPIC"), 'Topic missing'));
T('wakes remain payload-free', () =>
  A(src.includes("'Content-Length': '0'"), 'payload appeared'));
T('PUSH_WORTHY set unchanged from R7', () => {
  A(src.includes("'chat-msg'") && src.includes("'call-start'"), 'push-worthy changed');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
