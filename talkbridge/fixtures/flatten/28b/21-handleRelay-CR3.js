  var _cr3HandleRelay = handleRelay;
  handleRelay = function (d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { if (S.roomId) cr3Apply(S.roomId, d); } catch (e) { cr3Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    var wasAttended = cr3Attended();
    var r = _cr3HandleRelay.apply(this, arguments);
    try {
      if (d && d.from !== deviceId && d.eventId && cr3IsRecord(d) && d.type !== 'call-start' && wasAttended && S.view === 'room' && S.roomId) cr3Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });
    } catch (e) { cr3Log('seen_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
