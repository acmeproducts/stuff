(function () {
  if (typeof renderPartnerState === 'function') {
    var _r8Rps = renderPartnerState;
    renderPartnerState = function () {
      /* The base function's only job was writing "Speaking…" into #rz-timer.
         The slot now has one writer; speaking lives on the presence dot,
         which the timer tick below keeps updated. */
      return;
    };
    renderPartnerState._r8Original = _r8Rps;
  }
})();
