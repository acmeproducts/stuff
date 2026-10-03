  toggleCam:function(){
    if(!this.active||this.kind!=='video')return;
    this.camOn=!this.camOn;
    (this.stream?this.stream.getVideoTracks():[]).forEach(function(t){t.enabled=CALL.camOn});
    $('rb-cam').classList.toggle('off',!this.camOn);
    $('local-video').style.display=this.camOn?'':'none';
    relaySend({type:'cam-state',camOn:this.camOn,transient:true});
  },
