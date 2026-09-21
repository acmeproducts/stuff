/* ═══════════ GAP PART · S2-back-absorb.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: (none) — one popstate listener, active only during a call
*/
/* ─────────────────────────────────────────────────────────────────────────────
   S-2 · THE BACK BUTTON DOES NOTHING DURING A CALL (§7.15, owner ruling 2026-09-20)

   Candidate 5 pushes one history entry when a call mounts and, having dropped
   the corner band (V2), listens to nothing — so the first back press is eaten
   and the second leaves the app; Android suspends the page and the far side
   freezes (G57). The owner's ruling: back should be DISABLED during a call.

   This part re-pushes the entry every time back is pressed while a call is
   active, so there is always one more entry to absorb. Outside a call it does
   nothing. It adds a listener; it replaces nothing and touches no handler the
   baseline owns.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof CALL === 'undefined' || !CALL) return;
  window.addEventListener('popstate', function () {
    try {
      if (!CALL.active) return;
      history.pushState({ tbCall: 1 }, '', location.href);
      log('s2_back_absorbed', { kind: CALL.kind }, 'info');
    } catch (_) {}
  });
})();
