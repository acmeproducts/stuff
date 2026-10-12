/* TalkBridge service worker talkbridge-app/tb-sw5.js (29·post-ship L1: the cards are worded in the phone's app language — the page tells the worker (tb-l10n), the kv store keeps it, SW_L10N holds the five strings in every language; 29·ship IO-1: the tap prefers the installed app's window, else an announced browser tab, else opens one; the missed-call card is silent — the ring was the alert; every other line byte-identical to the accepted folder tb-sw3.js) · talkbridge-app/tb-sw3.js (29·pre-ship DR-1: the folder copy — APP_FILE '' and the additive fetch handler at the end, §7.5 + §7.12; every other line byte-identical to root tb-sw3.js) · tb-sw3.js (28·base I-1: every notification carries the app's icon and status-bar badge via face(); every other line byte-identical to accepted tb-sw2.js) · tb-sw2.js (27·pre-ship N-1: adds the tb-call-end branch above; every other line byte-identical to accepted tb-sw.js) · R10-CR3 (plan v20.12.0 §4.13; §4.12.3 and §4.11.4 inherited) · source: talkbridge/parts/r10-cr3-sw.js — assembled, never hand-edited.
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
var APP_FILE = '';   /* DR-1 (29·pre-ship): the app IS the folder; a tap or a fallback opens the folder URL (G27: every URL derived from the scope re-proven) */
var CTX_MS = 250, SW_L10N = {"en":{"sw_incoming_voice_call":"Incoming voice call","sw_incoming_video_call":"Incoming video call","sw_new_message":"New message","sw_missed_call":"Missed call","sw_new_activity":"New activity"},"th":{"sw_incoming_voice_call":"สายสนทนาเรียกเข้า","sw_incoming_video_call":"สายวิดีโอขาเข้า","sw_new_message":"ข้อความใหม่","sw_missed_call":"สายที่ไม่ได้รับ","sw_new_activity":"กิจกรรมใหม่"},"es":{"sw_incoming_voice_call":"llamada de voz entrante","sw_incoming_video_call":"videollamada entrante","sw_new_message":"Nuevo mensaje","sw_missed_call":"llamada perdida","sw_new_activity":"Nueva actividad"},"ja":{"sw_incoming_voice_call":"音声通話の着信","sw_incoming_video_call":"ビデオ通話の着信","sw_new_message":"新しいメッセージ","sw_missed_call":"不在着信","sw_new_activity":"新しいアクティビティ"},"ko":{"sw_incoming_voice_call":"음성 통화 수신","sw_incoming_video_call":"화상 통화 수신","sw_new_message":"새 메시지","sw_missed_call":"부재중 전화","sw_new_activity":"새로운 활동"},"zh":{"sw_incoming_voice_call":"语音来电","sw_incoming_video_call":"来电视频通话","sw_new_message":"新消息","sw_missed_call":"未接来电","sw_new_activity":"新活动"},"ar":{"sw_incoming_voice_call":"مكالمة صوتية واردة","sw_incoming_video_call":"مكالمة فيديو واردة","sw_new_message":"رسالة جديدة","sw_missed_call":"مكالمة فائتة","sw_new_activity":"نشاط جديد"},"hi":{"sw_incoming_voice_call":"इनकमिंग वॉयस कॉल","sw_incoming_video_call":"इनकमिंग वीडियो कॉल","sw_new_message":"नया संदेश","sw_missed_call":"मिस्ड कॉल","sw_new_activity":"नई गतिविधि"},"ru":{"sw_incoming_voice_call":"Входящий голосовой вызов","sw_incoming_video_call":"Входящий видеозвонок","sw_new_message":"Новое сообщение","sw_missed_call":"Пропущенный звонок","sw_new_activity":"Новая деятельность"},"fr":{"sw_incoming_voice_call":"Appel vocal entrant","sw_incoming_video_call":"Appel vidéo entrant","sw_new_message":"Nouveau message","sw_missed_call":"Appel manqué","sw_new_activity":"Nouvelle activité"},"de":{"sw_incoming_voice_call":"Eingehender Sprachanruf","sw_incoming_video_call":"Eingehender Videoanruf","sw_new_message":"Neue Nachricht","sw_missed_call":"Anruf verpasst","sw_new_activity":"Neue Aktivität"},"it":{"sw_incoming_voice_call":"Chiamata vocale in arrivo","sw_incoming_video_call":"Videochiamata in arrivo","sw_new_message":"Nuovo messaggio","sw_missed_call":"Chiamata persa","sw_new_activity":"Nuova attività"},"pt":{"sw_incoming_voice_call":"Chamada de voz recebida","sw_incoming_video_call":"Chamada de vídeo recebida","sw_new_message":"Nova mensagem","sw_missed_call":"Chamada perdida","sw_new_activity":"Nova atividade"},"vi":{"sw_incoming_voice_call":"Cuộc gọi thoại đến","sw_incoming_video_call":"Cuộc gọi video đến","sw_new_message":"Tin nhắn mới","sw_missed_call":"Cuộc gọi nhỡ","sw_new_activity":"Hoạt động mới"},"id":{"sw_incoming_voice_call":"Panggilan suara masuk","sw_incoming_video_call":"Panggilan video masuk","sw_new_message":"Pesan baru","sw_missed_call":"Panggilan tak terjawab","sw_new_activity":"Aktivitas baru"},"ms":{"sw_incoming_voice_call":"Panggilan suara masuk","sw_incoming_video_call":"Panggilan video masuk","sw_new_message":"Mesej baharu","sw_missed_call":"Panggilan terlepas","sw_new_activity":"Aktiviti baru"},"fil":{"sw_incoming_voice_call":"Papasok na voice call","sw_incoming_video_call":"Papasok na video call","sw_new_message":"Bagong mensahe","sw_missed_call":"Missed call","sw_new_activity":"Bagong aktibidad"},"nl":{"sw_incoming_voice_call":"Inkomende spraakoproep","sw_incoming_video_call":"Inkomend videogesprek","sw_new_message":"Nieuw bericht","sw_missed_call":"Gemiste oproep","sw_new_activity":"Nieuwe activiteit"},"sv":{"sw_incoming_voice_call":"Inkommande röstsamtal","sw_incoming_video_call":"Inkommande videosamtal","sw_new_message":"Nytt meddelande","sw_missed_call":"Missat samtal","sw_new_activity":"Ny aktivitet"},"pl":{"sw_incoming_voice_call":"Przychodzące połączenie głosowe","sw_incoming_video_call":"Przychodzące połączenie wideo","sw_new_message":"Nowa wiadomość","sw_missed_call":"Nieodebrane połączenie","sw_new_activity":"Nowa aktywność"},"tr":{"sw_incoming_voice_call":"Gelen sesli arama","sw_incoming_video_call":"Gelen görüntülü görüşme","sw_new_message":"Yeni mesaj","sw_missed_call":"Cevapsız çağrı","sw_new_activity":"Yeni etkinlik"}};   /* generated from fixtures/l10n/table.json by l10n-edits.mjs */
function swL(lang, key) { var row = (lang && SW_L10N[lang]) || SW_L10N.en; return (row && row[key] != null) ? row[key] : (SW_L10N.en[key] != null ? SW_L10N.en[key] : key); }
/* I-1 (28·base, tb-sw3.js) — the app's face: the big icon on the card and the
   white-on-transparent badge in the status bar. iOS ignores both and shows the
   installed app's icon; Android shows Chrome's generic icons without them. */
function face(o) { o.icon = self.registration.scope + 'icon-v2-192.png'; o.badge = self.registration.scope + 'icon-v2-badge-96.png'; return o; }

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
  if (d && d.t === 'tb-l10n' && typeof d.lang === 'string') { e.waitUntil(saveKv('lang', d.lang.slice(0, 8))); return; }
  if (!d || d.t !== 'tb-app' || !e.source || !e.source.id) { return; }
  e.waitUntil(saveKv(d.standalone === false ? 'tabClient' : 'appClient', { id: e.source.id, at: Date.now() }).then(function () { return journal('app_announced', {}); }));   /* IO-1: a page that does not say (the accepted builds, installed only) is the installed app */
});
function withTimeout(p, ms) { return Promise.race([p, new Promise(function (res) { setTimeout(function () { res(null); }, ms); })]); }

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function describe(ev, ctx, lang) {
  var room = null;
  if (ctx && Array.isArray(ctx.rooms)) { for (var i = 0; i < ctx.rooms.length; i++) { if (ctx.rooms[i].id === ev.room) { room = ctx.rooms[i]; break; } } }
  var who = ev.name || (room && room.title) || 'TalkBridge';
  var body;
  if (ev.kind === 'voice') body = swL(lang, 'sw_incoming_voice_call');
  else if (ev.kind === 'video') body = swL(lang, 'sw_incoming_video_call');
  else body = swL(lang, 'sw_new_message');
  if (room && room.title && ev.name) body += ' · ' + room.title;
  var tag = (ev.kind === 'voice' || ev.kind === 'video') ? ('tb-call-' + ev.callId) : ('tb-' + ev.room);
  var appUrl = (ctx && ctx.appUrl) || (self.registration.scope + APP_FILE);
  return { title: who + ' · TalkBridge', body: body, tag: tag, url: appUrl };
}

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var ev = null; try { ev = e.data ? e.data.json() : null; } catch (_) { ev = null; }
    /* N-1 (27·pre-ship, tb-sw2.js) — the terminal wake. The relay itself
       asked for this card (it is 'os_requested' in relay terms); the relay
       is also the one retracting it. Never touches a chat notification —
       'tb-ev' chat pushes are untouched below, byte for byte. */
    if (ev && ev.t === 'tb-call-end' && ev.callId) {
      var tag = 'tb-call-' + ev.callId;
      return self.registration.getNotifications({ tag: tag }).then(function (list) {
        var closes = list.map(function (n) { n.close(); return null; });
        if (ev.outcome !== 'missed') return Promise.all(closes).then(function () { return journal('call_retracted', { id: ev.id, outcome: ev.outcome }); });
        return Promise.all(closes).then(function () { return withTimeout(Promise.all([loadCtx(), loadKv('lang')]), CTX_MS); }).then(function (both) {
          var ctx = both ? both[0] : null, lang = both ? both[1] : null;
          var room = null;
          if (ctx && Array.isArray(ctx.rooms)) { for (var i = 0; i < ctx.rooms.length; i++) { if (ctx.rooms[i].id === ev.room) { room = ctx.rooms[i]; break; } } }
          var who = ev.name || (room && room.title) || 'TalkBridge';
          var body = swL(lang, 'sw_missed_call') + (room && room.title && ev.name ? ' · ' + room.title : '');
          var appUrl = self.registration.scope + APP_FILE;
          return self.registration.showNotification(who + ' · TalkBridge', face({
            body: body, tag: tag, renotify: false, silent: true,   /* IO-1: the ring was the alert; the card is the record */
            data: { eventId: ev.id, roomId: ev.room, callId: ev.callId, kind: 'missed', url: appUrl }
          })).then(function () { return journal('call_missed_shown', { id: ev.id }); });
        });
      }).catch(function (err) { return journal('call_end_failed', { e: String(err && err.message || err) }); });
    }
    if (!ev || ev.t !== 'tb-ev' || !ev.id || !ev.room) {
      return journal('arrived_unknown', {}).then(function () { return withTimeout(loadKv('lang'), CTX_MS); }).then(function (lang) {
        return self.registration.showNotification('TalkBridge', face({ body: swL(lang, 'sw_new_activity'), tag: 'tb-fallback', data: { url: self.registration.scope + APP_FILE } }));
      }).catch(function () {});
    }
    return journal('arrived', { id: ev.id, room: ev.room, kind: ev.kind }).then(function () { return withTimeout(Promise.all([loadCtx(), loadKv('lang')]), CTX_MS); }).then(function (both) {
      var ctx = both ? both[0] : null, lang = both ? both[1] : null;
      var d = describe(ev, ctx, lang);
      var data = { eventId: ev.id, roomId: ev.room, callId: ev.callId || null, kind: ev.kind, url: d.url };
      var isCall = (ev.kind === 'voice' || ev.kind === 'video');
      var opts = { body: d.body, tag: d.tag, renotify: false, silent: false, data: data };
      if (isCall) { opts.requireInteraction = true; opts.vibrate = [300, 150, 300, 150, 300]; }
      return self.registration.showNotification(d.title, face(opts))
        .then(function () { return journal('shown', { id: ev.id, room: ev.room, kind: ev.kind }); },
              function (err) { return journal('failed', { id: ev.id, room: ev.room, e: String(err && err.message || err) }).then(function () { return self.registration.showNotification('TalkBridge', face({ body: swL(lang, 'sw_new_activity'), tag: 'tb-fallback', data: data })).catch(function () {}); }); });
    });
  })());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  var target = data.url || (self.registration.scope + APP_FILE);
  var hash = data.roomId && data.eventId ? ('#ev=' + encodeURIComponent(data.roomId) + '.' + encodeURIComponent(data.eventId)) : '';
  var msg = { t: 'tb-open', roomId: data.roomId || null, eventId: data.eventId || null, callId: data.callId || null, kind: data.kind || null };
  e.waitUntil(Promise.all([loadKv('appClient'), loadKv('tabClient'), self.clients.matchAll({ type: 'window', includeUncontrolled: true })]).then(function (r) {
    var announced = r[0], tabAnnounced = r[1], list = r[2] || [];
    var app = null;
    for (var i = 0; i < list.length; i++) { if (announced && list[i].id === announced.id) { app = list[i]; break; } }
    if (!app) { for (var j = 0; j < list.length; j++) { if (tabAnnounced && list[j].id === tabAnnounced.id) { app = list[j]; break; } } }   /* IO-1: the installed app's window first; else the browser tab that announced itself; else a new window */
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

/* R-3 (§7.12; 29·pre-ship, the directory release) — THE FETCH HANDLER, additive.
   Chrome's installability needs a worker with a fetch handler; the skeleton
   (tb-skeleton/sw.js) proved the shape. Scoped to what the page itself loads:
   same-origin GETs only — network first, the cache as the fallback, the start
   page for a navigation. A cross-origin request (translation, GitHub, the TURN
   credentials) is never answered from here; a non-GET is never touched. The
   precache tolerates a missing file so the worker always activates (push must
   never wait on a cache). Every handler above is tb-sw3.js, byte for byte. */
var APP_CACHE = 'tb-app-v1';
var APP_ASSETS = ['./', './index.html', './icon-v2-192.png', './icon-v2-badge-96.png', './flags.png'];   /* the folder's face and what every page shares; a stage page is cached on its first load */
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(APP_CACHE).then(function (c) { return Promise.all(APP_ASSETS.map(function (a) { return c.add(a).catch(function () {}); })); }).catch(function () {}));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url; try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  var scopePath = self.registration.scope.replace(self.location.origin, '');
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok && url.pathname.indexOf(scopePath) === 0) { var copy = res.clone(); caches.open(APP_CACHE).then(function (c) { return c.put(req, copy); }).catch(function () {}); }
    return res;
  }).catch(function (err) {
    return caches.match(req).then(function (r) { if (r) return r; if (req.mode === 'navigate') return caches.match('./index.html').then(function (p) { if (p) return p; throw err; }); throw err; });
  }));
});
