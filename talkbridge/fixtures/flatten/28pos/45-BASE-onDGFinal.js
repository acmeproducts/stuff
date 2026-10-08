async function onDGFinal(text){
  text=norm(stripDGTags(text));if(!text)return;
  if(!text.replace(/[\s.,!?;:'"()\-]/g,''))return;
  if(/[฀-๿]/.test(text)){text=text.replace(/([ิ-ูเ-ไ]) ([฀-๿])/g,'$1$2').replace(/([฀-๿]) ([ะ-ู็-๎])/g,'$1$2')}
  if(isDupe(text)){log('dg_dedup',{t:text.slice(0,40)},'warn');return}
  recFinal(text);log('dg_final',{t:text.slice(0,60)},'ok');
  var room=activeRoom();if(!room||!(CALL.active||CHATMIC.on))return;
  if(!CALL.active){ // chat mic: spoken text is chat text, same bubble path as typed
    sendChatText(text,null,'voice');
    return;
  }
  // in-call: on-video caption overlay (baseline behavior, unchanged) AND fold into the persistent transcript.
  // bubble creation happens FIRST and unconditionally, before any translation call, so a translate/network
  // hiccup mid-call can never silently prevent the spoken line from landing in the transcript.
  var src=room.myLang,tgt=room.theirLang,ss=++localSubSeq;
  showSub(text,'mine');
  addSpeech('me',text,text,src,tgt,ss,false);
  var srcText=text;
  try{
    var detected=detectLang(text);
    if(detected&&detected!==src){ // normalization law: original never displayed
      var n=await translateWithRetry(text,detected,src,2);
      if(n.ok&&norm(n.text).toLowerCase()!==norm(text).toLowerCase()){srcText=norm(n.text);patchSpeech('me',ss,srcText,false)}
      else src=detected;
    }
    relaySend({type:'subtitle',subtitleSeq:ss,text:srcText,sourceText:srcText,sourceLang:src,targetLang:tgt,provisional:true});
    var tr=await translateWithRetry(srcText,src,tgt,2);
    var trText=tr.ok?norm(tr.text):srcText,failed=(!tr.ok&&src!==tgt);
    relaySend({type:'subtitle-update',subtitleSeq:ss,text:trText,sourceText:srcText,sourceLang:src,targetLang:tgt});
    patchSpeech('me',ss,trText,failed);
  }catch(e){
    log('dg_final_translate_err',{e:String(e)},'error'); // bubble already landed above even though translation failed
  }
}
