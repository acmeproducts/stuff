(function () {
  var _jSendChatText = sendChatText;
  sendChatText = function (text, attachment, origin) {
    try {
      var r = activeRoom();
      if (r) jLog('send_direction', { room: String(r.id).slice(-6), from: r.myLang, to: r.theirLang, role: r.role }, 'ok');
    } catch (_) {}
    return _jSendChatText.apply(this, arguments);
  };
})();
