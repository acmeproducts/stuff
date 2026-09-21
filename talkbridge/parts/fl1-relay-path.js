/* ═══════════ GAP PART · FL1-relay-path.js ═══════════ */
/* @contract
   replaces: relaySend, relayConnect, reconnectRelayNow, LISTEN.open, LISTEN.handle, handleRelay
   wraps: (none)
   adds: handleRelayCore, listenHandleCore
   licence: §0c-1 (owner, 2026-09-21) — flattening, cluster 1: the relay path
*/
/* ─────────────────────────────────────────────────────────────────────────────
   FL-1 · THE RELAY PATH, ONE FUNCTION PER SYMBOL (§7.16 cluster 1)

   Every layer that used to wrap these six symbols is REMOVED from the base
   bytes (each one banked, byte for byte, under talkbridge/fixtures/flatten/28b/
   and named in removals.json) and its effect is written here, in the order
   the stack ran it: a wrapper's "before" work top-down, the base body, then
   every "after" work bottom-up. An early return inside one layer skipped the
   layers beneath it but never the "after" work of the layers above it; that
   shape is kept exactly, which is why some blocks are guarded by a flag
   rather than by a return.

   NOTHING NEW. Same log lines, same order, same messages on the wire, same
   early exits, same swallowed errors. What was odd stays odd and is recorded
   in the plan's open defects (0d), not fixed here (§0c-1 b).

   Layer order that this file reproduces (outermost first):
     relaySend        K4 stamp → CR3 ping word → base → C1 queue
     relayConnect     CR3 coalesce guard → base → T-net close log → CR3 open hook → V2 ramp
     reconnectRelayNow  CR3 coalesce guard → T-net body
     LISTEN.open      base → CR3 open hook
     LISTEN.handle    CR3 records → P6 threads (after) → M rename → L lifecycle → R unread count (around) → base
     handleRelay      PR3 presence → CR3 records (around) → P6 threads (after) → P4 alerts (after)
                      → R8b typing/name log → S receipts (after) → M rename → L lifecycle → base
   ───────────────────────────────────────────────────────────────────────────── */

/* ── relaySend ─────────────────────────────────────────────────────────────── */
var C1_TRIES = 40;   /* × 200 ms = 8 s; the observed outage is ~4 s */
function c1Mark(m, v) {
  try { Object.defineProperty(m, '_c1', { value: v, enumerable: false, configurable: true, writable: true }); }
  catch (_) { m._c1 = v; }
}
function c1KindOf(m) {
  try {
    var s = m.signal || {};
    if (s.description) return s.description.type || 'description';
    if (s.candidate) return 'candidate';
    if (s.restart) return 'restart';
  } catch (_) {}
  return 'other';
}
function relaySend(m) {
  /* K4 · a rename pill carries the stamp its sender remembers */
  if (m && m.type === 'sys-pill' && typeof m.newRoomName === 'string') {
    m.ts = m.ts || Date.now();
    var r0 = activeRoom();
    if (r0 && r0.title === m.newRoomName) { r0.titleTs = m.ts; try { saveRooms(); } catch (_) {} }
  }
  /* CR3 · the heartbeat carries the device's truth */
  try { if (m && m.type === 'ping') { var w = cr3StateWord(S.roomId); m.visible = w.visible; m.inRoom = w.inRoom; m.muted = w.muted; } } catch (_) {}
  /* base */
  var ok = false;
  if (_relayWs && _relayWs.readyState === 1) {
    m.session = S.roomId; m.from = deviceId; m.ts = m.ts || Date.now(); m.seq = ++seq;
    try { _relayWs.send(JSON.stringify(m)); ok = true; } catch (_) { ok = false; }
  }
  /* C1 · a dropped signal is queued, once, and flushed when the socket is back */
  try {
    if (m && m.type === 'webrtc-signal') {
      if (!ok && !m._c1) {
        c1Mark(m, { t: Date.now(), kind: c1KindOf(m) });
        log('c1_queued', { kind: m._c1.kind }, 'warn');
        relaySendWhenOpen(m, C1_TRIES);
      } else if (ok && m._c1 && !m._c1.done) {
        m._c1.done = true;
        log('c1_flushed', { kind: m._c1.kind, ms: Date.now() - m._c1.t }, 'ok');
      }
    }
  } catch (_) {}
  return ok;
}

/* ── relayConnect ──────────────────────────────────────────────────────────── */
var V2_RAMP = [300, 600, 1200, 2000];
var _v2Attempt = 0;
var _v2Timer = null;
function v2Schedule(why) {
  var ms = V2_RAMP[Math.min(_v2Attempt, V2_RAMP.length - 1)];
  _v2Attempt++;
  clearTimeout(_v2Timer);
  _v2Timer = setTimeout(function () {
    _v2Timer = null;
    if (S.view !== 'room' || !S.roomId) return;
    try { log('v2_retry', { n: _v2Attempt, ms: ms, why: why }, 'warn'); } catch (_) {}
    relayConnect();
  }, ms);
}
function relayConnect() {
  /* CR3 · a connect while the lane is still connecting is a duplicate, not a recovery */
  try {
    var room0 = activeRoom();
    var ws0 = (typeof _relayWs !== 'undefined') ? _relayWs : null;
    if (ws0 && ws0.readyState === 0 && room0 && ws0._cr3Room === room0.id) { cr3Log('connect_coalesced', { room: room0.id }); return; }
  } catch (_) {}
  /* base */
  var room = activeRoom();
  if (room) {
    if (_relayWs) try { _relayWs.close(); } catch (_) {}
    var ws = new WebSocket(RELAY_WS + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(room.id) + '&client=' + encodeURIComponent(deviceId));
    _relayWs = ws;
    ws.onopen = function () {
      if (ws !== _relayWs) return;
      log('relay_open', { room: room.id }, 'ok');
      relaySend({ type: 'hello', lang: room.myLang, targetLang: room.theirLang, role: room.role, name: room.myName || S.user.name });
      startHB();
      resendUndelivered();
      _relayReconnecting = false; renderPartnerState();
    };
    ws.onmessage = function (e) { try { handleRelay(JSON.parse(e.data)); } catch (_) {} };
    ws.onclose = function (ev) {
      if (ws !== _relayWs) return;
      log('relay_close', { code: ev.code }, 'warn'); stopHB(); clearTimeout(wsReconnectTimer);
      if (S.view === 'room' && S.roomId) {
        _relayReconnecting = true; renderPartnerState();
        wsReconnectTimer = setTimeout(function () { wsReconnectTimer = null; if (S.view === 'room') relayConnect(); }, 2000);
      }
    };
    ws.onerror = function () { log('relay_err', {}, 'error'); };
  }
  /* The three "after" blocks below ran on whatever `_relayWs` held, even when
     the base returned early for want of a room — kept as it was (0d D-11). */
  /* T-net · how long the socket lived */
  try {
    if (typeof _relayWs !== 'undefined' && _relayWs && _relayWs.addEventListener) {
      var openedAt = Date.now();
      _relayWs.addEventListener('close', function (ev) {
        netLog('relay_closed', { code: ev.code, livedMs: Date.now() - openedAt, hidden: !!document.hidden }, 'warn');
      });
    }
  } catch (_) {}
  /* CR3 · the lane announces itself when it opens */
  try {
    var cur = _relayWs, rid = S.roomId;
    if (cur && cur.addEventListener) { cur._cr3Room = rid; cur.addEventListener('open', function () { cr3OnOpen(rid, cur, function () { return cur === _relayWs && S.roomId === rid; }); }); }
  } catch (e) { cr3Log('hook_failed', { e: String(e && e.message || e) }, 'error'); }
  /* V2 · the socket comes back as fast as the network does */
  try {
    var ws2 = _relayWs;
    if (ws2 && !ws2.__v2) {
      ws2.__v2 = true;
      ws2.addEventListener('open', function () {
        if (ws2 !== _relayWs) return;
        _v2Attempt = 0;
        clearTimeout(_v2Timer); _v2Timer = null;
      });
      ws2.addEventListener('close', function () {
        if (ws2 !== _relayWs) return;                /* a replaced socket is not ours to retry */
        if (S.view !== 'room' || !S.roomId) return;
        /* the base onclose has already armed its 2 s timer by now (it was
           registered first); take it over so exactly one retry is pending */
        clearTimeout(wsReconnectTimer); wsReconnectTimer = null;
        v2Schedule('close');
      });
    }
  } catch (_) {}
}

/* ── reconnectRelayNow ─────────────────────────────────────────────────────── */
function reconnectRelayNow(why) {
  /* CR3 · a lane that is already connecting is not reopened by a second signal */
  try {
    var ws0 = (typeof _relayWs !== 'undefined') ? _relayWs : null;
    if (ws0 && ws0.readyState === 0 && ws0._cr3Room === S.roomId) { cr3Log('reconnect_coalesced', { why: why }); return false; }
  } catch (_) {}
  /* T-net */
  try {
    var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
    var state = ws ? ws.readyState : -1;
    if (state === 1) { netLog('relay_ok', { why: why }, 'ok'); return false; }
    NET.reconnects++;
    netLog('relay_reconnecting', { why: why, state: state, n: NET.reconnects }, 'warn');
    if (ws) { try { ws.close(); } catch (_) {} }
    relayConnect();
    return true;
  } catch (e) { netLog('relay_reconnect_failed', { e: String(e && e.message || e) }, 'error'); return false; }
}

/* ── LISTEN.open ───────────────────────────────────────────────────────────── */
LISTEN.open = function (room) {
  /* base */
  var self = this;
  var ws = new WebSocket(RELAY_WS + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(room.id) + '&client=' + encodeURIComponent(deviceId));
  this.socks[room.id] = ws;
  ws.onopen = function () { self.send(room.id, { type: 'hello', lang: room.myLang, targetLang: room.theirLang, role: room.role, name: room.myName || S.user.name }); log('listen_open', { room: room.id }); };
  ws.onmessage = function (e) { try { self.handle(room.id, JSON.parse(e.data)); } catch (_) {} };
  ws.onclose = function () {
    if (self.socks[room.id] === ws) {
      delete self.socks[room.id];
      setTimeout(function () { if (!self.socks[room.id] && room.id !== S.roomId && roomById(room.id) && !roomById(room.id).deletedAt) self.open(roomById(room.id)); }, 15000);
    }
  };
  ws.onerror = function () {};
  /* CR3 · the lane announces itself when it opens */
  try {
    var cur = this.socks[room.id];
    if (cur && cur.addEventListener) cur.addEventListener('open', function () { cr3OnOpen(room.id, cur, function () { return self.socks[room.id] === cur; }); });
  } catch (e) { cr3Log('listen_hook_failed', { e: String(e && e.message || e) }, 'error'); }
};

/* ── LISTEN.handle ─────────────────────────────────────────────────────────── */
function listenHandleCore(self, roomId, d) {
  /* base, verbatim; `this` became `self` */
  if (!d || d.from === deviceId) return;
  var room = roomById(roomId); if (!room) return;
  if (d.type === 'ping') { self.send(roomId, { type: 'pong', transient: true }); return; }
  if (d.type === 'hello') {
    if (d.name && d.name !== room.partnerName) { room.partnerName = d.name; saveRooms(); renderPanel(); }
    if (!room.joined) { room.joined = true; saveRooms(); }
    self.send(roomId, { type: 'hello-ack', transient: true, name: room.myName || S.user.name });
    return;
  }
  if (d.type === 'chat-msg') {
    if (!d.chatId) return;
    var tr = loadTr(roomId);
    if (_chatReceived.has(d.chatId) || tr.some(function (x) { return x.id === d.chatId; })) { self.send(roomId, { type: 'chat-ack', chatId: d.chatId, transient: true }); return; }
    _chatReceived.add(d.chatId);
    self.send(roomId, { type: 'chat-ack', chatId: d.chatId, transient: true });
    if (d.senderName && d.senderName !== room.partnerName) { room.partnerName = d.senderName; }
    tr.push({ id: d.chatId, kind: 'chat', who: 'partner', sourceText: norm(d.srcText || ''), translatedText: norm(d.tgtText || d.srcText || ''),
      srcLang: d.srcLang || room.theirLang, tgtLang: d.tgtLang || room.myLang, ts: d.ts || Date.now(),
      senderName: d.senderName || room.partnerName || 'Partner', origin: d.origin || 'typed', attachment: d.attachment || null });
    lsSet(trKey(roomId), tr);
    room.unread = (room.unread || 0) + 1; room.lastAt = Date.now(); saveRooms(); renderPanel();
    if (!room.muted) osNotify((d.senderName || room.partnerName || 'New message') + ' · TalkBridge', norm(d.tgtText || d.srcText || ''), roomId);
    log('bg_chat_rx', { room: roomId }, 'ok');
    return;
  }
  if (d.type === 'sys-pill') {
    if (d.newName) { room.partnerName = d.newName; saveRooms(); renderPanel(); }
    var tr2 = loadTr(roomId);
    if (d.pillId && tr2.some(function (x) { return x.id === d.pillId; })) return;
    tr2.push({ id: d.pillId || ('sp-' + uid()), kind: 'sys', text: d.text || '', ts: Date.now() });
    lsSet(trKey(roomId), tr2); return;
  }
  if (d.type === 'call-start') { CALL.onIncoming(room, d); return; }
  if (d.type === 'call-end') {
    if (CALL.ringPending && CALL.ringPending.roomId === roomId) { var mk = CALL.ringPending.kind === 'video' ? 'video' : 'voice'; CALL.stopRing(); CALL.ringPending = null; bgAddPill(roomId, 'Missed ' + mk + ' call'); room.unread = (room.unread || 0) + 1; saveRooms(); renderPanel(); if (!room.muted) osNotify((d.name || room.partnerName || 'TalkBridge'), 'Missed ' + mk + ' call', roomId); }
    return;
  }
}
LISTEN.handle = function (roomId, d) {
  /* CR3 · relay answers ride each lane; they are the authority's word, not a peer's */
  if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { cr3Apply(roomId, d); } catch (e) { cr3Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
  /* M · a rename is applied before the message is handled */
  try { if (d) onRoomNameSignal(roomId, d); } catch (_) {}
  /* L · a lifecycle signal is taken here and goes no deeper */
  var lifecycleTook = false;
  try { if (d && onLifecycleSignal(roomId, d)) lifecycleTook = true; } catch (_) {}
  var r;
  if (!lifecycleTook) {
    /* R · the unread count is read before, and the waiting mark set after */
    var room = roomById(roomId);
    var before = (room && room.unread) || 0;
    /* the pending ring is cleared inside the base, so its kind is read now */
    var ringKind = (CALL.ringPending && CALL.ringPending.roomId === roomId)
      ? (CALL.ringPending.kind === 'video' ? 'video' : 'voice') : null;
    r = listenHandleCore(this, roomId, d);
    try {
      if (room && (room.unread || 0) > before) {
        room.unread = before;
        var kind = (d && d.type === 'call-end' && ringKind) ? ringKind : 'chat';
        bumpWaiting(room, kind);
        saveRooms();
        renderPanel();
      }
    } catch (e) { rcLog('listen_count_failed', { e: String(e && e.message || e) }, 'error'); }
  }
  /* P6 · threads, after the message is handled */
  try {
    if (d && d.from !== deviceId) {
      if (d.type === 'thread-invite') p6OnInvite(roomId, d);
      else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(roomId, d);
      else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(roomId);
    }
  } catch (e) { p6Log('listen_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
};

/* ── handleRelay ───────────────────────────────────────────────────────────── */
function handleRelayCore(d) {
  /* base, verbatim */
  if (!d || d.from === deviceId) return;
  var room = activeRoom(); if (!room) return;
  touchPresence();
  if (d.type === 'hello') {
    if (d.name && d.name !== room.partnerName) { room.partnerName = d.name; saveRooms(); renderRoomHead(); renderPanel(); }
    if (!room.joined) { room.joined = true; saveRooms(); addSysPill((room.partnerName || 'Partner') + ' joined'); renderInviteCard(); }
    relaySend({ type: 'hello-ack', transient: true, name: room.myName || S.user.name });
    resendUndelivered();
    sendHistorySync(room);
    if (CALL.active && room.role === 'creator') CALL.resendOffer();
    return;
  }
  if (d.type === 'hello-ack') {
    if (d.name && d.name !== room.partnerName) { room.partnerName = d.name; saveRooms(); renderRoomHead(); renderPanel(); }
    if (!room.joined) { room.joined = true; saveRooms(); renderInviteCard(); }
    sendHistorySync(room);
    return;
  }
  if (d.type === 'ping') { relaySend({ type: 'pong', transient: true }); return; }
  if (d.type === 'pong') return;
  if (d.type === 'chat-ack') {
    var e = transcript.find(function (x) { return x.id === d.chatId; });
    if (e && e.receipt === 'sent') { e.receipt = 'delivered'; e.deliveredAt = Date.now(); saveTr(); updateReceiptDom(e); }
    return;
  }
  if (d.type === 'chat-read') {
    (d.ids || []).forEach(function (id) {
      var e2 = transcript.find(function (x) { return x.id === id; });
      if (e2 && e2.receipt !== 'read') { e2.receipt = 'read'; e2.readAt = Date.now(); updateReceiptDom(e2); }
    });
    saveTr(); return;
  }
  if (d.type === 'call-start') { CALL.onIncoming(room, d); return; }
  if (d.type === 'call-accept') { CALL.onAccepted(room, d); return; }
  if (d.type === 'call-decline') { CALL.onDeclined(room, d); return; }
  if (d.type === 'call-end') { CALL.onRemoteEnd(room, d); return; }
  if (d.type === 'webrtc-signal') { CALL.onSignal(d); return; }
  if (d.type === 'subtitle') { onRemoteSubtitle(d, room); return; }
  if (d.type === 'subtitle-update') { onRemoteSubtitleUpdate(d, room); return; }
  if (d.type === 'mic-state') { CALL.remoteMic(d.micOn !== false); return; }
  if (d.type === 'cam-state') { CALL.remoteCam(d.camOn !== false); return; }
  if (d.type === 'chat-msg') { handleChatMsg(d, room); return; }
  if (d.type === 'history-sync') { mergeHistorySyncChunk(d, room); return; }
  if (d.type === 'sys-pill') {
    if (d.pillId && transcript.some(function (x) { return x.id === d.pillId; })) return;
    if (d.newName) { room.partnerName = d.newName; saveRooms(); renderRoomHead(); renderPanel(); }
    addSysPill(d.text || '', d.pillId);
    return;
  }
}
function handleRelay(d) {
  /* PR3 · the relay's peer count is the presence dot; nothing else sees it */
  if (d && d.type === 'peer') {
    var present = !!(d.others > 0);
    try { setPresence(present); } catch (_) {}
    try { if (typeof log === 'function') log('pr3_dot', { others: d.others || 0 }, 'ok'); } catch (_) {}
    return;
  }
  /* CR3 · relay answers ride each lane; they are the authority's word, not a peer's */
  if (d && (d.type === 'ev-proj' || d.type === 'ev-reply')) { try { if (S.roomId) cr3Apply(S.roomId, d); } catch (e) { cr3Log('apply_failed', { e: String(e && e.message || e) }, 'error'); } return; }
  var wasAttended = cr3Attended();
  /* R8b · name evidence, typing indicator; a typing message goes no deeper */
  var typingTook = false;
  try {
    if (d && (d.name || d.newName || d.senderName)) {
      try {
        var _room = activeRoom();
        r8Log('name_msg', { type: d.type, name: d.name || d.newName || d.senderName, had: _room ? _room.partnerName : null }, 'ok');
      } catch (_) {}
    }
    if (d && d.type === 'typing') {
      var room = activeRoom();
      showTyping(room && room.partnerName);
      typingTook = true;                       /* never reaches the transcript */
    } else if (d && (d.type === 'chat-msg' || d.type === 'speech')) hideTyping();
  } catch (_) {}
  var r;
  if (!typingTook) {
    /* M · a rename is applied before the message is handled */
    try { if (d) onRoomNameSignal(S.roomId, d); } catch (_) {}
    /* L · a lifecycle signal is taken here and goes no deeper */
    var lifecycleTook = false;
    try { if (d && onLifecycleSignal(S.roomId, d)) lifecycleTook = true; } catch (_) {}
    if (!lifecycleTook) r = handleRelayCore(d);
    /* S · anything received is a chance to send the read receipts owed */
    try { sendReadReceipts(); } catch (_) {}
  }
  /* P4 · an event the app presents while visible closes that room's notifications */
  try { if (d && d.from !== deviceId && p4IsPushWorthy(d) && !document.hidden && S.roomId) p4PresentedClose(S.roomId); } catch (e) { p4Log('close_failed', { e: String(e && e.message || e) }, 'error'); }
  /* P6 · threads, after the message is handled */
  try {
    if (d && d.from !== deviceId && S.roomId) {
      if (d.type === 'thread-invite') p6OnInvite(S.roomId, d);
      else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(S.roomId, d);
      else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(S.roomId);
    }
  } catch (e) { p6Log('relay_failed', { e: String(e && e.message || e) }, 'error'); }
  /* CR3 · a record seen while attended is acknowledged to the relay */
  try {
    if (d && d.from !== deviceId && d.eventId && cr3IsRecord(d) && d.type !== 'call-start' && wasAttended && S.view === 'room' && S.roomId) cr3Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });
  } catch (e) { cr3Log('seen_failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
}
