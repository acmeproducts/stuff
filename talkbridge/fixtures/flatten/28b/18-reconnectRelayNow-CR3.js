  var _cr3ReconnectNow = reconnectRelayNow;
  reconnectRelayNow = function (why) {
    try {
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && ws._cr3Room === S.roomId) { cr3Log('reconnect_coalesced', { why: why }); return false; }
    } catch (_) {}
    return _cr3ReconnectNow.apply(this, arguments);
  };
