(function () {
  if (typeof relaySend !== 'function' || typeof relaySendWhenOpen !== 'function') return;

  var C1_TRIES = 40;   /* × 200 ms = 8 s; the observed outage is ~4 s */

  function mark(m, v) {
    try { Object.defineProperty(m, '_c1', { value: v, enumerable: false, configurable: true, writable: true }); }
    catch (_) { m._c1 = v; }
  }
  function kindOf(m) {
    try {
      var s = m.signal || {};
      if (s.description) return s.description.type || 'description';
      if (s.candidate) return 'candidate';
      if (s.restart) return 'restart';
    } catch (_) {}
    return 'other';
  }

  var _relaySend = relaySend;
  relaySend = function (m) {
    var ok = _relaySend.apply(this, arguments);
    try {
      if (m && m.type === 'webrtc-signal') {
        if (!ok && !m._c1) {
          mark(m, { t: Date.now(), kind: kindOf(m) });
          log('c1_queued', { kind: m._c1.kind }, 'warn');
          relaySendWhenOpen(m, C1_TRIES);
        } else if (ok && m._c1 && !m._c1.done) {
          m._c1.done = true;
          log('c1_flushed', { kind: m._c1.kind, ms: Date.now() - m._c1.t }, 'ok');
        }
      }
    } catch (_) {}
    return ok;
  };
})();
