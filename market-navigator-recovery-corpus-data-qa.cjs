const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('./market-navigator-recovery-runtime.cjs');
const {server,setup,click,OUT}=require('./market-navigator-recovery-qa.cjs'),{add}=require('./market-navigator-recovery-interactions.cjs');
const root=process.env.MN_CORPUS_DATA_ROOT||'market-navigator-corpus-snapshot',baseHandler=server.listeners('request')[0];
server.removeAllListeners('request');server.on('request',(req,res)=>{let rel=decodeURIComponent(req.url.split('?')[0]).slice(1);if((rel.startsWith('market-evidence/')||rel.startsWith('data/market-backend/'))&&rel.endsWith('.json')){let file=path.resolve(root,rel);if(!file.startsWith(path.resolve(root)+path.sep))return res.writeHead(403).end();try{res.setHeader('Content-Type','application/json');return res.end(fs.readFileSync(file))}catch{return res.writeHead(404).end()}}return baseHandler(req,res)});
async function main(){await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:process.env.MN_CHANNEL||'chrome'}),checks=[];try{for(const vp of [{width:1887,height:800},{width:1440,height:900},{width:800,height:1280},{width:412,height:915}]){const {p,ctx,errors}=await setup(browser,'market-navigator-recovery-candidate.html',vp);
const data=JSON.parse(fs.readFileSync(path.join(root,'market-evidence/derived-indices-persistent-v1.json'),'utf8'));
assert.equal(await p.locator('#range').innerText(),data.indices.risk.horizons['5D'].commonT0+' → '+data.commonMarketAnchor);
assert.match(await p.locator('#nowMeta').innerText(),/capture gap|uncaptured gap|Uncaptured history gap/);
const notice=await p.locator('#nowMeta [role="status"]').evaluate(el=>{const box=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect();return {scroll:el.scrollWidth,width:el.clientWidth,box:box.toJSON(),parent:parent.toJSON()}});
assert(notice.scroll<=notice.width+1&&notice.box.left>=notice.parent.left&&notice.box.right<=notice.parent.right&&notice.box.bottom<=notice.parent.bottom, 'the entire gap notice must be visible, including on phone: '+JSON.stringify(notice));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'market-evidence/persistent-indices-v1.json'),'utf8'));
for(const z of (await p.evaluate(()=>window.__mnRecovery.now().state)).chart.series){const row=ledger.indices[z.id],h=data.indices[z.id].horizons['5D'],expected=row.timestamps.filter((t,i)=>row.dates[i]>=h.commonT0&&row.dates[i]<=h.commonNow);assert.deepEqual(z.points.map(q=>q.t),expected,'only actual persisted captures may appear; uncaptured gaps cannot become interpolated observations');}
await p.screenshot({path:path.join(OUT,'corpus-gap-'+vp.width+'.png')});
await click(p,'#hzs [data-h="1YR"]');assert.match(await p.locator('#nowMeta').innerText(),/Index history contains an uncaptured gap/);
await click(p,'#legend [data-id="growth"]');await p.locator('#legend [data-id="qqq"]').click({button:'right'});await click(p,'#analyzeNowSeries26');assert(!/capture gap|uncaptured gap/.test(await p.locator('#view-analyze [data-mn-role="nowMeta"]').innerText()),'raw series do not inherit composite gaps');
await add(p,'gdpQoq','#view-analyze');const st=await p.evaluate(()=>window.__mnRecovery.analyze().state),z=st.chart.series.find(z=>z.id==='gdpQoq');
assert(z&&z.unit==='percent');assert(z.points.every(q=>Math.abs(q.raw)<100),'GDP levels must not appear as percentages');assert.deepEqual(errors,[]);
checks.push({viewport:vp.width,range:data.commonMarketAnchor,shortHistory:'actual persisted captures only; uncaptured gap disclosed',longHistory:'uncaptured gap disclosed',rawClock:'independent',GDP:'governed percentage transform',consoleErrors:0});await ctx.close();
}}finally{await browser.close();server.close()}
fs.writeFileSync(path.join(OUT,'corpus-data-report.json'),JSON.stringify({status:'PASS',channel:process.env.MN_CHANNEL||'chrome',emulation:true,root,checks},null,2));console.log('PASS actual repaired corpus, all four layouts')}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
