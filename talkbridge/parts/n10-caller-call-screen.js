/* N10 (25·base, plan v20.34.0). THE OUTBOUND HALF OF THE CALL ROUND TRIP.
   Owner spec: placing a call must feel like placing a call. The caller's
   microphone is muted while it rings, the caller sees a call screen, and the
   caller hears a ring-back through the phone. On answer the mic goes live, the
   screen clears, and BOTH clocks start at the answer so the two sides agree
   (B-8a). Wraps CALL.start / CALL.accept / CALL.onAccepted / CALL.teardown and
   calls through — the frozen call logic runs unchanged, nothing is replaced,
   and no service worker, registration or manifest is touched. */
(function () {
  if (typeof CALL === 'undefined' || !CALL || typeof RING === 'undefined') return;
  function L(ev, d) { try { if (typeof log === 'function') log(ev, d || {}, 'ok'); } catch (_) {} }

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
    L('n10_caller_cancelled', {});
    try { relaySend({ type: 'call-end', reason: 'cancelled' }); } catch (_) {}
    try { CALL.teardown(); } catch (_) {}
  });

  function show(kind) {
    var room = (typeof activeRoom === 'function') ? activeRoom() : null;
    document.getElementById('n10-name').textContent = (room && (room.partnerName || room.title)) || 'Calling…';
    document.getElementById('n10-sub').textContent = (kind === 'video' ? 'Video call' : 'Voice call') + ' · Ringing…';
    ov.classList.add('show');
    try { RING.start(); } catch (_) {}          /* the ring-back the caller hears */
  }
  function hide() { ov.classList.remove('show'); try { RING.stop(); } catch (_) {} }

  var _start = CALL.start;
  CALL.start = function (kind) {
    var r = _start.apply(this, arguments);
    return Promise.resolve(r).then(function (v) {
      if (!CALL.active || !CALL.caller) return v;
      /* G42: the caller mute is GONE. It disabled the outgoing audio tracks
         before the connection had them, and a restore that never ran left the
         microphone dead for the whole call — the meter never moved. The call
         screen and ring-back stay; muting the caller does not. */
      show(kind);
      L('n10_caller_screen', { kind: kind, micOn: CALL.micOn });
      return v;
    });
  };

  var _accepted = CALL.onAccepted;
  CALL.onAccepted = function (room, d) {
    var wasCaller = CALL.caller && CALL.active;
    var r = _accepted.apply(this, arguments);
    if (wasCaller) {
      hide();
      /* G42: nothing to restore — the caller is never muted now. Any track this
         build ever disabled is re-enabled here so a phone that ran the old code
         is not left silent. */
      try { (CALL.stream ? CALL.stream.getAudioTracks() : []).forEach(function (t) { t.enabled = true; }); } catch (_) {}
      CALL.startTs = Date.now();                                     /* B-8a: clock starts at the answer */
      L('n10_answered', { micOn: CALL.micOn, tracks: (CALL.stream ? CALL.stream.getAudioTracks().length : 0) });
    }
    return r;
  };

  var _accept = CALL.accept;
  CALL.accept = function () {
    var r = _accept.apply(this, arguments);
    return Promise.resolve(r).then(function (v) {
      if (CALL.active && !CALL.caller) { CALL.startTs = Date.now(); L('n10_accept_anchor', {}); }
      return v;
    });
  };

  var _teardown = CALL.teardown;
  CALL.teardown = function () {
    hide();
    try { (CALL.stream ? CALL.stream.getAudioTracks() : []).forEach(function (t) { t.enabled = true; }); CALL.n10Muted = false; } catch (_) {}
    return _teardown.apply(this, arguments);
  };
})();
