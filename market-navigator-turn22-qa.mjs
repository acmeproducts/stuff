import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn22-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function makePage({width=412,height=915,ai=false}={}){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[],requests=[];
  await page.addInitScript(()=>{class U{constructor(text){this.text=String(text);this.rate=1}};Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){},pause(){},resume(){}},configurable:true})});
  if(ai)await page.addInitScript(()=>localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify({defaultProvider:'openrouter',providers:{openrouter:{verified:true,key:'qa-key',model:'qa-model'}}})));
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400&&!/favicon/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  if(ai)await page.route('https://openrouter.ai/api/v1/chat/completions',async r=>{requests.push(r.request().postDataJSON());await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Turn 22 QA\n\nUnified NOW state retained the derived anchor and visible evidence.'}}]})})});
  await page.goto(url,{waitUntil:'networkidle'});
  if(width<=760&&!(await page.locator('#rail').evaluate(el=>el.classList.contains('closed'))))await page.locator('#toggle').click();
  return{page,errors,failed,requests};
}
const text=async l=>(await l.innerText()).replace(/\s+/g,' ').trim();
async function crumb(page){return text(page.locator('#nowCrumb'))}
async function enterGrowth(page){await page.locator('#legend [data-id="growth"]').click();await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / GRW / COMPONENTS')}
async function setHz(page,h){await page.locator(`#hzs [data-h="${h}"]`).click();await page.waitForFunction(h=>document.querySelector(`#hzs [data-h="${h}"]`)?.classList.contains('on'),h)}
function tipNumbers(t){let m=t.replace(/\s+/g,' ').match(/idx\s+(-?[\d,.]+)\s+·\s+value\s+(-?[\d,.]+)/i);assert(m,`tip contains indexed and native values: ${t}`);return{idx:+m[1].replace(/,/g,''),native:+m[2].replace(/,/g,'')}}
async function inspectDate(page,iso){let box=await page.locator('#nowChart').boundingBox();assert(box);let start=Date.parse('2021-09-10T00:00:00Z'),end=Date.parse('2026-09-10T23:59:59Z'),target=Date.parse(iso+'T12:00:00Z'),left=48,right=12,frac=(target-start)/(end-start),x=box.x+left+frac*(box.width-left-right),y=box.y+Math.min(120,box.height/3);await page.mouse.move(Math.min(box.x+box.width-right-1,Math.max(box.x+left+1,x)),y);await page.waitForFunction(()=>document.querySelector('#nowTip')?.style.display==='block');return tipNumbers(await page.locator('#nowTip').innerText())}

async function coreJourney(width){
  const t=await makePage({width,height:width<700?915:800}),p=t.page;
  assert.equal(await p.locator('[data-view="explore"]').count(),0,'Explore nav retired');
  assert.equal(await p.locator('#view-explore').count(),0,'Explore surface retired');
  assert.equal(await crumb(p),'ENV');
  assert.equal(await p.locator('#legend [data-id]').count(),3,'ENV has 3 indices');
  assert.equal(await p.locator('#legend .active').count(),0,'ENV boots neutral');
  assert.equal(await p.locator('#nowChart').getAttribute('data-emphasis'),'false','ENV has no isolation emphasis');
  await enterGrowth(p);
  assert.equal(await p.locator('#analysisModal').evaluate(el=>el.classList.contains('hidden')),true,'no Component modal');
  assert.equal(await p.locator('#legend [data-id]').count(),8,'GRW plus 7 governed components');
  assert.equal(await p.locator('#legend [data-id="growth"] [data-rm]').count(),0,'anchor cannot be removed');
  assert.equal(await p.locator('#legend [data-rm]').count(),7,'governed components removable');
  assert.equal(await p.locator('#nowAddSeries').count(),1,'Add present');
  await p.locator('#legend [data-id="payrolls"]').click();
  await p.waitForFunction(()=>document.querySelector('#legend [data-id="payrolls"]')?.classList.contains('active'));
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS','component selection does not navigate');
  await p.locator('#legend [data-id="payrolls"] [data-rm]').click();
  await p.waitForFunction(()=>!document.querySelector('#legend [data-id="payrolls"]'));
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS');
  await p.locator('#crumbIndex22').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / GRW');
  assert.equal(await p.locator('#legend [data-id]').count(),1,'collapsed index-only');
  assert.equal(await p.locator('#legend [data-id="growth"] [data-rm]').count(),0);
  await p.locator('#legend [data-id="growth"]').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / GRW / COMPONENTS');
  assert.equal(await p.locator('#legend [data-id]').count(),8,'anchor re-expands governed basket');
  await p.locator('#nowAddSeries').click();
  await p.locator('#nowPickerSearch').fill('Risk');
  await p.waitForFunction(()=>!!document.querySelector('#nowPicker [data-add-now="risk"]'));
  await p.locator('#nowPicker [data-add-now="risk"]').click();
  await p.waitForFunction(()=>!!document.querySelector('#legend [data-id="risk"]'));
  assert.equal(await p.locator('#legend [data-id="spy"]').count(),0,'adding derived RSK does not expand its basket');
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS');
  await p.locator('#legend [data-id="risk"] [data-rm]').click();
  await p.locator('#crumbEnvironment').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.trim()==='ENV');
  assert.equal(await p.locator('#legend .active').count(),0,'return to ENV is neutral');
  assert.equal(await p.locator('#analysisModal').evaluate(el=>el.classList.contains('hidden')),true);
  assert.deepEqual(t.errors,[],`browser errors ${width}`);assert.deepEqual(t.failed,[],`failed resources ${width}`);
  await p.close();
}

try{
  await coreJourney(1280);
  await coreJourney(412);

  // Source directionality and full-resolution crosshair survive Turn 22.
  const d=await makePage({width:412,height:915}),p=d.page;
  await setHz(p,'5YR');
  await p.locator('#legend [data-id="risk"]').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.includes('COMPONENTS'));
  await p.locator('#legend [data-id="spy"]').click();
  const a=await inspectDate(p,'2024-08-12'),b=await inspectDate(p,'2026-09-10');
  assert(b.native>a.native,`SPY native rises ${a.native} -> ${b.native}`);assert(b.idx>a.idx,`SPY index rises ${a.idx} -> ${b.idx}`);
  assert.equal(await p.locator('#nowChart').getAttribute('data-render-density'),'monthly');
  const src=+(await p.locator('#nowChart').getAttribute('data-source-points')),rnd=+(await p.locator('#nowChart').getAttribute('data-rendered-points'));assert(src>rnd,'5YR chart reduces visual point density');
  await p.locator('#crumbEnvironment').click();
  await setHz(p,'5D');await p.locator('#legend [data-id="risk"]').click();
  await p.locator('#nowAddSeries').click();await p.locator('#nowPickerSearch').fill('WTI');
  await p.waitForFunction(()=>!!document.querySelector('#nowPicker [data-add-now="wti"]'));
  assert.equal(await p.locator('#nowPicker [data-add-now="wti"]').isDisabled(),false,'WTI selectable at 5D');
  await p.locator('#nowPickerClose').click();
  assert.deepEqual(d.errors,[]);assert.deepEqual(d.failed,[]);await p.close();

  // Exact visible NOW state flows to AI/Library and Listen controls remain centered on phone.
  const q=await makePage({width:412,height:915,ai:true}),ai=q.page;
  await enterGrowth(ai);
  await ai.locator('#legend [data-id="payrolls"]').click();
  await ai.locator('#nowMoreBtn').click();await ai.locator('#nowAnalyze').click();
  await ai.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));
  await ai.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('Unified NOW state'));
  assert.equal(q.requests.length,1,'one AI request');
  const sys=q.requests[0].messages.find(m=>m.role==='system')?.content||'',marker='Evidence: ',i=sys.indexOf(marker);assert(i>=0,'AI evidence packet');const ev=JSON.parse(sys.slice(i+marker.length));
  assert.equal(ev.lineage,'ENV/GRW/COMPONENTS');assert(ev.chart.series.find(z=>z.id==='growth')?.observationCount>0,'derived GRW in frozen AI state');assert.equal(ev.active,'payrolls');
  await ai.locator('#libListenMode').click();await ai.waitForFunction(()=>!document.querySelector('#libListenBar')?.classList.contains('hidden'));
  assert.equal(await ai.locator('#libListenTitle').count(),0,'redundant Listen title removed');
  assert.match(await ai.locator('#libListenProgress').innerText(),/Response 1 of 1 · Row 1 of/);
  const geom=await ai.evaluate(()=>{let bar=document.querySelector('#libListenBar').getBoundingClientRect(),bs=[...document.querySelectorAll('#libListenBar .libListenControl')].map(x=>x.getBoundingClientRect());return{bar:{l:bar.left,r:bar.right,c:(bar.left+bar.right)/2},bs:bs.map(b=>({l:b.left,r:b.right})),vw:innerWidth}});
  assert.equal(geom.bs.length,5);for(const b0 of geom.bs){assert(b0.l>=geom.bar.l-1&&b0.r<=geom.bar.r+1&&b0.l>=0&&b0.r<=geom.vw,'Listen control clipped')}
  const controlsCenter=(geom.bs[0].l+geom.bs.at(-1).r)/2;assert(Math.abs(controlsCenter-geom.bar.c)<8,'Listen controls centered');
  await ai.locator('#libListenPlay').click();assert.equal(await ai.locator('#libListenPlay').innerText(),'⏸');
  assert.deepEqual(q.errors,[]);assert.deepEqual(q.failed,[]);await ai.close();

  // CONFIG remains operable.
  const c=await makePage({width:412,height:915}),cp=c.page;await cp.locator('#settingsGear').click();await cp.locator('[data-cfgtab="chart"]').click();assert.equal(await cp.locator('[data-style-slot]').count(),10);assert.equal(await cp.locator('[data-width-slot]').count(),10);await cp.locator('#configClose').click();assert.deepEqual(c.errors,[]);await cp.close();

  console.log('TURN 22 UNIFIED NOW + ADD + TTS + REGRESSION QA: PASS');
} finally {await browser.close()}
