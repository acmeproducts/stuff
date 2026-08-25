
/* ═══════════ GAP PART · N6-gesture-first-permission.js ═══════════ */
/* @contract
   wraps: r10EnableNotifications (asks permission FIRST, synchronously inside
   the user's tap, then calls through unchanged)
   adds: nothing else
*/
/* ─────────────────────────────────────────────────────────────────────────────
   OWNER EVIDENCE 2026-08-24: on iPhone there was never an opportunity to
   enable — only camera and microphone ever prompted. Cause read from the
   code: the enable flow awaited serviceWorker.ready and getSubscription()
   BEFORE calling Notification.requestPermission(). iOS only shows the prompt
   when the ask happens synchronously inside the user's gesture; after those
   awaits the gesture token is gone and iOS refuses silently. Camera and mic
   prompt because getUserMedia is called directly in the tap.

   Fix: ask FIRST — the very first synchronous statement of the tap — then
   run the original flow unchanged. When permission is already granted (or
   just granted), the original's own requestPermission resolves immediately
   without a prompt, so nothing double-asks.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof r10EnableNotifications !== 'function') return;
  var _n6Orig = r10EnableNotifications;
  r10EnableNotifications = function () {
    var ask = (window.Notification && Notification.permission === 'default')
      ? Notification.requestPermission()               /* synchronous call, inside the gesture */
      : Promise.resolve(window.Notification ? Notification.permission : 'unsupported');
    return Promise.resolve(ask).then(function () { return _n6Orig(); });
  };
  r10EnableNotifications._n6Original = _n6Orig;
})();
