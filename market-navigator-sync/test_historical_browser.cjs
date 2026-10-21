'use strict';
const assert=require('assert/strict'),fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require(process.env.MN_PLAYWRIGHT_MODULE);
const root=path.resolve('.sync-publish/historical');
if(!fs.existsSync(root)){console.log('No qualified historical package; no historical option may be published');process.exit(0)}
const c=JSON.parse(fs.readFileSync(path.join(root,'connection.json'))),cutoff=c.historicalCutoff;
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const f=path.resolve(root,'.'+name);if(!f.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',name.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let b;try{
 b=await chromium.launch({channel:'chromium',headless:true});
 for(const width of[412,1440]){
 const page=await b.newPage({viewport:{width,height:915}});
 const base='http://127.0.0.1:'+server.address().port+'/throwaway.html';
 await page.goto(base);await page.locator('#mnIncompleteNotice').waitFor();assert(!await page.locator('#nowChart').isVisible(),'Historical package must require explicit selection');
 await page.goto(base+'?historical=2000-01-01');await page.locator('#mnIncompleteNotice').waitFor();assert(!await page.locator('#nowChart').isVisible(),'Wrong cutoff cannot authorize history');
 await page.goto(base+'?historical='+cutoff);await page.locator('#mnHistoricalNotice').waitFor();await page.waitForFunction(()=>!!document.getElementById('nowChart')?.width&&!!window.__mnEtlReceipt?.().package);
 assert(await page.locator('#nowChart').isVisible());assert((await page.locator('#mnHistoricalNotice').innerText()).includes(cutoff));assert(!await page.locator('body').evaluate(n=>n.classList.contains('mnIncomplete')));
 const facts=await page.evaluate(()=>({q:etlQualification(),derived:S.derived.commonMarketAnchor,rows:S.catalog.series.filter(m=>m.enabled!==false).map(m=>({id:m.id,last:S.series?.[m.id]?.last})),csv:stateCsv({verification:etlQualification(),chart:{series:[{id:'wti',label:'WTI',unit:'USD/barrel',points:[{t:Date.parse('2026-10-19'),idx:100,raw:70,v:100}]}]}}),md:stateMarkdown({verification:etlQualification()}),instruction:etlSnapshotInstruction(etlQualification())}));
 const bounded=await page.evaluate(async()=>{const catalog=await j('data/market-backend/data-catalog.json');const sources=await Promise.all(catalog.series.filter(m=>m.enabled!==false).map(m=>j('market-evidence/series/'+m.id+'.json')));return {sources:sources.every(s=>s.observations.every(p=>new Date(p.t).toISOString().slice(0,10)<=etlCompleteness.marketDate)),curves:Object.values(S.derived.indices).every(index=>Object.values(index.horizons).every(h=>h.curve.every(p=>new Date(p.t).toISOString().slice(0,10)<=etlCompleteness.marketDate)))}});assert(bounded.sources&&bounded.curves,'Every source and index horizon must respect historical cutoff');assert.equal(facts.derived,cutoff);assert.equal(facts.q.historicalCutoff,cutoff);assert(facts.csv.includes('historical_cutoff,data_scope'));assert(facts.csv.includes(cutoff));assert(facts.md.includes('Historical data through '+cutoff));assert(facts.instruction.includes('not a reconstruction'));
 await page.screenshot({path:'.evidence/historical-'+width+'.png'});
 await page.close();
 }
 fs.writeFileSync('.evidence/historical-acceptance.json',JSON.stringify({status:'PASS',cutoff,application_blob:c.application_blob,data_version:c.data_version,explicitChoice:true,wrongCutoffBlocked:true,profiles:2,qualification:c.qualification},null,2));
 console.log(JSON.stringify({status:'PASS',cutoff,profiles:2}));
 }finally{await b?.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
