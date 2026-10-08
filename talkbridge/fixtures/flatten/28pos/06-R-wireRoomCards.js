/* Tapping anywhere on the card opens the room — including truncated text (4.2).
   Only the delete control is exempt. */
function wireRoomCards(host) {
  if (!host) return;
  var cards = host.querySelectorAll('.rc2');
  cards.forEach(function (el) {
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-del]')) return;
      var id = el.dataset.room;
      rcLog('card_tap', { room: id, where: el.dataset.where }, 'ok');
      try {
        if (el.dataset.where === 'home') dismissHome(id, true);
        else closePanel();
        enterRoom(id);
      } catch (e) { rcLog('card_tap_failed', { room: id, e: String(e && e.message || e) }, 'error'); }
    });
  });
  host.querySelectorAll('[data-del]').forEach(function (el) {
    el.addEventListener('click', function (ev) {
      ev.stopPropagation();
      try {
        var r = roomById(el.dataset.del);
        if (!r) return;
        r.deletedAt = Date.now(); saveRooms();
        rcLog('room_soft_deleted', { room: r.id }, 'ok');
        renderPanel();
      } catch (e) { rcLog('room_delete_failed', { e: String(e && e.message || e) }, 'error'); }
    });
  });
  return cards.length;
}
