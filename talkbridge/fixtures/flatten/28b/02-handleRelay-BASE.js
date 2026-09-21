function handleRelay(d){
  if(!d||d.from===deviceId)return;
  var room=activeRoom();if(!room)return;
  touchPresence();
  if(d.type==='hello'){
    if(d.name&&d.name!==room.partnerName){room.partnerName=d.name;saveRooms();renderRoomHead();renderPanel()}
    if(!room.joined){room.joined=true;saveRooms();addSysPill((room.partnerName||'Partner')+' joined');renderInviteCard()}
    relaySend({type:'hello-ack',transient:true,name:room.myName||S.user.name});
    resendUndelivered();
    sendHistorySync(room);
    if(CALL.active&&room.role==='creator')CALL.resendOffer();
    return;
  }
  if(d.type==='hello-ack'){
    if(d.name&&d.name!==room.partnerName){room.partnerName=d.name;saveRooms();renderRoomHead();renderPanel()}
    if(!room.joined){room.joined=true;saveRooms();renderInviteCard()}
    sendHistorySync(room);
    return;
  }
  if(d.type==='ping'){relaySend({type:'pong',transient:true});return}
  if(d.type==='pong')return;
  if(d.type==='chat-ack'){
    var e=transcript.find(function(x){return x.id===d.chatId});
    if(e&&e.receipt==='sent'){e.receipt='delivered';e.deliveredAt=Date.now();saveTr();updateReceiptDom(e)}
    return;
  }
  if(d.type==='chat-read'){
    (d.ids||[]).forEach(function(id){
      var e2=transcript.find(function(x){return x.id===id});
      if(e2&&e2.receipt!=='read'){e2.receipt='read';e2.readAt=Date.now();updateReceiptDom(e2)}
    });
    saveTr();return;
  }
  if(d.type==='call-start'){CALL.onIncoming(room,d);return}
  if(d.type==='call-accept'){CALL.onAccepted(room,d);return}
  if(d.type==='call-decline'){CALL.onDeclined(room,d);return}
  if(d.type==='call-end'){CALL.onRemoteEnd(room,d);return}
  if(d.type==='webrtc-signal'){CALL.onSignal(d);return}
  if(d.type==='subtitle'){onRemoteSubtitle(d,room);return}
  if(d.type==='subtitle-update'){onRemoteSubtitleUpdate(d,room);return}
  if(d.type==='mic-state'){CALL.remoteMic(d.micOn!==false);return}
  if(d.type==='cam-state'){CALL.remoteCam(d.camOn!==false);return}
  if(d.type==='chat-msg'){handleChatMsg(d,room);return}
  if(d.type==='history-sync'){mergeHistorySyncChunk(d,room);return}
  if(d.type==='sys-pill'){
    if(d.pillId&&transcript.some(function(x){return x.id===d.pillId}))return;
    if(d.newName){room.partnerName=d.newName;saveRooms();renderRoomHead();renderPanel()}
    addSysPill(d.text||'',d.pillId);
    return;
  }
}
