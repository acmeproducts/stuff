(function () {
  var _jRenderPanel = renderPanel;
  renderPanel = function () { var r = _jRenderPanel.apply(this, arguments); syncCreateControl(); return r; };
})();
