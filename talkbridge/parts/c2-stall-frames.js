/* ═══════════ GAP PART · C2-stall-frames.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: CALL.startVideoWatchdog, CALL.stopVideoWatchdog
   adds: CALL.c2Timer
*/
/* ─────────────────────────────────────────────────────────────────────────────
   C-2 · STALL DETECTION BY DECODED FRAMES (§7.14)

   THE EVIDENCE: iPhone pc5 — inbound video bytes and frames at zero for 18 s
   while `connectionState` read `connected`, RTT was healthy and outbound kept
   streaming. The shipped watchdog was armed (`wd:true`) the entire time and
   never fired: it samples `remote-video.currentTime`, which keeps advancing on
   a stalled MediaStream. D1's decoded-frame counter caught every freeze.

   THE CHANGE: the existing watchdog is left running (harmless). A second
   sampler, same cadence, same generation guard, same teardown, reads
   `inbound-rtp` video `framesDecoded` from getStats. Three unchanged samples
   (6 s) while the connection still claims `connected` is a stall, and it calls
   the same `runRecovery('video_stalled')` the old detector would have —
   which C-3 has made survivable on the joiner.

   ARMING: no verdict until the first sample with frames > 0. D1 showed 2–4 s
   of zero frames after `connected` on every call while the first frame was
   still in flight; that is not a stall. This part ships only with C-3 — on
   the accepted ladder a working stall detector on the joiner turns a frozen
   picture into a dead call.
   ───────────────────────────────────────────────────────────────────────────── */
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
