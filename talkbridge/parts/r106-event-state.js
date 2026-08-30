
/* ═══════════ R10.6 PART · recipient ledger, one presentation path, recovery ═══════════ */
var r106Event = {
  pending: {}, applied: {}, outcomes: {}, roomRecords: {}, reconcile: {},
  activeCallId: null, replyCallId: null, reconnect: { active: false, generation: 0 }
};
function r106EventLog(what, data, level) { try { log('r106_event_' + what, data || {}, level || 'info'); } catch (_) {} }
function r106Visible() {
  try { return !document.hidden && (!document.hasFocus || document.hasFocus()); } catch (_) { return !document.hidden; }
}
function r106Applied(roomId) {
  if (!r106Event.applied[roomId]) r106Event.applied[roomId] = lsGet('tb_r106_applied_' + roomId, {}) || {};
  return r106Event.applied[roomId];
}
function r106Outcomes(roomId) {
  if (!r106Event.outcomes[roomId]) r106Event.outcomes[roomId] = lsGet('tb_r106_outcomes_' + roomId, {}) || {};
  return r106Event.outcomes[roomId];
}
function r106RememberApplied(roomId, eventId) {
  var set = r106Applied(roomId); set[eventId] = Date.now();
  var ids = Object.keys(set); if (ids.length > 800) { ids.sort(function (a, b) { return set[a] - set[b]; }); for (var i = 0; i < ids.length - 800; i++) delete set[ids[i]]; }
  lsSet('tb_r106_applied_' + roomId, set);
}
function r106EventId(prefix) { return prefix + '-' + deviceId.slice(0, 8) + '-' + uid(); }
function r106PrepareOutgoing(m) {
  if (!m || !m.type) return m;
  if (m.type === 'chat-msg') m.eventId = m.eventId || ('chat:' + (m.chatId || r106EventId('cm')));
  if (m.type === 'thread-invite') m.eventId = m.eventId || r106EventId('th');
  if (m.type === 'call-start') {
    m.callId = m.callId || r106EventId('call');
    m.eventId = m.eventId || (m.callId + ':start');
    r106Event.activeCallId = m.callId; CALL.r106CallId = m.callId;
  }
  if (m.type === 'call-accept' || m.type === 'call-decline') {
    m.callId = m.callId || r106Event.replyCallId || CALL.r106CallId || r106Event.activeCallId;
    m.eventId = m.eventId || ((m.callId || r106EventId('call')) + ':' + (m.type === 'call-accept' ? 'accept' : 'decline'));
  }
  if (m.type === 'call-end') {
    m.callId = m.callId || CALL.r106CallId || r106Event.activeCallId || r106Event.replyCallId;
    m.eventId = m.eventId || ((m.callId || r106EventId('call')) + ':end');
  }
  return m;
}

var _r106RelaySend = relaySend;
relaySend = function (m) { return _r106RelaySend.call(this, r106PrepareOutgoing(m)); };
var _r106ListenSend = LISTEN.send;
LISTEN.send = function (roomId, m) { return _r106ListenSend.call(this, roomId, r106PrepareOutgoing(m)); };

/* Preserve the call identity after the base ring object is cleared. */
var _r106CallAccept = CALL.accept, _r106CallDecline = CALL.decline, _r106CallTeardown = CALL.teardown;
CALL.accept = function () {
  r106Event.replyCallId = this.ringPending && this.ringPending.r106CallId || this.r106CallId || r106Event.activeCallId;
  this.r106CallId = r106Event.replyCallId; return _r106CallAccept.apply(this, arguments);
};
CALL.decline = function () {
  r106Event.replyCallId = this.ringPending && this.ringPending.r106CallId || this.r106CallId || r106Event.activeCallId;
  this.r106CallId = r106Event.replyCallId; return _r106CallDecline.apply(this, arguments);
};
CALL.teardown = function () {
  var out = _r106CallTeardown.apply(this, arguments);
  setTimeout(function () { r106Event.activeCallId = null; r106Event.replyCallId = null; CALL.r106CallId = null; }, 0);
  return out;
};

function r106TransportSend(roomId, msg) {
  if (S.roomId === roomId && _relayWs && _relayWs.readyState === 1) return relaySend(msg);
  return LISTEN.send(roomId, msg);
}
function r106Route(roomId) {
  if (S.view === 'room' && S.roomId === roomId) return 'same_room';
  if (S.view === 'room') return 'other_room';
  return 'home';
}
function r106OnOffer(roomId, packet) {
  var ev = packet && packet.event; if (!ev || !ev.eventId) return;
  r106Event.pending[ev.eventId] = { roomId: roomId, event: ev };
  r106EventLog('offer', { eventId: ev.eventId, room: String(roomId).slice(-6), type: ev.type, visible: r106Visible(), route: r106Route(roomId) }, 'info');
  if (!r106Visible()) return;
  r106TransportSend(roomId, { type: 'foreground-ready', transient: true, eventId: ev.eventId, route: r106Route(roomId) });
}

var _r106BaseActiveHandle = handleRelay;
var _r106BaseListenHandle = LISTEN.handle;
function r106ApplyMessage(roomId, ev, allowAttention) {
  if (!ev || !ev.message || !ev.eventId) return false;
  var applied = r106Applied(roomId);
  if (applied[ev.eventId]) return true;
  var msg = ev.message;
  try {
    if (msg.type === 'call-start' && !allowAttention) { r106RememberApplied(roomId, ev.eventId); return true; }
    if (S.view === 'room' && S.roomId === roomId) _r106BaseActiveHandle(msg);
    else _r106BaseListenHandle.call(LISTEN, roomId, msg);
    if (msg.type === 'call-start' && CALL.ringPending) {
      CALL.ringPending.r106CallId = ev.callId || msg.callId || null;
      CALL.r106CallId = CALL.ringPending.r106CallId;
      r106Event.activeCallId = CALL.r106CallId;
    }
    r106RememberApplied(roomId, ev.eventId);
    r106EventLog('content_applied', { eventId: ev.eventId, type: ev.type, attention: !!allowAttention }, 'ok');
    return true;
  } catch (e) {
    r106EventLog('content_failed', { eventId: ev.eventId, name: e.name || 'Error' }, 'error'); return false;
  }
}
function r106OnDecision(roomId, packet) {
  var ev = packet && packet.event; if (!ev || !ev.eventId) return;
  delete r106Event.pending[ev.eventId];
  var owner = packet.presentation;
  var attention = owner === 'in_app';
  if (ev.type === 'chat-msg' || ev.type === 'thread-invite') r106ApplyMessage(roomId, ev, attention);
  else if (ev.type === 'call-start' && attention) r106ApplyMessage(roomId, ev, true);
  r106EventLog('presentation', { eventId: ev.eventId, presentation: owner, pushAccepted: packet.pushAccepted === true, pushStatus: packet.pushStatus || null }, owner === 'in_app' ? 'ok' : 'info');
  if (attention || (owner === 'suppressed' && r106Visible())) {
    var seen = ev.type === 'chat-msg' && r106Route(roomId) === 'same_room' && !(roomById(roomId) || {}).muted;
    r106TransportSend(roomId, { type: 'surface-ready', transient: true, eventId: ev.eventId, seen: seen, route: r106Route(roomId) });
  }
  r106ReconcileRoom(roomId, 'presentation');
}

handleRelay = function (d) {
  if (d && d.type === 'presentation-offer') { r106OnOffer(S.roomId, d); return; }
  if (d && d.type === 'presentation-decision') { r106OnDecision(S.roomId, d); return; }
  return _r106BaseActiveHandle.apply(this, arguments);
};
LISTEN.handle = function (roomId, d) {
  if (d && d.type === 'presentation-offer') { r106OnOffer(roomId, d); return; }
  if (d && d.type === 'presentation-decision') { r106OnDecision(roomId, d); return; }
  return _r106BaseListenHandle.apply(this, arguments);
};

function r106LedgerUrl(roomId, extra) {
  return r106SignalHttp(roomId) + '&ledger=1' + (extra || '');
}
function r106OutcomePill(roomId, rec) {
  if (!rec.callId || !rec.outcome || rec.outcome === 'ringing') return;
  var known = r106Outcomes(roomId), before = known[rec.callId];
  if (before === rec.outcome) return;
  known[rec.callId] = rec.outcome; lsSet('tb_r106_outcomes_' + roomId, known);
  if (rec.outcome === 'missed') bgAddPill(roomId, 'Missed ' + (rec.kind === 'video' ? 'video' : 'voice') + ' call');
  r106EventLog('call_outcome', { callId: rec.callId, outcome: rec.outcome, previous: before || null, room: String(roomId).slice(-6) }, 'info');
}
function r106Recount(roomId, records) {
  var room = roomById(roomId); if (!room) return;
  var counts = { chat: 0, voice: 0, video: 0 };
  for (var i = 0; i < records.length; i++) {
    var rec = records[i]; r106OutcomePill(roomId, rec);
    if (rec.seen) continue;
    if (rec.type === 'chat-msg') counts.chat++;
    if (rec.type === 'call-start' && rec.outcome === 'missed') counts[rec.kind === 'video' ? 'video' : 'voice']++;
  }
  var prior = waitingOf(room);
  room.waiting = counts; room.unread = counts.chat + counts.voice + counts.video; saveRooms();
  renderPanel();
  var total = 0;
  S.rooms.forEach(function (r) { total += waitingTotal(r); });
  try { if (navigator.setAppBadge) { if (total) navigator.setAppBadge(total); else if (navigator.clearAppBadge) navigator.clearAppBadge(); } } catch (_) {}
  r106EventLog('counter', { room: String(roomId).slice(-6), before: prior, after: counts, badge: total }, 'ok');
}
function r106ReconcileRoom(roomId, why) {
  if (!roomId || !roomById(roomId)) return Promise.resolve(null);
  if (r106Event.reconcile[roomId]) return r106Event.reconcile[roomId];
  r106EventLog('reconcile_start', { room: String(roomId).slice(-6), why: why }, 'info');
  r106Event.reconcile[roomId] = fetch(r106LedgerUrl(roomId)).then(function (r) {
    if (!r.ok) throw new Error('ledger-' + r.status); return r.json();
  }).then(function (data) {
    var records = Array.isArray(data.events) ? data.events : [];
    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      if (rec.message && (rec.type === 'chat-msg' || rec.type === 'thread-invite')) r106ApplyMessage(roomId, rec, false);
    }
    r106Event.roomRecords[roomId] = records;
    r106Recount(roomId, records);
    var appliedThrough = Number(data.lseq) || 0;
    r106EventLog('reconcile_complete', { room: String(roomId).slice(-6), events: records.length, appliedThrough: appliedThrough, complete: data.complete !== false }, 'ok');
    return { records: records, appliedThrough: appliedThrough };
  }).catch(function (e) {
    r106EventLog('reconcile_failed', { room: String(roomId).slice(-6), why: why, name: e.name || 'Error' }, 'error'); return null;
  }).finally(function () { delete r106Event.reconcile[roomId]; });
  return r106Event.reconcile[roomId];
}
function r106ReconcileAll(why) {
  return Promise.all(S.rooms.filter(function (r) { return !r.deletedAt; }).map(function (r) { return r106ReconcileRoom(r.id, why); }));
}
function r106SeenThrough(roomId, through, reason) {
  if (!through) return Promise.resolve(false);
  return r106SignalPost(roomId, { type: 'seen-through', through: through, reason: reason }).then(function (data) {
    r106EventLog('seen_through', { room: String(roomId).slice(-6), through: through, ok: !!(data && data.ok), reason: reason }, data && data.ok ? 'ok' : 'error');
    return r106ReconcileRoom(roomId, 'seen-ack');
  });
}

/* Muted rooms remain on TalkBridge home; mute suppresses attention, not state. */
homeCards = function () {
  var dismissed = homeDismissed();
  return S.rooms.filter(function (r) {
    if (r.deletedAt || !waitingTotal(r)) return false;
    var at = dismissed[r.id]; return typeof at !== 'number' || waitingTotal(r) > at;
  }).sort(function (a, b) { return (b.lastAt || b.createdAt) - (a.lastAt || a.createdAt); });
};

var _r106EnterForSeen = enterRoom;
enterRoom = function (id) {
  var out = _r106EnterForSeen.apply(this, arguments);
  r106ReconcileRoom(id, 'room-open').then(function (state) { if (state) r106SeenThrough(id, state.appliedThrough, 'explicit-room-open'); });
  return out;
};

/* Single-flight wrappers stop lifecycle, focus, and socket-close triggers from
   starting concurrent connections.  The ship transport still owns protocol
   setup; this guard owns attempt concurrency and reconciliation. */
var _r106RelayConnect = relayConnect;
relayConnect = function () {
  if (_relayWs && (_relayWs.readyState === 0 || _relayWs.readyState === 1)) {
    r106EventLog('reconnect_coalesced', { state: _relayWs.readyState }, 'info'); return _relayWs;
  }
  if (r106Event.reconnect.active) { r106EventLog('reconnect_coalesced', { state: 'active' }, 'info'); return; }
  r106Event.reconnect.active = true; r106Event.reconnect.generation++;
  var generation = r106Event.reconnect.generation;
  var out = _r106RelayConnect.apply(this, arguments), ws = _relayWs;
  if (ws && ws.addEventListener) {
    ws.addEventListener('open', function () {
      if (generation !== r106Event.reconnect.generation) return;
      r106Event.reconnect.active = false;
      r106ReconcileRoom(S.roomId, 'relay-open');
    });
    ws.addEventListener('close', function () { if (generation === r106Event.reconnect.generation) r106Event.reconnect.active = false; });
  } else r106Event.reconnect.active = false;
  return out;
};
var _r106ListenOpen = LISTEN.open;
LISTEN.open = function (room) {
  var existing = this.socks[room.id];
  if (existing && (existing.readyState === 0 || existing.readyState === 1)) return existing;
  var out = _r106ListenOpen.apply(this, arguments), ws = this.socks[room.id];
  if (ws && ws.addEventListener) ws.addEventListener('open', function () { r106ReconcileRoom(room.id, 'listener-open'); });
  return out;
};

function r106OpenEvent(roomId, eventId, source) {
  if (!roomId) return Promise.resolve(false);
  var url = r106SignalHttp(roomId) + '&event=' + encodeURIComponent(eventId || '');
  return fetch(url).then(function (r) { return r.json(); }).then(function (data) {
    var ev = data && data.event;
    if (S.roomId !== roomId || S.view !== 'room') enterRoom(roomId);
    if (ev && ev.type === 'call-start' && ev.outcome === 'ringing') r106ApplyMessage(roomId, ev, true);
    else if (ev) { r106ApplyMessage(roomId, ev, false); r106OutcomePill(roomId, ev); }
    r106EventLog('navigation', { eventId: eventId || null, room: String(roomId).slice(-6), source: source, target: ev && ev.outcome === 'ringing' ? 'call_screen' : 'room' }, 'ok');
    return r106ReconcileRoom(roomId, 'notification-navigation');
  }).catch(function (e) { r106EventLog('navigation_failed', { source: source, name: e.name || 'Error' }, 'error'); return false; });
}
function r106NavigationFromLocation() {
  var q; try { q = new URL(location.href); } catch (_) { return; }
  var roomId = q.searchParams.get('tbRoom'), eventId = q.searchParams.get('tbEvent');
  if (!roomId) return;
  q.searchParams.delete('tbRoom'); q.searchParams.delete('tbEvent'); q.searchParams.delete('tbType'); q.searchParams.delete('tbKind'); q.searchParams.delete('tbCall');
  history.replaceState(null, '', q.pathname + (q.search ? q.search : '') + q.hash);
  r106OpenEvent(roomId, eventId, 'cold-tap');
}

document.addEventListener('visibilitychange', function () { if (!document.hidden) r106ReconcileAll('visible'); });
window.addEventListener('focus', function () { r106ReconcileAll('focus'); });
if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.t === 'tb-open') r106OpenEvent(d.roomId, d.eventId, 'warm-tap');
  if (d.t === 'tb-receipts') r106EventLog('worker_receipts', { count: Array.isArray(d.records) ? d.records.length : 0 }, 'info');
});
document.addEventListener('DOMContentLoaded', function () {
  if (!r106Standalone()) return;
  setTimeout(function () { r106ReconcileAll('boot'); r106NavigationFromLocation(); }, 0);
});
