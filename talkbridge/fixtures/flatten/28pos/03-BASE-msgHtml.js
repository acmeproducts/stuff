function msgHtml(e){
  var room=activeRoom();
  if(e.kind==='sys')return'<div class="pill" data-id="'+esc(e.id)+'"><span>'+esc(e.text)+' <i class="pill-ts">&middot; '+esc(fmtDate(e.ts))+' '+esc(fmtTime(e.ts))+'</i></span></div>';
  var mine=e.who==='me';
  var leftText,rightText,leftLang,rightLang;
  if(mine){leftText=e.sourceText;rightText=e.translatedText;leftLang=e.srcLang;rightLang=e.tgtLang}
  else{leftText=e.translatedText;rightText=e.sourceText;leftLang=e.tgtLang;rightLang=e.srcLang}
  var who=mine?(e.senderName||room.myName||S.user.name):(e.senderName||room.partnerName||'?');
  var origin=e.origin==='spoken'?'<span class="origin-mark"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg></span>':e.origin==='phrase'?'<span class="origin-mark"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>':'';
  var acts='<span class="tr-head-acts head-acts">'
    +'<button class="tr-act-btn" data-hact="save" title="Save to phrasebook"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>'
    +'<button class="tr-act-btn" data-hact="del" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>'
    +'<button class="tr-act-btn" data-hact="clar" title="Clarify"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></button>'
    +'</span>';
  var head='<div class="tr-head meta"><span class="tr-who who'+(mine?' mine':'')+'">'+origin+esc(who)+'</span>'+acts
    +'<span class="tr-time">'+fmtTime(e.ts)+receiptHtml(e)+'</span></div>';
  var TT='<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  var body='<div class="tr-body cols">'
    +'<div class="tr-col col tr-col-tap" data-side="left" data-lang="'+esc(leftLang)+'">'
      +'<div class="tr-col-row"><div class="tr-text">'+esc(leftText)+attHtml(e)+'</div>'
      +'<button class="tr-tts" data-ctts tabindex="-1">'+TT+'</button></div></div>'
    +'<div class="tr-divider divider"></div>'
    +'<div class="tr-col col source second tr-col-tap" data-side="right" data-lang="'+esc(rightLang)+'">'
      +'<div class="tr-col-row"><div class="tr-text">'+esc(rightText)+'</div>'
      +'<button class="tr-tts" data-ctts tabindex="-1">'+TT+'</button></div></div>'
    +'</div>';
  var fail=e.translationFailed?'<div class="fail-badge">⚠ not translated</div>':'';
  var inner;
  if(room.meta==='off')inner=body+fail;
  else if(room.meta==='bottom')inner=body+fail+head.replace('tr-head meta','tr-head meta bottom-head');
  else inner=head+body+fail;
  return'<div class="msg'+(mine?' mine':'')+'" data-id="'+esc(e.id)+'"><div class="tr-bubble'+(e.kind==='chat'?' is-chat':'')+'">'+inner+'</div></div>';
}
