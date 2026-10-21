'use strict';
const assert=require('assert/strict'),fs=require('fs'),http=require('http'),path=require('path');
const {chromium}=require(process.env.MN_PLAYWRIGHT_MODULE);
const root=path.resolve('.sync-publish/historical');
if(!fs.existsSync(root)){console.log('No qualified historical package; no historical option may be published');process.exit(0)}
const c=JSON.parse(fs.readFileSync(path.join(root,'connection.json'))),cutoff=c.historicalCutoff;
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;if(name==='/current/throwaway.html'){res.setHeader('Content-Type','text/html');return res.end(fs.readFileSync(path.join(root,'throwaway.html')))}let rel=name,folder=root;if(name.startsWith('/current/previous/'))rel=name.slice('/current/previous'.length);else if(name.startsWith('/current/')){folder=path.resolve('market-navigator-throwaway-review');rel=name.slice('/current'.length)}const f=path.resolve(folder,'.'+rel);if(!f.startsWith(folder+path.sep))throw Error();res.setHeader('Content-Type',name.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let b;try{
 b=await chromium.launch({channel:'chromium',headless:true});
 for(const width of[412,1440]){
 const page=await b.newPage({viewport:{width,height:915}});
 const base='http://127.0.0.1:'+server.address().port+'/throwaway.html';
 await page.goto('http://127.0.0.1:'+server.address().port+'/current/throwaway.html');await page.locator('#mnIncompleteNotice').waitFor();if(width<500)await page.locator('#toggle').click();await page.locator('#mnEtlLauncher').click();await page.locator('#etlUsePrevious').waitFor();assert((await page.locator('#etlUsePrevious').innerText()).includes(cutoff));await page.locator('#etlUsePrevious').click();await page.locator('#mnHistoricalNotice').waitFor();assert(page.url().includes('historical='+cutoff));
 await page.goto(base);await page.locator('#mnIncompleteNotice').waitFor();assert(!await page.locator('#nowChart').isVisible(),'Historical package must require explicit selection');
 await page.goto(base+'?historical=2000-01-01');await page.locator('#mnIncompleteNotice').waitFor();assert(!await page.locator('#nowChart').isVisible(),'Wrong cutoff cannot authorize history');
 await page.goto(base+'?historical='+cutoff);await page.locator('#mnHistoricalNotice').waitFor();await page.waitForFunction(()=>window.__mnRebuild?.now()?.idle);
 assert(await page.locator('#nowChart').isVisible());const heading=await page.locator('.top').boundingBox(),tag=await page.locator('#mnHistoricalNotice').boundingBox();assert(tag.y>=heading.y&&tag.y+tag.height<=heading.y+heading.height+1,'Historical label must fit the existing heading');assert(await page.locator('#mnEtlHistoricalBadge').count()===1);assert(!await page.locator('.brand').innerText().then(t=>/canonical/i.test(t)),'No unexplained brand tagline');assert((await page.locator('#mnHistoricalNotice').innerText()).includes(cutoff));assert(!await page.locator('body').evaluate(n=>n.classList.contains('mnIncomplete')));
 const q=await page.evaluate(()=>__mnEtlReceipt().qualification);assert.equal(q.historicalCutoff,cutoff);
 const baseData=new URL('market-navigator-rebuild-data/',page.url()).href;
 const catalog=await(await page.request.get(baseData+'data/market-backend/data-catalog.json')).json();
 for(const m of catalog.series.filter(m=>m.enabled!==false)){const source=await(await page.request.get(baseData+'market-evidence/series/'+m.id+'.json')).json();assert(source.observations.every(p=>new Date(p.t).toISOString().slice(0,10)<=cutoff),'Source after cutoff: '+m.id)}
 const derived=await(await page.request.get(baseData+'market-evidence/derived-indices-persistent-v1.json')).json();assert.equal(derived.commonMarketAnchor,cutoff);assert(Object.values(derived.indices).every(index=>Object.values(index.horizons).every(h=>h.curve.every(p=>new Date(p.t).toISOString().slice(0,10)<=cutoff))));
 const ai=await page.evaluate(()=>{const st=__mnShip25.shipState();st.verification=__mnEtlReceipt().qualification;return __mnShip25.aiEvidence(st)});assert(JSON.stringify(ai).includes('Explicit historical data through '+cutoff));
 for(const [button,label]of[['nowCsv','historical_cutoff,data_scope'],['nowMarkdown','Historical data through '+cutoff],['nowJson','historicalCutoff']]){
  await page.locator('#nowMoreBtn').click();const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#'+button).click()]);const stream=await download.createReadStream();let text='';for await(const part of stream)text+=part.toString();assert(text.includes(label),'Historical scope missing in '+button);assert(text.includes(cutoff));
 }
 await page.screenshot({path:'.evidence/historical-'+width+'.png'});
 await page.locator('#mnHistoricalNotice').click();await page.locator('#etlCurrentStatus').waitFor();assert(await page.locator('#view-etl').isVisible());await page.screenshot({path:'.evidence/historical-etl-'+width+'.png'});
 await page.close();
 }
 fs.writeFileSync('.evidence/historical-acceptance.json',JSON.stringify({status:'PASS',cutoff,application_blob:c.application_blob,data_version:c.data_version,explicitChoice:true,wrongCutoffBlocked:true,profiles:2,qualification:c.qualification},null,2));
 console.log(JSON.stringify({status:'PASS',cutoff,profiles:2}));
 }finally{await b?.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
