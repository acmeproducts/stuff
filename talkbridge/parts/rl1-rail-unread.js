/* ═══════════ 30·ship PART · RL-1 rail-unread.js — A MESSAGE UNDER THE OPEN RAIL IS UNREAD UNTIL THE RAIL CLOSES (§7.25 item 4, B-9c) ═══════════ */
/* @contract
   replaces: (none)   wraps: cr3Send, sendReadReceipts, closePanel (each original kept and called)
   adds: RL, rlLog, rlCovering, rlBuzz, rlFlush, _rlSend, _rlReceipts, _rlClose
   markers (rlLog's own prefix 'rl_'): held, open_deferred, receipts_held, flushed, flush_skipped

   THE OWNER (2026-11-16): "when the left rail is open and a message is sent there's no message waiting indicator anywhere".
   THE CAUSE: a chat in the room you are in is acknowledged on arrival whenever the app is attended — `ev-seen` to the relay and
   `chat-read` to the partner — although the rail (an overlay drawer) covers the chat. The relay then counts it seen: no count.
   THE CHANGE, only while the rail is open over the room you are in (S.panelOpen, S.view 'room', that room):
     · cr3Send: `ev-seen` is not sent; `ev-open` goes as `events-sync`. The relay keeps the message unseen and pushes its
       projection, so the room's card in the open rail shows the count (the existing cr3Apply → renderPanel path).
     · sendReadReceipts: nothing is sent (the transcript keeps readSent:false, so nothing is lost).
     · one 120 ms vibration marks the arrival — not in a muted room, only while attended, at most once per 3 s (the iPhone has
       no vibration: the count alone).
     · closePanel: when the rail WAS open over a room, on the next tick, if the same room is still on screen, the rail is closed
       and the person is attended, `ev-open` (the relay marks the room's unseen set seen) and the read receipts go. A rail closed
       by leaving the room (another card, create, exit, a route, a call accepted elsewhere) sends nothing — entering a room
       already sends `ev-open`, and unsent read marks are sent when that room's transcript renders again.
   Reassigned at the top level: the scrim binds closePanel by reference when the app wires itself (DOMContentLoaded). */
var RL = { lastBuzz: 0, BUZZ_MS: 3000 };
function rlLog(what, d, lvl) { try { log('rl_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function rlCovering(roomId) { return !!(S.panelOpen && S.view === 'room' && S.roomId && (roomId == null || roomId === S.roomId)); }
function rlBuzz(roomId) {
  try {
    var room = roomById(roomId), now = Date.now();
    if (!room || room.muted || !cr3Attended() || now - RL.lastBuzz < RL.BUZZ_MS) return false;
    RL.lastBuzz = now;
    if (navigator.vibrate) navigator.vibrate(120);
    return true;
  } catch (_) { return false; }
}
var _rlSend = cr3Send, _rlReceipts = sendReadReceipts, _rlClose = closePanel;
cr3Send = function (roomId, m) {
  try {
    if (m && rlCovering(roomId)) {
      if (m.type === 'ev-seen') { rlLog('held', { room: String(roomId).slice(-6), n: (m.ids || []).length }); rlBuzz(roomId); return false; }
      if (m.type === 'ev-open') { rlLog('open_deferred', { room: String(roomId).slice(-6) }); m = { type: 'events-sync' }; }
    }
  } catch (_) {}
  return _rlSend.call(this, roomId, m);
};
sendReadReceipts = function () {
  if (rlCovering()) { rlLog('receipts_held', {}); return; }
  return _rlReceipts.apply(this, arguments);
};
closePanel = function () {
  var was = !!S.panelOpen, room = S.roomId, view = S.view;
  var r = _rlClose.apply(this, arguments);
  if (was && view === 'room' && room) setTimeout(function () { rlFlush(room); }, 0);
  return r;
};
function rlFlush(room) {
  try {
    if (S.view !== 'room' || S.roomId !== room || S.panelOpen || !cr3Attended()) { rlLog('flush_skipped', { room: String(room).slice(-6), now: String(S.roomId || '').slice(-6), view: S.view }); return false; }
    _rlSend(room, { type: 'ev-open' });
    try { sendReadReceipts(); } catch (_) {}
    rlLog('flushed', { room: String(room).slice(-6) }, 'ok');
    return true;
  } catch (e) { rlLog('flush_skipped', { e: String(e && e.message || e) }, 'error'); return false; }
}
