(function () {
  var _fAddSpeech = addSpeech;
  addSpeech = function (who, srcT, trT, sL, tL, ss, failed) {
    var id = 'sp-' + (who === 'me' ? 'm' : 'p') + '-' + ss;
    var before = transcript ? transcript.length : -1;
    var clash = null;
    if (transcript) {
      for (var i = 0; i < transcript.length; i++) {
        if (transcript[i] && transcript[i].id === id) { clash = transcript[i]; break; }
      }
    }

    var r = _fAddSpeech.apply(this, arguments);
    var after = transcript ? transcript.length : -1;

    if (clash) {
      /* An identifier was reissued. The older line has just been rewritten. */
      log('transcript_collision', {
        id: id, seq: ss, len: before,
        lost: String(clash.sourceText || '').slice(0, 40),
        wrote: String(srcT || '').slice(0, 40)
      }, 'error');
    } else {
      log('speech_added', { id: id, seq: ss, before: before, after: after, added: after - before }, 'ok');
    }
    return r;
  };
})();
