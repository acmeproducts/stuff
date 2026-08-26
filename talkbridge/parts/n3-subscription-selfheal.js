
/* ═══════════ GAP PART · PH-subscription-selfheal.js ═══════════ */
/* @contract
   wraps: nothing
   adds: phSelfHeal (boot + return check)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   RESEARCHED, not invented (Apple dev forums, documented iOS field reports):
   iOS spontaneously kills web-push subscriptions — after silent pushes, after
   OS updates, sometimes after nothing at all. The professional pattern is to
   RE-VALIDATE on every app open: permission granted but no subscription
   means iOS killed it, and since permission is already granted, the app may
   resubscribe silently — no tap needed. The existing enable flow is reused
   verbatim; this only notices the corpse and runs it. The relay already
   prunes dead endpoints on 404/410, and the service worker already shows
   every push instantly inside waitUntil (the two other researched killers).
   ───────────────────────────────────────────────────────────────────────────── */

function phSelfHeal() {
  try {
    if (!('serviceWorker' in navigator) || !window.Notification) return;
    if (Notification.permission !== 'granted') return;      /* nothing granted, nothing to heal */
    /* iPhone evidence 2026-08-26: the heal fired then went silent for minutes.
       Every step now names itself and carries a deadline — a hang cannot be
       silent, and the next capture identifies the dying line. */
    var step = function (name, ms, p) {
      var t = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); });
      return Promise.race([p, t]).then(
        function (v) { r8Log('heal_step', { s: name, ok: true }, 'ok'); return v; },
        function (e) { r8Log('heal_step', { s: name, ok: false, e: String(e && e.message || e) }, 'error'); throw e; });
    };
    step('sw-ready', 6000, navigator.serviceWorker.ready).then(function (reg) {
      if (!reg.pushManager) { r8Log('heal_step', { s: 'push-manager', ok: false }, 'error'); return; }
      return step('get-subscription', 6000, reg.pushManager.getSubscription()).then(function (sub) {
        if (sub) return;                                    /* alive — the per-boot room sync covers the rest */
        r8Log('push_selfheal', { why: 'granted-but-no-subscription' }, 'ok');
        return step('enable-flow', 15000, r10EnableNotifications());
      });
    }).catch(function () {});
  } catch (_) {}
}

setTimeout(phSelfHeal, 1400);
document.addEventListener('visibilitychange', function () {
  try { if (!document.hidden) phSelfHeal(); } catch (_) {}
});
