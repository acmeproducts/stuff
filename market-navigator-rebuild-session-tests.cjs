'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('./market-navigator-rebuild-runtime.cjs'),{server,ready}=require('./market-navigator-rebuild-qa.cjs');
const errors=[];
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),ctx=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'America/Los_Angeles'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:r.request().url().includes('marked')?'window.marked={parse:s=>s}':'window.DOMPurify={sanitize:s=>s}'}));try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/market-navigator-rebuild-analyze.html');await ready(page);
 await page.locator('#legend [data-id="risk"]').click();await ready(page);
 const initial=await page.evaluate(()=>window.__mnRebuild.now());
 await page.locator('#legend [data-id="risk"]').click({button:'right'});await page.locator('#analyzeNowSeries26').click();
 await page.waitForFunction(()=>window.__mnRebuild.analyze()?.state&&window.__mnRebuild.analyze()?.idle);
 let a=await page.evaluate(()=>window.__mnRebuild.analyze());assert.deepEqual(a.state.series,['risk']);assert.equal(a.spec.h,initial.spec.h);
 const geom=await page.locator('#mn-analyze-nowWrap').boundingBox();assert(geom.height>600);
 await page.locator('#mn-analyze-hzs [data-h="1YR"]').click();await page.waitForFunction(()=>window.__mnRebuild.analyze()?.idle&&window.__mnRebuild.analyze()?.spec.h==='1YR');
 a=await page.evaluate(()=>window.__mnRebuild.analyze());assert.deepEqual(await page.evaluate(()=>window.__mnRebuild.now()),initial);
 await page.locator('[data-view="library"]').click();assert.equal(await page.locator('#view-analyze').isVisible(),false);assert.deepEqual(await page.evaluate(()=>window.__mnRebuild.analyze()),a);
 await page.locator('[data-view="now"]').click();assert.equal(await page.locator('#view-analyze').isVisible(),true);assert.deepEqual(await page.evaluate(()=>window.__mnRebuild.analyze()),a);
 await page.locator('#rebuildAnalyzeClose').click();assert.equal(await page.evaluate(()=>window.__mnRebuild.analyze()),undefined);await ready(page);assert.deepEqual(await page.evaluate(()=>window.__mnRebuild.now()),initial);
 for(let i=0;i<25;i++){await page.locator('#legend [data-id="risk"]').click({button:'right'});await page.locator('#analyzeNowSeries26').click();await page.waitForFunction(()=>window.__mnRebuild.analyze()?.state&&window.__mnRebuild.analyze()?.idle);await page.locator('#rebuildAnalyzeClose').click();await page.waitForFunction(()=>!window.__mnRebuild.analyze());}
 assert.deepEqual(errors,[]);const proof={stage:'first existing NOW launch and 25 repeated cycles',status:'PASS',initialSeries:['risk'],fullPageGeometry:geom,parking:'state unchanged',NOWIsolation:'snapshot unchanged',unexpectedConsoleErrors:errors,physicalAcceptance:'PENDING'};fs.writeFileSync('market-navigator-rebuild-evidence/analyze-first-launch.json',JSON.stringify(proof,null,2));console.log(proof);
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});