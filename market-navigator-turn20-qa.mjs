import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn20-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function makePage({ai=false}={}){
  const page=await browser.newPage({viewport:{width:412,height:915}}),errors=[],failed=[],requests=[];
  await page.addInitScript(()=>{class U{constructor(text){this.text=String(text);this.rate=1}};Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){},pause(){},resume(){}},configurable:true})});
  if(ai)await page.addInitScript(()=>localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify({defaultProvider:'openrouter',providers:{openrouter:{verified:true,key:'qa-key',model:'qa-model'}}})));
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400&&!/favicon/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  if(ai)await page.route('https://openrouter.ai/api/v1/chat/completions',async r=>{requests.push(r.request().postDataJSON());await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Turn 20 QA\n\nDerived growth evidence is available and included.'}}]})})});
  await page.goto(url,{waitUntil:'networkidle'});
  if(!(await page.locator('#rail').evaluate(el=>el.classList.contains('closed'))))await page.locator('#toggle').click();
  return{page,errors,failed,requests};
}

async function useReportedHorizon(page){
  await page.locator('#hzs [data-h="5YR"]').click();
  await page.waitForFunction(()=>document.querySelector('#hzs [data-h="5YR"]')?.classList.contains('on'));
}
async function addSeries(page,query,id){
  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill(query);
  await page.waitForFunction(id=>!!document.querySelector(`#pickerList [data-add="${id}"]`),id);
  const b=page.locator(`#pickerList [data-add="${id}"]`);
  assert.equal(await b.isDisabled(),false,`${id} add enabled`);
  await b.click();
  await page.waitForFunction(id=>!!document.querySelector(`#seriesBar [data-id="${id}"]`),id);
}

async function openGrowthDerived(page){
  await page.locator('#legend [data-id="growth"]').click();
  await page.waitForFunction(()=>!!document.querySelector('#legend [data-id="growth"]')&&!!document.querySelector('#legend [data-id="payrolls"]'));
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / GRW');
  await page.locator('#legend [data-id="growth"]').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.match((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),/^ENV \/ GRW \/ GRW/);
  assert((+(await page.locator('#analysisChart').getAttribute('data-source-points')))>0,'derived GRW standalone has points');
}

try{
  // Full drill lifecycle and corrected component-leaf semantics, using the owner's 5YR case.
  const a=await makePage(),page=a.page;
  assert.equal((await page.locator('#nowCrumb').innerText()).trim(),'ENV');
  await useReportedHorizon(page);
  await openGrowthDerived(page);
  await addSeries(page,'PCE','corePce');
  await addSeries(page,'Payroll','payrolls');
  await addSeries(page,'Unemployment','unemployment');
  const crumb=(await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim();
  assert.match(crumb,/^ENV \/ GRW \/ PCE \+ 2 Components$/,'derived parent excluded from component leaf/count');
  assert.equal(await page.locator('#seriesBar [data-id]').count(),4,'GRW remains plotted context plus three raw series');
  await page.locator('#seriesBar [data-id="unemployment"]').click();
  assert.equal((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),crumb,'bottom-level selection does not mutate root breadcrumb');
  await page.locator('#crumbComponentIndex').click();
  await page.waitForFunction(()=>document.querySelector('#analysisModal')?.classList.contains('hidden'));
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / GRW','component INDEX ancestor drills up exactly one level');
  assert.equal(await page.locator('#legend [data-id="payrolls"]').isDisabled(),false,'reported-horizon payroll component remains drillable');
  await page.locator('#legend [data-id="payrolls"]').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.match((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),/^ENV \/ GRW \/ PAY/,'INDEX component chip drills down');
  await page.locator('#crumbComponentEnvironment').click();
  await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.trim()==='ENV');
  assert.equal((await page.locator('#nowCrumb').innerText()).trim(),'ENV','COMPONENT ENV ancestor drills to ENV');
  assert.deepEqual(a.errors,[],'lifecycle browser errors');
  assert.deepEqual(a.failed,[],'lifecycle failed resources');
  await page.close();

  // AI POV must consume the exact rendered snapshot, preserving derived GRW.
  const b=await makePage({ai:true}),ai=b.page;
  await useReportedHorizon(ai);
  await openGrowthDerived(ai);
  await addSeries(ai,'PCE','corePce');
  await addSeries(ai,'Payroll','payrolls');
  await addSeries(ai,'Unemployment','unemployment');
  assert.match((await ai.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),/^ENV \/ GRW \/ PCE \+ 2 Components$/);
  await ai.locator('#moreBtn').click();
  await ai.locator('#moreAI').click();
  await ai.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));
  await ai.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('Derived growth evidence is available'));
  assert.equal(b.requests.length,1,'one AI request');
  const sys=b.requests[0].messages.find(m=>m.role==='system')?.content||'';
  const marker='Evidence: ',i=sys.indexOf(marker);assert(i>=0,'AI evidence packet present');
  const evidence=JSON.parse(sys.slice(i+marker.length));
  const grw=evidence.chart.series.find(z=>z.id==='growth');
  assert(grw,'GRW present in AI evidence');
  assert.equal(grw.available,true,'GRW remains available in AI evidence');
  assert(grw.observationCount>0,'GRW AI evidence has observations');
  const stored=await ai.evaluate(async()=>{let db=await new Promise((resolve,reject)=>{let r=indexedDB.open('marketNavigatorLocal',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});let rows=await new Promise((resolve,reject)=>{let r=db.transaction('analyses').objectStore('analyses').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return rows.sort((x,y)=>String(y.updatedAt).localeCompare(String(x.updatedAt)))[0]});
  assert.equal(stored.state.root,'corePce','first raw series becomes component root');
  const savedGrw=stored.state.chart.series.find(z=>z.id==='growth');
  assert(savedGrw&&savedGrw.available&&savedGrw.points.length>0,'Library snapshot preserves visible GRW curve');
  assert.equal(await ai.locator('#libChartLegend [data-lib-series="growth"]').count(),1,'Library chart restores GRW legend');
  assert((+(await ai.locator('#libChart').getAttribute('data-source-points')))>0,'Library chart has plotted evidence');
  assert.deepEqual(b.errors,[],'AI browser errors');
  assert.deepEqual(b.failed,[],'AI failed resources');
  await ai.close();

  console.log('TURN 20 LIFECYCLE + AI SNAPSHOT QA: PASS');
} finally {await browser.close()}
