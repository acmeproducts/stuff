  mount:function(room){
    this.startTs=Date.now();
    dgFailCount=0;dgHideFailBanner();
    this._chatMicWasOn=CHATMIC.on; // pre-call mic state, restored exactly on hangup
    stopDeepgram(); // unconditional: any live pipeline (chat-mic or otherwise) must die before rebinding to the call stream
    if(CHATMIC.on)CHATMIC.stop(true);
    var rv=$('remote-video');if(rv)rv.muted=(room.ear===false); // Ear: hear partner's raw voice, default on
    $('scr-room').classList.remove('st-phone','st-video');
    $('scr-room').classList.add(this.kind==='video'?'st-video':'st-phone');
    $('rb-mic').classList.remove('off');
    if(this.kind==='video'){
      $('call-band').classList.add('on');
      $('local-video').srcObject=this.stream;
      $('local-video').style.display=this.camOn?'':'none';
      $('rb-cam').classList.toggle('off',!this.camOn);
      $('remote-ph').style.display='';
      if(!this.pushed){try{history.pushState({tbCall:1},'',location.href)}catch(_){}this.pushed=true}
    }
    var self=this;
    this.connBad=false;
    this.durTimer=setInterval(function(){
      if(!self.active)return;
      if(self.connBad){$('rz-timer').textContent='Reconnecting…';return}
      if(_remoteMicOn){$('rz-timer').textContent='Speaking…';return}
      var s=Math.floor((Date.now()-self.startTs)/1000);
      var lbl=Math.floor(s/60)+':'+('0'+s%60).slice(-2);
      $('rz-timer').textContent=lbl;
    },1000);
    MicMeter.attach(this.stream);
    startDeepgram();
  },
