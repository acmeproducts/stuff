import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT='market-navigator-turn26-ship.html';
const results=[];
function check(name,cond,detail=''){results.push({name,ok:!!cond,detail});if(!cond)throw new Error(name+(detail?' — '+detail:''))}
function server(){
  const s=http.createServer((req,res)=>{
    const p=decodeURIComponent(req.url.split('?')[0]);
    if(p==='/favicon.ico'){res.writeHead(204);res.end();return}
    const f=path.join(ROOT,p==='/'?ARTIFACT:p.slice(1));
    if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end('nf');return}
    const ext=path.extname(f),mime={'.html':'text/html','.json':'application/json','.js':'text/javascript','.css':'text/css'}[ext]||'application/octet-stream';
    res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});fs.createReadStream(f).pipe(res);
  });
  return new Promise(r=>s.listen(0,'127.0.0.1',()=>r(s)));
}
const AI=`# Current governed read

## Observed
The governed evidence is the basis for this response.

## Contemporaneous context
A current release and reputable reporting provide context without proving causation.

## Possible relationship
The timing is consistent with the observed move, but does not establish causation.

## Context & Further Reading
- **Data & Releases · 2026-09-18 · Federal Reserve:** [Federal Reserve release](https://www.federalreserve.gov/) — primary release context.
- **Related Reporting · 2026-09-18 · Reuters:** [Reuters Markets](https://www.reuters.com/markets/) — contemporaneous reporting context.
`;

(async()=>{
 const srv=await server(),origin='http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch();
 const ctx=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.addInitScript(()=>{
   localStorage.setItem('marketNavigatorAIRegistryV1',JSON.stringify({defaultProvider:'venice',providers:{venice:{verified:true,key:'qa-key',model:'qa-model',models:['qa-model']}}}));
   window.print=()=>{window.__qaPrint=(window.__qaPrint||0)+1};
 });
 await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(ROOT,'node_modules/marked/marked.min.js'),'utf8')}));
 await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(ROOT,'node_modules/dompurify/dist/purify.min.js'),'utf8')}));
 await page.route('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',r=>r.fulfill({status:200,contentType:'text/javascript',body:'window.XLSX=window.XLSX||{};'}));
 await page.route('https://api.venice.ai/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:AI}}]})}));
 try{
   await page.goto(origin+'/'+ARTIFACT,{waitUntil:'load'});
   await page.waitForFunction(()=>window.__mnShip25&&window.__mnShip25.ready()&&window.__mnTurn26,{timeout:30000});
   check('retained Turn25 qualification API',await page.evaluate(()=>!!window.__mnShip25&&typeof window.__mnShip25.record==='function'));
   check('retained Index Explanation',await page.locator('[aria-label="Explain index movement"]').count()===1);
   check('retained governed arithmetic',await page.evaluate(()=>window.__mnShip25.record('risk','1YR').status==='RECONCILED'));
   check('Turn26 API present',await page.evaluate(()=>window.__mnTurn26.version==='turn26-live-library-1'));
   // Turn 26 standalone Analyze correction.
   const nowBeforeStandalone=await page.evaluate(()=>JSON.stringify(window.__mnShip25.nowState?window.__mnShip25.nowState():null)).catch(()=>null);
   await page.locator('#legend [data-id="risk"]').click();
   await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent?.includes('*'));
   check('compact components breadcrumb uses star',await page.locator('#nowCrumb').textContent().then(t=>t.includes('*')&&!/COMPONENTS/.test(t)));
   const ribbonGeo=await page.evaluate(()=>{
     const hs=[...document.querySelectorAll('#hzs .hz')],m=document.getElementById('nowMoreBtn'),row=document.getElementById('nowChrome');
     const pack=r=>({left:+r.left.toFixed(1),right:+r.right.toFixed(1),width:+r.width.toFixed(1)});
     return{innerWidth,row:pack(row.getBoundingClientRect()),menu:pack(m.getBoundingClientRect()),horizons:hs.map(h=>({t:h.textContent,...pack(h.getBoundingClientRect())}))};
   });
   check('all horizons remain visible with menu',ribbonGeo.horizons.every(r=>r.left>=0&&r.right<=ribbonGeo.innerWidth)&&ribbonGeo.menu.left>=0&&ribbonGeo.menu.right<=ribbonGeo.innerWidth,JSON.stringify(ribbonGeo));
   const componentId=await page.evaluate(()=>[...document.querySelectorAll('#legend [data-id]')].map(x=>x.dataset.id).find(x=>!['risk','growth','macro'].includes(x)));
   check('component available for info-card test',!!componentId);
   await page.locator('#legend [data-id="'+componentId+'"]').dispatchEvent('contextmenu');
   await page.waitForSelector('#nowSeriesAbout:not(.hidden)');
   const sourceHref=await page.locator('#nowSeriesAbout a[target="_blank"]').getAttribute('href');
   check('info card Source deep-links exact Health entry',sourceHref&&sourceHref.includes('#health-source-'+componentId),sourceHref||'');
   check('info card exposes Analyze icon',await page.locator('#analyzeNowSeries26[title="Analyze"]').count()===1);
   const nowStateBeforeModal=await page.evaluate(()=>JSON.stringify(window.__mnShip25.nowState?window.__mnShip25.nowState():null)).catch(()=>null);
   await page.click('#analyzeNowSeries26');
   await page.waitForSelector('#standaloneAnalysis26:not(.hidden)');
   check('Analyze opens standalone modal',await page.locator('#standaloneAnalysis26[aria-modal="true"]').count()===1);
   check('modal primary starts from selected component',await page.evaluate(id=>window.__mnStandalone26&&window.__mnStandalone26.state().active===id,componentId));
   await page.locator('#standaloneAnalysis26').click({position:{x:2,y:2}});
   check('outside click does not dismiss standalone modal',await page.locator('#standaloneAnalysis26:not(.hidden)').count()===1);
   check('opening modal leaves NOW state unchanged',await page.evaluate(b=>JSON.stringify(window.__mnShip25.nowState?window.__mnShip25.nowState():null)===b,nowStateBeforeModal));
   await page.click('#analysisAdd26');
   await page.waitForSelector('#analysisPicker26:not(.hidden)');
   const addButton=page.locator('#analysisPickerList26 [data-analysis-add]:not([disabled])').first();
   if(await addButton.count()){
     const added=await addButton.getAttribute('data-analysis-add');
     await addButton.click();
     await page.waitForFunction(id=>document.querySelector('#seriesBar [data-analysis-id="'+id+'"]'),added);
     await page.locator('#seriesBar [data-analysis-id="'+added+'"]').click();
     check('added series can become primary',await page.evaluate(id=>window.__mnStandalone26.state().active===id,added));
   }
   await page.click('#analysisClose26');
   await page.waitForFunction(()=>document.getElementById('standaloneAnalysis26').classList.contains('hidden'));
   check('explicit X closes standalone modal',await page.locator('#standaloneAnalysis26.hidden').count()===1);
   check('closing modal restores unchanged NOW state',await page.evaluate(b=>JSON.stringify(window.__mnShip25.nowState?window.__mnShip25.nowState():null)===b,nowStateBeforeModal));


   await page.evaluate(()=>window.__mnShip25.startAI());
   await page.waitForFunction(()=>window.__mnCurrentAnalysis&&window.__mnCurrentAnalysis()&&window.__mnCurrentAnalysis().status==='ready',{timeout:20000});
   await page.waitForFunction(()=>document.querySelectorAll('#libList .row').length>0);
   const cardCount=await page.locator('#libList .row').count();
   const original=await page.evaluate(()=>JSON.stringify(window.__mnCurrentAnalysis().state));
   check('initial AI context collapsed',await page.locator('#transcript details.contextDetails26').count()>=1);
   check('context exposes Refresh Context',await page.locator('#transcript .refreshContext26').count()>=1);

   await page.click('#libQuestion26');
   await page.waitForSelector('#seedMenu26:not(.hidden)');
   const seeds=await page.locator('#seedMenu26 [data-seed26]').allTextContents();
   check('context-aware question menu populated',seeds.length>=5);
   check('question menu includes horizon extension',seeds.some(x=>/1 year/i.test(x)));
   await page.evaluate(()=>document.getElementById('seedMenu26').classList.add('hidden'));

   await page.fill('#compose','Extend this same analysis to 1 year. Does the current trend persist?');
   await page.click('#send');
   await page.waitForSelector('.liveResult26',{timeout:20000});
   check('live result is temporary',/Temporary live result/.test(await page.locator('.liveResult26').innerText()));
   check('live query uses governed 1YR horizon',await page.evaluate(()=>window.__mnTurn26.live().intent.horizon==='1YR'));
   check('live query is not yet durable',await page.evaluate(()=>window.__mnTurn26.checkpoints().length===0));
   check('live query does not spawn card',await page.locator('#libList .row').count()===cardCount);

   await page.click('#saveLive26');
   await page.waitForFunction(()=>window.__mnTurn26.checkpoints().length===1);
   check('Save in Analysis appends checkpoint',await page.evaluate(()=>window.__mnTurn26.checkpoints().length===1));
   check('same Library card after save',await page.locator('#libList .row').count()===cardCount);
   check('original frozen state immutable',await page.evaluate(o=>JSON.stringify(window.__mnCurrentAnalysis().state)===o,original));
   check('checkpoint strip contains Original + saved state',await page.locator('.checkpointStrip26 [data-cp26]').count()===2);
   const cp=await page.evaluate(()=>window.__mnTurn26.checkpoints()[0]);
   check('saved checkpoint carries query contract',cp.query&&cp.query.revision_mode==='extend-from-frozen');
   check('saved checkpoint retains governed explanation',cp.state&&cp.state.indexExplanation&&cp.state.modelHealth);

   await page.fill('#compose','Refresh this analysis current and tell me what changed.');
   await page.click('#send');
   await page.waitForSelector('.liveResult26',{timeout:20000});
   await page.click('#discardLive26');
   await page.waitForFunction(()=>!document.querySelector('.liveResult26'));
   check('Discard creates no checkpoint',await page.evaluate(()=>window.__mnTurn26.checkpoints().length===1));
   check('Discard creates no card',await page.locator('#libList .row').count()===cardCount);

   const modes=await page.evaluate(async()=>{
     const a=window.__mnCurrentAnalysis();
     const x=await window.__mnTurn26.query(a,{operation:'bring-current',horizon:'1YR',revisionMode:'extend-from-frozen'});
     const y=await window.__mnTurn26.query(a,{operation:'bring-current',horizon:'1YR',revisionMode:'current-vintage-restatement'});
     return [x.state.chart.revisionMode,x.state.chart.frozenOverlapPreserved,y.state.chart.revisionMode,y.state.chart.frozenOverlapPreserved];
   });
   check('revision modes remain distinct',modes[0]==='extend-from-frozen'&&modes[1]===true&&modes[2]==='current-vintage-restatement'&&modes[3]===false,JSON.stringify(modes));

   if(await page.evaluate(()=>document.getElementById('rail').classList.contains('closed')))await page.click('#toggle');
   await page.click('.nav[data-view="health"]');
   await page.waitForSelector('#mnxHealthTabs');
   await page.click('#mnxHealthTabs [data-mnx-health="glossary"]');
   await page.waitForSelector('.mnxGlossary');
   const gt=await page.locator('.mnxGlossary').innerText();
   check('Glossary adds timing classification',gt.includes('Timing / why')&&/(LEADING|LAGGING|COINCIDENT|MIXED)/.test(gt));
   check('Glossary retains Yield Curve governance',/Yield Curve factor/.test(gt)&&/28.6%/.test(gt));
   check('no page-level horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),await page.evaluate(()=>document.documentElement.scrollWidth+' > '+innerWidth));
   check('no application console/page errors',errors.length===0,errors.slice(0,4).join(' | '));
 }finally{
   await ctx.close();await browser.close();srv.close();
 }
 console.log('TURN26 QA PASS',results.length,'checks');
})().catch(e=>{console.error('TURN26 QA FAIL',e.stack||e);process.exit(1)});
