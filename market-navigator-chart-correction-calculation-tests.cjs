'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=process.env.MN_PLAYWRIGHT_MODULE?require(process.env.MN_PLAYWRIGHT_MODULE):require('./market-navigator-rebuild-runtime.cjs');
const root=path.resolve(process.env.MN_CHART_CANDIDATE_ROOT||'.evidence/chart-correction-candidate'),data=path.resolve(process.env.MN_SYNC_BROWSER_ROOT||'market-navigator-throwaway-review');
const app=fs.readFileSync(path.join(root,'throwaway.html')),blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+app.length+'\0'),app])).digest('hex');
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/throwaway.html'){res.setHeader('Content-Type','text/html');res.end(app);return}const file=path.resolve(data,'.'+name);if(!file.startsWith(data+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type','application/json');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});

const results=[];async function ready(p,w='now'){await p.waitForFunction(w=>__mnRebuild[w]?.()?.idle,w)}
(async()=>{fs.mkdirSync('.evidence',{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{
const derived=JSON.parse(fs.readFileSync(path.join(data,'market-navigator-rebuild-data/market-evidence/derived-indices-persistent-v1.json')));
for(const channel of (process.env.MN_BROWSER_CHANNELS||'chrome,msedge').split(',')){const browser=await chromium.launch({channel,headless:true});try{for(const viewport of [{width:1440,height:900},{width:412,height:915}]){const p=await browser.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.MN_SYNC_BROWSER_URL||'http://127.0.0.1:'+server.address().port+'/throwaway.html');await ready(p);await p.locator('#legend [data-id="growth"]').click();await ready(p);
for(const which of ['now','analyze']){if(which==='analyze'){await p.locator('#legend [data-id="risk"]').click({button:'right'});await p.locator('#analyzeNowSeries26').click();await ready(p,which)}const prefix=which==='now'?'':'mn-analyze-';
for(const key of ['risk','growth','macro'])for(const h of ['1D','5D','MTD','YTD','1YR','3YR','5YR'])for(const display of ['fixed','horizon']){
await p.evaluate(o=>__mnRebuild.instances()[o.which].configure({view:'index',anchor:o.key,series:[o.key],horizon:o.h,display:o.display,representation:'indexed'}),{which,key,h,display});await ready(p,which);
const c=await p.evaluate(w=>__mnIndexCalculation(__mnRebuild[w]().state),which),r=derived.indices[key].horizons[h];assert.equal(c.rows.length,7);
for(let i=0;i<7;i++){const row=c.rows[i],src=r.components[i],signal=display==='fixed'?src.signalNow:100*(src.signalNow-src.signalT0)/r.baseline;assert.equal(row.id,src.id);assert(Math.abs(row.level-100-signal)<1e-8);assert.equal(row.observation,src.sourceNowDate);assert.equal(row.scale,src.transformScale);assert.equal(row.weight,1/7)}
assert(Math.abs(c.rows.reduce((s,r)=>s+r.level,0)/7-c.plotted)<1e-8);results.push({channel,viewport,which,key,h,display,value:c.value})}
await p.evaluate(w=>__mnRebuild.instances()[w].configure({view:'index',anchor:'risk',series:['risk','spy','hyg','vix'],horizon:'MTD',display:'fixed',representation:'dual'}),which);await ready(p,which);const before=await p.evaluate(w=>__mnRebuild[w]().state,which);
await p.locator('#'+prefix+'nowMoreBtn').click();await p.locator('#'+prefix+'nowCalculation').click();await p.locator('#indexCalculationDialog[open]').waitFor();assert.equal(await p.locator('[data-calculation-source]').count(),7);
const event=p.waitForEvent('download');await p.locator('#downloadIndexCalculation').click();const c=JSON.parse(fs.readFileSync(await (await event).path(),'utf8'));assert.equal(c.rows.length,7);assert(Math.abs(c.value-c.plotted)<1e-8);
await p.screenshot({path:'.evidence/calculation-'+channel+'-'+viewport.width+'-'+which+'.png'});await p.keyboard.press('Escape');assert.deepEqual(await p.evaluate(w=>__mnRebuild[w]().state,which),before);
}assert.deepEqual(errors,[]);await p.close()}}finally{await browser.close()}}
fs.writeFileSync('.evidence/chart-correction-calculation-tests.json',JSON.stringify({status:'PASS',application_blob:blob,results},null,2));console.log(JSON.stringify({status:'PASS',cases:results.length,application_blob:blob}));}finally{server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
