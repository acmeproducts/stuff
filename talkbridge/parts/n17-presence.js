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
  /* N20: a device holds more than one socket (room lane plus listen lanes) and
     re-attaches them on every focus, so raw join/leave counts flap between 0
     and 1 and the dot blinks. Lighting up is immediate; going dark waits out a
     short grace so a reconnect is not reported as a departure. */
  var GRACE = 6000, dark = null, last = null;
  function apply(d) {
    var others = (d && typeof d.others === 'number') ? d.others : 0;
    if (others > 0) {
      clearTimeout(dark); dark = null;
      if (last !== true) { last = true; try { if (typeof log === 'function') log('n17_peer', { online: true, others: others }, 'ok'); } catch (_) {} }
      /* refresh the app's OWN partner-seen clock. It arms a 75-second timer
         that blanks the dot; setting presence true without refreshing that
         timer let it win and the dot went dark with the partner still there. */
      try { if (typeof touchPresence === 'function') touchPresence(); else setPresence(true); } catch (_) {}
      return;
    }
    if (dark) return;
    dark = setTimeout(function () {
      dark = null;
      if (last !== false) { last = false; try { setPresence(false); } catch (_) {} try { if (typeof log === 'function') log('n17_peer', { online: false, others: 0 }, 'ok'); } catch (_) {} }
    }, GRACE);
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
