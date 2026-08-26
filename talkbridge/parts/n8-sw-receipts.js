
/* ═══════════ GAP PART · N8-sw-receipts.js ═══════════ */
/* @contract
   wraps: nothing
   adds: n8DrainSwLog + one message listener — drains the service worker's
   durable receipt store into the debug log on every open/return
*/
/* ─────────────────────────────────────────────────────────────────────────────
   The service worker was the last dark segment: push arrival, banner shown,
   banner failed, tap — all invisible to the debug log. The worker now writes
   receipts durably; this drains them on every open, so the log carries
   proof-of-delivery ON DEVICE: sw_receipt {ev:'push_arrived'|'notification_
   shown'|'notification_failed', ts of the event itself}.
   ───────────────────────────────────────────────────────────────────────────── */
function n8DrainSwLog() {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener && navigator.serviceWorker.ready.then(function (reg) {
      try { if (reg.active) reg.active.postMessage({ type: 'tb-drain-log' }); } catch (_) {}
    }).catch(function () {});
  } catch (_) {}
}
(function () {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', function (e) {
      try {
        if (!e.data || e.data.type !== 'tb-sw-log' || !Array.isArray(e.data.entries)) return;
        e.data.entries.forEach(function (en) {
          r8Log('sw_receipt', { ev: en.ev, at: en.ts, visible: en.visible, e: en.e }, en.ev === 'notification_failed' ? 'error' : 'ok');
        });
        if (!e.data.entries.length) r8Log('sw_receipt_none', {}, 'ok');
      } catch (_) {}
    });
  } catch (_) {}
})();
setTimeout(n8DrainSwLog, 1600);
document.addEventListener('visibilitychange', function () {
  try { if (!document.hidden) n8DrainSwLog(); } catch (_) {}
});
