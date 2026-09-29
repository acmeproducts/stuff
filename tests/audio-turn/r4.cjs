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
 let ov=await check(0,'south');assert.match(await ov.textContent(),/Source · English.*hello friend.*Back-translation · English.*hello friend.*Target · Thai.*สวัสดีเพื่อน/s);assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict match');
 await page.context().grantPermissions(['clipboard-read','clipboard-write']);await ov.getByRole('button',{name:'Copy',exact:true}).click();
 assert.match(await page.evaluate(()=>navigator.clipboard.readText()),/Source \(English\): hello friend\nBack-translation \(English\): hello friend\nTarget \(Thai\): สวัสดีเพื่อน\nResult: match/);
 await ov.getByRole('button',{name:'Close'}).click();assert.equal(await page.locator('.cl-bt').count(),0);
 ov=await check(1,'south');assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict miss');await ov.getByRole('button',{name:'Close'}).click();
 ov=await check(2,'south');assert.equal(await ov.locator('.cl-bt-verdict').getAttribute('class'),'cl-bt-verdict partial');await ov.getByRole('button',{name:'Close'}).click();
 ov=await check(0,'north');assert.ok(await ov.isVisible(),'North reader gets the check in their own (rotated) pane');
 assert.ok(await page.evaluate(()=>debugLog.filter(e=>e.ev==='bt_check').length>=4));
 assert.equal(await page.evaluate(()=>document.body.classList.contains('cl-open')),false,'header double tap does not open the rail');
});
