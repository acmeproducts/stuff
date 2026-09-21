(function () {
  var _lcHandleRelay = handleRelay;
  handleRelay = function (d) {
    try { if (d && onLifecycleSignal(S.roomId, d)) return; } catch (_) {}
    return _lcHandleRelay.apply(this, arguments);
  };
})();
