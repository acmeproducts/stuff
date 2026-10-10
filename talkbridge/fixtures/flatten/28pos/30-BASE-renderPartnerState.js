function renderPartnerState(){
  if(!CALL.active||CALL.connBad)return; // idle/connBad states are owned by the durTimer tick and mount/hangup paths
  var el=$('rz-timer');if(el&&_remoteMicOn)el.textContent='Speaking…';
}
