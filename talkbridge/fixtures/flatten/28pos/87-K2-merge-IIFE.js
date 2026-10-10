(function () {
  if (typeof pbWriteBack !== 'function' || typeof pbPull !== 'function' || typeof log !== 'function') return;

  /* The refusal is only visible in the frozen log line; read it there. */
  var lastErr = null;
  var _log = log;
  log = function (ev, d) {
    if (ev === 'pb_writeback_err') lastErr = String((d && d.e) || '');
    return _log.apply(this, arguments);
  };
  function refused() { return /put 409|put 422/.test(lastErr || ''); }

  var _pbWriteBack = pbWriteBack;
  pbWriteBack = function () {
    var self = this, args = arguments;
    lastErr = null;
    return Promise.resolve(_pbWriteBack.apply(self, args)).then(function (r) {
      if (!r || r.status !== 'pending' || !refused()) return r;
      var localCards = (PB.cards || []).slice(), localVersion = PB.version;
      /* The other device wrote the SAME version number (the bridge never
         bumps), so the frozen pull's "already at this version" short-cut
         would skip the fetch. Forget the version for the pull; it is put
         back if the pull does not deliver. */
      PB.version = null;
      return Promise.resolve(pbPull()).then(function (p) {
        if (!p || p.status !== 'ok' || p.unchanged) { PB.version = localVersion; throw new Error('pull ' + ((p && p.status) || 'failed')); }
        var remoteCards = (PB.cards || []).slice();          /* pbPull REPLACEs PB.cards with the remote */
        var m = pbMergeCards(localCards, remoteCards);
        PB.cards = m.cards; PB.save(); PB.markDirty();
        try { log('pb_merge', { kept: m.kept, took: m.took, added: m.added, remoteVersion: p && p.version }, 'warn'); } catch (_) {}
        return _pbWriteBack.call(self);              /* the frozen function: one merge per write, never this wrapper again */
      }).catch(function (e) {
        PB.version = PB.version || localVersion; PB.cards = PB.cards && PB.cards.length ? PB.cards : localCards; PB.save(); PB.markDirty();
        try { log('pb_merge_err', { e: String((e && e.message) || e) }, 'error'); } catch (_) {}
        return r;
      });
    });
  };
})();
