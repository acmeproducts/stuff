import assert from 'node:assert/strict';import{createRequire}from'node:module';const{chromium}=createRequire(import.meta.url)('playwright');
const URL=process.env.MN_URL||'http://127.0.0.1:8123/market-navigator-turn37-stage4.html';
const browser=await chromium.launch({headless:true}),ctx=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),p=await ctx.newPage(),errors=[];
p.on('pageerror',e=>errors.push('page:'+e.message));p.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
await p.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:"window.marked={parse:s=>s}"}));await p.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
await p.goto(URL,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__mnShip25?.ready?.()&&window.__mn37Stage4);
async function choose(scope,group){await p.locator(scope+' [data-mn37-picker-group="'+group+'"]').click();await p.waitForTimeout(120);const c=p.locator(scope+' [data-mn37-picker-id]:not([disabled])');assert(await c.count()>0,'no eligible row in '+group);const id=await c.first().getAttribute('data-mn37-picker-id');await c.first().check();return id}
async function groups(scope){return(await p.locator(scope+' [data-mn37-picker-group]').allTextContents()).map(x=>x.trim())}
async function openNow(){await p.locator('#nowAddSeries').click();await p.waitForSelector('#nowPicker:not(.hidden)');assert.deepEqual(await groups('#nowPicker'),['Risk','Growth','Macro','Other'])}

await p.locator('#legend [data-id="risk"]').click();await p.waitForTimeout(250);
const nowInitial=(await p.evaluate(()=>window.__mnShip25.nowState())).series.slice();

await openNow();let stagedIds=[];for(const g of ['Growth','Macro','Other'])stagedIds.push(await choose('#nowPicker',g));
let staged=await p.evaluate(()=>window.__mn37Stage4.nowPicker().staged);assert.equal(staged.length,3);
await p.locator('#nowPicker [data-mn37-picker-search]').fill('zzzz-no-match');await p.waitForTimeout(80);
assert.deepEqual((await p.evaluate(()=>window.__mn37Stage4.nowPicker().staged)).sort(),staged.slice().sort(),'search changed staged set');
assert.deepEqual((await p.evaluate(()=>window.__mnShip25.nowState())).series,nowInitial,'NOW staging mutated before OK');
await p.locator('#nowPicker [data-mn37-picker-cancel]').click();
assert.deepEqual((await p.evaluate(()=>window.__mnShip25.nowState())).series,nowInitial,'NOW Cancel mutated chart');

await openNow();for(const g of ['Growth','Macro','Other'])await choose('#nowPicker',g);
await p.locator('#nowPicker [data-mn37-picker-x]').click();
assert.deepEqual((await p.evaluate(()=>window.__mnShip25.nowState())).series,nowInitial,'NOW X mutated chart');

await openNow();stagedIds=[];for(const g of ['Growth','Macro','Other'])stagedIds.push(await choose('#nowPicker',g));
staged=await p.evaluate(()=>window.__mn37Stage4.nowPicker().staged);
await p.locator('#nowPicker [data-mn37-picker-ok]').click();await p.waitForTimeout(350);
const nowAfter=(await p.evaluate(()=>window.__mnShip25.nowState())).series;
for(const id of staged)assert.equal(nowAfter.filter(x=>x===id).length,1,'NOW selected series not added exactly once '+id);
assert.equal(nowAfter.length,nowInitial.length+staged.length,'NOW OK not atomic');
await openNow();for(const id of staged)assert.equal(await p.locator('#nowPicker [data-mn37-picker-id="'+id+'"]').count(),0,'existing NOW series still offered '+id);
await p.locator('#nowPicker [data-mn37-picker-x]').click();

await p.evaluate(()=>window.__mnStandalone26.open('risk'));await p.waitForFunction(()=>window.__mn37Stage3.state()?.resolved);
const aInitial=(await p.evaluate(()=>window.__mn37Stage3.state().spec.series)).slice();
await p.locator('#standaloneAnalysis26 [data-mn-controller-add]').click();await p.waitForSelector('#standaloneAnalysis26 .mn37BatchPicker:not(.hidden)');
assert.deepEqual(await groups('#standaloneAnalysis26 .mn37BatchPicker'),['Risk','Growth','Macro','Other']);
let aStaged=[];for(const g of ['Risk','Growth','Macro'])aStaged.push(await choose('#standaloneAnalysis26 .mn37BatchPicker',g));
assert.deepEqual(await p.evaluate(()=>window.__mn37Stage3.state().spec.series),aInitial,'Analyze staging mutated before OK');
await p.locator('#standaloneAnalysis26 [data-mn37-picker-ok]').click();await p.waitForTimeout(350);
const aAfter=await p.evaluate(()=>window.__mn37Stage3.state().spec.series);
for(const id of aStaged)assert.equal(aAfter.filter(x=>x===id).length,1,'Analyze selected series not added exactly once '+id);
assert.equal(aAfter.length,aInitial.length+aStaged.length,'Analyze OK not atomic');

assert.equal(errors.length,0,errors.join(' | '));console.log('PASS Stage 4 shared grouped atomic batch Add in NOW and Analyze');await ctx.close();await browser.close();