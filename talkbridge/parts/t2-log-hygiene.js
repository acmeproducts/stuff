/* ═══════════ GAP PART · T2-log-hygiene.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: log
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   T-2 · LOG HYGIENE (§7.10 F2) — one allowlist, rate-limited, nothing silenced

   The local log keeps 400 lines; the shared device log is what the owner
   reads at a gate. In the shared log, five markers account for more lines
   than everything else combined:

       412 joiner_create_control   402 rc_home_rendered   387 rc_panel_rendered
       274 md1_rendered            217 cr3_announce        142 pr2_declared

   Each fires on every re-render and says the same thing every time. They
   evict the lines that matter (a call's transitions, a rename, a failure).

   THE RULE: a marker on the list passes once per 5 s; the rest of a burst is
   counted, not written, and the count rides on the next line that passes as
   `dropped`. Nothing is silenced outright — a burst still shows up, as one
   line with a number. Every marker not on the list is untouched. The list is
   the single place to change this.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof log !== 'function') return;

  var WINDOW_MS = 5000;
  var LIMITED = {
    joiner_create_control: 1, rc_home_rendered: 1, rc_panel_rendered: 1,
    md1_rendered: 1, cr3_announce: 1, pr2_declared: 1, pr3_dot: 1
  };
  var last = {}, dropped = {};

  var _log = log;
  log = function (ev, d, lvl) {
    try {
      if (LIMITED[ev]) {
        var now = Date.now();
        if (last[ev] && now - last[ev] < WINDOW_MS) { dropped[ev] = (dropped[ev] || 0) + 1; return; }
        last[ev] = now;
        if (dropped[ev]) {
          var d2 = {}; for (var k in (d || {})) d2[k] = d[k];
          d2.dropped = dropped[ev]; dropped[ev] = 0;
          return _log.call(this, ev, d2, lvl);
        }
      }
    } catch (_) {}
    return _log.apply(this, arguments);
  };
})();
