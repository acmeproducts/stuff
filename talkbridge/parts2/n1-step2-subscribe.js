
/* ═══════════ STEP 2 PART · n1-step2-subscribe.js (plan v17.2.0) ═══════════ */
/* One purpose: this phone holds a live push subscription registered with the
   relay for every room. The subscribe ATTEMPT is the only permission truth
   (iOS's answers lie in both directions — device-proven). */
var S2 = { pub: '', state: 'idle', subscribedRooms: {} };

function s2Log(ev, meta) { try { r8Log ? r8Log(ev, meta || {}, 'ok') : log(ev + ' ' + JSON.stringify(meta || {})); } catch (_) { try { log(ev); } catch (__) {} } }
function s2RelayHttp() { return RELAY_WS.replace(/^ws/, 'http'); }
function s2Rooms() { try { return (S.rooms || []).filter(function (r) { return r && r.id; }); } catch (_) { return []; } }
function s2Post(roomId, body) {
  var did = (S.user && S.user.deviceId) || (localStorage.getItem('tb_device') || 'dev');
  return fetch(s2RelayHttp() + '/signal?app=talk-say-v1&session=' + encodeURIComponent(roomId) + '&client=' + encodeURIComponent(did),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(function (r) { return r.json().then(function (j) { j._status = r.status; return j; }); })
    .catch(function () { return null; });
}
function s2B64ToU8(s) {
  var pad = '='.repeat((4 - s.length % 4) % 4);
  var b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  var a = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}

function s2Subscribe() {
  if (!('serviceWorker' in navigator)) { s2Log('s2_exit', { e: 'no-sw' }); return Promise.resolve(); }
  var rooms = s2Rooms();
  if (!rooms.length) { s2Log('s2_exit', { e: 'no-rooms' }); return Promise.resolve(); }
  /* ask synchronously if we're inside a tap; the ANSWER is recorded, never obeyed */
  var ask = (window.Notification && Notification.permission === 'default')
    ? Notification.requestPermission() : Promise.resolve(window.Notification ? Notification.permission : 'unsupported');
  return Promise.resolve(ask).then(function (ans) {
    s2Log('s2_perm', { ans: ans, prop: (window.Notification && Notification.permission) || '?' });
    return navigator.serviceWorker.register('./tb-sw.js').then(function () { return navigator.serviceWorker.ready; });
  }).then(function (reg) {
    if (!reg.pushManager) { s2Log('s2_exit', { e: 'no-pushmanager' }); return; }
    return reg.pushManager.getSubscription().then(function (existing) {
      if (existing) { s2Log('s2_sub', { src: 'existing', host: new URL(existing.endpoint).host }); return existing; }
      return s2Post(rooms[0].id, { type: 'vapid' }).then(function (v) {
        var key = v && (v.vapid || v.key);
        if (!key) { s2Log('s2_exit', { e: 'vapid', st: v && v._status }); throw new Error('vapid'); }
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: s2B64ToU8(key) })
          .then(function (sub) { s2Log('s2_sub', { src: 'fresh', host: new URL(sub.endpoint).host }); return sub; });
      });
    });
  }).then(function (sub) {
    if (!sub) return;
    var json = sub.toJSON();
    return Promise.all(s2Rooms().map(function (r) {
      if (S2.subscribedRooms[r.id]) return null;
      return s2Post(r.id, { type: 'subscribe', subscription: json }).then(function (res) {
        if (res && (res.ok || res._status === 200)) { S2.subscribedRooms[r.id] = 1; s2Log('s2_room', { room: String(r.id).slice(-6) }); }
        else s2Log('s2_room_fail', { room: String(r.id).slice(-6), st: res && res._status });
      });
    })).then(function () { S2.state = 'on'; s2Banner(); });
  }).catch(function (e) {
    var n = (e && e.name) || 'Error';
    if (n === 'NotAllowedError') { S2.state = 'blocked'; s2Log('s2_exit', { e: 'denied-by-subscribe' }); }
    else s2Log('s2_exit', { e: String(e && e.message || e), name: n });
    s2Banner();
  });
}

function s2Banner() {
  try {
    var ex = document.getElementById('s2-nb');
    var need = S2.state !== 'on' && s2Rooms().length &&
      !(window.Notification && Notification.permission === 'granted' && S2.state === 'idle');
    if (S2.state === 'on') { if (ex) ex.remove(); return; }
    if (ex) { ex.textContent = s2BannerText(); return; }
    var host = document.getElementById('panel-body');
    if (!host || !host.parentNode) return;
    var b = document.createElement('button');
    b.id = 's2-nb'; b.type = 'button';
    b.style.cssText = 'display:block;width:100%;padding:13px;font-size:15px;font-weight:700;border:none;border-radius:0;background:#2E8B8B;color:#fff';
    b.textContent = s2BannerText();
    b.addEventListener('click', function () { s2Subscribe(); });
    host.parentNode.insertBefore(b, host);
    s2Log('s2_banner', { state: S2.state });
  } catch (_) {}
}
function s2BannerText() {
  return S2.state === 'blocked'
    ? '🔔 iOS is blocking notifications. Settings → Notifications → TalkBridge → Allow ON (off/on if already on), then reopen.'
    : '🔔 Turn on notifications — tap once.';
}

setTimeout(function () { s2Subscribe(); }, 1400);
document.addEventListener('visibilitychange', function () {
  try { if (!document.hidden && S2.state !== 'on') s2Subscribe(); } catch (_) {}
});
setTimeout(s2Banner, 2600);
