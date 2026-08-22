#!/usr/bin/env node
/* Relay wake-decision gate. Tests the pure predicate the worker exports and
   statically verifies the two integration points. */
import { readFileSync } from 'fs';
import { isListening } from '../worker-talk.js';
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + e.message); } };
const A = (c, m) => { if (!c) throw new Error(m); };
const now = 1000000;

T('fresh ping + live socket = listening (no push)', () => A(isListening(true, now - 30000, now) === true, ''));
T('silent 80s despite live socket = NOT listening (push) — the zombie case', () => A(isListening(true, now - 80000, now) === false, ''));
T('no socket at all = not listening, regardless of pings', () => A(isListening(false, now - 1000, now) === false, ''));
T('never seen (worker restarted) = stale = wake — fails safe', () => A(isListening(true, undefined, now) === false, ''));

const src = readFileSync(new URL('../worker-talk.js', import.meta.url), 'utf8');
T('inbound socket messages stamp lastSeen', () => A(src.includes('this.lastSeen[clientId] = Date.now()'), 'stamp missing'));
T('wake decision uses the predicate, not raw socket presence', () => {
  A(src.includes('isListening(connected.has(clientId), this.lastSeen[clientId], now)'), 'predicate not wired');
  A(!src.includes('if (connected.has(clientId)) continue;             /* already listening */'), 'old socket-only check still present');
});
T('wakes request immediate delivery (Urgency high)', () => A(src.includes("Urgency: 'high'"), 'urgency header missing'));
T('still payload-free: no message content leaves for the push service', () => A(src.includes("'Content-Length': '0'"), 'payload appeared'));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
