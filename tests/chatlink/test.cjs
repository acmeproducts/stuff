const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'chatlink-turn01-pre-base.html'),'utf8'),lab=fs.readFileSync(path.join(root,'chat-lab.html'),'utf8');
for(const [a,b] of [['/* ######## ENGINE','/* ######## KEYBOARD'],['/* ######## pipeline + switch','/* ######## config/bubbles/send']])assert.equal(html.slice(html.indexOf(a),html.indexOf(b)),lab.slice(lab.indexOf(a),lab.indexOf(b)),'Accepted engine block unchanged');
const words=JSON.parse(fs.readFileSync(path.join(root,'dict/en.json'))),bg=JSON.parse(fs.readFileSync(path.join(root,'dict/bigram-en.json')));
const tests=[];const test=(name,run)=>tests.push({name,run});
async function records(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('chatlink-turn01',1);q.onsuccess=()=>{const db=q.result,t=db.transaction('rooms'),r=t.objectStore('rooms').getAll();r.onsuccess=()=>{resolve(r.result);db.close()};r.onerror=()=>reject(r.error)};}));}
async function menu(page){if(await page.locator('#cl-menu').getAttribute('aria-expanded')!=='true')await page.locator('#cl-menu').click();}
async function create(page,name,south='en',north='th'){
 await menu(page);await page.locator('#cl-new').click();
 await page.getByLabel('Conversation name',{exact:true}).fill(name);
 await page.getByLabel('Device owner · South',{exact:true}).selectOption(south);
 await page.getByLabel('Partner · North',{exact:true}).selectOption(north);
 await page.getByRole('button',{name:'Create conversation',exact:true}).click();
 await page.waitForFunction(name=>document.getElementById('cl-room-title').textContent===name,name);
 await page.waitForFunction(()=>document.getElementById('cl-menu').getAttribute('aria-expanded')==='false');
 return (await records(page)).find(r=>r.label===name).id;
}
async function select(page,name){await menu(page);await page.locator('.cl-room-open').filter({hasText:name}).click();await page.waitForFunction(name=>document.getElementById('cl-room-title').textContent===name,name);await page.waitForFunction(()=>!document.body.classList.contains('cl-open'));}
async function send(page,side,text){await page.locator('#in-'+side).fill(text);await page.locator('#strip-'+side+' .sendbtn').click();}
async function settled(page,count){await page.waitForFunction(n=>window.HIST.length===n&&window.HIST.every(m=>m.status==='complete'),count);}
test('first run, creation, cancellation and reload',async({page})=>{
 assert.equal((await records(page)).length,0);assert.equal(await page.locator('.half.north #cl-menu').count(),0);
 await page.locator('#cl-new').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal((await records(page)).length,0);
 await create(page,'Cafe');assert.deepEqual(await page.evaluate(()=>[langOf('south'),langOf('north')]),['en','th']);
 await page.locator('#in-south').fill('unsent South');await page.evaluate(()=>chatlink.flush());
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.chatlinkReady==='true');
 assert.equal(await page.locator('#in-south').inputValue(),'unsent South');assert.equal(await page.locator('#cl-room-title').textContent(),'Cafe');
 assert.equal(await page.evaluate(()=>localStorage.getItem('duck_rooms_index')),null);
});
test('independent histories, drafts, rename and trash/restore',async({page})=>{
 await create(page,'Alpha');await send(page,'south','hello friend');await settled(page,1);await page.locator('#in-south').fill('alpha draft');
 await create(page,'Beta');assert.equal(await page.locator('#in-south').inputValue(),'');await send(page,'south','another message');await settled(page,1);await page.locator('#in-south').fill('beta draft');
 await select(page,'Alpha');assert.equal(await page.locator('#in-south').inputValue(),'alpha draft');assert.equal(await page.evaluate(()=>HIST[0].text),'hello friend');
 await menu(page);await page.getByRole('button',{name:'Edit Alpha',exact:true}).click();await page.getByLabel('Conversation name',{exact:true}).fill('Alpha renamed');assert.ok(await page.getByLabel('Partner · North',{exact:true}).isDisabled());await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.waitForFunction(()=>document.getElementById('cl-room-title').textContent==='Alpha renamed'&&!document.body.classList.contains('cl-open'));
 await menu(page);await page.getByRole('button',{name:'Edit Alpha renamed',exact:true}).click();await page.getByRole('button',{name:'Move to Trash',exact:true}).click();await page.waitForFunction(()=>document.body.classList.contains('cl-empty-room'));
 await page.locator('#cl-trash').click();await page.getByRole('button',{name:'Restore Alpha renamed',exact:true}).click();await select(page,'Beta');assert.equal(await page.locator('#in-south').inputValue(),'beta draft');
 await select(page,'Alpha renamed');assert.equal(await page.evaluate(()=>HIST.length),1);
});
test('late translation never renders into another room',async({page})=>{
 let release;const held=new Promise(r=>release=r);let arrived;const ready=new Promise(r=>arrived=r);
 await page.route('**/get?**',async route=>{arrived();await held;await route.fulfill({json:{responseStatus:200,responseData:{translatedText:'delayed translation'}}});});
 await create(page,'Origin');await send(page,'south','delayed message');await ready;
 await create(page,'Destination');release();await page.waitForTimeout(200);
 assert.equal(await page.evaluate(()=>HIST.length),0);const all=await records(page);assert.equal(all.find(r=>r.label==='Origin').messages[0].tr,'delayed translation');assert.equal(all.find(r=>r.label==='Destination').messages.length,0);
});
test('legacy import is repeatable and preserves 1000 messages',async({page})=>{
 await page.evaluate(()=>{
  localStorage.setItem('duck_rooms_index',JSON.stringify([{id:'old',label:'Legacy',southLang:'en',northLang:'th'},...Array.from({length:19},(_,i)=>({id:'extra-'+i,label:'Retained room '+i,southLang:'en',northLang:'th'}))]));
  localStorage.setItem('duck_room_old',JSON.stringify(Array.from({length:1000},(_,i)=>({id:'old-'+i,side:'south',text:'hello '+i,src:'en',tgt:'th',ts:1700000000000+i,tr:'สวัสดี'}))));
 });
 for(let i=0;i<2;i++){await menu(page);await page.locator('#cl-settings').click();await page.getByRole('button',{name:'Import from chat-admin / lab',exact:true}).click();await page.getByRole('button',{name:'Import 20 conversations',exact:true}).click();await page.locator('.cl-room-open').filter({hasText:'Legacy'}).waitFor();}
 assert.equal((await records(page)).length,20);await page.screenshot({path:path.join(__dirname,'room-list.png')});await select(page,'Legacy');assert.equal(await page.evaluate(()=>HIST.length),1000);assert.equal(await page.locator('#tx-south .bub').count(),100);
 await page.locator('#tx-south .cl-older').click();assert.equal(await page.locator('#tx-south .bub').count(),200);
 await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.chatlinkReady==='true');assert.equal(await page.evaluate(()=>HIST.length),1000);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('duck_room_old')).length),1000);
});
test('North/South swipe and next-word prediction survive the portal',async({page})=>{
 await create(page,'English','en','en');
 for(const side of ['south','north']){
  await page.locator('#in-'+side).click();if(await page.locator('#ask-'+(side==='south'?'north':'south')+' .ask-ok').isVisible())await page.locator('#ask-'+(side==='south'?'north':'south')+' .ask-ok').click();
  await page.waitForTimeout(250);
  const points=await page.evaluate(side=>[...'water'].map(k=>window.keyRectsFor(side).find(r=>r.k===k)).map(r=>({x:r.cx,y:r.cy})),side);
  await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();for(const p of points.slice(1))await page.mouse.move(p.x,p.y,{steps:7});await page.mouse.up();
  assert.equal(await page.locator('#in-'+side).inputValue(),'water ');assert.equal(await page.locator('#kb-'+side+' .kpredictions button').count(),3);
  const word=await page.locator('#kb-'+side+' .kpredictions button').first().textContent();await page.locator('#kb-'+side+' .kpredictions button').first().click();assert.equal(await page.locator('#in-'+side).inputValue(),'water '+word+' ');
  await page.screenshot({path:path.join(__dirname,side+'-keyboard.png')});await menu(page);await page.locator('#cl-close').click();assert.equal(await page.evaluate(()=>INPUT.owner),null);
 }
});
test('second tab cannot write while first tab owns the application',async({page,context,url})=>{
 await create(page,'Single writer');const second=await context.newPage();await configure(second,url);await second.goto(url);await second.waitForFunction(()=>document.documentElement.dataset.chatlinkReady==='true');
 assert.ok((await second.locator('#cl-body').textContent()).includes('read-only'));await second.locator('#cl-new').click();assert.ok((await second.locator('#cl-error').textContent()).includes('another tab'));assert.equal((await records(page)).length,1);await second.close();
});
test('compact phone keeps swipe keys reachable on both sides',async({page})=>{
 await page.setViewportSize({width:360,height:640});await create(page,'Compact','en','en');
 for(const side of ['south','north']){
  await page.locator('#in-'+side).click();await page.waitForTimeout(250);
  const points=await page.evaluate(side=>[...'morning'].map(k=>window.keyRectsFor(side).find(r=>r.k===k)).map(r=>({x:r.cx,y:r.cy})),side);
  for(const p of points)assert.ok(p.x>0&&p.x<360&&p.y>0&&p.y<584);
  await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();for(const p of points.slice(1))await page.mouse.move(p.x,p.y,{steps:7});await page.mouse.up();assert.equal(await page.locator('#in-'+side).inputValue(),'morning ');
  await page.screenshot({path:path.join(__dirname,side+'-compact.png')});await menu(page);await page.locator('#cl-close').click();
 }
});
test('speech, translation, normalization and portal audio teardown',async({page})=>{
 await create(page,'Speech');await page.evaluate(()=>localStorage.setItem('tb_dg_key','synthetic-key'));
 const sockets=page.testSockets,pcm=page.testPCM;
 await page.locator('#strip-south .micbtn').click();await page.waitForFunction(()=>mic.south.active);for(let i=0;i<30&&!pcm.length;i++)await page.waitForTimeout(100);assert.ok(pcm.length);
 sockets[0].send(JSON.stringify({is_final:true,channel:{alternatives:[{transcript:'hello friend'}]}}));await settled(page,1);assert.equal(await page.evaluate(()=>HIST[0].tr),'สวัสดีเพื่อน');assert.equal(await page.evaluate(()=>INPUT.mode),'mic');
 await menu(page);assert.equal(await page.evaluate(()=>mic.south.on),false);await page.locator('#cl-close').click();assert.equal(await page.evaluate(()=>INPUT.owner),null);
 await send(page,'north','สวัสดีเจ้า');await settled(page,2);assert.equal(await page.evaluate(()=>HIST[1].text),'สวัสดีครับ');
 await send(page,'north','good morning friend');await settled(page,3);assert.equal(await page.evaluate(()=>HIST[2].text),'สวัสดีตอนเช้า');
});
test('late microphone permission cannot start in a different room',async({page})=>{
 await create(page,'Old mic');await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=(constraints)=>new Promise(resolve=>{window.releaseMic=async()=>resolve(await original(constraints))});});
 await page.locator('#strip-south .micbtn').click();await page.waitForFunction(()=>!!window.releaseMic);
 await create(page,'New room');await page.evaluate(()=>window.releaseMic());await page.waitForTimeout(500);
 assert.equal(await page.evaluate(()=>mic.south.on),false);assert.equal(await page.evaluate(()=>INPUT.owner),null);assert.equal(page.testPCM.length,0);
});
test('reload during translation retains original and allows retry',async({page})=>{
 await create(page,'Interrupted');let release;const held=new Promise(r=>release=r);let arrived;const ready=new Promise(r=>arrived=r);
 await page.route('**/get?**',async route=>{arrived();await held;await route.abort().catch(()=>{});});
 await send(page,'south','hello friend');await ready;await page.reload();release();await page.unroute('**/get?**');await page.waitForFunction(()=>document.documentElement.dataset.chatlinkReady==='true');
 assert.equal(await page.evaluate(()=>HIST[0].original),'hello friend');await page.locator('#tx-south .cl-message-retry').click();await settled(page,1);assert.equal(await page.evaluate(()=>HIST[0].tr),'สวัสดีเพื่อน');
});
test('late translation cannot recreate a permanently deleted room',async({page})=>{
 await create(page,'Delete pending');let release;const held=new Promise(r=>release=r);let arrived;const ready=new Promise(r=>arrived=r);
 await page.route('**/get?**',async route=>{arrived();await held;await route.fulfill({json:{responseStatus:200,responseData:{translatedText:'late'}}});});
 await send(page,'south','hello friend');await ready;await menu(page);await page.getByRole('button',{name:'Edit Delete pending',exact:true}).click();await page.getByRole('button',{name:'Move to Trash',exact:true}).click();await page.waitForFunction(()=>document.body.classList.contains('cl-empty-room'));await page.locator('#cl-trash').click();await page.getByRole('button',{name:'Delete',exact:true}).click();release();await page.waitForTimeout(150);assert.equal((await records(page)).length,0);
});
test('storage failure blocks switching and permits retry',async({page})=>{
 await create(page,'Save trouble');await page.locator('#in-south').fill('keep this draft');
 await page.evaluate(()=>{const original=IDBDatabase.prototype.transaction;window.undoStorageFailure=()=>IDBDatabase.prototype.transaction=original;IDBDatabase.prototype.transaction=function(names,mode,...rest){if(mode==='readwrite')throw new DOMException('Injected quota failure','QuotaExceededError');return original.call(this,names,mode,...rest)}});
 await menu(page);assert.equal(await page.locator('#in-south').inputValue(),'keep this draft');assert.equal(await page.locator('#cl-room-title').textContent(),'Save trouble');assert.ok((await page.locator('#cl-error').textContent()).includes('quota'));
 await page.evaluate(()=>window.undoStorageFailure());await page.locator('#cl-settings').click();await page.getByRole('button',{name:'Retry saving',exact:true}).click();await page.waitForFunction(()=>document.getElementById('cl-save-state').textContent==='Saved');assert.equal((await records(page))[0].drafts.south.text,'keep this draft');
});
test('owner rail stays in South at phone and tablet sizes',async({page})=>{
 for(const [width,height] of [[360,640],[390,844],[412,915],[1024,768]]){
  await page.setViewportSize({width,height});await menu(page);const rail=await page.locator('#cl-rail').boundingBox(),plus=await page.locator('#cl-new').boundingBox(),menuBox=await page.locator('#cl-menu').boundingBox();
  assert.ok(rail.y>=(height-56)/2-2);assert.ok(plus.y>=rail.y&&plus.y+plus.height<=rail.y+rail.height+2);assert.ok(menuBox.x<20&&menuBox.y>=height-60);
 }
 await page.setViewportSize({width:412,height:915});await page.screenshot({path:path.join(__dirname,'portal.png')});
});
async function configure(page,url){page.testSockets=[];page.testPCM=[];await page.routeWebSocket('wss://api.deepgram.com/**',ws=>{page.testSockets.push(ws);ws.onMessage(m=>{if(typeof m!=='string')page.testPCM.push(m.byteLength)})});page.setDefaultTimeout(6000);await page.route('**/*',route=>{
 const u=new URL(route.request().url());if(u.origin===url)return route.continue();
 if(u.hostname==='api.mymemory.translated.net'){const q=u.searchParams.get('q');const response={'hello friend':'สวัสดีเพื่อน','สวัสดีครับ':'hello friend','good morning friend':'สวัสดีตอนเช้า','สวัสดีตอนเช้า':'good morning friend'}[q]||'translated';return route.fulfill({json:{responseStatus:200,responseData:{translatedText:response}}});}
 if(u.pathname.includes('bigram-en'))return route.fulfill({json:bg});if(u.pathname.includes('bigram-'))return route.fulfill({json:{}});if(u.pathname.includes('/dict/'))return route.fulfill({json:words});return route.abort();
 });await page.addInitScript(()=>{localStorage.setItem('duck_haptic','off');window.addEventListener('DOMContentLoaded',()=>window.setFtForTest({detect:()=> 'en'}));});page.on('dialog',d=>d.accept());}
(async()=>{const server=http.createServer((req,res)=>{if(req.url==='/'||req.url.startsWith('/?')){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}else{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;const browser=await chromium.launch({headless:true,channel:process.env.CHAT_BROWSER_CHANNEL||'msedge',args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});let failed=0;
 try{for(const t of tests.filter(t=>!process.env.CASE||t.name.includes(process.env.CASE))){const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,permissions:['microphone']});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await configure(page,url);try{await page.goto(url);await page.waitForFunction(()=>document.documentElement.dataset.chatlinkReady==='true');await t.run({page,context,url});assert.deepEqual(errors,[]);console.log('PASS '+t.name);}catch(e){failed++;console.error('FAIL '+t.name+'\n'+e.stack);console.error(await page.evaluate(()=>({diag:getDiagLines(),input:INPUT,south:{on:mic.south.on,active:mic.south.active},north:{on:mic.north.on,active:mic.north.active}})));await page.screenshot({path:path.join(__dirname,'failure-'+failed+'.png')});}finally{await context.close()}}}finally{await browser.close();await new Promise(r=>server.close(r))}const count=tests.filter(t=>!process.env.CASE||t.name.includes(process.env.CASE)).length;console.log((count-failed)+'/'+count+' Chatlink integration scenarios passed');process.exitCode=failed?1:0;})().catch(e=>{console.error(e);process.exitCode=1});
