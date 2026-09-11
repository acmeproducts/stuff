import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const url = process.env.MARKET_NAVIGATOR_URL || 'http://127.0.0.1:8123/market-navigator-turn18-pre-ship.html';
process.env.MARKET_NAVIGATOR_URL = url;

// Preserve the complete accepted Turn 17 regression matrix against the exact Turn 18 candidate.
await import('./market-navigator-turn17-qa.mjs');

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({headless:true});

try {
  const page = await browser.newPage({viewport:{width:412,height:915}}), errors=[];
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  await page.goto(url,{waitUntil:'networkidle'});

  async function horizon(h, density){
    await page.locator(`#hzs [data-h="${h}"]`).click();
    await page.waitForFunction(([want,den])=>{
      const c=document.querySelector('#nowChart');
      return document.querySelector(`#hzs [data-h="${want}"]`)?.classList.contains('on') && c?.dataset.renderDensity===den && Number(c?.dataset.sourcePoints)>0;
    },[h,density]);
    return await page.locator('#nowChart').evaluate(c=>({density:c.dataset.renderDensity,source:+c.dataset.sourcePoints,rendered:+c.dataset.renderedPoints}));
  }

  for(const h of ['1D','5D','MTD']){
    const q=await horizon(h,'native');
    assert.equal(q.rendered,q.source,`${h} must render native observation density`);
  }

  for(const h of ['YTD','1YR']){
    const q=await horizon(h,'weekly');
    assert(q.rendered>0 && q.rendered<q.source,`${h} must reduce dense source observations to weekly display density`);
  }

  for(const h of ['3YR','5YR']){
    const q=await horizon(h,'monthly');
    assert(q.rendered>0 && q.rendered<q.source,`${h} must reduce dense source observations to monthly display density`);
  }

  // Rendering density must not reduce canonical chart-state/Data rows.
  const oneYear=await horizon('1YR','weekly');
  await page.locator('#nowMoreBtn').click();
  await page.locator('#nowData').click();
  await page.locator('#dataModal').waitFor({state:'visible'});
  const rows=await page.locator('#dataRows tr').count();
  assert.equal(rows,oneYear.source,'Data must retain the full real chart-window observation set, not weekly display points');
  assert(rows>oneYear.rendered,'Data must contain observations not drawn at weekly display density');
  await page.locator('#dataClose').click();

  // Hover inspection remains live on the long-horizon chart without any second click.
  const box=await page.locator('#nowChart').boundingBox(); assert(box);
  await page.mouse.move(box.x+box.width*.57,box.y+box.height*.47);
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#nowTip').isVisible(),true,'1YR hover inspection must remain available against full observations');

  assert.deepEqual(errors,[],'Turn 18 browser errors');
  console.log('TURN 18 HORIZON DENSITY QA: PASS');
} finally {
  await browser.close();
}
