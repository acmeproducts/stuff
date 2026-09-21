  var _cr3ListenHandle = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { cr3Apply(roomId, d); } catch (e) { cr3Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr3ListenHandle.apply(this, arguments);
  };
