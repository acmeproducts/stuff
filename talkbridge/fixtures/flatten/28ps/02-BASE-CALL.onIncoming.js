  onIncoming:function(room,d){
    if(this.active||this.ringPending)return;
    if(room.muted)return;
    this.ringPending={roomId:room.id,kind:d.kind||'voice',name:d.name||room.partnerName||'Partner'};
    var L2=(I18N[room.myLang]||I18N.en);
    $('ring-name').textContent=this.ringPending.name;
    $('ring-sub').textContent=(d.kind==='video'?'Video call':'Voice call')+' · TalkBridge';
    $('ring-overlay').classList.add('show');
    RING.start();
    osNotify(this.ringPending.name+' · TalkBridge','Incoming call…',room.id);
    var self=this;
    this.ringTimer=setTimeout(function(){self.stopRing();bgAddPill(self.ringPending?self.ringPending.roomId:room.id,'Missed '+((self.ringPending&&self.ringPending.kind==='video')?'video':'voice')+' call');self.ringPending=null;renderIfActive(room.id)},30000);
    log('call_ring',{room:room.id},'ok');
  },
