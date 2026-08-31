/* ═══════════ R10-CR1 PART · r10-cr1-event-state.js ═══════════ */
/* @contract  (plan v20.9.0 §4.11.2 – §4.11.4)
   wraps: relayConnect, reconnectRelayNow, LISTEN.open, relaySend, handleRelay, LISTEN.handle,
          CALL.onIncoming, enterRoom, saveRooms, onVisible, p2Entry, p4OnSwMessage, bgAddPill,
          waitingOf, bumpWaiting
   replaces: osNotify — retained, never invoked: the relay's recipient-event
          record now owns every OS alert (a device-side alert beside a relay
          push is the buried double).
   adds:  cr1State, cr1Log, cr1Send, cr1StateWord, cr1Sockets, cr1Announce,
          cr1OnOpen, cr1Apply, cr1PresentCalls, cr1PillMissed, cr1Recover,
          cr1RouteEvent, cr1Heartbeat, cr1IsRecord, cr1Pilled
   Cold-open exception to the base's "cold boot never auto-opens a room"
   tripwire: a tap on an OS notification (the #ev= hash written only by the
   service worker) opens the exact event — §4.11.4. Invite links are untouched.

   The relay's per-recipient record is the ONE authority. This part:
   - tells the relay the device's truth (visible / in this room / muted) on
     every socket open, every visibility change, every heartbeat;
   - acknowledges the exact events it visibly handled (ev-seen) and the exact
     durable set on an explicit room open (ev-open);
   - displays the relay's projection (chat/voice/video) — never a browser-side
     count; bumpWaiting is a no-op;
   - never presents a ring while hidden: the OS alert is the surface, and the
     relay's active-call list re-presents it once on return;
   - runs ONE single-flight recovery coordinator for visibility/focus/online/
     tap/open signals; one socket per lane, one reconciliation per open;
   - routes a notification tap (warm or cold) to the exact event.
*/
var cr1State = { armed: false, recovering: false, recoverTimer: null, lastRecoverWhy: null, rung: {}, openPending: {}, hb: null, sync: {}, recoveries: 0, opens: 0 };
function cr1Log(what, data, level) { try { log('cr1_' + what, data || {}, level || 'info'); } catch (_) {} }
function cr1IsRecord(d) { return !!(d && (d.type === 'chat-msg' || d.type === 'thread-invite' || d.type === 'call-start')); }
function cr1Pilled() { return lsGet('tb_cr1_pilled', {}); }

/* One word, one lane: the active room rides the relay socket, every other room its listener. */
function cr1Send(roomId, m) {
  try {
    if (S.roomId === roomId && typeof _relayWs !== 'undefined' && _relayWs && _relayWs.readyState === 1) { m.transient = true; return relaySend(m); }
    var ws = LISTEN.socks[roomId];
    if (ws && ws.readyState === 1) { m.transient = true; return LISTEN.send(roomId, m); }
  } catch (e) { cr1Log('send_failed', { e: String(e && e.message || e) }, 'error'); }
  return false;
}
function cr1StateWord(roomId) {
  var room = roomById(roomId);
  var visible = !document.hidden;
  return { type: 'ev-state', visible: visible, inRoom: visible && S.view === 'room' && S.roomId === roomId, muted: !!(room && room.muted) };
}
function cr1Sockets() {
  var out = [];
  try { if (S.roomId && typeof _relayWs !== 'undefined' && _relayWs && _relayWs.readyState === 1) out.push(S.roomId); } catch (_) {}
  try { Object.keys(LISTEN.socks).forEach(function (id) { var ws = LISTEN.socks[id]; if (ws && ws.readyState === 1 && out.indexOf(id) < 0) out.push(id); }); } catch (_) {}
  return out;
}
/* The device's truth to every lane it holds. */
function cr1Announce(why) {
  cr1Sockets().forEach(function (id) { cr1Send(id, cr1StateWord(id)); });
  cr1Log('announce', { why: why, visible: !document.hidden, lanes: cr1Sockets().length });
}
/* A lane opened: state first, then exactly one reconciliation. Visible in the
   routed room counts as the explicit open (§4.11.2). */
function cr1OnOpen(roomId, ws, current) {
  if (!current()) { cr1Log('open_stale', { room: roomId }, 'warn'); return; }
  cr1State.opens++; try { ws._cr1OpenedAt = Date.now(); } catch (_) {}
  cr1Send(roomId, cr1StateWord(roomId));
  var explicit = !document.hidden && S.view === 'room' && S.roomId === roomId;
  if (explicit || cr1State.openPending[roomId]) { delete cr1State.openPending[roomId]; cr1Send(roomId, { type: 'ev-open' }); }
  else cr1Send(roomId, { type: 'events-sync' });
  cr1Log('lane_open', { room: roomId, explicit: explicit }, 'ok');
}
/* The relay's projection is the only count the home ever shows. */
function cr1Apply(roomId, d) {
  var room = roomById(roomId); if (!room) return;
  if (d.proj) {
    room.waiting = { chat: d.proj.chat || 0, voice: d.proj.voice || 0, video: d.proj.video || 0 };
    room.unread = room.waiting.chat + room.waiting.voice + room.waiting.video;
    saveRooms();
  }
  (d.unseen || []).concat(d.acked || []).forEach(function (u) { if (u && u.o === 'missed' && u.callId) cr1PillMissed(roomId, u); });
  cr1PresentCalls(roomId, d.calls || []);
  try { renderPanel(); } catch (_) {}
}
/* Durable missed outcome → one transcript pill, keyed by the call, never twice. */
function cr1PillMissed(roomId, u) {
  var pilled = cr1Pilled(); if (pilled[u.callId]) return;
  pilled[u.callId] = 1; lsSet('tb_cr1_pilled', pilled);
  var text = 'Missed ' + (u.kind === 'video' ? 'video' : 'voice') + ' call';
  try {
    if (S.roomId === roomId) addSysPill(text, 'miss-' + u.callId);
    else { var tr = loadTr(roomId); tr.push({ id: 'miss-' + u.callId, kind: 'sys', text: text, ts: u.ts || Date.now() }); lsSet(trKey(roomId), tr); }
    cr1Log('missed_pill', { room: roomId, callId: u.callId }, 'ok');
  } catch (e) { cr1Log('pill_failed', { e: String(e && e.message || e) }, 'error'); }
}
/* An active offered call, and the app visible: the existing Accept/Decline
   surface — once per call, never a second surface. */
function cr1PresentCalls(roomId, calls) {
  if (document.hidden) return;
  var room = roomById(roomId); if (!room || room.muted) return;
  calls.forEach(function (c) {
    if (!c || !c.callId || cr1State.rung[c.callId]) return;
    if (CALL.active || CALL.ringPending) return;
    cr1State.rung[c.callId] = 1;
    try { CALL.onIncoming(room, { type: 'call-start', kind: c.callKind, name: c.name || room.partnerName, callId: c.callId, from: c.from, eventId: c.id }); } catch (e) { cr1Log('present_failed', { e: String(e && e.message || e) }, 'error'); }
    cr1Log('call_presented', { room: roomId, callId: c.callId }, 'ok');
  });
}
/* ONE recovery coordinator: coalesced, single-flight, reconciliation per lane open. */
function cr1Recover(why) {
  cr1State.lastRecoverWhy = why;
  if (cr1State.recoverTimer) return;
  cr1State.recoverTimer = setTimeout(function () {
    cr1State.recoverTimer = null;
    if (cr1State.recovering) return;
    cr1State.recovering = true; cr1State.recoveries++;
    try {
      cr1Announce(cr1State.lastRecoverWhy);
      /* A lane that just opened has already reconciled; only a lane that was
         open before this recovery is asked again. */
      var settled = function (w) { return w && w.readyState === 1 && w._cr1OpenedAt && (Date.now() - w._cr1OpenedAt) > 500; };
      if (S.roomId) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (settled(ws)) { var explicit = !document.hidden && S.view === 'room'; cr1Send(S.roomId, { type: explicit ? 'ev-open' : 'events-sync' }); }
        else if (!ws || ws.readyState > 1) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; relayConnect(); }
      }
      LISTEN.sync();
      Object.keys(LISTEN.socks).forEach(function (id) { var lw = LISTEN.socks[id]; if (settled(lw)) cr1Send(id, { type: 'events-sync' }); });
      cr1Log('recover', { why: cr1State.lastRecoverWhy, n: cr1State.recoveries, inRoom: !!S.roomId }, 'ok');
    } catch (e) { cr1Log('recover_failed', { e: String(e && e.message || e) }, 'error'); }
    cr1State.recovering = false;
  }, 40);
}
/* A tap (warm: worker message; cold: #ev= hash) opens the exact event. */
function cr1RouteEvent(roomId, eventId, why) {
  var room = roomById(roomId);
  if (!room || room.deletedAt) { cr1Log('route_unknown', { room: roomId, why: why }, 'warn'); return false; }
  try { closePanel(); } catch (_) {}
  if (!(S.view === 'room' && S.roomId === roomId)) { cr1State.openPending[roomId] = 1; enterRoom(roomId); }
  else cr1Send(roomId, { type: 'ev-open' });
  cr1Log('route', { room: roomId, eventId: eventId || null, why: why }, 'ok');
  cr1Recover('route');
  return true;
}
function cr1Heartbeat() {
  if (document.hidden) return;
  cr1Sockets().forEach(function (id) { cr1Send(id, cr1StateWord(id)); });
}

(function () {
  /* One socket per lane: a connect while the lane is still connecting is a duplicate, not a recovery. */
  var _cr1RelayConnect = relayConnect;
  relayConnect = function () {
    try {
      var room = activeRoom();
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && room && ws._cr1Room === room.id) { cr1Log('connect_coalesced', { room: room.id }); return; }
    } catch (_) {}
    var r = _cr1RelayConnect.apply(this, arguments);
    try {
      var cur = _relayWs, rid = S.roomId;
      if (cur && cur.addEventListener) { cur._cr1Room = rid; cur.addEventListener('open', function () { cr1OnOpen(rid, cur, function () { return cur === _relayWs && S.roomId === rid; }); }); }
    } catch (e) { cr1Log('hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* A lane that is already connecting is not reopened by a second signal. */
  var _cr1ReconnectNow = reconnectRelayNow;
  reconnectRelayNow = function (why) {
    try {
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && ws._cr1Room === S.roomId) { cr1Log('reconnect_coalesced', { why: why }); return false; }
    } catch (_) {}
    return _cr1ReconnectNow.apply(this, arguments);
  };
  var _cr1ListenOpen = LISTEN.open;
  LISTEN.open = function (room) {
    var r = _cr1ListenOpen.apply(this, arguments);
    try {
      var self = this, cur = this.socks[room.id];
      if (cur && cur.addEventListener) cur.addEventListener('open', function () { cr1OnOpen(room.id, cur, function () { return self.socks[room.id] === cur; }); });
    } catch (e) { cr1Log('listen_hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* The heartbeat carries the device's truth, so a suspended phone goes stale, never "watching". */
  var _cr1RelaySend = relaySend;
  relaySend = function (m) {
    try { if (m && m.type === 'ping') { var w = cr1StateWord(S.roomId); m.visible = w.visible; m.inRoom = w.inRoom; m.muted = w.muted; } } catch (_) {}
    return _cr1RelaySend.apply(this, arguments);
  };
  /* Relay answers ride each lane; they are the authority's word, not a peer's. */
  var _cr1HandleRelay = handleRelay;
  handleRelay = function (d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { if (S.roomId) cr1Apply(S.roomId, d); } catch (e) { cr1Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    var wasHidden = document.hidden;
    var r = _cr1HandleRelay.apply(this, arguments);
    try {
      if (d && d.from !== deviceId && d.eventId && cr1IsRecord(d) && d.type !== 'call-start' && !wasHidden && S.view === 'room' && S.roomId) cr1Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });
    } catch (e) { cr1Log('seen_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _cr1ListenHandle = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { cr1Apply(roomId, d); } catch (e) { cr1Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr1ListenHandle.apply(this, arguments);
  };
  /* Hidden: no ring. The relay asked the OS; return re-presents an active call once. */
  var _cr1OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    if (document.hidden) { cr1Log('ring_deferred_hidden', { room: room && room.id, callId: d && d.callId }, 'ok'); return; }
    if (d && d.callId) cr1State.rung[d.callId] = 1;
    return _cr1OnIncoming.apply(this, arguments);
  };
  /* The relay's missed outcome is the only source of a missed pill. */
  var _cr1BgAddPill = bgAddPill;
  bgAddPill = function (roomId, text) {
    if (typeof text === 'string' && text.indexOf('Missed ') === 0) { cr1Log('local_missed_pill_dropped', { room: roomId }); return; }
    return _cr1BgAddPill.apply(this, arguments);
  };
  var _cr1OsNotify = osNotify;
  osNotify = function (title, body, roomId) { cr1Log('os_notify_owned_by_relay', { room: roomId }); };
  osNotify._cr1Original = _cr1OsNotify;
  /* Display cache of the projection; never an increment. */
  var _cr1WaitingOf = waitingOf;
  waitingOf = function (r) { if (!r) return { chat: 0, voice: 0, video: 0 }; if (!r.waiting) r.waiting = { chat: 0, voice: 0, video: 0 }; return r.waiting; };
  waitingOf._cr1Original = _cr1WaitingOf;
  var _cr1BumpWaiting = bumpWaiting;
  bumpWaiting = function (r, kind) { cr1Log('bump_ignored', { room: r && r.id, kind: kind }); };
  bumpWaiting._cr1Original = _cr1BumpWaiting;
  /* Explicit open acknowledges the exact durable set. */
  var _cr1EnterRoom = enterRoom;
  enterRoom = function (id) {
    var before = S.roomId;
    var r = _cr1EnterRoom.apply(this, arguments);
    try {
      if (S.roomId === id) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (ws && ws.readyState === 1 && before === id) cr1Send(id, { type: 'ev-open' });
        else cr1State.openPending[id] = 1;
      }
    } catch (e) { cr1Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* A mute toggle is part of the device's truth; the relay hears it at once. */
  var _cr1SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _cr1SaveRooms.apply(this, arguments);
    try {
      var sig = S.rooms.map(function (x) { return x.id + ':' + (x.muted ? 1 : 0); }).join(',');
      if (cr1State.muteSig !== undefined && cr1State.muteSig !== sig) { clearTimeout(cr1State.muteTimer); cr1State.muteTimer = setTimeout(function () { cr1Announce('mute'); }, 100); }
      cr1State.muteSig = sig;
    } catch (_) {}
    return r;
  };
  var _cr1OnVisible = onVisible;
  onVisible = function (why) {
    var r = _cr1OnVisible.apply(this, arguments);
    try { cr1Recover(why); } catch (_) {}
    return r;
  };
  var _cr1SwMessage = p4OnSwMessage;
  p4OnSwMessage = function (ev) {
    var d = ev && ev.data;
    if (d && d.t === 'tb-open' && d.roomId) { try { cr1RouteEvent(d.roomId, d.eventId || null, 'tap_warm'); } catch (e) { cr1Log('tap_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr1SwMessage.apply(this, arguments);
  };
  var _cr1Entry = p2Entry;
  p2Entry = function () {
    var r = _cr1Entry.apply(this, arguments);
    try {
      if (!p2IsStandalone() || cr1State.armed) return r;
      cr1State.armed = true;
      document.addEventListener('visibilitychange', function () { if (document.hidden) cr1Announce('hidden'); else cr1Recover('visible'); });
      window.addEventListener('online', function () { cr1Recover('online'); });
      window.addEventListener('pageshow', function () { cr1Recover('pageshow'); });
      cr1State.hb = setInterval(cr1Heartbeat, 20000);
      var h = location.hash || '';
      if (h.indexOf('#ev=') === 0) {
        var parts = h.slice(4).split('.'); var roomId = decodeURIComponent(parts[0] || ''), eventId = decodeURIComponent(parts.slice(1).join('.') || '');
        try { history.replaceState(null, '', location.pathname); } catch (_) {}
        setTimeout(function () { cr1RouteEvent(roomId, eventId, 'tap_cold'); }, 0);
      }
      cr1Log('armed', {}, 'ok');
    } catch (e) { cr1Log('entry_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
