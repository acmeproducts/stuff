  var _inv = invUrl;
  invUrl = function (room) { return stamp(_inv.apply(this, arguments), room); };
  try { if (typeof _lcInvUrl === 'function') { var _lc = _lcInvUrl; _lcInvUrl = function (room) { return stamp(_lc.apply(this, arguments), room); }; } } catch (_) {}
