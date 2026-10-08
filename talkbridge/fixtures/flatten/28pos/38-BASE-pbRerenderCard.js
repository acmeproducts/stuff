function pbRerenderCard(id){
  var c=pbCardById(id);var el=document.getElementById('pbb-'+id);
  if(!c||!el)return;
  var w2=document.createElement('div');w2.innerHTML=pbBubbleHtml(c);
  el.replaceWith(w2.firstChild);
  var r=window._pbRefocus;
  if(r&&r.id===id&&Date.now()-r.at<5000){ // Enter commits keep the keyboard put (S8)
    var f=document.querySelector('[data-pbedit="'+r.field+'"][data-cid="'+id+'"]');
    if(f){f.focus();try{var rg=document.createRange();rg.selectNodeContents(f);rg.collapse(false);var sl=window.getSelection();sl.removeAllRanges();sl.addRange(rg)}catch(_){}}
  }
}
