/* ═══════════ GAP PART · I1-app-face.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: navigator.serviceWorker.register
   adds: (none)
   declared additions outside the script (assembler): <link rel="manifest"> → tb-manifest-turn28.webmanifest,
   <link rel="apple-touch-icon"> → icon-v2-180.png, <link rel="icon"> → icon-v2-192.png; new files
   icon-v2-*.png, tb-manifest-turn28.webmanifest, tb-sw3.js
*/
/* ─────────────────────────────────────────────────────────────────────────────
   I-1 · THE APP'S FACE (owner, 2026-09-30: icon set "N turning", "go")

   New icon set: five vertical slats turning open, white on dark navy. It
   reaches four places: the home-screen icon (manifest, Android; the
   apple-touch link, iPhone), the browser tab, the notification card's big
   icon and the Android status-bar badge (worker). The last two need the
   worker, and the accepted tb-sw2.js is frozen (§0c), so the app registers
   onto tb-sw3.js — the N-1 sequence, proven at 27·pre-ship: the register
   call is redirected, old registrations retire only on an exact script
   match and only after the new registration's push subscription is live.
   K1 (tb-sw.js → tb-sw2.js) stays underneath, untouched; this layer maps
   both old names forward.

   What the phones do with it, stated so nobody is surprised at the gate:
   iPhone re-reads the home-screen icon only when the app is added to the
   home screen again; Android updates the installed icon on its own within a
   day or so, sometimes after asking. The status-bar badge and the card icon
   show on the first notification after the new worker is live.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (!('serviceWorker' in navigator)) return;
  function L(ev, d, lvl) { try { if (typeof log === 'function') log(ev, d || {}, lvl || 'ok'); } catch (_) {} }
  var _reg = navigator.serviceWorker.register.bind(navigator.serviceWorker);
  navigator.serviceWorker.register = function (url, opts) {
    try {
      var u = String(url);
      if (/tb-sw2?\.js$/.test(u)) { url = u.replace(/tb-sw2?\.js$/, 'tb-sw3.js'); L('i1_sw3_register', {}); }
    } catch (_) {}
    return _reg(url, opts);
  };
  function retireOld() {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) {
        try {
          var script = (r.active || r.waiting || r.installing || {}).scriptURL || '';
          if (/tb-sw3\.js$/.test(script)) return;                /* never the new one */
          if (!/\/tb-sw2\.js$/.test(script)) return;             /* exact previous file only; K1 owns tb-sw.js */
          if (!(typeof p3State !== 'undefined' && p3State && p3State.sub)) { L('i1_retire_deferred', {}); return; }
          r.pushManager.getSubscription()
            .then(function (s) { return s ? s.unsubscribe().catch(function () {}) : null; })
            .then(function () { return r.unregister(); })
            .then(function (ok) { L('i1_old_sw_retired', { ok: !!ok, scope: r.scope }); })
            .catch(function (e) { L('i1_retire_failed', { e: String(e && e.message || e) }, 'warn'); });
        } catch (_) {}
      });
    }).catch(function () {});
  }
  setTimeout(retireOld, 9000);
  setTimeout(retireOld, 32000);
})();
