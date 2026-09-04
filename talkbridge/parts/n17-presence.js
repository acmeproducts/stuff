/* N17 (D-4) — PRESENCE, FIXED AT THE SOURCE.
   The dot was lit by `touchPresence()`, which only ran when a message happened
   to arrive from the partner on the room socket. A partner who was connected
   but not sending anything went dark after the timeout, and a partner who had
   left could stay lit until it expired. Presence was being inferred from
   traffic; it was never told to anyone.
   The relay is the only party that knows who is actually attached. It now
   announces the count on every join and every leave, and this sets the dot
   from that. Traffic still refreshes it, so nothing is lost if an announcement
   is missed. Wraps handleRelay and LISTEN.handle and calls through. */
(function () {
  if (typeof setPresence !== 'function') return;
  function apply(d) {
    var online = (d && typeof d.others === 'number') ? d.others > 0 : false;
    try { setPresence(online); } catch (_) {}
    try { if (typeof log === 'function') log('n17_peer', { online: online, others: d && d.others }, 'ok'); } catch (_) {}
  }
  if (typeof handleRelay === 'function') {
    var _h = handleRelay;
    handleRelay = function (d) { if (d && d.type === 'peer') { apply(d); return; } return _h.apply(this, arguments); };
  }
  if (typeof LISTEN === 'object' && LISTEN && typeof LISTEN.handle === 'function') {
    var _l = LISTEN.handle;
    LISTEN.handle = function (roomId, d) { if (d && d.type === 'peer') return; return _l.apply(this, arguments); };
  }
})();
