/* ═══════════ GAP PART · IO1-install-optional.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: NF_DONE_KEY, NF_VIA_RELOAD, nf, p2Runs, nfLog, nfPerm, nfCanPush, nfState, nfMayAttempt, nfOfferDone, nfOfferEligible, nfQualifies, nfMountBar, nfDropBar, nfNote, nfOnYes, nfOnNo, nfReloadUrl, nfReloadForSteps, nfEnsureTab, nfSyncTab, nfRenderPane, nfTurnOn, nfOnTabClick, nfOpenNotify, nfTick, nfInit
   markers: tab_boot, attempt_skipped, recipe_skipped, offer_shown, offer_declined, offer_taken, offer_blocked, tab_shown, tab_hidden, ios_reload, ios_steps, init_failed
*/
/* ─────────────────────────────────────────────────────────────────────────────
   IO-1 · INSTALL IS OPTIONAL (29·ship, §7.19; owner order 2026-10-07, "go" 2026-10-10)

   No registration, no tracking, no install to talk. A link or a QR code opens the
   room in whatever browser scanned it: name once; call, chat, phrasebook — all of it
   — in the tab. Notifications are the one thing that needs more, and only the
   iPhone needs the app on the Home Screen for them (Android and desktop get push in
   the tab). What this part and its banked edits change:
   · p2Entry boots the app in EVERY launch (the full-screen gate is gone); push, the
     alert journal and the presence stack arm in a tab too (p2Runs).
   · The permission prompt is raised ONLY inside a tap (G33): an attempt with no tap
     runs only where it cannot prompt; a tab never asks at a call.
   · THE OFFER, once per launch until decided: a one-line bar above the composer, shown
     when the room has a partner AND a first message — never at boot, never in the
     installed app, never when permission is already decided. "Not now" ends it for
     good (tb_notif_offer_done) and names where the way back is.
   · THE WAY BACK, the Notify tab in the room's settings: present only while
     notifications are not set up; Turn on (Android, desktop, installed iPhone) or the
     two iPhone steps, with the page reloaded at the room's link-device address first
     so the Home Screen copy opens as the same person in the same room (the load-time
     address carries, device proof 2026-10-07 and again 2026-10-10).
   Nothing here touches the relay, a credential, an endpoint, or a message type.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){ try { if (typeof log==='function') log('build', { c:'turn29-ship-install-optional', file:'talkbridge-app/bridge-turn29-ship.html', built:'2026-10-10 18:00 UTC' }, 'ok'); } catch(_){} })();

var NF_DONE_KEY = 'tb_notif_offer_done';
var NF_VIA_RELOAD = (function () { try { return /[?&]nf=/.test(location.search); } catch (_) { return false; } })();   /* read while the page loads: boot clears the address */
var nf = { shown: false, bar: null, tabShown: false, timer: null, go: function (u) { location.replace(u); } };

/* The app runs in every launch. A constant on purpose: one seam where the accepted build asked "installed?" */
function p2Runs() { return true; }
function nfLog(what, d, lvl) { try { log('nf_' + what, d || {}, lvl || 'info'); } catch (_) {} }

function nfPerm() { try { return window.Notification ? Notification.permission : 'unsupported'; } catch (_) { return 'unsupported'; } }
function nfCanPush() { return ('serviceWorker' in navigator) && ('PushManager' in window) && !!window.Notification; }
/* 'ios-tab' (needs the Home Screen) · 'unsupported' · 'denied' · 'on' (granted and subscribed) · 'granted' (allowed, subscription not live yet) · 'default' (not asked) */
function nfState() {
  if (p2Platform() === 'ios' && !p2IsStandalone()) return 'ios-tab';
  if (!nfCanPush()) return 'unsupported';
  var perm = nfPerm();
  if (perm === 'denied') return 'denied';
  if (perm === 'granted') return (p3State && p3State.sub) ? 'on' : 'granted';
  return 'default';
}
/* An attempt with no tap may run where it cannot prompt: the installed app (as before) or a permission already granted. */
function nfMayAttempt() { return p2IsStandalone() || (nfCanPush() && nfPerm() === 'granted'); }

function nfOfferDone() { try { return localStorage.getItem(NF_DONE_KEY) === '1'; } catch (_) { return false; } }
function nfOfferEligible() {
  if (p2IsStandalone() || nfOfferDone()) return false;
  var st = nfState(); return st === 'default' || st === 'ios-tab';
}
/* The first moment a notification would have mattered: the room has a partner and a first message, and the room is on screen. */
function nfQualifies() {
  var room = (typeof activeRoom === 'function') ? activeRoom() : null;
  if (!room || room.deletedAt || !room.joined) return false;
  if (S.view !== 'room' || S.roomId !== room.id) return false;
  return transcript.some(function (e) { return e && e.kind === 'chat'; });
}

function nfMountBar() {
  var compose = document.querySelector('#scr-room .compose'); if (!compose || !compose.parentNode || document.getElementById('nf-bar')) return false;
  var ios = nfState() === 'ios-tab';
  var bar = document.createElement('div'); bar.id = 'nf-bar'; bar.className = 'nf-bar';
  bar.innerHTML = '<span class="nf-t">' + (ios ? 'Calls and messages can reach you when the app is closed — add TalkBridge to your Home Screen.' : 'Want to know when they call or write?') + '</span>'
    + '<span class="nf-b"><button class="nf-yes" id="nf-yes">' + (ios ? 'Show me' : 'Turn on') + '</button><button class="nf-no" id="nf-no">Not now</button></span>';
  compose.parentNode.insertBefore(bar, compose); nf.bar = bar;
  bar.querySelector('#nf-yes').addEventListener('click', nfOnYes);
  bar.querySelector('#nf-no').addEventListener('click', nfOnNo);
  return true;
}
function nfDropBar() { var b = document.getElementById('nf-bar'); if (b && b.parentNode) b.parentNode.removeChild(b); nf.bar = null; }
function nfNote(text) {
  nfDropBar();
  var compose = document.querySelector('#scr-room .compose'); if (!compose || !compose.parentNode) return;
  var n = document.createElement('div'); n.id = 'nf-note'; n.className = 'nf-bar nf-note'; n.textContent = text; compose.parentNode.insertBefore(n, compose);
  setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 6000);
}
function nfOnNo() {
  try { localStorage.setItem(NF_DONE_KEY, '1'); } catch (_) {}
  nfLog('offer_declined', { platform: p2Platform() }, 'ok');
  nfNote('You can turn this on later under Room settings → Notify.');
}
function nfOnYes() {
  var ios = nfState() === 'ios-tab';
  try { localStorage.setItem(NF_DONE_KEY, '1'); } catch (_) {}
  nfLog('offer_taken', { platform: p2Platform() }, 'ok');
  nfDropBar();
  if (ios) { nfReloadForSteps(); return; }
  nfTurnOn();                                                      /* still inside the tap that raised this handler */
}

/* The permission prompt, inside the tap. Result: on / blocked / still undecided. */
function nfTurnOn() {
  var p = p3AttemptInGesture();
  return Promise.resolve(p).then(function () {
    var st = nfState();
    if (st === 'denied') { nfLog('offer_blocked', { platform: p2Platform() }, 'warn'); nfNote('Notifications are blocked for this site. You can allow them in your browser’s site settings.'); }
    nfSyncTab(); try { nfRenderPane(); } catch (_) {}
    return st;
  });
}

/* iPhone: the Home Screen copy keeps the address the page LOADED at. Reload at the room's link-device address first. */
function nfReloadUrl(room) {
  var u = linkDeviceUrl(room), i = u.indexOf('#');
  return i === -1 ? u : u.slice(0, i) + '?nf=' + Date.now().toString(36) + u.slice(i);                /* a new query makes it a real navigation, not a hash change */
}
function nfReloadForSteps() {
  var room = (typeof activeRoom === 'function') ? activeRoom() : null; if (!room) return false;
  if (CALL.active) { try { toast('Finish the call first'); } catch (_) {} return false; }
  nfLog('ios_reload', { room: String(room.id).slice(-6) }, 'ok');
  try { nf.go(nfReloadUrl(room)); } catch (_) {}
  return true;
}

/* The Notify tab: exists only while notifications are not set up. */
function nfEnsureTab() {
  var tabs = document.getElementById('drawer-tabs'); if (!tabs) return null;
  var tab = tabs.querySelector('[data-tab="notify"]'); if (tab) return tab;
  var body = tabs.parentNode && tabs.parentNode.querySelector ? tabs.parentNode.querySelector('.drawer-body') : null; if (!body) return null;
  tab = document.createElement('button'); tab.className = 'drawer-tab'; tab.setAttribute('data-tab', 'notify'); tab.textContent = 'Notify'; tab.style.display = 'none';
  tabs.appendChild(tab);
  var pane = document.createElement('div'); pane.className = 'drawer-pane nf-pane'; pane.id = 'nf-pane'; pane.setAttribute('data-pane', 'notify'); body.appendChild(pane);
  tab.addEventListener('click', nfOnTabClick);
  return tab;
}
function nfSyncTab() {
  var tab = nfEnsureTab(); if (!tab) return;
  var st = nfState(), want = (st === 'ios-tab' || st === 'default' || st === 'granted' || st === 'denied');
  tab.style.display = want ? '' : 'none';
  if (want && !nf.tabShown) { nf.tabShown = true; nfLog('tab_shown', { platform: p2Platform(), state: st }, 'ok'); }
  if (!want && nf.tabShown) {
    nf.tabShown = false; nfLog('tab_hidden', { why: st }, 'ok');
    if (tab.classList.contains('active')) { var g = document.querySelector('#drawer-tabs [data-tab="general"]'); if (g) g.click(); }
  }
}
function nfRenderPane() {
  var pane = document.getElementById('nf-pane'); if (!pane) return;
  var st = nfState(), h = '';
  if (st === 'ios-tab') {
    var steps = (p2GateHtml('', 'ios').match(/<ol class="p2-steps">[\s\S]*?<\/ol>/) || [''])[0];
    h = '<div class="nf-lead">Notifications reach you when the app is closed. On iPhone that needs TalkBridge on your Home Screen:</div>' + steps
      + '<div class="nf-small">This room comes with you — you will not be asked for anything again.</div>';
  } else if (st === 'denied') {
    h = '<div class="nf-lead">Notifications are blocked for TalkBridge.</div><div class="nf-small">Allow them in your browser’s site settings for this page, then come back.</div>';
  } else {
    h = '<div class="nf-lead">Get told about calls and messages when TalkBridge is not on screen.</div><button class="btn" id="nf-turnon">Turn on</button>';
  }
  pane.innerHTML = h;
  var b = pane.querySelector('#nf-turnon'); if (b) b.addEventListener('click', nfTurnOn);
}
function nfOnTabClick() {
  /* on an iPhone tab the first look at the steps reloads the page at the link-device address; the reloaded page shows them */
  if (nfState() === 'ios-tab' && !NF_VIA_RELOAD) { if (nfReloadForSteps()) return; }
  nfRenderPane();
}
function nfOpenNotify() {
  var d = document.getElementById('btn-drawer'); if (d) d.click();
  var t = document.querySelector('#drawer-tabs [data-tab="notify"]'); if (t) { t.style.display = ''; t.click(); }
}

function nfTick() {
  try {
    nfSyncTab();
    if (!nf.shown && nfOfferEligible() && nfQualifies() && !document.getElementById('nf-bar') && nfMountBar()) {
      nf.shown = true; nfLog('offer_shown', { platform: p2Platform(), why: 'partner_and_message' }, 'ok');
    }
  } catch (_) {}
}
function nfInit() {
  try {
    var st = document.createElement('style');
    st.textContent = '.nf-bar{display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--paper,#f4efe9);border-top:1px solid var(--border,#e2ded9);font-size:13px;line-height:1.35;color:var(--ink-mid,#3a3633)}'
      + '.nf-bar .nf-t{flex:1}.nf-bar .nf-b{display:flex;gap:6px;flex-shrink:0}.nf-bar button{border:none;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer}'
      + '.nf-yes{background:var(--teal,#2E8B8B);color:#fff}.nf-no{background:transparent;color:var(--ink-dim,#6b7a78)}.nf-note{color:var(--ink-dim,#6b7a78)}'
      + '.nf-pane .nf-lead{font-size:14.5px;line-height:1.5;margin:4px 0 12px;color:var(--ink,#1A1714)}.nf-pane .nf-small{font-size:12.5px;line-height:1.45;margin-top:12px;color:var(--ink-dim,#6b7a78)}'
      + '.nf-pane .p2-steps{margin:0;padding-left:20px;font-size:15px;line-height:1.7}.nf-pane .p2-ic{display:inline-block;color:var(--teal,#2E8B8B)}';
    document.head.appendChild(st);
  } catch (_) {}
  try {
    nfEnsureTab(); nfSyncTab();
    var d = document.getElementById('btn-drawer'); if (d) d.addEventListener('click', function () { nfSyncTab(); try { nfRenderPane(); } catch (_) {} }, true);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) nfTick(); });
    nf.timer = setInterval(nfTick, 3000);
    if (NF_VIA_RELOAD && nfState() === 'ios-tab' && S.view === 'room') { nfLog('ios_steps', { loadedVia: 'reload' }, 'ok'); nfOpenNotify(); }
  } catch (e) { nfLog('init_failed', { e: String(e && e.message || e) }, 'error'); }
}
document.addEventListener('DOMContentLoaded', nfInit);
