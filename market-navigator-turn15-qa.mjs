import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const url = process.env.MARKET_NAVIGATOR_URL || 'http://127.0.0.1:8123/market-navigator-turn15-pre-ship.html';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const failedResources = [];
page.on('pageerror', e => errors.push(`page: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400) failedResources.push(`${r.status()} ${r.url()}`); });

await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js', route => route.fulfill({
  contentType: 'application/javascript',
  body: "window.marked={parse:s=>'<div>'+String(s)+'</div>'};"
}));
await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js', route => route.fulfill({
  contentType: 'application/javascript', body: 'window.DOMPurify={sanitize:s=>s};'
}));

async function clickAndWait(sel, condition) {
  await page.locator(sel).click();
  if (condition) await page.waitForFunction(condition);
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#nowChart').count(), 1, 'NOW chart must survive boot');
  assert.equal(await page.locator('#view-now').isVisible(), true);

  // V1 rollback: all three derived indices are lines.
  const v1 = page.locator('#legend [data-id]');
  assert.equal(await v1.count(), 3);
  assert.deepEqual(await v1.evaluateAll(ns => ns.map(n => n.dataset.renderType)), ['line','line','line']);

  // Growth V2: selected index and all governed components are lines. WTI must
  // remain directly visible/selectable despite composite ratio ineligibility.
  await clickAndWait('#legend [data-id="growth"]', () => document.querySelector('#nowTitle')?.textContent.trim() === 'GRW');
  const growthTypes = await page.locator('#legend [data-id]').evaluateAll(ns => ns.map(n => n.dataset.renderType));
  assert(growthTypes.length >= 8 && growthTypes.every(x => x === 'line'));
  const wtiLegend = page.locator('#legend [data-id="wti"]');
  assert.equal(await wtiLegend.count(), 1, 'WTI must exist in Growth V2');
  assert.equal(await wtiLegend.isDisabled(), false, 'WTI must be selectable in Growth V2 5D');
  await wtiLegend.click();
  assert.match(await page.locator('#info').innerText(), /direct series remains available/i);

  // V3 WTI is directly chartable and compatible WTI + Brent shares native Y1.
  await page.locator('#moreInfo').click();
  await page.locator('#analysisModal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#seriesBar [data-id="wti"]').count(), 1);
  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('Brent');
  await page.locator('#pickerList [data-add="brent"]').click();
  assert.match(await page.locator('#axisBadge').innerText(), /Native Y1/i);

  // CPI + WTI = native dual axes.
  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('CPI');
  await page.locator('#pickerList [data-add="cpi"]').click();
  assert.match(await page.locator('#axisBadge').innerText(), /Y1.*Y2/i);

  // V3 More menu includes the governed actions.
  await page.locator('#moreBtn').click();
  const v3Menu = await page.locator('#moreMenu').innerText();
  for (const label of ['AI POV','Print','Download Markdown','Download CSV','Download JSON']) assert(v3Menu.includes(label), label);
  await page.locator('#moreBtn').click();
  await page.locator('#closeAnalysis').click();

  // Explore exposes GDP q/q and y/y, never the raw level. Periodic transforms
  // remain selectable on the default short horizon.
  await page.locator('[data-view="explore"]').click();
  await page.locator('[data-cat="Other"]').click();
  await page.locator('#exploreSearch').fill('GDP');
  await page.waitForFunction(() => (document.querySelector('#exploreList')?.textContent || '').includes('GDP q/q'));
  const exploreText = await page.locator('#exploreList').innerText();
  assert(exploreText.includes('GDP q/q'));
  assert(exploreText.includes('GDP y/y'));
  assert(!exploreText.includes('Real Gross Domestic Product'), 'raw GDP level must not be selectable');
  assert.equal(await page.locator('#exploreList [data-id="gdpQoq"]').getAttribute('aria-disabled'), 'false');
  assert.equal(await page.locator('#exploreList [data-id="gdpYoy"]').getAttribute('aria-disabled'), 'false');

  // Explore more menu exists.
  await page.locator('#exploreList [data-id="gdpQoq"]').click();
  await page.locator('#exploreMoreBtn').click();
  const exploreMenu = await page.locator('#exploreMoreMenu').innerText();
  for (const label of ['AI POV','Print','Download Markdown','Download CSV','Download JSON']) assert(exploreMenu.includes(label), label);

  // CONFIG is one three-tab surface with complete 10-slot style configuration.
  await page.locator('#settingsGear').click();
  assert.equal(await page.locator('#view-config').isVisible(), true);
  assert.deepEqual(await page.locator('[data-cfgtab]').evaluateAll(ns => ns.map(n => n.textContent.trim())), ['AI','Chart Config','About']);
  await page.locator('[data-cfgtab="chart"]').click();
  assert.equal(await page.locator('[data-palette]').count(), 3);
  assert.deepEqual((await page.locator('[data-palette]').allTextContents()).map(x => x.trim()), ['Normal','Colorblind','Bright'].sort((a,b)=>0));
  assert.equal(await page.locator('[data-palette-slot]').count(), 10);
  assert.equal(await page.locator('[data-width-slot]').count(), 10);
  assert.equal(await page.locator('[data-style-slot]').count(), 10);
  for (let i = 0; i < 10; i++) {
    assert.equal(await page.locator(`[data-width-slot="${i}"]`).getAttribute('min'), '1');
    assert.equal(await page.locator(`[data-width-slot="${i}"]`).getAttribute('max'), '12');
    const options = await page.locator(`[data-style-slot="${i}"] option`).allTextContents();
    assert.deepEqual(options, ['line','dash','dash-dot','dot','dot-dash']);
  }

  // Persist a width/style change and verify after reload.
  await page.locator('[data-width-slot="0"]').evaluate(el => { el.value = '7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('[data-style-slot="0"]').selectOption('dash-dot');
  await page.locator('#paletteSave').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#settingsGear').click();
  await page.locator('[data-cfgtab="chart"]').click();
  assert.equal(await page.locator('[data-width-slot="0"]').inputValue(), '7');
  assert.equal(await page.locator('[data-style-slot="0"]').inputValue(), 'dash-dot');

  // NOW more menu includes exact download surface.
  await page.locator('[data-view="now"]').click();
  await page.locator('#crumbMarket').click().catch(() => {});
  await page.locator('#nowMoreBtn').click();
  const nowMenu = await page.locator('#nowMoreMenu').innerText();
  for (const label of ['AI POV','Print','Download Markdown','Download CSV','Download JSON']) assert(nowMenu.includes(label), label);

  // Rapid V2 horizon changes must leave the final horizon selected and final
  // render committed rather than allowing an older async response to overwrite.
  await page.locator('#nowMoreBtn').click();
  await page.locator('#legend [data-id="growth"]').click();
  await Promise.all([
    page.locator('#hzs [data-h="1YR"]').click(),
    page.locator('#hzs [data-h="5D"]').click(),
  ]).catch(() => {});
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#hzs [data-h="5D"]').evaluate(n => n.classList.contains('on')), true);
  assert.equal(await page.locator('#legend [data-id="wti"]').isDisabled(), false);

  assert.deepEqual(errors, [], errors.join('\n'));
  assert.deepEqual(failedResources, [], failedResources.join('\n'));
  console.log('MARKET NAVIGATOR TURN 15: PASS');
} finally {
  await browser.close();
}
