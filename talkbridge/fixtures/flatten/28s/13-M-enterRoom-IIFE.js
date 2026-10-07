(function () {
  var _rmEnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _rmEnterRoom.apply(this, arguments);
    try {
      buildDrawerLayout();
      var room = roomById(id);
      if (room) {
        var f = $('s4b-title'); if (f) f.value = room.title || '';
      }
    } catch (e) { rmLog('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
