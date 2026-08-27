
/* ═══════════ R10 PART · P6-threads.js ═══════════ */
/* @contract
   wraps: roomCardHtml, wireRoomCards, renderPanel, handleRelay, LISTEN.handle
   adds: p6Log, p6State, p6CSS, p6AskName, p6CreateThread, p6InviteMsg, p6ResendPending, p6OnInvite, p6Accept, p6Decline, p6InviteCardHtml, p6Stamp, p6OnAnswer, p6Answer, p6ThreadRoom, p6Parent
   Plan v19.5.0 §4.1 P6 — THREADS with consent, owner design.
   Every room card carries + ("add a thread"). Bob taps +, names it; a derived
   room appears for him and an INVITE rides the parent room to Alice's panel:
   thread name, from Bob, Accept / Decline. Either answer is timestamped into
   the PARENT room's transcript on both sides (the ship's own sys-pill, which
   already carries date + time). Accept: the thread card appears for her,
   subscribed (P3 registration) and notified normally. Decline: nothing appears
   for her. The invite is push-worthy at relay v4; a pending invite is re-sent
   whenever the partner (re)appears on the parent socket, so a phone that was
   asleep still receives it — de-duplicated by thread id on arrival.
*/
var p6State = { modalWired: false };
function p6Log(what, data, level) { try { log('p6_' + what, data || {}, level || 'info'); } catch (_) {} }
var p6CSS =
  '.rc2-plus{background:none;border:1.5px solid var(--teal);color:var(--teal);border-radius:50%;width:22px;height:22px;line-height:0;font-size:17px;font-weight:700;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;margin-left:auto}' +
  '.p6-inv{background:#fff;border:1.5px solid var(--teal);border-radius:14px;padding:11px 12px;margin-bottom:8px}' +
  '.p6-inv-t{font-size:14.5px;font-weight:700}.p6-inv-s{font-size:12.5px;color:var(--ink-dim);margin-top:2px}' +
  '.p6-inv-row{display:flex;gap:8px;margin-top:10px}.p6-inv-row .btn{flex:1;padding:8px 0;font-size:13.5px}';

function p6Parent(room) { return room && room.parentId ? roomById(room.parentId) : null; }
function p6Stamp(parentId, text, threadId, answer) {
  /* Into the parent transcript on this side now, and to the other side on the ship's own sys-pill path
     (extra fields ride along; the ship ignores them, the offerer reads them to close the offer). */
  var id = 'p6-' + uid();
  var tr = loadTr(parentId);
  if (!tr.some(function (x) { return x.id === id; })) {
    if (S.roomId === parentId) addSysPill(text, id); else { tr.push({ id: id, kind: 'sys', text: text, ts: Date.now() }); lsSet(trKey(parentId), tr); }
  }
  var m = { type: 'sys-pill', text: text, pillId: id, threadId: threadId, answer: answer };
  return (S.roomId === parentId) ? relaySend(m) : LISTEN.send(parentId, m);
}
function p6OnAnswer(parentId, d) {
  var parent = roomById(parentId); if (!parent || !d || !d.threadId || !parent.threadsOffered) return;
  parent.threadsOffered.forEach(function (o) { if (o.id === d.threadId && o.status === 'pending') { o.status = d.answer === 'accepted' ? 'accepted' : 'declined'; o.answeredAt = Date.now(); } });
  saveRooms();
  p6Log('offer_closed', { parent: String(parentId).slice(-6), thread: String(d.threadId).slice(-6), answer: d.answer }, 'ok');
}
function p6ThreadRoom(parent, threadId, name) {
  return { id: threadId, role: parent.role, title: name, partnerName: parent.partnerName || '', myLang: parent.myLang, theirLang: parent.theirLang, myName: parent.myName || S.user.name || '',
    autoRead: !!parent.autoRead, muted: false, goBtn: true, meta: parent.meta || 'top', ear: parent.ear !== false, theme: parent.theme || undefined,
    createdAt: Date.now(), lastAt: Date.now(), joined: true, unread: 0, parentId: parent.id, threadName: name };
}
function p6InviteMsg(parent, t) {
  return { type: 'thread-invite', threadId: t.id, name: t.name, fromName: parent.myName || S.user.name || '' };
}
function p6CreateThread(parentId, name) {
  var parent = roomById(parentId); if (!parent) return null;
  name = norm(name || '').slice(0, 60); if (!name) return null;
  var t = p6ThreadRoom(parent, uid(), name);
  S.rooms.push(t);
  parent.threadsOffered = parent.threadsOffered || [];
  parent.threadsOffered.push({ id: t.id, name: name, at: Date.now(), status: 'pending' });
  saveRooms();
  var sent = (S.roomId === parentId) ? relaySend(p6InviteMsg(parent, { id: t.id, name: name })) : LISTEN.send(parentId, p6InviteMsg(parent, { id: t.id, name: name }));
  p6Log('thread_created', { parent: String(parentId).slice(-6), thread: String(t.id).slice(-6), sent: !!sent }, 'ok');
  renderPanel();
  try { LISTEN.sync(); } catch (_) {}
  try { if (typeof p3RegisterRoom === 'function') p3RegisterRoom(t.id); } catch (_) {}
  return t;
}
/* Pending invites ride again whenever the partner speaks on the parent — the phone that slept still gets it. */
function p6ResendPending(parentId) {
  var parent = roomById(parentId); if (!parent || !parent.threadsOffered) return 0;
  var n = 0;
  parent.threadsOffered.forEach(function (o) {
    if (o.status !== 'pending') return;
    var ok = (S.roomId === parentId) ? relaySend(p6InviteMsg(parent, o)) : LISTEN.send(parentId, p6InviteMsg(parent, o));
    if (ok) n++;
  });
  if (n) p6Log('invites_resent', { parent: String(parentId).slice(-6), n: n }, 'ok');
  return n;
}
function p6OnInvite(parentId, d) {
  var parent = roomById(parentId); if (!parent || !d || !d.threadId) return false;
  if (roomById(d.threadId)) return false;                                   /* already accepted → a card exists */
  parent.threadInvites = parent.threadInvites || [];
  if (parent.threadInvites.some(function (i) { return i.id === d.threadId; })) return false;
  if ((parent.threadsAnswered || []).indexOf(d.threadId) >= 0) return false; /* already declined */
  parent.threadInvites.push({ id: d.threadId, name: String(d.name || 'Thread').slice(0, 60), from: String(d.fromName || parent.partnerName || 'Partner').slice(0, 40), at: d.ts || Date.now() });
  saveRooms(); renderPanel();
  toast((d.fromName || parent.partnerName || 'Partner') + ' invited you to \u2018' + (d.name || 'a thread') + '\u2019');
  p6Log('invite_received', { parent: String(parentId).slice(-6), thread: String(d.threadId).slice(-6) }, 'ok');
  return true;
}
function p6Answer(parentId, threadId, accepted) {
  var parent = roomById(parentId); if (!parent) return;
  var inv = (parent.threadInvites || []).filter(function (i) { return i.id === threadId; })[0]; if (!inv) return;
  parent.threadInvites = parent.threadInvites.filter(function (i) { return i.id !== threadId; });
  parent.threadsAnswered = parent.threadsAnswered || []; parent.threadsAnswered.push(threadId);
  var me = parent.myName || S.user.name || 'Partner';
  if (accepted) { S.rooms.push(p6ThreadRoom(parent, threadId, inv.name)); }
  saveRooms();
  p6Stamp(parentId, me + (accepted ? ' accepted ' : ' declined ') + '\u2018' + inv.name + '\u2019', threadId, accepted ? 'accepted' : 'declined');
  p6Log(accepted ? 'invite_accepted' : 'invite_declined', { parent: String(parentId).slice(-6), thread: String(threadId).slice(-6) }, 'ok');
  renderPanel();
  if (accepted) { try { LISTEN.sync(); } catch (_) {} try { if (typeof p3RegisterRoom === 'function') p3RegisterRoom(threadId); } catch (_) {} }
}
function p6Accept(parentId, threadId) { p6Answer(parentId, threadId, true); }
function p6Decline(parentId, threadId) { p6Answer(parentId, threadId, false); }
function p6InviteCardHtml(parent, inv) {
  return '<div class="p6-inv" data-p6-parent="' + parent.id + '" data-p6-thread="' + inv.id + '">' +
    '<div class="p6-inv-t">' + esc(inv.name) + '</div>' +
    '<div class="p6-inv-s">Thread from ' + esc(inv.from) + ' \u00b7 in ' + esc(roomTitle(parent)) + '</div>' +
    '<div class="p6-inv-row"><button class="btn ghost" data-p6-decline="1">Decline</button><button class="btn" data-p6-accept="1">Accept</button></div></div>';
}
/* Name the thread — the ship's own modal chrome. */
function p6AskName(parentId) {
  var scrim = $('m-p6');
  if (!scrim) {
    scrim = document.createElement('div'); scrim.className = 'modal-scrim'; scrim.id = 'm-p6';
    scrim.innerHTML = '<div class="modal"><div class="modal-title">Add a thread</div><input class="field-input" id="p6-name" maxlength="60" placeholder="Thread name" autocomplete="off">' +
      '<div class="modal-row"><button class="btn ghost" id="p6-cancel">Cancel</button><button class="btn" id="p6-ok">OK</button></div></div>';
    $('app').appendChild(scrim);
    $('p6-cancel').addEventListener('click', function () { scrim.classList.remove('show'); });
    $('p6-ok').addEventListener('click', function () {
      var v = norm($('p6-name').value); if (!v) return;
      scrim.classList.remove('show');
      p6CreateThread(scrim.dataset.parent, v);
    });
    $('p6-name').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') $('p6-ok').click(); });
  }
  scrim.dataset.parent = parentId; $('p6-name').value = ''; scrim.classList.add('show');
  try { $('p6-name').focus(); } catch (_) {}
}

(function () {
  try { var st = document.createElement('style'); st.textContent = p6CSS; document.head.appendChild(st); } catch (_) {}

  var _p6CardHtml = roomCardHtml;
  roomCardHtml = function (r, where) {
    var h = _p6CardHtml.apply(this, arguments);
    try {
      if (h && r && !r.sendLocked) h = h.replace('</div><div class="rc2-flags">', '<button class="rc2-plus" data-thread="' + r.id + '" aria-label="Add a thread">+</button></div><div class="rc2-flags">');
    } catch (_) {}
    return h;
  };
  var _p6Wire = wireRoomCards;
  wireRoomCards = function (host) {
    var r = _p6Wire.apply(this, arguments);
    try {
      if (host) Array.prototype.forEach.call(host.querySelectorAll('[data-thread]'), function (el) {
        el.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); p6AskName(el.dataset.thread); });
      });
    } catch (e) { p6Log('wire_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _p6RenderPanel = renderPanel;
  renderPanel = function () {
    var r = _p6RenderPanel.apply(this, arguments);
    try {
      var body = $('panel-body'); if (!body) return r;
      var h = '';
      S.rooms.filter(function (x) { return !x.deletedAt && x.threadInvites && x.threadInvites.length; }).forEach(function (parent) {
        parent.threadInvites.forEach(function (inv) { h += p6InviteCardHtml(parent, inv); });
      });
      if (h) {
        var wrap = document.createElement('div'); wrap.id = 'p6-invites'; wrap.innerHTML = h;
        body.insertBefore(wrap, body.firstChild);
        Array.prototype.forEach.call(wrap.querySelectorAll('.p6-inv'), function (card) {
          var pid = card.dataset.p6Parent, tid = card.dataset.p6Thread;
          card.querySelector('[data-p6-accept]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Accept(pid, tid); });
          card.querySelector('[data-p6-decline]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Decline(pid, tid); });
        });
      }
    } catch (e) { p6Log('panel_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _p6HandleRelay = handleRelay;
  handleRelay = function (d) {
    var r = _p6HandleRelay.apply(this, arguments);
    try {
      if (d && d.from !== deviceId && S.roomId) {
        if (d.type === 'thread-invite') p6OnInvite(S.roomId, d);
        else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(S.roomId, d);
        else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(S.roomId);
      }
    } catch (e) { p6Log('relay_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _p6Listen = LISTEN.handle;
  LISTEN.handle = function (roomId, d) {
    var r = _p6Listen.apply(this, arguments);
    try {
      if (d && d.from !== deviceId) {
        if (d.type === 'thread-invite') p6OnInvite(roomId, d);
        else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(roomId, d);
        else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(roomId);
      }
    } catch (e) { p6Log('listen_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
