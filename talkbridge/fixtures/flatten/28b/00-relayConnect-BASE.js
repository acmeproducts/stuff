function relayConnect(){
  var room=activeRoom();if(!room)return;
  if(_relayWs)try{_relayWs.close()}catch(_){}
  var ws=new WebSocket(RELAY_WS+'?app='+encodeURIComponent(RELAY_APP)+'&session='+encodeURIComponent(room.id)+'&client='+encodeURIComponent(deviceId));
  _relayWs=ws;
  ws.onopen=function(){
    if(ws!==_relayWs)return;
    log('relay_open',{room:room.id},'ok');
    relaySend({type:'hello',lang:room.myLang,targetLang:room.theirLang,role:room.role,name:room.myName||S.user.name});
    startHB();
    resendUndelivered();
    _relayReconnecting=false;renderPartnerState();
  };
  ws.onmessage=function(e){try{handleRelay(JSON.parse(e.data))}catch(_){}};
  ws.onclose=function(ev){
    if(ws!==_relayWs)return;
    log('relay_close',{code:ev.code},'warn');stopHB();clearTimeout(wsReconnectTimer);
    if(S.view==='room'&&S.roomId){
      _relayReconnecting=true;renderPartnerState();
      wsReconnectTimer=setTimeout(function(){wsReconnectTimer=null;if(S.view==='room')relayConnect()},2000);
    }
  };
  ws.onerror=function(){log('relay_err',{},'error')};
}
