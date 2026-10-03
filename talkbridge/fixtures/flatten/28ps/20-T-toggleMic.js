CALL.toggleMic = function () {
  this.micOn = !this.micOn;
  var track = (this.stream && this.stream.getAudioTracks) ? this.stream.getAudioTracks()[0] : null;
  var senders = micSenders();
  var swapped = 0;

  if (this.micOn) {
    if (track) track.enabled = true;
    senders.forEach(function (s) { if (replaceSenderTrack(s, track)) swapped++; });
  } else {
    senders.forEach(function (s) { if (replaceSenderTrack(s, null)) swapped++; });
    if (track) track.enabled = false;
  }

  try { $('rb-mic').classList.toggle('off', !this.micOn); } catch (_) {}
  relaySend({ type: 'mic-state', micOn: this.micOn, transient: true });
  netLog('mic_toggled', {
    on: this.micOn,
    senders: senders.length,
    swapped: swapped,
    trackEnabled: track ? track.enabled : null,
    /* If this is ever false while muted, mute is not total. */
    silent: !this.micOn ? (swapped === senders.length && (!track || !track.enabled)) : null
  }, 'ok');
};
