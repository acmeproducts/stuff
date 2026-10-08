  var _cr3BgAddPill = bgAddPill;
  bgAddPill = function (roomId, text) {
    if (typeof text === 'string' && text.indexOf('Missed ') === 0) { cr3Log('local_missed_pill_dropped', { room: roomId }); return; }
    return _cr3BgAddPill.apply(this, arguments);
  };
