function relaySend(m){
  if(!_relayWs||_relayWs.readyState!==1)return false;
  m.session=S.roomId;m.from=deviceId;m.ts=m.ts||Date.now();m.seq=++seq;
  try{_relayWs.send(JSON.stringify(m));return true}catch(_){return false}
}
