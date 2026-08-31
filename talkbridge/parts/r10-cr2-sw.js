/* TalkBridge service worker · R10-CR2 (plan v20.10.0 §4.12.3; §4.11.4 inherited) · source: talkbridge/parts/r10-cr2-sw.js — assembled, never hand-edited.
   - The relay's recipient-event record already decided this device must be
     asked for an OS alert; the push carries the ENCRYPTED event identity
     (id, room, kind, callId, sender name — never message text).
   - A banner is shown AT ONCE from that identity: no history lookup, no wait.
     Apple revokes push for a worker that returns without showing.
   - One tag per call (the call's id) and one tag per room burst: a stable
     event can never produce a second surface.
   - G22: the installed app ANNOUNCES its window (tb-app). A tap focuses only
     an announced window and tells it the exact event; a browser tab at the
     same address (the install step leaves one open on Android) is never
     focused and never messaged. With no announced window alive the worker
     opens the app URL carrying the event hash.
   - Call alerts are persistent, vibrate, and not silent — the strongest
     hints the platform gives for a locked, screen-off phone. The app resolves an active call to its
     Accept/Decline surface and an ended call to its room and durable outcome.
   - Every push terminal (arrived / shown / failed) is journaled on-device for
     the app's debug log; the journal holds no independent state. */
var DB = 'tb-r10', JOURNAL = 'journal', KV = 'kv';
var APP_FILE = 'bridge-turn24-post-ship.html';
var CTX_MS = 250;

function idb() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open(DB, 1);
    r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains(JOURNAL)) d.createObjectStore(JOURNAL, { autoIncrement: true }); if (!d.objectStoreNames.contains(KV)) d.createObjectStore(KV, { keyPath: 'k' }); };
    r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
  });
}
function journal(ev, extra) {
  var rec = { ev: ev, ts: Date.now(), e: (extra && extra.e) || null, room: (extra && extra.room) || null, kind: (extra && extra.kind) || null, id: (extra && extra.id) || null };
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(JOURNAL, 'readwrite'); tx.objectStore(JOURNAL).add(rec); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }).catch(function () {});
}
function loadCtx() {
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(KV, 'readonly'); var g = tx.objectStore(KV).get('ctx'); g.onsuccess = function () { res(g.result ? g.result.v : null); }; g.onerror = function () { res(null); }; }); }).catch(function () { return null; });
}
function saveKv(k, v) {
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(KV, 'readwrite'); tx.objectStore(KV).put({ k: k, v: v }); tx.oncomplete = function () { res(true); }; tx.onerror = function () { res(false); }; }); }).catch(function () { return false; });
}
function loadKv(k) {
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(KV, 'readonly'); var g = tx.objectStore(KV).get(k); g.onsuccess = function () { res(g.result ? g.result.v : null); }; g.onerror = function () { res(null); }; }); }).catch(function () { return null; });
}
/* The installed app announces its window; its client id is the only one a tap may focus. */
self.addEventListener('message', function (e) {
  var d = e && e.data;
  if (!d || d.t !== 'tb-app' || !e.source || !e.source.id) return;
  e.waitUntil(saveKv('appClient', { id: e.source.id, at: Date.now() }).then(function () { return journal('app_announced', {}); }));
});
function withTimeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]); }

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function describe(ev, ctx) {
  var room = null;
  if (ctx && Array.isArray(ctx.rooms)) { for (var i = 0; i < ctx.rooms.length; i++) { if (ctx.rooms[i].id === ev.room) { room = ctx.rooms[i]; break; } } }
  var who = ev.name || (room && room.title) || 'TalkBridge';
  var body;
  if (ev.kind === 'voice') body = 'Incoming voice call';
  else if (ev.kind === 'video') body = 'Incoming video call';
  else body = 'New message';
  if (room && room.title && ev.name) body += ' · ' + room.title;
  var tag = (ev.kind === 'voice' || ev.kind === 'video') ? ('tb-call-' + ev.callId) : ('tb-' + ev.room);
  var appUrl = (ctx && ctx.appUrl) || (self.registration.scope + APP_FILE);
  return { title: who + ' · TalkBridge', body: body, tag: tag, url: appUrl };
}

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var ev = null; try { ev = e.data ? e.data.json() : null; } catch (_) { ev = null; }
    if (!ev || ev.t !== 'tb-ev' || !ev.id || !ev.room) {
      return journal('arrived_unknown', {}).then(function () {
        return self.registration.showNotification('TalkBridge', { body: 'New activity', tag: 'tb-fallback', data: { url: self.registration.scope + APP_FILE } });
      }).catch(function () {});
    }
    return journal('arrived', { id: ev.id, room: ev.room, kind: ev.kind }).then(function () { return withTimeout(loadCtx(), CTX_MS); }).then(function (ctx) {
      var d = describe(ev, ctx);
      var data = { eventId: ev.id, roomId: ev.room, callId: ev.callId || null, kind: ev.kind, url: d.url };
      var isCall = (ev.kind === 'voice' || ev.kind === 'video');
      var opts = { body: d.body, tag: d.tag, renotify: false, silent: false, data: data };
      if (isCall) { opts.requireInteraction = true; opts.vibrate = [300, 150, 300, 150, 300]; }
      return self.registration.showNotification(d.title, opts)
        .then(function () { return journal('shown', { id: ev.id, room: ev.room, kind: ev.kind }); },
              function (err) { return journal('failed', { id: ev.id, room: ev.room, e: String(err && err.message || err) }).then(function () { return self.registration.showNotification('TalkBridge', { body: 'New activity', tag: 'tb-fallback', data: data }).catch(function () {}); }); });
    });
  })());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  var target = data.url || (self.registration.scope + APP_FILE);
  var hash = data.roomId && data.eventId ? ('#ev=' + encodeURIComponent(data.roomId) + '.' + encodeURIComponent(data.eventId)) : '';
  var msg = { t: 'tb-open', roomId: data.roomId || null, eventId: data.eventId || null, callId: data.callId || null, kind: data.kind || null };
  e.waitUntil(Promise.all([loadKv('appClient'), self.clients.matchAll({ type: 'window', includeUncontrolled: true })]).then(function (r) {
    var announced = r[0], list = r[1] || [];
    var app = null;
    for (var i = 0; i < list.length; i++) { if (announced && list[i].id === announced.id) { app = list[i]; break; } }
    return journal('tapped', { id: data.eventId || null, room: data.roomId || null, kind: data.kind || null }).then(function () {
      if (app) {
        try { app.postMessage(msg); } catch (_) {}
        return app.focus ? app.focus() : null;
      }
      /* No announced window alive: open the app URL with the event; never a browser tab. */
      return self.clients.openWindow(target + hash);
    });
  }));
});
