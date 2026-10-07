  /* G21: leaving a room opens that room's listener lane in the same action. */
  var _cr3Leave = leaveRoomInternals;
  leaveRoomInternals = function () {
    var left = S.roomId;
    var r = _cr3Leave.apply(this, arguments);
    try { LISTEN.sync(); cr3Log('leave_lane', { room: left }, 'ok'); cr3Recover('leave'); } catch (e) { cr3Log('leave_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
