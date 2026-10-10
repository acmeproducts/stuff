function appendMsgDom(e,batch){
  var t=$('transcript');if(!t||S.view!=='room')return;
  var frag=document.createDocumentFragment();
  datePillIfNeeded(e,frag);
  var w=document.createElement('div');w.innerHTML=msgHtml(e);
  var node=w.firstChild;
  frag.appendChild(node);
  t.appendChild(frag);
  wireMsg(node,e);
  if(!batch){
    var nearBottom=t.scrollHeight-t.scrollTop-t.clientHeight<180;
    if(nearBottom||e.who==='me')requestAnimationFrame(function(){t.scrollTop=t.scrollHeight});
    else $('scroll-down').classList.add('show');
  }
}
