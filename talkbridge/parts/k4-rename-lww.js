/* ═══════════ GAP PART · K4-rename-lww.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: relaySend, onRoomNameSignal
   adds: (none)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   K-4 · CONCURRENT RENAME CONVERGES (§7.9 K4)

   The frozen `onRoomNameSignal` applies whatever rename arrives. Two phones
   renaming the same room within a couple of seconds each apply the OTHER's
   name last — they end up swapped, and stay swapped, because no hello
   carries the room title (proven: `hello` carries the person's name only).

   THE RULE: last write wins BY TIMESTAMP. The rename pill already rides the
   relay with `ts` stamped by the frozen `relaySend`; this part stamps it a
   step earlier so the sender remembers the same number it sent
   (`room.titleTs`). On receipt, an older stamp than the room's own is
   ignored (`k4_rename_stale`) — the pill still renders, the name does not
   move. Equal stamps break the tie on the name text, the same way on both
   phones, so exactly one side yields. Both converge without a round trip.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof relaySend !== 'function' || typeof onRoomNameSignal !== 'function') return;

  var _relaySend = relaySend;
  relaySend = function (m) {
    if (m && m.type === 'sys-pill' && typeof m.newRoomName === 'string') {
      m.ts = m.ts || Date.now();
      var r = (typeof activeRoom === 'function') ? activeRoom() : null;
      if (r && r.title === m.newRoomName) { r.titleTs = m.ts; try { saveRooms(); } catch (_) {} }
    }
    return _relaySend.apply(this, arguments);
  };

  var _onRoomNameSignal = onRoomNameSignal;
  onRoomNameSignal = function (roomId, d) {
    if (d && d.type === 'sys-pill' && typeof d.newRoomName === 'string') {
      var r = roomById(roomId || d.room);
      var ts = Number(d.ts) || 0, mine = (r && Number(r.titleTs)) || 0;
      var to = String(d.newRoomName).slice(0, 40);
      if (r && ts && mine && (ts < mine || (ts === mine && to <= (r.title || '')))) {
        try { log('k4_rename_stale', { kept: r.title, ignored: to, ts: ts, mine: mine }, 'warn'); } catch (_) {}
        return false;                       /* the base still writes and renders the pill */
      }
      var out = _onRoomNameSignal.apply(this, arguments);
      if (r && ts && r.title === to) { r.titleTs = ts; try { saveRooms(); } catch (_) {} }
      return out;
    }
    return _onRoomNameSignal.apply(this, arguments);
  };
})();
