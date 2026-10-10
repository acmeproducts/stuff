  if (typeof showScreen === 'function') {
    var _show = showScreen;
    showScreen = function (v) { var r = _show.apply(this, arguments); declare('view_' + v); return r; };
  }
