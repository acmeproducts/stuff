function renderRoomHead(){
  var r=activeRoom();if(!r)return;
  $('room-head-title').textContent=r.partnerName||'?';
  var wrap=$('room-head-title').parentNode;
  wrap.title=r.lastSeenAt?('Last seen '+fmtDate(r.lastSeenAt)+' '+fmtTime(r.lastSeenAt)):'Not seen yet';
}
