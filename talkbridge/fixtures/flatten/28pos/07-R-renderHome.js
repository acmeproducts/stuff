function renderHome() {
  try {
    var host = ensureHomeHost();
    if (!host) { rcLog('home_no_host', {}, 'warn'); return; }
    var cards = homeCards();
    var h = '<div class="home-sum">' + esc(homeSummaryText()) + '</div>';
    cards.forEach(function (r) { h += roomCardHtml(r, 'home'); });
    host.innerHTML = h;
    var wired = wireRoomCards(host);
    rcLog('home_rendered', { cards: cards.length, wired: wired || 0 }, 'ok');
  } catch (e) {
    rcLog('home_render_failed', { e: String(e && e.message || e) }, 'error');
  }
}
