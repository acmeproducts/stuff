/* ── Panel · the persistent full list (1.7) ────────────────────────────────
   Replaced rather than wrapped because the card markup itself changes. The
   recycle bin below it is preserved exactly as it was. */
function renderPanel() {
  var body = $('panel-body'); if (!body) { rcLog('panel_no_body', {}, 'warn'); return; }
  try {
    var live = S.rooms.filter(function (r) { return !r.deletedAt; })
      .sort(function (a, b) { return (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt); });
    var bin = S.rooms.filter(function (r) { return r.deletedAt; });

    var h = '';
    live.forEach(function (r) { h += roomCardHtml(r, 'panel'); });

    if (bin.length) {
      h += '<div class="bin-sec' + (renderPanel._binOpen ? ' open' : '') + '" id="bin-sec"><div class="bin-head" id="bin-head">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>' +
        'Recycle bin (' + bin.length + ')</div><div class="bin-body">';
      bin.forEach(function (r) {
        h += '<div class="bin-row"><span class="rc-title">' + esc(roomTitle(r)) + '</span>' +
          '<button class="bin-act" data-restore="' + r.id + '">Restore</button>' +
          '<button class="bin-act danger" data-harddel="' + r.id + '">Delete Forever</button></div>';
      });
      h += '</div></div>';
    }

    body.innerHTML = h || '<div style="text-align:center;color:var(--ink-dim);font-size:13.5px;padding:30px 10px">No conversations yet</div>';

    var wired = wireRoomCards(body);

    body.querySelectorAll('[data-restore]').forEach(function (el) {
      el.addEventListener('click', function () {
        var r = roomById(el.dataset.restore);
        if (r) { delete r.deletedAt; saveRooms(); rcLog('room_restored', { room: r.id }, 'ok'); renderPanel(); }
      });
    });
    body.querySelectorAll('[data-harddel]').forEach(function (el) {
      el.addEventListener('click', function () {
        var r = roomById(el.dataset.harddel); if (!r) return;
        S.rooms = S.rooms.filter(function (x) { return x.id !== r.id; });
        try { localStorage.removeItem(trKey(r.id)); } catch (_) {}
        saveRooms(); rcLog('room_hard_deleted', { room: r.id }, 'ok'); renderPanel();
      });
    });
    var bh = $('bin-head');
    if (bh) bh.addEventListener('click', function () {
      renderPanel._binOpen = !renderPanel._binOpen;
      $('bin-sec').classList.toggle('open', renderPanel._binOpen);
    });

    rcLog('panel_rendered', { live: live.length, bin: bin.length, wired: wired || 0 }, 'ok');
    renderHome();
  } catch (e) {
    rcLog('panel_render_failed', { e: String(e && e.message || e) }, 'error');
  }
}
