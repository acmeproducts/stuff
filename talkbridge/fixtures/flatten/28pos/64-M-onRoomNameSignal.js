function onRoomNameSignal(roomId, d) {
  if (!d || d.type !== 'sys-pill' || typeof d.newRoomName !== 'string') return false;
  var r = roomById(roomId || d.room);
  var to = String(d.newRoomName).slice(0, 40);
  if (!r || !to) return false;
  var from = typeof d.wasRoomName === 'string' ? d.wasRoomName : (r.title || '');
  if (r.title !== to) {
    r.title = to;
    saveRooms();
    rmLog('rename_received', { from: from, to: to, by: d.byName || '' }, 'ok');
    try { renderRoomHead(); renderPanel(); } catch (_) {}
  }
  /* false, deliberately: the base still needs to write and render the pill. */
  return false;
}
