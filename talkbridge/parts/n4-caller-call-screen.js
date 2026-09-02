/* N4 (25·base, plan v20.26.0 §5.1 — owner scope directive 2026-09-01).
   Caller side of the call round trip: microphone muted while placing, a call
   screen with an audible ring-back, and both clocks anchored to the accept
   (B-8a). Wraps CALL.start / onAccepted / teardown and calls through — the
   frozen call logic runs unchanged; nothing is replaced. */
(function () {
  if (typeof CALL === 'undefined' || !CALL || typeof RING === 'undefined') return;
  function L(ev, d) { try { if (typeof log === 'function') log(ev, d || {}, 'ok'); } catch (_) {} }
  var css = document.createElement('style');
  css.textContent = '#cb-overlay{position:absolute;inset:0;background:rgba(14,17,18,.97);z-index:80;display:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:30px}' +
                    '#cb-overlay.show{display:flex}#cb-name{font-size:22px;font-weight:700;margin-top:14px}' +
                    '#cb-sub{font-size:14px;opacity:.75;margin-top:6px}#cb-mic{font-size:13px;opacity:.6;margin-top:10px}' +
                    '#cb-btns{margin-top:28px}';
  document.head.appendChild(css);
  var ov = document.createElement('div');
  ov.id = 'cb-overlay';
  ov.innerHTML = '<div class="ring-pulse"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>' +
    '<div id="cb-name"></div><div id="cb-sub"></div><div id="cb-mic">Your microphone is muted until they answer</div>' +
    '<div id="cb-btns"><div><button class="ring-btn dec" id="cb-cancel"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" transform="rotate(135)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button><div class="ring-lb">Cancel</div></div></div>';
  function mount() { (document.getElementById('scr-room') || document.body).appendChild(ov); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  ov.querySelector('#cb-cancel').addEventListener('click', function () {
    try { relaySend({ type: 'call-end', reason: 'cancelled' }); } catch (_) {}
    try { CALL.teardown(); } catch (_) {}
  });

  function showCaller(kind) {
    var room = (typeof activeRoom === 'function') ? activeRoom() : null;
    document.getElementById('cb-name').textContent = (room && (room.partnerName || room.title)) || 'Calling…';
    document.getElementById('cb-sub').textContent = (kind === 'video' ? 'Video call' : 'Voice call') + ' · Ringing…';
    ov.classList.add('show');
    RING.start();                       /* ring-back the caller can hear */
  }
  function hideCaller() { ov.classList.remove('show'); RING.stop(); }

  var _start = CALL.start;
  CALL.start = function (kind) {
    var r = _start.apply(this, arguments);
    return Promise.resolve(r).then(function (v) {
      if (!CALL.active || !CALL.caller) return v;
      if (CALL.micOn) { try { CALL.toggleMic(); } catch (_) {} }   /* muted while placing */
      showCaller(kind);
      L('n4_caller_screen', { kind: kind, micOn: CALL.micOn });
      return v;
    });
  };

  var _accepted = CALL.onAccepted;
  CALL.onAccepted = function (room) {
    hideCaller();
    if (CALL.caller && !CALL.micOn) { try { CALL.toggleMic(); } catch (_) {} }  /* live on answer */
    CALL.startTs = Date.now();          /* B-8a: both clocks start at the accept */
    L('n4_call_accepted', { anchored: true, micOn: CALL.micOn });
    return _accepted.apply(this, arguments);
  };

  var _teardown = CALL.teardown;
  CALL.teardown = function () { hideCaller(); return _teardown.apply(this, arguments); };

  /* the callee's clock is anchored the same way, on the accept it just made */
  var _accept = CALL.accept;
  CALL.accept = function () {
    var r = _accept.apply(this, arguments);
    return Promise.resolve(r).then(function (v) { if (CALL.active && !CALL.caller) CALL.startTs = Date.now(); return v; });
  };
})();
