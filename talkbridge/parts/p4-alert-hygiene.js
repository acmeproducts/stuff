
/* ═══════════ R10 PART · P4-alert-hygiene.js ═══════════ */
/* @contract
   wraps: handleRelay, LISTEN.handle, osNotify, CALL.onIncoming, CALL.accept, enterRoom, saveRooms, p2Entry
   adds: p4Log, p4Idb, p4Journal, p4Drain, p4SaveCtx, p4Ack, p4IsPushWorthy, p4CloseTag, p4State, p4SwNotify, p4OnSwMessage
   Plan v19.5.0 §4.1 P4 — exactly-one-alert hygiene, app side.
   - ACK: any push-worthy event the app PRESENTS while in the foreground is acked
     on that room's socket at once, so the relay's 1s fallback push never fires.
     A backgrounded/locked app acks nothing: the push is its only alert.
   - Presentation on mobile: the ship's in-page notification is a no-op inside an
     installed app on iOS and Android, so it is wrapped to also present through
     the worker, tagged per room (replace, never stack). A ring screen is the
     alert for a call; no notification is raised beside it.
   - Housekeeping: call answered / room opened → that room's notifications close.
   - The worker's durable journal (arrived / shown / failed) is drained into the
     debug log on every open and every return to the foreground.
*/
var p4State = { ctxTimer: null, drained: 0 };
var P4_PUSH_WORTHY = { 'chat-msg': 1, 'sys-pill': 1, 'call-start': 1, 'call-end': 1, 'thread-invite': 1, 'history-sync': 1 };
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
/* Read every worker receipt, log each by name, then clear. Silence is impossible: an empty drain logs too. */
function p4Drain() {
  return p4Idb().then(function (d) {
    return new Promise(function (res) {
      var tx = d.transaction('journal', 'readwrite'), st = tx.objectStore('journal'), rows = [];
      var c = st.openCursor();
      c.onsuccess = function () { var cur = c.result; if (cur) { rows.push(cur.value); cur.delete(); cur.continue(); } };
      tx.oncomplete = function () { res(rows); }; tx.onerror = function () { res(rows); };
    });
  }).then(function (rows) {
    rows.forEach(function (en) { p4Log('sw_receipt', { ev: en.ev, at: en.ts, room: en.room ? String(en.room).slice(-6) : null, kind: en.kind, e: en.e }, en.ev === 'failed' ? 'error' : 'ok'); });
    p4State.drained += rows.length;
    p4Log('sw_drained', { n: rows.length }, 'ok');
    return rows;
  }).catch(function (e) { p4Log('sw_drain_failed', { e: String(e && e.message || e) }, 'error'); return []; });
}
/* What a cold-started worker needs to name the room: where the app lives, the relay, this device, the live rooms. */
function p4SaveCtx() {
  clearTimeout(p4State.ctxTimer);
  p4State.ctxTimer = setTimeout(function () {
    var ctx = { k: 'ctx', v: { appUrl: location.href.split('#')[0], relay: p3RelayHttp(), app: RELAY_APP, client: deviceId,
      rooms: S.rooms.filter(function (r) { return !r.deletedAt; }).map(function (r) { return { id: r.id, title: roomTitle(r), muted: !!r.muted }; }) } };
    p4Idb().then(function (d) { var tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(ctx); }).catch(function (e) { p4Log('ctx_save_failed', { e: String(e && e.message || e) }, 'error'); });
  }, 400);
}

function p4Ack(roomId) {
  var m = { type: 'ack', transient: true };
  var ok = (roomId === S.roomId) ? relaySend(m) : LISTEN.send(roomId, m);
  p4Log('ack', { room: String(roomId).slice(-6), sent: !!ok }, ok ? 'ok' : 'warn');
  return ok;
}
function p4CloseTag(roomId) {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg.getNotifications) return;
      return reg.getNotifications({ tag: 'tb-' + roomId }).then(function (ns) { ns.forEach(function (n) { try { n.close(); } catch (_) {} }); if (ns.length) p4Log('stale_closed', { room: String(roomId).slice(-6), n: ns.length }, 'ok'); });
    }).catch(function () {});
  } catch (_) {}
}
function p4SwNotify(title, body, roomId) {
  try {
    if (!('serviceWorker' in navigator) || !window.Notification || Notification.permission !== 'granted') return;
    if (!document.hidden && S.view === 'room' && S.roomId === roomId) return;          /* on screen already */
    if (CALL.ringPending && CALL.ringPending.roomId === roomId) return;                 /* the ring screen IS the alert */
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.showNotification(title, { body: (body || '').slice(0, 120), tag: 'tb-' + roomId, renotify: true, data: { roomId: roomId, url: location.href.split('#')[0] } });
    }).then(function () { p4Log('sw_notify', { room: String(roomId).slice(-6) }, 'ok'); }, function (e) { p4Log('sw_notify_failed', { e: String(e && e.message || e) }, 'error'); });
  } catch (_) {}
}
function p4OnSwMessage(ev) {
  var d = ev && ev.data; if (!d || d.t !== 'tb-open') return;
  try { if (d.roomId && roomById(d.roomId)) { closePanel(); enterRoom(d.roomId); } } catch (_) {}
}

(function () {
  var _p4HandleRelay = handleRelay;
  handleRelay = function (d) {
    var r = _p4HandleRelay.apply(this, arguments);
    try { if (d && d.from !== deviceId && p4IsPushWorthy(d) && !document.hidden && S.roomId) p4Ack(S.roomId); } catch (e) { p4Log('ack_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _p4Listen = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    var r = _p4Listen.apply(this, arguments);
    try { if (d && d.from !== deviceId && p4IsPushWorthy(d) && !document.hidden && roomById(roomId)) p4Ack(roomId); } catch (e) { p4Log('ack_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _p4OsNotify = osNotify;
  osNotify = function (title, body, roomId) {
    var r = _p4OsNotify.apply(this, arguments);
    try { p4SwNotify(title, body, roomId); } catch (_) {}
    return r;
  };
  /* The ring screen IS the alert: the moment it presents, any lock-screen
     notification for that room is stale and closes (device finding 2026-08-28:
     a wake shown while the phone was away sat beside the ring screen until
     accept; 10 stale notifications closed only at accept). Standard pattern:
     getNotifications({tag}).close() when the app presents its own surface. */
  var _p4OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    var r = _p4OnIncoming.apply(this, arguments);
    try { if (this.ringPending && room && this.ringPending.roomId === room.id) p4CloseTag(room.id); } catch (_) {}
    return r;
  };
  var _p4Accept = CALL.accept;
  CALL.accept = function () {
    var p = this.ringPending;
    var r = _p4Accept.apply(this, arguments);
    try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}
    return r;
  };
  var _p4EnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _p4EnterRoom.apply(this, arguments);
    try { p4CloseTag(id); } catch (_) {}
    return r;
  };
  var _p4SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _p4SaveRooms.apply(this, arguments);
    try { p4SaveCtx(); } catch (_) {}
    return r;
  };
  var _p4Entry = p2Entry;
  p2Entry = function () {
    var r = _p4Entry.apply(this, arguments);
    try {
      if (p2IsStandalone()) {
        p4SaveCtx(); p4Drain();
        document.addEventListener('visibilitychange', function () { if (!document.hidden) p4Drain(); });
        if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', p4OnSwMessage);
      }
    } catch (e) { p4Log('entry_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
