  /* §11: the granted set is on disk for 30 days; the resolver never read it.
     Own key wins; memory wins; the unexpired grant fills what is empty. */
  var _cr3OnVisible = onVisible;
  onVisible = function (why) {
    var r = _cr3OnVisible.apply(this, arguments);
    try { cr3Recover(why); } catch (_) {}
    return r;
  };
