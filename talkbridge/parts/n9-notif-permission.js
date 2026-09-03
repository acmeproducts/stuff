/* N9 (25·base, plan v20.34.0 — G33). NOTIFICATION PERMISSION, FIXED.
   Two defects, both observed on the owner's Android device:
   (1) when the silent subscribe attempt failed, the app armed a one-shot
       listener that hijacked the NEXT TAP ANYWHERE. Tapping the hamburger
       spent that tap on a retry and showed the denial card instead of opening
       the menu — the menu was unreachable.
   (2) the denial card gave iPhone instructions (Notification Center, Banners,
       Banner style) on every platform. On Android those settings do not
       exist, so following them leads nowhere.
   Fixed here: the retry never steals a tap. A deliberate, visible bar appears
   instead — the person chooses when to turn notifications on — and the card
   is written for the platform in front of them. */
(function () {
  if (typeof p3ArmGesture !== 'function' || typeof p3AttemptInGesture !== 'function') return;
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }
  function L(ev, d, lvl) { try { if (typeof log === 'function') log(ev, d || {}, lvl || 'ok'); } catch (_) {} }

  /* (1) the tap thief is replaced by a bar the person taps on purpose */
  p3ArmGesture = function () {
    if (document.getElementById('n9-bar')) return;
    var st = document.createElement('style');
    st.textContent = '#n9-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:9997;background:#2E8B8B;color:#fff;'
      + 'border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 6px 20px rgba(0,0,0,.18);font-size:14px}'
      + '#n9-bar b{font-weight:700}#n9-on{margin-left:auto;background:#fff;color:#2E8B8B;border:0;border-radius:10px;padding:8px 14px;font-weight:700;font-size:14px}'
      + '#n9-x{background:transparent;border:0;color:#fff;font-size:18px;line-height:1;padding:4px 6px}';
    document.head.appendChild(st);
    var bar = document.createElement('div');
    bar.id = 'n9-bar';
    bar.innerHTML = '<span><b>Notifications are off.</b> Calls and messages will not reach you when the phone is locked.</span>'
      + '<button id="n9-on">Turn on</button><button id="n9-x" aria-label="Dismiss">×</button>';
    document.body.appendChild(bar);
    document.getElementById('n9-on').addEventListener('click', function (e) {
      e.stopPropagation(); bar.remove(); L('n9_enable_tapped', {}); p3AttemptInGesture();
    });
    document.getElementById('n9-x').addEventListener('click', function (e) { e.stopPropagation(); bar.remove(); L('n9_bar_dismissed', {}); });
    L('n9_bar_shown', {});
  };

  /* (2) the card speaks the platform in front of it */
  if (typeof p3ShowRecipe === 'function') {
    p3ShowRecipe = function () {
      if (document.getElementById('p3-recipe')) return;
      var ios = isIOS();
      var steps = ios
        ? '<li>Open <b>Settings</b> → <b>Notifications</b> → <b>TalkBridge</b></li>'
          + '<li><b>Allow Notifications</b>: ON</li>'
          + '<li><b>Lock Screen</b>, <b>Notification Centre</b>, <b>Banners</b>: all on</li>'
          + '<li><b>Sounds</b>: ON</li><li>Banner style: <b>Temporary</b></li>'
        : '<li>Press and hold the <b>TalkBridge</b> icon → <b>App info</b><br>(or <b>Settings</b> → <b>Apps</b> → <b>TalkBridge</b>)</li>'
          + '<li>Tap <b>Notifications</b> → <b>Allow notifications</b>: ON</li>'
          + '<li>Open the category below it and set <b>Alert</b> or <b>Pop-up</b> — silent categories never make a sound</li>'
          + '<li>Check <b>Lock screen</b> is set to show notifications</li>'
          + '<li>Reopen TalkBridge and tap <b>Turn on</b> if asked again</li>';
      var st = document.createElement('style');
      st.textContent = '#p3-recipe{position:fixed;inset:0;z-index:9998;background:var(--cream,#FDFAF7);display:flex;align-items:center;justify-content:center;padding:24px}'
        + '.p3-card{width:min(92vw,380px);background:#fff;border-radius:18px;padding:24px;box-shadow:0 8px 30px rgba(0,0,0,.12);color:var(--ink,#1A1714)}'
        + '.p3-t{font-size:18px;font-weight:700}.p3-l{font-size:14px;line-height:1.5;margin-top:8px;color:#3a3633}'
        + '.p3-steps{margin:14px 0 0;padding-left:20px;font-size:14.5px;line-height:1.7}.p3-row{margin-top:18px}';
      document.head.appendChild(st);
      var g = document.createElement('div'); g.id = 'p3-recipe';
      g.innerHTML = '<div class="p3-card"><div class="p3-t">Notifications are off for TalkBridge</div>'
        + '<div class="p3-l">Turn them on so calls and messages reach you when the phone is locked:</div>'
        + '<ol class="p3-steps">' + steps + '</ol>'
        + '<div class="p3-row"><button class="btn" id="p3-done">Done</button></div></div>';
      document.body.appendChild(g);
      document.getElementById('p3-done').addEventListener('click', function () { g.remove(); p3AttemptInGesture(); });
      L('n9_recipe_shown', { ios: ios }, 'error');
    };
  }
})();
