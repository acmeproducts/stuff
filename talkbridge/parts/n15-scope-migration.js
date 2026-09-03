/* N15 (D-2). PRISM un-hijack. The app now lives in its own folder, so its
   manifest and its worker claim ONLY /stuff/talkbridge/ and nothing else under
   /stuff/ is captured. Relative paths do the work: the worker is registered
   from this folder, so its scope is this folder.
   This part retires the old root-scoped workers that still control /stuff/ on
   devices that were installed before the move — matched by EXACT scope AND
   script, so PRISM's own worker and any other app's are never touched, with the
   push subscription released before the worker is unregistered and no storage
   cleared. G25 lesson: the manifest carries NO start address, so an install
   started from an invite keeps the invite. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var O = location.origin;
  var LEGACY_SCOPE = O + '/stuff/';
  var LEGACY_SCRIPTS = [O + '/stuff/tb-sw.js', O + '/stuff/sw.js', O + '/stuff/tb-sw-25b.js'];
  var HERE = O + '/stuff/talkbridge/';
  function scriptUrl(r) { var w = r.active || r.waiting || r.installing; return (w && w.scriptURL) || ''; }
  function L(ev, d, lvl) { try { if (typeof log === 'function') log(ev, d || {}, lvl || 'ok'); } catch (_) {} }
  function ready(reg, waited) {
    return reg.pushManager.getSubscription().then(function (sub) {
      if (sub || waited >= 15000 || !window.Notification || Notification.permission !== 'granted') return true;
      return new Promise(function (r) { setTimeout(r, 1000); }).then(function () { return ready(reg, waited + 1000); });
    }).catch(function () { return true; });
  }
  navigator.serviceWorker.ready.then(function (reg) {
    if (String(reg.scope) !== HERE) { L('n15_scope', { scope: String(reg.scope) }); return; }
    L('n15_scope_ok', { scope: HERE });
    return ready(reg, 0).then(function () { return navigator.serviceWorker.getRegistrations(); }).then(function (regs) {
      var legacy = (regs || []).filter(function (r) {
        return String(r.scope) === LEGACY_SCOPE && LEGACY_SCRIPTS.indexOf(scriptUrl(r)) !== -1;
      });
      return Promise.all(legacy.map(function (r) {
        return r.pushManager.getSubscription()
          .then(function (s) { return s ? s.unsubscribe().catch(function () {}) : null; })
          .then(function () { return r.unregister(); })
          .then(function () { L('n15_legacy_retired', { s: scriptUrl(r) }); })
          .catch(function () {});
      }));
    });
  }).catch(function () {});
})();
