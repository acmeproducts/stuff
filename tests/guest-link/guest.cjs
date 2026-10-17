// Guest links end to end: the real chat-test.html talking to the real chatlink runner logic (Worker + Vault), network stood in.
// Run: NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/guest-link/guest.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.join(__dirname,'../..');
const APP='https://acmeproducts.github.io/stuff/chat-test.html',RUNNER='https://chatlink-runner.myacctfortracking.workers.dev';
const DG='deepgram_test_key_0123456789abcdef0123456789',OWNER_TOKEN='ghp_owner_token';
let pass=0,fail=0;
async function check(name,fn){try{await fn();pass++;console.log('PASS',name)}catch(e){fail++;console.log('FAIL',name,'\n   ',String(e&&e.message||e).split('\n')[0])}}
(async()=>{
 const {default:worker,Vault}=await import('file://'+path.join(root,'chatlink/runner/worker.js'));
 globalThis.fetch=async(url,opts={})=>{url=String(url);
  if(/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url))return new Response(JSON.stringify({permissions:{push:opts.headers.Authorization==='Bearer '+OWNER_TOKEN}}),{status:200});
  return new Response('?',{status:500})};
 const mem=new Map();let vault=null;
 const env={ALLOWED_OWNER:'acmeproducts',VAULT:{idFromName:n=>n,get:()=>{if(!vault)vault=new Vault({storage:{get:async k=>mem.get(k),put:async(k,v)=>{mem.set(k,JSON.parse(JSON.stringify(v)))}}},env);return{fetch:(u,o)=>vault.fetch(new Request(u,o))}}}};
 const html=fs.readFileSync(process.env.CHAT_HTML||path.join(root,'chat-test.html'),'utf8');
 const browser=await chromium.launch({channel:process.env.CHAT_BROWSER_CHANNEL||undefined});
 const redeems=[];
 async function newCtx(opts,hooks){hooks=hooks||{};const c=await browser.newContext(opts||{});
  await c.route('**/*',async route=>{const rq=route.request(),url=rq.url();
   if(url.startsWith(APP))return route.fulfill({status:200,contentType:'text/html',body:html});
   if(url.startsWith(RUNNER)){
    if(url.endsWith('/confirm')&&hooks.holdConfirm){hooks.seenConfirm&&hooks.seenConfirm();await hooks.holdConfirm}
    const req=new Request(url,{method:rq.method(),headers:rq.headers(),body:['GET','HEAD'].includes(rq.method())?undefined:rq.postData()});
    if(url.endsWith('/redeem'))redeems.push(1);
    const r=await worker.fetch(req,env);const h={};r.headers.forEach((v,k)=>h[k]=v);
    return route.fulfill({status:r.status,headers:h,body:await r.text()})}
   return route.abort()});
  return c}
 const node=async(path_,method,body,token)=>{const r=await worker.fetch(new Request(RUNNER+path_,{method:method||'GET',headers:{Origin:'https://acmeproducts.github.io','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined}),env);return{status:r.status,body:await r.json()}};
 const ownerList=async()=>(await node('/admin/invites?owner=acmeproducts&repo=stuff','GET',null,OWNER_TOKEN)).body.invites;
 const ls=(p,k)=>p.evaluate(k=>localStorage.getItem(k),k);
 const openRail=async p=>{if((await p.locator('#cl-menu').getAttribute('aria-expanded'))!=='true')await p.locator('#cl-menu').click();await p.waitForSelector('body.cl-open',{state:'attached'})};
 const gateText=p=>p.locator('#cl-guestgate').innerText();
 const openGuest=async(link,opts)=>{const c=await newCtx(opts);const p=await c.newPage();await p.goto(link);await p.waitForSelector('#cl-guestgate.show',{timeout:8000});return{c,p}};
 // owner device: make a link through the Share tab
 const oc=await newCtx();const op=await oc.newPage();op.on('dialog',d=>d.accept());
 await op.addInitScript(k=>{if(!localStorage.getItem('tb_dg_key'))localStorage.setItem('tb_dg_key',k)},DG);
 await op.goto(APP);await op.waitForSelector('#cl-menu',{state:'attached'});
 async function shareTab(){await openRail(op);await op.locator('#cl-settings').click();await op.locator('.cl-tab',{hasText:'Share'}).click();await op.getByLabel(/GitHub token/).waitFor()}
 async function makeLink(name){await op.getByLabel(/GitHub token/).fill(OWNER_TOKEN);await op.getByLabel('Their name').fill(name);await op.getByRole('button',{name:'Create link'}).click();
  await op.locator('.cl-guest-link').waitFor({state:'visible'});await op.waitForFunction(n=>[...document.querySelectorAll('.cl-guest-row')].some(r=>r.textContent.includes(n)),name);return op.locator('.cl-guest-link').inputValue()}
 await shareTab();
 let link;
 await check('owner makes a link in Settings → Share; the list shows the guest as not opened',async()=>{link=await makeLink('Sam');assert.match(link,/[?&]invite=[a-z0-9]{40}/);assert.match(await op.locator('.cl-guest-row').first().innerText(),/Sam · not opened yet/)});
 await check('the key the owner holds was stored for guests, and only that',async()=>{assert.equal([...mem.get('vault').keys.deepgram].length>20,true);assert.equal(mem.get('vault').keys.deepgram,DG)});

 let g;
 await check('opening the link shows a welcome and does NOT use the link up',async()=>{g=await openGuest(link);assert.match(await gateText(g.p),/Welcome, Sam/);assert.equal(redeems.length,0);assert.equal((await ownerList()).find(i=>i.name==='Sam').state,'unopened');assert.equal(await ls(g.p,'tb_dg_key'),null)});
 await check('a page load repeated many times (like a chat-app preview) still leaves the link unused',async()=>{for(let n=0;n<3;n++){await g.p.reload();await g.p.waitForSelector('#cl-guestgate.show')}assert.equal((await ownerList()).find(i=>i.name==='Sam').state,'unopened')});
 await check('Start sets the phone up: key saved, guest flag set, link stripped from the address, welcome closed',async()=>{
  await g.p.getByRole('button',{name:'Start'}).click();await g.p.waitForSelector('#cl-guestgate:not(.show)',{state:'attached',timeout:8000});
  assert.equal(await ls(g.p,'tb_dg_key'),DG);assert.ok(JSON.parse(await ls(g.p,'cl_guest')).name==='Sam');assert.ok(!/invite=/.test(g.p.url()),g.p.url())});
 await check('the guest has no settings gear and the rail opens with conversations only',async()=>{
  assert.equal(await g.p.locator('#cl-settings').isVisible(),false);await openRail(g.p);
  assert.equal(await g.p.locator('#cl-settings').isVisible(),false);assert.equal(await g.p.getByText('Share',{exact:true}).count(),0);assert.equal(await g.p.getByLabel(/GitHub token/).count(),0)});
 await check('guest mode survives a reload and the AI review says it is not available (no pointer to a settings screen)',async()=>{
  await g.p.reload();await g.p.waitForSelector('#cl-menu',{state:'attached'});assert.equal(await g.p.evaluate(()=>window.clIsGuest()),true);assert.equal(await g.p.locator('#cl-settings').isVisible(),false)});
 await check('opening the used-up link again on the same phone does nothing and strips it',async()=>{await g.p.goto(link);await g.p.waitForSelector('#cl-menu',{state:'attached'});assert.equal(await g.p.locator('#cl-guestgate.show').count(),0);assert.ok(!/invite=/.test(g.p.url()))});
 await check('the owner list now shows the guest as opened, with a time',async()=>{await op.getByRole('button',{name:'Update shared key'}).click();const l=(await ownerList()).find(i=>i.name==='Sam');assert.equal(l.state,'opened');assert.ok(l.openedAt>0)});
 await check('the same link on another phone delivers nothing',async()=>{const g2=await openGuest(link);const t=await gateText(g2.p);assert.match(t,/already been used/);assert.equal(await g2.p.getByRole('button',{name:'Start'}).count(),0);assert.equal(await ls(g2.p,'tb_dg_key'),null);await g2.c.close()});
 await check('a guest device cannot make links',async()=>{const r=await g.p.evaluate(async RUNNER=>{const x=await fetch(RUNNER+'/admin/invite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cfg:{owner:'acmeproducts',repo:'stuff',pat:''},name:'Eve'})});return x.status},RUNNER);assert.equal(r,403)});
 await g.c.close();

 await check('a link opened inside another app asks for Chrome first and uses nothing up',async()=>{
  const l2=await makeLink('Kim');const g3=await openGuest(l2,{userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Line/13.0'});
  assert.match(await gateText(g3.p),/Open in Chrome/);assert.equal((await ownerList()).find(i=>i.name==='Kim').state,'unopened');assert.equal(await ls(g3.p,'tb_dg_key'),null);await g3.c.close()});
 await check('the owner opening a guest link on their own phone is warned and nothing changes on Cancel',async()=>{
  const l3=await makeLink('Pat');const o2=await newCtx();const p2=await o2.newPage();await p2.addInitScript(k=>localStorage.setItem('tb_dg_key',k),'OWNERS_OWN_KEY_0123456789abcdef');await p2.goto(l3);await p2.waitForSelector('#cl-guestgate.show');
  assert.match(await gateText(p2),/already set up/);await p2.getByRole('button',{name:'Cancel'}).click();await p2.waitForSelector('#cl-guestgate:not(.show)',{state:'attached'});
  assert.equal(await ls(p2,'tb_dg_key'),'OWNERS_OWN_KEY_0123456789abcdef');assert.equal(await ls(p2,'cl_guest'),null);assert.equal((await ownerList()).find(i=>i.name==='Pat').state,'unopened');await o2.close();
  // stop it from the owner's list and prove the guest cannot use it
  await op.reload();await op.waitForSelector('#cl-menu',{state:'attached'});await shareTab();await op.getByLabel(/GitHub token/).fill(OWNER_TOKEN);
  const row=op.locator('.cl-guest-row',{hasText:'Pat'});await row.getByRole('button',{name:'Stop'}).click();await op.waitForFunction(()=>[...document.querySelectorAll('.cl-guest-row')].some(r=>/Pat · stopped/.test(r.textContent)));
  const g4=await openGuest(l3);assert.match(await gateText(g4.p),/no longer valid|already been used/);assert.equal(await g4.p.getByRole('button',{name:'Start'}).count(),0);await g4.c.close()});
 await check('if the phone cannot save the setup, the link is NOT used up and the guest can try again',async()=>{
  const l4=await makeLink('Lee');const g5=await openGuest(l4,{});await g5.p.evaluate(()=>{const o=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='tb_dg_key')throw new Error('blocked');return o.call(this,k,v)}});
  await g5.p.getByRole('button',{name:'Start'}).click();await g5.p.waitForFunction(()=>/would not save/.test(document.getElementById('cl-guestgate').innerText));
  assert.notEqual((await ownerList()).find(i=>i.name==='Lee').state,'opened');assert.equal(await ls(g5.p,'cl_guest'),null);await g5.c.close()});
 await check('if the link was opened somewhere else first, this phone is told and keeps no key',async()=>{
  const l5=await makeLink('Max');let release;const hold=new Promise(r=>release=r);let seen;const seenP=new Promise(r=>seen=r);
  const gx=await newCtx({}, {holdConfirm:hold,seenConfirm:seen});const px=await gx.newPage();await px.goto(l5);await px.waitForSelector('#cl-guestgate.show');await px.getByRole('button',{name:'Start'}).click();await seenP;
  const gy=await openGuest(l5);await gy.p.getByRole('button',{name:'Start'}).click();await gy.p.waitForSelector('#cl-guestgate:not(.show)',{state:'attached',timeout:8000});assert.equal(await ls(gy.p,'tb_dg_key'),DG);
  release();await px.waitForFunction(()=>/opened somewhere else|Cannot use this link/.test(document.getElementById('cl-guestgate').innerText),null,{timeout:8000});
  assert.equal(await ls(px,'tb_dg_key'),null);assert.equal(await ls(px,'cl_guest'),null);await gx.close();await gy.c.close()});
 await browser.close();
 console.log(pass+' passed, '+fail+' failed');process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
