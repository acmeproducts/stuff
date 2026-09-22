const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'chatlink-turn01-pre-base.html'),'utf8');
function patch(a,b){assert.ok(s.includes(a),a);s=s.replace(a,b);}
patch("var CHAT_BUILD='chatlink-turn01-pre-base-r1'","var CHAT_BUILD='chat-test-audio-r1'");
patch('<title>Chatlink · Conversations</title>','<title>Chatlink · Audio test</title>');
s=s.replaceAll("'chatlink-turn01'","'chatlink-audio-test'").replaceAll("'chatlink-turn01-writer'","'chatlink-audio-test-writer'");
patch('  window.speechSynthesis.cancel();\n  var u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;window.speechSynthesis.speak(u);','  window.audioOverlap.enqueue(text,lang);');
patch('                        var b=new Int16Array(f.length);','                        window.audioOverlap.observe(f);\n                        var b=new Int16Array(f.length);');
patch('/* ===== bridge27: GEN ===== */',fs.readFileSync(path.join(__dirname,'controller.js'),'utf8')+'\n/* ===== bridge27: GEN ===== */');
fs.writeFileSync(path.join(root,'chat-test.html'),s);console.log('Built chat-test.html');
