/* ═══════════ 30·ship PART · TN-1 room-name.js — THE CARD'S ROOM NAME IS CUT TO A FIXED LENGTH; A TAP SHOWS IT WHOLE (§7.25 c2) ═══════════ */
/* @contract
   replaces: (none)   wraps: roomCardHtmlCore (INNERMOST — MC-1 and GK-1 wrap it after), wireRoomCards (each original kept and called)
   adds: TN, tnLog, TN_MAX, tnUnits, tnCut, _tnCard, _tnWire
   markers (tnLog's own prefix 'tn_'): shown, failed

   THE OWNER (2026-11-18, after c1): "room name can be fixed characters with truncated... and tap to show full name so mute icon
   and key icon can be directly to the left of the room name".
   THE CHANGE: the name is measured in display units — one per grapheme (Intl.Segmenter; else code points, a combining mark 0),
   two for a wide one (CJK, Hangul, kana, fullwidth) or a pictograph — and a name over TN_MAX units is cut and ends in "…" (the raw
   name is cut, then escaped). The cut name is <span class="rc2-nm" dir="auto">; the bell (MC-1) and the key (GK-1) go directly
   before it. TN_MAX is 14: at a 320 px phone the rail leaves ≈107–131 px for the name beside both icons (review 2026-11-18).
   A tap on the name line shows the full name in a toast and does not open the room — when the name was cut, or when the line
   still overflows in pixels (wide letters); a name that fits opens the room as before. A card whose markup is not the expected
   one, and a name that fits, are the original's output byte for byte. */
var TN = { fails: 0 };
var TN_MAX = 14;
function tnLog(what, d, lvl) { try { log('tn_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function tnUnits(str) {
  var out = [], s = String(str == null ? '' : str);
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) { var it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s); for (var g of it) out.push(g.segment); }
    else { Array.from(s).forEach(function (c) { if (/\p{M}/u.test(c) && out.length) out[out.length - 1] += c; else out.push(c); }); }
  } catch (_) { out = Array.from(s); }
  return out.map(function (g) { return { g: g, w: /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]|\p{Extended_Pictographic}/u.test(g) ? 2 : 1 }; });
}
function tnCut(name) {
  var u = tnUnits(name), total = 0; u.forEach(function (x) { total += x.w; });
  if (total <= TN_MAX) return null;
  var out = '', n = 0;
  for (var i = 0; i < u.length; i++) { if (n + u[i].w > TN_MAX - 1) break; out += u[i].g; n += u[i].w; }
  return out.replace(/\s+$/, '') + '…';
}
var _tnCard = roomCardHtmlCore;
roomCardHtmlCore = function (r, where) {
  var h = _tnCard.apply(this, arguments);
  try {
    if (!h || !r) return h;
    var name = roomTitle(r), cut = tnCut(name); if (cut == null) return h;
    var was = '<div class="rc2-name">' + esc(name) + '</div>';
    if (h.indexOf(was) === -1) return h;
    return h.replace(was, function () { return '<div class="rc2-name"><span class="rc2-nm" dir="auto">' + esc(cut) + '</span></div>'; });
  } catch (e) { if (!TN.fails++) tnLog('failed', { e: String(e && e.message || e) }, 'error'); return h; }
};
var _tnWire = wireRoomCards;
wireRoomCards = function (host) {
  var r = _tnWire.apply(this, arguments);
  try {
    if (host) Array.prototype.forEach.call(host.querySelectorAll('.rc2 .rc2-name'), function (el) {
      el.addEventListener('click', function (ev) {
        var cut = !!el.querySelector('.rc2-nm'), over = el.scrollWidth > el.clientWidth + 1;
        if (!cut && !over) return;
        var card = el.closest('.rc2'), room = card && roomById(card.dataset.room); if (!room) return;
        ev.stopPropagation(); ev.preventDefault();
        toast(roomTitle(room), 4000);
        tnLog('shown', { room: String(room.id).slice(-6), cut: cut, over: over }, 'ok');
      });
    });
  } catch (e) { tnLog('failed', { e: String(e && e.message || e) }, 'error'); }
  return r;
};
