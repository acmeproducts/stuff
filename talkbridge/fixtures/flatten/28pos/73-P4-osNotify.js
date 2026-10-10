  var _p4OsNotify = osNotify;
  osNotify = function (title, body, roomId) {
    var r = _p4OsNotify.apply(this, arguments);
    try { p4SwNotify(title, body, roomId); } catch (_) {}
    return r;
  };
