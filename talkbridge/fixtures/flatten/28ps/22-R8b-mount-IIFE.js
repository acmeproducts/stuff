(function () {
  var _r8Mount = CALL.mount;
  CALL.mount = function (room) {
    var r = _r8Mount.apply(this, arguments);
    try {
      /* Both sides without exception — the caller and the person answering are
         equally on a call and the surface should say so identically. */
      var el = $('rz-timer');
      if (el) el.textContent = callDuration(this.startTs);
      startCallTimer();
      r8Log('call_timer', { caller: !!this.caller }, 'ok');
    } catch (e) { r8Log('call_timer_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
