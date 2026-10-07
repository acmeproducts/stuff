(function () {
  var _jEnterRoom = enterRoom;
  enterRoom = function (id) {
    /* A session opened from an invite carries its payload; apply it before the
       room is entered so transcription and translation start in the right
       languages rather than a stale pair. */
    try { if (S.invitePayload && S.invitePayload.r === id) applyInvitePayload(S.invitePayload); } catch (_) {}
    var r = _jEnterRoom.apply(this, arguments);
    try {
      var btn = $('room-menu-btn');
      if (btn && btn.style.display === 'none') { btn.style.display = ''; jLog('room_switcher_restored', {}, 'ok'); }
      var room = roomById(id);
      if (room) jLog('entered', { room: String(id).slice(-6), myLang: room.myLang, theirLang: room.theirLang, role: room.role }, 'ok');
    } catch (e) { jLog('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
