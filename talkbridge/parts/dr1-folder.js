/* ═══════════ GAP PART · DR1-folder.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: drRetireRoot (E3) · the build line (E4) · the worker registered in a browser tab too (E6)
   markers: dr_root_worker_retired, dr_retire_deferred, dr_retire_failed, build
*/
/* ─────────────────────────────────────────────────────────────────────────────
   DR-1 · THE DIRECTORY RELEASE (29·pre-ship, §7.5 + §7.12; owner "go" 2026-10-09)

   The app now lives in /stuff/talkbridge-app/. Its worker registers from the
   folder and so owns the folder alone (no narrowing needed: a worker's default
   scope is its own directory). What this part adds is E3 — the retirement of
   the two legacy identities every phone that used the root builds still holds:
   a worker at the parent scope (/stuff/ — the one that captured PRISM, G25) or
   at the prefix scope (/stuff/bridge- — U1's narrow identity), script
   tb-sw.js, tb-sw2.js or tb-sw3.js at the ROOT. Exact scope match, exact
   script match, only after the folder registration's own push subscription
   is live, the old subscription released before the old worker goes (the
   sequence proven at 26·pre-ship, 27·pre-ship and 28·base). PRISM's worker
   (/stuff/prism/) and this folder's own can never match.
   Candidate 2 (c1 failed G3: both iPhone copies booted with no rooms and no
   invite, device log 14:36 and 14:38 UTC): the head's manifest link is now
   WRITTEN FOR THE PLATFORM WHILE THE HEAD IS PARSED (E1). c1's head named the
   Chrome manifest, which carries a start page, and relied on U1's later swap
   to point an iPhone at the manifest without one; the phone had already read
   the head link (G65). E2's swap stays, now choosing the same file.
   E6: in a browser tab the accepted build registers NO worker (P2 shows the
   install gate and stops; P3 registers only in standalone) — so Chrome never
   saw a worker with a fetch handler and never offered the install icon. The
   folder page registers its worker at load in a tab as well: registration
   only, no push subscription, no permission prompt (those stay where they
   were). The skeleton that passed §7.12 registered at load; so does this.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){ try { if (typeof log==='function') log('build', { c:'turn29-pre-ship-dir', file:'talkbridge-app/bridge-turn29-pre-ship.html', built:'2026-10-10 17:00 UTC' }, 'ok'); } catch(_){} })();

function drRetireRoot() {
  if (!('serviceWorker' in navigator)) return;
  function L(ev, d, lvl) { try { if (typeof log === 'function') log(ev, d || {}, lvl || 'ok'); } catch (_) {} }
  var DIR = location.pathname.replace(/[^/]*$/, '');                 /* "/stuff/talkbridge-app/" */
  var PARENT = DIR.replace(/[^/]+\/$/, '');                           /* "/stuff/" */
  var LEGACY = [location.origin + PARENT, location.origin + PARENT + 'bridge-'];
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (r) {
      try {
        var sc = r.scope || '';
        var script = (r.active || r.waiting || r.installing || {}).scriptURL || '';
        if (LEGACY.indexOf(sc) === -1) return;                          /* exact legacy scope only */
        if (!/\/tb-sw[23]?\.js$/.test(script)) return;                  /* exact legacy script only */
        if (script.indexOf(location.origin + DIR) === 0) return;        /* never this folder's own */
        if (!(typeof p3State !== 'undefined' && p3State && p3State.sub)) { L('dr_retire_deferred', { scope: sc }); return; }
        r.pushManager.getSubscription()
          .then(function (s) { return s ? s.unsubscribe().catch(function () {}) : null; })
          .then(function () { return r.unregister(); })
          .then(function (ok) { L('dr_root_worker_retired', { ok: !!ok, scope: sc, script: script.replace(/^.*\//, '') }); })
          .catch(function (e) { L('dr_retire_failed', { e: String(e && e.message || e) }, 'warn'); });
      } catch (_) {}
    });
  }).catch(function () {});
}
(function () {
  if (!('serviceWorker' in navigator)) return;
  setTimeout(drRetireRoot, 10000);
  setTimeout(drRetireRoot, 34000);
})();

/* E6 · the worker is registered in a browser tab too — registration alone */
(function () {
  if (!('serviceWorker' in navigator)) return;
  document.addEventListener('DOMContentLoaded', function () {
    try { if (!p2IsStandalone() && !(typeof p3State !== 'undefined' && p3State && p3State.reg)) p3Register().catch(function () {}); } catch (_) {}
  });
})();
