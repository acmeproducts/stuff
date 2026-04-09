// tb-translate.js
// Pure text-in / text-out translation with local cache.
// CONTRACT:
//   - TBTranslate.text(text, fromLang, toLang) → Promise<string>
//   - Stateless except for the cache. No side effects.

var TBTranslate = (function () {
  'use strict';
  var _cache = new Map();

  function text(t, from, to) {
    t = (t || '').trim();
    if (!t || !from || !to || from === to) return Promise.resolve(t);
    var k = from + '|' + to + '|' + t;
    if (_cache.has(k)) return Promise.resolve(_cache.get(k));
    return fetch(
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(t) + '&langpair=' + from + '|' + to
    )
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.responseStatus === 200 && d.responseData) {
          var out = d.responseData.translatedText;
          if (out && out.indexOf('MYMEMORY') < 0) {
            _cache.set(k, out);
            return out;
          }
        }
        return t;
      })
      .catch(function () { return t; });
  }

  return { text: text };
})();
