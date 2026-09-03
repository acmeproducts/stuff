/* N11 (25·base, plan v20.35.0 — G34). THE STALE PUSH SUBSCRIPTION.
   The app reuses whatever push subscription the browser already holds
   ("if (existing) return existing") without ever checking that it was created
   with the CURRENT signing key. A subscription made under an earlier key keeps
   working from the browser's point of view — permission is granted, the
   subscription object exists, the relay accepts its endpoint — but the push
   service rejects every message the relay signs, because the signature no
   longer matches the key the subscription was minted with. Nothing arrives and
   nothing is reported: notifications look ON, the app looks healthy, and the
   phone never rings when locked. iPhone was unaffected whenever its
   subscription happened to be recreated.
   This checks the key on every standalone boot and, on a mismatch, discards
   the dead subscription and mints a fresh one, then re-registers every room.
   Adds only; wraps nothing. */
(function () {
  if (typeof p3State === 'undefined' || typeof p3Vapid !== 'function' || typeof p3B64ToBytes !== 'function') return;
  function L(ev, d, lvl) { try { p3Log(ev, d || {}, lvl || 'ok'); } catch (_) { } }
  function keyOf(sub) {
    try {
      var k = sub && sub.options && sub.options.applicationServerKey;
      if (!k) return '';
      var b = new Uint8Array(k), s = '';
      for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
      return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (_) { return ''; }
  }
  function check() {
    if (!('serviceWorker' in navigator)) return;
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription().then(function (sub) {
        if (!sub) return;
        return p3Vapid().then(function (vapid) {
          var have = keyOf(sub), want = String(vapid || '').replace(/=+$/, '');
          if (have && want && have === want) { L('n11_key_ok', {}); return; }
          L('n11_key_stale', { have: have.slice(0, 12), want: want.slice(0, 12) }, 'error');
          return sub.unsubscribe().catch(function () { }).then(function () {
            return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: p3B64ToBytes(vapid) });
          }).then(function (fresh) {
            p3State.sub = fresh; p3State.registered = {};
            L('n11_resubscribed', { endpoint: String(fresh && fresh.endpoint || '').slice(0, 40) });
            return (typeof p3RegisterAll === 'function') ? p3RegisterAll() : null;
          });
        });
      });
    }).catch(function (e) { L('n11_check_failed', { e: String(e && e.message || e) }, 'warn'); });
  }
  function run() { try { if (typeof p2IsStandalone === 'function' && !p2IsStandalone()) return; } catch (_) { } setTimeout(check, 2500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
