(function () {
  var _jJoinRoom = joinRoom;
  joinRoom = function (p) {
    var r = _jJoinRoom.apply(this, arguments);
    try { applyInvitePayload(p); } catch (e) { jLog('join_apply_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
