(function () {
  var _r9CommitEdit = pbCommitEdit;
  pbCommitEdit = function (id, field, value) {
    try {
      if (field === 'target') {
        var c = pbCardById(id);
        if (!c) return;
        var v = norm(value);
        var prior = norm(c[field] || '');
        var changed = (v !== prior);
        c[field] = v;                                  /* S-RULE-4: edited side kept */
        return pbCommitEditTargetMirror(c, v, changed, prior);
      }
    } catch (e) { r8Log('r9_target_mirror_failed', { e: String(e && e.message || e) }, 'error'); }
    return _r9CommitEdit.apply(this, arguments);       /* source, notes, everything else: original */
  };
  pbCommitEdit._r9Original = _r9CommitEdit;
})();
