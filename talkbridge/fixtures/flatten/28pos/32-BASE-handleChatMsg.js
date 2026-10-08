function handleChatMsg(d,room){
  if(!d)return;
  if(d.chatId){
    if(_chatReceived.has(d.chatId)||transcript.some(function(x){return x.id===d.chatId})){relaySend({type:'chat-ack',chatId:d.chatId,transient:true});return}
    _chatReceived.add(d.chatId);
    relaySend({type:'chat-ack',chatId:d.chatId,transient:true});
  }
  if(d.senderName&&d.senderName!==room.partnerName){room.partnerName=d.senderName;saveRooms();renderRoomHead();renderPanel()}
  var entry={
    id:d.chatId||('ci-'+uid()),kind:'chat',who:'partner',
    sourceText:norm(d.srcText||''),translatedText:norm(d.tgtText||d.srcText||''),
    srcLang:d.srcLang||room.theirLang,tgtLang:d.tgtLang||room.myLang,
    ts:d.ts||Date.now(),senderName:d.senderName||room.partnerName||'Partner',
    origin:d.origin||'typed',attachment:d.attachment||null
  };
  transcript.push(entry);saveTr();
  room.lastAt=Date.now();saveRooms();
  appendMsgDom(entry);
  if(document.hidden){room.unread=(room.unread||0)+1;saveRooms();renderPanel();if(!room.muted)osNotify((entry.senderName||'New message'),entry.translatedText||entry.sourceText||'',room.id)}
  else sendReadReceipts();
  if(room.autoRead&&entry.translatedText)speakText(entry.translatedText,entry.tgtLang);
  log('chat_rx',{t:(d.srcText||'').slice(0,40)},'ok');
}
