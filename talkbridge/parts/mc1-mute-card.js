/* ═══════════ 30·ship PART · MC-1 mute-card.js — THE X STAYS; A MUTED ROOM'S BELL MOVES BESIDE ITS NAME (§7.25 item 2, B-9a) ═══════════ */
/* @contract
   replaces: (none)   wraps: roomCardHtmlCore (the original is called; only a muted room's card changes)
   adds: MC, mcLog, MC_CSS, MC_BELL, mcAfterName, _mcCard, mcInit
   markers (mcLog's own prefix 'mc_'): failed

   THE OWNER (2026-11-16): "mute room indicator overwrites x on room card".
   THE CAUSE: roomCardHtmlCore has one corner slot — a muted room gets the bell there INSTEAD of the delete X, so a muted room
   cannot be deleted from its card.
   THE CHANGE: a muted room's card is rendered as an unmuted one (the X, from the original, on a copy with muted:false) and a
   13 px crossed-out bell is put directly AFTER the name (c2, owner 2026-11-18); the name text alone shrinks, so the bell is
   never clipped. An unmuted card is the
   original's output, byte for byte. The delete wiring is the original's (it wires every [data-del]). */
var MC = { fails: 0 };
function mcLog(what, d, lvl) { try { log('mc_' + what, d || {}, lvl || 'info'); } catch (_) {} }
var MC_CSS = '.rc2-mute{display:inline-block;vertical-align:-2px;margin-inline-start:5px;color:var(--ink-dim);line-height:0}.rc2-name.rc2-ic{display:flex;align-items:center;min-width:0}.rc2-ic>.rc2-nt,.rc2-ic>.rc2-nm{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rc2-ic>.rc2-mute,.rc2-ic>.rc2-key{flex:none}';
var MC_BELL = '<span class="rc2-mute" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.6 13V9A6.5 6.5 0 0 0 8 5.3M6.3 6.3C5.7 7.1 5.4 8 5.4 9v4l-2 3v1h14"/><path d="M10 21a2 2 0 0 0 4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg></span>';
/* the icon goes directly AFTER the room name (owner 2026-11-18: "The mute bell and creator-rights key sit right AFTER the name");
   the name line becomes a row — the name text in its own span, which alone shrinks with an ellipsis, so an icon is never clipped */
function mcAfterName(h, icon) {
  var a = h.indexOf('<div class="rc2-name'); if (a < 0) return h;
  var b = h.indexOf('>', a), c = h.indexOf('</div>', b); if (b < 0 || c < 0) return h;
  var open = h.slice(a, b + 1), inner = h.slice(b + 1, c);
  if (open === '<div class="rc2-name">') { open = '<div class="rc2-name rc2-ic">'; if (inner.indexOf('<span class="rc2-nm"') !== 0) inner = '<span class="rc2-nt" dir="auto">' + inner + '</span>'; }
  return h.slice(0, a) + open + inner + icon + h.slice(c);
}
var _mcCard = roomCardHtmlCore;
roomCardHtmlCore = function (r, where) {
  if (!r || !r.muted) return _mcCard.apply(this, arguments);
  var h = _mcCard.call(this, Object.assign({}, r, { muted: false }), where);
  try { if (h) h = mcAfterName(h, MC_BELL); }
  catch (e) { if (!MC.fails++) mcLog('failed', { e: String(e && e.message || e) }, 'error'); }
  return h;
};
function mcInit() {
  try { if (document.getElementById('mc-css')) return; var st = document.createElement('style'); st.id = 'mc-css'; st.textContent = MC_CSS; document.head.appendChild(st); }
  catch (e) { mcLog('failed', { e: String(e && e.message || e) }, 'error'); }
}
if (typeof document !== 'undefined') mcInit();
