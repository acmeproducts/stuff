(function () {
  var _sHandleRelay = handleRelay;
  handleRelay = function (d) {
    var r = _sHandleRelay.apply(this, arguments);
    try { sendReadReceipts(); } catch (_) {}
    return r;
  };
})();
