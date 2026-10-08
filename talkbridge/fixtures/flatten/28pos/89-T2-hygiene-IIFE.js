(function () {
  if (typeof log !== 'function') return;

  var WINDOW_MS = 5000;
  var LIMITED = {
    joiner_create_control: 1, rc_home_rendered: 1, rc_panel_rendered: 1,
    md1_rendered: 1, cr3_announce: 1, pr2_declared: 1, pr3_dot: 1
  };
  var last = {}, dropped = {};

  var _log = log;
  log = function (ev, d, lvl) {
    try {
      if (LIMITED[ev]) {
        var now = Date.now();
        if (last[ev] && now - last[ev] < WINDOW_MS) { dropped[ev] = (dropped[ev] || 0) + 1; return; }
        last[ev] = now;
        if (dropped[ev]) {
          var d2 = {}; for (var k in (d || {})) d2[k] = d[k];
          d2.dropped = dropped[ev]; dropped[ev] = 0;
          return _log.call(this, ev, d2, lvl);
        }
      }
    } catch (_) {}
    return _log.apply(this, arguments);
  };
})();
