const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'sot-turn02-release-d-complete.html'),'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
assert(html.includes('w.__ssotReportMetrics=function'), 'Complete must own the Report/Estate implementation');
assert(html.includes("['Analysis','Capacity','Operations','Estate']"));
assert(html.includes('Job Status'));
assert(!html.includes("shell.src='./sot-turn02-release-d-report-estate.html'"));
console.log('PASS Complete owns Report/Estate and Job Status without another iframe layer');
const http=require('node:http');
const {chromium}=require('playwright');
const GB=1073741824;
const placements=[['UNIQUE',100,'a'],['KEEP',200,'b'],['EXCESS',200,'b'],['UNIQUE',400,'c']].map(([cls,size,fp],i)=>({placement_id:'p'+i,placement_no:i+1,filename:'file'+i+'.txt',normalized_path:'/estate/file'+i+'.txt',folder:'/estate',extension:'.txt',fingerprint:fp,size:size*GB,system_classification:cls,availability:'ONLINE',placement_state:'ACTIVE',owner_tags:[]}));
let target={configured:true,free_bytes:600*GB,registered_free_bytes:900*GB},scheduler={paused:false},sources=[{source_id:'a',root:'/estate/A',label:'A',enabled:1,analysis_state:'CURRENT',pending:false,last_success_files:2,last_success_bytes:300*GB,last_success_ended:1700000000},{source_id:'b',root:'/estate/B',label:'B',enabled:1,analysis_state:'CURRENT',pending:false,last_success_files:1,last_success_bytes:400*GB,last_success_ended:1700000001},{source_id:'deleted',root:'/deleted',soft_deleted:true,last_success_bytes:900*GB}];
const jobs=[{job:{job_id:'job-1',title:'Automatic SSOT sync',state:'RUNNING',created:1700000010},scope_sources:[{source_id:'a',root:'/estate/A'}],sources:[{source_id:'a',hashed_files:1,discovered_files:2}]}];
const server=http.createServer((req,res)=>{let url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){let data={ok:true};if(url.pathname==='/api/health')Object.assign(data,{version:'turn02-release-d',schema:14,db:{state:'healthy'},catalog_revision:1,creation_revision:0});if(url.pathname==='/api/placements/page')Object.assign(data,{placements,catalog_revision:1,total:placements.length,has_more:false});if(url.pathname==='/api/placements')data.placements=placements;if(url.pathname==='/api/jobs')Object.assign(data,{jobs,scheduler});if(url.pathname==='/api/sources')data.sources=sources;if(url.pathname==='/api/events')data.events=[];if(url.pathname==='/api/target')data.target=target;if(url.pathname==='/api/volumes')data.volumes=[];if(url.pathname==='/api/ai/tasks')Object.assign(data,{tasks:[],task_types:{}});if(url.pathname==='/api/diagnostics/log')Object.assign(data,{lines:['test log'],publish:{configured:false}});if(url.pathname==='/api/scheduler/control'){scheduler={paused:!scheduler.paused};Object.assign(data,{jobs,scheduler})}res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(data))}let file=path.join(__dirname,path.basename(url.pathname));if(!fs.existsSync(file)){res.statusCode=404;return res.end()}res.setHeader('Content-Type','text/html');res.end(fs.readFileSync(file))});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 let launch={headless:true};if(process.env.SOT_CHROMIUM_PATH)launch.executablePath=process.env.SOT_CHROMIUM_PATH;
 if(process.env.SOT_CHROMIUM_PACKAGE){const binary=(await import(process.env.SOT_CHROMIUM_PACKAGE)).default;launch={headless:true,executablePath:await binary.executablePath(),args:binary.args}}
 const browser=await chromium.launch(launch);
 try{for(const viewport of [{width:1280,height:900},{width:412,height:915}]){
  target={configured:true,free_bytes:600*GB,registered_free_bytes:900*GB};scheduler={paused:false};
  const context=await browser.newContext({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.fulfill({body:'',contentType:'application/javascript'}));
  await page.goto(origin+'/sot-turn02-release-d-complete.html?api='+encodeURIComponent(origin));
  const frame=page.frameLocator('#shell').frameLocator('#app');await frame.locator('#Plan .ssot-report-summary').waitFor();await frame.locator('#ssot-db-blocker').waitFor({state:'hidden'});
  const app=page.frames().find(f=>f.url().includes('/sot-turn02-release-d.html?'));assert(app);
  assert.deepEqual(await app.evaluate(()=>{let m=__ssotReportMetrics();return [m.scanned,m.estate,m.excess,m.target,m.deficit,m.open]}),[900*GB,700*GB,200*GB,600*GB,100*GB,0]);
  assert.match(await frame.locator('#Plan').innerText(),/100\.0 GB must be removed/);
  await frame.locator('#Plan .subtabs button').filter({hasText:/^Estate$/}).click();assert.equal(await frame.locator('.ssot-estate-table tbody tr').count(),2);assert.equal(await frame.locator('.ssot-over-capacity').getAttribute('data-source-id'),'b');
  await frame.locator('.ssot-estate-table th button').filter({hasText:/^Size$/}).click();await frame.locator('.ssot-estate-table th button').filter({hasText:/^Size$/}).click();assert.equal(await frame.locator('.ssot-estate-table tbody tr').first().getAttribute('data-source-id'),'b');assert.equal(await frame.locator('.ssot-over-capacity').getAttribute('data-source-id'),'a');
  await app.evaluate(()=>dataPoll());assert.equal(await frame.locator('.ssot-estate-table tbody tr').first().getAttribute('data-source-id'),'b');
  if(process.env.SOT_SCREENSHOT_DIR){fs.mkdirSync(process.env.SOT_SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.SOT_SCREENSHOT_DIR,'estate-'+viewport.width+'.png')})}
  assert.deepEqual(await frame.locator('.ssot-over-capacity td').first().evaluate(e=>[getComputedStyle(e).backgroundColor,getComputedStyle(e).color]),['rgb(139, 31, 36)','rgb(255, 255, 255)']);
  target.free_bytes=800*GB;await app.evaluate(()=>dataPoll());assert.equal(await app.evaluate(()=>__ssotReportMetrics().open),100*GB);assert.equal(await frame.locator('.ssot-over-capacity').count(),0);
  target.configured=false;await app.evaluate(()=>dataPoll());assert.equal(await frame.locator('.ssot-over-capacity').count(),0);assert.match(await frame.locator('#Plan').innerText(),/Not configured/);target.configured=true;
  target.free_bytes=0;await app.evaluate(()=>dataPoll());assert.equal(await app.evaluate(()=>__ssotReportMetrics().target),0);assert.equal(await frame.locator('.ssot-over-capacity').count(),2);target.free_bytes=600*GB;
  await frame.locator('#Plan .ssot-report-switch button').filter({hasText:'Job Status'}).click();assert.equal(await frame.locator('.ssot-job-table tbody tr').count(),1);assert.match(await frame.locator('#Analyze').innerText(),/RUNNING/);assert.match(await frame.locator('#Analyze').innerText(),/1 \/ 2/);assert.equal(await frame.locator('#Analyze .sourcecard').count(),0);
  await app.evaluate(()=>dataPoll());await frame.locator('.ssot-job-toolbar button').click();await frame.locator('.ssot-job-toolbar button').filter({hasText:'Resume'}).waitFor();await frame.locator('.ssot-job-toolbar button').click();await frame.locator('.ssot-job-toolbar button').filter({hasText:'Pause'}).waitFor();
  await frame.locator('#Analyze .ssot-report-switch button').filter({hasText:/^Report$/}).click();await frame.locator('#Plan .subtabs button').filter({hasText:/^Analysis$/}).click();await frame.locator('#Plan .plantable tbody tr').filter({hasText:/ESTATE/}).click();await frame.locator('#Database').waitFor({state:'visible'});assert.equal(await app.evaluate(()=>filterQuery(omniQuery).length),3);
  await frame.locator('#tabs [data-tab="Plan"]').click();await frame.locator('#Plan .subtabs button').filter({hasText:'Capacity'}).click();assert.match(await frame.locator('#Plan').innerText(),/BASIC CAPACITY CHECK/);await app.evaluate(()=>dataPoll());assert.match(await frame.locator('#Plan').innerText(),/BASIC CAPACITY CHECK/);
  await frame.locator('#Plan .subtabs button').filter({hasText:'Operations'}).click();assert.match(await frame.locator('#Plan').innerText(),/OPERATIONS STATUS/);
  await frame.locator('#tabs [data-tab="Estate"]').click();assert.equal(await frame.locator('#Estate .subtabs button').filter({hasText:'Catalog'}).isVisible(),false);
  await frame.locator('#tabs [data-tab="Database"]').click();for(const label of ['Tag','Notes','Delete','Folder'])assert(await frame.locator('.ssot-bulk button').filter({hasText:new RegExp('^'+label+'$')}).isVisible());await frame.locator('.ssot-search-views button').filter({hasText:'Grid'}).click();assert(await frame.locator('#Grid').isVisible());
  assert.deepEqual(errors,[]);console.log('PASS '+viewport.width+'px: capacity arithmetic, zero free space, Estate sorting/cutoff/status, polling, Job Status/pause, Report→Search, Capacity/Operations and protected navigation');await context.close();
 }}finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
