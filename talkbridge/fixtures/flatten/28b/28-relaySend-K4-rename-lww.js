  var _relaySend = relaySend;
  relaySend = function (m) {
    if (m && m.type === 'sys-pill' && typeof m.newRoomName === 'string') {
      m.ts = m.ts || Date.now();
      var r = (typeof activeRoom === 'function') ? activeRoom() : null;
      if (r && r.title === m.newRoomName) { r.titleTs = m.ts; try { saveRooms(); } catch (_) {} }
    }
    return _relaySend.apply(this, arguments);
  };
