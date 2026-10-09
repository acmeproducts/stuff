  /* base */
  var room = activeRoom();
  if (room) {
    if (_relayWs) try { _relayWs.close(); } catch (_) {}