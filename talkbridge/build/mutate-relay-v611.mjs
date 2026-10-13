#!/usr/bin/env node
/* 29·post-ship c4 relay mutation gate: each mutation breaks one v6.7–v6.11 rule in a copy of the
   worker; harness-relay-v611 must fail the NAMED scenario. Nothing on disk changes. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
const src = readFileSync('talkbridge/worker-talk.js', 'utf8');
const N = (n) => ({ Q1: 'Q1 the peer announce carries reach', Q2: 'Q2 call-reach to the caller', Q3: 'Q3 a muted callee counts as muted', Q4: 'Q4 a chat sends no call-reach', N1: 'N1 fan-out', N2: 'N2 the default cap', N3: 'N3 the creator\'s cap', N4: 'N4 an addressed call', N5: 'N5 today\'s app unchanged', N6: 'N6 presence for N', N7: 'N7 the refused socket is inert', D1: 'D1 a dead endpoint is remembered', D2: 'D2 a fresh endpoint is welcome', P1: 'P1 the presence word survives a sleep', P2: 'P2 a word rides a socket', R1: 'R1 receipts from the record, both online', R2: 'R2 receipts from the record, B away', P3: 'P3 a state word announces at once' })[n];
const M = [
  { catches: 'Q1', name: 'the announce carries no reach', edit: (s) => s.replace("inCall: inCall, reach: reach, at: Date.now()", "inCall: inCall, at: Date.now()") },
  { catches: 'Q1', name: 'the asker counts itself', edit: (s) => s.replace("for (const id of this._recipients(excludeId)) {", "for (const id of [...this._recipients(excludeId), excludeId]) {") },
  { catches: 'Q1', name: 'a stale subscription counts as fresh', edit: (s) => s.replace("if (rec && rec.at && now - rec.at <= REACH_FRESH_MS) subs++;", "if (rec) subs++;") },
  { catches: 'Q1', name: 'subscribe does not announce (the mark waits for the heartbeat)', edit: (s) => s.replace("        try { this._announcePeers(); } catch (_) {}                             /* v6.11: the partner's mark follows Turn on at once, not at the next heartbeat */\n", "") },
  { catches: 'Q1', name: 'unsubscribe does not announce', edit: (s) => s.replace("        try { this._announcePeers(); } catch (_) {}                             /* v6.11 */\n", "") },
  { catches: 'Q2', name: 'the caller is never told', edit: (s) => s.replace("      if (ev.kind === 'call') { try { this._sendCallReach(ev, clientId); } catch (_) {} }", "") },
  { catches: 'Q2', name: 'call-reach is computed before the push attempt (a failure is never seen)', edit: (s) => s.replace("      try { await this._deliverByRecord(ev, sessionOf(ws)); } catch (_) {}\n      if (ev.kind === 'call') { try { this._sendCallReach(ev, clientId); } catch (_) {} }", "      if (ev.kind === 'call') { try { this._sendCallReach(ev, clientId); } catch (_) {} }\n      try { await this._deliverByRecord(ev, sessionOf(ws)); } catch (_) {}") },
  { catches: 'Q2', name: 'a failed push counts as pushed', edit: (s) => s.replace("else if (r.push === 'failed') none++;", "else if (r.push === 'failed') pushed++;") },
  { catches: 'Q3', name: 'a muted callee counts as nothing', edit: (s) => s.replace("else if (r.p === 'muted') muted++;", "else if (r.p === 'muted') {}") },
  { catches: 'Q2', name: 'call-reach goes to every socket (the callee hears it too)', edit: (s) => s.replace("this._sendTo(callerId, { type: 'call-reach', transient: true, callId: ev.callId, app, pushed, none, muted, at: Date.now() });", "this._broadcast({ type: 'call-reach', transient: true, callId: ev.callId, app, pushed, none, muted, at: Date.now() }, '');") },
  { catches: 'N2', name: 'the cap is never enforced', edit: (s) => s.replace("if (!connected.has(clientId) && connected.size >= this._capOf()) {", "if (false) {") },
  { catches: 'N2', name: 'the refused device is still noted as a recipient', edit: (s) => s.replace("        try { pair[1].close(4001, 'full'); } catch (_) {}\n        return new Response(null, { status: 101, webSocket: pair[0] });", "        try { pair[1].close(4001, 'full'); } catch (_) {}\n        await this._noteDevice(clientId);\n        return new Response(null, { status: 101, webSocket: pair[0] });") },
  { catches: 'N2', name: 'a second socket of a connected device counts as a new device', edit: (s) => s.replace("if (!connected.has(clientId) && connected.size >= this._capOf()) {", "if (connected.size >= this._capOf()) {") },
  { catches: 'N3', name: 'the creator\'s cap is ignored', edit: (s) => s.replace("if (!this.cap && capParam >= 1 && capParam <= 8) { this.cap = capParam; await this.state.storage.put({ cap: this.cap }); }", "") },
  { catches: 'N3', name: 'a later socket may raise the cap', edit: (s) => s.replace("if (!this.cap && capParam >= 1 && capParam <= 8)", "if (capParam >= 1 && capParam <= 8)") },
  { catches: 'N3', name: 'the cap does not survive a restart', edit: (s) => s.replace("this.cap = Number(stored.get('cap')) || 0;", "this.cap = 0;") },
  { catches: 'N4', name: 'an addressed message fans out to everyone', edit: (s) => s.replace("      if (to && !(tag && tag.clientId === to)) continue;\n", "") },
  { catches: 'N4', name: 'an addressed event is recorded for everyone', edit: (s) => s.replace("for (const cid of (ev.to ? [ev.to] : this._recipients(senderId))) {", "for (const cid of this._recipients(senderId)) {") },
  { catches: 'N4', name: 'the words of an addressed call are not routed', edit: (s) => s.replace("    try { this._routeByCall(msg, clientId); } catch (_) {}                /* v6.7 R1 */\n", "") },
  { catches: 'N4', name: 'the callee\'s words go back to everyone (only the caller\'s are routed)', edit: (s) => s.replace("    else if (clientId === ev.to) msg.to = ev.from;\n", "") },
  { catches: 'N5', name: 'an unaddressed call is routed as if addressed to its first recipient', edit: (s) => s.replace("    if (!ev || !ev.to) return;", "    if (!ev) return; if (!ev.to) ev.to = Object.keys(ev.rcp)[0];") },
  { catches: 'N6', name: 'the announcement no longer names who is in a call', edit: (s) => s.replace("others: others.length, inCall: inCall, reach: reach, at: Date.now()", "others: others.length, reach: reach, at: Date.now()") },
  { catches: 'N6', name: 'the call\'s end is not announced', edit: (s) => s.replace("try { await this._applyCallWord(msg, clientId, sessionOf(ws)); } catch (_) {} try { this._announcePeers(); } catch (_) {} }", "try { await this._applyCallWord(msg, clientId, sessionOf(ws)); } catch (_) {} }") },
  { catches: 'N1', name: 'the version is not bumped', edit: (s) => s.replace("const RELAY_VERSION = '6.11';", "const RELAY_VERSION = '6.10';") },
  { catches: 'D1', name: 'a 410 is not remembered (the dead endpoint is accepted again at the next boot — the 2026-10-10 loop)', edit: (s) => s.replace("        await this._noteDead(endpoint);\n", "") },
  { catches: 'D1', name: 'a re-offered dead endpoint is accepted', edit: (s) => s.replace("        if (this._isDead(body.subscription.endpoint)) {", "        if (false) {") },
  { catches: 'D1', name: 'the dead memory does not survive a restart', edit: (s) => s.replace("      this.dead = stored.get('dead') || {};\n", "") },
  { catches: 'P1', name: 'the presence words live in memory only again (a sleep forgets everyone)', edit: (s) => s.replace("      this.states = stored.get('states') || {};\n", "") },
  { catches: 'P1', name: 'a heartbeat\'s word is not written through', edit: (s) => s.replace("muted: msg.muted === true, at: Date.now() }; await this._saveStates(); }", "muted: msg.muted === true, at: Date.now() }; }") },
  { catches: 'P2', name: 'a persisted word counts without a socket (a ghost)', edit: (s) => s.replace("if (st && st.inRoom === true && attached.has(id)) present.push(id);", "if (st && st.inRoom === true) present.push(id);") },
  { catches: 'R1', name: 'the sender is not told when a recipient has seen', edit: (s) => s.replace("    if (changed) { await this._saveEvents(); for (const sid of senders) this._pushProjection(sid); }   /* v6.9", "    if (changed) { await this._saveEvents(); }   /* v6.9") },
  { catches: 'R1', name: 'delivered is never recorded at fan-out', edit: (s) => s.replace("      if (this._isConnected(cid)) ev.rcp[cid].dv = now;", "") },
  { catches: 'R2', name: 'a device that syncs is not counted as having the bytes', edit: (s) => s.replace("      await this._markDelivered(clientId);                                   /* v6.9: a device that syncs has the bytes */\n", "") },
  { catches: 'R2', name: 'the sync reply carries no record of the asker\'s own messages', edit: (s) => s.replace("return { ok: true, proj: p.proj, unseen: p.unseen, calls: p.calls, mine: p.mine };", "return { ok: true, proj: p.proj, unseen: p.unseen, calls: p.calls };") },
  { catches: 'P3', name: 'a state word updates the record but announces nothing (the v6.5 shape — presence paced by the heartbeat)', edit: (s) => s.replace("      try { this._announcePeers(); } catch (_) {}                             /* v6.10 (G71)", "      /* v6.10 (G71)") },
  { catches: 'D2', name: 'every endpoint of a device that once died is refused', edit: (s) => s.replace("_isDead(endpoint) { return !!(endpoint && this.dead[endpoint]); }", "_isDead(endpoint) { return Object.keys(this.dead).length > 0; }") },
];
const dir = mkdtempSync(path.join(tmpdir(), 'tb-relay-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i]; const mutated = m.edit(src);
  if (mutated === src) { console.log('MISS  mutation did not apply: ' + m.name); missed++; continue; }
  const f = path.join(dir, 'worker-' + i + '.js'); writeFileSync(f, mutated);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-relay-v611.mjs', '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_WORKER: f } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + N(m.catches)));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong scenario failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ') + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nrelay mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
