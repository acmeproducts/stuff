function speakText(text,lang){
  text=norm(text);if(!text||!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;window.speechSynthesis.speak(u);
}
