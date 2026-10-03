  hangUp:function(send){
    if(!this.active)return;
    if(send)relaySend({type:'call-end'});
    this.endPill();this.teardown();
  },
