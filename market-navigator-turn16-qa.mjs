import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const url = process.env.MARKET_NAVIGATOR_URL || 'http://127.0.0.1:8123/market-navigator-turn16-pre-ship.html';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });

async function makePage(width=1440,height=900){
  const page = await browser.newPage({ viewport:{width,height} });
  const errors=[]; const failed=[];
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{ if(m.type()==='error') errors.push(`console: ${m.text()}`); });
  page.on('response',r=>{ if(r.status()>=400) failed.push(`${r.status()} ${r.url()}`); });
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js', r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js', r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  await page.goto(url,{waitUntil:'networkidle'});
  return {page,errors,failed};
}

function approx(a,b,t=4){ return Math.abs(a-b)<=t; }
async function menuText(page,sel){ return (await page.locator(`${sel} button`).allTextContents()).map(x=>x.trim()).filter(Boolean); }
async function assertChromeRow(page,rowSel,crumbSel,hzSel,moreSel){
  const row=await page.locator(rowSel).boundingBox(), crumb=await page.locator(crumbSel).boundingBox(), hz=await page.locator(hzSel).boundingBox(), more=await page.locator(moreSel).boundingBox();
  assert(row&&crumb&&hz&&more,'chart chrome boxes must exist');
  const cy=x=>x.y+x.height/2;
  assert(approx(cy(crumb),cy(hz),5)&&approx(cy(hz),cy(more),5),'breadcrumb, horizon and more must occupy one physical row');
  assert(approx(hz.x+hz.width/2,row.x+row.width/2,5),'horizon controls must be fixed-center');
  assert(more.x>hz.x+hz.width,'More menu must be right of horizon controls');
  const nowrap=await page.locator(crumbSel).evaluate(el=>({whiteSpace:getComputedStyle(el).whiteSpace,textOverflow:getComputedStyle(el).textOverflow,overflow:getComputedStyle(el).overflow,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
  assert.equal(nowrap.whiteSpace,'nowrap');
  assert.equal(nowrap.textOverflow,'ellipsis');
  assert(['hidden','clip'].includes(nowrap.overflow));
  assert(nowrap.scrollHeight<=nowrap.clientHeight+2,'breadcrumb must not wrap to a second row');
}

try {
  const {page,errors,failed}=await makePage();
  assert.equal(await page.locator('#nowChart').count(),1,'primary chart must survive boot');
  assert.equal(await page.locator('#view-now').isVisible(),true);
  assert.equal(await page.locator('#modeHeader').isVisible(),false,'global header is replaced by chart Section A in NOW');
  assert(!/\bV[1-5]\b/.test(await page.locator('body').innerText()),'numbered internal view labels must never render');

  // ENVIRONMENT: canonical Section A/B/C.
  assert.equal((await page.locator('#nowCrumb').innerText()).trim(),'ENVIRONMENT');
  assert.equal(await page.locator('#hzs [data-h]').count(),7);
  await assertChromeRow(page,'#nowChrome','#nowCrumb','#hzs','#nowMoreBtn');
  const envRow=await page.locator('#nowChrome').boundingBox(), legendRow=await page.locator('#legend').boundingBox(), chart=await page.locator('#nowWrap').boundingBox(), footer=await page.locator('#nowMeta').boundingBox();
  assert(envRow&&legendRow&&chart&&footer);
  assert(legendRow.y>=envRow.y+envRow.height-1 && chart.y>legendRow.y,'legend strip must be Row 2 directly below Section A');
  assert(footer.y>chart.y,'Section C must be below the chart');
  assert.match(await page.locator('#nowMeta').innerText(),/TURN 16 PRE-SHIP/);
  assert.match(await page.locator('#nowMeta').innerText(),/Indexed 100/);
  assert(!/columns|Common horizon/i.test(await page.locator('#nowMeta').innerText()),'legacy footer text must be removed');
  assert.equal(await page.locator('#legend [data-id]').count(),3);
  assert((await page.locator('#legend [data-id]').evaluateAll(ns=>ns.map(n=>n.dataset.renderType))).every(x=>x==='line'));

  const expectedMenu=['AI POV','Print','Download Markdown','Download CSV','Download JSON'];
  await page.locator('#nowMoreBtn').click();
  assert.deepEqual(await menuText(page,'#nowMoreMenu'),expectedMenu,'ENVIRONMENT menu contract');
  await page.locator('#nowMoreBtn').click();

  // INDEX: same chrome, WTI stays valid direct evidence.
  await page.locator('#legend [data-id="growth"]').click();
  await page.waitForFunction(()=>document.querySelector('#nowTitle')?.textContent.trim()==='GRW');
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENVIRONMENT / GRW');
  await assertChromeRow(page,'#nowChrome','#nowCrumb','#hzs','#nowMoreBtn');
  assert.equal(await page.locator('#legend [data-id="wti"]').isDisabled(),false,'WTI must remain directly selectable on 5D');
  await page.locator('#legend [data-id="wti"]').click();
  assert.match(await page.locator('#info').innerText(),/direct series remains available/i);

  // COMPONENT: one-row Section A, legend Row 2, footer representation selector.
  await page.locator('#moreInfo').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.match((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),/^ENVIRONMENT \/ GRW \/ WTI$/);
  assert.equal(await page.locator('#analysisHz [data-h]').count(),7);
  await assertChromeRow(page,'.analysisTop','#analysisCrumb','#analysisHz','#moreBtn');
  assert.equal(await page.locator('#closeAnalysis').isVisible(),false,'COMPONENT must not add a competing visible close/back control to Section A');
  assert.equal(await page.locator('#seriesBar [data-id="wti"]').count(),1);
  assert.match(await page.locator('#analysisMeta').innerText(),/TURN 16 PRE-SHIP/);
  assert.equal(await page.locator('#analysisRepresentation').inputValue(),'native');

  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('Brent');
  await page.locator('#pickerList [data-add="brent"]').click();
  assert.match((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' '),/WTI \+ 1 Component/);
  assert.equal(await page.locator('#analysisRepresentation').inputValue(),'native','WTI + Brent share Native Y1');
  assert.equal(await page.locator('#analysisRepresentation option[value="native"]').isEnabled(),true);
  assert.equal(await page.locator('#analysisRepresentation option[value="dual"]').isEnabled(),false);

  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('CPI');
  await page.locator('#pickerList [data-add="cpi"]').click();
  assert.match((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' '),/WTI \+ 2 Components/);
  assert.equal(await page.locator('#analysisRepresentation').inputValue(),'dual','CPI + oil family requires Native Y1 + Y2');
  assert.equal(await page.locator('#analysisRepresentation option[value="dual"]').isEnabled(),true);
  await page.locator('#analysisRepresentation').selectOption('indexed');
  assert.equal(await page.locator('#analysisRepresentation').inputValue(),'indexed','representation selector must update chart in place');
  await page.locator('#analysisRepresentation').selectOption('dual');
  assert.equal(await page.locator('#analysisRepresentation').inputValue(),'dual');

  // COMPONENT context menu is exactly the same ordered menu as ENVIRONMENT.
  await page.locator('#moreBtn').click();
  assert.deepEqual(await menuText(page,'#moreMenu'),expectedMenu,'COMPONENT menu contract');
  assert(!/Stats/.test(await page.locator('#moreMenu').innerText()));
  await page.locator('#moreBtn').click();

  // Crosshair inspection activates automatic active-series isolation state. No
  // persistent focus control or second-click state is introduced.
  const cbox=await page.locator('#analysisChart').boundingBox();
  assert(cbox);
  await page.mouse.click(cbox.x+cbox.width*.52,cbox.y+cbox.height*.5);
  await page.waitForTimeout(50);
  assert.notEqual(await page.locator('#analysisChart').getAttribute('data-active-series'),'','inspection must mark one active opaque series');
  assert.equal(await page.locator('#analysisModal [data-focus-series]').count(),0,'no separate focus-mode control/state');

  // Breadcrumb INDEX ancestor is the close/back path and restores INDEX.
  await page.locator('#crumbComponentIndex').click();
  await page.locator('#analysisModal').waitFor({state:'hidden'});
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENVIRONMENT / GRW');
  assert.equal(await page.locator('#info').isVisible(),true,'exact prior component card must restore');

  // EXPLORE preserves Turn 15 GDP and uses the same ordered context menu.
  await page.locator('[data-view="explore"]').click();
  await page.locator('[data-cat="Other"]').click();
  await page.locator('#exploreSearch').fill('GDP');
  await page.waitForFunction(()=>document.querySelector('#exploreList')?.textContent.includes('GDP q/q'));
  const eText=await page.locator('#exploreList').innerText();
  assert(eText.includes('GDP q/q')&&eText.includes('GDP y/y'));
  assert(!eText.includes('Real Gross Domestic Product'));
  assert.equal(await page.locator('#exploreList [data-id="gdpQoq"]').getAttribute('aria-disabled'),'false');
  await page.locator('#exploreList [data-id="gdpQoq"]').click();
  await page.locator('#exploreMoreBtn').click();
  assert.deepEqual(await menuText(page,'#exploreMoreMenu'),expectedMenu,'EXPLORE menu contract');
  await page.locator('#exploreMoreBtn').click();

  // CONFIG: shared X across all tabs, desktop selectors fully operable, draft
  // preview does not persist until Save, and X returns to exact prior mode.
  await page.locator('#settingsGear').click();
  assert.equal(await page.locator('#view-config').isVisible(),true);
  assert.equal(await page.locator('#configClose').isVisible(),true);
  assert.deepEqual((await page.locator('[data-cfgtab]').allTextContents()).map(x=>x.trim()),['AI','Chart Config','About']);
  await page.locator('[data-cfgtab="about"]').click();
  assert.equal(await page.locator('#configClose').isVisible(),true);
  await page.locator('[data-cfgtab="chart"]').click();
  assert.equal(await page.locator('#configClose').isVisible(),true);
  assert.equal(await page.locator('[data-palette-slot]').count(),10);
  assert.equal(await page.locator('[data-width-slot]').count(),10);
  assert.equal(await page.locator('[data-style-slot]').count(),10);
  for(let i=0;i<10;i++){
    const sel=page.locator(`[data-style-slot="${i}"]`);
    await sel.scrollIntoViewIfNeeded();
    const b=await sel.boundingBox(); assert(b&&b.width>=110,`desktop line-style select ${i+1} must be operable`);
    assert.deepEqual(await sel.locator('option').allTextContents(),['line','dash','dash-dot','dot','dot-dash']);
  }
  const storageKey='marketNavigatorChartPaletteV1';
  const before=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),storageKey));
  await page.locator('[data-style-slot="0"]').scrollIntoViewIfNeeded();
  await page.locator('[data-style-slot="0"]').selectOption('dash-dot');
  await page.locator('[data-width-slot="0"]').evaluate(el=>{el.value='7';el.dispatchEvent(new Event('input',{bubbles:true}));});
  const afterPreview=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),storageKey));
  assert.deepEqual(afterPreview,before,'preview must not persist before Save');
  await page.locator('#configClose').click();
  assert.equal(await page.locator('#view-explore').isVisible(),true,'CONFIG X must return to exact prior principal mode');
  await page.locator('#settingsGear').click();
  await page.locator('[data-cfgtab="chart"]').click();
  assert.notEqual(await page.locator('[data-style-slot="0"]').inputValue(),'dash-dot','closing unsaved config must restore persisted style');
  await page.locator('[data-style-slot="0"]').selectOption('dash-dot');
  await page.locator('[data-width-slot="0"]').evaluate(el=>{el.value='7';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#paletteSave').click();
  const afterSave=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),storageKey));
  assert.equal(afterSave.lineStyles[0],'dash-dot'); assert.equal(afterSave.widths[0],7);
  await page.locator('#configClose').click();

  // Rapid INDEX horizon updates still reject stale async commits.
  await page.locator('[data-view="now"]').click();
  await page.locator('#legend [data-id="growth"]').click();
  await Promise.all([page.locator('#hzs [data-h="1YR"]').click(),page.locator('#hzs [data-h="5D"]').click()]).catch(()=>{});
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#hzs [data-h="5D"]').evaluate(n=>n.classList.contains('on')),true);
  assert.equal(await page.locator('#legend [data-id="wti"]').isDisabled(),false);

  // Phone: Section A remains one physical row; breadcrumb yields space rather
  // than wrapping the centered horizon strip.
  const phone=await makePage(390,844); const p=phone.page;
  await assertChromeRow(p,'#nowChrome','#nowCrumb','#hzs','#nowMoreBtn');
  assert((await p.locator('#nowChrome').boundingBox()).height<=46);
  await p.locator('#legend [data-id="growth"]').click();
  await p.locator('#legend [data-id="wti"]').click();
  await p.locator('#moreInfo').click();
  await p.locator('#analysisModal').waitFor({state:'visible'});
  await assertChromeRow(p,'.analysisTop','#analysisCrumb','#analysisHz','#moreBtn');
  const ac=await p.locator('#analysisCrumb').evaluate(el=>({scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
  assert(ac.scrollHeight<=ac.clientHeight+2,'phone breadcrumb cannot wrap');
  assert.deepEqual(phone.errors,[],phone.errors.join('\n')); assert.deepEqual(phone.failed,[],phone.failed.join('\n'));
  await p.close();

  assert.deepEqual(errors,[],errors.join('\n'));
  assert.deepEqual(failed,[],failed.join('\n'));
  console.log('MARKET NAVIGATOR TURN 16: PASS');
  await page.close();
} finally {
  await browser.close();
}
