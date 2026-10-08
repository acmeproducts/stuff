function wireMsg(node,e){
  if(e.kind==='sys')return;
  var meta=node.querySelector('.meta');
  if(meta){
    meta.addEventListener('click',function(ev){
      if(ev.target.closest('[data-hact]')||ev.target.closest('[data-receipt]'))return;
      var was=node.classList.contains('active');
      document.querySelectorAll('.msg.active').forEach(function(m){m.classList.remove('active')});
      if(!was)node.classList.add('active');
    });
    var hs=meta.querySelector('[data-hact=save]');
    if(hs)hs.addEventListener('click',function(ev){ev.stopPropagation();pbAddCard({source:e.who==='me'?e.sourceText:e.translatedText,target:e.who==='me'?e.translatedText:e.sourceText,sourceLang:e.who==='me'?e.srcLang:e.tgtLang,targetLang:e.who==='me'?e.tgtLang:e.srcLang})});
    var hc=meta.querySelector('[data-hact=clar]');
    if(hc)hc.addEventListener('click',function(ev){ev.stopPropagation();openClarify(e)});
    var hd=meta.querySelector('[data-hact=del]');
    if(hd)hd.addEventListener('click',function(ev){
      ev.stopPropagation();
      if(!confirm('Delete this message?'))return;
      transcript=transcript.filter(function(x2){return x2.id!==e.id});saveTr();renderTranscript();
    });
  }
  node.querySelectorAll('.col').forEach(function(col){
    var txt=col.dataset.side==='left'?(e.who==='me'?e.sourceText:e.translatedText):(e.who==='me'?e.translatedText:e.sourceText);
    col.addEventListener('click',function(ev){
      if(ev.target.closest('[data-att]'))return;
      if(ev.target.closest('[data-ctts]')){ev.stopPropagation();speakText(txt,col.dataset.lang);return}
      useInCompose(txt,null);
    });
    longPress(col,function(x,y){openCtxMenu(e,x,y)});
  });
  var att=node.querySelector('[data-att]');
  if(att)att.addEventListener('click',function(ev){ev.stopPropagation();openAttViewer(e)});
  var rc=node.querySelector('[data-receipt]');
  if(rc)rc.addEventListener('click',function(ev){
    ev.stopPropagation();
    var pop=$('status-pop');
    var label=e.receipt==='read'?'Read':e.receipt==='delivered'?'Delivered':'Sent';
    var ts2=e.receipt==='read'?(e.readAt||e.ts):e.receipt==='delivered'?(e.deliveredAt||e.ts):e.ts;
    pop.textContent=label+' · '+fmtDate(ts2)+' '+fmtTime(ts2);
    var r2=rc.getBoundingClientRect(),ar=$('app').getBoundingClientRect();
    pop.style.left=Math.max(8,r2.left-ar.left-30)+'px';pop.style.top=(r2.top-ar.top-30)+'px';pop.style.display='block';
    clearTimeout(wireMsg._pt);wireMsg._pt=setTimeout(function(){pop.style.display='none'},1500);
  });
}
