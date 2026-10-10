function bgAddPill(roomId,text){
  if(S.roomId===roomId){addSysPill(text);return}
  var tr=loadTr(roomId);tr.push({id:'sp-'+uid(),kind:'sys',text:text,ts:Date.now()});lsSet(trKey(roomId),tr);
}
