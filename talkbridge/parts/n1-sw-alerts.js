/* N1 (25·base, plan v20.20.0 §5.1) — Android alert presentation (#652).
   Wraps ServiceWorkerRegistration.prototype.showNotification and calls
   through: injects icon and badge when absent; forces silent:false unless a
   caller explicitly set silent. Every existing option (tag, renotify, data,
   requireInteraction, vibrate) passes untouched. Replaces nothing. */
(function () {
  var ICON = '/stuff/icon-192.png';
  var BADGE = '/stuff/icon-badge-96.png';
  var orig = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, opts) {
    opts = opts || {};
    if (!('icon' in opts)) opts.icon = ICON;
    if (!('badge' in opts)) opts.badge = BADGE;
    if (!('silent' in opts)) opts.silent = false;
    return orig.call(this, title, opts);
  };
})();
