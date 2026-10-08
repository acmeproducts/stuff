function dgArbitrateEnglish(text) {
  if (String(text).trim().length <= _DG_EN_MIN_CHARS) return 'ignored';
  _dgEnLastFiredAt = Date.now();
  if (_dgPrimHoldTimer !== null) {
    clearTimeout(_dgPrimHoldTimer); _dgPrimHoldTimer = null;
    log('dg_cross_suppress', { held: _dgPrimHeldText && _dgPrimHeldText.slice(0, 40) }, 'warn');
    _dgPrimHeldText = null;
    return 'displaced';
  }
  return 'won';
}
