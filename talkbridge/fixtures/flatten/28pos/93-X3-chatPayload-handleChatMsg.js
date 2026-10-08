  var _chatPayload = chatPayload;
  chatPayload = function (e) {
    var m = _chatPayload.apply(this, arguments);
    try { if (m && e && e.said && m.type === 'chat-msg') { m.said = e.said; m.saidLang = e.saidLang || ''; } } catch (_) {}
    return m;
  };
  var _handleChatMsg = handleChatMsg;
  handleChatMsg = function (d, room) {
    try {
      var said = d && typeof d.said === 'string' ? norm(d.said) : '';
      x3PendingIn = said && d.srcText ? { said: said, saidLang: String(d.saidLang || ''), normalized: norm(d.srcText), at: Date.now() } : null;
    } catch (_) { x3PendingIn = null; }
    return _handleChatMsg.apply(this, arguments);
  };
