  var _p6Listen = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    var r = _p6Listen.apply(this, arguments);
    try {
      if (d && d.from !== deviceId) {
        if (d.type === 'thread-invite') p6OnInvite(roomId, d);
        else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(roomId, d);
        else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(roomId);
      }
    } catch (e) { p6Log('listen_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
