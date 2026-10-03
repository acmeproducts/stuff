  onSignal:async function(d){
    if(!d.signal)return;
    var self=this,room=activeRoom();if(!room)return;
    if(!this.active&&this._starting){setTimeout(function(){self.onSignal(d)},250);return} // heal must not race accept
    try{
      if(d.signal.description){
        var desc=d.signal.description;
        if(desc.type==='offer'){
          if(!this.active){ // call joined in progress (entry heal): mount on offer
            if(this.endedAt&&Date.now()-this.endedAt<5000){log('rtc_offer_ignored_postend',{},'warn');return} // no phantom calls from late offers
            if(!(await this.acquire('voice')))return;
            this.active=true;this.caller=false;this.mount(room);
          }
          if(this.pc&&this.pc.connectionState==='connected'){log('rtc_offer_skip',{});return}
          if(this.pc&&this.pc.connectionState!=='closed'){try{this.pc.close()}catch(_){}this.pc=null;this.pendingCandidates=[];this.seenCand=new Set()}
          this.remoteStream=null;$('remote-video').srcObject=null;
          await this.setupPC();
          await this.pc.setRemoteDescription(desc);
          await this.flushCands();
          await this.pc.setLocalDescription(await this.pc.createAnswer());
          relaySend({type:'webrtc-signal',transient:true,signal:{description:this.pc.localDescription}});
          log('rtc_answered',{},'ok');
        }else if(desc.type==='answer'){
          if(!this.pc)return;
          await this.pc.setRemoteDescription(desc);
          await this.flushCands();
          this.savedOffer=null;
          log('rtc_got_answer',{},'ok');
        }
      }else if(d.signal.candidate){
        var c=d.signal.candidate||{};
        var key=[c.sdpMid||'',c.sdpMLineIndex==null?'':c.sdpMLineIndex,String(c.candidate||'')].join('|');
        if(this.seenCand.has(key))return;this.seenCand.add(key);
        if(!this.pc||!this.pc.remoteDescription)this.pendingCandidates.push(c);
        else try{await this.pc.addIceCandidate(c)}catch(e){log('rtc_ice_err',{e:String(e)},'error')}
      }
    }catch(e){log('rtc_sig_err',{e:String(e)},'error')}
  },
