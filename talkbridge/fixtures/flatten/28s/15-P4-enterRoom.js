  var _p4EnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _p4EnterRoom.apply(this, arguments);
    try { p4CloseTag(id); } catch (_) {}
    return r;
  };
