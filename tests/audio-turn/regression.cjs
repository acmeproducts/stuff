// Runs the unchanged Chatlink integration suite against chat-test.html.
// AUDIO_MODE=ask (default here) proves the existing behaviour is intact; AUDIO_MODE=open runs it with both mics open.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const source=path.join(__dirname,'../chatlink/test.cjs');let s=fs.readFileSync(source,'utf8');
const swap=(a,b)=>{if(!s.includes(a))throw new Error('Baseline test changed: '+a);s=s.split(a).join(b)};
swap("path.join(root,'chatlink-turn01-pre-base.html')","path.join(root,'chat-test.html')");
swap("indexedDB.open('chatlink-turn01',1)","indexedDB.open('chatlink-audio-test',1)");
swap("addInitScript(()=>{localStorage.setItem('duck_haptic','off');","addInitScript(()=>{localStorage.setItem('chat_test_audio',JSON.stringify({mode:"+JSON.stringify(process.env.AUDIO_MODE||'ask')+",tones:false}));localStorage.setItem('duck_haptic','off');");
swap("page.testPCM.push(m.byteLength)","page.testPCM.push(m.byteLength);(page.testZero=page.testZero||[]).push(Buffer.from(m).every(b=>b===0))");
if(process.env.AUDIO_MODE==='open'){
 // These two scenarios tap the mic to talk (ask mode). They pass in the ask-mode run; open mode is covered below.
 const askOnly=["test('speech, translation, normalization and portal audio teardown'","test('late microphone permission cannot start in a different room'"];
 askOnly.forEach(a=>swap(a,a.replace("test(","skip(")));
 swap("(async()=>{const server=","function skip(){}\n"+fs.readFileSync(path.join(__dirname,'open-mode.cjs'),'utf8')+"\n(async()=>{const server=");
}
// The engine-parity check compares the accepted base with chat-lab; chat-test changes the pipeline by design.
s=s.replace(/for\(const \[a,b\] of \[\['\/\* ######## ENGINE'[^\n]*\n/,'\n');
const m=new Module(source,module);m.filename=source;m.paths=Module._nodeModulePaths(path.dirname(source));m._compile(s,source);
