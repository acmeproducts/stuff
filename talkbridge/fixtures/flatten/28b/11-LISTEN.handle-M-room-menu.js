(function () {
  var _rmListen = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    try { if (d) onRoomNameSignal(roomId, d); } catch (_) {}
    return _rmListen.apply(this, arguments);
  };
})();
