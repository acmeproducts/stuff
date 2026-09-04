/* N18 (D-5) — CALL TIMERS THAT AGREE.
   The caller's clock is mounted when the call is PLACED and the answerer's when
   it is ANSWERED, so the two differed by however long it rang. N10 re-anchored
   the caller on answer, but the on-screen clock is driven by a timer that was
   started at mount and is not restarted, so the display kept its original
   start. This anchors BOTH sides to the answer and restarts the display there,
   so the two phones show the same elapsed time from the same moment.
   Wraps and calls through; replaces nothing. */
(function () {
  if (typeof CALL === 'undefined' || !CALL) return;
  function anchor(who) {
    CALL.startTs = Date.now();
    try { if (typeof stopCallTimer === 'function') stopCallTimer(); } catch (_) {}
    try {
      var el = (typeof $ === 'function') ? $('rz-timer') : document.getElementById('rz-timer');
      if (el && typeof callDuration === 'function') el.textContent = callDuration(CALL.startTs);
      if (typeof startCallTimer === 'function') startCallTimer();
    } catch (_) {}
    try { if (typeof log === 'function') log('n18_anchor', { who: who }, 'ok'); } catch (_) {}
  }
  var _acc = CALL.onAccepted;
  CALL.onAccepted = function () { var r = _acc.apply(this, arguments); if (CALL.active) anchor('caller'); return r; };
  var _ac = CALL.accept;
  CALL.accept = function () {
    var r = _ac.apply(this, arguments);
    return Promise.resolve(r).then(function (v) { if (CALL.active) anchor('answerer'); return v; });
  };
})();
