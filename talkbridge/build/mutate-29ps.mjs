#!/usr/bin/env node
/* 29·pre-ship mutation gate: each mutation breaks or reverts ONE thing MU-1 declares
   (an edit to the part, or a banked replacement left unapplied); harness-29ps must go
   red on the NAMED test. Nothing on disk is modified. The differential (F3) is skipped
   for speed except on the mutations marked f3, which only F3 can catch.
   Usage: node mutate-29ps.mjs      TB_MUT_ONLY=<catches>                                  */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PARTS } from './assemble-29ps.mjs';

const part0 = readFileSync(PARTS[0], 'utf8');
const A1_SHEET = 'F4 A-1 · the create sheet has a Group switch, off, with a size list hidden at 4; off means a room for two, on means the chosen size (base: no switch)';
const A1_URL = 'F4 A-1 · the room\'s cap rides both socket URLs (&cap=N) and only when the room has one (base: never)';
const A1_INV = 'F4 A-1 · the invite carries the size (c) only for a sized room; a joiner takes it from the invite (base: neither)';
const A2 = 'F4 A-2 · full from the relay: one toast, one pill, the lane is not re-asked for 20 s and then is; a second full inside a minute says nothing more (base: silent, re-asked at once)';
const A3_COUNT = 'F4 A-3 · the peer count shows "N here" beside the presence dot once more than two are present, and clears; who is on a call is kept (base: no count)';
const A5_MEMBERS = 'F4 A-5 · each phone learns the others by device from hello / hello-ack / chat, named; the base learns nobody';
const A5_NAMES = 'F4 A-5 · two members with one name display as "name" and "name (2)", by who came first';
const A4_FIRST = 'F4 A-4 · after the first reader: read, one tick, one reader recorded (both builds show ✓)';
const A4_SECOND = 'F4 A-4 · after the second reader: ✓ 2 on the bubble, "Read by 2" in the detail, and a repeat read changes nothing (base: ✓)';
const A5_CHOOSER = 'F4 A-5 · with two others the call button opens a chooser naming them, in order of arrival; nothing is sent until one is picked (base: no chooser)';
const A5_PICK = 'F4 A-5 · the pick starts the call addressed to that phone: only it rings, the caller screen names it, call_to is logged (base: every phone rings, no `to`)';
const A5_BUSY = 'F4 A-5 · a member on a call is offered disabled, marked "on a call"';
const A5_END = 'F4 A-5 · hanging up ends it for the callee and nobody else; afterwards the address is forgotten';
const A5_ONE = 'F4 A-5 · with exactly one other member the call is addressed to it, no chooser, the caller screen names it';
const F16 = 'F1.6 the wiring the rig cannot click is in place: both call buttons go through mu1Call, the create record takes its cap from the sheet';
const F21 = 'F2.1 markers(candidate) = markers(base) ∪ declared; none of the declared was in the base';
const F3_ROOMS = 'F3 X.rooms identical once the declared differences are removed';

const MUTATIONS = [
  { catches: A1_SHEET, name: 'Group off means 4, not 2', edit: (s) => s.replace("if (!g || !g.classList.contains('on')) return 2;", "if (!g || !g.classList.contains('on')) return 4;") },
  { catches: A1_SHEET, name: 'the size list preselects 3', edit: (s) => s.replace("(n === 4 ? ' selected' : '')", "(n === 3 ? ' selected' : '')") },
  { catches: A1_SHEET, name: 'the sheet does not reset the switch on reopen', edit: (s) => s.replace("    g.classList.remove('on');\n", "") },
  { catches: A1_SHEET, name: 'the create sheet gets no switch (replacement 01 unapplied)', keepR: ['01-MU1-openS3-field'] },
  { catches: A1_URL, name: 'an unsized room sends the default cap on the URL', edit: (s) => s.replace("return (c >= 1 && c <= 8) ? '&cap=' + c : '';", "return (c >= 1 && c <= 8) ? '&cap=' + c : '&cap=4';") },
  { catches: A1_URL, name: 'the background lane sends no cap (replacement 03 unapplied)', keepR: ['03-MU1-listen-lane-cap'] },
  { catches: A1_URL, name: 'the room lane sends no cap (replacement 02 unapplied)', keepR: ['02-MU1-room-lane-cap'] },
  { catches: A1_INV, name: 'the invite never carries the size', edit: (s) => s.replace("  if (c >= 1 && c <= 8) p.c = c;\n", "") },
  { catches: A1_INV, name: 'the joiner ignores the size on the invite (replacement 05 unapplied)', keepR: ['05-MU1-join-cap'] },
  { catches: A2, name: 'full sets no hold', edit: (s) => s.replace("  mu1State.hold[room.id] = Date.now() + MU1_FULL_HOLD_MS;\n", "") },
  { catches: A2, name: 'the hold arms no retry for afterwards', edit: (s) => s.replace("    wsReconnectTimer = setTimeout(function () { wsReconnectTimer = null; if (S.view === 'room' && S.roomId === room.id) relayConnect(); }, left + 50);\n", "") },
  { catches: A2, name: 'every full pills again', edit: (s) => s.replace("  if (said && Date.now() - said < 60000) return;\n", "") },
  { catches: A2, name: 'the toast says something else', edit: (s) => s.replace("var text = 'Room is full (' + n + ' of ' + cap + ')';", "var text = 'Room full';") },
  { catches: A2, name: 'the room lane never reads full (replacement 09 unapplied)', keepR: ['09-MU1-room-full'] },
  { catches: A2, name: 'the room lane ignores the hold (replacement 06 unapplied)', keepR: ['06-MU1-room-lane-hold'] },
  { catches: A2, name: 'the background lane never reads full (replacement 08 unapplied)', keepR: ['08-MU1-listen-full'] },
  { catches: A2, name: 'the background lane ignores the hold (replacement 07 unapplied)', keepR: ['07-MU1-listen-lane-hold'] },
  { catches: A3_COUNT, name: 'the count shows at two', edit: (s) => s.replace("el.textContent = others > 1 ? (others + 1) + ' here' : '';", "el.textContent = others > 0 ? (others + 1) + ' here' : '';") },
  { catches: A3_COUNT, name: 'who is on a call is not kept', edit: (s) => s.replace("mu1State.inCall[room.id] = (d && Array.isArray(d.inCall)) ? d.inCall.slice() : [];", "mu1State.inCall[room.id] = [];") },
  { catches: A3_COUNT, name: 'the peer announcement is not read (replacement 10 unapplied)', keepR: ['10-MU1-presence-count'] },
  { catches: A5_MEMBERS, name: 'a line alone teaches no member', edit: (s) => s.replace(" || d.type === 'chat-msg'", "") },
  { catches: A5_MEMBERS, name: 'hello-ack teaches no member', edit: (s) => s.replace(" || d.type === 'hello-ack'", "") },
  /* no mutation for the saveRooms() in mu1Member: every path that teaches a member (hello, chat, rename) saves the record itself a moment later, so dropping it changes nothing observable — kept for the one path that does not (a hello whose name was already known) */
  { catches: A5_MEMBERS, name: 'no evidence is read (replacement 11 unapplied)', keepR: ['11-MU1-member-evidence'] },
  { catches: A5_NAMES, name: 'two members with one name look the same', edit: (s) => s.replace("return k > 1 ? m.name + ' (' + k + ')' : m.name;", "return m.name;") },
  { catches: A4_FIRST, name: 'the single tick carries a count', edit: (s) => s.replace("return n > 1 ? '✓ ' + n : '✓';", "return n > 0 ? '✓ ' + n : '✓';") },
  { catches: A4_FIRST, name: 'readers are not recorded (replacement 15 unapplied)', keepR: ['15-MU1-chat-read'] },
  { catches: A4_SECOND, name: 'every reader counts as the same partner', edit: (s) => s.replace("var k = String(from || 'partner');", "var k = 'partner';") },
  { catches: A4_SECOND, name: 'the bubble never shows the count', edit: (s) => s.replace("return n > 1 ? '✓ ' + n : '✓';", "return '✓';") },
  { catches: A4_SECOND, name: 'the detail never says by how many', edit: (s) => s.replace("return n > 1 ? 'Read by ' + n : 'Read';", "return 'Read';") },
  { catches: A4_SECOND, name: 'the bubble shows the single tick (replacement 12 unapplied)', keepR: ['12-MU1-receipt-tok'] },
  { catches: A5_CHOOSER, name: 'the chooser is skipped: the first other is called', edit: (s) => s.replace("  if (others.length <= 1) {", "  if (others.length >= 1) {") },
  { catches: A5_CHOOSER, name: 'the chooser lists in no order', edit: (s) => s.replace(".sort(function (a, b) { return (ms[a].at - ms[b].at) || (a < b ? -1 : 1); })", ".sort(function (a, b) { return (ms[b].at - ms[a].at) || (a < b ? 1 : -1); })") },
  { catches: A5_PICK, name: 'the address is dropped from the call', edit: (s) => s.replace("  if (to) m.to = to;\n", "") },
  { catches: A5_PICK, name: 'the caller screen names the last to speak, not the pick (replacement 19 unapplied)', keepR: ['19-MU1-n10-name'] },
  { catches: A5_PICK, name: 'the call is not addressed (replacement 16 unapplied)', keepR: ['16-MU1-call-start-to'] },
  { catches: A5_BUSY, name: 'a member on a call can still be picked', edit: (s) => s.replace("    if (o.inCall) b.disabled = true;\n", "") },
  { catches: A5_END, name: 'the address is never forgotten', edit: (s) => s.replace("var to = CALL._to || null; CALL._to = null;", "var to = CALL._to || null;") },
  { catches: A5_ONE, name: 'one other member is not addressed', edit: (s) => s.replace("    CALL._to = others.length ? others[0].id : null;", "    CALL._to = null;") },
  { catches: F16, name: 'the voice button bypasses the chooser (replacement 18 unapplied)', keepR: ['18-MU1-btn-call'] },
  { catches: F16, name: 'the create record takes no cap (replacement 00 unapplied)', keepR: ['00-MU1-create-record'] },
  { catches: F21, name: 'an undeclared marker is logged', edit: (s) => s.replace("  el.textContent = others > 1 ? (others + 1) + ' here' : '';", "  el.textContent = others > 1 ? (others + 1) + ' here' : ''; log('mu1_count', { n: others }, 'ok');") },
  { catches: F3_ROOMS, name: 'the count is written onto the room record (an undeclared difference in two-phone use)', f3: true, edit: (s) => s.replace("  mu1State.others[room.id] = others;\n", "  mu1State.others[room.id] = others; room._others = others; saveRooms();\n") },
];
const ONLY = process.env.TB_MUT_ONLY || null;
const WORKERS = Math.max(1, Number(process.env.TB_MUT_WORKERS || 4));
const dir = mkdtempSync(path.join(tmpdir(), 'tb-29ps-mut-'));
const jobs = MUTATIONS.map((m, i) => ({ m, i })).filter(({ m }) => !ONLY || m.catches === ONLY);
const results = new Array(MUTATIONS.length);
function runOne({ m, i }) {
  return new Promise((resolve) => {
    let part = part0;
    if (m.edit) { part = m.edit(part0); if (part === part0) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); }
    const partPath = path.join(dir, 'mu1-' + i + '.js'); writeFileSync(partPath, part);
    let html; try { html = assemble({ parts: [part], keepReplacements: m.keepR || [] }); } catch (e) { return resolve({ ok: false, line: 'MISS  assembly refused: ' + m.name + ' — ' + e.message }); }
    const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
    const env = { ...process.env, TB_MU1_PARTS: partPath, TB_MU1_KEEP_R: (m.keepR || []).join(',') };
    if (!m.f3) env.TB_SKIP_F3 = '1';
    const child = spawn('node', ['talkbridge/build/harness-29ps.mjs', builtPath], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
    child.on('close', (exit) => {
      const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
      if (exit !== 0 && named) resolve({ ok: true, line: '  ok  [' + m.catches.slice(0, 44) + '] catches: ' + m.name });
      else resolve({ ok: false, line: 'MISS  [' + m.catches.slice(0, 44) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 90)).join(' / ') + ')') });
    });
  });
}
let next = 0;
async function worker() { while (next < jobs.length) { const j = jobs[next++]; results[j.i] = await runOne(j); console.log(results[j.i].line); } }
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, worker));
const caught = results.filter((r) => r && r.ok).length, missed = results.filter((r) => r && !r.ok).length;
rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
