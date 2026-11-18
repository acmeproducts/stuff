/* ═══════════ 30·ship PART · RL-1 rail-unread.js — A MESSAGE THAT CAME UNDER THE OPEN RAIL STAYS UNREAD UNTIL ITS ROOM IS SELECTED (§7.25 item 4, B-9c; c2) ═══════════ */
/* @contract
   replaces: (none)   wraps: cr3Send, sendReadReceipts, cr3Apply, enterRoom, cr3RouteEvent (each original kept and called)
   adds: RL, rlLog, rlCovering, rlHolds, rlMark, rlBuzz, _rlSend, _rlReceipts, _rlApply, _rlEnter, _rlRoute
   markers (rlLog's own prefix 'rl_'): held, open_deferred, receipts_held, pending, selected

   THE OWNER (2026-11-16): "when the left rail is open and a message is sent there's no message waiting indicator anywhere".
   THE OWNER (2026-11-18, after c1 cleared the count when the rail closed): "the count must not clear when the left rail closes
   the count only clears when that room is selected and therefore the delivered message indicator turns to green check mark.
   furthermore if the rail is closed the room card should be on the home screen with the number of messages missed shown".
   THE CAUSE: a chat in the room you are in is acknowledged on arrival whenever the app is attended — `ev-seen` to the relay and
   `chat-read` to the partner — although the rail (an overlay drawer) covers the chat; the relay then counts it seen: no count.
   THE CHANGE:
     · PENDING: a room becomes pending when, with the rail open over it, its ev-seen is held (a message arrived while watching),
       or a relay projection shows it waiting (a message that came while away, by history or a reconnect — review 2026-11-18).
       A rail opened and closed with nothing arriving changes nothing.
     · While the rail is open over the room, or while it is pending (rail open or closed): its `ev-seen` is not sent, `ev-open`
       goes as `events-sync`, read receipts wait. The relay keeps the messages unseen, so the count stays — on its card in the
       rail and, from the home screen, on the home card (the relay's projection; a muted room shows none, as today).
     · Closing the rail acknowledges nothing.
     · SELECTED clears it: the room entered by the person — enterRoom(room): its card tapped in the rail or at home, a call
       accepted from another room, an invite link, a join, a create — or a notification for it tapped — cr3RouteEvent(room). The
       mark is cleared BEFORE the original runs, so the original's own explicit open (`ev-open`: the relay marks the room's unseen
       set seen) goes through; for the room already on screen (the original returns early without rendering) RL-1 then sends the
       read receipts, so the partner's ticks turn to the read check. A route held by RT-1 during a call never reaches here.
     · Replying in a pending room does NOT clear it (owner: "only clears when that room is selected").
     · One 120 ms buzz marks an arrival under the open rail (not in a muted room, only while attended, at most once per 3 s; the
       iPhone has none). Not persisted: a reload clears the pending mark. */
var RL = { lastBuzz: 0, BUZZ_MS: 3000, pending: {} };
function rlLog(what, d, lvl) { try { log('rl_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function rlCovering(roomId) { return !!(S.panelOpen && S.view === 'room' && S.roomId && (roomId == null || roomId === S.roomId)); }
function rlHolds(roomId) { return !!(roomId && (RL.pending[roomId] || rlCovering(roomId))); }
function rlMark(roomId, why) {
  if (!roomId || RL.pending[roomId]) return;
  RL.pending[roomId] = true;
  rlLog('pending', { room: String(roomId).slice(-6), why: why });
}
function rlBuzz(roomId) {
  try {
    var room = roomById(roomId), now = Date.now();
    if (!rlCovering(roomId) || !room || room.muted || !cr3Attended() || now - RL.lastBuzz < RL.BUZZ_MS) return false;
    RL.lastBuzz = now;
    if (navigator.vibrate) navigator.vibrate(120);
    return true;
  } catch (_) { return false; }
}
var _rlSend = cr3Send, _rlReceipts = sendReadReceipts, _rlApply = cr3Apply, _rlEnter = enterRoom, _rlRoute = cr3RouteEvent;
cr3Send = function (roomId, m) {
  try {
    if (m && rlHolds(roomId)) {
      if (m.type === 'ev-seen') { if (rlCovering(roomId)) { rlMark(roomId, 'arrived'); rlBuzz(roomId); } rlLog('held', { room: String(roomId).slice(-6), n: (m.ids || []).length }); return false; }
      if (m.type === 'ev-open') { rlLog('open_deferred', { room: String(roomId).slice(-6) }); m = { type: 'events-sync' }; }
    }
  } catch (_) {}
  return _rlSend.call(this, roomId, m);
};
sendReadReceipts = function () {
  if (S.roomId && rlHolds(S.roomId)) { rlLog('receipts_held', {}); return; }
  return _rlReceipts.apply(this, arguments);
};
cr3Apply = function (roomId, d) {
  var r = _rlApply.apply(this, arguments);
  try { var room = roomById(roomId); if (rlCovering(roomId) && room && waitingTotal(room) > 0) rlMark(roomId, 'projection'); } catch (_) {}
  return r;
};
enterRoom = function (id) {
  var was = !!(id && RL.pending[id]), same = !!(id && S.view === 'room' && S.roomId === id);
  if (was) { delete RL.pending[id]; rlLog('selected', { room: String(id).slice(-6), how: 'enter', same: same }, 'ok'); }
  var r = _rlEnter.apply(this, arguments);
  if (was && same) { try { sendReadReceipts(); } catch (_) {} }
  return r;
};
cr3RouteEvent = function (roomId, eventId, why) {
  var was = !!(roomId && RL.pending[roomId]), same = !!(roomId && S.view === 'room' && S.roomId === roomId);
  if (was) { delete RL.pending[roomId]; rlLog('selected', { room: String(roomId).slice(-6), how: 'route', same: same }, 'ok'); }
  var r = _rlRoute.apply(this, arguments);
  if (was && same) { try { sendReadReceipts(); } catch (_) {} }
  return r;
};
