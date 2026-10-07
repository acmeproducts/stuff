/* ── Joining · a grant link persists; a plain invite does not ─────────────── */
(function () {
  var _lcJoinRoom = joinRoom;
  joinRoom = function (p) {
    var r = _lcJoinRoom.apply(this, arguments);
    try {
      if (p && p.g === 1) writeGrantedCredentials(p, p.r);
      else lcLog('joined_plain', { room: p && String(p.r).slice(-6) }, 'ok');
    } catch (e) { lcLog('join_grant_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
