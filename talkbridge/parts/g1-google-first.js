/* ═══════════ GAP PART · G1-google-first.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: translateWithRetry
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   G-1 · GOOGLE FIRST, MYMEMORY AS THE FALLBACK (owner, 2026-10-03)

   The frozen translator asks MyMemory, a memory of stored sentences, not a
   translator: for Korean it returned fragments of loosely matching sentences.
   chat-test r3 proved the alternative on the phone: Google's free web endpoint
   first, MyMemory only when Google fails. This part is that, as a wrapper.

   Same cache, same signature, same result shape. Every translation logs which
   service served it (`trans_ok {provider}`); a Google failure logs
   `trans_fallback` and calls the frozen path through, untouched. Google's
   endpoint is not an officially supported service and may throttle or vanish;
   that is exactly why the fallback stays.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof translateWithRetry !== 'function' || typeof trCache === 'undefined') return;

  var gcode = function (c) { return c === 'zh' ? 'zh-CN' : c === 'fil' ? 'tl' : c; };
  function keep(k, t) {
    if (trCache.size >= TR_CACHE_MAX) { var first = trCache.keys().next().value; trCache.delete(first); }
    trCache.set(k, t);
  }

  var _translateWithRetry = translateWithRetry;
  translateWithRetry = function (text, from, to, retries) {
    var self = this, args = arguments;
    if (!text || !from || !to || from === to) return _translateWithRetry.apply(self, args);
    var k = from + '|' + to + '|' + text;
    if (trCache.has(k)) return _translateWithRetry.apply(self, args);            /* the frozen cache hit */
    var t0 = Date.now();
    return fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=' + gcode(from) + '&tl=' + gcode(to) + '&dt=t&q=' + encodeURIComponent(text))
      .then(function (r) { if (!r.ok) throw new Error('google http ' + r.status); return r.json(); })
      .then(function (d) {
        var t = Array.isArray(d) && Array.isArray(d[0]) ? d[0].map(function (x) { return x && x[0] || ''; }).join('') : '';
        t = cleanTr(t); if (!t) throw new Error('google empty');
        keep(k, t);
        try { log('trans_ok', { provider: 'google', from: from, to: to, ms: Date.now() - t0, inChars: text.length, outChars: t.length }, 'ok'); } catch (_) {}
        return { text: t, ok: true };
      })
      .catch(function (ge) {
        try { log('trans_fallback', { provider: 'google', from: from, to: to, ms: Date.now() - t0, e: String(ge && ge.message || ge).slice(0, 60) }, 'warn'); } catch (_) {}
        return Promise.resolve(_translateWithRetry.apply(self, args)).then(function (r) {
          try { if (r && r.ok) log('trans_ok', { provider: 'mymemory', from: from, to: to, ms: Date.now() - t0, inChars: text.length, outChars: String(r.text || '').length }, 'ok'); } catch (_) {}
          return r;
        });
      });
  };
})();
