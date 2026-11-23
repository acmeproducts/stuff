/* ═══════════ 30·ship PART · IL-1 invite-door.js — A LINK ALWAYS OPENS THE CURRENT VERSION (§7.25 c4) ═══════════ */
/* @contract
   replaces: (none)   wraps: invUrl, linkDeviceUrl, rhCarryUrl (each original kept and called)
   adds: IL, ilLog, IL_DOOR_RE, ilDir, ilOwn, ilTarget, ilAsk, ilRewrite, ilRedraw, _ilInv, _ilDev, _ilCarry
   markers (ilLog's own prefix 'il_'): door, failed

   THE OWNER (2026-11-23): "let's just add the invite link fix to the same release" — the S20 opened an invite made on 30·base
   and ran 30·base (device log: p2_tab_boot {invite:true} → build turn30-base-c4).
   THE CAUSE: invUrlCore and linkDeviceUrlCore build every link on location.href — the stage page the creator is on. Stage
   pages are immutable, so a link made on an older version opens that version forever.
   THE CHANGE (spec reviewed independently 2026-11-23): a link that LEAVES this phone (invite, grant invite, link-a-device:
   the QR, copy and share) names the folder's DOOR instead of the page — `index.html` (forwards to the accepted stage) when
   that door forwards to THIS page, `next.html` (the newest candidate) when that door does, and today's own-page link when
   neither does (Jenny's instance, a superseded page) or the answer is not in yet / unparseable / unreachable. Both doors
   forward with location.search + location.hash, so the #j= payload arrives intact. The doors are fetched with
   cache:'no-store' at start and again on every return to the app; the answer is kept for the session; an invite card or
   drawer QR already on screen is redrawn when the answer changes. The iPhone carry (rhCarryUrl, this phone reloading
   itself) keeps this page's own address. IL-1 changes what a LINK opens, not what an install opens. */
var IL = { door: null, accepted: null, candidate: null, raw: 0, asked: 0 };
var IL_DOOR_RE = /location\.replace\('\.\/(bridge-[A-Za-z0-9-]+\.html)'\s*\+\s*location\.search\s*\+\s*location\.hash\)/;
function ilLog(what, d, lvl) { try { log('il_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function ilDir() { return location.pathname.replace(/[^/]*$/, ''); }
function ilOwn() { return location.pathname.replace(/^.*\//, ''); }
function ilTarget(door) {
  return fetch(door, { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) { var m = IL_DOOR_RE.exec(t || ''); return m ? m[1] : null; }).catch(function () { return null; });
}
function ilAsk(why) {
  try {
    if (!/\/talkbridge-app\/$/.test(ilDir()) || typeof fetch !== 'function') return Promise.resolve(null);
    try { var kept = sessionStorage.getItem('tb_il_door_' + ilOwn()); if (kept && IL.door == null) IL.door = kept === '-' ? null : kept; } catch (_) {}
    IL.asked++;
    return Promise.all([ilTarget('index.html'), ilTarget('next.html')]).then(function (a) {
      var own = ilOwn(), was = IL.door;
      IL.accepted = a[0]; IL.candidate = a[1];
      IL.door = (a[0] === own) ? 'index.html' : (a[1] === own) ? 'next.html' : null;
      try { sessionStorage.setItem('tb_il_door_' + own, IL.door || '-'); } catch (_) {}
      if (IL.door !== was) { ilLog('door', { door: IL.door, accepted: a[0], candidate: a[1], why: why }, 'ok'); ilRedraw(); }
      return IL.door;
    });
  } catch (e) { ilLog('failed', { e: String(e && e.message || e) }, 'error'); return Promise.resolve(null); }
}
function ilRewrite(url) {
  try {
    if (IL.raw || !IL.door || typeof url !== 'string') return url;
    var own = location.origin + location.pathname;
    if (url.indexOf(own + '#') !== 0 && url !== own) return url;
    return location.origin + ilDir() + IL.door + url.slice(own.length);
  } catch (_) { return url; }
}
function ilRedraw() {
  try { if (document.querySelector('.invite-card') && typeof renderInviteCard === 'function') renderInviteCard(); } catch (_) {}
  try {
    ['dq-share', 'dq-link'].forEach(function (id) {
      var box = document.getElementById(id);
      if (box && box.classList.contains('show') && typeof toggleDrawerQr === 'function') { box.classList.remove('show'); toggleDrawerQr(id, id === 'dq-link' ? 'link' : 'share'); }
    });
  } catch (_) {}
}
var _ilInv = invUrl, _ilDev = linkDeviceUrl, _ilCarry = rhCarryUrl;
invUrl = function (room) { return ilRewrite(_ilInv.apply(this, arguments)); };
linkDeviceUrl = function (room) { return ilRewrite(_ilDev.apply(this, arguments)); };
rhCarryUrl = function (room) { IL.raw++; try { return _ilCarry.apply(this, arguments); } finally { IL.raw--; } };
if (typeof document !== 'undefined') {
  ilAsk('start');
  try { document.addEventListener('visibilitychange', function () { if (!document.hidden) ilAsk('return'); }); } catch (_) {}
}
