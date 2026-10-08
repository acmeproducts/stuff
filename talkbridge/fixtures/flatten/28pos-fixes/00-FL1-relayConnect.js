function relayConnect() {
  /* CR3 · a connect while the lane is still connecting is a duplicate, not a recovery */
  try {
    var room0 = activeRoom();
    var ws0 = (typeof _relayWs !== 'undefined') ? _relayWs : null;
    if (ws0 && ws0.readyState === 0 && room0 && ws0._cr3Room === room0.id) { cr3Log('connect_coalesced', { room: room0.id }); return; }
  } catch (_) {}
  /* base */
  var room = activeRoom();
  if (room) {
    if (_relayWs) try { _relayWs.close(); } catch (_) {}
    var ws = new WebSocket(RELAY_WS + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(room.id) + '&client=' + encodeURIComponent(deviceId));
    _relayWs = ws;
    ws.onopen = function () {
      if (ws !== _relayWs) return;
      log('relay_open', { room: room.id }, 'ok');
      relaySend({ type: 'hello', lang: room.myLang, targetLang: room.theirLang, role: room.role, name: room.myName || S.user.name });
      startHB();
      resendUndelivered();
      _relayReconnecting = false; renderPartnerState();
    };
    ws.onmessage = function (e) { try { handleRelay(JSON.parse(e.data)); } catch (_) {} };
    ws.onclose = function (ev) {
      if (ws !== _relayWs) return;
      log('relay_close', { code: ev.code }, 'warn'); stopHB(); clearTimeout(wsReconnectTimer);
      if (S.view === 'room' && S.roomId) {
        _relayReconnecting = true; renderPartnerState();
        wsReconnectTimer = setTimeout(function () { wsReconnectTimer = null; if (S.view === 'room') relayConnect(); }, 2000);
      }
    };
    ws.onerror = function () { log('relay_err', {}, 'error'); };
  }
  /* The three "after" blocks below ran on whatever `_relayWs` held, even when
     the base returned early for want of a room — kept as it was (0d D-11). */
  /* T-net · how long the socket lived */
  try {
    if (typeof _relayWs !== 'undefined' && _relayWs && _relayWs.addEventListener) {
      var openedAt = Date.now();
      _relayWs.addEventListener('close', function (ev) {
        netLog('relay_closed', { code: ev.code, livedMs: Date.now() - openedAt, hidden: !!document.hidden }, 'warn');
      });
    }
  } catch (_) {}
  /* CR3 · the lane announces itself when it opens */
  try {
    var cur = _relayWs, rid = S.roomId;
    if (cur && cur.addEventListener) { cur._cr3Room = rid; cur.addEventListener('open', function () { cr3OnOpen(rid, cur, function () { return cur === _relayWs && S.roomId === rid; }); }); }
  } catch (e) { cr3Log('hook_failed', { e: String(e && e.message || e) }, 'error'); }
  /* V2 · the socket comes back as fast as the network does */
  try {
    var ws2 = _relayWs;
    if (ws2 && !ws2.__v2) {
      ws2.__v2 = true;
      ws2.addEventListener('open', function () {
        if (ws2 !== _relayWs) return;
        _v2Attempt = 0;
        clearTimeout(_v2Timer); _v2Timer = null;
      });
      ws2.addEventListener('close', function () {
        if (ws2 !== _relayWs) return;                /* a replaced socket is not ours to retry */
        if (S.view !== 'room' || !S.roomId) return;
        /* the base onclose has already armed its 2 s timer by now (it was
           registered first); take it over so exactly one retry is pending */
        clearTimeout(wsReconnectTimer); wsReconnectTimer = null;
        v2Schedule('close');
      });
    }
  } catch (_) {}
}
