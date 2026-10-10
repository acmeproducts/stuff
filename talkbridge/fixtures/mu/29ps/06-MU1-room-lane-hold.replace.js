  /* base */
  var room = activeRoom();
  if (mu1Hold(room)) return;                                        /* MU-1 · a full room is not re-asked for a while */
  if (room) {
    if (_relayWs) try { _relayWs.close(); } catch (_) {}