function onVisible(why) {
  var away = Date.now() - NET.lastVisible;
  NET.lastVisible = Date.now();
  netLog('returned', { why: why, awayMs: away, inRoom: !!S.roomId, inCall: !!CALL.active });
  if (!S.roomId) return;
  reconnectRelayNow(why);
  forceCallReconnect(why);
}
