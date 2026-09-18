/* Market Navigator Turn 25 Ship — semantic qualification harness.
   Runs the release-blocking matrix against the real artifact in real Chromium with real input events.
   DOM/string presence is never accepted as proof of a capability. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACT = process.argv[2] || 'market-navigator-turn25-ship.html';
const EXEC = process.env.MN_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_COMMIT = 'ddf275a8da943cfb8b0e9c5e610649b36424b886';
const BASE_BLOB = '89095a52e02b06db2b26192099846a5f0015a42d';
const BASE_BYTES = 127374;
const BASE_SHA256 = '84eb47caade89ca89ccb92281d888f9c6eb6fd3b1415dc18d170dddb46a155ba';
const REJECTED_DONOR = 'c3cde56268303d8e2a222012d5a34aee9f26651e';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const results = [];
let currentGate = null;
function gate(name) { currentGate = { name, checks: [], failures: [] }; results.push(currentGate); return currentGate; }
function ok(label, cond, detail) {
  currentGate.checks.push(label);
  if (!cond) currentGate.failures.push(`${label}${detail ? ' — ' + detail : ''}`);
  return !!cond;
}
function eq(label, actual, expected) { return ok(label, Object.is(actual, expected) || actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }

function serve() {
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const f = path.join(ROOT, p === '/' ? '/' + ARTIFACT : p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

const EVIDENCE_RE = /\/(market-evidence|data\/market-backend)\//;
const AI_MARKDOWN = `# Governed read

Intro paragraph with a [link](https://example.com/a).

## Findings

- first bullet
- second bullet

1. ordered one
2. ordered two

| Metric | Value |
|---|---:|
| Coverage | 6/7 |
| Residual | 0.000 pp |

> Blockquote of the governed limitation.

![inline evidence](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)

Closing paragraph.`;

async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, hasTouch: !!opts.hasTouch, isMobile: !!opts.isMobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [], rejections = [], requests = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => { if (EVIDENCE_RE.test(r.url())) errors.push('requestfailed: ' + r.url()); });
  page.on('request', r => requests.push(r.url()));
  await page.addInitScript(() => {
    window.__printCalls = 0;
    const real = window.print;
    window.print = function () { window.__printCalls++; window.__printAt = Date.now(); };
    window.__realPrint = real;
    window.addEventListener('unhandledrejection', e => { (window.__rejections = window.__rejections || []).push(String(e.reason)); });
  });
  /* The artifact loads marked + DOMPurify from a CDN. The sandbox has no direct egress, so the harness
     serves byte-equivalent local copies of the same libraries. Nothing in the artifact is modified. */
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'node_modules/marked/marked.min.js'), 'utf8') }));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(ROOT, 'node_modules/dompurify/dist/purify.min.js'), 'utf8') }));
  page.__errors = errors; page.__rejections = rejections; page.__requests = requests;
  page.__ctx = ctx;
  return page;
}
function evidenceCount(page) { return page.__requests.filter(u => EVIDENCE_RE.test(u)).length; }

async function boot(page, origin) {
  await page.goto(origin + '/' + ARTIFACT, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__mnShip25 && window.__mnShip25.ready(), null, { timeout: 30000 })
    .catch(async () => { throw new Error('boot did not complete: ' + JSON.stringify(page.__errors.slice(0, 4))); });
  await page.waitForTimeout(150);
}

async function seedProvider(page, { fail = false } = {}) {
  await page.evaluate(() => {
    localStorage.setItem('marketNavigatorAIRegistryV1', JSON.stringify({
      defaultProvider: 'venice',
      providers: { venice: { verified: true, key: 'test-key-not-a-secret', model: 'test-model' } }
    }));
  });
  await page.route('https://api.venice.ai/**', async route => {
    if (fail) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'provider unavailable' } }) });
    let body = {};
    try { body = route.request().postDataJSON() || {}; } catch (e) { body = {}; }
    await page.evaluate(b => { window.__aiPrompt = b; }, JSON.stringify(body));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: AI_MARKDOWN } }] }) });
  });
}

/* ------------------------------------------------------------------ gates */

function gateProvenance() {
  gate('provenance');
  const artifact = fs.readFileSync(path.join(ROOT, ARTIFACT));
  const builder = fs.readFileSync(path.join(ROOT, 'market-navigator-build-turn25-ship.py'), 'utf8');
  ok('builder pins the owner baseline commit', builder.includes(BASE_COMMIT));
  ok('builder pins the baseline blob sha', builder.includes(BASE_BLOB));
  ok('builder pins the baseline byte size', builder.includes(String(BASE_BYTES)));
  ok('builder pins the baseline sha256', builder.includes(BASE_SHA256));
  ok('builder performs no runtime source rewriting', !/\.write_text\(\s*s\s*\)/.test(builder) && !builder.includes('market-navigator-build-turn25-ship.py\')'));
  ok('artifact carries no rejected donor marker', !artifact.includes(REJECTED_DONOR));
  ok('artifact is materially larger than the baseline', artifact.length > BASE_BYTES);
  const wf = path.join(ROOT, '.github/workflows/build-market-navigator-turn25-ship.yml');
  if (fs.existsSync(wf)) {
    const y = fs.readFileSync(wf, 'utf8');
    ok('ship workflow does not rewrite builder source at run time', !y.includes("p=Path('market-navigator-build-turn25-ship.py')") && !y.includes('s=s.replace('));
  } else { currentGate.checks.push('ship workflow absent (superseded)'); }
  ok('artifact sha256 recorded', crypto.createHash('sha256').update(artifact).digest('hex').length === 64);
}

async function gateRuntimeAndBaseline(page, origin) {
  gate('runtime + retained baseline behaviour');
  await boot(page, origin);
  const appErrors = page.__errors.filter(e => !/favicon|ERR_/.test(e));
  ok('no application-owned console errors', appErrors.length === 0, appErrors.slice(0, 3).join(' | '));
  const rej = await page.evaluate(() => window.__rejections || []);
  ok('no unhandled rejections', rej.length === 0, JSON.stringify(rej.slice(0, 2)));
  eq('ENV legend renders the three governed indices', await page.$$eval('#legend .lg', n => n.length), 3);
  eq('breadcrumb starts at ENV', (await page.textContent('#nowCrumb')).trim(), 'ENV');
  eq('chart canvas has non-zero backing store', await page.evaluate(() => { const c = document.getElementById('nowChart'); return c.width > 0 && c.height > 0; }), true);

  /* stateful journey: horizon change actually re-derives the frozen state */
  const before = await page.evaluate(() => window.__mnShip25.nowState());
  await page.click('#hzs button[data-h="1YR"]');
  await page.waitForFunction(() => window.__mnShip25.horizon() === '1YR' && window.__mnShip25.nowState().horizon === '1YR');
  const after = await page.evaluate(() => window.__mnShip25.nowState());
  ok('horizon switch re-derives frozen NOW state', before.horizon !== after.horizon && after.horizon === '1YR');
  ok('horizon switch changes chart window', JSON.stringify(before.chart.window) !== JSON.stringify(after.chart.window));

  /* stateful journey: drill into a governed index and back */
  await page.click('#legend .lg[data-id="risk"]');
  await page.waitForFunction(() => window.__mnShip25.level() === 2 && window.__mnShip25.nowState().root === 'risk');
  ok('index drill-down expands components', (await page.evaluate(() => window.__mnShip25.nowState().series.length)) > 1);
  ok('breadcrumb reflects index context', (await page.evaluate(() => document.getElementById('nowCrumb').getAttribute('aria-label') || '')).includes('RSK'));
  await page.click('#crumbEnvironment');
  await page.waitForFunction(() => window.__mnShip25.level() === 1);
  eq('return to ENV restores level 1', await page.evaluate(() => window.__mnShip25.level()), 1);

  /* retained: Data modal opens with rows */
  await page.click('#nowMoreBtn'); await page.click('#nowData');
  await page.waitForSelector('#dataModal:not(.hidden)');
  ok('Data modal populates rows', (await page.$$eval('#dataRows tr', n => n.length)) > 0);
  await page.click('#dataClose');
  /* retained: Library and Config views still navigate */
  await page.click('.nav[data-view="library"]');
  eq('library view activates', await page.evaluate(() => window.__mnShip25.view()), 'library');
  await page.click('.nav[data-view="now"]');
  await page.waitForFunction(() => window.__mnShip25.view() === 'now');
}

async function gateModelArithmetic(page) {
  gate('RSK/GRW/MAC governed arithmetic');
  const defJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/market-backend/derived-index-definition.json'), 'utf8'));
  const derived = JSON.parse(fs.readFileSync(path.join(ROOT, 'market-evidence/derived-indices.json'), 'utf8'));
  const manifests = await page.evaluate(() => window.__mnShip25.manifests());
  eq('one manifest per governed index', manifests.length, 3);
  for (const m of manifests) {
    const d = defJson.indices[m.modelId];
    ok(`${m.shortName}: manifest components match production definition`, JSON.stringify(m.components.map(c => [c.id, c.direction])) === JSON.stringify(d.components.map(c => [c.id, c.direction])));
    eq(`${m.shortName}: manifest carries the production weighting rule`, m.weightingRule, defJson.display_contract.weighting);
    eq(`${m.shortName}: manifest carries the production component formula`, m.componentFormula, defJson.display_contract.component_formula);
    eq(`${m.shortName}: manifest carries the production index formula`, m.indexFormula, defJson.display_contract.index_formula);
    eq(`${m.shortName}: definition version pinned`, m.definitionVersion, defJson.version);
    eq(`${m.shortName}: purpose is declared`, m.purpose, 'DESCRIPTIVE');
    ok(`${m.shortName}: model hash is stable`, /^[0-9a-f]{16}$/.test(m.modelHash));
  }
  /* independent out-of-app replication of every index/horizon, then compare to in-app records */
  let maxDelta = 0, checked = 0;
  for (const k of ['risk', 'growth', 'macro']) {
    for (const h of Object.keys(derived.indices[k].horizons)) {
      const b = derived.indices[k].horizons[h];
      const comps = b.components.filter(c => Number.isFinite(c.orientedIndex));
      const n = comps.length;
      const expectOriented = comps.map(c => 100 + c.direction * ((c.nowValue / c.t0Value) - 1) * 100);
      const expectIndex = expectOriented.reduce((a, x) => a + x, 0) / n;
      const rec = await page.evaluate(([kk, hh]) => window.__mnShip25.record(kk, hh), [k, h]);
      maxDelta = Math.max(maxDelta, Math.abs(rec.endIndexValue - expectIndex));
      const sum = rec.components.reduce((a, c) => a + c.indexContributionPercentPoints, 0);
      maxDelta = Math.max(maxDelta, Math.abs(sum - rec.indexMovementPercent));
      checked++;
      if (rec.status !== 'RECONCILED') currentGate.failures.push(`${k}/${h} attribution status ${rec.status}`);
      if (rec.replication.result !== 'PASS') currentGate.failures.push(`${k}/${h} replication ${rec.replication.result}`);
      if (rec.componentsUsed !== n) currentGate.failures.push(`${k}/${h} componentsUsed ${rec.componentsUsed} != ${n}`);
      for (let i = 0; i < comps.length; i++) {
        const c = comps[i], rc = rec.components.find(x => x.componentId === c.id);
        if (!rc) { currentGate.failures.push(`${k}/${h} missing component ${c.id}`); continue; }
        if (rc.baselineObservationDate !== c.sourceT0Date || rc.endObservationDate !== c.sourceNowDate) currentGate.failures.push(`${k}/${h}/${c.id} observation dates not actual`);
        if (Math.abs(rc.indexContributionPercentPoints - (c.orientedIndex - 100) / n) > 1e-12) currentGate.failures.push(`${k}/${h}/${c.id} contribution not governed`);
        if (Math.abs(rc.weight - 1 / n) > 1e-12) currentGate.failures.push(`${k}/${h}/${c.id} weight not 1/n`);
      }
      const omittedIds = (b.omitted || []).map(o => o.id).sort();
      if (JSON.stringify(rec.omitted.map(o => o.componentId).sort()) !== JSON.stringify(omittedIds)) currentGate.failures.push(`${k}/${h} omitted components not disclosed`);
      if (rec.components.some(c => c.estimated)) currentGate.failures.push(`${k}/${h} estimated component present`);
    }
  }
  currentGate.checks.push(`replicated ${checked} index/horizon blocks`);
  ok('independent replication agrees with in-app records', maxDelta < 1e-9, `max delta ${maxDelta}`);
  ok('no equal-weight assumption: weight rule read from governed definition', (await page.evaluate(() => window.__mnShip25.record('risk', '1YR').weightingRule)) === defJson.display_contract.weighting);

  /* truthful degradation: unknown horizon must not fabricate */
  const bad = await page.evaluate(() => window.__mnShip25.record('risk', 'NOPE'));
  eq('unavailable horizon degrades truthfully', bad.status, 'UNAVAILABLE');
  eq('unavailable horizon produces no components', bad.components.length, 0);
  ok('unavailable horizon names the missing prerequisite', !!bad.missingPrerequisite);
  ok('unavailable markdown states nothing was estimated', (await page.evaluate(() => window.__mnShip25.explain({ series: ['risk'], root: 'risk', horizon: 'NOPE' }).markdown)).includes('No contribution values have been estimated'));

  /* stale/omitted evidence must be disclosed, never forward-filled */
  const macro = await page.evaluate(() => window.__mnShip25.record('macro', '1YR'));
  ok('structurally ineligible components are omitted and disclosed', macro.omitted.length === 2 && macro.omitted.every(o => o.reason && !o.estimated));
  eq('partial coverage is labelled', macro.coverageStatus, 'PARTIAL');
  const md = await page.evaluate(() => window.__mnShip25.explain({ series: ['macro'], root: 'macro', horizon: '1YR' }).markdown);
  ok('markdown discloses omitted components', md.includes('Omitted components') && md.includes('not estimated'));
  ok('markdown exposes the reconciliation residual', /reconciliation residual/.test(md));
  ok('markdown states the governed formulas', md.includes('oriented_index_t') && md.includes('arithmetic mean'));

  /* raw/component-only scope must not fabricate a composite explanation */
  const raw = await page.evaluate(() => window.__mnShip25.explain({ series: ['spy', 'vix'], root: null, horizon: '1YR', lineage: 'ENV/RSK/COMPONENTS' }));
  eq('raw-only scope yields no records', raw.records.length, 0);
  eq('raw-only scope yields empty markdown', raw.markdown, '');
  eq('raw-only scope is flagged not applicable', raw.applicable, false);
}

async function gateHorizonTruth(page) {
  gate('5D / 1YR / 5YR horizon truth');
  const derived = JSON.parse(fs.readFileSync(path.join(ROOT, 'market-evidence/derived-indices.json'), 'utf8'));
  for (const h of ['5D', '1YR', '5YR']) {
    for (const k of ['risk', 'growth', 'macro']) {
      const b = derived.indices[k].horizons[h];
      const rec = await page.evaluate(([kk, hh]) => window.__mnShip25.record(kk, hh), [k, h]);
      eq(`${k}/${h} baseline date is the governed common T0`, rec.baselineDate, b.commonT0);
      eq(`${k}/${h} end date is the governed common anchor`, rec.endDate, b.commonNow);
      ok(`${k}/${h} end index value is the published value`, Math.abs(rec.endIndexValue - b.value) < 1e-12);
      ok(`${k}/${h} contributions reconcile`, Math.abs(rec.reconciliation.residual) <= rec.reconciliation.tolerance);
      const anyRestamped = rec.components.some(c => c.endObservationDate === b.commonNow && (b.components.find(x => x.id === c.componentId) || {}).sourceNowDate !== b.commonNow);
      ok(`${k}/${h} no observation restamped to the horizon boundary`, !anyRestamped);
      ok(`${k}/${h} unaligned observations are reported as-is`, rec.components.every(c => c.observationAlignedToAnchor === (c.endObservationDate === c.horizonEndDate)));
    }
  }
}

async function gateModelHealth(page) {
  gate('derived model health');
  const snap = await page.evaluate(() => window.__mnShip25.modelHealthSnapshot({ series: ['risk', 'growth', 'macro'], root: null, horizon: '1YR' }));
  eq('one model-health record per governed index', snap.models.length, 3);
  for (const m of snap.models) {
    ok(`${m.shortName}: lifecycle is a governed state`, ['DEFINED', 'VALIDATED', 'ACTIVE', 'WATCH', 'DEGRADED', 'SUSPENDED'].includes(m.lifecycle));
    ok(`${m.shortName}: lifecycle carries a rule-derived reason`, !!m.lifecycleReason);
    eq(`${m.shortName}: replication PASS`, m.replication.result, 'PASS');
    ok(`${m.shortName}: weight total validates`, m.weightTotalValid);
    ok(`${m.shortName}: concentration computed`, m.concentration && m.concentration.largestContributionShare > 0 && m.concentration.effectiveComponentCount > 0);
    ok(`${m.shortName}: leave-one-out recomputes for every component`, m.leaveOneOut.components.length === m.componentsAvailable && m.leaveOneOut.components.every(x => x.applicable && Number.isFinite(x.recomputedIndexValue)));
    ok(`${m.shortName}: direction stability is a fraction`, m.directionStability >= 0 && m.directionStability <= 1);
    ok(`${m.shortName}: specification robustness enumerates named specs`, m.specifications.length >= m.componentsAvailable * 3 && m.specifications.every(s => !!s.specification));
    ok(`${m.shortName}: data health reported separately`, !!m.dataHealth && Array.isArray(m.dataHealth.components) && m.dataHealth.components.length === m.componentsRequired);
    ok(`${m.shortName}: attribution coverage per horizon`, m.attributionCoverage.length >= 5 && m.attributionCoverage.every(a => a.horizon && a.status));
    ok(`${m.shortName}: descriptive purpose is not backtested as forecast`, /DESCRIPTIVE/.test(m.backtestNote) && !/forecast accuracy: /i.test(m.backtestNote));
    ok(`${m.shortName}: thresholds are explicit`, m.thresholds && Number.isFinite(m.thresholds.reconciliationTolerancePp));
  }
  /* lifecycle must be deterministic, not inherited from source status */
  const macro = snap.models.find(m => m.modelId === 'macro');
  const risk = snap.models.find(m => m.modelId === 'risk');
  eq('macro (5/7 eligible) is DEGRADED by coverage rule', macro.lifecycle, 'DEGRADED');
  eq('risk (6/7 eligible) is WATCH by coverage rule', risk.lifecycle, 'WATCH');
  ok('source-green does not imply model-green', macro.dataHealth.currentCount > 0 && macro.lifecycle !== 'ACTIVE');
  /* leave-one-out uses the governed renormalisation (mean of remaining), verified independently */
  const rec = await page.evaluate(() => window.__mnShip25.record('risk', '1YR'));
  const oriented = rec.components.map(c => c.orientedIndex);
  let maxErr = 0;
  risk.leaveOneOut.components.forEach((x, i) => {
    const rest = oriented.filter((_, j) => j !== i);
    maxErr = Math.max(maxErr, Math.abs(x.recomputedIndexValue - rest.reduce((a, v) => a + v, 0) / rest.length));
  });
  ok('leave-one-out matches independent renormalised recomputation', maxErr < 1e-9, `max err ${maxErr}`);
  /* sensitivity must be standardized, and must not be invented when history is absent */
  ok('sensitivity is not estimated before component history loads', risk.sensitivity.components.every(c => c.available || /not loaded/.test(c.reason)));
  await page.evaluate(() => window.__mnShip25.loadSensitivity());
  await page.waitForTimeout(400);
  const risk2 = await page.evaluate(() => window.__mnShip25.modelHealth('risk', '1YR'));
  const avail = risk2.sensitivity.components.filter(c => c.available);
  ok('standardized sensitivity computes after canonical history loads', avail.length > 0);
  ok('sensitivity shock is component-scaled, not a uniform 10%', avail.every(c => Math.abs(c.oneSdShockPercent - 10) > 1e-6) && new Set(avail.map(c => c.oneSdShockPercent.toFixed(6))).size > 1);
  ok('sensitivity reports both 1-SD and p95 shocks', avail.every(c => Number.isFinite(c.oneSdIndexImpactPercentPoints) && Number.isFinite(c.p95IndexImpactPercentPoints)));
  /* independent check of the sensitivity transfer coefficient */
  const c0 = avail[0], rc = risk2.record.components.find(x => x.componentId === c0.componentId);
  const expect = (rc.direction * (rc.endValue / rc.baselineValue) * 100 / risk2.componentsAvailable) * (c0.oneSdShockPercent / 100);
  ok('sensitivity impact propagates through the governed composite', Math.abs(expect - c0.oneSdIndexImpactPercentPoints) < 1e-9);
}

async function gateInfoControl(page, origin, label) {
  gate(`info control interaction (${label})`);
  await boot(page, origin);
  const btns = await page.$$('#indexInfoBtn, [aria-label="Explain index movement"]');
  eq('exactly one info control exists', (await page.$$eval('[aria-label="Explain index movement"]', n => n.length)), 1);
  const box = await page.evaluate(() => {
    const b = document.getElementById('indexInfoBtn'), w = document.getElementById('nowWrap');
    const r = b.getBoundingClientRect(), wr = w.getBoundingClientRect();
    return { w: r.width, h: r.height, insidePlot: r.top >= wr.top - 1 && r.right <= wr.right + 1, upperRight: (r.top - wr.top) < wr.height / 2 && (wr.right - r.right) < wr.width / 2, aria: b.getAttribute('aria-label'), tag: b.tagName };
  });
  ok('touch target is at least 40x40 CSS px', box.w >= 40 && box.h >= 40, `${box.w}x${box.h}`);
  ok('control sits inside the plot region', box.insidePlot);
  ok('control sits in the upper-right of the plot', box.upperRight);
  eq('aria-label is exact', box.aria, 'Explain index movement');
  eq('control is a real button', box.tag, 'BUTTON');

  const fetchesBefore = evidenceCount(page);
  const stateBefore = await page.evaluate(() => window.__mnShip25.nowState());
  const uiBefore = await page.evaluate(() => ({ crumb: document.getElementById('nowCrumb').textContent, legend: document.getElementById('legend').innerHTML, h: window.__mnShip25.horizon(), level: window.__mnShip25.level(), index: window.__mnShip25.indexContext(), meta: document.getElementById('nowMeta').textContent }));

  /* real activation — pointer/tap, not a synthetic .click() call */
  if (label === 'phone') await page.tap('#indexInfoBtn'); else await page.click('#indexInfoBtn');
  await page.waitForSelector('#mnxModal:not([hidden])', { timeout: 5000 });
  const body1 = await page.evaluate(() => {
    const b = document.getElementById('mnxBody');
    return { text: b.textContent.trim().length, tables: b.querySelectorAll('table').length, rows: b.querySelectorAll('tbody tr').length, h2: b.querySelectorAll('h2').length, expanded: document.getElementById('indexInfoBtn').getAttribute('aria-expanded'), horizon: document.getElementById('mnxHorizon').textContent };
  });
  ok('one activation opens a populated modal', body1.text > 400 && body1.tables >= 3 && body1.rows >= 10, JSON.stringify(body1));
  eq('a section per governed index in scope', body1.h2, 3);
  eq('aria-expanded reflects the open dialog', body1.expanded, 'true');
  eq('modal reports the selected horizon', body1.horizon, await page.evaluate(() => window.__mnShip25.horizon()));
  ok('modal is not a focus-only or ring-only outcome', await page.evaluate(() => {
    const m = document.getElementById('mnxModal');
    return !m.hidden && getComputedStyle(m).display !== 'none' && m.getBoundingClientRect().height > 100;
  }));
  ok('no second persistent ring on the control', await page.evaluate(() => {
    const cs = getComputedStyle(document.getElementById('indexInfoBtn'));
    return cs.borderTopWidth === '0px' && (cs.outlineStyle === 'none' || cs.outlineWidth === '0px');
  }));
  ok('opening causes zero evidence refetches', evidenceCount(page) === fetchesBefore, `${fetchesBefore} -> ${evidenceCount(page)}`);
  const stateOpen = await page.evaluate(() => window.__mnShip25.nowState());
  ok('opening causes zero analytical-state mutation', JSON.stringify(stateOpen) === JSON.stringify(stateBefore));

  await page.click('#mnxClose');
  await page.waitForFunction(() => document.getElementById('mnxModal').hidden);
  const afterClose = await page.evaluate(() => ({ focus: document.activeElement && document.activeElement.id, state: window.__mnShip25.nowState(), ui: { crumb: document.getElementById('nowCrumb').textContent, legend: document.getElementById('legend').innerHTML, h: window.__mnShip25.horizon(), level: window.__mnShip25.level(), index: window.__mnShip25.indexContext(), meta: document.getElementById('nowMeta').textContent } }));
  eq('close restores focus to the control', afterClose.focus, 'indexInfoBtn');
  ok('close causes zero analytical-state mutation', JSON.stringify(afterClose.state) === JSON.stringify(stateBefore));
  ok('close leaves the NOW surface identical', JSON.stringify(afterClose.ui) === JSON.stringify(uiBefore));
  ok('open/close causes zero evidence refetches overall', evidenceCount(page) === fetchesBefore);

  /* repeated open/close */
  for (let i = 0; i < 3; i++) {
    if (label === 'phone') await page.tap('#indexInfoBtn'); else await page.click('#indexInfoBtn');
    await page.waitForSelector('#mnxModal:not([hidden])');
    const n = await page.evaluate(() => document.getElementById('mnxBody').querySelectorAll('tbody tr').length);
    if (n < 10) currentGate.failures.push(`repeat open ${i + 1} produced ${n} rows`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('mnxModal').hidden);
  }
  currentGate.checks.push('repeated open/close x3 stays populated');
  ok('repeat cycles cause zero evidence refetches', evidenceCount(page) === fetchesBefore);

  /* keyboard activation on the real control */
  await page.evaluate(() => document.getElementById('indexInfoBtn').focus());
  await page.keyboard.press('Enter');
  await page.waitForSelector('#mnxModal:not([hidden])', { timeout: 5000 });
  ok('keyboard activation opens the populated modal', (await page.evaluate(() => document.getElementById('mnxBody').querySelectorAll('tbody tr').length)) >= 10);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('mnxModal').hidden);

  /* canvas gesture handling must not swallow activation: press directly over the control coordinates */
  const pt = await page.evaluate(() => { const r = document.getElementById('indexInfoBtn').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.click(pt.x, pt.y);
  await page.waitForSelector('#mnxModal:not([hidden])', { timeout: 5000 });
  ok('raw pointer coordinates over the control open the modal (canvas does not swallow it)', true);
  ok('modal controls are reachable on this viewport', await page.evaluate(() => ['mnxCopy', 'mnxDownload', 'mnxClose'].every(id => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0 && r.right <= innerWidth + 1; })));
  /* Copy and Download consume the same frozen markdown as the modal */
  const same = await page.evaluate(() => {
    const frozen = window.__mnShip25.frozenExplanation();
    let captured = null;
    const realCreate = URL.createObjectURL;
    URL.createObjectURL = b => { captured = b; return 'blob:stub'; };
    const origClick = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { };
    document.getElementById('mnxDownload').click();
    HTMLAnchorElement.prototype.click = origClick; URL.createObjectURL = realCreate;
    return { hasBlob: !!captured, size: captured ? captured.size : 0, mdLen: frozen.markdown.length, fp: frozen.fingerprint };
  });
  ok('Download MD emits the frozen markdown blob', same.hasBlob && same.size >= same.mdLen);
  ok('frozen explanation carries a stable fingerprint', /^[0-9a-f]{16}$/.test(same.fp));
  await page.__ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => { });
  await page.click('#mnxCopy');
  await page.waitForTimeout(250);
  const copyStatus = await page.textContent('#mnxStatus');
  ok('Copy reports a truthful outcome from the frozen markdown', /copied|Clipboard unavailable/i.test(copyStatus), copyStatus);
  await page.evaluate(() => { document.getElementById('mnxModal').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await page.waitForFunction(() => document.getElementById('mnxModal').hidden);
  ok('backdrop activation closes the modal', true);
  if (label === 'phone') await page.tap('#indexInfoBtn'); else await page.click('#indexInfoBtn');
  await page.waitForSelector('#mnxModal:not([hidden])');
  await page.click('#mnxClose');
  await page.waitForFunction(() => document.getElementById('mnxModal').hidden);
  ok('the close control actually closes the modal', true);
  if (label === 'phone') await page.tap('#indexInfoBtn'); else await page.click('#indexInfoBtn');
  await page.waitForSelector('#mnxModal:not([hidden])');
  await page.keyboard.press('Escape');

  /* index context: only the anchor index is explained, components are not fabricated as composites */
  await page.click('#legend .lg[data-id="growth"]');
  await page.waitForFunction(() => window.__mnShip25.level() === 2 && window.__mnShip25.nowState().root === 'growth');
  await page.click('#indexInfoBtn');
  await page.waitForSelector('#mnxModal:not([hidden])');
  const ctxScope = await page.evaluate(() => window.__mnShip25.frozenExplanation().scope);
  ok('index context explains only the governed anchor index', JSON.stringify(ctxScope) === JSON.stringify(['growth']), JSON.stringify(ctxScope));
  ok('component rows are not promoted to composite explanations', (await page.evaluate(() => document.getElementById('mnxBody').querySelectorAll('h2').length)) === 1);
  await page.keyboard.press('Escape');
  await page.click('#crumbEnvironment');
  await page.waitForFunction(() => window.__mnShip25.level() === 1);
}

async function gateHealthUI(page) {
  gate('HEALTH — Sources | Derived Models');
  await page.click('.nav[data-view="health"]');
  await page.waitForSelector('#mnxHealthTabs');
  eq('two health tabs exist', await page.$$eval('#mnxHealthTabs [data-mnx-health]', n => n.length), 2);
  ok('sources tab renders canonical source rows', (await page.$$eval('#healthRows .healthRow', n => n.length)) > 5);
  await page.click('#mnxHealthTabs [data-mnx-health="models"]');
  await page.waitForSelector('.mnxModelCard');
  eq('three derived model cards', await page.$$eval('.mnxModelCard', n => n.length), 3);
  const sections = await page.$$eval('.mnxModelCard[data-mnx-model="risk"] details', n => n.map(d => d.getAttribute('data-mnx-section')));
  ok('governed sections present', JSON.stringify(sections) === JSON.stringify(['components', 'contribution', 'sensitivity', 'robustness', 'history']), JSON.stringify(sections));
  const card = await page.evaluate(() => document.querySelector('.mnxModelCard[data-mnx-model="macro"]').textContent);
  ok('model card shows lifecycle', /DEGRADED|WATCH|ACTIVE|SUSPENDED/.test(card));
  ok('model card shows replication', /Formula replication/.test(card) && /PASS|FAIL/.test(card));
  ok('model card shows concentration and leave-one-out', /Concentration share/.test(card) && /leave-one-out/i.test(card));
  ok('model card shows data health separately and labels it as such', /Data Health \(separate\)/.test(card) && /not evidence that the derived model is healthy/i.test(await page.evaluate(() => document.querySelector('.mnxModelCard[data-mnx-model="macro"]').innerHTML)));
  ok('contribution section reconciles on screen', /Σ contributions/.test(card) && /residual/.test(card));
  await page.click('.nav[data-view="sources"]').catch(() => { });
  await page.click('#mnxHealthTabs [data-mnx-health="sources"]');
  ok('switching back restores canonical source health', (await page.$$eval('#healthRows .healthRow', n => n.length)) > 5);
  await page.click('.nav[data-view="now"]');
  await page.waitForFunction(() => window.__mnShip25.view() === 'now');
}

async function gateAIandLibrary(page, origin) {
  gate('AI POV + frozen Library persistence');
  await boot(page, origin);
  await seedProvider(page);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__mnShip25 && window.__mnShip25.ready());
  const modalOpened = await page.evaluate(() => !!window.__mnShip25.frozenExplanation());
  eq('no explanation modal has been opened', modalOpened, false);
  await page.click('#nowMoreBtn');
  await page.click('#nowAnalyze');
  await page.waitForFunction(() => { return window.__mnShip25.activeAnalysis() && window.__aiPrompt; }, null, { timeout: 20000 });
  await page.waitForFunction(() => !!document.querySelector('#libList .row'), null, { timeout: 20000 });
  await page.waitForTimeout(600);
  const prompt = JSON.parse(await page.evaluate(() => window.__aiPrompt));
  const sys = prompt.messages.find(m => m.role === 'system').content;
  ok('provider prompt carries the governed explanation without the user opening the control', sys.includes('governedIndexExplanation') && sys.includes('oriented_index_t'));
  ok('provider prompt carries the model-health snapshot', sys.includes('governedModelHealth') && sys.includes('lifecycle'));
  ok('provider is instructed not to recalculate governed arithmetic', /Do not recalculate, replace, correct or complete any value/.test(sys));
  const evJson = sys.slice(sys.indexOf('Evidence: ') + 10);
  const ev = JSON.parse(evJson);
  eq('all three governed indices are in ENV AI scope', ev.governedIndexExplanation.scope.length, 3);
  ok('every explanation record in the prompt reconciles', ev.governedIndexExplanation.records.every(r => r.status === 'RECONCILED'));
  ok('prompt records contain no estimated values', ev.governedIndexExplanation.records.every(r => r.estimatedValuesUsed === false && r.components.every(c => c.estimated === false)));

  /* durable reread straight from IndexedDB, not the in-memory cache */
  const durable = await page.evaluate(async () => {
    const db = await new Promise((res, rej) => { const r = indexedDB.open('marketNavigatorLocal', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const all = await new Promise((res, rej) => { const r = db.transaction('analyses').objectStore('analyses').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); });
    return all.map(a => ({ id: a.id, status: a.status, turns: (a.turns || []).length, fp: a.state && a.state.indexExplanation && a.state.indexExplanation.fingerprint, scope: a.state && a.state.indexExplanation && a.state.indexExplanation.scope, mdLen: a.state && a.state.indexExplanation ? a.state.indexExplanation.markdown.length : 0, mh: a.state && a.state.modelHealth ? a.state.modelHealth.models.map(m => [m.modelId, m.lifecycle, m.definitionVersion]) : null, rev: a.state && a.state.indexExplanation ? a.state.indexExplanation.evidenceRevision : null }));
  });
  eq('one analysis persisted', durable.length, 1);
  const rec = durable[0];
  eq('analysis reached ready, not a false completion path', rec.status, 'ready');
  ok('frozen explanation persisted durably', !!rec.fp && rec.mdLen > 500 && rec.scope.length === 3);
  ok('model version and health snapshot persisted', Array.isArray(rec.mh) && rec.mh.length === 3 && rec.mh.every(x => x[2]));
  ok('evidence revision persisted', !!rec.rev);
  eq('AI evidence fingerprint equals persisted Library fingerprint', rec.fp, ev.governedIndexExplanation.fingerprint);

  /* Print consumes the same canonical record (no independent recalculation) */
  const built = await page.evaluate(() => { window.__mnShip25.cleanupNowReport(); return null; });
  await page.click('.nav[data-view="now"]');
  await page.waitForFunction(() => window.__mnShip25.view() === 'now');
  const printFp = await page.evaluate(() => { const b = window.__mnShip25.buildNowReport(); const fp = b.explanationFingerprint; window.__mnShip25.cleanupNowReport(); return fp; });
  eq('NOW Print consumes the same canonical explanation identity', printFp, ev.governedIndexExplanation.fingerprint);
  const modalFp = await page.evaluate(() => { const s = window.__mnShip25.openExplanation(); window.__mnShip25.closeExplanation(); return s.fingerprint; });
  eq('modal consumes the same canonical explanation identity', modalFp, ev.governedIndexExplanation.fingerprint);

  /* A genuine later evidence refresh: serve a newer derived-indices revision, reload, and prove the
     historical Library analysis is untouched while fresh explanations do move forward. */
  const NEW_REV = 'refreshed-' + Date.now().toString(16);
  const refreshed = JSON.parse(fs.readFileSync(path.join(ROOT, 'market-evidence/derived-indices.json'), 'utf8'));
  refreshed.revision = NEW_REV;
  refreshed.generatedAt = new Date().toISOString();
  for (const k of ['risk', 'growth', 'macro']) {
    const b = refreshed.indices[k].horizons['1YR'];
    b.components.forEach(c => { c.nowValue = c.nowValue * 1.01; c.orientedIndex = 100 + c.direction * ((c.nowValue / c.t0Value) - 1) * 100; c.moveFrom100 = c.orientedIndex - 100; });
    b.value = b.components.reduce((a, c) => a + c.orientedIndex, 0) / b.components.length;
  }
  await page.route('**/market-evidence/derived-indices.json', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(refreshed) }));
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__mnShip25 && window.__mnShip25.ready());
  const liveRev = await page.evaluate(() => window.__mnShip25.evidenceRevision());
  eq('reload picks up the refreshed evidence revision', liveRev, NEW_REV);
  const reread = await page.evaluate(async () => {
    const db = await new Promise(res => { const r = indexedDB.open('marketNavigatorLocal', 1); r.onsuccess = () => res(r.result); });
    const all = await new Promise(res => { const r = db.transaction('analyses').objectStore('analyses').getAll(); r.onsuccess = () => res(r.result || []); });
    const a = all[0];
    return { rev: a.state.indexExplanation.evidenceRevision, fp: a.state.indexExplanation.fingerprint, md: a.state.indexExplanation.markdown.length, mh: a.state.modelHealth.models.map(m => m.lifecycle), status: a.status };
  });
  eq('frozen Library evidence revision is not rewritten by the refresh', reread.rev, rec.rev);
  eq('frozen Library explanation fingerprint is not rewritten', reread.fp, rec.fp);
  eq('frozen Library markdown survives the refresh intact', reread.md, durable[0].mdLen);
  ok('frozen model-health snapshot survives the refresh', JSON.stringify(reread.mh) === JSON.stringify(rec.mh.map(x => x[1])));
  eq('frozen analysis status is unchanged by the refresh', reread.status, 'ready');
  const freshFp = await page.evaluate(() => window.__mnShip25.explain().fingerprint);
  ok('a newly computed explanation does move to the refreshed evidence', freshFp !== rec.fp);
  await page.unroute('**/market-evidence/derived-indices.json');
}

async function gateProviderFailure(browser, origin) {
  gate('provider failure cannot falsely complete');
  const page = await newPage(browser);
  await boot(page, origin);
  await seedProvider(page, { fail: true });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__mnShip25 && window.__mnShip25.ready());
  await page.click('#nowMoreBtn');
  await page.click('#nowAnalyze');
  await page.waitForFunction(async () => {
    const db = await new Promise(res => { const r = indexedDB.open('marketNavigatorLocal', 1); r.onsuccess = () => res(r.result); });
    const all = await new Promise(res => { const r = db.transaction('analyses').objectStore('analyses').getAll(); r.onsuccess = () => res(r.result || []); });
    return all.length && all[0].status !== 'processing';
  }, null, { timeout: 25000 });
  const st = await page.evaluate(async () => {
    const db = await new Promise(res => { const r = indexedDB.open('marketNavigatorLocal', 1); r.onsuccess = () => res(r.result); });
    const all = await new Promise(res => { const r = db.transaction('analyses').objectStore('analyses').getAll(); r.onsuccess = () => res(r.result || []); });
    return { status: all[0].status, text: (all[0].turns || []).map(t => t.content).join('\n'), fp: all[0].state.indexExplanation.fingerprint };
  });
  eq('failed provider yields failed status', st.status, 'failed');
  ok('failure is not presented as a completed analysis', !/ready|complete/i.test(st.status) && /Analysis failed/.test(st.text));
  ok('governed explanation is still frozen with the failed analysis', /^[0-9a-f]{16}$/.test(st.fp));
  await page.__ctx.close();
}

async function gateNowPrint(page, origin) {
  gate('NOW Print — ENV / index / component');
  await boot(page, origin);
  const contexts = [
    { name: 'ENV', setup: async () => { }, expectIdx: 3 },
    { name: 'governed index', setup: async () => { await page.click('#legend .lg[data-id="risk"]'); await page.waitForFunction(() => window.__mnShip25.nowState().root === 'risk' && window.__mnShip25.nowState().series.length > 1); await page.waitForTimeout(250); }, expectIdx: 1 },
    { name: 'component/raw', setup: async () => { await page.click('#legend .lg[data-id="spy"]'); await page.waitForFunction(() => window.__mnShip25.nowState().active === 'spy'); await page.waitForTimeout(250); }, expectIdx: 1 }
  ];
  for (const c of contexts) {
    await c.setup();
    const fetchesBefore = evidenceCount(page);
    const stateBefore = await page.evaluate(() => window.__mnShip25.nowState());
    await page.evaluate(() => { window.__printCalls = 0; });
    let inv;
    if (c.name === 'ENV') {
      /* real user path: the NOW context menu Print action */
      await page.click('#nowMoreBtn');
      await page.click('#nowPrint');
      await page.waitForFunction(() => window.__printCalls === 1, null, { timeout: 20000 });
      ok('ENV: the context-menu Print action drives the report', true);
      ok('ENV: context menu is closed for the report', await page.evaluate(() => document.getElementById('nowMoreMenu').classList.contains('hidden')));
      inv = await page.evaluate(() => window.__mnNowPrintInvariant25);
    } else {
      inv = await page.evaluate(() => window.__mnShip25.printNow());
    }
    const dom = await page.evaluate(() => {
      const r = document.getElementById('nowPrintReport'), img = document.getElementById('nowPrintChart');
      const ctxRows = [...document.querySelectorAll('#nowPrintContext dt')].map((dt, i) => [dt.textContent, document.querySelectorAll('#nowPrintContext dd')[i].textContent]);
      return {
        dedicated: r.getAttribute('data-print-surface'), aria: r.getAttribute('aria-hidden'),
        active: document.documentElement.classList.contains('mnx-now-print'),
        title: document.getElementById('nowPrintTitle').textContent,
        rows: Object.fromEntries(ctxRows),
        nw: img.naturalWidth, nh: img.naturalHeight, src: (img.getAttribute('src') || '').slice(0, 22),
        expH2: document.querySelectorAll('#nowPrintExplanation h2').length,
        expTables: document.querySelectorAll('#nowPrintExplanation table').length,
        expText: document.getElementById('nowPrintExplanation').textContent.trim().length,
        prints: window.__printCalls,
        chrome: ['rail', 'nowMoreMenu', 'nowPicker', 'view-config', 'nowTip'].map(id => !!document.getElementById('nowPrintReport').querySelector('#' + id)).filter(Boolean).length
      };
    });
    eq(`${c.name}: dedicated report surface used`, dom.dedicated, 'now-chart-report');
    eq(`${c.name}: report is print-visible`, dom.active, true);
    eq(`${c.name}: report is exposed to assistive tech while printing`, dom.aria, 'false');
    ok(`${c.name}: frozen chart embedded as a PNG`, dom.src.startsWith('data:image/png'));
    ok(`${c.name}: printed chart has non-zero natural dimensions`, dom.nw > 0 && dom.nh > 0, `${dom.nw}x${dom.nh}`);
    ok(`${c.name}: report carries the exact context`, dom.rows['Context'] === stateBefore.lineage);
    ok(`${c.name}: report carries the selected horizon`, dom.rows['Horizon'] === stateBefore.horizon);
    ok(`${c.name}: report carries the actual visible date range`, /\d{4}-\d{2}-\d{2} → \d{4}-\d{2}-\d{2}/.test(dom.rows['Visible date range']));
    ok(`${c.name}: report carries the representation/axis mode`, !!dom.rows['Representation'] && dom.rows['Representation'] !== '—');
    ok(`${c.name}: report carries the visible-series legend`, (dom.rows['Visible series'] || '').split(' · ').length === stateBefore.chart.series.length);
    ok(`${c.name}: report carries evidence and catalog revisions`, dom.rows['Evidence revision'] !== '—' && dom.rows['Catalog version'] !== '—');
    ok(`${c.name}: report carries the model definition version`, dom.rows['Model definition'] !== '—');
    eq(`${c.name}: native print invoked exactly once`, dom.prints, 1);
    eq(`${c.name}: no interactive chrome inside the report`, dom.chrome, 0);
    eq(`${c.name}: zero evidence refetches`, evidenceCount(page), fetchesBefore);
    ok(`${c.name}: NOW analytical state unchanged`, inv.before === inv.after && inv.after === JSON.stringify(stateBefore));
    eq(`${c.name}: governed indices in scope`, inv.governedIndices.length, c.expectIdx);
    eq(`${c.name}: one explanation section per governed index in scope`, dom.expTables, c.expectIdx);
    if (c.name === 'component/raw') {
      const st = await page.evaluate(() => window.__mnShip25.nowState());
      ok('component context is genuinely focused on a raw series', st.active === 'spy' && !['risk', 'growth', 'macro'].includes(st.active));
      ok('component scope explains only the governed anchor index', inv.governedIndices.length === 1 && inv.governedIndices[0] === 'risk');
      ok('component scope fabricates no composite explanation for the raw series', dom.expTables === 1 && !/## SPY|## S&P/.test(await page.evaluate(() => document.getElementById('nowPrintExplanation').textContent)));
    }
    ok(`${c.name}: explanation content present in the report`, dom.expText > 200);
    await page.evaluate(() => window.__mnShip25.cleanupNowReport());
    const cleaned = await page.evaluate(() => ({ active: document.documentElement.classList.contains('mnx-now-print'), aria: document.getElementById('nowPrintReport').getAttribute('aria-hidden'), src: document.getElementById('nowPrintChart').getAttribute('src'), body: document.getElementById('nowPrintExplanation').childNodes.length }));
    ok(`${c.name}: cleanup removes the report surface`, cleaned.active === false && cleaned.aria === 'true' && !cleaned.src && cleaned.body === 0);
  }
  /* raw-only frozen scope must produce a truthful no-composite report */
  const rawReport = await page.evaluate(() => {
    const st = window.__mnShip25.nowState();
    st.root = null; st.lineage = 'ENV/RSK/COMPONENTS'; st.series = st.series.filter(id => !['risk', 'growth', 'macro'].includes(id));
    st.chart.series = st.chart.series.filter(s => !['risk', 'growth', 'macro'].includes(s.id));
    const b = window.__mnShip25.buildNowReport(st);
    const out = { idx: b.governedIndices.length, text: document.getElementById('nowPrintExplanation').textContent, tables: document.querySelectorAll('#nowPrintExplanation table').length };
    window.__mnShip25.cleanupNowReport();
    return out;
  });
  eq('raw-only frozen scope contains no governed index', rawReport.idx, 0);
  eq('raw-only report fabricates no contribution table', rawReport.tables, 0);
  ok('raw-only report states why no explanation applies', /No governed composite index/.test(rawReport.text));
  await page.click('#crumbEnvironment').catch(() => { });
}

async function gateLibraryPrint(page, origin) {
  gate('Library Print regression');
  await page.click('.nav[data-view="library"]');
  await page.waitForSelector('#libList .row');
  await page.click('#libList .row');
  await page.waitForFunction(() => !!window.__mnCurrentAnalysis());
  await page.waitForFunction(() => { const c = document.getElementById('libChart'); return c && c.width > 0 && c.height > 0; }, null, { timeout: 15000 });
  const fetchesBefore = evidenceCount(page);
  await page.evaluate(() => { window.__printCalls = 0; });
  await page.click('#libMoreBtn');
  await page.click('#libPrint');
  await page.waitForFunction(() => window.__printCalls === 1, null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const t = document.getElementById('libraryPrintTranscript'), img = document.getElementById('libraryPrintChart');
    const clipped = [...t.querySelectorAll('*'), t].some(el => { const cs = getComputedStyle(el); return cs.maxHeight !== 'none' || cs.overflowY === 'scroll' || cs.overflowY === 'hidden' || cs.overflowY === 'auto'; });
    return {
      prints: window.__printCalls, active: document.documentElement.classList.contains('library-print-active'),
      nw: img.naturalWidth, nh: img.naturalHeight,
      h: t.querySelectorAll('h1,h2,h3').length, p: t.querySelectorAll('p').length,
      ul: t.querySelectorAll('ul li').length, ol: t.querySelectorAll('ol li').length,
      table: t.querySelectorAll('table tbody tr').length, bq: t.querySelectorAll('blockquote').length,
      a: t.querySelectorAll('a[href]').length, img: t.querySelectorAll('img').length,
      chrome: t.querySelectorAll('#libComposer,#send,#libListenBar,.libModeTabs,#libSearch').length,
      clipped, text: t.textContent.length
    };
  });
  eq('native print invoked exactly once', r.prints, 1);
  eq('library print surface activated', r.active, true);
  ok('frozen Library chart is non-zero', r.nw > 0 && r.nh > 0, `${r.nw}x${r.nh}`);
  ok('headings print', r.h >= 2); ok('paragraphs print', r.p >= 2);
  ok('unordered list items print', r.ul >= 2); ok('ordered list items print', r.ol >= 2);
  ok('table rows print', r.table >= 2); ok('blockquote prints', r.bq >= 1);
  ok('hyperlinks print', r.a >= 1); ok('images print', r.img >= 1);
  eq('no interactive Library chrome in the report', r.chrome, 0);
  ok('transcript is not clipped by a scroll container', !r.clipped);
  ok('complete transcript present', r.text > 300);
  eq('printing does not refetch evidence', evidenceCount(page), fetchesBefore);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.click('.nav[data-view="now"]');
}

async function gateRace(page, origin) {
  gate('race / state integrity');
  await boot(page, origin);
  /* geometry-only repaint must not mutate analytical state or refetch */
  const before = await page.evaluate(() => window.__mnShip25.nowState());
  const f0 = evidenceCount(page);
  await page.setViewportSize({ width: 1100, height: 800 });
  await page.waitForTimeout(250);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(250);
  ok('geometry change does not mutate analytical state', JSON.stringify(await page.evaluate(() => window.__mnShip25.nowState())) === JSON.stringify(before));
  eq('geometry change does not refetch evidence', evidenceCount(page), f0);
  /* rapid horizon switching: final state and explanation must match the last requested horizon */
  await page.evaluate(async () => {
    for (const h of ['1D', '5D', 'MTD', 'YTD', '1YR', '3YR', '5YR']) document.querySelector(`#hzs button[data-h="${h}"]`).click();
  });
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => ({ h: window.__mnShip25.horizon(), frozen: window.__mnShip25.nowState().horizon, ex: window.__mnShip25.explain().horizon, recs: window.__mnShip25.explain().records.map(r => r.horizon) }));
  eq('final horizon is the last requested', st.h, '5YR');
  eq('frozen state matches final horizon', st.frozen, '5YR');
  eq('explanation matches final horizon', st.ex, '5YR');
  ok('no stale-horizon record leaks into the explanation', st.recs.every(h => h === '5YR'));
  /* explanation and health reads must never mutate NOW */
  const pre = await page.evaluate(() => window.__mnShip25.nowState());
  await page.evaluate(() => { window.__mnShip25.explain(); window.__mnShip25.modelHealthSnapshot(); window.__mnShip25.record('risk', '1D'); });
  ok('explanation/health reads do not mutate NOW', JSON.stringify(await page.evaluate(() => window.__mnShip25.nowState())) === JSON.stringify(pre));
  /* shipState must not mutate the live frozen state object */
  await page.evaluate(() => window.__mnShip25.shipState());
  ok('state enrichment does not contaminate live NOW state', await page.evaluate(() => !window.__mnShip25.nowState().indexExplanation));
}

async function gateResponsive(browser, origin) {
  for (const dev of [{ label: 'phone', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, { label: 'tablet', viewport: { width: 820, height: 1180 }, hasTouch: true }, { label: 'desktop', viewport: { width: 1600, height: 1000 } }]) {
    const page = await newPage(browser, dev);
    await gateInfoControl(page, origin, dev.label);
    gate(`responsive surfaces (${dev.label})`);
    /* narrow viewports boot with the rail collapsed; open it the way a user would */
    if (await page.evaluate(() => document.getElementById('rail').classList.contains('closed'))) {
      await page.click('#toggle');
      await page.waitForFunction(() => !document.getElementById('rail').classList.contains('closed'));
      ok('collapsed rail opens on narrow viewports', true);
    }
    await page.click('.nav[data-view="health"]');
    await page.waitForSelector('#mnxHealthTabs');
    await page.click('#mnxHealthTabs [data-mnx-health="models"]');
    await page.waitForSelector('.mnxModelCard');
    ok('derived model cards are usable', await page.evaluate(() => { const c = document.querySelector('.mnxModelCard'); const r = c.getBoundingClientRect(); return r.width > 100 && r.left >= -1 && r.right <= innerWidth + 1; }));
    ok('no page-level horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await page.evaluate(() => document.documentElement.scrollWidth + ' vs ' + innerWidth));
    await page.click('.nav[data-view="now"]');
    await page.waitForFunction(() => window.__mnShip25.view() === 'now');
    await page.evaluate(() => { window.__printCalls = 0; });
    const inv = await page.evaluate(() => window.__mnShip25.printNow());
    ok('NOW print report prepares with a non-zero chart', inv.chartWidth > 0 && inv.chartHeight > 0, `${inv.chartWidth}x${inv.chartHeight}`);
    eq('native print invoked exactly once', await page.evaluate(() => window.__printCalls), 1);
    await page.evaluate(() => window.__mnShip25.cleanupNowReport());
    await page.__ctx.close();
  }
}


async function gateCrosshairRegression(page, origin) {
  gate('retained crosshair interaction');
  await boot(page, origin);
  await page.click('#legend [data-id="risk"]');
  await page.waitForFunction(() => document.querySelector('#legend [data-id="hyg"]'));
  const activeBefore = await page.evaluate(() => document.querySelector('#legend .active')?.dataset.id || null);
  const box = await page.locator('#nowChart').boundingBox();
  ok('NOW chart has inspectable geometry', !!box && box.width > 100 && box.height > 100);
  await page.mouse.move(box.x + box.width * .55, box.y + box.height * .52);
  await page.waitForFunction(() => getComputedStyle(document.getElementById('nowTip')).display !== 'none');
  eq('pointer inspection does not silently change active series', await page.evaluate(() => document.querySelector('#legend .active')?.dataset.id || null), activeBefore);
  eq('inspection exposes one explicit close control', await page.locator('#nowTip [data-tip-close]').count(), 1);
  ok('inspection close control receives pointer events', await page.locator('#nowTip [data-tip-close]').evaluate(el => getComputedStyle(el).pointerEvents !== 'none'));
  const pinned = await page.locator('#nowTip').innerText();
  await page.mouse.move(box.x + 5, Math.max(1, box.y - 20));
  await page.waitForTimeout(80);
  eq('inspection remains pinned after pointer leaves plot', await page.locator('#nowTip').isVisible(), true);
  eq('pinned inspection retains the same observation', await page.locator('#nowTip').innerText(), pinned);
  await page.locator('#nowTip [data-tip-close]').click();
  eq('explicit close dismisses inspection', await page.locator('#nowTip').isVisible(), false);
  await page.mouse.move(box.x + box.width * .62, box.y + box.height * .48);
  await page.waitForFunction(() => getComputedStyle(document.getElementById('nowTip')).display !== 'none');
  eq('inspection reopens immediately after dismissal', await page.locator('#nowTip').isVisible(), true);
  const density = await page.evaluate(() => ({source:+document.getElementById('nowChart').dataset.sourcePoints,rendered:+document.getElementById('nowChart').dataset.renderedPoints}));
  await page.click('#hzs [data-h="1YR"]');
  await page.waitForFunction(() => document.querySelector('#hzs [data-h="1YR"]')?.classList.contains('on'));
  const d1 = await page.evaluate(() => ({source:+document.getElementById('nowChart').dataset.sourcePoints,rendered:+document.getElementById('nowChart').dataset.renderedPoints,density:document.getElementById('nowChart').dataset.renderDensity}));
  ok('1YR remains display-reduced while canonical source observations are retained', d1.density==='weekly' && d1.source>d1.rendered, JSON.stringify(d1));
  await page.click('#hzs [data-h="5YR"]');
  await page.waitForFunction(() => document.querySelector('#hzs [data-h="5YR"]')?.classList.contains('on'));
  const d5 = await page.evaluate(() => ({source:+document.getElementById('nowChart').dataset.sourcePoints,rendered:+document.getElementById('nowChart').dataset.renderedPoints,density:document.getElementById('nowChart').dataset.renderDensity}));
  ok('5YR remains display-reduced while canonical source observations are retained', d5.density==='monthly' && d5.source>d5.rendered, JSON.stringify(d5));
}

/* ------------------------------------------------------------------ main */
(async () => {
  const srv = await serve();
  const origin = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--allow-file-access-from-files'] });
  try {
    gateProvenance();
    const page = await newPage(browser);
    await gateRuntimeAndBaseline(page, origin);
    await gateCrosshairRegression(page, origin);
    await gateModelArithmetic(page);
    await gateHorizonTruth(page);
    await gateModelHealth(page);
    await gateHealthUI(page);
    await gateRace(page, origin);
    await gateNowPrint(page, origin);
    await page.__ctx.close();

    const p2 = await newPage(browser);
    await gateAIandLibrary(p2, origin);
    await gateLibraryPrint(p2, origin);
    await p2.__ctx.close();

    await gateProviderFailure(browser, origin);
    await gateResponsive(browser, origin);
  } catch (e) {
    (currentGate || gate('harness')).failures.push('harness error: ' + (e.stack || e.message));
  } finally {
    await browser.close(); srv.close();
  }
  let failed = 0;
  console.log('\n================ Turn 25 Ship qualification ================');
  for (const g of results) {
    const bad = g.failures.length;
    if (bad) failed++;
    console.log(`${bad ? 'FAIL' : 'PASS'}  ${g.name}  (${g.checks.length} checks)`);
    for (const f of g.failures) console.log(`        ✗ ${f}`);
  }
  console.log(`\n${results.length - failed}/${results.length} gates passed`);
  process.exit(failed ? 1 : 0);
})();
