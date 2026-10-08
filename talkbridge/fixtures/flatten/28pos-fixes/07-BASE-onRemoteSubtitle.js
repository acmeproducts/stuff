function onRemoteSubtitle(d,room){
  if(room.id!==S.roomId)return;
  var t=norm(d.text||''),s0=norm(d.sourceText||'')||t;
  if(t&&d.targetLang===room.myLang)showSub(t,'partner');
  addSpeech('partner',s0,t,d.sourceLang,d.targetLang,d.subtitleSeq,false);
}
