  function tStamp(url, room) {
    try {
      var i = url.indexOf('#j='); if (i === -1) return url;
      var p = decInv(url.slice(i + 3)); if (!p) return url;
      p.t = (room && room.title) || p.t || '';
      return url.slice(0, i) + '#j=' + encInv(p);
    } catch (_) { return url; }
  }
  if (typeof linkDeviceUrl === 'function') { var _ld = linkDeviceUrl; linkDeviceUrl = function (room) { return tStamp(_ld.apply(this, arguments), room); }; }
