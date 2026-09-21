(function () {
  var _netRelayConnect = relayConnect;
  relayConnect = function () {
    var r = _netRelayConnect.apply(this, arguments);
    try {
      if (typeof _relayWs !== 'undefined' && _relayWs && _relayWs.addEventListener) {
        var openedAt = Date.now();
        _relayWs.addEventListener('close', function (ev) {
          netLog('relay_closed', { code: ev.code, livedMs: Date.now() - openedAt, hidden: !!document.hidden }, 'warn');
        });
      }
    } catch (_) {}
    return r;
  };
})();
