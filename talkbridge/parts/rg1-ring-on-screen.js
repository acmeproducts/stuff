/* ═══════════ 30·ship PART · RG-1 ring-on-screen.js — A CALL RINGS ON SCREEN WHENEVER THE APP IS ON SCREEN (§7.25 item 5, B-9d) ═══════════ */
/* @contract
   replaces: (none)   wraps: CALL.onIncoming, cr3PresentCalls (each original kept and called)
   adds: RG, rgLog, rgMenus, rgState, rgHeal, rgCloseMenus, rgCloseCallCard, rgPresented, rgInput, _rgIncoming, _rgPresent, rgInit
   markers (rgLog's own prefix 'rg_'): ring_check, healed, presented, menus_closed, card_closed, failed

   THE OWNER (2026-11-16): with the room menu (…) open, ringing is sporadic — a notification icon, pull the shade, tap the call
   banner, then the call screen.
   THE READING (to be proven by this build's own log, rg_ring_check): the ring waits for "attended" (visible AND a flag that a
   window blur clears and focus / a return to visible / a route tap set). A blur with no matching focus — the room menu holds
   five colour pickers and selects; the shade — leaves the flag false while the person is looking; the relay was told
   visible:false and sent the call to the OS instead.
   THE CHANGE, on the ring path only (cr3Attended itself is untouched — G23's attendance everywhere else is unchanged):
     · before the decision, rg_ring_check logs the UN-healed state (flag, hidden, hasFocus, view, open menus);
     · flag false while visible AND document.hasFocus(): the flag is stale — set (cr3SetAttended 'ring_heal') and announced;
     · a real input (pointerdown / keydown, capture) while visible and the flag false also sets it — a touch is attention;
     · when the ring presents: the OS call card (tag tb-call-<callId>) and the room's notification close (no double alert), and
       the menus close — the rail, the Customize drawer (its own close, which keeps the room name, as D-14 does at accept), any
       open modal sheet, the room-info pop-up; a focused picker is blurred. */
var RG = { heals: 0, inputHeals: 0, wired: false };
function rgLog(what, d, lvl) { try { log('rg_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function rgMenus() {
  var out = [];
  try {
    var lp = document.getElementById('left-panel'); if (lp && lp.classList.contains('open')) out.push('rail');
    var dr = document.getElementById('drawer-s4b'); if (dr && dr.classList.contains('open')) out.push('drawer');
    Array.prototype.forEach.call(document.querySelectorAll('.modal-scrim.show'), function (m) { out.push(m.id || 'modal'); });
    if (typeof RM !== 'undefined' && RM.pop) out.push('pop');
    var ae = document.activeElement; if (ae && (ae.tagName === 'SELECT' || (ae.tagName === 'INPUT' && ae.type === 'color'))) out.push('picker');
  } catch (_) {}
  return out;
}
function rgState() {
  var f = null; try { f = document.hasFocus ? document.hasFocus() : null; } catch (_) {}
  return { flag: cr3State.attended, hidden: !!document.hidden, focus: f, view: S.view, menus: rgMenus() };
}
function rgHeal(why) {
  try {
    if (cr3State.attended !== false || document.hidden || !document.hasFocus || !document.hasFocus()) return false;
    cr3SetAttended(true, why); RG.heals++;
    rgLog('healed', { why: why }, 'ok');
    try { cr3Announce(why); } catch (_) {}
    return true;
  } catch (_) { return false; }
}
function rgCloseCallCard(callId, roomId) {
  try {
    if (!callId || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      if (!reg || !reg.getNotifications) return;
      return reg.getNotifications().then(function (ns) {
        var n = 0; (ns || []).forEach(function (x) { if (x && x.tag === 'tb-call-' + callId) { try { x.close(); n++; } catch (_) {} } });
        if (n) rgLog('card_closed', { callId: callId, n: n }, 'ok');
      });
    }).catch(function () {});
  } catch (_) {}
}
function rgCloseMenus() {
  var closed = [];
  try { if (S.panelOpen) { closePanel(); closed.push('rail'); } } catch (_) {}
  try { var dr = document.getElementById('drawer-s4b'); if (dr && dr.classList.contains('open')) { closeDrawerCore(); closed.push('drawer'); } } catch (_) {}
  try { Array.prototype.forEach.call(document.querySelectorAll('.modal-scrim.show'), function (m) { m.classList.remove('show'); closed.push(m.id || 'modal'); }); } catch (_) {}
  try { if (typeof RM !== 'undefined' && RM.pop) { RM.pop.remove(); RM.pop = null; closed.push('pop'); } } catch (_) {}
  try { var ae = document.activeElement; if (ae && (ae.tagName === 'SELECT' || ae.tagName === 'INPUT') && ae.blur) { ae.blur(); closed.push('picker'); } } catch (_) {}
  if (closed.length) rgLog('menus_closed', { closed: closed }, 'ok');
  return closed;
}
function rgPresented(room, d) {
  rgLog('presented', { room: String(room && room.id || '').slice(-6), callId: (d && d.callId) || null }, 'ok');
  rgCloseCallCard(d && d.callId, room && room.id);
  try { if (room && room.id) p4PresentedClose(room.id); } catch (_) {}
  rgCloseMenus();
}
var _rgIncoming = CALL.onIncoming, _rgPresent = cr3PresentCalls;
CALL.onIncoming = function (room, d) {
  var before = this.ringPending;
  try { if (!this.active && !before) { rgLog('ring_check', Object.assign({ path: 'incoming', room: String(room && room.id || '').slice(-6), callId: (d && d.callId) || null }, rgState())); rgHeal('ring_heal'); } } catch (_) {}
  var r = _rgIncoming.apply(this, arguments);
  try { if (!before && this.ringPending && !this.active) rgPresented(room, d); } catch (e) { rgLog('failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
};
cr3PresentCalls = function (roomId, calls) {
  try {
    var fresh = (calls || []).filter(function (c) { return c && c.callId && !cr3State.rung[c.callId]; });
    if (fresh.length && !CALL.active && !CALL.ringPending) { rgLog('ring_check', Object.assign({ path: 'present', room: String(roomId).slice(-6), callId: fresh[0].callId }, rgState())); rgHeal('ring_heal'); }
  } catch (_) {}
  return _rgPresent.apply(this, arguments);
};
function rgInput() {
  try {
    if (cr3State.attended !== false || document.hidden) return;
    cr3SetAttended(true, 'input'); RG.inputHeals++;
    rgLog('healed', { why: 'input' }, 'ok');
    try { cr3Announce('input'); } catch (_) {}
  } catch (_) {}
}
function rgInit() {
  if (RG.wired || typeof document === 'undefined') return;
  RG.wired = true;
  document.addEventListener('pointerdown', rgInput, true);
  document.addEventListener('keydown', rgInput, true);
}
rgInit();
