/* ═══════════ GAP PART · MU1-room-size.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: (none)
   adds: MU1_FULL_HOLD_MS, MU1_CAPS, mu1State, mu1EnsureField, mu1CapFromSheet, mu1CapParam, mu1InvCap, mu1Hold, mu1OnFull, mu1Presence, mu1Member, mu1DisplayName, mu1Others, mu1Call, mu1Chooser, mu1Addressed, mu1ReadBy, mu1Tok, mu1ReadLabel
   markers: room_full, relay_full_hold, mu1_member, mu1_chooser, call_to
*/
/* ─────────────────────────────────────────────────────────────────────────────
   MU-1 · THE ROOM HAS A SIZE (29·pre-ship, §7.8 A-1…A-5, owner 2026-10-09)

   The relay (v6.7) already keeps a cap per room, refuses the device beyond it
   with {type:'full'} and routes the words of an addressed call. This part is
   the app's side of each of those, and nothing that is not on that list:

   A-1  the create sheet gets a "Group chat" switch; on, a size 3…8 (4
        preselected); off, the room is for two. The size rides the room record
        (`cap`), the socket URL (`&cap=`, both lanes) and the invite (`c`).
   A-2  'full' from the relay: one toast, one pill, and the socket is not
        re-asked for 20 s (the base retries every 2 s; the ramp every 300 ms).
   A-3  the peer announcement's count shows as "N here" beside the presence
        dot once more than two are present; who is on a call is remembered.
   A-4  read receipts count readers: ✓ 2 on the bubble, "Read by 2" in the
        detail; a two-person room still shows the single tick.
   A-5  a call names its callee (`to`): the one other member when there is
        one, a chooser when there are more (a member on a call is shown and
        disabled); no member known, no `to` — the relay fans out as before.
        Members are learned from hello / hello-ack / chat / call-start / rename,
        kept on the room record; two with one name display as "name (2)".

   Group media (everyone in one call) is §7.8 A-6, the next candidate.
   ───────────────────────────────────────────────────────────────────────────── */
var MU1_FULL_HOLD_MS = 20000;
var MU1_CAPS = [3, 4, 5, 6, 7, 8];
var mu1State = { hold: {}, said: {}, others: {}, inCall: {} };

/* ── A-1 · the create sheet ─────────────────────────────────────────────────── */
function mu1EnsureField() {
  var m = document.getElementById('m-s3'); if (!m) return;
  var g = document.getElementById('s3-group');
  if (g) {
    g.classList.remove('on');
    var sel0 = document.getElementById('s3-cap'); if (sel0) sel0.value = '4';
    var wrap0 = document.getElementById('s3-cap-wrap'); if (wrap0) wrap0.style.display = 'none';
    return;
  }
  var auto = document.getElementById('s3-autoread'); if (!auto || !auto.parentElement) return;
  var anchor = auto.parentElement;
  var row = document.createElement('div');
  row.className = 'toggle-row';
  row.innerHTML = '<span>Group chat</span><button class="tog" id="s3-group"></button>';
  var wrap = document.createElement('div');
  wrap.id = 's3-cap-wrap'; wrap.style.display = 'none';
  wrap.innerHTML = '<label class="field-label">People in the room</label><select class="field-select" id="s3-cap">'
    + MU1_CAPS.map(function (n) { return '<option value="' + n + '"' + (n === 4 ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select>';
  anchor.parentElement.insertBefore(row, anchor.nextSibling);
  row.parentElement.insertBefore(wrap, row.nextSibling);
  row.querySelector('#s3-group').addEventListener('click', function () {
    var on = !this.classList.contains('on');
    this.classList.toggle('on', on);
    wrap.style.display = on ? '' : 'none';
  });
}
function mu1CapFromSheet() {
  var g = document.getElementById('s3-group');
  if (!g || !g.classList.contains('on')) return 2;
  var v = Number((document.getElementById('s3-cap') || {}).value);
  return (v >= 3 && v <= 8) ? v : 4;
}
function mu1CapParam(room) {
  var c = room ? Number(room.cap) : 0;
  return (c >= 1 && c <= 8) ? '&cap=' + c : '';
}
function mu1InvCap(p, room) {
  var c = room ? Number(room.cap) : 0;
  if (c >= 1 && c <= 8) p.c = c;
  return p;
}

/* ── A-2 · the room is full ─────────────────────────────────────────────────── */
function mu1Hold(room, lane) {
  if (!room) return false;
  var until = mu1State.hold[room.id] || 0;
  var left = until - Date.now();
  if (left <= 0) { if (until) delete mu1State.hold[room.id]; return false; }
  log('relay_full_hold', { room: String(room.id).slice(-6), lane: lane || 'room', ms: left }, 'warn');
  if (!lane) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = setTimeout(function () { wsReconnectTimer = null; if (S.view === 'room' && S.roomId === room.id) relayConnect(); }, left + 50);
  }
  return true;
}
function mu1OnFull(d, roomId) {
  var room = roomById(roomId) || activeRoom(); if (!room) return;
  var cap = Number(d && d.cap) || 0, n = Number(d && d.n) || cap;
  mu1State.hold[room.id] = Date.now() + MU1_FULL_HOLD_MS;
  log('room_full', { room: String(room.id).slice(-6), cap: cap, n: n }, 'warn');
  var said = mu1State.said[room.id] || 0;
  if (said && Date.now() - said < 60000) return;
  mu1State.said[room.id] = Date.now();
  var text = 'Room is full (' + n + ' of ' + cap + ')';
  try { toast(text); } catch (_) {}
  try { if (S.roomId === room.id) addSysPill(text, 'full-' + room.id + '-' + mu1State.said[room.id]); } catch (_) {}
}

/* ── A-3 · how many are here, who is on a call ──────────────────────────────── */
function mu1Presence(d) {
  var room = activeRoom(); if (!room) return;
  var others = Number(d && d.others) || 0;
  mu1State.others[room.id] = others;
  mu1State.inCall[room.id] = (d && Array.isArray(d.inCall)) ? d.inCall.slice() : [];
  var dot = document.getElementById('presence'); if (!dot || !dot.parentElement) return;
  var el = document.getElementById('mu1-count');
  if (!el) { el = document.createElement('span'); el.id = 'mu1-count'; el.className = 'mu1-count'; dot.parentElement.insertBefore(el, dot.nextSibling); }
  el.textContent = others > 1 ? (others + 1) + ' here' : '';
}

/* ── A-5 · who is in the room, by device ────────────────────────────────────── */
function mu1Member(d) {
  if (!d || !d.from || d.from === deviceId || d.from === 'relay') return;
  if (!(d.type === 'hello' || d.type === 'hello-ack' || d.type === 'chat-msg' || d.type === 'call-start' || (d.type === 'sys-pill' && d.newName))) return;
  var room = activeRoom(); if (!room) return;
  var n = String(d.senderName || d.newName || d.name || '').slice(0, 40);
  var ms = room.members || (room.members = {});
  var m = ms[d.from];
  if (m && (!n || m.name === n)) return;
  ms[d.from] = { name: n || (m && m.name) || 'Partner', at: m ? m.at : Date.now() };
  saveRooms();
  log('mu1_member', { room: String(room.id).slice(-6), n: Object.keys(ms).length, named: !!n }, 'ok');
}
function mu1DisplayName(room, id) {
  var ms = (room && room.members) || {}; var m = ms[id]; if (!m) return 'Partner';
  var k = 1;
  Object.keys(ms).forEach(function (o) { if (o !== id && ms[o].name === m.name && (ms[o].at < m.at || (ms[o].at === m.at && o < id))) k++; });
  return k > 1 ? m.name + ' (' + k + ')' : m.name;
}
function mu1Others(room) {
  var ms = (room && room.members) || {};
  var busy = mu1State.inCall[room && room.id] || [];
  return Object.keys(ms).filter(function (id) { return id !== deviceId; })
    .sort(function (a, b) { return (ms[a].at - ms[b].at) || (a < b ? -1 : 1); })
    .map(function (id) { return { id: id, name: mu1DisplayName(room, id), inCall: busy.indexOf(id) !== -1 }; });
}
function mu1Call(kind) {
  var room = activeRoom(); if (!room) return CALL.start(kind);
  var others = mu1Others(room);
  if (others.length <= 1) {
    CALL._to = others.length ? others[0].id : null;
    CALL._toName = others.length ? others[0].name : null;
    return CALL.start(kind);
  }
  mu1Chooser(kind, others);
}
function mu1Chooser(kind, others) {
  var ov = document.getElementById('m-mu1');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'modal-scrim'; ov.id = 'm-mu1';
    ov.innerHTML = '<div class="modal"><div class="modal-title">Who do you want to call?</div><div id="mu1-list"></div>'
      + '<div class="modal-row"><button class="btn ghost" id="mu1-cancel">Cancel</button></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('#mu1-cancel').addEventListener('click', function () { ov.classList.remove('show'); });
  }
  var list = ov.querySelector('#mu1-list'); list.innerHTML = '';
  others.forEach(function (o) {
    var b = document.createElement('button');
    b.className = 'btn mu1-pick' + (o.inCall ? ' ghost' : '');
    b.style.marginTop = '8px';
    b.textContent = o.name + (o.inCall ? ' · on a call' : '');
    b.setAttribute('data-id', o.id);
    if (o.inCall) b.disabled = true;
    b.addEventListener('click', function () { ov.classList.remove('show'); CALL._to = o.id; CALL._toName = o.name; CALL.start(kind); });
    list.appendChild(b);
  });
  ov.classList.add('show');
  log('mu1_chooser', { kind: kind, n: others.length, busy: others.filter(function (o) { return o.inCall; }).length }, 'ok');
}
function mu1Addressed(m, room) {
  var to = CALL._to || null; CALL._to = null;
  if (to) m.to = to;
  log('call_to', { to: to ? String(to).slice(0, 8) : null, n: Object.keys((room && room.members) || {}).length }, 'ok');
  return m;
}

/* ── A-4 · receipts count their readers ─────────────────────────────────────── */
function mu1ReadBy(e, from) {
  var k = String(from || 'partner');
  e.readBy = e.readBy || {};
  if (e.readBy[k]) return false;
  e.readBy[k] = Date.now();
  return true;
}
function mu1Tok(e, r) {
  if (r !== 'read') return '';
  var n = (e && e.readBy) ? Object.keys(e.readBy).length : 0;
  return n > 1 ? '✓ ' + n : '✓';
}
function mu1ReadLabel(e) {
  var n = (e && e.readBy) ? Object.keys(e.readBy).length : 0;
  return n > 1 ? 'Read by ' + n : 'Read';
}

(function () {
  try {
    var st = document.createElement('style');
    st.textContent = '.mu1-count{font-size:11px;font-weight:600;color:var(--ink-dim);margin-left:6px}';
    document.head.appendChild(st);
  } catch (_) {}
})();
