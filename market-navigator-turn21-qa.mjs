import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn21-pre-ship.html';
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
  if(ai)await page.route('https://openrouter.ai/api/v1/chat/completions',async r=>{requests.push(r.request().postDataJSON());await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Turn 21 QA\n\nParent growth context and source-relative evidence are present.'}}]})})});
  await page.goto(url,{waitUntil:'networkidle'});
  if(!(await page.locator('#rail').evaluate(el=>el.classList.contains('closed'))))await page.locator('#toggle').click();
  await page.locator('#hzs [data-h="5YR"]').click();
  await page.waitForFunction(()=>document.querySelector('#hzs [data-h="5YR"]')?.classList.contains('on'));
  return{page,errors,failed,requests};
}

async function longPress(page,locator){
  await locator.scrollIntoViewIfNeeded();
  const box=await locator.boundingBox(); assert(box,'long-press target box');
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
}

function tipNumbers(text){
  const t=text.replace(/\s+/g,' '),m=t.match(/idx\s+(-?[\d,.]+)\s+·\s+value\s+(-?[\d,.]+)/i);
  assert(m,`crosshair has indexed and native values: ${t}`);
  return{idx:+m[1].replace(/,/g,''),native:+m[2].replace(/,/g,''),text:t};
}

async function inspectDate(page,iso){
  const box=await page.locator('#nowChart').boundingBox(); assert(box,'NOW canvas box');
  const start=Date.parse('2021-09-10T00:00:00Z'),end=Date.parse('2026-09-10T23:59:59Z'),target=Date.parse(iso+'T12:00:00Z');
  const left=48,right=12,frac=(target-start)/(end-start),x=box.x+left+frac*(box.width-left-right),y=box.y+Math.min(120,box.height/3);
  await page.mouse.move(Math.min(box.x+box.width-right-1,Math.max(box.x+left+1,x)),y);
  await page.waitForFunction(()=>document.querySelector('#nowTip')?.style.display==='block');
  return tipNumbers(await page.locator('#nowTip').innerText());
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

try{
  // 1) User-reported RSK/SPY crosshair: source Indexed 100 must move with native SPY, not inverse contribution direction.
  const a=await makePage(),page=a.page;
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / RSK');
  await longPress(page,page.locator('#legend [data-id="spy"]'));
  await page.locator('#info').waitFor({state:'visible'});
  await page.locator('#info [data-info-close]').click();
  const p2024=await inspectDate(page,'2024-08-12');
  const p2026=await inspectDate(page,'2026-09-10');
  assert(p2026.native>p2024.native,`SPY native rises: ${p2024.native} -> ${p2026.native}`);
  assert(p2026.idx>p2024.idx,`SPY Indexed 100 must rise with native: ${p2024.idx} -> ${p2026.idx}`);

  // Parent INDEX chip is terminal at INDEX depth: no ENV/RSK/RSK state.
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#analysisModal').evaluate(el=>el.classList.contains('hidden')),true,'RSK parent tap stays out of COMPONENT');
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / RSK');

  // Growth lifecycle: parent remains context, raw child owns COMPONENT leaf, and raw-only count excludes GRW.
  await page.locator('#crumbEnvironment').click();
  await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.trim()==='ENV');
  await page.locator('#legend [data-id="growth"]').click();
  await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim()==='ENV / GRW');
  await page.locator('#legend [data-id="growth"]').click();
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#analysisModal').evaluate(el=>el.classList.contains('hidden')),true,'GRW self-drill prohibited');
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / GRW');
  await page.locator('#legend [data-id="payrolls"]').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  const firstCrumb=(await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim();
  assert.match(firstCrumb,/^ENV \/ GRW \/ (?!GRW(?:\s|$)).+$/,'raw child owns leaf; no duplicate index token');
  assert.equal(await page.locator('#seriesBar [data-id="growth"]').count(),1,'GRW retained as plotted parent context');
  assert.equal(await page.locator('#seriesBar [data-id="payrolls"]').count(),1,'selected raw child retained');
  await addSeries(page,'PCE','corePce');
  await addSeries(page,'Unemployment','unemployment');
  const expanded=(await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim();
  assert.match(expanded,/^ENV \/ GRW \/ (?!GRW(?:\s|$)).+ \+ 2 Components$/,'parent index excluded from raw component count');
  assert(!/ENV \/ GRW \/ GRW/.test(expanded),'duplicate GRW breadcrumb impossible');
  const before=expanded;
  await page.locator('#seriesBar [data-id="growth"]').click();
  assert.equal((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),before,'bottom-level parent-context selection does not mutate leaf');
  assert.deepEqual(a.errors,[],'browser errors');
  assert.deepEqual(a.failed,[],'failed resources');
  await page.close();

  // 2) Preserve Turn 20 AI/Library truth on the now-valid hierarchy path.
  const b=await makePage({ai:true}),ai=b.page;
  await ai.locator('#legend [data-id="growth"]').click();
  await ai.locator('#legend [data-id="payrolls"]').click();
  await ai.locator('#analysisModal').waitFor({state:'visible'});
  await addSeries(ai,'PCE','corePce');
  await addSeries(ai,'Unemployment','unemployment');
  assert(!/ENV \/ GRW \/ GRW/.test((await ai.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim()));
  await ai.locator('#moreBtn').click();
  await ai.locator('#moreAI').click();
  await ai.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));
  await ai.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('Parent growth context'));
  assert.equal(b.requests.length,1,'one AI request');
  const sys=b.requests[0].messages.find(m=>m.role==='system')?.content||'',marker='Evidence: ',i=sys.indexOf(marker);assert(i>=0,'AI evidence packet present');
  const evidence=JSON.parse(sys.slice(i+marker.length)),grw=evidence.chart.series.find(z=>z.id==='growth');
  assert(grw&&grw.available&&grw.observationCount>0,'derived GRW remains available in exact frozen AI chart state');
  const stored=await ai.evaluate(async()=>{let db=await new Promise((resolve,reject)=>{let r=indexedDB.open('marketNavigatorLocal',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});let rows=await new Promise((resolve,reject)=>{let r=db.transaction('analyses').objectStore('analyses').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return rows.sort((x,y)=>String(y.updatedAt).localeCompare(String(x.updatedAt)))[0]});
  assert.equal(stored.state.root,'payrolls','raw child remains canonical COMPONENT root');
  assert(stored.state.chart.series.find(z=>z.id==='growth')?.points?.length>0,'Library snapshot preserves GRW parent context');
  assert.deepEqual(b.errors,[],'AI browser errors');
  assert.deepEqual(b.failed,[],'AI failed resources');
  await ai.close();

  console.log('TURN 21 SOURCE INDEX + HIERARCHY + AI QA: PASS');
} finally {await browser.close()}
