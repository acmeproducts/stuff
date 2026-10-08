  var _wireMsg = wireMsg;
  wireMsg = function (node, e) {
    var r = _wireMsg.apply(this, arguments);
    try {
      if (!e || e.kind === 'sys') return r;
      var clar = node.querySelector('.head-acts [data-hact=clar]');
      if (!clar || node.querySelector('[data-hact=check]')) return r;
      var b = document.createElement('button');
      b.className = 'tr-act-btn'; b.setAttribute('data-hact', 'check'); b.title = 'Translation check'; b.innerHTML = ICO;
      clar.insertAdjacentElement('afterend', b);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); backCheck(e); });
    } catch (_) {}
    return r;
  };
