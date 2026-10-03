  accept:async function(){
    var p=this.ringPending;if(!p)return;
    this.stopRing();this.ringPending=null;
    ensureNotifPerm();
    if(S.roomId!==p.roomId){closePanel();enterRoom(p.roomId)}
    var room=activeRoom();if(!room||this._starting)return;
    this._starting=true;
    var ok=await this.acquire(p.kind);
    this._starting=false;
    if(!ok||this.active)return;
    this.kind=p.kind;this.caller=false;this.active=true;
    this.mount(room);
    relaySendWhenOpen({type:'call-accept'});
    relaySendWhenOpen({type:'mic-state',micOn:this.micOn,transient:true});
    if(room.role==='creator')this.setupPC();
    log('call_accept',{},'ok');
  },
