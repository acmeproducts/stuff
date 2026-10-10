(function () {
  var _lcRenderPanel = renderPanel;
  renderPanel = function () {
    var r = _lcRenderPanel.apply(this, arguments);
    try {
      var body = $('panel-body');
      if (body) body.querySelectorAll('[data-restore]').forEach(function (el) {
        el.addEventListener('click', function (ev) { ev.stopPropagation(); restoreRoom(el.dataset.restore); });
      });
    } catch (e) { lcLog('restore_wire_failed', { e: String(e && e.message || e) }, 'error'); }
    return r;
  };
})();
