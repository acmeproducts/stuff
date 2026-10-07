  /* Explicit open acknowledges the exact durable set. */
  var _cr3EnterRoom = enterRoom;
  enterRoom = function (id) {
    var before = S.roomId;
    var r = _cr3EnterRoom.apply(this, arguments);
    try {
      if (S.roomId === id) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (ws && ws.readyState === 1 && before === id) cr3Send(id, { type: 'ev-open' });
        else cr3State.openPending[id] = 1;
      }
    } catch (e) { cr3Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
