/* TalkBridge service worker · R10 P4 (plan v19.5.0 §4.1) · source: talkbridge/parts/p4-sw.js — assembled, never hand-edited.
   Rules it embodies:
   - Every push shows a notification (Apple revokes silent handlers). Per-room tag: successive pushes REPLACE, never stack.
   - A tap closes itself and focuses the running app rather than opening a second copy.
   - Every push terminal (arrived / shown / failed) is journaled durably on-device; the app drains it into its debug log.
   - The push carries no room; the room is resolved from the relay's own history (bounded), so message text never rides a push service. */
var DB = 'tb-r10', JOURNAL = 'journal', KV = 'kv';
var PUSH_WORTHY = { 'chat-msg': 'New message', 'sys-pill': 'Update', 'call-start': 'Incoming call', 'call-end': 'Missed call', 'thread-invite': 'Thread invite', 'history-sync': 'New activity' };
var LOOKUP_MS = 1500, RECENT_MS = 120000;

function idb() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open(DB, 1);
    r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains(JOURNAL)) d.createObjectStore(JOURNAL, { autoIncrement: true }); if (!d.objectStoreNames.contains(KV)) d.createObjectStore(KV, { keyPath: 'k' }); };
    r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
  });
}
function journal(ev, extra) {
  var rec = { ev: ev, ts: Date.now(), e: (extra && extra.e) || null, room: (extra && extra.room) || null, kind: (extra && extra.kind) || null };
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(JOURNAL, 'readwrite'); tx.objectStore(JOURNAL).add(rec); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }).catch(function () {});
}
function loadCtx() {
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(KV, 'readonly'); var g = tx.objectStore(KV).get('ctx'); g.onsuccess = function () { res(g.result ? g.result.v : null); }; g.onerror = function () { res(null); }; }); }).catch(function () { return null; });
}
function withTimeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]); }

/* Which room, which kind. Newest push-worthy message from someone else, recent, across the rooms the app told us about. */
function resolveRoom(ctx) {
  if (!ctx || !ctx.relay || !ctx.app || !ctx.client || !Array.isArray(ctx.rooms) || !ctx.rooms.length) return Promise.resolve(null);
  var now = Date.now();
  return Promise.all(ctx.rooms.map(function (room) {
    var u = ctx.relay + '?app=' + encodeURIComponent(ctx.app) + '&session=' + encodeURIComponent(room.id) + '&client=' + encodeURIComponent(ctx.client) + '&since=0';
    return fetch(u).then(function (r) { return r.json(); }).then(function (msgs) {
      var best = null;
      (Array.isArray(msgs) ? msgs : []).forEach(function (m) {
        if (!m || !PUSH_WORTHY[m.type] || m.from === ctx.client) return;
        if (m.type === 'call-end' && m.reason !== 'missed') return;
        if (typeof m.ts !== 'number' || now - m.ts > RECENT_MS) return;
        if (!best || m.ts > best.ts) best = m;
      });
      return best ? { room: room, msg: best } : null;
    }).catch(function () { return null; });
  })).then(function (hits) {
    var best = null;
    hits.forEach(function (h) { if (h && (!best || h.msg.ts > best.msg.ts)) best = h; });
    return best;
  });
}

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var payload = null; try { payload = e.data ? e.data.json() : null; } catch (_) { payload = null; }
    return journal('arrived', { kind: payload && payload.t }).then(function () { return loadCtx(); }).then(function (ctx) {
      return withTimeout(resolveRoom(ctx), LOOKUP_MS).then(function (hit) {
        var roomId = hit ? hit.room.id : null, kind = hit ? hit.msg.type : null;
        var title = 'TalkBridge';
        var body = hit ? (PUSH_WORTHY[kind] + (hit.room.title ? ' · ' + hit.room.title : '')) : 'New activity';
        var tag = 'tb-' + (roomId || 'unknown');
        var appUrl = (ctx && ctx.appUrl) || (self.registration.scope + 'bridge-turn24-post-ship.html');
        return self.registration.showNotification(title, { body: body, tag: tag, renotify: true, data: { roomId: roomId, url: appUrl, kind: kind } })
          .then(function () { return journal('shown', { room: roomId, kind: kind }); },
                function (err) { return journal('failed', { e: String(err && err.message || err), room: roomId }).then(function () { return self.registration.showNotification('TalkBridge', { body: 'New activity', tag: 'tb-fallback' }).catch(function () {}); }); });
      });
    });
  })());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var app = null;
    for (var i = 0; i < list.length; i++) { if (String(list[i].url).indexOf('bridge-turn24-post-ship') >= 0) { app = list[i]; break; } }
    if (app) { try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null }); } catch (_) {} return app.focus ? app.focus() : null; }
    return self.clients.openWindow(data.url || self.registration.scope);
  }));
});
