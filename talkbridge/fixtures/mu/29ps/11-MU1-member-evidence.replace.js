    try { mu1Member(d); } catch (_) {}                                             /* MU-1 · who is in the room, by device */
    if (d && (d.name || d.newName || d.senderName)) {
      try {
        var _room = activeRoom();