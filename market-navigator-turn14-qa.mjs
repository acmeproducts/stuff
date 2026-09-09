import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const url = process.env.MARKET_NAVIGATOR_URL ||
  'http://127.0.0.1:8123/market-navigator-turn14-pre-ship.html';

// Turn 14 must first pass the complete Turn 13 product/persistence matrix.
process.env.MARKET_NAVIGATOR_URL = url;
await import('./market-navigator-turn13-qa.mjs');

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
const failedResources = [];

page.on('pageerror', error => errors.push(`page: ${error}`));
page.on('console', message => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('response', response => {
  if (response.status() >= 400) failedResources.push(`${response.status()} ${response.url()}`);
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
await page.route('https://openrouter.ai/api/v1/chat/completions', async route => {
  await new Promise(resolve => setTimeout(resolve, 250));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      choices: [{
        message: {
          content: '# Exact Visible Chart Analysis\n\n## Market read\n\nThis response is bound to the exact visible chart snapshot.\n\n## What changed\n\nThe derived index and governed sources retain their saved geometry.\n\n## Evidence quality/limitations\n\nOnly real observations are used.\n\n## Current context\n\nCurrent-web context is additive.\n\n## What to watch next\n\nWatch the saved relationships.'
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

async function waitForRecords(count) {
  let records = [];
  for (let attempt = 0; attempt < 80; attempt++) {
    records = await readRecords();
    if (records.length >= count && records.every(record => record.status !== 'processing')) return records;
    await page.waitForTimeout(100);
  }
  throw new Error(`Timed out waiting for ${count} completed analyses: ${JSON.stringify(records)}`);
}

async function downloadJSON(clickTarget) {
  const pending = page.waitForEvent('download');
  await clickTarget.click();
  const download = await pending;
  const path = await download.path();
  assert(path, 'download must produce a file');
  return JSON.parse(await readFile(path, 'utf8'));
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#view-now').isVisible(), true);

  const v1Legend = page.locator('#legend [data-id]');
  assert.equal(await v1Legend.count(), 3);
  assert.deepEqual(await v1Legend.evaluateAll(nodes => nodes.map(node => node.dataset.renderType)),
    ['bar', 'bar', 'bar'], 'V1 derived indices must all be columns');
  assert.equal(await page.locator('#nowChart').getAttribute('data-reference-outline'), 'risk',
    'V1 must render a white outline around the active column series');
  assert.equal(await page.locator('#legend [data-id="risk"]').evaluate(node =>
    getComputedStyle(node).borderTopColor), 'rgb(255, 255, 255)',
  'the active V1 legend chip must be white-keyed');

  // The settings gear owns ten persistent, editable, importable/exportable slots.
  await page.locator('#settingsGear').click();
  await page.locator('#settingsModal').waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-palette-slot]').count(), 10);
  assert.equal(await page.locator('[data-palette]').count(), 3);
  await page.locator('[data-palette-slot="9"]').evaluate(input => {
    input.value = '#123ABC';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.locator('#paletteSave').click();
  assert.match(await page.locator('#paletteStatus').innerText(), /saved/i);
  const paletteDownload = page.waitForEvent('download');
  await page.locator('#paletteExport').click();
  const paletteFile = await paletteDownload;
  assert.equal(paletteFile.suggestedFilename(), 'market-navigator-series-colors.json');
  const palettePath = await paletteFile.path();
  const exportedPalette = JSON.parse(await readFile(palettePath, 'utf8'));
  assert.equal(exportedPalette.colors.length, 10);
  assert.equal(new Set(exportedPalette.colors).size, 10);
  assert.equal(exportedPalette.colors[9], '#123ABC');

  const importedColors = [
    '#00E5FF', '#FFE45E', '#55EFC4', '#FF3B5C', '#B47CFF',
    '#FF8A00', '#4D96FF', '#FF5FD2', '#A8E10C', '#BFC9D4'
  ];
  await page.locator('#paletteImportInput').setInputFiles({
    name: 'scheme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      schema: 'market-navigator-series-palette-v1',
      name: 'Qualification import',
      colors: importedColors
    }))
  });
  await page.waitForFunction(() => /imported and saved/i.test(
    document.querySelector('#paletteStatus')?.textContent || ''
  ));
  assert.match(await page.locator('#paletteStatus').innerText(), /imported and saved/i);
  await page.locator('#settingsClose').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#settingsGear').click();
  assert.equal((await page.locator('[data-palette-slot="0"]').inputValue()).toUpperCase(), '#00E5FF');
  await page.locator('#settingsClose').click();

  // V1 exposes exact-state Analyze, Download and Print from one compact menu.
  await page.locator('#nowMoreBtn').click();
  assert.equal(await page.locator('#nowAnalyze').isVisible(), true);
  assert.equal(await page.locator('#nowDownload').isVisible(), true);
  assert.equal(await page.locator('#nowPrint').isVisible(), true);
  const v1State = await downloadJSON(page.locator('#nowDownload'));
  assert.equal(v1State.lineage, 'NOW-V1');
  assert.deepEqual(v1State.chart.series.map(series => series.renderType), ['bar', 'bar', 'bar']);
  assert(v1State.chart.series.every(series => series.points.length > 0));

  await page.evaluate(() => { window.print = () => { document.body.dataset.printed = 'yes'; }; });
  await page.locator('#nowMoreBtn').click();
  await page.locator('#nowPrint').click();
  assert.equal(await page.locator('body').getAttribute('data-printed'), 'yes');

  await page.locator('#nowMoreBtn').click();
  await page.locator('#nowAnalyze').click();
  await page.locator('#libChartPane').waitFor({ state: 'visible' });
  const v1Analyses = await waitForRecords(1);
  const savedV1 = v1Analyses.find(record => record.state.lineage === 'NOW-V1');
  assert(savedV1, 'V1 Analyze must create a durable Library record');
  assert.equal(savedV1.state.chart.origin, 'frozen-now');
  assert.deepEqual(savedV1.state.chart.series.map(series => series.renderType), ['bar', 'bar', 'bar']);
  assert.deepEqual(await page.locator('#libChartLegend [data-lib-series]').evaluateAll(nodes =>
    nodes.map(node => node.dataset.renderType)), ['bar', 'bar', 'bar']);

  // V2 is one derived-index column plus its governed component lines.
  await page.locator('[data-view="now"]').click();
  await page.locator('#hzs [data-h="5YR"]').click();
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForFunction(() => document.querySelector('#nowTitle')?.textContent.trim() === 'RSK');
  assert.equal(await page.locator('#legend [data-id="risk"]').getAttribute('data-render-type'), 'bar');
  const componentTypes = await page.locator('#legend [data-id]:not([data-id="risk"])').evaluateAll(nodes =>
    nodes.map(node => node.dataset.renderType));
  assert(componentTypes.length >= 6 && componentTypes.every(type => type === 'line'));

  const spy = page.locator('#legend [data-id="spy"]');
  await spy.click();
  assert.equal(await spy.evaluate(node => getComputedStyle(node).borderTopColor), 'rgb(255, 255, 255)');
  assert.equal(await page.locator('#nowChart').getAttribute('data-reference-outline'), 'spy');

  await page.locator('#nowMoreBtn').click();
  const v2State = await downloadJSON(page.locator('#nowDownload'));
  assert.equal(v2State.lineage, 'NOW-V2');
  assert.equal(v2State.chart.series[0].renderType, 'bar');
  assert(v2State.chart.series.slice(1).every(series => series.renderType === 'line'));

  await page.locator('#nowMoreBtn').click();
  await page.locator('#nowAnalyze').click();
  await page.locator('#libChartPane').waitFor({ state: 'visible' });
  const v2Analyses = await waitForRecords(2);
  const savedV2 = v2Analyses.find(record => record.state.lineage === 'NOW-V2');
  assert(savedV2, 'V2 Analyze must create a durable Library record');
  assert.equal(savedV2.state.chart.series[0].renderType, 'bar');
  assert(savedV2.state.chart.series.slice(1).every(series => series.renderType === 'line'));

  // V3 color identity survives deletion of earlier series.
  await page.locator('[data-view="now"]').click();
  await page.locator('#legend [data-id="spy"]').click();
  await page.locator('#moreInfo').click();
  for (const id of ['qqq', 'wti']) {
    await page.locator('#addSeries').click();
    await page.locator('#pickerSearch').fill(id.toUpperCase());
    await page.locator(`#pickerList [data-add="${id}"]`).click();
  }
  const colorsBefore = await page.locator('#seriesBar [data-id]').evaluateAll(nodes =>
    nodes.map(node => getComputedStyle(node.querySelector('.sw')).backgroundColor));
  assert.equal(new Set(colorsBefore).size, 3, 'all three active series colors must be unique');
  const wtiColor = await page.locator('#seriesBar [data-id="wti"] .sw').evaluate(node =>
    getComputedStyle(node).backgroundColor);
  await page.locator('#seriesBar [data-rm="spy"]').click();
  await page.locator('#seriesBar [data-rm="qqq"]').click();
  assert.equal(await page.locator('#seriesBar [data-id="wti"] .sw').evaluate(node =>
    getComputedStyle(node).backgroundColor), wtiColor,
  'deleting earlier series must not recolor the remaining series');
  assert.equal(await page.locator('#seriesBar [data-id="wti"]').evaluate(node =>
    getComputedStyle(node).borderTopColor), 'rgb(255, 255, 255)');
  assert.equal(await page.locator('#analysisChart').getAttribute('data-reference-outline'), 'wti');

  assert.deepEqual(errors, [], errors.join('\n'));
  assert.deepEqual(failedResources, [], failedResources.join('\n'));
  console.log('MARKET NAVIGATOR TURN 14: PASS');
} finally {
  await browser.close();
}
