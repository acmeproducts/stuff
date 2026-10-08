async function normalizeOutgoing(room, text, knownLang) {
  /* When the caller knows what language the text is in — because it arrived on
     a channel listening for exactly that language — that is used directly.
     Detection is a fallback for when nothing knows. */
  var detected = knownLang || await detectLangAsync(text);
  if (detected === 'th') text = applyNorthernThaiMap(text);
  var r = resolveEffectiveLang(room, detected);
  var srcText = text, srcLang = r.srcLang;
  if (r.normalizeFrom) {
    var n = await translateWithRetry(text, r.normalizeFrom, srcLang, 2);
    var out = n && n.text ? norm(n.text) : '';
    var same = !!out && out.toLowerCase() === norm(text).toLowerCase();
    if (n.ok && out && !same) {
      srcText = out;
    } else {
      /* Normalization did not produce a rewrite. Two very different causes hide
         behind that, and they need opposite fixes, so the reason is recorded
         rather than inferred:
           failed  — the rewrite call did not come back
           empty   — it came back with nothing
           same    — it came back identical, which may mean the text was already
                     in the room's language and detection was wrong about it */
      var why = !n.ok ? 'failed' : (!out ? 'empty' : 'same');
      log('normalize_no_rewrite', {
        why: why, from: r.normalizeFrom, to: srcLang,
        inText: String(text).slice(0, 40),
        outText: String(out).slice(0, 40)
      }, 'warn');
      srcLang = r.normalizeFrom;
    }
  }
  return { text: srcText, lang: srcLang, detected: detected };
}
