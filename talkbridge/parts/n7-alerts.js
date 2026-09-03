/* N7 (25·base, plan v20.31.0 §5.1) — RESTORE THE R10.2 ALERT RECIPE.
   Not invented here: this is the presentation rule from R10.2
   (commit e74c7cb2, plan v20.0.0 §4.6 ALWAYS-PUSH), the release under which
   Android rang for several releases, reproduced verbatim as a part on top of
   the accepted worker.
     - the relay always pushes (see worker-talk.js N7);
     - THIS worker decides presentation from ground truth: a VISIBLE window
       exists → non-iOS skip (the app is the alert); iOS show, then close it
       (Apple revokes subscriptions that receive silent pushes); no visible
       window → show;
     - every tagged alert re-alerts (renotify), so the second message in a room
       rings instead of silently replacing the first;
     - icon and badge so the alert is TalkBridge, not a generic bell (#652).
   Hooks only what resolves at call time. */
(function () {
  var ICON = '/stuff/icon-192.png';
  var BADGE = '/stuff/icon-badge-96.png';
  function isIOS() {
    try {
      var ua = self.navigator.userAgent;
      return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && self.navigator.maxTouchPoints > 1);
    } catch (_) { return false; }
  }
  function visibleClient() {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < (list || []).length; i++) {
        if (list[i].visibilityState === 'visible' || list[i].focused) return list[i];
      }
      return null;
    }).catch(function () { return null; });
  }
  var orig = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, opts) {
    var reg = this;
    opts = opts || {};
    if (opts.tag) opts.renotify = true;
    if (!('icon' in opts)) opts.icon = ICON;
    if (!('badge' in opts)) opts.badge = BADGE;
    if (!('silent' in opts)) opts.silent = false;
    return visibleClient().then(function (vc) {
      if (vc && !isIOS()) return;                       /* the app is on screen and presents it itself */
      return orig.call(reg, title, opts).then(function () {
        if (!vc) return;                                /* iOS with the app in front: shown, now clear it */
        return reg.getNotifications({ tag: opts.tag }).then(function (ns) {
          (ns || []).forEach(function (n) { try { n.close(); } catch (_) {} });
        }).catch(function () {});
      });
    });
  };
})();
