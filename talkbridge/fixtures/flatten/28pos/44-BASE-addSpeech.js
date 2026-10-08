function addSpeech(who,srcT,trT,sL,tL,ss,failed){
  var room=activeRoom();if(!room)return;
  var id='sp-'+(who==='me'?'m':'p')+'-'+ss;
  var ex=transcript.find(function(e){return e.id===id});
  if(ex){ex.sourceText=srcT;ex.translatedText=trT;saveTr();replaceMsgDom(ex);return}
  var entry={id:id,kind:'speech',who:who,origin:'spoken',sourceText:srcT,translatedText:trT,srcLang:sL,tgtLang:tL,subtitleSeq:ss,ts:Date.now(),
    senderName:who==='me'?(room.myName||S.user.name):(room.partnerName||'Partner'),translationFailed:!!failed};
  transcript.push(entry);saveTr();
  room.lastAt=Date.now();saveRooms();
  appendMsgDom(entry);
}
