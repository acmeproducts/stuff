(function () {
  var _lcEnterRoom = enterRoom;
  enterRoom = function (id) {
    enforceGrantExpiry();
    /* Before the original runs, so the invite link it builds already knows the
       room's name and whether it grants. */
    try { applyPendingCreate(id); } catch (e) { lcLog('apply_pending_failed', { e: String(e && e.message || e) }, 'error'); }
    var r = _lcEnterRoom.apply(this, arguments);
    try { applySendLock(roomById(id)); } catch (_) {}
    return r;
  };
})();
