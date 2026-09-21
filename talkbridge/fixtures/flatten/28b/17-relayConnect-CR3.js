  var _cr3RelayConnect = relayConnect;
  relayConnect = function () {
    try {
      var room = activeRoom();
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && room && ws._cr3Room === room.id) { cr3Log('connect_coalesced', { room: room.id }); return; }
    } catch (_) {}
    var r = _cr3RelayConnect.apply(this, arguments);
    try {
      var cur = _relayWs, rid = S.roomId;
      if (cur && cur.addEventListener) { cur._cr3Room = rid; cur.addEventListener('open', function () { cr3OnOpen(rid, cur, function () { return cur === _relayWs && S.roomId === rid; }); }); }
    } catch (e) { cr3Log('hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
