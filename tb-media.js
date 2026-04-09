// tb-media.js
// Owns the single getUserMedia call for the entire app.
// CONTRACT:
//   - Call TBMedia.init() once. Pass the stream to other modules.
//   - Nothing else in the app calls getUserMedia.
//   - Mute gates track.enabled only — SpeechRecognition is unaffected.

var TBMedia = (function () {
  'use strict';
  var _stream = null;

  function init() {
    if (_stream) return Promise.resolve(_stream);
    return navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(function (s) {
        _stream = s;
        TBApp.log('media_init', {
          tracks: s.getTracks().map(function (t) { return t.kind + ':' + t.readyState; })
        }, 'ok');
        return s;
      });
  }

  function stream() { return _stream; }

  // Mute/unmute outbound audio — CC (SpeechRecognition) is NOT affected
  function muteAudio(muted) {
    if (_stream) _stream.getAudioTracks().forEach(function (t) { t.enabled = !muted; });
  }

  function muteVideo(muted) {
    if (_stream) _stream.getVideoTracks().forEach(function (t) { t.enabled = !muted; });
  }

  function stop() {
    if (_stream) {
      _stream.getTracks().forEach(function (t) { t.stop(); });
      _stream = null;
      TBApp.log('media_stop', {});
    }
  }

  return { init: init, stream: stream, muteAudio: muteAudio, muteVideo: muteVideo, stop: stop };
})();
