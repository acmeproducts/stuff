/* ═══════════ GAP PART · IO1-install-optional.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: NF_DONE_KEY, NF_VIA_RELOAD, nf, p2Runs, nfLog, nfPerm, nfCanPush, nfState, nfMayAttempt, nfOfferDone, nfOfferEligible, nfQualifies, nfMountBar, nfDropBar, nfNote, nfOnYes, nfOnNo, nfKeysInto, nfReloadUrl, nfReloadForSteps, nfMakeTab, nfEnsureTab, nfEnsureInstallTab, nfSyncTab, nfRenderPane, nfRenderInstallPane, nfInstallNow, nfTurnOn, nfOnTabClick, nfOnInstallClick, nfOpenTab, nfTick, nfInit
   markers: tab_boot, attempt_skipped, recipe_skipped, offer_shown, offer_declined, offer_taken, offer_blocked, tab_shown, tab_hidden, ios_reload, ios_steps, init_failed, install_available, install_tab_shown, install_prompt, install_done
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
   · INSTALL ON DEMAND (candidate 2, owner 2026-10-10: "where is the install on demand entry?"): an Install tab in Room settings,
     there whenever the app is not installed — one tap to the browser's own install dialog where the browser offers one
     (beforeinstallprompt), else the platform's steps (the iPhone's with the same reload at the link-device address).
   Nothing here touches the relay, a credential, an endpoint, or a message type.
   ───────────────────────────────────────────────────────────────────────────── */
(function(){ try { if (typeof log==='function') log('build', { c:'turn29-ship-install-optional', file:'talkbridge-app/bridge-turn29-ship.html', built:'2026-10-10 18:00 UTC' }, 'ok'); } catch(_){} })();

var NF_DONE_KEY = 'tb_notif_offer_done';
var NF_VIA_RELOAD = (function () { try { return /[?&]nf=/.test(location.search); } catch (_) { return false; } })();   /* read while the page loads: boot clears the address */
var nf = { shown: false, bar: null, tabShown: false, installShown: false, installed: false, deferred: null, timer: null, go: function (u) { location.replace(u); } };
/* The browser's own install offer, held for the tap: Chrome fires it early and only once. The mini-infobar it would show is ours to replace. */
window.addEventListener('beforeinstallprompt', function (e) { try { e.preventDefault(); } catch (_) {} nf.deferred = e; nfLog('install_available', {}, 'ok'); try { nfRenderInstallPane(); } catch (_) {} });
window.addEventListener('appinstalled', function () { nf.deferred = null; nf.installed = true; nfLog('install_done', {}, 'ok'); try { nfSyncTab(); } catch (_) {} });

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
  nfNote(nfState() === 'ios-tab' ? 'You can add TalkBridge to your Home Screen later under Room settings → Install.' : 'You can turn this on later under Room settings → Notify.');
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
/* A joiner's keys live in memory only. The link-device address is built from the keys SAVED on the phone, and a joiner's phone saves none, so the Home Screen copy would start without transcription or translation. Put the in-memory ones in, where the saved ones are empty. */
function nfKeysInto(u) {
  try {
    var i = u.indexOf('#j='), jk = S.joinerKeys; if (i === -1 || !jk) return u;
    var p = decInv(u.slice(i + 3)); if (!p) return u;
    var did = false; ['k', 'tid', 'tok'].forEach(function (n) { if (!p[n] && jk[n]) { p[n] = jk[n]; did = true; } });
    return did ? u.slice(0, i) + '#j=' + encInv(p) : u;
  } catch (_) { return u; }
}
function nfReloadUrl(room) {
  var u = nfKeysInto(linkDeviceUrl(room)), i = u.indexOf('#');
  return i === -1 ? u : u.slice(0, i) + '?nf=' + Date.now().toString(36) + u.slice(i);                /* a new query makes it a real navigation, not a hash change */
}
function nfReloadForSteps() {
  var room = (typeof activeRoom === 'function') ? activeRoom() : null; if (!room) return false;
  if (CALL.active) { try { toast('Finish the call first'); } catch (_) {} return false; }
  nfLog('ios_reload', { room: String(room.id).slice(-6) }, 'ok');
  try { nf.go(nfReloadUrl(room)); } catch (_) {}
  return true;
}

/* The tabs of Room settings this stage adds: Notify (only while notifications are not set up) and Install (whenever the app is not installed). */
function nfMakeTab(key, label, paneId, onClick) {
  var tabs = document.getElementById('drawer-tabs'); if (!tabs) return null;
  var tab = tabs.querySelector('[data-tab="' + key + '"]'); if (tab) return tab;
  var body = tabs.parentNode && tabs.parentNode.querySelector ? tabs.parentNode.querySelector('.drawer-body') : null; if (!body) return null;
  tab = document.createElement('button'); tab.className = 'drawer-tab'; tab.setAttribute('data-tab', key); tab.textContent = label; tab.style.display = 'none';
  tabs.appendChild(tab);
  var pane = document.createElement('div'); pane.className = 'drawer-pane nf-pane'; pane.id = paneId; pane.setAttribute('data-pane', key); body.appendChild(pane);
  tab.addEventListener('click', onClick);
  return tab;
}
function nfEnsureTab() { return nfMakeTab('notify', 'Notify', 'nf-pane', nfOnTabClick); }
function nfEnsureInstallTab() { return nfMakeTab('install', 'Install', 'nf-install-pane', nfOnInstallClick); }
function nfSyncTab() {
  var tab = nfEnsureTab(), itab = nfEnsureInstallTab(); if (!tab || !itab) return;
  var iwant = !p2IsStandalone() && !nf.installed;
  itab.style.display = iwant ? '' : 'none';
  if (iwant && !nf.installShown) { nf.installShown = true; nfLog('install_tab_shown', { platform: p2Platform(), prompt: !!nf.deferred }, 'ok'); }
  if (!iwant && nf.installShown) { nf.installShown = false; if (itab.classList.contains('active')) { var g0 = document.querySelector('#drawer-tabs [data-tab="general"]'); if (g0) g0.click(); } }
  var st = nfState(), want = (st === 'default' || st === 'granted' || st === 'denied');   /* an iPhone tab has the Install tab for its steps */
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
  if (st === 'denied') {
    h = '<div class="nf-lead">Notifications are blocked for TalkBridge.</div><div class="nf-small">Allow them in your browser’s site settings for this page, then come back.</div>';
  } else {
    h = '<div class="nf-lead">Get told about calls and messages when TalkBridge is not on screen.</div><button class="btn" id="nf-turnon">Turn on</button>';
  }
  pane.innerHTML = h;
  var b = pane.querySelector('#nf-turnon'); if (b) b.addEventListener('click', nfTurnOn);
}
/* The Install pane: the browser's own dialog where it offers one, else the platform's steps. */
function nfRenderInstallPane() {
  var pane = document.getElementById('nf-install-pane'); if (!pane) return;
  var platform = p2Platform(), where = platform === 'desktop' ? 'computer' : 'home screen', h;
  if (nf.deferred) {
    h = '<div class="nf-lead">Put TalkBridge on your ' + where + ' as an app. It opens in its own window and can tell you about calls and messages.</div><button class="btn" id="nf-install-now">Install app</button>';
  } else {
    var steps = (p2GateHtml('', platform).match(/<ol class="p2-steps">[\s\S]*?<\/ol>/) || [''])[0];
    h = '<div class="nf-lead">Put TalkBridge on your ' + where + ' as an app:</div>' + steps
      + (platform === 'ios' ? '<div class="nf-small">This room comes with you \u2014 you will not be asked for anything again.</div>' : '');
  }
  pane.innerHTML = h;
  var b = pane.querySelector('#nf-install-now'); if (b) b.addEventListener('click', nfInstallNow);
}
/* The browser's install dialog is raised inside the tap; the offer can be used once. */
function nfInstallNow() {
  var d = nf.deferred; if (!d) return Promise.resolve(null);
  nf.deferred = null;
  try { d.prompt(); } catch (_) { nfRenderInstallPane(); return Promise.resolve(null); }
  return Promise.resolve(d.userChoice).then(function (c) { var out = (c && c.outcome) || 'unknown'; nfLog('install_prompt', { outcome: out }, 'ok'); nfRenderInstallPane(); return out; }, function () { nfRenderInstallPane(); return null; });
}
function nfOnInstallClick() {
  if (p2Platform() === 'ios' && !p2IsStandalone() && !NF_VIA_RELOAD) { if (nfReloadForSteps()) return; }
  nfRenderInstallPane();
}
function nfOnTabClick() { nfRenderPane(); }
function nfOpenTab(key) {
  var d = document.getElementById('btn-drawer'); if (d) d.click();
  var t = document.querySelector('#drawer-tabs [data-tab="' + key + '"]'); if (t) { t.style.display = ''; t.click(); }
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
    var d = document.getElementById('btn-drawer'); if (d) d.addEventListener('click', function () { nfSyncTab(); try { nfRenderPane(); nfRenderInstallPane(); } catch (_) {} }, true);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) nfTick(); });
    nf.timer = setInterval(nfTick, 3000);
    if (NF_VIA_RELOAD && nfState() === 'ios-tab' && S.view === 'room') { nfLog('ios_steps', { loadedVia: 'reload' }, 'ok'); nfOpenTab('install'); }
  } catch (e) { nfLog('init_failed', { e: String(e && e.message || e) }, 'error'); }
}
document.addEventListener('DOMContentLoaded', nfInit);
