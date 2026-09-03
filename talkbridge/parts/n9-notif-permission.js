/* N9 (rewritten 2026-09-03 — G37). NOTIFICATION PERMISSION, NO EXTRA STEP.
   The original design is right and stays: when a silent subscribe fails, the
   app quietly waits for the person's next tap — any tap — and asks then,
   because a browser only allows the prompt inside a gesture. That listener
   never blocked the tap; it lets it through to whatever was pressed. Nothing
   extra is shown, nothing is clicked twice, and the person is never told to
   go and enable something.
   The real defect was the DENIAL CARD: it covered the screen on every failed
   retry — so the hamburger did open the menu, and the card immediately hid it
   — and it printed iPhone settings on every platform. Fixed here: the card
   appears at most once per install, only after the browser has actually
   denied, and it names the settings of the device in front of the person.
   The extra "Turn on notifications" bar added earlier is removed: it was an
   extra step the app never needed. */
(function () {
  if (typeof p3ShowRecipe !== 'function') return;
  var SHOWN = 'tb_recipe_shown';
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }
  p3ShowRecipe = function () {
    if (document.getElementById('p3-recipe')) return;
    try { if (localStorage.getItem(SHOWN)) { try { p3Log('n9_recipe_suppressed', {}, 'info'); } catch (_) {} return; } } catch (_) {}
    var ios = isIOS();
    var steps = ios
      ? '<li>Open <b>Settings</b> → <b>Notifications</b> → <b>TalkBridge</b></li>'
        + '<li><b>Allow Notifications</b>: ON</li>'
        + '<li><b>Lock Screen</b>, <b>Notification Centre</b>, <b>Banners</b>: all on</li>'
        + '<li><b>Sounds</b>: ON</li>'
      : '<li>Press and hold the <b>TalkBridge</b> icon → <b>App info</b></li>'
        + '<li><b>Notifications</b> → <b>Allow notifications</b>: ON</li>'
        + '<li>Open the category below it and set <b>Alert</b> or <b>Pop-up</b> — a silent category never makes a sound</li>'
        + '<li>Check <b>Lock screen</b> is set to show notifications</li>';
    var st = document.createElement('style');
    st.textContent = '#p3-recipe{position:fixed;inset:0;z-index:9998;background:rgba(20,18,16,.55);display:flex;align-items:center;justify-content:center;padding:24px}'
      + '.p3-card{width:min(92vw,380px);background:#fff;border-radius:18px;padding:24px;box-shadow:0 8px 30px rgba(0,0,0,.18);color:#1A1714}'
      + '.p3-t{font-size:18px;font-weight:700}.p3-l{font-size:14px;line-height:1.5;margin-top:8px;color:#3a3633}'
      + '.p3-steps{margin:14px 0 0;padding-left:20px;font-size:14.5px;line-height:1.7}.p3-row{margin-top:18px;text-align:right}';
    document.head.appendChild(st);
    var g = document.createElement('div'); g.id = 'p3-recipe';
    g.innerHTML = '<div class="p3-card"><div class="p3-t">Notifications are off</div>'
      + '<div class="p3-l">Calls and messages will not reach you when the phone is locked.</div>'
      + '<ol class="p3-steps">' + steps + '</ol>'
      + '<div class="p3-row"><button class="btn" id="p3-done">Done</button></div></div>';
    document.body.appendChild(g);
    document.getElementById('p3-done').addEventListener('click', function () {
      g.remove();
      try { localStorage.setItem(SHOWN, '1'); } catch (_) {}
    });
    try { p3Log('n9_recipe_shown', { ios: ios }, 'error'); } catch (_) {}
  };
})();
