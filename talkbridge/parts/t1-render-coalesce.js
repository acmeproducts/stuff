/* ═══════════ GAP PART · T1-render-coalesce.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: renderTranscript, renderPanel, renderHome
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   T-1 · RENDER COALESCING (§7.10 F1)

   `renderTranscript` rebuilds the whole transcript from scratch (innerHTML =
   '' and re-append every entry); `renderPanel` is called from 34 sites and is
   wrapped four deep; the device log shows `rc_panel_rendered` three times in
   the same millisecond. Every burst is paid in full.

   THE LATCH: the first call in a burst renders synchronously — callers that
   read the DOM right after still see it. Any further call inside the same
   animation frame is collapsed into ONE trailing render at the next frame,
   which draws from the live state, so the final picture is always the latest.
   Nothing is skipped that would have changed the screen; only the redundant
   middle renders go. `t1_coalesced {fn, n}` is logged when a burst collapses,
   so the saving is visible in the device log.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function (f) { return setTimeout(f, 16); };

  function latch(name, orig) {
    if (typeof orig !== 'function') return orig;
    var busy = false, pending = 0;
    var latched = function () {
      var self = this, args = arguments;
      if (busy) { pending++; return; }
      busy = true;
      var r = orig.apply(self, args);
      raf(function () {
        busy = false;
        if (pending) {
          var n = pending; pending = 0;
          try { log('t1_coalesced', { fn: name, n: n }, 'info'); } catch (_) {}
          latched.apply(self, args);
        }
      });
      return r;
    };
    return latched;
  }

  renderTranscript = latch('renderTranscript', renderTranscript);
  renderPanel = latch('renderPanel', renderPanel);
  renderHome = latch('renderHome', renderHome);
})();
