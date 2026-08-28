
/* ═══════════ R10 PART · P3-subscription.js ═══════════ */
/* @contract
   wraps: p2Entry (after the real app boots in standalone, the subscription attempt starts), enterRoom (a newly entered room is registered with the relay), renderPanel (registration re-synced to each room's mute)
   adds: p3Log, p3RelayHttp, p3RelayPost, p3B64ToBytes, p3Register, p3Vapid, p3Attempt, p3AttemptInGesture, p3ArmGesture, p3RegisterAll, p3RegisterRoom, p3SyncMutes, p3LiveRooms, p3ShowRecipe, p3State
   Plan v19.5.0 §4.1 P3 — attempt-as-authority. On standalone open with rooms:
   register the worker, then ATTEMPT the subscription. Permission answers and
   properties are recorded verbatim and never gate. NotAllowedError inside a
   real gesture is the one real denial → the owner's F1 device recipe.
   Safari/iOS demands a user gesture for the prompt (WebKit rule, verified
   2026-08-27), so an open-time attempt that is refused for want of a gesture is
   re-run on the next tap — same attempt, same truth.
   Every live room registers with the relay. (A5: the 30s listener heartbeat
   is deleted with the relay's liveness view — plan v20.0.0 §4.6.)
*/
var p3State = { reg: null, sub: null, registered: {}, gestureArmed: false, lastError: null, attempts: 0 };
function p3Log(what, data, level) { try { log('p3_' + what, data || {}, level || 'info'); } catch (_) {} }
function p3RelayHttp() { return RELAY_WS.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:'); }
function p3RelayPost(roomId, body) {
  var u = p3RelayHttp() + '?app=' + encodeURIComponent(RELAY_APP) + '&session=' + encodeURIComponent(roomId) + '&client=' + encodeURIComponent(deviceId);
  return fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function (r) { return r.json(); });
}
function p3B64ToBytes(s) {
  var b = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
  var bin = atob(b), out = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function p3LiveRooms() { return S.rooms.filter(function (r) { return !r.deletedAt; }); }

function p3Register() {
  if (!('serviceWorker' in navigator)) { p3Log('sw_unsupported', {}, 'error'); return Promise.reject(new Error('no-sw')); }
  return navigator.serviceWorker.register('./tb-sw.js').then(function (reg) {
    p3State.reg = reg; p3Log('sw_registered', { scope: reg && reg.scope }, 'ok');
    return navigator.serviceWorker.ready;
  });
}
function p3Vapid() {
  var rooms = p3LiveRooms(); if (!rooms.length) return Promise.reject(new Error('no-rooms'));
  return p3RelayPost(rooms[0].id, { type: 'vapid' }).then(function (v) {
    var key = v && (v.vapid || v.key);
    p3Log('vapid', { got: !!key, push: v && v.push }, key ? 'ok' : 'error');
    if (!key) throw new Error('no-vapid');
    return key;
  });
}
/* Registration mirrors the room's mute: a muted room is unsubscribed at the relay (ship rule — muted rooms raise nothing). */
function p3RegisterRoom(roomId) {
  if (!p3State.sub || !roomId) return Promise.resolve(false);
  var room = roomById(roomId), want = !(room && room.muted);
  var body = want ? { type: 'subscribe', subscription: p3State.sub.toJSON ? p3State.sub.toJSON() : p3State.sub } : { type: 'unsubscribe' };
  return p3RelayPost(roomId, body)
    .then(function (r) { var ok = !!(r && r.ok); if (ok) p3State.registered[roomId] = want; p3Log(want ? 'room_registered' : 'room_unregistered', { room: String(roomId).slice(-6), ok: ok }, ok ? 'ok' : 'error'); return ok; })
    .catch(function (e) { p3Log('room_register_failed', { room: String(roomId).slice(-6), e: String(e && e.message || e) }, 'error'); return false; });
}
function p3SyncMutes() {
  if (!p3State.sub) return;
  p3LiveRooms().forEach(function (r) { var want = !r.muted; if (p3State.registered[r.id] !== want) p3RegisterRoom(r.id); });
}
function p3RegisterAll() {
  return Promise.all(p3LiveRooms().map(function (r) { return p3RegisterRoom(r.id); }));
}

/* The attempt. `inGesture` says whether this call sits inside a user tap. */
function p3Attempt(inGesture) {
  p3State.attempts++;
  var prop = (window.Notification && Notification.permission) || 'unsupported';
  p3Log('perm_prop', { prop: prop, gesture: !!inGesture, n: p3State.attempts }, 'info');
  var ready = p3State.reg ? navigator.serviceWorker.ready : p3Register();
  var answer = Promise.resolve(null);
  if (inGesture && window.Notification && Notification.requestPermission) {
    /* Synchronously, inside the tap — the exact order the reference PWA used on the owner's iPhone (4/4). */
    var asked; try { asked = Promise.resolve(Notification.requestPermission()); } catch (e0) { asked = Promise.reject(e0); }
    answer = asked
      .then(function (a) { p3Log('perm_answer', { answer: a, prop: (window.Notification && Notification.permission) || '?' }, 'info'); return a; },
            function (e) { p3Log('perm_answer', { answer: 'threw', e: String(e && e.message || e) }, 'info'); return null; });
  }
  return ready.then(function (reg) {
    return answer.then(function () { return reg.pushManager.getSubscription(); }).then(function (existing) {
      if (existing) { p3Log('sub_existing', {}, 'ok'); return existing; }
      return p3Vapid().then(function (key) {
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: p3B64ToBytes(key) });
      });
    });
  }).then(function (sub) {
    p3State.sub = sub; p3State.lastError = null;
    p3Log('sub_ok', { endpoint: String(sub && sub.endpoint || '').slice(0, 40) }, 'ok');
    return p3RegisterAll().then(function () { return sub; });
  }).catch(function (e) {
    var name = (e && e.name) || 'Error', msg = String(e && e.message || e);
    p3State.lastError = { name: name, msg: msg };
    p3Log('sub_failed', { name: name, e: msg, gesture: !!inGesture }, 'error');
    if (name === 'NotAllowedError') {
      if (inGesture) p3ShowRecipe();
      else p3ArmGesture();
    } else if (!inGesture && msg !== 'no-rooms') {
      p3ArmGesture();
    }
    return null;
  });
}
function p3AttemptInGesture() { return p3Attempt(true); }
/* One-shot: the next real tap re-runs the attempt inside the gesture. */
function p3ArmGesture() {
  if (p3State.gestureArmed) return;
  p3State.gestureArmed = true;
  var h = function () {
    document.removeEventListener('click', h, true);
    p3State.gestureArmed = false;
    p3AttemptInGesture();
  };
  document.addEventListener('click', h, true);
  p3Log('gesture_armed', {}, 'info');
}

/* The owner's F1 device recipe — shown only on a real denial. */
function p3ShowRecipe() {
  if ($('p3-recipe')) return;
  var st = document.createElement('style');
  st.textContent = '#p3-recipe{position:fixed;inset:0;z-index:9998;background:var(--cream,#FDFAF7);display:flex;align-items:center;justify-content:center;padding:24px}'
    + '.p3-card{width:min(92vw,380px);background:#fff;border-radius:18px;padding:24px;box-shadow:0 8px 30px rgba(0,0,0,.12);color:var(--ink,#1A1714)}'
    + '.p3-t{font-size:18px;font-weight:700}.p3-l{font-size:14px;line-height:1.5;margin-top:8px;color:#3a3633}'
    + '.p3-steps{margin:14px 0 0;padding-left:20px;font-size:14.5px;line-height:1.7}.p3-row{margin-top:18px}';
  document.head.appendChild(st);
  var g = document.createElement('div'); g.id = 'p3-recipe';
  g.innerHTML = '<div class="p3-card"><div class="p3-t">Notifications are off for TalkBridge</div>'
    + '<div class="p3-l">Turn them on so calls and messages reach you when the phone is locked:</div>'
    + '<ol class="p3-steps"><li>Open <b>Settings</b> → <b>Apps</b> → <b>TalkBridge</b> → <b>Notifications</b></li>'
    + '<li><b>Allow Notifications</b>: ON</li><li><b>Lock Screen</b>, <b>Notification Center</b>, <b>Banners</b>: all on</li>'
    + '<li><b>Sounds</b>: ON</li><li>Banner style: <b>Temporary</b></li></ol>'
    + '<div class="p3-row"><button class="btn" id="p3-done">Done</button></div></div>';
  document.body.appendChild(g);
  $('p3-done').addEventListener('click', function () { g.remove(); p3AttemptInGesture(); });
  p3Log('recipe_shown', {}, 'error');
}

(function () {
  var _p3Entry = p2Entry;
  p2Entry = function () {
    var r = _p3Entry.apply(this, arguments);
    try {
      if (p2IsStandalone()) {
        /* A5 (plan v20.0.0): the listener heartbeat is deleted — the relay
           holds no liveness view for it to feed. */
        if (p3LiveRooms().length) p3Attempt(false);
        else p3Log('no_rooms_yet', {}, 'info');
      }
    } catch (e) { p3Log('entry_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  document.removeEventListener('DOMContentLoaded', _p3Entry);
  document.addEventListener('DOMContentLoaded', function () { p2Entry(); });

  var _p3RenderPanel = renderPanel;
  renderPanel = function () {
    var r = _p3RenderPanel.apply(this, arguments);
    try { p3SyncMutes(); } catch (_) {}
    return r;
  };
  var _p3EnterRoom = enterRoom;
  enterRoom = function (id) {
    var r = _p3EnterRoom.apply(this, arguments);
    try {
      if (!p3State.sub && !p3State.attempts) p3Attempt(false);
      else if (p3State.sub && !p3State.registered[id]) p3RegisterRoom(id);
    } catch (e) { p3Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
