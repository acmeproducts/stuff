#!/usr/bin/env node
/* 27·ship candidate 8 harness (§7.15).

   Two instances of the real artifact boot in jsdom — one creator, one joiner —
   wired through a fake relay that can be switched off and on, each with a
   scripted peer connection; a third instance drives the real relayConnect
   against a controllable fake WebSocket. Every assertion is a downstream
   effect. Every gate here is mutation-tested by build/mutate-27s8.mjs.

   Usage: node harness-27s6.mjs [built.html]   (TB_PART_OVERRIDE for mutations) */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { BASE_FILE, PARTS, TAIL } from './assemble-27s8.mjs';

const builtP = process.argv[2] || 'bridge-turn27-ship.html';
const built = readFileSync(builtP, 'utf8');
const base = readFileSync(BASE_FILE, 'utf8');
const partOverride = process.env.TB_PART_OVERRIDE ? JSON.parse(process.env.TB_PART_OVERRIDE) : null;
const parts = PARTS.map((p, i) => (partOverride && partOverride[i] != null) ? readFileSync(partOverride[i], 'utf8') : readFileSync(p, 'utf8'));

let pass = 0, fail = 0;
const T = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── M1 · ADDITIVE ───────────────────────────────────────────────────────── */
console.log('M1 · additive over the accepted 27·ship c5 baseline');
const prefix = base.slice(0, base.length - TAIL.length);
T('M1.1 built begins with the accepted c5 bytes, byte for byte', () => assert(built.startsWith(prefix), 'baseline prefix altered'));
T('M1.2 built === baseline + D1 + V-1 + V-2 + V-3 + V-4 + S-2 + F-1 + tail, nothing else', () => assert(built === prefix + parts.map((p) => '\n\n' + p).join('') + TAIL, 'output is not base + parts + tail'));
T('M1.3 the baseline is c5: tap-swap and camera flip present, corner band gone, no popstate listener of its own', () => {
  assert(/function tbSwapTap/.test(prefix) && /function tbFlipCamera/.test(prefix) && prefix.indexOf('btn-flip-overlay') !== -1, 'c5 surface missing from the base');
  assert(prefix.indexOf("addEventListener('popstate'") === -1, 'the base has a popstate listener — S-2 would double up');
  assert(/history\.pushState\(\{tbCall:1\}/.test(prefix), 'the base no longer pushes the call history entry S-2 relies on');
});

/* ── M2 · CONTRACT ───────────────────────────────────────────────────────── */
console.log('M2 · contract: wraps only, calls through, no takeover');
const [d1, c1, v2, c3, c2, pS2, f1] = parts;
const contractOf = (s) => s.slice(s.indexOf('@contract'), s.indexOf('*/', s.indexOf('@contract')));
T('M2.1 every part declares replaces: (none)', () => { for (const p of [c1, v2, c3, c2, pS2, f1]) assert(/replaces:\s*\(none\)/.test(contractOf(p)), 'a part declares a replacement'); });
T('M2.2 every declared wrap calls through', () => {
  assert(/_relaySend\.apply\(this, arguments\)/.test(c1), 'V-1 does not call through relaySend');
  assert(/_relayConnect\.apply\(this, arguments\)/.test(v2), 'V-2 does not call through relayConnect');
  assert(/_runRecovery\.apply\(this, arguments\)/.test(c3) && /_onSignal\.apply\(this, arguments\)/.test(c3), 'V-3 does not call through');
  assert(/_start\.apply\(this, arguments\)/.test(c2) && /_stop\.apply\(this, arguments\)/.test(c2), 'V-4 does not call through the watchdog');
  assert(/_replaceSenderTrack\.apply\(this, arguments\)/.test(f1) && /_camSenders\.apply\(this, arguments\)/.test(f1), 'F-1 does not call through');
});
const PROTECTED = ['CALL.setupPC', 'CALL.teardown', 'CALL.hangUp', 'CALL.mount', 'CALL.acquire', 'CALL.flushCands', 'CALL.startKeepalive', 'CALL.stopKeepalive', 'CALL.armConnectTimeout', 'CALL.resetRecoveryState', 'CALL.enterPip', 'CALL.exitPip', 'log', 'relaySendWhenOpen', 'handleRelay', 'relayDisconnect', 'startDeepgram', 'toast', 'GEN.bump', 'BUILD_INFO', 'VERSION', 'wirePipSwap', 'wirePipDrag'];
T('M2.3 no part assigns to anything the baseline owns outside its declared wraps', () => {
  for (const p of [c1, v2, c3, c2]) for (const name of PROTECTED) {
    const re = new RegExp('(^|[^\\w.])' + name.replace('.', '\\s*\\.\\s*') + '\\s*=(?!=)', 'm');
    assert(!re.test(p), 'a part assigns to ' + name);
  }
  assert(!/(^|[^\w.])relayConnect\s*=(?!=)/m.test(c1 + c3 + c2), 'a part other than V-2 assigns relayConnect');
  assert(!/(^|[^\w.])relaySend\s*=(?!=)/m.test(v2 + c3 + c2), 'a part other than V-1 assigns relaySend');
});
T('M2.4 no onxxx handler installed; no DOM writes; transport parts never touch popstate; S-2 only absorbs back', () => {
  for (const p of [c1, v2, c3, c2]) {
    assert(!/\.\s*on(connectionstatechange|iceconnectionstatechange|icecandidate|track|negotiationneeded|datachannel|signalingstatechange|open|close|message|error)\s*=/.test(p), 'onxxx handler installed');
    assert(!/createElement|innerHTML|textContent\s*=|appendChild|classList\.(add|remove|toggle)|style\./.test(p), 'a part writes the DOM');
    assert(!/popstate|pushState|enterPip|exitPip/.test(p), 'a transport part touches the back-button surface');
  }
  assert(!/enterPip|exitPip|tbSwapTap|tbFlipCamera|replaceSenderTrack/.test(pS2), 'S-2 touches swap / flip / PiP — it only absorbs back');
  const f1code = f1.replace(/\/\*[\s\S]*?\*\//g, '');   /* judge the code, not its own explanation */
  assert(!/tbFlipCamera\s*=|tbSwapTap\s*=|getUserMedia/.test(f1code), 'F-1 must not rewrite the flip or touch the camera itself');
  assert((pS2.match(/addEventListener\('popstate'/g) || []).length === 1, 'S-2 must add exactly one popstate listener');
});
T('M2.5 no new message TYPE — restart is a key on the proven webrtc-signal carrier', () => {
  const types = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g;
  while ((m = re.exec(c1 + v2 + c3 + c2 + pS2 + f1))) types.add(m[1]);
  assert([...types].every((t) => t === 'webrtc-signal'), 'a new relay message type appeared: ' + [...types].join(','));
});
T('M2.6 no credential endpoint, no TURN URL removed (G19/G20; §7.15 non-scope)', () => {
  for (const p of [c1, v2, c3, c2, pS2, f1]) assert(!/credentials\/generate|iceServers|transport=tcp|turns?:/.test(p), 'a part touches ICE config or credentials');
});

/* ── M3 · TWO INSTANCES ──────────────────────────────────────────────────── */
console.log('M3 · two-instance harness');

function makeWindow(html, tag) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn27-ship.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      /* A WebSocket the test drives: on* properties AND addEventListener both fire. */
      class FakeWS {
        constructor(url) { this.url = url; this.readyState = 0; this.__l = {}; this.__closed = false; this.__sent = []; w.__sockets.push(this); }
        addEventListener(t, f) { (this.__l[t] = this.__l[t] || []).push(f); }
        removeEventListener() {}
        send(s) { this.__sent.push(s); }
        close() { this.__closed = true; }
        __fire(t, ev) {
          ev = ev || {};
          if (t === 'open') this.readyState = 1; if (t === 'close') this.readyState = 3;
          const h = this['on' + t]; if (typeof h === 'function') { try { h.call(this, ev); } catch (_) {} }
          (this.__l[t] || []).forEach((f) => { try { f.call(this, ev); } catch (_) {} });
        }
      }
      w.__sockets = [];
      w.WebSocket = FakeWS;
      class FakePC {
        constructor() {
          this.connectionState = 'connected'; this.iceConnectionState = 'connected'; this.signalingState = 'stable'; this.iceGatheringState = 'complete';
          this.remoteDescription = null; this.localDescription = null; this.__closed = false; this.__offers = []; this.__answers = 0; this.__stats = []; this.__cands = []; this.__senders = [];
        }
        getSenders() { return this.__senders; }
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
function wire(a, b) {
  const link = { up: true, sent: { a: [], b: [] } };
  const mk = (from, to, key) => ({ get readyState() { return link.up ? 1 : 3; }, send(s) { link.sent[key].push(s); const d = JSON.parse(s); setTimeout(() => { try { to.w.handleRelay(d); } catch (e) { to.errors.push('handleRelay: ' + e.message); } }, 0); }, close() {}, addEventListener() {} });
  a.w._relayWs = mk(a, b, 'a'); b.w._relayWs = mk(b, a, 'b');
  return link;
}
function enterRoom(inst, role) {
  const w = inst.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: true };
  w.S.rooms = [room]; w.S.roomId = room.id; w.S.view = 'room';
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

console.log('M3a · V-1 signalling survives a relay outage');
link.up = false;
const cand = (i) => ({ type: 'webrtc-signal', transient: true, signal: { candidate: { candidate: 'candidate:' + i + ' 1 udp 1 10.0.0.' + i + ' 1 typ host', sdpMid: '0', sdpMLineIndex: 0 } } });
const r1 = A.w.relaySend(cand(1)), r2 = A.w.relaySend(cand(2)), r3 = A.w.relaySend(cand(3));
const chatDropped = A.w.relaySend({ type: 'chat-msg', chatId: 'x', srcText: 'hi' });
T('M3a.1 socket down: relaySend reports false, exactly three messages queued, none lost, no storm', () => {
  assert(r1 === false && r2 === false && r3 === false, 'relaySend lied about delivery');
  assert(saw(A, 'c1_queued').length === 3, 'expected 3 c1_queued, got ' + saw(A, 'c1_queued').length);
  assert(link.sent.a.length === 0, 'something was written to a closed socket');
});
T('M3a.2 a non-signalling message is NOT queued', () => assert(chatDropped === false && saw(A, 'c1_queued').length === 3, 'chat was queued'));
await sleep(450);
T('M3a.3 the queue keeps retrying while the socket stays down', () => assert(link.sent.a.length === 0 && saw(A, 'c1_flushed').length === 0, 'delivered into a dead socket'));
link.up = true;
await sleep(700);
T('M3a.4 socket back: all three arrive at the joiner, in order, once each', () => {
  const got = CB.pc.__cands.map((c) => c.candidate);
  assert(got.length === 3 && /candidate:1 /.test(got[0]) && /candidate:2 /.test(got[1]) && /candidate:3 /.test(got[2]), 'joiner got: ' + JSON.stringify(got));
  assert(link.sent.a.length === 3, 'socket saw ' + link.sent.a.length + ' writes for 3 messages');
  assert(saw(A, 'c1_flushed').length === 3, 'c1_flushed count wrong');
});
T('M3a.5 the once-flag never reaches the wire', () => assert(link.sent.a.every((s) => s.indexOf('_c1') === -1), '_c1 serialised'));

console.log('M3b · V-3 the joiner can ask for an ICE restart');
const joinerPc = CB.pc;
CB.runRecovery('disconnected');
T('M3b.1 joiner step 1 is untouched: pc alive, nothing sent', () => assert(CB.recoveryStep === 1 && CB.recoveryLock === true && saw(B, 'c3_restart_requested').length === 0 && CB.pc === joinerPc && !joinerPc.__closed, 'step 1 changed'));
CB.recoveryLock = false;
const creatorOffersBefore = CA.pc.__offers.length;
CB.runRecovery('video_stalled');
T('M3b.2 joiner step 2 asks for a restart and KEEPS its connection', () => {
  assert(saw(B, 'c3_restart_requested').length === 1, 'no restart requested');
  assert(CB.recoveryStep === 2 && CB.recoveryLock === true && CB._c3Pending === true, 'step 2 state wrong');
  assert(CB.pc === joinerPc && !joinerPc.__closed && CB.kaChannel, 'joiner tore down — the dead end is still there');
});
await sleep(120);
T('M3b.3 the creator serves it: createOffer({iceRestart:true}) on its live pc', () => {
  assert(saw(A, 'c3_restart_served').length === 1, 'creator did not serve');
  const o = CA.pc.__offers.slice(creatorOffersBefore);
  assert(o.length === 1 && o[0].iceRestart === true && !CA.pc.__closed, 'not an ICE restart: ' + JSON.stringify(o));
});
await sleep(150);
T('M3b.4 the joiner answers the restart on the SAME pc — not skipped, not rebuilt', () => {
  assert(saw(B, 'c3_restart_answered').length === 1 && saw(B, 'rtc_offer_skip').length === 0, 'joiner skipped or did not answer');
  assert(CB.pc === joinerPc && !joinerPc.__closed && /RESTART/.test(joinerPc.remoteDescription.sdp) && joinerPc.__answers === 1, 'restart not applied on the same pc');
});
await sleep(120);
T('M3b.5 the answer reaches the creator through the normal path', () => assert(saw(A, 'rtc_got_answer').length >= 1 && /ans1/.test(CA.pc.remoteDescription.sdp), 'creator never got the answer'));
T('M3b.6 a second request inside 8 s is ignored', () => {
  const before = CA.pc.__offers.length;
  A.w.CALL.onSignal({ type: 'webrtc-signal', from: 'other', signal: { restart: true } });
  assert(saw(A, 'c3_restart_ignored').length === 1 && CA.pc.__offers.length === before, 'served twice');
});
T('M3b.7 creator step 1 still resends the offer (baseline)', () => {
  CA.savedOffer = { type: 'webrtc-signal', transient: true, signal: { description: CA.pc.localDescription } };
  CA.recoveryStep = 0; CA.recoveryLock = false;
  CA.runRecovery('disconnected');
  assert(saw(A, 'rtc_offer_resent').length === 1 && saw(A, 'c3_restart_requested').length === 0, 'creator step 1 changed');
});
CA.recoveryLock = false;
CA.runRecovery('video_stalled');
await sleep(150);
T('M3b.8 creator step 2 is still the baseline ICE restart, not a request to itself', () => assert(saw(A, 'c3_restart_requested').length === 0 && saw(A, 'rtc_ice_restart').length === 1 && CA.recoveryStep === 2, 'creator step 2 changed'));
await sleep(150);
T('M3b.9 the joiner answers the creator-initiated restart on its same pc', () => assert(saw(B, 'c3_restart_answered').length === 2 && CB.pc === joinerPc && !joinerPc.__closed, 'creator-initiated restart not answered'));

console.log('M3c · V-4 stall detection by decoded frames');
function driveWatchdog(inst, C) {
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
const wd = driveWatchdog(B, CB);
T('M3c.0 V-4 arms a second sampler beside the baseline watchdog', () => assert(wd.ticks === 2 && CB.c2Timer != null, 'samplers: ' + wd.ticks));
await wd.feed(0); await wd.feed(0); await wd.feed(0); await wd.feed(0);
T('M3d.1 zero frames right after connect is NOT a stall', () => assert(wd.calls.length === 0 && saw(B, 'c2_stalled').length === 0, 'stalled before the first frame'));
await wd.feed(10); await wd.feed(20); await wd.feed(30); await wd.feed(30); await wd.feed(30);
T('M3c.1 two still samples is not yet a stall', () => assert(wd.calls.length === 0, 'stall after 2 samples'));
await wd.feed(30);
T('M3c.2 three still samples while "connected" IS a stall → runRecovery once', () => assert(wd.calls.length === 1 && wd.calls[0] === 'video_stalled' && saw(B, 'c2_stalled').length === 1, 'calls: ' + JSON.stringify(wd.calls)));
await wd.feed(45);
T('M3c.3 frames moving again is logged as resumed', () => assert(saw(B, 'c2_resumed').length === 1, 'no c2_resumed'));
CB.pc.connectionState = 'disconnected';
await wd.feed(45); await wd.feed(45); await wd.feed(45); await wd.feed(45);
T('M3c.4 a stall while NOT connected is left to the ladder', () => assert(wd.calls.length === 1, 'double-fired'));
CB.pc.connectionState = 'connected';
wd.restore();
T('M3c.5 stopVideoWatchdog clears the V-4 sampler too', () => assert(CB.c2Timer === null, 'c2Timer survived stop'));

console.log('M3e · compatibility');
const OLD = makeWindow(base, 'Old');
await sleep(1200);
const CO = enterRoom(OLD, 'creator');
T('M3e.1 a client WITHOUT V-3 ignores signal.restart: no throw, no state change', () => {
  const before = JSON.stringify([CO.recoveryStep, CO.pc.__offers.length, CO.pc.__closed]);
  let threw = false;
  try { CO.onSignal({ type: 'webrtc-signal', from: 'other', signal: { restart: true } }); } catch (_) { threw = true; }
  assert(!threw && OLD.errors.length === 0 && JSON.stringify([CO.recoveryStep, CO.pc.__offers.length, CO.pc.__closed]) === before, 'old client reacted');
  assert(saw(OLD, 'c3_restart_served').length === 0 && saw(OLD, 'rtc_sig_err').length === 0, 'old client logged');
});

/* ── M3f · V-2 THE SOCKET COMES BACK FAST ────────────────────────────────── */
console.log('M3f · V-2 relay retry ramp (real relayConnect, fake WebSocket)');
const R = makeWindow(built, 'Relay');
await sleep(1200);
enterRoom(R, 'creator');
const rw = R.w; const socks = () => rw.__sockets;
const n0 = socks().length;
rw.relayConnect();
const s1 = rw._relayWs;
T('M3f.0 relayConnect still builds a socket through the frozen code', () => assert(socks().length === n0 + 1 && s1 && s1.url && /session=gate-room/.test(s1.url), 'no socket built'));
s1.__fire('open');
T('M3f.1 open: frozen onopen ran (hello sent), ramp reset', () => assert(s1.__sent.some((m) => /"type":"hello"/.test(m)), 'hello not sent on open'));
s1.__fire('close', { code: 1006 });
T('M3f.2 close: the frozen 2 s timer is taken over — exactly one retry pending, and not the 2 s one', () => {
  assert(rw.wsReconnectTimer === null, 'frozen 2 s timer still armed');
  assert(socks().length === n0 + 1, 'reconnected synchronously');
});
await sleep(420);
T('M3f.3 a new socket exists within ~300 ms, exactly one', () => {
  assert(socks().length === n0 + 2, 'sockets after first retry: ' + (socks().length - n0));
  assert(saw(R, 'v2_retry').length === 1 && saw(R, 'v2_retry')[0].d.ms === 300, 'first retry not at 300 ms: ' + JSON.stringify(saw(R, 'v2_retry')));
  assert(rw._relayWs !== s1, '_relayWs not replaced');
});
const s2 = rw._relayWs;
s2.__fire('close', { code: 1006 });               /* dies immediately, like the 36 ms failure on device */
await sleep(420);
T('M3f.4 the ramp climbs: second retry waits 600 ms, so nothing at 400 ms', () => assert(socks().length === n0 + 2, 'retried too early'));
await sleep(300);
T('M3f.5 …and fires by 700 ms, still exactly one pending at a time', () => {
  assert(socks().length === n0 + 3, 'sockets: ' + (socks().length - n0));
  assert(saw(R, 'v2_retry')[1].d.ms === 600, 'second retry ms: ' + saw(R, 'v2_retry')[1].d.ms);
});
const s3 = rw._relayWs;
s3.__fire('open');
s3.__fire('close', { code: 1006 });
await sleep(420);
T('M3f.6 a successful open resets the ramp: next retry is 300 ms again', () => {
  assert(socks().length === n0 + 4, 'sockets: ' + (socks().length - n0));
  assert(saw(R, 'v2_retry')[2].d.ms === 300, 'ramp did not reset: ' + saw(R, 'v2_retry')[2].d.ms);
});
const s4 = rw._relayWs;
s4.__fire('open');
T('M3f.7 a socket the app has replaced is not retried (guard against double-connect)', () => {
  const before = socks().length;
  rw.relayConnect();                              /* app replaces s4 (frozen code closes it) */
  const s5 = rw._relayWs;
  assert(s5 !== s4 && socks().length === before + 1, 'replacement not built');
  s4.__fire('close', { code: 1005 });             /* the old socket's close arrives late */
  return sleep(450).then(() => {});
});
await sleep(450);
T('M3f.7b …no retry was scheduled for the replaced one (no v2_retry, no extra socket)', () => {
  assert(saw(R, 'v2_retry').length === 3, 'a retry fired for a replaced socket: ' + JSON.stringify(saw(R, 'v2_retry').slice(3)));
  assert(socks().length === n0 + 5, 'extra socket built: ' + (socks().length - n0));
});
T('M3f.8 leaving the room stops the ramp', () => {
  rw._relayWs.__fire('open');
  rw.S.view = 's1'; rw.S.roomId = null;
  const before = socks().length;
  rw._relayWs.__fire('close', { code: 1006 });
  return sleep(450).then(() => {});
});
await sleep(450);
T('M3f.8b …no retry outside a room (no v2_retry, no socket)', () => {
  assert(saw(R, 'v2_retry').length === 3, 'retried outside a room: ' + JSON.stringify(saw(R, 'v2_retry').slice(3)));
  assert(socks().length === n0 + 5, 'socket built outside a room');
});


/* ── M3g · S-2 THE BACK BUTTON DOES NOTHING DURING A CALL ────────────────── */
console.log('M3g · S-2 back button absorbed during a call');
const K = makeWindow(built, 'Back');
await sleep(1200);
const CK = enterRoom(K, 'creator');
const pushes = [];
const _ps = K.w.history.pushState.bind(K.w.history);
K.w.history.pushState = function (st, t, u) { pushes.push(st); return _ps(st, t, u); };
CK.active = true;
K.w.dispatchEvent(new K.w.PopStateEvent('popstate', { state: null }));
T('M3g.1 back during a call re-pushes the call entry (nothing leaves) and logs it', () => {
  assert(pushes.length === 1 && pushes[0] && pushes[0].tbCall === 1, 'no re-push on back during a call: ' + JSON.stringify(pushes));
  assert(saw(K, 's2_back_absorbed').length === 1, 's2_back_absorbed not logged');
});
K.w.dispatchEvent(new K.w.PopStateEvent('popstate', { state: null }));
T('M3g.2 …and again on the next press — there is always one more entry', () => assert(pushes.length === 2, 'second back not absorbed'));
CK.active = false;
K.w.dispatchEvent(new K.w.PopStateEvent('popstate', { state: null }));
T('M3g.3 outside a call, back is left alone', () => assert(pushes.length === 2 && saw(K, 's2_back_absorbed').length === 2, 'S-2 acted outside a call'));
T('M3g.4 the c5 surface is intact in the built artifact: swap and flip are live functions, corner band is not', () => {
  assert(typeof K.w.tbSwapTap === 'function' && typeof K.w.tbFlipCamera === 'function', 'swap/flip missing');
  assert(typeof K.w.wirePipSwap !== 'function', 'corner-band code came back');
  assert(K.w.document.getElementById('btn-flip-overlay'), 'flip button missing');
});
K.dom.window.close();


/* ── M3h · F-1 A CAMERA FLIP KEEPS THE FAR SIDE'S PICTURE ────────────────── */
console.log('M3h · F-1 flip keeps the sender');
const FL = makeWindow(built, 'Flip');
await sleep(1200);
const CF = enterRoom(FL, 'creator');
const mkTrack = (kind, id) => ({ kind, id, stop() { this.__stopped = true; } });
const oldCam = mkTrack('video', 'cam-front'), mic = mkTrack('audio', 'mic');
const vSender = { track: oldCam, replaceTrack(t) { this.track = t; return Promise.resolve(); } };
const aSender = { track: mic, replaceTrack(t) { this.track = t; return Promise.resolve(); } };
CF.pc.__senders = [aSender, vSender];
CF.stream = { getVideoTracks() { return [oldCam]; }, getAudioTracks() { return [mic]; }, removeTrack() {}, addTrack() {} };
const newCam = mkTrack('video', 'cam-back');
FL.w.navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getVideoTracks() { return [newCam]; }, getTracks() { return [newCam]; } });
CF.active = true; CF.kind = 'video';
FL.w.tbFlipCamera();
await sleep(80);
T('M3h.1 after a flip the connection\'s video sender carries the NEW camera — not null', () => {
  assert(saw(FL, 'v4_camera_flip').length === 1, 'flip did not complete: ' + JSON.stringify(FL.logs.slice(-3).map((l) => l.ev)));
  assert(vSender.track === newCam, 'video sender after flip: ' + (vSender.track ? vSender.track.id : 'NULL — the far side is frozen'));
  assert(oldCam.__stopped === true, 'old camera not released');
});
T('M3h.2 the audio sender is untouched by the flip', () => assert(aSender.track === mic, 'audio sender changed'));
T('M3h.3 the rescue is visible in the log', () => assert(saw(FL, 'f1_sender_kept').length >= 1, 'no f1_sender_kept line'));
const backCam = mkTrack('video', 'cam-front-2');
FL.w.navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getVideoTracks() { return [backCam]; }, getTracks() { return [backCam]; } });
FL.w.tbFlipCamera();
await sleep(80);
T('M3h.4 flipping back works too — the sender follows every flip', () => assert(vSender.track === backCam, 'second flip lost the sender'));
/* Mute releases the AUDIO sender the same way. A flip after that must not
   put the camera on the muted microphone's slot. */
FL.w.replaceSenderTrack(aSender, null);
const thirdCam = mkTrack('video', 'cam-back-2');
FL.w.navigator.mediaDevices.getUserMedia = () => Promise.resolve({ getVideoTracks() { return [thirdCam]; }, getTracks() { return [thirdCam]; } });
FL.w.tbFlipCamera();
await sleep(80);
T('M3h.6 a flip while muted leaves the muted audio sender alone and still lands the camera on the video sender', () => {
  assert(aSender.track === null, 'the camera was put on the muted audio sender: ' + (aSender.track && aSender.track.id));
  assert(vSender.track === thirdCam, 'video sender after flip-while-muted: ' + (vSender.track ? vSender.track.id : 'NULL'));
});
T('M3h.5 F-1 wraps and calls through: the baseline filter still runs first', () => {
  assert(/_camSenders\.apply/.test(String(FL.w.camSenders)) && /_replaceSenderTrack\.apply/.test(String(FL.w.replaceSenderTrack)), 'F-1 not installed as a wrapper');
});
FL.dom.window.close();

/* ── M6 · BASELINE UNDISTURBED ───────────────────────────────────────────── */
console.log('M6 · the baseline is still itself');
T('M6.1 CONNECT_TIMEOUT_MS and keepalive untouched', () => assert(A.w.CALL.CONNECT_TIMEOUT_MS === 20000 && /3000/.test(String(A.w.CALL.startKeepalive)), 'baseline constants changed'));
const pcBefore = CA.pc; let built3 = 0;
const _FP = A.w.RTCPeerConnection; A.w.RTCPeerConnection = class extends _FP { constructor(c) { super(c); built3++; } };
CA.recoveryStep = 2; CA.recoveryLock = false;
CA.runRecovery('failed');
await sleep(1500);
T('M6.1b creator step 3 still tears down and rebuilds', () => assert(pcBefore.__closed === true && built3 >= 1, 'creator step 3 changed'));
T('M6.2 c5 video surface live: tap-swap wired on the video host', () => assert(typeof A.w.tbSwapTap === 'function' && A.w.document.getElementById('call-videos'), 'c5 surface missing'));
T('M6.3 no uncaught errors across the whole run', () => assert(A.errors.length === 0 && B.errors.length === 0 && R.errors.length === 0, [...A.errors, ...B.errors, ...R.errors].join(' | ')));

A.dom.window.close(); B.dom.window.close(); OLD.dom.window.close(); R.dom.window.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
