/* ═══════════ GAP PART · V2-relay-retry.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: relayConnect
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   V-2 · THE SIGNALLING SOCKET COMES BACK AS FAST AS THE NETWORK DOES (§7.15)

   THE EVIDENCE: on cellular the carrier bounces the connection the moment a
   video call's media starts. Every socket on the phone dies together. The
   frozen relay code then waits a flat 2 s, tries once (which failed in 36 ms —
   the link was still down), and waits another flat 2 s. Video appeared ~4 s
   after answer on every cellular call; on wifi, where the socket never drops,
   it appeared instantly.

   THE CHANGE: after the frozen `relayConnect` builds its socket, an ADDITIONAL
   close listener (addEventListener — the frozen `onclose` handler is left in
   place and fires first) replaces the flat 2 s wait with a short ramp:
   300 → 600 → 1200 → 2000 ms, capped, reset the moment a socket opens. The
   frozen handler's own timer is cleared so the two never race. The retry
   uses the frozen `relayConnect` — nothing else about the socket changes.

   WHAT IT DOES NOT DO: it cannot bring the network back. The first second or
   so is the carrier's. It only stops the app adding its own two seconds on
   top, twice.
   ───────────────────────────────────────────────────────────────────────────── */
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
