/* ═══════════ R10-CR3 PART · r10-cr3-event-state.js ═══════════ */
/* @contract  (plan v20.12.0 §4.13; §4.12 and §4.11 inherited)
   wraps: relayConnect, reconnectRelayNow, LISTEN.open, relaySend, handleRelay, LISTEN.handle,
          CALL.onIncoming, enterRoom, leaveRoomInternals, saveRooms, onVisible, p2Entry, p4OnSwMessage, bgAddPill,
          waitingOf, bumpWaiting
   replaces: osNotify — retained, never invoked: the relay's recipient-event
          record now owns every OS alert (a device-side alert beside a relay
          push is the buried double).
   adds:  cr3State, cr3Log, cr3Send, cr3StateWord, cr3Sockets, cr3Announce,
          cr3OnOpen, cr3Apply, cr3PresentCalls, cr3PillMissed, cr3Recover,
          cr3RouteEvent, cr3Heartbeat, cr3IsRecord, cr3Pilled, cr3AnnounceWindow, cr3Attended, cr3SetAttended
   wraps (added in CR3): CALL.keys
   G23: a device is "watching" only while visible AND focused. Window blur
        flips attendance off and is announced to the relay at once; focus or a
        visibility return flips it on and runs the one recovery. Nothing is
        acknowledged as seen while unattended, even in the event's room.
   §11: the call/transcription key resolver falls back to the unexpired
        granted set when memory and the device's own key are empty (own key
        wins; expired or cleared grant yields nothing).
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
var cr3State = { attended: (typeof document !== 'undefined') ? !document.hidden : true, armed: false, recovering: false, recoverTimer: null, lastRecoverWhy: null, rung: {}, openPending: {}, hb: null, sync: {}, recoveries: 0, opens: 0 };
function cr3Log(what, data, level) { try { log('cr3_' + what, data || {}, level || 'info'); } catch (_) {} }
function cr3IsRecord(d) { return !!(d && (d.type === 'chat-msg' || d.type === 'thread-invite' || d.type === 'call-start')); }
function cr3Pilled() { return lsGet('tb_cr3_pilled', {}); }

/* One word, one lane: the active room rides the relay socket, every other room its listener. */
function cr3Send(roomId, m) {
  try {
    if (S.roomId === roomId && typeof _relayWs !== 'undefined' && _relayWs && _relayWs.readyState === 1) { m.transient = true; return relaySend(m); }
    var ws = LISTEN.socks[roomId];
    if (ws && ws.readyState === 1) { m.transient = true; return LISTEN.send(roomId, m); }
  } catch (e) { cr3Log('send_failed', { e: String(e && e.message || e) }, 'error'); }
  return false;
}
/* G23: watching = visible AND focused. */
function cr3Attended() { return !document.hidden && cr3State.attended !== false; }
function cr3SetAttended(on, why) {
  var was = cr3State.attended;
  cr3State.attended = !!on;
  if (was !== cr3State.attended) cr3Log('attended', { on: cr3State.attended, why: why });
}
function cr3StateWord(roomId) {
  var room = roomById(roomId);
  var visible = cr3Attended();
  return { type: 'ev-state', visible: visible, inRoom: visible && S.view === 'room' && S.roomId === roomId, muted: !!(room && room.muted) };
}
function cr3Sockets() {
  var out = [];
  try { if (S.roomId && typeof _relayWs !== 'undefined' && _relayWs && _relayWs.readyState === 1) out.push(S.roomId); } catch (_) {}
  try { Object.keys(LISTEN.socks).forEach(function (id) { var ws = LISTEN.socks[id]; if (ws && ws.readyState === 1 && out.indexOf(id) < 0) out.push(id); }); } catch (_) {}
  return out;
}
/* The device's truth to every lane it holds. */
function cr3Announce(why) {
  cr3Sockets().forEach(function (id) { cr3Send(id, cr3StateWord(id)); });
  cr3Log('announce', { why: why, visible: cr3Attended(), lanes: cr3Sockets().length });
}
/* A lane opened: state first, then exactly one reconciliation. Visible in the
   routed room counts as the explicit open (§4.11.2). */
function cr3OnOpen(roomId, ws, current) {
  if (!current()) { cr3Log('open_stale', { room: roomId }, 'warn'); return; }
  cr3State.opens++; try { ws._cr3OpenedAt = Date.now(); } catch (_) {}
  cr3Send(roomId, cr3StateWord(roomId));
  var explicit = cr3Attended() && S.view === 'room' && S.roomId === roomId;
  if (explicit || cr3State.openPending[roomId]) { delete cr3State.openPending[roomId]; cr3Send(roomId, { type: 'ev-open' }); }
  else cr3Send(roomId, { type: 'events-sync' });
  cr3Log('lane_open', { room: roomId, explicit: explicit }, 'ok');
}
/* The relay's projection is the only count the home ever shows. */
function cr3Apply(roomId, d) {
  var room = roomById(roomId); if (!room) return;
  if (d.proj) {
    room.waiting = { chat: d.proj.chat || 0, voice: d.proj.voice || 0, video: d.proj.video || 0 };
    room.unread = room.waiting.chat + room.waiting.voice + room.waiting.video;
    saveRooms();
  }
  (d.unseen || []).concat(d.acked || []).forEach(function (u) { if (u && u.o === 'missed' && u.callId) cr3PillMissed(roomId, u); });
  cr3PresentCalls(roomId, d.calls || []);
  try { renderPanel(); } catch (_) {}
}
/* Durable missed outcome → one transcript pill, keyed by the call, never twice. */
function cr3PillMissed(roomId, u) {
  var pilled = cr3Pilled(); if (pilled[u.callId]) return;
  pilled[u.callId] = 1; lsSet('tb_cr3_pilled', pilled);
  var text = 'Missed ' + (u.kind === 'video' ? 'video' : 'voice') + ' call';
  try {
    if (S.roomId === roomId) addSysPill(text, 'miss-' + u.callId);
    else { var tr = loadTr(roomId); tr.push({ id: 'miss-' + u.callId, kind: 'sys', text: text, ts: u.ts || Date.now() }); lsSet(trKey(roomId), tr); }
    cr3Log('missed_pill', { room: roomId, callId: u.callId }, 'ok');
  } catch (e) { cr3Log('pill_failed', { e: String(e && e.message || e) }, 'error'); }
}
/* An active offered call, and the app visible: the existing Accept/Decline
   surface — once per call, never a second surface. */
function cr3PresentCalls(roomId, calls) {
  if (!cr3Attended()) return;
  var room = roomById(roomId); if (!room || room.muted) return;
  calls.forEach(function (c) {
    if (!c || !c.callId || cr3State.rung[c.callId]) return;
    if (CALL.active || CALL.ringPending) return;
    cr3State.rung[c.callId] = 1;
    try { CALL.onIncoming(room, { type: 'call-start', kind: c.callKind, name: c.name || room.partnerName, callId: c.callId, from: c.from, eventId: c.id }); } catch (e) { cr3Log('present_failed', { e: String(e && e.message || e) }, 'error'); }
    cr3Log('call_presented', { room: roomId, callId: c.callId }, 'ok');
  });
}
/* ONE recovery coordinator: coalesced, single-flight, reconciliation per lane open. */
function cr3Recover(why) {
  cr3State.lastRecoverWhy = why;
  if (cr3State.recoverTimer) return;
  cr3State.recoverTimer = setTimeout(function () {
    cr3State.recoverTimer = null;
    if (cr3State.recovering) return;
    cr3State.recovering = true; cr3State.recoveries++;
    try {
      cr3Announce(cr3State.lastRecoverWhy);
      /* A lane that just opened has already reconciled; only a lane that was
         open before this recovery is asked again. */
      var settled = function (w) { return w && w.readyState === 1 && w._cr3OpenedAt && (Date.now() - w._cr3OpenedAt) > 500; };
      if (S.roomId) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (settled(ws)) { var explicit = cr3Attended() && S.view === 'room'; cr3Send(S.roomId, { type: explicit ? 'ev-open' : 'events-sync' }); }
        else if (!ws || ws.readyState > 1) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; relayConnect(); }
      }
      LISTEN.sync();
      Object.keys(LISTEN.socks).forEach(function (id) { var lw = LISTEN.socks[id]; if (settled(lw)) cr3Send(id, { type: 'events-sync' }); });
      cr3Log('recover', { why: cr3State.lastRecoverWhy, n: cr3State.recoveries, inRoom: !!S.roomId }, 'ok');
    } catch (e) { cr3Log('recover_failed', { e: String(e && e.message || e) }, 'error'); }
    cr3State.recovering = false;
  }, 40);
}
/* A tap (warm: worker message; cold: #ev= hash) opens the exact event. */
function cr3RouteEvent(roomId, eventId, why) {
  var room = roomById(roomId);
  if (!room || room.deletedAt) { cr3Log('route_unknown', { room: roomId, why: why }, 'warn'); return false; }
  if (!document.hidden) cr3SetAttended(true, why);   /* a tap on our own alert is the user arriving */
  try { closePanel(); } catch (_) {}
  if (!(S.view === 'room' && S.roomId === roomId)) { cr3State.openPending[roomId] = 1; enterRoom(roomId); }
  else cr3Send(roomId, { type: 'ev-open' });
  cr3Log('route', { room: roomId, eventId: eventId || null, why: why }, 'ok');
  cr3Recover('route');
  return true;
}
/* G22: tell the worker which window is the installed app. Only an announced
   window may be focused by a tap. */
function cr3AnnounceWindow(why) {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      var target = (navigator.serviceWorker.controller) || (reg && reg.active);
      if (!target) { cr3Log('announce_window_no_worker', { why: why }, 'warn'); return; }
      target.postMessage({ t: 'tb-app', why: why, at: Date.now() });
      cr3Log('announce_window', { why: why }, 'ok');
    }).catch(function (e) { cr3Log('announce_window_failed', { e: String(e && e.message || e) }, 'error'); });
  } catch (e) { cr3Log('announce_window_failed', { e: String(e && e.message || e) }, 'error'); }
}
function cr3Heartbeat() {
  if (!cr3Attended()) return;
  cr3Sockets().forEach(function (id) { cr3Send(id, cr3StateWord(id)); });
}

(function () {
  /* One socket per lane: a connect while the lane is still connecting is a duplicate, not a recovery. */
  var _cr3RelayConnect = relayConnect;
  relayConnect = function () {
    try {
      var room = activeRoom();
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && room && ws._cr3Room === room.id) { cr3Log('connect_coalesced', { room: room.id }); return; }
    } catch (_) {}
    var r = _cr3RelayConnect.apply(this, arguments);
    try {
      var cur = _relayWs, rid = S.roomId;
      if (cur && cur.addEventListener) { cur._cr3Room = rid; cur.addEventListener('open', function () { cr3OnOpen(rid, cur, function () { return cur === _relayWs && S.roomId === rid; }); }); }
    } catch (e) { cr3Log('hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* A lane that is already connecting is not reopened by a second signal. */
  var _cr3ReconnectNow = reconnectRelayNow;
  reconnectRelayNow = function (why) {
    try {
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 0 && ws._cr3Room === S.roomId) { cr3Log('reconnect_coalesced', { why: why }); return false; }
    } catch (_) {}
    return _cr3ReconnectNow.apply(this, arguments);
  };
  var _cr3ListenOpen = LISTEN.open;
  LISTEN.open = function (room) {
    var r = _cr3ListenOpen.apply(this, arguments);
    try {
      var self = this, cur = this.socks[room.id];
      if (cur && cur.addEventListener) cur.addEventListener('open', function () { cr3OnOpen(room.id, cur, function () { return self.socks[room.id] === cur; }); });
    } catch (e) { cr3Log('listen_hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* The heartbeat carries the device's truth, so a suspended phone goes stale, never "watching". */
  var _cr3RelaySend = relaySend;
  relaySend = function (m) {
    try { if (m && m.type === 'ping') { var w = cr3StateWord(S.roomId); m.visible = w.visible; m.inRoom = w.inRoom; m.muted = w.muted; } } catch (_) {}
    return _cr3RelaySend.apply(this, arguments);
  };
  /* Relay answers ride each lane; they are the authority's word, not a peer's. */
  var _cr3HandleRelay = handleRelay;
  handleRelay = function (d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { if (S.roomId) cr3Apply(S.roomId, d); } catch (e) { cr3Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    var wasAttended = cr3Attended();
    var r = _cr3HandleRelay.apply(this, arguments);
    try {
      if (d && d.from !== deviceId && d.eventId && cr3IsRecord(d) && d.type !== 'call-start' && wasAttended && S.view === 'room' && S.roomId) cr3Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });
    } catch (e) { cr3Log('seen_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _cr3ListenHandle = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { cr3Apply(roomId, d); } catch (e) { cr3Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr3ListenHandle.apply(this, arguments);
  };
  /* Hidden: no ring. The relay asked the OS; return re-presents an active call once. */
  var _cr3OnIncoming = CALL.onIncoming;
  CALL.onIncoming = function (room, d) {
    if (!cr3Attended()) { cr3Log('ring_deferred_hidden', { room: room && room.id, callId: d && d.callId }, 'ok'); return; }
    if (d && d.callId) cr3State.rung[d.callId] = 1;
    return _cr3OnIncoming.apply(this, arguments);
  };
  /* The relay's missed outcome is the only source of a missed pill. */
  var _cr3BgAddPill = bgAddPill;
  bgAddPill = function (roomId, text) {
    if (typeof text === 'string' && text.indexOf('Missed ') === 0) { cr3Log('local_missed_pill_dropped', { room: roomId }); return; }
    return _cr3BgAddPill.apply(this, arguments);
  };
  var _cr3OsNotify = osNotify;
  osNotify = function (title, body, roomId) { cr3Log('os_notify_owned_by_relay', { room: roomId }); };
  osNotify._cr3Original = _cr3OsNotify;
  /* Display cache of the projection; never an increment. */
  var _cr3WaitingOf = waitingOf;
  waitingOf = function (r) { if (!r) return { chat: 0, voice: 0, video: 0 }; if (!r.waiting) r.waiting = { chat: 0, voice: 0, video: 0 }; return r.waiting; };
  waitingOf._cr3Original = _cr3WaitingOf;
  var _cr3BumpWaiting = bumpWaiting;
  bumpWaiting = function (r, kind) { cr3Log('bump_ignored', { room: r && r.id, kind: kind }); };
  bumpWaiting._cr3Original = _cr3BumpWaiting;
  /* Explicit open acknowledges the exact durable set. */
  var _cr3EnterRoom = enterRoom;
  enterRoom = function (id) {
    var before = S.roomId;
    var r = _cr3EnterRoom.apply(this, arguments);
    try {
      if (S.roomId === id) {
        var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
        if (ws && ws.readyState === 1 && before === id) cr3Send(id, { type: 'ev-open' });
        else cr3State.openPending[id] = 1;
      }
    } catch (e) { cr3Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* A mute toggle is part of the device's truth; the relay hears it at once. */
  var _cr3SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _cr3SaveRooms.apply(this, arguments);
    try {
      var sig = S.rooms.map(function (x) { return x.id + ':' + (x.muted ? 1 : 0); }).join(',');
      if (cr3State.muteSig !== undefined && cr3State.muteSig !== sig) { clearTimeout(cr3State.muteTimer); cr3State.muteTimer = setTimeout(function () { cr3Announce('mute'); }, 100); }
      cr3State.muteSig = sig;
    } catch (_) {}
    return r;
  };
  /* G21: leaving a room opens that room's listener lane in the same action. */
  var _cr3Leave = leaveRoomInternals;
  leaveRoomInternals = function () {
    var left = S.roomId;
    var r = _cr3Leave.apply(this, arguments);
    try { LISTEN.sync(); cr3Log('leave_lane', { room: left }, 'ok'); cr3Recover('leave'); } catch (e) { cr3Log('leave_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  /* §11: the granted set is on disk for 30 days; the resolver never read it.
     Own key wins; memory wins; the unexpired grant fills what is empty. */
  var _cr3Keys = CALL.keys;
  CALL.keys = function () {
    var k = _cr3Keys.apply(this, arguments) || {};
    try {
      if (k.dg && k.tid && k.tok) return k;
      var rec = (typeof grantRecord === 'function') ? grantRecord() : null;
      if (!rec || (typeof grantExpired === 'function' && grantExpired(rec))) return k;
      var g = (typeof grantedCreds === 'function') ? grantedCreds() : null;
      if (!g) return k;
      var out = { dg: k.dg || g.dg || '', tid: k.tid || g.tid || '', tok: k.tok || g.tok || '' };
      if (!k.dg && out.dg && !cr3State.grantUsedLogged) { cr3State.grantUsedLogged = true; cr3Log('grant_keys_used', { room: S.roomId }, 'ok'); }
      return out;
    } catch (e) { cr3Log('grant_keys_failed', { e: String(e && e.message || e) }, 'error'); return k; }
  };
  var _cr3OnVisible = onVisible;
  onVisible = function (why) {
    var r = _cr3OnVisible.apply(this, arguments);
    try { cr3Recover(why); } catch (_) {}
    return r;
  };
  var _cr3SwMessage = p4OnSwMessage;
  p4OnSwMessage = function (ev) {
    var d = ev && ev.data;
    if (d && d.t === 'tb-open' && d.roomId) { try { cr3RouteEvent(d.roomId, d.eventId || null, 'tap_warm'); } catch (e) { cr3Log('tap_failed', { e: String(e && e.message || e) }, 'error'); } return; }
    return _cr3SwMessage.apply(this, arguments);
  };
  var _cr3Entry = p2Entry;
  p2Entry = function () {
    var r = _cr3Entry.apply(this, arguments);
    try {
      if (!p2IsStandalone() || cr3State.armed) return r;
      cr3State.armed = true;
      document.addEventListener('visibilitychange', function () { if (document.hidden) { cr3SetAttended(false, 'hidden'); cr3Announce('hidden'); } else { cr3SetAttended(true, 'visible'); cr3Recover('visible'); cr3AnnounceWindow('visible'); } });
      /* G23: blur is the reliable "left the app" signal on iOS; announce it at once. */
      window.addEventListener('blur', function () { cr3SetAttended(false, 'blur'); cr3Announce('blur'); });
      window.addEventListener('focus', function () { if (!document.hidden) { cr3SetAttended(true, 'focus'); cr3Recover('focus'); } });
      cr3AnnounceWindow('boot');
      window.addEventListener('online', function () { cr3Recover('online'); });
      window.addEventListener('pageshow', function () { cr3Recover('pageshow'); });
      cr3State.hb = setInterval(cr3Heartbeat, 20000);
      var h = location.hash || '';
      if (h.indexOf('#ev=') === 0) {
        var parts = h.slice(4).split('.'); var roomId = decodeURIComponent(parts[0] || ''), eventId = decodeURIComponent(parts.slice(1).join('.') || '');
        try { history.replaceState(null, '', location.pathname); } catch (_) {}
        setTimeout(function () { cr3RouteEvent(roomId, eventId, 'tap_cold'); }, 0);
      }
      cr3Log('armed', {}, 'ok');
    } catch (e) { cr3Log('entry_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
