
/* ═══════════ R10 PART · P4-presentation-owner.js (v4, plan v20.5.1 §4.9) ═══════════ */
/* @contract
   wraps: handleRelay, LISTEN.handle, CALL.start, relaySend, CALL.onIncoming, CALL.accept, enterRoom, saveRooms, p2Entry
   adds: p4Log, p4Idb, p4Journal (removed — worker-side only), p4Drain, p4SaveCtx, p4IsPushWorthy, p4Presented, p4CloseTag, p4State, p4OnSwMessage, p4Counted, p4MarkCounted, p4LedgerSyncRoom, p4LedgerSync, p4AdvanceCursor
   Review contract §7.2 + §7.3, app side:
   - PRESENTED: a VISIBLE app that presents an event returns presented(eventId)
     on that room's socket — the only thing that suppresses that event's push.
     Hidden apps return nothing and the push arrives ≤1s. No other traffic is
     ever an acknowledgement.
   - NO in-app OS-style notifications: while the app is visible, in-app
     surfaces (bubble, ring screen, home/panel counts) are the whole
     presentation. OS alerts exist only via real pushes to a non-presenting
     device (§4.1 row 2: visible elsewhere = no OS alert).
   - EXACT COUNTERS from the relay's durable ledger with an acknowledged
     cursor. Live socket events mark their eventIds counted so socket+ledger
     can never double-increment. Opening a room marks its items seen. The
     worker journal is telemetry only and never touches a counter.
   - Cosmetic hygiene (never a correctness dependency, review §5): stale
     banners for a room are closed when its ring presents / call answers /
     room opens, where the platform honors it.
*/
var p4State = { ctxTimer: null, lastL: {}, syncing: {}, offers: {}, decisions: {}, callId: null, pendingOpen: null };
var P4_PUSH_WORTHY = { 'chat-msg': 1, 'sys-pill': 1, 'call-start': 1, 'call-end': 1, 'thread-invite': 1 };
function p4Log(what, data, level) { try { log('p4_' + what, data || {}, level || 'info'); } catch (_) {} }
function p4IsPushWorthy(d) { return !!(d && d.type && P4_PUSH_WORTHY[d.type]); }

function p4Idb() {
  return new Promise(function (res, rej) {
    if (!window.indexedDB) return rej(new Error('no-idb'));
    var r = indexedDB.open('tb-r10', 1);
    r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains('journal')) d.createObjectStore('journal', { autoIncrement: true }); if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'k' }); };
    r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
  });
}
/* Worker receipts drain into the debug log — TELEMETRY ONLY (review §7.3). */
function p4Drain() {
  return p4Idb().then(function (d) {
    return new Promise(function (res) {
      var tx = d.transaction('journal', 'readwrite'), st = tx.objectStore('journal'), rows = [];
      var c = st.openCursor();
      c.onsuccess = function () { var cur = c.result; if (cur) { rows.push(cur.value); cur.delete(); cur.continue(); } };
      tx.oncomplete = function () { res(rows); }; tx.onerror = function () { res(rows); };
    });
  }).then(function (rows) {
    rows.forEach(function (en) { p4Log('sw_receipt', { ev: en.ev, at: en.ts, room: en.room ? String(en.room).slice(-6) : null, kind: en.kind, eventId: en.eventId || null, e: en.e }, en.ev === 'failed' ? 'error' : 'ok'); });
    p4Log('sw_drained', { n: rows.length }, 'ok');
    return rows;
  }).catch(function (e) { p4Log('sw_drain_failed', { e: String(e && e.message || e) }, 'error'); return []; });
}
function p4SaveCtx() {
  clearTimeout(p4State.ctxTimer);
  p4State.ctxTimer = setTimeout(function () {
    var appUrl = location.origin + location.pathname;
    var ctx = { k: 'ctx', v: { appUrl: appUrl, relay: p3RelayHttp(), app: RELAY_APP, client: deviceId,
      rooms: S.rooms.filter(function (r) { return !r.deletedAt; }).map(function (r) { return { id: r.id, title: roomTitle(r), muted: !!r.muted }; }) } };
    p4Idb().then(function (d) { var tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ctx); }).catch(function (e) { p4Log('ctx_save_failed', { e: String(e && e.message || e) }, 'error'); });
  }, 400);
}

/* A visible/focused page asks for ownership of the exact offer. It still does
   not present anything until the relay returns presentation-grant. */
function p4IsForeground() {
  var focus = true; try { focus = typeof document.hasFocus !== 'function' || document.hasFocus(); } catch (_) {}
  return !document.hidden && focus;
}
function p4ForegroundReady(roomId, eventId) {
  if (!eventId || !p4IsForeground()) return false;
  var m = { type: 'foreground-ready', eventId: eventId, transient: true };
  var ok = (roomId === S.roomId) ? relaySend(m) : LISTEN.send(roomId, m);
  p4Log('foreground_ready', { room: String(roomId).slice(-6), eventId: String(eventId).slice(0, 18), sent: !!ok }, ok ? 'ok' : 'warn');
  return ok;
}

function p4Offer(roomId, d, lane) {
  if (!d || !d.eventId) return true;
  p4State.offers[d.eventId] = { roomId: roomId, message: d, lane: lane };
  p4Log('offer_received', { room: String(roomId).slice(-6), eventId: String(d.eventId).slice(0, 18), foreground: p4IsForeground() }, 'ok');
  p4ForegroundReady(roomId, d.eventId);
  return true;
}

function p4ApplyDecision(roomId, d, lane, original) {
  var offer = p4State.offers[d.eventId];
  var msg = offer && offer.message;
  var owner = d.owner || (d.type === 'presentation-grant' ? 'in_app' : 'os');
  p4State.decisions[d.eventId] = owner;
  delete p4State.offers[d.eventId];
  p4Log('owner_committed', { room: String(roomId).slice(-6), eventId: String(d.eventId).slice(0, 18), reason: d.reason, kind: owner }, 'ok');
  if (!msg) return true;
  if (owner === 'terminal') return true;
  /* Calls may auto-ring only when the relay grants in-app ownership. The OS,
     muted and terminal paths keep call state quiet until a notification tap. */
  if (msg.type === 'call-start' && owner !== 'in_app') return true;
  var r = original(msg);
  if (msg.type === 'chat-msg') p4MarkCounted(roomId, msg.eventId);
  if (owner === 'in_app' && msg.type === 'call-start') p4CloseTag(roomId);
  return r;
}

/* ── cosmetic banner hygiene ────────────────────────────────────────────── */
function p4CloseTag(roomId) {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.getNotifications) return;
      return reg.getNotifications({ tag: 'tb-' + roomId }).then(function (ns) { ns.forEach(function (n) { try { n.close(); } catch (_) {} }); if (ns.length) p4Log('stale_closed', { room: String(roomId).slice(-6), n: ns.length }, 'ok'); });
    }).catch(function () {});
  } catch (_) {}
}
function p4OnSwMessage(ev) {
  var d = ev && ev.data; if (!d || d.t !== 'tb-open') return;
  p4State.pendingOpen = { eventId: d.eventId || null, roomId: d.roomId || null, type: d.type || null, kind: d.kind || null, callId: d.callId || null };
  p4OpenPending();
}

function p4ReadBootRoute() {
  try {
    var q = new URL(location.href).searchParams;
    var eventId = q.get('tbEvent'), roomId = q.get('tbRoom');
    if (!eventId || !roomId) return null;
    return { eventId: eventId, roomId: roomId, type: q.get('tbType'), kind: q.get('tbKind'), callId: q.get('tbCall') };
  } catch (_) { return null; }
}
function p4EventFetch(route) {
  var u = p3RelayHttp() + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(route.roomId)
    + '&client=' + encodeURIComponent(deviceId) + '&event=' + encodeURIComponent(route.eventId);
  return fetch(u).then(function (r) { return r.json(); }).then(function (d) { return d && d.event || null; });
}
function p4OutcomeText(e) {
  var k = e && e.kind === 'video' ? 'Video' : 'Voice', s = e && e.state;
  if (s === 'timed_out') return 'Missed ' + k.toLowerCase() + ' call';
  if (s === 'declined') return k + ' call declined';
  if (s === 'canceled') return k + ' call canceled';
  if (s === 'answered' || s === 'ended') return k + ' call ended';
  return k + ' call';
}
function p4EnsureOutcome(roomId, e) {
  if (!e || !e.callId) return;
  var id = 'outcome-' + e.callId, tr = loadTr(roomId);
  if (tr.some(function (x) { return x.id === id; })) return;
  tr.push({ id: id, kind: 'sys', text: p4OutcomeText(e), ts: Date.now() });
  lsSet(trKey(roomId), tr);
}
function p4ConfirmRoute(route, actual) {
  p4Log('navigation_result', { eventId: String(route.eventId).slice(0, 18), room: String(route.roomId).slice(-6), actual: actual }, actual === 'event_room' || actual === 'call_screen' ? 'ok' : 'error');
  try {
    var u = new URL(location.href); ['tbEvent','tbRoom','tbType','tbKind','tbCall'].forEach(function (k) { u.searchParams.delete(k); });
    history.replaceState(history.state, '', u.pathname + (u.search ? u.search : '') + u.hash);
  } catch (_) {}
}
function p4OpenPending() {
  var route = p4State.pendingOpen || p4ReadBootRoute();
  if (!route || !route.roomId || !roomById(route.roomId)) return Promise.resolve(false);
  p4State.pendingOpen = route;
  return p4EventFetch(route).then(function (e) {
    closePanel();
    if (e && e.type === 'call-start' && e.state === 'started') {
      enterRoom(route.roomId);
      var room = roomById(route.roomId);
      p4State.callId = e.callId;
      CALL.onIncoming(room, { type: 'call-start', eventId: e.eventId, callId: e.callId, kind: e.kind, name: room.partnerName });
      p4ConfirmRoute(route, CALL.ringPending ? 'call_screen' : 'event_room');
    } else {
      if (e && e.callId) p4EnsureOutcome(route.roomId, e);
      enterRoom(route.roomId);
      p4ConfirmRoute(route, 'event_room');
    }
    p4State.pendingOpen = null;
    return true;
  }).catch(function (e) { p4Log('navigation_failed', { eventId: String(route.eventId).slice(0, 18), e: String(e && e.message || e) }, 'error'); return false; });
}

/* ── exact counters: ledger + cursor + counted-set dedupe ──────────────── */
function p4Counted(roomId) {
  try { return JSON.parse(localStorage.getItem('tb_counted_' + roomId) || '[]'); } catch (_) { return []; }
}
function p4MarkCounted(roomId, eventId) {
  if (!eventId) return;
  var a = p4Counted(roomId);
  if (a.indexOf(eventId) >= 0) return;
  a.push(eventId); if (a.length > 200) a = a.slice(-200);
  try { localStorage.setItem('tb_counted_' + roomId, JSON.stringify(a)); } catch (_) {}
}
function p4AdvanceCursor(roomId, l) {
  if (!l) return Promise.resolve();
  return p3RelayPost(roomId, { type: 'cursor', l: l }).then(function (r) {
    p4Log('cursor_advanced', { room: String(roomId).slice(-6), l: l, ok: !!(r && r.ok) }, r && r.ok ? 'ok' : 'error');
  }).catch(function (e) { p4Log('cursor_failed', { room: String(roomId).slice(-6), e: String(e && e.message || e) }, 'error'); });
}
function p4LedgerSyncRoom(room, markOnly) {
  if (p4State.syncing[room.id]) return Promise.resolve();
  p4State.syncing[room.id] = true;
  var u = p3RelayHttp() + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(room.id) + '&client=' + encodeURIComponent(deviceId) + '&ledger=1';
  return fetch(u).then(function (r) { return r.json(); }).then(function (res) {
    if (!res || !res.ok) throw new Error('ledger-bad');
    var counted = p4Counted(room.id), maxL = res.cursor || 0, bumped = { chat: 0, voice: 0, video: 0 };
    (res.events || []).forEach(function (e) {
      if (e.l > maxL) maxL = e.l;
      if (counted.indexOf(e.eventId) >= 0) return;
      /* opening the room marks items seen; being in the room now means
         content, not a missed count (review §4.1 row 1, §4.2, §7.3) */
      var viewingNow = markOnly || (!document.hidden && S.view === 'room' && S.roomId === room.id);
      if (!viewingNow) {
        if (e.type === 'chat-msg') { bumpWaiting(room, 'chat'); bumped.chat++; }
        if (e.type === 'call-end' && e.state === 'timed_out') { var k = e.kind === 'video' ? 'video' : 'voice'; bumpWaiting(room, k); bumped[k]++; }
      }
      p4MarkCounted(room.id, e.eventId);
    });
    p4State.lastL[room.id] = res.lseq || maxL;
    saveRooms(); renderPanel();
    if (typeof renderHome === 'function') try { renderHome(); } catch (_) {}
    p4Log('ledger_applied', { room: String(room.id).slice(-6), n: (res.events || []).length, chat: bumped.chat, voice: bumped.voice, video: bumped.video, complete: res.complete !== false }, 'ok');
    if (res.complete === false) p4Log('ledger_incomplete', { room: String(room.id).slice(-6) }, 'warn');
    return p4AdvanceCursor(room.id, maxL);
  }).catch(function (e) {
    p4Log('ledger_failed', { room: String(room.id).slice(-6), e: String(e && e.message || e) }, 'error');
  }).then(function () { p4State.syncing[room.id] = false; });
}
function p4LedgerSync() {
  return Promise.all(S.rooms.filter(function (r) { return !r.deletedAt; }).map(function (r) { return p4LedgerSyncRoom(r); }));
}

(function () {
  /* All OS notifications for R10.5 come from the committed relay push. The
     page's legacy helper is disabled so content processing cannot stack one. */
  var _p4OsNotify = osNotify;
  osNotify = function () { p4Log('page_notification_blocked', {}, 'ok'); return false; };

  /* Stable call identity (review §7.1): the caller mints one callId per call;
     every call word carries it, so the relay's state machine can cancel a
     stale ring on answer/decline/cancel and type the missed count exactly. */
  var _p4CallStart = CALL.start;
  CALL.start = function (kind) {
    p4State.callId = 'cl-' + uid();
    return _p4CallStart.apply(this, arguments);
  };
  var _p4RelaySend = relaySend;
  relaySend = function (m) {
    try {
      if (m && typeof m === 'object') {
        if (m.type === 'call-start') { m.callId = m.callId || p4State.callId || ('cl-' + uid()); p4State.callId = m.callId; m.eventId = m.callId + ':start'; }
        else if (m.type === 'call-accept' || m.type === 'call-decline' || m.type === 'call-end') {
          m.callId = m.callId || (CALL.ringPending && CALL.ringPending.callId) || p4State.callId || null;
        }
      }
    } catch (_) {}
    return _p4RelaySend.apply(this, arguments);
  };
  var _p4ListenSend = LISTEN.send;
  LISTEN.send = function (roomId, m) {
    try {
      if (m && (m.type === 'call-accept' || m.type === 'call-decline' || m.type === 'call-end'))
        m.callId = m.callId || (CALL.ringPending && CALL.ringPending.callId) || p4State.callId || null;
    } catch (_) {}
    return _p4ListenSend.apply(this, arguments);
  };

  /* Offers are held. Only a relay grant invokes the frozen product handler;
     an OS/mute/terminal commit processes quiet content but never auto-rings. */
  var _p4HandleRelay = handleRelay;
  handleRelay = function (d) {
    try {
      if (d && d.presentation === 'offer' && p4IsPushWorthy(d)) return p4Offer(S.roomId, d, 'active');
      if (d && (d.type === 'presentation-grant' || d.type === 'presentation-commit'))
        return p4ApplyDecision(S.roomId, d, 'active', function (m) { return _p4HandleRelay.call(window, m); });
    } catch (e) { p4Log('present_failed', { e: String(e && e.message || e) }, 'error'); }
    return _p4HandleRelay.apply(this, arguments);
  };
  var _p4Listen = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    try {
      if (d && d.presentation === 'offer' && p4IsPushWorthy(d)) return p4Offer(roomId, d, 'listener');
      if (d && (d.type === 'presentation-grant' || d.type === 'presentation-commit'))
        return p4ApplyDecision(roomId, d, 'listener', function (m) { return _p4Listen.call(LISTEN, roomId, m); });
    } catch (e) { p4Log('present_failed', { e: String(e && e.message || e) }, 'error'); }
    return _p4Listen.apply(this, arguments);
  };
  var _p4OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    var r = _p4OnIncoming.apply(this, arguments);
    try {
      if (this.ringPending && room && this.ringPending.roomId === room.id) {
        this.ringPending.callId = (d && d.callId) || this.ringPending.callId || null;
        p4State.callId = this.ringPending.callId;
        p4CloseTag(room.id);
      }
    } catch (_) {}
    return r;
  };
  var _p4Accept = CALL.accept;
  CALL.accept = function () {
    var p = this.ringPending;
    var r = _p4Accept.apply(this, arguments);
    try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}
    return r;
  };
  var _p4Decline = CALL.decline;
  CALL.decline = function () {
    var p = this.ringPending;
    if (p && p.callId) p4State.callId = p.callId;
    var r = _p4Decline.apply(this, arguments);
    try { if (p && p.roomId && S.roomId !== p.roomId) { closePanel(); enterRoom(p.roomId); } } catch (_) {}
    return r;
  };
  var _p4EnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _p4EnterRoom.apply(this, arguments);
    try {
      p4CloseTag(id);
      var room = roomById(id);
      if (room) {
        /* opening the room marks its ledger items seen (review §7.3) */
        p4LedgerSyncRoom(room, true).then(function () {
          try { localStorage.removeItem('tb_counted_' + id); } catch (_) {}
        });
      }
    } catch (_) {}
    return r;
  };
  var _p4SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _p4SaveRooms.apply(this, arguments);
    try { p4SaveCtx(); } catch (_) {}
    return r;
  };
  /* Muting suppresses attention, never the durable home record. */
  homeCards = function () {
    var m = homeDismissed();
    return S.rooms.filter(function (room) {
      if (room.deletedAt) return false;
      var total = waitingTotal(room); if (!total) return false;
      var at = m[room.id]; return (typeof at !== 'number') || total > at;
    }).sort(function (a, b) { return (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt); });
  };
  var _p4Entry = p2Entry;
  p2Entry = function () {
    var r = _p4Entry.apply(this, arguments);
    try {
      if (p2IsStandalone()) {
        p4SaveCtx(); p4Drain(); p4LedgerSync();
        p4State.pendingOpen = p4ReadBootRoute();
        setTimeout(function () { p4OpenPending(); }, 0);
        document.addEventListener('visibilitychange', function () { if (!document.hidden) { p4Drain(); p4LedgerSync(); } });
        if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', p4OnSwMessage);
      }
    } catch (e) { p4Log('entry_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
