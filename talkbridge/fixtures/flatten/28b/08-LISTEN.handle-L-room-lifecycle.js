(function () {
  var _lcListen = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    try { if (d && onLifecycleSignal(roomId, d)) return; } catch (_) {}
    return _lcListen.apply(this, arguments);
  };
})();
