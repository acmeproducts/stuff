// r4 scenarios: double-tap rail, blue jump button, back-translation check.
test('r4: double tap outside a bubble opens the rail; on a bubble it does not',async({page})=>{
 await create(page,'Taps');await send(page,'south','hello friend');await settled(page,1);
 const bub=await page.locator('#tx-south .bub').first().boundingBox();
 await page.mouse.click(bub.x+bub.width/2,bub.y+bub.height-6);await page.waitForTimeout(60);await page.mouse.click(bub.x+bub.width/2,bub.y+bub.height-6);
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.body.classList.contains('cl-open')),false,'double tap on a bubble must not open the rail');
 const r=await page.locator('#tx-south').boundingBox();await page.mouse.click(r.x+4,r.y+r.height-20);await page.waitForTimeout(500);await page.mouse.click(r.x+4,r.y+r.height-20);
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.body.classList.contains('cl-open')),false,'two slow taps do not open it');
 await page.mouse.click(r.x+4,r.y+r.height-20);await page.waitForTimeout(80);await page.mouse.click(r.x+4,r.y+r.height-20);
 await page.waitForFunction(()=>document.body.classList.contains('cl-open'));await page.locator('#cl-close').click();
 const n=await page.locator('#tx-north').boundingBox();await page.mouse.click(n.x+4,n.y+n.height/2);await page.waitForTimeout(80);await page.mouse.click(n.x+4,n.y+n.height/2);
 await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.body.classList.contains('cl-open')),false,'North surface does not open the owner rail');
});
test('r4: jump button is a blue filled circle with a white glyph and no border',async({page})=>{
 await create(page,'Jump');await page.evaluate(()=>{for(let i=0;i<40;i++)HIST.push({id:'j'+i,side:'south',text:'line '+i,src:'en',tgt:'th',ts:Date.now(),tr:'x',status:'complete'});renderAll();document.getElementById('tx-south').scrollTop=0});
 const b=page.locator('.half.south .cl-jump.show');await b.waitFor();
 const st=await b.evaluate(el=>{const c=getComputedStyle(el);return {bg:c.backgroundImage,border:c.borderTopWidth,color:c.color,svg:!!el.querySelector('svg')}});
 assert.match(st.bg,/linear-gradient/);assert.equal(st.border,'0px');assert.equal(st.color,'rgb(255, 255, 255)');assert.ok(st.svg);
});
test('r4: double tap on a bubble header shows source, target, back-translation and a verdict',async({page})=>{
 const back={'สวัสดีเพื่อน':'hello friend','แมวสีฟ้า':'blue cat','สวัสดีจ้ะ':'hello'};
 await page.route('https://translate.googleapis.com/**',route=>{const u=new URL(route.request().url()),q=u.searchParams.get('q');
  const fwd={'hello friend':'สวัสดีเพื่อน','hello my friend':'สวัสดีจ้ะ','the weather is nice today':'แมวสีฟ้า'};const t=u.searchParams.get('sl')==='th'?back[q]:fwd[q];return route.fulfill({json:[[[t||'?',q]]]})});
 await create(page,'Check');await send(page,'south','hello friend');await settled(page,1);await send(page,'south','the weather is nice today');await settled(page,2);await send(page,'south','hello my friend');await settled(page,3);
 async function check(i,panel){const h=page.locator('#tx-'+panel+' .bhdr').nth(i);await h.scrollIntoViewIfNeeded();const box=await h.boundingBox();const cx=panel==='north'?box.x+box.width-12:box.x+10;await page.mouse.click(cx,box.y+box.height/2);await page.waitForTimeout(60);await page.mouse.click(cx,box.y+box.height/2);
  const ov=page.locator('#tx-'+panel+' ~ .cl-bt, .half.'+panel+' .cl-bt');await ov.waitFor();await page.waitForFunction(p=>!document.querySelector('.half.'+p+' .cl-bt-verdict.wait'),panel);return ov}
 let ov=await check(0,'south');assert.match(await ov.textContent(),/Spoken.*English.*hello friend.*Back-translation.*English.*hello friend.*Target.*Thai.*สวัสดีเพื่อน/s);assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict match');
 await page.context().grantPermissions(['clipboard-read','clipboard-write']);await ov.getByRole('button',{name:'Copy',exact:true}).click();
 assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Spoken \(English\): hello friend\nBack-translation \(English\): hello friend\nTarget \(Thai\): สวัสดีเพื่อน\nRoute \(Keyboard\): Typed on the south keyboard\nResult: match/);
 await ov.getByRole('button',{name:'Close'}).click();assert.equal(await page.locator('.cl-bt').count(),0);
 ov=await check(1,'south');assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict miss');await ov.getByRole('button',{name:'Close'}).click();
 ov=await check(2,'south');assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict partial');await ov.getByRole('button',{name:'Close'}).click();
 ov=await check(0,'north');assert.ok(await ov.isVisible(),'North reader gets the check in their own (rotated) pane');
 assert.ok(await page.evaluate(()=>debugLog.filter(e=>e.ev==='bt_check').length>=4));
 assert.equal(await page.evaluate(()=>document.body.classList.contains('cl-open')),false,'header double tap does not open the rail');
});

test('r6: English spoken on the Thai side is checked in English, in a zebra matrix',async({page})=>{
 await create(page,'Owner case');
 await page.evaluate(()=>{HIST.push({id:'oc1',side:'north',original:"okay now let's try with the gap",text:'โอเคตอนนี้เรามาลองกับช่องว่าง',src:'th',tgt:'en',ts:Date.now(),tr:"Okay, now let's try with the gap.",status:'complete'});renderAll()});
 const h=page.locator('#tx-north .bhdr').first();await h.scrollIntoViewIfNeeded();const box=await h.boundingBox(),cx=box.x+box.width-12,cy=box.y+box.height/2;
 await page.mouse.click(cx,cy);await page.waitForTimeout(60);await page.mouse.click(cx,cy);
 const ov=page.locator('.half.north .cl-bt');await ov.waitFor();await page.waitForFunction(()=>!document.querySelector('.half.north .cl-bt-verdict.wait'),null,{timeout:5000});
 const cells=await ov.locator('tr').evaluateAll(rs=>rs.map(r=>[...r.children].map(c=>c.textContent)));
 assert.deepEqual(cells.map(r=>r[0]),['SpokenEnglish','Back-translationEnglish · same as target','TargetEnglish','NormalizedThai','Route—']);
 assert.deepEqual(cells[0],['SpokenEnglish',"okay now let's try with the gap"]);
 assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict match');
 const bgs=await ov.locator('tr').evaluateAll(rs=>rs.map(r=>getComputedStyle(r).backgroundColor));assert.notEqual(bgs[0],bgs[1]);assert.equal(bgs[0],bgs[2]);
});

test('r7: every message records its route; the check shows it',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'ask',tones:false}))});
 await create(page,'Routes');await send(page,'north','สวัสดีครับ');await settled(page,1);
 assert.deepEqual(await page.evaluate(()=>HIST[0].via),{input:'keyboard'});
 await page.locator('#strip-south .micbtn').click();await page.waitForFunction(()=>mic.south.active);
 const ws=page.testSockets.filter(w=>w.url().includes('language=en-US')).slice(-1)[0];ws.send(JSON.stringify({is_final:true,channel:{alternatives:[{transcript:'hello friend',confidence:.91}]}}));
 await settled(page,2);const via=await page.evaluate(()=>HIST[1].via);
 assert.equal(via.input,'voice');assert.equal(via.pipe,'south');assert.equal(via.heardAs,'en');assert.equal(via.reason,'owner');assert.equal(via.mode,'ask');assert.equal(via.conf,0.91);
 const h=page.locator('#tx-south .bhdr').nth(1);await h.scrollIntoViewIfNeeded();const b=await h.boundingBox();await page.mouse.click(b.x+10,b.y+b.height/2);await page.waitForTimeout(60);await page.mouse.click(b.x+10,b.y+b.height/2);
 const ov=page.locator('.half.south .cl-bt');await ov.waitFor();
 assert.match(await ov.locator('tr').last().textContent(),/RouteVoiceMic channel: south \(English\), heard as English, confidence 0\.91, mode ask, decided by mic owner/);
 assert.ok(await page.evaluate(()=>debugLog.some(e=>e.ev==='route'&&e.d.input==='voice'&&e.d.side==='south')));
});
test('r8: a Korean sentence split at "하지만" arrives as one message',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:false}))});
 await create(page,'Split','en','ko');await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 const ko=page.testSockets.filter(w=>w.url().includes('language=ko')).slice(-1)[0];
 const fin=t=>ko.send(JSON.stringify({is_final:true,channel:{alternatives:[{transcript:t,confidence:1}]}}));
 fin('가끔은 잠들 수 있을 것 같은 기분이 들기도 하지만');await page.waitForTimeout(3500);fin('지금은 출근해야 해요.');
 await page.waitForFunction(()=>HIST.length>=1&&HIST[0].status!=='pending',null,{timeout:12000});await page.waitForTimeout(2000);
 assert.equal(await page.evaluate(()=>HIST.length),1);assert.equal(await page.evaluate(()=>HIST[0].original),'가끔은 잠들 수 있을 것 같은 기분이 들기도 하지만 지금은 출근해야 해요.');
 assert.equal(await page.evaluate(()=>HIST[0].via.joined),2);
});
test('r9: AI keys tab loads models, validates and saves Venice and OpenRouter keys',async({page})=>{
 await page.route('https://api.venice.ai/**',route=>{const u=route.request().url();if(u.endsWith('/models'))return route.fulfill({json:{data:[{id:'venice-b'},{id:'venice-a'}]}});const b=JSON.parse(route.request().postData()||'{}');return b.model==='venice-a'?route.fulfill({status:402,json:{error:'credits'}}):route.fulfill({json:{choices:[{message:{content:'ok'}}]}})});
 await page.route('https://openrouter.ai/**',route=>{const u=route.request().url();if(u.endsWith('/auth/key'))return route.request().headers().authorization==='Bearer sk-or-good'?route.fulfill({json:{data:{}}}):route.fulfill({status:401,json:{error:{message:'bad key'}}});if(u.endsWith('/models'))return route.fulfill({json:{data:[{id:'openai/gpt-x'}]}});return route.fulfill({json:{choices:[]}})});
 await page.evaluate(()=>localStorage.setItem('ds_cfg_v2',JSON.stringify({vkey:'devstream-venice-key',vmodel:'venice-b'})));
 await create(page,'AI');await menu(page);await page.locator('#cl-settings').click();
 await page.getByRole('button',{name:'AI keys',exact:true}).click();
 assert.equal(await page.getByLabel('Venice API key').inputValue(),'devstream-venice-key','prefilled from devstream');
 await page.getByRole('button',{name:'Load Venice models',exact:true}).click();await page.getByText('2 models loaded').waitFor();
 await page.getByLabel('Venice model').selectOption('venice-a');await page.getByRole('button',{name:'Validate & save Venice',exact:true}).click();await page.getByText(/needs credits/).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('chat_ai_cfg')),null,'failed validation saves nothing');
 await page.getByLabel('Venice model').selectOption('venice-b');await page.getByRole('button',{name:'Validate & save Venice',exact:true}).click();await page.getByText('✓ verified & saved: venice-b').waitFor();
 await page.getByLabel('OpenRouter API key').fill('sk-or-bad');await page.getByRole('button',{name:'Load OpenRouter models',exact:true}).click();await page.getByText(/401/).waitFor();
 await page.getByLabel('OpenRouter API key').fill(' Bearer sk-or-good ');await page.getByRole('button',{name:'Load OpenRouter models',exact:true}).click();await page.getByText('1 models loaded').waitFor();
 await page.getByRole('button',{name:'Validate & save OpenRouter',exact:true}).click();await page.getByText('✓ verified & saved: openai/gpt-x').waitFor();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('chat_ai_cfg'))),{vkey:'devstream-venice-key',vmodel:'venice-b',orkey:'sk-or-good',ormodel:'openai/gpt-x'});
 assert.equal(await page.evaluate(()=>localStorage.getItem('ds_cfg_v2')),JSON.stringify({vkey:'devstream-venice-key',vmodel:'venice-b'}),'devstream config untouched');
 assert.ok(!(await page.evaluate(()=>JSON.stringify(debugLog))).includes('sk-or-good')&&!(await page.evaluate(()=>JSON.stringify(debugLog))).includes('devstream-venice-key'),'keys never logged');
 await page.getByRole('button',{name:'Device',exact:true}).click();await page.getByLabel('Microphone mode').waitFor();
});
test('r11: open mode with an English partner opens no extra English channel; ask mode keeps it',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:false}))});
 await create(page,'NoDup','en','ko');await page.waitForFunction(()=>mic.south.active&&mic.north.active);await page.waitForTimeout(300);
 const urls=page.testSockets.map(w=>w.url());assert.equal(urls.filter(u=>u.includes('language=en')).length,1,'only South listens in English');
 assert.equal(await page.evaluate(()=>debugLog.filter(e=>e.ev==='dg_en_open').length),0);
 await page.evaluate(()=>localStorage.setItem('chat_test_audio',JSON.stringify({mode:'ask',tones:false})));
 await create(page,'AskDual','en','ko');await page.locator('#strip-north .micbtn').click();await page.waitForFunction(()=>mic.north.active);await page.waitForTimeout(300);
 assert.ok(await page.evaluate(()=>debugLog.some(e=>e.ev==='dg_en_open')),'ask mode keeps the English side-channel for code-switching');
});
