/* The base builds the whole bubble as a string with the origin mark already
   inside it, so the mark is replaced in the produced markup rather than the
   function being reimplemented — the rest of the bubble is untouched. */
(function () {
  var _r8MsgHtml = msgHtml;
  msgHtml = function (e) {
    var html = _r8MsgHtml.apply(this, arguments);
    try {
      if (!e) return html;
      var want = originIcon(e);
      if (!want) return html;
      if (/<span class="origin-mark">/.test(html)) {
        /* Only the leading origin mark is swapped; the header's action buttons
           and receipt markup are left exactly as the base produced them. */
        return html.replace(/<span class="origin-mark">[\s\S]*?<\/span>/, want);
      }
      /* Typed entries: the base produced NO mark, so one is inserted at the
         head of the who-span — the exact slot the spoken mark occupies.
         READ FROM THE BASE, not assumed: msgHtml's head is
         '<span class="tr-who who' + (mine ? ' mine' : '') + '">'. The earlier
         build anchored on class="who" — markup that renderer never produces —
         and shipped an inserter that could not insert. */
      return html.replace(/(<span class="tr-who who[^"]*">)/, '$1' + want);
    } catch (err) {
      r8Log('origin_mark_failed', { e: String(err && err.message || err) }, 'error');
      return html;
    }
  };
})();
