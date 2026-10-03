(function () {
  if (typeof CALL === 'undefined' || typeof CALL.hangUp !== 'function') return;
  var _hangUp = CALL.hangUp;
  CALL.hangUp = function () {
    try {
      ['remote-video', 'local-video'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.__tbDragState) el.__tbDragState.on = false;
        tbClearPos(el);
      });
      var h = document.getElementById('local-video-handle'); if (h) h.style.display = 'none';
    } catch (_) {}
    TB_SWAP = false;
    try { var host = $('call-videos'); if (host) host.classList.remove('swapped'); } catch (_) {}
    return _hangUp.apply(this, arguments);
  };
})();
