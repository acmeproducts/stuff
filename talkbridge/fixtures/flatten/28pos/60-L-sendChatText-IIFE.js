(function () {
  var _lcSendChatText = sendChatText;
  sendChatText = function (text, attachment, origin) {
    var r = activeRoom();
    if (roomSendLocked(r)) { lcLog('send_blocked', { room: r && String(r.id).slice(-6) }, 'warn'); toast('They left this chat'); return; }
    return _lcSendChatText.apply(this, arguments);
  };
})();
