function renderTranscript(){
  var t=$('transcript');t.innerHTML='';_lastDateStr=null;
  transcript.forEach(function(e){appendMsgDom(e,true)});
  t.scrollTop=t.scrollHeight;
  sendReadReceipts();
}
