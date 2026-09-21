(function () {
  if (typeof handleRelay !== 'function') return;
  var _h = handleRelay;
  handleRelay = function (d) {
    if (d && d.type === 'peer') {
      var present = !!(d.others > 0);
      try { setPresence(present); } catch (_) {}
      try { if (typeof log === 'function') log('pr3_dot', { others: d.others || 0 }, 'ok'); } catch (_) {}
      return;
    }
    return _h.apply(this, arguments);
  };
})();
