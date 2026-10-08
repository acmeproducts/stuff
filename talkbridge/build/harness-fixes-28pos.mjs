#!/usr/bin/env node
/* 28·post-ship FIXES harness — the five declared behaviour changes of the turn
   (D-11, D-14, D-15, T-4, X-4), each judged on its own against the FLAT build:
   the flat build (base − 97 layers + FL-4 + FL-5, proven identical to 28·ship
   c1 by harness-diff-28pos) and the candidate (flat − 8 banked texts + 5 fix
   parts) run the whole 28·post-ship script and then one scenario per fix.
   Everything is compared; the ONLY differences allowed are the ones each fix
   declares below, and each fix's scenario must show its new behaviour on the
   candidate and the old one on the flat build. Mutation-tested by
   build/mutate-fixes-28pos.mjs.

   Usage: node harness-fixes-28pos.mjs [candidate.html]   TB_FIX_PARTS_OVERRIDE=a,b,c,d,e   TB_KEEP_FIX=fixture,... */
import { readFileSync } from 'fs';
import { BASE_FILE, FIX_PARTS, FIX_MARKERS, assembleFlat, assemble, fixRemovals } from './assemble-28pos.mjs';
import { runBoth, KEYS, diff, mask, tick, sleep, clock } from './rig-28pos.mjs';

const candP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn28-post-ship.html';
const cand = readFileSync(candP, 'utf8');
const flat = assembleFlat();
const fixParts = FIX_PARTS.map((p, i) => process.env.TB_FIX_PARTS_OVERRIDE ? readFileSync(process.env.TB_FIX_PARTS_OVERRIDE.split(',')[i], 'utf8') : readFileSync(p, 'utf8'));
const [d11, d14, d15, t4, x4] = fixParts;
const KEEP = process.env.TB_KEEP_FIX ? process.env.TB_KEEP_FIX.split(',') : [];

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const inline = (html) => html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };

/* ── F1 · THE CANDIDATE IS THE FLAT BUILD MINUS THE BANKED TEXTS PLUS THE FIVE PARTS ── */
console.log('F1 · candidate === flat − 8 banked texts + 5 fix parts, nothing else');
T('F1.1 candidate is the assembler\'s output (every removal by its banked bytes, from the flat build)', () => assert(cand === assemble({ fixParts, keepFixRemovals: KEEP }), 'candidate is not flat − fix removals + fix parts'));
T('F1.2 every banked text was present exactly once in the flat build and is gone from the candidate', () => {
  const rs = fixRemovals(); assert(rs.length === 8, 'expected 8 banked texts, got ' + rs.length);
  for (const r of rs) { assert(flat.split(r.text).length - 1 === 1, r.file + ' not exactly once in the flat build'); if (!KEEP.includes(r.file)) assert(cand.indexOf(r.text) === -1, r.file + ' still in candidate'); }
});
T('F1.3 each part declares what it replaces; every replaced symbol is bound exactly once in the candidate', () => {
  const want = [[d11, 'relayConnect'], [d14, 'CALL.accept, CALL.onAccepted'], [d15, 'dgArbitrateNative, dgArbitrateEnglish'], [t4, 'speakTextCore, speakText'], [x4, 'onDGFinalCore, onRemoteSubtitle']];
  const js = code(inline(cand));
  for (const [p, syms] of want) {
    const c = p.slice(p.indexOf('@contract'), p.indexOf('*/', p.indexOf('@contract')));
    assert(new RegExp('replaces:\\s*' + syms.replace(/[.]/g, '\\.')).test(c) && /wraps:\s*\(none\)/.test(c), 'contract mismatch: ' + syms);
    for (const s of syms.split(', ')) {
      const n = (js.match(new RegExp('^(?:' + s.replace('.', '\\.') + ' = (?:async )?function|(?:async )?function ' + s + '\\()', 'mg')) || []).length;
      assert(n === 1, s + ' bound ' + n + ' times (must be 1)');
    }
  }
});

/* ── F2 · NOTHING UNDECLARED ── */
console.log('F2 · nothing undeclared: markers, wire, credential path');
T('F2.1 the candidate\'s log markers are the flat build\'s plus exactly the declared ones', () => {
  const a = markers(inline(flat)), c = markers(inline(cand));
  const added = [...c].filter((x) => !a.has(x)), lost = [...a].filter((x) => !c.has(x));
  assert(lost.length === 0, 'lost: ' + lost.join(','));
  assert(added.length === FIX_MARKERS.length && FIX_MARKERS.every((m) => added.includes(m)), 'added: ' + added.join(',') + ' declared: ' + FIX_MARKERS.join(','));
});
T('F2.2 no new message type; the wire changes are two fields (said, saidLang) on subtitle and subtitle-update, in X-4 only (G19/G20)', () => {
  const base = types(code(inline(flat))); const added = [...types(code(inline(cand)))].filter((t) => !base.has(t)); assert(added.length === 0, 'new message type: ' + added.join(','));
  for (const [nm, p] of [['D-11', d11], ['D-14', d14], ['D-15', d15], ['T-4', t4]]) assert(!/relaySend\(|said/.test(code(p).replace(/fl3Declare|cr3Send|relaySend\(\{ type: 'hello'/g, '')) || nm === 'D-11', nm + ' touches the wire');
  assert((code(x4).match(/Object\.assign\(\{type:'subtitle(-update)?'/g) || []).length === 2 && /saidF=\(saidE&&saidE\.said\)\?\{said:saidE\.said,saidLang:saidE\.saidLang\|\|''\}:\{\}/.test(code(x4)), 'X-4 must add said/saidLang to exactly the two subtitle messages');
  for (const p of fixParts) assert(!/credentials\/generate|iceServers|transport=tcp|turns?:|tb_gh_pat|Authorization|fetch\(/.test(code(p)), 'a fix part has a credential or network path');
});

/* ── F3 · THE SAME SCRIPT, THEN ONE SCENARIO PER FIX ── */
console.log('F3 · behaviour: identical except the declared differences; each fix shows on the candidate and not on the flat build');
async function scenarios(R) {
  const { X, Y, link } = R; const XD = X.w.document, YD = Y.w.document, $x = (id) => XD.getElementById(id), $y = (id) => YD.getElementById(id);
  const CX = X.w.CALL, CY = Y.w.CALL; const yx = (m) => Y.w.relaySend(m);
  R.fix = {};
  /* D-11 · a connect with no active room: the previous socket must keep one close listener and its room */
  link.rewire(); X.w.S.roomId = 'gate-room'; X.w.S.view = 'room';
  tick(10); X.w.relayConnect(); const s = X.w.__sockets[X.w.__sockets.length - 1]; tick(10); s.__fire('open'); await sleep(20);
  const snapS = () => ({ close: (s.__l.close || []).length, open: (s.__l.open || []).length, room: s._cr3Room === undefined ? 'undef' : s._cr3Room, sockets: X.w.__sockets.length });
  R.fix.d11 = { before: snapS() };
  X.w.S.roomId = null; tick(10); X.w.relayConnect(); R.fix.d11.after = snapS(); X.w.S.roomId = 'gate-room';
  tick(10); s.__fire('close', { code: 1005 }); await sleep(30); X.w.CALL.active = false;
  /* D-14 · the answerer's drawer is open when the call is answered; the caller's is open when the answer arrives */
  link.rewire(); X.w.__media = 'both'; Y.w.__media = 'audio'; CX.active = false; CY.active = false;
  if ($x('s4b-name')) $x('s4b-name').value = ''; if ($y('s4b-name')) $y('s4b-name').value = '';   /* the base's close commits the name field; blank = nothing to commit (on a phone the field holds the current name) */
  $x('drawer-s4b').classList.add('open'); $y('drawer-s4b').classList.add('open');
  tick(10); const p1 = CX.start('voice'); await sleep(40); await p1; await sleep(40);
  tick(500); const p2 = CY.accept(); await sleep(40); await p2; await sleep(400);
  R.fix.d14 = { answerer: $y('drawer-s4b').className, caller: $x('drawer-s4b').className, active: [!!CX.active, !!CY.active] };
  tick(10); CX.hangUp(true); await sleep(60); CY.teardown(); CX.teardown(); await sleep(30);
  $x('drawer-s4b').classList.remove('open'); $y('drawer-s4b').classList.remove('open');
  /* D-15 · the arbitration, driven directly, with the rig's clock */
  const out = []; const deliver = (t) => out.push(t); const v = [];
  tick(5000); v.push(X.w.dgArbitrateEnglish('awesome'));                                   /* English first, short */
  tick(125); v.push(X.w.dgArbitrateNative('อ อ ส ซ', deliver)); await sleep(320);         /* its phonetic twin 125 ms later */
  tick(5000); v.push(X.w.dgArbitrateNative('อ อ ส ซ', deliver));                           /* Thai first, held */
  tick(100); v.push(X.w.dgArbitrateEnglish('cool')); await sleep(320);                      /* the short English inside the hold */
  tick(5000); v.push(X.w.dgArbitrateEnglish('great'));                                     /* short English, then a REAL short Thai sentence inside the window */
  tick(125); v.push(X.w.dgArbitrateNative('อร่อยมาก', deliver)); await sleep(320);
  tick(5000); v.push(X.w.dgArbitrateEnglish('this is a long english line'));               /* a long win still suppresses anything in its window */
  tick(125); v.push(X.w.dgArbitrateNative('อ อ ส ซ', deliver)); await sleep(320);
  tick(5000); v.push(X.w.dgArbitrateNative('สวัสดี ครับ', deliver)); await sleep(320);       /* two multi-letter tokens: not phonetic, delivered */
  R.fix.d15 = { verdicts: v, delivered: out.slice() };
  /* T-4 · speech with voices known (one fits, one does not) and with none reported */
  const sp = X.w.speechSynthesis; sp.__spoken.length = 0; $x('toast').textContent = '';
  sp.getVoices = () => [{ lang: 'en-US', name: 'A' }, { lang: 'de-DE', name: 'B' }];
  tick(10); X.w.speakText('hello there', 'en'); const toast1 = $x('toast').textContent;
  tick(10); X.w.speakText('สวัสดี', 'th'); const toast2 = $x('toast').textContent;
  sp.getVoices = () => []; $x('toast').textContent = '';
  tick(10); X.w.speakText('again', 'th'); const toast3 = $x('toast').textContent;
  R.fix.t4 = { toasts: [toast1, toast2, toast3], spoken: sp.__spoken.slice() };
  /* X-4 · a line spoken in a call in the other language: normalized on the speaker's phone, its said travels with the subtitle */
  link.rewire(); X.w.S.roomId = 'gate-room'; X.w.S.view = 'room'; Y.w.S.roomId = 'gate-room'; Y.w.S.view = 'room';
  { const r = X.w.activeRoom(); r.myLang = 'en'; r.theirLang = 'th'; r.sendLocked = false; const ry = Y.w.activeRoom(); ry.myLang = 'th'; ry.theirLang = 'en'; ry.sendLocked = false; }
  X.w._ftFailed = true;
  X.w.__fetchPlan = (u) => /translate_a\/single.*sl=th&tl=en/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([[['hello sir', 'สวัสดีครับ', null, null]], null, 'th']), text: () => Promise.resolve('') })
    : /translate_a\/single.*sl=en&tl=th/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([[['สวัสดีครับท่าน', 'hello sir', null, null]], null, 'en']), text: () => Promise.resolve('') }) : null;
  CX.active = true; CX.kind = 'voice';
  const y0 = Y.w.transcript.length;
  tick(10); await X.w.onDGFinal('สวัสดีครับ', X.w.GEN.n, 'th'); await sleep(150);
  CX.active = false; CX.kind = null; X.w.__fetchPlan = null;
  const own = X.w.transcript.filter((e) => e.kind === 'speech' && e.who === 'me').slice(-1)[0] || null;
  const theirs = Y.w.transcript.slice(y0).filter((e) => e.kind === 'speech' && e.who === 'partner').slice(-1)[0] || null;
  R.fix.x4 = { own: own && { src: own.sourceText, said: own.said || null, saidLang: own.saidLang || null }, theirs: theirs && { src: theirs.sourceText, tr: theirs.translatedText, said: theirs.said || null, saidLang: theirs.saidLang || null }, keptPartner: Y.w.debugLog.filter((l) => l.ev === 'said_kept' && l.d && l.d.who === 'partner' && String(l.d.id).indexOf('sp-p-') === 0).length };   /* speech lines only — the chat path carries the said on both builds */
  await sleep(50);
}
const { RA, RC, snapA, snapC } = await runBoth(flat, cand, scenarios);
const A = RA.fix, C = RC.fix;

/* the declared differences, and nothing else */
const ALLOWED_LOG = { net_relay_closed: 'D-11 (the stale socket\'s second close listener is gone)', cr3_lane_open: 'D-11 (no open hook on a stale socket)', cr3_open_stale: 'D-11', d14_drawer_closed: 'D-14', tts_speak: 'T-4', tts_no_voice: 'T-4', dg_cross_suppress: 'D-15 (phonetic: true)', said_kept: 'X-4 (who: partner, in a call)' };
const stripLog = (log) => log.filter((l) => !ALLOWED_LOG[l.ev]);
const stripWire = (wire) => wire.map((m) => { if (m && (m.type === 'subtitle' || m.type === 'subtitle-update')) { const o = { ...m }; delete o.said; delete o.saidLang; return o; } return m; });
const stripTr = (tr) => tr.map((e) => { if (e && e.kind === 'speech' && e.who === 'partner') { const o = { ...e }; delete o.said; delete o.saidLang; return o; } return e; });
for (const who of ['X', 'Y']) for (const key of KEYS) {
  T('F3 ' + who + '.' + key + ' identical on both builds outside the declared differences', () => {
    let a = snapA[who][key], c = snapC[who][key];
    if (key === 'log') { a = stripLog(a); c = stripLog(c); }
    if (key === 'wire') { a = stripWire(a); c = stripWire(c); }
    if (key === 'transcript' || key === 'bgTranscript') { a = stripTr(a); c = stripTr(c); }
    const out = []; diff(a, c, who + '.' + key, out);
    if (out.length && key === 'log') { const first = out.map((l) => (l.match(/^[XY]\.log\[(\d+)\]/) || [])[1]).filter((x) => x != null)[0]; const i = Math.max(0, (Number(first) || 0) - 6); out.push('A: ' + a.slice(i, i + 14).map((l) => l.ev).join(' ')); out.push('C: ' + c.slice(i, i + 14).map((l) => l.ev).join(' ')); }
    assert(out.length === 0, '\n      ' + out.join('\n      '));
  });
}
const count = (snap, ev, pred) => snap.log.filter((l) => l.ev === ev && (!pred || pred(l))).length;
T('F3 D-11 · a connect with no active room hooks nothing: the stale socket keeps one close listener, one open listener and its room (the flat build added a listener each and nulled the room)', () => {
  assert(A.d11.after.close === A.d11.before.close + 1 && A.d11.after.open === A.d11.before.open + 1 && A.d11.after.room === null && A.d11.after.sockets === A.d11.before.sockets, 'the flat build did not show the defect: ' + JSON.stringify(A.d11));
  assert(C.d11.after.close === C.d11.before.close && C.d11.after.open === C.d11.before.open && C.d11.after.room === 'gate-room' && C.d11.after.sockets === C.d11.before.sockets && JSON.stringify(C.d11.before) === JSON.stringify(A.d11.before), 'the candidate still hooks the stale socket: ' + JSON.stringify(C.d11));
  assert(count(snapA.X, 'net_relay_closed') === count(snapC.X, 'net_relay_closed') + 2 && count(snapA.X, 'cr3_lane_open') + count(snapA.X, 'cr3_open_stale') >= count(snapC.X, 'cr3_lane_open') + count(snapC.X, 'cr3_open_stale'), 'the log should lose exactly the two duplicate close lines (one in the script, one here): ' + [count(snapA.X, 'net_relay_closed'), count(snapC.X, 'net_relay_closed')].join('/'));
});
T('F3 D-14 · the More menu closes when a call is answered, on the answerer and on the caller (the flat build left both open)', () => {
  assert(A.d14.answerer === 'drawer open' && A.d14.caller === 'drawer open' && A.d14.active[0] && A.d14.active[1], 'the flat build did not show the defect: ' + JSON.stringify(A.d14));
  assert(C.d14.answerer === 'drawer' && C.d14.caller === 'drawer' && C.d14.active[0] && C.d14.active[1], 'a drawer stayed open over the call: ' + JSON.stringify(C.d14));
  assert(count(snapC.Y, 'd14_drawer_closed', (l) => l.d.role === 'answerer') === 1 && count(snapC.X, 'd14_drawer_closed', (l) => l.d.role === 'caller') === 1 && count(snapA.X, 'd14_drawer_closed') + count(snapA.Y, 'd14_drawer_closed') === 0, 'd14_drawer_closed must be logged once per role on the candidate only');
});
T('F3 D-15 · a short English word suppresses its letter-spaced Thai twin in both orders; a real short Thai sentence and a two-word Thai line are still delivered; a long English win still suppresses everything in its window', () => {
  assert(JSON.stringify(A.d15.verdicts) === JSON.stringify(['ignored', 'held', 'held', 'ignored', 'ignored', 'held', 'won', 'suppressed', 'held']) && JSON.stringify(A.d15.delivered) === JSON.stringify(['อ อ ส ซ', 'อ อ ส ซ', 'อร่อยมาก', 'สวัสดี ครับ']), 'the flat build did not show the defect: ' + JSON.stringify(A.d15));
  assert(JSON.stringify(C.d15.verdicts) === JSON.stringify(['ignored', 'suppressed', 'held', 'displaced', 'ignored', 'held', 'won', 'suppressed', 'held']) && JSON.stringify(C.d15.delivered) === JSON.stringify(['อร่อยมาก', 'สวัสดี ครับ']), 'the candidate did not apply the rule as declared: ' + JSON.stringify(C.d15));
  assert(count(snapC.X, 'dg_cross_suppress', (l) => l.d.phonetic === true) === 2 && count(snapA.X, 'dg_cross_suppress', (l) => l.d.phonetic === true) === 0, 'two phonetic suppressions must be logged on the candidate only');
});
T('F3 T-4 · speech logs its voice match and says when the device has no voice for the language; nothing is said when the device reports no voices at all', () => {
  assert(A.t4.toasts.every((t) => t === '') && count(snapA.X, 'tts_speak') === 0 && A.t4.spoken.length === 6, 'the flat build was not silent about voices: ' + JSON.stringify(A.t4));
  assert(C.t4.toasts[0] === '' && C.t4.toasts[1] === 'No voice installed for Thai' && C.t4.toasts[2] === '' && JSON.stringify(C.t4.spoken) === JSON.stringify(A.t4.spoken), 'toasts / speech on the candidate: ' + JSON.stringify(C.t4));
  const sp = snapC.X.log.filter((l) => l.ev === 'tts_speak' || l.ev === 'tts_no_voice').slice(-3).map((l) => l.ev + ':' + l.d.lang + ':' + l.d.voices + ':' + (l.d.match === undefined ? '-' : l.d.match));
  assert(JSON.stringify(sp) === JSON.stringify(['tts_speak:en-US:2:1', 'tts_no_voice:th-TH:2:-', 'tts_speak:th-TH:0:0']), 'the record is not as declared: ' + JSON.stringify(sp));
});
T('F3 X-4 · what was said in a call reaches the other phone: the speaker\'s entry keeps it on both builds, the receiver\'s only on the candidate (said_kept {who: partner})', () => {
  assert(A.x4.own && A.x4.own.said === 'สวัสดีครับ' && A.x4.own.saidLang === 'th' && A.x4.own.src === 'hello sir', 'the speaker\'s said was not kept on the flat build: ' + JSON.stringify(A.x4));
  assert(A.x4.theirs && A.x4.theirs.said === null && A.x4.keptPartner === 0, 'the flat build should not carry the said in a call: ' + JSON.stringify(A.x4));
  assert(C.x4.own && C.x4.own.said === 'สวัสดีครับ' && C.x4.theirs && C.x4.theirs.src === 'hello sir' && C.x4.theirs.said === 'สวัสดีครับ' && C.x4.theirs.saidLang === 'th' && C.x4.keptPartner === 1, 'the receiver did not get the said: ' + JSON.stringify(C.x4));
  const subs = snapC.X.wire.filter((m) => m.type === 'subtitle' || m.type === 'subtitle-update');
  assert(subs.length >= 2 && subs.slice(-2).every((m) => m.said === 'สวัสดีครับ' && m.saidLang === 'th') && subs.slice(0, -2).every((m) => m.said === undefined), 'the two subtitle messages of this line carry the said and no other does: ' + JSON.stringify(subs.map((m) => [m.type, m.said])));
});
RA.X.dom.window.close(); RA.Y.dom.window.close(); RC.X.dom.window.close(); RC.Y.dom.window.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
