
/* ═══════════ R10.6 PART · opaque authorization + temporary call credentials ═══════════ */
var R106_AUTH_KEY = 'tb_auth_v1';
var R106_SERVICE_ROOT = RELAY_WS.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/signal$/, '/service');
var r106Auth = { token: '', expiresAt: 0, rooms: [], canCreate: false, scopeClass: 'none' };
var r106Provider = { dg: '', dgExp: 0, dgPending: null, ice: null, turnExp: 0, turnPending: null, turnTimer: null };

function r106AuthLog(what, data, level) {
  try { log('r106_auth_' + what, data || {}, level || 'info'); } catch (_) {}
}
function r106ReadAuth() {
  try {
    var rec = lsGet(R106_AUTH_KEY, null);
    if (rec && rec.token) r106Auth = rec;
  } catch (_) {}
  return r106Auth;
}
function r106SaveAuth(data) {
  r106Auth = {
    token: data.auth,
    expiresAt: Number(data.expiresAt) || 0,
    rooms: Array.isArray(data.rooms) ? data.rooms : [],
    canCreate: data.canCreate === true,
    scopeClass: data.scopeClass || 'device'
  };
  lsSet(R106_AUTH_KEY, r106Auth);
  r106AuthLog('stored', { present: true, scopeClass: r106Auth.scopeClass, rooms: r106Auth.rooms.length, expiresAt: r106Auth.expiresAt }, 'ok');
  return r106Auth;
}
function r106Service(action, body, authenticated) {
  var headers = { 'Content-Type': 'application/json' };
  var auth = r106ReadAuth();
  if (authenticated !== false && auth.token) {
    headers['X-TalkBridge-Auth'] = auth.token;
    headers['X-TalkBridge-Device'] = deviceId;
  }
  return fetch(R106_SERVICE_ROOT + '/' + action, {
    method: 'POST', headers: headers, body: JSON.stringify(body || {})
  }).then(function (res) {
    return res.text().then(function (txt) {
      var data = null; try { data = txt ? JSON.parse(txt) : {}; } catch (_) {}
      if (!res.ok) { var e = new Error((data && data.error) || ('service-' + res.status)); e.status = res.status; throw e; }
      return data || {};
    });
  });
}
function r106ExchangeInvite(code) {
  return r106Service('invite-exchange', { code: code, deviceId: deviceId, currentAuth: r106ReadAuth().token || null }, false)
    .then(function (data) { r106SaveAuth(data); return data; });
}
function r106EnsureAuth() {
  var auth = r106ReadAuth();
  if (auth.token && (!auth.expiresAt || auth.expiresAt > Date.now() + 60000)) return Promise.resolve(auth);
  var rooms = S.rooms.filter(function (r) { return !r.deletedAt; }).map(function (r) { return r.id; });
  if (!rooms.length) return Promise.resolve(null);
  /* Compatibility bootstrap: legacy room identifiers were already the relay
     capabilities.  They are exchanged once for a device-bound opaque token;
     no Deepgram/TURN value is sent or retained. */
  return r106Service('bootstrap', { deviceId: deviceId, rooms: rooms }, false).then(function (data) {
    r106SaveAuth(data); return r106Auth;
  }).catch(function (e) {
    r106AuthLog('bootstrap_failed', { status: e.status || 0, name: e.name || 'Error' }, 'error');
    return null;
  });
}
function r106AuthorizeRoom(roomId) {
  var auth = r106ReadAuth();
  if (auth.rooms.indexOf(roomId) >= 0) return Promise.resolve(auth);
  if (!auth.token) return r106EnsureAuth();
  return r106Service('authorize-room', { roomId: roomId, deviceId: deviceId }).then(function (data) {
    r106SaveAuth(data); return r106Auth;
  });
}

/* One-time invitation links contain only a random code. */
function r106InviteMeta(room, kind) {
  var link = kind === 'link';
  return {
    r: room.id, ld: link ? 1 : 0, role: link ? room.role : 'joiner',
    ml: room.myLang, tl: room.theirLang, myn: room.myName || S.user.name || '',
    pn: room.partnerName || '', n: S.user.name || '', t: room.title || '', th: room.theme || null,
    g: room.grant ? 1 : 0, exp: room.grantExpires || null
  };
}
function r106CreateInvite(room, kind) {
  return r106AuthorizeRoom(room.id).then(function () {
    return r106Service('invite-create', { roomId: room.id, deviceId: deviceId, invite: r106InviteMeta(room, kind), ttlSeconds: 600 });
  }).then(function (data) {
    if (!data.code) throw new Error('invite-code-missing');
    r106AuthLog('invite_created', { room: String(room.id).slice(-6), kind: kind, expiresAt: data.expiresAt }, 'ok');
    return location.origin + location.pathname + '#i=' + encodeURIComponent(data.code);
  });
}
function r106PaintInvite(box, url, compact) {
  box.innerHTML = (compact ? '' : '<div class="invite-title">Invite your partner</div>') +
    '<div class="r106-qr"></div><div class="invite-link">' + esc(url) + '</div>' +
    '<div class="invite-btns"><button class="btn ghost" data-r106-copy>Copy</button><button class="btn" data-r106-share>Share</button></div>';
  try { var svg = QR.makeSvg(url); if (svg) box.querySelector('.r106-qr').appendChild(svg); } catch (_) {}
  function copy() { if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }); }
  box.querySelector('.invite-link').addEventListener('click', copy);
  box.querySelector('[data-r106-copy]').addEventListener('click', copy);
  box.querySelector('[data-r106-share]').addEventListener('click', function () {
    if (navigator.share) navigator.share({ title: 'TalkBridge', url: url }).catch(function () {}); else copy();
  });
}

invUrl = function () { return ''; };
linkDeviceUrl = function () { return ''; };
renderInviteCard = function () {
  var old = document.querySelector('.invite-card'); if (old) old.remove();
  var room = activeRoom(); if (!room || room.role !== 'creator' || room.joined) return;
  var div = document.createElement('div'); div.className = 'invite-card';
  div.innerHTML = '<div class="invite-title">Creating a secure invitation…</div>';
  $('transcript').prepend(div);
  r106CreateInvite(room, 'share').then(function (url) { if (div.parentNode) r106PaintInvite(div, url, false); })
    .catch(function (e) { div.innerHTML = '<div class="invite-title">Invitation unavailable</div><div class="invite-link">Check the connection and try again.</div>'; r106AuthLog('invite_failed', { status: e.status || 0 }, 'error'); });
};
toggleDrawerQr = function (boxId, kind) {
  var box = $(boxId); if (!box) return;
  var other = $(boxId === 'dq-share' ? 'dq-link' : 'dq-share'); if (other) other.classList.remove('show');
  if (box.classList.contains('show')) { box.classList.remove('show'); return; }
  var room = activeRoom(); if (!room) return;
  box.innerHTML = '<div class="invite-link">Creating a secure invitation…</div>'; box.classList.add('show');
  r106CreateInvite(room, kind).then(function (url) { if (box.classList.contains('show')) r106PaintInvite(box, url, true); })
    .catch(function (e) { box.innerHTML = '<div class="invite-link">Invitation unavailable. Check the connection and try again.</div>'; r106AuthLog('invite_failed', { status: e.status || 0 }, 'error'); });
};

/* Temporary provider credentials exist in memory only. */
function r106DeepgramToken(roomId) {
  if (r106Provider.dg && r106Provider.dgExp > Date.now() + 5000) return Promise.resolve(r106Provider.dg);
  if (r106Provider.dgPending) return r106Provider.dgPending;
  r106Provider.dgPending = r106AuthorizeRoom(roomId).then(function () {
    return r106Service('deepgram-token', { roomId: roomId, ttlSeconds: 120 });
  }).then(function (data) {
    if (!data.access_token) throw new Error('deepgram-token-empty');
    r106Provider.dg = data.access_token;
    r106Provider.dgExp = Date.now() + (Number(data.expires_in) || 30) * 1000;
    r106AuthLog('deepgram_token', { ok: true, expiresAt: r106Provider.dgExp }, 'ok');
    return r106Provider.dg;
  }).catch(function (e) {
    r106AuthLog('deepgram_token', { ok: false, status: e.status || 0, name: e.name || 'Error' }, 'error');
    throw e;
  }).finally(function () { r106Provider.dgPending = null; });
  return r106Provider.dgPending;
}
function r106TurnCredentials(roomId) {
  if (r106Provider.ice && r106Provider.turnExp > Date.now() + 60000) return Promise.resolve(r106Provider.ice);
  if (r106Provider.turnPending) return r106Provider.turnPending;
  r106Provider.turnPending = r106AuthorizeRoom(roomId).then(function () {
    return r106Service('turn-credentials', { roomId: roomId, ttlSeconds: 21600 });
  }).then(function (data) {
    if (!Array.isArray(data.iceServers) || !data.iceServers.length) throw new Error('turn-credentials-empty');
    r106Provider.ice = data.iceServers;
    r106Provider.turnExp = Number(data.expiresAt) || (Date.now() + 21600000);
    r106AuthLog('turn_credentials', { ok: true, servers: data.iceServers.length, expiresAt: r106Provider.turnExp }, 'ok');
    return data.iceServers;
  }).catch(function (e) {
    r106AuthLog('turn_credentials', { ok: false, status: e.status || 0, name: e.name || 'Error' }, 'error');
    throw e;
  }).finally(function () { r106Provider.turnPending = null; });
  return r106Provider.turnPending;
}

r106ReadAuth();
CALL.keys = function () { return { dg: r106Provider.dg || '', tid: '', tok: '' }; };
hasOwnCredentials = function () {
  var a = r106ReadAuth(); return !!(a.token && (!a.expiresAt || a.expiresAt > Date.now()));
};

var _r106StartDeepgram = startDeepgram;
startDeepgram = function () {
  var room = activeRoom();
  if (!room || !(CALL.active || CHATMIC.on)) return;
  if (r106Provider.dg && r106Provider.dgExp > Date.now() + 5000) return _r106StartDeepgram.apply(this, arguments);
  r106DeepgramToken(room.id).then(function () { if ((CALL.active || CHATMIC.on) && !dgActive) _r106StartDeepgram(); })
    .catch(function () { toast('Live transcription is temporarily unavailable'); });
};

var _r106SetupPC = CALL.setupPC;
CALL.setupPC = async function () {
  if (this.pc) return;
  var room = activeRoom(); if (!room) return;
  var ice, usingRelay = false;
  try { ice = await r106TurnCredentials(room.id); usingRelay = true; }
  catch (_) { ice = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]; }
  var NativePC = window.RTCPeerConnection;
  var NativeLog = log, NativeToast = toast;
  function TempPC(cfg) {
    var next = {}; var k;
    for (k in (cfg || {})) next[k] = cfg[k];
    next.iceServers = ice;
    return new NativePC(next);
  }
  TempPC.prototype = NativePC.prototype;
  window.RTCPeerConnection = TempPC;
  if (usingRelay) {
    log = function (ev, data, level) {
      if (ev === 'turn_unavailable') { NativeLog('r106_auth_turn_selected', { servers: ice.length }, 'ok'); return; }
      return NativeLog.apply(this, arguments);
    };
    toast = function (message) {
      if (message === 'No call relay configured — add TURN keys') return;
      return NativeToast.apply(this, arguments);
    };
  }
  try { await _r106SetupPC.apply(this, arguments); }
  finally { window.RTCPeerConnection = NativePC; log = NativeLog; toast = NativeToast; }
  clearTimeout(r106Provider.turnTimer);
  r106Provider.turnTimer = setTimeout(function () {
    if (!CALL.active || !CALL.pc) return;
    r106Provider.turnExp = 0;
    r106TurnCredentials(room.id).then(function (servers) {
      if (CALL.active && CALL.pc && CALL.pc.setConfiguration) {
        CALL.pc.setConfiguration({ iceServers: servers });
        r106AuthLog('turn_refreshed', { ok: true, servers: servers.length }, 'ok');
      }
    }).catch(function () {});
  }, Math.max(60000, r106Provider.turnExp - Date.now() - 60000));
};

/* Remove the legacy long-lived call credentials after the new authorization
   path has loaded.  GitHub PAT remains R13 scope and is untouched. */
function r106RetireLegacyCallSecrets() {
  var keys = ['tb_dg_key', 'tb_cf_tid', 'tb_cf_tok', 'tb_grant_dg', 'tb_grant_tid', 'tb_grant_tok'];
  var removed = 0;
  for (var i = 0; i < keys.length; i++) { if (localStorage.getItem(keys[i])) removed++; localStorage.removeItem(keys[i]); }
  S.joinerKeys = null;
  r106AuthLog('legacy_call_secrets_retired', { removed: removed }, removed ? 'warn' : 'ok');
}
var _r106OpenS11 = openS11;
openS11 = function () {
  var out = _r106OpenS11.apply(this, arguments);
  ['k-dg', 'k-tid', 'k-tok'].forEach(function (id) {
    var el = $(id); if (!el) return; el.value = ''; el.style.display = 'none';
    var label = el.previousElementSibling; if (label) label.style.display = 'none';
  });
  return out;
};

(function () {
  var _softDelete = softDeleteRoom;
  softDeleteRoom = function (id) {
    var out = _softDelete.apply(this, arguments);
    r106Service('revoke', { roomId: id }).then(function (data) {
      r106AuthLog('descendants_revoked', { room: String(id).slice(-6), count: Number(data.revoked) || 0 }, 'ok');
    }).catch(function (e) { r106AuthLog('revoke_failed', { room: String(id).slice(-6), status: e.status || 0 }, 'error'); });
    return out;
  };
  var _enter = enterRoom;
  enterRoom = function (id) {
    var out = _enter.apply(this, arguments);
    r106AuthorizeRoom(id).catch(function (e) { r106AuthLog('room_authorize_failed', { room: String(id).slice(-6), status: e.status || 0 }, 'error'); });
    return out;
  };
  document.addEventListener('DOMContentLoaded', function () {
    if (!r106Standalone()) return;
    r106EnsureAuth().then(function (a) { if (a) r106RetireLegacyCallSecrets(); });
  });
})();
