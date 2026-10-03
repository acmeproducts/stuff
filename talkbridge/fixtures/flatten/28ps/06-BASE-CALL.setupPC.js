  setupPC:async function(){
    if(this.pc)return;
    var room=activeRoom();if(!room)return;
    var iceServers=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
    var k=this.keys();
    if(k.tid&&k.tok){
      try{
        var r=await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/'+k.tid+'/credentials/generate',{method:'POST',headers:{'Authorization':'Bearer '+k.tok,'Content-Type':'application/json'},body:JSON.stringify({ttl:86400})});
        if(r.ok){var d=await r.json();if(d.iceServers)iceServers=Array.isArray(d.iceServers)?d.iceServers:[d.iceServers];log('turn_ok',{n:iceServers.length},'ok')}
        else log('turn_err',{s:r.status},'warn');
      }catch(e){log('turn_fetch_err',{e:String(e)},'warn')}
    }
    var pc=this.pc=new RTCPeerConnection({iceServers:iceServers});
    var self=this;
    if(room.role==='creator'){
      pc.onnegotiationneeded=async function(){
        try{
          self.savedCandidates=[];
          await pc.setLocalDescription(await pc.createOffer());
          var offer={type:'webrtc-signal',transient:true,signal:{description:pc.localDescription}};
          relaySend(offer);self.savedOffer=offer;log('rtc_offer',{},'ok');
        }catch(e){log('rtc_offer_err',{e:String(e)},'error')}
      };
    }else{pc.onnegotiationneeded=function(){}}
    (this.stream?this.stream.getTracks():[]).forEach(function(t){pc.addTrack(t,self.stream)});
    pc.onicecandidate=function(e){
      if(e.candidate){
        if(String(e.candidate.candidate||'').indexOf('.local')!==-1)return;
        var cm={type:'webrtc-signal',transient:true,signal:{candidate:e.candidate}};
        self.savedCandidates.push(cm);relaySend(cm);
      }
    };
    pc.onconnectionstatechange=function(){
      var s2=pc.connectionState;
      log('rtc_conn',{s:s2},s2==='connected'?'ok':'info');
      if(s2==='connected'){
        self.connBad=false;startDeepgram();
        var lv=$('local-video'); // preview freeze fix: rebind + play retry on connect
        if(lv&&self.stream&&lv.srcObject!==self.stream)lv.srcObject=self.stream;
        try{if(lv)lv.play()}catch(_){}
        try{$('remote-video').play()}catch(_){}
      }
      if(s2==='disconnected'){self.connBad=true}
      if(s2==='failed'&&self.active){
        self.connBad=true;
        try{pc.close()}catch(_){}
        self.pc=null;self.savedOffer=null;self.seenCand=new Set();self.pendingCandidates=[];
        if(room.role==='creator')setTimeout(function(){if(self.active)self.setupPC()},1500);
      }
    };
    pc.ontrack=function(e){
      if(!self.remoteStream)self.remoteStream=new MediaStream();
      var add=function(track){if(!self.remoteStream.getTracks().some(function(x){return x.id===track.id}))self.remoteStream.addTrack(track)};
      if(e.streams&&e.streams[0])e.streams[0].getTracks().forEach(add);else if(e.track)add(e.track);
      $('remote-video').srcObject=self.remoteStream;
      if(self.remoteStream.getVideoTracks().length)$('remote-ph').style.display='none';
      log('rtc_track',{kind:e.track&&e.track.kind},'ok');
    };
  },
