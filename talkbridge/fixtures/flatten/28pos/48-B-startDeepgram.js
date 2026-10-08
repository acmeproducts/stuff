function startDeepgram() {
  var room = activeRoom();
  if (!room || !(CALL.active || CHATMIC.on)) return;

  var key = CALL.keys().dg;
  if (!key) { toast('Deepgram key missing — no live transcription'); log('dg_no_key', {}, 'warn'); return; }
  if (dgActive || (dgWs && dgWs.readyState < 2)) { log('dg_skip_active', {}, 'warn'); return; }

  var stream = micStream();
  if (!stream) { log('dg_no_stream', {}, 'error'); return; }

  var langParam = dgLangParam(room);
  var myGen = GEN.n;
  dgGen = myGen;

  var url = 'wss://api.deepgram.com/v1/listen?model=nova-3&language=' + encodeURIComponent(langParam) +
            '&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400';

  dgWs = new WebSocket(url, ['token', key]);
  var mySocket = dgWs;
  var myEnSocket = null;

  /* live() is the single predicate for "this callback still matters". */
  function live() { return dgWs === mySocket && GEN.is(myGen); }

  dgWs.onopen = function () {
    if (!live()) { try { mySocket.close(); } catch (_) {} return; }
    if (!(CALL.active || CHATMIC.on)) { try { dgWs.close(); } catch (_) {} return; }
    dgFailCount = 0; dgHideFailBanner();
    log('dg_open', { lang: langParam, multi: langParam === 'multi', gen: myGen }, 'ok');
    try {
      var audioTracks = (stream ? stream.getAudioTracks() : []).filter(function (t) { return t.readyState === 'live'; });
      if (!audioTracks.length) { log('dg_no_audio', {}, 'error'); dgWs.close(); return; }
      var dgStream = new MediaStream(audioTracks);
      dgAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      dgSrc = dgAudioCtx.createMediaStreamSource(dgStream);
      var silentGain = dgAudioCtx.createGain();
      silentGain.gain.value = 0;
      silentGain.connect(dgAudioCtx.destination);

      function pump(f) {
        if (!live() || dgWs.readyState !== 1 || !micPipelineOn()) return;
        var b = new Int16Array(f.length);
        for (var i = 0; i < f.length; i++) { var s = Math.max(-1, Math.min(1, f[i])); b[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; }
        dgWs.send(b.buffer);
        if (myEnSocket && myEnSocket.readyState === 1) myEnSocket.send(b.buffer);
      }
      function scriptProc() {
        if (!live()) return;
        dgProc = dgAudioCtx.createScriptProcessor(4096, 1, 1);
        dgProc.onaudioprocess = function (e) { pump(e.inputBuffer.getChannelData(0)); };
        dgSrc.connect(dgProc); dgProc.connect(silentGain);
        dgActive = true; log('dg_scriptproc_active', {}, 'warn');
      }
      if (dgAudioCtx.audioWorklet && typeof AudioWorkletNode !== 'undefined') {
        var wblob = new Blob([DG_WORKLET_CODE], { type: 'application/javascript' });
        var wurl = URL.createObjectURL(wblob);
        dgAudioCtx.audioWorklet.addModule(wurl).then(function () {
          URL.revokeObjectURL(wurl);
          if (!live() || dgWs.readyState !== 1) return;
          var wnode = new AudioWorkletNode(dgAudioCtx, 'tb-audio-capture');
          wnode.port.onmessage = function (ev) { pump(ev.data); };
          dgSrc.connect(wnode); wnode.connect(silentGain);
          dgProc = wnode; dgActive = true; log('dg_worklet_active', {}, 'ok');
        }).catch(function (e) {
          URL.revokeObjectURL(wurl); log('worklet_fallback', { e: String(e) }, 'warn'); scriptProc();
        });
      } else scriptProc();
    } catch (e) { log('dg_audio_err', { e: String(e) }, 'error'); dgActive = false; }
  };

  dgWs.onmessage = function (e) {
    if (!live()) return;
    _dgLastMsg = Date.now();
    try {
      var d = JSON.parse(e.data);
      var alt = d.channel && d.channel.alternatives && d.channel.alternatives[0];
      if (alt && alt.transcript && d.is_final) {
        if (myEnSocket) {
          dgArbitrateNative(alt.transcript, function (t) { if (GEN.is(myGen)) onDGFinal(t, myGen, room.myLang); });
        } else {
          onDGFinal(alt.transcript, myGen, dgUseMulti(room) ? null : room.myLang);
        }
      }
    } catch (_) {}
  };

  dgWs.onerror = function () { if (live()) log('dg_error', {}, 'error'); };

  dgWs.onclose = function (ev) {
    if (dgWs !== mySocket) { log('dg_stale_close_ignored', { code: ev.code }, 'warn'); return; }
    if (!GEN.is(myGen)) { log('dg_stale_gen_close_ignored', { code: ev.code, gen: myGen }, 'warn'); return; }
    log('dg_close', { code: ev.code, capturedGen: myGen, currentGen: GEN.n }, 'warn');
    var neverOpened = !dgActive;
    dgActive = false; stopDGAudio(); _stopDgWatchdog();
    if (myEnSocket) { try { myEnSocket.close(); } catch (_) {} myEnSocket = null; }
    if (!(CALL.active || CHATMIC.on)) return;
    if (neverOpened) {
      dgFailCount++;
      log('dg_credential_failure', { count: dgFailCount, code: ev.code }, 'error');
      if (dgFailCount >= DG_MAX_FAILS) { dgShowFailBanner(); return; }
    }
    setTimeout(function () {
      if (!GEN.is(myGen)) { log('dg_stale_gen_retry_dropped', { gen: myGen }, 'warn'); return; }
      if ((CALL.active || CHATMIC.on) && !dgActive) startDeepgram();
    }, 2000);
  };

  if (dgUseDual(room)) {
    var urlEn = 'wss://api.deepgram.com/v1/listen?model=nova-3&language=en' +
                '&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400';
    myEnSocket = new WebSocket(urlEn, ['token', key]);
    var enSock = myEnSocket;
    myEnSocket.onmessage = function (e) {
      if (myEnSocket !== enSock || !GEN.is(myGen)) return;
      _dgLastMsg = Date.now();
      try {
        var d = JSON.parse(e.data);
        var alt = d.channel && d.channel.alternatives && d.channel.alternatives[0];
        if (!(alt && alt.transcript && d.is_final)) return;
        dgDeliverEnglish(alt.transcript, myGen);
      } catch (_) {}
    };
    myEnSocket.onerror = function () { if (myEnSocket === enSock) log('dg_en_error', {}, 'error'); };
    myEnSocket.onclose = function (ev) {
      log('dg_en_close', { code: ev.code, capturedGen: myGen, currentGen: GEN.n }, 'warn');
      if (myEnSocket === enSock) myEnSocket = null;
    };
    log('dg_en_open', { myLang: room.myLang }, 'ok');
  }

  _dgLastMsg = Date.now();
  _stopDgWatchdog();
  _dgWatchdogTimer = setInterval(function () {
    if (!GEN.is(myGen)) { _stopDgWatchdog(); return; }
    if (!dgActive || !(CALL.active || CHATMIC.on)) { _stopDgWatchdog(); return; }
    if (Date.now() - _dgLastMsg > DG_WATCHDOG_MS) {
      log('dg_watchdog_restart', { silent_ms: Date.now() - _dgLastMsg }, 'warn');
      stopDeepgram();
      setTimeout(function () {
        if (!GEN.is(myGen)) return;
        if ((CALL.active || CHATMIC.on) && !dgActive) startDeepgram();
      }, 1000);
    }
  }, 5000);
}
