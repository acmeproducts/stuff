  var _p4SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _p4SaveRooms.apply(this, arguments);
    try { p4SaveCtx(); } catch (_) {}
    return r;
  };
