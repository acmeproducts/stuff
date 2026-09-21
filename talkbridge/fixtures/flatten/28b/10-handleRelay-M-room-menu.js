(function () {
  var _rmHandleRelay = handleRelay;
  handleRelay = function (d) {
    try { if (d) onRoomNameSignal(S.roomId, d); } catch (_) {}
    return _rmHandleRelay.apply(this, arguments);
  };
})();
