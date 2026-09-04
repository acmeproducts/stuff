/* N17 (D-4) — PRESENCE IS ONE THING: IS THE OTHER PERSON LOOKING AT IT.
   No timers, no grace, no counting sockets, no inferring from traffic. Every
   device already reports whether it is focused; the relay passes that on and
   the dot follows it exactly. Focused, the light is on. Not focused, the light
   is off. The app's own 75-second partner-seen timer is stood down, because two
   owners for one indicator is what kept it wrong. */
(function () {
  if (typeof setPresence !== 'function') return;
  function apply(d) {
    var on = !!(d && d.focused);
    try { clearTimeout(touchPresence._t); touchPresence._t = null; } catch (_) {}
    try { setPresence(on); } catch (_) {}
    try { if (typeof log === 'function') log('n17_peer', { focused: on }, 'ok'); } catch (_) {}
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
