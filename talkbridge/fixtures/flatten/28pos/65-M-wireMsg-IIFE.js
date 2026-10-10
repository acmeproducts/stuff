(function () {
  var _rmWireMsg = wireMsg;
  wireMsg = function (node, e) {
    var r = _rmWireMsg.apply(this, arguments);
    try {
      if (node && node.querySelector) {
        var rec = node.querySelector('[data-receipt]');
        if (rec) rec.addEventListener('click', function (ev) { ev.stopPropagation(); showReceiptPopup(e); });
      }
    } catch (err) { rmLog('receipt_wire_failed', { e: String(err && err.message || err) }, 'error'); }
    return r;
  };
})();
