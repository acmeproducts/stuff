  function cellFill(node, side, text) {
    var cell = node.querySelector('.tr-col[data-side="' + side + '"] .tr-text');
    if (!cell) return;
    var html = tbmd_renderMarkdown(text);
    if (html) cell.innerHTML = html;
  }
  var _append = appendMsgDom;
  appendMsgDom = function (e, batch) {
    var r = _append.apply(this, arguments);
    try {
      if (!e || e.kind === 'sys') return r;
      if (typeof attHtml === 'function' && attHtml(e) !== '') return r;   /* attachment guard */
      var t = $('transcript'); if (!t) return r;
      var node = t.querySelector('.msg[data-id="' + e.id + '"]'); if (!node) return r;
      var mine = e.who === 'me';
      cellFill(node, 'left',  mine ? e.sourceText     : e.translatedText);
      cellFill(node, 'right', mine ? e.translatedText : e.sourceText);
      try { if (typeof log === 'function') log('md1_rendered', { id: String(e.id).slice(-6) }, 'ok'); } catch (_) {}
    } catch (_) {}
    return r;
  };
