  var _cr3RelaySend = relaySend;
  relaySend = function (m) {
    try { if (m && m.type === 'ping') { var w = cr3StateWord(S.roomId); m.visible = w.visible; m.inRoom = w.inRoom; m.muted = w.muted; } } catch (_) {}
    return _cr3RelaySend.apply(this, arguments);
  };
