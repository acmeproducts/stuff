  var _p6HandleRelay = handleRelay;
  handleRelay = function (d) {
    var r = _p6HandleRelay.apply(this, arguments);
    try {
      if (d && d.from !== deviceId && S.roomId) {
        if (d.type === 'thread-invite') p6OnInvite(S.roomId, d);
        else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(S.roomId, d);
        else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(S.roomId);
      }
    } catch (e) { p6Log('relay_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
