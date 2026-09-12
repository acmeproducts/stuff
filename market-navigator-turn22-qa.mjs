import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn22-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function makePage({width=412,height=915,ai=false}={}){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[],requests=[];
  await page.addInitScript(()=>{
    class U{constructor(text){this.text=String(text);this.rate=1}}
    Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});
    Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){},pause(){},resume(){}},configurable:true});
  });
  if(ai)await page.addInitScript(()=>localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify({defaultProvider:'openrouter',providers:{openrouter:{verified:true,key:'qa-key',model:'qa-model'}}})));
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400&&!/favicon/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  if(ai)await page.route('https://openrouter.ai/api/v1/chat/completions',async r=>{
    requests.push(r.request().postDataJSON());
    await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Turn 22 QA\n\nUnified NOW evidence reached Library intact.'}}]})});
  });
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="growth"]'));
  return{page,errors,failed,requests};
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const crumb=async p=>clean(await p.locator('#nowCrumb').innerText());
async function enter(p,id){const code=id==='growth'?'GRW':id==='risk'?'RSK':'MAC';await p.locator(`#legend [data-id="${id}"]`).click();await p.waitForFunction(code=>document.querySelector('#nowCrumb')?.textContent.includes(code),code)}
async function pickerAdd(p,query,id){await p.locator('#nowAddSeries').click();await p.locator('#nowPickerSearch').fill(query);await p.waitForFunction(id=>document.querySelector(`[data-add-now="${id}"]`),id);let b=p.locator(`[data-add-now="${id}"]`);assert.equal(await b.isDisabled(),false,`${id} Add enabled`);await b.click();await p.waitForFunction(id=>document.querySelector(`#legend [data-id="${id}"]`),id)}
async function noOverflow(p,label){let ok=await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.body.scrollWidth<=innerWidth+1);assert(ok,`${label} has no horizontal page overflow`)}

async function architecture(width){
  const t=await makePage({width,height:width<700?915:800}),p=t.page;
  assert.equal(await p.locator('[data-view="explore"]').count(),0,'Explore nav retired');
  assert.equal(await p.locator('#view-explore').count(),0,'Explore view retired');
  assert.equal(await p.locator('#analysisModal').count(),0,'retired Component modal physically absent');
  assert.equal(await crumb(p),'ENV');
  assert.equal(await p.locator('#legend [data-id]').count(),3,'ENV has three derived indices');
  assert.equal(await p.locator('#legend .active').count(),0,'ENV boots neutral');
  assert.equal(await p.locator('#nowChart').getAttribute('data-emphasis'),'false','ENV has no default emphasis');
  await noOverflow(p,`ENV ${width}`);

  await enter(p,'growth');
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS');
  assert.equal(await p.locator('#nowCrumb button.crumbBtn').count(),2,'only ENV and GRW breadcrumb levels clickable');
  assert.equal(await p.locator('#nowCrumb button:has-text("COMPONENTS")').count(),0,'COMPONENTS is a state label, not navigation');
  assert.equal(await p.locator('#legend [data-id="growth"] [data-rm]').count(),0,'index anchor cannot be removed');
  assert((await p.locator('#legend [data-rm]').count())>0,'governed component chips are removable');
  assert.equal(await p.locator('#nowAddSeries').count(),1,'Add discovery is present in NOW');
  await noOverflow(p,`GRW components ${width}`);

  await p.locator('#crumbIndex22').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / GRW');
  assert.equal(await p.locator('#legend [data-id]').count(),1,'index breadcrumb collapses to index-only');
  await p.locator('#legend [data-id="growth"]').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / GRW / COMPONENTS');
  assert((await p.locator('#legend [data-id]').count())>1,'sole index chip re-expands governed basket');

  await pickerAdd(p,'SPY','spy');
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS','arbitrary Add does not change hierarchy breadcrumb');
  assert.equal(await p.locator('#legend [data-id="spy"] [data-rm]').count(),1,'arbitrary comparison is removable');
  await p.locator('#legend [data-id="spy"]').click();
  await p.waitForFunction(()=>document.querySelector('#legend [data-id="spy"]')?.classList.contains('active'));
  await p.locator('#nowMoreBtn').click();await p.locator('#nowData').click();
  await p.waitForFunction(()=>!document.querySelector('#dataModal')?.classList.contains('hidden'));
  assert((await p.locator('#dataRows tr').count())>20,'Data uses full canonical history');
  assert((await p.locator('#dataRows tr[data-active="true"][data-series="spy"]').count())>0,'visible active series is frozen as Data reference');
  await p.locator('#dataClose').click();

  await p.locator('#crumbEnvironment').click();
  await p.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.trim()==='ENV');
  assert.equal(await p.locator('#legend .active').count(),0,'ENV return is neutral');
  await noOverflow(p,`return ENV ${width}`);
  assert.deepEqual(t.errors,[],`browser errors ${width}`);assert.deepEqual(t.failed,[],`failed resources ${width}`);
  await p.close();
}

try{
  await architecture(1280);
  await architecture(412);

  // Short-horizon evidence truth: WTI must remain directly selectable; GDP transform remains cadence-aware selectable.
  const e=await makePage({width:412,height:915}),ep=e.page;
  await enter(ep,'risk');
  await pickerAdd(ep,'WTI','wti');
  assert.equal(await crumb(ep),'ENV / RSK / COMPONENTS');
  assert((+(await ep.locator('#nowChart').getAttribute('data-source-points')))>0,'WTI contributes real 5D chart evidence');
  await ep.locator('#legend [data-id="wti"] [data-rm]').click();
  await ep.locator('#nowAddSeries').click();await ep.locator('#nowPickerSearch').fill('GDP');
  await ep.waitForFunction(()=>document.querySelector('[data-add-now="gdpQoq"]')||document.querySelector('[data-add-now="gdpYoy"]'));
  let g=ep.locator('[data-add-now="gdpQoq"]').first();if(!(await g.count()))g=ep.locator('[data-add-now="gdpYoy"]').first();
  assert.equal(await g.isDisabled(),false,'periodic GDP transform remains selectable at 5D without fabricating daily source observations');
  await ep.locator('#nowPickerClose').click();
  assert.deepEqual(e.errors,[]);assert.deepEqual(e.failed,[]);await ep.close();

  // Exact visible state -> AI -> persisted Library; also verifies source-relative indexing direction and phone Listen geometry.
  const q=await makePage({width:412,height:915,ai:true}),ai=q.page;
  await enter(ai,'growth');await pickerAdd(ai,'SPY','spy');
  await ai.locator('#legend [data-id="spy"]').click();await ai.waitForFunction(()=>document.querySelector('#legend [data-id="spy"]')?.classList.contains('active'));
  await ai.locator('#nowMoreBtn').click();await ai.locator('#nowAnalyze').click();
  await ai.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));
  await ai.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('Unified NOW evidence'));
  assert.equal(q.requests.length,1,'one AI request');
  const sys=q.requests[0].messages.find(m=>m.role==='system')?.content||'',marker='Evidence: ',i=sys.indexOf(marker);assert(i>=0,'AI evidence packet present');
  const ev=JSON.parse(sys.slice(i+marker.length));
  assert.equal(ev.lineage,'ENV/GRW/COMPONENTS');assert.equal(ev.active,'spy','active visible series reaches frozen AI evidence');
  const sp=ev.chart.series.find(z=>z.id==='spy');assert(sp&&sp.observationCount>0,'SPY evidence reaches AI');
  if(sp.first&&sp.last&&sp.first.raw!==sp.last.raw&&sp.first.idx!==sp.last.idx)assert.equal(Math.sign(sp.last.raw-sp.first.raw),Math.sign(sp.last.idx-sp.first.idx),'Indexed 100 direction matches source direction');
  assert(ev.chart.series.find(z=>z.id==='growth')?.observationCount>0,'derived GRW anchor retained in frozen AI state');

  assert.equal(await ai.locator('#libListenTitle').count(),0,'redundant Listen title removed');
  await ai.locator('#libListenMode').click();await ai.waitForFunction(()=>!document.querySelector('#libListenBar')?.classList.contains('hidden'));
  assert.match(await ai.locator('#libListenProgress').innerText(),/Response 1 of 1 · Row 1 of/);
  const geom=await ai.evaluate(()=>{let bar=document.querySelector('#libListenBar').getBoundingClientRect(),bs=[...document.querySelectorAll('#libListenBar .libListenControl')].map(x=>x.getBoundingClientRect());return{bar:{l:bar.left,r:bar.right,c:(bar.left+bar.right)/2},bs:bs.map(b=>({l:b.left,r:b.right})),vw:innerWidth}});
  assert.equal(geom.bs.length,5);for(const b of geom.bs)assert(b.l>=geom.bar.l-1&&b.r<=geom.bar.r+1&&b.l>=0&&b.r<=geom.vw,'Listen control clipped');
  assert(Math.abs((geom.bs[0].l+geom.bs.at(-1).r)/2-geom.bar.c)<8,'five Listen controls centered');
  await ai.locator('#libListenPlay').click();assert.equal(await ai.locator('#libListenPlay').innerText(),'⏸');
  await noOverflow(ai,'Library phone');
  assert.deepEqual(q.errors,[]);assert.deepEqual(q.failed,[]);await ai.close();

  // Horizon render-density and CONFIG contracts remain intact.
  const c=await makePage({width:412,height:915}),cp=c.page;
  await enter(cp,'risk');
  await cp.locator('#hzs [data-h="3YR"]').click();await cp.waitForFunction(()=>document.querySelector('#hzs [data-h="3YR"]')?.classList.contains('on'));
  assert.equal(await cp.locator('#nowChart').getAttribute('data-render-density'),'monthly');
  let src=+(await cp.locator('#nowChart').getAttribute('data-source-points')),rnd=+(await cp.locator('#nowChart').getAttribute('data-rendered-points'));assert(src>=rnd&&src>0,'3YR rendering is display-density only');
  await cp.locator('#settingsGear').click();await cp.locator('[data-cfgtab="chart"]').click();assert.equal(await cp.locator('[data-style-slot]').count(),10);assert.equal(await cp.locator('[data-width-slot]').count(),10);await cp.locator('#configClose').click();
  assert.deepEqual(c.errors,[]);assert.deepEqual(c.failed,[]);await cp.close();

  console.log('TURN 22 UNIFIED NOW ARCHITECTURE QA: PASS');
} finally {await browser.close()}
