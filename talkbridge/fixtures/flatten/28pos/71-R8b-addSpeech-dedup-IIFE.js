(function () {
  var _r8AddSpeechDedup = addSpeech;
  addSpeech = function (who, srcT, trT, sL, tL, ss, failed) {
    /* Only my own speech is de-duplicated. The partner's arrives over the
       relay already arbitrated, and suppressing there would drop a genuine
       repetition by the other person. */
    if (who === 'me' && isDuplicatePhrase(srcT)) {
      r8Log('speech_suppressed', {}, 'ok');
      return;
    }
    return _r8AddSpeechDedup.apply(this, arguments);
  };
})();
