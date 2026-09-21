#!/usr/bin/env node
/* 27·post-ship harness (§7.9 K1/K2/K4 + §7.10 F1/F2/F3).

   Real artifact in jsdom. One declared removal (D1) is proven by bytes; the
   six carried transport/surface parts are proven byte-identical to accepted
   c8 and spot-checked live; every new part is proven by a downstream effect.
   Every gate here is mutation-tested by build/mutate-27ps.mjs.

   Usage: node harness-27ps.mjs [built.html]   (TB_PART_OVERRIDE for mutations) */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { BASE_FILE, C8_FILE, REMOVED_PART, CARRIED, NEW, PARTS, TAIL } from './assemble-27ps.mjs';

const builtP = process.argv[2] || 'bridge-turn27-post-ship.html';
const built = readFileSync(builtP, 'utf8');
const base = readFileSync(BASE_FILE, 'utf8');
const c8 = readFileSync(C8_FILE, 'utf8');
const partOverride = process.env.TB_PART_OVERRIDE ? JSON.parse(process.env.TB_PART_OVERRIDE) : null;
const parts = PARTS.map((p, i) => (partOverride && partOverride[i] != null) ? readFileSync(partOverride[i], 'utf8') : readFileSync(p, 'utf8'));
const d1 = readFileSync(REMOVED_PART, 'utf8');

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');   /* judge the code, not its explanation */

/* ── M1 · ADDITIVE, ONE DECLARED REMOVAL ─────────────────────────────────── */
console.log('M1 · additive over the accepted c5 baseline; D1 is the only removal' + (process.env.TB_SKIP_M1 ? ' — SKIPPED (flattened build under §0c-1; bytes are judged by harness-diff-28b)' : ''));
const prefix = base.slice(0, base.length - TAIL.length);
if (!process.env.TB_SKIP_M1) T('M1.1 built begins with the accepted c5 bytes, byte for byte', () => assert(built.startsWith(prefix), 'baseline prefix altered'));
if (!process.env.TB_SKIP_M1) T('M1.2 built === c5 + six carried parts + K-1 K-2 K-4 T-1 T-2 T-3 D-10 + tail, nothing else', () => assert(built === prefix + parts.map((p) => '\n\n' + p).join('') + TAIL, 'output is not base + parts + tail'));
if (!process.env.TB_SKIP_M1) T('M1.3 accepted c8 === c5 + D1 + the same six carried parts — so D1 is the ONLY thing removed', () => {
  assert(c8 === prefix + [d1, ...parts.slice(0, CARRIED.length)].map((p) => '\n\n' + p).join('') + TAIL, 'c8 is not c5 + D1 + carried parts: a carried part drifted from accepted bytes');
});
if (!process.env.TB_SKIP_M1) T('M1.4 the D1 instrument is gone from the built file', () => assert(built.indexOf('GAP PART · D1-call-diagnostics.js') === -1 && !/\bTBD1\b/.test(built.slice(prefix.length)), 'D1 still present'));

/* ── M2 · CONTRACT ───────────────────────────────────────────────────────── */
console.log('M2 · contract: wraps only, calls through, no takeover');
const [k1, k2, k4, t1, t2, t3, d10] = parts.slice(CARRIED.length);
const contractOf = (s) => s.slice(s.indexOf('@contract'), s.indexOf('*/', s.indexOf('@contract')));
T('M2.1 every new part declares replaces: (none)', () => { for (const p of [k1, k2, k4, t1, t2, t3, d10]) assert(/replaces:\s*\(none\)/.test(contractOf(p)), 'a part declares a replacement'); });
T('M2.2 every declared wrap calls through', () => {
  assert(/_uid\.apply\(this, arguments\)/.test(k1), 'K-1 does not call through uid');
  assert(/_pbWriteBack\.apply\(self, args\)/.test(k2) && /_log\.apply\(this, arguments\)/.test(k2), 'K-2 does not call through');
  assert(/_relaySend\.apply\(this, arguments\)/.test(k4) && /_onRoomNameSignal\.apply\(this, arguments\)/.test(k4), 'K-4 does not call through');
  assert(/orig\.apply\(self, args\)/.test(t1), 'T-1 does not call through the renderer');
  assert(/_log\.apply\(this, arguments\)/.test(t2), 'T-2 does not call through log');
  assert(/_pbAddTagTo\.apply\(this, arguments\)/.test(d10) && /_pbRerenderCard\.apply\(this, arguments\)/.test(d10) && /_renderPbList\.apply\(this, arguments\)/.test(d10), 'D-10 does not call through');
});
const PROTECTED = ['CALL.setupPC', 'CALL.teardown', 'CALL.hangUp', 'CALL.runRecovery', 'CALL.onSignal', 'handleRelay', 'relayConnect', 'relaySendWhenOpen', 'pbPull', 'renameRoom', 'addSysPill', 'tbSwapTap', 'tbFlipCamera', 'camSenders', 'replaceSenderTrack', 'BUILD_INFO', 'VERSION'];
T('M2.3 no new part assigns to anything the baseline owns outside its declared wraps', () => {
  for (const p of [k1, k2, k4, t1, t2, t3, d10]) for (const name of PROTECTED) {
    const re = new RegExp('(^|[^\\w.])' + name.replace('.', '\\s*\\.\\s*') + '\\s*=(?!=)', 'm');
    assert(!re.test(code(p)), 'a part assigns to ' + name);
  }
  assert(!/(^|[^\w.])relaySend\s*=(?!=)/m.test(code(k1 + k2 + t1 + t2 + t3)), 'a part other than K-4 assigns relaySend');
  assert(!/(^|[^\w.])log\s*=(?!=)/m.test(code(k1 + k4 + t1 + t3)), 'a part other than K-2/T-2 assigns log');
  assert(!/(^|[^\w.])uid\s*=(?!=)/m.test(code(k2 + k4 + t1 + t2 + t3)), 'a part other than K-1 assigns uid');
});
T('M2.4 T-3 is read-only: it never calls, assigns or writes anything it finds', () => {
  const c = code(t3);
  assert(!/\beval\b|new Function|\[sym\]\s*\(|window\[/.test(c), 'T-3 executes or writes symbols');
  assert(!/innerHTML|createElement|appendChild/.test(c), 'T-3 writes the DOM');
});
T('M2.5 no new relay message TYPE — K-4 rides the proven sys-pill carrier', () => {
  const types = new Set(); let m; const re = /type\s*(?:===|:)\s*'([a-z-]+)'/g;
  while ((m = re.exec(code(k1 + k2 + k4 + t1 + t2 + t3 + d10)))) types.add(m[1]);
  assert([...types].every((t) => t === 'sys-pill'), 'a new relay message type appeared: ' + [...types].join(','));
});
T('M2.6 no credential endpoint, no TURN URL, no PAT handling (G19/G20)', () => {
  for (const p of [k1, k2, k4, t1, t2, t3, d10]) assert(!/credentials\/generate|iceServers|transport=tcp|turns?:|tb_gh_pat|Authorization/.test(code(p)), 'a part touches ICE config or credentials');
});
T('M2.7 T-2 silences nothing: every limited marker still passes with a count, and the list is one object', () => {
  const c = code(t2);
  assert((c.match(/var LIMITED = \{/g) || []).length === 1, 'allowlist is not one object');
  assert(/d2\.dropped = dropped\[ev\]/.test(c), 'dropped count is not carried on the next line');
  assert(!/return;\s*\}\s*\}\s*\}\s*catch/.test(c) || /dropped\[ev\] = \(dropped\[ev\] \|\| 0\) \+ 1/.test(c), 'a limited line is thrown away uncounted');
});

/* ── M3 · LIVE ───────────────────────────────────────────────────────────── */
console.log('M3 · live instances');

function makeWindow(html, tag, dev) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn27-post-ship.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      class FakeWS {
        constructor(url) { this.url = url; this.readyState = 0; this.__l = {}; this.__closed = false; this.__sent = []; w.__sockets.push(this); }
        addEventListener(t, f) { (this.__l[t] = this.__l[t] || []).push(f); }
        removeEventListener() {}
        send(s) { this.__sent.push(s); }
        close() { this.__closed = true; }
      }
      w.__sockets = [];
      w.WebSocket = FakeWS;
      class FakePC {
        constructor() { this.connectionState = 'connected'; this.iceConnectionState = 'connected'; this.signalingState = 'stable'; this.remoteDescription = null; this.localDescription = null; this.__closed = false; this.__offers = []; this.__answers = 0; this.__cands = []; this.__senders = []; }
        getSenders() { return this.__senders; }
        addEventListener() {} removeEventListener() {} getConfiguration() { return {}; }
        createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; }
        addTrack() { return {}; }
        createOffer(o) { this.__offers.push(o || {}); return Promise.resolve({ type: 'offer', sdp: 'v=0\r\na=ice-ufrag:first\r\n' }); }
        createAnswer() { this.__answers++; return Promise.resolve({ type: 'answer', sdp: 'v=0\r\na=ice-ufrag:ans\r\n' }); }
        setLocalDescription(d) { this.localDescription = d; return Promise.resolve(); }
        setRemoteDescription(d) { this.remoteDescription = d; return Promise.resolve(); }
        addIceCandidate(c) { this.__cands.push(c); return Promise.resolve(); }
        getStats() { return Promise.resolve({ forEach() {} }); }
        close() { this.__closed = true; this.connectionState = 'closed'; }
      }
      w.FakePC = FakePC; w.RTCPeerConnection = FakePC;
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} };
      w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } }; w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.localStorage.setItem('tb_name', tag);
      if (dev) w.localStorage.setItem('tb_dev', dev);
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
  return { dom, w: dom.window, errors, logs: [] };
}
function wire(a, b) {
  const link = { up: true, sent: { a: [], b: [] } };
  const mk = (from, to, key) => ({ get readyState() { return link.up ? 1 : 3; }, send(s) { link.sent[key].push(s); const d = JSON.parse(s); setTimeout(() => { try { to.w.handleRelay(d); } catch (e) { to.errors.push('handleRelay: ' + e.message); } }, 0); }, close() {}, addEventListener() {} });
  a.w._relayWs = mk(a, b, 'a'); b.w._relayWs = mk(b, a, 'b');
  return link;
}
function enterRoom(inst, role) {
  const w = inst.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: true, myName: role === 'creator' ? 'Ann' : 'Bo' };
  w.S.rooms = [room]; w.S.roomId = room.id; w.S.view = 'room';
  const _log = w.log;
  w.log = function (ev, d, lvl) { inst.logs.push({ ev, d: d || {}, lvl: lvl || 'info' }); return _log.apply(this, arguments); };
  return room;
}
const saw = (inst, ev) => inst.logs.filter((l) => l.ev === ev);
const dl = (inst, ev) => inst.w.debugLog.filter((l) => l.ev === ev);

const DEV_A = 'aaaa1111-0000-4000-8000-000000000001', DEV_B = 'bbbb2222-0000-4000-8000-000000000002';
const A = makeWindow(built, 'Ann', DEV_A); const B = makeWindow(built, 'Bo', DEV_B);
await sleep(1300);
T('M3.0 both instances boot clean; D1 absent at runtime', () => assert(A.errors.length === 0 && B.errors.length === 0 && typeof A.w.TBD1 === 'undefined', [...A.errors, ...B.errors].join(' | ') || 'TBD1 still defined'));

console.log('M3a · K-1 ids are namespaced by device');
T('M3a.1 uid() carries this device\'s prefix; two devices never share a prefix', () => {
  const a = A.w.uid(), b = B.w.uid();
  assert(/^aaaa1111-[a-z0-9]{6,}$/.test(a), 'A uid: ' + a);
  assert(/^bbbb2222-[a-z0-9]{6,}$/.test(b), 'B uid: ' + b);
  assert(dl(A, 'k1_ids').length === 1 && dl(A, 'k1_ids')[0].d.prefix === 'aaaa1111', 'k1_ids not logged once with the prefix');
});
T('M3a.2 5000 ids minted on both devices in a tight loop: zero collisions', () => {
  const seen = new Set(); let dup = 0;
  for (let i = 0; i < 5000; i++) { const a = A.w.uid(), b = B.w.uid(); if (seen.has(a) || seen.has(b) || a === b) dup++; seen.add(a); seen.add(b); }
  assert(dup === 0, dup + ' collisions');
});
T('M3a.3 caller prefixes are untouched: a system pill id still starts with sp-', () => {
  A.w.addSysPill('probe', undefined);
  const e = A.w.transcript[A.w.transcript.length - 1];
  assert(e && /^sp-aaaa1111-/.test(e.id), 'pill id: ' + (e && e.id));
  A.w.transcript.pop();
});

console.log('M3b · K-2 phrasebook merge (unit, six fixture conflicts)');
const card = (id, up, del, txt) => ({ id, updatedAt: up, deletedAt: del || null, src: txt || id });
T('M3b.1 local newer wins', () => { const m = A.w.pbMergeCards([card('c', 200, null, 'L')], [card('c', 100, null, 'R')]); assert(m.cards.length === 1 && m.cards[0].src === 'L' && m.kept === 1 && m.took === 0, JSON.stringify(m)); });
T('M3b.2 remote newer wins', () => { const m = A.w.pbMergeCards([card('c', 100, null, 'L')], [card('c', 200, null, 'R')]); assert(m.cards[0].src === 'R' && m.took === 1 && m.kept === 0, JSON.stringify(m)); });
T('M3b.3 remote-only card is added, not dropped', () => { const m = A.w.pbMergeCards([card('a', 1)], [card('a', 1), card('b', 1)]); assert(m.cards.length === 2 && m.added === 1, JSON.stringify(m)); });
T('M3b.4 local-only card is kept, not dropped', () => { const m = A.w.pbMergeCards([card('a', 1), card('b', 1)], [card('a', 1)]); assert(m.cards.length === 2 && m.cards.some((c) => c.id === 'b'), JSON.stringify(m)); });
T('M3b.5 a remote deletion later than the local edit wins', () => { const m = A.w.pbMergeCards([card('c', 100, null, 'L')], [card('c', 50, 300, 'R')]); assert(m.cards[0].deletedAt === 300 && m.took === 1, JSON.stringify(m)); });
T('M3b.6 a local deletion later than the remote edit is kept; equal clocks keep local; no duplicate ids ever', () => {
  const m = A.w.pbMergeCards([card('c', 50, 300, 'L')], [card('c', 200, null, 'R')]); assert(m.cards[0].deletedAt === 300 && m.kept === 1, JSON.stringify(m));
  const t = A.w.pbMergeCards([card('c', 100, null, 'L')], [card('c', 100, null, 'R')]); assert(t.cards[0].src === 'L', 'tie did not keep local');
  const big = A.w.pbMergeCards([card('x', 1), card('y', 2), card('z', 3)], [card('z', 9), card('y', 1), card('w', 1)]);
  assert(new Set(big.cards.map((c) => c.id)).size === big.cards.length && big.cards.length === 4, 'duplicates or loss');
});

console.log('M3c · K-2 compare-and-swap on the wire (409 → pull → merge → one re-push)');
function ghFetch(inst, script) {
  const calls = [];
  inst.w.fetch = (url, opt) => {
    const method = (opt && opt.method) || 'GET';
    calls.push({ url: String(url), method, body: opt && opt.body ? JSON.parse(opt.body) : null });
    const r = script(String(url), method, calls);
    return Promise.resolve({ ok: r.status >= 200 && r.status < 300, status: r.status, json: () => Promise.resolve(r.json || {}), text: () => Promise.resolve('') });
  };
  return calls;
}
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');
function pbSetup(inst, cards) {
  const w = inst.w;
  w.localStorage.setItem('tb_gh_pat', 'gate-token');
  w.PB.pk = 'en-th'; w.PB.version = 1000; w.PB.cards = cards; w.PB.save(); w.PB.markDirty();
}
const remoteCards = [card('shared', 500, null, 'REMOTE-EDIT'), card('theirs', 10, null, 'THEIRS')];
pbSetup(A, [card('shared', 100, null, 'LOCAL-EDIT'), card('mine', 20, null, 'MINE')]);
let puts = 0;
const calls1 = ghFetch(A, (url, method) => {
  if (method === 'PUT') { puts++; return puts === 1 ? { status: 409, json: { message: 'sha mismatch' } } : { status: 200, json: { content: { sha: 'C' } } }; }
  if (/\/contents\/phrasebook\/\?ref=main$/.test(url)) return { status: 200, json: [{ name: 'phrasebook-en-th-1000.json' }] };
  if (/phrasebook-en-th-1000\.json\?ref=main$/.test(url)) return { status: 200, json: { sha: puts === 0 ? 'A' : 'B', content: b64({ type: 'phrasebook', cards: remoteCards }) } };
  return { status: 404 };
});
const res1 = await A.w.pbWriteBack();
T('M3c.1 the first PUT carries the expected sha (compare-and-swap)', () => {
  const p = calls1.filter((c) => c.method === 'PUT');
  assert(p.length >= 1 && p[0].body && p[0].body.sha === 'A', 'first PUT body: ' + JSON.stringify(p[0] && p[0].body && { sha: p[0].body.sha }));
});
T('M3c.2 on 409 the file is pulled, merged by card, and pushed exactly once more with the FRESH sha', () => {
  const p = calls1.filter((c) => c.method === 'PUT');
  assert(p.length === 2, 'PUT count ' + p.length);
  assert(p[1].body.sha === 'B', 'second PUT sha ' + p[1].body.sha);
  const env = JSON.parse(Buffer.from(p[1].body.content, 'base64').toString('utf8'));
  const by = Object.fromEntries(env.cards.map((c) => [c.id, c]));
  assert(by.shared && by.shared.src === 'REMOTE-EDIT', 'newer remote edit lost: ' + JSON.stringify(by.shared));
  assert(by.mine && by.theirs, 'a one-sided card was dropped');
  assert(env.cards.length === 3, 'card count ' + env.cards.length);
  assert(res1 && res1.status === 'ok', 'final status ' + JSON.stringify(res1));
});
T('M3c.3 pb_merge logged once with kept/took/added; local state holds the merged list', () => {
  const m = dl(A, 'pb_merge');
  assert(m.length === 1 && m[0].d.took === 1 && m[0].d.added === 1 && m[0].d.kept === 0, JSON.stringify(m.map((x) => x.d)));
  assert(A.w.PB.cards.length === 3 && A.w.PB.cards.find((c) => c.id === 'shared').src === 'REMOTE-EDIT', 'PB.cards not merged');
});
/* a second refusal is reported, not looped */
pbSetup(A, [card('shared', 100, null, 'L2')]);
puts = 0;
const calls2 = ghFetch(A, (url, method) => {
  if (method === 'PUT') { puts++; return { status: 409, json: {} }; }
  /* the list call fails after four PUTs so a looping build still terminates — and is then counted */
  if (/\/contents\/phrasebook\/\?ref=main$/.test(url)) return puts >= 4 ? { status: 500, json: {} } : { status: 200, json: [{ name: 'phrasebook-en-th-1000.json' }] };
  if (/phrasebook-en-th-1000\.json\?ref=main$/.test(url)) return { status: 200, json: { sha: 'A', content: b64({ cards: remoteCards }) } };
  return { status: 404 };
});
const res2 = await A.w.pbWriteBack();
T('M3c.4 a second 409 stops: two PUTs total, one merge, status pending', () => assert(calls2.filter((c) => c.method === 'PUT').length === 2 && dl(A, 'pb_merge').length === 2 && res2.status === 'pending', 'looped or wrong status: ' + JSON.stringify(res2)));
/* a non-conflict failure is NOT merged */
pbSetup(A, [card('shared', 100, null, 'L3')]);
const calls3 = ghFetch(A, (url, method) => {
  if (method === 'PUT') return { status: 500, json: {} };
  if (/phrasebook-en-th-1000\.json\?ref=main$/.test(url)) return { status: 200, json: { sha: 'A', content: b64({ cards: remoteCards }) } };
  return { status: 404 };
});
const res3 = await A.w.pbWriteBack();
T('M3c.5 a 500 is not a conflict: no pull, no merge, one PUT, status pending', () => {
  assert(calls3.filter((c) => c.method === 'PUT').length === 1 && !calls3.some((c) => /\/contents\/phrasebook\/\?ref=main$/.test(c.url)), 'merged on a non-conflict');
  assert(dl(A, 'pb_merge').length === 2 && res3.status === 'pending' && A.w.PB.cards[0].src === 'L3', 'state changed on a non-conflict');
});
pbSetup(A, [card('shared', 100, null, 'L4')]);
const calls4 = ghFetch(A, (url, method) => {
  if (method === 'PUT') return { status: 409, json: {} };
  if (/\/contents\/phrasebook\/\?ref=main$/.test(url)) return { status: 500, json: {} };
  if (/phrasebook-en-th-1000\.json\?ref=main$/.test(url)) return { status: 200, json: { sha: 'A', content: b64({ cards: remoteCards }) } };
  return { status: 404 };
});
const res4 = await A.w.pbWriteBack();
T('M3c.6 409 but the pull fails: nothing re-pushed, local cards and version intact, pb_merge_err logged', () => {
  assert(calls4.filter((c) => c.method === 'PUT').length === 1 && res4.status === 'pending', 'pushed without a merge');
  assert(A.w.PB.cards.length === 1 && A.w.PB.cards[0].src === 'L4' && A.w.PB.version === 1000 && A.w.PB.isDirty(), 'local state damaged: v=' + A.w.PB.version + ' cards=' + JSON.stringify(A.w.PB.cards));
  assert(dl(A, 'pb_merge_err').length === 1, 'no pb_merge_err');
});
A.w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });

console.log('M3d · K-4 two phones rename the same room within 2 s → one title on both');
const link = wire(A, B);
const rA = enterRoom(A, 'creator'); const rB = enterRoom(B, 'joiner');
const T0 = 1758400000000;
A.w.Date.now = () => T0; B.w.Date.now = () => T0 + 700;
link.up = true;
A.w.renameRoom('Alpha'); B.w.renameRoom('Bravo');
await sleep(60);
T('M3d.1 the later rename wins on BOTH phones (A said Alpha at t, B said Bravo at t+700ms)', () => assert(rA.title === 'Bravo' && rB.title === 'Bravo', 'A=' + rA.title + ' B=' + rB.title));
T('M3d.2 the losing phone logged the stale rename it ignored; the winner ignored nothing', () => assert(saw(B, 'k4_rename_stale').length === 1 && saw(A, 'k4_rename_stale').length === 0, 'stale log: A=' + saw(A, 'k4_rename_stale').length + ' B=' + saw(B, 'k4_rename_stale').length));
T('M3d.3 the ts on the wire is the one the sender remembered', () => {
  const sent = link.sent.a.map((s) => JSON.parse(s)).filter((m) => m.newRoomName === 'Alpha');
  assert(sent.length === 1 && sent[0].ts === T0 && rA.titleTs === T0 + 700, 'wire ts ' + (sent[0] && sent[0].ts) + ' titleTs ' + rA.titleTs);
});
/* the exact same millisecond: the tie breaks the same way on both sides */
A.w.Date.now = () => T0 + 5000; B.w.Date.now = () => T0 + 5000;
A.w.renameRoom('Zulu'); B.w.renameRoom('Mike');
await sleep(60);
T('M3d.4 identical timestamps still converge (deterministic tie-break on the name)', () => assert(rA.title === rB.title && rA.title === 'Zulu', 'A=' + rA.title + ' B=' + rB.title));
/* a later, uncontested rename still applies everywhere */
B.w.Date.now = () => T0 + 9000;
B.w.renameRoom('Charlie');
await sleep(60);
T('M3d.5 a later uncontested rename applies on the other phone', () => assert(rA.title === 'Charlie' && rB.title === 'Charlie', 'A=' + rA.title + ' B=' + rB.title));
/* a rename from a phone that has never renamed (no titleTs) is applied on a phone that has */
const C = makeWindow(built, 'Cy', 'cccc3333-0000-4000-8000-000000000003'); await sleep(1300);
const rC = enterRoom(C, 'joiner'); const linkAC = wire(A, C);
C.w.Date.now = () => T0 + 12000;
C.w.renameRoom('Delta');
await sleep(60);
T('M3d.6 a first-ever rename from a third phone lands; the pill still renders on the receiver', () => {
  assert(rA.title === 'Delta', 'A=' + rA.title);
  const pills = A.w.transcript.filter((e) => e.kind === 'sys' && /Delta/.test(e.text || ''));
  assert(pills.length >= 1, 'no rename pill on A');
});
T('M3d.7 a stale rename arriving late is ignored, its pill still shown', () => {
  const before = A.w.transcript.length;
  A.w.handleRelay({ type: 'sys-pill', from: 'ghost', ts: T0 + 100, text: 'Ghost renamed the room to Old', pillId: 'sp-ghost-1', newRoomName: 'Old', wasRoomName: 'Gate', byName: 'Ghost' });
  assert(rA.title === 'Delta', 'stale rename applied: ' + rA.title);
  assert(A.w.transcript.length === before + 1, 'pill not rendered');
});
C.dom.window.close();

console.log('M3e · T-1 render coalescing');
const R = makeWindow(built, 'Ren', 'dddd4444-0000-4000-8000-000000000004'); await sleep(1300);
enterRoom(R, 'creator');
R.w.transcript.length = 0;
R.w.transcript.push({ id: 'm1', kind: 'sys', text: 'first', ts: Date.now() });
R.w.renderTranscript();
T('M3e.1 the first call in a burst renders synchronously', () => assert(/first/.test(R.w.document.getElementById('transcript').textContent), 'not rendered synchronously'));
R.w.renderTranscript(); R.w.renderTranscript(); R.w.renderTranscript();
R.w.transcript.push({ id: 'm2', kind: 'sys', text: 'second', ts: Date.now() });
R.w.renderTranscript();
T('M3e.2 the burst\'s middle calls are collapsed: nothing rendered yet beyond the first', () => assert(!/second/.test(R.w.document.getElementById('transcript').textContent), 'a middle call rendered'));
await sleep(80);
T('M3e.3 one trailing render at the next frame draws the LATEST state', () => {
  assert(/second/.test(R.w.document.getElementById('transcript').textContent), 'trailing render missing — latest state never drawn');
  const c = dl(R, 't1_coalesced').filter((l) => l.d.fn === 'renderTranscript');
  assert(c.length === 1 && c[0].d.n === 4, 't1_coalesced: ' + JSON.stringify(c.map((l) => l.d)));
});
T('M3e.4 renderPanel and renderHome are latched the same way; a lone call is never deferred', () => {
  assert(/latched|pending/.test(String(R.w.renderPanel)) && /latched|pending/.test(String(R.w.renderHome)), 'not latched');
  R.w.transcript.push({ id: 'm3', kind: 'sys', text: 'third', ts: Date.now() });
  R.w.renderTranscript();
  assert(/third/.test(R.w.document.getElementById('transcript').textContent), 'a lone call after the burst was deferred');
});

console.log('M3f · T-2 log hygiene');
await sleep(80);
const n0 = dl(R, 'rc_panel_rendered').length;
const base0 = 1758500000000; R.w.Date.now = () => base0;
for (let i = 0; i < 10; i++) R.w.log('rc_panel_rendered', { i });
T('M3f.1 ten rc_panel_rendered in one burst → one line written', () => assert(dl(R, 'rc_panel_rendered').length === n0 + 1, 'wrote ' + (dl(R, 'rc_panel_rendered').length - n0)));
R.w.Date.now = () => base0 + 5001;
R.w.log('rc_panel_rendered', { i: 99 });
T('M3f.2 after the window the next line passes and carries dropped: 9', () => {
  const l = dl(R, 'rc_panel_rendered'); const last = l[l.length - 1];
  assert(l.length === n0 + 2 && last.d.dropped === 9 && last.d.i === 99, JSON.stringify(last && last.d));
});
T('M3f.3 a marker not on the list is never limited', () => {
  const k = dl(R, 'gate_probe').length;
  for (let i = 0; i < 10; i++) R.w.log('gate_probe', { i });
  assert(dl(R, 'gate_probe').length === k + 10, 'unlisted marker was limited');
});

console.log('M3g · T-3 wrap map');
T('M3g.1 wrap_map logged once at boot; TB_WRAP_MAP present', () => assert(dl(R, 'wrap_map').length === 1 && R.w.TB_WRAP_MAP && typeof R.w.TB_WRAP_MAP === 'object', 'no wrap_map'));
T('M3g.2 the map names the chains this release added, innermost first', () => {
  const m = R.w.TB_WRAP_MAP;
  const last = (k) => (m[k] || []).slice(-1)[0];
  if (!process.env.TB_SKIP_M1) assert(last('relaySend') === 'K4-rename-lww.js' && (m.relaySend || []).includes('C1-signal-queue.js'), 'relaySend chain: ' + JSON.stringify(m.relaySend));
  else assert(!m.relaySend && !m.handleRelay && !m.relayConnect, 'flattened build still shows relay-path chains: ' + JSON.stringify([m.relaySend, m.handleRelay, m.relayConnect]));
  assert(last('log') === 'T2-log-hygiene.js' && (m.log || []).includes('K2-pb-merge.js'), 'log chain: ' + JSON.stringify(m.log));
  assert(last('renderTranscript') === 'T1-render-coalesce.js' && last('renderPanel') === 'T1-render-coalesce.js', 'render chain: ' + JSON.stringify(m.renderPanel));
  assert(last('uid') === 'K1-device-ids.js' && last('pbWriteBack') === 'K2-pb-merge.js' && last('onRoomNameSignal') === 'K4-rename-lww.js', 'K chains missing');
  assert((process.env.TB_SKIP_M1 || (m.handleRelay || []).length >= 4) && (m['CALL.runRecovery'] || []).includes('C3-joiner-restart.js'), 'deep chains missing');
});
T('M3g.3 every symbol in the map resolves to a live top-level function — locals sharing a name are not counted', () => {
  const bad = Object.keys(R.w.TB_WRAP_MAP).filter((k) => { const [a, b] = k.split('.'); const v = b ? (R.w[a] && R.w[a][b]) : R.w[a]; return typeof v !== 'function'; });
  assert(bad.length === 0, 'noise: ' + bad.join(','));
});
R.dom.window.close();


console.log('M3h · D-10 Enter in the phrasebook tag field adds the tag and stays put');
const PBW = makeWindow(built, 'Pat', 'eeee5555-0000-4000-8000-000000000005'); await sleep(1300);
enterRoom(PBW, 'creator');
{
  const w = PBW.w, d = w.document;
  w.PB.pk = 'en-th'; w.PB.cards = []; w.PB.version = 1000;
  w.pbAddCard({ source: 'hello', target: 'sawasdee', sourceLang: 'en', targetLang: 'th' });
  w.pbAddCard({ source: 'thanks', target: 'khop khun', sourceLang: 'en', targetLang: 'th' });
  w.openPb('');
  const ids = [...d.querySelectorAll('#pb-ov-cards [id^="pbb-"]')].map((e) => e.id.slice(4));
  const cid = ids[0], nextId = ids[1];
  const open = () => { w._pbCS(cid).tagsOpen = true; w.pbRerenderCard(cid); const ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.focus(); return ti; };
  const key = (el, type, init) => { const ev = new w.KeyboardEvent(type, Object.assign({ bubbles: true, cancelable: true }, init)); if (init.keyCode != null) { Object.defineProperty(ev, 'keyCode', { value: init.keyCode }); Object.defineProperty(ev, 'which', { value: init.keyCode }); } el.dispatchEvent(ev); return ev; };
  const focusIs = () => { const a = d.activeElement; return a && a.hasAttribute('data-taginp') ? 'taginp:' + a.getAttribute('data-cid') : a && a.dataset && a.dataset.pbedit ? a.dataset.pbedit + ':' + a.dataset.cid : (a && a.tagName); };
  const tags = () => w.pbCardById(cid).tags.slice();
  const via = () => dl(PBW, 'd10_tag_enter').map((l) => l.d.via);

  let ti = open();
  T('M3h.1 the tag input is dressed: one-field form around it, enterkeyhint=enter, the frozen keydown Enter path still adds the tag and keeps focus', () => {
    assert(ti.parentNode.tagName === 'FORM' && ti.parentNode.getAttribute('data-tagform') === cid, 'no form around the tag input');
    assert(ti.getAttribute('enterkeyhint') === 'enter', 'enterkeyhint missing');
    ti.value = 'food';
    const ev = key(ti, 'keydown', { key: 'Enter', keyCode: 13 });
    assert(ev.defaultPrevented && tags().join() === 'food' && focusIs() === 'taginp:' + cid, 'frozen path broken: tags=' + tags() + ' focus=' + focusIs());
    assert(via().length === 0, 'D-10 must not double-handle a key the frozen handler took');
  });
  ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.focus();
  T('M3h.2 composing keyboard: keydown arrives as Unidentified/229, the keyboard submits the form → tag added, focus stays', () => {
    ti.value = 'drink';
    key(ti, 'keydown', { key: 'Unidentified', keyCode: 229 });
    assert(tags().join() === 'food', 'a 229 keydown must not add');
    const sub = new w.Event('submit', { bubbles: true, cancelable: true });
    ti.parentNode.dispatchEvent(sub);
    assert(sub.defaultPrevented, 'submit not prevented — the page would navigate');
    assert(tags().join() === 'food,drink' && focusIs() === 'taginp:' + cid && via().slice(-1)[0] === 'submit', 'submit path: tags=' + tags() + ' focus=' + focusIs() + ' via=' + via());
  });
  ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.focus();
  T('M3h.3 keyCode 13 without key=Enter → tag added via keycode', () => {
    ti.value = 'spicy';
    const ev = key(ti, 'keydown', { key: 'Unidentified', keyCode: 13 });
    assert(ev.defaultPrevented && tags().join() === 'food,drink,spicy' && via().slice(-1)[0] === 'keycode', 'keycode path: tags=' + tags() + ' via=' + via());
  });
  ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.focus();
  T('M3h.4 keyup Enter after a 229 keydown → tag added via keyup; a keyup after a keydown-handled add adds nothing twice', () => {
    ti.value = 'sweet';
    key(ti, 'keydown', { key: 'Process', keyCode: 229 });
    key(ti, 'keyup', { key: 'Enter', keyCode: 13 });
    assert(tags().join() === 'food,drink,spicy,sweet' && via().slice(-1)[0] === 'keyup', 'keyup path: tags=' + tags() + ' via=' + via());
    const n = via().length;
    ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.focus(); ti.value = 'sour';
    key(ti, 'keydown', { key: 'Enter', keyCode: 13 });
    const after = d.querySelector('[data-taginp][data-cid="' + cid + '"]');
    key(after, 'keyup', { key: 'Enter', keyCode: 13 });
    assert(tags().join() === 'food,drink,spicy,sweet,sour' && via().length === n, 'double handling: tags=' + tags() + ' via=' + via());
  });
  ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.focus();
  ti.value = 'hot';
  key(ti, 'keydown', { key: 'Enter', keyCode: 13 });
  /* the keyboard's own "next field" action lands focus on the next card */
  d.querySelector('#pbb-' + nextId + ' [data-pbedit]').focus();
  const stolen = focusIs();
  await sleep(120);
  T('M3h.5 the phone moves focus to the next card after the add → it is put back in the tag field', () => {
    assert(stolen !== 'taginp:' + cid, 'the steal did not happen in the rig: ' + stolen);
    assert(focusIs() === 'taginp:' + cid, 'focus not restored: ' + focusIs());
    assert(dl(PBW, 'd10_refocus').length >= 1, 'no d10_refocus line');
  });
  T('M3h.6 an empty field never adds: submit and keyup with nothing typed are ignored', () => {
    const before = tags().length, n = via().length;
    ti = d.querySelector('[data-taginp][data-cid="' + cid + '"]'); ti.value = '   ';
    ti.parentNode.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    key(ti, 'keyup', { key: 'Enter', keyCode: 13 });
    assert(tags().length === before && via().length === n, 'empty field added something');
  });
  T('M3h.7 a full list render dresses every card\'s tag input, and re-dressing never nests forms', () => {
    w._pbCS(nextId).tagsOpen = true; w.renderPbList();
    const all = [...d.querySelectorAll('[data-taginp]')];
    assert(all.length >= 2 && all.every((x) => x.parentNode.tagName === 'FORM' && x.parentNode.parentNode.tagName !== 'FORM'), 'not every tag input is dressed exactly once');
  });
}
PBW.dom.window.close();

/* ── M4 · CARRIED PARTS STILL LIVE ───────────────────────────────────────── */
console.log('M4 · the carried 27·ship parts are still installed and working');
const CA = A.w.CALL;
CA.active = true; CA.kind = 'video'; CA.caller = true; CA.pc = new A.w.FakePC();
T('M4.1 V-1: with the socket down a signal is queued, not lost', () => {
  linkAC.up = false;
  const r = A.w.relaySend({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:1 1 udp 1 10.0.0.1 1 typ host' } } });
  assert(r === false && saw(A, 'c1_queued').length === 1, 'V-1 not live');
  linkAC.up = true;
});
T('M4.2 S-2: back during a call is absorbed', () => {
  const before = A.w.history.length;
  A.w.dispatchEvent(new A.w.PopStateEvent('popstate', { state: null }));
  assert(A.w.history.length >= before && (saw(A, 's2_back_absorbed').length >= 1 || A.w.history.state && A.w.history.state.tbCall === 1), 'S-2 not live');
});
T('M4.3 F-1, V-2, V-3, V-4 wrappers installed', () => {
  assert(/_camSenders\.apply/.test(String(A.w.camSenders)) && (process.env.TB_SKIP_M1 ? /v2Schedule/.test(String(A.w.relayConnect)) : /_relayConnect\.apply/.test(String(A.w.relayConnect))) && /_runRecovery/.test(String(A.w.CALL.runRecovery)) && /_start\.apply/.test(String(A.w.CALL.startVideoWatchdog)), 'a carried wrapper is missing');
});
CA.active = false;

/* ── M6 · BASELINE UNDISTURBED ───────────────────────────────────────────── */
console.log('M6 · the baseline is still itself');
T('M6.1 CONNECT_TIMEOUT_MS and keepalive untouched', () => assert(A.w.CALL.CONNECT_TIMEOUT_MS === 20000 && /3000/.test(String(A.w.CALL.startKeepalive)), 'baseline constants changed'));
T('M6.2 c5 video surface live', () => assert(typeof A.w.tbSwapTap === 'function' && typeof A.w.tbFlipCamera === 'function' && A.w.document.getElementById('call-videos'), 'c5 surface missing'));
T('M6.3 no uncaught errors across the whole run', () => assert(A.errors.length === 0 && B.errors.length === 0, [...A.errors, ...B.errors].join(' | ')));

A.dom.window.close(); B.dom.window.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
