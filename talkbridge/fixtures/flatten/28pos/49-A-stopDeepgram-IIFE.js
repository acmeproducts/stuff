(function () {
  var _stop = stopDeepgram;
  stopDeepgram = function () {
    dgGen = 0;
    if (_dgPrimHoldTimer !== null) { clearTimeout(_dgPrimHoldTimer); _dgPrimHoldTimer = null; }
    _dgPrimHeldText = null;
    return _stop.apply(this, arguments);
  };
})();
