  /* exit — every path back out of a room */
  if (typeof leaveRoomInternals === 'function') {
    var _leave = leaveRoomInternals;
    leaveRoomInternals = function () { var r = _leave.apply(this, arguments); declare('leave_room'); return r; };
  }
