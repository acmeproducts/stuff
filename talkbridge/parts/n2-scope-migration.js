/* N2 (25·base, plan §5.2) — PRISM scope un-hijack migration. Carried forward
   from G25 with its lessons. Runs only under the /stuff/talkbridge/ scoped
   worker; only after this page's own push subscription exists (bounded
   wait); retires legacy root-scoped TalkBridge workers by EXACT scope AND
   script match — PRISM and foreign workers untouched; unsubscribe fires
   before unregister; no storage cleared. Adds only; replaces nothing. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  var O = location.origin;
  var LEGACY_SCOPE = O + '/stuff/';
  var LEGACY_SCRIPTS = [O + '/stuff/tb-sw.js', O + '/stuff/sw.js', O + '/stuff/tb-sw-25b.js'];
  var NEW_SCOPE = O + '/stuff/talkbridge/';
  function scriptUrl(r) { var w = r.active || r.waiting || r.installing; return (w && w.scriptURL) || ''; }
  function subReady(reg, waited) {
    return reg.pushManager.getSubscription().then(function (sub) {
      if (sub || waited >= 15000 || !window.Notification || Notification.permission !== 'granted') return true;
      return new Promise(function (res) { setTimeout(res, 1000); }).then(function () { return subReady(reg, waited + 1000); });
    }).catch(function () { return true; });
  }
  function retire(r) {
    return r.pushManager.getSubscription()
      .then(function (sub) { return sub ? sub.unsubscribe().catch(function () {}) : null; })
      .then(function () { return r.unregister(); })
      .then(function () { try { if (typeof log === 'function') log('n2_legacy_retired', { s: scriptUrl(r) }, 'ok'); } catch (_) {} })
      .catch(function () {});
  }
  navigator.serviceWorker.ready.then(function (reg) {
    if (String(reg.scope) !== NEW_SCOPE) return;
    return subReady(reg, 0).then(function () { return navigator.serviceWorker.getRegistrations(); }).then(function (regs) {
      var legacy = (regs || []).filter(function (r) {
        return String(r.scope) === LEGACY_SCOPE && LEGACY_SCRIPTS.indexOf(scriptUrl(r)) !== -1;
      });
      return Promise.all(legacy.map(retire));
    });
  }).catch(function () {});
})();
