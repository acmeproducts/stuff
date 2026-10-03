  teardown:function(){
    this.active=false;this.caller=false;this.endedAt=Date.now();
    _remoteMicOn=false;renderPartnerState();
    clearTimeout(this.callerTimer);clearInterval(this.durTimer);this.callerTimer=this.durTimer=null;
    stopDeepgram();
    MicMeter.detach();
    if(this.pc){try{this.pc.close()}catch(_){}this.pc=null}
    if(this.stream){this.stream.getTracks().forEach(function(t){try{t.stop()}catch(_){}});this.stream=null}
    this.remoteStream=null;this.savedOffer=null;this.savedCandidates=[];this.pendingCandidates=[];this.seenCand=new Set();
    $('call-band').classList.remove('on');
    $('scr-room').classList.remove('st-phone','st-video');
    $('rz-timer').textContent='';
    $('rb-mic').classList.add('off');$('rb-cam').classList.add('off');
    $('remote-video').srcObject=null;$('local-video').srcObject=null;
    if(this.pip)this.exitPip();
    $('scr-room').classList.remove('pip');
    if(this._chatMicWasOn)CHATMIC.start();else CHATMIC.stop(true); // strip returns to exact pre-call mic state
    this._chatMicWasOn=false;
    if(PB.pk&&PB.isDirty())pbWriteBack(); // PB write-back on call end (plan rule)
    log('call_end',{},'ok');
  }
