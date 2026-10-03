  var _start = CALL.start, _accept = CALL.accept, _teardown = CALL.teardown;

  CALL.start = function () { GEN.bump('call_start'); return _start.apply(this, arguments); };
  CALL.accept = function () { GEN.bump('call_accept'); return _accept.apply(this, arguments); };
  CALL.teardown = function () { var r = _teardown.apply(this, arguments); GEN.bump('call_end'); return r; };
