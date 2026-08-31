/* ═══════════ R10-CR2 PART · r10-cr2-event-state.js ═══════════ */
/* @contract  (plan v20.10.0 §4.12; §4.11.2 – §4.11.4 inherited)
   wraps: relayConnect, reconnectRelayNow, LISTEN.open, relaySend, handleRelay, LISTEN.handle,
          CALL.onIncoming, enterRoom, leaveRoomInternals, saveRooms, onVisible, p2Entry, p4OnSwMessage, bgAddPill,
          waitingOf, bumpWaiting
   replaces: osNotify — retained, never invoked: the relay's recipient-event
          record now owns every OS alert (a device-side alert beside a relay
          push is the buried double).
   adds:  cr2State, cr2Log, cr2Send, cr2StateWord, cr2Sockets, cr2Announce,
          cr2OnOpen, cr2Apply, cr2PresentCalls, cr2PillMissed, cr2Recover,
          cr2RouteEvent, cr2Heartbeat, cr2IsRecord, cr2Pilled, cr2AnnounceWindow
   G21: leaving a room is a recovery signal — the room's listener lane opens
        in the same action; no visible device is laneless for any interval.
   G22: the installed app announces its window to the worker on every
        standalone boot and every return to visible, so a notification tap can
        only ever focus this window — never the install-step browser tab.
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
var cr2State = { armed: false, recovering: false, recoverTimer: null, lastRecoverWhy: null, rung: {}, openPending: {}, hb: null, sync: {}, recoveries: 0, opens: 0 };
function cr2Log(what, data, level) { try { log('cr2_' + what, data || {}, level || 'info'); } catch (_) {} }
function cr2IsRecord(d) { return !!(d && (d.type === 'chat-msg' || d.type === 'thread-invite' || d.type === 'call-start')); }
function cr2Pilled() { return lsGet('tb_cr2_pilled', {}); }

/* One word, one lane: the active room rides the relay socket, every other room its listener. */
function cr2Send(roomId, m) {
  try {
    if (S.roomId === roomId && typeof _relayWs !== 'undefined' && _relayWs && _relayWs.readyState === 1) { m.transient = true; return relaySend(m); }
    var ws = LISTEN.socks[roomId];
    if (ws && ws.readyState === 1) { m.transient = true; return LISTEN.send(roomId, m); }
  } catch (e) { cr2Log('send_failed', { e: String(e && e.message || e) }, 'error'); }
  return false;
}
function cr2StateWord(roomId) {
  var room = roomById(roomId);
  var visible = !document.hidden;
  return { type: 'ev-state', visible: visible, inRoom: visible && S.view === 'room' && S.roomId === roomId, muted: !!(room && room.muted) };
}
function cr2Sockets() {
  var out = [];
  try { if (S.roomId && typeof _relayWs !== 'undefined' && _relayWs && _relayWs.readyState === 1) out.push(S.roomId); } catch (_) {}
  try { Object.keys(LISTEN.socks).forEach(function (id) { var ws = LISTEN.socks[id]; if (ws && ws.readyState === 1 && out.indexOf(id) < 0) out.push(id); }); } catch (_) {}
  return out;
}
/* The device's truth to every lane it holds. */
function cr2Announce(why) {
  cr2Sockets().forEach(function (id) { cr2Send(id, cr2StateWord(id)); });
  cr2Log('announce', { why: why, visible: !document.hidden, lanes: cr2Sockets().length });
}
/* A lane opened: state first, then exactly one reconciliation. Visible in the
   routed room counts as the explicit open (§4.11.2). */
function cr2OnOpen(roomId, ws, current) {
  if (!current()) { cr2Log('open_stale', { room: roomId }, 'warn'); return; }
  cr2State.opens++; try { ws._cr2OpenedAt = Date.now(); } catch (_) {}
  cr2Send(roomId, cr2StateWord(roomId));
  var explicit = !document.hidden && S.view === 'room' && S.roomId === roomId;
  if (explicit || cr2State.openPending[roomId]) { delete cr2State.openPending[roomId]; cr2Send(roomId, { type: 'ev-open' }); }
  else cr2Send(roomId, { type: 'events-sync' });
  cr2Log('lane_open', { room: roomId, explicit: explicit }, 'ok');
}
/* The relay's projection is the only count the home ever shows. */
function cr2Apply(roomId, d) {
  var room = roomById(roomId); if (!room) return;
  if (d.proj) {
    room.waiting = { chat: d.proj.chat || 0, voice: d.proj.voice || 0, video: d.proj.video || 0 };
    room.unread = room.waiting.chat + room.waiting.voice + room.waiting.video;
    saveRooms();
  }
  (d.unseen || []).concat(d.acked || []).forEach(function (u) { if (u && u.o === 'missed' && u.callId) cr2PillMissed(roomId, u); });
  cr2PresentCalls(roomId, d.calls || []);
  try { renderPanel(); } catch (_) {}
}
/* Durable missed outcome → one transcript pill, keyed by the call, never twice. */
function cr2PillMissed(roomId, u) {
  var pilled = cr2Pilled(); if (pilled[u.callId]) return;
  pilled[u.callId] = 1; lsSet('tb_cr2_pilled', pilled);
  var text = 'Missed ' + (u.kind === 'video' ? 'video' : 'voice') + ' call';
  try {
    if (S.roomId === roomId) addSysPill(text, 'miss-' + u.callId);
    else { var tr = loadTr(roomId); tr.push({ id: 'miss-' + u.callId, kind: 'sys', text: text, ts: u.ts || Date.now() }); lsSet(trKey(roomId), tr); }
    cr2Log('missed_pill', { room: roomId, callId: u.callId }, 'ok');
  } catch (e) { cr2Log('pill_failed', { e: String(e && e.message || e) }, 'error'); }
}
/* An active offered call, and the app visible: the existing Accept/Decline
   surface — once per call, never a second surface. */
function cr2PresentCalls(roomId, calls) {
  if (document.hidden) return;
  var room = roomById(roomId); if (!room || room.muted) return;
  calls.forEach(function (c) {
    if (!c || !c.callId || cr2State.rung[c.callId]) return;
    if (CALL.active || CALL.ringPending) return;
    cr2State.rung[c.callId] = 1;
    try { CALL.onIncoming(room, { type: 'call-start', kind: c.callKind, name: c.name || room.partnerName, callId: c.callId, from: c.from, eventId: c.id }); } catch (e) { cr2Log('present_failed', { e: String(e && e.message || e) }, 'error'); }
    cr2Log('call_presented', { room: roomId, callId: c.callId }, 'ok');
  });
}
/* ONE recovery coordinator: coalesced, single-flight, reconciliation per lane open. */
function cr2Recover(why) {
  cr2State.lastRecoverWhy = why;
  if (cr2State.recoverTimer) return;
  cr2State.recoverTimer = setTimeout(function () {
    cr2State.recoverTimer = null;
    if (cr2State.recovering) return;
    cr2State.recovering = true; cr2State.recoveries++;
    try {
      cr2Announce(cr2State.lastRecoverWhy);
      /* A lane that just opened has already reconciled; only a lane that was
         open before this recovery is asked again. */
      var settled = function (w) { return w && w.readyState === 1 && w._cr2OpenedAt && (Date.now() - w._cr2OpenedAt) > 500; };
      if (S.roomId) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (settled(ws)) { var explicit = !document.hidden && S.view === 'room'; cr2Send(S.roomId, { type: explicit ? 'ev-open' : 'events-sync' }); }
        else if (!ws || ws.readyState > 1) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; relayConnect(); }
      }
      LISTEN.sync();
      Object.keys(LISTEN.socks).forEach(function (id) { var lw = LISTEN.socks[id]; if (settled(lw)) cr2Send(id, { type: 'events-sync' }); });
      cr2Log('recover', { why: cr2State.lastRecoverWhy, n: cr2State.recoveries, inRoom: !!S.roomId }, 'ok');
    } catch (e) { cr2Log('recover_failed', { e: String(e && e.message || e) }, 'error'); }
    cr2State.recovering = false;
  }, 40);
}
/* A tap (warm: worker message; cold: #ev= hash) opens the exact event. */
function cr2RouteEvent(roomId, eventId, why) {
  var room = roomById(roomId);
  if (!room || room.deletedAt) { cr2Log('route_unknown', { room: roomId, why: why }, 'warn'); return false; }
  try { closePanel(); } catch (_) {}
  if (!(S.view === 'room' && S.roomId === roomId)) { cr2State.openPending[roomId] = 1; enterRoom(roomId); }
  else cr2Send(roomId, { type: 'ev-open' });
  cr2Log('route', { room: roomId, eventId: eventId || null, why: why }, 'ok');
  cr2Recover('route');
  return true;
}
/* G22: tell the worker which window is the installed app. Only an announced
   window may be focused by a tap. */
function cr2AnnounceWindow(why) {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      var target = (navigator.serviceWorker.controller) || (reg && reg.active);
      if (!target) { cr2Log('announce_window_no_worker', { why: why }, 'warn'); return; }
      target.postMessage({ t: 'tb-app', why: why, at: Date.now() });
      cr2Log('announce_window', { why: why }, 'ok');
    }).catch(function (e) { cr2Log('announce_window_failed', { e: String(e && e.message || e) }, 'error'); });
  } catch (e) { cr2Log('announce_window_failed', { e: String(e && e.message || e) }, 'error'); }
}
function cr2Heartbeat() {
  if (document.hidden) return;
  cr2Sockets().forEach(function (id) { cr2Send(id, cr2StateWord(id)); });
}

(function () {
  /* One socket per lane: a connect while the lane is still connecting is a duplicate, not a recovery. */
  var _cr2RelayConnect = relayConnect;
  relayConnect = function () {
    try {
      var room = activeRoom();
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && room && ws._cr2Room === room.id) { cr2Log('connect_coalesced', { room: room.id }); return; }
    } catch (_) {}
    var r = _cr2RelayConnect.apply(this, arguments);
    try {
      var cur = _relayWs, rid = S.roomId;
      if (cur && cur.addEventListener) { cur._cr2Room = rid; cur.addEventListener('open', function () { cr2OnOpen(rid, cur, function () { return cur === _relayWs && S.roomId === rid; }); }); }
    } catch (e) { cr2Log('hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* A lane that is already connecting is not reopened by a second signal. */
  var _cr2ReconnectNow = reconnectRelayNow;
  reconnectRelayNow = function (why) {
    try {
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && ws._cr2Room === S.roomId) { cr2Log('reconnect_coalesced', { why: why }); return false; }
    } catch (_) {}
    return _cr2ReconnectNow.apply(this, arguments);
  };
  var _cr2ListenOpen = LISTEN.open;
  LISTEN.open = function (room) {
    var r = _cr2ListenOpen.apply(this, arguments);
    try {
      var self = this, cur = this.socks[room.id];
      if (cur && cur.addEventListener) cur.addEventListener('open', function () { cr2OnOpen(room.id, cur, function () { return self.socks[room.id] === cur; }); });
    } catch (e) { cr2Log('listen_hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* The heartbeat carries the device's truth, so a suspended phone goes stale, never "watching". */
  var _cr2RelaySend = relaySend;
  relaySend = function (m) {
    try { if (m && m.type === 'ping') { var w = cr2StateWord(S.roomId); m.visible = w.visible; m.inRoom = w.inRoom; m.muted = w.muted; } } catch (_) {}
    return _cr2RelaySend.apply(this, arguments);
  };
  /* Relay answers ride each lane; they are the authority's word, not a peer's. */
  var _cr2HandleRelay = handleRelay;
  handleRelay = function (d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { if (S.roomId) cr2Apply(S.roomId, d); } catch (e) { cr2Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    var wasHidden = document.hidden;
    var r = _cr2HandleRelay.apply(this, arguments);
    try {
      if (d && d.from !== deviceId && d.eventId && cr2IsRecord(d) && d.type !== 'call-start' && !wasHidden && S.view === 'room' && S.roomId) cr2Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });
    } catch (e) { cr2Log('seen_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _cr2ListenHandle = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { cr2Apply(roomId, d); } catch (e) { cr2Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr2ListenHandle.apply(this, arguments);
  };
  /* Hidden: no ring. The relay asked the OS; return re-presents an active call once. */
  var _cr2OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    if (document.hidden) { cr2Log('ring_deferred_hidden', { room: room && room.id, callId: d && d.callId }, 'ok'); return; }
    if (d && d.callId) cr2State.rung[d.callId] = 1;
    return _cr2OnIncoming.apply(this, arguments);
  };
  /* The relay's missed outcome is the only source of a missed pill. */
  var _cr2BgAddPill = bgAddPill;
  bgAddPill = function (roomId, text) {
    if (typeof text === 'string' && text.indexOf('Missed ') === 0) { cr2Log('local_missed_pill_dropped', { room: roomId }); return; }
    return _cr2BgAddPill.apply(this, arguments);
  };
  var _cr2OsNotify = osNotify;
  osNotify = function (title, body, roomId) { cr2Log('os_notify_owned_by_relay', { room: roomId }); };
  osNotify._cr2Original = _cr2OsNotify;
  /* Display cache of the projection; never an increment. */
  var _cr2WaitingOf = waitingOf;
  waitingOf = function (r) { if (!r) return { chat: 0, voice: 0, video: 0 }; if (!r.waiting) r.waiting = { chat: 0, voice: 0, video: 0 }; return r.waiting; };
  waitingOf._cr2Original = _cr2WaitingOf;
  var _cr2BumpWaiting = bumpWaiting;
  bumpWaiting = function (r, kind) { cr2Log('bump_ignored', { room: r && r.id, kind: kind }); };
  bumpWaiting._cr2Original = _cr2BumpWaiting;
  /* Explicit open acknowledges the exact durable set. */
  var _cr2EnterRoom = enterRoom;
  enterRoom = function (id) {
    var before = S.roomId;
    var r = _cr2EnterRoom.apply(this, arguments);
    try {
      if (S.roomId === id) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (ws && ws.readyState === 1 && before === id) cr2Send(id, { type: 'ev-open' });
        else cr2State.openPending[id] = 1;
      }
    } catch (e) { cr2Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* A mute toggle is part of the device's truth; the relay hears it at once. */
  var _cr2SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _cr2SaveRooms.apply(this, arguments);
    try {
      var sig = S.rooms.map(function (x) { return x.id + ':' + (x.muted ? 1 : 0); }).join(',');
      if (cr2State.muteSig !== undefined && cr2State.muteSig !== sig) { clearTimeout(cr2State.muteTimer); cr2State.muteTimer = setTimeout(function () { cr2Announce('mute'); }, 100); }
      cr2State.muteSig = sig;
    } catch (_) {}
    return r;
  };
  /* G21: leaving a room opens that room's listener lane in the same action. */
  var _cr2Leave = leaveRoomInternals;
  leaveRoomInternals = function () {
    var left = S.roomId;
    var r = _cr2Leave.apply(this, arguments);
    try { LISTEN.sync(); cr2Log('leave_lane', { room: left }, 'ok'); cr2Recover('leave'); } catch (e) { cr2Log('leave_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _cr2OnVisible = onVisible;
  onVisible = function (why) {
    var r = _cr2OnVisible.apply(this, arguments);
    try { cr2Recover(why); } catch (_) {}
    return r;
  };
  var _cr2SwMessage = p4OnSwMessage;
  p4OnSwMessage = function (ev) {
    var d = ev && ev.data;
    if (d && d.t === 'tb-open' && d.roomId) { try { cr2RouteEvent(d.roomId, d.eventId || null, 'tap_warm'); } catch (e) { cr2Log('tap_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr2SwMessage.apply(this, arguments);
  };
  var _cr2Entry = p2Entry;
  p2Entry = function () {
    var r = _cr2Entry.apply(this, arguments);
    try {
      if (!p2IsStandalone() || cr2State.armed) return r;
      cr2State.armed = true;
      document.addEventListener('visibilitychange', function () { if (document.hidden) cr2Announce('hidden'); else { cr2Recover('visible'); cr2AnnounceWindow('visible'); } });
      cr2AnnounceWindow('boot');
      window.addEventListener('online', function () { cr2Recover('online'); });
      window.addEventListener('pageshow', function () { cr2Recover('pageshow'); });
      cr2State.hb = setInterval(cr2Heartbeat, 20000);
      var h = location.hash || '';
      if (h.indexOf('#ev=') === 0) {
        var parts = h.slice(4).split('.'); var roomId = decodeURIComponent(parts[0] || ''), eventId = decodeURIComponent(parts.slice(1).join('.') || '');
        try { history.replaceState(null, '', location.pathname); } catch (_) {}
        setTimeout(function () { cr2RouteEvent(roomId, eventId, 'tap_cold'); }, 0);
      }
      cr2Log('armed', {}, 'ok');
    } catch (e) { cr2Log('entry_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
