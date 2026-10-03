// Runtime qualification: Report / Job Status / Estate inside the Complete surface (headless Chromium, mocked API).
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),HERE=path.dirname(fileURLToPath(import.meta.url)),GB=1073741824;
const fail=(m)=>{console.error('FAIL '+m);process.exitCode=1;throw new Error(m)},ok=(c,m)=>{if(!c)fail(m)},pass=m=>console.log('PASS '+m);
const now=Math.floor(Date.now()/1000);
const sources=[['s1','/mnt/a/Photos',300,now-3600],['s2','/mnt/b/Video',250,now-7200],['s3','/mnt/c/Archive',150,0]].map(([id,root,,t])=>({source_id:id,label:root,estate:root,root,enabled:1,soft_deleted:false,pending:false,analysis_state:'CURRENT',last_success_ended:t||null,last_success_job_id:t?'j'+id:null,last_errors:0}));
let n=0;const P=(src,cls,gb,fp)=>({placement_id:'p'+(++n),placement_no:n,source_id:src,estate:src,path:'/x/'+n,filename:'f'+n,size:gb*GB,fingerprint:fp||'fp'+n,system_classification:cls,availability:'OK',placement_state:'ACTIVE'});
// SCANNED 900 = UNIQUE 600 + KEEP 100 + EXCESS 200 ; ESTATE 700 ; roots retained a=300 b=250 c=150
let placements=[P('s1','UNIQUE',300),P('s2','UNIQUE',150),P('s3','UNIQUE',150),P('s2','KEEP',100,'dup'),P('s3','EXCESS',100,'dup'),P('s2','EXCESS',100,'dup2')];
let removedIds=[],rev=1,counts={page:0,delta:0},deltaMode='ok',targetBytes=600*GB,stalenessMissing=false,pageDelay=0,stalenessSlow=false;
const api=(u)=>{const p=u.pathname.replace(/^\/sot/,'');
 if(p==='/api/jobs')return {ok:true,jobs:[],scheduler:{}};if(p==='/api/events')return {ok:true,events:[]};if(p==='/api/sources')return {ok:true,sources};
 if(p==='/api/target')return {ok:true,target:{configured:true,path:'/mnt/t',free_bytes:targetBytes,registered_free_bytes:targetBytes}};
 if(p==='/api/health')return {ok:true,catalog_revision:rev,creation_revision:1,db:{state:'healthy'}};
 if(p==='/api/placements/delta'){counts.delta++;if(deltaMode==='missing')return {ok:false,error:'not found'};const since=Number(u.searchParams.get('since'));if(since===rev)return {ok:true,full:false,unchanged:true,catalog_revision:rev,upserts:[],removed:[]};if(deltaMode==='full')return {ok:true,full:true,catalog_revision:rev,total:placements.length};return {ok:true,full:false,unchanged:false,catalog_revision:rev,total:placements.length,upserts:placements.filter(x=>x.rev===rev),removed:removedIds}}
 if(p==='/api/placements/page'){counts.page++;return {ok:true,catalog_revision:rev,total:placements.length,placements,has_more:false,next_after:placements.length}};
 if(p.startsWith('/api/ssot/refresh-staleness'))counts.stale=(counts.stale||0)+1;if(p.startsWith('/api/ssot/refresh-staleness')&&stalenessSlow)return 'slow';if(p.startsWith('/api/ssot/refresh-staleness'))return stalenessMissing?{ok:false,error:'not found'}:{ok:true,errors:[]};if(p==='/api/volumes')return {ok:true,volumes:[]};return {ok:true};};
const srv=http.createServer(async(rq,rs)=>{const u=new URL(rq.url,'http://x');if(u.pathname.startsWith('/sot/')){if(pageDelay&&u.pathname.endsWith('/placements/page'))await new Promise(r=>setTimeout(r,pageDelay));const j=api(u);if(j==='slow'){await new Promise(r=>setTimeout(r,60000));return rs.end('{"ok":true}')}rs.writeHead(j.ok===false?404:200,{'content-type':'application/json'});return rs.end(JSON.stringify(j))}
 const f=path.join(HERE,path.basename(u.pathname));if(!fs.existsSync(f)){rs.writeHead(404);return rs.end()}rs.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'text/plain'});rs.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port,URL_=`http://127.0.0.1:${port}/sot-turn02-release-d-complete.html?api=${encodeURIComponent(`http://127.0.0.1:${port}/sot`)}`;
const browser=await chromium.launch();
async function open(vw,vh){const ctx=await browser.newContext({viewport:{width:vw,height:vh}}),pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));pg.on('pageerror',e=>fail('pageerror '+e.message));
 await pg.goto(URL_);const inner=async()=>{const h=await pg.waitForSelector('#shell');const o=await (await h.contentFrame()).waitForSelector('#app');return o.contentFrame()};
 let fr;for(let i=0;i<100;i++){try{fr=await inner();if(await fr.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
 ok(fr,'runtime did not start');await fr.waitForSelector('#Plan .subtabs');return {ctx,pg,fr}}
const txt=(fr,sel)=>fr.$eval(sel,e=>e.innerText);
try{
 let {ctx:ctx0,pg,fr}=await open(1280,900);
 // 1 labels
 const sw=await fr.$$eval('.ssot-report-switch button',b=>b.map(x=>x.textContent.trim()));ok(JSON.stringify(sw)==='["Report","Job Status"]','switch labels '+sw);
 const vis=await fr.evaluate(()=>[...document.querySelectorAll('button,a,[role=tab]')].filter(e=>e.offsetParent&&/analyze/i.test(e.textContent)).map(e=>e.textContent));ok(!vis.length,'visible Analyze label: '+vis);
 pass('Report / Job Status labels present; Analyze is not an owner-facing label');
 // 2 subtabs
 const tabs=await fr.$$eval('#Plan .subtabs button',b=>b.map(x=>x.textContent.trim()));ok(JSON.stringify(tabs)==='["Summary","Estate"]','subtabs '+tabs);
 ok((await fr.$$('#Plan .wf-chart')).length===2,'exactly two charts');pass('Report is two bar charts (SCANNED, TARGET) plus Estate');
 const an=await txt(fr,'#Plan');ok(/SCANNED[\s\S]*= UNIQUE \+ KEEP \+ EXCESS/.test(an),'SCANNED relation');ok(!/WATERFALL|ESTATE VS TARGET|SCAN →/i.test(an),'redundant waterfall sections');
 ok(!(await fr.$$('#Plan .wf-row, #Plan table')).length,'chart tables must be gone (details live in popups)');
 const pop=async(label,chart=0)=>{await fr.evaluate(()=>{document.getElementById('barcall')?.remove()});await fr.locator('#Plan .wf-chart').nth(chart).locator('.wf-chip',{hasText:label}).first().click();await pg.waitForTimeout(150);return fr.evaluate(()=>{const b=document.getElementById('barcall');return b?{t:b.innerText.replace(/×/g,'').replace(/\s+/g,' ').trim(),btn:!!b.querySelector('button.btn')}:null})};
 const u1=await pop('UNIQUE');ok(u1&&/UNIQUE Files 3 Size 600\.0 GB % Files 50\.0% % Size 66\.7%/.test(u1.t)&&u1.btn,'unique popup '+JSON.stringify(u1));
 const k1=await pop('KEEP');ok(/Files 1 Size 100\.0 GB % Files 16\.7% % Size 11\.1%/.test(k1.t),'keep popup '+JSON.stringify(k1));
 const e1=await pop('EXCESS');ok(/Files 2 Size 200\.0 GB % Files 33\.3% % Size 22\.2%/.test(e1.t),'excess popup '+JSON.stringify(e1));
 const d1=await pop('DEFICIT');ok(/DEFICIT Size 100\.0 GB % Size 11\.1%/.test(d1.t)&&d1.btn,'deficit popup '+JSON.stringify(d1));
 const i2=await pop('IN PLAY',1);ok(/IN PLAY Files 4 Size 700\.0 GB % of TARGET 116\.7%/.test(i2.t)&&i2.btn,'in play popup '+JSON.stringify(i2));
 const l2=await pop('LANDED',1);ok(/LANDED Files 0 Size 0\.0 GB % of TARGET 0\.0%/.test(l2.t)&&l2.btn,'landed popup '+JSON.stringify(l2));
 const g2=await pop('DEFICIT',1);ok(/DEFICIT Size 100\.0 GB % of TARGET 16\.7%/.test(g2.t)&&!g2.btn,'chart 2 deficit popup (no search) '+JSON.stringify(g2));
 await fr.evaluate(()=>{document.getElementById('barcall')?.remove()});
 ok(/DEFICIT 100\.0 GB MUST BE REMOVED FROM ESTATE TO FIT TARGET/.test(an),'deficit banner');ok(!/-\s?\d+(\.\d+)? GB/.test(an),'negative size shown');
 pass('no tables: each section (UNIQUE / KEEP / DEFICIT / EXCESS, IN PLAY / LANDED / DEFICIT) shows files · size · %files · %size (or % of TARGET) in a popup');
 const g=await fr.evaluate(()=>{const ch=[...document.querySelectorAll('#Plan .wf-chart')],f=(c,sel)=>{const e=c.querySelector(sel);if(!e)return null;const t=c.querySelector('.wf-track').getBoundingClientRect(),b=e.getBoundingClientRect();return {l:(b.left-t.left)/t.width,w:b.width/t.width,bg:getComputedStyle(e).backgroundColor}};
  return {u:f(ch[0],'.wf-seg.unique'),k:f(ch[0],'.wf-seg.keep'),d:f(ch[0],'.wf-seg.deficit'),e:f(ch[0],'.wf-seg.excess'),ip:f(ch[1],'.wf-seg.inplay'),d2:f(ch[1],'.wf-seg.deficit'),mark:f(ch[1],'.wf-target'),sw:getComputedStyle(ch[0].querySelector('.swatch.excess')).backgroundColor,sd:getComputedStyle(ch[0].querySelector('.swatch.deficit')).backgroundColor}});
 const near=(a,b)=>Math.abs(a-b)<.02;
 ok(near(g.u.w,600/900)&&g.k===null&&near(g.d.l,600/900)&&near(g.d.w,100/900)&&near(g.e.l,700/900)&&near(g.e.w,200/900),'chart 1 geometry '+JSON.stringify(g));
 ok(near(g.ip.w,600/700)&&near(g.d2.l,600/700)&&near(g.d2.w,100/700)&&near(g.mark.l,600/700),'chart 2 geometry '+JSON.stringify(g));
 ok(g.d.bg==='rgb(239, 68, 68)'&&g.e.bg==='rgb(181, 124, 240)'&&g.sd==='rgb(239, 68, 68)'&&g.sw==='rgb(181, 124, 240)','excess purple / deficit red '+JSON.stringify(g));
 pass('DEFICIT (red) is carved out of the end of the retained bar beyond the TARGET line; EXCESS is purple; TARGET is 100% in chart 2');
 targetBytes=800*GB;await fr.evaluate(()=>dataPoll());await pg.waitForTimeout(400);const o2=await pop('AVAILABLE',1);ok(/AVAILABLE Size 100\.0 GB % of TARGET 12\.5%/.test(o2.t)&&!o2.btn,'available popup '+JSON.stringify(o2));const ip2=await pop('IN PLAY',1);ok(/% of TARGET 87\.5%/.test(ip2.t),'in play under target '+JSON.stringify(ip2));
 ok(!(await fr.$$('#Plan .wf-seg.deficit')).length&&(await fr.$$('#Plan .wf-seg.open')).length===1&&!(await txt(fr,'#Plan')).includes('DEFICIT'),'under-capacity segments');pass('under-capacity: AVAILABLE shown, no DEFICIT');
 await fr.evaluate(()=>{document.getElementById('barcall')?.remove()});
 targetBytes=600*GB;await fr.evaluate(()=>dataPoll());await pg.waitForTimeout(400);
 const openSec=async(label,chart,q)=>{await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Plan')});await pg.waitForTimeout(300);await pop(label,chart);await fr.click('#barcall button.btn');await pg.waitForTimeout(400);const r=await fr.evaluate(()=>({on:document.getElementById('Database').classList.contains('on'),q:omniQuery,n:filterQuery(omniQuery).length}));ok(r.on&&r.q===q,label+' -> '+JSON.stringify(r));return r};
 ok((await openSec('UNIQUE',0,'#report:unique')).n===3,'unique rows');await openSec('KEEP',0,'#report:keep');ok((await openSec('EXCESS',0,'#report:excess')).n===2,'excess rows');
 ok((await openSec('DEFICIT',0,'#report:capacity-deficit')).n===1,'deficit scope = retained files in roots beyond TARGET');await openSec('IN PLAY',1,'#report:operations-in-play');await openSec('LANDED',1,'#report:operations-landed');
 pass('"Open in Search" in each popup opens just that section (UNIQUE / KEEP / DEFICIT / EXCESS / IN PLAY / LANDED)');
 await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Plan')});await pg.waitForTimeout(300);
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
 ok(await order('size')==='Archive,Video,Photos','size asc');ok(await order('size')==='Photos,Video,Archive','size desc');ok(await order('files')==='Photos,Archive,Video','files asc');ok(await order('synced')==='Archive,Video,Photos','synced asc');const tail=async()=>{const r=await rowsOf(),f=r.map(x=>x.bg===red);const i=f.indexOf(true);return {ok:i>=0&&f.slice(i).every(Boolean)&&f.slice(0,i).every(x=>!x),f}};
 for(const [k,d] of [['size',-1],['size',1],['files',1],['files',-1],['root',-1],['status',1]]){await fr.evaluate(([k,d])=>{__ssotEstateSort.key=k;__ssotEstateSort.dir=d;renderPlan()},[k,d]);const t=await tail();ok(t.ok,'cut-off must be one contiguous block at the bottom when sorted by '+k+' '+d+': '+t.f)}
 await fr.evaluate(()=>{__ssotEstateSort.key='size';__ssotEstateSort.dir=-1;renderPlan()});const dd=await rowsOf();ok(dd.map(r=>r.root.split('/').pop()).join()==='Photos,Video,Archive'&&dd[2].bg===red&&dd[0].bg!==red,'size desc cut-off '+JSON.stringify(dd.map(r=>r.bg)));
 pass('Estate columns sort; the red cut-off is always one contiguous block, counted cumulatively in the order shown');
 ok((await fr.$$('.estate-table button, .estate-table input')).length===0,'job controls in estate table');
 {const cs=await fr.$eval('.estate-table td.estate-root',e=>{const c=getComputedStyle(e);return {o:c.textOverflow,w:c.whiteSpace,t:e.title,copy:e.dataset.copy}});ok(cs.o==='ellipsis'&&cs.w==='nowrap'&&/tap to copy/.test(cs.t)&&cs.copy.startsWith('/mnt/'),'estate root truncation/hover/copy attrs '+JSON.stringify(cs));
  await ctx0.grantPermissions(['clipboard-read','clipboard-write']);await fr.click('.estate-table tbody tr:nth-child(2) td.estate-root');await pg.waitForTimeout(300);const copied=await pg.evaluate(()=>navigator.clipboard.readText());ok(copied===await fr.$eval('.estate-table tbody tr:nth-child(2) td.estate-root',e=>e.dataset.copy)&&copied.startsWith('/mnt/'),'estate tap-to-copy clipboard: '+copied);ok(await fr.evaluate(()=>[...document.querySelectorAll('.toast')].some(t=>/^Copied: \/mnt\//.test(t.textContent))),'copy toast');
  pass('Estate cells truncate with an ellipsis, show the full value on hover, and copy it on tap')}
 // MutationObserver idempotence at runtime
 await fr.evaluate(()=>{__ssotEstateSort.key='root';__ssotEstateSort.dir=1;renderPlan()});await pg.waitForTimeout(500);
 const muts=await fr.evaluate(()=>new Promise(res=>{let c=0,mo=new MutationObserver(l=>c+=l.length);for(const n of [document.getElementById('tabs'),document.getElementById('Plan'),document.getElementById('Analyze')])mo.observe(n,{childList:true,subtree:true,attributes:true});setTimeout(()=>{mo.disconnect();res(c)},4000)}));ok(muts<40,'idle DOM mutations '+muts);
 pass('observed tab/report decoration is idempotent at runtime (idle mutations='+muts+', no self-trigger loop)');
 // Search (Database): copy on tap, automatic result chip, cached switching
 {await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(500);
  const chip=()=>fr.$eval('.ssot-bulk .selection-count',e=>e.innerText.replace(/\s+/g,' ').trim());
  ok(await chip()==='6 results ×','initial chip '+await chip());ok(!(await fr.evaluate(()=>/Select all results/.test(document.querySelector('.ssot-bulk').innerText))),'select-all button removed');
  await fr.evaluate(()=>{omniDraft='excess';omniQuery='excess';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='2 results ×','chip follows the search '+await chip());
  await fr.evaluate(()=>{omniDraft='consolidate';omniQuery='consolidate';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='0 results ×','chip follows a second search '+await chip());
  await fr.evaluate(()=>{omniDraft='';omniQuery='';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='6 results ×','chip returns '+await chip());
  pass('the count chip follows the current search automatically (no Select all step) and updates on every change');
  await fr.click('#Database tbody tr:nth-child(1) td:nth-child(1)');await pg.waitForTimeout(200);ok(await chip()==='1 selected ×','tap # selects '+await chip());
  await fr.evaluate(()=>{omniDraft='unique';omniQuery='unique';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='3 results ×','stale selection is dropped when the search changes: '+await chip());
  await fr.click('#Database tbody tr:nth-child(1) td:nth-child(4)');await pg.waitForTimeout(300);ok(await chip()==='3 results ×','tapping a data cell must copy, not select '+await chip());
  const cp=await pg.evaluate(()=>navigator.clipboard.readText());ok(cp.length>0,'database cell tap copied nothing');ok(await fr.evaluate(()=>[...document.querySelectorAll('.toast')].some(t=>/^Copied: \S/.test(t.textContent))),'database copy toast');
  pass('tapping a Database field copies it (never blank) and does not toggle row selection; tapping # selects');
  await fr.click('.ssot-bulk .selection-count button');await pg.waitForTimeout(400);ok(await fr.evaluate(()=>omniQuery==='')&&await chip()==='6 results ×','chip x clears the search');pass('chip x clears the search');
  const same=await fr.evaluate(()=>{const a=filterQuery('excess'),b=filterQuery('excess'),s1=sortRows(a),s2=sortRows(a);return a===b&&s1===s2});ok(same,'search/sort results are not cached');
  const kept=await fr.evaluate(async()=>{const el=document.querySelector('#Database .dbgrid');show('Plan');await new Promise(r=>setTimeout(r,50));show('Database');await new Promise(r=>setTimeout(r,50));return el===document.querySelector('#Database .dbgrid')});ok(kept,'switching back to Search rebuilt the table');
  pass('search and sort results are cached per loaded database and switching back to Search reuses the rendered table (no rebuild)')}
 // Search table layout: row numbers, long-press columns modal, grouping, order, search exclusion, persistence
 {await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(500);
  const rowNos=()=>fr.$$eval('#Database tbody tr[data-pid] td.rownum',e=>e.map(x=>x.textContent.trim()));
  const heads=()=>fr.$$eval('#Database thead th',e=>e.map(x=>x.dataset.f||x.textContent.trim()));
  ok((await heads())[0]==='Row'&&(await rowNos()).join()==='1,2,3,4,5,6','row numbers 1..N '+await rowNos());
  await fr.evaluate(()=>{omniDraft='excess';omniQuery='excess';renderDatabase()});await pg.waitForTimeout(400);ok((await rowNos()).join()==='1,2','row numbers renumber with the search '+await rowNos());
  await fr.evaluate(()=>{omniDraft='';omniQuery='';renderDatabase()});await pg.waitForTimeout(400);
  pass('search results carry a Row column numbered 1..N that renumbers with every search');
  const hold=async(f)=>{const b=await fr.locator('#Database th[data-f="'+f+'"]').boundingBox();await pg.mouse.move(b.x+b.width/2-6,b.y+b.height/2);await pg.mouse.down();await pg.waitForTimeout(800);await pg.mouse.up();await pg.waitForTimeout(250)};
  const sortBefore=await fr.evaluate(()=>sortField+sortDir);await hold('filename');ok(await fr.$('#ssotColList .colrow[data-f="filename"].focus'),'long press did not open the columns modal');ok(await fr.evaluate(()=>sortField+sortDir)===sortBefore,'long press must not sort');
  pass('long-pressing a column header opens the Columns modal (and does not sort)');
  const tick=(f,k)=>fr.locator('#ssotColList .colrow[data-f="'+f+'"] input[data-k="'+k+'"]').click();
  await tick('estate','g');await tick('fingerprint','g');await pg.waitForTimeout(300);
  const info=await fr.$eval('#ssotColInfo',e=>e.textContent);ok(/Group by Estate › Fingerprint/.test(info),'group info '+info);
  await fr.click('#modalcancel');await pg.waitForTimeout(300);
  let grp=await fr.$$eval('#Database tbody tr.ssot-grp',e=>e.map(x=>x.innerText.replace(/\s+/g,' ').trim()));ok(grp.length===3&&/Estate s1/.test(grp[0])&&/1 file/.test(grp[0])&&(await rowNos()).length===0,'groups collapsed by default '+JSON.stringify(grp));
  await fr.click('#Database tbody tr.ssot-grp:nth-child(1)');await pg.waitForTimeout(250);
  const lvl2=await fr.$$eval('#Database tbody tr.ssot-grp',e=>e.map(x=>x.innerText.replace(/\s+/g,' ').trim()+'|'+x.querySelector('.chev').textContent));ok(lvl2.length>3&&/▾/.test(lvl2[0])&&/Fingerprint/.test(lvl2[1]),'expand shows nested fingerprint groups '+JSON.stringify(lvl2));
  await fr.click('#Database tbody tr.ssot-grp:nth-child(2)');await pg.waitForTimeout(250);const nums=await rowNos();ok(nums.length>=1&&nums.every(n=>/^\d+$/.test(n)),'rows under an expanded group are numbered '+nums);
  await fr.click('#Database tbody tr.ssot-grp:nth-child(1)');await pg.waitForTimeout(250);ok((await fr.$$('#Database tbody tr.ssot-grp')).length===3,'collapse again');
  pass('group by Estate › Fingerprint: groups start collapsed, chevron expands nested groups with counts and size, rows stay numbered');
  const saved=await fr.evaluate(()=>localStorage.sotDbLayout);ok(/"groups":\["estate","fingerprint"\]/.test(saved),'persisted '+saved);
  await pg.reload();let fr2;for(let i=0;i<100;i++){try{const o=await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app');fr2=await o.contentFrame();if(await fr2.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
  await fr2.evaluate(()=>show('Database'));await pg.waitForTimeout(600);ok((await fr2.$$('#Database tbody tr.ssot-grp')).length===3,'grouping did not persist after reload');pass('layout choices persist across reloads');
  // drag Estate above Filename
  await fr2.evaluate(()=>__ssotColumnsModal('estate'));await pg.waitForTimeout(300);
  const hb=await fr2.locator('#ssotColList .colrow[data-f="estate"] .h').boundingBox(),tb=await fr2.locator('#ssotColList .colrow[data-f="path"]').boundingBox();
  await pg.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await pg.mouse.down();await pg.mouse.move(hb.x+hb.width/2,tb.y+2,{steps:8});await pg.mouse.up();await pg.waitForTimeout(300);
  const ord=await fr2.$$eval('#ssotColList .colrow',e=>e.map(x=>x.dataset.f));ok(ord.indexOf('estate')<ord.indexOf('path'),'drag reorder: estate should now be before Folder: '+ord);
  // exclude Estate from free-text search
  await fr2.locator('#ssotColList .colrow[data-f="estate"] input[data-k="s"]').click();await pg.waitForTimeout(200);
  await fr2.click('#modalcancel');await pg.waitForTimeout(300);
  {const h=await fr2.$$eval('#Database thead th[data-f]',e=>e.map(x=>x.dataset.f));ok(h.indexOf('estate')<h.indexOf('path'),'column order applied '+h)}
  const hit=async(q)=>fr2.evaluate(q=>{omniDraft=omniQuery=q;return filterQuery(q).length},q);
  const withEx=await hit('s2'),qual=await hit('estate:s2');ok(withEx===0&&qual>0,'excluded column ignored by free text but still searchable by name: '+withEx+'/'+qual);
  await fr2.evaluate(()=>{omniDraft='';omniQuery=''});
  pass('column order by drag, per-column "Search" exclusion (free text ignores it; field:value still works)');
  await fr2.evaluate(()=>{__ssotColumnsModal();document.getElementById('ssotColReset').click()});await pg.waitForTimeout(300);
  ok(JSON.parse(await fr2.evaluate(()=>localStorage.sotDbLayout)).groups.length===0,'reset');await fr2.click('#modalcancel');await pg.waitForTimeout(200);
  pass('Reset columns restores order, grouping and search');
  fr=fr2}
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
 // local cache + delta sync
 {const ctx=await browser.newContext({viewport:{width:1280,height:900}});const mk=async()=>{const pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));pg.on('pageerror',e=>fail('pageerror '+e.message));await pg.goto(URL_);const f=await (await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app')).contentFrame();return {pg,f}};
  const waitFor=async(f,fn,ms=15000)=>{for(let i=0;i<ms/100;i++){try{if(await f.evaluate(fn))return true}catch(e){}await new Promise(r=>setTimeout(r,100))}return false};
  const idbRows=f=>f.evaluate(()=>new Promise(res=>{const o=indexedDB.open('sot-placement-cache',1);o.onupgradeneeded=()=>{o.result.createObjectStore('kv')};o.onerror=()=>res(-1);o.onsuccess=()=>{const g=o.result.transaction('kv').objectStore('kv').get('placements');g.onsuccess=()=>res(g.result?g.result.rows.length:0)}}));
  counts.page=0;counts.delta=0;let a=await mk();ok(await waitFor(a.f,()=>placements.length===6&&!document.querySelector('#ssot-db-blocker.on')),'first load');ok(counts.page>=1,'first load pages '+counts.page);
  let saved=0;for(let i=0;i<50&&saved!==6;i++){await a.pg.waitForTimeout(100);saved=await idbRows(a.f)}ok(saved===6,'local cache not saved: '+saved);pass('rows are cached locally (IndexedDB) after a full load');await a.pg.close();
  pageDelay=6000;counts.page=0;counts.delta=0;const t0=Date.now();let b=await mk();ok(await waitFor(b.f,()=>placements.length===6&&!document.querySelector('#ssot-db-blocker.on'),3000),'cached rows not shown immediately');const tShown=Date.now()-t0;
  ok(await waitFor(b.f,()=>/no changes/.test(document.getElementById('ssot-db-status').textContent),8000),'delta no-change sync: '+await b.f.evaluate(()=>document.getElementById('ssot-db-status').textContent));ok(counts.page===0&&counts.delta>=1,'unchanged revision must not re-download rows: '+JSON.stringify(counts));pageDelay=0;
  pass('reload shows cached rows immediately ('+tShown+' ms, no blocker) and an unchanged revision downloads no rows');
  const orig=placements.slice();const gone=placements[5].placement_id;placements=placements.slice(0,5);const np=P('s1','UNIQUE',5);np.rev=2;placements.push(np);removedIds=[gone];rev=2;counts.page=0;
  await b.f.evaluate(()=>document.getElementById('ssot-db-status').click());
  const merged=await (async()=>{for(let i=0;i<100;i++){const r=await b.f.evaluate(([n,g])=>({has:placements.some(x=>x.placement_id===n),gone:!placements.some(x=>x.placement_id===g),len:placements.length,pill:document.getElementById('ssot-db-status').textContent}),[np.placement_id,gone]);if(r.has&&r.gone)return r;await b.pg.waitForTimeout(100)}return null})();
  ok(merged&&merged.len===6&&counts.page===0,'delta merge '+JSON.stringify(merged)+JSON.stringify(counts));pass('a changed revision syncs only the changed rows (1 added, 1 removed) with no full page download');
  const pillTxt=await b.f.evaluate(()=>document.getElementById('ssot-db-status').textContent);ok(/changed|current/.test(pillTxt),'pill '+pillTxt);
  deltaMode='full';rev=3;counts.page=0;await b.f.evaluate(()=>document.getElementById('ssot-db-status').click());for(let i=0;i<100&&counts.page===0;i++)await b.pg.waitForTimeout(100);ok(counts.page>=1,'full fallback when server says full');pass('server-directed full reload falls back to paging');
  deltaMode='missing';rev=4;counts.page=0;await b.f.evaluate(()=>document.getElementById('ssot-db-status').click());for(let i=0;i<100&&counts.page===0;i++)await b.pg.waitForTimeout(100);ok(counts.page>=1&&await waitFor(b.f,()=>placements.length===6&&!document.querySelector('#ssot-db-blocker.on')),'older backend without delta endpoint');pass('older backend without the delta endpoint falls back to paging');
  deltaMode='ok';removedIds=[];rev=1;placements=orig;await ctx.close()}
 // the page must not trigger a source scan on load; a manual (slow) check must not block
 {stalenessSlow=true;counts.stale=0;const o=await open(1280,900);await o.pg.waitForTimeout(1500);ok(counts.stale===0,'page load triggered a source scan: '+counts.stale);ok(await o.fr.evaluate(()=>placements.length>0&&!document.querySelector('#ssot-db-blocker.on')),'database blocked');
  await o.fr.evaluate(()=>document.getElementById('ssot-db-status').click());await o.pg.waitForTimeout(400);const ptxt=await o.fr.evaluate(()=>document.getElementById('ssot-db-status').textContent);ok(counts.stale===1&&/checking sources/.test(ptxt)&&await o.fr.evaluate(()=>!document.querySelector('#ssot-db-blocker.on')),'manual check: '+ptxt+' '+counts.stale);
  pass('opening the page never triggers a source scan; a manual check runs in the background (pill shows it) without blocking');stalenessSlow=false;await o.ctx.close()}
 // Chrome Local Network Access / unreachable API must be reported, and the blocker must release
 {const ctx=await browser.newContext({viewport:{width:1280,height:900}}),pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));await pg.route(/\/sot\/api\//,r=>r.abort('blockedbyclient'));await pg.goto(URL_);
  const f=await (await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app')).contentFrame();let txt='',on=true;for(let i=0;i<150&&(on||!/OFFLINE/.test(txt));i++){await pg.waitForTimeout(100);try{txt=await f.evaluate(()=>document.getElementById('ssot-db-status')?.textContent||'');on=await f.evaluate(()=>!!document.querySelector('#ssot-db-blocker.on'))}catch(e){}}
  ok(/OFFLINE/.test(txt)&&/Local network access/.test(txt)&&!on,'offline hint/blocker '+txt+' on='+on);pass('blocked/unreachable API shows an OFFLINE hint (Local network access) and the blocker releases');
  ok(await pg.evaluate(()=>/local-network-access/.test(document.getElementById('shell').allow)&&/clipboard-write/.test(document.getElementById('shell').allow)),'iframe local-network-access permission');await ctx.close()}
 // mobile
 const m=await open(412,915);await m.fr.evaluate(()=>setPlanTab('Estate'));await m.pg.waitForTimeout(300);
 const lg=await m.fr.evaluate(()=>{sources[0].root='/mnt/a/'+'very-long-folder-name-'.repeat(6);setPlanTab('Estate');const tr=document.querySelectorAll('.estate-table tbody tr')[0],c=tr.cells,r=[...c].map(x=>x.getBoundingClientRect());return {txt:c[0].textContent.length,cut:c[0].scrollWidth>c[0].clientWidth,h:tr.getBoundingClientRect().height,noOverlap:r[1].left>=r[0].right-1&&r[2].left>=r[1].right-1}});
 ok(lg.txt>100&&lg.cut&&lg.noOverlap&&lg.h<40,'long root must truncate on mobile '+JSON.stringify(lg));pass('long Estate root names truncate on mobile and no longer overlap the next column');
 const ov=await m.fr.evaluate(()=>({doc:document.documentElement.scrollWidth-document.documentElement.clientWidth,tbl:(()=>{let w=document.querySelector('.estate-wrap');return w.scrollWidth-w.clientWidth})(),rows:document.querySelectorAll('.estate-table tbody tr').length}));ok(ov.doc<=1&&ov.tbl<=1&&ov.rows===3,'mobile overflow '+JSON.stringify(ov));pass('Estate table usable at 412x915 without horizontal overflow');
 if(process.env.SOT_SHOTS){await m.pg.screenshot({path:process.env.SOT_SHOTS+'/estate-mobile.png'});await m.fr.evaluate(()=>setPlanTab('Summary'));await m.pg.waitForTimeout(300);await m.pg.screenshot({path:process.env.SOT_SHOTS+'/analysis-mobile.png'})}
 await m.fr.evaluate(()=>setPlanTab('Summary'));await m.pg.waitForTimeout(300);const wo=await m.fr.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth+document.querySelector('#Plan').scrollWidth-document.querySelector('#Plan').clientWidth);ok(wo<=2,'summary overflows horizontally on mobile: '+wo);pass('Summary report fits 412x915 without horizontal overflow');
 await m.ctx.close();
}finally{await browser.close();srv.close()}
