/* TalkBridge service worker · R10.6 · one envelope, stable-ID dedupe, tap routing. */
var R106_DB = 'tb-r106-worker', R106_JOURNAL = 'journal', R106_SEEN = 'seen';
function r106Db() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open(R106_DB, 1);
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains(R106_JOURNAL)) db.createObjectStore(R106_JOURNAL, { autoIncrement: true });
      if (!db.objectStoreNames.contains(R106_SEEN)) db.createObjectStore(R106_SEEN, { keyPath: 'id' });
    };
    req.onsuccess = function () { resolve(req.result); }; req.onerror = function () { reject(req.error); };
  });
}
function r106Journal(stage, tb, detail) {
  var rec = { at: Date.now(), stage: stage, eventId: tb && tb.eventId || null, roomId: tb && tb.roomId || null, type: tb && tb.type || null, detail: detail || {} };
  return r106Db().then(function (db) { return new Promise(function (resolve) {
    var tx = db.transaction(R106_JOURNAL, 'readwrite'); tx.objectStore(R106_JOURNAL).add(rec);
    tx.oncomplete = function () { resolve(); }; tx.onerror = function () { resolve(); };
  }); }).catch(function () {});
}
function r106SeenBefore(id) {
  if (!id) return Promise.resolve(false);
  return r106Db().then(function (db) { return new Promise(function (resolve) {
    var tx = db.transaction(R106_SEEN, 'readwrite'), store = tx.objectStore(R106_SEEN), get = store.get(id);
    get.onsuccess = function () {
      var existed = !!get.result; if (!existed) store.put({ id: id, at: Date.now() }); resolve(existed);
    }; get.onerror = function () { resolve(false); };
  }); }).catch(function () { return false; });
}
function r106Drain() {
  return r106Db().then(function (db) { return new Promise(function (resolve) {
    var tx = db.transaction(R106_JOURNAL, 'readwrite'), store = tx.objectStore(R106_JOURNAL), get = store.getAll();
    get.onsuccess = function () { var rows = get.result || []; store.clear(); resolve(rows); }; get.onerror = function () { resolve([]); };
  }); }).catch(function () { return []; });
}
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener('push', function (event) {
  event.waitUntil((function () {
    var env = null; try { env = event.data ? event.data.json() : null; } catch (_) {}
    var tb = env && env.tb || {}, note = env && env.notification || {};
    return r106Journal('push_arrived', tb, { payload: !!env }).then(function () { return r106SeenBefore(tb.eventId); }).then(function (dupe) {
      if (dupe) return r106Journal('push_deduped', tb, {});
      var title = note.title || 'TalkBridge', body = note.body || 'New activity';
      var opts = {
        body: body, tag: note.tag || ('tb-event-' + (tb.eventId || 'unknown')), renotify: true,
        data: { eventId: tb.eventId || null, roomId: tb.roomId || null, callId: tb.callId || null, type: tb.type || null, url: note.navigate || self.registration.scope },
        badge: './icons/icon-192.png', icon: './icons/icon-192.png'
      };
      return self.registration.showNotification(title, opts).then(function () {
        return r106Journal('notification_shown', tb, { tag: opts.tag });
      }, function (err) { return r106Journal('notification_failed', tb, { name: err && err.name || 'Error' }); });
    });
  })());
});
self.addEventListener('notificationclick', function (event) {
  var data = event.notification.data || {}; event.notification.close();
  event.waitUntil(r106Journal('notification_tap', data, {}).then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (list) {
    var target = null;
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].url).indexOf('bridge-turn24-post-ship') >= 0) { target = list[i]; break; }
    }
    if (target) {
      try { target.postMessage({ t: 'tb-open', eventId: data.eventId, roomId: data.roomId, callId: data.callId, type: data.type }); } catch (_) {}
      return target.focus ? target.focus() : null;
    }
    return self.clients.openWindow(data.url || self.registration.scope);
  }));
});
self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.t !== 'tb-drain') return;
  event.waitUntil(r106Drain().then(function (records) {
    if (event.source && event.source.postMessage) event.source.postMessage({ t: 'tb-receipts', records: records });
  }));
});
