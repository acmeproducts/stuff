CALL.onAccepted = function (room, d) {
  var wasCaller = CALL.caller && CALL.active;                                    /* N10 before */
  var r = callOnAcceptedCore.apply(this, arguments);                             /* base */
  if (wasCaller) {                                                               /* N10 after */
    n10Hide();
    /* G42: nothing to restore — the caller is never muted now. Any track an old build disabled is re-enabled here. */
    try { (CALL.stream ? CALL.stream.getAudioTracks() : []).forEach(function (t) { t.enabled = true; }); } catch (_) {}
    CALL.startTs = Date.now();                                     /* B-8a: clock starts at the answer */
    n10L('n10_answered', { micOn: CALL.micOn, tracks: (CALL.stream ? CALL.stream.getAudioTracks().length : 0) });
  }
  if (CALL.active) n18Anchor('caller');                                          /* N18 after */
  return r;
};
