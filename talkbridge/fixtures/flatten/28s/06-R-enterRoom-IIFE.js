(function () {
  var _rEnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _rEnterRoom.apply(this, arguments);
    try {
      var room = roomById(id);
      if (room) { clearWaiting(room); saveRooms(); renderHome(); }
    } catch (e) { rcLog('enter_clear_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
