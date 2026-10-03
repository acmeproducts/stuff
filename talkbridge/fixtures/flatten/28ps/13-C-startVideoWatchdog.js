CALL.startVideoWatchdog = function () {
  var self = this, gen = GEN.n, last = -1, still = 0;
  this.stopVideoWatchdog();
  if (this.kind !== 'video') return;
  this.videoWatchTimer = setInterval(function () {
    if (!GEN.is(gen) || !self.active) { self.stopVideoWatchdog(); return; }
    var v = $('remote-video');
    if (!v || !v.srcObject) return;
    var t = v.currentTime || 0;
    if (t === last) { still++; } else { still = 0; last = t; }
    if (still >= 4) {
      still = 0;
      log('rtc_video_stalled', {}, 'warn');
      self.runRecovery('video_stalled');
    }
  }, 2000);
};
