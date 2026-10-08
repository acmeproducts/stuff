function stopDeepgram(){
  _stopDgWatchdog();dgActive=false;
  if(_dgPrimHoldTimer){clearTimeout(_dgPrimHoldTimer);_dgPrimHoldTimer=null;_dgPrimHeldText=null}
  if(dgWs){try{dgWs.close()}catch(_){}dgWs=null}
  if(dgWsEn){try{dgWsEn.close()}catch(_){}dgWsEn=null}
  stopDGAudio();log('dg_stopped',{});
}
