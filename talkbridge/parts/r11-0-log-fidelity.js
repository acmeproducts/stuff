/* ═══════════ R11.0 PART · r11-0-log-fidelity.js ═══════════ */
/* @contract  (plan v20.13.0 §5)
   wraps: log; debugLog.shift (instance)
   adds:  R110_REFRESH, R110_MAX, r110State, r110Fold
   replaces: nothing
   The debug log is the one instrument the owner and the builder share. A
   declared set of periodic refresh events is FOLDED: a repeat with the same
   event and identical data updates the existing line's count (n) and
   last-seen time (last) instead of adding a line. A refresh whose data
   changed is a new line. Every other event is recorded exactly as before,
   one line per occurrence. Buffer raised from 400 to 1200: the base trims by
   calling shift() past 400; the array's own shift now yields only past 1200. */
var R110_REFRESH = { rc_panel_rendered: 1, rc_home_rendered: 1, joiner_create_control: 1, r8_menu_labels: 1, r8_flag_bands: 1 };
var R110_MAX = 1200;
var r110State = { folded: 0 };
function r110Fold(ev, d) {
  if (!R110_REFRESH[ev]) return false;
  var key;
  try { key = JSON.stringify(d || {}); } catch (_) { return false; }
  /* only the most recent line of this event can absorb a repeat */
  for (var i = debugLog.length - 1; i >= 0; i--) {
    var r = debugLog[i];
    if (r.ev !== ev) continue;
    var rd = r.d || {}, c = {};
    for (var k in rd) if (k !== 'n' && k !== 'last') c[k] = rd[k];
    var rk; try { rk = JSON.stringify(c); } catch (_) { return false; }
    if (rk !== key) return false;
    rd.n = (rd.n || 1) + 1; rd.last = new Date().toISOString(); r.d = rd; r110State.folded++;
    return true;
  }
  return false;
}
(function () {
  var _r110Log = log;
  log = function (ev, d, lvl) {
    try { if (r110Fold(ev, d)) return; } catch (_) {}
    return _r110Log.apply(this, arguments);
  };
  debugLog.shift = function () { return this.length > R110_MAX ? Array.prototype.shift.call(this) : undefined; };
})();
