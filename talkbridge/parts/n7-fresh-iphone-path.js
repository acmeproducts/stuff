
/* ═══════════ GAP PART · N7-fresh-iphone-path.js ═══════════ */
/* @contract
   wraps: joinRoom (adopts a carried name, augments the handoff cookie, shows
   the install nudge; calls through — the base decides everything else)
   adds: N7_CSS, n7SafariBar, n7InstallNudge, n7AdoptName, n7AugmentHandoff
*/
/* ─────────────────────────────────────────────────────────────────────────────
   Owner test case 2026-08-26: a FRESH iPhone user scans a QR — the camera
   opens the DEFAULT browser, often Chrome. Without these three pieces the
   ring is unreachable for that person, so they are R10 scope:
   J2 — Chrome-on-iOS: chat right here, and ONE TAP to Safari via the
        x-safari-https scheme (forces Safari directly; copy fallback shown
        only if the scheme is blocked).
   J3 — In Safari, joined, not installed: dismissible nudge — ringing is the
        reason to Add to Home Screen.
   J5 — The name typed in the tab rides the handoff cookie (jn) and is
        adopted by the installed app exactly once — the blank-room path dies.
   Apple's floor (Safari-only install, the person's own taps) remains.
   ───────────────────────────────────────────────────────────────────────────── */

var N7 = { inviteHref: '', dismissed: false };
try { if (location.hash.indexOf('#j=') === 0) N7.inviteHref = location.href; } catch (_) {}

var N7_CSS =
  '.n7-bar{display:flex;gap:10px;align-items:center;padding:11px 13px;background:var(--teal);' +
    'color:#fff;font-size:14.5px;font-weight:600;line-height:1.35}' +
  '.n7-bar a,.n7-bar button{flex-shrink:0;background:#fff;color:var(--teal);border:none;border-radius:9px;' +
    'padding:8px 12px;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}' +
  '.n7-nudge{position:fixed;left:10px;right:10px;bottom:12px;z-index:60;border-radius:13px;box-shadow:var(--shadow)}';

(function () {
  try {
    var st = document.createElement('style');
    st.id = 'n7-css';
    st.textContent = N7_CSS;
    document.head.appendChild(st);
  } catch (_) {}
})();

function n7AdoptName(p) {
  try {
    if (p && p.jn && !(S.user && S.user.name)) {
      S.user.name = String(p.jn).slice(0, 40);
      saveUser();
      var f = document.getElementById('s10-name');
      if (f) f.style.display = 'none';
      r8Log('n7_name_adopted', {}, 'ok');
      return true;
    }
  } catch (_) {}
  return false;
}

function n7AugmentHandoff(p, name) {
  try {
    if (!p || !name) return false;
    var st = window.__TB_R10;
    if (!st || st.standalone || !st.armed) return false;
    var p2 = {};
    for (var k in p) p2[k] = p[k];
    p2.jn = String(name).slice(0, 40);
    document.cookie = 'tb_install_handoff_v1=' + encodeURIComponent(encInv(p2)) +
      '; Path=/stuff/; Max-Age=600; SameSite=Lax; Secure';
    r8Log('n7_handoff_named', {}, 'ok');
    return true;
  } catch (_) { return false; }
}

/* J2 — landed on iPhone outside Safari: chat here, one tap to Safari. */
function n7SafariBar() {
  try {
    if (typeof plLane !== 'function' || plLane() !== 'ios-other-browser') return;
    if (!N7.inviteHref) return;
    if (document.getElementById('n7-safari-bar')) return;
    var app = document.getElementById('app');
    if (!app) return;
    var safariHref = N7.inviteHref.replace(/^https:/, 'x-safari-https:');
    var bar = document.createElement('div');
    bar.id = 'n7-safari-bar';
    bar.className = 'n7-bar';
    bar.innerHTML = '<span>You can chat right here. To make this phone ring for calls:</span>' +
      '<a href="' + safariHref.replace(/"/g, '&quot;') + '">Open in Safari</a>' +
      '<button type="button">Copy link</button>';
    bar.querySelector('button').addEventListener('click', function () {
      var self = this;
      try { navigator.clipboard.writeText(N7.inviteHref).then(function () { self.textContent = 'Copied ✓'; }); }
      catch (_) { self.textContent = N7.inviteHref; }
    });
    app.insertBefore(bar, app.firstChild);
    r8Log('n7_safari_bar', {}, 'ok');
  } catch (_) {}
}

/* J3 — iPhone Safari, joined, not installed: ringing is the pitch. */
function n7InstallNudge() {
  try {
    if (typeof plLane !== 'function' || plLane() !== 'ios-safari') return;
    if (N7.dismissed || sessionStorage.getItem('n7_nudge_dismissed')) return;
    if (!(S.rooms && S.rooms.length)) return;
    if (document.getElementById('n7-nudge')) return;
    var n = document.createElement('div');
    n.id = 'n7-nudge';
    n.className = 'n7-bar n7-nudge';
    n.innerHTML = '<span>Want this phone to ring when they call? Tap Share, then <b>Add to Home Screen</b>, then open TalkBridge from your home screen.</span>' +
      '<button type="button">Later</button>';
    n.querySelector('button').addEventListener('click', function () {
      N7.dismissed = true;
      try { sessionStorage.setItem('n7_nudge_dismissed', '1'); } catch (_) {}
      n.remove();
    });
    document.body.appendChild(n);
    r8Log('n7_install_nudge', {}, 'ok');
  } catch (_) {}
}

(function () {
  if (typeof joinRoom === 'function') {
    var _n7JoinRoom = joinRoom;
    joinRoom = function (p) {
      try { n7AdoptName(p); } catch (_) {}
      var r = _n7JoinRoom.apply(this, arguments);
      try {
        n7AugmentHandoff(p, (S.user && S.user.name) || '');
        n7InstallNudge();
      } catch (_) {}
      return r;
    };
    joinRoom._n7Original = _n7JoinRoom;
  }
})();

/* The name boards the invite the moment it is typed: the Safari link, the
   copy text, and the handoff cookie all update live, so identity survives
   Chrome → Safari → installed app in ANY order of operations. */
function n7NameSync(v) {
  try {
    v = (v || '').trim().slice(0, 40);
    if (!v || location.hash.indexOf('#j=') !== 0) return;
    var p = null;
    try { p = decInv(location.hash.slice(3)); } catch (_) { return; }
    if (!p) return;
    p.jn = v;
    var newHash = '#j=' + encInv(p);
    N7.inviteHref = location.href.split('#')[0] + newHash;
    var a = document.querySelector('#n7-safari-bar a');
    if (a) a.href = N7.inviteHref.replace(/^https:/, 'x-safari-https:');
    n7AugmentHandoff(p, v);
    r8Log('n7_name_synced', {}, 'ok');
  } catch (_) {}
}
document.addEventListener('input', function (e) {
  try {
    var t = e.target;
    if (t && (t.id === 's10-name' || t.id === 's0-name')) n7NameSync(t.value);
  } catch (_) {}
});

setTimeout(function () {
  try {
    if (location.hash.indexOf('#j=') === 0) {
      var p = null;
      try { p = decInv(location.hash.slice(3)); } catch (_) {}
      if (p) n7AdoptName(p);
    }
    n7SafariBar();
    n7InstallNudge();
  } catch (_) {}
}, 1000);
