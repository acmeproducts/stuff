import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const base = fs.readFileSync('market-navigator-turn28-ship.html');
const cand = fs.readFileSync('market-navigator-turn34-pre-ship.html');
assert.deepEqual(cand, base, 'rollback candidate must be byte-identical to accepted Turn28');

const url = process.env.MARKET_NAVIGATOR_URL || 'http://127.0.0.1:8123/market-navigator-turn34-pre-ship.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js', r => r.fulfill({ body: "window.marked={parse:s=>s}" }));
await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js', r => r.fulfill({ body: 'window.DOMPurify={sanitize:s=>s}' }));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__mnShip25?.ready?.() && document.querySelector('#nowChart'));

const before = await page.evaluate(() => ({
  canvas: !!document.querySelector('#nowChart'),
  legend: document.querySelectorAll('#legend [data-id]').length,
  add: !!document.querySelector('#nowAddSeries'),
  display: !!document.querySelector('#nowIndexDisplay'),
  horizon: window.__mnShip25?.horizon?.()
}));
assert(before.canvas, 'NOW chart missing');
assert(before.legend > 0, 'NOW legend missing');
assert(before.add, 'NOW Add control missing');
assert(before.display, 'NOW display selector missing');

const currentH = before.horizon;
const target = currentH === '1YR' ? '3YR' : '1YR';
const hbtn = page.locator('[data-h]').filter({ hasText: target }).first();
if (await hbtn.count()) {
  await hbtn.click();
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => window.__mnShip25?.horizon?.()), target, 'NOW horizon interaction failed');
}

const legend = page.locator('#legend [data-id]:not([disabled])');
if (await legend.count() > 1) {
  const id = await legend.nth(1).getAttribute('data-id');
  await legend.nth(1).click();
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => window.__mnShip25?.nowState?.()?.active), id, 'NOW legend activation failed');
}

assert.equal(errors.length, 0, errors.join(' | '));
console.log('PASS Turn34 rollback: exact Turn28 bytes + NOW runtime smoke');
await context.close();
await browser.close();
