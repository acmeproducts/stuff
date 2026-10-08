(function () {
  if (typeof relaySend !== 'function' || typeof onRoomNameSignal !== 'function') return;


  var _onRoomNameSignal = onRoomNameSignal;
  onRoomNameSignal = function (roomId, d) {
    if (d && d.type === 'sys-pill' && typeof d.newRoomName === 'string') {
      var r = roomById(roomId || d.room);
      var ts = Number(d.ts) || 0, mine = (r && Number(r.titleTs)) || 0;
      var to = String(d.newRoomName).slice(0, 40);
      if (r && ts && mine && (ts < mine || (ts === mine && to <= (r.title || '')))) {
        try { log('k4_rename_stale', { kept: r.title, ignored: to, ts: ts, mine: mine }, 'warn'); } catch (_) {}
        return false;                       /* the base still writes and renders the pill */
      }
      var out = _onRoomNameSignal.apply(this, arguments);
      if (r && ts && r.title === to) { r.titleTs = ts; try { saveRooms(); } catch (_) {} }
      return out;
    }
    return _onRoomNameSignal.apply(this, arguments);
  };
})();
