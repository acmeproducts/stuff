import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const baseUrl=process.env.MN_BASE_URL||'http://127.0.0.1:8123/market-navigator-turn28-post-ship.html';
const candUrl=process.env.MN_CAND_URL||'http://127.0.0.1:8123/market-navigator-turn37-stage0.html';
const viewports=[
  {name:'owner-desktop',width:1887,height:800},
  {name:'desktop',width:1440,height:900},
  {name:'tablet',width:800,height:1280},
  {name:'phone',width:412,height:915}
];
const browser=await chromium.launch({headless:true});

async function newPage(viewport,url){
  const context=await browser.newContext({viewport,deviceScaleFactor:1});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('page:'+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:'window.marked={parse:s=>s}'}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__mnShip25?.ready?.()&&document.querySelector('#nowChart'));
  await page.waitForTimeout(250);
  return {context,page,errors};
}
async function geometry(page){
  return page.evaluate(()=>{
    const pick=s=>{
      const e=document.querySelector(s); if(!e)return null;
      const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
      return {x:r.x,y:r.y,width:r.width,height:r.height,display:cs.display,position:cs.position,fontSize:cs.fontSize,lineHeight:cs.lineHeight,overflow:cs.overflow,visibility:cs.visibility};
    };
    return {
      shell:pick('#shell'),header:pick('#modeHeader'),card:pick('.chartCard'),crumb:pick('#nowCrumb'),
      horizons:pick('#hzs'),legend:pick('#legend'),wrap:pick('#nowWrap'),canvas:pick('#nowChart'),footer:pick('#nowMeta'),
      add:pick('#nowAddSeries'),more:pick('#nowMoreBtn')
    };
  });
}
async function state(page){return page.evaluate(()=>window.__mnShip25?.nowState?.()||window.__mnTurn25?.nowState?.()||null)}
async function runTrace(page){
  const out=[];
  out.push({step:'boot',state:await state(page),text:await page.locator('#nowCrumb').innerText()});
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForTimeout(250);
  out.push({step:'risk',state:await state(page),text:await page.locator('#nowCrumb').innerText()});
  const h=page.locator('#hzs [data-h="1YR"]');
  if(await h.count()){await h.click();await page.waitForTimeout(250)}
  out.push({step:'1YR',state:await state(page)});
  const fixed=page.locator('#nowIndexDisplay');
  if(await fixed.count()){await fixed.selectOption('rebase');await page.waitForTimeout(250)}
  out.push({step:'horizon-display',state:await state(page)});
  const add=page.locator('#nowAddSeries');
  if(await add.count()){await add.click();await page.waitForTimeout(150);out.push({step:'add-open',picker:await page.locator('#nowPicker').evaluate(e=>!e.classList.contains('hidden'))});await page.locator('#nowPickerClose').click()}
  const more=page.locator('#nowMoreBtn');
  if(await more.count()){await more.click();await page.waitForTimeout(80);out.push({step:'more-open',menu:await page.locator('#nowMoreMenu').evaluate(e=>!e.classList.contains('hidden'))});await more.click()}
  return out;
}

for(const vp of viewports){
  const a=await newPage(vp,baseUrl),b=await newPage(vp,candUrl);
  const ga=await geometry(a.page),gb=await geometry(b.page);
  assert.deepEqual(gb,ga,vp.name+' geometry mismatch');
  const sa=await a.page.screenshot({fullPage:true}),sb=await b.page.screenshot({fullPage:true});
  assert(sa.equals(sb),vp.name+' full-page raster mismatch');
  const ta=await runTrace(a.page),tb=await runTrace(b.page);
  assert.deepEqual(tb,ta,vp.name+' interaction trace mismatch');
  assert.equal(a.errors.length,0,vp.name+' baseline errors '+a.errors.join(' | '));
  assert.equal(b.errors.length,0,vp.name+' candidate errors '+b.errors.join(' | '));
  await a.context.close();await b.context.close();
}
console.log('PASS Turn37 Stage0 accepted-baseline visual/geometry/interaction characterization');
await browser.close();
