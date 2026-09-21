(function () {
  if (typeof relayConnect !== 'function') return;

  var RAMP = [300, 600, 1200, 2000];
  var attempt = 0;
  var timer = null;

  function schedule(why) {
    var ms = RAMP[Math.min(attempt, RAMP.length - 1)];
    attempt++;
    clearTimeout(timer);
    timer = setTimeout(function () {
      timer = null;
      if (S.view !== 'room' || !S.roomId) return;
      try { log('v2_retry', { n: attempt, ms: ms, why: why }, 'warn'); } catch (_) {}
      relayConnect();
    }, ms);
  }

  var _relayConnect = relayConnect;
  relayConnect = function () {
    var r = _relayConnect.apply(this, arguments);
    try {
      var ws = _relayWs;
      if (!ws || ws.__v2) return r;
      ws.__v2 = true;
      ws.addEventListener('open', function () {
        if (ws !== _relayWs) return;
        attempt = 0;
        clearTimeout(timer); timer = null;
      });
      ws.addEventListener('close', function () {
        if (ws !== _relayWs) return;                /* a replaced socket is not ours to retry */
        if (S.view !== 'room' || !S.roomId) return;
        /* The frozen onclose has already armed its 2 s timer by now (it was
           registered first). Take it over so exactly one retry is pending. */
        clearTimeout(wsReconnectTimer); wsReconnectTimer = null;
        schedule('close');
      });
    } catch (_) {}
    return r;
  };
})();
