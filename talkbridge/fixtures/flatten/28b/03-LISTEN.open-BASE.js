  open:function(room){
    var self=this;
    var ws=new WebSocket(RELAY_WS+'?app='+encodeURIComponent(RELAY_APP)+'&session='+encodeURIComponent(room.id)+'&client='+encodeURIComponent(deviceId));
    this.socks[room.id]=ws;
    ws.onopen=function(){self.send(room.id,{type:'hello',lang:room.myLang,targetLang:room.theirLang,role:room.role,name:room.myName||S.user.name});log('listen_open',{room:room.id})};
    ws.onmessage=function(e){try{self.handle(room.id,JSON.parse(e.data))}catch(_){}};
    ws.onclose=function(){
      if(self.socks[room.id]===ws){
        delete self.socks[room.id];
        setTimeout(function(){if(!self.socks[room.id]&&room.id!==S.roomId&&roomById(room.id)&&!roomById(room.id).deletedAt)self.open(roomById(room.id))},15000);
      }
    };
    ws.onerror=function(){};
  },
