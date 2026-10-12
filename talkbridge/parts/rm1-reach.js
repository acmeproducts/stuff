/* ═══════════ 29·ship PART · RH-1 reach.js — REACH ME WHEN I'M AWAY, one module (candidate 4, plan v21.90.0 §7.19) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — the module watches the room screen and the drawer with MutationObservers; it reassigns no function (the wrap map stays as the accepted build left it)
   adds: RH_DONE_KEY, rh, p2Runs, rhLog, rhPerm, rhCanPush, rhHasDurableKeys, rhOfferDone, rhState, rhMayAttempt, rhInstallOffer, rhInstallVisible, rhKeyMatches, rhCarryUrl, rhCarryReady, rhGoCarry, rhLine, rhRoomLine, rhHtml, rhWire, rhRenderRow, rhRenderBar, rhBarDue, rhRender, rhOnNo, rhOnTurnOn, rhOnInstall, rhOnReady, rhDismissDenied, rhOnDeadSubscription, rhSyncRegistration, rhTick, rhOnVisible, rhInit
   markers (rhLog's own prefix 'rh_'): bar_shown, bar_declined, turn_on, install_available, install_prompt, install_done, carry_go, carry_blocked, key_match, key_stale, key_unreadable, denied_dismissed, sub_dead, remint, reregister, init_failed

   THE OWNER'S RULINGS (2026-10-10): install and notifications are a GLOBAL setting, never a room's; nothing to search for in a menu;
   the entry is a sticky line at the foot of the left drawer; no tutorial that sends a person somewhere else; no credential dropped
   on any path. This module is the ONE place that knows the device's reachability. The Notify and Install tabs of c1–c3 are gone.

   ONE COMPONENT, TWO MOUNTS. `rhLine()` is the single state machine; `rhRenderRow()` draws it at the foot of the left drawer, always;
   `rhRenderBar()` draws the same line once above the composer at the first moment it matters (a partner and a first message; in the
   installed copy at once — that copy exists to be reached). "Not now" hides the bar for good (the c1–c3 key, so an earlier answer
   holds); the row has no Not now and stays until there is nothing left to do.

   STATES, highest first: 'ios-tab' (push does not exist in an iPhone browser; the Home Screen copy is the only path — the two steps
   ARE the line) · 'unsupported' (no service worker, Notification or PushManager: in-app webviews, iOS < 16.4, Firefox on iOS) ·
   'default' (not asked: Turn on, the browser's prompt INSIDE the tap, G33) · 'denied' (blocked: one line in the device's own
   words, dismissable — a page cannot open site settings and must not nag) · install (the browser has offered its own install
   dialog and this device holds DURABLE keys) · nothing. 'granted' (allowed, no live subscription) and 'registering' (subscribed,
   a live unmuted room not registered) are worked silently by the tick, never shown. "On" means granted ∧ a subscription under
   the current signing key (N11, G34 — in P3's attempt) ∧ every live unmuted room registered.

   CREDENTIALS. The carrying address is built from the keys the page HOLDS, in the order a call uses them (in memory → own →
   the unexpired grant; `CALL.keys()`), never from what the phone saved alone (G66: a joiner saves none; a grantee saves under another name).
   An iPhone tab moves to that address when it enters a room (P17 keeps it in the live address, so an evicted tab still carries and
   Add to Home Screen needs no tap and no reload); never during a call. The Home Screen copy launches at that address every time.
   On Android/desktop the installed copy opens at start_url with the tab's storage: own and granted keys carry, memory-only joiner
   keys do not (owner ruling 2026-08-05 — guests never persist the creator's keys) — so the install line is offered only to a
   device with durable keys, and a joined room with no keys says so instead of failing silently.

   Nothing here touches the relay, an endpoint, a credential store or a message type. The one storage key is RH_DONE_KEY.
*/
var RH_DONE_KEY = 'tb_notif_offer_done';                       /* the c1–c3 key: a "Not now" already given still holds */
var rh = { barShown: false, deniedDismissed: false, offer: null, installed: false, lastSync: 0, rowHtml: null, barHtml: null, timer: null, reminted: false, hiddenAt: 0, seenRoom: null, go: function (u) { location.replace(u); } };
function p2Runs() { return true; }                             /* the P3/P4/CR3 entry wraps arm in every launch (P06–P08) */
function rhLog(what, d, lvl) { try { log('rh_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function rhPerm() { try { return (window.Notification && Notification.permission) || 'unsupported'; } catch (_) { return 'unsupported'; } }
function rhCanPush() { try { return !!(window.Notification && ('PushManager' in window) && ('serviceWorker' in navigator)); } catch (_) { return false; } }
function rhHasDurableKeys() { try { return !!hasOwnCredentials(); } catch (_) { return false; } }   /* own key, or an unexpired grant */
function rhOfferDone() { try { return localStorage.getItem(RH_DONE_KEY) === '1'; } catch (_) { return false; } }

/* 'ios-tab' · 'unsupported' · 'default' · 'denied' · 'granted' · 'registering' · 'on' */
function rhState() {
  if (p2Platform() === 'ios' && !p2IsStandalone()) return 'ios-tab';
  if (!rhCanPush()) return 'unsupported';
  var p = rhPerm();
  if (p === 'denied') return 'denied';
  if (p !== 'granted') return 'default';
  if (!p3State.sub) return 'granted';
  var live = p3LiveRooms().filter(function (r) { return !r.muted; });
  for (var i = 0; i < live.length; i++) if (p3State.registered[live[i].id] !== true) return 'registering';
  return 'on';
}
/* An attempt with no tap may run only where it cannot prompt: the installed copy (as always), or a permission already granted. */
function rhMayAttempt() { return p2IsStandalone() || (rhCanPush() && rhPerm() === 'granted'); }

/* The browser's own install offer: held in the HEAD at parse time (P15 — Chrome fires it once, early), or caught here if it comes later. */
function rhInstallOffer() { return rh.offer || window.__tbInstallOffer || null; }
function rhInstallVisible() { return !p2IsStandalone() && !rh.installed && !window.__tbInstalled && !!rhInstallOffer() && rhHasDurableKeys(); }
window.addEventListener('beforeinstallprompt', function (e) { try { e.preventDefault(); } catch (_) {} rh.offer = e; rhLog('install_available', { late: true }, 'ok'); try { rhRender(); } catch (_) {} });
window.addEventListener('appinstalled', function () { rh.offer = null; rh.installed = true; window.__tbInstallOffer = null; rhLog('install_done', {}, 'ok'); try { rhRender(); } catch (_) {} });

/* N11 (G34): is this subscription minted with the CURRENT signing key? 'match' · 'stale' · 'unreadable' (an engine that hides the key — kept, logged). */
function rhKeyMatches(sub, vapidB64) {
  try {
    var have = sub && sub.options && sub.options.applicationServerKey;
    if (!have) { rhLog('key_unreadable', {}, 'warn'); return 'unreadable'; }
    var a = new Uint8Array(have), b = p3B64ToBytes(vapidB64);
    if (a.length !== b.length) { rhLog('key_stale', { have: a.length, want: b.length }, 'warn'); return 'stale'; }
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) { rhLog('key_stale', { at: i }, 'warn'); return 'stale'; }
    rhLog('key_match', {}, 'ok'); return 'match';
  } catch (e) { rhLog('key_unreadable', { e: String(e && e.message || e) }, 'warn'); return 'unreadable'; }
}

/* The carrying address: the room's link-device form with the keys the page HOLDS, exactly as a call resolves them (CALL.keys: memory → own → grant), never only the saved ones (G66). */
function rhCarryUrl(room) {
  var u = linkDeviceUrl(room);
  try {
    var i = u.indexOf('#j='); if (i === -1) return u;
    var p = decInv(u.slice(i + 3)); if (!p) return u;
    var k = CALL.keys();
    p.k = k.dg || p.k || ''; p.tid = k.tid || p.tid || ''; p.tok = k.tok || p.tok || '';
    return u.slice(0, i) + '#j=' + encInv(p);
  } catch (_) { return u; }
}
/* Does the live address already carry THIS room, as this person, with the keys the page holds? */
function rhCarryReady(room) {
  try {
    var h = location.hash || ''; if (h.indexOf('#j=') !== 0) return false;
    var p = decInv(h.slice(3)); if (!p || p.ld !== 1 || !room || p.r !== room.id) return false;
    return !!(p.k || !CALL.keys().dg);
  } catch (_) { return false; }
}
/* An iPhone tab moves to the carrying address — at room entry (the screen changes anyway) or on the line's own button; never in a call. */
function rhGoCarry(why) {
  var room = (typeof activeRoom === 'function') ? activeRoom() : null; if (!room) return false;
  if (rhState() !== 'ios-tab' || rhCarryReady(room)) return false;
  if (CALL.active) { rhLog('carry_blocked', { why: why }, 'info'); return false; }
  rhLog('carry_go', { why: why, room: String(room.id).slice(-6) }, 'ok');
  try { rh.go(rhCarryUrl(room)); } catch (_) {}
  return true;
}

/* THE LINE — one state, one text, at most one action. null = nothing left to do. */
function rhLine() {
  var st = rhState(), platform = p2Platform();
  if (st === 'ios-tab') {
    var room = (typeof activeRoom === 'function') ? activeRoom() : null, ready = room ? rhCarryReady(room) : false;
    return { kind: 'ios', text: 'Add TalkBridge to your Home Screen — calls and messages reach you when it’s closed.',
      steps: '<ol class="rh-steps"><li>Tap the <b>Share</b> button <span class="rh-ic">&#x2B06;&#xFE0E;</span></li><li>Choose <b>Add to Home Screen</b></li></ol>',
      button: (room && !ready) ? { act: 'ready', label: 'Show me' } : null };
  }
  if (st === 'unsupported') return { kind: 'unsupported', text: p2IsStandalone() ? 'This device’s software cannot deliver notifications to web apps.' : 'Notifications can’t work in this browser — open the link in ' + (platform === 'ios' ? 'Safari' : 'Chrome') + ' to be reached when the app is closed.' };
  if (st === 'default') return { kind: 'default', text: 'Want to know when they call or write?', button: { act: 'turnon', label: 'Turn on' } };
  if (st === 'denied') {
    if (rh.deniedDismissed) return rhInstallVisible() ? rhLine.install() : null;
    return { kind: 'denied', text: platform === 'android' ? 'Notifications are blocked for TalkBridge. Allow them in Chrome: ⋮ → Settings → Site settings → Notifications.'
      : (platform === 'ios' ? 'Notifications are off for TalkBridge. Allow them in Settings → Notifications → TalkBridge.' : 'Notifications are blocked for TalkBridge. Allow them in your browser’s site settings for this page.'), button: { act: 'dismiss', label: 'OK' } };
  }
  return rhInstallVisible() ? rhLine.install() : null;
}
rhLine.install = function () { return { kind: 'install', text: 'Install TalkBridge as an app — optional.', button: { act: 'install', label: 'Install' } }; };
/* A joined room this phone holds no keys for: say so where the room is, instead of a silent "no key" at the call. */
function rhRoomLine() {
  var room = (typeof activeRoom === 'function') ? activeRoom() : null; if (!room || room.role !== 'joiner') return null;
  var k = CALL.keys(); if (k.dg) return null;
  return { kind: 'nokeys', text: 'This phone has no translation keys for this room — open the invite link again on this phone.' };
}

function rhHtml(line, withNo) {
  var h = '<div class="rh-l"><span class="rh-t">' + line.text + '</span>';
  if (line.steps && !line.button) h += line.steps;
  h += '<span class="rh-bs">' + (line.button ? '<button class="rh-b" data-act="' + line.button.act + '">' + line.button.label + '</button>' : '') + (withNo ? '<button class="rh-b rh-no" data-act="no">Not now</button>' : '') + '</span></div>';
  return h;
}
function rhWire(root) {
  Array.prototype.forEach.call(root.querySelectorAll('.rh-b'), function (b) {
    var act = b.getAttribute('data-act');
    b.addEventListener('click', act === 'turnon' ? rhOnTurnOn : act === 'install' ? rhOnInstall : act === 'dismiss' ? rhDismissDenied : act === 'ready' ? rhOnReady : rhOnNo);
  });
}
/* Mount 1 — the foot of the left drawer. Always; empty when there is nothing left to do. */
function rhRenderRow() {
  var panel = document.getElementById('left-panel'); if (!panel) return;
  var row = document.getElementById('rh-row');
  if (!row) { row = document.createElement('div'); row.id = 'rh-row'; row.className = 'rh-row'; var body = panel.querySelector('.left-body'); if (body && body.nextSibling) panel.insertBefore(row, body.nextSibling); else panel.appendChild(row); }
  var line = rhLine(), h = line ? rhHtml(line, false) : '';
  if (h === rh.rowHtml) return; rh.rowHtml = h;
  row.innerHTML = h; row.style.display = h ? '' : 'none'; rhWire(row);
}
/* Mount 2 — once, above the composer, at the first moment it matters. */
function rhBarDue() {
  if (rhOfferDone()) return false;
  var line = rhLine(); if (!line || line.kind === 'unsupported' || line.kind === 'denied' || line.kind === 'install') return false;   /* the bar nudges once toward being reachable; install is the row's */
  var room = (typeof activeRoom === 'function') ? activeRoom() : null; if (!room || room.deletedAt || S.view !== 'room' || S.roomId !== room.id) return false;
  if (p2IsStandalone()) return true;
  if (!room.joined) return false;
  return transcript.some(function (e) { return e && e.kind === 'chat'; });
}
function rhRenderBar() {
  var compose = document.querySelector('#scr-room .compose'); if (!compose || !compose.parentNode) return;
  var bar = document.getElementById('rh-bar'), roomLine = rhRoomLine(), line = rhBarDue() ? rhLine() : null;
  var h = (roomLine ? '<div class="rh-t rh-warn">' + roomLine.text + '</div>' : '') + (line ? rhHtml(line, true) : '');
  if (h === rh.barHtml && (!!bar === !!h)) return; rh.barHtml = h;
  if (!h) { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'rh-bar'; bar.className = 'rh-bar'; compose.parentNode.insertBefore(bar, compose); }
  bar.innerHTML = h; rhWire(bar);
  if (line && !rh.barShown) { rh.barShown = true; rhLog('bar_shown', { platform: p2Platform(), kind: line.kind, standalone: p2IsStandalone() }, 'ok'); }
}
function rhRender() { try { rhRenderRow(); } catch (e) { rhLog('init_failed', { where: 'row', e: String(e && e.message || e) }, 'error'); } try { rhRenderBar(); } catch (e2) { rhLog('init_failed', { where: 'bar', e: String(e2 && e2.message || e2) }, 'error'); } }

/* Actions — every browser prompt is raised INSIDE the tap that asked for it (G33). */
function rhOnNo() { try { localStorage.setItem(RH_DONE_KEY, '1'); } catch (_) {} rhLog('bar_declined', { platform: p2Platform() }, 'ok'); rhRender(); }
function rhOnTurnOn() {
  rhLog('turn_on', { platform: p2Platform(), standalone: p2IsStandalone() }, 'ok');
  var p = p3AttemptInGesture();                                /* synchronously, still inside the tap */
  return Promise.resolve(p).then(function () {
    var st = rhState();
    if (st === 'on' || st === 'registering' || st === 'denied') { try { localStorage.setItem(RH_DONE_KEY, '1'); } catch (_) {} }   /* answered either way: the bar has done its job */
    rhRender(); return st;
  });
}
function rhOnInstall() {
  var d = rhInstallOffer(); if (!d) return Promise.resolve(null);
  rh.offer = null; window.__tbInstallOffer = null;             /* the browser's offer is good for one use */
  try { d.prompt(); } catch (_) { rhRender(); return Promise.resolve(null); }
  return Promise.resolve(d.userChoice).then(function (c) { var out = (c && c.outcome) || 'unknown'; rhLog('install_prompt', { outcome: out }, 'ok'); rhRender(); return out; }, function () { rhRender(); return null; });
}
function rhOnReady() { rhGoCarry('tap'); }
function rhDismissDenied() { rh.deniedDismissed = true; rhLog('denied_dismissed', {}, 'ok'); rhRender(); }

/* THE DEAD SUBSCRIPTION (relay v6.8, P23). Chrome hands the app the same subscription at every boot even after the push service has declared it
   gone (a WebAPK reinstall does this: 2026-10-10 18:23 UTC, FCM 410, every later call "no-subscription"). The relay remembers the dead endpoint and
   refuses it; the app then unsubscribes, mints a new one and registers every room — once per launch. */
function rhOnDeadSubscription(roomId) {
  rhLog('sub_dead', { room: String(roomId).slice(-6), reminted: rh.reminted }, 'warn');
  if (rh.reminted) return Promise.resolve(false);
  rh.reminted = true;
  var old = p3State.sub; p3State.sub = null; p3State.registered = {};
  var drop = old && old.unsubscribe ? Promise.resolve(old.unsubscribe()).then(function () { return true; }, function () { return false; }) : Promise.resolve(false);
  return drop.then(function (dropped) { rhLog('remint', { dropped: dropped }, 'ok'); return p3Attempt(false); }).then(function (sub) { rhRender(); return !!sub; });
}
/* The silent work: an allowed permission with no live subscription is subscribed; a subscribed device with a live room unregistered is registered. Throttled.
   A return after a long absence re-registers every live room once: the relay may have dropped the subscription while the phone was away (a 410 on a call). */
function rhSyncRegistration() {
  var st = rhState(), now = Date.now(); if (now - rh.lastSync < 30000) return;
  if (st === 'granted') { rh.lastSync = now; try { p3Attempt(false); } catch (_) {} }
  else if (st === 'registering') { rh.lastSync = now; try { p3RegisterAll(); } catch (_) {} }
}
function rhTick() { try { rhSyncRegistration(); } catch (_) {} rhRender(); }
function rhOnVisible() {
  var away = rh.hiddenAt ? Date.now() - rh.hiddenAt : 0; rh.hiddenAt = 0;
  if (away >= 60000 && p3State.sub) { rhLog('reregister', { awayMs: away }, 'ok'); rh.lastSync = Date.now(); try { p3RegisterAll(); } catch (_) {} }   /* the flags are left as they are: P3's own mute-sync would otherwise register the same rooms a second time */
  rhTick();
}

function rhInit() {
  try { log('build', { c: 'turn29-ship-c6', file: 'talkbridge-app/bridge-turn29-ship.html', built: '2026-10-12' }, 'ok'); } catch (_) {}   /* the stage names itself in the log, as every stage does */
  try {
    var st = document.createElement('style');
    st.textContent = '.rh-row{padding:10px 76px 10px 12px;border-top:1px solid var(--border,#e2ded9);background:var(--paper,#f4efe9);font-size:13px;line-height:1.35;color:var(--ink,#1A1714)}'
      + '.rh-bar{padding:8px 12px;background:var(--paper,#f4efe9);border-top:1px solid var(--border,#e2ded9);font-size:13px;line-height:1.35;color:var(--ink,#1A1714)}'
      + '.rh-l{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.rh-l .rh-t{flex:1;min-width:140px}.rh-bs{display:flex;gap:6px;flex-shrink:0}'
      + '.rh-b{border:none;border-radius:8px;padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer;background:var(--teal,#2a7f7a);color:#fff}.rh-no{background:transparent;color:var(--ink-dim,#6b655f)}'
      + '.rh-steps{margin:6px 0 0;padding-left:18px;flex-basis:100%}.rh-ic{display:inline-block;transform:translateY(1px)}.rh-warn{color:var(--red,#b4432f);font-weight:600;margin-bottom:6px}';
    document.head.appendChild(st);
    if (window.__tbInstallOffer) rhLog('install_available', { late: false }, 'ok');
    if (window.__tbInstalled) rh.installed = true;
    /* room entry = the room screen becoming active; the drawer opening = its class. Observed, not wrapped. */
    var scr = document.getElementById('scr-room'), panel = document.getElementById('left-panel');
    if (scr && window.MutationObserver) new MutationObserver(function () { try { if (scr.classList.contains('active') && S.roomId && rh.seenRoom !== S.roomId + ':' + S.view) { rh.seenRoom = S.roomId + ':' + S.view; if (!rhGoCarry('enter')) rhRender(); } } catch (e) { rhLog('init_failed', { where: 'enter', e: String(e && e.message || e) }, 'error'); } }).observe(scr, { attributes: true, attributeFilter: ['class'] });
    if (panel && window.MutationObserver) new MutationObserver(function () { try { if (panel.classList.contains('open')) rhRender(); } catch (_) {} }).observe(panel, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('visibilitychange', function () { if (document.hidden) rh.hiddenAt = Date.now(); else rhOnVisible(); });
    rh.timer = setInterval(rhTick, 3000);
    rhRender();
  } catch (e) { rhLog('init_failed', { e: String(e && e.message || e) }, 'error'); }
}
document.addEventListener('DOMContentLoaded', rhInit);
