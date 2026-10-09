#!/usr/bin/env node
/* 29·base relay mutation gate: each mutation breaks one v6.7 rule in a copy of the
   worker; harness-relay-v67 must fail the NAMED scenario. Nothing on disk changes. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
const src = readFileSync('talkbridge/worker-talk.js', 'utf8');
const N = (n) => ({ N1: 'N1 fan-out', N2: 'N2 the default cap', N3: 'N3 the creator\'s cap', N4: 'N4 an addressed call', N5: 'N5 today\'s app unchanged', N6: 'N6 presence for N', N7: 'N7 the refused socket is inert' })[n];
const M = [
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
  { catches: 'N6', name: 'the announcement no longer names who is in a call', edit: (s) => s.replace("others: others.length, inCall: inCall, at: Date.now()", "others: others.length, at: Date.now()") },
  { catches: 'N6', name: 'the call\'s end is not announced', edit: (s) => s.replace("try { await this._applyCallWord(msg, clientId, sessionOf(ws)); } catch (_) {} try { this._announcePeers(); } catch (_) {} }", "try { await this._applyCallWord(msg, clientId, sessionOf(ws)); } catch (_) {} }") },
  { catches: 'N1', name: 'the version is not bumped', edit: (s) => s.replace("const RELAY_VERSION = '6.7';", "const RELAY_VERSION = '6.6';") },
];
const dir = mkdtempSync(path.join(tmpdir(), 'tb-relay-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i]; const mutated = m.edit(src);
  if (mutated === src) { console.log('MISS  mutation did not apply: ' + m.name); missed++; continue; }
  const f = path.join(dir, 'worker-' + i + '.js'); writeFileSync(f, mutated);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-relay-v67.mjs', '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_WORKER: f } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + N(m.catches)));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong scenario failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ') + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nrelay mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
