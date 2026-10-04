import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium }=createRequire(import.meta.url)('playwright');
const url=process.env.MN_URL||'http://127.0.0.1:8123/market-navigator-turn37-stage4.html';
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push('page:'+e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:'window.marked={parse:s=>s}'}));
await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__mnShip25?.ready?.()&&window.__mn37Stage4);
await page.evaluate(()=>window.__mn37Stage4.open('risk'));await page.waitForSelector('#mn37AnalysisSurface');
const initial=(await page.evaluate(()=>window.__mn37Stage4.state())).series;
async function openPicker(){await page.locator('#seriesBar [data-controller-add]').click();await page.waitForSelector('#mn37AnalysisSurface [data-controller-picker]:not(.hidden)')}
async function selectOne(group){
  await page.locator('#mn37AnalysisSurface [data-picker-group="'+group+'"]').click();await page.waitForTimeout(150);
  const c=page.locator('#mn37AnalysisSurface [data-picker-id]:not([disabled])');
  assert(await c.count()>0,'no eligible row in '+group);await c.first().check();return await c.first().getAttribute('data-picker-id');
}
async function selectThree(){
  const ids=[];for(const g of ['Risk','Growth','Macro'])ids.push(await selectOne(g));return ids;
}
await openPicker();
assert.deepEqual((await page.locator('#mn37AnalysisSurface [data-picker-group]').allTextContents()).map(x=>x.trim()),['Risk','Growth','Macro','Other']);
let ids=await selectThree();
let staged=await page.evaluate(()=>window.__mn37Stage4.picker().staged);assert.equal(staged.length,3);
await page.locator('#mn37AnalysisSurface [data-picker-search]').fill('zzzz-no-match');await page.waitForTimeout(100);
assert.deepEqual((await page.evaluate(()=>window.__mn37Stage4.picker().staged)).sort(),staged.slice().sort(),'search changed staged selection');
assert.deepEqual((await page.evaluate(()=>window.__mn37Stage4.state())).series,initial,'staging mutated chart before OK');
await page.locator('#mn37AnalysisSurface [data-picker-cancel]').click();await page.waitForTimeout(80);
assert.deepEqual((await page.evaluate(()=>window.__mn37Stage4.state())).series,initial,'Cancel mutated chart');
await openPicker();ids=await selectThree();await page.locator('#mn37AnalysisSurface [data-picker-x]').click();await page.waitForTimeout(80);
assert.deepEqual((await page.evaluate(()=>window.__mn37Stage4.state())).series,initial,'X mutated chart');
await openPicker();ids=await selectThree();staged=await page.evaluate(()=>window.__mn37Stage4.picker().staged);
const beforeApply=(await page.evaluate(()=>window.__mn37Stage4.state())).series;
await page.locator('#mn37AnalysisSurface [data-picker-ok]').click();await page.waitForTimeout(350);
const after=(await page.evaluate(()=>window.__mn37Stage4.state())).series;
for(const id of staged)assert.equal(after.filter(x=>x===id).length,1,'selected id not added exactly once '+id);
assert.equal(after.length,beforeApply.length+staged.length,'OK did not atomically add staged set');
assert.equal((new Set(after)).size,after.length,'duplicate series after batch Add');
const shadow=await page.evaluate(async()=>{
  const host=document.createElement('div');host.style.display='none';document.body.appendChild(host);
  const spec=window.__mn37Shadow.spec(),inst=window.MNChartController37.attach(host,spec,{showAdd:true});
  await inst.ready;await inst.openPicker();const model=await inst.getPickerModel(),state=inst.getPickerState();inst.destroy();host.remove();return{groups:model.groups,state};
});
assert.deepEqual(shadow.groups,['Risk','Growth','Macro','Other']);assert.equal(shadow.state.open,true);
assert.equal(errors.length,0,errors.join(' | '));
console.log('PASS Turn37 Stage4 shared grouped atomic batch Add');
await context.close();await browser.close();
