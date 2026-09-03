/* N5 (25·base, plan v20.28.0 §5.1) — THE ANDROID RING REGRESSION.
   Found by reading the repo, not by reasoning: every worker from the first
   PWA build (a7983a12, 2026-08-09) through R10.2 (e74c7cb2) showed push
   notifications with renotify:true. Commit 339eb402 (R10-CR1) changed it to
   renotify:false. Notifications carry a stable per-room tag, so every push
   after the first REPLACES the one already in the shade — and Android
   re-alerts (sound, vibration, heads-up) on a replacement only when renotify
   is true. With it false the replacement is silent, which is exactly the
   reported symptom: the phone rings while the app is open (the page's own
   ringer plays) and is silent when unfocused or locked (only the OS can
   alert, and it was told not to). The app's own foreground path never
   changed — it still passes renotify:true — which is why only the background
   case regressed.
   This part forces renotify back on for every tagged notification the worker
   shows, and supplies the icon and badge (#652). It wraps
   showNotification, which is resolved at call time, so the frozen handler
   above keeps running unchanged. */
(function () {
  var ICON = '/stuff/icon-192.png';
  var BADGE = '/stuff/icon-badge-96.png';
  var orig = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, opts) {
    opts = opts || {};
    if (opts.tag) opts.renotify = true;
    if (!('icon' in opts)) opts.icon = ICON;
    if (!('badge' in opts)) opts.badge = BADGE;
    if (!('silent' in opts)) opts.silent = false;
    return orig.call(this, title, opts);
  };
})();

/* N6 (25·base, plan v20.29.0 — G30). Pairs with the relay's return to
   always-push: the DEVICE decides display, as it did in R10.2. If a window is
   genuinely visible the alert is skipped (the app is already showing it);
   otherwise it is shown. This is what makes always-push quiet while you are
   using the app and audible when the phone is unfocused or locked. */
(function () {
  var orig = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, opts) {
    var self_ = this;
    var args = arguments;
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      var visible = (list || []).some(function (c) { return c.visibilityState === 'visible'; });
      if (visible) return;                    /* the app is in front — its own UI already alerted */
      return orig.apply(self_, args);
    }).catch(function () { return orig.apply(self_, args); });
  };
})();
