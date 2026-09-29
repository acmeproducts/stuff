// r3 scenarios, appended to the Chatlink harness (uses its create/menu/send/settled helpers).
const r3Events=(page,name)=>page.evaluate(n=>debugLog.filter(e=>e.ev===n).map(e=>e.d),name);
test('r3: Google translates first; MyMemory is the logged fallback',async({page})=>{
 await page.route('https://translate.googleapis.com/**',route=>{const u=new URL(route.request().url());const q=u.searchParams.get('q');if(q==='fail please')return route.fulfill({status:429,body:''});return route.fulfill({json:[[['G:'+q,q]]]})});
 await create(page,'Google');await send(page,'south','hello friend');await settled(page,1);
 assert.equal(await page.evaluate(()=>HIST[0].tr),'G:hello friend');assert.ok((await r3Events(page,'trans_ok')).some(d=>d.provider==='google'));
 await send(page,'south','fail please');await page.waitForFunction(()=>HIST.length===2&&HIST[1].status!=='pending');
 assert.equal(await page.evaluate(()=>HIST[1].tr),'translated','MyMemory fallback result');
 assert.ok((await r3Events(page,'trans_fallback')).some(d=>/429/.test(d.e)));assert.ok((await r3Events(page,'trans_ok')).some(d=>d.provider==='mymemory'));
});
test('r3: own bubble shows what was heard when normalization changed it',async({page})=>{
 await create(page,'Heard');await send(page,'north','สวัสดีเจ้า');await settled(page,1);
 assert.equal(await page.locator('#tx-north .bsaid').first().textContent(),'Heard: สวัสดีเจ้า');assert.equal(await page.locator('#tx-south .bsaid').count(),0);
});
test('r3: jump-to-latest arrow appears when scrolled up and returns to the latest',async({page})=>{
 await create(page,'Scroll');
 await page.evaluate(()=>{for(let i=0;i<40;i++)HIST.push({id:'x'+i,side:i%2?'north':'south',text:'line '+i,original:'line '+i,src:'en',tgt:'th',ts:Date.now(),tr:'แถว '+i,status:'complete'});renderAll();const t=document.getElementById('tx-south');t.scrollTop=t.scrollHeight;});
 await page.waitForTimeout(100);assert.equal(await page.locator('#tx-south ~ .cl-jump.show, .half.south .cl-jump.show').count(),0);
 await page.evaluate(()=>{document.getElementById('tx-south').scrollTop=0});await page.locator('.half.south .cl-jump.show').waitFor();
 await page.locator('.half.south .cl-jump').click();await page.waitForFunction(()=>{const t=document.getElementById('tx-south');return t.scrollHeight-t.scrollTop-t.clientHeight<5});
 await page.waitForFunction(()=>!document.querySelector('.half.south .cl-jump').classList.contains('show'));
});
test('r3: settings drop import/export, open diagnostics; per-room export under the room menu',async({page})=>{
 await create(page,'Export me');await send(page,'south','hello friend');await settled(page,1);
 await menu(page);await page.locator('#cl-settings').click();
 assert.equal(await page.getByRole('button',{name:'Import from chat-admin / lab'}).count(),0);assert.equal(await page.getByRole('button',{name:'Export conversations'}).count(),0);
 assert.equal(await page.getByText('Backup restore',{exact:false}).count(),0);assert.ok(await page.getByText('Build chat-test-audio-r11').count());
 await page.getByRole('button',{name:'Diagnostics log',exact:true}).click();await page.locator('#diag-panel.show').waitFor();
 for(const n of ['Export','Copy','Clear'])assert.ok(await page.locator('#diag-panel').getByRole('button',{name:n,exact:true}).isVisible());
 assert.ok(/trans_ok|trans_fallback/.test(await page.locator('#diag-lines').textContent()),'translation diagnostics present');
 const dl1=page.waitForEvent('download');await page.locator('#dg-dl').click();assert.ok((await dl1).suggestedFilename().endsWith('.txt'));
 await page.locator('#dg-clear').click();await page.locator('#dg-close').click();
 await page.getByRole('button',{name:'Back to conversations',exact:true}).click();await page.getByRole('button',{name:'Edit Export me',exact:true}).click();
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Export conversation',exact:true}).click();const d=await dl;
 assert.match(d.suggestedFilename(),/^chatlink-Export-me-\d{4}-\d\d-\d\d\.json$/);const data=JSON.parse(require('node:fs').readFileSync(await d.path(),'utf8'));
 assert.equal(data.rooms.length,1);assert.equal(data.rooms[0].messages[0].text,'hello friend');
});
test('r3: tone presets, custom upload, louder tones',async({page})=>{
 await create(page,'Tones');await menu(page);await page.locator('#cl-settings').click();
 await page.getByLabel('Start Speaking tone').selectOption('chime');await page.getByLabel('Done Speaking tone').selectOption('bell');
 await page.getByRole('button',{name:'Save device settings',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>{const c=audioTurn.cfg();return [c.startTone,c.doneTone]}),['chime','bell']);
 await page.locator('#cl-settings').click();
 const sr=8000,n=800,buf=Buffer.alloc(44+n*2);buf.write('RIFF',0);buf.writeUInt32LE(36+n*2,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(sr,24);buf.writeUInt32LE(sr*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*2,40);for(let i=0;i<n;i++)buf.writeInt16LE(Math.round(8000*Math.sin(i/5)),44+i*2);
 await page.locator('#cl-body input[type=file]').first().setInputFiles({name:'start.wav',mimeType:'audio/wav',buffer:buf});
 await page.getByText('Custom file saved').first().waitFor();assert.equal(await page.getByLabel('Start Speaking tone').inputValue(),'custom');
 await page.getByRole('button',{name:'Save device settings',exact:true}).click();
 assert.ok(await page.evaluate(()=>!!localStorage.getItem('chat_test_tone_start')));assert.equal(await page.evaluate(()=>audioTurn.cfg().startTone),'custom');
 await page.locator('#cl-settings').click();await page.getByRole('button',{name:'Play',exact:true}).first().click();
 await page.waitForFunction(()=>debugLog.some(e=>e.ev==='audio:cue-played'&&e.d.tone==='custom'&&e.d.outcome==='ok'));
 assert.ok(await page.evaluate(()=>/GAIN=1\.5/.test(document.documentElement.innerHTML)),'tone gain raised 50%');
});
test('r3: Deepgram punctuation on, Korean waits 1 s before ending a sentence, connections logged',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:false}))});
 await create(page,'Korean','en','ko');await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 const urls=page.testSockets.map(w=>w.url());
 assert.ok(urls.some(u=>u.includes('language=ko')&&u.includes('endpointing=1000')&&u.includes('punctuate=true')));
 assert.ok(urls.some(u=>u.includes('language=en-US')&&u.includes('endpointing=400')&&u.includes('punctuate=true')));
 assert.ok((await r3Events(page,'dg_connect')).length>=2&&(await r3Events(page,'dg_open')).length>=2);
 await page.waitForFunction(()=>['south','north'].every(s=>{const f=document.getElementById('mic-fill-'+s);return f&&Number(f.getAttribute('height'))>0}),null,{timeout:4000}).catch(()=>{throw new Error('both sides must show sound detection: '+JSON.stringify(['south','north'].map(s=>document&&s)))});
});
