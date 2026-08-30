/* ═══════════ R10-CR1 PART · r10-cr1-event-state.js ═══════════ */
/* @contract
   replaces: waitingOf, bumpWaiting, clearWaiting, osNotify, p4OnSwMessage
   wraps: relayConnect, LISTEN.open, handleChatMsg, enterRoom, boot
   adds: cr1Log, cr1Proj, cr1Unseen, cr1ProjCacheLoad, cr1ProjCacheSave, cr1Apply, cr1Sync, cr1SyncAll, cr1Seen, cr1AckRoom, cr1Present, cr1Recover, cr1RecoverState, cr1RouteOpen, cr1ParseHash, cr1Boot
   Plan v20.9.0 §4.11.2–4.11.4 — the app side of ONE recipient-event authority.

   The relay's durable per-recipient record is the sole truth for the home
   chat/voice/video projection, seen state, and recipient call outcomes. The
   app CACHES the projection for display and may not keep a second counted
   set: bumpWaiting no longer counts anything (it schedules reconciliation),
   clearWaiting acknowledges the exact applied set to the authority, and the
   legacy r.waiting / r.unread fields become a mirror of the last projection.

   One idempotent single-flight recovery coordinator (§4.11.3) owns
   visibility, focus, online, notification navigation, relay open, and
   room-listener open: concurrent signals coalesce into one attempt; stale
   attempts cannot replace a newer socket; each successful open reconciles
   before home is declared current; home recovery never waits for peer
   traffic.

   Presentation (§4.11.4): the OS alert for a hidden device is raised by the
   push→worker path alone; the app raises NO OS alert (its own surfaces are
   the alert when visible), so one event can never grow a second surface.
   A notification tap — warm or COLD LAUNCH — opens the exact event: a live
   offered call opens the existing Accept/Decline surface; an ended one opens
   the room with its durable recipient outcome.
*/
function cr1Log(what, data, level) { try { log('cr1_' + what, data || {}, level || 'info'); } catch (_) {} }

var cr1Proj = {};      /* roomId -> {chat,voice,video} — DISPLAY CACHE of the relay projection */
var cr1Unseen = {};    /* roomId -> last unseen list from the authority */

function cr1ProjCacheLoad() { cr1Proj = lsGet('tb_cr1_proj', {}) || {}; }
function cr1ProjCacheSave() { try { lsSet('tb_cr1_proj', cr1Proj); } catch (_) {} }

/* Fold the authority's answer into the display mirrors. Idempotent: applying
   the same sync twice changes nothing (§4.11.2). */
function cr1Apply(roomId, out) {
  if (!out || !out.proj) return;
  cr1Proj[roomId] = { chat: out.proj.chat || 0, voice: out.proj.voice || 0, video: out.proj.video || 0 };
  cr1Unseen[roomId] = out.unseen || [];
  cr1ProjCacheSave();
  var r = roomById(roomId);
  if (r) {
    r.waiting = { chat: cr1Proj[roomId].chat, voice: cr1Proj[roomId].voice, video: cr1Proj[roomId].video };
    r.unread = r.waiting.chat + r.waiting.voice + r.waiting.video;   /* legacy mirror only */
  }
}

function cr1Sync(roomId) {
  return p3RelayPost(roomId, { type: 'events-sync' }).then(function (out) {
    cr1Apply(roomId, out);
    cr1Log('sync', { room: String(roomId).slice(-6), proj: cr1Proj[roomId] }, 'ok');
    return out;
  }).catch(function (e) { cr1Log('sync_failed', { room: String(roomId).slice(-6), e: String(e && e.message || e) }, 'warn'); return null; });
}
function cr1SyncAll() {
  var rooms = S.rooms.filter(function (r) { return !r.deletedAt; });
  return Promise.all(rooms.map(function (r) { return cr1Sync(r.id); }));
}
function cr1Seen(roomId, ids) {
  if (!ids || !ids.length) return Promise.resolve(null);
  return p3RelayPost(roomId, { type: 'event-seen', ids: ids }).then(function (out) {
    cr1Apply(roomId, out);
    cr1Log('seen', { room: String(roomId).slice(-6), n: ids.length }, 'ok');
    return out;
  }).catch(function (e) { cr1Log('seen_failed', { e: String(e && e.message || e) }, 'warn'); return null; });
}
function cr1Present(roomId, id, p) {
  try { p3RelayPost(roomId, { type: 'event-presented', id: id, p: p }); } catch (_) {}
}

/* Opening a room acknowledges exactly the set durably applied to this
   recipient — never an active offered call, which must keep ringing until the
   receiver's own explicit outcome (§4.11.2/4.11.3). */
function cr1AckRoom(roomId) {
  return cr1Sync(roomId).then(function (out) {
    if (!out) return null;
    var offered = null;
    var ack = [];
    (out.unseen || []).forEach(function (u) {
      if (u.o === 'offered') { offered = u; return; }
      ack.push(u.id);
    });
    var done = ack.length ? cr1Seen(roomId, ack) : Promise.resolve(out);
    return done.then(function () {
      if (offered) {
        var r = roomById(roomId);
        if (r && !CALL.active && !CALL.ringPending) {
          cr1Log('cold_ring', { room: String(roomId).slice(-6), kind: offered.kind }, 'ok');
          CALL.onIncoming(r, { kind: offered.kind === 'video' ? 'video' : 'voice', name: r.partnerName });
        }
      }
      renderPanel();
      return out;
    });
  });
}

/* ── the projection replaces every browser-side count ─────────────────────── */
waitingOf = function (r) {
  if (!r) return { chat: 0, voice: 0, video: 0 };
  var p = cr1Proj[r.id];
  if (!p && r.waiting) p = r.waiting;               /* pre-CR1 stored mirror as first paint */
  if (!p) p = { chat: 0, voice: 0, video: 0 };
  r.waiting = { chat: p.chat || 0, voice: p.voice || 0, video: p.video || 0 };
  r.unread = r.waiting.chat + r.waiting.voice + r.waiting.video;
  return r.waiting;
};
bumpWaiting = function (r, kind) {
  /* No browser-side truth (§4.11.2). The authority already recorded the event;
     reconcile and repaint from it. */
  if (!r) return;
  cr1Log('bump_routed', { room: String(r.id).slice(-6), kind: kind }, 'ok');
  cr1Sync(r.id).then(function () { renderPanel(); });
};
clearWaiting = function (r) {
  if (!r) return;
  cr1AckRoom(r.id);
};

/* ── presentation: the app raises no OS alert; its surfaces are the alert ── */
osNotify = function (title, body, roomId) {
  /* Hidden device → the push→worker banner is the one OS alert.
     Visible device → the in-app surface (bubble, card, ring) is the alert.
     Either way an app-side OS notification would be a second surface. */
  cr1Log('os_suppressed_app_side', { room: String(roomId || '').slice(-6) }, 'ok');
};

/* ── §4.11.3 · one idempotent single-flight recovery coordinator ──────────── */
var cr1RecoverState = { running: false, again: null, lastReason: null };
function cr1Recover(reason) {
  if (cr1RecoverState.running) { cr1RecoverState.again = reason; return Promise.resolve(null); }
  cr1RecoverState.running = true;
  cr1RecoverState.lastReason = reason;
  cr1Log('recover', { reason: reason }, 'ok');
  try { LISTEN.sync(); } catch (_) {}
  var p = Promise.resolve();
  if (S.view === 'room' && S.roomId && (!_relayWs || _relayWs.readyState > 1)) {
    try { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; relayConnect(); } catch (_) {}
  }
  return p.then(function () { return cr1SyncAll(); }).then(function () {
    /* Becoming visible while routed to a room puts its events on screen — that
       is the visible handling §4.11.2 names, so the routed room is acknowledged
       (an offered live call is never acknowledged; it keeps ringing). */
    if (!document.hidden && S.view === 'room' && S.roomId) return cr1AckRoom(S.roomId);
    return null;
  }).then(function () {
    renderPanel();
    cr1RecoverState.running = false;
    var again = cr1RecoverState.again;
    cr1RecoverState.again = null;
    if (again) return cr1Recover(again);
    return null;
  }).catch(function () { cr1RecoverState.running = false; return null; });
}

(function () {
  /* Stale attempts cannot replace a newer socket: a relay connect that is
     already in flight for the same room is not restarted by a second signal. */
  var _cr1RelayConnect = relayConnect;
  relayConnect = function () {
    if (_relayWs && _relayWs.readyState === 0) { cr1Log('connect_coalesced', {}, 'ok'); return; }
    var r = _cr1RelayConnect.apply(this, arguments);
    var ws = _relayWs;
    if (ws) {
      var _open = ws.onopen;
      ws.onopen = function () {
        var v = _open ? _open.apply(this, arguments) : undefined;
        /* every successful relay open reconciles before home is current */
        try { if (S.roomId) cr1Sync(S.roomId).then(function () { renderPanel(); }); } catch (_) {}
        return v;
      };
    }
    return r;
  };

  var _cr1ListenOpen = LISTEN.open;
  LISTEN.open = function (room) {
    var existing = this.socks[room.id];
    if (existing && existing.readyState === 0) { cr1Log('listen_coalesced', { room: String(room.id).slice(-6) }, 'ok'); return; }
    var r = _cr1ListenOpen.apply(this, arguments);
    var ws = this.socks[room.id];
    if (ws) {
      var _open = ws.onopen;
      ws.onopen = function () {
        var v = _open ? _open.apply(this, arguments) : undefined;
        /* room-listener reopen reconciles home immediately — no relay traffic
           or peer hello is waited on (§4.11.3, scenario 4). */
        try { cr1Sync(room.id).then(function () { renderPanel(); }); } catch (_) {}
        return v;
      };
    }
    return r;
  };

  /* A chat visibly handled in its room at arrival time — and only then — is
     seen (§4.11.2). Hidden-but-still-routed is NOT seen: root cause 4.1. */
  var _cr1HandleChat = handleChatMsg;
  handleChatMsg = function (d, room) {
    var r = _cr1HandleChat.apply(this, arguments);
    try {
      if (d && d.chatId && room && !document.hidden && S.view === 'room' && S.roomId === room.id) {
        cr1Present(room.id, 'chat:' + d.chatId, 'in_app');
        cr1Seen(room.id, ['chat:' + d.chatId]);
      } else if (d && d.chatId && room) {
        cr1Sync(room.id).then(function () { renderPanel(); });
      }
    } catch (e) { cr1Log('chat_hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };

  /* Explicit room open acknowledges the exact durable set (clearWaiting above
     is called by the room-card path; entering by any other door must ack the
     same way, and never double). */
  var _cr1EnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _cr1EnterRoom.apply(this, arguments);
    try { cr1AckRoom(id); } catch (_) {}
    return r;
  };

  /* One coalesced entry for every wake signal. The ship's own visibility
     handler still runs; the coordinator makes concurrent signals one attempt. */
  document.addEventListener('visibilitychange', function () { if (!document.hidden) cr1Recover('visible'); });
  window.addEventListener('focus', function () { cr1Recover('focus'); });
  window.addEventListener('online', function () { cr1Recover('online'); });
})();

/* ── exact tap routing: warm message and cold launch (§4.11.4/4.11.6 rows 7-8) ── */
function cr1RouteOpen(d) {
  try {
    if (!d || !d.roomId || !roomById(d.roomId)) return;
    cr1Log('open_routed', { room: String(d.roomId).slice(-6), kind: d.kind || null, call: d.call || null }, 'ok');
    closePanel();
    enterRoom(d.roomId);   /* enterRoom → cr1AckRoom: a live offered call raises the existing ring surface; an ended one leaves the durable outcome */
    cr1Recover('notification');
  } catch (e) { cr1Log('open_failed', { e: String(e && e.message || e) }, 'error'); }
}
p4OnSwMessage = function (ev) {
  var d = ev && ev.data; if (!d || d.t !== 'tb-open') return;
  cr1RouteOpen(d);
};
function cr1ParseHash() {
  try {
    var h = location.hash || '';
    if (h.indexOf('#tbopen=') !== 0) return null;
    var parts = h.slice(8).split(',').map(decodeURIComponent);
    history.replaceState(null, '', location.pathname + location.search);
    return { roomId: parts[0] || null, eventId: parts[1] || null, kind: parts[2] || null, call: parts[3] || null };
  } catch (_) { return null; }
}
function cr1Boot() {
  cr1ProjCacheLoad();
  var open = cr1ParseHash();
  if (open) { cr1RouteOpen(open); } else { cr1SyncAll().then(function () { renderPanel(); }); }
}
(function () {
  var _cr1Boot = boot;
  boot = function () {
    var r = _cr1Boot.apply(this, arguments);
    try { cr1Boot(); } catch (e) { cr1Log('boot_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
