/* ═══════════ GAP PART · FL2-call.js ═══════════ */
/* @contract
   replaces: CALL.keys, CALL.start, CALL.onIncoming, CALL.accept, CALL.onAccepted, CALL.mount, CALL.onSignal, CALL.runRecovery, CALL.startVideoWatchdog, CALL.stopVideoWatchdog, CALL.toggleMic, CALL.hangUp, CALL.teardown, camSenders, replaceSenderTrack
   wraps: (none)
   adds: callStartCore, callOnIncomingCore, callAcceptCore, callOnAcceptedCore, callMountCore, callOnSignalCore, callOnSignalGlare, callHangUpCore, callTeardownCore, n10Show, n10Hide, n18Anchor
   licence: §0c-1 (owner, 2026-09-21) — flattening, cluster 2: the call
   note: CALL.setupPC and CALL.toggleCam keep their single definition (C-call-recovery, T-net-robustness) once the dead base members are removed; nothing wrapped them.
*/
/* ─────────────────────────────────────────────────────────────────────────────
   FL-2 · THE CALL, ONE FUNCTION PER SYMBOL (§7.16 cluster 2)

   Every layer that wrapped these symbols is REMOVED from the base bytes (each
   banked byte for byte under talkbridge/fixtures/flatten/28ps/ and named in
   removals.json) and its effect is written here in the order the stack ran
   it: "before" work top-down, the base body, "after" work bottom-up. The
   base bodies are kept verbatim as *Core functions called with the same
   `this`. Blocks whose state was private to their wrapper (the N10 caller
   screen, the N18 anchor, the C3/C2/F1 constants and helpers) moved here
   whole.

   NOTHING NEW. Same log lines, same order, same wire, same early exits, same
   swallowed errors. One inspected difference, recorded in the plan: the N10
   caller-screen overlay is appended to #scr-room from this part's position
   (later in boot), so it sits after any sibling a later part appended; its
   z-index (80) is unchanged.

   Layer order reproduced (outermost first):
     keys          CR3 (after) → base
     start         N10 (after, promise) → A (before) → base
     onIncoming    CR3 (before, may stop) → P4 (after) → base
     accept        N18 (after, promise) → N10 (after, promise) → P4 (around) → A (before) → base
     onAccepted    N18 (after) → N10 (around) → base
     mount         R8b (after) → base
     onSignal      C3 (before, may answer itself) → C glare (before) / armConnectTimeout (after) → base
     runRecovery   C3 (before, joiner step 2) → C body
     start/stopVideoWatchdog   C2 (after / before) → C body
     toggleMic     M (after) → T-net body
     hangUp        c5 (before) → base
     teardown      N10 (before) → R8b (before) → C (before) → A (after) → base
     camSenders    F1 (after) → T-net body
     replaceSenderTrack   F1 (before) → T-net body
   ───────────────────────────────────────────────────────────────────────────── */

/* ── absorbed state and helpers ────────────────────────────────────────────── */
/* N10 (25·base) — the caller's screen and ring-back; the block's own words:
   placing a call must feel like placing a call. */
function n10L(ev, d) { try { if (typeof log === 'function') log(ev, d || {}, 'ok'); } catch (_) {} }
var n10Overlay = null;
(function () {
  if (typeof CALL === 'undefined' || !CALL || typeof RING === 'undefined') return;
  var st = document.createElement('style');
  st.textContent = '#n10-out{position:absolute;inset:0;background:rgba(14,17,18,.97);z-index:80;display:none;'
    + 'flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:30px}'
    + '#n10-out.show{display:flex}#n10-name{font-size:22px;font-weight:700;margin-top:16px}'
    + '#n10-sub{font-size:14px;opacity:.75;margin-top:6px}#n10-mic{font-size:13px;opacity:.6;margin-top:10px}'
    + '#n10-btns{margin-top:30px;display:flex;flex-direction:column;align-items:center;gap:8px}'
    + '#n10-cancel{width:64px;height:64px;border-radius:50%;border:0;background:#c0392b;display:flex;align-items:center;justify-content:center}'
    + '#n10-lb{font-size:13px;opacity:.8}';
  document.head.appendChild(st);
  var ov = document.createElement('div');
  ov.id = 'n10-out';
  ov.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round">'
    + '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
    + '<div id="n10-name"></div><div id="n10-sub"></div>'
    + '<div id="n10-mic">Your microphone is muted until they answer</div>'
    + '<div id="n10-btns"><button id="n10-cancel" aria-label="Cancel call">'
    + '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" transform="rotate(135)">'
    + '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
    + '</button><div id="n10-lb">Cancel</div></div>';
  function mount() { (document.getElementById('scr-room') || document.body).appendChild(ov); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  ov.querySelector('#n10-cancel').addEventListener('click', function () {
    n10L('n10_caller_cancelled', {});
    try { relaySend({ type: 'call-end', reason: 'cancelled' }); } catch (_) {}
    try { CALL.teardown(); } catch (_) {}
  });
  n10Overlay = ov;
})();
function n10Show(kind) {
  if (!n10Overlay) return;
  var room = (typeof activeRoom === 'function') ? activeRoom() : null;
  document.getElementById('n10-name').textContent = (room && (room.partnerName || room.title)) || 'Calling…';
  document.getElementById('n10-sub').textContent = (kind === 'video' ? 'Video call' : 'Voice call') + ' · Ringing…';
  n10Overlay.classList.add('show');
  try { RING.start(); } catch (_) {}          /* the ring-back the caller hears */
}
function n10Hide() { if (!n10Overlay) return; n10Overlay.classList.remove('show'); try { RING.stop(); } catch (_) {} }

/* N18 (D-5) — both clocks anchor at the answer. */
function n18Anchor(who) {
  CALL.startTs = Date.now();
  try { if (typeof stopCallTimer === 'function') stopCallTimer(); } catch (_) {}
  try {
    var el = (typeof $ === 'function') ? $('rz-timer') : document.getElementById('rz-timer');
    if (el && typeof callDuration === 'function') el.textContent = callDuration(CALL.startTs);
    if (typeof startCallTimer === 'function') startCallTimer();
  } catch (_) {}
  try { if (typeof log === 'function') log('n18_anchor', { who: who }, 'ok'); } catch (_) {}
}

/* C3 (27·ship) — the joiner can ask for an ICE restart. */
var C3_HOLD_MS = 8000;   /* mirrors the creator's step-2 release            */
var C3_MIN_GAP_MS = 8000;/* two detectors cannot make the creator restart twice */
CALL._c3LastServed = 0;
CALL._c3Pending = false;
function c3Room() { try { return (typeof activeRoom === 'function') ? activeRoom() : null; } catch (_) { return null; } }
function c3IsCreator() { var r = c3Room(); return !!(r && r.role === 'creator'); }
function c3Ufrag(desc) {
  try {
    var m = /a=ice-ufrag:(\S+)/.exec(String((desc && desc.sdp) || ''));
    return m ? m[1] : '';
  } catch (_) { return ''; }
}

/* C2 (27·ship) — stall detection by decoded frames. */
var C2_MS = 2000;
var C2_STILL = 3;
CALL.c2Timer = null;

/* F1 (27·ship) — a released video sender keeps a tag so a flip can find it. */
function f1Tag(sender) {
  try { Object.defineProperty(sender, '__tbVideoSender', { value: true, enumerable: false, configurable: true }); }
  catch (_) { try { sender.__tbVideoSender = true; } catch (__) {} }
}

/* ── CALL.keys ─────────────────────────────────────────────────────────────── */
CALL.keys = function () {
  /* base */
  var k = {
    dg: ((S.joinerKeys && S.joinerKeys.k) || localStorage.getItem('tb_dg_key') || '').trim(),
    tid: ((S.joinerKeys && S.joinerKeys.tid) || localStorage.getItem('tb_cf_tid') || '').trim().replace(/[^\x20-\x7E]/g, ''),
    tok: ((S.joinerKeys && S.joinerKeys.tok) || localStorage.getItem('tb_cf_tok') || '').trim().replace(/[^\x20-\x7E]/g, '')
  };
  /* CR3 · own key wins; memory wins; the unexpired grant fills what is empty */
  k = k || {};
  try {
    if (k.dg && k.tid && k.tok) return k;
    var rec = (typeof grantRecord === 'function') ? grantRecord() : null;
    if (!rec || (typeof grantExpired === 'function' && grantExpired(rec))) return k;
    var g = (typeof grantedCreds === 'function') ? grantedCreds() : null;
    if (!g) return k;
    var out = { dg: k.dg || g.dg || '', tid: k.tid || g.tid || '', tok: k.tok || g.tok || '' };
    if (!k.dg && out.dg && !cr3State.grantUsedLogged) { cr3State.grantUsedLogged = true; cr3Log('grant_keys_used', { room: S.roomId }, 'ok'); }
    return out;
  } catch (e) { cr3Log('grant_keys_failed', { e: String(e && e.message || e) }, 'error'); return k; }
};

/* ── CALL.start ────────────────────────────────────────────────────────────── */
async function callStartCore(kind) {
  var room = activeRoom(); if (!room || this.active || this._starting) return;
  this._starting = true;
  ensureNotifPerm();
  var ok = await this.acquire(kind);
  this._starting = false;
  if (!ok) return;
  if (this.active) return;
  this.kind = kind; this.caller = true; this.active = true; this.accepted = false;
  this.mount(room);
  relaySend({ type: 'call-start', kind: kind, name: room.myName || S.user.name });
  relaySend({ type: 'mic-state', micOn: this.micOn, transient: true });
  $('rz-timer').textContent = 'Connecting…';
  var self = this;
  this.callerTimer = setTimeout(function () {
    if (self.active && !self.pc) { addSysPill('Missed ' + (self.kind === 'video' ? 'video' : 'voice') + ' call'); relaySend({ type: 'call-end', reason: 'missed' }); self.teardown(); }
  }, 30000);
  log('call_start', { kind: kind }, 'ok');
}
CALL.start = function (kind) {
  GEN.bump('call_start');                                                        /* A */
  var r = callStartCore.apply(this, arguments);                                  /* base */
  return Promise.resolve(r).then(function (v) {                                  /* N10 */
    if (!CALL.active || !CALL.caller) return v;
    /* G42: the caller mute is GONE. The call screen and ring-back stay; muting the caller does not. */
    n10Show(kind);
    n10L('n10_caller_screen', { kind: kind, micOn: CALL.micOn });
    return v;
  });
};

/* ── CALL.onIncoming ───────────────────────────────────────────────────────── */
function callOnIncomingCore(room, d) {
  if (this.active || this.ringPending) return;
  if (room.muted) return;
  this.ringPending = { roomId: room.id, kind: d.kind || 'voice', name: d.name || room.partnerName || 'Partner' };
  var L2 = (I18N[room.myLang] || I18N.en);
  $('ring-name').textContent = this.ringPending.name;
  $('ring-sub').textContent = (d.kind === 'video' ? 'Video call' : 'Voice call') + ' · TalkBridge';
  $('ring-overlay').classList.add('show');
  RING.start();
  osNotify(this.ringPending.name + ' · TalkBridge', 'Incoming call…', room.id);
  var self = this;
  this.ringTimer = setTimeout(function () { self.stopRing(); bgAddPill(self.ringPending ? self.ringPending.roomId : room.id, 'Missed ' + ((self.ringPending && self.ringPending.kind === 'video') ? 'video' : 'voice') + ' call'); self.ringPending = null; renderIfActive(room.id); }, 30000);
  log('call_ring', { room: room.id }, 'ok');
}
CALL.onIncoming = function (room, d) {
  /* CR3 · hidden: no ring. The relay asked the OS; return re-presents an active call once. */
  if (!cr3Attended()) { cr3Log('ring_deferred_hidden', { room: room && room.id, callId: d && d.callId }, 'ok'); return; }
  if (d && d.callId) cr3State.rung[d.callId] = 1;
  /* P4 · the ring screen IS the alert — the moment it presents, the room's stale banner closes */
  var r = callOnIncomingCore.apply(this, arguments);
  try { if (this.ringPending && room && this.ringPending.roomId === room.id) p4PresentedClose(room.id); } catch (_) {}
  return r;
};

/* ── CALL.accept ───────────────────────────────────────────────────────────── */
async function callAcceptCore() {
  var p = this.ringPending; if (!p) return;
  this.stopRing(); this.ringPending = null;
  ensureNotifPerm();
  if (S.roomId !== p.roomId) { closePanel(); enterRoom(p.roomId); }
  var room = activeRoom(); if (!room || this._starting) return;
  this._starting = true;
  var ok = await this.acquire(p.kind);
  this._starting = false;
  if (!ok || this.active) return;
  this.kind = p.kind; this.caller = false; this.active = true;
  this.mount(room);
  relaySendWhenOpen({ type: 'call-accept' });
  relaySendWhenOpen({ type: 'mic-state', micOn: this.micOn, transient: true });
  if (room.role === 'creator') this.setupPC();
  log('call_accept', {}, 'ok');
}
CALL.accept = function () {
  var p = this.ringPending;                                                      /* P4 reads first */
  GEN.bump('call_accept');                                                       /* A */
  var r = callAcceptCore.apply(this, arguments);                                 /* base */
  try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}                  /* P4 after, synchronous */
  return Promise.resolve(r).then(function (v) {                                  /* N10 */
    if (CALL.active && !CALL.caller) { CALL.startTs = Date.now(); n10L('n10_accept_anchor', {}); }
    return v;
  }).then(function (v) { if (CALL.active) n18Anchor('answerer'); return v; });    /* N18 */
};

/* ── CALL.onAccepted ───────────────────────────────────────────────────────── */
function callOnAcceptedCore(room) {
  clearTimeout(this.callerTimer); this.callerTimer = null;
  if (!this.active) return;
  this.accepted = true;
  if (room.role === 'creator') this.setupPC();
}
CALL.onAccepted = function (room, d) {
  var wasCaller = CALL.caller && CALL.active;                                    /* N10 before */
  var r = callOnAcceptedCore.apply(this, arguments);                             /* base */
  if (wasCaller) {                                                               /* N10 after */
    n10Hide();
    /* G42: nothing to restore — the caller is never muted now. Any track an old build disabled is re-enabled here. */
    try { (CALL.stream ? CALL.stream.getAudioTracks() : []).forEach(function (t) { t.enabled = true; }); } catch (_) {}
    CALL.startTs = Date.now();                                     /* B-8a: clock starts at the answer */
    n10L('n10_answered', { micOn: CALL.micOn, tracks: (CALL.stream ? CALL.stream.getAudioTracks().length : 0) });
  }
  if (CALL.active) n18Anchor('caller');                                          /* N18 after */
  return r;
};

/* ── CALL.mount ────────────────────────────────────────────────────────────── */
function callMountCore(room) {
  this.startTs = Date.now();
  dgFailCount = 0; dgHideFailBanner();
  this._chatMicWasOn = CHATMIC.on; // pre-call mic state, restored exactly on hangup
  stopDeepgram(); // unconditional: any live pipeline (chat-mic or otherwise) must die before rebinding to the call stream
  if (CHATMIC.on) CHATMIC.stop(true);
  var rv = $('remote-video'); if (rv) rv.muted = (room.ear === false); // Ear: hear partner's raw voice, default on
  $('scr-room').classList.remove('st-phone', 'st-video');
  $('scr-room').classList.add(this.kind === 'video' ? 'st-video' : 'st-phone');
  $('rb-mic').classList.remove('off');
  if (this.kind === 'video') {
    $('call-band').classList.add('on');
    $('local-video').srcObject = this.stream;
    $('local-video').style.display = this.camOn ? '' : 'none';
    $('rb-cam').classList.toggle('off', !this.camOn);
    $('remote-ph').style.display = '';
    if (!this.pushed) { try { history.pushState({ tbCall: 1 }, '', location.href); } catch (_) {} this.pushed = true; }
  }
  var self = this;
  this.connBad = false;
  this.durTimer = setInterval(function () {
    if (!self.active) return;
    if (self.connBad) { $('rz-timer').textContent = 'Reconnecting…'; return; }
    if (_remoteMicOn) { $('rz-timer').textContent = 'Speaking…'; return; }
    var s = Math.floor((Date.now() - self.startTs) / 1000);
    var lbl = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    $('rz-timer').textContent = lbl;
  }, 1000);
  MicMeter.attach(this.stream);
  startDeepgram();
}
CALL.mount = function (room) {
  var r = callMountCore.apply(this, arguments);                                  /* base */
  try {                                                                          /* R8b after: both sides' clocks say the same thing */
    var el = $('rz-timer');
    if (el) el.textContent = callDuration(this.startTs);
    startCallTimer();
    r8Log('call_timer', { caller: !!this.caller }, 'ok');
  } catch (e) { r8Log('call_timer_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
};

/* ── CALL.onSignal ─────────────────────────────────────────────────────────── */
async function callOnSignalCore(d) {
  if (!d.signal) return;
  var self = this, room = activeRoom(); if (!room) return;
  if (!this.active && this._starting) { setTimeout(function () { self.onSignal(d); }, 250); return; } // heal must not race accept
  try {
    if (d.signal.description) {
      var desc = d.signal.description;
      if (desc.type === 'offer') {
        if (!this.active) { // call joined in progress (entry heal): mount on offer
          if (this.endedAt && Date.now() - this.endedAt < 5000) { log('rtc_offer_ignored_postend', {}, 'warn'); return; } // no phantom calls from late offers
          if (!(await this.acquire('voice'))) return;
          this.active = true; this.caller = false; this.mount(room);
        }
        if (this.pc && this.pc.connectionState === 'connected') { log('rtc_offer_skip', {}); return; }
        if (this.pc && this.pc.connectionState !== 'closed') { try { this.pc.close(); } catch (_) {} this.pc = null; this.pendingCandidates = []; this.seenCand = new Set(); }
        this.remoteStream = null; $('remote-video').srcObject = null;
        await this.setupPC();
        await this.pc.setRemoteDescription(desc);
        await this.flushCands();
        await this.pc.setLocalDescription(await this.pc.createAnswer());
        relaySend({ type: 'webrtc-signal', transient: true, signal: { description: this.pc.localDescription } });
        log('rtc_answered', {}, 'ok');
      } else if (desc.type === 'answer') {
        if (!this.pc) return;
        await this.pc.setRemoteDescription(desc);
        await this.flushCands();
        this.savedOffer = null;
        log('rtc_got_answer', {}, 'ok');
      }
    } else if (d.signal.candidate) {
      var c = d.signal.candidate || {};
      var key = [c.sdpMid || '', c.sdpMLineIndex == null ? '' : c.sdpMLineIndex, String(c.candidate || '')].join('|');
      if (this.seenCand.has(key)) return; this.seenCand.add(key);
      if (!this.pc || !this.pc.remoteDescription) this.pendingCandidates.push(c);
      else try { await this.pc.addIceCandidate(c); } catch (e) { log('rtc_ice_err', { e: String(e) }, 'error'); }
    }
  } catch (e) { log('rtc_sig_err', { e: String(e) }, 'error'); }
}
/* C · glare: the room's creator holds its ground; an offer arms the connect timeout */
async function callOnSignalGlare(d) {
  var room = activeRoom();
  if (d && d.signal && d.signal.description && d.signal.description.type === 'offer' &&
      room && room.role === 'creator' &&
      (this.makingOffer || (this.pc && this.pc.signalingState !== 'stable'))) {
    log('rtc_glare_ignored', {}, 'warn');
    return;
  }
  var r = await callOnSignalCore.apply(this, arguments);
  if (d && d.signal && d.signal.description && d.signal.description.type === 'offer') this.armConnectTimeout();
  return r;
}
CALL.onSignal = function (d) {
  var self = this;
  /* C3 · the creator serves a restart; the joiner answers one on the same pc */
  try {
    var sig = d && d.signal;
    if (sig && sig.restart && c3IsCreator() && this.active && this.pc) {
      var now = Date.now();
      if (now - this._c3LastServed < C3_MIN_GAP_MS) {
        log('c3_restart_ignored', { sinceMs: now - this._c3LastServed }, 'info');
      } else {
        this._c3LastServed = now;
        var gen = GEN.n, pc = this.pc;
        pc.createOffer({ iceRestart: true }).then(function (o) {
          if (!GEN.is(gen) || self.pc !== pc) return;
          return pc.setLocalDescription(o).then(function () {
            if (!GEN.is(gen) || self.pc !== pc) return;
            var offer = { type: 'webrtc-signal', transient: true, signal: { description: pc.localDescription } };
            relaySend(offer); self.savedOffer = offer;
            log('c3_restart_served', {}, 'ok');
          });
        }).catch(function (e) { log('c3_restart_err', { e: String(e) }, 'error'); });
      }
      return callOnSignalGlare.apply(this, arguments);
    }
    if (sig && sig.description && sig.description.type === 'offer' &&
        !c3IsCreator() && this.active && this.pc && this.pc.remoteDescription) {
      var cur = c3Ufrag(this.pc.remoteDescription), nxt = c3Ufrag(sig.description);
      if (cur && nxt && cur !== nxt) {
        var pc2 = this.pc, gen2 = GEN.n;
        return pc2.setRemoteDescription(sig.description).then(function () {
          if (!GEN.is(gen2) || self.pc !== pc2) return;
          return self.flushCands();
        }).then(function () {
          if (!GEN.is(gen2) || self.pc !== pc2) return;
          return pc2.createAnswer();
        }).then(function (a) {
          if (!a || !GEN.is(gen2) || self.pc !== pc2) return;
          return pc2.setLocalDescription(a);
        }).then(function () {
          if (!GEN.is(gen2) || self.pc !== pc2) return;
          relaySend({ type: 'webrtc-signal', transient: true, signal: { description: pc2.localDescription } });
          self._c3Pending = false;
          log('c3_restart_answered', { pending: true }, 'ok');
        }).catch(function (e) { log('c3_restart_answer_err', { e: String(e) }, 'error'); });
      }
    }
  } catch (_) {}
  return callOnSignalGlare.apply(this, arguments);
};

/* ── CALL.runRecovery ──────────────────────────────────────────────────────── */
CALL.runRecovery = function (reason) {
  /* C3 · the joiner asks for a restart instead of taking step 2 alone */
  try {
    var r3 = c3Room();
    if (this.active && r3 && r3.role !== 'creator' && !this.recoveryLock &&
        this.recoveryStep + 1 === 2 && this.pc) {
      var self3 = this, gen3 = GEN.n;
      this.recoveryLock = true;
      this.recoveryStep = 2;
      this._c3Pending = true;
      var sent = relaySend({ type: 'webrtc-signal', transient: true, signal: { restart: true } });
      log('c3_restart_requested', { reason: reason, sent: !!sent }, 'warn');
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = setTimeout(function () {
        if (!GEN.is(gen3)) return;
        self3.recoveryLock = false;
        self3._c3Pending = false;
        var st3 = self3.pc && self3.pc.connectionState;
        if (st3 === 'connected' || st3 === 'completed') { self3.recoveryStep = 0; log('rtc_recovered', { step: 2 }, 'ok'); }
      }, C3_HOLD_MS);
      return;
    }
  } catch (_) {}
  /* C · the ladder */
  var self = this, room = activeRoom();
  if (!this.active || !room) return;
  if (this.recoveryLock) { log('rtc_recovery_busy', { reason: reason }, 'warn'); return; }
  this.recoveryLock = true;
  this.recoveryStep++;
  var step = this.recoveryStep, gen = GEN.n;
  log('rtc_recovery', { step: step, reason: reason }, 'warn');

  var release = function (ms) {
    clearTimeout(self.recoveryTimer);
    self.recoveryTimer = setTimeout(function () {
      if (!GEN.is(gen)) return;
      self.recoveryLock = false;
      var st = self.pc && self.pc.connectionState;
      if (st === 'connected' || st === 'completed') { self.recoveryStep = 0; log('rtc_recovered', { step: step }, 'ok'); }
    }, ms);
  };

  try {
    if (step === 1) {
      if (room.role === 'creator' && this.savedOffer) {
        relaySend(this.savedOffer);
        this.savedCandidates.forEach(function (c) { relaySend(c); });
        log('rtc_offer_resent', {}, 'ok');
      }
      release(5000);
      return;
    }

    if (step === 2 && this.pc && room.role === 'creator') {
      this.pc.createOffer({ iceRestart: true }).then(function (o) {
        if (!GEN.is(gen) || !self.pc) return;
        return self.pc.setLocalDescription(o).then(function () {
          var offer = { type: 'webrtc-signal', transient: true, signal: { description: self.pc.localDescription } };
          relaySend(offer); self.savedOffer = offer;
          log('rtc_ice_restart', {}, 'ok');
        });
      }).catch(function (e) { log('rtc_ice_restart_err', { e: String(e) }, 'error'); });
      release(8000);
      return;
    }

    /* Step 3 and anything beyond: full rebuild, creator side only — the other
       side is driven by the offer that follows. */
    if (this.pc) { try { this.pc.close(); } catch (_) {} }
    this.pc = null;
    this.savedOffer = null; this.savedCandidates = []; this.pendingCandidates = []; this.seenCand = new Set();
    this.remoteStream = null;
    this.stopKeepalive(); this.stopVideoWatchdog();
    if (room.role === 'creator') {
      setTimeout(function () { if (GEN.is(gen) && self.active) self.setupPC(); }, 1200);
    }
    release(12000);
  } catch (e) {
    log('rtc_recovery_err', { e: String(e) }, 'error');
    this.recoveryLock = false;
  }
};

/* ── CALL.startVideoWatchdog / stopVideoWatchdog ───────────────────────────── */
CALL.startVideoWatchdog = function () {
  /* C · the picture itself is sampled: four still samples is a stall */
  var self = this, gen = GEN.n, last = -1, still = 0;
  this.stopVideoWatchdog();
  var r;
  if (this.kind !== 'video') { r = undefined; }
  else {
    this.videoWatchTimer = setInterval(function () {
      if (!GEN.is(gen) || !self.active) { self.stopVideoWatchdog(); return; }
      var v = $('remote-video');
      if (!v || !v.srcObject) return;
      var t = v.currentTime || 0;
      if (t === last) { still++; } else { still = 0; last = t; }
      if (still >= 4) {
        still = 0;
        log('rtc_video_stalled', {}, 'warn');
        self.runRecovery('video_stalled');
      }
    }, 2000);
  }
  /* C2 · a second sampler reads decoded frames; three unchanged samples while "connected" is a stall */
  var self2 = this, gen2 = GEN.n;
  clearInterval(this.c2Timer); this.c2Timer = null;
  if (this.kind !== 'video') return r;

  var armed = false, last2 = -1, still2 = 0, stalled = false, t0 = Date.now();
  this.c2Timer = setInterval(function () {
    if (!GEN.is(gen2) || !self2.active) { clearInterval(self2.c2Timer); self2.c2Timer = null; return; }
    var pc = self2.pc;
    if (!pc || typeof pc.getStats !== 'function') return;
    pc.getStats().then(function (report) {
      if (!GEN.is(gen2) || self2.pc !== pc) return;
      var frames = -1;
      report.forEach(function (row) {
        if (row.type === 'inbound-rtp' && row.kind === 'video') frames = row.framesDecoded || 0;
      });
      if (frames < 0) return;

      if (!armed) { if (frames > 0) { armed = true; last2 = frames; } return; }

      if (frames === last2) {
        if (pc.connectionState !== 'connected') { still2 = 0; return; }  /* the ladder already owns this */
        still2++;
        if (still2 >= C2_STILL) {
          still2 = 0; stalled = true;
          log('c2_stalled', { frames: frames, ms: Date.now() - t0 }, 'warn');
          self2.runRecovery('video_stalled');
        }
      } else {
        if (stalled) { stalled = false; log('c2_resumed', { ms: Date.now() - t0 }, 'ok'); }
        still2 = 0; last2 = frames;
      }
    }).catch(function () {});
  }, C2_MS);
  return r;
};
CALL.stopVideoWatchdog = function () {
  clearInterval(this.c2Timer); this.c2Timer = null;                              /* C2 before */
  clearInterval(this.videoWatchTimer); this.videoWatchTimer = null;              /* C */
};

/* ── CALL.toggleMic ────────────────────────────────────────────────────────── */
CALL.toggleMic = function () {
  /* T-net · mute is total: the sender's track is replaced with nothing */
  this.micOn = !this.micOn;
  var track = (this.stream && this.stream.getAudioTracks) ? this.stream.getAudioTracks()[0] : null;
  var senders = micSenders();
  var swapped = 0;

  if (this.micOn) {
    if (track) track.enabled = true;
    senders.forEach(function (s) { if (replaceSenderTrack(s, track)) swapped++; });
  } else {
    senders.forEach(function (s) { if (replaceSenderTrack(s, null)) swapped++; });
    if (track) track.enabled = false;
  }

  try { $('rb-mic').classList.toggle('off', !this.micOn); } catch (_) {}
  relaySend({ type: 'mic-state', micOn: this.micOn, transient: true });
  netLog('mic_toggled', {
    on: this.micOn,
    senders: senders.length,
    swapped: swapped,
    trackEnabled: track ? track.enabled : null,
    /* If this is ever false while muted, mute is not total. */
    silent: !this.micOn ? (swapped === senders.length && (!track || !track.enabled)) : null
  }, 'ok');
  /* M · transcription stops with mute, rather than starving */
  try {
    if (!this.micOn) {
      RM.dgWasOnBeforeMute = !!dgActive;
      stopDeepgram();
      rmLog('transcription_stopped_for_mute', { wasActive: RM.dgWasOnBeforeMute }, 'ok');
    } else if (this.active) {
      rmLog('transcription_resuming_after_mute', {}, 'ok');
      startDeepgram();
    }
  } catch (e) { rmLog('mute_transcription_failed', { e: String(e && e.message || e) }, 'error'); }
};

/* ── CALL.hangUp ───────────────────────────────────────────────────────────── */
function callHangUpCore(send) {
  if (!this.active) return;
  if (send) relaySend({ type: 'call-end' });
  this.endPill(); this.teardown();
}
CALL.hangUp = function () {
  /* c5 · the swapped / dragged video surface is put back before the call ends */
  try {
    ['remote-video', 'local-video'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.__tbDragState) el.__tbDragState.on = false;
      tbClearPos(el);
    });
    var h = document.getElementById('local-video-handle'); if (h) h.style.display = 'none';
  } catch (_) {}
  TB_SWAP = false;
  try { var host = $('call-videos'); if (host) host.classList.remove('swapped'); } catch (_) {}
  return callHangUpCore.apply(this, arguments);
};

/* ── CALL.teardown ─────────────────────────────────────────────────────────── */
function callTeardownCore() {
  this.active = false; this.caller = false; this.endedAt = Date.now();
  _remoteMicOn = false; renderPartnerState();
  clearTimeout(this.callerTimer); clearInterval(this.durTimer); this.callerTimer = this.durTimer = null;
  stopDeepgram();
  MicMeter.detach();
  if (this.pc) { try { this.pc.close(); } catch (_) {} this.pc = null; }
  if (this.stream) { this.stream.getTracks().forEach(function (t) { try { t.stop(); } catch (_) {} }); this.stream = null; }
  this.remoteStream = null; this.savedOffer = null; this.savedCandidates = []; this.pendingCandidates = []; this.seenCand = new Set();
  $('call-band').classList.remove('on');
  $('scr-room').classList.remove('st-phone', 'st-video');
  $('rz-timer').textContent = '';
  $('rb-mic').classList.add('off'); $('rb-cam').classList.add('off');
  $('remote-video').srcObject = null; $('local-video').srcObject = null;
  if (this.pip) this.exitPip();
  $('scr-room').classList.remove('pip');
  if (this._chatMicWasOn) CHATMIC.start(); else CHATMIC.stop(true); // strip returns to exact pre-call mic state
  this._chatMicWasOn = false;
  if (PB.pk && PB.isDirty()) pbWriteBack(); // PB write-back on call end (plan rule)
  log('call_end', {}, 'ok');
}
CALL.teardown = function () {
  n10Hide();                                                                     /* N10 before */
  try { (CALL.stream ? CALL.stream.getAudioTracks() : []).forEach(function (t) { t.enabled = true; }); CALL.n10Muted = false; } catch (_) {}
  stopCallTimer();                                                               /* R8b before */
  this.resetRecoveryState();                                                     /* C before */
  if (this.kaChannel) { try { this.kaChannel.close(); } catch (_) {} this.kaChannel = null; }
  var r = callTeardownCore.apply(this, arguments);                               /* base */
  GEN.bump('call_end');                                                          /* A after */
  return r;
};

/* ── camSenders / replaceSenderTrack ──────────────────────────────────────── */
function camSenders() {
  var found;
  try { found = (CALL.pc && CALL.pc.getSenders) ? CALL.pc.getSenders().filter(function (s) { return s.track ? s.track.kind === 'video' : false; }) : []; }
  catch (_) { found = []; }
  found = found || [];
  /* F1 · add any tagged sender the kind filter dropped */
  try {
    var all = (CALL.pc && CALL.pc.getSenders) ? CALL.pc.getSenders() : [];
    for (var i = 0; i < all.length; i++) {
      var s = all[i];
      if (s && s.__tbVideoSender && found.indexOf(s) === -1) found.push(s);
    }
    if (found.length && !found.__f1Logged) {
      /* one line per lookup that the tag rescued, so a device log can prove it */
      var rescued = found.filter(function (s) { return !(s.track && s.track.kind === 'video'); }).length;
      if (rescued) log('f1_sender_kept', { n: rescued }, 'ok');
    }
  } catch (_) {}
  return found;
}
function replaceSenderTrack(sender, track) {
  /* F1 · a video sender being released, or receiving a video track, keeps its tag */
  try {
    if (sender && track === null && sender.track && sender.track.kind === 'video') f1Tag(sender);
    if (sender && track && track.kind === 'video') f1Tag(sender);
  } catch (_) {}
  /* T-net */
  try {
    if (sender && sender.replaceTrack) { sender.replaceTrack(track); return true; }
  } catch (e) { netLog('replace_track_failed', { e: String(e && e.message || e) }, 'error'); }
  return false;
}
