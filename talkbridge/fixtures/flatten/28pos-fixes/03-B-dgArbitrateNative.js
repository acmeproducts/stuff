function dgArbitrateNative(text, deliver) {
  if (Date.now() - _dgEnLastFiredAt < _DG_CROSS_MS) {
    log('dg_cross_suppress', { t: String(text).slice(0, 40) }, 'warn');
    return 'suppressed';
  }
  if (_dgPrimHoldTimer !== null) clearTimeout(_dgPrimHoldTimer);
  var held = text;
  _dgPrimHeldText = held;
  _dgPrimHoldTimer = setTimeout(function () {
    _dgPrimHoldTimer = null;
    if (_dgPrimHeldText === held) { _dgPrimHeldText = null; deliver(held); }
  }, _DG_HOLD_MS);
  return 'held';
}
