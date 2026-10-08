function roomCardHtml(r, where) {
  try {
    var w = waitingOf(r);
    var acts = WAIT.map(function (k) {
      var n = w[k] || 0;
      return '<span class="rc2-act' + (n ? ' on' : '') + '">' + RC_ICON[k] +
             (n ? '<span class="rc2-n">' + n + '</span>' : '') + '</span>';
    }).join('');

    /* Own language first, from this viewer's perspective. */
    var flags = gL(r.myLang).flag + ' ' + gL(r.theirLang).flag;

    var right1 = r.muted
      ? '<span class="rc2-bell"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.6 13V9A6.5 6.5 0 0 0 8 5.3M6.3 6.3C5.7 7.1 5.4 8 5.4 9v4l-2 3v1h14"/><path d="M10 21a2 2 0 0 0 4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg></span>'
      : '<button class="rc2-del" data-del="' + r.id + '" aria-label="Delete"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';

    return '<div class="rc2" data-room="' + r.id + '" data-where="' + (where || 'panel') + '">' +
      '<div class="rc2-name">' + esc(roomTitle(r)) + '</div>' + right1 +
      '<div class="rc2-who">' + esc(r.myName || S.user.name || 'Me') + ' ↔ ' + esc(r.partnerName || '?') + '</div>' +
      '<div class="rc2-when">' + fmtAgo(r.lastAt || r.createdAt) + '</div>' +
      '<div class="rc2-acts">' + acts + '</div>' +
      '<div class="rc2-flags">' + flags + '</div>' +
      '</div>';
  } catch (e) {
    rcLog('card_render_failed', { room: r && r.id, e: String(e && e.message || e) }, 'error');
    return '';
  }
}
