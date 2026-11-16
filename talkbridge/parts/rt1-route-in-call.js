/* ═══════════ 30·ship PART · RT-1 route-in-call.js — A NOTIFICATION TAPPED DURING A CALL NEVER LEAVES THE CALL (§7.25 item 6, B-9e) ═══════════ */
/* @contract
   replaces: (none)   wraps: cr3RouteEvent (the original kept and called whenever no call is up, or the tap is for the call's room)
   adds: RT, rtLog, _rtRoute
   markers (rtLog's own prefix 'rt_'): held

   THE OWNER (2026-11-16, simplified): "we need to rethink and simplify this one" — no "camera paused", no hold.
   THE CAUSE (read in code): a tapped notification for another room runs cr3RouteEvent → enterRoom(other) →
   leaveRoomInternals → CALL.hangUp(true): the call ends silently, with one copy of the app too.
   THE CHANGE: while a call is up or being started/accepted (CALL.active || CALL._starting — accept and start await the camera
   with active still false) and the tapped room is not the call's room (S.roomId), the app stays in the call: no rail change, no
   room change; if visible the person is marked attended and one recovery runs. The tapped room keeps its unread count (the relay
   never got ev-seen) and waits. The call's own room, or no call: the original, unchanged. A second call during a call is
   unchanged (no ring; the caller's reach shows it missed). */
var RT = { held: 0 };
function rtLog(what, d, lvl) { try { log('rt_' + what, d || {}, lvl || 'info'); } catch (_) {} }
var _rtRoute = cr3RouteEvent;
cr3RouteEvent = function (roomId, eventId, why) {
  try {
    if ((CALL.active || CALL._starting) && roomId && roomId !== S.roomId) {
      RT.held++;
      if (!document.hidden) cr3SetAttended(true, why);
      rtLog('held', { room: String(roomId).slice(-6), call: String(S.roomId || '').slice(-6), why: why || null, starting: !!CALL._starting }, 'ok');
      try { cr3Recover('route_held'); } catch (_) {}
      return true;
    }
  } catch (_) {}
  return _rtRoute.apply(this, arguments);
};
