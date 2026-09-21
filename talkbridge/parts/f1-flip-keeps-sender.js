/* ═══════════ GAP PART · F1-flip-keeps-sender.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: replaceSenderTrack, camSenders
   adds: (none) — a non-enumerable tag on a released video sender
*/
/* ─────────────────────────────────────────────────────────────────────────────
   F-1 · A CAMERA FLIP KEEPS THE FAR SIDE'S PICTURE (§7.15, D-9, G60)

   THE EVIDENCE (c7 device gate, creator, 2026-09-21):
     10:03:04.777  v4_camera_flip {"to":"environment"}
     10:03:05.800  d1_stats … outB 5746832
     10:03:07.804  d1_stats … outB 5746832      ← outbound video never moves again
   Two more flips, same number. The far side's picture of this phone froze at
   the first flip and never came back, while the flip looked perfect locally.

   THE CAUSE: `tbFlipCamera` (R17, "release first") does
     camSenders().forEach(s => replaceSenderTrack(s, null));   // sender.track → null
     … getUserMedia …
     camSenders().forEach(s => replaceSenderTrack(s, track));  // camSenders() is now []
   because `camSenders` keeps only senders whose CURRENT track is video, and a
   released sender has no track. The new camera reaches `CALL.stream` and the
   local preview, never the connection.

   THE CHANGE, two wrappers: `replaceSenderTrack` — when a video track is
   being replaced with null, tag the sender (non-enumerable). `camSenders` —
   call through, then add any tagged sender the filter dropped. The second
   pass in `tbFlipCamera` now finds its sender and the far side keeps its
   picture. The same lookup serves `restoreCamTrack`, so camera-off → on gets
   the same repair for free.
   ───────────────────────────────────────────────────────────────────────────── */
(function () {
  if (typeof replaceSenderTrack !== 'function' || typeof camSenders !== 'function') return;

  function tag(sender) {
    try { Object.defineProperty(sender, '__tbVideoSender', { value: true, enumerable: false, configurable: true }); }
    catch (_) { try { sender.__tbVideoSender = true; } catch (__) {} }
  }

  var _replaceSenderTrack = replaceSenderTrack;
  replaceSenderTrack = function (sender, track) {
    try {
      if (sender && track === null && sender.track && sender.track.kind === 'video') tag(sender);
      if (sender && track && track.kind === 'video') tag(sender);
    } catch (_) {}
    return _replaceSenderTrack.apply(this, arguments);
  };

  var _camSenders = camSenders;
  camSenders = function () {
    var found = _camSenders.apply(this, arguments) || [];
    try {
      var all = (CALL.pc && CALL.pc.getSenders) ? CALL.pc.getSenders() : [];
      for (var i = 0; i < all.length; i++) {
        var s = all[i];
        if (s && s.__tbVideoSender && found.indexOf(s) === -1) found.push(s);
      }
      if (found.length && !found.__f1Logged) {
        /* one line per lookup that the tag rescued, so a device log can prove it */
        var rescued = found.filter(function (s) { return !(s.track && s.track.kind === 'video'); }).length;
        if (rescued) log('f1_sender_kept', { n: rescued }, 'ok');
      }
    } catch (_) {}
    return found;
  };
})();
