const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'chatlink-turn01-pre-base.html'),'utf8');
function patch(a,b){assert.ok(s.includes(a),'Missing anchor '+a);s=s.replace(a,b);}
patch("var CHAT_BUILD='chatlink-turn01-pre-base-r1'","var CHAT_BUILD='chat-test-reference-r3'");
patch('<title>Chatlink · Conversations</title>','<title>Chatlink · Reference audio test</title>');
s=s.replaceAll("'chatlink-turn01'","'chatlink-audio-test'").replaceAll("'chatlink-turn01-writer'","'chatlink-audio-test-writer'");
const wasm=fs.readFileSync(path.join(__dirname,'speex.wasm.b64'),'utf8').trim(),worklet=fs.readFileSync(path.join(__dirname,'worklet.js'),'utf8');
const adapter='const AEC_WASM_BASE64='+JSON.stringify(wasm)+';\nconst AEC_WORKLET_SOURCE='+JSON.stringify(worklet)+';\n'+fs.readFileSync(path.join(__dirname,'controller.js'),'utf8');
patch('/* ===== bridge27: GEN ===== */',adapter+'\n/* ===== bridge27: GEN ===== */');
patch('  text=norm(text);if(!text||!window.speechSynthesis)return;\n  window.speechSynthesis.cancel();\n  var u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;window.speechSynthesis.speak(u);','  window.audioReference.enqueue(text,lang);');
patch('if(window.speechSynthesis)speechSynthesis.cancel()', 'if(window.audioReference)audioReference.cancel(why)');
patch('            MicMeter.detach();','            audioReference.detach(side);\n            MicMeter.detach();');
patch('if(P.audioCtx){try{P.audioCtx.close()}catch(e){}P.audioCtx=null}','if(P.audioCtx){P.audioCtx=null}');
patch('P.audioCtx=new(window.AudioContext||window.webkitAudioContext)({sampleRate:16000});','P.audioCtx=audioReference.context();');
patch('P.src=P.audioCtx.createMediaStreamSource(new MediaStream(tracks));','P.src=audioReference.attach(P.audioCtx,new MediaStream(tracks),side);');
patch('return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}})',"return audioReference.prepare().then(function(){return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}})})");
patch('P.stream=s;P.on=true;connect()',"P.stream=s;P.on=true;audioReference.log('STT microphone started',{side:side,settings:s.getAudioTracks()[0].getSettings()});connect()");
patch('P.on=false;\n            stopSocket();',"audioReference.log('STT microphone stopped',{side:side});P.on=false;\n            stopSocket();");
patch('P.ws.onopen=function(){',"P.ws.onopen=function(){audioReference.log('STT socket open',{side:side});");
patch('var t=String(alt.transcript).trim();',"var t=String(alt.transcript).trim();audioReference.log('STT final',{side:side,text:t});");
patch('var verdict=dgArbitrateEnglish(alt.transcript);',"audioReference.log('STT English final',{side:side,text:alt.transcript});var verdict=dgArbitrateEnglish(alt.transcript);");
patch("P.ws.onerror=function(){if(live())diag(side+': socket error',true)};","P.ws.onerror=function(){if(live()){audioReference.log('STT socket error',{side:side});diag(side+': socket error',true)}};");
patch('P.ws.onclose=function(ev){',"P.ws.onclose=function(ev){audioReference.log('STT socket closed',{side:side,code:ev.code});");
patch('P.ws.send(b.buffer);','P.ws.send(b.buffer);audioReference.sent(side,f.length);');
patch(".catch(function(e){diag(side+': microphone permission needed',true);throw e});", ".catch(function(e){audioReference.log('STT start error',{side:side,message:e.message});diag(side+': '+e.message,true);throw e});");
// Preserve the accepted automatic microphone start/stop and room-generation guards.
fs.writeFileSync(path.join(root,'chat-test.html'),s);console.log('Built chat-test.html with reference AEC');
