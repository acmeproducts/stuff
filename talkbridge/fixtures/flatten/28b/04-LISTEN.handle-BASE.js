  handle:function(roomId,d){
    if(!d||d.from===deviceId)return;
    var room=roomById(roomId);if(!room)return;
    if(d.type==='ping'){this.send(roomId,{type:'pong',transient:true});return}
    if(d.type==='hello'){
      if(d.name&&d.name!==room.partnerName){room.partnerName=d.name;saveRooms();renderPanel()}
      if(!room.joined){room.joined=true;saveRooms()}
      this.send(roomId,{type:'hello-ack',transient:true,name:room.myName||S.user.name});
      return;
    }
    if(d.type==='chat-msg'){
      if(!d.chatId)return;
      var tr=loadTr(roomId);
      if(_chatReceived.has(d.chatId)||tr.some(function(x){return x.id===d.chatId})){this.send(roomId,{type:'chat-ack',chatId:d.chatId,transient:true});return}
      _chatReceived.add(d.chatId);
      this.send(roomId,{type:'chat-ack',chatId:d.chatId,transient:true});
      if(d.senderName&&d.senderName!==room.partnerName){room.partnerName=d.senderName}
      tr.push({id:d.chatId,kind:'chat',who:'partner',sourceText:norm(d.srcText||''),translatedText:norm(d.tgtText||d.srcText||''),
        srcLang:d.srcLang||room.theirLang,tgtLang:d.tgtLang||room.myLang,ts:d.ts||Date.now(),
        senderName:d.senderName||room.partnerName||'Partner',origin:d.origin||'typed',attachment:d.attachment||null});
      lsSet(trKey(roomId),tr);
      room.unread=(room.unread||0)+1;room.lastAt=Date.now();saveRooms();renderPanel();
      if(!room.muted)osNotify((d.senderName||room.partnerName||'New message')+' · TalkBridge',norm(d.tgtText||d.srcText||''),roomId);
      log('bg_chat_rx',{room:roomId},'ok');
      return;
    }
    if(d.type==='sys-pill'){
      if(d.newName){room.partnerName=d.newName;saveRooms();renderPanel()}
      var tr2=loadTr(roomId);
      if(d.pillId&&tr2.some(function(x){return x.id===d.pillId}))return;
      tr2.push({id:d.pillId||('sp-'+uid()),kind:'sys',text:d.text||'',ts:Date.now()});
      lsSet(trKey(roomId),tr2);return;
    }
    if(d.type==='call-start'){CALL.onIncoming(room,d);return}
    if(d.type==='call-end'){
      if(CALL.ringPending&&CALL.ringPending.roomId===roomId){var mk=CALL.ringPending.kind==='video'?'video':'voice';CALL.stopRing();CALL.ringPending=null;bgAddPill(roomId,'Missed '+mk+' call');room.unread=(room.unread||0)+1;saveRooms();renderPanel();if(!room.muted)osNotify((d.name||room.partnerName||'TalkBridge'),'Missed '+mk+' call',roomId)}
      return;
    }
  }
