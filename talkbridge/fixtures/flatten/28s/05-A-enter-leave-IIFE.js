(function () {
  var _enter = enterRoom, _leave = leaveRoomInternals;

  enterRoom = function (id) {
    /* Exactly one advance per room change. Switching rooms goes through the
       leave path, which advances on its own — advancing here as well would
       burn two generations for one action and make the log misleading. */
    var willLeave = !!(S.roomId && S.roomId !== id);
    if (!willLeave && S.roomId !== id) GEN.bump('room_enter');
    return _enter.apply(this, arguments);
  };

  leaveRoomInternals = function () {
    GEN.bump('room_leave');
    return _leave.apply(this, arguments);
  };

})();
