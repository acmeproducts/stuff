// Usage viewer (chat-usage.html): owner sign-in, numbers, safe display of room names, CSV. Server answers are stood in.
// Run: NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/usage-log/viewer.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const html=fs.readFileSync(path.join(__dirname,'../../chat-usage.html'),'utf8');
const PAGE='https://acmeproducts.github.io/stuff/chat-usage.html',RUNNER='https://chatlink-runner.myacctfortracking.workers.dev';
let pass=0,fail=0;async function check(n,f){try{await f();pass++;console.log('PASS',n)}catch(e){fail++;console.log('FAIL',n,'\n   ',String(e&&e.message||e).split('\n')[0])}}
const NOW=Date.now(),ev=(o)=>Object.assign({t:NOW-3600e3,who:'owner',dev:'a1',kind:'message',room:'Market',pair:'en>th',side:'south',mode:'typed',trOk:true},o);
const EVENTS=[ev({}),ev({mode:'spoken',stt:'deepgram'}),ev({pair:'en>vi',room:'<img src=x onerror="window.pwned=1">',trOk:false}),ev({kind:'opened',who:'Sam',room:undefined,pair:undefined,mode:undefined,trOk:undefined,side:undefined}),ev({kind:'session'}),ev({kind:'room',room:'Market'})];
const TOTALS=[{day:'2026-10-25',n:{message:3,room:1},pairs:{'en>th':2},spoken:1,typed:2,failed:1}];
(async()=>{
 const browser=await chromium.launch({channel:process.env.CHAT_BROWSER_CHANNEL||undefined});
 async function open(opts){opts=opts||{};const c=await browser.newContext();const p=await c.newPage();const calls=[];
  await p.route('**/*',async r=>{const u=r.request().url();
   if(u.startsWith(PAGE))return r.fulfill({status:200,contentType:'text/html',body:html});
   if(u.startsWith(RUNNER+'/admin/usage')){calls.push({url:u,auth:r.request().headers().authorization});
    if(opts.status===403)return r.fulfill({status:403,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"ok":false,"error":"no access"}'});
    return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({ok:true,events:EVENTS,totals:TOTALS,keepDays:90})})}
   return r.abort()});
  if(opts.token)await p.addInitScript(t=>localStorage.setItem('cl_owner_pat',t),opts.token);
  if(opts.old)await p.addInitScript(t=>localStorage.setItem('duck_gh_pat',t),opts.old);
  await p.goto(PAGE);return{c,p,calls}}
 await check('with no token it asks for one and shows no data',async()=>{const{c,p,calls}=await open();await p.waitForSelector('#auth:not([hidden])');assert.equal(await p.locator('#app').isHidden(),true);assert.equal(calls.length,0);await c.close()});
 await check('the token already saved for the device log is reused (nothing pasted twice)',async()=>{const{c,p,calls}=await open({old:'ghp_old'});await p.waitForSelector('#app:not([hidden])');assert.equal(calls[0].auth,'Bearer ghp_old');await c.close()});
 await check('numbers: messages, spoken share, failures, rooms, opens, guest links',async()=>{const{c,p}=await open({token:'ghp_x'});await p.waitForSelector('#tiles .tile');const t=(await p.locator('#tiles').innerText()).replace(/\s+/g,' ');
  assert.match(t,/Messages 3/);assert.match(t,/Spoken 33%/);assert.match(t,/Translation failed 1/);assert.match(t,/Guest links opened 1/);assert.match(t,/App opens 1/);await c.close()});
 await check('language pairs and people tables show the data',async()=>{const{c,p}=await open({token:'ghp_x'});await p.waitForSelector('#pairs table');assert.match(await p.locator('#pairs').innerText(),/en → th/);assert.match(await p.locator('#people').innerText(),/Sam/);await c.close()});
 await check('a room name with markup is shown as text and never runs',async()=>{const{c,p}=await open({token:'ghp_x'});await p.waitForSelector('#rooms table');assert.match(await p.locator('#rooms').innerText(),/<img src=x/);assert.equal(await p.evaluate(()=>window.pwned),undefined);await c.close()});
 await check('a refused token goes back to sign-in and forgets the bad token',async()=>{const{c,p}=await open({token:'ghp_bad',status:403});await p.waitForSelector('#auth:not([hidden])');assert.equal(await p.evaluate(()=>localStorage.getItem('cl_owner_pat')),'');await c.close()});
 await check('CSV has the rows and never any message text',async()=>{const{c,p}=await open({token:'ghp_x'});await p.waitForSelector('#tiles .tile');const[d]=await Promise.all([p.waitForEvent('download'),p.locator('#csv').click()]);const txt=fs.readFileSync(await d.path(),'utf8');
  assert.match(txt.split('\n')[0],/^t,who,dev,kind,room,pair,side,mode,trOk,stt,build$/);assert.equal(txt.trim().split('\n').length,1+EVENTS.length);assert.match(txt,/"<img src=x onerror=""window.pwned=1"">"/);await c.close()});
 await browser.close();console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
})();
