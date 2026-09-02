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

/* N3 (G26): Chrome substitutes its own "site updated in the background"
   message — with unsubscribe and spam prompts — whenever a push arrives and
   the worker leaves no notification visible (pushpad.xyz; w3c/push-api#359).
   This adds a last-resort guarantee: after every push event settles, if no
   notification is showing for it, show one. Wraps the push listener; the
   frozen handler still runs first and unchanged. */
(function () {
  var origAdd = self.addEventListener.bind(self);
  self.addEventListener = function (type, fn, opts) {
    if (type !== 'push') return origAdd(type, fn, opts);
    return origAdd('push', function (e) {
      var settled;
      var wrapped = {
        data: e.data,
        waitUntil: function (p) {
          settled = Promise.resolve(p).catch(function () {}).then(function () {
            return self.registration.getNotifications().then(function (list) {
              if (list && list.length) return;
              return self.registration.showNotification('TalkBridge', {
                body: 'New activity', tag: 'tb-fallback-visible', silent: false
              });
            }).catch(function () {});
          });
          e.waitUntil(settled);
        }
      };
      try { fn.call(self, wrapped); } catch (_) {}
      if (!settled) wrapped.waitUntil(Promise.resolve());
    }, opts);
  };
})();

/* N4 (25·base rebuild, plan v20.26.0 §5.1 — G27). ROOT CAUSE of "tapping the
   notification opens Chrome, not TalkBridge": the frozen worker computes its
   tap destination as its own scope + a hardcoded file name
   ('bridge-turn24-post-ship.html'). While the worker lived at /stuff/ that
   resolved to a real file. After the scope move it resolves to
   /stuff/talkbridge/bridge-turn24-post-ship.html, which does not exist — the
   tap opens a browser tab on a missing page instead of the installed app.
   Fix: rewrite that stale destination to this worker's real app file, on
   every notification, without touching the frozen handler. */
(function () {
  var APP_HERE = self.registration.scope + 'bridge-turn25-base.html';
  var STALE = /bridge-turn24-post-ship\.html(\?|#|$)/;
  var orig = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, opts) {
    opts = opts || {};
    if (!opts.data) opts.data = {};
    if (!opts.data.url || STALE.test(String(opts.data.url))) opts.data.url = APP_HERE;
    return orig.call(this, title, opts);
  };
})();
