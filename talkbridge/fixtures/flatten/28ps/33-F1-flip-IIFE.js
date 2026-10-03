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
