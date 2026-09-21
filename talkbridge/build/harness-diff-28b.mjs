#!/usr/bin/env node
/* 28·base DIFFERENTIAL harness (§7.16 M3) — the accepted 27·post-ship bytes
   and the flattened candidate boot side by side in identical rigs (seeded
   random, one shared fake clock, same fake sockets and peers) and are driven
   through the same script: join, hello, chat both ways, receipts, typing,
   presence, ping, rename, threads, records, calls, a dropped and recovered
   signal, the socket dying and coming back, a background room's lane.
   Then every phone's ordered log, every message on the wire, the rooms, the
   transcript and the rendered room view are compared. Any difference is red
   and printed as a diff. Structural sections prove the removal and the
   contract. Every gate is mutation-tested by build/mutate-28b.mjs.

   Usage: node harness-diff-28b.mjs [candidate.html]  (TB_PART_OVERRIDE / TB_KEEP for mutations) */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { BASE_FILE, PART, SYMBOLS, TAIL, assemble, removals } from './assemble-28b.mjs';

const candP = process.argv[2] || 'bridge-turn28-base.html';
const cand = readFileSync(candP, 'utf8');
const accepted = readFileSync(BASE_FILE, 'utf8');
const part = process.env.TB_PART_OVERRIDE ? readFileSync(process.env.TB_PART_OVERRIDE, 'utf8') : readFileSync(PART, 'utf8');

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const inline = (html) => html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)[1];

/* ── M1 · THE REMOVAL IS EXACTLY THE DECLARED ONE ────────────────────────── */
console.log('M1 · candidate === accepted − declared layers + FL-1, nothing else');
const KEEP = process.env.TB_KEEP ? process.env.TB_KEEP.split(',') : [];
T('M1.1 candidate is the assembler\'s output for this part (every removal by its banked bytes)', () => assert(cand === assemble({ part, keepRemovals: KEEP }), 'candidate is not accepted − removals + part'));
T('M1.2 every removed layer is banked and was present exactly once in the accepted bytes', () => {
  const rs = removals(); assert(rs.length === 27, 'expected 27 banked layers, got ' + rs.length);
  for (const r of rs) { assert(accepted.split(r.text).length - 1 === 1, r.file + ' not exactly once in accepted'); if (!KEEP.includes(r.file)) assert(cand.indexOf(r.text) === -1, r.file + ' still in candidate'); }
});
T('M1.3 the part declares exactly the six symbols and no wraps', () => {
  const c = part.slice(part.indexOf('@contract'), part.indexOf('*/', part.indexOf('@contract')));
  assert(/replaces:\s*relaySend, relayConnect, reconnectRelayNow, LISTEN\.open, LISTEN\.handle, handleRelay/.test(c) && /wraps:\s*\(none\)/.test(c), 'contract mismatch');
});

/* ── M2 · NOTHING NEW, NOTHING LEFT BEHIND ───────────────────────────────── */
console.log('M2 · nothing new, nothing left behind');
const markers = (js) => { const s = new Set(); const re = /\b(?:log|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
T('M2.1 the set of log markers in the candidate equals the accepted set (no marker added or lost)', () => {
  const a = markers(inline(accepted)), c = markers(inline(cand));
  const added = [...c].filter((x) => !a.has(x)), lost = [...a].filter((x) => !c.has(x));
  assert(added.length === 0 && lost.length === 0, 'added: ' + added.join(',') + ' lost: ' + lost.join(','));
});
T('M2.2 no wrapper of a flattened symbol survives in code; each symbol is bound once', () => {
  const js = code(inline(cand));
  for (const s of SYMBOLS) {
    const re = new RegExp('(^|[^\\w$.])' + s.replace('.', '\\.') + '\\s*=(?!=)', 'g');
    const decl = s.includes('.') ? 0 : (js.match(new RegExp('^function ' + s + '\\(', 'mg')) || []).length;
    const assigns = (js.match(re) || []).length;
    assert(decl + assigns === 1, s + ': ' + decl + ' declaration(s) + ' + assigns + ' assignment(s)');
    assert(!new RegExp('var _\\w*' + s.split('.').pop().replace(/^./, (ch) => ch.toUpperCase()) + '\\w* = ' + s.replace('.', '\\.') + ';').test(js), s + ' is still captured by a wrapper');
  }
  assert(!/_lcHandleRelay|_rmHandleRelay|_sHandleRelay|_r8HandleRelay|_p4HandleRelay|_p6HandleRelay|_cr3HandleRelay|_rListenHandle|_lcListen\b|_rmListen\b|_p6Listen|_cr3ListenHandle|_cr3RelaySend|_cr3RelayConnect|_cr3ReconnectNow|_cr3ListenOpen|_netRelayConnect/.test(js), 'a captured previous-layer reference survives');
});
T('M2.3 FL-1 adds no message type, no endpoint, no credential path (G19/G20)', () => {
  const c = code(part);
  assert(!/credentials\/generate|iceServers|transport=tcp|turns?:|tb_gh_pat|Authorization/.test(c), 'a credential or ICE path');
  const types = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(c))) types.add(m[1]);
  const acceptedTypes = new Set(); const re2 = /type:\s*'([a-z-]+)'/g; while ((m = re2.exec(code(inline(accepted))))) acceptedTypes.add(m[1]);
  const added = [...types].filter((t) => !acceptedTypes.has(t)); assert(added.length === 0, 'new message type: ' + added.join(','));
});

/* ── M3 · DIFFERENTIAL ───────────────────────────────────────────────────── */
console.log('M3 · differential: same script, same phones, same everything');
const clock = { t: 1758400000000 };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeWindow(html, tag, dev, seed) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/x.html', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.Math.random = mulberry32(seed);
      w.Date.now = () => clock.t;
      class FakeWS {
        constructor(url) { this.url = url; this.readyState = 0; this.__l = {}; this.__sent = []; w.__sockets.push(this); }
        addEventListener(t, f) { (this.__l[t] = this.__l[t] || []).push(f); }
        removeEventListener() {}
        send(s) { this.__sent.push(s); }
        close() { this.readyState = 3; }
        __fire(t, ev) { ev = ev || {}; if (t === 'open') this.readyState = 1; if (t === 'close') this.readyState = 3; const h = this['on' + t]; if (typeof h === 'function') { try { h.call(this, ev); } catch (_) {} } (this.__l[t] || []).forEach((f) => { try { f.call(this, ev); } catch (_) {} }); }
      }
      w.__sockets = []; w.WebSocket = FakeWS;
      class FakePC { constructor() { this.connectionState = 'connected'; this.iceConnectionState = 'connected'; this.signalingState = 'stable'; this.__cands = []; this.__senders = []; } getSenders() { return this.__senders; } addEventListener() {} removeEventListener() {} getConfiguration() { return {}; } createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; } addTrack() { return {}; } createOffer() { return Promise.resolve({ type: 'offer', sdp: 'v=0\r\na=ice-ufrag:first\r\n' }); } createAnswer() { return Promise.resolve({ type: 'answer', sdp: 'v=0\r\na=ice-ufrag:ans\r\n' }); } setLocalDescription(d) { this.localDescription = d; return Promise.resolve(); } setRemoteDescription(d) { this.remoteDescription = d; return Promise.resolve(); } addIceCandidate(c) { this.__cands.push(c); return Promise.resolve(); } getStats() { return Promise.resolve({ forEach() {} }); } close() { this.connectionState = 'closed'; } }
      w.FakePC = FakePC; w.RTCPeerConnection = FakePC;
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } }; w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.localStorage.setItem('tb_name', tag); w.localStorage.setItem('tb_dev', dev); w.localStorage.setItem('tb_devlog_name', tag.toLowerCase() + '-dev');
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
  return { dom, w: dom.window, errors };
}
function wire(a, b) {
  const link = { up: true, sent: { a: [], b: [] } };
  const mk = (to, key) => ({ get readyState() { return link.up ? 1 : 3; }, send(s) { link.sent[key].push(s); const d = JSON.parse(s); setTimeout(() => { try { to.w.handleRelay(d); } catch (e) { to.errors.push('handleRelay: ' + e.message); } }, 0); }, close() {}, addEventListener() {} });
  a.w._relayWs = mk(b, 'a'); b.w._relayWs = mk(a, 'b');
  return link;
}
function enterRoom(inst, role) {
  const w = inst.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: false, myName: role === 'creator' ? 'Ann' : 'Bo' };
  w.S.rooms = [room, { id: 'bg-room', role: 'creator', title: 'Back', myLang: 'en', theirLang: 'th', joined: true, myName: 'Ann' }];
  w.S.roomId = room.id; w.S.view = 'room'; w.S.user = w.S.user || {}; w.S.user.name = room.myName;
  return room;
}
/* one build's whole rig: creator X, joiner Y, linked */
async function rig(html, tagPrefix) {
  const X = makeWindow(html, tagPrefix + 'Ann', 'aaaa1111-0000-4000-8000-000000000001', 11);
  const Y = makeWindow(html, tagPrefix + 'Bo', 'bbbb2222-0000-4000-8000-000000000002', 22);
  await sleep(1300);
  const link = wire(X, Y);
  enterRoom(X, 'creator'); enterRoom(Y, 'joiner');
  X.w.debugLog.length = 0; Y.w.debugLog.length = 0;                 /* the boot is not under test; the relay path is */
  return { X, Y, link };
}
const tick = (ms) => { clock.t += ms; };
/* the script — every step runs on both rigs in lockstep */
async function drive(R) {
  const { X, Y, link } = R;
  const yx = (m) => Y.w.relaySend(m);          /* Y → X */
  const xy = (m) => X.w.relaySend(m);          /* X → Y */
  tick(10); yx({ type: 'hello', lang: 'th', targetLang: 'en', role: 'joiner', name: 'Bo' }); await sleep(30);
  tick(10); xy({ type: 'chat-msg', chatId: 'cm-x1', srcText: 'hello there', tgtText: 'สวัสดี', srcLang: 'en', tgtLang: 'th', senderName: 'Ann', origin: 'typed', eventId: 'ev-1' }); await sleep(30);
  tick(10); yx({ type: 'chat-msg', chatId: 'cm-y1', srcText: 'hi', tgtText: 'hi', srcLang: 'th', tgtLang: 'en', senderName: 'Bo', origin: 'typed', eventId: 'ev-2' }); await sleep(30);
  tick(10); yx({ type: 'chat-read', ids: ['cm-x1'] }); await sleep(20);
  /* a chat that lands while the room is not on screen owes a receipt; the next message of any kind pays it (S layer) */
  X.w.S.view = 'home'; tick(10); yx({ type: 'chat-msg', chatId: 'cm-y2', srcText: 'still there?', tgtText: 'still there?', srcLang: 'th', tgtLang: 'en', senderName: 'Bo', origin: 'typed', eventId: 'ev-2b' }); await sleep(30);
  X.w.S.view = 'room'; tick(10); yx({ type: 'typing' }); await sleep(20);                       /* typing goes no deeper: the receipt is still owed */
  tick(10); X.w.handleRelay({ type: 'peer', from: 'relay', others: 1 });
  tick(10); yx({ type: 'pong' }); await sleep(20);                                                /* the pong pays it */
  tick(10); yx({ type: 'typing' }); await sleep(20);
  tick(10); X.w.handleRelay({ type: 'peer', from: 'relay', others: 1 }); X.w.handleRelay({ type: 'peer', from: 'relay', others: 0 });
  tick(10); yx({ type: 'ping', transient: true }); await sleep(20);
  tick(10); Y.w.renameRoom('Bravo'); await sleep(30);
  tick(10); yx({ type: 'sys-pill', text: 'Bo is now Bob', pillId: 'sp-y-1', newName: 'Bob' }); await sleep(20);
  tick(10); yx({ type: 'ev-proj', bogus: true }); yx({ type: 'ev-reply' }); await sleep(20);
  tick(10); yx({ type: 'thread-invite', threadId: 'thr-1', name: 'Side', from: 'x' }); await sleep(20);
  tick(10); yx({ type: 'room-left' }); await sleep(20);
  tick(10); yx({ type: 'call-start', kind: 'video', callId: 'c-1', eventId: 'ev-3', name: 'Bo' }); await sleep(30);
  tick(10); yx({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:1 1 udp 1 10.0.0.1 1 typ host', sdpMid: '0', sdpMLineIndex: 0 } } }); await sleep(20);
  tick(10); yx({ type: 'call-end', callId: 'c-1' }); await sleep(30);
  tick(10); yx({ type: 'mic-state', micOn: false }); yx({ type: 'cam-state', camOn: false }); yx({ type: 'subtitle', text: 'x' }); yx({ type: 'history-sync', chunk: [] }); yx({ type: 'pong' }); yx({ type: 'unknown-thing' }); await sleep(30);
  /* a dropped signal is queued and flushed */
  link.up = false; tick(10);
  xy({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:9 1 udp 1 10.0.0.9 1 typ host' } } });
  xy({ type: 'chat-msg', chatId: 'cm-x-lost', srcText: 'lost', senderName: 'Ann' });
  await sleep(250); link.up = true; tick(300); await sleep(300);
  /* the real socket: open, die, ramp back */
  X.w.CALL.active = false;
  X.w.relayConnect(); const s1 = X.w.__sockets[X.w.__sockets.length - 1];
  X.w.relayConnect();                                       /* while connecting → coalesced */
  X.w.reconnectRelayNow('probe-while-connecting');
  tick(50); s1.__fire('open'); await sleep(20);
  X.w.reconnectRelayNow('probe-while-open');
  tick(1000); s1.__fire('close', { code: 1006 }); await sleep(400);          /* v2 300 ms retry */
  const s2 = X.w.__sockets[X.w.__sockets.length - 1];
  tick(50); if (s2 && s2 !== s1) s2.__fire('open'); await sleep(20);
  tick(10); X.w.S.view = 'home'; s2 && s2.__fire('close', { code: 1001 }); await sleep(400); X.w.S.view = 'room';
  X.w.reconnectRelayNow('probe-after-close'); await sleep(20);
  /* a connect with no active room: the base builds nothing, but the "after" blocks still hook whatever socket is there (0d D-11, kept) */
  const s3 = X.w.__sockets[X.w.__sockets.length - 1];
  X.w.S.roomId = null; X.w.relayConnect(); X.w.S.roomId = 'gate-room';
  tick(50); s3.__fire('open'); tick(500); s3.__fire('close', { code: 1005 }); await sleep(400);
  /* the background room's lane */
  const bg = X.w.roomById('bg-room');
  X.w.LISTEN.open(bg); const l1 = X.w.LISTEN.socks['bg-room'];
  tick(10); l1.__fire('open'); await sleep(20);
  const via = (m) => { m.from = 'bbbb2222-0000-4000-8000-000000000002'; X.w.LISTEN.handle('bg-room', m); };
  tick(10); via({ type: 'hello', name: 'Cy' }); via({ type: 'ping' });
  tick(10); via({ type: 'chat-msg', chatId: 'cm-bg-1', srcText: 'psst', tgtText: 'psst', senderName: 'Cy', eventId: 'ev-9' });
  tick(10); via({ type: 'chat-msg', chatId: 'cm-bg-1', srcText: 'psst', senderName: 'Cy' });      /* duplicate → ack only */
  tick(10); via({ type: 'sys-pill', text: 'Cy is now Cyd', pillId: 'sp-bg-1', newName: 'Cyd' });
  tick(10); via({ type: 'sys-pill', text: 'Cy renamed the room to Delta', pillId: 'sp-bg-2', newRoomName: 'Delta', wasRoomName: 'Back', byName: 'Cy', ts: clock.t });
  tick(10); via({ type: 'call-start', kind: 'voice', callId: 'c-bg', eventId: 'ev-10', name: 'Cy' }); await sleep(30);
  tick(10); via({ type: 'call-end', callId: 'c-bg', name: 'Cy' });
  tick(10); via({ type: 'ev-proj' }); via({ type: 'thread-invite', threadId: 'thr-bg', name: 'T' }); via({ type: 'room-left' }); via({ type: 'nothing' });
  await sleep(50);
}
const mask = (v, k) => {
  if (typeof v === 'number' && (v > 1e11 || /^(ms|livedMs|t|at|dur|elapsed)$/.test(k || ''))) return 'N';
  if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) return 'ISO';
  if (Array.isArray(v)) return v.map((x) => mask(x));
  if (v && typeof v === 'object') { const o = {}; for (const kk of Object.keys(v).sort()) o[kk] = mask(v[kk], kk); return o; }
  return v;
};
function snapshot(inst, sentLists) {
  const w = inst.w;
  return {
    log: w.debugLog.map((l) => ({ ev: l.ev, lvl: l.lvl, d: mask(l.d) })),
    wire: sentLists.map((s) => mask(JSON.parse(s))),
    sockets: w.__sockets.map((s) => ({ url: s.url.replace(/client=[^&]*/, 'client=X'), state: s.readyState, sent: s.__sent.map((x) => mask(JSON.parse(x))) })),
    listen: Object.keys(w.LISTEN.socks),
    rooms: mask(JSON.parse(JSON.stringify(w.S.rooms))),
    transcript: mask(JSON.parse(JSON.stringify(w.transcript))),
    bgTranscript: mask(w.loadTr('bg-room')),
    call: { active: !!w.CALL.active, ringPending: mask(w.CALL.ringPending || null) },
    dom: (w.document.getElementById('transcript') || {}).innerHTML || '',
    head: (w.document.querySelector('#room-title, .room-title, #rm-title') || {}).textContent || '',
    errors: inst.errors.slice()
  };
}
function diff(a, b, path, out) {
  if (out.length > 12) return;
  if (typeof a !== typeof b || (a && typeof a === 'object') !== (b && typeof b === 'object')) { out.push(path + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); return; }
  if (Array.isArray(a)) { if (a.length !== b.length) out.push(path + '.length ' + a.length + ' ≠ ' + b.length); for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], path + '[' + i + ']', out); return; }
  if (a && typeof a === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], path + '.' + k, out); return; }
  if (a !== b) out.push(path + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b));
}

const RA = await rig(accepted, 'A-'); const t0 = clock.t;
await drive(RA);
const snapA = { X: snapshot(RA.X, RA.link.sent.a), Y: snapshot(RA.Y, RA.link.sent.b) };
clock.t = t0;
const RC = await rig(cand, 'C-');
await drive(RC);
const snapC = { X: snapshot(RC.X, RC.link.sent.a), Y: snapshot(RC.Y, RC.link.sent.b) };

T('M3.0 the script exercised the path: both rigs produced a substantial log, wire and socket history', () => {
  if (process.env.TB_DUMP) console.log('    X events: ' + [...new Set(snapA.X.log.map((l) => l.ev))].join(',') + '\n    Y events: ' + [...new Set(snapA.Y.log.map((l) => l.ev))].join(',') + '\n    X wire: ' + snapA.X.wire.map((m) => m.type).join(',') + '\n    Y wire: ' + snapA.Y.wire.map((m) => m.type).join(','));
  assert(snapA.X.log.length > 25 && snapA.X.wire.length > 5 && snapA.X.sockets.length >= 3 && snapA.Y.log.length > 3, 'script too thin: X ' + snapA.X.log.length + ' log, ' + snapA.X.wire.length + ' wire, ' + snapA.X.sockets.length + ' sockets; Y ' + snapA.Y.log.length + ' log');
  assert(snapA.X.log.some((l) => l.ev === 'c1_queued') && snapA.X.log.some((l) => l.ev === 'v2_retry') && snapA.X.log.some((l) => l.ev === 'pr3_dot') && snapA.X.log.some((l) => l.ev === 'bg_chat_rx') && snapA.X.log.some((l) => l.ev === 'rm_rename_received'), 'a headline marker never fired on the accepted build: ' + [...new Set(snapA.X.log.map((l) => l.ev))].join(','));
});
for (const who of ['X', 'Y']) for (const key of ['log', 'wire', 'sockets', 'listen', 'rooms', 'transcript', 'bgTranscript', 'call', 'dom', 'errors']) {
  T('M3 ' + who + '.' + key + ' identical on both builds', () => { const out = []; diff(snapA[who][key], snapC[who][key], who + '.' + key, out); assert(out.length === 0, '\n      ' + out.join('\n      ')); });
}
RA.X.dom.window.close(); RA.Y.dom.window.close(); RC.X.dom.window.close(); RC.Y.dom.window.close();

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
