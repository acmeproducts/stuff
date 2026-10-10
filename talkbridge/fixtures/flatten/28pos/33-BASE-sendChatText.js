async function sendChatText(text,attachment,originOverride){
  var room=activeRoom();if(!room)return;
  var src=room.myLang,tgt=room.theirLang,srcText=text,failed=false;
  if(text){
    var detected=detectLang(text);
    if(detected&&detected!==src){
      var normed=await translateWithRetry(text,detected,src,2);
      if(normed.ok&&norm(normed.text).toLowerCase()!==norm(text).toLowerCase())srcText=norm(normed.text);
      else src=detected;
    }
    var tgtText=srcText;
    if(src!==tgt){
      var tr=await translateWithRetry(srcText,src,tgt,1);
      if(tr.ok)tgtText=norm(tr.text);else failed=true;
    }
  }else{var tgtText=''}
  var entry={
    id:'cm-'+uid(),kind:'chat',who:'me',
    sourceText:srcText,translatedText:tgtText,srcLang:src,tgtLang:tgt,
    ts:Date.now(),senderName:room.myName||S.user.name,origin:originOverride||'typed',
    receipt:'sent',translationFailed:failed,attachment:attachment||null
  };
  transcript.push(entry);saveTr();
  room.lastAt=Date.now();saveRooms();renderPanel();
  appendMsgDom(entry);
  if(relaySend(chatPayload(entry)))log('chat_sent',{t:srcText.slice(0,40)},'ok');
  else log('chat_queued',{t:srcText.slice(0,40)},'warn');
}
