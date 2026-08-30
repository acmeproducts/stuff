
/* ═══════════ R10.6 PART · push subscription and acknowledged mute ═══════════ */
var r106Push = { reg: null, sub: null, rooms: {}, attempts: 0, gestureArmed: false, pending: null };
function r106PushLog(what, data, level) { try { log('r106_push_' + what, data || {}, level || 'info'); } catch (_) {} }
function r106SignalHttp(roomId) {
  return RELAY_WS.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:') + '?app=' + encodeURIComponent(RELAY_APP) +
    '&session=' + encodeURIComponent(roomId) + '&client=' + encodeURIComponent(deviceId);
}
function r106SignalPost(roomId, body) {
  return fetch(r106SignalHttp(roomId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function (r) { return r.json(); });
}
function r106B64Bytes(s) {
  var b = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
  var raw = atob(b), out = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i); return out;
}
function r106LiveRooms() { return S.rooms.filter(function (r) { return !r.deletedAt; }); }
function r106RegisterWorker() {
  if (!navigator.serviceWorker) return Promise.reject(new Error('service-worker-unsupported'));
  return navigator.serviceWorker.register('./tb-sw.js').then(function (reg) {
    r106Push.reg = reg; r106PushLog('worker_registered', { scope: reg.scope }, 'ok'); return navigator.serviceWorker.ready;
  }).then(function (reg) {
    try { if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage({ t: 'tb-drain' }); } catch (_) {}
    return reg;
  });
}
function r106RegisterRoom(roomId) {
  if (!r106Push.sub || !roomId) return Promise.resolve(false);
  var room = roomById(roomId);
  return r106SignalPost(roomId, {
    type: 'subscribe',
    subscription: r106Push.sub.toJSON ? r106Push.sub.toJSON() : r106Push.sub,
    navigate: location.origin + location.pathname,
    muted: !!(room && room.muted)
  }).then(function (data) {
    var ok = !!(data && data.ok); if (ok) r106Push.rooms[roomId] = true;
    r106PushLog('room_subscribed', { room: String(roomId).slice(-6), ok: ok, muted: !!(room && room.muted) }, ok ? 'ok' : 'error');
    return ok;
  }).catch(function (e) { r106PushLog('room_subscribe_failed', { room: String(roomId).slice(-6), name: e.name || 'Error' }, 'error'); return false; });
}
function r106RegisterAllRooms() { return Promise.all(r106LiveRooms().map(function (r) { return r106RegisterRoom(r.id); })); }
function r106AttemptPush(inGesture) {
  if (r106Push.pending) return r106Push.pending;
  r106Push.attempts++;
  var prop = window.Notification ? Notification.permission : 'unsupported';
  r106PushLog('permission_property', { value: prop, gesture: !!inGesture, attempt: r106Push.attempts }, 'info');
  var answer = Promise.resolve(null);
  if (inGesture && window.Notification && Notification.requestPermission) {
    try { answer = Promise.resolve(Notification.requestPermission()); } catch (e0) { answer = Promise.reject(e0); }
    answer = answer.then(function (value) {
      r106PushLog('permission_answer', { value: value, property: Notification.permission }, 'info'); return value;
    }, function (e) { r106PushLog('permission_answer', { value: 'threw', name: e.name || 'Error' }, 'warn'); return null; });
  }
  var ready = r106Push.reg ? navigator.serviceWorker.ready : r106RegisterWorker();
  var task = ready.then(function (reg) {
    return answer.then(function () { return reg.pushManager.getSubscription(); }).then(function (existing) {
      if (existing) return existing;
      var room = r106LiveRooms()[0]; if (!room) throw new Error('no-rooms');
      return r106SignalPost(room.id, { type: 'vapid' }).then(function (data) {
        if (!data || !data.vapid) throw new Error('vapid-unavailable');
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: r106B64Bytes(data.vapid) });
      });
    });
  }).then(function (sub) {
    r106Push.sub = sub;
    r106PushLog('subscription', { ok: true, endpointHost: (function () { try { return new URL(sub.endpoint).host; } catch (_) { return ''; } })() }, 'ok');
    return r106RegisterAllRooms();
  }).catch(function (e) {
    r106PushLog('subscription', { ok: false, name: e.name || 'Error', gesture: !!inGesture }, 'error');
    if (e.name === 'NotAllowedError' && inGesture) r106ShowNotificationHelp();
    else if (e.message !== 'no-rooms') r106ArmPushGesture();
    return null;
  });
  r106Push.pending = task.then(function (value) { r106Push.pending = null; return value; }, function (e) { r106Push.pending = null; throw e; });
  return r106Push.pending;
}
function r106ArmPushGesture() {
  if (r106Push.gestureArmed) return;
  r106Push.gestureArmed = true;
  var handler = function () {
    document.removeEventListener('click', handler, true); r106Push.gestureArmed = false; r106AttemptPush(true);
  };
  document.addEventListener('click', handler, true);
  r106PushLog('gesture_armed', {}, 'info');
}
function r106ShowNotificationHelp() {
  if ($('r106-notification-help')) return;
  var box = document.createElement('div'); box.id = 'r106-notification-help';
  box.style.cssText = 'position:fixed;inset:0;z-index:10001;background:#FDFAF7;display:flex;align-items:center;justify-content:center;padding:24px';
  box.innerHTML = '<div class="r106-install-card"><div class="r106-install-title">Turn on TalkBridge notifications</div>' +
    '<div class="r106-install-copy">Open Settings → Apps → TalkBridge → Notifications. Turn on Allow Notifications, Lock Screen, Banners, and Sounds.</div>' +
    '<div style="margin-top:18px"><button class="btn" id="r106-notification-done">Try again</button></div></div>';
  document.body.appendChild(box);
  $('r106-notification-done').addEventListener('click', function () { box.remove(); r106AttemptPush(true); });
}
function r106SetMute(room, wanted) {
  return r106SignalPost(room.id, { type: 'mute', muted: !!wanted }).then(function (data) {
    if (!data || !data.ok) throw new Error('mute-not-acknowledged');
    room.muted = !!wanted; saveRooms(); renderPanel();
    r106PushLog('mute_ack', { room: String(room.id).slice(-6), muted: !!wanted }, 'ok');
    return true;
  });
}
function r106WireMute() {
  var btn = $('s4b-mute'); if (!btn || btn.__r106Mute) return; btn.__r106Mute = true;
  btn.addEventListener('click', function (ev) {
    ev.stopImmediatePropagation(); ev.preventDefault();
    var room = activeRoom(); if (!room) return;
    r106SetMute(room, !room.muted).then(function () { btn.classList.toggle('off', room.muted); })
      .catch(function () { btn.classList.toggle('off', room.muted); toast('Mute was not changed — try again'); });
  }, true);
}

/* Page code never creates an OS notification.  The relay grant selects either
   the in-app surface or the one service-worker/declarative OS path. */
osNotify = function () { r106PushLog('page_os_blocked', {}, 'info'); };

var _r106P2EntryForPush = r106P2Entry;
function r106P3Entry() {
  var out = _r106P2EntryForPush.apply(this, arguments);
  if (r106Standalone()) {
    r106WireMute();
    if (r106LiveRooms().length) r106AttemptPush(false);
  }
  return out;
}
document.removeEventListener('DOMContentLoaded', _r106P2EntryForPush);
document.addEventListener('DOMContentLoaded', r106P3Entry);
window.addEventListener('focus', function () { if (r106Standalone() && r106LiveRooms().length) r106AttemptPush(false); });
document.addEventListener('visibilitychange', function () { if (!document.hidden && r106Standalone() && r106LiveRooms().length) r106AttemptPush(false); });

(function () {
  var _enter = enterRoom;
  enterRoom = function (id) {
    var out = _enter.apply(this, arguments);
    if (!r106Push.sub && !r106Push.attempts) r106AttemptPush(false);
    else if (r106Push.sub && !r106Push.rooms[id]) r106RegisterRoom(id);
    return out;
  };
})();
