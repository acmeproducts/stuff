import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');

const BASE=process.env.MN_BASE_URL||'http://127.0.0.1:8123/market-navigator-turn28-post-ship.html';
const OUT=process.env.MN_ARTIFACT_DIR||'turn37-stage0-artifacts';
fs.mkdirSync(OUT,{recursive:true});

const viewports=[
  {name:'owner-desktop',width:1887,height:800},
  {name:'desktop',width:1440,height:900},
  {name:'tablet',width:800,height:1280},
  {name:'phone',width:412,height:915}
];

function roundRect(r){if(!r)return null;return Object.fromEntries(['x','y','width','height','top','right','bottom','left'].map(k=>[k,Math.round(r[k]*100)/100]))}
async function pageState(page){
  return page.evaluate(()=>{
    const rect=id=>{const e=document.querySelector(id);return e?e.getBoundingClientRect().toJSON():null};
    const style=id=>{const e=document.querySelector(id);if(!e)return null;const s=getComputedStyle(e);return {display:s.display,position:s.position,overflow:s.overflow,overflowX:s.overflowX,overflowY:s.overflowY,fontSize:s.fontSize,lineHeight:s.lineHeight,zIndex:s.zIndex}};
    const txt=id=>document.querySelector(id)?.textContent?.trim()||'';
    const state=window.__mnShip25?.nowState?.()||null;
    return {
      view:window.__mnShip25?.view?.(),
      horizon:window.__mnShip25?.horizon?.(),
      level:window.__mnShip25?.level?.(),
      indexContext:window.__mnShip25?.indexContext?.(),
      nowState:state,
      structure:{
        chartCard:!!document.querySelector('.chartCard'),
        hzCount:document.querySelectorAll('#hzs [data-h]').length,
        legendIds:[...document.querySelectorAll('#legend [data-id]')].map(x=>x.dataset.id),
        footerControls:[...document.querySelectorAll('#nowMeta select')].map(x=>({id:x.id,value:x.value,options:[...x.options].map(o=>o.value)})),
        libraryModes:[...document.querySelectorAll('#interpretTabs27 [data-interpret27]')].map(x=>x.textContent.trim())
      },
      geometry:{
        shell:rect('#shell'),header:rect('#modeHeader'),chartCard:rect('.chartCard'),crumb:rect('#nowCrumb'),
        horizons:rect('#hzs'),legend:rect('#legend'),wrap:rect('#nowWrap'),canvas:rect('#nowChart'),footer:rect('#nowMeta'),
        more:rect('#nowMoreBtn'),picker:rect('#nowPicker'),analysis:rect('#standaloneAnalysis26')
      },
      styles:{
        chartCard:style('.chartCard'),horizons:style('#hzs'),legend:style('#legend'),wrap:style('#nowWrap'),footer:style('#nowMeta')
      },
      text:{crumb:txt('#nowCrumb'),footer:txt('#nowMeta')},
      overflow:{
        docX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
        bodyX:document.body.scrollWidth>document.body.clientWidth+1
      }
    }
  })
}

const browser=await chromium.launch({headless:true});
const results={schema:'mn-turn37-baseline-v1',baseline:{file:'market-navigator-turn28-post-ship.html',blob:'9ce7f67451f9e1b7804927ce5c56adb667614724'},viewports:{}};

for(const vp of viewports){
  const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1});
  const page=await ctx.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:"window.marked={parse:s=>s}"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__mnShip25?.ready?.(),null,{timeout:15000});

  const initial=await pageState(page);
  assert.equal(initial.structure.libraryModes.join('|'),'Plain|Standard|Technical');
  assert.equal(initial.overflow.docX,false,'baseline horizontal document overflow at '+vp.name);

  await page.screenshot({path:path.join(OUT,vp.name+'-now-full.png'),fullPage:true});
  const card=page.locator('.chartCard');
  if(await card.count()) await card.screenshot({path:path.join(OUT,vp.name+'-chart-card.png')});

  const trace=[];
  trace.push({step:'initial',state:await pageState(page)});

  // ENV -> RSK
  const risk=page.locator('#legend [data-id="risk"]');
  if(await risk.count()){await risk.click();await page.waitForTimeout(250);trace.push({step:'open-risk',state:await pageState(page)})}

  // horizon change
  const oneYr=page.locator('#hzs [data-h="1YR"]');
  if(await oneYr.count()){await oneYr.click();await page.waitForTimeout(250);trace.push({step:'horizon-1YR',state:await pageState(page)})}

  // display selector
  const display=page.locator('#nowIndexDisplay');
  if(await display.count()){
    await display.selectOption('rebase');await page.waitForTimeout(200);
    trace.push({step:'display-horizon',state:await pageState(page)});
    await display.selectOption('fixed');await page.waitForTimeout(200);
  }

  // Add picker opens/closes without mutation.
  const add=page.locator('#nowAddSeries');
  if(await add.count()){
    const before=await page.evaluate(()=>window.__mnShip25.nowState());
    await add.click();await page.waitForTimeout(150);
    trace.push({step:'add-open',state:await pageState(page)});
    await page.locator('#nowPickerClose').click();await page.waitForTimeout(100);
    const after=await page.evaluate(()=>window.__mnShip25.nowState());
    assert.deepEqual(after.series,before.series,'baseline picker close mutates series');
  }

  // Analyze baseline open/close.
  await page.evaluate(()=>window.__mnStandalone26.open('risk'));
  await page.waitForSelector('#standaloneAnalysis26:not(.hidden)');
  await page.waitForTimeout(250);
  const astate=await page.evaluate(()=>window.__mnStandalone26.state());
  assert.equal(astate?.root,'risk');
  trace.push({step:'analysis-open-risk',analysis:astate});
  await page.evaluate(()=>window.__mnStandalone26.close());
  assert(await page.locator('#standaloneAnalysis26').evaluate(e=>e.classList.contains('hidden')));

  // Library interpretation controls. On narrow baseline viewports the rail is intentionally collapsed.
  const libraryNav=page.locator('[data-view="library"]');
  if(!(await libraryNav.isVisible())){await page.click('#toggle');await page.waitForTimeout(200)}
  await libraryNav.click();await page.waitForTimeout(150);
  const modes=await page.locator('#interpretTabs27 [data-interpret27]').allTextContents();
  assert.deepEqual(modes.map(x=>x.trim()),['Plain','Standard','Technical']);
  trace.push({step:'library',modes:modes.map(x=>x.trim())});

  assert.equal(errors.length,0,errors.join(' | '));
  results.viewports[vp.name]={viewport:vp,initial,trace,errors};
  await ctx.close();
}

fs.writeFileSync(path.join(OUT,'baseline-characterization.json'),JSON.stringify(results,null,2));
console.log('PASS Stage 0 baseline characterization',Object.keys(results.viewports).join(', '));
await browser.close();
