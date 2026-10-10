(function () {
  if (typeof speakText !== 'function') return;
  var _speak = speakText;
  speakText = function (text, lang) { return _speak.call(this, tbmdSpeechStrip(text), lang); };
})();
