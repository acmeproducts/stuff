(function () {
  var _rmToggleMic = CALL.toggleMic;
  CALL.toggleMic = function () {
    var r = _rmToggleMic.apply(this, arguments);
    try {
      if (!this.micOn) {
        RM.dgWasOnBeforeMute = !!dgActive;
        stopDeepgram();
        rmLog('transcription_stopped_for_mute', { wasActive: RM.dgWasOnBeforeMute }, 'ok');
      } else if (this.active) {
        rmLog('transcription_resuming_after_mute', {}, 'ok');
        startDeepgram();
      }
    } catch (e) { rmLog('mute_transcription_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
