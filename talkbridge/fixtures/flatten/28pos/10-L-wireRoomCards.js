/* Delete and restore carry lifecycle meaning rather than only a timestamp. */
function wireRoomCards(host) {
  if (!host) return 0;
  var cards = host.querySelectorAll('.rc2');
  cards.forEach(function (el) {
    el.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-del]')) return;
      var id = el.dataset.room;
      try {
        if (el.dataset.where === 'home') dismissHome(id, true); else closePanel();
        enterRoom(id);
      } catch (e) { rcLog('card_tap_failed', { e: String(e && e.message || e) }, 'error'); }
    });
  });
  host.querySelectorAll('[data-del]').forEach(function (el) {
    el.addEventListener('click', function (ev) { ev.stopPropagation(); softDeleteRoom(el.dataset.del); });
  });
  return cards.length;
}
