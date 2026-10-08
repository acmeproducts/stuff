(function () {
  var _tbLoadTr = loadTr;
  loadTr = function (id) {
    var entries = _tbLoadTr.apply(this, arguments);
    try { seedSpeechSeq(entries); } catch (e) { try { log('seq_seed_err', { e: String(e) }, 'error'); } catch (_) {} }
    return entries;
  };
})();
