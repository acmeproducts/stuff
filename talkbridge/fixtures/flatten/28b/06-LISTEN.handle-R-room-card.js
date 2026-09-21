(function () {
  var _rListenHandle = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    var room = roomById(roomId);
    var before = (room && room.unread) || 0;
    /* The pending ring is cleared inside the original, so its kind is read now. */
    var ringKind = (CALL.ringPending && CALL.ringPending.roomId === roomId)
      ? (CALL.ringPending.kind === 'video' ? 'video' : 'voice') : null;
    var r = _rListenHandle.apply(this, arguments);
    try {
      if (room && (room.unread || 0) > before) {
        room.unread = before;
        var kind = (d && d.type === 'call-end' && ringKind) ? ringKind : 'chat';
        bumpWaiting(room, kind);
        saveRooms();
        renderPanel();
      }
    } catch (e) { rcLog('listen_count_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
