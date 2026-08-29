/* TalkBridge service worker · R10.2-OBS1 P4v2 + observation-only recorder · source: talkbridge/parts/p4-sw.js — assembled, never hand-edited.
   Rules it embodies (sources S1-S5 in the plan):
   - The relay always pushes; THIS worker decides presentation from ground truth:
     a VISIBLE window client exists → non-iOS: skip (the app is the alert; FCM /
     web.dev reference pattern); iOS: show with the room tag and the app closes
     it (Apple revokes silent handlers). No visible client → show.
   - Per-room tag: successive pushes REPLACE, never stack.
   - A tap closes itself and focuses the running app rather than opening a second copy.
   - Every push terminal (arrived / shown / failed) is journaled durably on-device; the app drains it into its debug log.
   - The push carries no room; the room is resolved from the relay's own history (bounded), so message text never rides a push service. */
var DB = 'tb-r10', JOURNAL = 'journal', KV = 'kv';
var PUSH_WORTHY = { 'chat-msg': 'New message', 'sys-pill': 'Update', 'call-start': 'Incoming call', 'call-end': 'Missed call', 'thread-invite': 'Thread invite', 'history-sync': 'New activity' };
var LOOKUP_MS = 1500, RECENT_MS = 120000;

/* OBS1 recorder. Its promises are deliberately not awaited by product flow. */
var FR_SCHEMA = 'tbfr/1.0', FR_BUILD = 'R10.2-OBS1', FR_VERSION = 'obs1-sw/1', FR_DB = 'tb-flight-recorder';
var frSeq = 0;
function frUid(prefix) { var a = new Uint8Array(12); try { crypto.getRandomValues(a); } catch (_) { for (var i=0;i<a.length;i++) a[i]=Math.floor(Math.random()*256); } var s=''; for(var j=0;j<a.length;j++)s+=('0'+a[j].toString(16)).slice(-2); return prefix+s; }
function frHex(buf) { var a=new Uint8Array(buf),s='';for(var i=0;i<a.length;i++)s+=('0'+a[i].toString(16)).slice(-2);return s; }
function frHash(v) { if(v===null||v===undefined||v==='')return Promise.resolve(null);try{return crypto.subtle.digest('SHA-256',new TextEncoder().encode('tbfr-tr|'+String(v))).then(function(b){return 'trace:'+frHex(b).slice(0,16);});}catch(_){return Promise.resolve('trace:hash-unavailable');} }
function frEventId(m){return m&&(m.eventId||m.chatId||m.pillId||m.threadId)||null;}
function frCallId(m){return m&&m.callId||null;}
function frTraceKey(m){var id=frEventId(m)||frCallId(m);if(id)return m.type+'|id|'+id;if(m&&m.type&&m.ts&&m.from)return m.type+'|ts|'+m.ts+'|from|'+m.from;return null;}
function frDb(){return new Promise(function(res,rej){var r=indexedDB.open(FR_DB,1);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('records')){var s=d.createObjectStore('records',{keyPath:'recordId'});s.createIndex('tsMs','tsMs');}if(!d.objectStoreNames.contains('runs'))d.createObjectStore('runs',{keyPath:'testRunId'});if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'key'});};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};});}
function frPrune(db){return new Promise(function(resolve){var tx=db.transaction('records','readwrite'),st=tx.objectStore('records'),rows=[];if(typeof st.index!=='function'){tx.oncomplete=tx.onerror=resolve;return;}var c=st.index('tsMs').openCursor();c.onsuccess=function(){var x=c.result;if(x&&rows.length<5101){rows.push({key:x.primaryKey,ts:x.value.tsMs});x.continue();}};tx.oncomplete=function(){var cut=Date.now()-7*86400000,del=[];rows.forEach(function(r,i){if(r.ts<cut||i<rows.length-5000)del.push(r.key);});del=del.slice(0,100);if(!del.length)return resolve();var t=db.transaction('records','readwrite'),s=t.objectStore('records');del.forEach(function(k){s.delete(k);});t.oncomplete=t.onerror=resolve;};tx.onerror=resolve;});}
function frRecord(event,phase,outcome,opt){
  opt=opt||{};var now=Date.now(),m=opt.message||null,n=++frSeq,detail=opt.detail||{};
  var traceP=opt.traceId?Promise.resolve(opt.traceId):frHash(opt.traceKey||frTraceKey(m));
  return traceP.then(function(trace){
    var rec={schemaVersion:FR_SCHEMA,buildId:FR_BUILD,versions:{buildId:FR_BUILD,appVersion:null,swVersion:FR_VERSION,relayVersion:null},recordId:frUid('sw-'),seq:n,
      ts:new Date(now).toISOString(),tsMs:now,time:{wallIso:new Date(now).toISOString(),epochMs:now,monotonicMs:null,provenance:'observed'},
      source:'service_worker',event:event,phase:phase,action:event+'_'+phase,outcome:outcome||'observed',reason:detail.reason||null,testRunId:null,traceId:trace,
      eventType:m&&m.type||opt.eventType||null,eventKind:m&&m.type||opt.eventType||null,eventId:null,callId:null,eventIdHash:null,callIdHash:null,roomHash:null,deviceHash:null,
      subject:{roomHash:null,deviceHash:null,subscriptionHash:null},state:{surface:'unknown',lifecycle:detail.visibleClientCount===0?'no_window_client':(detail.visibleClientCount>0?'visible_unfocused':'unknown'),visibility:'unknown',focus:null,currentRoomMatches:null,socket:'unknown',swController:FR_VERSION,permission:'unknown',testCondition:'unspecified',testConditionProvenance:'unknown'},
      provenance:'observed',detail:detail,redactions:[],error:outcome==='failed'?{name:detail.errorName||'Error',category:'normalized'}:null};
    return frDb().then(function(db){return new Promise(function(resolve){var tx=db.transaction('records','readwrite');tx.objectStore('records').put(rec);tx.oncomplete=tx.onerror=function(){frPrune(db).then(resolve);};});});
  }).catch(function(){});
}

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

self.addEventListener('install', function () { frRecord('worker_lifecycle','install','observed'); self.skipWaiting(); });
self.addEventListener('activate', function (e) { frRecord('worker_lifecycle','activate','observed'); e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function (e) {
  var d=e&&e.data;if(!d||d.t!=='tbfr-version-query')return;
  try{(e.source||{}).postMessage({t:'tbfr-version',version:FR_VERSION,buildId:FR_BUILD});}catch(_){}
  frRecord('version_handshake','reply','observed',{detail:{version:FR_VERSION}});
});

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

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var payload = null; try { payload = e.data ? e.data.json() : null; } catch (_) { payload = null; }
    frRecord('push','arrival','observed',{eventType:payload&&payload.t,detail:{messageType:payload&&payload.t}});
    return journal('arrived', { kind: payload && payload.t }).then(function () { return visibleClient(); }).then(function (vc) {
      frRecord('push','clients_classified','observed',{detail:{visibleClientCount:vc?1:0,platform:isIOS()?'ios':'other'}});
      if (vc && !isIOS()) {
        /* The app is on screen and presents the event itself (S1/S2). */
        frRecord('notification','suppressed_visible','accepted',{detail:{reason:'visible_non_ios'}});
        return journal('skipped_visible', {});
      }
      return loadCtx().then(function (ctx) {
      return withTimeout(resolveRoom(ctx), LOOKUP_MS).then(function (hit) {
        var roomId = hit ? hit.room.id : null, kind = hit ? hit.msg.type : null;
        var traceKey=hit?frTraceKey(hit.msg):null;
        frRecord('push','classified',hit?'matched':'unmatched',{message:hit&&hit.msg,detail:{matched:!!hit,messageType:kind}});
        var title = 'TalkBridge';
        var body = hit ? (PUSH_WORTHY[kind] + (hit.room.title ? ' · ' + hit.room.title : '')) : 'New activity';
        var tag = 'tb-' + (roomId || 'unknown');
        var appUrl = (ctx && ctx.appUrl) || (self.registration.scope + 'bridge-turn24-post-ship.html');
        return frHash(traceKey).then(function(traceId){
          frRecord('notification','show_request','observed',{traceKey:traceKey,eventType:kind,detail:{messageType:kind}});
          return self.registration.showNotification(title, { body: body, tag: tag, renotify: true, data: { roomId: roomId, url: appUrl, kind: kind, tbfrTraceId:traceId } })
            .then(function () { frRecord('notification','show_result','accepted',{traceKey:traceKey,eventType:kind,detail:{accepted:true}}); return journal('shown', { room: roomId, kind: kind }); },
                  function (err) { frRecord('notification','show_result','failed',{traceKey:traceKey,eventType:kind,detail:{accepted:false,errorName:err&&err.name||'Error'}}); return journal('failed', { e: String(err && err.message || err), room: roomId }).then(function () { return self.registration.showNotification('TalkBridge', { body: 'New activity', tag: 'tb-fallback' }).catch(function () {}); }); });
        });
      });
      });
    });
  })());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  var tapTrace=data.tbfrTraceId||frUid('tap-');
  frRecord('notification_tap','received','observed',{traceId:tapTrace,detail:{target:data.roomId?'event_room':'home'}});
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var app = null;
    for (var i = 0; i < list.length; i++) { if (String(list[i].url).indexOf('bridge-turn24-post-ship') >= 0) { app = list[i]; break; } }
    frRecord('notification_tap','clients_matched','observed',{traceId:tapTrace,detail:{clientCount:list.length,matched:!!app}});
    if (app) { try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null, tbfrTraceId:tapTrace }); } catch (_) {} var p=app.focus ? app.focus() : null; frRecord('notification_tap','focus_request','accepted',{traceId:tapTrace,detail:{target:data.roomId?'event_room':'home'}}); return p; }
    frRecord('notification_tap','open_window_request','observed',{traceId:tapTrace,detail:{target:data.roomId?'event_room':'home'}});
    return self.clients.openWindow(data.url || self.registration.scope).then(function(w){frRecord('notification_tap','open_window_result',w?'accepted':'null',{traceId:tapTrace,detail:{accepted:!!w}});return w;},function(err){frRecord('notification_tap','open_window_result','failed',{traceId:tapTrace,detail:{errorName:err&&err.name||'Error'}});});
  }));
});
