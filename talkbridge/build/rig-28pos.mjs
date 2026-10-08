/* The 28·post-ship rig: two phones per build in identical jsdom rigs, the whole
   28·ship script (relay, call, room lifecycle) and the 28·post-ship script
   (render path, shallow sweep), the snapshot and the diff. Shared by
   harness-diff-28pos (flattening identity) and harness-fixes-28pos (the
   declared behaviour changes). */
import { JSDOM, VirtualConsole } from 'jsdom';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const clock = { t: 1758400000000 };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function makeWindow(html, tag, dev, seed) {
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
      w.speechSynthesis = { __spoken: [], speak(u) { this.__spoken.push([u && u.text, u && u.lang]); }, cancel() { this.__spoken.push('cancel'); }, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
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
export function wire(a, b) {
  const link = { up: true, sent: { a: [], b: [] } };
  const mk = (to, key) => ({ get readyState() { return link.up ? 1 : 3; }, send(s) { link.sent[key].push(s); const d = JSON.parse(s); setTimeout(() => { try { to.w.handleRelay(d); } catch (e) { to.errors.push('handleRelay: ' + e.message); } }, 0); }, close() {}, addEventListener() {} });
  const sa = mk(b, 'a'), sb = mk(a, 'b');
  link.rewire = () => { a.w._relayWs = sa; b.w._relayWs = sb; };
  link.rewire();
  return link;
}
export function enterRoom(inst, role) {
  const w = inst.w;
  const room = { id: 'gate-room', role, title: 'Gate', myLang: 'en', theirLang: 'th', joined: false, myName: role === 'creator' ? 'Ann' : 'Bo' };
  w.S.rooms = [room, { id: 'bg-room', role: 'creator', title: 'Back', myLang: 'en', theirLang: 'th', joined: true, myName: 'Ann' }];
  w.S.roomId = room.id; w.S.view = 'room'; w.S.user = w.S.user || {}; w.S.user.name = room.myName;
  return room;
}
export async function rig(html, tagPrefix) {
  const X = makeWindow(html, tagPrefix + 'Ann', 'aaaa1111-0000-4000-8000-000000000001', 11);
  const Y = makeWindow(html, tagPrefix + 'Bo', 'bbbb2222-0000-4000-8000-000000000002', 22);
  await sleep(1300);
  const link = wire(X, Y);
  enterRoom(X, 'creator'); enterRoom(Y, 'joiner');
  X.w.debugLog.length = 0; Y.w.debugLog.length = 0;
  return { X, Y, link };
}
export const tick = (ms) => { clock.t += ms; };
/* run every pending interval callback once, in registration order (the watchdogs tick on real timers; the rig turns them by hand) */
export function captureIntervals(w) { const ivs = []; w.setInterval = (fn, ms) => { const id = { fn, ms, on: true }; ivs.push(id); return id; }; w.clearInterval = (id) => { if (id && typeof id === 'object') id.on = false; }; return () => ivs.filter((i) => i.on).forEach((i) => { try { i.fn(); } catch (_) {} }); }
/* the relay script of 28·base, verbatim, then the call */
export async function drive(R) {
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

  /* ── the room lifecycle (cluster 3) ─────────────────────────────────── */
  link.rewire();
  const XD = X.w.document, $x = (id) => XD.getElementById(id);
  X.w.S.user.name = 'Ann'; X.w.S.view = 'room';
  /* 1 · the create sheet: opened, named, a name-in-this-chat typed, created → captured, pending-create applied on entry, entered */
  tick(10); X.w.openS3(); R.s3 = [snapS3(X)];
  $x('s3-my').value = 'en'; $x('s3-their').value = 'th'; if ($x('s3-name')) $x('s3-name').value = 'Picnic'; if ($x('s3-myname')) $x('s3-myname').value = 'Annie';
  /* the rig never ran the base boot (jsdom is not standalone, so the P2 gate holds), so the create button's own listener is not wired; the L capture listener is. Click for the capture, then do exactly what the base listener does. */
  tick(10); $x('s3-ok').click();
  { const my = $x('s3-my').value, their = $x('s3-their').value; const room = { id: X.w.uid(), role: 'creator', title: '', partnerName: '', myLang: my, theirLang: their, myName: X.w.S.user.name, autoRead: $x('s3-autoread').classList.contains('on'), muted: false, goBtn: true, meta: 'top', createdAt: X.w.Date.now(), lastAt: X.w.Date.now(), joined: false, unread: 0 }; X.w.S.rooms.push(room); X.w.saveRooms(); $x('m-s3').classList.remove('show'); try { X.w.enterRoom(room.id); } catch (e) { (R.errs = R.errs || []).push('create: ' + e.message); } }
  await sleep(40);
  const created = X.w.S.rooms.filter((r) => r.title === 'Picnic')[0]; R.created = created ? { id: created.id, myName: created.myName, title: created.title, role: created.role } : null;
  /* 2 · invite links: the new room, the background room, and the new room granting */
  R.inv = [];
  try { R.inv.push(X.w.invUrl(X.w.activeRoom())); } catch (e) { R.inv.push('ERR ' + e.message); }
  try { R.inv.push(X.w.invUrl(X.w.roomById('bg-room'))); } catch (e) { R.inv.push('ERR ' + e.message); }
  try { const g = X.w.activeRoom(); g.grant = true; g.grantExpires = clock.t + 86400000; R.inv.push(X.w.invUrl(g)); } catch (e) { R.inv.push('ERR ' + e.message); }
  /* 3 · switch rooms (the leave path), back, the same room again (early return — in this rig the left panel does not exist, so the base throws there; the throw is recorded and compared), an unknown room */
  R.errs = R.errs || []; const tryEnter = (id) => { try { X.w.enterRoom(id); } catch (e) { R.errs.push('enterRoom(' + id + '): ' + e.message); } };
  tick(10); tryEnter('bg-room'); await sleep(30);
  tick(10); tryEnter(created ? created.id : 'gate-room'); await sleep(30);
  tick(10); tryEnter(created ? created.id : 'gate-room'); tryEnter('no-such-room'); await sleep(20);
  /* 3b · leave outright (the flat leave, called as the home screen does), then enter from nowhere — the one path that advances the generation on entry; then an entry that carries an invite payload for this very room */
  tick(10); try { X.w.leaveRoomInternals(); } catch (e) { R.errs.push('leave: ' + e.message); } await sleep(20);
  tick(10); tryEnter(created ? created.id : 'gate-room'); await sleep(30);
  X.w.S.invitePayload = { r: created ? created.id : 'gate-room', ml: 'th', tl: 'en', n: 'Zed', t: 'Picnic again' };
  tick(10); try { X.w.leaveRoomInternals(); } catch (e) { R.errs.push('leave2: ' + e.message); } tryEnter(created ? created.id : 'gate-room'); await sleep(30);
  X.w.S.invitePayload = null;
  /* 4 · the sheet again (the name field is prefilled now), then closed */
  tick(10); X.w.openS3(); R.s3.push(snapS3(X)); $x('m-s3').classList.remove('show');
  /* 5 · the other phone joins from a plain invite, then from a grant invite, then tries with no name at all */
  const YD = Y.w.document;
  Y.w.S.user.name = 'Bo';
  tick(10); Y.w.joinRoom({ r: 'inv-plain', n: 'Cy', t: 'Side', ml: 'en', tl: 'th', k: '', tid: '', tok: '' }); await sleep(40);
  tick(10); Y.w.joinRoom({ r: 'inv-grant', n: 'Dee', t: 'Grant', ml: 'en', tl: 'th', g: 1, exp: clock.t + 500000000, k: 'dg-granted', tid: 'tid-granted', tok: 'tok-granted' }); await sleep(40);
  Y.w.S.user.name = ''; YD.getElementById('s10-name').value = '   '; tick(10); Y.w.joinRoom({ r: 'inv-noname', n: 'Ed', ml: 'en', tl: 'th' }); await sleep(10);
  R.join = { err: YD.getElementById('s10-err').style.display, name: Y.w.S.user.name, roomId: Y.w.S.roomId };
  Y.w.S.user.name = 'Bo';
  await sleep(50);

  /* ── the render path (cluster 4) ─────────────────────────────────────── */
  link.rewire();
  X.w.S.view = 'room';
  /* the left panel chrome, as boot builds it (the rig never booted) */
  { const app = XD.getElementById('app'); const scrim = XD.createElement('div'); scrim.className = 'left-scrim'; scrim.id = 'left-scrim'; const panel = XD.createElement('div'); panel.className = 'left-panel'; panel.id = 'left-panel'; panel.innerHTML = '<div class="left-top"><div class="left-clock" id="left-clock"></div></div><div class="left-body" id="panel-body"></div><button class="fab" id="panel-fab">+</button>'; app.appendChild(scrim); app.appendChild(panel); }
  /* rooms of every shape */
  const mk = (o) => Object.assign({ role: 'creator', myLang: 'en', theirLang: 'th', joined: true, myName: 'Ann', partnerName: 'Pat', createdAt: clock.t - 100000, lastAt: clock.t - 50000, meta: 'top', unread: 0 }, o);
  X.w.S.rooms.push(mk({ id: 'rm-muted', title: 'Muted', muted: true, unread: 3 }));
  X.w.S.rooms.push(mk({ id: 'rm-bin-1', title: 'Binned one', deletedAt: clock.t - 1000 }));
  X.w.S.rooms.push(mk({ id: 'rm-bin-2', title: 'Binned two', deletedAt: clock.t - 2000 }));
  X.w.S.rooms.push(mk({ id: 'rm-inv', title: 'Threaded', threadInvites: [{ id: 'thr-a', name: 'Alpha', from: 'Pat', at: clock.t }, { id: 'thr-b', name: 'Beta', from: 'Pat', at: clock.t }] }));
  X.w.S.rooms.push(mk({ id: 'rm-locked', title: 'Locked', sendLocked: true }));
  { const w = X.w.waitingOf(X.w.roomById('bg-room')); w.chat = 2; w.voice = 1; }
  X.w.saveRooms();
  const count = (ev) => X.w.debugLog.filter((l) => l.ev === ev).length;
  R.render = {};
  /* 1 · a burst of three renders: one synchronous, the rest collapsed into one trailing render */
  const b0 = count('rc_panel_rendered'), c0 = count('t1_coalesced');
  tick(10); X.w.renderPanel(); X.w.renderPanel(); X.w.renderPanel();
  R.render.burstSync = count('rc_panel_rendered') - b0;
  { const sentinel = XD.createElement('i'); sentinel.id = 'fl4-sentinel'; $x('panel-body').appendChild(sentinel); }   /* the trailing render rebuilds the panel and takes this with it */
  await sleep(120);
  R.render.trailing = !XD.getElementById('fl4-sentinel'); R.render.coalesced = count('t1_coalesced') - c0;
  R.render.panel = $x('panel-body').innerHTML; R.render.home = ($x('home-wrap') || {}).innerHTML || null; R.render.fab = $x('panel-fab').style.display;
  const tap = (sel) => { const el = $x('panel-body').querySelector(sel); (R.render.taps = R.render.taps || []).push(sel + ':' + !!el); if (el) el.click(); };
  /* 2 · the bin opened, a room restored, one deleted for good */
  tick(10); $x('bin-head').click(); R.render.binOpen = [!!X.w.renderPanel._binOpen, $x('bin-sec').className]; await sleep(60);
  tick(10); tap('[data-restore="rm-bin-1"]'); await sleep(60);
  tick(10); tap('[data-harddel="rm-bin-2"]'); await sleep(60);
  R.render.afterBin = $x('panel-body').innerHTML;
  /* 3 · a thread asked for, an invite accepted and one declined, a room soft-deleted from its card, a card tapped (into the muted room) */
  tick(10); tap('[data-thread="rm-inv"]'); R.render.threadModal = [!!$x('m-p6'), $x('m-p6') ? $x('m-p6').className : null, $x('m-p6') ? $x('m-p6').dataset.parent : null]; if ($x('m-p6')) $x('m-p6').classList.remove('show');
  tick(10); tap('.p6-inv[data-p6-thread="thr-a"] [data-p6-accept]'); await sleep(60);
  tick(10); tap('.p6-inv[data-p6-thread="thr-b"] [data-p6-decline]'); await sleep(60);
  tick(10); tap('.rc2[data-room="rm-locked"] [data-del]'); await sleep(60);
  X.w.S.panelOpen = true; $x('left-panel').classList.add('open');
  tick(10); tap('.rc2[data-room="rm-muted"]'); await sleep(60);
  R.render.afterCards = { panel: $x('panel-body').innerHTML, roomId: X.w.S.roomId, panelOpen: X.w.S.panelOpen, panelCls: $x('left-panel').className };
  /* 4 · the home screen: rendered on its own, a home card dismissed by tapping it (opens the room) */
  tick(10); X.w.renderHome(); await sleep(60);
  R.render.homeAlone = $x('home-wrap').innerHTML;
  { const w = X.w, orig = w.suppressPasswordUI; let n = 0; w.suppressPasswordUI = function () { n++; return orig.apply(this, arguments); }; tick(10); w.renderHome(); R.render.npOnRender = n; w.suppressPasswordUI = orig; await sleep(60); }   /* the NP layer sweeps synchronously on every redraw */
  tick(10); { const hc = $x('home-wrap').querySelector('.rc2[data-where="home"]'); R.render.homeCard = hc ? hc.dataset.room : null; if (hc) hc.click(); } await sleep(60);
  R.render.homeAfter = { html: $x('home-wrap').innerHTML, dismissed: JSON.stringify(X.w.homeDismissed()), roomId: X.w.S.roomId };
  /* 5 · the room head and its name popup, toggled */
  { const r = X.w.activeRoom(); r.lastSeenAt = clock.t - 5000; }
  tick(10); X.w.renderRoomHead(); const ht = $x('room-head-title');
  R.render.head = [{ text: ht.textContent, title: ht.parentNode.title, wired: ht.dataset.rmWired || null, cursor: ht.style.cursor }];
  tick(10); ht.click(); R.render.head.push({ pop: !!XD.getElementById('rm-pop'), popHtml: (XD.getElementById('rm-pop') || {}).innerHTML || null });
  tick(10); ht.click(); R.render.head.push({ pop: !!XD.getElementById('rm-pop') });
  tick(10); X.w.renderRoomHead(); R.render.head.push({ wired: ht.dataset.rmWired || null });
  /* 6 · the transcript: every entry kind, painted live and then in bulk under each meta layout */
  tick(10); X.w.enterRoom(created ? created.id : 'gate-room'); await sleep(40);
  X.w._ftFailed = true;
  X.w.__fetchPlan = (u) => /translate_a\/single/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([[['ข้อความ **หนา** และ [ลิงก์](https://example.org)', 'A message **bold** and a [link](https://example.org)', null, null]], null, 'en']), text: () => Promise.resolve('') }) : null;
  { const r = X.w.activeRoom(); r.sendLocked = false; r.theirLang = 'th'; r.myLang = 'en'; }
  tick(10); await X.w.sendChatText('A message **bold** and a [link](https://example.org)', null, 'typed'); await sleep(60);
  tick(10); await X.w.sendChatText('With a picture', { dataUrl: 'data:image/png;base64,iVBORw0KGgo=', type: 'image/png', name: 'pic.png' }, 'typed'); await sleep(60);
  X.w.__fetchPlan = null;
  tick(10); yx({ type: 'chat-msg', chatId: 'cm-said', srcText: 'hello friend', tgtText: 'สวัสดีเพื่อน', srcLang: 'en', tgtLang: 'th', senderName: 'Bo', origin: 'voice', eventId: 'ev-said', said: 'hola amigo', saidLang: 'es' }); await sleep(40);
  tick(10); yx({ type: 'chat-msg', chatId: 'cm-md', srcText: '# Heading\n- one\n- two', tgtText: '# หัวข้อ\n- หนึ่ง\n- สอง', srcLang: 'th', tgtLang: 'en', senderName: 'Bo', origin: 'typed', eventId: 'ev-md' }); await sleep(40);
  const tr = X.w.transcript;
  tr.push({ id: 'sp-voice', kind: 'speech', who: 'me', ts: clock.t, sourceText: 'said in a voice call', translatedText: 'พูดในสายเสียง', srcLang: 'en', tgtLang: 'th', origin: 'spoken', callKind: 'voice', senderName: 'Ann' });
  tr.push({ id: 'sp-video', kind: 'speech', who: 'partner', ts: clock.t, sourceText: 'พูดในวิดีโอ', translatedText: 'said on video', srcLang: 'th', tgtLang: 'en', origin: 'spoken', callKind: 'video', senderName: 'Bo' });
  tr.push({ id: 'sp-mic', kind: 'speech', who: 'me', ts: clock.t, sourceText: 'plain speech', translatedText: 'คำพูดธรรมดา', srcLang: 'en', tgtLang: 'th', origin: 'spoken', senderName: 'Ann', translationFailed: true });
  tr.push({ id: 'ph-1', kind: 'chat', who: 'me', ts: clock.t, sourceText: 'from the phrasebook', translatedText: 'จากหนังสือวลี', srcLang: 'en', tgtLang: 'th', origin: 'phrase', senderName: 'Ann', receipt: 'delivered', deliveredAt: clock.t });
  tr.push({ id: 'rd-1', kind: 'chat', who: 'me', ts: clock.t + 86400000, sourceText: 'read the next day', translatedText: 'อ่านวันถัดไป', srcLang: 'en', tgtLang: 'th', origin: 'typed', senderName: 'Ann', receipt: 'read', readAt: clock.t + 86400000 });
  tr.push({ id: 'md-list', kind: 'chat', who: 'partner', ts: clock.t + 86400000, sourceText: '- หนึ่ง\n- สอง', translatedText: '- one\n- two', srcLang: 'th', tgtLang: 'en', origin: 'typed', senderName: 'Bo' });   /* the wire's norm() folds newlines, so the list reaches the painter only from storage */
  tr.push({ id: 'sys-1', kind: 'sys', who: 'sys', ts: clock.t + 86400000, text: 'Bo joined' });
  X.w.saveTr();
  R.render.doms = [];
  for (const meta of ['top', 'bottom', 'off']) { X.w.activeRoom().meta = meta; tick(10); X.w.renderTranscript(); X.w.renderTranscript(); await sleep(120); R.render.doms.push(($x('transcript').innerHTML || '').replace(CHECK_BTN, '')); }
  X.w.activeRoom().meta = 'top';
  tick(10); X.w.S.view = 'home'; X.w.appendMsgDom({ id: 'off-view', kind: 'chat', who: 'me', ts: clock.t, sourceText: 'not painted', translatedText: 'x', srcLang: 'en', tgtLang: 'th' }); X.w.S.view = 'room'; R.render.offViewPainted = !!$x('transcript').querySelector('[data-id="off-view"]');
  R.render.saidIds = tr.filter((e) => e.said).map((e) => e.id + ':' + e.said + ':' + e.saidLang);
  await sleep(50);

  /* ── the shallow sweep (cluster 5) ─────────────────────────────────────── */
  R.sweep = {};
  const sp = X.w.speechSynthesis; sp.__spoken.length = 0;
  tick(10); X.w.speakText('Say **this** and [that](https://example.org)', 'en'); X.w.speakText('', 'en'); X.w.speakText('ไทย', 'th');
  R.sweep.spoken = sp.__spoken.slice();
  { const r = X.w.activeRoom(); r.theme = { hdrBg: '#ABCDEF' }; } tick(10); X.w.applyBubbleTheme(); R.sweep.theme = [(($x('bubble-theme-tag') || {}).textContent || '').slice(-80), ($x('s4b-hdr-bg') || {}).value || null];
  R.sweep.links = [X.w.linkDeviceUrl(X.w.activeRoom()), X.w.linkDeviceUrl(X.w.roomById('bg-room'))];
  R.sweep.ids = [X.w.uid(), X.w.uid()];
  /* speech lines: plain; the same id reissued (the identifier proof); the same words at once (deduplicated); the partner's never deduplicated; one inside a video call (the call kind) */
  tick(10); X.w.addSpeech('me', 'first line spoken', 'บรรทัดแรก', 'en', 'th', 'seq-1', false);
  tick(10); X.w.addSpeech('me', 'second line spoken', 'บรรทัดสอง', 'en', 'th', 'seq-1', false);
  tick(10); X.w.addSpeech('me', 'first line spoken', 'บรรทัดแรก', 'en', 'th', 'seq-2', false);
  tick(10); X.w.addSpeech('partner', 'บรรทัดแรก', 'first line spoken', 'th', 'en', 'seq-3', false);
  CX.active = true; CX.kind = 'video'; tick(10); X.w.addSpeech('me', 'said during video', 'พูดระหว่างวิดีโอ', 'en', 'th', 'seq-4', false); CX.active = false; CX.kind = null;
  /* the Deepgram final: a stale generation dropped; a live one normalized and added */
  tick(10); await X.w.onDGFinal('stale words', X.w.GEN.n - 1, 'en'); await sleep(20);
  tick(10); await X.w.onDGFinal('fresh words from the microphone', X.w.GEN.n, 'en'); await sleep(80);
  /* transcription: suppressed while muted on a call; opened otherwise (no key); stopped */
  CX.active = true; CX.micOn = false; tick(10); X.w.startDeepgram(); CX.active = false; CX.micOn = true;
  tick(10); X.w.startDeepgram(); await sleep(30); tick(10); X.w.stopDeepgram(); await sleep(20);
  /* the drawer: blocked over a blank room name, then closed */
  tick(10); $x('drawer-s4b').classList.add('open'); if ($x('s4b-title')) $x('s4b-title').value = '   '; X.w.closeDrawer(); R.sweep.drawer = [$x('drawer-s4b').className];
  if ($x('s4b-title')) $x('s4b-title').value = X.w.activeRoom().title || 'Named'; if ($x('s4b-name')) $x('s4b-name').value = 'Annika'; tick(10); X.w.closeDrawer(); await sleep(30); R.sweep.drawer.push($x('drawer-s4b').className, X.w.activeRoom().myName);
  /* a chat arriving while the phone is hidden counts as unread; the R layer turns the legacy count into a waiting bump (the relay owns the count: cr3_bump_ignored) */
  try { Object.defineProperty(XD, 'hidden', { value: true, configurable: true }); } catch (_) {}
  const bumps0 = X.w.debugLog.filter((l) => l.ev === 'cr3_bump_ignored' && l.d && l.d.kind === 'chat').length;
  tick(10); yx({ type: 'chat-msg', chatId: 'cm-hidden', srcText: 'while hidden', tgtText: 'ขณะซ่อน', srcLang: 'en', tgtLang: 'th', senderName: 'Bo', origin: 'typed', eventId: 'ev-hidden' }); await sleep(40);
  try { Object.defineProperty(XD, 'hidden', { value: false, configurable: true }); } catch (_) {}
  R.sweep.unreadAfterHidden = X.w.activeRoom().unread || 0;   /* stays 0: the R layer hands the count to the relay's projection */
  R.sweep.bumpsAfterHidden = X.w.debugLog.filter((l) => l.ev === 'cr3_bump_ignored' && l.d && l.d.kind === 'chat').length - bumps0;
  /* this phone's own line in the other language: normalized before it leaves, and what was said rides with it (X3 on the sender, said_kept on the receiver) */
  X.w.__fetchPlan = (u) => /translate_a\/single.*sl=th&tl=en/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([[['thank you very much', 'ขอบคุณมาก', null, null]], null, 'th']), text: () => Promise.resolve('') }) : /translate_a\/single.*sl=en&tl=th/.test(u) ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([[['ขอบคุณมากครับ', 'thank you very much', null, null]], null, 'en']), text: () => Promise.resolve('') }) : null;
  link.rewire(); tick(10); await X.w.sendChatText('ขอบคุณมาก', null, 'typed'); await sleep(80); X.w.__fetchPlan = null;
  R.sweep.ownSaid = (X.w.transcript.filter((e) => e.said && e.who === 'me').slice(-1)[0] || {}).said || null;
  /* a send into a room the partner left is blocked (L) */
  { const r = X.w.activeRoom(); r.sendLocked = true; tick(10); await X.w.sendChatText('blocked text', null, 'typed'); r.sendLocked = false; }
  /* notifications are the relay's; the partner-state writer is retired */
  tick(10); X.w.osNotify('T', 'B', 'gate-room'); R.sweep.partnerState = X.w.renderPartnerState() === undefined;
  /* the receipt popup on an own chat line */
  X.w.activeRoom().meta = 'top'; tick(10); X.w.renderTranscript(); await sleep(120);
  { const rc = $x('transcript').querySelector('.msg.mine [data-receipt]'); R.sweep.receipt = !!rc; if (rc) { tick(10); rc.click(); R.sweep.receiptPop = [$x('status-pop').style.display, $x('status-pop').textContent, (XD.getElementById('rm-pop') || {}).innerHTML || null]; } }
  /* a stale rename signal (K4) and a fresh one */
  { const r = X.w.activeRoom(); r.titleTs = clock.t; tick(10); yx({ type: 'sys-pill', text: 'Bo renamed the room to Old', pillId: 'sp-k4a', newRoomName: 'Old', wasRoomName: r.title, byName: 'Bo', ts: clock.t - 50000 }); await sleep(30); R.sweep.titles = [r.title]; tick(10); yx({ type: 'sys-pill', text: 'Bo renamed the room to Newer', pillId: 'sp-k4b', newRoomName: 'Newer', wasRoomName: r.title, byName: 'Bo', ts: clock.t + 10 }); await sleep(30); R.sweep.titles.push(r.title, r.titleTs ? 'N' : null); }
  /* the phrasebook: a card added, listed and dressed; a tag added; the target edited (mirrored) and the source edited; a write-back, then one refused and merged */
  tick(10); X.w.pbAddCard({ source: 'good morning', target: 'สวัสดีตอนเช้า', sourceLang: 'en', targetLang: 'th' });
  const card = (X.w.PB.cards || [])[0]; R.sweep.card = card ? card.id : null;
  tick(10); X.w.renderPbList();
  if (card) { X.w._pbCS(card.id).tagsOpen = true; tick(10); X.w.pbRerenderCard(card.id); }   /* the tag field is only rendered when the card's tags are open; D10 dresses it and keeps focus in it */
  if (card) { tick(10); X.w.pbAddTagTo(card.id, 'greeting'); tick(10); X.w.pbRerenderCard(card.id); tick(10); X.w.pbCommitEdit(card.id, 'target', 'สวัสดีตอนเช้าครับ'); tick(10); X.w.pbCommitEdit(card.id, 'source', 'good morning!'); }
  await sleep(100);
  R.sweep.pb = { list: ($x('pb-ov-cards') || {}).innerHTML || null, forms: ($x('pb-ov-cards') ? $x('pb-ov-cards').querySelectorAll('form[data-tagform] [data-taginp]').length : -1), cards: JSON.parse(JSON.stringify(X.w.PB.cards || [])) };
  tick(10); const wb0 = await X.w.pbWriteBack();                                                       /* no token: nothing sent */
  X.w.localStorage.setItem('tb_gh_pat', 'ghp_rig'); tick(10); const wb1 = await X.w.pbWriteBack();     /* the rig's network fails: pending */
  X.w.__fetchPlan = (u) => /api\.github\.com.*\?ref=main/.test(u) ? Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null), text: () => Promise.resolve('') }) : /api\.github\.com\/repos/.test(u) ? Promise.resolve({ ok: false, status: 409, json: () => Promise.resolve({}), text: () => Promise.resolve('') }) : null;
  tick(10); const wb2 = await X.w.pbWriteBack(); await sleep(60);                                      /* refused (409): K2 pulls to merge; the pull fails in the rig → pb_merge_err */
  X.w.__fetchPlan = null; X.w.localStorage.removeItem('tb_gh_pat');
  R.sweep.wb = [wb0 && wb0.status, wb1 && wb1.status, wb2 && wb2.status, X.w.PB.version];
  await sleep(50);
}
export function snapS3(inst) { const d = inst.w.document, m = d.getElementById('m-s3'); return { show: m.classList.contains('show'), html: m.innerHTML, myname: (d.getElementById('s3-myname') || {}).value || null, my: d.getElementById('s3-my').value, their: d.getElementById('s3-their').value }; }
export function snapN10(inst) { const d = inst.w.document, ov = d.getElementById('n10-out'); return ov ? { show: ov.classList.contains('show'), name: d.getElementById('n10-name').textContent, sub: d.getElementById('n10-sub').textContent, parent: ov.parentNode && ov.parentNode.id, timer: d.getElementById('rz-timer').textContent, cls: d.getElementById('scr-room').className } : null; }
export const mask = (v, k) => {
  if (typeof v === 'number' && (v > 1e11 || /^(ms|livedMs|t|at|dur|elapsed|sinceMs|exp)$/.test(k || ''))) return 'N';
  if (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) return 'ISO';
  if (typeof v === 'string' && /ice-ufrag:u\d+/.test(v)) return v.replace(/ice-ufrag:u\d+/g, 'ice-ufrag:uN');
  if (Array.isArray(v)) return v.map((x) => mask(x));
  if (v && typeof v === 'object') { const o = {}; for (const kk of Object.keys(v).sort()) o[kk] = mask(v[kk], kk); return o; }
  return v;
};
export const CHECK_BTN = /<button class="tr-act-btn" data-hact="check" title="Translation check">[\s\S]*?<\/button>/g;
export const HOUSEKEEPING = new Set(['r8_menu_labels', 'p4_ctx_save_failed', 't1_coalesced', 'md1_rendered', 'rc_panel_no_body', 'rc_panel_rendered', 'rc_home_rendered', 'nopw_swept']);   /* nopw_swept rides the MutationObserver's microtask batching against real frame timing — counted, not ordered; the NP layer on renderHome is proved by a synchronous probe (render.npOnRender) */
export function snapshot(inst, sentLists, R) {
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
    inv: R.inv || [], s3: R.s3 || [], created: R.created || null, join: R.join || null, errs: R.errs || [], render: mask(R.render || null), sweep: mask(R.sweep || null),
    lifecycle: { roomId: w.S.roomId, view: w.S.view, gen: w.GEN.n, registered: Object.keys(w.p3State.registered).sort(), openPending: mask(w.cr3State.openPending), grant: ['tb_grant', 'tb_grant_dg', 'tb_grant_tid', 'tb_grant_tok'].map((k) => k + '=' + (w.localStorage.getItem(k) || '')), userName: w.S.user.name, menuBtn: w.document.getElementById('room-menu-btn').style.display, s4bTitle: (w.document.getElementById('s4b-title') || {}).value || null, s10err: w.document.getElementById('s10-err').style.display, locked: !!(w.activeRoom() && w.activeRoom().sendLocked) },
    dom: ((w.document.getElementById('transcript') || {}).innerHTML || '').replace(CHECK_BTN, ''),   /* X-2's declared addition is masked here and proved in M3.X */
    room: { cls: w.document.getElementById('scr-room').className, timer: w.document.getElementById('rz-timer').textContent, band: w.document.getElementById('call-band').className, mic: w.document.getElementById('rb-mic').className, cam: w.document.getElementById('rb-cam').className, ring: w.document.getElementById('ring-overlay').className, children: [...w.document.getElementById('scr-room').children].map((c) => c.id || c.className).sort() },
    errors: inst.errors.slice()
  };
}
export function diff(a, b, path, out) {
  if (out.length > 12) return;
  if (typeof a !== typeof b || (a && typeof a === 'object') !== (b && typeof b === 'object')) { out.push(path + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b)); return; }
  if (Array.isArray(a)) { if (a.length !== b.length) out.push(path + '.length ' + a.length + ' ≠ ' + b.length); for (let i = 0; i < Math.min(a.length, b.length); i++) diff(a[i], b[i], path + '[' + i + ']', out); return; }
  if (a && typeof a === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) diff(a[k], b[k], path + '.' + k, out); return; }
  if (a !== b) out.push(path + ': ' + JSON.stringify(a) + ' ≠ ' + JSON.stringify(b));
}


export const KEYS = ['log', 'housekeeping', 'wire', 'sockets', 'listen', 'rooms', 'transcript', 'bgTranscript', 'call', 'pcs', 'keys', 'n10', 'flip', 'ring', 'ring2', 'inv', 's3', 'created', 'join', 'errs', 'lifecycle', 'dom', 'room', 'render', 'sweep', 'errors'];
/* both builds through the same script, snapshots back */
export async function runBoth(htmlA, htmlC, extra) {
  const RA = await rig(htmlA, 'A-'); const t0 = clock.t;
  await drive(RA); if (extra) await extra(RA);
  const snapA = { X: snapshot(RA.X, RA.link.sent.a, RA), Y: snapshot(RA.Y, RA.link.sent.b, RA) };
  clock.t = t0;
  const RC = await rig(htmlC, 'C-');
  await drive(RC); if (extra) await extra(RC);
  const snapC = { X: snapshot(RC.X, RC.link.sent.a, RC), Y: snapshot(RC.Y, RC.link.sent.b, RC) };
  return { RA, RC, snapA, snapC };
}
