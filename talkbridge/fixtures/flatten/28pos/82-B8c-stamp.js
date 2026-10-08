  /* 3 · Both link builders carry the room's name, read at generation time. */
  function stamp(url, room) {
    try {
      var i = url.indexOf('#j='); if (i === -1) return url;
      var p = decInv(url.slice(i + 3)); if (!p) return url;
      var n = (room && room.myName) || (S.user && S.user.name) || '';
      if (!n) return url;
      if (p.n !== undefined) p.n = n;
      if (p.myn !== undefined) p.myn = n;
      return url.slice(0, i) + '#j=' + encInv(p);
    } catch (_) { return url; }
  }
  if (typeof linkDeviceUrl === 'function') {
    var _ld = linkDeviceUrl;
    linkDeviceUrl = function (room) { return stamp(_ld.apply(this, arguments), room); };
  }
