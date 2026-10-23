/* ═══════════ 30·base PART · CV-1 camera-back.js — THE CAMERA COMES BACK AFTER IT IS TAKEN (§7.22, candidate 3) ═══════════ */
/* @contract
   replaces: (none)   wraps: (none) — it watches the call's own tracks once a second; it reassigns no function
   adds: CV, cvLog, cvTrack, cvWire, cvFacing, cvDue, cvCheck, cvRestore, cvTick, cvInit
   markers (cvLog's own prefix 'cv_'): track, restore, restored, restore_failed, restore_abandoned, init_failed

   THE OWNER (2026-10-23): "if I tap the chat compose and then tap the iPhone keyboard microphone … it does allow me to voice
   type, but it also kills the video transmission and never returns."
   THE CAUSE: iOS hands the microphone to keyboard dictation and interrupts the page's capture; the camera track ends (or stays
   muted), and nothing in the app ever asked for the camera again — its only camera opens are the call's start and the flip.
   The accepted page has it too.
   THE CHANGE: while a video call is up, once a second (and at once on focus), the call's camera track is checked. Only while
   the page is visible AND focused — it never fights dictation. A track that has ENDED, or is MUTED for 2 such seconds, is
   replaced by the flip's own sequence (R17, release first): the senders let go, the dead track removed and stopped, the camera
   asked exactly as the app asks it (video:true for the front camera, { facingMode:'environment' } after a flip — the facing is
   the one the dying track was opened with), the new track added to the call's stream, the senders given it (awaited, and
   checked), the self-view re-pointed. Camera off: nothing is opened (no camera light after the person turned it off); the
   check runs again the moment the camera is turned back on. No video track at all is never a trigger (the flip's own gap).
   REVIEW (2026-10-23, independent): the call may end, or be rebuilt, while the camera is being asked — the new track is then
   stopped, never orphaned; the flip may run meanwhile — the stream's live track wins and ours is stopped; a refused permission
   waits for the next tap and is not counted; three failures in a row stop the tries until the next incident; a recovery that
   stays live 5 s ends the incident, so a second dictation in the same call recovers too. The microphone is NOT reopened here
   (its pipeline holds the old track); cv_track logs what dictation does to it. */
var CV = { timer: null, busy: false, fails: 0, lastTry: 0, badSince: 0, needTap: false, liveSince: 0, lost: null, lostAsk: true, MUTE_MS: 2000, GAP_MS: 5000, MAX: 3, STABLE_MS: 5000 };
function cvLog(what, d, lvl) { try { log('cv_' + what, d || {}, lvl || 'info'); } catch (_) {} }
function cvTrack() { try { return (CALL.stream && CALL.stream.getVideoTracks) ? CALL.stream.getVideoTracks()[0] || null : null; } catch (_) { return null; } }
function cvWire(t) {
  if (!t || t.__cvWired) return; t.__cvWired = true;
  try { var st = t.getSettings ? t.getSettings() : null; t.__cvFacing = (st && st.facingMode) || (t.kind === 'video' && typeof TB_FACING !== 'undefined' ? TB_FACING : ''); } catch (_) {}
  ['mute', 'unmute', 'ended'].forEach(function (ev) { try { t.addEventListener(ev, function () { cvLog('track', { kind: t.kind, ev: ev, hidden: !!document.hidden }, ev === 'unmute' ? 'info' : 'warn'); if (ev !== 'mute') cvCheck(ev); }); } catch (_) {} });
}
/* the camera the dying track was opened with: the call's start asks video:true (the front camera), the flip asks the back by name */
function cvFacing(t) { return (t && t.__cvFacing === 'environment') ? { facingMode: 'environment' } : true; }
function cvDue(now) {
  if (!CALL.active || CALL.kind !== 'video' || CV.busy) return null;
  if (document.hidden || !document.hasFocus()) { CV.badSince = 0; return null; }
  var t = cvTrack();
  if (!t) { CV.badSince = 0; if (!(CV.lost && CV.lost === CALL.stream)) return null; }   /* no track is a trigger only when WE removed it and the ask failed */
  else if (t.readyState !== 'ended' && !t.muted) { CV.badSince = 0; if (CV.liveSince && now - CV.liveSince >= CV.STABLE_MS) { CV.fails = 0; CV.liveSince = 0; } return null; }
  if (!CALL.camOn) return null;                              /* camera off: open nothing; checked again when it is turned on */
  if (t && t.readyState !== 'ended') { if (!CV.badSince) CV.badSince = now; if (now - CV.badSince < CV.MUTE_MS) return null; }
  if (CV.needTap) return null;
  if (CV.fails >= CV.MAX) return null;
  if (CV.lastTry && now - CV.lastTry < CV.GAP_MS) return null;
  return !t ? 'lost' : t.readyState === 'ended' ? 'ended' : 'muted';
}
function cvCheck(why) {
  try {
    if (!CALL.active) { CV.fails = 0; CV.lastTry = 0; CV.badSince = 0; CV.needTap = false; CV.liveSince = 0; CV.lost = null; return; }
    if (why === 'focus' || why === 'visible') CV.fails = 0;   /* the person came back: a new incident */
    var s = CALL.stream; if (s && s.getTracks) s.getTracks().forEach(cvWire);
    var r = cvDue(Date.now()); if (r) cvRestore(r + (why ? '/' + why : ''));
  } catch (e) { cvLog('restore_failed', { e: String(e && e.message || e), where: 'check' }, 'error'); }
}
function cvRestore(why) {
  var old = cvTrack(), s0 = CALL.stream, pc0 = CALL.pc, t0 = Date.now(), ask = old ? cvFacing(old) : CV.lostAsk;
  CV.busy = true; CV.lastTry = t0; CV.badSince = 0; CV.liveSince = 0;
  cvLog('restore', { why: why, try: CV.fails + 1, ask: ask === true ? 'front' : 'back' }, 'warn');
  camSenders().forEach(function (sender) { replaceSenderTrack(sender, null); });   /* R17: release first (and keeps the F1 tag) */
  try { if (old) { s0.removeTrack(old); old.stop(); } } catch (_) {}
  CV.lost = s0; CV.lostAsk = ask;
  navigator.mediaDevices.getUserMedia({ video: ask, audio: false }).then(function (ns) {
    var t = ns.getVideoTracks()[0], all = ns.getTracks();
    var stopAll = function () { all.forEach(function (x) { try { x.stop(); } catch (_) {} }); };
    if (!t) { stopAll(); throw new Error('no video track'); }
    var live = cvTrack();
    if (!CALL.active || CALL.stream !== s0 || (live && live.readyState === 'live')) {
      stopAll(); CV.busy = false; CV.lost = null;
      cvLog('restore_abandoned', { why: !CALL.active ? 'ended' : CALL.stream !== s0 ? 'new_stream' : 'live_track' }, 'warn');
      return;
    }
    t.__cvFacing = ask === true ? 'user' : 'environment'; cvWire(t);
    try { s0.addTrack(t); } catch (_) {}
    CV.lost = null;
    t.enabled = !!CALL.camOn;
    try { var lv = document.getElementById('local-video'); if (lv) lv.srcObject = s0; } catch (_) {}
    var senders = CALL.camOn ? camSenders() : [];
    return Promise.all(senders.map(function (sender) { return Promise.resolve(sender.replaceTrack(t)).then(function () { return sender.track === t; }, function () { return false; }); })).then(function (oks) {
      CV.busy = false;
      var n = oks.filter(Boolean).length, st = t.getSettings ? t.getSettings() : {};
      if (CALL.pc !== pc0) cvLog('restore_failed', { e: 'connection rebuilt while asking', senders: n }, 'warn');
      if (CALL.camOn && n === 0) { CV.fails++; cvLog('restore_failed', { e: 'no sender took the track', of: senders.length }, 'error'); return; }
      CV.liveSince = Date.now();
      cvLog('restored', { ms: Date.now() - t0, w: st.width || 0, h: st.height || 0, senders: n }, 'ok');
    });
  }).catch(function (e) {
    CV.busy = false; var name = String(e && e.name || e);
    if (name === 'NotAllowedError') CV.needTap = true; else CV.fails++;
    cvLog('restore_failed', { e: name, try: CV.fails, waitTap: CV.needTap }, 'error');
  });
}
function cvTick() { cvCheck(''); }
function cvInit() {
  try {
    CV.timer = setInterval(cvTick, 1000);
    window.addEventListener('focus', function () { cvCheck('focus'); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) cvCheck('visible'); });
    /* a refused camera is asked again on the person's next tap, not on a timer */
    var tap = function () { if (CV.needTap) { CV.needTap = false; cvCheck('tap'); } };
    document.addEventListener('pointerdown', tap, true); document.addEventListener('touchstart', tap, true);
  } catch (e) { cvLog('init_failed', { e: String(e && e.message || e) }, 'error'); }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cvInit); else cvInit();
