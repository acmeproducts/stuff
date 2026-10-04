import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium }=createRequire(import.meta.url)('playwright');
const url=process.env.MN_URL||'http://127.0.0.1:8123/market-navigator-turn37-stage2.html';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push('page:'+e.message));
page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:'window.marked={parse:s=>s}'}));
await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
await page.goto(url,{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__mnShip25?.ready?.()&&window.__mn37Shadow);
async function same(label){
  await page.waitForTimeout(80);
  const r=await page.evaluate(()=>window.__mn37Shadow.compareNow());
  assert.equal(r.equal,true,label+' shadow mismatch\n'+JSON.stringify({legacy:r.legacy,shadow:r.shadow}).slice(0,12000));
}
async function goEnv(){
  const b=page.locator('#crumbEnvironment');
  if(await b.count()){await b.click();await page.waitForTimeout(120)}
}
await same('ENV boot');
for(const root of ['risk','growth','macro']){
  await goEnv();
  await page.locator('#legend [data-id="'+root+'"]').click();
  await page.waitForTimeout(120);
  await same(root+' open');
  for(const h of ['1D','5D','MTD','YTD','1YR','3YR','5YR']){
    const hb=page.locator('#hzs [data-h="'+h+'"]');
    if(await hb.count()){await hb.click();await page.waitForTimeout(120)}
    const disp=page.locator('#nowIndexDisplay');
    if(await disp.count()){
      await disp.selectOption('fixed');await page.waitForTimeout(100);await same(root+' '+h+' fixed');
      await disp.selectOption('rebase');await page.waitForTimeout(100);await same(root+' '+h+' horizon');
    }else await same(root+' '+h);
  }
  const rep=page.locator('#nowRepresentation');
  const candidates=page.locator('#legend [data-id]:not([disabled])');
  for(let i=0;i<await candidates.count();i++){
    const id=await candidates.nth(i).getAttribute('data-id');
    if(id!==root){await candidates.nth(i).click();await page.waitForTimeout(120);break}
  }
  if(await rep.count() && await rep.locator('option[value="dual"]').count()){
    await rep.selectOption('dual');await page.waitForTimeout(120);await same(root+' dual');
    await rep.selectOption('indexed');await page.waitForTimeout(120);await same(root+' indexed-after-dual');
  }
}
assert.equal(errors.length,0,errors.join(' | '));
console.log('PASS Turn37 Stage2 shadow parity across indices/horizons/display/dual');
await context.close();await browser.close();
