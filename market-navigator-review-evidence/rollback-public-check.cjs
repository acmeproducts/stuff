'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../market-navigator-rebuild-runtime.cjs');
const out=path.join(__dirname,'2026-10-14-owner-rejection');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1020,height:778},timezoneId:'America/Los_Angeles'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html?rollback=996e9a7');
 const ready=()=>page.waitForFunction(()=>window.__mnShip25?.ready()&&window.__mnShip25.nowState()?.chart,null,{timeout:60000});await ready();
 if(!await page.locator('#rail').evaluate(n=>n.classList.contains('closed')))await page.locator('#toggle').click();
 await page.waitForFunction(()=>document.querySelector('#rail').getAnimations().every(a=>a.playState!=='running'));await ready();
 const result={baselineCommit:'996e9a71b72db5bfbea3ba77750077daaa2fb7ab',rollbackCommit:'a242d0c9a1ef81a3b9e429a9ea5b131065cc4740',scope:'Original accepted HTML/data checkpoint; historical, not current live data',runs:[]};
 for(const h of ['5D','1D']){
  await page.locator('#hzs [data-h="'+h+'"]').click();await ready();
  await page.waitForFunction(h=>__mnShip25.nowState().horizon===h,h);
  const snap=await page.evaluate(()=>__mnShip25.nowState());
  const series=snap.chart.series.map(s=>({id:s.id,points:s.points.length,dates:s.points.map(p=>new Date(p.t).toISOString().slice(0,10))}));
  assert.equal(series.length,3);assert(series.every(s=>s.points>=2),'Each original overview index has a line in '+h);
  const canvas=await page.locator('#nowChart').boundingBox();await page.mouse.move(canvas.x+canvas.width*.4,canvas.y+canvas.height*.25);await page.locator('#nowTip').waitFor({state:'visible'});
  const tip=await page.locator('#nowTip').boundingBox(),text=await page.locator('#nowTip').innerText();assert(!text.includes('Latest captured vintage'));assert(tip.width<canvas.width*.5,'Original compact tooltip');
  result.runs.push({horizon:h,window:snap.chart.window,series,tooltip:text,tooltipBox:tip,canvasBox:canvas});
  await page.screenshot({path:path.join(out,'restored-turn28-'+h+'.png')});
 }
 assert.deepEqual(errors,[]);result.unexpectedErrors=errors;fs.writeFileSync(path.join(out,'rollback-public-proof.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
