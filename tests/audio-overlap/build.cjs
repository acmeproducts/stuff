const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'chatlink-turn01-pre-base.html'),'utf8');
function patch(a,b){assert.ok(s.includes(a),a);s=s.replace(a,b);}
patch("var CHAT_BUILD='chatlink-turn01-pre-base-r1'","var CHAT_BUILD='chat-test-audio-r2'");
patch('<title>Chatlink · Conversations</title>','<title>Chatlink · Audio test</title>');
s=s.replaceAll("'chatlink-turn01'","'chatlink-audio-test'").replaceAll("'chatlink-turn01-writer'","'chatlink-audio-test-writer'");
patch('  window.speechSynthesis.cancel();\n  var u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;window.speechSynthesis.speak(u);','  window.audioOverlap.enqueue(text,lang);');
patch('                        var b=new Int16Array(f.length);','                        window.audioOverlap.observe(f);\n                        var b=new Int16Array(f.length);');
patch('/* ===== bridge27: GEN ===== */',fs.readFileSync(path.join(__dirname,'controller.js'),'utf8')+'\n/* ===== bridge27: GEN ===== */');
patch('if(window.speechSynthesis)speechSynthesis.cancel()', 'if(window.audioOverlap)audioOverlap.cancelFor(why)');
patch('P.stream=s;P.on=true;connect()',"P.stream=s;P.on=true;audioOverlap.log('STT microphone started',{side:side,settings:s.getAudioTracks()[0].getSettings()});connect()");
patch('P.on=false;\n            stopSocket();',"audioOverlap.log('STT microphone stopped',{side:side});P.on=false;\n            stopSocket();");
patch('P.ws.onopen=function(){',"P.ws.onopen=function(){audioOverlap.log('STT socket open',{side:side});");
patch('var t=String(alt.transcript).trim();',"var t=String(alt.transcript).trim();audioOverlap.log('STT final',{side:side,text:t});");
patch('var verdict=dgArbitrateEnglish(alt.transcript);',"audioOverlap.log('STT English final',{side:side,text:alt.transcript});var verdict=dgArbitrateEnglish(alt.transcript);");
fs.writeFileSync(path.join(root,'chat-test.html'),s);console.log('Built chat-test.html');
