#!/usr/bin/env node
/* 28·pre-ship DIFFERENTIAL harness (§7.16 M3, cluster 2: the call) — the
   28·base c2 bytes and the flattened candidate boot side by side in identical
   rigs (seeded random, one shared fake clock, same fake sockets, peers,
   microphones and cameras) and are driven through the same script: the whole
   relay script of 28·base, then a voice call placed, rung, answered, offered,
   answered, muted, restarted by the joiner, served by the creator, sampled by
   the stall watchdogs, flipped, hung up; a cancelled call; a muted room; a
   hidden phone; the keys. Then every phone's ordered log, wire, sockets,
   rooms, transcript, call state, caller screen and room view are compared.
   Any difference is red and printed. Structural sections prove the removal
   and the contract. X-3 and G-1, the two declared additions, get their own
   functional sections. Every gate is mutation-tested by build/mutate-28ps.mjs.

   Usage: node harness-diff-28ps.mjs [candidate.html]
     TB_PARTS_OVERRIDE=fl2,x1,g1   TB_KEEP=fixture,...   TB_DUMP=1 */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { BASE_FILE, PARTS, SYMBOLS, ADDED_MARKERS, assemble, removals } from './assemble-28ps.mjs';

const candP = process.argv[2] || 'bridge-turn28-pre-ship.html';
const cand = readFileSync(candP, 'utf8');
const accepted = readFileSync(BASE_FILE, 'utf8');
const parts = PARTS.map((p, i) => process.env.TB_PARTS_OVERRIDE ? readFileSync(process.env.TB_PARTS_OVERRIDE.split(',')[i], 'utf8') : readFileSync(p, 'utf8'));
const [fl2, x1, g1] = parts;                                              /* x1 is the X slot: X-3 since candidate 3 */

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const TA = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const inline = (html) => html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)[1];

/* ── M1 · THE REMOVAL IS EXACTLY THE DECLARED ONE ────────────────────────── */
console.log('M1 · candidate === 28·base − declared layers + FL-2 + X-3 + G-1, nothing else');
const KEEP = process.env.TB_KEEP ? process.env.TB_KEEP.split(',') : [];
T('M1.1 candidate is the assembler\'s output for these parts (every removal by its banked bytes)', () => assert(cand === assemble({ parts, keepRemovals: KEEP }), 'candidate is not base − removals + parts'));
T('M1.2 every removed layer is banked and was present exactly once in the base bytes', () => {
  const rs = removals(); assert(rs.length === 34, 'expected 34 banked layers, got ' + rs.length);
  for (const r of rs) { assert(accepted.split(r.text).length - 1 === 1, r.file + ' not exactly once in base'); if (!KEEP.includes(r.file)) assert(cand.indexOf(r.text) === -1, r.file + ' still in candidate'); }
});
T('M1.3 the parts declare their contracts: FL-2 replaces the fifteen call symbols and wraps nothing; X-3 wraps wireMsg, normalizeOutgoing, appendMsgDom, chatPayload and handleChatMsg; G-1 wraps only translateWithRetry', () => {
  const c = (p) => p.slice(p.indexOf('@contract'), p.indexOf('*/', p.indexOf('@contract')));
  assert(/replaces:\s*CALL\.keys, CALL\.start, CALL\.onIncoming, CALL\.accept, CALL\.onAccepted, CALL\.mount, CALL\.onSignal, CALL\.runRecovery, CALL\.startVideoWatchdog, CALL\.stopVideoWatchdog, CALL\.toggleMic, CALL\.hangUp, CALL\.teardown, camSenders, replaceSenderTrack/.test(c(fl2)) && /wraps:\s*\(none\)/.test(c(fl2)), 'FL-2 contract mismatch');
  assert(/replaces:\s*\(none\)/.test(c(x1)) && /wraps:\s*wireMsg, normalizeOutgoing, appendMsgDom, chatPayload, handleChatMsg\s*$/m.test(c(x1)), 'X-3 contract mismatch');
  assert(/replaces:\s*\(none\)/.test(c(g1)) && /wraps:\s*translateWithRetry\s*$/m.test(c(g1)), 'G-1 contract mismatch');
});

/* ── M2 · NOTHING NEW, NOTHING LEFT BEHIND ───────────────────────────────── */
console.log('M2 · nothing new, nothing left behind');
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
T('M2.1 the set of log markers in the candidate equals the base set plus exactly the declared additions', () => {
  const a = markers(inline(accepted)), c = markers(inline(cand));
  const added = [...c].filter((x) => !a.has(x) && !ADDED_MARKERS.includes(x)), lost = [...a].filter((x) => !c.has(x));
  assert(added.length === 0 && lost.length === 0, 'added: ' + added.join(',') + ' lost: ' + lost.join(','));
  for (const m of ADDED_MARKERS) assert(c.has(m), 'declared marker never used: ' + m);
  assert(markers(fl2).size === [...markers(fl2)].filter((m) => a.has(m)).length, 'FL-2 logs a marker the base never did: ' + [...markers(fl2)].filter((m) => !a.has(m)).join(','));
});
T('M2.2 no wrapper of a flattened symbol survives; each call symbol is bound exactly once; no captured previous-layer reference remains', () => {
  const js = code(inline(cand));
  for (const s of SYMBOLS) {
    const assigns = (js.match(new RegExp('(^|[^\\w$.])' + s.replace('.', '\\.') + '\\s*=(?!=)', 'g')) || []).length;
    const decl = s.includes('.') ? (js.match(new RegExp('^  ' + s.split('.')[1] + ':\\s*(async\\s*)?function', 'mg')) || []).filter(() => false).length : (js.match(new RegExp('^function ' + s + '\\(', 'mg')) || []).length;
    const literal = s.includes('.') ? (js.slice(js.indexOf('var CALL={'), js.indexOf('\n};', js.indexOf('var CALL={'))).match(new RegExp('^  ' + s.split('.')[1] + ':\\s*(async\\s*)?function', 'mg')) || []).length : 0;
    assert(assigns + decl + literal === 1, s + ': ' + assigns + ' assignment(s) + ' + decl + ' declaration(s) + ' + literal + ' literal member(s)');
  }
  assert(!/_(?:n10|n18|c3|c2|f1|c5|r8b|p4|cr3|a|t|m|c)?(?:Start|Accept|OnAccepted|OnIncoming|Teardown|Mount|OnSignal|HangUp|ToggleMic|Keys|RunRecovery|StartWatch|StopWatch|CamSenders|ReplaceSender)\w*\s*=\s*(?:CALL\.\w+|camSenders|replaceSenderTrack)\s*;/.test(js) && !/var (?:_\w*(?:Start|Accept|Teardown|Mount|OnSignal|HangUp|OnIncoming|OnAccepted|Keys)\w*) = CALL\./.test(js), 'a captured previous-layer reference survives');
  assert(!/\b_origStart\b|\b_c3OnSignal\b|\b_c3RunRecovery\b|\b_c2Start\b|\b_c2Stop\b|\b_f1Cam\b|\b_f1Replace\b|\b_n10\w+Teardown\b|\b_r8bMount\b|\b_p4OnIncoming\b|\b_p4Accept\b|\b_cr3OnIncoming\b|\b_cr3Keys\b|\b_aStart\b|\b_aAccept\b|\b_aTeardown\b|\b_mToggleMic\b|\b_c5HangUp\b/.test(js), 'a wrapper variable name survives');
});
T('M2.3 nothing new on the wire or in the credential path (G19/G20): FL-2 adds no message type; the parts reach only the two translation hosts', () => {
  const c = code(fl2);
  assert(!/credentials\/generate|iceServers|transport=tcp|turns?:|tb_gh_pat|Authorization|fetch\(/.test(c), 'FL-2 has a credential, ICE or network path');
  const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };
  const base = types(code(inline(accepted))); const added = [...types(c)].filter((t) => !base.has(t)); assert(added.length === 0, 'new message type: ' + added.join(','));
  assert(!/relaySend|type:\s*'/.test(code(x1).replace(/\.type='button'/g, '').replace(/m\.type === 'chat-msg'/g, '') + code(g1)), 'X-3 or G-1 sends on the wire (X-3 may only add two fields to a chat message it did not send)');
  const hosts = new Set(); let m; const re = /https:\/\/([a-z0-9.-]+)\//g; for (const p of [x1, g1]) while ((m = re.exec(code(p)))) hosts.add(m[1]);
  assert([...hosts].every((h) => h === 'translate.googleapis.com'), 'an undeclared host: ' + [...hosts].join(','));
  assert(!/localStorage|tb_dg_key|tb_cf_|venice|openrouter|apiKey|api_key/i.test(code(x1) + code(g1)), 'X-3 or G-1 touches stored keys or an AI tier');
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
      /* peers: every offer carries a fresh ufrag so a restart is visible to the joiner; stats are scripted by the test */
      w.__pcs = []; w.__ufrag = 0;
      class FakePC {
        constructor() { this.connectionState = 'connected'; this.iceConnectionState = 'connected'; this.signalingState = 'stable'; this.__cands = []; this.__senders = []; this.__stats = null; this.__ops = []; w.__pcs.push(this); }
        getSenders() { return this.__senders.slice(); }
        addTrack(t) { const s = { track: t, replaceTrack: (nt) => { s.track = nt; s.__replaced = (s.__replaced || 0) + 1; return Promise.resolve(); } }; this.__senders.push(s); this.__ops.push('addTrack:' + (t && t.kind)); this.__negotiate(); return s; }
        /* a real peer raises negotiationneeded once per batch of added tracks; so does this one */
        __negotiate() { if (this.__neg) return; this.__neg = true; setTimeout(() => { this.__neg = false; this.__ops.push('negotiationneeded'); if (typeof this.onnegotiationneeded === 'function') { try { this.onnegotiationneeded(); } catch (_) {} } }, 0); }
        addEventListener() {} removeEventListener() {} getConfiguration() { return {}; }
        createDataChannel(n) { this.__ops.push('dc:' + n); return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; }
        createOffer(o) { this.__ops.push('offer' + (o && o.iceRestart ? ':restart' : '')); return Promise.resolve({ type: 'offer', sdp: 'v=0\r\na=ice-ufrag:u' + (++w.__ufrag) + '\r\n' }); }
        createAnswer() { this.__ops.push('answer'); return Promise.resolve({ type: 'answer', sdp: 'v=0\r\na=ice-ufrag:ans\r\n' }); }
        setLocalDescription(d) { this.localDescription = d; this.__ops.push('sld:' + (d && d.type)); return Promise.resolve(); }
        setRemoteDescription(d) { this.remoteDescription = d; this.__ops.push('srd:' + (d && d.type)); return Promise.resolve(); }
        addIceCandidate(c) { this.__cands.push(c); return Promise.resolve(); }
        getStats() { const st = this.__stats; return Promise.resolve({ forEach(f) { if (st) f({ type: 'inbound-rtp', kind: 'video', framesDecoded: st.frames }); } }); }
        close() { this.connectionState = 'closed'; this.__ops.push('close'); }
      }
      w.FakePC = FakePC; w.RTCPeerConnection = FakePC;
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {}, disconnect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.__media = 'none';                                                     /* 'none' | 'audio' | 'both' — the test decides what the phone has */
      const mkTrack = (kind) => ({ kind, enabled: true, readyState: 'live', stop() { this.readyState = 'ended'; }, getSettings() { return { facingMode: 'user' }; } });
      w.navigator.mediaDevices.getUserMedia = (c) => {
        if (w.__media === 'none') return Promise.reject(new Error('no hw'));
        if (c && c.video && w.__media !== 'both') return Promise.reject(new Error('no cam'));
        const tracks = [mkTrack('audio')]; if (c && c.video) tracks.push(mkTrack('video'));
        return Promise.resolve({ getTracks() { return tracks.slice(); }, getAudioTracks() { return tracks.filter((t) => t.kind === 'audio'); }, getVideoTracks() { return tracks.filter((t) => t.kind === 'video'); }, removeTrack() {}, addTrack() {} });
      };
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } }; w.Notification.permission = 'default';
      w.__fetches = []; w.__fetchPlan = null;
      w.fetch = (u) => { w.__fetches.push(String(u)); const plan = w.__fetchPlan && w.__fetchPlan(String(u)); if (plan) return plan; return Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') }); };
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.__clip = []; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText(s) { w.__clip.push(s); return Promise.resolve(); } } });
      w.confirm = () => true;
      w.localStorage.setItem('tb_name', tag); w.localStorage.setItem('tb_dev', dev); w.localStorage.setItem('tb_devlog_name', tag.toLowerCase() + '-dev');
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
  return { dom, w: dom.window, errors };
}
function wire(a, b) {
  const link = { up: true, sent: { a: [], b: [] } };
  const mk = (to, key) => ({ get readyState() { return link.up ? 1 : 3; }, send(s) { link.sent[key].push(s); const d = JSON.parse(s); setTimeout(() => { try { to.w.handleRelay(d); } catch (e) { to.errors.push('handleRelay: ' + e.message); } }, 0); }, close() {}, addEventListener() {} });
  const sa = mk(b, 'a'), sb = mk(a, 'b');
  link.rewire = () => { a.w._relayWs = sa; b.w._relayWs = sb; };
  link.rewire();
  return link;
}
function enterRoom(inst, role) {
  const w = inst.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: false, myName: role === 'creator' ? 'Ann' : 'Bo' };
  w.S.rooms = [room, { id: 'bg-room', role: 'creator', title: 'Back', myLang: 'en', theirLang: 'th', joined: true, myName: 'Ann' }];
  w.S.roomId = room.id; w.S.view = 'room'; w.S.user = w.S.user || {}; w.S.user.name = room.myName;
  return room;
}
async function rig(html, tagPrefix) {
  const X = makeWindow(html, tagPrefix + 'Ann', 'aaaa1111-0000-4000-8000-000000000001', 11);
  const Y = makeWindow(html, tagPrefix + 'Bo', 'bbbb2222-0000-4000-8000-000000000002', 22);
  await sleep(1300);
  const link = wire(X, Y);
  enterRoom(X, 'creator'); enterRoom(Y, 'joiner');
  X.w.debugLog.length = 0; Y.w.debugLog.length = 0;
  return { X, Y, link };
}
const tick = (ms) => { clock.t += ms; };
/* run every pending interval callback once, in registration order (the watchdogs tick on real timers; the rig turns them by hand) */
function captureIntervals(w) { const ivs = []; w.setInterval = (fn, ms) => { const id = { fn, ms, on: true }; ivs.push(id); return id; }; w.clearInterval = (id) => { if (id && typeof id === 'object') id.on = false; }; return () => ivs.filter((i) => i.on).forEach((i) => { try { i.fn(); } catch (_) {} }); }
/* the relay script of 28·base, verbatim, then the call */
async function drive(R) {
  const { X, Y, link } = R;
  const yx = (m) => Y.w.relaySend(m);
  const xy = (m) => X.w.relaySend(m);
  tick(10); yx({ type: 'hello', lang: 'th', targetLang: 'en', role: 'joiner', name: 'Bo' }); await sleep(30);
  tick(10); xy({ type: 'chat-msg', chatId: 'cm-x1', srcText: 'hello there', tgtText: 'สวัสดี', srcLang: 'en', tgtLang: 'th', senderName: 'Ann', origin: 'typed', eventId: 'ev-1' }); await sleep(30);
  tick(10); yx({ type: 'chat-msg', chatId: 'cm-y1', srcText: 'hi', tgtText: 'hi', srcLang: 'th', tgtLang: 'en', senderName: 'Bo', origin: 'typed', eventId: 'ev-2' }); await sleep(30);
  tick(10); yx({ type: 'chat-read', ids: ['cm-x1'] }); await sleep(20);
  X.w.S.view = 'home'; tick(10); yx({ type: 'chat-msg', chatId: 'cm-y2', srcText: 'still there?', tgtText: 'still there?', srcLang: 'th', tgtLang: 'en', senderName: 'Bo', origin: 'typed', eventId: 'ev-2b' }); await sleep(30);
  X.w.S.view = 'room'; tick(10); yx({ type: 'typing' }); await sleep(20);
  tick(10); X.w.handleRelay({ type: 'peer', from: 'relay', others: 1 });
  tick(10); yx({ type: 'pong' }); await sleep(20);
  tick(10); yx({ type: 'typing' }); await sleep(20);
  tick(10); X.w.handleRelay({ type: 'peer', from: 'relay', others: 1 }); X.w.handleRelay({ type: 'peer', from: 'relay', others: 0 });
  tick(10); yx({ type: 'ping', transient: true }); await sleep(20);
  tick(10); Y.w.renameRoom('Bravo'); await sleep(30);
  tick(10); yx({ type: 'sys-pill', text: 'Bo is now Bob', pillId: 'sp-y-1', newName: 'Bob' }); await sleep(20);
  tick(10); yx({ type: 'ev-proj', bogus: true }); yx({ type: 'ev-reply' }); await sleep(20);
  tick(10); yx({ type: 'thread-invite', threadId: 'thr-1', name: 'Side', from: 'x' }); await sleep(20);
  tick(10); yx({ type: 'room-left' }); await sleep(20);
  /* a call rings in with no microphone to answer it (the base path: ring, candidate, end) */
  tick(10); yx({ type: 'call-start', kind: 'video', callId: 'c-1', eventId: 'ev-3', name: 'Bo' }); await sleep(30);
  tick(10); yx({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:1 1 udp 1 10.0.0.1 1 typ host', sdpMid: '0', sdpMLineIndex: 0 } } }); await sleep(20);
  tick(10); yx({ type: 'call-end', callId: 'c-1' }); await sleep(30);
  tick(10); yx({ type: 'mic-state', micOn: false }); yx({ type: 'cam-state', camOn: false }); yx({ type: 'subtitle', text: 'x' }); yx({ type: 'history-sync', chunk: [] }); yx({ type: 'pong' }); yx({ type: 'unknown-thing' }); await sleep(30);
  link.up = false; tick(10);
  xy({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:9 1 udp 1 10.0.0.9 1 typ host' } } });
  xy({ type: 'chat-msg', chatId: 'cm-x-lost', srcText: 'lost', senderName: 'Ann' });
  await sleep(250); link.up = true; tick(300); await sleep(300);
  X.w.CALL.active = false;
  X.w.relayConnect(); const s1 = X.w.__sockets[X.w.__sockets.length - 1];
  X.w.relayConnect();
  X.w.reconnectRelayNow('probe-while-connecting');
  tick(50); s1.__fire('open'); await sleep(20);
  X.w.reconnectRelayNow('probe-while-open');
  tick(1000); s1.__fire('close', { code: 1006 }); await sleep(400);
  const s2 = X.w.__sockets[X.w.__sockets.length - 1];
  tick(50); if (s2 && s2 !== s1) s2.__fire('open'); await sleep(20);
  tick(10); X.w.S.view = 'home'; s2 && s2.__fire('close', { code: 1001 }); await sleep(400); X.w.S.view = 'room';
  X.w.reconnectRelayNow('probe-after-close'); await sleep(20);
  const s3 = X.w.__sockets[X.w.__sockets.length - 1];
  X.w.S.roomId = null; X.w.relayConnect(); X.w.S.roomId = 'gate-room';
  tick(50); s3.__fire('open'); tick(500); s3.__fire('close', { code: 1005 }); await sleep(400);
  const bg = X.w.roomById('bg-room');
  X.w.LISTEN.open(bg); const l1 = X.w.LISTEN.socks['bg-room'];
  tick(10); l1.__fire('open'); await sleep(20);
  const via = (m) => { m.from = 'bbbb2222-0000-4000-8000-000000000002'; X.w.LISTEN.handle('bg-room', m); };
  tick(10); via({ type: 'hello', name: 'Cy' }); via({ type: 'ping' });
  tick(10); via({ type: 'chat-msg', chatId: 'cm-bg-1', srcText: 'psst', tgtText: 'psst', senderName: 'Cy', eventId: 'ev-9' });
  tick(10); via({ type: 'chat-msg', chatId: 'cm-bg-1', srcText: 'psst', senderName: 'Cy' });
  tick(10); via({ type: 'sys-pill', text: 'Cy is now Cyd', pillId: 'sp-bg-1', newName: 'Cyd' });
  tick(10); via({ type: 'sys-pill', text: 'Cy renamed the room to Delta', pillId: 'sp-bg-2', newRoomName: 'Delta', wasRoomName: 'Back', byName: 'Cy', ts: clock.t });
  tick(10); via({ type: 'call-start', kind: 'voice', callId: 'c-bg', eventId: 'ev-10', name: 'Cy' }); await sleep(30);
  tick(10); via({ type: 'call-end', callId: 'c-bg', name: 'Cy' });
  tick(10); via({ type: 'ev-proj' }); via({ type: 'thread-invite', threadId: 'thr-bg', name: 'T' }); via({ type: 'room-left' }); via({ type: 'nothing' });
  await sleep(50);

  /* ── the call (cluster 2) ─────────────────────────────────────────────── */
  link.rewire();                                                                  /* the socket script above replaced the relay socket; the two phones are linked again */
  const CX = X.w.CALL, CY = Y.w.CALL;
  X.w.__media = 'both'; Y.w.__media = 'audio';
  /* keys: empty, then with a key in memory, then with a grant filling the gaps */
  R.keys = [];
  R.keys.push(CX.keys());
  X.w.S.joinerKeys = { k: 'dg-mem' }; R.keys.push(CX.keys()); X.w.S.joinerKeys = null;
  try { X.w.localStorage.setItem(X.w.GK.record, JSON.stringify({ expires: clock.t + 600000, at: clock.t })); X.w.localStorage.setItem(X.w.GK.dg, 'dg-grant'); X.w.localStorage.setItem(X.w.GK.tid, 'tid-grant'); X.w.localStorage.setItem(X.w.GK.tok, 'tok-grant'); } catch (_) {}
  R.keys.push(CX.keys()); R.keys.push(CX.keys());                                 /* the second read must not log grant_keys_used again */
  try { X.w.localStorage.setItem(X.w.GK.record, JSON.stringify({ expires: clock.t - 1, at: clock.t })); } catch (_) {}
  R.keys.push(CX.keys());                                                         /* an expired grant fills nothing */
  try { [X.w.GK.record, X.w.GK.dg, X.w.GK.tid, X.w.GK.tok].forEach(function (k) { X.w.localStorage.removeItem(k); }); } catch (_) {}
  /* 1 · the caller places a video call; the joiner rings; the joiner answers (voice only on that phone) */
  const runX = captureIntervals(X.w), runY = captureIntervals(Y.w);
  tick(10); const p1 = CX.start('video'); await sleep(40); await p1; await sleep(40);
  R.n10 = [snapN10(X)];
  tick(10); CX.start('video'); await sleep(20);                                   /* a second start while active is a no-op */
  tick(1000); const p2 = CY.accept(); await sleep(40); await p2; await sleep(500);  /* accept → call-accept → onAccepted → TURN lookup → offer → answer */
  R.n10.push(snapN10(X));
  /* 2 · the creator mutes and unmutes; the joiner toggles the camera it does not have; the creator toggles the one it has */
  tick(10); CX.toggleMic(); tick(10); CX.toggleMic(); await sleep(20);
  tick(10); CY.toggleCam(); CX.toggleCam(); tick(10); CX.toggleCam(); await sleep(30);
  /* 3 · ICE: a candidate each way, a duplicate, a late answer with no pc */
  tick(10); yx({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:2 1 udp 1 10.0.0.2 1 typ host', sdpMid: '0', sdpMLineIndex: 0 } } });
  tick(10); yx({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:2 1 udp 1 10.0.0.2 1 typ host', sdpMid: '0', sdpMLineIndex: 0 } } }); await sleep(30);
  /* 4 · the joiner's step 2 asks for a restart; the creator serves it; the joiner answers the fresh ufrag on the same pc; a second ask inside the gap is ignored */
  CY.recoveryStep = 1; CY.recoveryLock = false; tick(10); CY.runRecovery('probe'); await sleep(120);
  tick(10); yx({ type: 'webrtc-signal', transient: true, signal: { restart: true } }); await sleep(60);
  /* 5 · glare: an offer reaching the creator while it is making one */
  CX.makingOffer = true; tick(10); yx({ type: 'webrtc-signal', transient: true, signal: { description: { type: 'offer', sdp: 'v=0\r\na=ice-ufrag:glare\r\n' } } }); await sleep(40); CX.makingOffer = false;
  /* 6 · the two stall watchdogs on the creator: frames flow, then freeze four samples, then flow again */
  CX.startVideoWatchdog(); const pc = CX.pc;
  if (pc) { pc.__stats = { frames: 10 }; }
  const rv = X.w.document.getElementById('remote-video'); if (rv) { try { Object.defineProperty(rv, 'srcObject', { value: {}, configurable: true, writable: true }); Object.defineProperty(rv, 'currentTime', { value: 1, configurable: true, writable: true }); } catch (_) {} }
  for (let i = 0; i < 2; i++) { tick(2000); runX(); await sleep(10); }
  if (pc) pc.__stats = { frames: 42 }; tick(2000); runX(); await sleep(10);
  for (let i = 0; i < 5; i++) { tick(2000); runX(); await sleep(10); }                /* frozen → c2_stalled, rtc_video_stalled → recovery */
  if (pc) pc.__stats = { frames: 99 }; if (rv) rv.currentTime = 5; tick(2000); runX(); await sleep(10);
  CX.stopVideoWatchdog();
  /* 7 · the flip keeps the sender: release the video sender, ask for the camera senders */
  const vs = (pc ? pc.getSenders() : []).filter((s) => s.track && s.track.kind === 'video')[0];
  R.flip = [];
  if (vs) { X.w.replaceSenderTrack(vs, null); R.flip.push(X.w.camSenders().length); X.w.replaceSenderTrack(vs, { kind: 'video' }); R.flip.push(X.w.camSenders().length); R.flip.push(!!vs.__tbVideoSender); }
  R.flip.push(X.w.replaceSenderTrack(null, null), X.w.replaceSenderTrack({}, null));
  /* 8 · the creator hangs up; the joiner hears it */
  tick(10); X.w.TB_SWAP = true; CX.hangUp(true); await sleep(60);
  R.n10.push(snapN10(X));
  /* 9 · a second call is cancelled from the caller's screen before the answer */
  tick(10); const p3 = CX.start('voice'); await sleep(40); await p3; await sleep(40);
  R.n10.push(snapN10(X));
  tick(10); X.w.document.getElementById('n10-cancel').click(); await sleep(60);
  R.n10.push(snapN10(X));
  /* 10 · a ring into a muted room, a ring onto a hidden phone, a ring the joiner declines */
  Y.w.roomById('gate-room').muted = true; tick(10); xy({ type: 'call-start', kind: 'voice', callId: 'c-m', eventId: 'ev-m', name: 'Ann' }); await sleep(40); Y.w.roomById('gate-room').muted = false;
  try { Object.defineProperty(Y.w.document, 'hidden', { value: true, configurable: true }); } catch (_) {}
  tick(10); xy({ type: 'call-start', kind: 'voice', callId: 'c-h', eventId: 'ev-h', name: 'Ann' }); await sleep(40);
  try { Object.defineProperty(Y.w.document, 'hidden', { value: false, configurable: true }); } catch (_) {}
  tick(10); CX.active = false; CX.caller = false;
  tick(10); xy({ type: 'call-start', kind: 'voice', callId: 'c-d', eventId: 'ev-d', name: 'Ann' }); await sleep(40);
  R.ring = { pending: Y.w.CALL.ringPending ? Y.w.CALL.ringPending.kind : null, shown: Y.w.document.getElementById('ring-overlay').classList.contains('show') };
  tick(10); CY.decline(); await sleep(40);
  /* 11 · a joiner with no microphone cannot answer */
  Y.w.__media = 'none'; tick(10); xy({ type: 'call-start', kind: 'voice', callId: 'c-n', eventId: 'ev-n', name: 'Ann' }); await sleep(40);
  tick(10); const p4 = CY.accept(); await sleep(40); await p4; await sleep(40);
  R.ring2 = { active: !!CY.active, pending: !!CY.ringPending };
  tick(10); CY.teardown(); CX.teardown(); await sleep(30);
  R.pcOps = { X: X.w.__pcs.map((p) => p.__ops), Y: Y.w.__pcs.map((p) => p.__ops) };
}
function snapN10(inst) { const d = inst.w.document, ov = d.getElementById('n10-out'); return ov ? { show: ov.classList.contains('show'), name: d.getElementById('n10-name').textContent, sub: d.getElementById('n10-sub').textContent, parent: ov.parentNode && ov.parentNode.id, timer: d.getElementById('rz-timer').textContent, cls: d.getElementById('scr-room').className } : null; }
const mask = (v, k) => {
  if (typeof v === 'number' && (v > 1e11 || /^(ms|livedMs|t|at|dur|elapsed|sinceMs|exp)$/.test(k || ''))) return 'N';
  if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) return 'ISO';
  if (typeof v === 'string' && /ice-ufrag:u\d+/.test(v)) return v.replace(/ice-ufrag:u\d+/g, 'ice-ufrag:uN');
  if (Array.isArray(v)) return v.map((x) => mask(x));
  if (v && typeof v === 'object') { const o = {}; for (const kk of Object.keys(v).sort()) o[kk] = mask(v[kk], kk); return o; }
  return v;
};
const CHECK_BTN = /<button class="tr-act-btn" data-hact="check" title="Translation check">[\s\S]*?<\/button>/g;
const HOUSEKEEPING = new Set(['r8_menu_labels', 'p4_ctx_save_failed', 't1_coalesced', 'md1_rendered', 'rc_panel_no_body', 'rc_panel_rendered', 'rc_home_rendered']);
function snapshot(inst, sentLists, R) {
  const w = inst.w, C = w.CALL;
  const hk = {}; w.debugLog.forEach((l) => { if (HOUSEKEEPING.has(l.ev)) hk[l.ev] = true; });
  return {
    log: w.debugLog.filter((l) => !HOUSEKEEPING.has(l.ev)).map((l) => ({ ev: l.ev, lvl: l.lvl, d: mask(l.d) })),
    housekeeping: hk,
    wire: sentLists.map((s) => mask(JSON.parse(s))),
    sockets: w.__sockets.map((s) => ({ url: s.url.replace(/client=[^&]*/, 'client=X'), state: s.readyState, sent: s.__sent.map((x) => mask(JSON.parse(x))) })),
    listen: Object.keys(w.LISTEN.socks),
    rooms: mask(JSON.parse(JSON.stringify(w.S.rooms))),
    transcript: mask(JSON.parse(JSON.stringify(w.transcript))),
    bgTranscript: mask(w.loadTr('bg-room')),
    call: { active: !!C.active, caller: !!C.caller, kind: C.kind, micOn: C.micOn, camOn: C.camOn, accepted: !!C.accepted, ringPending: mask(C.ringPending || null), recoveryStep: C.recoveryStep, recoveryLock: !!C.recoveryLock, c3Pending: !!C._c3Pending, c2Timer: !!C.c2Timer, videoWatch: !!C.videoWatchTimer, pc: !!C.pc, stream: !!C.stream, endedAt: C.endedAt ? 'N' : null, startTs: C.startTs ? 'N' : null, pushed: !!C.pushed, chatMicWasOn: !!C._chatMicWasOn, swap: !!w.TB_SWAP },
    pcs: mask(w.__pcs.map((p) => ({ ops: p.__ops, state: p.connectionState, cands: p.__cands.length, senders: p.__senders.map((s) => ({ kind: s.track ? s.track.kind : null, replaced: s.__replaced || 0, tagged: !!s.__tbVideoSender })) }))),
    keys: mask(R.keys || []), n10: R.n10 || [], flip: R.flip || [], ring: R.ring || null, ring2: R.ring2 || null,
    dom: ((w.document.getElementById('transcript') || {}).innerHTML || '').replace(CHECK_BTN, ''),   /* X-2's declared addition is masked here and proved in M3.X */
    room: { cls: w.document.getElementById('scr-room').className, timer: w.document.getElementById('rz-timer').textContent, band: w.document.getElementById('call-band').className, mic: w.document.getElementById('rb-mic').className, cam: w.document.getElementById('rb-cam').className, ring: w.document.getElementById('ring-overlay').className, children: [...w.document.getElementById('scr-room').children].map((c) => c.id || c.className).sort() },
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
const snapA = { X: snapshot(RA.X, RA.link.sent.a, RA), Y: snapshot(RA.Y, RA.link.sent.b, RA) };
clock.t = t0;
const RC = await rig(cand, 'C-');
await drive(RC);
const snapC = { X: snapshot(RC.X, RC.link.sent.a, RC), Y: snapshot(RC.Y, RC.link.sent.b, RC) };
const KEYS = ['log', 'housekeeping', 'wire', 'sockets', 'listen', 'rooms', 'transcript', 'bgTranscript', 'call', 'pcs', 'keys', 'n10', 'flip', 'ring', 'ring2', 'dom', 'room', 'errors'];

T('M3.0 the script exercised the call: every headline marker of every absorbed layer fired on the base build', () => {
  const evs = new Set([...snapA.X.log, ...snapA.Y.log].map((l) => l.ev));
  if (process.env.TB_DUMP) console.log('    ids: ' + [...RA.X.w.document.querySelectorAll('#transcript [data-id]')].map((n) => n.getAttribute('data-id') + ':' + n.className).join(' '));
  if (process.env.TB_DUMP) console.log('    X events: ' + [...new Set(snapA.X.log.map((l) => l.ev))].join(',') + '\n    Y events: ' + [...new Set(snapA.Y.log.map((l) => l.ev))].join(',') + '\n    X wire: ' + snapA.X.wire.map((m) => m.type).join(',') + '\n    Y wire: ' + snapA.Y.wire.map((m) => m.type).join(',') + '\n    errors: ' + JSON.stringify(snapA.X.errors.concat(snapA.Y.errors)) + '\n    pcs: ' + JSON.stringify(snapA.X.pcs) + JSON.stringify(snapA.Y.pcs) + '\n    n10: ' + JSON.stringify(snapA.X.n10) + '\n    keys: ' + JSON.stringify(snapA.X.keys) + '\n    ring: ' + JSON.stringify(snapA.Y.ring) + JSON.stringify(snapA.Y.ring2));
  const need = ['call_start', 'call_ring', 'call_accept', 'call_end', 'n10_caller_screen', 'n10_answered', 'n10_accept_anchor', 'n10_caller_cancelled', 'n18_anchor', 'r8_call_timer', 'rtc_answered', 'rtc_got_answer', 'net_mic_toggled', 'net_cam_toggled', 'rm_transcription_stopped_for_mute', 'rm_transcription_resuming_after_mute', 'c3_restart_requested', 'c3_restart_served', 'c3_restart_answered', 'c3_restart_ignored', 'rtc_glare_ignored', 'c2_stalled', 'c2_resumed', 'rtc_video_stalled', 'rtc_recovery', 'f1_sender_kept', 'cr3_grant_keys_used', 'cr3_ring_deferred_hidden', 'c1_queued', 'v2_retry', 'pr3_dot', 'bg_chat_rx', 'rm_rename_received'];
  const missing = need.filter((e) => !evs.has(e));
  assert(missing.length === 0, 'never fired on the base build: ' + missing.join(',') + '\n      saw: ' + [...evs].join(','));
  assert(snapA.X.pcs.length >= 1 && snapA.Y.pcs.length >= 1 && snapA.X.n10.length === 5 && snapA.X.n10[0].show === true && snapA.X.n10[1].show === false && snapA.X.n10[3].show === true && snapA.X.n10[4].show === false, 'the caller screen did not show/hide as scripted: ' + JSON.stringify(snapA.X.n10));
  assert(snapA.X.keys.length === 5 && snapA.X.keys[2].dg === 'dg-grant' && snapA.X.keys[1].dg === 'dg-mem' && snapA.X.keys[4].dg === '', 'keys did not merge: ' + JSON.stringify(snapA.X.keys));
  assert(snapA.X.flip[0] === 1 && snapA.X.flip[2] === true, 'the tagged sender was not kept: ' + JSON.stringify(snapA.X.flip));
  assert(snapA.Y.ring && snapA.Y.ring.pending === 'voice' && snapA.Y.ring2 && snapA.Y.ring2.active === false && snapA.Y.ring2.pending === false, 'ring states: ' + JSON.stringify([snapA.Y.ring, snapA.Y.ring2]));
});
for (const who of ['X', 'Y']) for (const key of KEYS) {
  if (key === 'room' && who === 'X') continue;
  T('M3 ' + who + '.' + key + ' identical on both builds', () => { const out = []; diff(snapA[who][key], snapC[who][key], who + '.' + key, out); assert(out.length === 0, '\n      ' + out.join('\n      ')); });
}
T('M3 X.dom/Y.dom: the only addition to the rendered room is X-3\'s check button, one per bubble header, after Clarify; the base build has none', () => {
  for (const [inst, who] of [[RC.X, 'X'], [RC.Y, 'Y']]) {
    const t = inst.w.document.getElementById('transcript'); const bubbles = t.querySelectorAll('.msg .head-acts').length, btns = t.querySelectorAll('.head-acts [data-hact=check]').length;
    assert(bubbles > 0 && btns === bubbles, who + ': ' + btns + ' check buttons for ' + bubbles + ' headers');
    t.querySelectorAll('.head-acts [data-hact=check]').forEach((b) => assert(b.previousElementSibling && b.previousElementSibling.getAttribute('data-hact') === 'clar' && !b.nextElementSibling, who + ': the button is not last, after Clarify'));
  }
  assert(RA.X.w.document.querySelectorAll('[data-hact=check]').length === 0, 'the base build grew a check button');
});
T('M3 X.room identical on both builds except the one recorded difference: the caller screen is appended to #scr-room from FL-2\'s position (same parent, same children, same z-index)', () => {
  const a = snapA.X.room, c = snapC.X.room; const out = []; diff(a, c, 'X.room', out); assert(out.length === 0, '\n      ' + out.join('\n      '));
  const idsA = [...RA.X.w.document.getElementById('scr-room').children].map((x) => x.id || x.className), idsC = [...RC.X.w.document.getElementById('scr-room').children].map((x) => x.id || x.className);
  assert(idsA.filter((i) => i !== 'n10-out').join('|') === idsC.filter((i) => i !== 'n10-out').join('|'), 'the room\'s children differ beyond the caller screen\'s position');
  assert(snapA.X.n10[0].parent === 'scr-room' && snapC.X.n10[0].parent === 'scr-room', 'the caller screen is not inside #scr-room on both');
  assert(/#n10-out\{[^}]*z-index:80/.test(fl2), 'the caller screen z-index moved');
});

/* ── M4 · X-3 THE TRANSLATION CHECK: SAID / NORMALIZED / TRANSLATED (candidate only) ── */
console.log('M4 · X-3: the heard text is kept; the card scores Said and Normalized against the delivered text');
const W = RC.X.w, D = W.document;
const google = (text) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([[[text, 'src', null, null]], null, 'th']) });
const mymem = (text) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ responseStatus: 200, responseData: { translatedText: text } }) });
const click = (el) => el.dispatchEvent(new W.MouseEvent('click', { bubbles: true, cancelable: true }));
const msg = (id) => D.querySelector('.msg[data-id="' + id + '"]');
const card = () => D.querySelector('#scr-room > .cl-bt');
const rowsOf = (c) => [...c.querySelectorAll('table.cl-bt-grid tbody tr')].map((tr) => [tr.children[0].firstChild.textContent, tr.querySelector('.cl-bt-lang').textContent, tr.children[1].textContent]);
const compsOf = (c) => [...c.querySelectorAll('.cl-bt-sec > div')].map((d) => [d.children[0].textContent, d.children[1].className, d.children[1].textContent]);
const ctLines = readFileSync('chat-test.html', 'utf8').split('\n');
/* a small dictionary so every direction answers something plausible and distinct */
const DICT = { 'th>en': { 'สวัสดีครับ': 'hello sir', 'สวัสดี': 'hello sir', 'ขอบคุณมาก': 'thank you very much', 'ขอบคุณ': 'thanks a lot', 'ขอบคุณค่ะ': 'thank you so much', 'still there?': 'still there?' }, 'en>th': { 'hello sir': 'สวัสดี', 'thank you very much': 'ขอบคุณ', 'thank you so much': 'ขอบคุณค่ะ', 'good morning': 'อรุณสวัสดิ์', 'still there?': 'ยังอยู่ไหม' } };
const dictPlan = (u) => { if (!/translate\.googleapis\.com/.test(u)) return null; const m = /sl=([a-zA-Z-]+)&tl=([a-zA-Z-]+)&dt=t&q=(.*)$/.exec(u); const q = decodeURIComponent(m[3]); const t = (DICT[m[1] + '>' + m[2]] || {})[q]; return google(t || ('[' + m[1] + '>' + m[2] + '] ' + q)); };
W.debugLog.length = 0; W.__fetches.length = 0;
T('M4.0 the card\'s CSS is chat-test.html\'s, byte for byte: every .cl-bt rule of chat-test appears verbatim in the candidate, and the candidate has no other .cl-bt rule; btScore / btVerdict and the head are chat-test\'s', () => {
  const rules = ctLines.filter((l) => /^\.cl-bt/.test(l) && !/^\.cl-jump|^\.cl-tabs/.test(l));
  assert(rules.length === 9, 'chat-test.html moved: ' + rules.length + ' .cl-bt rule lines');
  for (const r of rules) assert(cand.indexOf(r) !== -1, 'a chat-test rule is missing or altered: ' + r.slice(0, 60));
  const mine = code(x1).split('\n').filter((l) => /^\s*'\.cl-bt/.test(l)).map((l) => l.trim().replace(/^'|',$/g, '').replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
  assert(mine.length === rules.length && mine.every((m, i) => m === rules[i]), 'the part carries a rule chat-test does not, or in another order');
  assert(!/btScore\s*=\s*function|btVerdict\s*=\s*function/.test(code(x1)) && code(x1).includes("var clean=function(t){return String(t||'').toLowerCase().replace(/[\\s\\p{P}\\p{S}]+/gu,'')};") && code(x1).includes("function btVerdict(score){return score>=0.8?'match':score>=0.5?'partial':'miss'}"), 'btScore/btVerdict are not chat-test\'s');
  const ct = readFileSync('chat-test.html', 'utf8');
  for (const line of ["var head=document.createElement('div');head.className='cl-bt-head';var ttl=document.createElement('b');ttl.textContent='Translation check';", "var copy=document.createElement('button');copy.type='button';copy.textContent='Copy';var x=document.createElement('button');x.type='button';x.textContent='✕';x.setAttribute('aria-label','Close');"]) assert(ct.includes(line) && code(x1).includes(line), 'card line differs from chat-test: ' + line.slice(0, 50));
});
await TA('M4.1 a tap on the header shows the action row with a fourth button after Clarify (circle, counter-clockwise arrow); one tap opens the card in #scr-room: title, Copy, ✕, rows Said / Translated / Back-translation / Route, one result line when nothing was rewritten', async () => {
  W.__fetchPlan = (u) => /translate\.googleapis\.com/.test(u) ? google('are you still there') : null;
  const node = msg('cm-y2'); assert(node, 'no bubble cm-y2');
  node.classList.remove('active'); click(node.querySelector('.meta')); assert(node.classList.contains('active'), 'header tap no longer shows the action row');
  const acts = [...node.querySelectorAll('.head-acts [data-hact]')].map((b) => b.getAttribute('data-hact'));
  assert(acts.join(',') === 'save,del,clar,check', 'action row: ' + acts.join(','));
  const btn = node.querySelector('[data-hact=check]');
  assert(btn.classList.contains('tr-act-btn') && btn.title === 'Translation check' && /polyline points="1 4 1 10 7 10"/.test(btn.innerHTML) && /M3\.51 15a9 9 0 1 0 \.49-4\.2/.test(btn.innerHTML) && /width="14" height="14"/.test(btn.innerHTML), 'the button is not the 14 px circle-with-counter-clockwise-arrow in the header style');
  click(btn);
  const c = card(); assert(c && c.getAttribute('role') === 'dialog' && c.getAttribute('aria-label') === 'Translation check', 'card did not open in #scr-room');
  const head = c.querySelector('.cl-bt-card > .cl-bt-head'); assert(head && head.children.length === 3 && head.children[0].tagName === 'B' && head.children[0].textContent === 'Translation check' && head.children[1].textContent === 'Copy' && head.children[2].textContent === '✕' && head.children[2].getAttribute('aria-label') === 'Close', 'head differs');
  assert(JSON.stringify(rowsOf(c)) === JSON.stringify([['Said', 'Thai', 'still there?'], ['Translated', 'English', 'still there?'], ['Back-translation', '…', '…'], ['Route', 'Keyboard', 'Typed on the keyboard']]), 'rows: ' + JSON.stringify(rowsOf(c)));
  const order = [...c.querySelector('.cl-bt-card').children].map((x) => x.className); assert(order.join('|') === 'cl-bt-head|cl-bt-grid|cl-bt-sec', 'card children order: ' + order.join('|'));
  assert(JSON.stringify(compsOf(c)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict wait', 'Checking…']]), 'results before the answer: ' + JSON.stringify(compsOf(c)));
  await sleep(30);
  const rows2 = rowsOf(c); assert(rows2[2][1] === 'Thai' && rows2[2][2] === 'are you still there', 'back-translation row: ' + JSON.stringify(rows2[2]));
  const score = W.btScore('still there?', 'are you still there'); assert(score >= 0.5 && score < 0.8, 'fixture score drifted: ' + score);
  assert(JSON.stringify(compsOf(c)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict partial', 'Partial · ' + Math.round(score * 100) + '%']]), 'result: ' + JSON.stringify(compsOf(c)));
  const bt = W.debugLog.filter((l) => l.ev === 'bt_check'); assert(bt.length === 1 && bt[0].lvl === 'ok' && JSON.stringify(bt[0].d) === JSON.stringify({ outcome: 'ok', rewritten: false, saidLang: 'th', src: 'th', tgt: 'en', chars: 12, said: +score.toFixed(2), saidVerdict: 'partial', verdict: 'partial', score: +score.toFixed(2) }), 'bt_check: ' + JSON.stringify(bt));
  assert(W.__fetches.length === 1 && /sl=en&tl=th&dt=t&q=still%20there%3F$/.test(W.__fetches[0]), 'the back-translation did not go en→th through the translator once: ' + JSON.stringify(W.__fetches));
});
await TA('M4.2 Copy writes the rows ("Label (lang): text") then one line per comparison ("Said vs Translated: verdict (NN%)") and says Copied; ✕ closes; a tap on the scrim closes; a second open replaces the first', async () => {
  const c = card(); click(c.querySelector('.cl-bt-head button')); await sleep(5);
  const score = W.btScore('still there?', 'are you still there');
  assert(W.__clip.length === 1 && W.__clip[0] === 'Said (Thai): still there?\nTranslated (English): still there?\nBack-translation (Thai): are you still there\nRoute (Keyboard): Typed on the keyboard\nSaid vs Translated: partial (' + Math.round(score * 100) + '%)', 'clipboard: ' + JSON.stringify(W.__clip));
  assert(c.querySelector('.cl-bt-head button').textContent === 'Copied', 'Copy did not say Copied');
  click(c.querySelectorAll('.cl-bt-head button')[1]); assert(!card(), '✕ did not close');
  click(msg('cm-y2').querySelector('[data-hact=check]')); assert(card(), 'did not reopen'); click(msg('cm-y1').querySelector('.meta')); click(msg('cm-y1').querySelector('[data-hact=check]'));
  assert(D.querySelectorAll('#scr-room > .cl-bt').length === 1 && card().querySelector('tbody tr td').textContent === 'hi', 'a second open did not replace the first');
  card().dispatchEvent(new W.MouseEvent('click', { bubbles: true })); assert(!card(), 'scrim tap did not close');
});
await TA('M4.3 the base header buttons still work (save, clarify, delete wired by the base); the header\'s single tap still toggles the row; no double-tap listener remains; a re-wire adds no second button', async () => {
  const node = msg('cm-y2'), m1 = node.querySelector('.meta');
  node.classList.add('active'); click(m1); assert(!node.classList.contains('active'), 'second tap did not hide the row');
  click(node.querySelector('[data-hact=clar]')); assert(D.getElementById('m-clarify').classList.contains('show') && !card(), 'Clarify broke or opened the check'); D.getElementById('m-clarify').classList.remove('show');
  assert(!/pointerup|X1_MS|x1Open/.test(code(x1)), 'the double-tap gesture survives');
  W.wireMsg(node, W.transcript.filter((t) => t.id === 'cm-y2')[0]);
  assert(node.querySelectorAll('[data-hact=check]').length === 1, 'the button was added twice');
});
await TA('M4.4 scoring is chat-test\'s: identical wording is 1, whitespace and punctuation ignored, thresholds 0.8 / 0.5, empty is 0', async () => {
  const s = W.btScore, v = W.btVerdict;
  assert(s('hello there', 'hello there') === 1 && s('Hello, there!', 'hellothere') === 1, 'identical / punctuation');
  assert(s('good morning everyone', 'the cat sat down') < 0.3 && v(s('good morning everyone', 'the cat sat down')) === 'miss', 'different');
  const p = s('I will meet you at the station tomorrow', 'I meet you at the station tomorrow morning'); assert(p >= 0.5 && p < 0.95, 'near: ' + p);
  assert(v(0.8) === 'match' && v(0.79) === 'partial' && v(0.5) === 'partial' && v(0.49) === 'miss', 'thresholds');
  assert(s('', '') === 0 && s('a', '') === 0, 'empty cases');
});
await TA('M4.5 a failed back-translation says "(back-translation failed)" and "Check failed", logging bt_check outcome:error; same language compares Said with Translated directly ("same as target", no request); no translation says so', async () => {
  W.__fetchPlan = () => Promise.reject(new Error('offline')); W.debugLog.length = 0; W.__fetches.length = 0;
  W.backCheck({ id: 'zz-1', kind: 'chat', who: 'me', origin: 'spoken', sourceText: 'rain later', translatedText: 'ฝนตก', srcLang: 'en', tgtLang: 'th' }); await sleep(900);
  let c = card(); const rows = rowsOf(c);
  assert(rows[2][1] === 'English' && rows[2][2] === '(back-translation failed)' && rows[3][1] === 'Voice' && rows[3][2] === 'Spoken into the microphone during a call', 'rows: ' + JSON.stringify(rows));
  assert(JSON.stringify(compsOf(c)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict miss', 'Check failed']]), 'results after failure: ' + JSON.stringify(compsOf(c)));
  const bt = W.debugLog.filter((l) => l.ev === 'bt_check'); assert(bt.length === 1 && bt[0].lvl === 'error' && bt[0].d.outcome === 'error' && bt[0].d.said === null && bt[0].d.saidLang === 'en' && bt[0].d.tgt === 'th', 'bt_check: ' + JSON.stringify(bt));
  assert(W.__fetches.filter((u) => /googleapis/.test(u)).length === 1 && W.__fetches.filter((u) => /mymemory/.test(u)).length === 2, 'provider order on failure: ' + JSON.stringify(W.__fetches));
  c.remove(); W.__fetches.length = 0; W.debugLog.length = 0;
  W.backCheck({ id: 'zz-2', kind: 'chat', who: 'me', origin: 'phrase', sourceText: 'same words', translatedText: 'same words', srcLang: 'en', tgtLang: 'en' }); await sleep(10);
  c = card(); assert(W.__fetches.length === 0 && rowsOf(c)[2][1] === 'English · same as target' && rowsOf(c)[2][2] === 'same words' && JSON.stringify(compsOf(c)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict match', 'Match · 100%']]) && rowsOf(c)[3][1] === 'Phrasebook', 'same-language card: ' + JSON.stringify(rowsOf(c)) + JSON.stringify(compsOf(c)));
  c.remove();
  W.backCheck({ id: 'zz-3', kind: 'chat', who: 'me', sourceText: 'untranslated', translatedText: '', srcLang: 'en', tgtLang: 'th' }); await sleep(10);
  c = card(); assert(compsOf(c)[0][2] === 'No translation' && rowsOf(c)[2][2] === '—' && rowsOf(c)[1][2] === '(no translation yet)' && W.__fetches.length === 0 && W.debugLog.some((l) => l.ev === 'bt_check' && l.d.verdict === 'no translation'), 'no-translation card');
  c.remove();
});
await TA('M4.6 the heard text is kept: in-call speech in the partner\'s language and a typed line in it both get said / saidLang beside the rewrite, saved with the transcript and logged said_kept once; a line in the room\'s own language gets nothing; a partner\'s message never takes the record', async () => {
  W.__fetchPlan = dictPlan; W.debugLog.length = 0; W.__fetches.length = 0;
  const before = W.transcript.length;
  W.activeRoom().sendLocked = false;                                              /* the relay script had the partner leave; unlock so a chat line can be sent */
  W._ftFailed = true;                                                             /* the Latin-script language model loads via a <script> jsdom never fires; declare it unavailable, as a phone without it would */
  W.CALL.active = true; W.CALL.kind = 'voice';
  await W.onDGFinal('สวัสดีครับ'); await sleep(60);
  W.CALL.active = false;
  const sp = W.transcript.filter((t) => t.kind === 'speech' && t.who === 'me').slice(-1)[0];
  assert(sp && sp.sourceText === 'hello sir' && sp.translatedText === 'สวัสดี' && sp.srcLang === 'en' && sp.tgtLang === 'th', 'speech entry: ' + JSON.stringify(sp));
  assert(sp.said === 'สวัสดีครับ' && sp.saidLang === 'th', 'speech said not kept: ' + JSON.stringify(sp));
  await W.sendChatText('ขอบคุณมาก', null, 'typed'); await sleep(40);
  const ch = W.transcript.filter((t) => t.kind === 'chat' && t.who === 'me').slice(-1)[0];
  assert(ch && ch.sourceText === 'thank you very much' && ch.translatedText === 'ขอบคุณ' && ch.said === 'ขอบคุณมาก' && ch.saidLang === 'th', 'chat entry: ' + JSON.stringify(ch));
  const saved = W.loadTr('gate-room'); assert(saved.some((t) => t.id === sp.id && t.said === 'สวัสดีครับ') && saved.some((t) => t.id === ch.id && t.said === 'ขอบคุณมาก'), 'said not saved with the transcript');
  const kept = W.debugLog.filter((l) => l.ev === 'said_kept'); assert(kept.length === 2 && kept[0].d.id === sp.id && kept[0].d.lang === 'th' && kept[0].d.who === 'me' && kept[1].d.id === ch.id, 'said_kept: ' + JSON.stringify(kept));
  /* the chat microphone: speech outside a call funnels through sendChatText with origin 'voice'; said travels on the wire to the partner */
  const Yw = RC.Y.w; Yw.activeRoom().sendLocked = false; RC.link.rewire();
  const ySent = RC.link.sent.a.length;
  W.CHATMIC.on = true; W.CALL.active = false;
  await W.onDGFinal('ขอบคุณค่ะ', undefined, 'th'); await sleep(80);                     /* a phrase not spoken before: the base de-duplicates recent finals */
  W.CHATMIC.on = false;
  const mic = W.transcript.filter((t) => t.kind === 'chat' && t.who === 'me').slice(-1)[0];
  assert(mic && mic.origin === 'voice' && mic.sourceText === 'thank you so much' && mic.translatedText === 'ขอบคุณค่ะ' && mic.said === 'ขอบคุณค่ะ' && mic.saidLang === 'th', 'chat-mic entry: ' + JSON.stringify(mic));
  const onWire = RC.link.sent.a.slice(ySent).map((x) => JSON.parse(x)).filter((m) => m.type === 'chat-msg' && m.chatId === mic.id)[0];
  assert(onWire && onWire.said === 'ขอบคุณค่ะ' && onWire.saidLang === 'th' && onWire.origin === 'voice', 'the wire does not carry said: ' + JSON.stringify(onWire));
  const got = Yw.transcript.filter((t) => t.id === mic.id)[0];
  assert(got && got.who === 'partner' && got.sourceText === 'thank you so much' && got.said === 'ขอบคุณค่ะ' && got.saidLang === 'th' && got.origin === 'voice', 'the receiver did not keep said: ' + JSON.stringify(got));
  assert(Yw.loadTr('gate-room').some((t) => t.id === mic.id && t.said === 'ขอบคุณค่ะ'), 'receiver said not saved');
  assert(Yw.debugLog.some((l) => l.ev === 'said_kept' && l.d.id === mic.id && l.d.who === 'partner'), 'receiver did not log said_kept');
  W.__x3mic = mic;
  /* a rewrite whose message never arrives must not leak onto the partner's next line, nor onto an own line that is not the rewrite */
  await W.normalizeOutgoing(W.activeRoom(), 'ขอบคุณ'); assert(W.x3Pending() && W.x3Pending().said === 'ขอบคุณ' && W.x3Pending().normalized === 'thanks a lot', 'pending not held');
  W.handleRelay({ type: 'chat-msg', chatId: 'cm-y-x3', srcText: 'thanks a lot', tgtText: 'thanks a lot', srcLang: 'th', tgtLang: 'en', senderName: 'Bo', origin: 'typed', eventId: 'ev-x3' }); await sleep(30);
  const theirs = W.transcript.filter((t) => t.id === 'cm-y-x3')[0]; assert(theirs && !('said' in theirs) && W.x3Pending() && W.x3Pending().said === 'ขอบคุณ', 'the partner\'s message took the record');
  await W.sendChatText('good morning', null, 'typed'); await sleep(40);
  const plain = W.transcript.filter((t) => t.kind === 'chat' && t.who === 'me').slice(-1)[0];
  assert(plain && plain.sourceText === 'good morning' && !('said' in plain), 'a line in the room\'s own language took a said record that was not its own: ' + JSON.stringify(plain));
  assert(W.x3Pending() && W.x3Pending().said === 'ขอบคุณ', 'the held record was spent on a line that was not the rewrite');
  /* the record is on disk the moment the message is born, not at some later save */
  const born = { id: 'cm-x3-born', kind: 'chat', who: 'me', sourceText: 'thanks a lot', translatedText: 'ขอบคุณ', srcLang: 'en', tgtLang: 'th', ts: W.Date.now(), senderName: 'Ann', origin: 'typed', receipt: 'sent' };
  W.transcript.push(born); W.saveTr(); W.appendMsgDom(born, true);
  assert(born.said === 'ขอบคุณ' && born.saidLang === 'th' && W.x3Pending() === null, 'the rewrite\'s own message did not take the record: ' + JSON.stringify(born));
  assert(W.loadTr('gate-room').some((t) => t.id === 'cm-x3-born' && t.said === 'ขอบคุณ'), 'said is not on disk right after the message was born');
  const gotPlain = Yw.transcript.filter((t) => t.sourceText === 'good morning' && t.who === 'partner')[0];
  assert(gotPlain && !('said' in gotPlain) && Yw.x3PendingIn() === null, 'a message without said on the wire took one on the receiver: ' + JSON.stringify(gotPlain));
  W.transcript.length = before; W.saveTr(); W.renderTranscript(); W.__x3sp = sp; W.__x3ch = ch;
  /* put the two own entries back for the card tests */
  W.transcript.push(sp, ch); W.saveTr(); W.renderTranscript(); await sleep(60);
});
await TA('M4.7 the card on a rewritten message: Said (heard language) / Normalized / Translated / Back-translation / Route; Said vs Translated compared directly when Said is already in the target language; Normalized vs Translated via the back-translation; both logged', async () => {
  W.__fetchPlan = dictPlan; W.debugLog.length = 0; W.__fetches.length = 0;
  const sp = W.__x3sp; const node = msg(sp.id); assert(node, 'no bubble for the speech entry');
  click(node.querySelector('.meta')); click(node.querySelector('[data-hact=check]'));
  const c = card(); assert(c, 'card did not open');
  assert(JSON.stringify(rowsOf(c)) === JSON.stringify([['Said', 'Thai', 'สวัสดีครับ'], ['Normalized', 'English', 'hello sir'], ['Translated', 'Thai', 'สวัสดี'], ['Back-translation', '…', '…'], ['Route', 'Voice', 'Spoken into the microphone during a call']]), 'rows: ' + JSON.stringify(rowsOf(c)));
  assert(JSON.stringify(compsOf(c)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict wait', 'Checking…'], ['Normalized vs Translated', 'cl-bt-verdict wait', 'Checking…']]), 'results before the answer: ' + JSON.stringify(compsOf(c)));
  await sleep(40);
  const s1 = W.btScore('สวัสดีครับ', 'สวัสดี'), s2 = W.btScore('hello sir', 'hello sir');
  assert(s1 >= 0.5 && s1 < 0.8 && s2 === 1, 'fixture scores drifted: ' + s1 + ' ' + s2);
  assert(rowsOf(c)[3][1] === 'English' && rowsOf(c)[3][2] === 'hello sir', 'back-translation row: ' + JSON.stringify(rowsOf(c)[3]));
  assert(JSON.stringify(compsOf(c)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict partial', 'Partial · ' + Math.round(s1 * 100) + '%'], ['Normalized vs Translated', 'cl-bt-verdict match', 'Match · 100%']]), 'results: ' + JSON.stringify(compsOf(c)));
  assert(W.__fetches.length === 1 && /sl=th&tl=en&dt=t&q=%E0%B8%AA%E0%B8%A7%E0%B8%B1%E0%B8%AA%E0%B8%94%E0%B8%B5$/.test(W.__fetches[0]), 'exactly one back-translation (th→en of the delivered text); Said vs Translated needed none: ' + JSON.stringify(W.__fetches));
  const bt = W.debugLog.filter((l) => l.ev === 'bt_check'); assert(bt.length === 1 && bt[0].lvl === 'ok' && JSON.stringify(bt[0].d) === JSON.stringify({ outcome: 'ok', rewritten: true, saidLang: 'th', src: 'en', tgt: 'th', chars: 10, said: +s1.toFixed(2), saidVerdict: 'partial', normalized: 1, normalizedVerdict: 'match', verdict: 'partial', score: +s1.toFixed(2) }), 'bt_check: ' + JSON.stringify(bt));
  click(c.querySelector('.cl-bt-head button')); await sleep(5);
  assert(W.__clip.slice(-1)[0] === 'Said (Thai): สวัสดีครับ\nNormalized (English): hello sir\nTranslated (Thai): สวัสดี\nBack-translation (English): hello sir\nRoute (Voice): Spoken into the microphone during a call\nSaid vs Translated: partial (' + Math.round(s1 * 100) + '%)\nNormalized vs Translated: match (100%)', 'clipboard: ' + JSON.stringify(W.__clip.slice(-1)[0]));
  c.remove();
  /* the receiver's card on the chat-mic message: the same rows, from the partner's side */
  {
    const Yw = RC.Y.w, YD = Yw.document; Yw.__fetchPlan = dictPlan; Yw.__fetches.length = 0; Yw.debugLog.length = 0; Yw.trCache.clear();
    const node = YD.querySelector('.msg[data-id="' + W.__x3mic.id + '"]'); assert(node, 'no bubble on the receiver');
    node.querySelector('.meta').dispatchEvent(new Yw.MouseEvent('click', { bubbles: true })); node.querySelector('[data-hact=check]').dispatchEvent(new Yw.MouseEvent('click', { bubbles: true }));
    const yc = YD.querySelector('#scr-room > .cl-bt'); assert(yc, 'receiver card did not open'); await sleep(40);
    const yrows = [...yc.querySelectorAll('table.cl-bt-grid tbody tr')].map((tr) => [tr.children[0].firstChild.textContent, tr.querySelector('.cl-bt-lang').textContent, tr.children[1].textContent]);
    assert(JSON.stringify(yrows) === JSON.stringify([['Said', 'Thai', 'ขอบคุณค่ะ'], ['Normalized', 'English', 'thank you so much'], ['Translated', 'Thai', 'ขอบคุณค่ะ'], ['Back-translation', 'English', 'thank you so much'], ['Route', 'Voice', 'Spoken into the chat microphone']]), 'receiver rows: ' + JSON.stringify(yrows));
    const ycomps = [...yc.querySelectorAll('.cl-bt-sec > div')].map((d) => [d.children[0].textContent, d.children[1].textContent]);
    assert(ycomps.length === 2 && ycomps[0][1] === 'Match · 100%' && ycomps[1][1] === 'Match · 100%', 'receiver results: ' + JSON.stringify(ycomps));
    yc.remove();
  }
  /* said in a third language: both comparisons go through a back-translation, one per language */
  W.__fetches.length = 0; W.debugLog.length = 0; W.trCache.clear();
  W.__fetchPlan = (u) => { const m = /sl=([a-z]+)&tl=([a-z]+)&dt=t&q=(.*)$/.exec(u); return m ? google(m[2] === 'ko' ? '안녕하세요' : m[2] === 'en' ? 'hello sir' : 'x') : null; };
  W.backCheck({ id: 'zz-4', kind: 'chat', who: 'me', origin: 'typed', sourceText: 'hello sir', translatedText: 'สวัสดี', srcLang: 'en', tgtLang: 'th', said: '안녕하세요', saidLang: 'ko' }); await sleep(40);
  const c2 = card(); assert(rowsOf(c2)[0][1] === 'Korean' && JSON.stringify(compsOf(c2)) === JSON.stringify([['Said vs Translated', 'cl-bt-verdict match', 'Match · 100%'], ['Normalized vs Translated', 'cl-bt-verdict match', 'Match · 100%']]) && W.__fetches.length === 2 && W.__fetches.some((u) => /sl=th&tl=en/.test(u)) && W.__fetches.some((u) => /sl=th&tl=ko/.test(u)), 'third-language card: ' + JSON.stringify(compsOf(c2)) + ' ' + JSON.stringify(W.__fetches));
  c2.remove();
});

/* ── M5 · G-1 GOOGLE FIRST, MYMEMORY FALLBACK (candidate only) ───────────── */
console.log('M5 · G-1: Google first, MyMemory as the fallback, same cache, same shape');
await TA('M5.1 a translation goes to Google first and returns its text; the cache now holds it; the second ask makes no request; the log names the provider', async () => {
  W.trCache.clear(); W.debugLog.length = 0; W.__fetches.length = 0;
  W.__fetchPlan = (u) => /googleapis/.test(u) ? google('สวัสดีตอนเช้า') : mymem('WRONG');
  const r = await W.translateWithRetry('good morning', 'en', 'th', 2);
  assert(r.ok === true && r.text === 'สวัสดีตอนเช้า', 'result: ' + JSON.stringify(r));
  assert(W.__fetches.length === 1 && /^https:\/\/translate\.googleapis\.com\/translate_a\/single\?client=gtx&sl=en&tl=th&dt=t&q=good%20morning$/.test(W.__fetches[0]), 'request: ' + JSON.stringify(W.__fetches));
  assert(W.trCache.get('en|th|good morning') === 'สวัสดีตอนเช้า', 'cache not filled');
  const r2 = await W.translateWithRetry('good morning', 'en', 'th', 2); assert(r2.text === 'สวัสดีตอนเช้า' && W.__fetches.length === 1, 'cache hit still fetched');
  const ok = W.debugLog.filter((l) => l.ev === 'trans_ok'); assert(ok.length === 1 && ok[0].d.provider === 'google' && ok[0].d.from === 'en' && ok[0].d.to === 'th' && ok[0].d.inChars === 12, 'trans_ok: ' + JSON.stringify(ok));
});
await TA('M5.2 when Google fails (network, HTTP error, empty body), MyMemory answers; trans_fallback then trans_ok mymemory; the frozen path is called through once', async () => {
  for (const [name, plan] of [['network', () => Promise.reject(new Error('net'))], ['http', () => Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve([[['Too Many Requests', 'hello', null, null]], null, 'en']) })], ['empty', () => google('')]]) {
    W.trCache.clear(); W.debugLog.length = 0; W.__fetches.length = 0;
    W.__fetchPlan = (u) => /googleapis/.test(u) ? plan() : mymem('<b>Bonjour</b>');
    const r = await W.translateWithRetry('hello', 'en', 'fr', 1);
    assert(r.ok === true && r.text === 'Bonjour', name + ': result ' + JSON.stringify(r));
    assert(W.__fetches.filter((u) => /googleapis/.test(u)).length === 1 && W.__fetches.filter((u) => /mymemory.*langpair=en%7Cfr|mymemory.*langpair=en\|fr/.test(u)).length === 1, name + ': requests ' + JSON.stringify(W.__fetches));
    const evs = W.debugLog.map((l) => l.ev + ':' + (l.d.provider || '')); assert(evs.join(',') === 'trans_fallback:google,trans_ok:mymemory', name + ': log ' + evs.join(','));
    assert(W.trCache.get('en|fr|hello') === 'Bonjour', name + ': cache');
  }
});
await TA('M5.3 when both fail the result is the frozen one (ok:false, text unchanged) after the frozen retries; same-language and empty text never touch the network; zh and fil map to Google\'s codes', async () => {
  W.trCache.clear(); W.debugLog.length = 0; W.__fetches.length = 0;
  W.__fetchPlan = () => Promise.reject(new Error('down'));
  const r = await W.translateWithRetry('nothing works', 'en', 'de', 1);
  assert(r.ok === false && r.text === 'nothing works', 'both-fail result: ' + JSON.stringify(r));
  assert(W.__fetches.filter((u) => /googleapis/.test(u)).length === 1 && W.__fetches.filter((u) => /mymemory/.test(u)).length === 2, 'retries: ' + JSON.stringify(W.__fetches));
  assert(W.debugLog.some((l) => l.ev === 'trans_fail') && W.debugLog.some((l) => l.ev === 'trans_retry'), 'frozen markers missing');
  W.__fetches.length = 0;
  const same = await W.translateWithRetry('x', 'en', 'en', 1); const empty = await W.translateWithRetry('', 'en', 'th', 1);
  assert(same.text === 'x' && same.ok && empty.text === '' && empty.ok && W.__fetches.length === 0, 'same-language or empty hit the network');
  W.__fetchPlan = (u) => /googleapis/.test(u) ? google('x') : null; W.__fetches.length = 0;
  await W.translateWithRetry('hi', 'zh', 'fil', 0); assert(/sl=zh-CN&tl=tl&/.test(W.__fetches[0]), 'code mapping: ' + W.__fetches[0]);
});
await TA('M5.4 the cache keeps its ceiling under Google (TR_CACHE_MAX)', async () => {
  W.trCache.clear(); W.__fetchPlan = (u) => /googleapis/.test(u) ? google('t') : null;
  for (let i = 0; i < W.TR_CACHE_MAX + 5; i++) await W.translateWithRetry('w' + i, 'en', 'th', 0);
  assert(W.trCache.size === W.TR_CACHE_MAX, 'cache size ' + W.trCache.size);
});

RA.X.dom.window.close(); RA.Y.dom.window.close(); RC.X.dom.window.close(); RC.Y.dom.window.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
