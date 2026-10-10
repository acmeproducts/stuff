(function () {
  var _sendChatText = sendChatText;
  /* Typed text — and spoken text in chat mode, which funnels through here too.
     Normalizing twice is harmless: the second pass finds the text already in
     the room's language and does nothing. */
  sendChatText = async function (text, attachment, originOverride) {
    var room = activeRoom();
    if (room && text) {
      var myGen = GEN.n;
      try {
        var r = await normalizeOutgoing(room, text);
        if (!GEN.is(myGen)) { log('chat_gen_abandoned', { gen: myGen }, 'warn'); return; }
        text = r.text;
        if (r.lang !== room.myLang) log('normalize_incomplete', { was: r.detected, wanted: room.myLang }, 'warn');
      } catch (e) { log('normalize_err', { e: String(e) }, 'error'); }
    }
    return _sendChatText.call(this, text, attachment, originOverride);
  };
})();
