'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),crypto=require('crypto');
const {chromium}=process.env.MN_PLAYWRIGHT_MODULE?require(process.env.MN_PLAYWRIGHT_MODULE):require('./market-navigator-rebuild-runtime.cjs');
const root=path.resolve(process.env.MN_CHART_CANDIDATE_ROOT||'.evidence/chart-correction-candidate'),data=path.resolve(process.env.MN_SYNC_BROWSER_ROOT||'market-navigator-throwaway-review'),app=fs.readFileSync(path.join(root,'throwaway.html'));
const application_blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+app.length+'\0'),app])).digest('hex');
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=name==='/throwaway.html'?path.join(root,'throwaway.html'):path.resolve(data,'.'+name);if(!file.startsWith(data+path.sep)&&file!==path.join(root,'throwaway.html'))return res.writeHead(403).end();try{res.setHeader('Content-Type',name.endsWith('.html')?'text/html':'application/json');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}});
const results=[];async function ready(p,w='now'){await p.waitForFunction(w=>__mnRebuild[w]?.()?.idle,w)}
async function configure(p,w,opts){await p.evaluate(async({w,opts})=>await __mnRebuild.instances()[w].configure(opts),{w,opts});return p.evaluate(w=>__mnRebuild[w]().state,w)}
function xy(box,s,z,q){const l=box.width<430?48:58,r=s.mode==='dual'?l:12,a=s.axes[z.axis?'right':'left'];return{x:box.x+l+(q.t-s.window.start)/(s.window.end-s.window.start)*(box.width-l-r),y:box.y+22+(a.max-q.v)/(a.max-a.min)*(box.height-56)}}
(async()=>{fs.mkdirSync('.evidence',{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{for(const channel of (process.env.MN_BROWSER_CHANNELS||'chrome,msedge').split(',')){const b=await chromium.launch({channel,headless:true});try{for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:1024,height:768},{width:412,height:915}]){const p=await b.newPage({viewport,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.MN_SYNC_BROWSER_URL||'http://127.0.0.1:'+server.address().port+'/throwaway.html');await ready(p);await p.locator('#legend [data-id="growth"]').click();await ready(p);
for(const w of ['now','analyze']){if(w==='analyze'){await configure(p,'now',{view:'index',anchor:'growth',series:['growth','qqq'],horizon:'5D'});await p.locator('#legend [data-id="qqq"]').click({button:'right'});await p.locator('#analyzeNowSeries26').click();await ready(p,w)}
const pre=w==='now'?'':'mn-analyze-',canvas=p.locator('#'+pre+'nowChart'),tip=p.locator('#'+pre+'nowTip'),info=p.locator('#'+pre+'nowSeriesAbout');
for(const key of ['risk','growth','macro'])for(const h of ['1D','5D','MTD','YTD','1YR','3YR','5YR']){
const s=await configure(p,w,{view:'index',anchor:key,series:[key],expandedComponents:true,horizon:h,representation:'indexed',display:'fixed'});for(const z of s.chart.series){const chip=p.locator('#'+pre+'legend [data-id="'+z.id+'"]');assert.equal(await chip.isDisabled(),z.points.length===0,z.id+' eligibility');if(['risk','growth','macro'].includes(z.id))assert(z.points.length>0,'An index must never be disabled');for(const a of Object.values(s.chart.axes))assert(Number.isFinite(a.min)&&Number.isFinite(a.max)&&a.max>a.min)}
results.push({id:'eligibility-axis',channel,viewport,w,key,h})}
let s=await configure(p,w,{view:'series',anchor:'qqq',series:['qqq'],activeSeries:'qqq',horizon:'5YR',representation:'indexed',display:'fixed'});const z=s.chart.series[0],box=await canvas.boundingBox();
assert(box.x>=0&&box.y>=0&&box.x+box.width<=viewport.width+1&&box.y+box.height<=viewport.height+1,'Chart fits all four viewport profiles');
for(const q of [z.points[0],z.points.at(-1),z.points.reduce((a,b)=>a.v<b.v?a:b),z.points.reduce((a,b)=>a.v>b.v?a:b)]){
const pt=xy(box,s.chart,z,q);await p.mouse.move(pt.x,pt.y);await tip.waitFor({state:'visible'});const t=await tip.boundingBox();assert(t.x>=box.x-1&&t.y>=box.y-1&&t.x+t.width<=box.x+box.width+1&&t.y+t.height<=box.y+box.height+1,'Edge inspection remains inside chart');
assert.equal(await tip.locator('.inspectionValues > [data-inspection-source]').count(),1);assert.equal(await tip.locator('.inspectionValues').innerText().then(s=>s.split('|').length),3);
await p.mouse.click(pt.x,pt.y);assert(!(await info.isVisible()));await p.mouse.click(pt.x,pt.y,{button:'right'});assert(!(await info.isVisible()));await p.mouse.move(pt.x,pt.y);await p.mouse.down();await p.waitForTimeout(650);await p.mouse.up();assert(!(await info.isVisible()),'Plot long press cannot open information');await p.touchscreen.tap(pt.x,pt.y);assert(!(await info.isVisible()));await p.keyboard.press('Escape');assert(!(await tip.isVisible()));}
results.push({id:'plot-gestures-edge-inspection',channel,viewport,w});
await p.locator('#'+pre+'legend [data-id="qqq"]').click({button:'right'});assert(await info.isVisible());await info.locator('[id$="closeNowSeriesAbout"]').click();
for(const order of [['growth','risk','macro','qqq','wti','copper'],['growth','copper','wti','qqq','macro','risk']]){
const mixed=await configure(p,w,{view:'index',anchor:'growth',series:order,horizon:'5D',representation:'dual',display:'fixed'});
const dollars=mixed.chart.series.filter(z=>['qqq','wti','copper'].includes(z.id));assert.equal(dollars.length,3);
for(const z of mixed.chart.series){assert.equal(z.axis,['qqq','wti','copper'].includes(z.id)?1:0);if(['qqq','wti','copper'].includes(z.id)){assert(z.points.length);for(const q of z.points)assert.equal(q.v,q.raw,'Dollar grouping retains actual native quotes')}}
const before=JSON.stringify(mixed.chart);
for(const z of dollars){await p.locator('#'+pre+'legend [data-id="'+z.id+'"]').click({button:'right'});await info.waitFor({state:'visible'});const text=await info.locator('[data-dollar-unit="'+z.id+'"]').innerText();assert(text.includes(z.unit),'Card shows exact native unit '+z.unit);assert(text.includes('Dollar-based series share the dollar axis'));assert(text.includes('does not convert'));await info.locator('[id$="closeNowSeriesAbout"]').click();assert.equal(JSON.stringify(await p.evaluate(w=>__mnRebuild[w]().state.chart,w)),before,'Information card preserves modes, axes, values and source dates')}
}
results.push({id:'dollar-grouping-unit-disclosure',channel,viewport,w});
s=await configure(p,w,{view:'index',anchor:'growth',series:['growth','qqq','spy'],horizon:'5D',representation:'dual',display:'fixed'});
for(const [button,kind] of [['nowJson','json'],['nowCsv','csv'],['nowMarkdown','md']]){
await p.locator('#'+pre+'nowMoreBtn').click();const event=p.waitForEvent('download');await p.locator('#'+pre+button).click();const d=await event,text=fs.readFileSync(await d.path(),'utf8');assert(text.length>50);
if(kind==='json'){const out=JSON.parse(text);assert.deepEqual(out.chart.series,s.chart.series,'JSON preserves all plotted/source/indexed values');assert.equal(out.verification.status,'resource-hash-verified','Integrity proof cannot be silently relabeled delayed')}
if(kind==='csv'){const lines=text.split('\n');assert.equal(lines.length,1+s.chart.series.reduce((n,z)=>n+z.points.length,0));for(const z of s.chart.series)for(const q of z.points)assert(text.includes('"'+q.raw+'"'),'CSV native value')}
if(kind==='md')for(const z of s.chart.series)for(const q of z.points)assert(text.includes('| '+q.v+' |'),'Markdown plotted value');
}
await p.evaluate(()=>{window.__auditPrintCalled=false;window.print=()=>{window.__auditPrintCalled=true}});
await p.locator('#'+pre+'nowMoreBtn').click();await p.locator('#'+pre+'nowPrint').click();await p.waitForFunction(()=>window.__auditPrintCalled&&window.__mnNowPrintInvariant25?.chartWidth>0);
const proof=await p.evaluate(()=>window.__mnNowPrintInvariant25);assert.equal(proof.horizon,'5D');assert.equal(proof.before,proof.after,'Print preserves NOW');assert(proof.chartHeight>0);assert.equal(await p.locator('#nowPrintReport').getAttribute('aria-hidden'),'false');
await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
results.push({id:'export-proof-identity',channel,viewport,w});await p.screenshot({path:'.evidence/contract-'+channel+'-'+viewport.width+'-'+w+'.png'});
}assert.deepEqual(errors,[]);await p.close()}}finally{await b.close()}}
fs.writeFileSync('.evidence/chart-contract-tests.json',JSON.stringify({status:'PASS',application_blob,results},null,2));console.log(JSON.stringify({status:'PASS',application_blob,cases:results.length}));}finally{server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
