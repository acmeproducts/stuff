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
 await page.route('https://api.venice.ai/**',async r=>{
   await new Promise(res=>setTimeout(res,120));
   if(r.request().url().includes('/augment/search')){
     let body={};try{body=r.request().postDataJSON()||{}}catch{}
     const news=/market news|Reuters|Bloomberg|Financial Times|Wall Street Journal|\bAP\b/i.test(body.query||'');
     const results=news?[
       {title:'Reuters Markets — contextual market report',url:'https://www.reuters.com/markets/',content:'Contemporaneous market reporting covering rates, equities, currencies and commodities.',date:'2026-09-18'},
       {title:'Bloomberg Markets — contextual market report',url:'https://www.bloomberg.com/markets',content:'Market reporting covering cross-asset moves relevant to the analysis window.',date:'2026-09-18'},
       {title:'Financial Times Markets',url:'https://www.ft.com/markets',content:'Financial-market reporting relevant to the selected horizon.',date:'2026-09-18'}
     ]:[
       {title:'Federal Reserve press releases',url:'https://www.federalreserve.gov/newsevents/pressreleases.htm',content:'Primary Federal Reserve policy releases and statements.',date:'2026-09-18'},
       {title:'BLS CPI news release',url:'https://www.bls.gov/news.release/cpi.htm',content:'Primary CPI release and methodology from the Bureau of Labor Statistics.',date:'2026-09-18'},
       {title:'FRED economic data',url:'https://fred.stlouisfed.org/',content:'Primary Federal Reserve Bank of St. Louis economic data portal.',date:'2026-09-18'}
     ];
     await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({query:body.query||'',results})});return
   }
   await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:AI}}]})})
 });
 try{
   await page.goto(origin+'/'+ARTIFACT,{waitUntil:'load'});
   await page.waitForFunction(()=>window.__mnShip25&&window.__mnShip25.ready()&&window.__mnTurn26,{timeout:30000});
   check('retained Turn25 qualification API',await page.evaluate(()=>!!window.__mnShip25&&typeof window.__mnShip25.record==='function'));
   check('retained Index Explanation',await page.locator('[aria-label="Explain index movement"]').count()===1);
   check('retained governed arithmetic',await page.evaluate(()=>window.__mnShip25.record('risk','1YR').status==='RECONCILED'));
   check('Turn26 API present',await page.evaluate(()=>window.__mnTurn26.version==='turn26-live-library-1'));
   // Turn 26 standalone Analyze correction.
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
   const nowStateBeforeModal=await page.evaluate(()=>JSON.stringify(window.__mnShip25.nowState()));
   const nowHorizonBeforeModal=await page.evaluate(()=>window.__mnShip25.horizon());
   await page.click('#analyzeNowSeries26');
   await page.waitForSelector('#standaloneAnalysis26:not(.hidden)');
   check('Analyze opens standalone modal',await page.locator('#standaloneAnalysis26[aria-modal="true"]').count()===1);
   check('modal root is selected component only',await page.evaluate(id=>{
     const st=window.__mnStandalone26.state(),title=document.getElementById('standaloneAnalysisTitle26').textContent.trim();
     return st&&st.root===id&&st.index===null&&title.length>0&&!/^Analyze/i.test(title);
   },componentId));
   check('standalone modal exposes all horizons',await page.locator('#analysisHz [data-analysis-h]').count()===7);
   check('standalone modal exposes Add and More',await page.locator('#analysisAdd26').count()===1&&await page.locator('#analysisMore26').count()===1);
   await page.click('#analysisMore26');
   const menuText=(await page.locator('#analysisMenu26').innerText()).replace(/\s+/g,' ');
   check('standalone More retains full actions',/AI POV/.test(menuText)&&/Data/.test(menuText)&&/Print/.test(menuText)&&/Download Markdown/.test(menuText)&&/Download CSV/.test(menuText)&&/Download JSON/.test(menuText),menuText);
   await page.click('#analysisMore26');
   const targetH=nowHorizonBeforeModal==='1YR'?'3YR':'1YR';
   await page.click('#analysisHz [data-analysis-h="'+targetH+'"]');
   await page.waitForFunction(h=>window.__mnStandalone26.state()?.horizon===h,targetH);
   check('modal horizon is local',await page.evaluate(([h,nowh])=>window.__mnStandalone26.state().horizon===h&&window.__mnShip25.horizon()===nowh,[targetH,nowHorizonBeforeModal]));
   await page.locator('#standaloneAnalysis26').click({position:{x:2,y:2}});
   check('outside click does not dismiss standalone modal',await page.locator('#standaloneAnalysis26:not(.hidden)').count()===1);
   check('opening/using modal leaves NOW state unchanged',await page.evaluate(b=>JSON.stringify(window.__mnShip25.nowState())===b,nowStateBeforeModal));
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
   check('closing modal restores unchanged NOW state',await page.evaluate(b=>JSON.stringify(window.__mnShip25.nowState())===b,nowStateBeforeModal));

   // Reopen and prove AI POV closes modal and opens a processing Library card immediately.
   await page.evaluate(id=>window.__mnStandalone26.open(id),componentId);
   await page.waitForSelector('#standaloneAnalysis26:not(.hidden)');
   await page.click('#analysisMore26');
   await page.click('#analysisAI26');
   await page.waitForFunction(()=>document.getElementById('standaloneAnalysis26').classList.contains('hidden'));
   await page.waitForFunction(()=>window.__mnCurrentAnalysis&&window.__mnCurrentAnalysis()&&window.__mnCurrentAnalysis().status==='processing',{timeout:5000});
   check('AI POV closes modal and opens Library',await page.evaluate(()=>window.__mnShip25.view()==='library'&&document.getElementById('standaloneAnalysis26').classList.contains('hidden')));
   check('Library card shows processing immediately',/processing/i.test(await page.locator('#libList .row.on .rowMeta').innerText()));
   const modalFrozen=await page.evaluate(()=>JSON.stringify(window.__mnCurrentAnalysis().state));
   check('processing card is rooted in selected component',await page.evaluate(id=>window.__mnCurrentAnalysis().state.root===id,componentId));

   await page.waitForFunction(()=>window.__mnCurrentAnalysis&&window.__mnCurrentAnalysis()&&window.__mnCurrentAnalysis().status==='ready',{timeout:20000});
   await page.waitForFunction(()=>document.querySelectorAll('#libList .row').length>0);
   const cardCount=await page.locator('#libList .row').count();
   const original=await page.evaluate(()=>JSON.stringify(window.__mnCurrentAnalysis().state));
   check('initial AI context expanded',await page.locator('#transcript details.contextDetails26[open]').count()>=1);
   check('context exposes Refresh Context',await page.locator('#transcript .refreshContext26').count()>=1);
   const contextLinks=await page.locator('#transcript details.contextDetails26[open] a[href]').count();
   check('expanded context contains live links',contextLinks>=2,String(contextLinks));
   const printBuilt=await page.evaluate(()=>buildLibraryPrintReport25());
   check('print keeps Context & Further Reading expanded',await page.locator('#libraryPrintTranscript details.contextDetails26[open]').count()>=1);
   check('print keeps context live links',await page.locator('#libraryPrintTranscript details.contextDetails26[open] a[href]').count()===contextLinks);
   await page.evaluate(()=>cleanupLibraryPrint25());
   const dlPromise=page.waitForEvent('download');
   await page.evaluate(()=>document.getElementById('libDownload').click());
   const dl=await dlPromise,stream=await dl.createReadStream();let md='';
   for await (const chunk of stream)md+=chunk.toString();
   check('Markdown download includes Context & Further Reading',md.includes('## Context & Further Reading'));
   check('Markdown download preserves source links',md.includes('https://www.federalreserve.gov/newsevents/pressreleases.htm')&&md.includes('https://www.reuters.com/markets/'));


   await page.click('#libQuestion26');
   await page.waitForSelector('#seedMenu26:not(.hidden)');
   const seeds=await page.locator('#seedMenu26 [data-seed26]').allTextContents();
   check('context-aware question menu populated',seeds.length>=5);
   check('question menu includes horizon extension',seeds.some(x=>/1 year/i.test(x)));
   const contextSeedIndex=seeds.findIndex(x=>/reputable data releases and reporting/i.test(x));
   check('context seed is present',contextSeedIndex>=0);
   await page.locator('#seedMenu26 [data-seed26="'+contextSeedIndex+'"]').click();
   await page.click('#send');
   await page.waitForSelector('.liveResult26',{timeout:20000});
   check('seeded context question routes through live context',await page.evaluate(()=>window.__mnTurn26.live()?.intent?.operation==='refresh-context'));
   const seedHrefSet=await page.locator('.liveResult26 details.contextDetails26 a[href^="http"]').evaluateAll(xs=>[...new Set(xs.map(x=>x.href))].sort());
   check('seeded context result renders rich live links',seedHrefSet.length>=5,JSON.stringify(seedHrefSet));
   check('seeded context includes reporting links',seedHrefSet.some(x=>x.includes('reuters.com'))&&seedHrefSet.some(x=>x.includes('bloomberg.com')),JSON.stringify(seedHrefSet));
   check('seeded context source bundle is deterministic',await page.evaluate(()=>{let x=window.__mnTurn26.live()?.contextSources;return !!x&&x.schema==='market-navigator-context-sources-v1'&&x.primary.length>=1&&x.reporting.length>=2}));
   await page.click('.liveResult26 .refreshContext26');
   await page.waitForFunction(()=>window.__mnTurn26.live()?.contextSources?.reporting?.length>=2);
   const newspaperHrefSet=await page.locator('.liveResult26 details.contextDetails26 a[href^="http"]').evaluateAll(xs=>[...new Set(xs.map(x=>x.href))].sort());
   check('? and newspaper use identical source-link set',JSON.stringify(seedHrefSet)===JSON.stringify(newspaperHrefSet),JSON.stringify({seedHrefSet,newspaperHrefSet}));
   await page.click('#discardLive26');
   await page.waitForFunction(()=>!document.querySelector('.liveResult26'));
   await page.click('#libQuestion26');
   await page.waitForSelector('#seedMenu26:not(.hidden)');

   const seedGeo=await page.evaluate(()=>{
     const menu=document.getElementById('seedMenu26'),detail=document.querySelector('.libDetail'),buttons=[...menu.querySelectorAll('button')];
     const m=menu.getBoundingClientRect(),d=detail.getBoundingClientRect();
     return{menu:{left:m.left,right:m.right,width:m.width},detail:{left:d.left,right:d.right,width:d.width},buttons:buttons.map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return{left:r.left,right:r.right,width:r.width,textAlign:s.textAlign,lineHeight:s.lineHeight,whiteSpace:s.whiteSpace,scrollWidth:b.scrollWidth,clientWidth:b.clientWidth}})};
   });
   check('seeded-question menu stays inside Library detail',seedGeo.menu.left>=seedGeo.detail.left-1&&seedGeo.menu.right<=seedGeo.detail.right+1,JSON.stringify(seedGeo));
   check('seeded questions have readable left inset and wrapping',seedGeo.buttons.every(b=>b.left>=seedGeo.menu.left&&b.right<=seedGeo.menu.right+1&&b.textAlign==='left'&&b.whiteSpace==='normal'&&b.scrollWidth<=b.clientWidth+1),JSON.stringify(seedGeo.buttons));

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
   await page.waitForFunction(()=>document.querySelectorAll('.checkpointStrip26 [data-cp26]').length===2);
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
