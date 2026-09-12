import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn24-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function analysisCount(page){return await page.evaluate(()=>new Promise((resolve,reject)=>{let r=indexedDB.open('marketNavigatorLocal',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{let q=r.result.transaction('analyses').objectStore('analyses').count();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)}}))}
async function pageBase({width=1280,height=800,registry=null,failAI=false}={}){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[],seriesRequests=[];
  await page.addInitScript(({registry})=>{
    class U{constructor(text){this.text=String(text);this.rate=1}}
    Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});
    Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){},pause(){},resume(){}},configurable:true});
    window.__opened=[];window.open=(u)=>{window.__opened.push(String(u));return null};
    if(registry)localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify(registry));
  },{registry});
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('request',r=>{if(/market-evidence\/series\/.+\.json/.test(r.url()))seriesRequests.push(r.url())});
  page.on('response',r=>{if(r.status()>=400&&!/favicon|openrouter\.ai/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  if(registry?.providers?.openrouter?.verified)await page.route('https://openrouter.ai/api/v1/chat/completions',r=>r.fulfill(failAI?{status:500,contentType:'application/json',body:JSON.stringify({error:{message:'QA provider failure'}})}:{status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Turn 24 QA\n\nRecovered AI launch.'}}]})}));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="growth"]'));
  return{page,errors,failed,seriesRequests};
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
async function enter(p,id){await p.locator(`#legend [data-id="${id}"]`).click();await p.waitForFunction(id=>document.querySelector('#legend [data-id="'+id+'"]'),id)}
async function state(p){return await p.evaluate(()=>({h:[...document.querySelectorAll('#hzs .hz')].find(x=>x.classList.contains('on'))?.dataset.h||'',crumb:document.querySelector('#nowCrumb')?.textContent.replace(/\s+/g,' ').trim(),ids:[...document.querySelectorAll('#legend [data-id]')].map(x=>x.dataset.id),active:document.querySelector('#legend .active')?.dataset.id||null,card:(()=>{let r=document.querySelector('.chartCard').getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right}})(),canvas:(()=>{let r=document.querySelector('#nowChart').getBoundingClientRect();return{w:r.width,h:r.height}})()}))}

async function geometryCase(index=null){
  const t=await pageBase(),p=t.page;
  if(index)await enter(p,index);
  await p.locator('#hzs [data-h="3YR"]').click();
  await p.waitForFunction(()=>document.querySelector('#hzs [data-h="3YR"]')?.classList.contains('on'));
  await p.waitForTimeout(120);
  const before=await state(p),req=t.seriesRequests.length;
  for(let i=0;i<3;i++){
    const old=await state(p);await p.locator('#toggle').click();await p.waitForTimeout(220);const now=await state(p);
    assert(Math.abs(now.card.top-before.card.top)<2,`${index||'ENV'} card top pinned`);
    assert(Math.abs(now.card.bottom-before.card.bottom)<2,`${index||'ENV'} card bottom pinned`);
    assert.equal(now.h,'3YR',`${index||'ENV'} horizon invariant`);
    assert.deepEqual(now.ids,before.ids,`${index||'ENV'} composition invariant`);
    assert.equal(now.active,before.active,`${index||'ENV'} active invariant`);
    assert.notEqual(Math.round(now.canvas.w),Math.round(old.canvas.w),`${index||'ENV'} canvas follows rail width`);
  }
  assert.equal(t.seriesRequests.length,req,`${index||'ENV'} rail geometry creates no evidence fetch`);
  assert.deepEqual(t.errors,[],`${index||'ENV'} no app errors`);assert.deepEqual(t.failed,[],`${index||'ENV'} no required-resource failures`);await p.close();
}

try{
  // Exact regression sequence: horizon change followed by repeated rail collapse/expand.
  await geometryCase(null);
  await geometryCase('growth');
  await geometryCase('risk');
  await geometryCase('macro');

  // Missing/unverified provider: Config AI opens cleanly and no empty Analysis is created.
  const missing=await pageBase({width:412,height:915,registry:{defaultProvider:'openrouter',providers:{openrouter:{verified:false,model:'qa-model'}}}}),mp=missing.page;
  assert.equal(await analysisCount(mp),0);
  await mp.locator('#nowMoreBtn').click();await mp.locator('#nowAnalyze').click();
  await mp.waitForFunction(()=>document.querySelector('#view-config')?.classList.contains('on'));
  assert.match(await mp.locator('#openrouterStatus').innerText(),/Register this provider/i);
  assert.equal(await analysisCount(mp),0,'invalid provider creates no Analysis artifact');
  assert.equal(await mp.locator('#settingsModal').count(),0,'retired settingsModal absent');
  assert.deepEqual(missing.errors,[],'invalid-provider path has no exception');await mp.close();

  // Provider request failure becomes a persisted failed Analysis rather than an uncaught error.
  const reg={defaultProvider:'openrouter',providers:{openrouter:{verified:true,key:'qa-key',model:'qa-model',models:['qa-model']}}};
  const fail=await pageBase({width:412,height:915,registry:reg,failAI:true}),fp=fail.page;
  await fp.locator('#nowMoreBtn').click();await fp.locator('#nowAnalyze').click();
  await fp.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));
  await fp.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('QA provider failure'));
  assert.equal(await analysisCount(fp),1,'provider failure persists one Analysis');
  assert.match(await fp.locator('#transcript').innerText(),/Analysis failed/i);
  assert.deepEqual(fail.errors,[],'provider failure has no uncaught exception');await fp.close();

  // Registered secrets remain hidden/empty; failed replacement is transactional.
  const cred=await pageBase({width:412,height:915,registry:reg,failAI:true}),cp=cred.page;
  await cp.locator('#settingsGear').click();
  const key=cp.locator('#openrouterKey'),replace=cp.locator('[data-replace-key="openrouter"]');
  assert.equal(await key.inputValue(),'','registered key not repopulated');assert.equal(await key.isHidden(),true,'registered key field hidden');assert.equal(await replace.isVisible(),true,'Replace key explicit');
  await replace.click();assert.equal(await key.isVisible(),true);assert.equal(await key.inputValue(),'');await key.fill('bad-replacement');
  await cp.locator('#openrouterValidate').click();await cp.waitForFunction(()=>document.querySelector('#openrouterStatus')?.textContent.includes('QA provider failure'));
  const preserved=await cp.evaluate(()=>JSON.parse(localStorage.getItem('marketNavigatorAIRegistryV1')).providers.openrouter);
  assert.equal(preserved.key,'qa-key','failed replacement preserves working key');assert.equal(preserved.verified,true,'failed replacement preserves verified registration');
  await replace.click();assert.equal(await key.isHidden(),true,'Cancel returns to registered-state display');
  assert.deepEqual(cred.errors,[]);await cp.close();

  // Sources is a governed control-plane handoff; supported horizons come from canonical evidence.
  const src=await pageBase({width:412,height:915}),sp=src.page;
  await sp.locator('#settingsGear').click();await sp.locator('[data-cfgtab="sources"]').click();
  await sp.waitForFunction(()=>document.querySelector('#sourceStatus')?.textContent.includes('Canonical registry refreshed'));
  assert((await sp.locator('#sourceList [data-source-id]').count())>=1,'registered canonical sources listed');
  await sp.locator('#sourceQuery').fill('Dow');await sp.locator('#sourceClass').selectOption('index');await sp.locator('#sourceRegister').click();
  const opened=await sp.evaluate(()=>window.__opened.at(-1)||'');assert(opened.includes('github.com/acmeproducts/stuff/issues/new'),'registration uses authenticated repository control plane');
  const decoded=decodeURIComponent(opened);assert(decoded.includes('[Market Navigator Source] Dow'));assert(decoded.includes('Query: Dow'));assert(decoded.includes('Class: index'));
  await sp.locator('#configClose').click();await enter(sp,'risk');
  await sp.locator('#nowAddSeries').click();await sp.locator('#nowPickerSearch').fill('NVDA');
  await sp.waitForFunction(()=>document.querySelector('[data-add-now="custom_nvda"]'));
  assert.equal(await sp.locator('[data-add-now="custom_nvda"]').isDisabled(),false,'healthy daily custom source available at 5D');
  await sp.locator('#nowPickerClose').click();await sp.locator('#hzs [data-h="1D"]').click();await sp.locator('#nowAddSeries').click();await sp.locator('#nowPickerSearch').fill('NVDA');
  await sp.waitForFunction(()=>document.querySelector('[data-add-now="custom_nvda"]'));
  assert.equal(await sp.locator('[data-add-now="custom_nvda"]').isDisabled(),true,'daily-only custom source cannot fabricate 1D intraday');
  assert.deepEqual(src.errors,[],'Sources path no app errors');assert.deepEqual(src.failed,[],'Sources path required resources healthy');await sp.close();

  console.log('TURN 24 RECOVERY + EDGE-PATH QA: PASS');
} finally {await browser.close()}
