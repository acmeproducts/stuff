  var _p4Accept = CALL.accept;
  CALL.accept = function () {
    var p = this.ringPending;
    var r = _p4Accept.apply(this, arguments);
    try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}
    return r;
  };
