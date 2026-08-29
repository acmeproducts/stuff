/* TalkBridge service worker · v4 (R10.5, plan v20.5.1 §4.9) · source: talkbridge/parts/p4-sw.js — assembled, never hand-edited.
   Legacy presentation path for the one event envelope. On supporting Apple
   systems the OS displays the declarative payload itself; everywhere else this
   worker parses THE SAME decrypted JSON and shows it. One push produces at
   most one display attempt per device: events deduplicate by eventId. The
   journal (arrived / shown / deduped / failed / tap) is delivery TELEMETRY
   only — it never feeds a counter (review §7.3). No history fetching, no room
   guessing, no visibility inference: a push that arrived is a push that was
   not acknowledged, and it is shown. */
var DB = 'tb-r10', JOURNAL = 'journal', KV = 'kv';

/* Integrated recorder: fire-and-forget, bounded, redacted, and never consulted
   by the notification path. */
var FR_SCHEMA = 'tbfr/1.0', FR_BUILD = 'R10.5', FR_VERSION = 'r10.5-sw/1', FR_DB = 'tb-flight-recorder';
var frSeq = 0;
function frUid(prefix) { var a=new Uint8Array(12);try{crypto.getRandomValues(a);}catch(_){for(var i=0;i<a.length;i++)a[i]=Math.floor(Math.random()*256);}var s='';for(var j=0;j<a.length;j++)s+=('0'+a[j].toString(16)).slice(-2);return prefix+s; }
function frHex(buf){var a=new Uint8Array(buf),s='';for(var i=0;i<a.length;i++)s+=('0'+a[i].toString(16)).slice(-2);return s;}
function frHash(v){if(v===null||v===undefined||v==='')return Promise.resolve(null);try{return crypto.subtle.digest('SHA-256',new TextEncoder().encode('tbfr-tr|'+String(v))).then(function(b){return 'trace:'+frHex(b).slice(0,16);});}catch(_){return Promise.resolve('trace:hash-unavailable');}}
function frTraceKey(m){var id=m&&(m.eventId||m.callId);return id?(m.type+'|id|'+id):null;}
function frDb(){return new Promise(function(res,rej){var r=indexedDB.open(FR_DB,1);r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains('records')){var s=d.createObjectStore('records',{keyPath:'recordId'});s.createIndex('tsMs','tsMs');}if(!d.objectStoreNames.contains('runs'))d.createObjectStore('runs',{keyPath:'testRunId'});if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'key'});};r.onsuccess=function(){res(r.result);};r.onerror=function(){rej(r.error);};});}
function frPrune(db){return new Promise(function(resolve){var tx=db.transaction('records','readwrite'),st=tx.objectStore('records'),rows=[];if(typeof st.index!=='function'){tx.oncomplete=tx.onerror=resolve;return;}var c=st.index('tsMs').openCursor();c.onsuccess=function(){var x=c.result;if(x&&rows.length<5101){rows.push({key:x.primaryKey,ts:x.value.tsMs});x.continue();}};tx.oncomplete=function(){var cut=Date.now()-7*86400000,del=[];rows.forEach(function(r,i){if(r.ts<cut||i<rows.length-5000)del.push(r.key);});del=del.slice(0,100);if(!del.length)return resolve();var t=db.transaction('records','readwrite'),s=t.objectStore('records');del.forEach(function(k){s.delete(k);});t.oncomplete=t.onerror=resolve;};tx.onerror=resolve;});}
function frRecord(event,phase,outcome,opt){opt=opt||{};var now=Date.now(),m=opt.message||null,n=++frSeq,detail=opt.detail||{};return frHash(opt.traceKey||frTraceKey(m)).then(function(trace){var rec={schemaVersion:FR_SCHEMA,buildId:FR_BUILD,versions:{buildId:FR_BUILD,appVersion:null,swVersion:FR_VERSION,relayVersion:null},recordId:frUid('sw-'),seq:n,ts:new Date(now).toISOString(),tsMs:now,time:{wallIso:new Date(now).toISOString(),epochMs:now,monotonicMs:null,provenance:'observed'},source:'service_worker',event:event,phase:phase,action:event+'_'+phase,outcome:outcome||'observed',reason:detail.reason||null,testRunId:null,traceId:trace,eventType:m&&m.type||opt.eventType||null,eventKind:m&&m.type||opt.eventType||null,eventId:null,callId:null,subject:{roomHash:null,deviceHash:null,subscriptionHash:null},state:{surface:'unknown',lifecycle:detail.clientCount===0?'no_window_client':'unknown',visibility:'unknown',focus:null,currentRoomMatches:null,socket:'unknown',swController:FR_VERSION,permission:'unknown',testCondition:'unspecified',testConditionProvenance:'unknown'},provenance:'observed',detail:detail,redactions:[],error:outcome==='failed'?{name:detail.errorName||'Error',category:'normalized'}:null};return frDb().then(function(db){return new Promise(function(resolve){var tx=db.transaction('records','readwrite');tx.objectStore('records').put(rec);tx.oncomplete=tx.onerror=function(){frPrune(db).then(resolve);};});});}).catch(function(){});}

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

self.addEventListener('install', function () { frRecord('worker_lifecycle','install','observed'); self.skipWaiting(); });
self.addEventListener('activate', function (e) { frRecord('worker_lifecycle','activate','observed'); e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function (e) {
  var d=e&&e.data;if(!d||d.t!=='tbfr-version-query')return;
  try{(e.source||{}).postMessage({t:'tbfr-version',version:FR_VERSION,buildId:FR_BUILD});}catch(_){}
  frRecord('version_handshake','reply','observed',{detail:{version:FR_VERSION}});
});

self.addEventListener('push', function (e) {
  e.waitUntil((function () {
    var env = null; try { env = e.data ? e.data.json() : null; } catch (_) { env = null; }
    var tb = (env && env.tb) || {};
    var note = (env && env.notification) || {};
    frRecord('push','arrival','observed',{message:tb,detail:{payloadClass:env&&env.web_push===8030?'declarative_envelope':'legacy_or_invalid'}});
    frRecord('push','classified',env&&env.web_push===8030?'accepted':'failed',{message:tb,detail:{eventIdPresent:!!tb.eventId}});
    return journal('arrived', { eventId: tb.eventId, room: tb.roomId, kind: tb.type }).then(function () {
      return seenBefore(tb.eventId);
    }).then(function (dup) {
      if (dup) { frRecord('notification','deduped','accepted',{message:tb}); return journal('deduped', { eventId: tb.eventId, room: tb.roomId }); }
      var title = note.title || 'TalkBridge';
      var body = note.body || 'New activity';
      var tag = note.tag || ('tb-' + (tb.roomId || 'unknown'));
      var data = { roomId: tb.roomId || null, url: note.navigate || (self.registration.scope + 'bridge-turn24-post-ship.html'),
        eventId: tb.eventId || null, type: tb.type || null, kind: tb.kind || null, callId: tb.callId || null };
      frRecord('notification','show_request','observed',{message:tb,detail:{attempted:true}});
      return self.registration.showNotification(title, { body: body, tag: tag, renotify: false, data: data })
        .then(function () { frRecord('notification','show_result','accepted',{message:tb,detail:{accepted:true}}); return journal('shown', { eventId: tb.eventId, room: tb.roomId, kind: tb.type }); },
              function (err) { frRecord('notification','show_result','failed',{message:tb,detail:{accepted:false,errorName:err&&err.name||'Error'}}); return journal('failed', { e: String(err && err.message || err), eventId: tb.eventId, room: tb.roomId }).then(function () { return self.registration.showNotification('TalkBridge', { body: 'New activity', tag: tag, data: data }).catch(function () {}); }); });
    });
  })());
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var data = e.notification.data || {};
  var traceKey=(data.type||'event')+'|id|'+(data.eventId||'missing');
  frRecord('notification_tap','received','observed',{traceKey:traceKey,eventType:data.type,detail:{target:data.roomId?'event_room':'home'}});
  e.waitUntil((function () {
    return journal('tap', { eventId: data.eventId, room: data.roomId }).then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (list) {
      var app = null;
      for (var i = 0; i < list.length; i++) { if (String(list[i].url).indexOf('bridge-turn24-post-ship') >= 0) { app = list[i]; break; } }
      frRecord('notification_tap','clients_matched','observed',{traceKey:traceKey,eventType:data.type,detail:{clientCount:list.length,matched:!!app}});
      if (app) {
        try { app.postMessage({ t: 'tb-open', roomId: data.roomId || null, eventId: data.eventId || null,
          type: data.type || null, kind: data.kind || null, callId: data.callId || null }); } catch (_) {}
        frRecord('notification_tap','navigation_request','observed',{traceKey:traceKey,eventType:data.type,detail:{target:'event_room'}});
        var nav = app.navigate && data.url ? app.navigate(data.url).then(function(c){frRecord('notification_tap','navigation_result','accepted',{traceKey:traceKey,eventType:data.type,detail:{accepted:!!c}});return c;},function(err){frRecord('notification_tap','navigation_result','failed',{traceKey:traceKey,eventType:data.type,detail:{errorName:err&&err.name||'Error'}});return app;}) : Promise.resolve(app);
        return nav.then(function (client) { frRecord('notification_tap','focus_request','observed',{traceKey:traceKey,eventType:data.type}); return client && client.focus ? client.focus() : null; });
      }
      frRecord('notification_tap','open_window_request','observed',{traceKey:traceKey,eventType:data.type,detail:{target:'event_room'}});
      return self.clients.openWindow(data.url || self.registration.scope).then(function(w){frRecord('notification_tap','open_window_result',w?'accepted':'null',{traceKey:traceKey,eventType:data.type,detail:{accepted:!!w}});return w;},function(err){frRecord('notification_tap','open_window_result','failed',{traceKey:traceKey,eventType:data.type,detail:{errorName:err&&err.name||'Error'}});});
    });
  })());
});
