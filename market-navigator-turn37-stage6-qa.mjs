import assert from'node:assert/strict';import{createRequire}from'node:module';const{chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.MN_URL||'http://127.0.0.1:8123/market-navigator-turn37-stage6.html';
const b=await chromium.launch({headless:true}),c=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),p=await c.newPage(),errs=[];
p.on('pageerror',e=>errs.push('page:'+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console:'+m.text())});
await p.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:"window.marked={parse:s=>s}"}));
await p.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
await p.goto(URL,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__mnShip25?.ready?.()&&window.__mn37Stage6?.ready?.(),null,{timeout:15000});

const count=()=>p.evaluate(()=>window.__mn37Stage6.counts().total);
const stage6=()=>p.evaluate(()=>window.__mn37Stage6.state());
function normResolved(x){return{xroot:x?.root??null,series:(x?.series||[]).map(z=>({id:z.id,axis:z.axis,unit:z.unit,a:(z.a||[]).map(q=>[q.t,q.v,q.idx,q.raw,q.sourceT])})),active:x?.active??null,mode:x?.mode,window:x?.w||x?.window}}
async function assertSnapshotParity(label){
 const x=await p.evaluate(()=>({live:window.__mn37Stage6.state()?.resolved,snap:window.__mnShip25.nowState()?.chart}));
 const live=x.live,s=x.snap;assert(live&&s,label+' missing state');assert.deepEqual((s.series||[]).map(z=>z.id),(live.series||[]).map(z=>z.id),label+' series order');
 for(const z of live.series||[]){const q=(s.series||[]).find(x=>x.id===z.id);assert(q,label+' missing '+z.id);assert.equal(q.axis||0,z.axis||0,label+' axis '+z.id);assert.deepEqual((q.points||[]).map(v=>[v.t,v.v,Number.isFinite(+v.idx)?+v.idx:null,+v.raw,+v.sourceT]),(z.a||[]).map(v=>[v.t,v.v,Number.isFinite(+v.idx)?+v.idx:null,+v.raw,+v.sourceT]),label+' points '+z.id)}
}

let n0=await count();await p.locator('#legend [data-id="risk"]').click();await p.waitForTimeout(260);let n1=await count();assert.equal(n1-n0,1,'index click must produce one controller transition');assert.equal((await stage6()).spec.root,'risk');await assertSnapshotParity('risk');
for(const h of ['5D','YTD','1YR','3YR','5YR']){n0=await count();await p.locator('#hzs [data-h="'+h+'"]').click();await p.waitForTimeout(220);n1=await count();assert.equal(n1-n0,1,'horizon '+h+' must produce one controller transition');assert.equal((await stage6()).spec.timeHorizon,h);await assertSnapshotParity('horizon '+h)}
n0=await count();await p.locator('#nowIndexDisplay').selectOption('rebase');await p.waitForTimeout(220);n1=await count();assert.equal(n1-n0,1,'display change must produce one controller transition');assert.equal((await stage6()).spec.displayMode,'horizon');await assertSnapshotParity('horizon display');

async function choose(group){await p.locator('#nowPicker [data-mn37-picker-group="'+group+'"]').click();await p.waitForTimeout(120);const x=p.locator('#nowPicker [data-mn37-picker-id]:not([disabled])');assert(await x.count()>0,'no eligible '+group);const id=await x.first().getAttribute('data-mn37-picker-id');await x.first().check();return id}
await p.locator('#nowAddSeries').click();await p.waitForSelector('#nowPicker:not(.hidden)');
assert.deepEqual((await p.locator('#nowPicker [data-mn37-picker-group]').allTextContents()).map(x=>x.trim()),['Risk','Growth','Macro','Other']);
const before=(await stage6()).spec.series.slice();let staged=[];for(const g of ['Growth','Macro','Other'])staged.push(await choose(g));
await p.locator('#nowPicker [data-mn37-picker-search]').fill('zzzz-no-match');await p.waitForTimeout(80);
assert.deepEqual((await stage6()).spec.series,before,'staging mutated NOW');
await p.locator('#nowPicker [data-mn37-picker-cancel]').click();assert.deepEqual((await stage6()).spec.series,before,'Cancel mutated NOW');

await p.locator('#nowAddSeries').click();for(const g of ['Growth','Macro','Other'])await choose(g);await p.locator('#nowPicker [data-mn37-picker-x]').click();assert.deepEqual((await stage6()).spec.series,before,'X mutated NOW');

await p.locator('#nowAddSeries').click();staged=[];for(const g of ['Growth','Macro','Other'])staged.push(await choose(g));await p.locator('#nowPicker [data-mn37-picker-ok]').click();await p.waitForTimeout(300);
const after=(await stage6()).spec.series;for(const id of staged)assert.equal(after.filter(x=>x===id).length,1,'OK did not add exactly once '+id);assert.equal(after.length,before.length+staged.length,'OK not atomic');await assertSnapshotParity('batch Add');

const nowBeforeAnalyze=JSON.stringify(await stage6());
for(let i=0;i<25;i++){await p.evaluate(()=>window.__mnStandalone26.open('risk'));await p.waitForFunction(()=>window.__mn37Stage3?.state?.()?.resolved);assert.equal(await p.locator('#standaloneAnalysis26 [data-mn-analysis37]').count(),1,'Analyze surface count '+i);await p.evaluate(()=>window.__mnStandalone26.close());await p.waitForTimeout(20);assert.equal(await p.locator('#standaloneAnalysis26 [data-mn-analysis37]').count(),1,'Analyze surface leaked '+i)}
assert.equal(JSON.stringify(await stage6()),nowBeforeAnalyze,'Analyze lifecycle mutated NOW');

await p.evaluate(()=>window.__mnStandalone26.open('macro'));await p.waitForFunction(()=>window.__mn37Stage3?.state?.()?.resolved);
let lib=p.locator('[data-view="library"]');if(!(await lib.isVisible())){await p.click('#toggle');await p.waitForTimeout(120)}await lib.click();await p.waitForTimeout(150);
assert(await p.evaluate(()=>window.__mn37Stage3.isParked()));assert.equal(await p.locator('#standaloneAnalysis26').evaluate(e=>getComputedStyle(e).display),'none');await p.locator('#libSearch').fill('stage6');assert.equal(await p.locator('#libSearch').inputValue(),'stage6');await p.locator('#libSearch').fill('');
assert.equal((await p.locator('#interpretTabs27 [data-interpret27]').allTextContents()).map(x=>x.trim()).join('|'),'Plain|Standard|Technical');
await p.locator('[data-view="now"]').click();await p.waitForTimeout(120);assert(!(await p.evaluate(()=>window.__mn37Stage3.isParked())));await p.evaluate(()=>window.__mnStandalone26.close());

assert.equal(errs.length,0,errs.join(' | '));console.log('PASS Stage 6 one live chart controller, deprecated paths retired, lifecycle/Add/Library/data parity');await c.close();await b.close();