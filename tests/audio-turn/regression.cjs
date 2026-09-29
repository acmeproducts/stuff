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
 swap("(async()=>{const server=",""+fs.readFileSync(path.join(__dirname,'open-mode.cjs'),'utf8')+"\n(async()=>{const server=");
}
// r3: the footer and its menu button are gone; the rail opens with a right swipe from the left edge of the South transcript.
swap("if(await page.locator('#cl-menu').getAttribute('aria-expanded')!=='true')await page.locator('#cl-menu').click();",
 "if(await page.locator('#cl-menu').getAttribute('aria-expanded')!=='true'){const v=page.viewportSize(),b=await page.evaluate(()=>{const r=document.getElementById('tx-south').getBoundingClientRect();return document.body.classList.contains('cl-empty-room')?null:{x:r.left,y:r.top+r.height/2}}),x=b?Math.round(b.x)+8:8,y=b?Math.round(b.y):Math.round(v.height*0.7);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y,{steps:3});await page.mouse.move(x+130,y,{steps:4});await page.mouse.up();await page.waitForFunction(()=>document.body.classList.contains('cl-open'));}");
swap(",menuBox=await page.locator('#cl-menu').boundingBox();",";");
swap("assert.ok(rail.y>=(height-56)/2-2);","assert.ok(rail.y>=height/2-2);assert.ok(rail.y+rail.height>=height-2,'rail reaches the bottom now the footer is gone');");
swap("assert.ok(menuBox.x<20&&menuBox.y>=height-60);","");
// r3: Import from chat-admin / lab was removed from settings by the owner.
swap("test('legacy import is repeatable and preserves 1000 messages'","skip('legacy import is repeatable and preserves 1000 messages'");
s="function skip(){}\n"+s;
swap("(async()=>{const server=",fs.readFileSync(path.join(__dirname,'r3.cjs'),'utf8')+"\n(async()=>{const server=");
// The engine-parity check compares the accepted base with chat-lab; chat-test changes the pipeline by design.
s=s.replace(/for\(const \[a,b\] of \[\['\/\* ######## ENGINE'[^\n]*\n/,'\n');
const m=new Module(source,module);m.filename=source;m.paths=Module._nodeModulePaths(path.dirname(source));m._compile(s,source);
