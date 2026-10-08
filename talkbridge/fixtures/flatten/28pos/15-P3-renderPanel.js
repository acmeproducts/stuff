  var _p3RenderPanel = renderPanel;
  renderPanel = function () {
    var r = _p3RenderPanel.apply(this, arguments);
    try { p3SyncMutes(); } catch (_) {}
    return r;
  };
