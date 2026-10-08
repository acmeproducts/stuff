(function () {
  var _rmStartDG = startDeepgram;
  startDeepgram = function () {
    if (CALL.active && !CALL.micOn) { rmLog('transcription_suppressed_muted', {}, 'ok'); return; }
    var r = _rmStartDG.apply(this, arguments);
    try {
      if (dgWs && dgWs.addEventListener) {
        dgWs.addEventListener('close', function (ev) {
          if (ev.code === 1006 && typeof navigator !== 'undefined' && navigator.onLine === false) {
            rmLog('transcription_dropped_offline', { code: ev.code }, 'warn');
          }
        });
      }
    } catch (_) {}
    return r;
  };
})();
