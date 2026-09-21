/* ═══════════ GAP PART · T3-wrap-map.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: TB_WRAP_MAP
*/
/* ─────────────────────────────────────────────────────────────────────────────
   T-3 · THE WRAPPER-CHAIN MAP (§7.10 F3)

   `handleRelay` is wrapped many layers deep, so are `CALL.teardown`,
   `renderPanel` and `relayConnect`. Nobody can say from a device log which
   layer did what. This part reads the page's own source at boot — the app is
   one inline script — and, part by part, lists every assignment that
   re-binds a function the page defined at top level earlier (`X = function`,
   `X = latch(X)`, `CALL.x = function`). Locals that happen to share a name
   are not counted: only column-0 declarations, `var ROOT = {` objects and
   their `x: function` members define a symbol. The result is one `wrap_map`
   log line: { symbol: [part, part, …] in wrap order, innermost first }, and
   a `TB_WRAP_MAP` global for the harness. Read-only: it never calls
   anything it finds.
   ───────────────────────────────────────────────────────────────────────────── */
var TB_WRAP_MAP = (function () {
  try {
    var src = '';
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) if (!scripts[i].src && scripts[i].text) src += scripts[i].text + '\n';
    if (!src) return null;

    var partRe = /\/\* ═+ GAP PART · ([^\s═]+)/g;
    var bounds = [], m;
    while ((m = partRe.exec(src))) bounds.push({ name: m[1], at: m.index });
    bounds.push({ name: null, at: src.length });
    if (bounds.length < 2) return {};

    var fns = {}, roots = {};
    function learn(chunk) {
      var re, mm;
      re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
      while ((mm = re.exec(chunk))) fns[mm[1]] = true;
      re = /^(?:var\s+|let\s+|const\s+)?([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/gm;
      while ((mm = re.exec(chunk))) fns[mm[1]] = true;
      re = /^(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*\{/gm;
      while ((mm = re.exec(chunk))) roots[mm[1]] = true;
      re = /^([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\b/gm;
      while ((mm = re.exec(chunk))) if (roots[mm[1]]) fns[mm[1] + '.' + mm[2]] = true;
      re = /(^|[^\w$.])([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?function\b/g;
      while ((mm = re.exec(chunk))) for (var r in roots) fns[r + '.' + mm[2]] = true;   /* member of some root */
    }
    learn(src.slice(0, bounds[0].at));

    var assignRe = /(^|[^\w$.])((?:[A-Za-z_$][\w$]*)(?:\.[A-Za-z_$][\w$]*)?)\s*=(?!=)/g;
    var map = {};
    for (var b = 0; b < bounds.length - 1; b++) {
      var chunk = src.slice(bounds[b].at, bounds[b + 1].at);
      var seen = {};
      while ((m = assignRe.exec(chunk))) {
        var sym = m[2];
        if (seen[sym] || !fns[sym]) continue;
        if (/(?:var|let|const)\s*$/.test(chunk.slice(Math.max(0, m.index - 6), m.index + m[1].length))) continue;  /* a local of the same name */
        if (sym.indexOf('.') !== -1 && !roots[sym.split('.')[0]]) continue;
        seen[sym] = true;
        (map[sym] = map[sym] || []).push(bounds[b].name);
      }
      learn(chunk);
    }
    var count = 0; for (var k in map) count++;
    try { log('wrap_map', { symbols: count, map: map }, 'ok'); } catch (_) {}
    return map;
  } catch (e) {
    try { log('wrap_map_err', { e: String((e && e.message) || e) }, 'warn'); } catch (_) {}
    return null;
  }
})();
