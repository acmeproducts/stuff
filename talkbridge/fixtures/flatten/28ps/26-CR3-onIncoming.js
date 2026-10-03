  var _cr3OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    if (!cr3Attended()) { cr3Log('ring_deferred_hidden', { room: room && room.id, callId: d && d.callId }, 'ok'); return; }
    if (d && d.callId) cr3State.rung[d.callId] = 1;
    return _cr3OnIncoming.apply(this, arguments);
  };
