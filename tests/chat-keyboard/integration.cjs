// Compare the original standalone lab against the keyboard-patched lab.
// Synthetic microphone audio and service responses; never uses a real credential.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const base=fs.readFileSync(path.join(__dirname,'base-chat-lab.html'),'utf8');
const patch=fs.readFileSync(path.join(root,'chat-lab.html'),'utf8');
const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b));
for(const [a,b] of [
 ['/* ######## ENGINE','/* ######## KEYBOARD'],
 ['/* ######## pipeline + switch','/* ######## config/bubbles/send'],
 ['/* ######## config/bubbles/send','/* ######## keyboard']
])assert.equal(section(patch,a,b),section(base,a,b),'Original lab section preserved: '+a);
const responses={
 'en|th|hello friend':'สวัสดีเพื่อน',
 'th|en|สวัสดีครับ':'hello friend',
 'en|th|good morning friend':'สวัสดีตอนเช้า',
 'th|en|สวัสดีตอนเช้า':'good morning friend'
};
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url.startsWith('/base')?base:patch)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:process.env.CHAT_BROWSER_CHANNEL||'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const results=[];
 try{
 for(const build of ['base','patched']){
  const context=await browser.newContext({permissions:['microphone'],viewport:{width:412,height:915}});
  const page=await context.newPage();page.setDefaultTimeout(8000);
  const errors=[],requests=[],sockets=[],pcm=[];page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{localStorage.setItem('tb_dg_key','synthetic-test-key');});
  await page.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin===origin&&/^\/(base|patched)$/.test(u.pathname))return route.continue();
   if(u.hostname==='api.mymemory.translated.net'){
    const key=u.searchParams.get('langpair')+'|'+u.searchParams.get('q');requests.push(key);
    return route.fulfill({json:{responseStatus:200,responseData:{translatedText:responses[key]||'FIXTURE MISSING'}}});
   }
   if(u.pathname.includes('/dict/bigram-'))return route.fulfill({json:{}});
   if(u.pathname.includes('/dict/'))return route.fulfill({json:['hello','friend',...Array.from({length:100},(_,i)=>'word'+i)]});
   return route.abort();
  });
  await page.routeWebSocket('wss://api.deepgram.com/**',ws=>{
   sockets.push(ws);ws.onMessage(message=>{if(typeof message!=='string')pcm.push(message.byteLength)});
  });
  await page.goto(origin+'/'+build);
  await page.evaluate(()=>window.setFtForTest({detect:()=> 'en'}));
  assert.deepEqual(await page.evaluate(()=>[window.langOf('south'),window.langOf('north')]),['en','th']);
  assert.equal(await page.evaluate(()=>localStorage.getItem('duck_rooms_index')),null,'No admin room required');
  // A real Send-button event exercises normalization, translation and rendering.
  await page.locator('#in-south').fill('hello friend');
  await page.locator('#strip-south .sendbtn').click();
  await page.waitForFunction(()=>window.HIST.length===1&&window.HIST[0].tr);
  assert.deepEqual(await page.evaluate(()=>({text:HIST[0].text,tr:HIST[0].tr,src:HIST[0].src,tgt:HIST[0].tgt})),
   {text:'hello friend',tr:'สวัสดีเพื่อน',src:'en',tgt:'th'});
  // Northern Thai dialect is normalized on the Thai speaker's side, then translated.
  await page.locator('#in-north').fill('สวัสดีเจ้า');await page.locator('#strip-north .sendbtn').click();
  await page.waitForFunction(()=>window.HIST.length===2&&window.HIST[1].tr);
  assert.equal(await page.evaluate(()=>HIST[1].text),'สวัสดีครับ');
  assert.equal(await page.evaluate(()=>HIST[1].tr),'hello friend');
  // English entered on the Thai side must normalize into Thai before display.
  await page.locator('#in-north').fill('good morning friend');await page.locator('#strip-north .sendbtn').click();
  await page.waitForFunction(()=>window.HIST.length===3&&window.HIST[2].tr);
  assert.equal(await page.evaluate(()=>HIST[2].text),'สวัสดีตอนเช้า');
  assert.equal(await page.evaluate(()=>HIST[2].tr),'good morning friend');
  // Start microphone through the actual UI and confirm actual PCM audio transport.
  await page.locator('#strip-south .micbtn').click();
  await page.waitForFunction(()=>window.mic.south.active);
  for(let i=0;i<30&&!pcm.length;i++)await page.waitForTimeout(100);
  assert.ok(pcm.length>0,'Audio graph sends PCM to Deepgram socket');
  assert.ok(sockets[0].url().includes('language=en-US'));
  sockets[0].send(JSON.stringify({is_final:true,channel:{alternatives:[{transcript:'hello friend'}]}}));
  await page.waitForFunction(()=>window.HIST.length===4&&window.HIST[3].tr);
  assert.equal(await page.evaluate(()=>HIST[3].tr),'สวัสดีเพื่อน');
  assert.deepEqual(await page.evaluate(()=>window.INPUT),{owner:'south',mode:'mic'});
  await page.locator('#strip-south .micbtn').click();
  // Thai input must still open native + English arbitration sockets.
  const before=sockets.length;
  await page.locator('#strip-north .micbtn').click();
  await page.waitForFunction(()=>window.mic.north.active);
  assert.equal(sockets.length-before,2);
  const thai=sockets.slice(before).find(ws=>ws.url().includes('language=th'));
  assert.ok(thai);thai.send(JSON.stringify({is_final:true,channel:{alternatives:[{transcript:'สวัสดีเจ้า'}]}}));
  await page.waitForFunction(()=>window.HIST.length===5&&window.HIST[4].tr);
  assert.equal(await page.evaluate(()=>HIST[4].text),'สวัสดีครับ');
  assert.equal(await page.evaluate(()=>HIST[4].tr),'hello friend');
  assert.deepEqual(await page.evaluate(()=>window.INPUT),{owner:'north',mode:'mic'});
  await page.locator('#strip-north .micbtn').click();
  assert.deepEqual(errors,[]);
  results.push(await page.evaluate(()=>HIST.map(({text,tr,src,tgt,side})=>({text,tr,src,tgt,side}))));
  console.log('PASS '+build+': standalone en/th, typed translation, dialect normalization, code-switch normalization, South PCM + transcript, North dual sockets + transcript, ownership');
  await context.close();
 }
 assert.deepEqual(results[0],results[1]);console.log('PASS baseline/patched end-to-end results identical');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
