
/* ═══════════ R10.6 PART · P2 install handoff ═══════════ */
/* Browser tabs are an installation handoff only.  The one-time invite code is
   copied to a short-lived, path-scoped cookie so the installed PWA can recover
   it even when iOS does not preserve the source tab's fragment. */
var R106_INSTALL_COOKIE = 'tb_install_handoff_v1';

function r106P2Log(what, data, level) {
  try { log('r106_install_' + what, data || {}, level || 'info'); } catch (_) {}
}
function r106Standalone() {
  try {
    return navigator.standalone === true ||
      (matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches));
  } catch (_) { return false; }
}
function r106InviteCodeFromHash() {
  var h = String(location.hash || '');
  return h.indexOf('#i=') === 0 ? decodeURIComponent(h.slice(3)) : '';
}
function r106CookieGet(name) {
  var rows = String(document.cookie || '').split(';');
  for (var i = 0; i < rows.length; i++) {
    var p = rows[i].trim().split('=');
    if (p.shift() === name) return decodeURIComponent(p.join('='));
  }
  return '';
}
function r106CookiePut(code) {
  if (!code) return;
  document.cookie = R106_INSTALL_COOKIE + '=' + encodeURIComponent(code) + '; Path=/stuff/; Max-Age=600; SameSite=Lax; Secure';
  r106P2Log('stored', { present: true, ttlSeconds: 600 }, 'ok');
}
function r106CookieClear() {
  document.cookie = R106_INSTALL_COOKIE + '=; Path=/stuff/; Max-Age=0; SameSite=Lax; Secure';
  r106P2Log('cleared', {}, 'ok');
}
function r106InstallPlatform() {
  var ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
function r106InstallGate() {
  var platform = r106InstallPlatform();
  var code = r106InviteCodeFromHash();
  if (code) r106CookiePut(code);
  var steps = platform === 'ios'
    ? '<li>Tap <b>Share</b></li><li>Choose <b>Add to Home Screen</b></li><li>Open <b>TalkBridge</b> from the new icon</li>'
    : platform === 'android'
      ? '<li>Open the browser menu</li><li>Choose <b>Install app</b> or <b>Add to Home screen</b></li><li>Open <b>TalkBridge</b> from the new icon</li>'
      : '<li>Use the browser\'s <b>Install</b> control</li><li>Open TalkBridge as an app</li>';
  var style = document.createElement('style');
  style.textContent = '#r106-install{position:fixed;inset:0;z-index:10000;background:#FDFAF7;display:flex;align-items:center;justify-content:center;padding:24px;font-family:inherit}' +
    '.r106-install-card{width:min(92vw,390px);background:#fff;border-radius:18px;padding:26px 24px;box-shadow:0 8px 30px rgba(0,0,0,.12);color:#1A1714}' +
    '.r106-install-brand{font-size:13px;font-weight:700;letter-spacing:.08em;color:#2E8B8B;text-transform:uppercase}' +
    '.r106-install-title{font-size:22px;font-weight:700;margin-top:8px}.r106-install-copy{font-size:14.5px;line-height:1.5;margin-top:12px}' +
    '.r106-install-steps{margin:16px 0 0;padding-left:20px;font-size:15px;line-height:1.7}';
  document.head.appendChild(style);
  var gate = document.createElement('div');
  gate.id = 'r106-install';
  gate.innerHTML = '<div class="r106-install-card"><div class="r106-install-brand">TalkBridge</div>' +
    '<div class="r106-install-title">Install to join</div><div class="r106-install-copy">Calls and messages reach this device through the installed app.</div>' +
    '<ol class="r106-install-steps">' + steps + '</ol></div>';
  document.body.appendChild(gate);
  var app = $('app'); if (app) app.style.display = 'none';
  r106P2Log('gate', { platform: platform, invitePresent: !!code }, 'ok');
}

/* The async exchange completes before ship boot parses the invitation.  Only
   non-secret room metadata is converted to the ship parser's existing shape. */
function r106P2Entry() {
  if (!r106Standalone()) { r106InstallGate(); return; }
  var code = r106InviteCodeFromHash() || r106CookieGet(R106_INSTALL_COOKIE);
  if (!code) { r106P2Log('standalone', { invitePresent: false }, 'ok'); boot(); return; }
  r106P2Log('recover', { invitePresent: true }, 'info');
  r106ExchangeInvite(code).then(function (result) {
    if (!result || !result.invite) throw new Error('invite-exchange-empty');
    r106CookieClear();
    history.replaceState(null, '', location.pathname + location.search + '#j=' + encInv(result.invite));
    r106P2Log('exchanged', { room: String(result.invite.r || '').slice(-6), replayRejected: false }, 'ok');
    boot();
  }).catch(function (e) {
    r106P2Log('exchange_failed', { name: e && e.name || 'Error', status: e && e.status || 0 }, 'error');
    var gate = document.createElement('div'); gate.id = 'r106-install';
    gate.innerHTML = '<div class="r106-install-card"><div class="r106-install-brand">TalkBridge</div><div class="r106-install-title">This invitation cannot be used</div><div class="r106-install-copy">It expired, was already used, or the connection is offline. Ask for a new invitation.</div></div>';
    document.body.appendChild(gate);
    var app = $('app'); if (app) app.style.display = 'none';
  });
}

document.removeEventListener('DOMContentLoaded', boot);
document.addEventListener('DOMContentLoaded', r106P2Entry);
