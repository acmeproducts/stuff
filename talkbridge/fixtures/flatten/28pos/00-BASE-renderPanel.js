function renderPanel(){
  var body=$('panel-body');if(!body)return;
  var live=S.rooms.filter(function(r){return !r.deletedAt}).sort(function(a,b){return(b.lastAt||b.createdAt)-(a.lastAt||a.createdAt)});
  var bin=S.rooms.filter(function(r){return r.deletedAt});
  var h='';
  live.forEach(function(r){
    var badge='';
    if(r.muted)badge='<span class="rc-bell"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.6 13V9A6.5 6.5 0 0 0 8 5.3M6.3 6.3C5.7 7.1 5.4 8 5.4 9v4l-2 3v1h14"/><path d="M10 21a2 2 0 0 0 4 0"/><line x1="2" y1="2" x2="22" y2="22"/></svg></span>';
    else if(r.unread)badge='<span class="rc-badge">'+r.unread+'</span>';
    h+='<div class="room-card" data-room="'+r.id+'">'
      +'<div class="rc-info"><div class="rc-title">'+esc(roomTitle(r))+'</div>'
      +'<div class="rc-sub">'+esc(r.myName||S.user.name||'Me')+' ↔ '+esc(r.partnerName||'?')+' · '+r.myLang.toUpperCase()+' ↔ '+r.theirLang.toUpperCase()+' · '+fmtAgo(r.lastAt||r.createdAt)+'</div></div>'
      +badge
      +'<button class="rc-x" data-del="'+r.id+'" aria-label="Delete"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'
      +'</div>';
  });
  if(bin.length){
    h+='<div class="bin-sec'+(renderPanel._binOpen?' open':'')+'" id="bin-sec"><div class="bin-head" id="bin-head">'
      +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
      +'Recycle bin ('+bin.length+')</div><div class="bin-body">';
    bin.forEach(function(r){
      h+='<div class="bin-row"><span class="rc-title">'+esc(roomTitle(r))+'</span>'
        +'<button class="bin-act" data-restore="'+r.id+'">Restore</button>'
        +'<button class="bin-act danger" data-harddel="'+r.id+'">Delete Forever</button></div>';
    });
    h+='</div></div>';
  }
  body.innerHTML=h||'<div style="text-align:center;color:var(--ink-dim);font-size:13.5px;padding:30px 10px">No conversations yet</div>';
  body.querySelectorAll('.room-card').forEach(function(el){
    el.addEventListener('click',function(ev){
      if(ev.target.closest('.rc-x'))return;
      closePanel();enterRoom(el.dataset.room);
    });
  });
  body.querySelectorAll('[data-del]').forEach(function(el){
    el.addEventListener('click',function(){var r=roomById(el.dataset.del);if(r){r.deletedAt=Date.now();saveRooms();renderPanel()}});
  });
  body.querySelectorAll('[data-restore]').forEach(function(el){
    el.addEventListener('click',function(){var r=roomById(el.dataset.restore);if(r){delete r.deletedAt;saveRooms();renderPanel()}});
  });
  body.querySelectorAll('[data-harddel]').forEach(function(el){
    el.addEventListener('click',function(){
      var id=el.dataset.harddel;
      S.rooms=S.rooms.filter(function(r){return r.id!==id});saveRooms();
      try{localStorage.removeItem(trKey(id))}catch(_){}
      renderPanel();
    });
  });
  var bh=$('bin-head');if(bh)bh.addEventListener('click',function(){renderPanel._binOpen=!renderPanel._binOpen;$('bin-sec').classList.toggle('open')});
}
