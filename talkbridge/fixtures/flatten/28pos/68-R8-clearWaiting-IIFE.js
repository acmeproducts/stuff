(function () {
  var _r8ClearWaiting = clearWaiting;
  clearWaiting = function (r) {
    var out = _r8ClearWaiting.apply(this, arguments);
    try {
      if (r && r.id) {
        var m = homeDismissed();
        if (m && typeof m[r.id] === 'number') {
          delete m[r.id];
          saveHomeDismissed(m);
          r8Log('dismiss_threshold_reset', { room: r.id }, 'ok');
        }
      }
    } catch (e) { r8Log('dismiss_reset_failed', { e: String(e && e.message || e) }, 'error'); }
    return out;
  };
})();
