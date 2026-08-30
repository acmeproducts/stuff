/* TalkBridge service worker · R10-CR1 (plan v20.9.0 §4.11) · source: talkbridge/parts/r10-cr1-sw.js — assembled, never hand-edited.
   One recipient-event authority (the relay) now names the event INSIDE the
   encrypted push payload: { t:'tb-evt', room, id, kind, call }. No message
   text, no names ride the push service — only identity. Therefore:
   - The banner shows IMMEDIATELY from the payload. The baseline's bounded
     history lookup (a 1.5s race that delayed and mislabeled banners) is gone.
   - Per-room tag: successive pushes REPLACE, never stack. One event can never
     grow a delayed second surface here.
   - A tap opens the EXACT event: warm → focus + message {t:'tb-open', roomId,
     eventId, kind, call}; cold → the app URL with #tbopen=… so a cold launch
     lands on the answer surface, never the homepage (the never-gated R10
     failure, now explicit and gated).
   - Every push shows a banner (Apple revokes silent handlers). A payloadless
     wake still shows a generic banner — silence is impossible.
   - Every push terminal (arrived / shown / failed) is journaled durably; the
     app drains it into its debug log. */
var DB = 'tb-r10', JOURNAL = 'journal', KV = 'kv';
var KIND_TEXT = { chat: 'New message', voice: 'Voice call', video: 'Video call', other: 'New activity' };

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

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function visibleClient() {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].visibilityState === 'visible' || list[i].focused) return list[i];
    }
    return null;
  }).catch(function () { return null; });
}
function isIOS() {
  try { return /iPhone|iPad|iPod/.test(self.navigator.userAgent) || (/Macintosh/.test(self.navigator.userAgent) && self.navigator.maxTouchPoints > 1); }
  catch (_) { return false; }
}

/* Body text for an exact event, resolved against the app's saved room titles
   (device-local; nothing rode the push service). */
function eventBody(ctx, ev) {
  var title = null;
  if (ctx && Array.isArray(ctx.rooms)) {
    for (var i = 0; i < ctx.rooms.length; i++) { if (ctx.rooms[i].id === ev.room) { title = ctx.rooms[i].title; break; } }
  }
  var what = ev.kind === 'chat' ? KIND_TEXT.chat
    : (ev.call === 'ended' ? 'Missed ' + (KIND_TEXT[ev.kind] || 'call').toLowerCase()
      : 'Incoming ' + (KIND_TEXT[ev.kind] || 'call').toLowerCase() + '…');
  return what + (title ? ' · ' + title : '');
}

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var payload = null; try { payload = e.data ? e.data.json() : null; } catch (_) { payload = null; }
    var ev = payload && payload.t === 'tb-evt' ? payload : null;
    return journal('arrived', { kind: ev ? ev.kind : (payload && payload.t), room: ev && ev.room }).then(function () { return visibleClient(); }).then(function (vc) {
      if (vc && !isIOS()) {
        /* The app is on screen and presents the event itself. */
        return journal('skipped_visible', { room: ev && ev.room, kind: ev && ev.kind });
      }
      return loadCtx().then(function (ctx) {
        var appUrl = (ctx && ctx.appUrl) || (self.registration.scope + 'bridge-turn24-post-ship.html');
        var roomId = ev ? ev.room : null;
        var tag = 'tb-' + (roomId || 'unknown');
        var body = ev ? eventBody(ctx, ev) : 'New activity';
        var data = { roomId: roomId, eventId: ev ? ev.id : null, kind: ev ? ev.kind : null, call: ev ? (ev.call || null) : null, url: appUrl };
        return self.registration.showNotification('TalkBridge', { body: body, tag: tag, renotify: true, data: data })
          .then(function () { return journal('shown', { room: roomId, kind: data.kind }); },
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
    if (app) {
      try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null, eventId: data.eventId || null, kind: data.kind || null, call: data.call || null }); } catch (_) {}
      return app.focus ? app.focus() : null;
    }
    /* COLD LAUNCH: carry the exact event in the URL so boot routes straight to
       the answer surface or the room's durable outcome — never the homepage. */
    var url = data.url || self.registration.scope;
    if (data.roomId) {
      url += '#tbopen=' + encodeURIComponent(data.roomId) + ',' + encodeURIComponent(data.eventId || '') + ',' + encodeURIComponent(data.kind || '') + ',' + encodeURIComponent(data.call || '');
    }
    return self.clients.openWindow(url);
  }));
});
