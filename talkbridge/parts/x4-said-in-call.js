/* ═══════════ GAP PART · X4-said-in-call.js ═══════════ */
/* @contract
   replaces: onDGFinalCore, onRemoteSubtitle
   wraps: (none)
   adds: (none) · fields said, saidLang on subtitle and subtitle-update (declared wire change)
*/
/* ─────────────────────────────────────────────────────────────────────────────
   X-4 · THE RECEIVER'S COPY OF WHAT WAS SAID IN A CALL (28·pre-ship c4's known limit)

   The chat path carries what was heard before normalization (X-3: said,
   saidLang on chat-msg) so the receiver's check card can show it. In a call
   the line travels as subtitle / subtitle-update, built in the frozen base, so
   the said stayed on the speaker's phone. Now the two subtitle messages carry
   the own entry's said and saidLang when it has them, and the receiver holds
   them for the entry about to be born exactly as the chat path does
   (x3PendingIn → appendMsgDom attaches, logs said_kept {who: 'partner'}).
   onDGFinalCore (FL-5) and onRemoteSubtitle (base), verbatim, plus the carry.
   No new message type; two fields on two existing ones.
   ───────────────────────────────────────────────────────────────────────────── */
async function onDGFinalCore(text){
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
    var saidE=transcript.find(function(e){return e.id==='sp-m-'+ss});var saidF=(saidE&&saidE.said)?{said:saidE.said,saidLang:saidE.saidLang||''}:{};   /* X-4: what was said rides with the line */
    relaySend(Object.assign({type:'subtitle',subtitleSeq:ss,text:srcText,sourceText:srcText,sourceLang:src,targetLang:tgt,provisional:true},saidF));
    var tr=await translateWithRetry(srcText,src,tgt,2);
    var trText=tr.ok?norm(tr.text):srcText,failed=(!tr.ok&&src!==tgt);
    relaySend(Object.assign({type:'subtitle-update',subtitleSeq:ss,text:trText,sourceText:srcText,sourceLang:src,targetLang:tgt},saidF));
    patchSpeech('me',ss,trText,failed);
  }catch(e){
    log('dg_final_translate_err',{e:String(e)},'error'); // bubble already landed above even though translation failed
  }
}

function onRemoteSubtitle(d,room){
  if(room.id!==S.roomId)return;
  var t=norm(d.text||''),s0=norm(d.sourceText||'')||t;
  if(t&&d.targetLang===room.myLang)showSub(t,'partner');
  try { x3PendingIn = (d && typeof d.said === 'string' && norm(d.said) && s0) ? { said: norm(d.said), saidLang: String(d.saidLang || ''), normalized: s0, at: Date.now() } : null; } catch (_) { x3PendingIn = null; }   /* X-4: held for the entry about to be born, as the chat path holds it */
  addSpeech('partner',s0,t,d.sourceLang,d.targetLang,d.subtitleSeq,false);
}
