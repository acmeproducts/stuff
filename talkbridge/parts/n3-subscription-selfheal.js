
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
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.pushManager) return;
      return reg.pushManager.getSubscription().then(function (sub) {
        if (sub) return;                                    /* alive — the per-boot room sync covers the rest */
        r8Log('push_selfheal', { why: 'granted-but-no-subscription' }, 'ok');
        return r10EnableNotifications();                    /* silent: permission already granted */
      });
    }).catch(function () {});
  } catch (_) {}
}

setTimeout(phSelfHeal, 1400);
document.addEventListener('visibilitychange', function () {
  try { if (!document.hidden) phSelfHeal(); } catch (_) {}
});
