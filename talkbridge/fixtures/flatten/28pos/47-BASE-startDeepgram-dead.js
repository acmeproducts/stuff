function startDeepgram(){
  var room=activeRoom();if(!room||!(CALL.active||CHATMIC.on))return;
  var key=CALL.keys().dg;
  if(!key){toast('Deepgram key missing — no live transcription');log('dg_no_key',{},'warn');return}
  if(dgActive||(dgWs&&dgWs.readyState<2)){log('dg_skip_active',{},'warn');return}
  var stream=micStream();
  if(!stream){log('dg_no_stream',{},'error');return}
  var langCode=DG_LANGS[room.myLang]||room.myLang||'en-US';
  var url='wss://api.deepgram.com/v1/listen?model=nova-3&language='+encodeURIComponent(langCode)+'&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400';
  dgWs=new WebSocket(url,['token',key]);
  var mySocket=dgWs; // ROOT CAUSE FIX (2026-08-01): a prior, superseded socket's async close event
  // was arriving AFTER a new socket had already opened, and because every handler read/wrote the
  // shared globals (dgWs/dgActive/dgProc/dgAudioCtx) instead of checking identity, the stale event
  // silently tore down the new session's live audio pump — the call's mic kept "running" but fed
  // nothing to Deepgram. Reproduced with a realistic close-after-open timing race; only manifests
  // when a prior socket is still winding down, which is why a room's very first use is unaffected
  // but a session with prior mic/call activity (a re-entered room) can silently break.
  dgWs.onopen=function(){
    if(dgWs!==mySocket)return; // superseded before it even opened — ignore
    if(!(CALL.active||CHATMIC.on)){try{dgWs.close()}catch(_){}return}
    dgFailCount=0;dgHideFailBanner();
    log('dg_open',{lang:langCode},'ok');
    try{
      var audioTracks=(stream?stream.getAudioTracks():[]).filter(function(t){return t.readyState==='live'});
      if(!audioTracks.length){log('dg_no_audio',{},'error');dgWs.close();return}
      var dgStream=new MediaStream(audioTracks);
      dgAudioCtx=new(window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
      dgSrc=dgAudioCtx.createMediaStreamSource(dgStream);
      var silentGain=dgAudioCtx.createGain();silentGain.gain.value=0;silentGain.connect(dgAudioCtx.destination);
      function pump(f){
        if(dgWs!==mySocket||dgWs.readyState!==1||!micPipelineOn())return;
        var b=new Int16Array(f.length);
        for(var i=0;i<f.length;i++){var s=Math.max(-1,Math.min(1,f[i]));b[i]=s<0?s*0x8000:s*0x7FFF}
        dgWs.send(b.buffer);
        if(dgWsEn&&dgWsEn.readyState===1)dgWsEn.send(b.buffer);
      }
      function scriptProc(){
        if(dgWs!==mySocket)return;
        dgProc=dgAudioCtx.createScriptProcessor(4096,1,1);
        dgProc.onaudioprocess=function(e){pump(e.inputBuffer.getChannelData(0))};
        dgSrc.connect(dgProc);dgProc.connect(silentGain);
        dgActive=true;log('dg_scriptproc_active',{},'warn');
      }
      if(dgAudioCtx.audioWorklet&&typeof AudioWorkletNode!=='undefined'){
        var wblob=new Blob([DG_WORKLET_CODE],{type:'application/javascript'});
        var wurl=URL.createObjectURL(wblob);
        dgAudioCtx.audioWorklet.addModule(wurl).then(function(){
          URL.revokeObjectURL(wurl);
          if(dgWs!==mySocket||dgWs.readyState!==1)return;
          var wnode=new AudioWorkletNode(dgAudioCtx,'tb-audio-capture');
          wnode.port.onmessage=function(ev){pump(ev.data)};
          dgSrc.connect(wnode);wnode.connect(silentGain);
          dgProc=wnode;dgActive=true;log('dg_worklet_active',{},'ok');
        }).catch(function(e){URL.revokeObjectURL(wurl);log('worklet_fallback',{e:String(e)},'warn');scriptProc()});
      }else scriptProc();
    }catch(e){log('dg_audio_err',{e:String(e)},'error');dgActive=false}
  };
  dgWs.onmessage=function(e){
    if(dgWs!==mySocket)return;
    _dgLastMsg=Date.now();
    try{
      var d=JSON.parse(e.data);
      var alt=d.channel&&d.channel.alternatives&&d.channel.alternatives[0];
      if(alt&&alt.transcript&&d.is_final){
        if(dgWsEn){ // dual-socket cross-suppression (donor: th primary + en secondary)
          if(Date.now()-_dgEnLastFiredAt<_DG_CROSS_MS){log('dg_cross_suppress',{},'warn');return}
          if(_dgPrimHoldTimer)clearTimeout(_dgPrimHoldTimer);
          var pt=alt.transcript;_dgPrimHeldText=pt;
          _dgPrimHoldTimer=setTimeout(function(){_dgPrimHoldTimer=null;if(_dgPrimHeldText===pt){onDGFinal(pt);_dgPrimHeldText=null}},250);
        }else onDGFinal(alt.transcript);
      }
    }catch(_){}
  };
  dgWs.onerror=function(){if(dgWs===mySocket)log('dg_error',{},'error')};
  dgWs.onclose=function(ev){
    if(dgWs!==mySocket){log('dg_stale_close_ignored',{code:ev.code},'warn');return} // the actual fix
    log('dg_close',{code:ev.code},'warn');
    var neverOpened=!dgActive;
    dgActive=false;stopDGAudio();_stopDgWatchdog();
    if(!(CALL.active||CHATMIC.on))return;
    if(neverOpened){
      dgFailCount++;
      log('dg_credential_failure',{count:dgFailCount,code:ev.code},'error');
      if(dgFailCount>=DG_MAX_FAILS){dgShowFailBanner();return}
    }
    setTimeout(function(){if((CALL.active||CHATMIC.on)&&!dgActive)startDeepgram()},2000);
  };
  _dgLastMsg=Date.now();
  _stopDgWatchdog();
  _dgWatchdogTimer=setInterval(function(){
    if(!dgActive||!(CALL.active||CHATMIC.on)){_stopDgWatchdog();return}
    if(Date.now()-_dgLastMsg>DG_WATCHDOG_MS){
      log('dg_watchdog_restart',{silent_ms:Date.now()-_dgLastMsg},'warn');
      stopDeepgram();
      setTimeout(function(){if((CALL.active||CHATMIC.on)&&!dgActive)startDeepgram()},1000);
    }
  },5000);
  if(room.myLang==='th'){ // donor DG_DUAL_LANGS path
    var urlEn='wss://api.deepgram.com/v1/listen?model=nova-3&language=en&encoding=linear16&sample_rate=16000&channels=1&interim_results=false&punctuate=false&endpointing=400';
    if(dgWsEn){try{dgWsEn.close()}catch(_){}dgWsEn=null}
    dgWsEn=new WebSocket(urlEn,['token',key]);
    dgWsEn.onmessage=function(e){
      _dgLastMsg=Date.now();
      try{
        var d=JSON.parse(e.data);
        var alt=d.channel&&d.channel.alternatives&&d.channel.alternatives[0];
        if(alt&&alt.transcript&&d.is_final){
          if(alt.transcript.trim().length>10){
            _dgEnLastFiredAt=Date.now();
            if(_dgPrimHoldTimer){clearTimeout(_dgPrimHoldTimer);_dgPrimHoldTimer=null;_dgPrimHeldText=null;log('dg_cross_suppress',{},'warn')}
          }
          onDGFinal(alt.transcript);
        }
      }catch(_){}
    };
    dgWsEn.onerror=function(){log('dg_en_error',{},'error')};
    dgWsEn.onclose=function(){dgWsEn=null};
    log('dg_en_open',{},'ok');
  }
}
