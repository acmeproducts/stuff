/* ═══════════ GAP PART · D15-short-english.js ═══════════ */
/* @contract
   replaces: dgArbitrateNative, dgArbitrateEnglish
   wraps: (none)
   adds: _dgEnShortAt, dgLooksPhonetic
*/
/* ─────────────────────────────────────────────────────────────────────────────
   D-15 · A SHORT ENGLISH UTTERANCE NO LONGER LETS ITS PHONETIC THAI TWIN THROUGH
   (language sweep, Thai, 2026-10-08)

   "awesome" (7 characters) arrived on the English lane and, 125 ms later, the
   Thai lane's phonetic rendering "อ อ ส ซ" arrived as a second final and was
   sent as its own line. The arbitration only counted an English result as
   "won" above _DG_EN_MIN_CHARS (10), so a short word never armed the
   cross-suppression window and never displaced a held native result.

   THE RULE, one and narrow: a short English result arms its own window and
   displaces a held native result ONLY when that native text is letter-spaced
   — single native letters separated by spaces, the phonetic signature — so a
   genuine short native sentence inside the window is still delivered. Both
   orders are covered (English first, Thai 125 ms later; Thai first and held,
   English inside the hold). The marker is the existing dg_cross_suppress with
   phonetic: true. Both functions are the flat build's, verbatim, plus the rule.
   ───────────────────────────────────────────────────────────────────────────── */
var _dgEnShortAt = 0;
/* two or more single-character tokens and nothing else: "อ อ ส ซ" yes, "อร่อย" no, "ok go" no */
function dgLooksPhonetic(text) {
  var toks = String(text || '').trim().split(/\s+/);
  if (toks.length < 2) return false;
  for (var i = 0; i < toks.length; i++) { if (toks[i].length !== 1 || /[A-Za-z0-9]/.test(toks[i])) return false; }
  return true;
}
function dgArbitrateNative(text, deliver) {
  if (Date.now() - _dgEnLastFiredAt < _DG_CROSS_MS) {
    log('dg_cross_suppress', { t: String(text).slice(0, 40) }, 'warn');
    return 'suppressed';
  }
  /* D-15: a SHORT English win arms a window too, but only a letter-spaced native twin falls to it */
  if (Date.now() - _dgEnShortAt < _DG_CROSS_MS && dgLooksPhonetic(text)) {
    log('dg_cross_suppress', { t: String(text).slice(0, 40), phonetic: true }, 'warn');
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

function dgArbitrateEnglish(text) {
  if (String(text).trim().length <= _DG_EN_MIN_CHARS) {
    /* D-15: too short to win outright, but a held letter-spaced native twin is this word's phonetic echo — drop it */
    _dgEnShortAt = Date.now();
    if (_dgPrimHoldTimer !== null && dgLooksPhonetic(_dgPrimHeldText)) {
      clearTimeout(_dgPrimHoldTimer); _dgPrimHoldTimer = null;
      log('dg_cross_suppress', { held: _dgPrimHeldText && _dgPrimHeldText.slice(0, 40), phonetic: true }, 'warn');
      _dgPrimHeldText = null;
      return 'displaced';
    }
    return 'ignored';
  }
  _dgEnLastFiredAt = Date.now();
  if (_dgPrimHoldTimer !== null) {
    clearTimeout(_dgPrimHoldTimer); _dgPrimHoldTimer = null;
    log('dg_cross_suppress', { held: _dgPrimHeldText && _dgPrimHeldText.slice(0, 40) }, 'warn');
    _dgPrimHeldText = null;
    return 'displaced';
  }
  return 'won';
}
