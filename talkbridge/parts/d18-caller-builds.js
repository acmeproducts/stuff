/* ═══════════ GAP PART · D18-caller-builds.js ═══════════ */
/* @contract
   replaces: (none — twelve banked one-line replacements in callAcceptCore, callOnAcceptedCore, CALL.setupPC, handleRelayCore, c3IsCreator→c3IsBuilder, CALL.onSignal (C3 ask/serve), callOnSignalGlare, CALL.runRecovery)
   wraps: (none)
   adds: CALL.builds · marker call_builder
*/
/* ─────────────────────────────────────────────────────────────────────────────
   D-18 · THE CALLER BUILDS THE CONNECTION (owner GO, 2026-10-09)

   Until now only the room's CREATOR built the voice-and-picture link: it made
   the offer, held its ground in glare, served restarts, rebuilt in recovery,
   resent the offer on a reconnect. "Creator" is a flag stored on one device.
   The owner deleted and reinstalled the app; the reinstall kept the rooms and
   the keys, lost the device identity, and the room came back through its own
   invite as a joiner — two joiners, no creator, and every call rang, answered
   and carried nothing, silently. A reinstall is an ordinary event.

   THE RULE: the phone that PLACES the call builds the link; the answerer waits
   for the offer. Everything that used to ask "am I the creator?" in the call
   path now asks CALL.builds(): true on the caller from CALL.start until
   teardown, false on the answerer. Twelve lines change (banked as
   replacements, each exactly once); nothing else in the call moves. The
   decision is logged once per call, at the two points where it is taken
   (accept, and the caller's answer), as call_builder {builds, role}.
   Proven by harness-fixes-28pos: a two-joiner room now carries a call; a
   joiner calling the creator builds it; the creator calling still builds it.
   ───────────────────────────────────────────────────────────────────────────── */
CALL.builds = function () { return !!this.caller; };
