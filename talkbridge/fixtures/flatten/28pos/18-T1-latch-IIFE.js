(function () {
  var raf = (typeof requestAnimationFrame === 'function') ? requestAnimationFrame : function (f) { return setTimeout(f, 16); };

  function latch(name, orig) {
    if (typeof orig !== 'function') return orig;
    var busy = false, pending = 0;
    var latched = function () {
      var self = this, args = arguments;
      if (busy) { pending++; return; }
      busy = true;
      var r = orig.apply(self, args);
      raf(function () {
        busy = false;
        if (pending) {
          var n = pending; pending = 0;
          try { log('t1_coalesced', { fn: name, n: n }, 'info'); } catch (_) {}
          latched.apply(self, args);
        }
      });
      return r;
    };
    return latched;
  }

  renderTranscript = latch('renderTranscript', renderTranscript);
  renderPanel = latch('renderPanel', renderPanel);
  renderHome = latch('renderHome', renderHome);
})();
