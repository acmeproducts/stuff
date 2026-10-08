CALL.accept = function () {
  var p = this.ringPending;                                                      /* P4 reads first */
  GEN.bump('call_accept');                                                       /* A */
  var r = callAcceptCore.apply(this, arguments);                                 /* base */
  try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}                  /* P4 after, synchronous */
  return Promise.resolve(r).then(function (v) {                                  /* N10 */
    if (CALL.active && !CALL.caller) { CALL.startTs = Date.now(); n10L('n10_accept_anchor', {}); }
    return v;
  }).then(function (v) { if (CALL.active) n18Anchor('answerer'); return v; });    /* N18 */
};
