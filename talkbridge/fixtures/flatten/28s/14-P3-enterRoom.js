  var _p3EnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _p3EnterRoom.apply(this, arguments);
    try {
      if (!p3State.sub && !p3State.attempts) p3Attempt(false);
      else if (p3State.sub && !p3State.registered[id]) p3RegisterRoom(id);
    } catch (e) { p3Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
