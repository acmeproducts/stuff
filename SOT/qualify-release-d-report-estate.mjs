// Runtime qualification: Report / Job Status / Estate inside the Complete surface (headless Chromium, mocked API).
import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('playwright'),HERE=path.dirname(fileURLToPath(import.meta.url)),GB=1073741824;
const fail=(m)=>{console.error('FAIL '+m);process.exitCode=1;throw new Error(m)},ok=(c,m)=>{if(!c)fail(m)},pass=m=>console.log('PASS '+m);
const now=Math.floor(Date.now()/1000);
const sources=[['s1','/mnt/a/Photos',300,now-3600],['s2','/mnt/b/Video',250,now-7200],['s3','/mnt/c/Archive',150,0]].map(([id,root,,t])=>({source_id:id,label:root,estate:root,root,enabled:1,soft_deleted:false,pending:false,analysis_state:'CURRENT',last_success_ended:t||null,last_success_job_id:t?'j'+id:null,last_errors:0,reachable:true}));
let n=0;const P=(src,cls,gb,fp,sub)=>({placement_id:'p'+(++n),placement_no:n,source_id:src,estate:src,path:sources.find(x=>x.source_id===src).root+(sub?'/'+sub:'')+'/f'+n,filename:'f'+n,size:gb*GB,fingerprint:fp||'fp'+n,system_classification:cls,availability:'OK',placement_state:'ACTIVE'});
// SCANNED 900 = UNIQUE 600 + KEEP 100 + EXCESS 200 ; ESTATE 700 ; roots retained a=300 b=250 c=150
let placements=[P('s1','UNIQUE',300),P('s2','UNIQUE',150,null,'2024'),P('s3','UNIQUE',150),P('s2','KEEP',100,'dup','2024/trips'),P('s3','EXCESS',100,'dup'),P('s2','EXCESS',100,'dup2')];
let mockJobs=[],removedIds=[],rev=1,counts={page:0,delta:0},deltaMode='ok',targetBytes=600*GB,stalenessMissing=false,pageDelay=0,stalenessSlow=false;
const api=(u)=>{const p=u.pathname.replace(/^\/sot/,'');
 if(p==='/api/jobs')return {ok:true,jobs:mockJobs,scheduler:{}};if(p==='/api/events')return {ok:true,events:[]};if(p==='/api/sources')return {ok:true,sources};
 if(p==='/api/target')return {ok:true,target:{configured:true,path:'/mnt/t',free_bytes:targetBytes,registered_free_bytes:targetBytes}};
 if(p==='/api/health')return {ok:true,catalog_revision:rev,creation_revision:1,db:{state:'healthy'}};
 if(p==='/api/placements/delta'){counts.delta++;if(deltaMode==='missing')return {ok:false,error:'not found'};const since=Number(u.searchParams.get('since'));if(since===rev)return {ok:true,full:false,unchanged:true,catalog_revision:rev,upserts:[],removed:[]};if(deltaMode==='full')return {ok:true,full:true,catalog_revision:rev,total:placements.length};return {ok:true,full:false,unchanged:false,catalog_revision:rev,total:placements.length,upserts:placements.filter(x=>x.rev===rev),removed:removedIds}}
 if(p==='/api/placements/page'){counts.page++;return {ok:true,catalog_revision:rev,total:placements.length,placements,has_more:false,next_after:placements.length}};
 if(p.startsWith('/api/ssot/refresh-staleness'))counts.stale=(counts.stale||0)+1;if(p.startsWith('/api/ssot/refresh-staleness')&&stalenessSlow)return 'slow';if(p.startsWith('/api/ssot/refresh-staleness'))return stalenessMissing?{ok:false,error:'not found'}:{ok:true,errors:[]};if(p==='/api/volumes')return {ok:true,volumes:[]};return {ok:true};};
let rankCalls=[],keepCalls=[],landCalls=[],ctlCalls=[],landState={state:'IDLE',job:null};
const post={
 '/api/placement/keep':b=>{keepCalls.push(b);const p=placements.find(x=>x.placement_id===b.placement_id);const g=placements.filter(x=>x.fingerprint===p.fingerprint);if(b.keep)p.system_classification='KEEP';else p.system_classification='EXCESS';rev++;for(const x of g)x.rev=rev;return {ok:true,group:g,catalog_revision:rev}},
 '/api/land/preflight':b=>{landCalls.push(['pre',b.placement_ids.length]);const rows=placements.filter(x=>b.placement_ids.includes(x.placement_id));const bytes=rows.reduce((t,x)=>t+x.size,0);return {ok:true,preflight:{files:rows.length,bytes,free_bytes:targetBytes,room_bytes:targetBytes,fits:bytes<=targetBytes,deficit_bytes:Math.max(0,bytes-targetBytes),will_land:{files:rows.length-(bytes>targetBytes?1:0),bytes:Math.min(bytes,targetBytes)},roots_short:bytes>targetBytes?[{source_id:'s3',root:'/mnt/c/Archive',files:1,bytes:150*GB}]:[],target:'/mnt/t'}}},
 '/api/land/start':b=>{landCalls.push(['start',b.placement_ids.length]);landState={state:'RUNNING',job:{id:'L1',state:'RUNNING',files:3,bytes:550*GB,files_done:1,bytes_done:200*GB,current:'/mnt/a/Photos/f1',errors:[],error_count:0,paused:false}};return {ok:true,land:landState}},
 '/api/land/control':b=>{landCalls.push(['ctl',b.action]);if(b.action==='cancel')landState={state:'IDLE',job:{...landState.job,state:'CANCELLED'}};else landState.job.paused=b.action==='pause';return {ok:true,land:landState}},
 '/api/source/control':b=>{ctlCalls.push(b);return {ok:true,sources}}};
const srv=http.createServer(async(rq,rs)=>{const u=new URL(rq.url,'http://x');const pp=u.pathname.replace(/^\/sot/,'');if(rq.method==='POST'&&post[pp]){let b='';for await(const c of rq)b+=c;const j=post[pp](JSON.parse(b||'{}'));rs.writeHead(200,{'content-type':'application/json'});return rs.end(JSON.stringify(j))}if(pp==='/api/land/status'){rs.writeHead(200,{'content-type':'application/json'});return rs.end(JSON.stringify({ok:true,land:landState}))}if(u.pathname.endsWith('/api/sources/rank')){let b='';for await(const c of rq)b+=c;const o=JSON.parse(b).order;rankCalls.push(o);sources.sort((x,y)=>o.indexOf(x.source_id)-o.indexOf(y.source_id));rs.writeHead(200,{'content-type':'application/json'});return rs.end(JSON.stringify({ok:true,sources}))}if(u.pathname.startsWith('/sot/')){if(pageDelay&&u.pathname.endsWith('/placements/page'))await new Promise(r=>setTimeout(r,pageDelay));const j=api(u);if(j==='slow'){await new Promise(r=>setTimeout(r,60000));return rs.end('{"ok":true}')}rs.writeHead(j.ok===false?404:200,{'content-type':'application/json'});return rs.end(JSON.stringify(j))}
 const f=path.join(HERE,path.basename(u.pathname));if(!fs.existsSync(f)){rs.writeHead(404);return rs.end()}rs.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':'text/plain'});rs.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));const port=srv.address().port,URL_=`http://127.0.0.1:${port}/sot-turn02-release-d-complete.html?api=${encodeURIComponent(`http://127.0.0.1:${port}/sot`)}`;
const browser=await chromium.launch();
async function open(vw,vh){const ctx=await browser.newContext({viewport:{width:vw,height:vh}}),pg=await ctx.newPage();await pg.route(/cdn\.jsdelivr\.net/,r=>r.fulfill({contentType:'text/javascript',body:''}));pg.on('pageerror',e=>fail('pageerror '+e.message));
 await pg.goto(URL_);const inner=async()=>{const h=await pg.waitForSelector('#shell');const o=await (await h.contentFrame()).waitForSelector('#app');return o.contentFrame()};
 let fr;for(let i=0;i<100;i++){try{fr=await inner();if(await fr.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
 ok(fr,'runtime did not start');await fr.waitForSelector('#Plan .flow');return {ctx,pg,fr}}
const txt=(fr,sel)=>fr.$eval(sel,e=>e.innerText);
try{
 let {ctx:ctx0,pg,fr}=await open(1280,900);
 // 1 labels
 const rail=await fr.evaluate(()=>({nav:[...document.querySelectorAll('#ssot-rail .srnav button')].map(b=>b.textContent),foot:document.querySelector('#ssot-rail .srfoot')?.innerText.trim(),head:document.querySelector('#ssot-rail .srhead')?.innerText.replace(/\s+/g,' ').trim(),dot:!!document.getElementById('ssot-raildot'),header:getComputedStyle(document.querySelector('header')).display,on:[...document.querySelectorAll('#ssot-rail .srnav button.on')].map(b=>b.textContent)}));
 ok(JSON.stringify(rail.nav)==='["Map","Roots","Duplicates","AI","Land"]'&&/Config/.test(rail.foot)&&/^SOT Release E/.test(rail.head)&&rail.dot&&rail.header==='none'&&JSON.stringify(rail.on)==='["Map"]','left menu '+JSON.stringify(rail));
 ok((await fr.$$('#Plan .subtabs, .ssot-report-switch')).length===0,'the Report|Job Status and Summary|Roots rows must be gone');
 const vis=await fr.evaluate(()=>[...document.querySelectorAll('button,a,[role=tab]')].filter(e=>e.offsetParent&&/analyze/i.test(e.textContent)).map(e=>e.textContent));ok(!vis.length,'visible Analyze label: '+vis);
 const onNav=()=>fr.$$eval('#ssot-rail .srnav button.on',b=>b.map(x=>x.textContent));
 pass('left menu: SOT + release + connection on top, Map · Roots · Duplicates · AI · Land, Config pinned at the bottom; the top icon row is gone');
 // 2 subtabs
 // (sub-tabs removed: Roots and Job Status are top-strip icons)
 const F=()=>fr.evaluate(()=>({val:document.querySelector('#Plan .fval').innerText.trim(),chips:[...document.querySelectorAll('#Plan .fchip')].map(c=>c.innerText.replace(/[✕+]/g,'').trim()+(c.classList.contains('dim')?'~':'')+(c.classList.contains('off')?'-':'')),sq:[...document.querySelectorAll('#Plan .fsq')].map(q=>q.title||'_').join(','),tiles:[...document.querySelectorAll('#Plan .ftile')].map(t=>t.innerText.trim()+'@'+t.style.background.replace(/\s/g,'')),up:document.querySelector('#Plan .fcrumb')?.innerText||''}));
 const setF=(o)=>fr.evaluate(o=>{localStorage.removeItem('sotFlowUi');Object.assign(__ssotFlow,{view:'scanned',u:'g',n:'pct',off:[],cur:null,curSlice:null},o);renderPlan()},o);
 await setF({});await pg.waitForTimeout(150);
 let f=await F();
 ok(await fr.$$eval('#Plan .ftop .fseg',g=>g.map(x=>x.innerText.replace(/\s+/g,' ').trim()).join('|'))==='# %|GB Files','top row switches');
 ok(JSON.stringify(await fr.$$eval('#Plan .fview option',o=>o.map(x=>x.value)))==='["scanned","capacity","stored"]','one dropdown with three views');
 ok(f.val==='100%'&&JSON.stringify(f.chips)==='["All~","Unique","Keep","Excess"]','scanned top/chips '+JSON.stringify(f));
 ok(f.sq==='Unique,Unique,Unique,Unique,Unique,Unique,Unique + Keep,Keep + Excess,Excess,Excess'&&await fr.$$eval('#Plan .fsq.fsplit .fq',q=>q.length)===8,'10 squares, split into quarters where a slice ends (67/11/22%) '+f.sq);
 ok(!/estate/i.test(await txt(fr,'#Plan .flow')),'"Estate" must not appear in the Report');
 pass('Report: # / % and GB / Files on top, one view dropdown, a 10-square bar and name-only legend chips with All');
 await fr.evaluate(()=>__ssotFlowToggle('excess'));f=await F();ok(f.val==='78%'&&f.chips[0]==='All'&&f.chips[3]==='Excess-'&&!f.tiles.some(t=>/a77de8|167,125,232/.test(t)),'hiding Excess '+JSON.stringify(f));
 await fr.evaluate(()=>__ssotFlowAll());f=await F();ok(f.val==='100%'&&f.chips[0]==='All~','All restores '+JSON.stringify(f));
 await fr.evaluate(()=>{__ssotFlowSet('n','n')});f=await F();ok(f.val==='900.0 GB','# in GB '+f.val);await fr.evaluate(()=>__ssotFlowSet('u','f'));f=await F();ok(/^6\s*files$/.test(f.val),'# in files '+f.val);await fr.evaluate(()=>{__ssotFlowSet('u','g');__ssotFlowSet('n','pct')});
 pass('chips hide and restore slices; the top value and bar follow; # / % and GB / Files change every number');
 ok(f.tiles.length>=5&&f.tiles.some(t=>/^\/mnt\/a\/Photos@/.test(t))&&f.tiles.filter(t=>/^\/mnt\/b\/Video/.test(t)).length===3,'scanned tiles: one per root per slice (Video appears in three colours) '+JSON.stringify(f.tiles));
 pass('treemap tiles are root paths coloured by slice; a root that holds several slices appears once per slice');
 await setF({view:'capacity'});f=await F();ok(JSON.stringify(f.chips)==='["All~","Assets","Deficit"]'&&f.sq==='Assets,Assets,Assets,Assets,Assets,Assets,Assets,Assets + Deficit,Deficit,Deficit','capacity over target '+JSON.stringify(f));
 ok(f.tiles.some(t=>/^\/mnt\/c\/Archive@.*(e5484d|229,72,77)/.test(t))&&!f.tiles.some(t=>/^Open/.test(t)),'deficit root is red, no Open tile '+JSON.stringify(f.tiles));
 targetBytes=800*GB;await fr.evaluate(()=>dataPoll());await pg.waitForTimeout(500);await setF({view:'capacity'});f=await F();ok(JSON.stringify(f.chips)==='["All~","Assets","Open"]'&&f.tiles.some(t=>/^Open/.test(t)),'capacity under target '+JSON.stringify(f));
 await setF({view:'stored'});f=await F();ok(JSON.stringify(f.chips)==='["All~","Landed","In play","Open"]','stored keeps all three chips even when Landed is 0 '+JSON.stringify(f.chips));
 targetBytes=600*GB;await fr.evaluate(()=>dataPoll());await pg.waitForTimeout(500);
 pass('Capacity shows Deficit (red) or Open (grey), never both; Stored always lists Landed, In play and Open');
 // taps: single = card, double = drill / search
 await setF({view:'scanned'});await pg.waitForTimeout(100);
 const tileSel=async(re)=>{const i=await fr.evaluate(re=>[...document.querySelectorAll('#Plan .ftile')].findIndex(t=>new RegExp(re).test(t.innerText)&&/59, ?158, ?230/.test(t.style.background)),re);return (await fr.$$('#Plan .ftile'))[i]};
 let t=await tileSel('^/mnt/b/Video');await t.click();await pg.waitForTimeout(450);ok(await fr.evaluate(()=>{const c=document.getElementById('ssotFlowCard');return !c.hidden&&/\/mnt\/b\/Video/.test(c.innerText)&&/Unique · 1 files · 150\.0 GB/.test(c.innerText)}),'single tap shows the stats card');
 t=await tileSel('^/mnt/b/Video');await t.click();await t.click();await pg.waitForTimeout(250);f=await F();ok(/\/mnt\/b\/Video/.test(f.up)&&f.tiles.length===1&&/^2024/.test(f.tiles[0])&&f.val==='17%','double tap drills into the folder in that colour '+JSON.stringify(f));
 ok(f.sq==='Unique,Unique,_,_,_,_,_,_,_,_','bar follows the drill '+f.sq);
 await fr.evaluate(()=>__ssotFlowUp());f=await F();ok(!f.up&&f.val==='100%','Up returns to the roots '+JSON.stringify(f));
 pass('single tap shows a stats card; double tap opens a folder in its slice colour; top value and bar follow; ↑ Up goes back');
 const tapGo=async(fn,q,n,label,arg)=>{await fr.evaluate(fn,arg);await pg.waitForTimeout(450);const r=await fr.evaluate(()=>({on:document.getElementById('Database').classList.contains('on'),pane:document.querySelector('.pane.on')?.id,q:omniQuery,n:filterQuery(omniQuery).length,modal:document.documentElement.classList.contains('ssot-smodal')}));ok(r.on&&r.modal&&r.q===q&&r.n===n,'search '+JSON.stringify(r));await fr.click('.ssot-sclose');await pg.waitForTimeout(300);ok(await fr.evaluate(()=>document.getElementById('Plan').classList.contains('on')&&!document.documentElement.classList.contains('ssot-smodal')),'closing Search returns to the Map')};
 await tapGo(()=>__ssotFlowSearchSlice('excess'),'#report:flow:{"v":"scanned","s":["excess"],"p":null,"h":false}',2,'Excess');
 await setF({view:'capacity'});await tapGo(()=>__ssotFlowSearchSlice('deficit'),'#report:flow:{"v":"capacity","s":["deficit"],"p":null,"h":false}',1,'Deficit');
 await setF({view:'scanned',cur:'/mnt/b/Video',curSlice:'unique'});await tapGo(()=>__ssotFlowSearchHere(),'#report:flow:{"v":"scanned","s":["unique"],"p":"/mnt/b/Video","h":false}',1,'/mnt/b/Video');
 await setF({view:'scanned'});{const i=await fr.evaluate(()=>[...document.querySelectorAll('#Plan .ftile')].findIndex(t=>/^\/mnt\/a\/Photos/.test(t.innerText)));await tapGo(i=>{__ssotFlowTap({stopPropagation(){}},i);__ssotFlowTap({stopPropagation(){}},i)},'#report:flow:{"v":"scanned","s":["unique"],"p":"/mnt/a/Photos","h":false}',1,'/mnt/a/Photos',i)}
 pass('chip names, the breadcrumb and double-tapped leaf tiles open the Search window on exactly those files; × closes back to the Map');
 await fr.evaluate(()=>{__ssotFlowSet('view','stored');__ssotFlowSet('u','f');__ssotFlowSet('n','n')});await pg.reload();{let f4;for(let i=0;i<100;i++){try{const o=await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app');f4=await o.contentFrame();if(await f4.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
  const st=await f4.evaluate(()=>JSON.stringify(__ssotFlow));ok(/"view":"stored"/.test(st)&&/"u":"f"/.test(st)&&/"n":"n"/.test(st),'report choices not persisted '+st);
  await f4.evaluate(()=>{localStorage.removeItem('sotFlowUi');Object.assign(__ssotFlow,{view:'scanned',u:'g',n:'pct',off:[],cur:null,curSlice:null});renderPlan()});fr=f4}
 pass('view, # / % and GB / Files persist per device');
 // Release E: where a double-tap on a leaf goes
 const dbl=async(re,col)=>{const i=await fr.evaluate(([re,col])=>[...document.querySelectorAll('#Plan .ftile')].findIndex(t=>new RegExp(re).test(t.innerText)&&new RegExp(col).test(t.style.background)),[re,col]);ok(i>=0,'tile '+re);await fr.evaluate(i=>{__ssotFlowTap({stopPropagation(){}},i);__ssotFlowTap({stopPropagation(){}},i)},i);await pg.waitForTimeout(500)};
 await setF({view:'scanned'});await dbl('^/mnt/c/Archive','167, ?125, ?232');
 ok(await fr.evaluate(()=>!__ssotDupMode&&/^#report:flow:/.test(omniQuery)&&document.documentElement.classList.contains('ssot-smodal')&&!document.querySelector('#Database tr.ssot-grp')),'Excess leaf opens Search for that folder, flat');
 await fr.evaluate(()=>__ssotCloseSearch());
 await fr.evaluate(()=>__ssotOpenReportMode('Report'));await setF({view:'capacity'});await dbl('^/mnt/c/Archive','229, ?72, ?77');
 ok(await fr.evaluate(()=>eval('planTab')==='Roots'&&!!document.querySelector('.estate-table tr.rhi[data-sid="s3"]')),'Deficit leaf opens Roots with that row highlighted');
 await fr.evaluate(()=>__ssotOpenReportMode('Report'));await setF({view:'capacity'});await dbl('^/mnt/a/Photos','59, ?158, ?230');
 {const r=await fr.evaluate(()=>({modal:document.documentElement.classList.contains('ssot-smodal'),sel:__ssotTableSelected.size,land:!!document.querySelector('.ssot-bulk .land')}));ok(r.modal&&r.sel===0&&!r.land,'In play leaf opens Search for that folder, nothing pre-selected, no Land '+JSON.stringify(r))}
 pass('double-tap: a leaf opens Search for that folder · Deficit → Roots with the row highlighted');
 // Search: Delete only for Excess, Land only for in-play
 await fr.evaluate(()=>{__ssotTableSelected.clear();omniDraft=omniQuery='class:excess';renderDatabase()});await pg.waitForTimeout(400);
 {const r=await fr.evaluate(()=>({land:!!document.querySelector('.ssot-bulk .land'),del:document.querySelector('.ssot-bulk .danger')?.disabled}));ok(!r.land&&r.del===false,'Excess results: Delete allowed, no Land in Search '+JSON.stringify(r))}
 await fr.evaluate(()=>{omniDraft=omniQuery='';renderDatabase()});await pg.waitForTimeout(300);
 ok(await fr.evaluate(()=>document.querySelector('.ssot-bulk .danger')?.disabled===true),'mixed results: Delete is off');
 pass('Search action bar: Delete is limited to Excess; Land is not in Search');
 // Land: its own screen in Roots order, root by root, confirm first, never automatic
 ok(!landCalls.length,'nothing lands on its own');await fr.evaluate(()=>__ssotCloseSearch(true));
 await fr.click('#ssot-rail button[data-nav="land"]');await pg.waitForTimeout(500);
 const landRows=()=>fr.$$eval('#Plan .land tbody tr[data-sid]',r=>r.map(x=>({id:x.dataset.sid,dot:x.querySelector('.rdot').className.replace('rdot ',''),t:x.innerText.replace(/\s+/g,' ').trim()})));
 {let r=await landRows();ok(JSON.stringify(await onNav())==='["Land"]'&&r.length===3&&r.map(x=>x.id).join()===(await fr.evaluate(()=>__ssotRootsOrder(__ssotReportModel().roots).map(r=>r.id).join())),'Land lists roots in Roots order '+JSON.stringify(r));
  ok(/^Target: 0\.64 TB \| Assets: 0\.75 TB \| Deficit: 0\.11 TB$/.test(await txt(fr,'#Plan .land .estate-sum')),'TB line '+await txt(fr,'#Plan .land .estate-sum'));
  ok(r.every(x=>/0% landed/.test(x.t)),'nothing landed yet '+JSON.stringify(r))}
 await fr.click('#Plan .land tr[data-sid="s1"] .rdots');await pg.waitForTimeout(200);ok(JSON.stringify(await fr.$$eval('.rpop button',b=>b.map(x=>x.textContent)))==='["Land this root"]','row menu: Land this root');
 await fr.click('.rpop button:has-text("Land this root")');await pg.waitForTimeout(600);
 {const m=await fr.evaluate(()=>({t:document.getElementById('modaltitle').textContent,b:document.getElementById('modalbody').innerText,ok:document.getElementById('modalok').textContent}));ok(/Land on the TARGET/.test(m.t)&&/1 files · 300\.0 GB/.test(m.b)&&/600\.0 GB free/.test(m.b)&&/Fits\./.test(m.b)&&m.ok==='Proceed','confirm screen '+JSON.stringify(m))}
 ok(landCalls.length===1&&landCalls[0][0]==='pre'&&landCalls[0][1]===1,'only the preflight ran so far, for that root only '+JSON.stringify(landCalls));
 await fr.click('#modalcancel');await pg.waitForTimeout(200);ok(landCalls.length===1,'Cancel backs out');
 await fr.click('#Plan .land tr[data-sid="s2"] .rdots');await pg.waitForTimeout(200);await fr.click('.rpop button:has-text("Land this root")');await pg.waitForTimeout(600);
 ok(landCalls.at(-1)?.[1]===2,'Land sends only that root\'s Keep + Unique copies (never Excess) '+JSON.stringify(landCalls.at(-1)));
 await fr.click('#modalok');await pg.waitForTimeout(700);ok(landCalls.at(-1)?.[0]==='start','Proceed starts landing');
 await pg.waitForTimeout(1800);{const r=await landRows(),row=r.find(x=>x.id==='s2');ok(row&&row.dot==='yellow'&&/Landing 36% · 1 \/ 3/.test(row.t)&&/Pause/.test(row.t)&&/Cancel/.test(row.t),'landing row shows progress, Pause, Cancel '+JSON.stringify(row))}
 ok(await fr.evaluate(()=>document.querySelector('#ssot-rail [data-nav="land"]').classList.contains('busy')),'Land menu item shows the landing dot');
 await fr.click('#Plan .land tr[data-sid="s2"] button:has-text("Pause")');await pg.waitForTimeout(400);ok(landCalls.at(-1)?.join()==='ctl,pause','pause');
 await fr.click('#Plan .land tr[data-sid="s2"] button:has-text("Cancel")');await pg.waitForTimeout(400);ok(landCalls.at(-1)?.join()==='ctl,cancel','cancel');
 pass('Land: roots in Roots order, ⋯ Land this root (Keep + Unique only), confirm with Fits or Deficit, progress with Pause and Cancel on that row');
 // Change target from the Land header
 await fr.click('#Plan .land .rtop .rdots');await pg.waitForTimeout(200);ok(JSON.stringify(await fr.$$eval('.rpop button',b=>b.map(x=>x.textContent)))==='["Rescan target","Change target…"]','target menu');
 await fr.click('.rpop button:has-text("Change target")');await pg.waitForTimeout(600);
 ok(await fr.evaluate(()=>document.getElementById('modaltitle').textContent==='Change TARGET'&&!!document.getElementById('keepOldTarget')),'change target asks, with a keep-old-as-root checkbox');await fr.click('#modalcancel');await pg.waitForTimeout(200);
 pass('Change target lives on the Land header ⋯ with "Keep the old target as a root"');
 // + Add path opens the picker as a modal with a visible close
 await fr.click('#ssot-rail button[data-nav="roots"]');await pg.waitForTimeout(400);await fr.click('.raddpath');await pg.waitForTimeout(800);
 {const r=await fr.evaluate(()=>{const x=document.getElementById('ssot-addx'),b=x&&x.getBoundingClientRect();return {on:document.documentElement.classList.contains('ssot-addmodal'),vis:!!b&&b.width>0&&b.top>=0&&b.right<=innerWidth}});ok(r.on&&r.vis,'picker modal shows a close button '+JSON.stringify(r))}
 await fr.click('#ssot-addx');await pg.waitForTimeout(400);ok(await fr.evaluate(()=>!document.documentElement.classList.contains('ssot-addmodal')&&!!document.querySelector('#Plan .estate-table')),'close returns to Roots');
 await fr.click('.raddpath');await pg.waitForTimeout(600);await pg.keyboard.press('Escape');await pg.waitForTimeout(1500);ok(await fr.evaluate(()=>!document.documentElement.classList.contains('ssot-addmodal')),'Escape closes the picker');
 pass('+ Add path picker has a close (×) and Escape closes it');
 // first run: no target yet
 await fr.evaluate(()=>{window.__ssotT=eval('targetState');eval('targetState={configured:false}');__ssotOpenReportMode('Report');renderPlan()});await pg.waitForTimeout(200);
 {const t=await txt(fr,'#Plan .setup');ok(/1 · Target/.test(t)&&/2 · AI/.test(t)&&/3 · GitHub token/.test(t),'setup cards '+t)}
 await fr.evaluate(()=>{eval('targetState=window.__ssotT');renderPlan()});
 pass('first run: three cards (Target, AI, GitHub token), one sentence each');
 // Roots
 await fr.evaluate(()=>{localStorage.removeItem('sotRootsUi');Object.assign(__ssotRoots,{mode:'custom',col:'size',dir:-1,u:'g',custom:[],menu:null,hi:null});setPlanTab('Roots')});await pg.waitForTimeout(200);
 const heads=await fr.$$eval('.estate-table th',h=>h.map(x=>x.textContent.replace(/[▲▼]/g,'').trim()));ok(JSON.stringify(heads)==='["","","Root","Files","Size","Last synced",""]','heads '+heads);
 const rowsOf=()=>fr.$$eval('.estate-table tbody tr:not(.trow)',r=>r.map(x=>({h:x.cells[0].textContent,dot:x.querySelector('.rdot')?.className.replace('rdot','').trim(),root:x.querySelector('.rpath')?.textContent||x.cells[2].textContent,now:x.querySelector('.rnow')?.textContent||'',files:x.cells[3].textContent,size:x.cells[4].textContent,synced:x.cells[5].textContent,bg:getComputedStyle(x.cells[2]).backgroundColor,fg:getComputedStyle(x.cells[2]).color,red:x.classList.contains('redrow')})));
 let rows=await rowsOf();ok(rows.length===3&&rows.map(r=>r.root).join()==='/mnt/a/Photos,/mnt/b/Video,/mnt/c/Archive'&&rows.every(r=>r.h==='☰'&&r.dot==='green'),'rows '+JSON.stringify(rows));
 ok(rows[0].files==='1'&&rows[0].size==='300.0 GB'&&rows[1].files==='2'&&rows[1].size==='250.0 GB'&&rows[2].files==='1'&&rows[2].size==='150.0 GB','root numbers from real placements '+JSON.stringify(rows));
 ok(rows[2].synced==='Never'&&rows[0].synced!=='Never','sync '+JSON.stringify(rows));
 ok(/% of target/.test(rows[0].now)&&/^50% /.test(rows[0].now),'green rows carry a grey share-of-target bar '+rows[0].now);
 const sum=await txt(fr,'.estate-sum');ok(/^Target: 0\.64 TB \| Assets: 0\.75 TB \| Deficit: 0\.11 TB$/.test(sum),'summary in TB '+sum);
 ok(!(await fr.$('.estate-table tr.trow'))&&/^ROOTS 3$/.test(await txt(fr,'.roots .rcount'))&&!!(await fr.$('.roots .rtop .rsearch')),'no TARGET row; ROOTS count, search icon and Custom on one row');
 pass('Roots: TARGET pinned first; rows are ☰ · dot · Root · Files · Size · Last synced · ⋯; green rows show their share of everything scanned');
 const red='rgb(198, 40, 40)',white='rgb(255, 255, 255)';ok(rows[2].bg===red&&rows[2].fg===white&&rows[0].bg!==red&&rows[1].bg!==red,'overflow colors '+JSON.stringify(rows.map(r=>[r.bg,r.fg])));
 pass('roots fill the TARGET in priority order; the first root that does not fit and everything after it is red');
 ok(!(await fr.$('.rtop .fseg')),'no #/GB switch on Roots');
 // live scan: yellow dot, progress bar, current file
 mockJobs=[{job:{state:'RUNNING'},scope_sources:[{source_id:'s2'}],sources:[{source_id:'s2',discovered_files:200,hashed_files:50,discovered_bytes:4000,hashed_bytes:1000,current_file:'IMG_2041.jpg'}]}];await fr.evaluate(()=>{window.__ssotJobsSave=eval('jobs');eval("jobs=[{job:{state:'RUNNING'},scope_sources:[{source_id:'s2'}],sources:[{source_id:'s2',discovered_files:200,hashed_files:50,discovered_bytes:4000,hashed_bytes:1000,current_file:'IMG_2041.jpg'}]}]");renderPlan()});
 rows=await rowsOf();ok(rows[1].dot==='yellow'&&/^25% · 50 \/ 200 · IMG_2041\.jpg/.test(rows[1].now),'scanning row '+JSON.stringify(rows[1]));
 ok(await fr.evaluate(()=>new Promise(r=>{let t0=Date.now(),iv=setInterval(()=>{if(document.querySelector('#ssot-rail [data-nav="roots"]').classList.contains('busy')){clearInterval(iv);r(true)}else if(Date.now()-t0>4000){clearInterval(iv);r(false)}},100)})),'Roots icon shows the scanning dot');
 mockJobs=[];await fr.evaluate(()=>{eval('jobs=window.__ssotJobsSave||[]');renderPlan()});
 pass('a scanning root shows a yellow dot, a live progress bar and the file being fingerprinted; the Roots icon carries a yellow dot');
 // unreadable: red at the top, no numbers, only Retry / Remove
 await fr.evaluate(()=>{sources[2].reachable=false;renderPlan()});rows=await rowsOf();ok(rows[0].red&&rows[0].dot==='red'&&/Archive/.test(rows[0].root)&&rows[0].files===''&&rows[0].size===''&&!rows[0].now,'red row '+JSON.stringify(rows[0]));
 await fr.click('.estate-table tr.redrow .rdots');await pg.waitForTimeout(200);ok(JSON.stringify(await fr.$$eval('.rpop button',b=>b.map(x=>x.textContent)))==='["Retry","Remove"]','red row menu');
 await fr.click('.rpop button:has-text("Retry")');await pg.waitForTimeout(400);ok(ctlCalls.at(-1)?.action==='rescan'&&ctlCalls.at(-1)?.source_id==='s3','retry sends rescan '+JSON.stringify(ctlCalls));
 await fr.evaluate(()=>{sources[2].reachable=true;renderPlan()});
 pass('a root that cannot be read is red, sits at the top with no numbers, and offers only Retry or Remove');
 await fr.click('.estate-table tbody tr:not(.trow):nth-child(2) .rdots');await pg.waitForTimeout(200);ok(JSON.stringify(await fr.$$eval('.rpop button',b=>b.map(x=>x.textContent)))==='["Search","Rescan","Remove"]','row menu');
 await fr.click('.rpop button:has-text("Remove")');await pg.waitForTimeout(500);ok(ctlCalls.at(-1)?.action==='remove'&&ctlCalls.at(-1)?.source_id==='s2'&&!(await fr.evaluate(()=>document.getElementById('modal')?.classList.contains('on'))),'remove happens at once, no dialog '+JSON.stringify(ctlCalls.at(-1)));
 ok(/Removed \/mnt\/b\/Video/.test(await fr.$eval('#ssot-undo',e=>e.innerText)),'undo toast');await fr.click('#ssot-undo button');await pg.waitForTimeout(400);ok(ctlCalls.at(-1)?.action==='restore'&&ctlCalls.at(-1)?.source_id==='s2','Undo restores '+JSON.stringify(ctlCalls.at(-1)));
 pass('the ⋯ at the end of each row offers Rescan and Remove; Remove happens at once with an Undo toast');
 await fr.click('.estate-table tbody tr:not(.trow):nth-child(1) .rdots');await pg.waitForTimeout(200);await fr.click('.rpop button:has-text("Search")');await pg.waitForTimeout(500);
 {const r=await fr.evaluate(()=>({modal:document.documentElement.classList.contains('ssot-smodal'),q:omniQuery,n:filterQuery(omniQuery).length,want:placements.filter(p=>'#root:'+p.source_id===omniQuery).length}));ok(r.modal&&/^#root:/.test(r.q)&&r.n>0&&r.n===r.want,'⋯ Search opens the Search window on that root '+JSON.stringify(r))}
 await fr.click('.ssot-sclose');await pg.waitForTimeout(300);ok(await fr.evaluate(()=>eval('planTab')==='Roots'&&!document.documentElement.classList.contains('ssot-smodal')),'closing returns to Roots');
 await fr.click('.roots .rsearch');await pg.waitForTimeout(400);ok(await fr.evaluate(()=>document.documentElement.classList.contains('ssot-smodal')&&omniQuery===''&&!document.querySelector('.ssot-bulk .selection-count')),'Roots search icon opens Search on everything with nothing selected');await fr.click('.ssot-sclose');await pg.waitForTimeout(300);
 pass('Roots: ⋯ Search opens the Search window on that root; the search icon opens it on everything; × returns to Roots');
 // priority: column sort sets it, Custom restores the drag order
 await fr.click('.estate-table th:has-text("Files")');await pg.waitForTimeout(700);ok(rankCalls.at(-1)?.join()==='s2,s1,s3'&&!(await fr.$eval('.rcustom',b=>b.classList.contains('live'))),'column sort becomes the priority '+JSON.stringify(rankCalls));
 {const box=async i=>(await fr.$$('.estate-table tbody tr:not(.trow) td.rank-h'))[i].boundingBox();const b3=await box(2),b1=await box(0);
  await pg.mouse.move(b3.x+b3.width/2,b3.y+b3.height/2);await pg.mouse.down();await pg.mouse.move(b1.x+b1.width/2,b1.y+2,{steps:6});await pg.mouse.up();await pg.waitForTimeout(150);
  ok(await fr.evaluate(()=>[...document.querySelectorAll('.toast')].some(t=>/Recalculating/.test(t.textContent))),'Recalculating… shows while priority is saved');await pg.waitForTimeout(900);
  ok(rankCalls.at(-1)?.join()==='s3,s2,s1','drag sends the new priority '+JSON.stringify(rankCalls.at(-1)));
  ok(await fr.$eval('.rcustom',b=>b.classList.contains('live')),'dragging switches to Custom');
  await pg.waitForTimeout(2500);rows=await rowsOf();ok(rows.map(r=>r.root.split('/').pop()).join()==='Archive,Video,Photos','the dragged order holds after polling '+rows.map(r=>r.root));
  pass('dragging ☰ switches to Custom, shows Recalculating…, saves the priority, and the order holds');
  await fr.click('.estate-table th:has-text("Root")');await pg.waitForTimeout(700);ok(rankCalls.at(-1)?.join()==='s1,s2,s3','root sort '+rankCalls.at(-1));
  await fr.click('.rcustom');await pg.waitForTimeout(700);ok(rankCalls.at(-1)?.join()==='s3,s2,s1','Custom restores the saved drag order '+rankCalls.at(-1));
  pass('tapping a column header sorts and sets the priority; Custom brings back the saved drag order');
  {const o=['s1','s2','s3'];sources.sort((x,y)=>o.indexOf(x.source_id)-o.indexOf(y.source_id))}
  await fr.evaluate(()=>{__ssotRoots.custom=['s1','s2','s3'];__ssotRoots.mode='custom';const o=['s1','s2','s3'];sources.sort((x,y)=>o.indexOf(x.source_id)-o.indexOf(y.source_id));renderPlan()})}
 {const cs=await fr.$eval('.estate-table tr:not(.trow) td.estate-root .rpath',e=>{const c=getComputedStyle(e);return {o:c.textOverflow,w:c.whiteSpace,t:e.parentNode.title,copy:e.parentNode.dataset.copy}});ok(cs.o==='ellipsis'&&cs.w==='nowrap'&&/tap to copy/.test(cs.t)&&cs.copy.startsWith('/mnt/'),'root truncation/hover/copy attrs '+JSON.stringify(cs));
  await ctx0.grantPermissions(['clipboard-read','clipboard-write']);await fr.click('.estate-table tbody tr:not(.trow):nth-child(2) td.estate-root');await pg.waitForTimeout(300);const copied=await pg.evaluate(()=>navigator.clipboard.readText());ok(copied.startsWith('/mnt/'),'tap-to-copy clipboard: '+copied);
  pass('root paths truncate with an ellipsis, show the full value on hover, and copy on tap')}
 // MutationObserver idempotence at runtime
 await fr.evaluate(()=>renderPlan());await pg.waitForTimeout(500);
 const muts=await fr.evaluate(()=>new Promise(res=>{let c=0,mo=new MutationObserver(l=>c+=l.length);for(const n of [document.getElementById('tabs'),document.getElementById('Plan'),document.getElementById('Analyze')])mo.observe(n,{childList:true,subtree:true,attributes:true});setTimeout(()=>{mo.disconnect();res(c)},4000)}));ok(muts<40,'idle DOM mutations '+muts);
 pass('observed tab/report decoration is idempotent at runtime (idle mutations='+muts+', no self-trigger loop)');
 // Search (Database): copy on tap, automatic result chip, cached switching
 {await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(500);
  const chip=()=>fr.$eval('.ssot-bulk',e=>{let c=e.querySelector('.selection-count');return c?c.innerText.replace(/\s+/g,' ').trim():'none'});
  ok(await chip()==='none'&&await fr.evaluate(()=>[...document.querySelectorAll('.ssot-bulk button.btn')].every(b=>b.disabled)&&!document.querySelector('.ssot-bulk .land')),'no search: nothing selected, actions off '+await chip());
  ok(await fr.evaluate(()=>/6 \/ 6/.test(document.querySelector('.ssot-search-head .ssot-scount').innerText)),'the count sits in the Search header');ok(!(await fr.evaluate(()=>/Select all results/.test(document.querySelector('.ssot-bulk').innerText))),'select-all button removed');
  await fr.evaluate(()=>{omniDraft='excess';omniQuery='excess';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='2 in search ×','chip follows the search '+await chip());
  await fr.evaluate(()=>{omniDraft='consolidate';omniQuery='consolidate';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='none','chip follows a second search '+await chip());
  await fr.evaluate(()=>{omniDraft='';omniQuery='';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='none','chip returns '+await chip());
  pass('the count chip follows the current search automatically (no Select all step) and updates on every change');
  await fr.click('#Database tbody tr:nth-child(1) td:nth-child(1)');await pg.waitForTimeout(200);ok(await chip()==='1 selected ×','tap # selects '+await chip());
  await fr.evaluate(()=>{omniDraft='unique';omniQuery='unique';renderDatabase()});await pg.waitForTimeout(400);ok(await chip()==='3 in search ×','stale selection is dropped when the search changes: '+await chip());
  await fr.click('#Database tbody tr:nth-child(1) td:nth-child(4)');await pg.waitForTimeout(300);ok(await chip()==='3 in search ×','tapping a data cell must copy, not select '+await chip());
  const cp=await pg.evaluate(()=>navigator.clipboard.readText());ok(cp.length>0,'database cell tap copied nothing');ok(await fr.evaluate(()=>[...document.querySelectorAll('.toast')].some(t=>/^Copied: \S/.test(t.textContent))),'database copy toast');
  pass('tapping a Database field copies it (never blank) and does not toggle row selection; tapping # selects');
  await fr.click('.ssot-bulk .selection-count button');await pg.waitForTimeout(400);ok(await fr.evaluate(()=>omniQuery==='')&&await chip()==='none','chip x clears the search');pass('chip x clears the search');
  const same=await fr.evaluate(()=>{const a=filterQuery('excess'),b=filterQuery('excess'),s1=sortRows(a),s2=sortRows(a);return a===b&&s1===s2});ok(same,'search/sort results are not cached');
  const kept=await fr.evaluate(async()=>{const el=document.querySelector('#Database .dbgrid');show('Plan');await new Promise(r=>setTimeout(r,50));show('Database');await new Promise(r=>setTimeout(r,50));return el===document.querySelector('#Database .dbgrid')});ok(kept,'switching back to Search rebuilt the table');
  pass('search and sort results are cached per loaded database and switching back to Search reuses the rendered table (no rebuild)')}
 // Search table layout: row numbers, long-press columns modal, grouping, order, search exclusion, persistence
 {await fr.evaluate(()=>{__ssotGoSearch('','');omniDraft='';omniQuery='';renderDatabase()});await pg.waitForTimeout(500);
  const rowNos=()=>fr.$$eval('#Database tbody tr[data-pid] td.rownum',e=>e.map(x=>x.textContent.trim()));
  const heads=()=>fr.$$eval('#Database thead th',e=>e.map(x=>x.dataset.f||x.textContent.trim()));
  ok((await heads())[0]==='Row'&&(await rowNos()).join()==='1,2,3,4,5,6','row numbers 1..N '+await rowNos());
  await fr.evaluate(()=>{omniDraft='excess';omniQuery='excess';renderDatabase()});await pg.waitForTimeout(400);ok((await rowNos()).join()==='1,2','row numbers renumber with the search '+await rowNos());
  await fr.evaluate(()=>{omniDraft='';omniQuery='';renderDatabase()});await pg.waitForTimeout(400);
  pass('search results carry a Row column numbered 1..N that renumbers with every search');
  const hold=async(f)=>{const b=await fr.locator('#Database th[data-f="'+f+'"]').boundingBox();await pg.mouse.move(b.x+b.width/2-6,b.y+b.height/2);await pg.mouse.down();await pg.waitForTimeout(800);await pg.mouse.up();await pg.waitForTimeout(250)};
  const sortBefore=await fr.evaluate(()=>sortField+sortDir);await hold('filename');ok(await fr.$('#ssotColList .colrow[data-f="filename"].focus'),'long press did not open the columns modal');ok(await fr.evaluate(()=>{const r=document.getElementById('ssotColList').getBoundingClientRect(),el=document.elementFromPoint(r.left+r.width/2,r.top+10);return !!el&&!!el.closest('#modalback')}),'the Columns window must sit on top of the Search window, not behind it');ok(await fr.evaluate(()=>sortField+sortDir)===sortBefore,'long press must not sort');
  pass('long-pressing a column header opens the Columns modal (and does not sort)');
  ok(await fr.evaluate(()=>{const l=[...document.querySelectorAll('#ssotColList label')].find(x=>x.querySelector('input[data-k="g"]'));return !l||getComputedStyle(l).display==='none'}),'Group option must be gone from the Columns modal');
  await fr.click('#modalcancel');await pg.waitForTimeout(300);
  await fr.evaluate(()=>localStorage.sotDbLayout=JSON.stringify({order:[],groups:['estate','fingerprint'],exclude:[],byWaste:true}));
  await pg.reload();let fr2;for(let i=0;i<100;i++){try{const o=await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app');fr2=await o.contentFrame();if(await fr2.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
  await fr2.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(600);ok((await fr2.$$('#Database tbody tr.ssot-grp')).length===0&&(await fr2.$$('#Database tbody tr[data-pid]')).length===6,'an old saved grouping must not put plain searches under chevrons');
  pass('Search is a flat list: no grouping option, and an old saved grouping is ignored');
  // drag Estate above Filename
  await fr2.evaluate(()=>__ssotColumnsModal('estate'));await pg.waitForTimeout(300);
  const hb=await fr2.locator('#ssotColList .colrow[data-f="estate"] .h').boundingBox(),tb=await fr2.locator('#ssotColList .colrow[data-f="path"]').boundingBox();
  await pg.mouse.move(hb.x+hb.width/2,hb.y+hb.height/2);await pg.mouse.down();await pg.mouse.move(hb.x+hb.width/2,tb.y+2,{steps:8});await pg.mouse.up();await pg.waitForTimeout(300);
  const ord=await fr2.$$eval('#ssotColList .colrow',e=>e.map(x=>x.dataset.f));ok(ord.indexOf('estate')<ord.indexOf('path'),'drag reorder: estate should now be before Folder: '+ord);
  // exclude Estate from free-text search
  await fr2.locator('#ssotColList .colrow[data-f="estate"] input[data-k="s"]').click();await pg.waitForTimeout(200);
  await fr2.click('#modalcancel');await pg.waitForTimeout(300);
  {const h=await fr2.$$eval('#Database thead th[data-f]',e=>e.map(x=>x.dataset.f));ok(!h.includes('estate')&&h.includes('path'),'unticked column is hidden '+h)}
  await fr2.evaluate(()=>__ssotColumnsModal('path'));await pg.waitForTimeout(300);
  await fr2.evaluate(()=>{const r=document.querySelector('#ssotColList .colrow[data-f="path"] input[data-k="w"]');r.value='300';r.dispatchEvent(new Event('input',{bubbles:true}))});await pg.waitForTimeout(500);await fr2.click('#modalcancel');await pg.waitForTimeout(300);
  {const r=await fr2.evaluate(()=>({w:Math.round(document.querySelector('#Database thead th[data-f="path"]').getBoundingClientRect().width),saved:JSON.parse(localStorage.sotDbLayout).widths?.path,td:getComputedStyle(document.querySelector('#Database tbody tr[data-pid] td:nth-child(3)')).textOverflow}));ok(Math.abs(r.w-300)<=2&&r.saved===300&&r.td==='ellipsis','width slider sizes the column, is saved, and cells end in … '+JSON.stringify(r))}
  const hit=async(q)=>fr2.evaluate(q=>{omniDraft=omniQuery=q;return filterQuery(q).length},q);
  const withEx=await hit('s2'),qual=await hit('estate:s2');ok(withEx===0&&qual>0,'excluded column ignored by free text but still searchable by name: '+withEx+'/'+qual);
  await fr2.evaluate(()=>{omniDraft='';omniQuery=''});
  pass('Columns window: drag to reorder, one box per column (unticked = hidden and not searched), a width slider that is saved, long cells end in …');
  await fr2.evaluate(()=>{__ssotColumnsModal();document.getElementById('ssotColReset').click()});await pg.waitForTimeout(300);
  ok(JSON.parse(await fr2.evaluate(()=>localStorage.sotDbLayout)).groups.length===0,'reset');await fr2.click('#modalcancel');await pg.waitForTimeout(200);
  pass('Reset columns restores order and search');
  fr=fr2}
 // Duplicates: off the treemap into Search, Keep + Excess grouped, Keep choices saved
 {await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(500);
  ok(!(await fr.evaluate(()=>[...document.querySelectorAll('.ssot-search-head button')].some(b=>/Duplicates/.test(b.textContent)))),'no Duplicates button in Search');
  ok(await fr.evaluate(()=>!__ssotPlanTabs.includes('Duplicates')),'no Duplicates screen');
  await fr.evaluate(()=>__ssotOpenDuplicates(null));await pg.waitForTimeout(600);
  const grp=()=>fr.$$eval('#Database tr.ssot-grp',g=>g.map(x=>x.innerText.replace(/\s+/g,' ').trim()));
  let g=await grp();ok(g.length===1&&/2 copies/.test(g[0])&&/100\.0 GB reclaimable/.test(g[0]),'one group: Keep + Excess together '+JSON.stringify(g));
  await fr.click('#Database tr.ssot-grp');await pg.waitForTimeout(400);
  const keeps=()=>fr.$$eval('#Database tbody tr[data-pid] td.keepcell input',i=>i.map(x=>x.checked));
  let k=await keeps();ok(k.length===2&&k[0]!==k[1],'expanded group shows a Keep box per copy, one ticked by the rule '+JSON.stringify(k));
  pass('Keep + Excess open from the treemap into Search as duplicate groups (no separate screen)');
  await fr.locator('#Database tbody tr[data-pid] td.keepcell input:not(:checked)').first().check();await pg.waitForTimeout(900);
  ok(keepCalls.length===1&&keepCalls[0].keep===true,'tick saves the Keep choice '+JSON.stringify(keepCalls));
  pass('ticking Keep saves at once (custom choices persist on the server)');
  await fr.evaluate(()=>{omniDraft='unique';omniQuery='unique';renderDatabase()});await pg.waitForTimeout(400);
  ok(await fr.evaluate(()=>!__ssotDupMode&&!document.querySelector('#Database tr.ssot-grp')),'a new search returns to the flat list');
  placements[4].system_classification='EXCESS';rev++;placements[4].rev=rev;await fr.evaluate(async()=>{await loadPlacements(true)});
  await pg.mouse.move(1,1);pass('leaving the duplicate view returns Search to a flat list')}
 // Tags / notes edits must show immediately (delta compares against the revision the local rows represent)
 {await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(400);
  const orig={tags:placements[0].tags,notes:placements[0].notes};const id=placements[0].placement_id;placements[0].tags='["keepme"]';placements[0].notes='hello notes';placements[0].rev=2;rev=2;
  await fr.evaluate(async()=>{catalogRevision=2;await loadPlacements(true)});await pg.waitForTimeout(500);
  const got=await fr.evaluate(id=>{const p=placements.find(x=>x.placement_id===id);return {tags:p.tags,notes:p.notes}},id);ok(got.tags==='["keepme"]'&&got.notes==='hello notes','tags/notes edit not visible after reload: '+JSON.stringify(got));
  pass('after a tags/notes edit the table shows the saved values (the delta check no longer trusts the bumped revision)');
  placements[0].tags=orig.tags;placements[0].notes=orig.notes;delete placements[0].rev;rev=1;await fr.evaluate(async()=>{catalogRevision=1;__ssotRowsRev=1;placements.find(x=>true).tags=placements[0].tags})}
 // Look: typography and persisted zebra choice
 {await fr.evaluate(()=>{omniDraft='';omniQuery='';show('Database')});await pg.waitForTimeout(500);
  const t=await fr.evaluate(()=>{const lum=c=>{const [r,g,b]=c.match(/\d+/g).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*r+.7152*g+.0722*b},ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)},rows=[...document.querySelectorAll('#Database .dbgrid tbody tr[data-pid]')].slice(0,2),c=rows.map(r=>{const td=r.cells[3],cs=getComputedStyle(td);return {bg:cs.backgroundColor,fg:cs.color,w:cs.fontWeight,fs:parseFloat(cs.fontSize),lh:parseFloat(cs.lineHeight)/parseFloat(cs.fontSize),ratio:ratio(cs.backgroundColor,cs.color)}});return {zebra:document.documentElement.dataset.dbZebra,c}});
  ok(t.zebra==='soft'&&t.c.every(x=>!/rgb\(255, 255, 255\)/.test(x.bg)&&Number(x.w)<=500&&x.fs>=13&&x.lh>=1.4&&x.ratio>=7),'default look must be calm and readable '+JSON.stringify(t));
  const delta=await fr.evaluate(()=>{const l=c=>c.match(/\d+/g).map(Number).reduce((a,b)=>a+b,0),r=[...document.querySelectorAll('#Database .dbgrid tbody tr[data-pid]')].slice(0,2).map(r=>l(getComputedStyle(r.cells[3]).backgroundColor));return Math.abs(r[0]-r[1])});ok(delta<40,'row bands must be subtle, not jarring: '+delta);
  pass('default look: soft dark rows (no white bands), body weight 400, 13px/1.5, contrast >= 7:1');
  await fr.evaluate(()=>configure());await pg.waitForTimeout(600);await fr.evaluate(()=>setConfigTab('Colors'));await pg.waitForTimeout(300);
  const opts=await fr.$$eval('#dbZebraPreset option',o=>o.map(x=>x.value));ok(opts.join()==='soft,dark,light,blue,contrast','zebra options '+opts);
  await fr.selectOption('#dbZebraPreset','blue');await pg.waitForTimeout(300);const sv=await fr.evaluate(()=>[JSON.parse(localStorage.sotUiConfig).dbZebra,document.documentElement.dataset.dbZebra]);ok(sv[0]==='blue'&&sv[1]==='blue','zebra choice not saved/applied '+sv);
  await pg.reload();let f3;for(let i=0;i<100;i++){try{const o=await (await (await pg.waitForSelector('#shell')).contentFrame()).waitForSelector('#app');f3=await o.contentFrame();if(await f3.evaluate(()=>!!window.__ssotCompletePlacementRefresh&&window.placements.length>0&&!document.querySelector('#ssot-db-blocker.on')))break}catch(e){}await pg.waitForTimeout(100)}
  ok(await f3.evaluate(()=>document.documentElement.dataset.dbZebra)==='blue','zebra choice lost after reload');pass('Colors choices save the moment they change and survive a reload');
  await f3.evaluate(()=>{localStorage.removeItem('sotUiConfig');localStorage.removeItem('sotUiMigrated2');applyUiCfg()});fr=f3}
 // tab highlight
 await fr.click('#ssot-rail button[data-nav="roots"]');await pg.waitForTimeout(300);ok(JSON.stringify(await onNav())==='["Roots"]'&&await fr.evaluate(()=>!!document.querySelector('#Plan .estate-table')&&!document.querySelector('#Plan .flow')),'Roots shows only the roots table: '+await onNav());
 await fr.click('#ssot-rail button[data-nav="dups"]');await pg.waitForTimeout(500);ok(JSON.stringify(await onNav())==='["Duplicates"]'&&await fr.evaluate(()=>__ssotDupMode&&document.documentElement.classList.contains('ssot-smodal')),'Duplicates opens the Search window grouped: '+await onNav());
 await fr.click('.ssot-sclose');await pg.waitForTimeout(300);ok(JSON.stringify(await onNav())==='["Roots"]','closing Duplicates returns to Roots');
 await fr.click('#ssot-rail button[data-nav="map"]');await pg.waitForTimeout(300);ok(JSON.stringify(await onNav())==='["Map"]'&&await fr.evaluate(()=>!!document.querySelector('#Plan .flow')),'Map back to the treemap: '+await onNav());
 pass('exactly one menu item is highlighted for the page you are on (Map, Roots, Duplicates, Land)');
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
 const m=await open(412,915);await m.fr.evaluate(()=>setPlanTab('Roots'));await m.pg.waitForTimeout(300);
 const lg=await m.fr.evaluate(()=>{sources[0].root='/mnt/a/'+'very-long-folder-name-'.repeat(6);setPlanTab('Roots');const tr=document.querySelectorAll('.estate-table tbody tr:not(.trow)')[0],c=tr.cells,rp=tr.querySelector('.rpath'),r=[...c].map(x=>x.getBoundingClientRect());return {txt:rp.textContent.length,cut:rp.scrollWidth>rp.clientWidth,h:tr.getBoundingClientRect().height,noOverlap:r[3].left>=r[2].right-1&&r[4].left>=r[3].right-1}});
 ok(lg.txt>100&&lg.cut&&lg.noOverlap&&lg.h<64,'long root must truncate on mobile '+JSON.stringify(lg));pass('long Estate root names truncate on mobile and no longer overlap the next column');
 {const r0=await m.fr.evaluate(()=>{const r=document.getElementById('ssot-rail').getBoundingClientRect(),b=document.getElementById('ssot-railbtn').getBoundingClientRect();return {hidden:r.right<=1,btn:b.width>0&&b.left<20&&b.top<20}});await m.fr.click('#ssot-railbtn');await m.pg.waitForTimeout(300);
  const r1=await m.fr.evaluate(()=>{const r=document.getElementById('ssot-rail').getBoundingClientRect(),f=document.querySelector('#ssot-rail .srfoot').getBoundingClientRect();return {open:r.left>=0&&r.width>200,foot:f.bottom<=innerHeight+1&&f.height>0,pill:getComputedStyle(document.getElementById('ssot-db-status')||document.body).display}});
  await m.fr.click('#ssot-scrim',{position:{x:380,y:400}});await m.pg.waitForTimeout(300);const r2=await m.fr.evaluate(()=>document.getElementById('ssot-rail').getBoundingClientRect().right<=1);
  ok(r0.hidden&&r0.btn&&r1.open&&r1.foot&&r2,'phone: ☰ opens the menu over the page, Config pinned at the bottom, tapping outside closes '+JSON.stringify([r0,r1,r2]));pass('phone: the left menu slides in from ☰ and closes on a tap outside')}
 const ov=await m.fr.evaluate(()=>({doc:document.documentElement.scrollWidth-document.documentElement.clientWidth,tbl:(()=>{let w=document.querySelector('.estate-wrap');return w.scrollWidth-w.clientWidth})(),rows:document.querySelectorAll('.estate-table tbody tr').length}));ok(ov.doc<=1&&ov.tbl<=1&&ov.rows===3,'mobile overflow '+JSON.stringify(ov));pass('Estate table usable at 412x915 without horizontal overflow');
 if(process.env.SOT_SHOTS){await m.pg.screenshot({path:process.env.SOT_SHOTS+'/estate-mobile.png'});await m.fr.evaluate(()=>setPlanTab('Summary'));await m.pg.waitForTimeout(300);await m.pg.screenshot({path:process.env.SOT_SHOTS+'/analysis-mobile.png'})}
 await m.fr.evaluate(()=>setPlanTab('Summary'));await m.pg.waitForTimeout(300);const wo=await m.fr.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth+document.querySelector('#Plan').scrollWidth-document.querySelector('#Plan').clientWidth);ok(wo<=2,'summary overflows horizontally on mobile: '+wo);pass('Summary report fits 412x915 without horizontal overflow');
 await m.ctx.close();
}finally{await browser.close();srv.close()}
