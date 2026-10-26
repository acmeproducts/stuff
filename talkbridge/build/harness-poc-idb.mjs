#!/usr/bin/env node
/* IndexedDB PROOF gate (plan §7.23) — the standalone page talkbridge/poc/idb/index.html in REAL Chromium (Playwright, the machine's
   global install; TB_PLAYWRIGHT overrides), served over http from a local server (a real origin: quota and storage behave as on a site).
   The device log is never posted to: every /log request is answered here and inspected. Safari is proven only on the owner's phones.
   Usage: node talkbridge/build/harness-poc-idb.mjs [--page <html>] [--quiet]   (--page: a mutated copy served at the same path) */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2); const quiet = args.includes('--quiet');
const pageArg = args.indexOf('--page') >= 0 ? args[args.indexOf('--page') + 1] : null;
const PAGE_PATH = '/stuff/talkbridge/poc/idb/index.html';
const pageHtml = fs.readFileSync(pageArg || path.join(root, 'talkbridge/poc/idb/index.html'), 'utf8');
const CHROME = process.env.TB_CHROME || (() => { const base = '/opt/pw-browsers'; try { const d = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().pop(); if (d) return path.join(base, d, 'chrome-linux', 'chrome'); } catch (_) {} return 'chromium'; })();
const pw = process.env.TB_PLAYWRIGHT || path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright', 'index.mjs');
const { chromium } = await import(pw);

/* a tiny site: the page (or its mutated copy), its manifest, the icons; everything else 404 */
const server = http.createServer((q, s) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === PAGE_PATH || u.pathname === '/stuff/talkbridge/poc/idb/') { s.writeHead(200, { 'Content-Type': 'text/html' }); s.end(pageHtml); return; }
  const f = path.join(root, u.pathname.replace(/^\/stuff\//, ''));
  if (u.pathname.startsWith('/stuff/') && fs.existsSync(f) && fs.statSync(f).isFile()) { s.writeHead(200); s.end(fs.readFileSync(f)); return; }
  s.writeHead(404); s.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port;
const URL0 = ORIGIN + '/stuff/talkbridge/poc/idb/';

let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const ok = (c, m) => { if (!c) throw new Error(m); };

/* the app's own data, as a phone would hold it: three rooms (with text that must never reach the log), one broken, one empty */
const SECRET = 'ZZSECRET';
const appRooms = { 'tba_tr_room-a1': JSON.stringify(Array.from({ length: 120 }, (_, i) => ({ id: 'a' + i, kind: 'chat', who: i % 2 ? 'me' : 'partner', sourceText: SECRET + ' hello ' + i, translatedText: SECRET + ' สวัสดี ' + i, ts: 1760000000000 + i }))),
  'tba_tr_room-b2': JSON.stringify([{ id: 'b0', kind: 'sys', key: 'pill_joined', vars: { who: SECRET }, ts: 1 }, { id: 'b0', kind: 'chat', sourceText: SECRET + ' dup id', ts: 2 }, { kind: 'sys', key: 'x', ts: 3 }]),
  'tba_tr_room-c3': JSON.stringify(Array.from({ length: 900 }, (_, i) => ({ id: 'c' + i, kind: 'chat', sourceText: SECRET + ' ' + 'x'.repeat(200), attachment: i === 5 ? { kind: 'image', data: 'data:image/png;base64,' + 'A'.repeat(50000) } : null, ts: i }))),
  'tba_tr_room-d4': '{"broken":', 'tba_tr_room-e5': '[]', 'tba_rooms': JSON.stringify([{ id: 'room-a1', title: SECRET }]), 'tb_devlog_name': 'iphone-tst' };

async function context(browser, seed) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const logs = [], requests = [];
  await ctx.route('**/*', (r) => { const u = r.request().url(); requests.push(u); if (/\/log$/.test(u)) { try { logs.push(JSON.parse(r.request().postData() || '{}')); } catch (_) { logs.push({ bad: true }); } return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); } return r.continue(); });
  if (seed) { await ctx.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { for (const k in s) localStorage.setItem(k, s[k]); sessionStorage.setItem('__seeded', '1'); } }, seed); }
  return { ctx, logs, requests };
}
const lsSnapshot = (page) => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });

const browser = await chromium.launch({ executablePath: CHROME });
let R, C, Q, K;
try {
  /* RUN ALL on a phone that holds the app's chats in the old storage */
  C = await context(browser, appRooms);
  const page = await C.ctx.newPage();
  await page.goto(URL0 + '?mb=30&capms=90000');
  const before = await lsSnapshot(page);
  await page.click('#run');
  await page.waitForFunction(() => window.POC_DONE, null, { timeout: 300000 });
  R = await page.evaluate(() => ({ done: window.POC_DONE, results: window.POC.results, dbs: indexedDB.databases ? null : null, ss: sessionStorage.length }));
  R.dbs = await page.evaluate(() => indexedDB.databases().then((l) => l.map((x) => x.name)));
  R.before = before; R.after = await lsSnapshot(page);
  R.sw = await page.evaluate(() => navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then((r) => r.length) : 0);
  await C.ctx.close();

  /* TWO PAGES writing at once (the installed app and a tab share one store on Android) */
  Q = await context(browser, null);
  const p1 = await Q.ctx.newPage(), p2 = await Q.ctx.newPage();
  await p1.goto(URL0); await p2.goto(URL0);
  const fire = (p, tagx) => p.evaluate((t) => { const ps = []; for (let i = 0; i < 200; i++) ps.push(window.POC.api.append('shared', { id: t + i, ts: i })); return Promise.all(ps).then(() => 'ok'); }, tagx);
  await Promise.all([fire(p1, 'one-'), fire(p2, 'two-')]);
  Q.rows = await p1.evaluate(() => window.POC.api.all('shared').then((v) => v.map((x) => [x.seq, x.id])));
  await p1.evaluate(() => window.POC.api.wipe());
  await Q.ctx.close();
} catch (e) { console.log('FAIL  the browser run — ' + (e && e.message)); fail++; }

/* QUOTA: the store is held to 3 MB (the phone that is full); the error is caught and every committed batch survives */
try {
  const qc = await context(browser, null);
  const qp = await qc.ctx.newPage(); await qp.goto(URL0);
  const cdp = await qc.ctx.newCDPSession(qp);
  await cdp.send('Storage.overrideQuotaForOrigin', { origin: ORIGIN, quotaSize: 3 * 1048576 });
  await qp.evaluate(() => window.POC.api.wipe().then(() => window.POC.runP2()));
  K = await qp.evaluate(() => window.POC.results.P2 || null);
  await qc.ctx.close();
} catch (e) { K = { harnessError: e && e.message }; }

/* KILL: the browser process is killed after the writes committed; a fresh browser on the same profile finds them all */
let KILL = null;
try {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tbpoc-kill-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  const launch = () => spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--user-data-dir=' + dir, '--remote-debugging-port=' + port, 'about:blank'], { stdio: 'ignore' });
  const connect = async () => { for (let i = 0; i < 50; i++) { try { return await chromium.connectOverCDP('http://127.0.0.1:' + port); } catch (_) { await new Promise((r) => setTimeout(r, 200)); } } throw new Error('no CDP'); };
  let proc = launch(); let b = await connect();
  let ctx = b.contexts()[0]; let pg = await ctx.newPage();
  await pg.route('**/log', (r) => r.fulfill({ status: 204 }));
  await pg.goto(URL0 + '?log=off');
  await pg.evaluate(() => window.POC.api.killPrep());
  proc.kill('SIGKILL'); await new Promise((r) => proc.on('exit', r));
  proc = launch(); b = await connect(); ctx = b.contexts()[0]; pg = await ctx.newPage();
  await pg.goto(URL0 + '?log=off');
  await pg.waitForFunction(() => window.POC.results.P4b, null, { timeout: 20000 });
  KILL = await pg.evaluate(() => window.POC.results.P4b);
  await b.close().catch(() => {}); proc.kill('SIGKILL');
  await new Promise((r) => setTimeout(r, 300)); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
} catch (e) { KILL = { harnessError: e && e.message }; }
await browser.close(); server.close();

/* the results as the builder reads them on a phone: the poc_result rows of the device log (the page reloads itself in P4) */
const res = (id) => { const r = (C ? C.logs : []).flatMap((b) => b.rows || []).filter((x) => x.e === 'poc_result' && x.d && x.d.id === id).pop(); return r ? { pass: r.d.pass === true, d: r.d } : {}; };
const allRows = () => (C ? C.logs : []).flatMap((b) => b.rows || []);
await T('P1 the store opens with its three stores', () => ok(res('P1').pass, JSON.stringify(res('P1'))));
await T('P2 room for far more than the old storage: ≥ 25 MB stored with no error, every batch read back (the old storage holds ~5 MB)', () => ok(res('P2').pass && res('P2').d.storedMB >= 25 && res('P2').d.readBack === res('P2').d.written, JSON.stringify(res('P2').d)));
await T('P3 the chat pattern: newest 50 by a reverse read; 200 appends at once all land in order; a read started before a write completes sees it; two writers at once; a duplicate id refused; a receipt updates in place; a 1 MB message', () => { const d = res('P3').d || {}; ok(res('P3').pass && d.burst && d.ryw && d.twoWriters && d.dupRefused && d.update && d.big1MB, JSON.stringify(d)); });
await T('P4 a reload in the middle of 100 writes: every write that COMPLETED is there, no gap', () => ok(res('P4').pass && res('P4').d.stored >= res('P4').d.committed && res('P4').d.committed >= 40, JSON.stringify(res('P4').d)));
await T('P5 the app\'s chats copied from the old storage, READ ONLY: equal message for message (a duplicate id kept and counted), the broken one skipped, a re-run changes nothing, a grown room updated whole, a room cut off halfway absent, a stop mid-run then a full run complete', () => { const d = res('P5').d || {}; ok(res('P5').pass && d.realRooms === 5 && d.equal && d.bad === 1 && d.badSrc === 1 && d.rerunSame && d.grew && d.cutAbsent && d.dupIds === 1, JSON.stringify(d)); });
await T('P6 the connection closed under it, and Safari\'s "UnknownError": the next write reopens and succeeds (one retry each)', () => ok(res('P6').pass && res('P6').d.retries === 2, JSON.stringify(res('P6').d)));
await T('P10 an upgrade with data inside while the old connection is open: the old one steps aside, nothing blocked, the data intact, the new index there', () => ok(res('P10').pass && res('P10').d.blocked === 0, JSON.stringify(res('P10').d)));
await T('P8 the run ends with the test store deleted (no database left behind)', () => ok(res('P8').pass && R.dbs.indexOf('tb-poc-idb') === -1, JSON.stringify(R && R.dbs)));
await T('RUN every check passed on the run', () => ok(R && R.done && R.done.failed.length === 0, JSON.stringify(R && R.done)));
await T('S1 THE APP IS UNTOUCHED: localStorage after the run is exactly what it was — same keys, same bytes, nothing added or removed; sessionStorage unused', () => {
  /* against the SEED (what the phone held before the page ever loaded), so a write at load is caught too */
  const want = appRooms, got = R.after, diffK = Object.keys(got).filter((k) => got[k] !== want[k]).concat(Object.keys(want).filter((k) => !(k in got)));
  ok(diffK.length === 0 && JSON.stringify(R.before) === JSON.stringify(R.after), 'localStorage changed: ' + diffK.join(','));
  ok(R.ss === 1, 'sessionStorage keys ' + R.ss + ' (only the harness\'s own seed marker)');
});
await T('S2 no service worker registered by the page', () => ok(R.sw === 0, 'registrations ' + R.sw));
await T('S3 the only network call is the device log; nothing outside its own folder but the icons', () => { const other = C.requests.filter((u) => !/\/log$/.test(u) && !u.startsWith(URL0) && !/\/stuff\/icon-v2-\d+\.png$/.test(u)); ok(other.length === 0, other.join(' ')); });
await T('S4 THE LOG IS PRIVATE AND SMALL: no message text, no room id, no room name; ≤ 20 rows a run; each detail ≤ 350 characters', () => {
  const rows = allRows(), body = JSON.stringify(C.logs);
  ok(body.indexOf(SECRET) === -1, 'message text in the log'); ok(!/room-[a-e]\d/.test(body), 'a room id in the log');
  ok(rows.length > 0 && rows.length <= 20, 'rows ' + rows.length); ok(rows.every((r) => JSON.stringify(r.d).length <= 350), 'a long row');
  ok(C.logs.every((b) => b.dev === 'poc-iphone-tst'), 'dev ' + C.logs.map((b) => b.dev).join());
});
await T('C2 two pages appending 200 each at the same moment: all 400 there, numbered 1–400 with no gap or collision', () => { const v = Q.rows || []; ok(v.length === 400 && v.every((x, i) => x[0] === i + 1) && new Set(v.map((x) => x[1])).size === 400, 'rows ' + v.length); });
await T('Q1 a FULL store (held to 3 MB): the write that does not fit fails with QuotaExceededError, it is caught, and every batch committed before it is still there', () => { ok(K && K.d && K.d.e === 'QuotaExceededError' && K.d.intact === true && K.d.written > 0, JSON.stringify(K)); });
await T('P4b the browser killed outright after 100 writes committed: reopened, all 100 are there', () => ok(KILL && KILL.pass && KILL.d.stored >= KILL.d.committed && KILL.d.committed === 100, JSON.stringify(KILL)));

console.log('\nIndexedDB proof: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
