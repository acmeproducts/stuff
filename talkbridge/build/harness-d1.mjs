#!/usr/bin/env node
/* D1 diagnostic harness.

   Rules inherited from build/harness.mjs:
     1. Assert the downstream effect — a log line actually emitted — never a
        return value alone.
     2. Run the real artifact in jsdom, not a hand-rolled stub.
     3. The build must be purely additive over the accepted base — byte-checked.
     4. Every gate here is mutation-tested by build/mutate-d1.mjs.

   The peer connection is faked well enough to drive the states this release
   exists to observe: connect, deliver video, stop delivering video, drop to
   disconnected. The fake is scripted by the test, so "the instrument saw it"
   is provable without hardware.

   Usage: node harness-d1.mjs [base.html] [built.html]                       */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const baseP = process.argv[2] || 'bridge-turn27-ship.html';
const builtP = process.argv[3] || 'bridge-turn27-ship-diag1.html';
const partP = process.argv[4] || 'talkbridge/parts/d1-call-diagnostics.js';

const base = readFileSync(baseP, 'utf8');
const built = readFileSync(builtP, 'utf8');
const part = readFileSync(partP, 'utf8');

let pass = 0, fail = 0;
const T = (name, fn) => {
  try { fn(); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };

/* ── M1 · ADDITIVE ───────────────────────────────────────────────────────── */
console.log('M1 · additive over the accepted baseline');
const tail = '\n</script>\n</body>\n</html>';
const prefix = base.slice(0, base.length - tail.length);

T('M1.1 built begins with the accepted 27·ship bytes, byte for byte', () => {
  assert(built.startsWith(prefix), 'baseline prefix altered — not additive');
});
T('M1.2 built === baseline + one appended part, nothing else', () => {
  assert(built === prefix + '\n\n' + part + tail, 'output is not base + part + tail');
});
T('M1.3 nothing removed: every baseline line survives in order', () => {
  assert(built.length > base.length, 'built is not larger than base');
  assert(built.indexOf(prefix) === 0, 'prefix moved');
});

/* ── M2 · READ-ONLY CONTRACT ─────────────────────────────────────────────── */
console.log('M2 · contract: replaces nothing, wraps nothing');

const contract = part.slice(part.indexOf('@contract'), part.indexOf('*/', part.indexOf('@contract')));
T('M2.1 contract declares no replaces and no wraps', () => {
  assert(/replaces:\s*\(none\)/.test(contract), 'contract declares a replacement');
  assert(/wraps:\s*\(none\)/.test(contract), 'contract declares a wrap');
});

/* Everything the baseline defines that the part must not take over. The part is
   allowed to READ these; it must never assign to them. */
const PROTECTED = [
  'CALL.setupPC', 'CALL.onSignal', 'CALL.teardown', 'CALL.hangUp', 'CALL.mount',
  'CALL.runRecovery', 'CALL.startKeepalive', 'CALL.stopKeepalive',
  'CALL.startVideoWatchdog', 'CALL.stopVideoWatchdog', 'CALL.armConnectTimeout',
  'CALL.resetRecoveryState', 'CALL.acquire', 'CALL.flushCands',
  'log', 'relaySend', 'startDeepgram', 'toast', 'showScreen', 'addSysPill',
  'GEN.bump', 'BUILD_INFO', 'VERSION'
];
T('M2.2 part assigns to nothing the baseline owns', () => {
  for (const name of PROTECTED) {
    const re = new RegExp('(^|[^\\w.])' + name.replace('.', '\\s*\\.\\s*') + '\\s*=(?!=)', 'm');
    assert(!re.test(part), 'part assigns to ' + name);
  }
});
T('M2.3 part installs no onxxx handler on the peer connection', () => {
  assert(!/\.\s*on(connectionstatechange|iceconnectionstatechange|icecandidate|track|negotiationneeded|datachannel|signalingstatechange|icegatheringstatechange)\s*=/.test(part),
    'part overwrites an onxxx handler — the recovery ladder would lose it');
});
T('M2.4 part touches the DOM for reading only — no element is created or styled', () => {
  assert(!/createElement|innerHTML|textContent\s*=|appendChild|classList\.(add|remove|toggle)|style\./.test(part),
    'part makes a visible change');
});
T('M2.5 part introduces no new credential endpoint or secret path (G19/G20)', () => {
  assert(!/credentials\/generate|deepgram|tb_auth|\/service\//i.test(part), 'part reaches a credential endpoint');
  assert(/getConfiguration/.test(part), 'part does not reuse the live connection config');
});
T('M2.6 no NodeList.forEach (G2)', () => {
  assert(!/querySelectorAll\s*\([^)]*\)\s*\.\s*forEach/.test(part), 'NodeList.forEach found');
});

/* ── M3 · BOOT ───────────────────────────────────────────────────────────── */
console.log('M3 · boot the real artifact');

const logs = [];
const errors = [];

function makeWindow(html) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  return new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn27-ship-diag1.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class {
        constructor() { this.readyState = 0; }
        send() {} close() {} addEventListener() {} removeEventListener() {}
        set onopen(f) {} set onmessage(f) {} set onclose(f) {} set onerror(f) {}
      };

      /* A peer connection the test drives by hand. */
      class FakePC {
        constructor(cfg) {
          this.__cfg = cfg || {};
          this.iceConnectionState = 'new';
          this.connectionState = 'new';
          this.signalingState = 'stable';
          this.iceGatheringState = 'new';
          this.__listeners = {};
          this.__stats = new Map();
          this.__closed = false;
          w.__pcs.push(this);
        }
        getConfiguration() { return this.__cfg; }
        addEventListener(t, f) { (this.__listeners[t] = this.__listeners[t] || []).push(f); }
        removeEventListener() {}
        createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; }
        addTrack() { return {}; }
        createOffer() { return Promise.resolve({ type: 'offer', sdp: '' }); }
        createAnswer() { return Promise.resolve({ type: 'answer', sdp: '' }); }
        setLocalDescription() { return Promise.resolve(); }
        setRemoteDescription() { return Promise.resolve(); }
        addIceCandidate() { return Promise.resolve(); }
        getStats() { return Promise.resolve(this.__stats); }
        close() { this.__closed = true; }
        /* test controls */
        __fire(t, ev) { (this.__listeners[t] || []).forEach((f) => { try { f(ev || {}); } catch (_) {} }); }
        __set(field, value) { this[field] = value; this.__fire(FakePC.EVENT[field]); }
        __setStats(rows) {
          const m = new Map();
          rows.forEach((r) => m.set(r.id, r));
          m.forEach = Map.prototype.forEach.bind(m);
          this.__stats = { forEach: (fn) => rows.forEach((r) => fn(r)) };
        }
      }
      FakePC.EVENT = {
        iceConnectionState: 'iceconnectionstatechange',
        connectionState: 'connectionstatechange',
        signalingState: 'signalingstatechange',
        iceGatheringState: 'icegatheringstatechange'
      };
      w.__pcs = [];
      w.RTCPeerConnection = FakePC;

      w.AudioContext = w.webkitAudioContext = class {
        constructor() { this.state = 'running'; this.destination = {}; }
        createMediaStreamSource() { return { connect() {} }; }
        createScriptProcessor() { return { connect() {}, disconnect() {} }; }
        createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; }
        resume() { return Promise.resolve(); } close() { return Promise.resolve(); }
      };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} };
      w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } };
      w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.localStorage.setItem('tb_name', 'Harness');
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
}

const dom = makeWindow(built);
const w = dom.window;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await sleep(1200);

/* Capture every log line from here on. The app's own log() is left alone; this
   wraps the harness's view of it the same way N16 does in the product. */
const _log = w.log;
w.log = function (ev, d, lvl) {
  logs.push({ ev, d: d || {}, lvl: lvl || 'info' });
  return _log.apply(this, arguments);
};
const saw = (ev) => logs.filter((l) => l.ev === ev);
const last = (ev) => saw(ev)[saw(ev).length - 1];

T('M3.1 boot: no uncaught errors', () => assert(errors.length === 0, errors.join(' | ')));
T('M3.2 the instrument is live', () => {
  assert(w.TBD1 && typeof w.TBD1.tick === 'function', 'TBD1 missing');
  assert(w.TBD1.state, 'TBD1.state missing');
});
T('M3.3 build identity is logged, not painted', () => {
  assert(/d1_build/.test(w.debugLog.map((r) => r.ev).join(' ')), 'no d1_build line in the device log');
  assert(!w.document.getElementById('s13-build') ||
    w.document.getElementById('s13-build').textContent.indexOf('diag') === -1,
    'diagnostic build changed the visible build footer');
});

/* ── M4 · THE INSTRUMENT SEES A CALL ─────────────────────────────────────── */
console.log('M4 · a driven call is observed end to end');

const CALL = w.CALL;
const pcCfg = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:turn.example:3478', username: 'u', credential: 'c' }] };
const pc = new w.RTCPeerConnection(pcCfg);

CALL.kind = 'video';
CALL.active = true;
CALL.pc = pc;
CALL.kaChannel = { readyState: 'open' };
CALL.kaTimer = 1;
CALL.videoWatchTimer = 2;
CALL.recoveryStep = 0;
CALL.recoveryLock = false;

w.TBD1.tick();

T('M4.1 call start is recorded with role and kind', () => {
  const l = last('d1_call_start');
  assert(l, 'no d1_call_start');
  assert(l.d.kind === 'video', 'kind not recorded');
});
T('M4.2 the peer connection is picked up and its opening state recorded', () => {
  const l = last('d1_pc_seen');
  assert(l, 'no d1_pc_seen');
  assert(l.d.conn === 'new' && l.d.ice === 'new', 'opening state not recorded: ' + JSON.stringify(l.d));
});
T('M4.3 keepalive channel state is recorded', () => {
  const l = last('d1_ka');
  assert(l && l.d.rs === 'open', 'keepalive state not recorded');
});
T('M4.4 the app video watchdog arming is recorded', () => {
  const l = last('d1_watchdog');
  assert(l && l.d.armed === true, 'watchdog state not recorded');
});

/* ICE and connection transitions — the thing the accepted build never logged. */
pc.__set('iceConnectionState', 'checking');
pc.__set('connectionState', 'connecting');
pc.__set('iceConnectionState', 'connected');
pc.__set('connectionState', 'connected');

T('M4.5 every ICE transition is logged with from → to', () => {
  const t = saw('d1_ice');
  assert(t.length === 2, 'expected 2 ice transitions, got ' + t.length);
  assert(t[0].d.from === 'new' && t[0].d.to === 'checking', 'first ice transition wrong');
  assert(t[1].d.to === 'connected', 'second ice transition wrong');
});
T('M4.6 every connection transition is logged with from → to', () => {
  const t = saw('d1_conn');
  assert(t.length === 2, 'expected 2 conn transitions, got ' + t.length);
  assert(t[1].d.from === 'connecting' && t[1].d.to === 'connected', 'conn transition wrong');
});
T('M4.7 a candidate error from the TURN server is logged', () => {
  pc.__fire('icecandidateerror', { errorCode: 701, url: 'turn:turn.example:3478', errorText: 'allocation failed' });
  const l = last('d1_cand_err');
  assert(l && l.d.code === 701, 'candidate error not logged');
});

/* ── M5 · THE FREEZE IS MEASURED, NOT INFERRED ───────────────────────────── */
console.log('M5 · the freeze itself');

function stats(bytes, frames) {
  return [
    { id: 'p', type: 'candidate-pair', state: 'succeeded', nominated: true, selected: true,
      localCandidateId: 'l', remoteCandidateId: 'r', currentRoundTripTime: 0.04 },
    { id: 'l', type: 'local-candidate', candidateType: 'relay' },
    { id: 'r', type: 'remote-candidate', candidateType: 'relay' },
    { id: 'v', type: 'inbound-rtp', kind: 'video', bytesReceived: bytes, framesDecoded: frames, packetsLost: 0, frameHeight: 720 },
    { id: 'o', type: 'outbound-rtp', kind: 'video', bytesSent: bytes }
  ];
}

pc.__setStats(stats(1000, 30));
w.TBD1.sample(); await sleep(30);
pc.__setStats(stats(2000, 60));
w.TBD1.sample(); await sleep(30);

T('M5.1 a healthy sample records the media path as relay (TURN in use)', () => {
  const l = last('d1_stats');
  assert(l, 'no d1_stats');
  assert(l.d.path === 'relay/relay', 'path not recorded: ' + l.d.path);
  assert(l.d.inF === 30, 'frame delta not recorded: ' + l.d.inF);
  assert(l.d.rtt === 40, 'rtt not recorded');
});

const relayProbes = () => w.__pcs.filter((p) => p.__cfg && p.__cfg.iceTransportPolicy === 'relay');
const probesBeforeFreeze = relayProbes().length;

/* Video stops. Nothing else changes — connectionState stays 'connected', which
   is exactly the case the accepted build cannot see. */
pc.__setStats(stats(2000, 60));
w.TBD1.sample(); await sleep(30);
pc.__setStats(stats(2000, 60));
w.TBD1.sample(); await sleep(60);

T('M5.2 video death is detected while the connection still reads connected', () => {
  const l = last('d1_video_dead');
  assert(l, 'freeze not detected');
  assert(l.d.conn === 'connected', 'should have fired with conn=connected, got ' + l.d.conn);
  assert(l.d.path === 'relay/relay', 'path not carried into the freeze line');
});
T('M5.3 the freeze line carries what is needed to adjudicate the cause', () => {
  const d = last('d1_video_dead').d;
  for (const k of ['ka', 'wd', 'rs', 'ice', 'net']) assert(k in d, 'freeze line missing ' + k);
});
T('M5.4 the freeze itself launches a TURN probe', () => {
  /* The probe reports only once it has an answer, so what is asserted here is
     that the freeze LAUNCHED one — a relay-only connection that did not exist
     before the picture stopped. Counting is deliberate: a probe already exists
     from the interval, so "a probe exists" would prove nothing. */
  const after = relayProbes();
  assert(after.length === probesBeforeFreeze + 1,
    'freeze did not launch a probe (before ' + probesBeforeFreeze + ', after ' + after.length + ')');
  assert(after[after.length - 1].__closed === false, 'probe closed before it could answer');
});
T('M5.5 a probe that gets a relay candidate reports reachable, and closes', () => {
  const probe = relayProbes()[relayProbes().length - 1];
  probe.__fire('icecandidate', { candidate: { type: 'relay', candidate: 'candidate:1 1 udp 1 1.2.3.4 1 typ relay' } });
  const l = last('d1_turn_probe');
  assert(l.d.ok === true && l.d.relay === 1, 'relay candidate not counted: ' + JSON.stringify(l.d));
  assert(probe.__closed === true, 'probe connection not closed after answering');
});
T('M5.5b a probe that gets NO relay candidate reports unreachable', () => {
  /* The case the whole release turns on. If this reads "ok" when TURN never
     answered, the evidence is worthless. */
  w.TBD1.turnProbe('harness_negative');
  const probe = relayProbes()[relayProbes().length - 1];
  probe.__fire('icecandidateerror', { errorCode: 701, url: 'turn:turn.example:3478', errorText: 'allocation failed' });
  probe.__fire('icecandidate', { candidate: null });
  const l = last('d1_turn_probe');
  assert(l.d.why === 'harness_negative', 'wrong probe reported: ' + JSON.stringify(l.d));
  assert(l.d.ok === false && l.d.relay === 0, 'no-relay probe reported reachable: ' + JSON.stringify(l.d));
  assert(l.lvl === 'error', 'an unreachable relay was not logged at error level');
  assert(l.d.err && l.d.err.length > 0, 'the candidate error was not carried into the probe result');
});
T('M5.6 the probe reuses the live connection config — no new credential fetch', () => {
  const urls = JSON.stringify(relayProbes()[relayProbes().length - 1].__cfg.iceServers);
  assert(urls.indexOf('turn:turn.example:3478') !== -1, 'probe did not reuse the call iceServers');
});

pc.__setStats(stats(4000, 90));
w.TBD1.sample();
await sleep(60);
T('M5.7 video coming back is recorded too', () => {
  const l = last('d1_video_resumed');
  assert(l, 'recovery of the picture not recorded');
  assert(typeof l.d.deadMs === 'number', 'how long it was dead not recorded');
});

const moved = stats(5000, 120).map((r) => (r.id === 'l' ? { id: 'l', type: 'local-candidate', candidateType: 'srflx' } : r));
pc.__setStats(moved);
w.TBD1.sample();
await sleep(60);
T('M5.8 a mid-call path change is called out', () => {
  const l = last('d1_path_change');
  assert(l, 'path change not logged');
  assert(l.d.from === 'relay/relay' && l.d.to === 'srflx/relay', 'path change wrong: ' + JSON.stringify(l.d));
});

T('M5.9 the app recovery ladder is observed without being touched', () => {
  CALL.recoveryStep = 1;
  w.TBD1.tick();
  const l = last('d1_recovery_step');
  assert(l && l.d.to === 1, 'recovery step not observed');
});
T('M5.10 a disconnect during the call is logged as a transition', () => {
  pc.__set('connectionState', 'disconnected');
  const l = last('d1_conn');
  assert(l.d.to === 'disconnected' && l.lvl === 'warn', 'disconnect not logged at warn');
});
T('M5.11 backgrounding during a call is recorded', () => {
  Object.defineProperty(w.document, 'hidden', { value: true, configurable: true });
  w.document.dispatchEvent(new w.Event('visibilitychange'));
  const l = last('d1_vis');
  assert(l && l.d.hidden === true, 'visibility change during a call not recorded');
});
T('M5.12 losing the network during a call is recorded', () => {
  w.dispatchEvent(new w.Event('offline'));
  const l = last('d1_net');
  assert(l && l.d.on === false, 'offline not recorded');
});
T('M5.13 call end is summarised', () => {
  CALL.active = false;
  w.TBD1.tick();
  const l = last('d1_call_end');
  assert(l && l.d.samples > 0, 'call end not summarised');
});

/* ── M6 · THE BASELINE CALL PATH IS UNDISTURBED ──────────────────────────── */
console.log('M6 · the baseline is still itself');

T('M6.1 the recovery ladder functions are the baseline ones', () => {
  for (const f of ['setupPC', 'runRecovery', 'startKeepalive', 'startVideoWatchdog', 'armConnectTimeout']) {
    assert(typeof CALL[f] === 'function', 'CALL.' + f + ' missing');
    assert(!/TBD1|d1_/.test(String(CALL[f])), 'CALL.' + f + ' was rewritten by the instrument');
  }
});
T('M6.2 the connect timeout is still 20s — not retuned by this build', () => {
  assert(CALL.CONNECT_TIMEOUT_MS === 20000, 'CONNECT_TIMEOUT_MS changed: ' + CALL.CONNECT_TIMEOUT_MS);
});
T('M6.3 the instrument never replaced log()', () => {
  assert(!/^\s*log\s*=/m.test(part), 'part assigns to log');
});

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
