  var _p6CardHtml = roomCardHtml;
  roomCardHtml = function (r, where) {
    var h = _p6CardHtml.apply(this, arguments);
    try {
      if (h && r && !r.sendLocked) h = h.replace('</div><div class="rc2-flags">', '<button class="rc2-plus" data-thread="' + r.id + '" aria-label="Add a thread">+</button></div><div class="rc2-flags">');
    } catch (_) {}
    return h;
  };
  var _p6Wire = wireRoomCards;
  wireRoomCards = function (host) {
    var r = _p6Wire.apply(this, arguments);
    try {
      if (host) Array.prototype.forEach.call(host.querySelectorAll('[data-thread]'), function (el) {
        el.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); p6AskName(el.dataset.thread); });
      });
    } catch (e) { p6Log('wire_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
  var _p6RenderPanel = renderPanel;
  renderPanel = function () {
    var r = _p6RenderPanel.apply(this, arguments);
    try {
      var body = $('panel-body'); if (!body) return r;
      var h = '';
      S.rooms.filter(function (x) { return !x.deletedAt && x.threadInvites && x.threadInvites.length; }).forEach(function (parent) {
        parent.threadInvites.forEach(function (inv) { h += p6InviteCardHtml(parent, inv); });
      });
      if (h) {
        var wrap = document.createElement('div'); wrap.id = 'p6-invites'; wrap.innerHTML = h;
        body.insertBefore(wrap, body.firstChild);
        Array.prototype.forEach.call(wrap.querySelectorAll('.p6-inv'), function (card) {
          var pid = card.dataset.p6Parent, tid = card.dataset.p6Thread;
          card.querySelector('[data-p6-accept]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Accept(pid, tid); });
          card.querySelector('[data-p6-decline]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Decline(pid, tid); });
        });
      }
    } catch (e) { p6Log('panel_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
