CALL.runRecovery = function (reason) {
  var self = this, room = activeRoom();
  if (!this.active || !room) return;
  if (this.recoveryLock) { log('rtc_recovery_busy', { reason: reason }, 'warn'); return; }
  this.recoveryLock = true;
  this.recoveryStep++;
  var step = this.recoveryStep, gen = GEN.n;
  log('rtc_recovery', { step: step, reason: reason }, 'warn');

  var release = function (ms) {
    clearTimeout(self.recoveryTimer);
    self.recoveryTimer = setTimeout(function () {
      if (!GEN.is(gen)) return;
      self.recoveryLock = false;
      var st = self.pc && self.pc.connectionState;
      if (st === 'connected' || st === 'completed') { self.recoveryStep = 0; log('rtc_recovered', { step: step }, 'ok'); }
    }, ms);
  };

  try {
    if (step === 1) {
      if (room.role === 'creator' && this.savedOffer) {
        relaySend(this.savedOffer);
        this.savedCandidates.forEach(function (c) { relaySend(c); });
        log('rtc_offer_resent', {}, 'ok');
      }
      release(5000);
      return;
    }

    if (step === 2 && this.pc && room.role === 'creator') {
      this.pc.createOffer({ iceRestart: true }).then(function (o) {
        if (!GEN.is(gen) || !self.pc) return;
        return self.pc.setLocalDescription(o).then(function () {
          var offer = { type: 'webrtc-signal', transient: true, signal: { description: self.pc.localDescription } };
          relaySend(offer); self.savedOffer = offer;
          log('rtc_ice_restart', {}, 'ok');
        });
      }).catch(function (e) { log('rtc_ice_restart_err', { e: String(e) }, 'error'); });
      release(8000);
      return;
    }

    /* Step 3 and anything beyond: full rebuild, creator side only — the other
       side is driven by the offer that follows. */
    if (this.pc) { try { this.pc.close(); } catch (_) {} }
    this.pc = null;
    this.savedOffer = null; this.savedCandidates = []; this.pendingCandidates = []; this.seenCand = new Set();
    this.remoteStream = null;
    this.stopKeepalive(); this.stopVideoWatchdog();
    if (room.role === 'creator') {
      setTimeout(function () { if (GEN.is(gen) && self.active) self.setupPC(); }, 1200);
    }
    release(12000);
  } catch (e) {
    log('rtc_recovery_err', { e: String(e) }, 'error');
    this.recoveryLock = false;
  }
};
