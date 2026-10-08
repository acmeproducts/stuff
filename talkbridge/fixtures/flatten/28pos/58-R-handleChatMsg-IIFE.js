(function () {
  var _rHandleChat = handleChatMsg;
  handleChatMsg = function (d, room) {
    var before = (room && room.unread) || 0;
    var r = _rHandleChat.apply(this, arguments);
    try {
      if (room && (room.unread || 0) > before) {
        room.unread = before;
        bumpWaiting(room, 'chat');
        saveRooms();
      }
    } catch (e) { rcLog('chat_count_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
