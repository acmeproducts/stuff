(function () {
  var _rmApplyTheme = applyBubbleTheme;
  applyBubbleTheme = function () {
    var r = _rmApplyTheme.apply(this, arguments);
    try {
      var room = activeRoom(); if (!room) return r;
      var bg = themeVal(room, 'hdrBg', '');
      var tag = $('bubble-theme-tag');
      if (tag && bg) tag.textContent = tag.textContent + '.tr-head{background:' + bg + '}';
      var picker = $('s4b-hdr-bg');
      if (picker) picker.value = bg || '#F5F1EC';
    } catch (e) { rmLog('header_bg_apply_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
