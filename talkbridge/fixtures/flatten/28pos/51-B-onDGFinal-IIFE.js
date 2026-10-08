(function () {
  var _onDGFinal = onDGFinal;
  /* Spoken text. Carries the session generation the transcription socket
     captured, so a line produced by a socket belonging to a previous room or
     call is dropped here instead of landing in the wrong transcript. */
  onDGFinal = async function (text, gen, knownLang) {
    if (typeof gen === 'number' && !GEN.is(gen)) { log('dg_final_stale_gen', { gen: gen }, 'warn'); return; }
    var room = activeRoom();
    if (room && text) {
      var myGen = GEN.n;
      try {
        var r = await normalizeOutgoing(room, text, knownLang);
        if (!GEN.is(myGen)) { log('dg_final_gen_abandoned', { gen: myGen }, 'warn'); return; }
        text = r.text;
        if (r.lang !== room.myLang) log('normalize_incomplete', { was: r.detected, wanted: room.myLang }, 'warn');
      } catch (e) { log('normalize_err', { e: String(e) }, 'error'); }
    }
    return _onDGFinal.call(this, text);
  };
})();
