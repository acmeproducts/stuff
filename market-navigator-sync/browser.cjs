'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=process.env.MN_PLAYWRIGHT_MODULE?require(process.env.MN_PLAYWRIGHT_MODULE):require('../market-navigator-rebuild-runtime.cjs');
const root=path.resolve(process.env.MN_SYNC_BROWSER_ROOT||'.evidence/sync-cycle-1/market-navigator-throwaway-review');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.env.MN_SYNC_BROWSER_URL||`http://127.0.0.1:${server.address().port}/throwaway.html`,results=[];
try{for(const channel of (process.env.MN_BROWSER_CHANNELS||'chrome,msedge').split(',')){const browser=await chromium.launch({channel,headless:true});try{for(const viewport of [{width:1440,height:900},{width:412,height:915}]){
 const page=await browser.newPage({viewport,hasTouch:viewport.width<500,isMobile:viewport.width<500}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(url);assert.equal(response.status(),200);const raw=await response.body();assert.equal(crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${raw.length}\0`),raw])).digest('hex'),'3103a98d2aac9e5c054537660a6b2480d9752b9c');
 const dataUrl=new URL('market-navigator-rebuild-data/',url).href;const derived=await (await page.request.get(dataUrl+'market-evidence/derived-indices-persistent-v1.json')).json();
 await page.waitForFunction(()=>window.__mnRebuild?.now()?.idle&&__mnRebuild.now().state?.chart?.series?.length);
 for(const h of ['1D','5D','MTD','YTD','1YR','3YR','5YR']){await page.locator(`#hzs [data-h="${h}"]`).click();await page.waitForFunction(h=>__mnRebuild.now()?.idle&&__mnRebuild.now().spec.h===h,h);
  for(const mode of ['fixed','rebase']){await page.locator('#nowIndexDisplay').selectOption(mode);await page.waitForFunction(d=>__mnRebuild.now()?.idle&&__mnRebuild.now().spec.indexDisplay===d,mode);const rows=await page.evaluate(()=>__mnRebuild.now().state.chart.series);assert.equal(rows.length,3);
   for(const row of rows){const wanted=derived.indices[row.id].horizons[h].curve;assert(wanted.length>=2);assert.deepEqual(row.points.map(p=>[p.t,p.raw]),wanted.map(p=>[p.t,p.v]));if(mode==='rebase')assert(Math.abs(row.points[0].v-100)<1e-8);assert.equal(await page.locator(`#legend [data-id="${row.id}"]`).isDisabled(),false);}
  }
 }
 await page.locator('#hzs [data-h="5D"]').click();await page.locator('#legend [data-id="macro"]').click();await page.waitForFunction(()=>__mnRebuild.now()?.idle&&__mnRebuild.now().spec.index==='macro');
 const mac=await page.evaluate(()=>__mnRebuild.now().state.chart.series.find(x=>x.id==='macro'));assert.equal(mac.points.length,derived.indices.macro.horizons['5D'].curve.length);assert(mac.points.length>=2);
 await page.locator('#legend [data-id="macro"]').click({button:'right'});await page.locator('#analyzeNowSeries26').click();await page.waitForFunction(()=>__mnRebuild.analyze()?.idle);const state=await page.evaluate(()=>__mnRebuild.analyze());assert.equal(state.state.chart.series.find(x=>x.id==='macro').points.length,mac.points.length);
 if(viewport.width<500)await page.locator('#toggle').click();await page.getByRole('button',{name:'LIBRARY',exact:true}).click();await page.getByRole('button',{name:'NOW',exact:true}).click();assert.deepEqual(await page.evaluate(()=>__mnRebuild.analyze()),state);await page.locator('#rebuildAnalyzeClose').click();await page.waitForFunction(()=>!__mnRebuild.analyze()&&__mnRebuild.now()?.idle);
 assert.equal(await page.locator('#mnEtlLauncher').count(),0);assert.deepEqual(errors,[]);results.push({channel,viewport,status:'PASS',indexHorizons:21,modes:2,mac5DPoints:mac.points.length,analyzeAndLibrary:'PASS'});await page.close();
}}finally{await browser.close()}}console.log(JSON.stringify({url,results}));}finally{server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});

