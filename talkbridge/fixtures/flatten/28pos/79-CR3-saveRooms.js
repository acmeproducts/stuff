  /* A mute toggle is part of the device's truth; the relay hears it at once. */
  var _cr3SaveRooms = saveRooms;
  saveRooms = function () {
    var r = _cr3SaveRooms.apply(this, arguments);
    try {
      var sig = S.rooms.map(function (x) { return x.id + ':' + (x.muted ? 1 : 0); }).join(',');
      if (cr3State.muteSig !== undefined && cr3State.muteSig !== sig) { clearTimeout(cr3State.muteTimer); cr3State.muteTimer = setTimeout(function () { cr3Announce('mute'); }, 100); }
      cr3State.muteSig = sig;
    } catch (_) {}
    return r;
  };
