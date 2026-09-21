function reconnectRelayNow(why) {
  try {
    var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
    var state = ws ? ws.readyState : -1;
    if (state === 1) { netLog('relay_ok', { why: why }, 'ok'); return false; }
    NET.reconnects++;
    netLog('relay_reconnecting', { why: why, state: state, n: NET.reconnects }, 'warn');
    if (ws) { try { ws.close(); } catch (_) {} }
    relayConnect();
    return true;
  } catch (e) { netLog('relay_reconnect_failed', { e: String(e && e.message || e) }, 'error'); return false; }
}
