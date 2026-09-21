  var _cr3ListenOpen = LISTEN.open;
  LISTEN.open = function (room) {
    var r = _cr3ListenOpen.apply(this, arguments);
    try {
      var self = this, cur = this.socks[room.id];
      if (cur && cur.addEventListener) cur.addEventListener('open', function () { cr3OnOpen(room.id, cur, function () { return self.socks[room.id] === cur; }); });
    } catch (e) { cr3Log('listen_hook_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
