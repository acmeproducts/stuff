/* TalkBridge service worker · v3 (plan v20.2.0 §4.7.3, review §7.4) · source: talkbridge/parts/p4-sw.js — assembled, never hand-edited.
   Legacy presentation path for the one event envelope. On supporting Apple
   systems the OS displays the declarative payload itself; everywhere else this
   worker parses THE SAME decrypted JSON and shows it. One push produces at
   most one display attempt per device: events deduplicate by eventId. The
   journal (arrived / shown / deduped / failed / tap) is delivery TELEMETRY
   only — it never feeds a counter (review §7.3). No history fetching, no room
   guessing, no visibility inference: a push that arrived is a push that was
   not acknowledged, and it is shown. */
var DB = 'tb-r10', JOURNAL = 'journal', KV = 'kv';

function idb() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open(DB, 1);
    r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains(JOURNAL)) d.createObjectStore(JOURNAL, { autoIncrement: true }); if (!d.objectStoreNames.contains(KV)) d.createObjectStore(KV, { keyPath: 'k' }); };
    r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
  });
}
function journal(ev, extra) {
  var rec = { ev: ev, ts: Date.now(), e: (extra && extra.e) || null, room: (extra && extra.room) || null, kind: (extra && extra.kind) || null, eventId: (extra && extra.eventId) || null };
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(JOURNAL, 'readwrite'); tx.objectStore(JOURNAL).add(rec); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }).catch(function () {});
}
function kvGet(k) {
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(KV, 'readonly'); var g = tx.objectStore(KV).get(k); g.onsuccess = function () { res(g.result ? g.result.v : null); }; g.onerror = function () { res(null); }; }); }).catch(function () { return null; });
}
function kvSet(k, v) {
  return idb().then(function (d) { return new Promise(function (res) { var tx = d.transaction(KV, 'readwrite'); tx.objectStore(KV).put({ k: k, v: v }); tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }).catch(function () {});
}
/* eventId dedupe ring — one display attempt per event per device */
function seenBefore(eventId) {
  if (!eventId) return Promise.resolve(false);
  return kvGet('seen').then(function (list) {
    list = Array.isArray(list) ? list : [];
    if (list.indexOf(eventId) >= 0) return true;
    list.push(eventId); if (list.length > 300) list = list.slice(-300);
    return kvSet('seen', list).then(function () { return false; });
  });
}

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var env = null; try { env = e.data ? e.data.json() : null; } catch (_) { env = null; }
    var tb = (env && env.tb) || {};
    var note = (env && env.notification) || {};
    return journal('arrived', { eventId: tb.eventId, room: tb.roomId, kind: tb.type }).then(function () {
      return seenBefore(tb.eventId);
    }).then(function (dup) {
      if (dup) return journal('deduped', { eventId: tb.eventId, room: tb.roomId });
      var title = note.title || 'TalkBridge';
      var body = note.body || 'New activity';
      var tag = note.tag || ('tb-' + (tb.roomId || 'unknown'));
      var data = { roomId: tb.roomId || null, url: note.navigate || (self.registration.scope + 'bridge-turn24-post-ship.html'), eventId: tb.eventId || null };
      return self.registration.showNotification(title, { body: body, tag: tag, renotify: false, data: data })
        .then(function () { return journal('shown', { eventId: tb.eventId, room: tb.roomId, kind: tb.type }); },
              function (err) { return journal('failed', { e: String(err && err.message || err), eventId: tb.eventId, room: tb.roomId }).then(function () { return self.registration.showNotification('TalkBridge', { body: 'New activity', tag: 'tb-fallback' }).catch(function () {}); }); });
    });
  })());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  e.waitUntil((function () {
    return journal('tap', { eventId: data.eventId, room: data.roomId }).then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (list) {
      var app = null;
      for (var i = 0; i < list.length; i++) { if (String(list[i].url).indexOf('bridge-turn24-post-ship') >= 0) { app = list[i]; break; } }
      if (app) { try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null }); } catch (_) {} return app.focus ? app.focus() : null; }
      return self.clients.openWindow(data.url || self.registration.scope);
    });
  })());
});
