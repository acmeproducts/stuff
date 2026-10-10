function osNotify(title,body,roomId){
  try{
    if(!window.Notification||Notification.permission!=='granted')return;
    if(!document.hidden&&S.view==='room'&&S.roomId===roomId)return;
    var n=new Notification(title,{body:(body||'').slice(0,120),tag:'tb-'+roomId,renotify:true});
    n.onclick=function(){try{window.focus()}catch(_){}closePanel();enterRoom(roomId);n.close()};
  }catch(_){}
}
