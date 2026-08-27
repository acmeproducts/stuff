
/* ═══════════ R10 PART · P2-install-gate.js ═══════════ */
/* @contract
   wraps: boot (the DOMContentLoaded entry is re-pointed through p2Entry; the original boot runs unchanged in standalone)
   adds: p2IsStandalone, p2Platform, p2GateHtml, p2ShowGate, p2Entry, p2Log
   Plan v19.5.0 §4.1 P2 — the onboarding inversion. In any browser tab the page
   shows ONE screen: the room's name and install instructions for the platform.
   No name field, no room, no chat, no relay. Only a standalone (installed) launch
   runs the real app; the installed icon carries the invite URL, so the ship's own
   first-run path (name once, join the invite's room) then runs unchanged.
   Buried and NOT here: browser-side name entry, name-carry, hand-to-Safari.
*/
function p2Log(what, data, level) { try { log('p2_' + what, data || {}, level || 'info'); } catch (_) {} }

function p2IsStandalone() {
  try {
    if (window.navigator && window.navigator.standalone === true) return true;
    if (window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches)) return true;
  } catch (_) {}
  return false;
}

/* iOS 16.4+ installs from ANY browser's Share menu (verified 2026-08-26; the
   Safari-only assumption is graveyarded). iPadOS reports as a Mac with touch. */
function p2Platform() {
  var ua = navigator.userAgent || '';
  var touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || touchMac) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function p2GateHtml(roomName, platform) {
  var steps;
  if (platform === 'ios') {
    steps = '<ol class="p2-steps"><li>Tap the <b>Share</b> button <span class="p2-ic">&#x2B06;&#xFE0E;</span></li><li>Choose <b>Add to Home Screen</b></li><li>Tap <b>Add</b>, then open <b>TalkBridge</b> from your Home Screen</li></ol>';
  } else if (platform === 'android') {
    steps = '<ol class="p2-steps"><li>Open the browser menu <b>&#8942;</b></li><li>Choose <b>Add to Home screen</b> or <b>Install app</b></li><li>Open <b>TalkBridge</b> from your Home screen</li></ol>';
  } else {
    steps = '<ol class="p2-steps"><li>Click the <b>Install</b> icon in the address bar</li><li>Open <b>TalkBridge</b> as an app</li></ol>';
  }
  return '<div class="p2-card">'
    + '<div class="p2-brand">TalkBridge</div>'
    + (roomName ? '<div class="p2-room">' + esc(roomName) + '</div>' : '')
    + '<div class="p2-lead">Install TalkBridge to join. Messages and calls only reach an installed app.</div>'
    + steps
    + '</div>';
}

function p2ShowGate() {
  var roomName = '';
  try {
    var h = location.hash || '';
    if (h.indexOf('#j=') === 0) { var p = decInv(h.slice(3)); if (p && p.r) roomName = p.t || p.n || ''; }
  } catch (_) {}
  var platform = p2Platform();
  var st = document.createElement('style');
  st.textContent = '#p2-gate{position:fixed;inset:0;z-index:9999;background:var(--cream,#FDFAF7);display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit}'
    + '.p2-card{width:min(92vw,380px);background:#fff;border-radius:18px;padding:26px 24px;box-shadow:0 8px 30px rgba(0,0,0,.12);color:var(--ink,#1A1714)}'
    + '.p2-brand{font-size:13px;font-weight:700;letter-spacing:.08em;color:var(--teal,#2E8B8B);text-transform:uppercase}'
    + '.p2-room{font-size:22px;font-weight:700;margin-top:8px}'
    + '.p2-lead{font-size:14.5px;line-height:1.5;margin-top:12px;color:#3a3633}'
    + '.p2-steps{margin:16px 0 0;padding-left:20px;font-size:15px;line-height:1.7}'
    + '.p2-ic{display:inline-block;color:var(--teal,#2E8B8B)}';
  document.head.appendChild(st);
  var g = document.createElement('div'); g.id = 'p2-gate';
  g.innerHTML = p2GateHtml(roomName, platform);
  document.body.appendChild(g);
  var app = $('app'); if (app) app.style.display = 'none';
  p2Log('gate_shown', { platform: platform, invite: !!roomName }, 'ok');
}

/* One entry, two worlds. Nothing of the app runs in a browser tab. */
function p2Entry() {
  if (p2IsStandalone()) { p2Log('standalone', {}, 'ok'); return boot(); }
  p2ShowGate();
}
document.removeEventListener('DOMContentLoaded', boot);
document.addEventListener('DOMContentLoaded', p2Entry);
