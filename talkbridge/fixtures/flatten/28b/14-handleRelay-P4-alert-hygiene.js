  var _p4HandleRelay = handleRelay;
  handleRelay = function (d) {
    var r = _p4HandleRelay.apply(this, arguments);
    try { if (d && d.from !== deviceId && p4IsPushWorthy(d) && !document.hidden && S.roomId) p4PresentedClose(S.roomId); } catch (e) { p4Log('close_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
