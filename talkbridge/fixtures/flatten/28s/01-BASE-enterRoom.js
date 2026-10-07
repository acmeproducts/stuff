function enterRoom(id){
  var room=roomById(id);if(!room)return;
  if(S.roomId===id&&S.view==='room'){closePanel();return}
  if(S.roomId&&S.roomId!==id)leaveRoomInternals();
  S.roomId=id;
  transcript=loadTr(id);
  room.unread=0;saveRooms();
  showScreen('room');
  $('room-menu-btn').style.display=S.roomLocked?'none':'';
  renderRoomHead();renderDrawerValues();renderTranscript();renderInviteCard();syncGoBtn();applyBubbleTheme();
  $('rb-mic').classList.toggle('off',!CHATMIC.on); // defensive: mic icon must always reflect real state on entry
  relayConnect();
  ensureNotifPerm();
  LISTEN.sync();
  PB.load(bookDir(room));
  var flush=PB.isDirty()?pbWriteBack():Promise.resolve();
  flush.then(function(){return pbPull()}).then(function(r){
    if(!r)return;
    if(r.status==='no-pair-file')toast('No shared phrasebook yet');
    else if(r.status==='no-pat')toast('Phrasebook: add GitHub PAT in Calling & sync keys');
    else if(r.status==='auth')toast('Phrasebook: GitHub rejected the PAT — check it in Calling & sync keys',5200);
    else if(r.status==='error')toast(location.protocol==='file:'?'Phrasebook can\'t sync from file:// — use the deployed URL':'Phrasebook sync failed: '+(r.detail||''));
    else if(r.status==='ok'&&!r.unchanged)toast('Phrasebook loaded · '+r.n+' phrases (v'+r.version+')');
  });
  log('room_enter',{id:id,role:room.role},'ok');
}
