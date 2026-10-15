'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm');
const {chromium,babel}=require('./market-navigator-rebuild-runtime.cjs');
const ROOT=__dirname,FIXTURE=path.join(ROOT,'market-navigator-chart-only-review');
const url=process.env.MN_CHART_ONLY_URL||'http://127.0.0.1:8787/market-navigator-chart-only-review/market-navigator-chart-only-candidate.html';
const candidateFile=path.join(FIXTURE,'market-navigator-chart-only-candidate.html'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=['market-navigator-chart-only-build.cjs','market-navigator-chart-only-extract.cjs','market-navigator-chart-only-analyze.cjs','market-navigator-rebuild-runtime.cjs'];
const identities={candidate:sha(candidateFile),sources:Object.fromEntries(files.map(f=>[f,sha(path.join(ROOT,f))]))};
const baselineBytes=fs.readFileSync(path.join(FIXTURE,'market-navigator-turn28-post-ship.html'));
identities.baselineBlob=crypto.createHash('sha1').update(Buffer.from('blob '+baselineBytes.length+'\0')).update(baselineBytes).digest('hex');
assert.equal(identities.baselineBlob,'9ce7f67451f9e1b7804927ce5c56adb667614724','Accepted touch oracle identity');
const derived=JSON.parse(fs.readFileSync(path.join(FIXTURE,'market-evidence/derived-indices-persistent-v1.json')));
function deferred(){let resolve;return{promise:new Promise(r=>resolve=r),resolve:()=>resolve()}}
async function bounded(promise,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(label)),10000))])}finally{clearTimeout(timer)}}
async function ready(page){await page.waitForFunction(()=>window.__chartOnly?.now()?.state&&__chartOnly.now().idle)}
async function ids(page){return page.evaluate(()=>{const seen=new Set(),duplicates=[];for(const e of document.querySelectorAll('[id]')){if(seen.has(e.id))duplicates.push(e.id);seen.add(e.id)}return duplicates})}
async function frames(page){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function runDesktop(browser){
 const context=await browser.newContext({viewport:{width:1440,height:900},timezoneId:'America/Los_Angeles'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await ready(page);assert.deepEqual(await ids(page),[]);
  const isolation=await page.evaluate(()=>{const n=__chartOnly.instances().now,before=n.getState(),copy=n.getState();copy.spec.h='INVALID';copy.state.chart.series[0].points[0].v=-999;copy.paint.sets[0].a[0].raw=-888;return{isolated:JSON.stringify(n.getState())===JSON.stringify(before),snapshotFrozen:Object.isFrozen(n.getSnapshot())&&Object.isFrozen(n.getSnapshot().chart.series[0].points[0]),optionsFrozen:Object.isFrozen(n.getOptions())}});
  assert.deepEqual(isolation,{isolated:true,snapshotFrozen:true,optionsFrozen:true});
  const sourceResponse=deferred(),sourceSeen=deferred();let rawRequests=0;
  await page.route('**/market-evidence/series/qqq.json',async route=>{rawRequests++;sourceSeen.resolve();await sourceResponse.promise;await route.continue()});
  const updates=page.evaluate(async()=>{const n=__chartOnly.instances().now;for(const h of ['1YR','MTD','5D'])n.update({level:2,index:'growth',componentsExpanded:false,nowComparisons:['qqq'],nowActive:'growth',h});await n.whenReady();return n.getState()});
  await bounded(sourceSeen.promise,'Expected delayed QQQ request');
  sourceResponse.resolve();const final=await updates;
  assert.equal(final.spec.h,'5D');assert.equal(final.state.horizon,'5D');assert.equal(final.state.chart.window.startLabel,derived.indices.growth.horizons['5D'].commonT0);assert.equal(final.state.chart.window.endLabel,derived.commonMarketAnchor);assert.equal(rawRequests,1,'Overlapping renders share original native retrieval');
  await page.unroute('**/market-evidence/series/qqq.json');
  await page.locator('#nowMoreBtn').click();await page.locator('#chartOnlyAnalyze').click();await page.waitForFunction(()=>__chartOnly.analyze()?.state&&__chartOnly.analyze().idle);assert.deepEqual(await ids(page),[]);
  const delayedResponse=deferred(),delayedSeen=deferred();let lateRequests=0;
  await page.route('**/market-evidence/series/custom_nvda.json',async route=>{lateRequests++;delayedSeen.resolve();await delayedResponse.promise;await route.continue()});
  const pending=page.evaluate(()=>__chartOnly.instances().analyze.update({nowComparisons:['custom_nvda']}));
  await bounded(delayedSeen.promise,'Expected delayed Analyze native request');
  assert.deepEqual(await ids(page),[],'No duplicate IDs during pending Analyze render');
  await page.locator('#rebuildAnalyzeClose').click();
  const closed=await page.evaluate(()=>({analyze:__chartOnly.analyze(),now:__chartOnly.now(),nowVisible:document.querySelector('#view-now').classList.contains('on'),analyzeVisible:document.querySelector('#view-analyze').classList.contains('on')}));
  assert.equal(closed.analyze,undefined);assert.equal(closed.nowVisible,true);assert.equal(closed.analyzeVisible,false);
  const finished=page.waitForResponse(r=>r.url().includes('/series/custom_nvda.json'));
  delayedResponse.resolve();await pending;await(await finished).finished();await frames(page);
  const settled=await page.evaluate(()=>({analyze:__chartOnly.analyze(),now:__chartOnly.now(),nowVisible:document.querySelector('#view-now').classList.contains('on'),analyzeVisible:document.querySelector('#view-analyze').classList.contains('on')}));
  assert.deepEqual(settled,closed,'Destroyed Analyze cannot resurrect or rewrite NOW after native data arrives');assert.equal(lateRequests,1);assert.deepEqual(await ids(page),[]);
  await page.unroute('**/market-evidence/series/custom_nvda.json');assert.deepEqual(errors,[]);
  return{snapshotIsolation:isolation,rapidHorizons:{requested:['1YR','MTD','5D'],final:'5D',sharedNativeRequests:rawRequests},destroyedAnalyze:{lateResponses:lateRequests,resurrection:false,nowUnchanged:true},duplicateIds:[],unexpectedErrors:errors};
 }finally{await context.close()}
}
async function runTouch(browser){
 const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true,deviceScaleFactor:1,timezoneId:'America/Los_Angeles'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(url);await ready(page);
  // The scale is the hash-protected accepted pure function, not candidate state.
  const baseline=fs.readFileSync(path.join(FIXTURE,'market-navigator-turn28-post-ship.html'),'utf8'),code=/<script>([\s\S]*?)<\/script>/.exec(baseline)[1],ast=babel.babelParse(code,'accepted-touch-oracle',false);let scaleSource;
  babel.traverse(ast,{FunctionDeclaration(p){if(p.node.id?.name==='scale')scaleSource=code.slice(p.node.start,p.node.end)}});assert(scaleSource);
  const oracle=vm.createContext({});vm.runInContext(scaleSource+';this.scaleOracle=scale;',oracle);
  const snapshot=await page.evaluate(()=>__chartOnly.now()),range=Array.from(oracle.scaleOracle(snapshot.paint.sets.flatMap(z=>z.a.map(p=>p.v)))),series=snapshot.state.chart.series.find(z=>z.id==='risk'),point=series.points[2],box=await page.locator('#nowChart').boundingBox(),padding={l:box.width<430?48:58,r:12,t:22,b:34};
  const x=box.x+padding.l+(point.t-snapshot.state.chart.window.start)/(snapshot.state.chart.window.end-snapshot.state.chart.window.start)*(box.width-padding.l-padding.r),y=box.y+padding.t+(range[1]-point.v)/(range[1]-range[0])*(box.height-padding.t-padding.b);
  await page.evaluate(()=>{window.__touchOwnership={pointerdown:0,touchstart:0};const c=document.querySelector('#nowChart');for(const type of ['pointerdown','touchstart'])c.addEventListener(type,()=>__touchOwnership[type]++)});
  const ownership=await page.evaluate(()=>{const c=document.querySelector('#nowChart');return{pointerHandler:typeof c.onpointerdown==='function',touchStartHandler:c.ontouchstart,touchMoveHandler:c.ontouchmove}});
  assert.deepEqual(ownership,{pointerHandler:true,touchStartHandler:null,touchMoveHandler:null});
  await page.touchscreen.tap(x,y);await page.waitForFunction(()=>__chartOnly.now().spec.level===2&&__chartOnly.now().idle);
  const result=await page.evaluate(()=>({index:__chartOnly.now().spec.index,events:__touchOwnership,infoHidden:document.querySelector('#info').classList.contains('hidden')}));
  assert.equal(result.index,'risk');assert.deepEqual(result.events,{pointerdown:1,touchstart:1});assert.equal(result.infoHidden,true);assert.deepEqual(errors,[]);
  return{nativeTouchEvents:result.events,interactionOwner:'pointerdown only; legacy touch handlers null',envDrill:'risk',normalClickInformation:false,unexpectedErrors:errors};
 }finally{await context.close()}
}
(async()=>{const channel=process.env.MN_CHANNEL||'chrome',browser=await chromium.launch({channel,headless:true}),report={schema:'market-navigator-chart-only-race-proof-v1',url,identities,channel,startedAt:new Date().toISOString(),status:'FAIL'};try{report.browserVersion=browser.version();report.desktop=await runDesktop(browser);report.touch=await runTouch(browser);assert.equal(sha(candidateFile),identities.candidate,'Candidate changed during qualification');for(const [name,hash]of Object.entries(identities.sources))assert.equal(sha(path.join(ROOT,name)),hash,'Source changed during qualification');report.status='PASS';console.log(JSON.stringify(report))}catch(error){report.error=String(error.stack||error);console.error(report.error);process.exitCode=1}finally{await browser.close();const destination=path.join(ROOT,'market-navigator-chart-only-evidence');fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(path.join(destination,'chart-only-race-'+channel+'.json'),JSON.stringify(report,null,2))}})();
