
/* ═══════════ GAP PART · PA5-unmissable-enable.js ═══════════ */
/* @contract
   wraps: renderPanel (calls through, then re-evaluates the banner)
   adds: PA5_CSS, pa5NeedsEnable, pa5Banner
*/
/* ─────────────────────────────────────────────────────────────────────────────
   Device evidence 2026-08-22 (both phones' logs): notification permission was
   NEVER granted on the iPhone — the enable control existed only as a quiet
   footer row and was never found — so every downstream piece (relay wakes,
   SW banners, in-app cross-room alerts via osNotify) had nothing to work
   with. The fix is discoverability: an unmissable banner on the home panel
   whenever rooms exist, the platform supports push, and permission is not
   granted. Tapping it runs the EXISTING r10EnableNotifications flow (the tap
   is the user gesture iOS requires). It removes itself once enabled.
   Capability-gated, not standalone-gated, so an Android tab gets it too.
   ───────────────────────────────────────────────────────────────────────────── */

var PA5_CSS =
  '#r10-notif{display:none !important}' +      /* the footer row is retired: the surface below owns enabling */
  '#pa5-nb{display:block;width:calc(100% - 20px);margin:10px;padding:13px 14px;' +
    'background:var(--teal);color:#fff;border:none;border-radius:12px;' +
    'font-size:15px;font-weight:700;text-align:left;cursor:pointer;line-height:1.35}' +
  '#pa5-nb:active{opacity:.85}';

(function () {
  try {
    var st = document.createElement('style');
    st.id = 'pa5-css';
    st.textContent = PA5_CSS;
    document.head.appendChild(st);
  } catch (_) {}
})();

function pa5NeedsEnable() {
  try {
    if (window.TB_R10 && TB_R10.subscribeBlocked) return true;   /* subscribe() itself refused — the banner carries the escape hatch */
    return ('serviceWorker' in navigator) &&   /* window.PushManager dropped: iOS hides it while the reg has push */
      !!window.Notification && Notification.permission !== 'granted' &&
      !!(S.rooms && S.rooms.length);
  } catch (_) { return false; }
}

function pa5Banner() {
  try {
    var existing = document.getElementById('pa5-nb');
    if (!pa5NeedsEnable()) { if (existing) existing.remove(); return; }
    if (existing) return;
    var host = document.getElementById('panel-body');
    if (!host || !host.parentNode) return;
    var b = document.createElement('button');
    b.id = 'pa5-nb';
    b.type = 'button';
    b.textContent = (window.TB_R10 && TB_R10.subscribeBlocked)
      ? '🔔 iOS is blocking notifications for TalkBridge. Open Settings → Notifications → TalkBridge, turn Allow Notifications OFF and back ON, then reopen the app.'
      : '🔔 Turn on notifications — calls and messages will reach this phone even when it\'s locked. Tap to enable.';
    b.addEventListener('click', function () {
      r10EnableNotifications().then(function () { pa5Banner(); }).catch(function () { pa5Banner(); });
    });
    host.parentNode.insertBefore(b, host);          /* TOP of the panel, unmissable */
    r8Log('pa5_banner_shown', {}, 'ok');
  } catch (_) {}
}

/* LOAD-TIME ASK (owner ruling 2026-08-26): the app moves first. Where the
   platform allows a promptless ask (Android Chrome), permission is requested
   on load with no tap at all. The same attempt runs on iOS and its outcome
   is LOGGED — if iOS honors it, done; if iOS insists on a tap, the prompt
   card at the top of the panel is the one tap. Either way nobody hunts a
   footer row. */
var pa5AutoAsked = false;
function pa5AutoAsk() {
  try {
    if (pa5AutoAsked || !pa5NeedsEnable()) return;
    pa5AutoAsked = true;
    r10EnableNotifications().then(function () {
      r8Log('auto_prompt', { outcome: (window.Notification && Notification.permission) || 'unsupported' }, 'ok');
      pa5Banner();
    }).catch(function (e) {
      r8Log('auto_prompt', { outcome: 'error', e: String(e && e.message || e) }, 'error');
      pa5Banner();
    });
  } catch (_) {}
}
setTimeout(pa5AutoAsk, 1200);

(function () {
  if (typeof renderPanel === 'function') {
    var _pa5RenderPanel = renderPanel;
    renderPanel = function () {
      var r = _pa5RenderPanel.apply(this, arguments);
      try { pa5Banner(); } catch (_) {}
      return r;
    };
    renderPanel._pa5Original = _pa5RenderPanel;
  }
  document.addEventListener('visibilitychange', function () {
    try { if (!document.hidden) pa5Banner(); } catch (_) {}
  });
  setTimeout(function () { try { pa5Banner(); } catch (_) {} }, 900);
})();
