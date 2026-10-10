#!/usr/bin/env node
/* 29·pre-ship harness — MULTI-USER, the app leg (MU-1, §7.8 A-1…A-5), candidate 1.

   The base (29·pre-base = accepted 28·post-ship c2) and the candidate run the
   whole 28·post-ship script side by side; everything is compared and the ONLY
   differences allowed are the ones MU-1 declares (its markers, the members a
   room learns, the readers a receipt counts, the two rows on the create sheet,
   `to` on a call). Then three fake phones in one room prove each A-part on
   the candidate and show the old behaviour on the base. Mutation-tested by
   build/mutate-29ps.mjs.

   Usage: node harness-29ps.mjs [candidate.html]
          TB_MU1_PARTS=<part.js>  TB_MU1_KEEP_R=id,id  TB_MU1_REPS=<edited replacements.json> */
import { readFileSync } from 'fs';
import { PARTS, ADDED_MARKERS, ADDED_SYMBOLS, NETWORK_CHANGE, assemble, replacements, base as baseText } from './assemble-29ps.mjs';
import { makeWindow, runBoth, KEYS, diff, mask, tick, sleep, clock } from './rig-28pos.mjs';

const candP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn29-multi-user-v1.html';
const cand = readFileSync(candP, 'utf8');
const base = baseText();
const parts = PARTS.map((p) => process.env.TB_MU1_PARTS ? readFileSync(process.env.TB_MU1_PARTS, 'utf8') : readFileSync(p, 'utf8'));
const [mu1] = parts;
const KEEP_R = process.env.TB_MU1_KEEP_R ? process.env.TB_MU1_KEEP_R.split(',') : [];
const REPS = process.env.TB_MU1_REPS ? JSON.parse(readFileSync(process.env.TB_MU1_REPS, 'utf8')) : null;

let pass = 0, fail = 0;
const T = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const inline = (html) => html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };
const netLines = (js) => code(js).split('\n').filter((l) => /new WebSocket\(|\bfetch\(|RELAY_WS|tb_dg_key|tb_cf_tid|tb_cf_tok|credentials\/generate|deepgram\.com/.test(l)).map((l) => l.trim());
const dl = (I, ev) => I.w.debugLog.filter((l) => l.ev === ev);
const contractOf = (p) => { const i = p.indexOf('@contract'); return p.slice(i, p.indexOf('*/', i)); };

/* ── F1 · THE CANDIDATE IS THE BASE PLUS TWENTY BANKED REPLACEMENTS PLUS ONE PART ── */
console.log('F1 · candidate === base + 20 banked replacements + MU-1, nothing else');
await T('F1.1 candidate is the assembler\'s output (every replacement by its banked bytes, the part appended)', () => assert(cand === assemble({ parts, keepReplacements: KEEP_R, replacements: REPS }), 'candidate ≠ assemble()'));
await T('F1.2 every find text was in the base exactly once and is gone; every replacement is in the candidate exactly once', () => {
  const reps = REPS || replacements(); assert(reps.length === 20, 'expected 20 replacements, got ' + reps.length);
  for (const r of reps) {
    assert(base.split(r.find).length - 1 === 1, r.id + ': find text not exactly once in the base');
    if (KEEP_R.includes(r.id)) continue;
    assert(cand.split(r.find).length - 1 === r.replace.split(r.find).length - 1, r.id + ': find text still in the candidate');
    assert(cand.split(r.replace).length - 1 === 1, r.id + ': replacement not exactly once in the candidate');
  }
});
await T('F1.3 the part replaces and wraps nothing; each symbol it adds is declared and bound once in the candidate, never in the base', () => {
  const c = contractOf(mu1); assert(/replaces:\s*\(none\)/.test(c) && /wraps:\s*\(none\)/.test(c), 'MU-1 must replace and wrap nothing');
  const js = code(inline(cand)), bjs = code(inline(base));
  for (const s of ADDED_SYMBOLS) {
    assert(new RegExp('adds:[^\\n]*\\b' + s + '\\b').test(c), s + ' not declared in adds:');
    const re = new RegExp('^(?:function\\s+' + s + '\\s*\\(|var\\s+' + s + '\\s*=)', 'mg');
    assert((js.match(re) || []).length === 1, s + ' bound ' + (js.match(re) || []).length + ' times in the candidate');
    assert((bjs.match(re) || []).length === 0, s + ' already bound in the base');
  }
  const declared = (c.match(/adds:([^\n]*)/) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean);
  const defined = [...new Set([...code(mu1).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2]))];
  for (const d of defined) assert(declared.includes(d), 'MU-1 defines ' + d + ' but does not declare it');
});
await T('F1.4 the only network line that changes is the socket URL, in both lanes, by the room\'s cap; the part touches no network, no credential, no storage key', () => {
  const b = netLines(inline(base)), cnd = netLines(inline(cand));
  const changed = cnd.filter((l) => !b.includes(l)), lost = b.filter((l) => !cnd.includes(l));
  assert(changed.length === 2 && lost.length === 2, 'network lines changed: ' + changed.length + ', lost: ' + lost.length + '\n' + changed.join('\n'));
  for (const l of changed) { const back = l.replace(NETWORK_CHANGE.replace, NETWORK_CHANGE.find); assert(back !== l && lost.includes(back), 'a network line changed by more than the cap: ' + l); }
  assert(netLines(mu1).length === 0, 'MU-1 carries a network or credential line');
  assert(!/localStorage|sessionStorage|indexedDB|RELAY_|tb_/.test(code(mu1)), 'MU-1 touches storage or relay constants');
});
await T('F1.5 no new relay message type is sent: the part and the replacements send only types the base sends; `full` is read, never sent', () => {
  const bt = types(code(inline(base)));
  const sent = new Set([...types(code(mu1)), ...(REPS || replacements()).flatMap((r) => [...types(r.replace)])]);
  for (const t of sent) assert(bt.has(t), 'new message type ' + t);
  assert(!/type:\s*'full'/.test(code(mu1)), 'the part sends full');
});

await T('F1.6 the wiring the rig cannot click is in place: both call buttons go through mu1Call, the create record takes its cap from the sheet', () => {
  const js = code(inline(cand));
  assert(/if\(!CALL\.active\)mu1Call\('video'\)/.test(js) && /if\(!CALL\.active\)mu1Call\('voice'\)/.test(js), 'a call button still calls CALL.start directly');
  assert(!/if\(!CALL\.active\)CALL\.start\('(?:video|voice)'\)/.test(js), 'a direct CALL.start button survives');
  assert(/role:'creator',cap:mu1CapFromSheet\(\),title:''/.test(js), 'the create record does not take its cap from the sheet');
});

/* ── F2 · MARKERS ── */
console.log('F2 · the candidate\'s log markers are the base\'s plus exactly the declared ones');
await T('F2.1 markers(candidate) = markers(base) ∪ declared; none of the declared was in the base', () => {
  const bm = markers(inline(base)), cm = markers(inline(cand));
  for (const m of ADDED_MARKERS) assert(!bm.has(m), m + ' already in the base');
  const extra = [...cm].filter((m) => !bm.has(m) && !ADDED_MARKERS.includes(m)), missing = [...bm].filter((m) => !cm.has(m));
  assert(extra.length === 0, 'undeclared markers: ' + extra.join(', '));
  assert(missing.length === 0, 'base markers lost: ' + missing.join(', '));
  for (const m of ADDED_MARKERS) assert(cm.has(m), 'declared marker never logged: ' + m);
});

/* ── F3 · DIFFERENTIAL: the whole 28·post-ship script on both builds ── */
console.log('F3 · both builds through the whole script: identical but for the declared differences');
const SKIP_F3 = !!process.env.TB_SKIP_F3;
const { snapA, snapC, RA, RC } = SKIP_F3 ? { snapA: null, snapC: null, RA: null, RC: null } : await runBoth(base, cand);
const S3_ROWS = /<div class="toggle-row"><span>Group chat<\/span><button class="tog" id="s3-group"[^>]*><\/button><\/div><div id="s3-cap-wrap"[^>]*>[\s\S]*?<\/select><\/div>/g;
function strip(snap) {
  const s = JSON.parse(JSON.stringify(snap));
  s.log = s.log.filter((l) => !ADDED_MARKERS.includes(l.ev));
  const noTo = (m) => { if (m && m.type === 'call-start') delete m.to; return m; };
  s.wire = s.wire.map(noTo); s.sockets.forEach((k) => { k.sent = k.sent.map(noTo); });
  s.rooms.forEach((r) => { delete r.members; });
  s.transcript.forEach((e) => { delete e.readBy; }); (s.bgTranscript || []).forEach((e) => { delete e.readBy; });
  s.s3 = (s.s3 || []).map((x) => ({ ...x, html: String(x.html).replace(S3_ROWS, '') }));
  return s;
}
for (const side of (SKIP_F3 ? [] : ['X', 'Y'])) {
  const a = strip(snapA[side]), c = strip(snapC[side]);
  for (const k of KEYS) await T('F3 ' + side + '.' + k + ' identical once the declared differences are removed', () => { const out = []; diff(a[k], c[k], side + '.' + k, out); assert(out.length === 0, out.slice(0, 5).join('\n')); });
}
if (!SKIP_F3) await T('F3 the declared differences are there: the candidate learned the other phone as a member (mu1_member), the base never did; the create sheet carries the group rows only on the candidate', () => {
  assert(dl(RC.X, 'mu1_member').length >= 1 && dl(RA.X, 'mu1_member').length === 0, 'mu1_member: cand ' + dl(RC.X, 'mu1_member').length + ', base ' + dl(RA.X, 'mu1_member').length);
  const r = RC.X.w.S.rooms.filter((x) => x.members)[0]; assert(r && Object.keys(r.members).length >= 1, 'no room carries members on the candidate');
  assert(!RA.X.w.S.rooms.some((x) => x.members), 'the base carries members');
  assert(snapC.X.s3.every((x) => S3_ROWS.test(x.html) || (S3_ROWS.lastIndex = 0, S3_ROWS.test(x.html))) && !snapA.X.s3.some((x) => /s3-group/.test(x.html)), 'group rows missing on the candidate or present on the base');
  S3_ROWS.lastIndex = 0;
});
if (!SKIP_F3) await T('F3 no uncaught error on either build', () => assert([RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ')));

/* ── F4 · THREE PHONES IN ONE ROOM ── */
console.log('F4 · three phones in one room, the candidate against the base');
const ROUTED = new Set(['call-accept', 'call-decline', 'call-end', 'webrtc-signal', 'mic-state', 'cam-state']);
function hub(insts) {
  const H = { up: true, sent: {}, delivered: {}, calls: {} };
  insts.forEach((I) => { H.sent[I.tag] = []; H.delivered[I.tag] = []; });
  const mk = (from) => ({
    get readyState() { return H.up ? 1 : 3; }, close() {}, addEventListener() {},
    send(s) {
      H.sent[from.tag].push(s); const d = JSON.parse(s);
      if (d.type === 'call-start' && d.to) H.calls[d.from] = { from: d.from, to: d.to };
      if (!d.to && ROUTED.has(d.type)) { const c = Object.values(H.calls).find((c) => c.from === d.from || c.to === d.from); if (c) d.to = c.from === d.from ? c.to : c.from; }
      if (d.type === 'call-end' || d.type === 'call-decline') Object.keys(H.calls).forEach((k) => { const c = H.calls[k]; if (c.from === d.from || c.to === d.from) delete H.calls[k]; });
      insts.forEach((I) => { if (I === from) return; if (d.to && I.dev !== d.to) return; H.delivered[I.tag].push(d); setTimeout(() => { try { I.w.handleRelay(d); } catch (e) { I.errors.push('handleRelay: ' + e.message); } }, 0); });
    }
  });
  H.rewire = () => insts.forEach((I) => { I.w._relayWs = mk(I); });
  H.rewire(); return H;
}
async function phone(html, tag, name, dev, seed, role) {
  const I = makeWindow(html, tag, dev, seed); I.tag = tag; I.dev = dev; I.name = name;
  await sleep(1300);
  const w = I.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: false, myName: name };
  w.S.rooms = [room, { id: 'bg-room', role: 'creator', title: 'Back', myLang: 'en', theirLang: 'th', joined: true, myName: name }];
  w.S.roomId = room.id; w.S.view = 'room'; w.S.user = w.S.user || {}; w.S.user.name = name;
  w.debugLog.length = 0;
  return I;
}
async function trio(html, p) {
  const X = await phone(html, p + 'Ann', 'Ann', 'aaaa1111-0000-4000-8000-000000000001', 11, 'creator');
  const Y = await phone(html, p + 'Bo', 'Bo', 'bbbb2222-0000-4000-8000-000000000002', 22, 'joiner');
  const Z = await phone(html, p + 'Cy', 'Cy', 'cccc3333-0000-4000-8000-000000000003', 33, 'joiner');
  return { X, Y, Z, H: hub([X, Y, Z]) };
}
const $ = (I, id) => I.w.document.getElementById(id);
const hello = (I, name) => I.w.relaySend({ type: 'hello', lang: 'th', targetLang: 'en', role: 'joiner', name });
const chat = (I, id, text, name) => I.w.relaySend({ type: 'chat-msg', chatId: id, srcText: text, tgtText: text, srcLang: 'th', tgtLang: 'en', senderName: name, origin: 'typed', eventId: 'ev-' + id });
const lastSocket = (I) => I.w.__sockets[I.w.__sockets.length - 1];
const sockets = (I) => I.w.__sockets.length;

const C = await trio(cand, 'C-'), B = await trio(base, 'B-');

/* A-1 · the create sheet, the socket URL, the invite, the join */
await T('F4 A-1 · the create sheet has a Group switch, off, with a size list hidden at 4; off means a room for two, on means the chosen size (base: no switch)', () => {
  C.X.w.openS3();
  const g = $(C.X, 's3-group'), sel = $(C.X, 's3-cap'), wrap = $(C.X, 's3-cap-wrap');
  assert(g && sel && wrap, 'switch, list or wrap missing');
  assert(!g.classList.contains('on') && wrap.style.display === 'none' && sel.value === '4', 'initial state wrong: on=' + g.classList.contains('on') + ' display=' + wrap.style.display + ' value=' + sel.value);
  assert([...sel.options].map((o) => o.value).join(',') === '3,4,5,6,7,8', 'sizes ' + [...sel.options].map((o) => o.value).join(','));
  assert(C.X.w.mu1CapFromSheet() === 2, 'off must mean 2, got ' + C.X.w.mu1CapFromSheet());
  g.click(); assert(g.classList.contains('on') && wrap.style.display !== 'none', 'switch did not open the list');
  assert(C.X.w.mu1CapFromSheet() === 4, 'on must mean the list\'s value (4), got ' + C.X.w.mu1CapFromSheet());
  sel.value = '6'; assert(C.X.w.mu1CapFromSheet() === 6, 'chosen 6, got ' + C.X.w.mu1CapFromSheet());
  $(C.X, 'm-s3').classList.remove('show');
  C.X.w.openS3(); assert(!g.classList.contains('on') && sel.value === '4' && wrap.style.display === 'none', 'the sheet did not reset on reopen');
  $(C.X, 'm-s3').classList.remove('show');
  B.X.w.openS3(); assert(!$(B.X, 's3-group'), 'the base has a group switch'); $(B.X, 'm-s3').classList.remove('show');
});
await T('F4 A-1 · the room\'s cap rides both socket URLs (&cap=N) and only when the room has one (base: never)', () => {
  const room = C.X.w.activeRoom(); const n0 = sockets(C.X);
  const settle = (I) => { if (lastSocket(I)) lastSocket(I).readyState = 3; };   /* a connecting socket coalesces the next connect (CR3) */
  room.cap = 6; C.X.w.relayConnect(); assert(sockets(C.X) === n0 + 1 && /&cap=6$/.test(lastSocket(C.X).url), 'room lane: ' + (lastSocket(C.X) || {}).url);
  delete room.cap; settle(C.X); C.X.w.relayConnect(); assert(sockets(C.X) === n0 + 2 && !/cap=/.test(lastSocket(C.X).url), 'room lane without cap: ' + lastSocket(C.X).url);
  room.cap = 9; settle(C.X); C.X.w.relayConnect(); assert(sockets(C.X) === n0 + 3 && !/cap=/.test(lastSocket(C.X).url), 'a cap outside 1..8 must not ride'); delete room.cap; settle(C.X);
  const bg = C.X.w.roomById('bg-room'); bg.cap = 3; C.X.w.LISTEN.open(bg); assert(/&cap=3$/.test(lastSocket(C.X).url), 'listen lane: ' + lastSocket(C.X).url); delete bg.cap;
  try { C.X.w.LISTEN.socks['bg-room'].close(); } catch (_) {} delete C.X.w.LISTEN.socks['bg-room'];
  const broom = B.X.w.activeRoom(); broom.cap = 6; B.X.w.relayConnect(); assert(!/cap=/.test(lastSocket(B.X).url), 'the base sends a cap'); delete broom.cap; settle(B.X);
  C.H.rewire(); B.H.rewire();
});
await T('F4 A-1 · the invite carries the size (c) only for a sized room; a joiner takes it from the invite (base: neither)', () => {
  const room = C.X.w.activeRoom(); const dec = (u) => C.X.w.decInv(u.split('#j=')[1]);
  room.cap = 5; assert(dec(C.X.w.invUrl(room)).c === 5, 'invite without c: ' + JSON.stringify(dec(C.X.w.invUrl(room))));
  delete room.cap; assert(!('c' in dec(C.X.w.invUrl(room))), 'an unsized room carries c');
  C.Y.w.joinRoom({ r: 'inv-sized', n: 'Ann', t: 'Sized', ml: 'en', tl: 'th', c: 5 }); assert(C.Y.w.roomById('inv-sized').cap === 5, 'joiner cap ' + C.Y.w.roomById('inv-sized').cap);
  C.Y.w.joinRoom({ r: 'inv-plain', n: 'Ann', t: 'Plain', ml: 'en', tl: 'th' }); assert(C.Y.w.roomById('inv-plain').cap === undefined, 'plain joiner has a cap');
  C.Y.w.joinRoom({ r: 'inv-wild', n: 'Ann', t: 'Wild', ml: 'en', tl: 'th', c: 99 }); assert(C.Y.w.roomById('inv-wild').cap === undefined, 'a wild cap was taken');
  const broom = B.X.w.activeRoom(); broom.cap = 5; assert(!('c' in B.X.w.decInv(B.X.w.invUrl(broom).split('#j=')[1])), 'the base carries c'); delete broom.cap;
  B.Y.w.joinRoom({ r: 'inv-sized', n: 'Ann', t: 'Sized', ml: 'en', tl: 'th', c: 5 }); assert(B.Y.w.roomById('inv-sized').cap === undefined, 'the base joiner took a cap');
  for (const I of [C.Y, B.Y]) { I.w.S.roomId = 'gate-room'; I.w.S.view = 'room'; }
  C.H.rewire(); B.H.rewire();
});

/* A-2 · full */
await T('F4 A-2 · full from the relay: one toast, one pill, the lane is not re-asked for 20 s and then is; a second full inside a minute says nothing more (base: silent, re-asked at once)', async () => {
    const I = C.X, w = I.w; const room = w.activeRoom(); const n0 = sockets(I), sys0 = w.transcript.filter((e) => e.kind === 'sys').length;
    w.handleRelay({ type: 'full', transient: true, cap: 2, n: 2 });
    const toastEl = $(I, 'toast');
    assert(toastEl.textContent === 'Room is full (2 of 2)' && toastEl.classList.contains('show'), 'toast: "' + toastEl.textContent + '"');
    const sys = w.transcript.filter((e) => e.kind === 'sys'); assert(sys.length === sys0 + 1 && sys[sys.length - 1].text === 'Room is full (2 of 2)', 'pill missing');
    assert(dl(I, 'room_full').length === 1 && dl(I, 'room_full')[0].d.cap === 2, 'room_full not logged');
    w.relayConnect(); assert(sockets(I) === n0, 'the lane was re-asked during the hold'); assert(dl(I, 'relay_full_hold').length === 1, 'hold not logged'); assert(w.wsReconnectTimer, 'no retry armed for after the hold');
    w.handleRelay({ type: 'full', transient: true, cap: 2, n: 2 });
    assert(w.transcript.filter((e) => e.kind === 'sys').length === sys0 + 1 && dl(I, 'room_full').length === 2, 'a second full inside a minute must not pill again');
    clock.t += 21000; w.relayConnect(); assert(sockets(I) === n0 + 1 && /gate-room/.test(lastSocket(I).url), 'the lane was not re-asked after the hold');
    /* the background lane */
    const bg = w.roomById('bg-room'); const n1 = sockets(I);
    w.LISTEN.handle('bg-room', { type: 'full', transient: true, cap: 2, n: 2 });
    w.LISTEN.open(bg); assert(sockets(I) === n1 && dl(I, 'relay_full_hold').some((l) => l.d.lane === 'listen'), 'the background lane was re-asked during its hold');
    clock.t += 21000; w.LISTEN.open(bg); assert(sockets(I) === n1 + 1, 'the background lane was not re-asked after its hold');
    try { w.LISTEN.socks['bg-room'].close(); } catch (_) {} delete w.LISTEN.socks['bg-room'];
    clearTimeout(w.wsReconnectTimer); w.wsReconnectTimer = null;
    /* the base */
    const J = B.X, bw = J.w; const m0 = sockets(J), bsys0 = bw.transcript.filter((e) => e.kind === 'sys').length;
    bw.handleRelay({ type: 'full', transient: true, cap: 2, n: 2 });
    assert($(J, 'toast').textContent !== 'Room is full (2 of 2)' && bw.transcript.filter((e) => e.kind === 'sys').length === bsys0, 'the base reacted to full');
    bw.relayConnect(); assert(sockets(J) === m0 + 1, 'the base did not re-ask at once');
    C.H.rewire(); B.H.rewire();

});

/* A-3 + A-5 · members, names, the count */
tick(10); hello(C.Y, 'Bo'); hello(C.Z, 'Cy'); hello(B.Y, 'Bo'); hello(B.Z, 'Cy'); await sleep(60);
tick(10); chat(C.Z, 'cm-z1', 'สวัสดีทุกคน', 'Cy'); chat(B.Z, 'cm-z1', 'สวัสดีทุกคน', 'Cy'); await sleep(60);
await T('F4 A-5 · each phone learns the others by device from hello / hello-ack / chat, named; the base learns nobody', async () => {
  const rx = C.X.w.activeRoom().members || {}, ry = C.Y.w.activeRoom().members || {}, rz = C.Z.w.activeRoom().members || {};
  assert(rx[C.Y.dev] && rx[C.Y.dev].name === 'Bo' && rx[C.Z.dev] && rx[C.Z.dev].name === 'Cy' && !rx[C.X.dev], 'X members ' + JSON.stringify(rx));
  assert(ry[C.X.dev] && ry[C.X.dev].name === 'Ann' && ry[C.Z.dev] && ry[C.Z.dev].name === 'Cy', 'Y members ' + JSON.stringify(ry));
  assert(rz[C.X.dev] && rz[C.Y.dev], 'Z members ' + JSON.stringify(rz));
  assert(dl(C.X, 'mu1_member').length === 2, 'mu1_member logged ' + dl(C.X, 'mu1_member').length + ' times on X');
  assert(JSON.parse(C.X.w.localStorage.getItem('tba_rooms'))[0].members[C.Z.dev].name === 'Cy', 'members not saved');
  assert(!B.X.w.activeRoom().members, 'the base learned members');
  delete rx[C.Z.dev]; chat(C.Z, 'cm-z2', 'อีกครั้ง', 'Cy'); await sleep(40);
  assert(rx[C.Z.dev] && rx[C.Z.dev].name === 'Cy' && dl(C.X, 'mu1_member').length === 3, 'a line alone did not teach the member again');
});
await T('F4 A-3 · a third phone\'s line shows under its own name on both other phones (both builds)', () => {
  for (const I of [C.X, C.Y, B.X, B.Y]) {
    const e = I.w.transcript.filter((x) => x.id === 'cm-z1')[0]; assert(e && e.senderName === 'Cy', I.tag + ': entry ' + JSON.stringify(e && e.senderName));
    const who = [...I.w.document.querySelectorAll('#transcript .who')].map((n) => n.textContent); assert(who.some((t) => /Cy/.test(t)), I.tag + ': no bubble named Cy: ' + who.join('|'));
  }
});
await T('F4 A-3 · the peer count shows "N here" beside the presence dot once more than two are present, and clears; who is on a call is kept (base: no count)', () => {
  const w = C.X.w;
  w.handleRelay({ type: 'peer', transient: true, focused: true, others: 2, inCall: [] });
  const el = $(C.X, 'mu1-count'); assert(el && el.textContent === '3 here' && el.previousSibling === $(C.X, 'presence'), 'count: ' + (el && el.textContent));
  w.handleRelay({ type: 'peer', transient: true, focused: true, others: 1, inCall: [] }); assert(el.textContent === '', 'count did not clear at two: "' + el.textContent + '"');
  w.handleRelay({ type: 'peer', transient: true, focused: true, others: 3, inCall: [C.Y.dev] }); assert(el.textContent === '4 here' && w.mu1State.inCall['gate-room'][0] === C.Y.dev, 'count at four / inCall');
  assert(w.S.partnerOnline === true, 'the dot no longer follows the count: partnerOnline=' + w.S.partnerOnline);
  w.handleRelay({ type: 'peer', transient: true, focused: true, others: 2, inCall: [] }); assert(w.mu1State.inCall['gate-room'].length === 0, 'inCall not cleared');
  B.X.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 2, inCall: [] }); assert(!$(B.X, 'mu1-count'), 'the base shows a count');
});
await T('F4 A-5 · two members with one name display as "name" and "name (2)", by who came first', () => {
  const room = C.X.w.activeRoom(); const keep = JSON.parse(JSON.stringify(room.members));
  room.members[C.Z.dev].name = 'Bo'; room.members[C.Z.dev].at = room.members[C.Y.dev].at + 1;
  const names = C.X.w.mu1Others(room).map((o) => o.name); assert(names.join('|') === 'Bo|Bo (2)', names.join('|'));
  room.members = keep;
});

/* A-4 · receipts count readers */
await T('F4 A-4 · a line read by two phones shows ✓ 2 and "Read by 2"; by one, the single tick (base: ✓ only, ever)', () => {
  for (const [I, Y, Z] of [[C.X, C.Y, C.Z], [B.X, B.Y, B.Z]]) {
    const e = { id: 'cm-x9', kind: 'chat', who: 'me', sourceText: 'hi all', translatedText: 'hi all', srcLang: 'en', tgtLang: 'th', ts: clock.t, receipt: 'sent', senderName: 'Ann', origin: 'typed' };
    I.w.transcript.push(e); I.w.appendMsgDom(e); I.__e = e; I.__Y = Y; I.__Z = Z;
  }
});
tick(10); C.Y.w.relaySend({ type: 'chat-read', ids: ['cm-x9'] }); B.Y.w.relaySend({ type: 'chat-read', ids: ['cm-x9'] }); await sleep(40);
await T('F4 A-4 · after the first reader: read, one tick, one reader recorded (both builds show ✓)', () => {
  for (const I of [C.X, B.X]) {
    const e = I.__e; assert(e.receipt === 'read', I.tag + ' not read');
    const tok = I.w.document.querySelector('[data-id="cm-x9"] [data-receipt] .tok, [data-receipt] .tok'); assert(tok && tok.textContent === '✓', I.tag + ' tok "' + (tok && tok.textContent) + '"');
  }
  assert(C.X.__e.readBy && Object.keys(C.X.__e.readBy).length === 1 && C.X.__e.readBy[C.Y.dev], 'readBy ' + JSON.stringify(C.X.__e.readBy));
  assert(!B.X.__e.readBy, 'the base records readers');
});
tick(10); C.Z.w.relaySend({ type: 'chat-read', ids: ['cm-x9'] }); B.Z.w.relaySend({ type: 'chat-read', ids: ['cm-x9'] }); await sleep(40);
await T('F4 A-4 · after the second reader: ✓ 2 on the bubble, "Read by 2" in the detail, and a repeat read changes nothing (base: ✓)', () => {
  const e = C.X.__e; assert(Object.keys(e.readBy).length === 2 && e.readBy[C.Z.dev], 'readBy ' + JSON.stringify(e.readBy));
  const toks = [...C.X.w.document.querySelectorAll('[data-receipt] .tok')].map((t) => t.textContent); assert(toks.some((t) => t === '✓ 2'), 'tok ' + JSON.stringify(toks));
  assert(/✓ 2/.test(C.X.w.receiptHtml(e)) && C.X.w.mu1ReadLabel(e) === 'Read by 2' && C.X.w.mu1ReadLabel({ readBy: { a: 1 } }) === 'Read', 'receiptHtml / label');
  assert(C.X.w.mu1ReadBy(e, C.Z.dev) === false && Object.keys(e.readBy).length === 2, 'a repeat read counted');
  const btoks = [...B.X.w.document.querySelectorAll('[data-receipt] .tok')].map((t) => t.textContent); assert(btoks.every((t) => t === '✓' || t === ''), 'base tok ' + JSON.stringify(btoks));
});

/* A-5 · the call names its callee */
C.X.w.__media = 'audio'; C.Z.w.__media = 'audio'; B.X.w.__media = 'audio'; B.Z.w.__media = 'audio';
await T('F4 A-5 · with two others the call button opens a chooser naming them, in order of arrival; nothing is sent until one is picked (base: no chooser)', () => {
  const w = C.X.w; const sent0 = C.H.sent['C-Ann'].length;
  w.mu1Call('voice');
  const ov = $(C.X, 'm-mu1'); assert(ov && ov.classList.contains('show'), 'chooser not shown');
  const picks = [...ov.querySelectorAll('.mu1-pick')]; assert(picks.map((b) => b.textContent).join('|') === 'Bo|Cy' && picks.every((b) => !b.disabled), picks.map((b) => b.textContent + (b.disabled ? '!' : '')).join('|'));
  assert(C.H.sent['C-Ann'].length === sent0 && !w.CALL.active, 'something was sent before the pick');
  assert(dl(C.X, 'mu1_chooser').length === 1 && dl(C.X, 'mu1_chooser')[0].d.n === 2, 'mu1_chooser');
  ov.querySelector('#mu1-cancel').click(); assert(!ov.classList.contains('show'), 'cancel did not close');
  assert(typeof B.X.w.mu1Call === 'undefined', 'the base has a chooser');
});
{
  C.X.w.mu1Call('voice'); [...$(C.X, 'm-mu1').querySelectorAll('.mu1-pick')].filter((b) => b.textContent === 'Bo')[0].click();
  B.X.w.CALL.start('voice');
  await sleep(120);
}
await T('F4 A-5 · the pick starts the call addressed to that phone: only it rings, the caller screen names it, call_to is logged (base: every phone rings, no `to`)', () => {
  const cs = C.H.sent['C-Ann'].map((s) => JSON.parse(s)).filter((m) => m.type === 'call-start'); assert(cs.length === 1 && cs[0].to === C.Y.dev, 'call-start ' + JSON.stringify(cs.map((m) => m.to)));
  assert(!C.H.delivered['C-Cy'].some((m) => m.type === 'call-start') && C.H.delivered['C-Bo'].some((m) => m.type === 'call-start'), 'delivery: Cy got it or Bo did not');
  assert($(C.Y, 'ring-overlay').classList.contains('show') && $(C.Y, 'ring-name').textContent === 'Ann' && !$(C.Z, 'ring-overlay').classList.contains('show'), 'ring: Y ' + $(C.Y, 'ring-overlay').className + ' Z ' + $(C.Z, 'ring-overlay').className);
  assert($(C.X, 'n10-name').textContent === 'Bo' && C.X.w.activeRoom().partnerName === 'Cy', 'caller screen names "' + $(C.X, 'n10-name').textContent + '" (partnerName ' + C.X.w.activeRoom().partnerName + ')');
  assert(dl(C.X, 'call_to').length === 1 && dl(C.X, 'call_to')[0].d.to === C.Y.dev.slice(0, 8) && dl(C.X, 'call_to')[0].d.n === 2, 'call_to ' + JSON.stringify(dl(C.X, 'call_to').map((l) => l.d)));
  const bs = B.H.sent['B-Ann'].map((s) => JSON.parse(s)).filter((m) => m.type === 'call-start'); assert(bs.length === 1 && !('to' in bs[0]), 'base call-start carries to');
  assert($(B.Y, 'ring-overlay').classList.contains('show') && $(B.Z, 'ring-overlay').classList.contains('show'), 'on the base both phones should ring');
});
{ C.Y.w.__media = 'audio'; await C.Y.w.CALL.accept(); await B.Z.w.CALL.accept(); await sleep(150); }
await T('F4 A-5 · the answer and the signalling travel between the two alone; the third phone sees none of it; the call connects', () => {
  assert(C.X.w.CALL.active && C.X.w.CALL.accepted && C.Y.w.CALL.active, 'call not up: X ' + C.X.w.CALL.accepted + ' Y ' + C.Y.w.CALL.active);
  const toCy = C.H.delivered['C-Cy'].filter((m) => ROUTED.has(m.type) || m.type === 'call-start'); assert(toCy.length === 0, 'Cy received ' + toCy.map((m) => m.type).join(','));
  assert(C.H.delivered['C-Ann'].some((m) => m.type === 'call-accept') && C.H.delivered['C-Bo'].some((m) => m.type === 'webrtc-signal'), 'accept or offer missing');
});
await T('F4 A-5 · a member on a call is offered disabled, marked "on a call"', () => {
  C.Z.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 2, inCall: [C.X.dev, C.Y.dev] });
  C.Z.w.__media = 'audio'; C.Z.w.mu1Call('video');
  const picks = [...$(C.Z, 'm-mu1').querySelectorAll('.mu1-pick')]; assert(picks.length === 2 && picks.every((b) => b.disabled && / · on a call$/.test(b.textContent)), picks.map((b) => b.textContent + (b.disabled ? '!' : '')).join('|'));
  assert(dl(C.Z, 'mu1_chooser')[0].d.busy === 2, 'busy count'); $(C.Z, 'm-mu1').querySelector('#mu1-cancel').click();
  C.Z.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 2, inCall: [] });
});
{ C.X.w.CALL.hangUp(true); B.X.w.CALL.hangUp(true); await sleep(100); }
await T('F4 A-5 · hanging up ends it for the callee and nobody else; afterwards the address is forgotten', () => {
  assert(!C.X.w.CALL.active && !C.Y.w.CALL.active && C.H.delivered['C-Bo'].some((m) => m.type === 'call-end') && !C.H.delivered['C-Cy'].some((m) => m.type === 'call-end'), 'call-end routing');
  assert(C.X.w.CALL._to === null || C.X.w.CALL._to === undefined, 'a stale address survives');
  try { C.Y.w.CALL.teardown(); B.Z.w.CALL.teardown(); } catch (_) {}
});
/* one other member: addressed without a chooser; none known: no address */
const P = { X: await phone(cand, 'P-Ann', 'Ann', 'aaaa1111-0000-4000-8000-000000000001', 11, 'creator'), Y: await phone(cand, 'P-Bo', 'Bo', 'bbbb2222-0000-4000-8000-000000000002', 22, 'joiner') };
P.H = hub([P.X, P.Y]); P.X.w.__media = 'audio';
await T('F4 A-5 · with no member known yet a call carries no address (the relay fans out as before)', async () => {
  P.X.w.mu1Call('voice'); await sleep(80);
  const cs0 = P.H.sent['P-Ann'].map((s) => JSON.parse(s)).filter((m) => m.type === 'call-start');
  assert(cs0.length === 1 && !('to' in cs0[0]) && !$(P.X, 'm-mu1') && dl(P.X, 'call_to')[0].d.to === null, 'unaddressed call: ' + JSON.stringify(cs0));
  P.X.w.CALL.hangUp(true); await sleep(60); try { P.Y.w.CALL.stopRing(); P.Y.w.CALL.ringPending = null; $(P.Y, 'ring-overlay').classList.remove('show'); } catch (_) {}
});
await T('F4 A-5 · with exactly one other member the call is addressed to it, no chooser, the caller screen names it', async () => {
  hello(P.Y, 'Bo'); await sleep(40);
  P.X.w.mu1Call('voice'); await sleep(80);
  const cs1 = P.H.sent['P-Ann'].map((s) => JSON.parse(s)).filter((m) => m.type === 'call-start');
  assert(cs1.length === 2 && cs1[1].to === P.Y.dev && !$(P.X, 'm-mu1') && $(P.X, 'n10-name').textContent === 'Bo', 'one other: ' + JSON.stringify(cs1[1]) + ' chooser=' + !!$(P.X, 'm-mu1') + ' name=' + $(P.X, 'n10-name').textContent);
  P.X.w.CALL.hangUp(true); await sleep(40);
});
await T('F4 no uncaught error on any phone', () => { const all = [C.X, C.Y, C.Z, B.X, B.Y, B.Z, P.X, P.Y]; assert(all.every((I) => I.errors.length === 0), all.flatMap((I) => I.errors.map((e) => I.tag + ': ' + e)).join(' | ')); });

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
