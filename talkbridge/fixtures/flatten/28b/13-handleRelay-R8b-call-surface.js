(function () {
  var _r8HandleRelay = handleRelay;
  handleRelay = function (d) {
    try {
      /* INSTRUMENTATION (owner report 2026-08-15: room names can desync;
         cause not established — every partnerName-bearing message is logged
         with its type and values so the next device test produces evidence
         instead of theory). Read-only: nothing is altered. */
      if (d && (d.name || d.newName || d.senderName)) {
        try {
          var _room = activeRoom();
          r8Log('name_msg', {
            type: d.type,
            name: d.name || d.newName || d.senderName,
            had: _room ? _room.partnerName : null
          }, 'ok');
        } catch (_) {}
      }
      if (d && d.type === 'typing') {
        var room = activeRoom();
        showTyping(room && room.partnerName);
        return;                       /* never reaches the transcript */
      }
      /* Anything actually arriving means they finished typing. */
      if (d && (d.type === 'chat-msg' || d.type === 'speech')) hideTyping();
    } catch (_) {}
    return _r8HandleRelay.apply(this, arguments);
  };
})();
