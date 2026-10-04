import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const BASE='http://127.0.0.1:8123/market-navigator-turn28-post-ship.html';
const CAND='http://127.0.0.1:8123/market-navigator-turn37-stage2-shadow.html';
const V=[{name:'owner',width:1887,height:800},{name:'desktop',width:1440,height:900},{name:'tablet',width:800,height:1280},{name:'phone',width:412,height:915}];
const browser=await chromium.launch({headless:true});
async function setup(url,vp){
 const c=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1}),p=await c.newPage(),errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:"window.marked={parse:s=>s}"}));
 await p.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
 await p.goto(url,{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__mnShip25?.ready?.());
 return{c,p,errs}
}
async function fingerprint(p){
 return p.evaluate(()=>{
  const box=s=>{let e=document.querySelector(s);if(!e)return null;let r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height].map(x=>Math.round(x*100)/100)};
  const html=s=>document.querySelector(s)?.outerHTML||null;
  return{chart:html('.chartCard'),boxes:{card:box('.chartCard'),crumb:box('#nowCrumb'),hz:box('#hzs'),legend:box('#legend'),wrap:box('#nowWrap'),footer:box('#nowMeta')},state:window.__mnShip25.nowState()}
 })
}
function normalizeSeries(a){return(a||[]).map(z=>({id:z.id,axis:z.axis??0,points:(z.points||z.a||[]).map(p=>({t:+p.t,v:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:null,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,sourceT:+(p.sourceT||p.t)}))}))}
function closeEnough(a,b,msg){
 assert.equal(a.length,b.length,msg+' series count');
 for(let i=0;i<a.length;i++){assert.equal(a[i].id,b[i].id,msg+' id '+i);assert.equal(a[i].axis,b[i].axis,msg+' axis '+a[i].id);assert.equal(a[i].points.length,b[i].points.length,msg+' points '+a[i].id);
  for(let k=0;k<a[i].points.length;k++){let x=a[i].points[k],y=b[i].points[k];for(const key of ['t','v','raw','sourceT'])assert(Math.abs((x[key]??0)-(y[key]??0))<1e-9,msg+' '+a[i].id+' '+key+' '+k);if(x.idx!==null||y.idx!==null)assert(Math.abs((x.idx??0)-(y.idx??0))<1e-9,msg+' '+a[i].id+' idx '+k)}
 }
}
for(const vp of V){
 const b=await setup(BASE,vp),c=await setup(CAND,vp);
 await c.p.waitForFunction(()=>window.MNChartController37&&window.__mn37Shadow);
 const bf=await fingerprint(b.p),cf=await fingerprint(c.p);
 assert.deepEqual(cf.boxes,bf.boxes,'geometry differs '+vp.name);
 assert.equal(cf.chart,bf.chart,'NOW DOM differs '+vp.name);
 const bs=await b.p.screenshot({fullPage:true}),cs=await c.p.screenshot({fullPage:true});assert.deepEqual(cs,bs,'raster differs '+vp.name);
 assert.equal(b.errs.length,0,b.errs.join('|'));assert.equal(c.errs.length,0,c.errs.join('|'));
 await b.c.close();await c.c.close();
}
// Analytical parity across indices/horizons/display modes in candidate.
const d=await setup(CAND,{width:1440,height:900}),p=d.p;await p.waitForFunction(()=>window.MNChartController37&&window.__mn37Shadow);
for(const root of ['risk','growth','macro']){
 if((await p.evaluate(()=>window.__mnShip25.level()))!==1){const env=p.locator('#crumbEnvironment');if(await env.count()){await env.click();await p.waitForTimeout(180)}}
 await p.locator('#legend [data-id="'+root+'"]').click();await p.waitForTimeout(180);
 for(const h of ['5D','YTD','1YR','3YR','5YR']){
  await p.locator('#hzs [data-h="'+h+'"]').click();await p.waitForTimeout(180);
  for(const opt of ['fixed','rebase']){
   const sel=p.locator('#nowIndexDisplay');if(await sel.count()){await sel.selectOption(opt);await p.waitForTimeout(160)}
   const legacy=await p.evaluate(()=>window.__mnShip25.nowState());
   const shadow=await p.evaluate(()=>window.__mn37Shadow.resolveNow());
   assert.equal(shadow.w.startLabel,legacy.chart.window.startLabel,root+'/'+h+'/'+opt+' start');
   assert.equal(shadow.w.endLabel,legacy.chart.window.endLabel,root+'/'+h+'/'+opt+' end');
   assert.equal(shadow.mode,legacy.chart.mode,root+'/'+h+'/'+opt+' mode');
   closeEnough(normalizeSeries(shadow.series),normalizeSeries(legacy.chart.series),root+'/'+h+'/'+opt);
  }
 }
}
// Analyze shadow parity, without allowing the controller to drive UI.
await p.evaluate(()=>window.__mnStandalone26.open('risk'));await p.waitForTimeout(220);
let legacyA=await p.evaluate(()=>window.__mnStandalone26.state()),shadowA=await p.evaluate(()=>window.__mn37Shadow.resolveAnalysis());
closeEnough(normalizeSeries(shadowA.series),normalizeSeries(legacyA.chart.series),'analysis risk');
await p.evaluate(()=>window.__mnStandalone26.close());
assert.equal(d.errs.length,0,d.errs.join('|'));await d.c.close();
console.log('PASS Stage 2 shadow parity + zero visual delta');
await browser.close();
