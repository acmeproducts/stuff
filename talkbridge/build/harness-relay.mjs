#!/usr/bin/env node
/* Relay wake-decision gate. Tests the pure predicate the worker exports and
   statically verifies the two integration points. */
import { readFileSync } from 'fs';
import { wakeDecision } from '../worker-talk.js';
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + e.message); } };
const A = (c, m) => { if (!c) throw new Error(m); };
const src = readFileSync(new URL('../worker-talk.js', import.meta.url), 'utf8');
T('no socket => push immediately, socket => await confirmation', () => {
  A(wakeDecision(false) === 'push-now' && wakeDecision(true) === 'await-ack', 'decision wrong');
});
T('push-worthy messages carry a delivery id', () => A(src.includes("msg._did = (msg.ts || Date.now())"), 'no delivery id'));
T('a delivered confirmation cancels exactly its pending push', () => {
  A(src.includes("msg.type === 'delivered' && msg.did && clientId"), 'ack not handled');
  A(src.includes('clearTimeout(t); this.pendingWakes.delete(key);'), 'ack does not cancel');
});
T('silence for the grace period fires the push', () => {
  A(src.includes('setTimeout(') && src.includes('ACK_GRACE_MS'), 'grace timer missing');
  A(src.includes('self._pushOne(clientId, rec)'), 'expiry does not push');
});
T("'delivered' is transient: never persisted, never re-broadcast", () =>
  A(src.includes("'delivered']"), 'delivered not in transient set'));
T('presence is never guessed: the old staleness heuristic is gone', () =>
  A(!src.includes('PRESENCE_TTL_MS'), 'heuristic still present'));
T('wakes request immediate delivery (Urgency high)', () => A(src.includes("Urgency: 'high'"), 'urgency header missing'));
T('still payload-free: no message content leaves for the push service', () => A(src.includes("'Content-Length': '0'"), 'payload appeared'));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
