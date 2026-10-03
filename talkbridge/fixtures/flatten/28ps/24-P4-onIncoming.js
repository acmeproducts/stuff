  var _p4OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    var r = _p4OnIncoming.apply(this, arguments);
    try { if (this.ringPending && room && this.ringPending.roomId === room.id) p4PresentedClose(room.id); } catch (_) {}
    return r;
  };
