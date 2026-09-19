const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'chat-lab.html'));
const words=JSON.parse(fs.readFileSync(path.join(root,'dict/en.json')));
const bg=JSON.parse(fs.readFileSync(path.join(root,'dict/bigram-en.json')));
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({channel:process.env.CHAT_BROWSER_CHANNEL||'msedge',headless:true});
 let checks=0;
 try{
 for(const side of ['south','north']){
  const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const u=route.request().url();
   if(u.startsWith(url+'/?'))return route.continue();
   if(u.includes('/dict/bigram-en.json'))return route.fulfill({json:bg});
   if(u.includes('/dict/en.json'))return route.fulfill({json:words});
   return route.abort();
  });
  await page.goto(url+'/?s=en&n=en');
  await page.evaluate(()=>window.setFtForTest({predict:()=>[]}));
  await page.waitForFunction(()=>window.getDict('en')?.length>17000);
  await page.evaluate(s=>window.requestInput(s,'kb'),side);
  await page.waitForTimeout(250);
  await page.locator('#kb-'+side+' .kpredictions button').first().waitFor();
  const pred=page.locator('#kb-'+side+' .kpredictions button');
  await pred.filter({hasText:/^I$/}).click();
  assert.equal(await page.locator('#in-'+side).inputValue(),'I ');checks++;
  const next=await pred.first().textContent();await pred.first().click();
  assert.equal(await page.locator('#in-'+side).inputValue(),'I '+next+' ');checks++;
  let top1=0,top5=0;const timings=[];
  for(const word of ['hello','water','please','thanks','tomorrow','meeting','coffee','where','dinner','morning','help','sorry','happy','good','time','home','today','need','want','yes']){
   await page.locator('#strip-'+side+' .clearbtn').click();
   const points=await page.evaluate(({side,word})=>{
    const rects=window.keyRectsFor(side);return [...word].filter((c,i)=>!i||c!==word[i-1]).map(k=>{const r=rects.find(r=>r.k===k);return {x:r.cx,y:r.cy}});
   },{side,word});
   await page.mouse.move(points[0].x,points[0].y);await page.mouse.down();
   for(const p of points.slice(1))await page.mouse.move(p.x+1.5,p.y-1,{steps:6});
   const start=Date.now();await page.mouse.up();timings.push(Date.now()-start);
   const value=(await page.locator('#in-'+side).inputValue()).trim();
   const alternatives=await page.evaluate(s=>window.cands[s],side);
   if(value===word)top1++;if(value===word||alternatives.includes(word))top5++;
   console.log(side+' '+word+' => '+value+' ['+alternatives.join(', ')+']');
   assert.ok(value.length,'Pointer gesture must insert a word');checks++;
   assert.equal(await pred.count(),3,'Predictions follow each swipe');checks++;
  }
  console.log(side+': top1='+top1+'/20 top5='+top5+'/20 max release latency='+Math.max(...timings)+'ms');
  assert.ok(top1>=16,'At least 80% top-1 on deterministic gesture sample');
  assert.ok(top5>=19,'At least 95% top-5 on deterministic gesture sample');
  await page.evaluate(s=>{window.oldPrediction=document.querySelector('#kb-'+s+' .kpredictions button');},side);
  await page.locator('#strip-'+side+' .clearbtn').click();
  await page.evaluate(()=>window.oldPrediction.click());
  assert.equal(await page.locator('#in-'+side).inputValue(),'');checks++;
  await page.evaluate(s=>{for(const c of 'thank ')window.press(s,c)},side);
  assert.equal(await pred.first().textContent(),'you');checks++;
  await pred.first().click();assert.equal(await page.locator('#in-'+side).inputValue(),'thank you ');checks++;
  await page.screenshot({path:path.join(root,'tests/chat-keyboard/'+side+'-english.png')});
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS '+checks+' English prediction and actual pointer checks');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
