#!/usr/bin/env node
/* 29·pre-ship (directory release) mutation gate: each mutation breaks or reverts ONE declared
   thing — an edit to the DR-1 part or the worker's fetch part, a banked edit left unapplied, a
   manifest rule — and harness-29dir must go red on the NAMED test. Nothing on disk is modified;
   each mutant folder is assembled into a temp dir. M9 (the differential) is skipped.           */
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assembleAll, FOLDER } from './assemble-29dir.mjs';

const page0 = readFileSync('talkbridge/parts/dr1-folder.js', 'utf8'), sw0 = readFileSync('talkbridge/parts/dr-sw-fetch.js', 'utf8');
const M12 = 'M1.2 exactly three page edits (E1 head manifest, E2 the swap by platform, E5 fastText path), each found once in the base and once in the page';
const M13 = 'M1.3 DR-1 declares and binds drRetireRoot once; the page carries no other new top-level symbol; the part has no network or credential line';
const M21 = 'M2.1 Chrome manifest: scope "./", start_url this stage\'s page, id the folder path (one app id for every stage); everything else as tb-manifest-turn28';
const M22 = 'M2.2 iPhone manifest: scope "./", NO start_url, NO id (the load-time address must carry into the Home Screen copy); everything else as tb-manifest-turn28';
const M32 = 'M3.2 exactly two lines of the root worker change (the header comment, APP_FILE = ""); the handler set grows by fetch and a second install only; the part never names push, notificationclick or the journal';
const M33 = 'M3.3 the worker\'s own URLs now point at the folder: APP_FILE is empty, face() and the fallback build on the registration scope, nothing names a root file';
const M11 = 'M1.1 bridge-turn29-pre-ship.html is the assembler\'s output; the folder\'s index.html is the forwarder to it, carrying search and hash';
const M77 = 'M7.7 the folder URL itself: the forwarder opens the stage page and keeps the invite (search and hash)';
const M61 = 'M6.1 markers(page) = markers(base) ∪ {dr_root_worker_retired, dr_retire_deferred, dr_retire_failed}; the build line names the folder';
const M72 = 'M7.2 the manifest link is this stage\'s in the folder: Chrome gets the one with start_url and id, the iPhone the one without; the root page still points at tb-manifest-turn28';
const M73 = 'M7.3 fastText resolves to /stuff/fastType/ from the folder (the root page: the same place); the invite and the link-device URL build on the folder URL; the flag band\'s image resolves in the folder';
const M74 = 'M7.4 legacy-worker retirement: deferred until the folder\'s push subscription is live; then exactly the root workers at /stuff/ and /stuff/bridge- (tb-sw, tb-sw2, tb-sw3) are unsubscribed and unregistered — PRISM\'s, this folder\'s, another app\'s at /stuff/ and a tb-sw.js at a third scope are untouched';
const M81 = 'M8.1 install precaches the start page and the folder\'s files, tolerating a missing one (the worker still activates)';
const M82 = 'M8.2 a cross-origin GET and any POST are never answered by the worker (the browser handles them)';
const M83 = 'M8.3 a same-origin GET in scope: network first and cached; outside the scope: network, not cached; offline: the cache answers, a navigation falls back to the start page, anything else fails as the network did';
const M76 = 'M7.6 (E6) in a browser tab the folder page registers its worker at load — registration only, no push attempt, no permission prompt; the root page registers nothing in a tab';
const M84 = 'M8.4 the push half still reads the folder: describe() and the tap fall back to the folder URL itself, never a root file name; the icon and badge come from the folder scope';

const MUTATIONS = [
  { catches: M72, name: 'E1 head manifest unapplied (the page points at the root manifest)', keep: ['E1-head-manifest', 'E2-u1-manifest-swap'] },
  { catches: M72, name: 'E2 swap unapplied: U1 swaps back to the root manifest at runtime', keep: ['E2-u1-manifest-swap'] },
  { catches: M73, name: 'E5 unapplied: fastText looked for inside the folder', keep: ['E5-fasttype-dir'] },
  { catches: M74, name: 'retirement widened to any scope', page: (s) => s.replace("        if (LEGACY.indexOf(sc) === -1) return;                          /* exact legacy scope only */\n", "") },
  { catches: M74, name: 'retirement widened to any script', page: (s) => s.replace("        if (!/\\/tb-sw[23]?\\.js$/.test(script)) return;                  /* exact legacy script only */\n", "") },
  { catches: M74, name: 'retirement no longer waits for the live subscription', page: (s) => s.replace("        if (!(typeof p3State !== 'undefined' && p3State && p3State.sub)) { L('dr_retire_deferred', { scope: sc }); return; }\n", "") },
  { catches: M74, name: 'the old subscription is not released before the worker goes', page: (s) => s.replace("          .then(function (s) { return s ? s.unsubscribe().catch(function () {}) : null; })\n", "") },
  { catches: M74, name: 'only the parent scope is retired, not the prefix one', page: (s) => s.replace("var LEGACY = [location.origin + PARENT, location.origin + PARENT + 'bridge-'];", "var LEGACY = [location.origin + PARENT];") },
  { catches: M76, name: 'E6 removed: nothing registers in a tab (Chrome never sees the worker)', page: (s) => s.replace("    try { if (!p2IsStandalone() && !(typeof p3State !== 'undefined' && p3State && p3State.reg)) p3Register().catch(function () {}); } catch (_) {}\n", "") },
  { catches: M76, name: 'E6 attempts push in the tab (a permission prompt before any tap, G33)', page: (s) => s.replace("p3Register().catch(function () {}); } catch (_) {}", "p3Attempt(false); } catch (_) {}") },
  { catches: M13, name: 'the part grows an undeclared symbol', page: (s) => s.replace("function drRetireRoot() {", "function drHelper() { return 1; }\nfunction drRetireRoot() {") },
  { catches: M61, name: 'an undeclared marker is logged', page: (s) => s.replace("L('dr_retire_deferred', { scope: sc });", "L('dr_retire_deferred', { scope: sc }); L('dr_seen', {});") },
  { catches: M61, name: 'the build line names the root', page: (s) => s.replace("file:'talkbridge-app/bridge-turn29-pre-ship.html'", "file:'bridge-turn29-pre-ship.html'") },
  { catches: M77, name: 'the forwarder drops the invite hash', forwardTo: 'bridge-turn29-pre-ship.html', index: (s) => s.replace("location.replace('./bridge-turn29-pre-ship.html' + location.search + location.hash);", "location.replace('./bridge-turn29-pre-ship.html');") },
  { catches: M11, name: 'the forwarder points at the old root address', forwardTo: '../bridge-turn29-pre-ship.html' },
  { catches: M21, name: 'the Chrome manifest loses start_url and id (G1 would fail as it did twice before)', env: { TB_DIR_NO_START_URL: '1' } },
  { catches: M22, name: 'the iPhone manifest gains start_url (the Home Screen copy would lose the person)', env: { TB_DIR_IOS_START_URL: '1' } },
  { catches: M33, name: 'W1 unapplied: APP_FILE still names the turn-24 file (G27)', keepW: ['W1-app-file'] },
  { catches: M32, name: 'the fetch part reaches into the push half', sw: (s) => s.replace("var APP_CACHE = 'tb-app-v1';", "var APP_CACHE = 'tb-app-v1';\nself.addEventListener('push', function () {});") },
  { catches: M82, name: 'the handler answers cross-origin GETs (a failed translation would come back as the app page)', sw: (s) => s.replace("  if (url.origin !== self.location.origin) return;\n", "") },
  { catches: M82, name: 'the handler answers POSTs', sw: (s) => s.replace("  if (req.method !== 'GET') return;\n", "") },
  { catches: M83, name: 'a navigation offline no longer falls back to the start page', sw: (s) => s.replace("if (req.mode === 'navigate') return caches.match('./index.html').then(function (p) { if (p) return p; throw err; }); ", "") },
  { catches: M83, name: 'every same-origin response is cached, outside the scope too', sw: (s) => s.replace("if (res && res.ok && url.pathname.indexOf(scopePath) === 0)", "if (res && res.ok)") },
  { catches: M83, name: 'an offline miss returns the start page for anything (a missing model would come back as HTML)', sw: (s) => s.replace("if (r) return r; if (req.mode === 'navigate') return caches.match('./index.html').then(function (p) { if (p) return p; throw err; }); throw err;", "if (r) return r; return caches.match('./index.html');") },
  /* no mutation for the per-file catch in the precache: with the outer catch the worker activates either way and the other files still land (Promise.all starts them all) — equivalent, kept as belt and braces */
  { catches: M81, name: 'the start page is not precached', sw: (s) => s.replace("var APP_ASSETS = ['./', './index.html', ", "var APP_ASSETS = [") },
  { catches: M84, name: 'the tap target names a root file again', sw: (s) => s.replace("self.addEventListener('fetch', function (e) {", "APP_FILE = 'bridge-turn24-post-ship.html';\nself.addEventListener('fetch', function (e) {") },
];
const WORKERS = Math.max(1, Number(process.env.TB_MUT_WORKERS || 4));
const tmp = mkdtempSync(path.join(tmpdir(), 'tb-29dir-mut-'));
const jobs = MUTATIONS.map((m, i) => ({ m, i })).filter(({ m }) => !process.env.TB_MUT_ONLY || m.catches === process.env.TB_MUT_ONLY);
const results = [];
function runOne({ m, i }) {
  return new Promise((resolve) => {
    const page = m.page ? m.page(page0) : page0, sw = m.sw ? m.sw(sw0) : sw0;
    if ((m.page && page === page0) || (m.sw && sw === sw0)) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name });
    const dir = path.join(tmp, 'f' + i); mkdirSync(dir, { recursive: true });
    const pagePath = path.join(tmp, 'page' + i + '.js'), swPath = path.join(tmp, 'sw' + i + '.js'); writeFileSync(pagePath, page); writeFileSync(swPath, sw);
    let files; try { files = assembleAll({ parts: [page], workerParts: [sw], keepReplacements: m.keep || [], keepWorkerReplacements: m.keepW || [], noStartUrl: !!(m.env && m.env.TB_DIR_NO_START_URL), iosStartUrl: !!(m.env && m.env.TB_DIR_IOS_START_URL), forwardTo: m.forwardTo }); } catch (e) { return resolve({ ok: false, line: 'MISS  assembly refused: ' + m.name + ' — ' + e.message }); }
    if (m.index) { const k = Object.keys(files).find((f) => f.endsWith('/index.html')); files[k] = m.index(files[k]); }
    for (const [f, c] of Object.entries(files)) writeFileSync(path.join(dir, f.slice(FOLDER.length + 1)), c);
    const env = { ...process.env, TB_SKIP_M9: '1', TB_DIR_FOLDER: dir, TB_DIR_PAGE_PART: pagePath, TB_DIR_SW_PART: swPath, TB_DIR_KEEP: (m.keep || []).join(','), TB_DIR_KEEP_W: (m.keepW || []).join(','), ...(m.env || {}) };
    const child = spawn('node', ['talkbridge/build/harness-29dir.mjs'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
    child.on('close', (exit) => {
      const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
      if (exit !== 0 && named) resolve({ ok: true, line: '  ok  [' + m.catches.slice(0, 44) + '] catches: ' + m.name });
      else resolve({ ok: false, line: 'MISS  [' + m.catches.slice(0, 44) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 90)).join(' / ') + ')') });
    });
  });
}
let next = 0;
async function worker() { while (next < jobs.length) { const j = jobs[next++]; const r = await runOne(j); results.push(r); console.log(r.line); } }
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, worker));
const caught = results.filter((r) => r.ok).length, missed = results.length - caught;
rmSync(tmp, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + results.length + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
