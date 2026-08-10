/* TalkBridge service worker — R7 (bridge-turn24-base).
   Navigations always come from the network; nothing here ever revives stale
   application HTML. Push arrives as a bare wake with no payload, by relay
   design: this worker keeps a registry of room sessions (posted by the app),
   asks the relay's history endpoint what each one missed, and raises one
   notification per room with new activity. A tap opens the app with ?room=,
   which the app treats as the tap it is. */
var CACHE = 'tb-r7';
var REG_KEY = 'tb-registry';

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') return;
  e.respondWith(fetch(e.request).catch(function () { return caches.match(e.request); }));
});

/* ── Registry, persisted in the cache so a wake after eviction still works ── */
function tbSaveRegistry(reg) {
  return caches.open(CACHE).then(function (c) {
    return c.put(new Request('/' + REG_KEY), new Response(JSON.stringify(reg)));
  });
}
function tbLoadRegistry() {
  return caches.open(CACHE).then(function (c) { return c.match(new Request('/' + REG_KEY)); })
    .then(function (r) { return r ? r.json() : null; }).catch(function () { return null; });
}

self.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || d.tb !== 'registry') return;
  e.waitUntil(tbSaveRegistry(d));
});

/* ── The wake: find out what was missed, say so per room ──────────────────── */
var TB_NOTEWORTHY = { 'chat-msg': 1, 'sys-pill': 1, 'call-start': 1 };

function tbCheckRoom(reg, room) {
  var url = reg.relay + '?app=' + encodeURIComponent(reg.app) +
    '&session=' + encodeURIComponent(room.id) +
    '&client=' + encodeURIComponent(reg.client) +
    '&since=' + (room.since || 0);
  return fetch(url).then(function (r) { return r.ok ? r.json() : []; })
    .then(function (msgs) {
      var fresh = (msgs || []).filter(function (m) { return TB_NOTEWORTHY[m.type]; });
      if (!fresh.length) return null;
      var last = fresh[fresh.length - 1];
      var body = last.tgtText || last.srcText || last.text ||
        (fresh.length + ' new update' + (fresh.length === 1 ? '' : 's'));
      return { room: room, n: fresh.length, body: String(body).slice(0, 120) };
    }).catch(function () { return null; });
}

function tbHandlePush() {
  return tbLoadRegistry().then(function (reg) {
    if (!reg || !reg.rooms || !reg.rooms.length) {
      return self.registration.showNotification('TalkBridge', {
        body: 'New activity while you were away', tag: 'tb-generic'
      });
    }
    return Promise.all(reg.rooms.filter(function (r) { return !r.muted; })
      .map(function (r) { return tbCheckRoom(reg, r); }))
      .then(function (hits) {
        hits = hits.filter(Boolean);
        if (!hits.length) {
          return self.registration.showNotification('TalkBridge', {
            body: 'New activity while you were away', tag: 'tb-generic'
          });
        }
        return Promise.all(hits.map(function (h) {
          return self.registration.showNotification((h.room.title || 'TalkBridge') + ' · TalkBridge', {
            body: h.body, tag: 'tb-' + h.room.id, renotify: true,
            data: { roomId: h.room.id, appUrl: reg.appUrl }
          });
        }));
      });
  });
}

self.addEventListener('push', function (e) {
  e.waitUntil(tbHandlePush());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var roomId = e.notification.data && e.notification.data.roomId;
  var appUrl = (e.notification.data && e.notification.data.appUrl) || 'bridge-turn24-base.html';
  var target = './' + appUrl + (roomId ? '?room=' + encodeURIComponent(roomId) : '');
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(appUrl) >= 0 && 'focus' in c) {
        c.postMessage({ tb: 'open-room', roomId: roomId || null });
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});
