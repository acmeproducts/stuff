
/* ═══════════ GAP PART · N4-listener-heartbeat.js ═══════════ */
/* @contract
   wraps: nothing
   adds: one interval — background room listeners send the same 30s ping the
   active room already sends
*/
/* ─────────────────────────────────────────────────────────────────────────────
   RV2.1 counts a socket as listening only if it has SPOKEN within 105s. The
   active room pings every 30s; background listeners said hello once and went
   silent forever — under the freshness rule they would read as stale and the
   relay would push for rooms the phone is actively holding open: the double
   alert. Every socket this phone holds now speaks.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof LISTEN !== 'object' || !LISTEN) return;
  setInterval(function () {
    try {
      for (var id in (LISTEN.socks || {})) LISTEN.send(id, { type: 'ping', transient: true });
    } catch (_) {}
  }, 30000);
})();

