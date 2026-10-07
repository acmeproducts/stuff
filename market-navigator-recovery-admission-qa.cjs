// Verify the admission barrier before any current chart is painted, independently of AI.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('./market-navigator-recovery-runtime.cjs');
const {server,OUT}=require('./market-navigator-recovery-qa.cjs');
const emit=server.listeners('request')[0];server.removeAllListeners('request');server.on('request',(req,res)=>{const end=res.end.bind(res);res.end=(body,...args)=>{if(req.url.split('?')[0].endsWith('.html')&&body)body=Buffer.from(body.toString().replace('boot();','window.__mnAdmissionOracle={load:recoveryLoadCorpus26};boot();'));return end(body,...args)};emit(req,res)});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,channel:process.env.MN_CHANNEL||'chrome'}),checks=[];
 try{for(const viewport of [{width:1887,height:800},{width:1440,height:900},{width:800,height:1280},{width:412,height:915}]){
  const ctx=await browser.newContext({viewport,hasTouch:viewport.width<=800}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.clock.install();let held=true,expires=0,requests=0;
  await p.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:r.request().url().includes('marked')?'window.marked={parse:s=>s}':'window.DOMPurify={sanitize:s=>s}'}));
  await p.route('**/market-evidence/corpus-health.json',async r=>{requests++;let response=await r.fetch(),c=await response.json();if(held)c.publicationStatus='held';if(expires)for(const row of [...Object.values(c.series),...Object.values(c.indices)])row.validUntil=new Date(expires).toISOString();await r.fulfill({json:c})});
  await p.goto('http://127.0.0.1:'+server.address().port+'/market-navigator-recovery-candidate.html');await p.waitForSelector('[data-data-hold]');
  assert.equal(await p.evaluate(()=>window.__mnRecovery.now().counts.canvasPaints),0,'held data must not have a first paint');assert.equal(await p.evaluate(()=>window.__mnRecovery.now().state),null);
  checks.push({viewport:viewport.width,name:'held corpus is stopped before the first chart paint'});
  // Repair is simulated at the publication boundary; the owned timer resumes NOW with no user click.
  held=false;await p.clock.fastForward(60001);await p.waitForFunction(()=>window.__mnRecovery.now().counts.canvasPaints>0&&!document.querySelector('[data-data-hold]'));
  assert(requests>=3);checks.push({viewport:viewport.width,name:'healthy publication resumes NOW automatically without user correction'});
  const before=await p.evaluate(()=>window.__mnRecovery.now().state);
  expires=await p.evaluate(()=>Date.now()+2000);
  await p.evaluate(()=>window.__mnAdmissionOracle.load(true));
  await p.locator('#hzs [data-h="1YR"]').click();await p.waitForFunction(()=>window.__mnRecovery.now().state.horizon==='1YR'&&window.__mnRecovery.idle());
  const frozen=await p.evaluate(()=>window.__mnRecovery.now().state);await p.clock.fastForward(2001);await p.waitForSelector('[data-data-hold]');
  assert.equal(await p.locator('#nowChart').evaluate(el=>getComputedStyle(el).visibility),'hidden');assert.deepEqual(await p.evaluate(()=>window.__mnRecovery.now().state),frozen);
  checks.push({viewport:viewport.width,name:'native deadline expires before chart interaction or AI, preserving captured state'});
  // A new audit timestamp cannot turn an expired native deadline into current data.
  await p.clock.fastForward(60001);assert(await p.locator('[data-data-hold]').isVisible());assert(await p.locator('#nowMoreBtn').isDisabled());
  checks.push({viewport:viewport.width,name:'fresh audit timestamp cannot admit expired source/model evidence'});
  if(await p.locator('#rail').evaluate(el=>el.classList.contains('closed')))await p.locator('#toggle').click();await p.locator('[data-view="library"]').click();assert(await p.locator('#view-library').evaluate(el=>el.classList.contains('on')));assert.deepEqual(await p.evaluate(()=>window.__mnRecovery.now().state),frozen);
  checks.push({viewport:viewport.width,name:'Library remains available during current-data recovery'});
  expires=0;await p.locator('[data-view="now"]').click();await p.clock.fastForward(60001);await p.waitForFunction(()=>!document.querySelector('[data-data-hold]')&&window.__mnRecovery.idle());
  assert.notDeepEqual(await p.evaluate(()=>window.__mnRecovery.now().state),before);assert.deepEqual(errors,[]);
  checks.push({viewport:viewport.width,name:'deadline recovery restores current NOW without changing Library'});await p.close();
  const initial=await ctx.newPage(),initialErrors=[];initial.on('pageerror',e=>initialErrors.push(e.message));await initial.clock.install();let corrupt=true;
  await initial.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:r.request().url().includes('marked')?'window.marked={parse:s=>s}':'window.DOMPurify={sanitize:s=>s}'}));
  await initial.route('**/market-evidence/derived-indices-persistent-v1.json',async r=>{const response=await r.fetch();if(!corrupt)return r.fulfill({response});const value=await response.json();value.indices.risk.horizons['5D'].curve[0].v+=50;return r.fulfill({json:value})});
  await initial.goto('http://127.0.0.1:'+server.address().port+'/market-navigator-recovery-candidate.html');await initial.waitForSelector('[data-bootstrap-hold]');
  assert.equal(await initial.evaluate(()=>window.__mnRecovery.now()?.counts.canvasPaints||0),0);assert.equal(await initial.locator('#nowChart').count(),1,'bootstrap failure must preserve the canonical chart DOM');
  checks.push({viewport:viewport.width,name:'initial publication-byte failure stops before first paint and preserves chart DOM'});
  if(await initial.locator('#rail').evaluate(el=>el.classList.contains('closed')))await initial.locator('#toggle').click();await initial.locator('[data-view="library"]').click();assert(await initial.locator('#view-library').evaluate(el=>el.classList.contains('on')));
  corrupt=false;await initial.clock.fastForward(60001);await initial.waitForFunction(()=>window.__mnRecovery.now()?.counts.canvasPaints>0&&!document.querySelector('[data-bootstrap-hold]'));
  assert(await initial.locator('#view-library').evaluate(el=>el.classList.contains('on')));assert.deepEqual(initialErrors,[]);
  checks.push({viewport:viewport.width,name:'initial publication recovery needs no reload and preserves Library navigation'});await ctx.close();
 }}finally{await browser.close();server.close()}
 fs.writeFileSync(path.join(OUT,'admission-report.json'),JSON.stringify({status:'PASS',channel:process.env.MN_CHANNEL||'chrome',emulation:true,checks,providerCalls:0,fixture:'synthetic publication faults; not real provider availability'},null,2));console.log('PASS pre-display admission',checks.length,'checks')
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1});
