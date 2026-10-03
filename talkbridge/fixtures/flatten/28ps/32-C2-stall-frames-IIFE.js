(function () {
  if (typeof CALL === 'undefined' || !CALL || typeof CALL.startVideoWatchdog !== 'function' || typeof CALL.stopVideoWatchdog !== 'function') return;

  var C2_MS = 2000;
  var C2_STILL = 3;

  CALL.c2Timer = null;

  var _stop = CALL.stopVideoWatchdog;
  CALL.stopVideoWatchdog = function () {
    clearInterval(this.c2Timer); this.c2Timer = null;
    return _stop.apply(this, arguments);
  };

  var _start = CALL.startVideoWatchdog;
  CALL.startVideoWatchdog = function () {
    var r = _start.apply(this, arguments);
    var self = this, gen = GEN.n;
    clearInterval(this.c2Timer); this.c2Timer = null;
    if (this.kind !== 'video') return r;

    var armed = false, last = -1, still = 0, stalled = false, t0 = Date.now();
    this.c2Timer = setInterval(function () {
      if (!GEN.is(gen) || !self.active) { clearInterval(self.c2Timer); self.c2Timer = null; return; }
      var pc = self.pc;
      if (!pc || typeof pc.getStats !== 'function') return;
      pc.getStats().then(function (report) {
        if (!GEN.is(gen) || self.pc !== pc) return;
        var frames = -1;
        report.forEach(function (row) {
          if (row.type === 'inbound-rtp' && row.kind === 'video') frames = row.framesDecoded || 0;
        });
        if (frames < 0) return;

        if (!armed) { if (frames > 0) { armed = true; last = frames; } return; }

        if (frames === last) {
          if (pc.connectionState !== 'connected') { still = 0; return; }  /* the ladder already owns this */
          still++;
          if (still >= C2_STILL) {
            still = 0; stalled = true;
            log('c2_stalled', { frames: frames, ms: Date.now() - t0 }, 'warn');
            self.runRecovery('video_stalled');
          }
        } else {
          if (stalled) { stalled = false; log('c2_resumed', { ms: Date.now() - t0 }, 'ok'); }
          still = 0; last = frames;
        }
      }).catch(function () {});
    }, C2_MS);
    return r;
  };
})();
