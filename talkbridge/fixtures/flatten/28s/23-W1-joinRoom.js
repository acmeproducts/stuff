  var _join = joinRoom;
  joinRoom = function (p) {
    var fresh = false;
    try { fresh = !!(p && p.r && typeof roomById === 'function' && !roomById(p.r)); } catch (_) {}
    var r = _join.apply(this, arguments);
    try {
      if (fresh && p && (p.n || p.t) && typeof addSysPill === 'function' && S.roomId === p.r) {
        var mine = (typeof gL === 'function' && p.tl) ? gL(p.tl).name : (p.tl || '');
        var theirs = (typeof gL === 'function' && p.ml) ? gL(p.ml).name : (p.ml || '');
        var langs = (mine && theirs) ? ' (' + mine + ' \u2194 ' + theirs + ')' : '';
        addSysPill((p.n || 'Someone') + ' is inviting you to ' + (p.t || 'their chat') + langs);
        L('w1_welcome', { n: (p.n || '').slice(0, 12), t: (p.t || '').slice(0, 16), l: (p.tl || '') + '-' + (p.ml || '') });
      }
    } catch (_) {}
    return r;
  };
