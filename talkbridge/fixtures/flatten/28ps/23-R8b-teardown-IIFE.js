(function () {
  var _r8Teardown = CALL.teardown;
  CALL.teardown = function () {
    stopCallTimer();
    return _r8Teardown.apply(this, arguments);
  };
})();
