#!/usr/bin/env node
/* 27·post-ship harness (§7.14).

   Two instances of the real artifact boot in jsdom — one creator, one joiner —
   wired through a fake relay that can be switched off and on, each with a
   scripted peer connection. Every assertion is a downstream effect: a message
   that arrived, a connection that is still the same object, a log line that
   was written. Every gate here is mutation-tested by build/mutate-27ps.mjs.

   Usage: node harness-27ps.mjs [built.html] [part overrides via env, see mutate] */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { assemble, BASE_FILE, PARTS, TAIL } from './assemble-27ps.mjs';

const builtP = process.argv[2] || 'bridge-turn27-post-ship.html';
const built = readFileSync(builtP, 'utf8');
const base = readFileSync(BASE_FILE, 'utf8');
const partOverride = process.env.TB_PART_OVERRIDE ? JSON.parse(process.env.TB_PART_OVERRIDE) : null;
const parts = PARTS.map((p, i) => (partOverride && partOverride[i] != null) ? readFileSync(partOverride[i], 'utf8') : readFileSync(p, 'utf8'));

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── M1 · ADDITIVE ───────────────────────────────────────────────────────── */
console.log('M1 · additive over the accepted baseline');
const prefix = base.slice(0, base.length - TAIL.length);
T('M1.1 built begins with the accepted 27·ship bytes, byte for byte', () => assert(built.startsWith(prefix), 'baseline prefix altered'));
T('M1.2 built === baseline + D1 + C-1 + C-3 + C-2 + tail, nothing else', () => assert(built === prefix + parts.map((p) => '\n\n' + p).join('') + TAIL, 'output is not base + parts + tail'));

/* ── M2 · CONTRACT ───────────────────────────────────────────────────────── */
console.log('M2 · contract: wraps only, calls through, no takeover');
const [d1, c1, c3, c2] = parts;
const contractOf = (s) => s.slice(s.indexOf('@contract'), s.indexOf('*/', s.indexOf('@contract')));
T('M2.1 every C part declares replaces: (none)', () => { for (const p of [c1, c3, c2]) assert(/replaces:\s*\(none\)/.test(contractOf(p)), 'a part declares a replacement'); });
T('M2.2 every declared wrap calls through', () => {
  assert(/_relaySend\.apply\(this, arguments\)/.test(c1), 'C-1 does not call through relaySend');
  assert(/_runRecovery\.apply\(this, arguments\)/.test(c3), 'C-3 does not call through runRecovery');
  assert(/_onSignal\.apply\(this, arguments\)/.test(c3), 'C-3 does not call through onSignal');
  assert(/_start\.apply\(this, arguments\)/.test(c2) && /_stop\.apply\(this, arguments\)/.test(c2), 'C-2 does not call through the watchdog');
});
const PROTECTED = ['CALL.setupPC', 'CALL.teardown', 'CALL.hangUp', 'CALL.mount', 'CALL.acquire', 'CALL.flushCands', 'CALL.startKeepalive', 'CALL.stopKeepalive', 'CALL.armConnectTimeout', 'CALL.resetRecoveryState', 'log', 'relaySendWhenOpen', 'handleRelay', 'relayConnect', 'startDeepgram', 'toast', 'GEN.bump', 'BUILD_INFO', 'VERSION'];
T('M2.3 no C part assigns to anything the baseline owns outside its declared wraps', () => {
  for (const p of [c1, c3, c2]) for (const name of PROTECTED) {
    const re = new RegExp('(^|[^\\w.])' + name.replace('.', '\\s*\\.\\s*') + '\\s*=(?!=)', 'm');
    assert(!re.test(p), 'a part assigns to ' + name);
  }
});
T('M2.4 no onxxx handler installed on a peer connection; no DOM writes', () => {
  for (const p of [c1, c3, c2]) {
    assert(!/\.\s*on(connectionstatechange|iceconnectionstatechange|icecandidate|track|negotiationneeded|datachannel|signalingstatechange)\s*=/.test(p), 'onxxx handler installed');
    assert(!/createElement|innerHTML|textContent\s*=|appendChild|classList\.(add|remove|toggle)|style\./.test(p), 'a part writes the DOM');
  }
});
T('M2.5 no new message TYPE — restart is a key on the proven webrtc-signal carrier', () => {
  const types = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g;
  while ((m = re.exec(c1 + c3 + c2))) types.add(m[1]);
  assert([...types].every((t) => t === 'webrtc-signal'), 'a new relay message type appeared: ' + [...types].join(','));
});
T('M2.6 no credential endpoint, no TURN URL removed (G19/G20; §7.14 non-scope)', () => {
  for (const p of [c1, c3, c2]) assert(!/credentials\/generate|iceServers|transport=tcp|turns?:/.test(p), 'a part touches ICE config or credentials');
});

/* ── M3 · TWO INSTANCES ──────────────────────────────────────────────────── */
console.log('M3 · two-instance harness');

function makeWindow(html, tag) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn27-post-ship.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} removeEventListener() {} set onopen(f) {} set onmessage(f) {} set onclose(f) {} set onerror(f) {} };
      class FakePC {
        constructor() {
          this.connectionState = 'connected'; this.iceConnectionState = 'connected'; this.signalingState = 'stable'; this.iceGatheringState = 'complete';
          this.remoteDescription = null; this.localDescription = null; this.__closed = false; this.__offers = []; this.__answers = 0; this.__stats = [];
          this.__cands = [];
        }
        addEventListener() {} removeEventListener() {} getConfiguration() { return {}; }
        createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; }
        addTrack() { return {}; }
        createOffer(o) { this.__offers.push(o || {}); return Promise.resolve({ type: 'offer', sdp: 'v=0\r\na=ice-ufrag:' + ((o && o.iceRestart) ? 'RESTART' + this.__offers.length : 'first') + '\r\n' }); }
        createAnswer() { this.__answers++; return Promise.resolve({ type: 'answer', sdp: 'v=0\r\na=ice-ufrag:ans' + this.__answers + '\r\n' }); }
        setLocalDescription(d) { this.localDescription = d; return Promise.resolve(); }
        setRemoteDescription(d) { this.remoteDescription = d; return Promise.resolve(); }
        addIceCandidate(c) { this.__cands.push(c); return Promise.resolve(); }
        getStats() { const rows = this.__stats; return Promise.resolve({ forEach: (fn) => rows.forEach(fn) }); }
        close() { this.__closed = true; this.connectionState = 'closed'; }
      }
      w.FakePC = FakePC; w.RTCPeerConnection = FakePC;
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} };
      w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } }; w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.localStorage.setItem('tb_name', tag);
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
  return { dom, w: dom.window, errors, logs: [] };
}

/* A relay between two windows. `up` false = socket closed: relaySend returns false. */
function wire(a, b) {
  const link = { up: true, sent: { a: [], b: [] } };
  const mk = (from, to, key) => ({
    get readyState() { return link.up ? 1 : 3; },
    send(s) { link.sent[key].push(s); const d = JSON.parse(s); setTimeout(() => { try { to.w.handleRelay(d); } catch (e) { to.errors.push('handleRelay: ' + e.message); } }, 0); },
    close() {}
  });
  a.w._relayWs = mk(a, b, 'a'); b.w._relayWs = mk(b, a, 'b');
  return link;
}

function enterRoom(inst, role) {
  const w = inst.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: true };
  w.S.rooms = [room]; w.S.roomId = room.id;
  const _log = w.log;
  w.log = function (ev, d, lvl) { inst.logs.push({ ev, d: d || {}, lvl: lvl || 'info' }); return _log.apply(this, arguments); };
  const C = w.CALL;
  C.active = true; C.kind = 'video'; C.caller = role === 'creator';
  C.pc = new w.FakePC(); C.pc.remoteDescription = { type: role === 'creator' ? 'answer' : 'offer', sdp: 'v=0\r\na=ice-ufrag:first\r\n' };
  C.seenCand = new Set(); C.pendingCandidates = []; C.savedCandidates = []; C.savedOffer = { type: 'webrtc-signal', transient: true, signal: { description: { type: 'offer', sdp: 'v=0\r\na=ice-ufrag:first\r\n' } } };
  C.recoveryStep = 0; C.recoveryLock = false; C.kaChannel = { readyState: 'open' };
  return C;
}
const saw = (inst, ev) => inst.logs.filter((l) => l.ev === ev);

const A = makeWindow(built, 'Creator'); const B = makeWindow(built, 'Joiner');
await sleep(1300);
T('M3.0 both instances boot clean', () => assert(A.errors.length === 0 && B.errors.length === 0, [...A.errors, ...B.errors].join(' | ')));
const link = wire(A, B);
const CA = enterRoom(A, 'creator'); const CB = enterRoom(B, 'joiner');

/* (a) C-1: candidates sent into a dead socket arrive once it is back, in order */
console.log('M3a · C-1 signalling survives a relay outage');
link.up = false;
const cand = (i) => ({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:' + i + ' 1 udp 1 10.0.0.' + i + ' 1 typ host', sdpMid: '0', sdpMLineIndex: 0 } } });
const r1 = A.w.relaySend(cand(1)), r2 = A.w.relaySend(cand(2)), r3 = A.w.relaySend(cand(3));
const chatDropped = A.w.relaySend({ type: 'chat-msg', chatId: 'x', srcText: 'hi' });
T('M3a.1 while the socket is down relaySend still reports false and the message is queued, not lost', () => {
  assert(r1 === false && r2 === false && r3 === false, 'relaySend lied about delivery');
  assert(saw(A, 'c1_queued').length === 3, 'expected 3 c1_queued, got ' + saw(A, 'c1_queued').length);
  assert(link.sent.a.length === 0, 'something was written to a closed socket');
});
T('M3a.2 a non-signalling message is NOT queued (chat has its own resend path)', () => {
  assert(chatDropped === false && saw(A, 'c1_queued').length === 3, 'chat was queued by C-1');
});
await sleep(450);
T('M3a.3 the queue keeps retrying while the socket stays down', () => assert(link.sent.a.length === 0 && saw(A, 'c1_flushed').length === 0, 'delivered into a dead socket'));
link.up = true;
await sleep(700);
T('M3a.4 socket back: all three candidates arrive at the joiner, in order, exactly once each', () => {
  const got = CB.pc.__cands.map((c) => c.candidate);
  assert(got.length === 3, 'joiner received ' + got.length + ' candidates: ' + JSON.stringify(got));
  assert(/candidate:1 /.test(got[0]) && /candidate:2 /.test(got[1]) && /candidate:3 /.test(got[2]), 'out of order: ' + got.join(' | '));
  assert(link.sent.a.length === 3, 'socket saw ' + link.sent.a.length + ' writes for 3 messages — retry storm or duplicate');
  assert(saw(A, 'c1_flushed').length === 3, 'c1_flushed count wrong');
});
T('M3a.5 the once-flag never reaches the wire', () => assert(link.sent.a.every((s) => s.indexOf('_c1') === -1), '_c1 was serialised'));

/* (b) C-3: the joiner asks, the creator serves an ICE restart, the joiner answers on the same pc */
console.log('M3b · C-3 the joiner can ask for an ICE restart');
const joinerPc = CB.pc;
CB.runRecovery('disconnected');                     /* step 1: the baseline's joiner no-op */
T('M3b.1 joiner step 1 is untouched: baseline behaviour, pc alive, nothing sent', () => {
  assert(CB.recoveryStep === 1 && CB.recoveryLock === true, 'step 1 state wrong');
  assert(saw(B, 'c3_restart_requested').length === 0, 'C-3 fired at step 1');
  assert(CB.pc === joinerPc && !joinerPc.__closed, 'pc touched at step 1');
});
CB.recoveryLock = false;                            /* as the 5 s release would */
const creatorOffersBefore = CA.pc.__offers.length;
CB.runRecovery('video_stalled');                    /* step 2: C-3 intercepts */
T('M3b.2 joiner step 2 asks for a restart and KEEPS its connection', () => {
  assert(saw(B, 'c3_restart_requested').length === 1, 'no restart requested');
  assert(CB.recoveryStep === 2 && CB.recoveryLock === true && CB._c3Pending === true, 'step 2 state wrong');
  assert(CB.pc === joinerPc && !joinerPc.__closed, 'joiner closed or replaced its pc — the dead end is still there');
  assert(CB.kaChannel, 'keepalive dropped');
});
await sleep(120);
T('M3b.3 the creator serves it: createOffer({iceRestart:true}) on its live pc', () => {
  assert(saw(A, 'c3_restart_served').length === 1, 'creator did not serve: ' + JSON.stringify(A.logs.slice(-4)));
  const o = CA.pc.__offers.slice(creatorOffersBefore);
  assert(o.length === 1 && o[0].iceRestart === true, 'creator offer was not an ICE restart: ' + JSON.stringify(o));
  assert(!CA.pc.__closed, 'creator rebuilt instead of restarting');
});
await sleep(150);
T('M3b.4 the joiner answers the restart on the SAME pc — not skipped, not rebuilt', () => {
  assert(saw(B, 'c3_restart_answered').length === 1, 'joiner did not answer the restart offer: ' + JSON.stringify(B.logs.slice(-5).map((l) => l.ev)));
  assert(saw(B, 'rtc_offer_skip').length === 0, 'baseline skipped the restart offer');
  assert(CB.pc === joinerPc && !joinerPc.__closed, 'joiner tore down on the restart offer');
  assert(/RESTART/.test(joinerPc.remoteDescription.sdp), 'restart offer not applied');
  assert(joinerPc.__answers === 1, 'no answer created');
});
await sleep(120);
T('M3b.5 the answer reaches the creator through the normal path', () => {
  assert(saw(A, 'rtc_got_answer').length >= 1, 'creator never got the answer');
  assert(/ans1/.test(CA.pc.remoteDescription.sdp), 'answer not applied on the creator');
});
T('M3b.6 a second request inside 8 s is ignored, not served twice', () => {
  const before = CA.pc.__offers.length;
  A.w.CALL.onSignal({ type: 'webrtc-signal', from: 'other', signal: { restart: true } });
  assert(saw(A, 'c3_restart_ignored').length === 1 && CA.pc.__offers.length === before, 'creator served a second restart inside the gap');
});
T('M3b.7 the creator\'s own ladder is untouched: creator step 1 still resends the offer', () => {
  const before = link.sent.a.length;
  /* the baseline clears savedOffer once an answer lands (M3b.5); step 1 resends only what it holds */
  CA.savedOffer = { type: 'webrtc-signal', transient: true, signal: { description: CA.pc.localDescription } };
  CA.recoveryStep = 0; CA.recoveryLock = false;
  CA.runRecovery('disconnected');
  assert(saw(A, 'rtc_offer_resent').length === 1, 'creator step 1 changed');
  assert(saw(A, 'c3_restart_requested').length === 0, 'creator asked itself for a restart');
  assert(link.sent.a.length > before, 'creator resend did not go out');
});
CA.recoveryLock = false;
CA.runRecovery('video_stalled');                    /* creator step 2 must remain the baseline ICE restart */
await sleep(150);
T('M3b.8 creator step 2 is still the baseline ICE restart, not a C-3 request to itself', () => {
  assert(saw(A, 'c3_restart_requested').length === 0, 'creator asked itself for a restart at step 2');
  assert(saw(A, 'rtc_ice_restart').length === 1, 'creator step 2 no longer ICE-restarts');
  assert(CA.recoveryStep === 2, 'creator step counter wrong: ' + CA.recoveryStep);
});
await sleep(150);
T('M3b.9 and the joiner answers the creator-initiated restart on its same pc (the pre-existing step 2 now lands)', () => {
  assert(saw(B, 'c3_restart_answered').length === 2, 'joiner did not answer the creator-initiated restart: ' + saw(B, 'c3_restart_answered').length);
  assert(CB.pc === joinerPc && !joinerPc.__closed, 'joiner tore down on the creator-initiated restart');
});

/* (c)(d) C-2: stall by decoded frames, armed only after the first frame */
console.log('M3c · C-2 stall detection by decoded frames');
function driveWatchdog(inst, C, frameSeq) {
  const w = inst.w; const tick = [];
  const _si = w.setInterval; w.setInterval = function (fn, ms) { tick.push({ fn, ms }); return _si.call(w, function () {}, 1e9); };
  C.kind = 'video'; C.active = true; C.recoveryLock = false; C.recoveryStep = 0;
  const calls = []; const _rr = C.runRecovery; C.runRecovery = function (r) { calls.push(r); };
  C.startVideoWatchdog();
  w.setInterval = _si;
  const c2 = tick[tick.length - 1].fn;
  const feed = async (frames) => { C.pc.__stats = [{ id: 'v', type: 'inbound-rtp', kind: 'video', framesDecoded: frames, bytesReceived: frames * 1000 }]; c2(); await sleep(15); };
  return { feed, calls, restore: () => { C.runRecovery = _rr; C.stopVideoWatchdog(); }, ticks: tick.length };
}
const wd = driveWatchdog(B, CB, []);
T('M3c.0 C-2 arms a second sampler beside the baseline watchdog, same cadence', () => assert(wd.ticks === 2 && CB.c2Timer != null, 'expected baseline + C-2 samplers, saw ' + wd.ticks));
await wd.feed(0); await wd.feed(0); await wd.feed(0); await wd.feed(0);
T('M3d.1 zero frames right after connect is NOT a stall (first frame still in flight)', () => assert(wd.calls.length === 0 && saw(B, 'c2_stalled').length === 0, 'stalled before the first frame'));
await wd.feed(10); await wd.feed(20); await wd.feed(30);
await wd.feed(30); await wd.feed(30);
T('M3c.1 two still samples is not yet a stall', () => assert(wd.calls.length === 0, 'stall declared after 2 samples'));
await wd.feed(30);
T('M3c.2 three still samples while "connected" IS a stall → runRecovery("video_stalled") once', () => {
  assert(wd.calls.length === 1 && wd.calls[0] === 'video_stalled', 'runRecovery calls: ' + JSON.stringify(wd.calls));
  assert(saw(B, 'c2_stalled').length === 1, 'c2_stalled not logged');
});
await wd.feed(45);
T('M3c.3 frames moving again is logged as resumed', () => assert(saw(B, 'c2_resumed').length === 1, 'no c2_resumed'));
CB.pc.connectionState = 'disconnected';
await wd.feed(45); await wd.feed(45); await wd.feed(45); await wd.feed(45);
T('M3c.4 a stall while NOT connected is left to the ladder — C-2 stays silent', () => assert(wd.calls.length === 1, 'C-2 double-fired on a disconnected pc'));
CB.pc.connectionState = 'connected';
wd.restore();
T('M3c.5 stopVideoWatchdog clears the C-2 sampler too', () => assert(CB.c2Timer === null, 'c2Timer survived stop'));

/* (e) an old client receiving the new key */
console.log('M3e · compatibility');
const OLD = makeWindow(base, 'Old');
await sleep(1200);
const CO = enterRoom(OLD, 'creator');
T('M3e.1 a client WITHOUT C-3 ignores signal.restart: no throw, no state change', () => {
  const before = JSON.stringify([CO.recoveryStep, CO.pc.__offers.length, CO.pc.__closed]);
  let threw = false;
  try { CO.onSignal({ type: 'webrtc-signal', from: 'other', signal: { restart: true } }); } catch (_) { threw = true; }
  assert(!threw && OLD.errors.length === 0, 'old client threw');
  assert(JSON.stringify([CO.recoveryStep, CO.pc.__offers.length, CO.pc.__closed]) === before, 'old client changed state');
  assert(saw(OLD, 'c3_restart_served').length === 0 && saw(OLD, 'rtc_sig_err').length === 0, 'old client reacted');
});

/* ── M6 · BASELINE UNDISTURBED ───────────────────────────────────────────── */
console.log('M6 · the baseline is still itself');
T('M6.1 CONNECT_TIMEOUT_MS and keepalive untouched', () => {
  assert(A.w.CALL.CONNECT_TIMEOUT_MS === 20000, 'connect timeout changed');
  assert(/3000/.test(String(A.w.CALL.startKeepalive)), 'keepalive changed');
});
/* Step 3 on the creator must still be the baseline's full rebuild — asserted by
   effect: the old pc is closed and a NEW one is constructed by setupPC. */
const pcBefore = CA.pc; let built3 = 0;
const _FP = A.w.RTCPeerConnection; A.w.RTCPeerConnection = class extends _FP { constructor(c) { super(c); built3++; } };
CA.recoveryStep = 2; CA.recoveryLock = false;
CA.runRecovery('failed');
await sleep(1500);
T('M6.1b creator step 3 still tears down and rebuilds (baseline behaviour reachable through the wrapper)', () => {
  assert(pcBefore.__closed === true, 'creator step 3 did not close the old pc');
  assert(built3 >= 1, 'creator step 3 did not rebuild a pc');
});
T('M6.2 no uncaught errors across the whole run', () => assert(A.errors.length === 0 && B.errors.length === 0, [...A.errors, ...B.errors].join(' | ')));

A.dom.window.close(); B.dom.window.close(); OLD.dom.window.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
