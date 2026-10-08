(function () {
  var _r8AddSpeech = addSpeech;
  addSpeech = function (who, srcT, trT, sL, tL, ss, failed) {
    var r = _r8AddSpeech.apply(this, arguments);
    try {
      var id = 'sp-' + (who === 'me' ? 'm' : 'p') + '-' + ss;
      var e = transcript.find(function (x) { return x.id === id; });
      if (e && !e.callKind) {
        e.callKind = (CALL && CALL.active) ? (CALL.kind === 'video' ? 'video' : 'voice') : 'chat';
        saveTr();
        r8Log('speech_kind', { kind: e.callKind }, 'ok');
      }
    } catch (err) { r8Log('speech_kind_failed', { e: String(err && err.message || err) }, 'error'); }
    return r;
  };
})();
