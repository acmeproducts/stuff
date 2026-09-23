// Builds chat-test.html from the accepted chatlink-turn01-pre-base.html by
// patching named boundaries only. Replaces the earlier audio-overlap experiment.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');let s=fs.readFileSync(path.join(root,'chatlink-turn01-pre-base.html'),'utf8');
function patch(a,b){assert.equal(s.split(a).length,2,'boundary must be unique: '+a);s=s.replace(a,()=>b);}
patch("var CHAT_BUILD='chatlink-turn01-pre-base-r1'","var CHAT_BUILD='chat-test-audio-r2'");
patch('<title>Chatlink · Conversations</title>','<title>Chatlink · Audio test</title>');
s=s.replaceAll("'chatlink-turn01'","'chatlink-audio-test'").replaceAll("'chatlink-turn01-writer'","'chatlink-audio-test-writer'");
// Read-aloud goes through the turn gate (tones, pause/resume, echo memory).
patch('  window.speechSynthesis.cancel();\n  var u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;window.speechSynthesis.speak(u);','  window.audioTurn.speak(text,lang);');
patch('/* ===== bridge27: GEN ===== */',fs.readFileSync(path.join(__dirname,'controller.js'),'utf8')+'\n/* ===== bridge27: GEN ===== */');
// During playback or a cue, send silence (keeps the socket alive); captured audio is dropped, never kept.
patch('                        var b=new Int16Array(f.length);','                        if(!window.audioTurn.admit(side)){var z=new Int16Array(f.length);P.ws.send(z.buffer);if(P.enWs&&P.enWs.readyState===1)P.enWs.send(z.buffer);return}\n                        var b=new Int16Array(f.length);');
// Hand Deepgram's confidence/languages to the router.
patch('onFinal(held,dgUseMulti(room)?null:room.myLang);','onFinal(held,dgUseMulti(room)?null:room.myLang,alt);');
patch('onFinal(t,dgUseMulti(room)?null:room.myLang);','onFinal(t,dgUseMulti(room)?null:room.myLang,alt);');
patch("if(live())onFinal(String(alt.transcript).trim(),'en');","if(live())onFinal(String(alt.transcript).trim(),'en',alt);");
// Open mode: typing/sending does not close the microphones; lifecycle events still do.
patch('if(mic[s])mic[s].hardStop();','if(mic[s]&&!window.audioTurn.keepsMic(why))mic[s].hardStop();');
patch("diag('teardown ('+why+')');","diag('teardown ('+why+')');\n        window.audioTurn.afterTeardown(why);");
patch('paintActive(side,mode);','paintActive(side,mode);\n        window.audioTurn.sync();');
// Open mode: the existing mic button is that side's mute.
patch("else requestInput(side,'mic');","else if(!window.audioTurn.toggleMute(side))requestInput(side,'mic');");
// Every final goes through ownership routing before portal.submit / normalization.
patch('mic[s]=createMicPipeline(s,function(text,lang){','mic[s]=createMicPipeline(s,function(text,lang,alt){');
patch('sendFrom(s,text,true);       // keepMic','window.audioTurn.heard(s,text,lang,alt);       // routed; keepMic');
patch("document.getElementById('dg-close').addEventListener",
"window.audioTurn.bind({mic:mic,langOf:langOf,diag:diag,toast:toastMsg,\n"+
"            send:function(side,text){sendFrom(side,text,true)},\n"+
"            ownsMic:function(side){return INPUT.owner===side&&INPUT.mode==='mic'},\n"+
"            paint:function(side,on){if(on)paintActive(side,'mic');else{var m=document.querySelector('#strip-'+side+' .micbtn');if(m){m.classList.add('off');m.dataset.on='false';m.dataset.owned='false'}}},\n"+
"            compose:function(side,text){var i=inputEl(side);i.value=i.value?i.value.replace(/\\s+$/,'')+' '+text:text;resetComposition(side);changedDraft(side);updateClear(side)}});\n"+
"        document.getElementById('dg-close').addEventListener");
// Late-permission guard: in open mode a side may hold its mic without owning input.
patch("visible()&&INPUT.owner===side&&INPUT.mode==='mic'};","visible()&&(window.audioTurn.wantsMic(side)||INPUT.owner===side&&INPUT.mode==='mic')};");
// Device settings: microphone mode, tones, volume, pause after read-aloud.
patch("f.appendChild(button('Save device settings',function(){requireWriter();","var audioUI=window.audioTurn.settingsUI(f);f.appendChild(button('Save device settings',function(){requireWriter();window.audioTurn.saveSettings(audioUI);");
// Outcome records for the downstream stages (behaviour unchanged).
patch('var normalized=await normalizeOutgoing(','var normalized=await normalizeOutgoing(');
s=s.replace(/(var normalized=await normalizeOutgoing\([^;]*\);)/,(m)=>m+"window.audioTurn.note('normalization-completed','ok',{side:ctx.side,lang:normalized.lang});");
patch('var tr=normalized.lang===ctx.tgt?','var tr=normalized.lang===ctx.tgt?');
s=s.replace(/(var tr=normalized\.lang===ctx\.tgt\?[^;]*;)/,(m)=>m+"window.audioTurn.note(tr&&tr.ok?'translation-completed':'translation-failed',tr&&tr.ok?'ok':'error',{side:ctx.side,tgt:ctx.tgt});");
fs.writeFileSync(path.join(root,'chat-test.html'),s);console.log('Built chat-test.html');
