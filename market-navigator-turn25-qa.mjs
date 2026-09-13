import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn25-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function analysisCount(page){return await page.evaluate(()=>new Promise((resolve,reject)=>{let r=indexedDB.open('marketNavigatorLocal',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{let q=r.result.transaction('analyses').objectStore('analyses').count();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)}}))}
async function makePage({width=1280,height=800,registry=null,failAI=false,android=false}={}){
  const context=await browser.newContext({viewport:{width,height},userAgent:android?'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/153 Mobile Safari/537.36':undefined});
  const page=await context.newPage(),errors=[],failed=[],seriesRequests=[],providerConsole=[];
  await page.addInitScript(({registry})=>{
    class U{constructor(text){this.text=String(text);this.rate=1;this.onend=null;this.onerror=null}}
    const speech={last:null,cancelCount:0,pauseCount:0,resumeCount:0,paused:false,speak(u){this.last=u;this.paused=false},cancel(){this.cancelCount++;this.paused=false},pause(){this.pauseCount++;this.paused=true},resume(){this.resumeCount++;this.paused=false}};
    Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});
    Object.defineProperty(window,'speechSynthesis',{value:speech,configurable:true});
    window.__qaSpeech=speech;window.__opened=[];window.open=(u)=>{window.__opened.push(String(u));return null};
    if(registry)localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify(registry));
  },{registry});
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error'){let text=m.text();if(failAI&&/500 \(Internal Server Error\)/.test(text))providerConsole.push(text);else errors.push(`console: ${text}`)}});
  page.on('request',r=>{if(/market-evidence\/series\/.+\.json/.test(r.url()))seriesRequests.push(r.url())});
  page.on('response',r=>{if(r.status()>=400&&!/favicon|openrouter\.ai/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  if(registry?.providers?.openrouter?.verified)await page.route('https://openrouter.ai/api/v1/chat/completions',r=>r.fulfill(failAI?{status:500,contentType:'application/json',body:JSON.stringify({error:{message:'QA provider failure'}})}:{status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Consolidated QA\n\nAll approved capabilities reached Library.'}}]})}));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="growth"]'));
  return{context,page,errors,failed,seriesRequests,providerConsole};
}
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const crumb=async p=>clean(await p.locator('#nowCrumb').innerText());
async function settle(p){await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}
async function enter(p,id){let code=id==='growth'?'GRW':id==='risk'?'RSK':'MAC';await p.locator(`#legend [data-id="${id}"]`).click();await p.waitForFunction(code=>window.clean(document.querySelector('#nowCrumb')?.textContent)===`ENV / ${code} / COMPONENTS`,code)}
async function pickerAdd(p,query,id){await p.locator('#nowAddSeries').click();await p.locator('#nowPickerSearch').fill(query);await p.waitForFunction(id=>document.querySelector(`[data-add-now="${id}"]`),id);let b=p.locator(`[data-add-now="${id}"]`);assert.equal(await b.isDisabled(),false,`${id} Add enabled`);await b.click();await p.waitForFunction(id=>document.querySelector(`#legend [data-id="${id}"]`),id)}
async function noOverflow(p,label){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.body.scrollWidth<=innerWidth+1),`${label} no page overflow`)}

async function architecture(width){
  const t=await makePage({width,height:width<700?915:800}),p=t.page;
  assert.equal(await p.locator('[data-view="explore"]').count(),0,'Explore nav physically retired');
  assert.equal(await p.locator('#view-explore').count(),0,'Explore view physically retired');
  assert.equal(await p.locator('#analysisModal').count(),0,'Component modal physically retired');
  assert.equal(await crumb(p),'ENV');
  assert.equal(await p.locator('#legend [data-id]').count(),3,'ENV exact three indices');
  assert.equal(await p.locator('#legend [data-id].active').count(),0,'ENV has no active legend chip on boot');
  assert.equal(await p.locator('#nowChart').getAttribute('data-emphasis'),'false','ENV chart has no emphasis on boot');
  await enter(p,'growth');
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS');
  assert.equal(await p.locator('#legend [data-id="growth"] [data-rm]').count(),0,'anchor immutable');
  assert((await p.locator('#legend [data-rm]').count())>0,'components removable');
  assert.equal(await p.locator('#nowAddSeries').count(),1,'Add inside NOW');
  await p.locator('#crumbIndex22').click();await p.waitForFunction(()=>window.clean(document.querySelector('#nowCrumb')?.textContent)==='ENV / GRW');
  assert.equal(await p.locator('#legend [data-id]').count(),1,'index collapse');
  await p.locator('#legend [data-id="growth"]').click();await p.waitForFunction(()=>window.clean(document.querySelector('#nowCrumb')?.textContent)==='ENV / GRW / COMPONENTS');
  await pickerAdd(p,'SPY','spy');
  assert.equal(await crumb(p),'ENV / GRW / COMPONENTS','comparison does not alter hierarchy');
  await p.locator('#legend [data-id="spy"]').click();await p.waitForFunction(()=>document.querySelector('#legend [data-id="spy"]')?.classList.contains('active'));
  await p.locator('#nowMoreBtn').click();await p.locator('#nowData').click();await p.waitForFunction(()=>!document.querySelector('#dataModal')?.classList.contains('hidden'));
  assert((await p.locator('#dataRows tr').count())>20,'Data uses full canonical history');
  assert((await p.locator('#dataRows tr[data-active="true"][data-series="spy"]').count())>0,'active series is Data reference');
  await p.locator('#dataClose').click();
  await p.locator('#crumbEnvironment').click();await p.waitForFunction(()=>window.clean(document.querySelector('#nowCrumb')?.textContent)==='ENV');
  assert.equal(await p.locator('#legend [data-id].active').count(),0,'return ENV neutral');
  await noOverflow(p,`architecture ${width}`);
  assert.deepEqual(t.errors,[]);assert.deepEqual(t.failed,[]);await t.context.close();
}

async function geometryCase(index=null){
  const t=await makePage(),p=t.page;if(index)await enter(p,index);
  await p.locator('#hzs [data-h="3YR"]').click();await p.waitForFunction(()=>document.querySelector('#hzs [data-h="3YR"]')?.classList.contains('on')&&document.querySelector('#nowChart')?.dataset.renderDensity==='monthly');await settle(p);await p.waitForTimeout(80);
  const snap=()=>p.evaluate(()=>({h:[...document.querySelectorAll('#hzs .hz')].find(x=>x.classList.contains('on'))?.dataset.h,crumb:window.clean(document.querySelector('#nowCrumb')?.textContent),ids:[...document.querySelectorAll('#legend [data-id]')].map(x=>x.dataset.id),active:document.querySelector('#legend [data-id].active')?.dataset.id||null,card:(()=>{let r=document.querySelector('.chartCard').getBoundingClientRect();return{top:r.top,bottom:r.bottom}})(),canvas:document.querySelector('#nowChart').getBoundingClientRect().width}));
  const before=await snap(),req=t.seriesRequests.length;
  for(let i=0;i<3;i++){let old=await snap();await p.locator('#toggle').click();await p.waitForTimeout(190);await settle(p);let now=await snap();assert(Math.abs(now.card.top-before.card.top)<2,'top pinned');assert(Math.abs(now.card.bottom-before.card.bottom)<2,'bottom pinned');assert.equal(now.h,'3YR');assert.deepEqual(now.ids,before.ids);assert.equal(now.active,before.active);assert.notEqual(Math.round(now.canvas),Math.round(old.canvas),'canvas follows rail width')}
  assert.equal(t.seriesRequests.length,req,'geometry causes no evidence requests');assert.deepEqual(t.errors,[]);assert.deepEqual(t.failed,[]);await t.context.close();
}

async function injectTTSAnalysis(p){await p.evaluate(async()=>{const rec={id:'qa-tts25',title:'QA Browser TTS',status:'ready',createdAt:'2099-01-01T00:00:00Z',updatedAt:'2099-01-01T00:00:00Z',state:{horizon:'5D',series:['spy'],active:'spy',index:'risk',evidence:[],chart:{schema:'market-navigator-chart-snapshot-v1',origin:'qa',horizon:'5D',window:{horizon:'5D',start:1788220800000,end:1788998399000,startLabel:'2026-09-01',endLabel:'2026-09-09'},mode:'native',active:'spy',series:[{id:'spy',label:'SPY',full:'SPY',unit:'USD',color:'#27D3F5',renderType:'line',axis:0,axisLabel:'USD',available:true,points:[{t:1788307200000,sourceT:1788307200000,v:100,raw:100,idx:100},{t:1788393600000,sourceT:1788393600000,v:101,raw:101,idx:101}]}],dataRevision:{derived:'qa'}}},turns:[{role:'assistant',content:'# First analysis\n\nFirst sentence. Second sentence.',at:'2099-01-01T00:00:00Z'},{role:'user',content:'Follow up',at:'2099-01-01T00:01:00Z'},{role:'assistant',content:'## Second analysis\n\nThird sentence.',at:'2099-01-01T00:02:00Z'}]};await new Promise((resolve,reject)=>{const r=indexedDB.open('marketNavigatorLocal',1);r.onsuccess=()=>{const tx=r.result.transaction('analyses','readwrite');tx.objectStore('analyses').put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)})})}
async function ttsCase(android=false){
  const t=await makePage({width:412,height:915,android}),p=t.page;await injectTTSAnalysis(p);await p.reload({waitUntil:'networkidle'});await p.locator('[data-view="library"]').click();await p.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Browser TTS');
  assert.equal(await p.locator('#libListenTitle').count(),0,'no duplicate Listen title');await p.locator('#libListenMode').click();await p.waitForFunction(()=>!document.querySelector('#libListenBar')?.classList.contains('hidden'));
  assert.equal(await p.locator('#libListenBar .libListenControl').count(),5,'exactly five controls');assert.match(await p.locator('#libListenProgress').innerText(),/Response 1 of 2 · Row 1 of/);
  await p.locator('#libListenPlay').click();assert(await p.evaluate(()=>window.__qaSpeech.last?.text?.length>0),'non-empty utterance handed to speech engine');let first=await p.evaluate(()=>window.__qaSpeech.last.text);
  await p.locator('#libListenNextTurn').click();await p.waitForFunction(()=>document.querySelector('#libListenProgress')?.textContent.includes('Response 2 of 2'));await p.locator('#libListenPlay').click();let second=await p.evaluate(()=>window.__qaSpeech.last?.text||'');assert(second&&second!==first,'response navigation changes spoken content');
  await p.locator('#libListenPlay').click();if(android){assert((await p.evaluate(()=>window.__qaSpeech.cancelCount))>0,'Android pause path cancels ended utterance');assert.equal(await p.evaluate(()=>window.__qaSpeech.pauseCount),0,'Android does not pretend pause is resumable');await p.locator('#libListenPlay').click();assert(await p.evaluate(()=>window.__qaSpeech.last?.text?.length>0),'Android resume restarts current row truthfully')}else{assert((await p.evaluate(()=>window.__qaSpeech.pauseCount))>0,'desktop pause used');await p.locator('#libListenPlay').click();assert((await p.evaluate(()=>window.__qaSpeech.resumeCount))>0,'desktop resume used')}
  const g=await p.evaluate(()=>{let bar=document.querySelector('#libListenBar').getBoundingClientRect(),bs=[...document.querySelectorAll('#libListenBar .libListenControl')].map(x=>x.getBoundingClientRect());return{bar,bs,vw:innerWidth}});for(let b of g.bs)assert(b.left>=g.bar.left-1&&b.right<=g.bar.right+1&&b.left>=0&&b.right<=g.vw,'TTS control unclipped');assert.deepEqual(t.errors,[]);assert.deepEqual(t.failed,[]);await t.context.close();
}

try{
  await architecture(1280);await architecture(412);
  const e=await makePage({width:412,height:915}),ep=e.page;await enter(ep,'risk');await pickerAdd(ep,'WTI','wti');assert((+(await ep.locator('#nowChart').getAttribute('data-source-points')))>0,'WTI real 5D evidence');await ep.locator('#legend [data-id="wti"] [data-rm]').click();await ep.locator('#nowAddSeries').click();await ep.locator('#nowPickerSearch').fill('GDP');await ep.waitForFunction(()=>document.querySelector('[data-add-now="gdpQoq"]')||document.querySelector('[data-add-now="gdpYoy"]'));let g=ep.locator('[data-add-now="gdpQoq"]').first();if(!(await g.count()))g=ep.locator('[data-add-now="gdpYoy"]').first();assert.equal(await g.isDisabled(),false,'GDP periodic transform selectable at 5D');await e.context.close();
  await geometryCase(null);await geometryCase('growth');await geometryCase('risk');await geometryCase('macro');
  await ttsCase(false);await ttsCase(true);

  const missing=await makePage({width:412,height:915,registry:{defaultProvider:'openrouter',providers:{openrouter:{verified:false,model:'qa-model'}}}}),mp=missing.page;assert.equal(await analysisCount(mp),0);await mp.locator('#nowMoreBtn').click();await mp.locator('#nowAnalyze').click();await mp.waitForFunction(()=>document.querySelector('#view-config')?.classList.contains('on'));assert.match(await mp.locator('#openrouterStatus').innerText(),/Register this provider/i);assert.equal(await analysisCount(mp),0,'invalid provider no artifact');assert.equal(await mp.locator('#settingsModal').count(),0);assert.deepEqual(missing.errors,[]);await missing.context.close();

  const reg={defaultProvider:'openrouter',providers:{openrouter:{verified:true,key:'qa-key',model:'qa-model',models:['qa-model']}}};
  const ai=await makePage({width:412,height:915,registry:reg}),ap=ai.page;await enter(ap,'growth');await pickerAdd(ap,'SPY','spy');await ap.locator('#legend [data-id="spy"]').click();await ap.locator('#nowMoreBtn').click();await ap.locator('#nowAnalyze').click();await ap.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));await ap.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('All approved capabilities'));assert.equal(await analysisCount(ap),1,'AI persists one Analysis');assert.deepEqual(ai.errors,[]);await ai.context.close();

  const fail=await makePage({width:412,height:915,registry:reg,failAI:true}),fp=fail.page;await fp.locator('#nowMoreBtn').click();await fp.locator('#nowAnalyze').click();await fp.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));await fp.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('QA provider failure'));assert.match(await fp.locator('#transcript').innerText(),/Analysis failed/i);assert.equal(await analysisCount(fp),1);assert.deepEqual(fail.errors,[]);await fail.context.close();

  const cred=await makePage({width:412,height:915,registry:reg,failAI:true}),cp=cred.page;await cp.locator('#settingsGear').click();let key=cp.locator('#openrouterKey'),replace=cp.locator('[data-replace-key="openrouter"]');assert.equal(await key.inputValue(),'');assert.equal(await key.isHidden(),true);assert.equal(await replace.isVisible(),true);await replace.click();assert.equal(await key.isVisible(),true);await key.fill('bad-replacement');await cp.locator('#openrouterValidate').click();await cp.waitForFunction(()=>document.querySelector('#openrouterStatus')?.textContent.includes('QA provider failure'));let kept=await cp.evaluate(()=>JSON.parse(localStorage.getItem('marketNavigatorAIRegistryV1')).providers.openrouter);assert.equal(kept.key,'qa-key');assert.equal(kept.verified,true);await cred.context.close();

  const src=await makePage({width:412,height:915}),sp=src.page;await sp.locator('#settingsGear').click();await sp.locator('[data-cfgtab="sources"]').click();await sp.waitForFunction(()=>document.querySelector('#sourceStatus')?.textContent.includes('Canonical registry refreshed'));assert((await sp.locator('#sourceList [data-source-id]').count())>=3,'canonical registrations listed');await sp.locator('#sourceQuery').fill('Dow');await sp.locator('#sourceClass').selectOption('index');await sp.locator('#sourceResolve').click();assert.match(await sp.locator('#sourceResolution').innerText(),/Dow Jones Industrial Average/i);await sp.locator('#sourceRegister').click();let opened=await sp.evaluate(()=>window.__opened.at(-1)||'');assert(opened.includes('github.com/acmeproducts/stuff/issues/new'),'repository control-plane handoff');await sp.locator('#configClose').click();await enter(sp,'risk');await sp.locator('#nowAddSeries').click();await sp.locator('#nowPickerSearch').fill('NVDA');await sp.waitForFunction(()=>document.querySelector('[data-add-now="custom_nvda"]'));assert.equal(await sp.locator('[data-add-now="custom_nvda"]').isDisabled(),false,'healthy custom source 5D');await sp.locator('#nowPickerClose').click();await sp.locator('#hzs [data-h="1D"]').click();await sp.waitForFunction(()=>document.querySelector('#hzs [data-h="1D"]')?.classList.contains('on'));await sp.locator('#nowAddSeries').click();await sp.locator('#nowPickerSearch').fill('NVDA');await sp.waitForFunction(()=>document.querySelector('[data-add-now="custom_nvda"]'));assert.equal(await sp.locator('[data-add-now="custom_nvda"]').isDisabled(),true,'daily source cannot fabricate 1D intraday');assert.deepEqual(src.errors,[]);assert.deepEqual(src.failed,[]);await src.context.close();

  console.log('TURN 25 CUMULATIVE SEMANTIC QA: PASS');
} finally {await browser.close()}
