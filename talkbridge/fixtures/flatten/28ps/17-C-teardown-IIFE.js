/* Everything this part started has to stop when the call does. */
(function () {
  var _teardown = CALL.teardown;
  CALL.teardown = function () {
    this.resetRecoveryState();
    if (this.kaChannel) { try { this.kaChannel.close(); } catch (_) {} this.kaChannel = null; }
    return _teardown.apply(this, arguments);
  };
})();
