/* ═══════════ R10 PART · P7-flight-recorder.js ═══════════ */
/* @contract
   OBS1 only: records and exports notification/call evidence. It must not choose,
   delay, suppress, resend, or otherwise alter a product event.
   Stores: IndexedDB tb-flight-recorder/{records,runs,meta}; bounded to 5,000
   records and seven days. Identifiers are hashed; message text, names, keys,
   tokens, subscription endpoints and full URLs are never recorded. */
(function () {
  'use strict';
  var SCHEMA = 'tbfr/1.0', BUILD = 'R10.2-OBS1', APP_VERSION = 'obs1-app/1';
  var DB_NAME = 'tb-flight-recorder', MAX_RECORDS = 5000, MAX_AGE = 7 * 86400000;
  var RUN_KEY = 'tbfr_active_run', SALT_KEY = 'tbfr_salt';
  var memory = [], seq = 0, swReportedVersion = null, relayReportedVersion = null;
  var allowed = {
    status:1, httpStatus:1, reason:1, kind:1, messageType:1, visibility:1,
    focused:1, clientCount:1, visibleClientCount:1, notificationCount:1,
    permission:1, muted:1, matched:1, worthy:1, attempted:1, accepted:1,
    mounted:1, target:1, actual:1, errorName:1, errorCategory:1, elapsedMs:1,
    count:1, index:1, stale:1, platform:1, condition:1, scenario:1,
    receiver:1, runStatus:1, version:1, idGap:1, traceGap:1, sourceSeq:1
  };

  function uid(prefix) {
    var a = new Uint8Array(12);
    try { crypto.getRandomValues(a); } catch (_) { for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); }
    var s = ''; for (var j = 0; j < a.length; j++) s += ('0' + a[j].toString(16)).slice(-2);
    return prefix + s;
  }
  function salt() {
    try { var s = localStorage.getItem(SALT_KEY); if (!s) { s = uid('s-'); localStorage.setItem(SALT_KEY, s); } return s; }
    catch (_) { return 'memory-' + BUILD; }
  }
  function hex(buf) {
    var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2); return s;
  }
  function hash(value, shared) {
    if (value === undefined || value === null || value === '') return Promise.resolve(null);
    var input = (shared ? 'tbfr-tr|' : salt() + '|') + String(value);
    try {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then(function (b) { var h=hex(b).slice(0,16); return shared ? 'trace:'+h : h; });
    } catch (_) { return Promise.resolve('hash-unavailable'); }
  }
  function eventId(m) { return m && (m.eventId || m.chatId || m.pillId || m.threadId) || null; }
  function callId(m) { return m && m.callId || null; }
  function traceKey(m) {
    if (!m) return null;
    var stable = eventId(m) || callId(m);
    if (stable) return m.type + '|id|' + stable;
    if (m.type && m.ts && m.from) return m.type + '|ts|' + m.ts + '|from|' + m.from;
    return null;
  }
  function safeDetail(input) {
    var out = {}, d = input || {};
    Object.keys(d).forEach(function (k) {
      if (!allowed[k]) return;
      var v = d[k];
      if (typeof v === 'string') out[k] = v.slice(0, 80);
      else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
    });
    return out;
  }
  function lifecycle() {
    var visible = !document.hidden;
    var focused = false; try { focused = !!document.hasFocus(); } catch (_) {}
    return visible ? (focused ? 'visible_focused' : 'visible_unfocused') : 'hidden_client';
  }
  function surface(roomId) {
    try {
      if ($('ring-overlay') && $('ring-overlay').classList.contains('show')) return 'call_screen';
      if (S && S.view === 'room') return S.roomId === roomId ? 'event_room' : 'other_room';
      if (S && S.view === 's1') return 'home';
      return (S && S.view) || 'unknown';
    } catch (_) { return 'unknown'; }
  }
  function currentRun() { try { return JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); } catch (_) { return null; } }
  function versions() { return { buildId:BUILD, appVersion:APP_VERSION, swVersion:swReportedVersion, relayVersion:relayReportedVersion, app:APP_VERSION, sw:swReportedVersion, relay:relayReportedVersion }; }
  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) return reject(new Error('no-idb'));
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('records')) { var st = d.createObjectStore('records', { keyPath: 'recordId' }); st.createIndex('tsMs', 'tsMs'); }
        if (!d.objectStoreNames.contains('runs')) d.createObjectStore('runs', { keyPath: 'testRunId' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
      };
      r.onsuccess = function () { resolve(r.result); }; r.onerror = function () { reject(r.error); };
    });
  }
  function prune(db) {
    return new Promise(function (resolve) {
      var tx = db.transaction('records', 'readwrite'), st = tx.objectStore('records'), rows = [];
      var c = st.index('tsMs').openCursor();
      c.onsuccess = function () { var cur = c.result; if (cur && rows.length < MAX_RECORDS + 101) { rows.push({ key: cur.primaryKey, ts: cur.value.tsMs }); cur.continue(); } };
      tx.oncomplete = function () {
        var remove = [], cutoff = Date.now() - MAX_AGE;
        rows.forEach(function (r, i) { if (r.ts < cutoff || i < rows.length - MAX_RECORDS) remove.push(r.key); });
        remove = remove.slice(0, 100); if (!remove.length) return resolve();
        var tx2 = db.transaction('records', 'readwrite'), st2 = tx2.objectStore('records'); remove.forEach(function (k) { st2.delete(k); });
        tx2.oncomplete = tx2.onerror = function () { resolve(); };
      };
      tx.onerror = function () { resolve(); };
    });
  }
  function persistRecord(rec) {
    memory.push(rec); if (memory.length > 200) memory.shift();
    return openDb().then(function (db) { return new Promise(function (resolve) {
      var tx = db.transaction('records', 'readwrite'); tx.objectStore('records').put(rec);
      tx.oncomplete = tx.onerror = function () { prune(db).then(resolve); };
    }); }).catch(function () {});
  }
  function record(source, event, phase, outcome, opt) {
    opt = opt || {}; var run = currentRun(), now = Date.now(), n = ++seq;
    var m = opt.message || null, room = opt.roomId || (m && m.session) || null;
    return Promise.all([hash(room, false), hash(typeof deviceId !== 'undefined' ? deviceId : null, false),
      opt.traceId ? Promise.resolve(opt.traceId) : hash(traceKey(m), true), hash(eventId(m), false), hash(callId(m), false)]).then(function (h) {
      var detail=safeDetail(opt.detail), life=lifecycle(), vis=document.visibilityState||'unknown', focus=false;
      try{focus=!!document.hasFocus();}catch(_){}
      var rec = {
        schemaVersion: SCHEMA, buildId: BUILD, versions: versions(), recordId: uid('r-'), seq: n,
        ts: new Date(now).toISOString(), tsMs: now, time:{wallIso:new Date(now).toISOString(),epochMs:now,monotonicMs:(performance&&performance.now)?performance.now():null,provenance:opt.provenance||'observed'},
        source: source, event: event, phase: phase, action:event+'_'+phase, outcome: outcome || 'observed', reason:detail.reason||null,
        testRunId: run && run.testRunId || null, traceId: h[2], eventType: m && m.type || opt.eventType || null,
        eventKind:m&&m.type||opt.eventType||null, eventId:h[3]?'event:'+h[3]:null, callId:h[4]?'call:'+h[4]:null,
        eventIdHash: h[3], callIdHash: h[4], roomHash: h[0]?'room:'+h[0]:null, deviceHash:h[1]?'device:'+h[1]:null,
        subject:{roomHash:h[0]?'room:'+h[0]:null,deviceHash:h[1]?'device:'+h[1]:null,subscriptionHash:null},
        state: { surface: surface(room), lifecycle: life, visibility:vis, focus:focus, currentRoomMatches:!!(room&&typeof S!=='undefined'&&S.roomId===room), socket:(typeof _relayWs!=='undefined'&&_relayWs)?String(_relayWs.readyState):'none', swController:swReportedVersion, permission:(typeof Notification!=='undefined'&&Notification.permission)||'unknown', testCondition:run&&run.condition||'unspecified', testConditionProvenance:run?'test_supplied':'unknown' },
        provenance: opt.provenance || 'observed', detail:detail, redactions:[], error:outcome==='failed'?{name:detail.errorName||'Error',category:detail.errorCategory||'unknown'}:null
      };
      if (!rec.traceId && m && m.type) rec.detail.traceGap = true;
      if (!eventId(m) && !callId(m) && m && m.type) rec.detail.idGap = true;
      persistRecord(rec); return rec;
    }).catch(function () { return null; });
  }
  function putRun(run) {
    try { localStorage.setItem(RUN_KEY, JSON.stringify(run)); } catch (_) {}
    return openDb().then(function (db) { return new Promise(function (resolve) { var tx = db.transaction('runs', 'readwrite'); tx.objectStore('runs').put(run); tx.oncomplete = tx.onerror = resolve; }); }).catch(function () {});
  }
  function startRun(condition, scenario, receiver) {
    var allowedCondition = { foreground_home:1, foreground_event_room:1, foreground_other_room:1, background:1, locked:1, muted_room:1 };
    var allowedScenario = { chat:1, voice_call:1, video_call:1, missed_call:1, notification_tap:1 };
    var allowedReceiver = { ios:1, android:1 };
    if (!allowedCondition[condition] || !allowedScenario[scenario] || !allowedReceiver[receiver]) throw new Error('Select all test fields');
    var run = { schemaVersion: SCHEMA, buildId: BUILD, testRunId: uid('run-'), startedAt: Date.now(), condition: condition, scenario: scenario, receiver: receiver, provenance: 'test_supplied', status: 'active' };
    putRun(run); record('app', 'test_run', 'start', 'accepted', { provenance: 'test_supplied', detail: { condition: condition, scenario: scenario, receiver: receiver, runStatus: 'active' } });
    record('app','permission_snapshot','captured','observed',{detail:{permission:(typeof Notification!=='undefined'&&Notification.permission)||'unknown'}});
    try{navigator.serviceWorker.ready.then(function(reg){return reg.pushManager&&reg.pushManager.getSubscription?reg.pushManager.getSubscription():null;}).then(function(sub){record('app','subscription_snapshot','captured','observed',{detail:{accepted:!!sub}});}).catch(function(e){record('app','subscription_snapshot','failed','failed',{detail:{errorName:e&&e.name||'Error'}});});}catch(_){}
    querySwVersion(); fetchRelay();
    updateHealth(); return run;
  }
  function stopRun() { var run = currentRun(); if (!run) return; run.status = 'stopped'; run.stoppedAt = Date.now(); putRun(run); record('app', 'test_run', 'stop', 'accepted', { provenance: 'test_supplied', detail: { runStatus: 'stopped' } }); updateHealth(); }
  function allRecords() {
    return openDb().then(function (db) { return new Promise(function (resolve) {
      var tx = db.transaction('records', 'readonly'), req = tx.objectStore('records').getAll(); req.onsuccess = function () { resolve(req.result || []); }; req.onerror = function () { resolve(memory.slice()); };
    }); }).catch(function () { return memory.slice(); });
  }
  function recordsForRun() {
    var run = currentRun(); return allRecords().then(function (rows) {
      if (!run) return rows;
      return rows.filter(function (r) { return r.testRunId === run.testRunId || ((r.source === 'service_worker' || r.source === 'relay') && r.tsMs >= run.startedAt); });
    });
  }
  function canonical(rows) { return rows.slice().sort(function (a, b) { return a.tsMs - b.tsMs || a.seq - b.seq; }).map(function (r) { return JSON.stringify(r); }).join('\n') + (rows.length ? '\n' : ''); }
  function human(rows) {
    var run = currentRun(), v = versions(), traces = {}, issues = [], counts={app:0,service_worker:0,relay:0}, seen={};
    rows.forEach(function (r) {
      counts[r.source]=(counts[r.source]||0)+1;
      if(seen[r.recordId]&&seen[r.recordId]!==JSON.stringify(r))issues.push('INVARIANT: duplicate recordId has different content: '+r.recordId);seen[r.recordId]=JSON.stringify(r);
      var k = r.traceId || 'gap:' + r.recordId; (traces[k] = traces[k] || []).push(r);
      if (r.detail && r.detail.idGap && r.eventType && ['hello','ping','pong','ack'].indexOf(r.eventType)<0) issues.push('ID GAP: ' + r.eventType + ' at ' + r.source + '/' + r.event);
      if(run&&run.condition==='locked'&&r.provenance==='observed'&&r.detail&&r.detail.condition==='locked')issues.push('INVARIANT: locked was falsely labeled observed');
      if(r.source==='relay'&&r.event==='push_service'&&['delivered','displayed'].indexOf(r.outcome)>=0)issues.push('INVARIANT: push-service acceptance mislabeled '+r.outcome);
    });
    if (v.sw && v.sw !== 'obs1-sw/1') issues.push('VERSION MISMATCH: service worker ' + v.sw);
    if (v.relay && v.relay !== 'obs1-relay/1') issues.push('VERSION MISMATCH: relay ' + v.relay);
    if(!v.sw)issues.push('TRACE GAP: service-worker version not confirmed');
    if(!v.relay)issues.push('TRACE GAP: relay slice unavailable or version not confirmed');
    var out = ['TalkBridge OBS1 human report', 'Build: ' + BUILD, 'Versions: app=' + v.app + ' sw=' + (v.sw || 'unknown') + ' relay=' + (v.relay || 'unknown'),
      'Run: ' + (run ? run.testRunId + ' · ' + run.receiver + ' · ' + run.condition + ' · ' + run.scenario + ' ('+run.provenance+')' : 'none'),
      'Recorder health: '+(issues.length?'ATTENTION':'no recorder contradiction detected')+' · records='+rows.length+' app='+counts.app+' worker='+counts.service_worker+' relay='+counts.relay,
      'Evidence boundary: OS banner visibility, sound, vibration, lock state and user attention remain unknown unless test supplied.',
      'Clock: each source owns its clock; cross-device millisecond ordering is clock_uncertain.', ''];
    Object.keys(traces).forEach(function (k) {
      var tr=traces[k].sort(function (a,b) { return a.tsMs-b.tsMs; }), has=function(source,event,phase){return tr.some(function(r){return(!source||r.source===source)&&(!event||r.event===event)&&(!phase||r.phase===phase);});};
      var first=tr[0],kind=tr.map(function(r){return r.eventKind||r.eventType;}).filter(Boolean)[0]||'diagnostic';
      if(has('relay','wake_decision','recipient')&&tr.some(function(r){return r.outcome==='push_selected';})&&!has('relay','push_service','response'))issues.push('TRACE GAP '+k+': relay selected push but no push-service response is present');
      if(has('service_worker','push','arrival')&&!has('service_worker','notification','show_result')&&!tr.some(function(r){return r.source==='service_worker'&&r.event==='notification'&&r.phase==='suppressed_visible';}))issues.push('TRACE GAP '+k+': worker push arrived without a notification terminal');
      if(has(null,'notification_tap',null)&&!has('app','notification_tap','navigation_result'))issues.push('TRACE GAP '+k+': notification tap has no final app surface');
      if(has('app','incoming_call','request')&&!has('app','incoming_call','surface_result'))issues.push('TRACE GAP '+k+': call surface request has no mount result');
      var requested=tr.filter(function(r){return r.phase==='request'||r.phase==='room_request'||r.phase==='navigation_requested';}).map(function(r){return r.event;}).join(',')||'none';
      var confirmed=tr.filter(function(r){return r.phase==='surface_result'||r.phase==='mounted'||r.phase==='navigation_result'||r.phase==='confirmed';}).map(function(r){return r.event+':'+r.outcome;}).join(',')||'none';
      var terminal=tr.filter(function(r){return r.event==='call_action'||r.event==='transcript_outcome';}).map(function(r){return r.phase+':'+r.outcome;}).join(',')||'none';
      out.push('Trace ' + k+' · '+kind+' · first observed '+first.ts);
      tr.forEach(function (r) { out.push('  ' + r.ts + ' ' + r.source + ' · ' + r.action + ' → ' + r.outcome + ' · ' + r.state.surface + '/' + r.state.lifecycle); });
      out.push('  Matrix row: requested='+requested+' · confirmed='+confirmed+' · terminal='+terminal+' · OS presentation=unknown · elapsed=clock_uncertain');
    });
    if (issues.length) { out.splice(7,0,'Issues'); issues.forEach(function (x,i) { out.splice(8+i,0,'- ' + x); }); out.splice(8+issues.length,0,''); }
    return out.join('\n') + '\n';
  }
  function download(name, type, text) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function exportJsonl() { return fetchRelay().then(recordsForRun).then(function (rows) { download('talkbridge-obs1.jsonl', 'application/x-ndjson', canonical(rows)); return rows; }); }
  function exportHuman() { return fetchRelay().then(recordsForRun).then(function (rows) { download('talkbridge-obs1-report.txt', 'text/plain', human(rows)); return rows; }); }
  function exportBoth() { return fetchRelay().then(recordsForRun).then(function(rows){download('talkbridge-obs1.jsonl','application/x-ndjson',canonical(rows));download('talkbridge-obs1-report.txt','text/plain',human(rows));return rows;}); }
  function clear() { memory = []; try { localStorage.removeItem(RUN_KEY); } catch (_) {} return openDb().then(function (db) { return new Promise(function (resolve) { var tx = db.transaction(['records','runs'], 'readwrite'); tx.objectStore('records').clear(); tx.objectStore('runs').clear(); tx.oncomplete = tx.onerror = resolve; }); }).catch(function () {}).then(updateHealth); }
  function ingestForeign(rows) {
    (Array.isArray(rows) ? rows : []).forEach(function (r) {
      if (!r || r.schemaVersion !== SCHEMA || (r.source !== 'relay' && r.source !== 'service_worker') || !r.recordId || !r.tsMs) return;
      r.testRunId = currentRun() && currentRun().testRunId || r.testRunId || null; persistRecord(r);
    });
  }
  function fetchRelay() {
    var rooms = (typeof S !== 'undefined' && S.rooms || []).filter(function (r) { return !r.deletedAt; });
    return Promise.all(rooms.map(function (room) {
      var u = p3RelayHttp() + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(room.id) + '&client=' + encodeURIComponent(deviceId);
      return fetch(u, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'diag-trace', since:currentRun() ? currentRun().startedAt : Date.now()-3600000, limit:500 }) })
        .then(function (r) { return r.json(); }).then(function (d) { if (d && d.version) relayReportedVersion = d.version; if (d && Array.isArray(d.records)) ingestForeign(d.records); }).catch(function () {});
    })).then(function () { updateHealth(); });
  }
  function updateHealth() {
    var el = document.getElementById('tbfr-health'); if (!el) return;
    var v = versions(), bad = (v.sw && v.sw !== 'obs1-sw/1') || (v.relay && v.relay !== 'obs1-relay/1');
    el.textContent = bad ? 'VERSION MISMATCH · INVALID RUN' : ('OBS1 · app ' + v.app + ' · sw ' + (v.sw || 'checking') + ' · relay ' + (v.relay || 'not fetched'));
    el.style.color = bad ? '#a32d2d' : '#315d5d';
  }
  function mountUi() {
    if (document.getElementById('tbfr-open')) return;
    var css = document.createElement('style'); css.textContent = '#tbfr-open,#tbfr-room{margin-left:auto;border:1px solid #2e8b8b;background:#fff;color:#286f6f;border-radius:8px;padding:6px 9px;font-size:11px;font-weight:700}#tbfr-modal{position:fixed;inset:0;background:rgba(0,0,0,.56);z-index:10001;display:none;align-items:flex-end;justify-content:center}#tbfr-modal.show{display:flex}#tbfr-card{background:#fff;width:min(100%,520px);max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px;color:#222}#tbfr-card select,#tbfr-card button{width:100%;padding:11px;margin:5px 0;border:1px solid #c9d4d7;border-radius:9px;background:#fff}#tbfr-card .primary{background:#2e8b8b;color:#fff;border-color:#2e8b8b}#tbfr-health{font-size:11px;margin:7px 0 10px}'; document.head.appendChild(css);
    var home = document.querySelector('#scr-s1 .ribbon'), room = document.getElementById('room-ribbon');
    function button(id) { var b = document.createElement('button'); b.id=id; b.type='button'; b.textContent='OBS1'; b.onclick=function(){ document.getElementById('tbfr-modal').classList.add('show'); updateHealth(); }; return b; }
    if (home) home.appendChild(button('tbfr-open')); if (room) room.appendChild(button('tbfr-room'));
    var modal = document.createElement('div'); modal.id='tbfr-modal'; modal.innerHTML='<div id="tbfr-card"><h3 style="margin:0 0 5px">Notification flight recorder</h3><div style="font-size:12px;color:#556">Select the physical condition you will create. OBS1 cannot detect a locked screen.</div><div id="tbfr-health"></div><select id="tbfr-condition"><option value="">Receiving condition…</option><option value="foreground_home">App open · home</option><option value="foreground_event_room">App open · event room</option><option value="foreground_other_room">App open · other room</option><option value="background">App backgrounded</option><option value="locked">Screen locked</option><option value="muted_room">Room muted</option></select><select id="tbfr-scenario"><option value="">Event…</option><option value="chat">Chat</option><option value="voice_call">Voice call</option><option value="video_call">Video call</option><option value="missed_call">Missed call</option><option value="notification_tap">Notification tap</option></select><select id="tbfr-receiver"><option value="">Receiver…</option><option value="ios">iPhone/iPad</option><option value="android">Android</option></select><button class="primary" id="tbfr-start">Start new run</button><button id="tbfr-stop">Stop run</button><button class="primary" id="tbfr-both">Export evidence package</button><button id="tbfr-human">Export human report</button><button id="tbfr-jsonl">Export machine JSONL</button><button id="tbfr-copy">Copy human report</button><button id="tbfr-clear">Clear recorder</button><button id="tbfr-close">Close</button></div>'; document.body.appendChild(modal);
    document.getElementById('tbfr-start').onclick=function(){ try { startRun(document.getElementById('tbfr-condition').value,document.getElementById('tbfr-scenario').value,document.getElementById('tbfr-receiver').value); } catch(e) { alert(e.message); } };
    document.getElementById('tbfr-stop').onclick=stopRun; document.getElementById('tbfr-both').onclick=exportBoth; document.getElementById('tbfr-human').onclick=exportHuman; document.getElementById('tbfr-jsonl').onclick=exportJsonl;
    document.getElementById('tbfr-copy').onclick=function(){ fetchRelay().then(recordsForRun).then(function(rows){ var t=human(rows); if(navigator.clipboard) return navigator.clipboard.writeText(t); }); };
    document.getElementById('tbfr-clear').onclick=function(){ if (confirm('Clear OBS1 records on this device?')) clear(); }; document.getElementById('tbfr-close').onclick=function(){ modal.classList.remove('show'); };
    updateHealth();
  }
  function querySwVersion() {
    try {
      if (!navigator.serviceWorker) return;
      if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ t:'tbfr-version-query' });
      else if (navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(function(reg){if(reg&&reg.active)reg.active.postMessage({t:'tbfr-version-query'});}).catch(function(){});
    } catch (_) {}
  }
  function reconcileColdOpen(traceId, roomId, delay) { setTimeout(function () { record('app','notification_tap','navigation_result','observed',{ traceId:traceId, roomId:roomId, detail:{ actual:surface(roomId), elapsedMs:delay } }); }, delay); }
  function reconcileRecentColdOpen(delay){setTimeout(function(){allRecords().then(function(rows){var now=Date.now(),hit=null;rows.forEach(function(r){if(r.source==='service_worker'&&r.event==='notification_tap'&&r.phase==='open_window_result'&&r.traceId&&now-r.tsMs<60000&&(!hit||r.tsMs>hit.tsMs))hit=r;});if(!hit)return;var done=rows.some(function(r){return r.source==='app'&&r.event==='notification_tap'&&r.phase==='navigation_result'&&r.traceId===hit.traceId&&r.tsMs>=hit.tsMs;});if(!done)record('app','notification_tap','navigation_result','observed',{traceId:hit.traceId,detail:{actual:surface(null),elapsedMs:delay}});});},delay);}

  /* Side-effect-free wrappers: original product call always runs first. */
  var _send = relaySend; relaySend = function (m) { var ok = _send.apply(this, arguments); record('app','relay_send','complete',ok?'accepted':'not_sent',{message:m,roomId:m&&m.session,detail:{messageType:m&&m.type,accepted:!!ok}}); if(m&&['chat-msg','call-start','call-end','sys-pill','thread-invite'].indexOf(m.type)>=0)record('app','sender_event','created','observed',{message:m,roomId:m.session,detail:{messageType:m.type}});if(m&&m.type==='call-end'&&m.reason==='missed')record('app','call_action','timed_out','observed',{message:m,roomId:m.session,detail:{reason:'no_answer'}}); return ok; };
  var _handle = handleRelay; handleRelay = function (d) { record('app','socket_receive','arrival','observed',{message:d,roomId:S.roomId,detail:{messageType:d&&d.type}}); var r=_handle.apply(this,arguments); record('app','socket_receive','handled','observed',{message:d,roomId:S.roomId}); if(d&&d.type==='chat-msg')record('app','content_render','confirmed','observed',{message:d,roomId:S.roomId,detail:{mounted:true}}); return r; };
  var _listenHandle = LISTEN.handle; LISTEN.handle = function (roomId,d) { record('app','background_socket_receive','arrival','observed',{message:d,roomId:roomId,detail:{messageType:d&&d.type}}); var r=_listenHandle.apply(this,arguments); record('app','background_socket_receive','handled','observed',{message:d,roomId:roomId}); if(d&&d.type==='chat-msg')record('app','content_render','confirmed','observed',{message:d,roomId:roomId,detail:{mounted:true}}); return r; };
  var _listenSend = LISTEN.send; LISTEN.send = function(roomId,m){ var ok=_listenSend.apply(this,arguments); record('app','background_relay_send','complete',ok?'accepted':'not_sent',{message:m,roomId:roomId,detail:{messageType:m&&m.type,accepted:!!ok}}); return ok; };
  var _notify=osNotify; osNotify=function(title,body,roomId){ record('app','in_app_notification','request','observed',{roomId:roomId}); var r=_notify.apply(this,arguments); record('app','in_app_notification','return','observed',{roomId:roomId}); return r; };
  var _screen=showScreen; showScreen=function(v){ var r=_screen.apply(this,arguments); record('app','surface','mounted','observed',{detail:{target:v,mounted:!!(document.getElementById('scr-'+v)&&document.getElementById('scr-'+v).classList.contains('active'))}}); return r; };
  var _enter=enterRoom; enterRoom=function(id){ record('app','navigation','room_request','observed',{roomId:id,detail:{target:'event_room'}}); var r=_enter.apply(this,arguments); record('app','navigation','room_result','observed',{roomId:id,detail:{actual:surface(id)}}); return r; };
  var _incoming=CALL.onIncoming; CALL.onIncoming=function(room,d){ record('app','incoming_call','request','observed',{message:d,roomId:room&&room.id,detail:{muted:!!(room&&room.muted),kind:d&&d.kind}}); var r=_incoming.apply(this,arguments); record('app','incoming_call','surface_result','observed',{message:d,roomId:room&&room.id,detail:{mounted:!!this.ringPending}}); return r; };
  var _accept=CALL.accept; CALL.accept=function(){ var p=this.ringPending; record('app','call_action','accept','observed',{roomId:p&&p.roomId}); var r=_accept.apply(this,arguments);Promise.resolve(r).then(function(){record('app','call_action','accept_result','observed',{roomId:p&&p.roomId,detail:{accepted:!!CALL.active}});});return r; };
  var _decline=CALL.decline; CALL.decline=function(){ var p=this.ringPending; record('app','call_action','decline','observed',{roomId:p&&p.roomId}); var r=_decline.apply(this,arguments);record('app','call_action','decline_result','observed',{roomId:p&&p.roomId,detail:{accepted:true}});return r; };
  var _ringStart=RING.start; RING.start=function(){ record('app','ringtone','request','observed',{}); var r=_ringStart.apply(this,arguments); record('app','ringtone','return',this.ctx?'accepted':'unconfirmed',{}); return r; };
  var _ringStop=RING.stop; RING.stop=function(){ record('app','ringtone','stop','observed',{}); return _ringStop.apply(this,arguments); };
  var _keys=CALL.keys; CALL.keys=function(){ var r=_keys.apply(this,arguments); record('app','calling_keys','checked','observed',{detail:{accepted:!!(r&&r.dg),count:(r&&r.dg?1:0)+(r&&r.tid?1:0)+(r&&r.tok?1:0)}}); return r; };
  var _bgPill=bgAddPill; bgAddPill=function(roomId,text){record('app','transcript_outcome','request','observed',{roomId:roomId,detail:{kind:/missed/i.test(String(text))?'missed_call':'call_outcome'}});var r=_bgPill.apply(this,arguments);record('app','transcript_outcome','confirmed','observed',{roomId:roomId,detail:{accepted:true}});return r;};
  var _addPill=addSysPill; addSysPill=function(text,id){record('app','transcript_outcome','request','observed',{roomId:S.roomId,detail:{kind:/call/i.test(String(text))?'call_outcome':'system'}});var r=_addPill.apply(this,arguments);record('app','transcript_outcome','confirmed','observed',{roomId:S.roomId,detail:{accepted:true}});return r;};
  if(typeof bumpWaiting==='function'){var _bump=bumpWaiting;bumpWaiting=function(room,kind){var before=waitingTotal(room);record('app','home_counter','before','observed',{roomId:room&&room.id,detail:{count:before,kind:kind}});var r=_bump.apply(this,arguments);var after=waitingTotal(room);record('app','home_counter','delta','observed',{roomId:room&&room.id,detail:{count:after-before,kind:kind}});record('app','home_counter','after','observed',{roomId:room&&room.id,detail:{count:after,kind:kind}});return r;};}
  if(typeof renderHome==='function'){var _home=renderHome;renderHome=function(){var r=_home.apply(this,arguments);record('app','home_surface','rendered','observed',{detail:{count:homeCards().length,mounted:!!document.getElementById('home-wrap')}});return r;};}
  var _hang=CALL.hangUp; CALL.hangUp=function(send){record('app','call_action','ended','observed',{roomId:S.roomId,detail:{reason:send?'local_hangup':'local_teardown'}});return _hang.apply(this,arguments);};
  var _remoteEnd=CALL.onRemoteEnd; CALL.onRemoteEnd=function(room,d){record('app','call_action','remote_end','observed',{message:d,roomId:room&&room.id,detail:{reason:d&&d.reason||'remote_end'}});return _remoteEnd.apply(this,arguments);};

  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', function (ev) {
    var d=ev&&ev.data; if (!d) return;
    if (d.t==='tbfr-version') { swReportedVersion=d.version||null; updateHealth(); record('app','version_handshake','service_worker','observed',{detail:{version:swReportedVersion}}); }
    if (d.t==='tb-open' && d.tbfrTraceId) { record('app','notification_tap','navigation_requested','observed',{traceId:d.tbfrTraceId,roomId:d.roomId,detail:{target:d.roomId?'event_room':'home'}}); reconcileColdOpen(d.tbfrTraceId,d.roomId,800); reconcileColdOpen(d.tbfrTraceId,d.roomId,3000); }
  });
  document.addEventListener('visibilitychange',function(){ record('app','lifecycle','visibility_change','observed',{detail:{visibility:document.visibilityState,focused:document.hasFocus&&document.hasFocus()}}); if(!document.hidden){querySwVersion();fetchRelay();} });
  window.addEventListener('focus',function(){record('app','lifecycle','focus','observed',{});}); window.addEventListener('blur',function(){record('app','lifecycle','blur','observed',{});});
  document.addEventListener('DOMContentLoaded',function(){ mountUi(); querySwVersion(); record('app','build','boot','observed',{detail:{version:APP_VERSION}}); setTimeout(querySwVersion,1000); reconcileRecentColdOpen(1200); reconcileRecentColdOpen(3200); });
  window.TBFR={schemaVersion:SCHEMA,buildId:BUILD,appVersion:APP_VERSION,record:record,startRun:startRun,stopRun:stopRun,recordsForRun:recordsForRun,canonical:canonical,human:human,fetchRelay:fetchRelay,clear:clear,traceKey:traceKey,safeDetail:safeDetail};
})();
