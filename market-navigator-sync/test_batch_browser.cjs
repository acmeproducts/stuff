'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require(process.env.MN_PLAYWRIGHT_MODULE);
const root=path.resolve('.sync-publish/market-navigator-throwaway-review'),status=JSON.parse(fs.readFileSync('.sync-publish/sync-status.json')),runId=Number(status.run.split('/').pop());
const server=http.createServer((req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname;if(route==='/market-navigator-sync-status.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(status))}const relative=route.replace(/^\/review\//,'/'),file=path.resolve(root,'.'+relative);if(!file.startsWith(root+path.sep))throw Error('Outside batch');res.setHeader('Content-Type',file.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chromium',headless:true});try{
 const results=[];
 for(const width of [412,1440]){
  const page=await browser.newPage({viewport:{width,height:915},isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://api.github.com/repos/acmeproducts/stuff/actions/**',route=>route.fulfill({json:route.request().url().includes('/jobs')?{jobs:[{name:'synchronize',conclusion:'success',steps:[]}]}:{workflow_runs:[{id:runId,run_number:1,status:'completed',conclusion:'success'}]}}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/review/throwaway.html');
  await page.waitForFunction(()=>window.__mnRebuild?.now()?.idle);
  assert(await page.locator('#nowChart').isVisible(),'Last complete batch must load without an explicit historical choice');
  const receipt=await page.evaluate(()=>__mnEtlReceipt()),q=receipt.completeness;
  assert.equal(q.scope,'daily-batch');assert.equal(q.status,'PASS');assert.equal(q.validUntil,null);
  assert(q.sources.filter(r=>['daily','trading-day','daily-nav'].includes(r.cadence)).every(r=>r.latest===q.marketDate&&r.required===q.marketDate&&!r.missingMarketSessions.length));
  const derived=await(await page.request.get(new URL('market-navigator-rebuild-data/market-evidence/derived-indices-persistent-v1.json',page.url()).href)).json();
  assert.equal(derived.commonMarketAnchor,q.marketDate);
  assert(Object.values(derived.indices).every(i=>Object.values(i.horizons).every(h=>h.curve.every(p=>new Date(p.t).toISOString().slice(0,10)<=q.marketDate))));
  assert((await page.locator('#nowCrumb').getAttribute('aria-description')).includes(q.marketDate));
  const original=await page.evaluate(()=>__mnRebuild.now().state.chart);
  await page.clock.install({time:new Date(Date.parse(q.batch.nextDeliveryDeadline)+60000)});
  if(width<500)await page.locator('#toggle').click();await page.locator('#mnEtlLauncher').click();
  await page.locator('#etlCopyDiagnostic').waitFor();
  assert((await page.locator('[data-etl-current-result]').innerText()).includes('LATE'),'Clock must show a missed next deadline without invalidating the old batch');
  assert.equal(JSON.parse(await page.locator('#etlDiagnosticText').inputValue()).batch.servingDate,q.marketDate);
  assert(await page.locator('#etlJobs').evaluate(n=>n.getBoundingClientRect().top<document.getElementById('etlProof').getBoundingClientRect().top));
  await page.screenshot({path:'.evidence/batch-etl-'+width+'.png'});
  await page.getByRole('button',{name:'NOW',exact:true}).click();assert(await page.locator('#nowChart').isVisible());
  assert.deepEqual(await page.evaluate(()=>__mnRebuild.now().state.chart),original);
  await page.locator('#legend [data-id="growth"]').click();await page.waitForFunction(()=>__mnRebuild.now()?.idle&&__mnRebuild.now().spec.index==='growth');await page.locator('#legend [data-id="growth"]').click({button:'right'});await page.locator('#analyzeNowSeries26').click();
  await page.waitForFunction(()=>__mnRebuild.analyze()?.idle);assert((await page.evaluate(()=>__mnRebuild.analyze().state.chart.series)).every(row=>row.points.every(p=>new Date(p.t).toISOString().slice(0,10)<=q.marketDate)));
  await page.screenshot({path:'.evidence/batch-chart-'+width+'.png'});
  assert.deepEqual(errors,[]);results.push({width,cutoff:q.marketDate,status:'PASS',lateBatchRemainsAvailable:true});await page.close();
 }
 fs.writeFileSync('.evidence/batch-acceptance.json',JSON.stringify({status:'PASS',results},null,2));console.log(JSON.stringify({status:'PASS',profiles:2,results}));
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
