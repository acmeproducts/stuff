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
