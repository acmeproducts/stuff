/* ═══════════ 29·ship PART · RX-1 record-receipts.js — DELIVERED AND READ FROM THE RELAY'S RECORD (candidate 5, relay v6.9) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — entered from cr3Apply by the banked edit P28; reassigns no function
   adds: RX_RANK, rxLog, rxMark, rxMarkRoom, rxApply
   markers (rxLog's own prefix 'rx_'): receipts_marked, receipts_failed

   THE OWNER (2026-10-10): "the whole sent delivered read indicator is inconsistent." Cause: the marks travelled only as throwaway socket
   words (chat-ack, chat-read) — a message that arrived while the other phone was away came through history sync, which never
   acknowledged; a read sent while the sender was away was lost. The relay has always kept the durable fact per message and recipient;
   nothing read it. Relay v6.9 now puts the sender's own record — `mine: { delivered: [ids], seen: [ids] }` — on every projection it
   sends and on every sync/open reply, so the marks arrive when they happen and again on every reconnect.
   Here: a mark only ever moves forward (sent → delivered → read); the transient words still move it first where they arrive. */
var RX_RANK = { sent: 0, delivered: 1, read: 2 };
function rxLog(what, d, lvl) { try { log('rx_' + what, d || {}, lvl || 'info'); } catch (_) {} }
/* Raise the receipt of the sender's own entries named in ids to `level`, never backwards. Returns the entries that changed. */
function rxMark(tr, ids, level) {
  var changed = [];
  ids.forEach(function (id) {
    var e = null; for (var i = tr.length - 1; i >= 0; i--) { if (tr[i] && tr[i].id === id) { e = tr[i]; break; } }
    if (!e || e.who !== 'me') return;
    var cur = e.receipt || 'sent'; if ((RX_RANK[cur] || 0) >= RX_RANK[level]) return;
    e.receipt = level; var now = Date.now();
    if (!e.deliveredAt) e.deliveredAt = now; if (level === 'read' && !e.readAt) e.readAt = now;
    changed.push(e);
  });
  return changed;
}
function rxMarkRoom(roomId, mine) {
  var delivered = Array.isArray(mine.delivered) ? mine.delivered.map(String) : [], seen = Array.isArray(mine.seen) ? mine.seen.map(String) : [];
  if (!delivered.length && !seen.length) return 0;
  var active = (S.roomId === roomId), tr = active ? transcript : loadTr(roomId);
  var changed = rxMark(tr, delivered, 'delivered').concat(rxMark(tr, seen, 'read'));
  if (!changed.length) return 0;
  if (active) { saveTr(); changed.forEach(function (e) { try { updateReceiptDom(e); } catch (_) {} }); }
  else lsSet(trKey(roomId), tr);
  return changed.length;
}
function rxApply(roomId, d) {
  try {
    if (!d || !d.mine) return 0;
    var n = rxMarkRoom(roomId, d.mine);
    if (n) rxLog('receipts_marked', { room: String(roomId).slice(-6), n: n, delivered: (d.mine.delivered || []).length, seen: (d.mine.seen || []).length }, 'ok');
    return n;
  } catch (e) { rxLog('receipts_failed', { e: String(e && e.message || e) }, 'error'); return 0; }
}
