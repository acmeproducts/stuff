/* ═══════════ GAP PART · D14-drawer-on-accept.js ═══════════ */
/* @contract
   replaces: CALL.accept, CALL.onAccepted
   wraps: (none)
   adds: (none) · marker d14_drawer_closed
*/
/* ─────────────────────────────────────────────────────────────────────────────
   D-14 · THE MORE MENU CLOSES WHEN A CALL IS ANSWERED (owner, 2026-10-07)

   The ring screen sits above the room's drawer, so the answer tap worked, but
   the call surface then showed under the still-open drawer. FL-2's accept
   (the answerer) and onAccepted (the caller) verbatim, each with one first
   line: if the drawer is open, close it — the base's own close (the name
   field committed, the drawer and its info pops shut), not M's guarded one,
   because a blank room name must not keep a drawer over a live call. Logged
   once per close as d14_drawer_closed {role}.
   ───────────────────────────────────────────────────────────────────────────── */
CALL.accept = function () {
  try { var dr = $('drawer-s4b'); if (dr && dr.classList.contains('open')) { closeDrawerCore(); log('d14_drawer_closed', { role: 'answerer' }, 'ok'); } } catch (_) {}   /* D-14: the More menu never stays open over a call */
  var p = this.ringPending;                                                      /* P4 reads first */
  GEN.bump('call_accept');                                                       /* A */
  var r = callAcceptCore.apply(this, arguments);                                 /* base */
  try { if (p && p.roomId) p4CloseTag(p.roomId); } catch (_) {}                  /* P4 after, synchronous */
  return Promise.resolve(r).then(function (v) {                                  /* N10 */
    if (CALL.active && !CALL.caller) { CALL.startTs = Date.now(); n10L('n10_accept_anchor', {}); }
    return v;
  }).then(function (v) { if (CALL.active) n18Anchor('answerer'); return v; });    /* N18 */
};

CALL.onAccepted = function (room, d) {
  try { var dr = $('drawer-s4b'); if (dr && dr.classList.contains('open')) { closeDrawerCore(); log('d14_drawer_closed', { role: 'caller' }, 'ok'); } } catch (_) {}   /* D-14: the More menu never stays open over a call */
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
