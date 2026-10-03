(function () {
  if (typeof CALL === 'undefined' || !CALL || typeof CALL.runRecovery !== 'function' || typeof CALL.onSignal !== 'function') return;

  var C3_HOLD_MS = 8000;   /* mirrors the creator's step-2 release            */
  var C3_MIN_GAP_MS = 8000;/* two detectors cannot make the creator restart twice */

  CALL._c3LastServed = 0;
  CALL._c3Pending = false;

  function room() { try { return (typeof activeRoom === 'function') ? activeRoom() : null; } catch (_) { return null; } }
  function isCreator() { var r = room(); return !!(r && r.role === 'creator'); }
  function ufrag(desc) {
    try {
      var m = /a=ice-ufrag:(\S+)/.exec(String((desc && desc.sdp) || ''));
      return m ? m[1] : '';
    } catch (_) { return ''; }
  }

  /* ── the joiner asks ──────────────────────────────────────────────────── */
  var _runRecovery = CALL.runRecovery;
  CALL.runRecovery = function (reason) {
    try {
      var r = room();
      if (this.active && r && r.role !== 'creator' && !this.recoveryLock &&
          this.recoveryStep + 1 === 2 && this.pc) {
        var self = this, gen = GEN.n;
        this.recoveryLock = true;
        this.recoveryStep = 2;
        this._c3Pending = true;
        var sent = relaySend({ type: 'webrtc-signal', transient: true, signal: { restart: true } });
        log('c3_restart_requested', { reason: reason, sent: !!sent }, 'warn');
        clearTimeout(this.recoveryTimer);
        this.recoveryTimer = setTimeout(function () {
          if (!GEN.is(gen)) return;
          self.recoveryLock = false;
          self._c3Pending = false;
          var st = self.pc && self.pc.connectionState;
          if (st === 'connected' || st === 'completed') { self.recoveryStep = 0; log('rtc_recovered', { step: 2 }, 'ok'); }
        }, C3_HOLD_MS);
        return;
      }
    } catch (_) {}
    return _runRecovery.apply(this, arguments);
  };

  /* ── the creator serves; the joiner answers ───────────────────────────── */
  var _onSignal = CALL.onSignal;
  CALL.onSignal = function (d) {
    var self = this;
    try {
      var sig = d && d.signal;
      if (sig && sig.restart && isCreator() && this.active && this.pc) {
        var now = Date.now();
        if (now - this._c3LastServed < C3_MIN_GAP_MS) {
          log('c3_restart_ignored', { sinceMs: now - this._c3LastServed }, 'info');
        } else {
          this._c3LastServed = now;
          var gen = GEN.n, pc = this.pc;
          pc.createOffer({ iceRestart: true }).then(function (o) {
            if (!GEN.is(gen) || self.pc !== pc) return;
            return pc.setLocalDescription(o).then(function () {
              if (!GEN.is(gen) || self.pc !== pc) return;
              var offer = { type: 'webrtc-signal', transient: true, signal: { description: pc.localDescription } };
              relaySend(offer); self.savedOffer = offer;
              log('c3_restart_served', {}, 'ok');
            });
          }).catch(function (e) { log('c3_restart_err', { e: String(e) }, 'error'); });
        }
        return _onSignal.apply(this, arguments);
      }

      if (sig && sig.description && sig.description.type === 'offer' &&
          !isCreator() && this.active && this.pc && this.pc.remoteDescription) {
        var cur = ufrag(this.pc.remoteDescription), nxt = ufrag(sig.description);
        if (cur && nxt && cur !== nxt) {
          var pc2 = this.pc, gen2 = GEN.n;
          return pc2.setRemoteDescription(sig.description).then(function () {
            if (!GEN.is(gen2) || self.pc !== pc2) return;
            return self.flushCands();
          }).then(function () {
            if (!GEN.is(gen2) || self.pc !== pc2) return;
            return pc2.createAnswer();
          }).then(function (a) {
            if (!a || !GEN.is(gen2) || self.pc !== pc2) return;
            return pc2.setLocalDescription(a);
          }).then(function () {
            if (!GEN.is(gen2) || self.pc !== pc2) return;
            relaySend({ type: 'webrtc-signal', transient: true, signal: { description: pc2.localDescription } });
            self._c3Pending = false;
            log('c3_restart_answered', { pending: true }, 'ok');
          }).catch(function (e) { log('c3_restart_answer_err', { e: String(e) }, 'error'); });
        }
      }
    } catch (_) {}
    return _onSignal.apply(this, arguments);
  };
})();
