  var _cr3Keys = CALL.keys;
  CALL.keys = function () {
    var k = _cr3Keys.apply(this, arguments) || {};
    try {
      if (k.dg && k.tid && k.tok) return k;
      var rec = (typeof grantRecord === 'function') ? grantRecord() : null;
      if (!rec || (typeof grantExpired === 'function' && grantExpired(rec))) return k;
      var g = (typeof grantedCreds === 'function') ? grantedCreds() : null;
      if (!g) return k;
      var out = { dg: k.dg || g.dg || '', tid: k.tid || g.tid || '', tok: k.tok || g.tok || '' };
      if (!k.dg && out.dg && !cr3State.grantUsedLogged) { cr3State.grantUsedLogged = true; cr3Log('grant_keys_used', { room: S.roomId }, 'ok'); }
      return out;
    } catch (e) { cr3Log('grant_keys_failed', { e: String(e && e.message || e) }, 'error'); return k; }
  };
