import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn23-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function makePage({width=412,height=915,ai=false,custom=false}={}){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[],requests=[];
  await page.addInitScript(()=>{
    class U{constructor(text){this.text=String(text);this.rate=1}}
    Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});
    Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){},pause(){},resume(){}},configurable:true});
    window.__opened=[];window.open=(...args)=>{window.__opened.push(args);return null};
  });
  if(ai)await page.addInitScript(()=>localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify({defaultProvider:'openrouter',providers:{openrouter:{verified:true,key:'qa-key-never-materialize',model:'qa-model'}}})));
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400&&!/favicon/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  if(ai)await page.route('https://openrouter.ai/api/v1/chat/completions',async r=>{
    requests.push(r.request().postDataJSON());
    await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:'# Turn 23 QA\n\nUnified NOW evidence reached Library intact.'}}]})});
  });
  if(custom){
    await page.route(/data\/market-backend\/data-catalog\.json(?:\?.*)?$/,async r=>{
      const resp=await r.fetch(),j=await resp.json();
      j.series=(j.series||[]).filter(x=>x.id!=='custom_qa');
      j.series.push({id:'custom_qa',name:'QA Canonical Equity',short_name:'QAE',description:'Turn 23 canonical registered-source fixture.',domain:'market',category:'custom',provider:'Yahoo Finance',provider_identifier:'QAE',provider_chain:[{provider:'Yahoo Finance',identifier:'QAE'},{provider:'Stooq',identifier:'qae.us'}],native_unit:'USD',native_cadence:'trading-day',canonical_storage_cadence:'daily',required:false,enabled:true,supported_horizons:['5D','MTD','YTD','1YR','3YR','5YR'],custom_source:true,instrument_class:'equity',canonical_symbol:'QAE',canonical_measure:'market price'});
      await r.fulfill({response:resp,json:j});
    });
    await page.route(/market-evidence\/health-envelope\.json(?:\?.*)?$/,async r=>{
      const resp=await r.fetch(),j=await resp.json();j.series=j.series||{};j.series.custom_qa={id:'custom_qa',name:'QA Canonical Equity',shortName:'QAE',provider:'Yahoo Finance',cadence:'trading-day',classification:'current',actualLatestCanonicalObservation:'2026-09-10',horizonCoverage:{'1D':false,'5D':true,MTD:true,YTD:true,'1YR':true,'3YR':true,'5YR':true},supportedHorizons:['5D','MTD','YTD','1YR','3YR','5YR'],customSource:true,instrumentClass:'equity',canonicalMeasure:'market price'};await r.fulfill({response:resp,json:j});
    });
    await page.route(/data\/market-backend\/source-registry\.json(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({schema:'market-navigator-source-registry-v1',registrations:[{id:'custom_qa',query:'QAE',canonicalSymbol:'QAE',canonicalName:'QA Canonical Equity',instrumentClass:'equity',measure:'market price',providerChain:[{provider:'Yahoo Finance',identifier:'QAE'}],supportedHorizons:['5D','MTD','YTD','1YR','3YR','5YR'],status:'registered-pending-collection'}]})}));
    await page.route(/market-evidence\/series\/custom_qa\.json(?:\?.*)?$/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({id:'custom_qa',cadence:'trading-day',observations:[['2026-09-02',100],['2026-09-03',101],['2026-09-04',102],['2026-09-08',103],['2026-09-09',104],['2026-09-10',105]].map(([d,v])=>({t:Date.parse(d+'T00:00:00Z'),v}))})}));
  }
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

async function railGeometry(width,height){
  const t=await makePage({width,height}),p=t.page;
  const geom=async()=>p.evaluate(()=>{let card=document.querySelector('.chartCard').getBoundingClientRect(),view=document.querySelector('#view-now').getBoundingClientRect(),wrap=document.querySelector('#nowWrap').getBoundingClientRect(),canvas=document.querySelector('#nowChart').getBoundingClientRect();return{card:{t:card.top,b:card.bottom,w:card.width,h:card.height},view:{t:view.top,b:view.bottom},wrap:{w:wrap.width,h:wrap.height},canvas:{w:canvas.width,h:canvas.height},rail:document.querySelector('#rail').getBoundingClientRect().width}});
  let open=await geom();assert(Math.abs(open.card.t-open.view.t)<=2,'open rail chart pinned to workspace top');assert(Math.abs(open.card.b-open.view.b)<=2,'open rail chart pinned to workspace bottom');
  await p.locator('#toggle').click();await p.waitForTimeout(260);let closed=await geom();
  assert(Math.abs(closed.card.t-open.card.t)<=2&&Math.abs(closed.card.b-open.card.b)<=2,'rail toggle changes width only');
  assert(closed.card.w>open.card.w+20,'closed rail grants chart width');assert(closed.wrap.w>open.wrap.w+20,'chart container resized');assert(Math.abs(closed.canvas.w-closed.wrap.w)<=1,'canvas redraw matches resized container');
  await p.locator('#toggle').click();await p.waitForTimeout(260);let reopened=await geom();assert(Math.abs(reopened.card.t-open.card.t)<=2&&Math.abs(reopened.card.b-open.card.b)<=2,'reopened rail remains vertically pinned');assert(Math.abs(reopened.wrap.w-open.wrap.w)<=2,'reopened rail restores chart width');
  assert.deepEqual(t.errors,[]);assert.deepEqual(t.failed,[]);await p.close();
}

try{
  await architecture(1280);await architecture(412);
  await railGeometry(1280,800);await railGeometry(768,900);await railGeometry(412,915);

  // Short-horizon evidence truth retained: WTI selectable; GDP cadence-aware selectable.
  const e=await makePage({width:412,height:915}),ep=e.page;
  await enter(ep,'risk');await pickerAdd(ep,'WTI','wti');assert.equal(await crumb(ep),'ENV / RSK / COMPONENTS');assert((+(await ep.locator('#nowChart').getAttribute('data-source-points')))>0,'WTI contributes real 5D chart evidence');await ep.locator('#legend [data-id="wti"] [data-rm]').click();
  await ep.locator('#nowAddSeries').click();await ep.locator('#nowPickerSearch').fill('GDP');await ep.waitForFunction(()=>document.querySelector('[data-add-now="gdpQoq"]')||document.querySelector('[data-add-now="gdpYoy"]'));let g=ep.locator('[data-add-now="gdpQoq"]').first();if(!(await g.count()))g=ep.locator('[data-add-now="gdpYoy"]').first();assert.equal(await g.isDisabled(),false,'periodic GDP transform remains selectable at 5D');await ep.locator('#nowPickerClose').click();assert.deepEqual(e.errors,[]);assert.deepEqual(e.failed,[]);await ep.close();

  // Exact visible state -> AI -> Library + credential/password-manager regression + Listen geometry.
  const q=await makePage({width:412,height:915,ai:true}),ai=q.page;
  await ai.locator('#settingsGear').click();assert.deepEqual((await ai.locator('[data-cfgtab]').allTextContents()).map(x=>x.trim()),['AI','Chart Config','Sources','About']);
  assert.equal(await ai.locator('#cfgAi input[type="password"]').count(),0,'Config contains no password-manager-shaped secret inputs');
  assert.equal(await ai.locator('#openrouterKey').inputValue(),'','stored OpenRouter secret is not materialized in DOM');assert.equal(await ai.locator('#openrouterKey').isHidden(),true,'registered key editor is closed');assert.equal(await ai.locator('[data-replace-key="openrouter"]').isVisible(),true,'Replace key is explicit');
  await ai.locator('[data-replace-key="openrouter"]').click();assert.equal(await ai.locator('#openrouterKey').isVisible(),true);assert.equal(await ai.locator('#openrouterKey').inputValue(),'');await ai.locator('#openrouterKey').fill('replacement-not-saved');await ai.locator('[data-replace-key="openrouter"]').click();assert.equal(await ai.locator('#openrouterKey').inputValue(),'','Cancel discards replacement draft');
  await ai.locator('#configClose').click();
  await enter(ai,'growth');await pickerAdd(ai,'SPY','spy');await ai.locator('#legend [data-id="spy"]').click();await ai.waitForFunction(()=>document.querySelector('#legend [data-id="spy"]')?.classList.contains('active'));await ai.locator('#nowMoreBtn').click();await ai.locator('#nowAnalyze').click();await ai.waitForFunction(()=>document.querySelector('#view-library')?.classList.contains('on'));await ai.waitForFunction(()=>document.querySelector('#transcript')?.textContent.includes('Unified NOW evidence'));
  assert.equal(q.requests.length,1,'one AI request');const sys=q.requests[0].messages.find(m=>m.role==='system')?.content||'',marker='Evidence: ',i=sys.indexOf(marker);assert(i>=0,'AI evidence packet present');const ev=JSON.parse(sys.slice(i+marker.length));assert.equal(ev.lineage,'ENV/GRW/COMPONENTS');assert.equal(ev.active,'spy','active visible series reaches frozen AI evidence');const sp=ev.chart.series.find(z=>z.id==='spy');assert(sp&&sp.observationCount>0,'SPY evidence reaches AI');if(sp.first&&sp.last&&sp.first.raw!==sp.last.raw&&sp.first.idx!==sp.last.idx)assert.equal(Math.sign(sp.last.raw-sp.first.raw),Math.sign(sp.last.idx-sp.first.idx),'Indexed 100 direction matches source direction');assert(ev.chart.series.find(z=>z.id==='growth')?.observationCount>0,'derived GRW anchor retained in frozen AI state');
  assert.equal(await ai.locator('#libListenTitle').count(),0,'redundant Listen title removed');await ai.locator('#libListenMode').click();await ai.waitForFunction(()=>!document.querySelector('#libListenBar')?.classList.contains('hidden'));assert.match(await ai.locator('#libListenProgress').innerText(),/Response 1 of 1 · Row 1 of/);const geom=await ai.evaluate(()=>{let bar=document.querySelector('#libListenBar').getBoundingClientRect(),bs=[...document.querySelectorAll('#libListenBar .libListenControl')].map(x=>x.getBoundingClientRect());return{bar:{l:bar.left,r:bar.right,c:(bar.left+bar.right)/2},bs:bs.map(b=>({l:b.left,r:b.right})),vw:innerWidth}});assert.equal(geom.bs.length,5);for(const b of geom.bs)assert(b.l>=geom.bar.l-1&&b.r<=geom.bar.r+1&&b.l>=0&&b.r<=geom.vw,'Listen control clipped');assert(Math.abs((geom.bs[0].l+geom.bs.at(-1).r)/2-geom.bar.c)<8,'five Listen controls centered');await ai.locator('#libListenPlay').click();assert.equal(await ai.locator('#libListenPlay').innerText(),'⏸');await noOverflow(ai,'Library phone');assert.deepEqual(q.errors,[]);assert.deepEqual(q.failed,[]);await ai.close();

  // Sources: no local evidence creation; governed registration handoff + healthy fixture appears through Add only at supported horizons.
  const s=await makePage({width:412,height:915,custom:true}),spg=s.page;
  await spg.locator('#settingsGear').click();await spg.locator('[data-cfgtab="sources"]').click();await spg.waitForFunction(()=>document.querySelector('#sourceList')?.textContent.includes('QA Canonical Equity'));assert((await spg.locator('[data-source-id="custom_qa"]').count())===1,'registered canonical source listed');
  await spg.locator('#sourceQuery').fill('DOW');await spg.locator('#sourceRegister').click();assert.match(await spg.locator('#sourceStatus').innerText(),/Choose the intended instrument class/,'ambiguous source cannot submit without class');await spg.locator('#sourceClass').selectOption('index');await spg.locator('#sourceRegister').click();let opened=await spg.evaluate(()=>window.__opened.at(-1)?.[0]||'');assert(opened.includes('github.com/acmeproducts/stuff/issues/new'),'registration uses authenticated repository control plane');let decoded=decodeURIComponent(opened.replace(/\+/g,' '));assert(decoded.includes('Query: DOW')&&decoded.includes('Class: index'),'registration preserves query + intended class');assert.equal(await spg.evaluate(()=>Object.keys(localStorage).some(k=>/source|ticker/i.test(k))),false,'Sources does not create local-only ticker evidence');
  await spg.locator('#configClose').click();await enter(spg,'risk');await spg.locator('#nowAddSeries').click();await spg.locator('#nowPickerSearch').fill('QAE');await spg.waitForFunction(()=>document.querySelector('[data-add-now="custom_qa"]'));assert.equal(await spg.locator('[data-add-now="custom_qa"]').isDisabled(),false,'healthy registered daily source available at 5D');await spg.locator('#nowPickerClose').click();await spg.locator('#hzs [data-h="1D"]').click();await spg.waitForFunction(()=>document.querySelector('#hzs [data-h="1D"]')?.classList.contains('on'));await spg.locator('#nowAddSeries').click();await spg.locator('#nowPickerSearch').fill('QAE');await spg.waitForFunction(()=>document.querySelector('[data-add-now="custom_qa"]'));assert.equal(await spg.locator('[data-add-now="custom_qa"]').isDisabled(),true,'daily-only registered source explicitly disables unsupported 1D');await spg.locator('#nowPickerClose').click();assert.deepEqual(s.errors,[]);assert.deepEqual(s.failed,[]);await spg.close();

  // Horizon display density and Chart Config retained.
  const c=await makePage({width:412,height:915}),cp=c.page;await enter(cp,'risk');await cp.locator('#hzs [data-h="3YR"]').click();await cp.waitForFunction(()=>document.querySelector('#hzs [data-h="3YR"]')?.classList.contains('on'));assert.equal(await cp.locator('#nowChart').getAttribute('data-render-density'),'monthly');let src=+(await cp.locator('#nowChart').getAttribute('data-source-points')),rnd=+(await cp.locator('#nowChart').getAttribute('data-rendered-points'));assert(src>=rnd&&src>0,'3YR rendering is display-density only');await cp.locator('#settingsGear').click();await cp.locator('[data-cfgtab="chart"]').click();assert.equal(await cp.locator('[data-style-slot]').count(),10);assert.equal(await cp.locator('[data-width-slot]').count(),10);await cp.locator('#configClose').click();assert.deepEqual(c.errors,[]);assert.deepEqual(c.failed,[]);await cp.close();

  console.log('TURN 23 RESPONSIVE + SOURCES + CREDENTIAL QA: PASS');
} finally {await browser.close()}
