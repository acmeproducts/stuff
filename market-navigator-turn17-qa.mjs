import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const url = process.env.MARKET_NAVIGATOR_URL || 'http://127.0.0.1:8123/market-navigator-turn17-pre-ship.html';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({headless:true});

async function makePage(width=1440,height=900){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  await page.goto(url,{waitUntil:'networkidle'});
  return {page,errors,failed};
}

async function menuText(page,sel){return (await page.locator(`${sel} button`).allTextContents()).map(x=>x.trim()).filter(Boolean)}

try{
  const {page,errors,failed}=await makePage();
  const expectedMenu=['AI POV','Data','Print','Download Markdown','Download CSV','Download JSON'];
  assert.equal(await page.locator('#nowChart').count(),1,'chart boot');
  assert(!/\bV[1-5]\b/.test(await page.locator('body').innerText()),'numbered view labels remain prohibited');

  // Force an unmistakable configured stroke so the legend must visually carry
  // both line style and thickness, not just series color.
  await page.evaluate(()=>{
    const k='marketNavigatorChartPaletteV1';
    const p=JSON.parse(localStorage.getItem(k)||'{}');
    p.schema='market-navigator-series-style-v2';
    p.colors=p.colors||['#27D3F5','#FFD166','#48D597','#FF5A6F','#A78BFA','#FF9F1C','#4C78FF','#FF6EC7','#B8E43C','#AEB8C4'];
    p.assignments=p.assignments||{risk:0,growth:1,macro:2};
    p.widths=Array(10).fill(7);
    p.lineStyles=Array(10).fill('dash-dot');
    localStorage.setItem(k,JSON.stringify(p));
  });
  await page.reload({waitUntil:'networkidle'});
  const firstStroke=page.locator('#legend .legendSwatch line').first();
  assert.equal(await firstStroke.getAttribute('stroke-width'),'7','legend must show configured thickness');
  assert.equal(await firstStroke.getAttribute('stroke-dasharray'),'8 4 2 4','legend must show configured dash-dot style');

  // INDEX HYG chip: one click must update card and turn on visual isolation
  // before any chart/crosshair click.
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="hyg"]'));
  await page.locator('#legend [data-id="hyg"]').click();
  await page.waitForFunction(()=>document.querySelector('#info')&&!document.querySelector('#info').classList.contains('hidden'));
  assert.match(await page.locator('#info').innerText(),/HYG|High Yield/i);
  assert.equal(await page.locator('#legend [data-id="hyg"]').evaluate(n=>n.classList.contains('active')),true,'chip selected');
  assert.equal(await page.locator('#nowChart').getAttribute('data-active-series'),'hyg','chip must immediately activate chart emphasis');
  assert.equal(await page.locator('#nowChart').getAttribute('data-emphasis'),'true','chip must immediately fade background series');

  const infoStyle=await page.locator('#info').evaluate(el=>{const c=getComputedStyle(el),r=el.getBoundingClientRect();return{bg:c.backgroundColor,color:c.color,pointer:c.pointerEvents,left:r.left,right:r.right,top:r.top,width:r.width,viewport:innerWidth}});
  assert.match(infoStyle.bg,/rgb\(255, 255, 255\)/,'card background must be white');
  assert.match(infoStyle.color,/rgb\((?:0|16|17), (?:0|16|17), (?:0|16|17)\)/,'card text must be black/dark');
  assert.equal(infoStyle.pointer,'none','card body must be pointer-through/non-blocking');
  assert(infoStyle.width<=330,'card must be compact');
  assert(infoStyle.right>infoStyle.viewport-355,'card must be top-right rather than centered');
  assert(infoStyle.top<180,'card must sit near plot top');
  assert.notEqual(await page.locator('#moreInfo').evaluate(el=>getComputedStyle(el).pointerEvents),'none','More info remains operable');

  // Mouse hover alone produces crosshair/readout for the selected HYG and must
  // not silently switch the selected chip.
  const box=await page.locator('#nowChart').boundingBox(); assert(box);
  await page.mouse.move(box.x+box.width*.52,box.y+box.height*.46);
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#nowTip').isVisible(),true,'desktop pointer hover must inspect without click');
  assert.equal(await page.locator('#nowChart').getAttribute('data-active-series'),'hyg','hover must preserve selected series');
  assert.equal(await page.locator('#legend [data-id="hyg"]').evaluate(n=>n.classList.contains('active')),true,'hover must not silently change chip');

  // Plot selection is bidirectional. Scan the plot until a deliberate click
  // lands near another component line; the chip and card must then agree.
  let changed=null;
  for(const xf of [.18,.34,.50,.66,.82]){
    for(let yf=.15;yf<=.85;yf+=.07){
      await page.mouse.click(box.x+box.width*xf,box.y+box.height*yf);
      await page.waitForTimeout(25);
      const id=await page.locator('#legend .lg.active').getAttribute('data-id');
      if(id && id!=='hyg' && !['risk','growth','macro'].includes(id)) {changed=id;break;}
    }
    if(changed)break;
  }
  assert(changed,'clicking a plotted component must be able to change active series');
  assert.equal(await page.locator('#nowChart').getAttribute('data-active-series'),changed,'canvas and chip active series must agree');
  const cardText=(await page.locator('#info').innerText()).toLowerCase();
  const chipText=(await page.locator(`#legend [data-id="${changed}"]`).innerText()).trim().toLowerCase();
  assert(cardText.includes(chipText.split(/\s+/)[0]),'canvas-selected series must update contextual card');

  // More -> Data is canonical and exposes complete exact-state columns.
  await page.locator('#nowMoreBtn').click();
  assert.deepEqual(await menuText(page,'#nowMoreMenu'),expectedMenu,'INDEX menu order');
  await page.locator('#nowData').click();
  await page.locator('#dataModal').waitFor({state:'visible'});
  assert.deepEqual((await page.locator('#dataModal th').allTextContents()).map(x=>x.trim()),['Series','Date','Native','Index 100','Correlation']);
  assert((await page.locator('#dataRows tr').count())>5,'Data must expose full visible-horizon rows, not only latest values');
  assert.match(await page.locator('#dataMeta').innerText(),/correlation vs/i);
  assert((await page.locator('#dataRows td:nth-child(5)').allTextContents()).some(x=>/^(-?\d\.\d{3}|N\/A)$/.test(x.trim())),'correlation score must be explicit');
  await page.locator('#dataClose').click();

  // COMPONENT inherits styled chips, immediate emphasis and hover inspection.
  await page.locator('#moreInfo').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.equal(await page.locator('#seriesBar .legendSwatch').count(),1,'COMPONENT chip uses stroke sample');
  assert.equal(await page.locator('#seriesBar .legendSwatch line').first().getAttribute('stroke-width'),'7');
  assert.equal(await page.locator('#seriesBar .legendSwatch line').first().getAttribute('stroke-dasharray'),'8 4 2 4');
  const rootId=await page.locator('#seriesBar [data-id]').first().getAttribute('data-id');
  assert.equal(await page.locator('#analysisChart').getAttribute('data-active-series'),rootId,'COMPONENT is immediately focused on selected root');
  const abox=await page.locator('#analysisChart').boundingBox(); assert(abox);
  await page.mouse.move(abox.x+abox.width*.55,abox.y+abox.height*.5);
  await page.waitForTimeout(60);
  assert.equal(await page.locator('#analysisTip').isVisible(),true,'COMPONENT hover inspection');
  assert.equal(await page.locator('#analysisChart').getAttribute('data-active-series'),rootId,'COMPONENT hover preserves active series');
  await page.locator('#moreBtn').click();
  assert.deepEqual(await menuText(page,'#moreMenu'),expectedMenu,'COMPONENT menu order');
  await page.locator('#moreData').click();
  await page.locator('#dataModal').waitFor({state:'visible'});
  assert.match(await page.locator('#dataMeta').innerText(),/correlation vs/i);
  assert((await page.locator('#dataRows tr').count())>0);
  await page.locator('#dataClose').click();
  await page.locator('#crumbComponentIndex').click();

  // Preserve Turn 15/16 data truth: WTI remains selectable on Growth 5D.
  await page.locator('#crumbEnvironment').click().catch(()=>{});
  if((await page.locator('#nowCrumb').innerText()).trim()!=='ENVIRONMENT'){
    await page.locator('[data-view="now"]').click();
  }
  if(!(await page.locator('#legend [data-id="growth"]').count())) await page.locator('#crumbEnvironment').click();
  await page.locator('#legend [data-id="growth"]').click();
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="wti"]'));
  assert.equal(await page.locator('#legend [data-id="wti"]').isDisabled(),false,'WTI remains directly selectable on 5D');

  // EXPLORE keeps periodic GDP selection and receives the identical Data menu.
  await page.locator('[data-view="explore"]').click();
  await page.locator('[data-cat="Other"]').click();
  await page.locator('#exploreSearch').fill('GDP');
  await page.waitForFunction(()=>document.querySelector('#exploreList')?.textContent.includes('GDP q/q'));
  assert.equal(await page.locator('#exploreList [data-id="gdpQoq"]').getAttribute('aria-disabled'),'false');
  await page.locator('#exploreList [data-id="gdpQoq"]').click();
  await page.locator('#exploreMoreBtn').click();
  assert.deepEqual(await menuText(page,'#exploreMoreMenu'),expectedMenu,'EXPLORE menu order');
  await page.locator('#exploreData').click();
  await page.locator('#dataModal').waitFor({state:'visible'});
  assert((await page.locator('#dataRows tr').count())>0,'periodic GDP Data must expose genuine rows');
  await page.locator('#dataClose').click();

  // Phone card remains compact/top-right and chart chrome remains one row.
  const phone=await makePage(390,844); const p=phone.page;
  await p.locator('#legend [data-id="risk"]').click();
  await p.waitForFunction(()=>document.querySelector('#legend [data-id="hyg"]'));
  await p.locator('#legend [data-id="hyg"]').click();
  await p.waitForFunction(()=>!document.querySelector('#info').classList.contains('hidden'));
  const pi=await p.locator('#info').boundingBox(); assert(pi&&pi.width<=290&&pi.x>90&&pi.y<160,'phone component card must remain compact top-right');
  assert.equal(await p.locator('#nowChart').getAttribute('data-active-series'),'hyg');
  const pc=await p.locator('#nowChrome').boundingBox(); assert(pc&&pc.height<=46,'phone Section A remains one row');
  assert.deepEqual(phone.errors,[],phone.errors.join('\n')); assert.deepEqual(phone.failed,[],phone.failed.join('\n'));
  await p.close();

  assert.deepEqual(errors,[],errors.join('\n'));
  assert.deepEqual(failed,[],failed.join('\n'));
  console.log('MARKET NAVIGATOR TURN 17: PASS');
  await page.close();
}finally{await browser.close()}
