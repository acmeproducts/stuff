/* N8 (25·base, plan v20.32.0) — answer the relay's liveness challenge.
   The relay no longer trusts a device's last self-report to decide whether the
   handset can be reached: before withholding a push it asks the socket to prove
   it is awake. A running, on-screen app answers at once and stays quiet; a
   locked or frozen page cannot answer and is pushed, which is what makes the
   handset ring again. Adds one reply on the room socket and one on any listen
   lane. Wraps handleRelay and LISTEN.handle and calls through; does not touch
   the service worker, its registration, the manifest, or the install gate. */
(function () {
  function ack(roomId, token) {
    try { cr3Send(roomId, { type: 'ev-alive-ack', transient: true, token: token }); } catch (_) {}
    try { if (typeof log === 'function') log('n8_alive_ack', { room: roomId }, 'ok'); } catch (_) {}
  }
  if (typeof handleRelay === 'function') {
    var _h = handleRelay;
    handleRelay = function (d) {
      if (d && d.type === 'ev-alive') { ack((typeof S !== 'undefined' && S.roomId) || null, d.token); return; }
      return _h.apply(this, arguments);
    };
  }
  if (typeof LISTEN === 'object' && LISTEN && typeof LISTEN.handle === 'function') {
    var _l = LISTEN.handle;
    LISTEN.handle = function (roomId, d) {
      if (d && d.type === 'ev-alive') { ack(roomId, d.token); return; }
      return _l.apply(this, arguments);
    };
  }
})();
