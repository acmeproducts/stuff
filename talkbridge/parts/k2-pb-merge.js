/* ═══════════ GAP PART · K2-pb-merge.js ═══════════ */
/* @contract
   replaces: (none)
   wraps: pbWriteBack, log
   adds: pbMergeCards
*/
/* ─────────────────────────────────────────────────────────────────────────────
   K-2 · PHRASEBOOK COMPARE-AND-SWAP (§7.9 K2)

   The frozen `pbWriteBack` already does the right first half: it GETs the
   file's sha and PUTs with it, so GitHub refuses a stale write with 409/422.
   The second half was missing: on refusal it logged `pb_writeback_err`,
   armed a retry, and the retry did the same GET+PUT — which succeeds, and
   OVERWRITES the other device's cards with this device's whole list. Last
   writer wins the file; the first writer's work is gone.

   THE CHANGE: wrap `pbWriteBack`. The frozen function swallows the error and
   returns `{status:'pending'}` for every failure alike, so the refusal is
   read where the frozen code puts it — the `pb_writeback_err` log line,
   whose `e` reads "Error: put 409" or "Error: put 422". On that, pull the
   file as it now stands, merge it with the local cards BY CARD ID — the
   later `updatedAt`/`deletedAt` wins per card, cards only one side has are
   kept — log `pb_merge {kept, took, added}`, and call the FROZEN
   `pbWriteBack` once more, which fetches the fresh sha. The re-push goes to
   the frozen function, not back through this wrapper, so one write merges
   at most once; a second refusal is reported by the frozen code, not looped.
   ───────────────────────────────────────────────────────────────────────────── */
function pbMergeCards(local, remote) {
  var byId = {}, order = [], kept = 0, took = 0, added = 0;
  var clock = function (c) { return Math.max(Number(c.updatedAt) || 0, Number(c.deletedAt) || 0); };
  (local || []).forEach(function (c) { if (c && c.id) { byId[c.id] = c; order.push(c.id); } });
  (remote || []).forEach(function (c) {
    if (!c || !c.id) return;
    var mine = byId[c.id];
    if (!mine) { byId[c.id] = c; order.push(c.id); added++; return; }
    if (clock(c) > clock(mine)) { byId[c.id] = c; took++; } else { kept++; }
  });
  return { cards: order.map(function (id) { return byId[id]; }), kept: kept, took: took, added: added };
}

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
