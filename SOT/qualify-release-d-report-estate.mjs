// Runtime qualification: Report / Job Status / Estate inside the Complete surface (headless Chromium, mocked API).
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),HERE=path.dirname(fileURLToPath(import.meta.url)),GB=1073741824;
const fail=(m)=>{console.error('FAIL '+m);process.exitCode=1;throw new Error(m)},ok=(c,m)=>{if(!c)fail(m)},pass=m=>console.log('PASS '+m);
const now=Math.floor(Date.now()/1000);
const sources=[['s1','/mnt/a/Photos',300,now-3600],['s2','/mnt/b/Video',250,now-7200],['s3','/mnt/c/Archive',150,0]].map(([id,root,,t])=>({source_id:id,label:root,estate:root,root,enabled:1,soft_deleted:false,pending:false,analysis_state:'CURRENT',last_success_ended:t||null,last_success_job_id:t?'j'+id:null,last_errors:0}));
let n=0;const P=(src,cls,gb,fp)=>({placement_id:'p'+(++n),placement_no:n,source_id:src,estate:src,path:'/x/'+n,filename:'f'+n,size:gb*GB,fingerprint:fp||'fp'+n,system_classification:cls,availability:'OK',placement_state:'ACTIVE'});
// SCANNED 900 = UNIQUE 600 + KEEP 100 + EXCESS 200 ; ESTATE 700 ; roots retained a=300 b=250 c=150
const placements=[P('s1','UNIQUE',300),P('s2','UNIQUE',150),P('s3','UNIQUE',150),P('s2','KEEP',100,'dup'),P('s3','EXCESS',100,'dup'),P('s2','EXCESS',100,'dup2')];
let targetBytes=600*GB,stalenessMissing=false,pageDelay=0;
const api=(u)=>{const p=u.pathname.replace(/^\/sot/,'');
 if(p==='/api/jobs')return {ok:true,jobs:[],scheduler:{}};if(p==='/api/events')return {ok:true,events:[]};if(p==='/api/sources')return {ok:true,sources};
 if(p==='/api/target')return {ok:true,target:{configured:true,path:'/mnt/t',free_bytes:targetBytes,registered_free_bytes:targetBytes}};
 if(p==='/api/health')return {ok:true,catalog_revision:1,creation_revision:1,db:{state:'healthy'}};
 if(p==='/api/placements/page')return {ok:true,catalog_revision:1,total:placements.length,placements,has_more:false,next_after:placements.length};
 if(p==='/api/ssot/refresh-staleness')return stalenessMissing?{ok:false,error:'not found'}:{ok:true,errors:[]};if(p==='/api/volumes')return {ok:true,volumes:[]};return {ok:true};};
const srv=http.createServer(async(rq,rs)=>{const u=new URL(rq.url,'http://x');if(u.pathname.startsWith('/sot/')){if(pageDelay&&u.pathname.endsWith('/placements/page'))await new Promise(r=>setTimeout(r,pageDelay));const j=api(u);rs.writeHead(j.ok===false?404:200,{'content-type':'application/json'});return rs.end(JSON.stringify(j))}
 const f=path.join(HERE,path.basename(u.pathname));if(!fs.existsSync(f)){rs.writeHead(404);return rs.end()}rs.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'text/plain'});rs.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port,URL_=`http://127.0.0.1:${port}/sot-turn02-release-d-complete.html?api=${encodeURIComponent(`http://127.0.0.1:${port}/sot`)}`;
const browser=await chromium.launch();
async function open(vw,vh){const ctx=await browser.newContext({viewport:{width:vw,height:vh}}),pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));pg.on('pageerror',e=>fail('pageerror '+e.message));
 await pg.goto(URL_);const inner=async()=>{const h=await pg.waitForSelector('#shell');const o=await (await h.contentFrame()).waitForSelector('#app');return o.contentFrame()};
 let fr;for(let i=0;i<100;i++){try{fr=await inner();if(await fr.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
 ok(fr,'runtime did not start');await fr.waitForSelector('#Plan .subtabs');return {ctx,pg,fr}}
const txt=(fr,sel)=>fr.$eval(sel,e=>e.innerText);
try{
 const {pg,fr}=await open(1280,900);
 // 1 labels
 const sw=await fr.$$eval('.ssot-report-switch button',b=>b.map(x=>x.textContent.trim()));ok(JSON.stringify(sw)==='["Report","Job Status"]','switch labels '+sw);
 const vis=await fr.evaluate(()=>[...document.querySelectorAll('button,a,[role=tab]')].filter(e=>e.offsetParent&&/analyze/i.test(e.textContent)).map(e=>e.textContent));ok(!vis.length,'visible Analyze label: '+vis);
 pass('Report / Job Status labels present; Analyze is not an owner-facing label');
 // 2 subtabs
 const tabs=await fr.$$eval('#Plan .subtabs button',b=>b.map(x=>x.textContent.trim()));ok(JSON.stringify(tabs)==='["Analysis","Capacity","Operations","Estate"]','subtabs '+tabs);pass('Report contains Analysis / Capacity / Operations / Estate');
 // 3/4/5 relationships + over capacity
 const an=await txt(fr,'#Plan');ok(/SCANNED[\s\S]*= UNIQUE \+ KEEP \+ EXCESS/.test(an),'SCANNED relation');pass('SCANNED = UNIQUE + KEEP + EXCESS represented');
 ok(/ESTATE[\s\S]*= UNIQUE \+ KEEP\b/.test(an),'ESTATE relation');pass('ESTATE = UNIQUE + KEEP represented');
 const cells=await fr.$$eval('#Plan .plantable tbody tr',r=>Object.fromEntries(r.map(x=>[x.dataset.label,x.cells[2].textContent.trim()])));
 ok(cells.SCANNED==='900.0 GB'&&cells.ESTATE==='700.0 GB'&&cells.TARGET==='600.0 GB'&&cells.DEFICIT==='100.0 GB'&&cells.EXCESS==='200.0 GB'&&!('OPEN' in cells),'analysis arithmetic '+JSON.stringify(cells));
 ok(/DEFICIT 100\.0 GB MUST BE REMOVED FROM ESTATE TO FIT TARGET/.test(an),'deficit banner');ok(!/-\s?\d+(\.\d+)? GB/.test(an),'negative size shown');
 await fr.evaluate(()=>__ssotOpenReportMode('Report'));await fr.click('#Plan .subtabs button:nth-child(2)');const cap=await txt(fr,'#Plan');
 const capLabels=await fr.$$eval('#Plan .plantable tbody tr',r=>r.map(x=>x.dataset.label));ok(capLabels.includes('DEFICIT')&&!capLabels.includes('OPEN')&&!/-\s?\d/.test(cap),'capacity over: positive DEFICIT, no OPEN row '+capLabels);
 const bar=await fr.evaluate(()=>{const b=document.querySelector('#Plan .stackbar'),r=b.getBoundingClientRect(),seg=b.querySelector('.stackseg.deficit'),m=b.querySelector('.targetmark'),e=b.querySelector('.stackseg.estate');return {red:seg&&getComputedStyle(seg).backgroundColor,w:seg&&seg.getBoundingClientRect().width/r.width,mark:m&&(m.getBoundingClientRect().left-r.left)/r.width,est:e.getBoundingClientRect().width/r.width}});
 ok(bar.red==='rgb(239, 68, 68)'&&Math.abs(bar.mark-600/700)<.02&&Math.abs(bar.est-600/700)<.02&&Math.abs(bar.w-100/700)<.02,'capacity bar '+JSON.stringify(bar));
 pass('over-capacity state produces positive DEFICIT (no negative OPEN); bar shows Target boundary with red overflow');
 targetBytes=800*GB;await fr.evaluate(()=>dataPoll());await pg.waitForTimeout(400);const cap2=await txt(fr,'#Plan');const l2=await fr.$$eval('#Plan .plantable tbody tr',r=>r.map(x=>x.dataset.label));ok(l2.includes('OPEN')&&!l2.includes('DEFICIT')&&!/DEFICIT/.test(cap2),'under-capacity OPEN: '+l2);
 await fr.evaluate(()=>setPlanTab('Analysis'));const an2=await txt(fr,'#Plan');const l3=await fr.$$eval('#Plan .plantable tbody tr',r=>r.map(x=>x.dataset.label));ok(l3.includes('OPEN')&&!l3.includes('DEFICIT')&&!/DEFICIT/.test(an2),'analysis OPEN');pass('under-capacity state shows positive OPEN');
 targetBytes=600*GB;await fr.evaluate(()=>dataPoll());
 // Operations preserved
 await fr.evaluate(()=>setPlanTab('Operations'));const ops=await txt(fr,'#Plan');ok(/IN PLAY/.test(ops)&&/LANDED/.test(ops),'operations');ok((await fr.$$('#Plan .subtabs button')).length===4,'operations subtabs');pass('Operations preserved with four-subtab navigation');
 // Estate
 await fr.evaluate(()=>setPlanTab('Estate'));const heads=await fr.$$eval('.estate-table th',h=>h.map(x=>x.textContent.replace(/[▲▼]/g,'').trim()));ok(JSON.stringify(heads)==='["Root","Files","Size","Last Synced","Status"]','heads '+heads);
 const rowsOf=()=>fr.$$eval('.estate-table tbody tr',r=>r.map(x=>({root:x.cells[0].textContent,files:x.cells[1].textContent,size:x.cells[2].textContent,synced:x.cells[3].textContent,status:x.cells[4].textContent,bg:getComputedStyle(x.cells[0]).backgroundColor,fg:getComputedStyle(x.cells[0]).color})));
 let rows=await rowsOf();ok(rows.length===3&&rows.map(r=>r.root).join()==='/mnt/a/Photos,/mnt/b/Video,/mnt/c/Archive','rows '+JSON.stringify(rows));
 ok(rows[0].files==='1'&&rows[0].size==='300.0 GB'&&rows[1].files==='2'&&rows[1].size==='250.0 GB'&&rows[2].files==='1'&&rows[2].size==='150.0 GB','estate numbers from real placements '+JSON.stringify(rows));
 ok(rows[2].synced==='Never'&&rows[0].synced!=='Never'&&rows[0].status==='Current','sync/status '+JSON.stringify(rows));
 const sum=await txt(fr,'.estate-sum');ok(/ESTATE 700\.0 GB \| TARGET 600\.0 GB \| DEFICIT 100\.0 GB/.test(sum),'summary '+sum);
 pass('Estate table is built from real registered Estate-root data (one row per root, retained files/size, sync + status)');pass('Estate table exposes Root / Files / Size / Last Synced / Status with ESTATE | TARGET | OPEN/DEFICIT summary');
 const red='rgb(198, 40, 40)',white='rgb(255, 255, 255)';ok(rows[2].bg===red&&rows[2].fg===white&&rows[0].bg!==red&&rows[1].bg!==red,'overflow colors '+JSON.stringify(rows.map(r=>[r.bg,r.fg])));
 pass('cumulative Target overflow (beyond 600 GB at root /mnt/c/Archive) is red background / white text');
 const order=async(k)=>{await fr.evaluate(k=>__ssotEstateSortBy(k),k);return (await rowsOf()).map(r=>r.root.split('/').pop()).join()};
 ok(await order('size')==='Archive,Video,Photos','size asc');ok(await order('size')==='Photos,Video,Archive','size desc');ok(await order('files')==='Photos,Archive,Video','files asc');ok(await order('synced')==='Archive,Video,Photos','synced asc');await fr.evaluate(()=>{__ssotEstateSort.key='root';__ssotEstateSort.dir=-1;renderPlan()});const rd=await rowsOf();ok(rd[0].root.endsWith('Archive')&&rd[0].bg===red,'root desc keeps red flag on the over-capacity root: '+JSON.stringify(rd[0]));
 pass('Estate columns sort; red/white follows the root (canonical order), not the arbitrary sort position');
 ok((await fr.$$('.estate-table button, .estate-table input')).length===0,'job controls in estate table');
 // MutationObserver idempotence at runtime
 await fr.evaluate(()=>{__ssotEstateSort.key='root';__ssotEstateSort.dir=1;renderPlan()});await pg.waitForTimeout(500);
 const muts=await fr.evaluate(()=>new Promise(res=>{let c=0,mo=new MutationObserver(l=>c+=l.length);for(const n of [document.getElementById('tabs'),document.getElementById('Plan'),document.getElementById('Analyze')])mo.observe(n,{childList:true,subtree:true,attributes:true});setTimeout(()=>{mo.disconnect();res(c)},4000)}));ok(muts<40,'idle DOM mutations '+muts);
 pass('observed tab/report decoration is idempotent at runtime (idle mutations='+muts+', no self-trigger loop)');
 // Job Status
 await fr.evaluate(()=>__ssotOpenReportMode('Analyze'));await pg.waitForTimeout(300);ok(await fr.evaluate(()=>document.getElementById('Analyze').classList.contains('on')&&document.getElementById('Analyze').innerText.length>20),'job status pane');ok(await fr.$$eval('#Analyze .ssot-report-switch button',b=>b[1].textContent.trim()==='Job Status'&&b[1].classList.contains('on')),'job status nav');pass('Job Status renders the existing job/source status surface');
 await pg.context().close();
 // older backend without the staleness endpoint must still load the database and release the blocker
 stalenessMissing=true;{const o=await open(1280,900);ok(await o.fr.evaluate(()=>placements.length>0&&!document.querySelector('#ssot-db-blocker.on')),'database did not load without staleness endpoint');pass('database loads and the blocker clears when the staleness endpoint is unavailable (older backend)');await o.ctx.close()}stalenessMissing=false;
 // refresh indicator: started + progressing, last updated, stale detection
 {pageDelay=2500;const ctx=await browser.newContext({viewport:{width:1280,height:900}}),pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));await pg.goto(URL_);
  const getFr=async()=>{const o=await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app');return o.contentFrame()};const f=await getFr();
  let seen='',pill='';for(let i=0;i<40&&!/Loading database/.test(seen);i++){await pg.waitForTimeout(100);try{seen=await f.evaluate(()=>document.getElementById('ssotRefreshDetail')?.textContent||'');pill=await f.evaluate(()=>document.getElementById('ssot-db-status')?.textContent||'')}catch(e){}}
  ok(/Loading database/.test(seen)&&/DB refreshing/.test(pill),'refresh start/progress indicator '+seen+' | '+pill);pass('refresh shows it started and what phase it is in (blocker detail + status pill with elapsed time)');
  pageDelay=0;for(let i=0;i<100&&!(await f.evaluate(()=>placements.length>0&&!document.querySelector('#ssot-db-blocker.on')));i++)await pg.waitForTimeout(100);
  const cur=await f.evaluate(()=>document.getElementById('ssot-db-status').textContent);ok(/DB current · updated \d\d:\d\d:\d\d/.test(cur),'current pill '+cur);pass('last-updated time is shown after a load completes');
  await f.evaluate(()=>{__ssotRefresh.updatedAt=Date.now()-11*60000;__ssotPaintRefresh()});const stale=await f.evaluate(()=>document.getElementById('ssot-db-status').textContent);ok(/DB STALE · older than 10m/.test(stale),'stale pill '+stale);
  await f.evaluate(()=>{__ssotRefresh.updatedAt=Date.now();sources=sources.map(x=>({...x,pending:true}));__ssotPaintRefresh()});const sp=await f.evaluate(()=>document.getElementById('ssot-db-status').textContent);ok(/DB STALE · 3 sources syncing/.test(sp),'pending stale pill '+sp);pass('stale detection: age over 10 minutes or registered sources pending/syncing');
  await ctx.close()}
 // Chrome Local Network Access / unreachable API must be reported, and the blocker must release
 {const ctx=await browser.newContext({viewport:{width:1280,height:900}}),pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));await pg.route(/\/sot\/api\//,r=>r.abort('blockedbyclient'));await pg.goto(URL_);
  const f=await (await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app')).contentFrame();let txt='',on=true;for(let i=0;i<150&&(on||!/OFFLINE/.test(txt));i++){await pg.waitForTimeout(100);try{txt=await f.evaluate(()=>document.getElementById('ssot-db-status')?.textContent||'');on=await f.evaluate(()=>!!document.querySelector('#ssot-db-blocker.on'))}catch(e){}}
  ok(/OFFLINE/.test(txt)&&/Local network access/.test(txt)&&!on,'offline hint/blocker '+txt+' on='+on);pass('blocked/unreachable API shows an OFFLINE hint (Local network access) and the blocker releases');
  ok(await pg.evaluate(()=>document.getElementById('shell').allow==='local-network-access'),'iframe local-network-access permission');await ctx.close()}
 // mobile
 const m=await open(412,915);await m.fr.evaluate(()=>setPlanTab('Estate'));await m.pg.waitForTimeout(300);
 const ov=await m.fr.evaluate(()=>({doc:document.documentElement.scrollWidth-document.documentElement.clientWidth,tbl:(()=>{let w=document.querySelector('.estate-wrap');return w.scrollWidth-w.clientWidth})(),rows:document.querySelectorAll('.estate-table tbody tr').length}));ok(ov.doc<=1&&ov.tbl<=1&&ov.rows===3,'mobile overflow '+JSON.stringify(ov));pass('Estate table usable at 412x915 without horizontal overflow');
 if(process.env.SOT_SHOTS){await m.pg.screenshot({path:process.env.SOT_SHOTS+'/estate-mobile.png'});await m.fr.evaluate(()=>setPlanTab('Analysis'));await m.pg.waitForTimeout(300);await m.pg.screenshot({path:process.env.SOT_SHOTS+'/analysis-mobile.png'})}
 await m.ctx.close();
}finally{await browser.close();srv.close()}
