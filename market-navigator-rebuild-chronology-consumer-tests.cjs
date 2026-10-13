'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('./market-navigator-rebuild-runtime.cjs');
const insights=require('./market-navigator-rebuild-insights.js');
const root=process.env.MN_TEST_DATA_ROOT||'market-navigator-rebuild-data';
const read=p=>JSON.parse(fs.readFileSync(root+'/'+p,'utf8'));
const metadata={derived:read('market-evidence/derived-indices-persistent-v1.json'),def:read('data/market-backend/derived-index-definition-persistent-v1.json'),health:read('market-evidence/health-envelope.json'),catalog:read('data/market-backend/data-catalog.json')};
const registry=read('data/market-backend/component-registry-v1.json'),seed=JSON.parse(fs.readFileSync('market-navigator-rebuild-seed.json','utf8'));
const native=Object.fromEntries(metadata.catalog.series.map(meta=>[meta.id,read('market-evidence/series/'+meta.id+'.json')]));
const date=t=>new Date(t).toISOString().slice(0,10),rules=Object.fromEntries(registry.components.map(p=>[p.id,p]));
function independentIndex(id,day){const original=seed.indices[id];let total=0;for(const sid of original.components){const point=native[sid].observations.filter(p=>date(p.t)<=day).at(-1),r=rules[sid],anchor=original.componentValues[sid][0];assert(point,'Actual canonical input exists for '+sid+' '+day);total+=r.direction*(r.transformFamily==='log_return'?Math.log(point.v)-Math.log(anchor):point.v-anchor)/r.scale.annualizedScale}return 100+total/7}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
 await page.setContent('<div id="now"></div><div id="analyze"></div><div id="library"></div>');await page.addScriptTag({content:fs.readFileSync('market-navigator-rebuild-chart.js','utf8')});
 await page.evaluate(async({metadata,native})=>{const service={metadata,getSeries:async id=>native[id],onInfo:()=>{}};window.charts={now:MNChart.mount(document.getElementById('now'),{series:['growth','qqq','wti'],anchor:'growth',horizon:'5D',display:'fixed',canvas:{width:480,height:240}},service),analyze:MNChart.mount(document.getElementById('analyze'),{series:['risk','spy'],anchor:'risk',horizon:'5D',display:'fixed',canvas:{width:320,height:200}},service)};await Promise.all(Object.values(charts).map(c=>c.whenReady()))},{metadata,native});
 const snap=await page.evaluate(()=>charts.now.getSnapshot());
 // Expected endpoint is from actual native inputs, not derived.commonMarketAnchor.
 const actualClock=Math.max(...['qqq','wti','smallCaps','copper'].map(id=>native[id].observations.at(-1).t));assert.equal(date(snap.chart.window.end),date(actualClock));
 for(const point of snap.chart.series.find(s=>s.id==='growth').points){assert(Math.abs(point.raw-independentIndex('growth',date(point.t)))<1e-10);assert(point.knownBy,'Index point retains later availability');assert.equal(Object.keys(point.nativeInputs).length,7)}
 const md=insights.seriesExplanation(snap);assert(md.includes('Plotted window:')&&md.includes('Requested window:')&&md.includes('not information available at historical market close'));
 await page.evaluate(()=>{window.saved=charts.now.getSnapshot();window.replay=MNChart.mount(document.getElementById('library'),{controls:'none',canvas:{width:588,height:280}},{readOnly:true});replay.renderSnapshotState(saved);});
 const replay=await page.evaluate(()=>replay.getSnapshot());assert.deepEqual(replay.chart.series,snap.chart.series,'Library replay preserves native inputs and knownBy');assert.deepEqual(replay.chart.window,snap.chart.window);
 await page.locator('#now [data-mn-role="nowAddSeries"]').click();await page.locator('#now [data-mn-role="nowPickerSearch"]').fill('spy');await page.locator('#now [data-add-now="spy"]').click();await page.locator('#now [data-added-now="spy"]').waitFor();assert(await page.locator('#now [data-mn-role="nowPicker"]').isVisible(),'Add remains open');await page.locator('#now [data-remove-added="spy"]').click();await page.locator('#now [data-add-now="spy"]').waitFor();assert(await page.locator('#now [data-mn-role="nowPicker"]').isVisible());
 const isolated=await page.evaluate(()=>charts.analyze.getSnapshot());assert.deepEqual(isolated.series,['risk','spy']);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({gate:'source-derived chronology, frozen Library provenance and persistent Add',checks:22,consoleErrors:errors.length,baselineBlob:crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+fs.statSync('market-navigator-turn28-post-ship.html').size+'\0'),fs.readFileSync('market-navigator-turn28-post-ship.html')])).digest('hex')}));
 }finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
