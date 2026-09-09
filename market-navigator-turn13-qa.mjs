import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const url = process.env.MARKET_NAVIGATOR_URL ||
  'http://127.0.0.1:8123/market-navigator-turn13-pre-ship.html';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const failedResources = [];
page.on('pageerror', error => errors.push(`page: ${error}`));
page.on('console', message => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('response', response => {
  if (response.status() >= 400) {
    failedResources.push(`${response.status()} ${response.url()}`);
  }
});

await page.addInitScript(() => {
  localStorage.setItem('marketNavigatorAIRegistryV1', JSON.stringify({
    defaultProvider: 'openrouter',
    providers: {
      openrouter: {
        verified: true,
        key: 'qualification-only-key',
        model: 'qualification-model'
      }
    }
  }));
});

await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js', route =>
  route.fulfill({
    contentType: 'application/javascript',
    body: "window.marked={parse:s=>'<div class=\"rendered-markdown\">'+String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\\n/g,'<br>')+'</div>'};"
  })
);
await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js', route =>
  route.fulfill({
    contentType: 'application/javascript',
    body: 'window.DOMPurify={sanitize:s=>s};'
  })
);

let requestStartedResolve;
const requestStarted = new Promise(resolve => { requestStartedResolve = resolve; });
await page.route('https://openrouter.ai/api/v1/chat/completions', async route => {
  requestStartedResolve();
  await new Promise(resolve => setTimeout(resolve, 1200));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      choices: [{
        message: {
          content: '# Oil and Equities Share a Two-Axis Signal\n\n## Market read\n\nThe saved chart remains the analytical authority.\n\n## What changed\n\nThe response is bound to the frozen evidence revision.\n\n## Evidence quality/limitations\n\nOnly real observations inside the selected horizon are used.\n\n## Current context\n\nCurrent-web context is additive.\n\n## What to watch next\n\nWatch the relationship represented in the saved chart.'
        }
      }]
    })
  });
});

const readRecords = () => page.evaluate(() => new Promise((resolve, reject) => {
  const open = indexedDB.open('marketNavigatorLocal', 1);
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const request = open.result.transaction('analyses').objectStore('analyses').getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  };
}));

try {
  await page.goto(url, { waitUntil: 'networkidle' });

  assert.equal(await page.locator('#view-now').isVisible(), true, 'NOW must boot visibly');
  const app = await page.locator('.app').boundingBox();
  const nowCanvas = await page.locator('#nowChart').boundingBox();
  assert(app && app.width > 1200 && app.height > 760, 'desktop shell must fill the viewport');
  assert(nowCanvas && nowCanvas.width > 700 && nowCanvas.height > 400, 'V1 chart must be visible');
  assert.doesNotMatch(await page.locator('#nowWrap').innerText(), /failed|not defined|HTTP \d+/i);

  await page.locator('#hzs [data-h="5YR"]').click();
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForFunction(() => document.querySelector('#nowTitle')?.textContent.trim() === 'RSK');
  assert.equal((await page.locator('#nowTitle').innerText()).trim(), 'RSK');

  const spy = page.locator('#legend [data-id="spy"]');
  assert.equal(await spy.isEnabled(), true, 'SPY must be selectable at 5YR');
  await spy.click();
  await page.locator('#info').waitFor({ state: 'visible' });
  const info = await page.locator('#info').boundingBox();
  const chart = await page.locator('#nowWrap').boundingBox();
  assert(info && chart, 'component information card must be visible');
  assert(info.width > 500, 'component card must be a compact wide bridge, not a narrow side panel');
  assert(Math.abs((info.x + info.width / 2) - (chart.x + chart.width / 2)) < 24,
    'component card must be centered over the chart');
  assert(info.y > chart.y + chart.height * 0.4, 'component card must sit near the chart bottom');

  await page.locator('#moreInfo').click();
  await page.locator('#analysisModal').waitFor({ state: 'visible' });
  const analysisBody = await page.locator('.analysisBody').boundingBox();
  const analysisPlot = await page.locator('.analysisPlot').boundingBox();
  assert(analysisBody && analysisPlot && Math.abs(analysisBody.width - analysisPlot.width) < 3,
    'V3 must use the full analytical width');
  assert.equal(await page.locator('#analysisEvidence:not(.hidden)').count(), 0,
    'the rejected right evidence panel must remain absent');

  for (const id of ['qqq', 'wti']) {
    await page.locator('#addSeries').click();
    await page.locator('#pickerSearch').fill(id.toUpperCase());
    const add = page.locator(`#pickerList [data-add="${id}"]`);
    await add.waitFor({ state: 'visible' });
    assert.equal(await add.isEnabled(), true, `${id} must be selectable at 5YR`);
    await add.click();
  }
  assert.match(await page.locator('#axisBadge').innerText(), /Y1.*Y2/,
    'three series across exactly two measurement families must retain dual native axes');

  const analysisCanvas = page.locator('#analysisChart');
  const analysisBox = await analysisCanvas.boundingBox();
  await analysisCanvas.click({ position: { x: analysisBox.width * 0.62, y: analysisBox.height * 0.52 } });
  await page.locator('#analysisTip').waitFor({ state: 'visible' });
  assert.match(await page.locator('#analysisTip').innerText(), /idx\s+[\d,.]+\s+·\s+value\s+[\d,.]+/i,
    'point inspection must show normalized idx and native value');

  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('VIX');
  await page.locator('#pickerList [data-add="vix"]').click();
  assert.match(await page.locator('#axisBadge').innerText(), /Indexed 100/,
    'a third measurement family must move the analysis to Indexed 100');
  await page.locator('#seriesBar [data-rm="vix"]').click();
  assert.match(await page.locator('#axisBadge').innerText(), /Y1.*Y2/);

  await page.locator('#analysisHz [data-h="1D"]').click();
  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('CPI');
  const cpiAdd = page.locator('#pickerList [data-add="cpi"]');
  await cpiAdd.waitFor({ state: 'visible' });
  assert.equal(await cpiAdd.isEnabled(), false,
    'a series without a real observation in the selected horizon must not be selectable');
  await page.locator('#pickerClose').click();
  await page.locator('#analysisHz [data-h="5YR"]').click();
  assert.match(await page.locator('#axisBadge').innerText(), /Y1.*Y2/);

  await page.locator('#moreBtn').click();
  await page.locator('#moreAI').click();
  await requestStarted;

  const processing = await readRecords();
  assert.equal(processing.length, 1, 'Run AI must create one durable Analysis immediately');
  assert.equal(processing[0].status, 'processing');
  assert.equal(processing[0].state.chart.schema, 'market-navigator-chart-snapshot-v1');
  assert.equal(processing[0].state.chart.mode, 'dual');
  assert.equal(processing[0].state.chart.series.length, 3);
  assert(processing[0].state.chart.series.every(series => series.points.length > 0));
  assert(processing[0].state.chart.series.every(series =>
    series.points.every(point => Number.isFinite(point.idx) && Number.isFinite(point.raw))));
  assert(processing[0].state.chart.dataRevision, 'saved chart must identify its evidence revision');

  await page.locator('#libTitle').waitFor({ state: 'visible' });
  let completed = processing;
  for (let attempt = 0; attempt < 100 && completed[0]?.status === 'processing'; attempt++) {
    await page.waitForTimeout(100);
    completed = await readRecords();
  }
  assert.equal(completed[0]?.status, 'ready', JSON.stringify(completed[0]?.turns));
  assert.equal(completed[0]?.title, 'Oil and Equities Share a Two-Axis Signal');
  await page.waitForFunction(() => document.querySelector('#libTitle')?.value ===
    'Oil and Equities Share a Two-Axis Signal');
  assert.equal(await page.locator('#libChartPane').isVisible(), true,
    'Library must visibly render the saved chart');
  const libraryCanvas = await page.locator('#libChart').boundingBox();
  assert(libraryCanvas && libraryCanvas.width > 500 && libraryCanvas.height > 120,
    'Library chart must have usable geometry');
  assert.match(await page.locator('#libChartAxis').innerText(), /Y1 \+ Y2/);
  assert.match(await page.locator('#libChartMeta').innerText(), /5YR.*evidence/i);
  assert.match(await page.locator('#transcript').innerText(), /Oil and Equities Share a Two-Axis Signal/);

  const ready = await readRecords();
  assert.equal(ready[0].status, 'ready');
  const frozenChart = JSON.stringify(ready[0].state.chart);

  const libBox = await page.locator('#libChart').boundingBox();
  await page.locator('#libChart').click({ position: { x: libBox.width * 0.55, y: libBox.height * 0.5 } });
  await page.locator('#libChartTip').waitFor({ state: 'visible' });
  assert.match(await page.locator('#libChartTip').innerText(), /idx\s+[\d,.]+\s+·\s+value\s+[\d,.]+/i,
    'Library point inspection must use the same idx/native contract');

  await page.locator('#libTitle').fill('Energy and risk watch');
  await page.locator('#libTitle').press('Enter');
  await page.waitForFunction(() => document.querySelector('#libTitle')?.value === 'Energy and risk watch');
  const renamed = await readRecords();
  assert.equal(renamed[0].title, 'Energy and risk watch');
  assert.equal(renamed[0].titleManual, true);

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-view="library"]').click();
  await page.locator('#libChartPane').waitFor({ state: 'visible' });
  const restored = await readRecords();
  assert.equal(restored[0].title, 'Energy and risk watch');
  assert.equal(JSON.stringify(restored[0].state.chart), frozenChart,
    'reload must not reconstruct the saved chart from newer evidence');
  assert.match(await page.locator('#libChartMeta').innerText(), /5YR.*evidence/i);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#libList [data-id]').first().click();
  assert.equal(await page.locator('#libChartPane').isVisible(), true,
    'mobile Library detail must retain the chart');
  assert.equal(await page.locator('#transcript').isVisible(), true);
  assert.equal(await page.locator('#compose').isVisible(), true,
    'mobile Library must retain the sticky continuation composer');

  assert.deepEqual(errors, [], errors.join('\n'));
  assert.deepEqual(failedResources, [], failedResources.join('\n'));
  console.log('MARKET NAVIGATOR TURN 13: PASS');
} finally {
  await browser.close();
}
