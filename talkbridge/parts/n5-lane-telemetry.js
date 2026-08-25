
/* ═══════════ GAP PART · PL-one-path.js ═══════════ */
/* @contract
   wraps: nothing
   adds: TB_LANE, plLane, plBootLine
*/
/* ─────────────────────────────────────────────────────────────────────────────
   ONE PATH (owner ruling 2026-08-22): everyone onboards the same way — scan,
   name, chat in the tab. "Make this phone ring" is the single optional
   upgrade, and the only place platforms differ. To stop lane-drift from ever
   again being invisible (a phone silently becoming an installed app with
   fresh permission state), every boot logs ONE line: which lane this device
   is in, and the microphone + notification permission it actually holds.
   No log will ever again leave us guessing what experience the person had.
   ───────────────────────────────────────────────────────────────────────────── */

var TB_LANE = { lane: '?', mic: 'unknown', notif: 'unknown' };

function plLane(ua, standalone) {
  ua = ua || navigator.userAgent || '';
  if (standalone === undefined) standalone = !!(window.__TB_R10 && window.__TB_R10.standalone);
  if (/iP(hone|ad|od)/.test(ua)) {
    if (standalone) return 'ios-pwa';
    if (/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//.test(ua) || !/Safari\//.test(ua)) return 'ios-other-browser';
    return 'ios-safari';
  }
  if (/Android/.test(ua)) return standalone ? 'android-pwa' : 'android-tab';
  return standalone ? 'other-pwa' : 'other';
}

function plBootLine() {
  try {
    TB_LANE.lane = plLane();
    TB_LANE.notif = (window.Notification && Notification.permission) || 'unsupported';
    var done = function () { r8Log('lane', TB_LANE, 'ok'); };
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' }).then(function (st) {
        TB_LANE.mic = st.state; done();
      }).catch(function () { TB_LANE.mic = 'unknown'; done(); });
    } else { done(); }
  } catch (_) { try { r8Log('lane', TB_LANE, 'ok'); } catch (_) {} }
}

setTimeout(plBootLine, 1000);
document.addEventListener('visibilitychange', function () {
  try { if (!document.hidden) plBootLine(); } catch (_) {}
});


