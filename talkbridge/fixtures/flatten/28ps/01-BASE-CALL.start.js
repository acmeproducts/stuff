  start:async function(kind){
    var room=activeRoom();if(!room||this.active||this._starting)return;
    this._starting=true;
    ensureNotifPerm();
    var ok=await this.acquire(kind);
    this._starting=false;
    if(!ok)return;
    if(this.active)return;
    this.kind=kind;this.caller=true;this.active=true;this.accepted=false;
    this.mount(room);
    relaySend({type:'call-start',kind:kind,name:room.myName||S.user.name});
    relaySend({type:'mic-state',micOn:this.micOn,transient:true});
    $('rz-timer').textContent='Connecting…';
    var self=this;
    this.callerTimer=setTimeout(function(){
      if(self.active&&!self.pc){addSysPill('Missed '+(self.kind==='video'?'video':'voice')+' call');relaySend({type:'call-end',reason:'missed'});self.teardown()}
    },30000);
    log('call_start',{kind:kind},'ok');
  },
