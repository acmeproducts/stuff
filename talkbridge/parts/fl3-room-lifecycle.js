/* ═══════════ GAP PART · FL3-room-lifecycle.js ═══════════ */
/* @contract
   replaces: enterRoom, leaveRoomInternals, joinRoom, openS3, invUrl
   wraps: (none)
   adds: enterRoomCore, leaveRoomInternalsCore, joinRoomCore, openS3Core, invUrlCore, _lcInvUrl, fl3EnsureField, fl3Prefill, fl3Stamp, fl3TStamp, fl3Declare
   licence: §0c-1 (owner, 2026-09-21) — flattening, cluster 3: room lifecycle
*/
/* ─────────────────────────────────────────────────────────────────────────────
   FL-3 · THE ROOM LIFECYCLE, ONE FUNCTION PER SYMBOL (§7.16 cluster 3)

   Every layer that wrapped these five symbols is REMOVED from the accepted
   28·pre-ship c4 bytes (each banked byte for byte under
   talkbridge/fixtures/flatten/28s/ and named in removals.json) and its effect
   is written here in the order the stack ran it: "before" work top-down, the
   base body, "after" work bottom-up. The base bodies are kept verbatim as
   *Core functions.

   Four helpers lived as closure-locals inside parts that keep other work
   (B8c's `ensureField` / `prefill` and `stamp`, W1's `tStamp`, PR2's
   `declare`). `ensureField` / `prefill` served only the openS3 layer and move
   here whole. `stamp`, `tStamp` and `declare` are still used by wrappers of
   OTHER symbols (`linkDeviceUrl`, `showScreen`, the window listeners), so
   those stay where they are and this part carries verbatim copies —
   fl3Stamp, fl3TStamp, fl3Declare — recorded in the plan as the one
   duplication of this cluster.

   NOTHING NEW. Same log lines, same order, same wire, same early exits,
   same swallowed errors. One literal oddity kept on purpose: the invite link
   was stamped with the name and the title TWICE (the L layer's inner
   reference was re-wrapped by the two stampers as well as the outer one);
   both stamps are idempotent, and the flat function applies them exactly as
   the stack did.

   Layer order reproduced (outermost first):
     enterRoom           PR2 (after) → B8c (before) → CR3 (around) → P4 (after) → P3 (after) → M (after) → L (around) → J (around) → R (after) → A (before) → base
     leaveRoomInternals  PR2 (after) → CR3 (around) → A (before) → base
     joinRoom            W1 (around) → L (after) → J (after) → base
     openS3              B8c (after) → L (after) → base
     invUrl              T (after) → S/B8c (after) → L (around, inner re-stamped) → base
   ───────────────────────────────────────────────────────────────────────────── */

/* ── moved whole (B8c): the "your name in this chat" field on the create sheet ── */
function fl3EnsureField() {
  var m = document.getElementById('m-s3'); if (!m) return;
  if (document.getElementById('s3-myname')) { fl3Prefill(); return; }
  var ok = document.getElementById('s3-ok'); if (!ok) return;
  var lab = document.createElement('label');
  lab.className = 'field-label'; lab.textContent = 'Your name in this chat';
  var inp = document.createElement('input');
  inp.id = 's3-myname'; inp.type = 'text'; inp.autocomplete = 'off';
  inp.className = 'field-select';
  var anchor = m.querySelector('.toggle-row') || ok.parentElement;
  anchor.parentElement.insertBefore(lab, anchor);
  anchor.parentElement.insertBefore(inp, anchor);
  fl3Prefill();
}
function fl3Prefill() {
  var inp = document.getElementById('s3-myname'); if (!inp) return;
  try { if (!inp.value) inp.value = (S.user && S.user.name) || ''; } catch (_) {}
}
/* ── verbatim copies (B8c `stamp`, W1 `tStamp`, PR2 `declare`) ──────────────── */
function fl3Stamp(url, room) {
  try {
    var i = url.indexOf('#j='); if (i === -1) return url;
    var p = decInv(url.slice(i + 3)); if (!p) return url;
    var n = (room && room.myName) || (S.user && S.user.name) || '';
    if (!n) return url;
    if (p.n !== undefined) p.n = n;
    if (p.myn !== undefined) p.myn = n;
    return url.slice(0, i) + '#j=' + encInv(p);
  } catch (_) { return url; }
}
function fl3TStamp(url, room) {
  try {
    var i = url.indexOf('#j='); if (i === -1) return url;
    var p = decInv(url.slice(i + 3)); if (!p) return url;
    p.t = (room && room.title) || p.t || '';
    return url.slice(0, i) + '#j=' + encInv(p);
  } catch (_) { return url; }
}
function fl3Declare(why) {
  try {
    cr3Announce(why);
    var w = (typeof cr3StateWord === 'function' && typeof S !== 'undefined' && S.roomId) ? cr3StateWord(S.roomId) : null;
    if (typeof log === 'function') log('pr2_declared', { why: why, inRoom: !!(w && w.inRoom), view: (typeof S !== 'undefined' ? S.view : '?') }, 'ok');
  } catch (_) {}
}

/* ── invUrl ────────────────────────────────────────────────────────────────── */
function invUrlCore(room){
  var k=(localStorage.getItem('tb_dg_key')||'').trim();
  var tid=(localStorage.getItem('tb_cf_tid')||'').trim();
  var tok=(localStorage.getItem('tb_cf_tok')||'').trim();
  return location.href.split('?')[0].split('#')[0]+'#j='+encInv({r:room.id,ml:room.myLang,tl:room.theirLang,n:S.user.name||'',k:k,tid:tid,tok:tok});
}
/* The L layer's inner reference to the plain link, as the two stampers left it
   (tStamp(stamp(base))). It keeps its name because `buildGrantLink`, which
   stays in the L part, calls it by that name: a grant link is built on the
   plain link. Not a wrapper — a named dependency, defined once, here. */
var _lcInvUrl = function (room) { return fl3TStamp(fl3Stamp(invUrlCore(room), room), room); };
function invUrl(room) {
  var url;
  /* L · a grant link for a granting room; the plain link otherwise */
  if (room && room.grant && room.grantExpires) {
    url = buildGrantLink(room, room.grantExpires);
    lcLog('invite_built', { room: String(room.id).slice(-6), grant: true, expires: room.grantExpires }, 'ok');
  } else {
    lcLog('invite_built', { room: room && String(room.id).slice(-6), grant: false }, 'ok');
    url = _lcInvUrl(room);
  }
  return fl3TStamp(fl3Stamp(url, room), room);                   /* S then T, on the outside */
}

/* ── openS3 ────────────────────────────────────────────────────────────────── */
function openS3Core(){
  populateLangSelects();
  $('s3-my').value='en';$('s3-their').value='th';
  $('s3-autoread').classList.remove('on');
  $('m-s3').classList.add('show');
}
function openS3() {
  var r = openS3Core.apply(this, arguments);                      /* base */
  try {                                                           /* L · the create sheet's own fields */
    installCreateFields();
    if ($('s3-name')) $('s3-name').value = '';
    if ($('s3-grant')) $('s3-grant').classList.remove('on');
    if ($('s3-exp-wrap')) $('s3-exp-wrap').style.display = 'none';
    if ($('s3-autoread')) $('s3-autoread').classList.remove('on');
    if ($('s3-exp')) $('s3-exp').value = new Date(Date.now() + GRANT_DEFAULT_DAYS * 86400000).toISOString().slice(0, 10);
  } catch (e) { lcLog('create_open_failed', { e: String(e && e.message || e) }, 'error'); }
  try { fl3EnsureField(); } catch (_) {}                          /* B8c · the name field */
  return r;
}

/* ── leaveRoomInternals ────────────────────────────────────────────────────── */
function leaveRoomInternalsCore(){
  if(CALL.active)CALL.hangUp(true);
  if(CHATMIC.on)CHATMIC.stop(true); // was leaking across room switches — never torn down on exit
  relayDisconnect();
  if(PB.isDirty())pbWriteBack();
  S.roomId=null;transcript=[];
}
function leaveRoomInternals() {
  var left = S.roomId;                                            /* CR3 before */
  GEN.bump('room_leave');                                         /* A before */
  var r = leaveRoomInternalsCore.apply(this, arguments);          /* base */
  /* CR3 after · G21: leaving a room opens that room's listener lane in the same action. */
  try { LISTEN.sync(); cr3Log('leave_lane', { room: left }, 'ok'); cr3Recover('leave'); } catch (e) { cr3Log('leave_failed', { e: String(e && e.message || e) }, 'error'); }
  fl3Declare('leave_room');                                       /* PR2 after */
  return r;
}

/* ── enterRoom ─────────────────────────────────────────────────────────────── */
function enterRoomCore(id){
  var room=roomById(id);if(!room)return;
  if(S.roomId===id&&S.view==='room'){closePanel();return}
  if(S.roomId&&S.roomId!==id)leaveRoomInternals();
  S.roomId=id;
  transcript=loadTr(id);
  room.unread=0;saveRooms();
  showScreen('room');
  $('room-menu-btn').style.display=S.roomLocked?'none':'';
  renderRoomHead();renderDrawerValues();renderTranscript();renderInviteCard();syncGoBtn();applyBubbleTheme();
  $('rb-mic').classList.toggle('off',!CHATMIC.on); // defensive: mic icon must always reflect real state on entry
  relayConnect();
  ensureNotifPerm();
  LISTEN.sync();
  PB.load(bookDir(room));
  var flush=PB.isDirty()?pbWriteBack():Promise.resolve();
  flush.then(function(){return pbPull()}).then(function(r){
    if(!r)return;
    if(r.status==='no-pair-file')toast('No shared phrasebook yet');
    else if(r.status==='no-pat')toast('Phrasebook: add GitHub PAT in Calling & sync keys');
    else if(r.status==='auth')toast('Phrasebook: GitHub rejected the PAT — check it in Calling & sync keys',5200);
    else if(r.status==='error')toast(location.protocol==='file:'?'Phrasebook can\'t sync from file:// — use the deployed URL':'Phrasebook sync failed: '+(r.detail||''));
    else if(r.status==='ok'&&!r.unchanged)toast('Phrasebook loaded · '+r.n+' phrases (v'+r.version+')');
  });
  log('room_enter',{id:id,role:room.role},'ok');
}
function enterRoom(id) {
  /* B8c before · a room created moments ago adopts the field's value */
  try {
    var inp = document.getElementById('s3-myname');
    var v = inp && inp.value && inp.value.trim();
    var r0 = (S.rooms || []).filter(function (x) { return x.id === id; })[0];
    if (v && r0 && r0.role === 'creator' && Date.now() - (r0.createdAt || 0) < 5000 && r0.myName !== v) {
      r0.myName = v; saveRooms(); log('b8c_room_name_set', { n: v.slice(0, 12) }, 'ok');
    }
    if (inp) inp.value = '';
  } catch (_) {}
  var before = S.roomId;                                          /* CR3 before */
  enforceGrantExpiry();                                           /* L before */
  /* Before the original runs, so the invite link it builds already knows the room's name and whether it grants. */
  try { applyPendingCreate(id); } catch (e) { lcLog('apply_pending_failed', { e: String(e && e.message || e) }, 'error'); }
  /* J before · a session opened from an invite carries its payload; apply it before the room is entered */
  try { if (S.invitePayload && S.invitePayload.r === id) applyInvitePayload(S.invitePayload); } catch (_) {}
  /* A before · exactly one advance per room change; a switch advances on the leave path */
  var willLeave = !!(S.roomId && S.roomId !== id);
  if (!willLeave && S.roomId !== id) GEN.bump('room_enter');
  var r = enterRoomCore.apply(this, arguments);                   /* base */
  try {                                                           /* R after */
    var room = roomById(id);
    if (room) { clearWaiting(room); saveRooms(); renderHome(); }
  } catch (e) { rcLog('enter_clear_failed', { e: String(e && e.message || e) }, 'error'); }
  try {                                                           /* J after */
    var btn = $('room-menu-btn');
    if (btn && btn.style.display === 'none') { btn.style.display = ''; jLog('room_switcher_restored', {}, 'ok'); }
    var roomJ = roomById(id);
    if (roomJ) jLog('entered', { room: String(id).slice(-6), myLang: roomJ.myLang, theirLang: roomJ.theirLang, role: roomJ.role }, 'ok');
  } catch (e) { jLog('enter_failed', { e: String(e && e.message || e) }, 'error'); }
  try { applySendLock(roomById(id)); } catch (_) {}               /* L after */
  try {                                                           /* M after */
    buildDrawerLayout();
    var roomM = roomById(id);
    if (roomM) {
      var f = $('s4b-title'); if (f) f.value = roomM.title || '';
    }
  } catch (e) { rmLog('enter_failed', { e: String(e && e.message || e) }, 'error'); }
  try {                                                           /* P3 after */
    if (!p3State.sub && !p3State.attempts) p3Attempt(false);
    else if (p3State.sub && !p3State.registered[id]) p3RegisterRoom(id);
  } catch (e) { p3Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
  try { p4CloseTag(id); } catch (_) {}                            /* P4 after */
  try {                                                           /* CR3 after · explicit open acknowledges the exact durable set */
    if (S.roomId === id) {
      var ws = (typeof _relayWs !== 'undefined') ? _relayWs : null;
      if (ws && ws.readyState === 1 && before === id) cr3Send(id, { type: 'ev-open' });
      else cr3State.openPending[id] = 1;
    }
  } catch (e) { cr3Log('enter_failed', { e: String(e && e.message || e) }, 'error'); }
  fl3Declare('enter_room');                                       /* PR2 after */
  return r;
}

/* ── joinRoom ──────────────────────────────────────────────────────────────── */
function joinRoomCore(p){
  var name=S.user.name||norm($('s10-name').value).slice(0,40);
  if(!name){$('s10-err').style.display='block';return}
  $('s10-err').style.display='none';
  if(!S.user.name){S.user.name=name;saveUser()}
  // keys ride in memory only — never localStorage on the joiner device
  S.joinerKeys={k:p.k||'',tid:p.tid||'',tok:p.tok||''};
  var room=roomById(p.r);
  if(!room){
    room={id:p.r,role:'joiner',title:p.n||'',partnerName:p.n||'',myLang:p.tl,theirLang:p.ml,myName:name,
      autoRead:false,muted:false,goBtn:true,meta:'top',createdAt:Date.now(),lastAt:Date.now(),joined:true,unread:0};
    S.rooms.push(room);saveRooms();
  }
  enterRoom(room.id);
}
function joinRoom(p) {
  var fresh = false;                                              /* W1 before */
  try { fresh = !!(p && p.r && typeof roomById === 'function' && !roomById(p.r)); } catch (_) {}
  var r = joinRoomCore.apply(this, arguments);                    /* base */
  try { applyInvitePayload(p); } catch (e) { jLog('join_apply_failed', { e: String(e && e.message || e) }, 'error'); }   /* J after */
  try {                                                           /* L after · a grant link persists; a plain invite does not */
    if (p && p.g === 1) writeGrantedCredentials(p, p.r);
    else lcLog('joined_plain', { room: p && String(p.r).slice(-6) }, 'ok');
  } catch (e) { lcLog('join_grant_failed', { e: String(e && e.message || e) }, 'error'); }
  try {                                                           /* W1 after · the welcome pill */
    if (fresh && p && (p.n || p.t) && typeof addSysPill === 'function' && S.roomId === p.r) {
      var mine = (typeof gL === 'function' && p.tl) ? gL(p.tl).name : (p.tl || '');
      var theirs = (typeof gL === 'function' && p.ml) ? gL(p.ml).name : (p.ml || '');
      var langs = (mine && theirs) ? ' (' + mine + ' ↔ ' + theirs + ')' : '';
      addSysPill((p.n || 'Someone') + ' is inviting you to ' + (p.t || 'their chat') + langs);
      log('w1_welcome', { n: (p.n || '').slice(0, 12), t: (p.t || '').slice(0, 16), l: (p.tl || '') + '-' + (p.ml || '') }, 'ok');
    }
  } catch (_) {}
  return r;
}
