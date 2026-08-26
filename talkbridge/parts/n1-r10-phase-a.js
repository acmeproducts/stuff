/* ═══════════ GAP PART · R10-phase-a.js ═══════════ */
/* @contract
   wraps: saveRooms (lifecycle-driven subscription/context sync), handleRelay
          (records last seen relay seq per room — read-only otherwise)
   adds: TB_R10, r10RelayHttp, r10Post, r10Vapid, r10SyncSubscriptions,
         r10Unsubscribe, r10PostContext, r10EnableNotifications,
         r10NotifStatus, r10RenderNotifRow, r10ConsumeHandoff,
         _r10SaveRooms, _r10HandleRelay
   Build: R10-A candidate · bridge-turn24-post-ship.html · governed by
          talkbridge/TALKBRIDGE-GOVERNING-PHASE-A-PHASE-B-EXECUTION-PROMPT.txt
   Phase A rules honoured: relay untouched; credentials untouched (tb_dg_key,
   tb_cf_tid, tb_cf_tok, tb_gh_pat remain exactly where they are); no cache in
   the SW; no payloads in push; no new lifecycle; smallest possible change. */

var TB_R10 = {
  build: 'R10 · turn24-post-ship',
  standalone: !!(window.__TB_R10 && window.__TB_R10.standalone),
  subscribedRooms: {},          /* roomId -> true once registered this run */
  swReady: false
};

function r10RelayHttp() { return RELAY_WS.replace(/^ws/, 'http'); }

function r10Post(sessionId, body) {
  var url = r10RelayHttp() + '?app=' + encodeURIComponent(RELAY_APP) +
    '&session=' + encodeURIComponent(sessionId) +
    '&client=' + encodeURIComponent(deviceId);
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; return j; });
    });
}

function r10Vapid(sessionId) { return r10Post(sessionId, { type: 'vapid' }); }

/* ── handoff consumption check (A3.3e/f) — runs after the existing boot has
      had its chance to consume the staged j through its own path ─────────── */
function r10ConsumeHandoff() {
  var st = window.__TB_R10;
  if (!st || !st.staged) return;
  var consumed = false;
  try {
    /* Consumption evidence, judged by the EXISTING code's own effects: the
       boot path either created/entered the room (device-link), or staged the
       joiner landing (S.invitePayload). Either way decInv succeeded. */
    if (S && (S.invitePayload || S.joinerKeys)) consumed = true;
    if (!consumed && S && S.rooms && S.rooms.length) {
      var h = (window.__TB_R10.rawLen > 0);
      /* device-link path clears the hash after joining; a room now exists */
      if (h && location.hash.indexOf('#j=') !== 0) consumed = true;
    }
  } catch (_) {}
  if (consumed) {
    document.cookie = 'tb_install_handoff_v1=; Path=/stuff/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    try { if (location.hash.indexOf('#j=') === 0) history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    r8Log('pwa_handoff_consumed', { standalone: TB_R10.standalone }, 'ok');
  } else {
    /* Do not delete the cookie; surface the failure in the existing log. */
    r8Log('pwa_handoff_failed', { standalone: TB_R10.standalone, rawLen: window.__TB_R10.rawLen }, 'error');
  }
}

/* ── push subscription (A5) — proven path, existing relay, existing SW ───── */
function r10ActiveRooms() {
  return (S.rooms || []).filter(function (r) { return !r.deletedAt; });
}

function r10SyncSubscriptions() {
  if (!('serviceWorker' in navigator)) return Promise.resolve();
  return navigator.serviceWorker.ready.then(function (reg) {
    if (!reg.pushManager) return;
    return reg.pushManager.getSubscription().then(function (sub) {
      if (!sub) return;
      var subJson = sub.toJSON();
      var jobs = r10ActiveRooms().filter(function (r) { return !TB_R10.subscribedRooms[r.id]; })
        .map(function (r) {
          return r10Post(r.id, { type: 'subscribe', subscription: subJson }).then(function (res) {
            if (res && (res.ok === true || res._status === 200)) {
              TB_R10.subscribedRooms[r.id] = true;
              r8Log('push_room_subscribed', { room: String(r.id).slice(-6) }, 'ok');
            } else r8Log('push_room_subscribe_failed', { room: String(r.id).slice(-6), status: res && res._status }, 'error');
          }).catch(function (e) { r8Log('push_room_subscribe_failed', { e: String(e && e.message || e) }, 'error'); });
        });
      return Promise.all(jobs).then(r10PostContext);
    });
  }).catch(function () {});
}

function r10Unsubscribe(roomId) {
  /* room-specific by design: subscriptions live per room Durable Object */
  return r10Post(roomId, { type: 'unsubscribe' }).then(function () {
    delete TB_R10.subscribedRooms[roomId];
    r8Log('push_room_unsubscribed', { room: String(roomId).slice(-6) }, 'ok');
  }).catch(function () {});
}

function r10UrlB64ToU8(base64) {
  var pad = '='.repeat((4 - base64.length % 4) % 4);
  var b = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  var raw = atob(b); var out = new Uint8Array(raw.length);
  for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function r10EnableNotifications() {
  /* MUST be called from the user's gesture (A5). One control, no ceremony. */
  if (!('serviceWorker' in navigator) || !window.PushManager) { r10NotifStatus('unsupported'); return Promise.resolve(); }
  var rooms = r10ActiveRooms();
  if (!rooms.length) { r10NotifStatus('no-rooms'); return Promise.resolve(); }
  return navigator.serviceWorker.ready.then(function (reg) {
    return reg.pushManager.getSubscription().then(function (existing) {
      if (existing) return existing;
      return Notification.requestPermission().then(function (perm) {
        if (perm !== 'granted') { r10NotifStatus('off'); throw new Error('denied'); }
        return r10Vapid(rooms[0].id).then(function (v) {
          r8Log('heal_step', { s: 'vapid-answer', ok: !!(v && (v.key || v.vapid)), st: v && v._status }, 'ok');
          var vkey = v && (v.key || v.vapid);   /* the live relay names this field 'vapid' — the part expected 'key'; accept both */
          if (!vkey) throw new Error('vapid');
          r8Log('heal_step', { s: 'subscribe-call', ok: true }, 'ok');
          return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: r10UrlB64ToU8(vkey) });
        });
      });
    });
  }).then(function (sub) {
    if (!sub) throw new Error('no-sub');
    r8Log('push_subscribed', { endpointHost: (function(){try{return new URL(sub.endpoint).host}catch(_){return '?'}})() }, 'ok');
    return r10SyncSubscriptions().then(function () { r10NotifStatus('on'); });
  }).catch(function (e) {
    if (String(e && e.message) !== 'denied') r8Log('push_enable_failed', { e: String(e && e.message || e) }, 'error');
  });
}

/* ── status + the one concise control (A5 production UX) ─────────────────── */
function r10NotifStatus(state) {
  TB_R10.notifState = state;
  var el = document.getElementById('r10-notif');
  if (!el) return;
  var lbl = el.querySelector('.r10-n-label');
  var btn = el.querySelector('.r10-n-btn');
  if (state === 'on') { if (lbl) lbl.textContent = 'Notifications: On'; if (btn) btn.style.display = 'none'; }
  else if (state === 'off') { if (lbl) lbl.textContent = 'Notifications: Off'; if (btn) btn.style.display = 'none'; }
  else if (state === 'prompt') { if (lbl) lbl.textContent = 'Notifications'; if (btn) btn.style.display = ''; }
  else { if (lbl) lbl.textContent = 'Notifications: unavailable'; if (btn) btn.style.display = 'none'; }
}

function r10RenderNotifRow() {
  var body = document.getElementById('panel-body');
  var host = body ? body.parentNode : null;
  if (!host || document.getElementById('r10-notif')) return;
  var row = document.createElement('div');
  row.id = 'r10-notif';
  row.className = 'app-build-row';
  if (TB_R10.standalone) {
    row.innerHTML = '<span class="r10-n-label">Notifications</span>' +
      '<button class="r10-n-btn" type="button">Enable notifications</button>' +
      '<span class="r10-build">' + TB_R10.build + '</span>';
    row.querySelector('.r10-n-btn').addEventListener('click', function () { r10EnableNotifications(); });
  } else {
    /* Safari tab: push cannot complete here — say so in the info surface. */
    row.innerHTML = '<span class="r10-n-label">Add TalkBridge to Home Screen to enable iPhone notifications</span>' +
      '<span class="r10-build">' + TB_R10.build + '</span>';
  }
  host.appendChild(row);
  if (!TB_R10.standalone) return;
  if (!('Notification' in window)) { r10NotifStatus('unsupported'); return; }
  if (Notification.permission === 'denied') { r10NotifStatus('off'); return; }
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager && reg.pushManager.getSubscription();
    }).then(function (sub) { r10NotifStatus(sub ? 'on' : 'prompt'); }).catch(function () { r10NotifStatus('prompt'); });
  } else r10NotifStatus('prompt');
}

/* ── service-worker context (A6) — ids and cursors only, never secrets ───── */
function r10PostContext() {
  try {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    navigator.serviceWorker.controller.postMessage({
      type: 'tb-context',
      context: {
        relay: RELAY_WS,
        app: RELAY_APP,
        client: deviceId,
        rooms: r10ActiveRooms().map(function (r) { return { id: r.id, since: r.r10Since || 0 }; })
      }
    });
  } catch (_) {}
}

/* record last seen RELAY sequence per room, read-only wrap (A6 'since') */
(function () {
  var _r10HandleRelay = handleRelay;
  handleRelay = function (d) {
    try {
      if (d && typeof d.seq === 'number' && S.roomId) {
        var r = roomById(S.roomId);
        if (r && (!r.r10Since || d.seq > r.r10Since)) r.r10Since = d.seq;
      }
    } catch (_) {}
    return _r10HandleRelay.apply(this, arguments);
  };
  handleRelay._r10Original = _r10HandleRelay;
})();

/* lifecycle-driven sync: hard delete -> room-specific unsubscribe; new or
   restored room -> register the same subscription; always refresh context.
   Existing lifecycle messages and semantics are untouched (A7). */
(function () {
  var _r10SaveRooms = saveRooms;
  var known = {};
  function snapshot() {
    known = {};
    (S.rooms || []).forEach(function (r) { known[r.id] = { deletedAt: !!r.deletedAt }; });
  }
  snapshot();
  saveRooms = function () {
    var out = _r10SaveRooms.apply(this, arguments);
    try {
      var seen = {};
      (S.rooms || []).forEach(function (r) {
        seen[r.id] = true;
        var prev = known[r.id];
        if (!prev || (prev.deletedAt && !r.deletedAt)) {
          /* new or restored room: make sure this device's subscription is
             registered with that room's relay session */
          delete TB_R10.subscribedRooms[r.id];
          r10SyncSubscriptions();
        }
      });
      Object.keys(known).forEach(function (id) {
        if (!seen[id]) r10Unsubscribe(id);   /* hard delete: gone entirely */
      });
      snapshot();
      r10PostContext();
    } catch (_) {}
    return out;
  };
  saveRooms._r10Original = _r10SaveRooms;
})();

/* ── init ─────────────────────────────────────────────────────────────────── */
setTimeout(function () {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./tb-sw.js').then(function () {
        TB_R10.swReady = true;
        r8Log('sw_registered', { standalone: TB_R10.standalone }, 'ok');
        r10PostContext();
        r10SyncSubscriptions();
      }).catch(function (e) { r8Log('sw_register_failed', { e: String(e && e.message || e) }, 'error'); });
    }
    /* replay pre-bootstrap logs into the app's own log, metadata only */
    if (window.__TB_R10) (window.__TB_R10.log || []).forEach(function (l) { r8Log(l.ev, l.meta, 'ok'); });
    r10ConsumeHandoff();
    r10RenderNotifRow();
    var st = document.createElement('style');
    st.id = 'r10-css';
    st.textContent = '.app-build-row{display:flex;align-items:center;gap:8px;padding:8px 14px;font-size:12px;color:var(--ink-mid);border-top:1px solid var(--border)}' +
      '.app-build-row .r10-n-btn{font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:8px;background:var(--cream)}' +
      '.app-build-row .r10-build{margin-left:auto;color:var(--ink-dim);font-size:10.5px}';
    document.head.appendChild(st);
    r8Log('r10_init', { standalone: TB_R10.standalone, build: TB_R10.build }, 'ok');
  } catch (e) { r8Log('r10_init_failed', { e: String(e && e.message || e) }, 'error'); }
}, 700);

