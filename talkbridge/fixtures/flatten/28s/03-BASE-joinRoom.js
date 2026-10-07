function joinRoom(p){
  var name=S.user.name||norm($('s10-name').value).slice(0,40);
  if(!name){$('s10-err').style.display='block';return}
  $('s10-err').style.display='none';
  if(!S.user.name){S.user.name=name;saveUser()}
  // keys ride in memory only — never localStorage on the joiner device
  S.joinerKeys={k:p.k||'',tid:p.tid||'',tok:p.tok||''};
  var room=roomById(p.r);
  if(!room){
    room={id:p.r,role:'joiner',title:p.n||'',partnerName:p.n||'',myLang:p.tl,theirLang:p.ml,myName:name,
      autoRead:false,muted:false,goBtn:true,meta:'top',createdAt:Date.now(),lastAt:Date.now(),joined:true,unread:0};
    S.rooms.push(room);saveRooms();
  }
  enterRoom(room.id);
}
