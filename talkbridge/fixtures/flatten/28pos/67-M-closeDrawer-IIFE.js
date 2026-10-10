/* The drawer will not close over a nameless room. */
(function () {
  var _rmCloseDrawer = closeDrawer;
  closeDrawer = function () {
    if (holdOnBlankName()) { rmLog('drawer_close_blocked_empty_name', {}, 'warn'); return; }
    return _rmCloseDrawer.apply(this, arguments);
  };
})();
