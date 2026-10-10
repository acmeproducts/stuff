#!/usr/bin/env node
/* 29·pre-ship harness — THE DIRECTORY RELEASE (§7.5 + §7.12), candidate 1.
   M1 the folder page = the 29·pre-base bytes + exactly the banked edits + DR-1 · M2 the two
   manifests · M3 the folder worker = root tb-sw3.js + exactly W0/W1 + the fetch handler ·
   M4 the copies are byte-identical · M5 no accepted root file changed · M6 markers ·
   M7 the page in the folder, live (fake service-worker API): the registration lands in the
   folder, the manifest link picks by platform, fastText resolves to /stuff/fastType/, the
   invite builds on the folder, the legacy workers retire — exactly those — after the push
   subscription is live; the root page shows the old behaviour · M8 the folder worker, live: the
   fetch handler answers same-origin GETs only, caches in scope, falls back to the start page for
   a navigation, never touches a POST or another origin; push and tap still read the folder URL ·
   M9 the whole 28·post-ship script on both builds: identical but the build line.
   Usage: node harness-29dir.mjs   TB_DIR_PAGE_PART=<file> TB_DIR_SW_PART=<file> TB_DIR_KEEP=id,id
          TB_DIR_KEEP_W=id,id TB_DIR_NO_START_URL=1 TB_DIR_IOS_START_URL=1 TB_DIR_FOLDER=<dir> TB_SKIP_M9=1 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import vm from 'vm';
import { JSDOM, VirtualConsole } from 'jsdom';
import { base as baseText, workerSrc, pageReplacements, workerReplacements, assemblePage, assembleWorker, assembleManifests, forwarder, COPIES, FOLDER, FOLDER_PATH, STAGE_PAGE, MANIFEST_NAME, MANIFEST_IOS_NAME, OUT, ADDED_MARKERS, ADDED_SYMBOLS, MANIFEST_SRC } from './assemble-29dir.mjs';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';

const folder = process.env.TB_DIR_FOLDER || FOLDER;
const rd = (f) => readFileSync(f, 'utf8');
const page = rd(folder + '/' + STAGE_PAGE), index = rd(folder + '/index.html'), worker = rd(folder + '/tb-sw3.js');
const manChrome = rd(folder + '/' + MANIFEST_NAME), manIos = rd(folder + '/' + MANIFEST_IOS_NAME);
const base = baseText(), rootSw = workerSrc();
const pagePart = process.env.TB_DIR_PAGE_PART ? rd(process.env.TB_DIR_PAGE_PART) : rd('talkbridge/parts/dr1-folder.js');
const swPart = process.env.TB_DIR_SW_PART ? rd(process.env.TB_DIR_SW_PART) : rd('talkbridge/parts/dr-sw-fetch.js');
const KEEP = process.env.TB_DIR_KEEP ? process.env.TB_DIR_KEEP.split(',') : [], KEEP_W = process.env.TB_DIR_KEEP_W ? process.env.TB_DIR_KEEP_W.split(',') : [];
const mOpts = { noStartUrl: !!process.env.TB_DIR_NO_START_URL, iosStartUrl: !!process.env.TB_DIR_IOS_START_URL };

let pass = 0, fail = 0;
const T = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const inline = (html) => html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L|p2Log)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
const ORIGIN = 'https://acmeproducts.github.io';

console.log('M1 · the stage page in the folder is the 29·pre-base bytes + the banked edits + DR-1');
await T('M1.1 ' + STAGE_PAGE + ' is the assembler\'s output; the folder\'s index.html is the forwarder to it, carrying search and hash', () => {
  assert(page === assemblePage({ parts: [pagePart], keepReplacements: KEEP }), STAGE_PAGE + ' ≠ assemblePage()');
  assert(index === forwarder(STAGE_PAGE) && /location\.replace\('\.\/bridge-turn29-pre-ship\.html' \+ location\.search \+ location\.hash\)/.test(index) && index.split('\n').length <= 16, 'index.html is not the 15-line forwarder to the stage page');
});
await T('M1.2 exactly three page edits (E1 head manifest, E2 the swap by platform, E5 fastText path), each found once in the base and once in the page', () => {
  const reps = pageReplacements(); assert(reps.map((r) => r.id).join(',') === 'E1-head-manifest,E2-u1-manifest-swap,E5-fasttype-dir', reps.map((r) => r.id).join(','));
  for (const r of reps) { assert(base.split(r.find).length - 1 === 1, r.id + ' not once in base'); if (!KEEP.includes(r.id)) { assert(page.indexOf(r.find) === -1, r.id + ' find text survives'); assert(page.split(r.replace).length - 1 === 1, r.id + ' replacement not once'); } }
  const bl = base.split('\n'), pl = page.split('\n'); const changed = []; for (let i = 0; i < bl.length - 3; i++) if (bl[i] !== pl[i]) changed.push(i + 1);   /* the part sits before the three closing lines */
  assert(changed.length === 3, 'lines changed inside the base span: ' + changed.length + ' (' + changed.slice(0, 5).join(',') + ')');
});
await T('M1.3 DR-1 declares and binds drRetireRoot once; the page carries no other new top-level symbol; the part has no network or credential line', () => {
  const js = code(inline(page)), bjs = code(inline(base));
  const re = /^(?:function\s+drRetireRoot\s*\(|var\s+drRetireRoot\s*=)/mg; assert((js.match(re) || []).length === 1 && !(bjs.match(re) || []).length, 'drRetireRoot binding');
  const defined = [...new Set([...code(pagePart).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2]))]; assert(defined.join(',') === ADDED_SYMBOLS.join(','), 'DR-1 defines ' + defined.join(','));
  assert(!/fetch\(|WebSocket|localStorage|tb_dg_key|tb_cf_|RELAY_/.test(code(pagePart)), 'DR-1 touches network, credentials or storage');
  assert(/\/tb-sw\[23\]\?\\\.js\$\//.test(pagePart) && /PARENT \+ 'bridge-'/.test(pagePart), 'the retirement is not pinned to the two legacy identities and the three root scripts');
});
await T('M1.4 the page still registers ./tb-sw.js by its frozen call; the folder worker is named tb-sw3.js (I-1 renames the call) and both names resolve inside the folder', () => {
  assert(/navigator\.serviceWorker\.register\('\.\/tb-sw\.js'\)/.test(page), 'p3Register changed');
  assert(existsSync(folder + '/tb-sw3.js'), 'no tb-sw3.js in the folder');
  assert(!/tb-manifest-turn28/.test(code(inline(page))) && !/href="tb-manifest-turn28/.test(page), 'the page still names the root manifest');
  assert(new RegExp('href="' + MANIFEST_NAME + '"').test(page) && page.indexOf("'" + MANIFEST_IOS_NAME + "'") !== -1, 'the page does not name this stage\'s two manifests');
});

console.log('M2 · the two manifests');
await T('M2.1 Chrome manifest: scope "./", start_url this stage\'s page, id the folder path (one app id for every stage); everything else as tb-manifest-turn28', () => {
  const m = JSON.parse(manChrome), src = JSON.parse(rd(MANIFEST_SRC));
  assert(m.scope === './' && m.start_url === './' + STAGE_PAGE && m.id === FOLDER_PATH, JSON.stringify({ scope: m.scope, start_url: m.start_url, id: m.id }));
  for (const k of Object.keys(src)) if (k !== 'scope') assert(JSON.stringify(m[k]) === JSON.stringify(src[k]), 'key differs: ' + k);
  assert(Object.keys(m).length === Object.keys(src).length + 2, 'extra keys: ' + Object.keys(m).join(','));
});
await T('M2.2 iPhone manifest: scope "./", NO start_url, NO id (the load-time address must carry into the Home Screen copy); everything else as tb-manifest-turn28', () => {
  const m = JSON.parse(manIos), src = JSON.parse(rd(MANIFEST_SRC));
  assert(m.scope === './' && !('start_url' in m) && !('id' in m), JSON.stringify({ scope: m.scope, start_url: m.start_url, id: m.id }));
  for (const k of Object.keys(src)) if (k !== 'scope') assert(JSON.stringify(m[k]) === JSON.stringify(src[k]), 'key differs: ' + k);
  assert(Object.keys(m).length === Object.keys(src).length, 'extra keys: ' + Object.keys(m).join(','));
});
await T('M2.3 every icon both manifests name is a folder-relative file that exists in the folder, byte-identical to the root icon', () => {
  for (const m of [JSON.parse(manChrome), JSON.parse(manIos)]) for (const ic of m.icons) {
    assert(!/[/]|\.\./.test(ic.src), 'icon leaves the folder: ' + ic.src);
    assert(existsSync(folder + '/' + ic.src) && Buffer.compare(readFileSync(folder + '/' + ic.src), readFileSync(ic.src)) === 0, 'icon missing or differs: ' + ic.src);
  }
});

console.log('M3 · the folder worker');
await T('M3.1 tb-sw3.js in the folder is the assembler\'s output: root tb-sw3.js + W0/W1 + the fetch handler', () => assert(worker === assembleWorker({ workerParts: [swPart], keepWorkerReplacements: KEEP_W }), 'worker ≠ assembleWorker()'));
await T('M3.2 exactly two lines of the root worker change (the header comment, APP_FILE = ""); the handler set grows by fetch and a second install only; the part never names push, notificationclick or the journal', () => {
  const rl = rootSw.split('\n'), wl = worker.split('\n'); const changed = []; for (let i = 0; i < rl.length; i++) if (rl[i] !== wl[i]) changed.push(i + 1);
  assert(changed.length === 2 && wl[changed[1] - 1].indexOf("var APP_FILE = '';") === 0 && changed[0] === 1, 'changed root lines: ' + changed.join(','));
  const ev = (s) => [...code(s).matchAll(/self\.addEventListener\('([a-z]+)'/g)].map((m) => m[1]);
  assert(ev(rootSw).join(',') === 'message,install,activate,push,notificationclick' && ev(worker).join(',') === 'message,install,activate,push,notificationclick,install,fetch', 'handlers: ' + ev(worker).join(','));
  assert(!/push|notificationclick|journal|showNotification|indexedDB/.test(code(swPart)), 'the part reaches into the push half');
});
await T('M3.3 the worker\'s own URLs now point at the folder: APP_FILE is empty, face() and the fallback build on the registration scope, nothing names a root file', () => {
  assert(/var APP_FILE = '';/.test(worker) && !/bridge-turn24-post-ship\.html/.test(code(worker)), 'a root file name survives');
  assert(/self\.registration\.scope \+ 'icon-v2-192\.png'/.test(worker), 'face() moved');
});

console.log('M4 · copies');
await T('M4.1 icons and flags.png in the folder are byte-identical to the root files; nothing else is in the folder', () => {
  for (const c of COPIES) assert(Buffer.compare(readFileSync(folder + '/' + c), readFileSync(c)) === 0, c + ' differs');
  const want = new Set([...COPIES, STAGE_PAGE, 'index.html', 'tb-sw3.js', MANIFEST_NAME, MANIFEST_IOS_NAME]);
  const have = readdirSync(folder); assert(have.length === want.size && have.every((f) => want.has(f)), 'folder holds: ' + have.join(','));
});

console.log('M5 · no accepted root file changed');
await T('M5.1 neither the working tree nor the commits since origin/main touch a root bridge-*.html, tb-*, icon-v2-*, flags.png or a manifest', () => {
  let names = [];
  try { names = names.concat(execFileSync('git', ['diff', '--name-only', 'origin/main', 'HEAD'], { encoding: 'utf8' }).split('\n')); } catch (_) {}
  names = names.concat(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).split('\n').map((l) => l.slice(3)));
  const bad = names.filter((n) => /^(bridge-turn[^/]*\.html|tb-[^/]*|icon-v2-[^/]*|flags\.png)$/.test(n.trim()));
  assert(bad.length === 0, 'root files touched: ' + bad.join(','));
});

console.log('M6 · markers');
await T('M6.1 markers(page) = markers(base) ∪ {dr_root_worker_retired, dr_retire_deferred, dr_retire_failed}; the build line names the folder', () => {
  const bm = markers(inline(base)), pm = markers(inline(page));
  const extra = [...pm].filter((m) => !bm.has(m) && !ADDED_MARKERS.includes(m)), missing = [...bm].filter((m) => !pm.has(m));
  assert(extra.length === 0 && missing.length === 0, 'extra ' + extra.join(',') + ' missing ' + missing.join(','));
  for (const m of ADDED_MARKERS) assert(pm.has(m) && !bm.has(m), m);
  assert(/c:'turn29-pre-ship-dir', file:'talkbridge-app\/bridge-turn29-pre-ship\.html'/.test(page), 'build line');
});

/* ── M7 · the page, live, with a fake service-worker API ── */
console.log('M7 · the page in the folder, live');
function mkRegs(w) {
  const mk = (scope, script, hasSub) => { const r = { scope, active: { scriptURL: script }, unregistered: false, unsubscribed: false }; r.pushManager = { getSubscription: () => Promise.resolve(hasSub ? { unsubscribe: () => { r.unsubscribed = true; return Promise.resolve(true); } } : null) }; r.unregister = () => { r.unregistered = true; return Promise.resolve(true); }; return r; };
  return [mk(ORIGIN + '/stuff/', ORIGIN + '/stuff/tb-sw.js', true), mk(ORIGIN + '/stuff/bridge-', ORIGIN + '/stuff/tb-sw3.js', true), mk(ORIGIN + '/stuff/', ORIGIN + '/stuff/tb-sw2.js', false),
    mk(ORIGIN + '/stuff/prism/', ORIGIN + '/stuff/prism/sw.js', true), mk(ORIGIN + '/stuff/talkbridge-app/', ORIGIN + '/stuff/talkbridge-app/tb-sw3.js', true), mk(ORIGIN + '/stuff/', ORIGIN + '/stuff/other-app-sw.js', true), mk(ORIGIN + '/stuff/talkbridge/', ORIGIN + '/stuff/tb-sw.js', true)];
}
async function live(html, url, ua) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, userAgent: ua, beforeParse(w) {
    w.__regs = []; w.__registrations = null;
    w.__loading = true; setTimeout(() => { w.__loading = false; }, 1100);
    const sw = { register(u, opts) { w.__regs.push({ url: String(u), opts: opts || null, atLoad: !!w.__loading }); const r = { scope: new URL('./', new URL(String(u), w.location.href)).href, pushManager: { getSubscription: () => Promise.resolve(null), subscribe: () => { w.__subscribed = true; return Promise.reject(new Error('no push in the rig')); } }, active: { scriptURL: new URL(String(u), w.location.href).href } }; return Promise.resolve(r); }, getRegistrations() { return Promise.resolve(w.__registrations || []); }, ready: new Promise(() => {}), addEventListener() {}, controller: null };
    Object.defineProperty(w.navigator, 'serviceWorker', { value: sw, configurable: true });
    Object.defineProperty(w.navigator, 'userAgent', { value: ua, configurable: true });   /* jsdom's own option does not reach navigator here */
    w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
    w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
    w.localStorage.setItem('tb_name', 'Ann'); w.localStorage.setItem('tb_dev', 'aaaa1111-0000-4000-8000-000000000001');
    w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
  } });
  await new Promise((r) => setTimeout(r, 1200));
  return { w: dom.window, errors };
}
const CHROME_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const FOLDER_URL = ORIGIN + FOLDER_PATH, PAGE_URL = FOLDER_URL + STAGE_PAGE, ROOT_URL = ORIGIN + '/stuff/bridge-turn29-pre-base.html';
const F = await live(page, PAGE_URL, CHROME_UA), FI = await live(page, PAGE_URL, IOS_UA), R = await live(base, ROOT_URL, CHROME_UA);
await T('M7.1 the frozen register call lands on ./tb-sw3.js in the folder with NO scope option — the worker owns /stuff/talkbridge-app/ alone (the root page: the same call, scope /stuff/ — U1\'s narrowing is bypassed by I-1\'s rename; PRISM stays captured there)', async () => {
  F.w.p3Register().catch(() => {}); R.w.p3Register().catch(() => {}); await new Promise((r) => setTimeout(r, 40));   /* the call resolves on navigator.serviceWorker.ready, which never comes in the rig */
  assert(F.w.__regs.length === 2 && F.w.__regs.every((r) => r.url === './tb-sw3.js' && !(r.opts && r.opts.scope)), 'folder register: ' + JSON.stringify(F.w.__regs));
  assert(F.w.p3State.reg.scope === FOLDER_URL && F.w.p3State.reg.active.scriptURL === FOLDER_URL + 'tb-sw3.js', 'resolved: ' + F.w.p3State.reg.scope);
  assert(R.w.__regs.length === 1 && R.w.__regs[0].url === './tb-sw3.js' && !(R.w.__regs[0].opts && R.w.__regs[0].opts.scope) && R.w.p3State.reg.scope === ORIGIN + '/stuff/', 'root register: ' + JSON.stringify(R.w.__regs) + ' scope ' + R.w.p3State.reg.scope);
  assert(F.w.debugLog.some((l) => l.ev === 'i1_sw3_register') && !F.w.debugLog.some((l) => l.ev === 'u1_narrow_register'), 'wrapper logs');
});
await T('M7.2 the manifest link is this stage\'s in the folder: Chrome gets the one with start_url and id, the iPhone the one without; the root page still points at tb-manifest-turn28', () => {
  const href = (I) => I.w.document.querySelector('link[rel="manifest"]').href;
  assert(href(F) === FOLDER_URL + MANIFEST_NAME, 'chrome: ' + href(F));
  assert(href(FI) === FOLDER_URL + MANIFEST_IOS_NAME, 'ios: ' + href(FI));
  assert(href(R) === ORIGIN + '/stuff/tb-manifest-turn28.webmanifest', 'root: ' + href(R));
  assert(F.w.debugLog.some((l) => l.ev === 'u1_manifest_swapped' && l.d.href.endsWith('/' + MANIFEST_NAME)) && FI.w.debugLog.some((l) => l.ev === 'u1_manifest_swapped' && l.d.href.endsWith('/' + MANIFEST_IOS_NAME)), 'swap logs');
  assert(F.w.document.querySelector('link[rel="apple-touch-icon"]').href === FOLDER_URL + 'icon-v2-180.png' && F.w.document.querySelector('link[rel="icon"]').href === FOLDER_URL + 'icon-v2-192.png', 'icons resolve outside the folder');
});
await T('M7.3 fastText resolves to /stuff/fastType/ from the folder (the root page: the same place); the invite and the link-device URL build on the folder URL; the flag band\'s image resolves in the folder', () => {
  assert(F.w.FT_DIR === ORIGIN + '/stuff/fastType/' && F.w.FT_MODEL === ORIGIN + '/stuff/fastType/model/lid.176.ftz', 'folder FT_DIR ' + F.w.FT_DIR);
  assert(R.w.FT_DIR === ORIGIN + '/stuff/fastType/', 'root FT_DIR ' + R.w.FT_DIR);
  const room = { id: 'r1', role: 'creator', myLang: 'en', theirLang: 'th', myName: 'Ann', title: 'T' }; F.w.S.rooms = [room];
  assert(F.w.invUrl(room).indexOf(PAGE_URL + '#j=') === 0, 'invite ' + F.w.invUrl(room));
  assert(F.w.linkDeviceUrl(room).indexOf(PAGE_URL + '#j=') === 0, 'link-device ' + F.w.linkDeviceUrl(room));
  const css = [...F.w.document.querySelectorAll('style')].map((s) => s.textContent).join('\n'); assert(/url\('\.\/flags\.png'\)/.test(css) && existsSync(folder + '/flags.png'), 'flags.png not folder-relative or missing');
});
await T('M7.4 legacy-worker retirement: deferred until the folder\'s push subscription is live; then exactly the root workers at /stuff/ and /stuff/bridge- (tb-sw, tb-sw2, tb-sw3) are unsubscribed and unregistered — PRISM\'s, this folder\'s, another app\'s at /stuff/ and a tb-sw.js at a third scope are untouched', async () => {
  const w = F.w; w.__registrations = mkRegs(w); w.p3State.sub = null;
  w.drRetireRoot(); await new Promise((r) => setTimeout(r, 30));
  assert(w.__registrations.every((r) => !r.unregistered) && w.debugLog.filter((l) => l.ev === 'dr_retire_deferred').length === 3, 'deferred: ' + w.debugLog.filter((l) => l.ev === 'dr_retire_deferred').length);
  w.p3State.sub = { endpoint: 'x' };
  w.drRetireRoot(); await new Promise((r) => setTimeout(r, 30));
  const gone = w.__registrations.filter((r) => r.unregistered).map((r) => r.active.scriptURL.replace(ORIGIN, '') + '@' + r.scope.replace(ORIGIN, ''));
  assert(gone.join(' ') === '/stuff/tb-sw.js@/stuff/ /stuff/tb-sw3.js@/stuff/bridge- /stuff/tb-sw2.js@/stuff/', 'retired: ' + gone.join(' '));
  assert(w.__registrations[0].unsubscribed && w.__registrations[1].unsubscribed && !w.__registrations[3].unregistered && !w.__registrations[4].unregistered && !w.__registrations[5].unregistered && !w.__registrations[6].unregistered, 'the wrong worker was touched or a subscription kept');
  const logs = w.debugLog.filter((l) => l.ev === 'dr_root_worker_retired'); assert(logs.length === 3 && logs.every((l) => l.d.ok === true), 'retired logs ' + logs.length);
});
await T('M7.6 (E6) in a browser tab the folder page registers its worker at load — registration only, no push attempt, no permission prompt; the root page registers nothing in a tab', () => {
  const regsAtLoad = (I) => I.w.__regs.filter((r) => r.atLoad).length;
  assert(regsAtLoad(F) === 1 && regsAtLoad(FI) === 1 && F.w.__regs.filter((r) => r.atLoad)[0].url === './tb-sw3.js', 'folder at load: ' + JSON.stringify(F.w.__regs));
  assert(regsAtLoad(R) === 0, 'the root page registered in a tab: ' + JSON.stringify(R.w.__regs));
  assert(F.w.debugLog.some((l) => l.ev === 'p3_sw_registered') && !F.w.debugLog.some((l) => /^p3_perm_/.test(l.ev)) && !F.w.__subscribed, 'a push attempt or permission prompt rode along: ' + F.w.debugLog.filter((l) => /^p3_/.test(l.ev)).map((l) => l.ev).join(','));
  assert(F.w.debugLog.some((l) => l.ev === 'p2_gate_shown'), 'the tab did not show the gate as before');
});
await T('M7.7 the folder URL itself: the forwarder opens the stage page and keeps the invite (search and hash)', () => {
  const m = index.match(/<script>location\.replace\(([^;]*)\);<\/script>/); assert(m, 'no replace call in the forwarder');
  const target = new Function('location', 'return ' + m[1])({ search: '?x=1', hash: '#j=abc' });   /* jsdom's Location cannot be stubbed; the expression is evaluated as written */
  assert(target === './' + STAGE_PAGE + '?x=1#j=abc', 'forwarder goes to ' + target);
  assert((index.match(/<script>/g) || []).length === 1 && !/fetch\(|WebSocket|localStorage/.test(index), 'the forwarder does more than forward');
});
await T('M7.5 no uncaught error on the folder page (either platform) or the root page', () => assert(F.errors.length === 0 && FI.errors.length === 0 && R.errors.length === 0, [...F.errors, ...FI.errors, ...R.errors].join(' | ')));

/* ── M8 · the worker, live ── */
console.log('M8 · the folder worker, live');
function runWorker(src, net) {
  const handlers = {}; const cache = new Map(); const puts = []; const adds = [];
  const resp = (body, opts) => ({ ok: (opts && opts.ok) !== false, status: (opts && opts.status) || 200, body, clone() { return resp(body, opts); } });
  const cacheObj = { add: (u) => { adds.push(u); if (net.fails && net.fails(u)) return Promise.reject(new Error('404')); cache.set(new URL(u, FOLDER_URL + 'tb-sw3.js').href, resp('cached:' + u)); return Promise.resolve(); }, put: (req, r) => { puts.push(req.url); cache.set(req.url, r); return Promise.resolve(); }, match: (k) => Promise.resolve(cache.get(typeof k === 'string' ? new URL(k, FOLDER_URL + 'tb-sw3.js').href : k.url) || undefined) };
  const sandbox = { self: null, caches: { open: () => Promise.resolve(cacheObj), match: (k) => cacheObj.match(k) }, fetch: (req) => net.fetch(req), URL, Promise, setTimeout, console, indexedDB: { open() { const r = {}; setTimeout(() => { r.error = new Error('no idb in the rig'); if (r.onerror) r.onerror(); }, 0); return r; } } };
  sandbox.self = { addEventListener: (t, f) => { (handlers[t] = handlers[t] || []).push(f); }, registration: { scope: FOLDER_URL, showNotification: () => Promise.resolve(), getNotifications: () => Promise.resolve([]) }, location: { origin: ORIGIN, href: FOLDER_URL + 'tb-sw3.js' }, skipWaiting() {}, clients: { claim() { return Promise.resolve(); }, matchAll() { return Promise.resolve([]); }, openWindow(u) { sandbox.__opened = u; return Promise.resolve(); } } };
  sandbox.globalThis = sandbox; vm.createContext(sandbox); vm.runInContext(src, sandbox);
  return { handlers, cache, puts, adds, sandbox, resp };
}
await T('M8.1 install precaches the start page and the folder\'s files, tolerating a missing one (the worker still activates)', async () => {
  const W = runWorker(worker, { fetch: () => Promise.reject(new Error('offline')), fails: (u) => /flags\.png$/.test(u) });
  let settled = false; for (const h of W.handlers.install) h({ waitUntil: (p) => { p.then(() => { settled = true; }); } });
  await new Promise((r) => setTimeout(r, 20));
  assert(settled && W.adds.includes('./') && W.adds.includes('./index.html') && W.adds.includes('./icon-v2-badge-96.png') && !W.adds.some((a) => /bridge-turn|webmanifest/.test(a)), 'precache ' + W.adds.join(','));
});
async function fetchVia(W, req) { const ev = { request: req, answered: null, respondWith(p) { this.answered = p; } }; for (const h of W.handlers.fetch) h(ev); return ev.answered ? await ev.answered.catch((e) => ({ error: String(e && e.message || e) })) : undefined; }
await T('M8.2 a cross-origin GET and any POST are never answered by the worker (the browser handles them)', async () => {
  const W = runWorker(worker, { fetch: () => Promise.resolve(W && W.resp('net')) });
  assert(await fetchVia(W, { method: 'GET', url: 'https://translate.googleapis.com/translate_a/single?q=x', mode: 'cors' }) === undefined, 'cross-origin GET answered');
  assert(await fetchVia(W, { method: 'GET', url: 'https://api.github.com/repos/x/y/contents/z', mode: 'cors' }) === undefined, 'GitHub GET answered');
  assert(await fetchVia(W, { method: 'POST', url: FOLDER_URL + 'x', mode: 'cors' }) === undefined, 'POST answered');
  assert(await fetchVia(W, { method: 'POST', url: 'https://rtc.live.cloudflare.com/v1/turn/keys/k/credentials/generate', mode: 'cors' }) === undefined, 'TURN POST answered');
});
await T('M8.3 a same-origin GET in scope: network first and cached; outside the scope: network, not cached; offline: the cache answers, a navigation falls back to the start page, anything else fails as the network did', async () => {
  let online = true; const W = runWorker(worker, { fetch: (req) => online ? Promise.resolve(W.resp('net:' + req.url)) : Promise.reject(new Error('offline')) });
  for (const h of W.handlers.install) h({ waitUntil: () => {} }); await new Promise((r) => setTimeout(r, 20));
  const r1 = await fetchVia(W, { method: 'GET', url: FOLDER_URL + 'icon-v2-192.png', mode: 'no-cors' }); assert(r1 && r1.body === 'net:' + FOLDER_URL + 'icon-v2-192.png' && W.puts.includes(FOLDER_URL + 'icon-v2-192.png'), 'in-scope GET ' + JSON.stringify(r1));
  const r2 = await fetchVia(W, { method: 'GET', url: ORIGIN + '/stuff/fastType/model/lid.176.ftz', mode: 'cors' }); assert(r2 && r2.body.indexOf('net:') === 0 && !W.puts.includes(ORIGIN + '/stuff/fastType/model/lid.176.ftz'), 'out-of-scope GET cached or not answered');
  online = false;
  const r3 = await fetchVia(W, { method: 'GET', url: FOLDER_URL + 'icon-v2-192.png', mode: 'no-cors' }); assert(r3 && r3.body === 'net:' + FOLDER_URL + 'icon-v2-192.png', 'offline cached GET ' + JSON.stringify(r3));
  const r4 = await fetchVia(W, { method: 'GET', url: FOLDER_URL + '?x=1', mode: 'navigate' }); assert(r4 && r4.body === 'cached:./index.html', 'offline navigation ' + JSON.stringify(r4));
  const r5 = await fetchVia(W, { method: 'GET', url: ORIGIN + '/stuff/fastType/model/lid.176.ftz', mode: 'cors' }); assert(r5 && r5.error === 'offline', 'offline miss should fail as the network did: ' + JSON.stringify(r5));
});
await T('M8.4 the push half still reads the folder: describe() and the tap fall back to the folder URL itself, never a root file name; the icon and badge come from the folder scope', async () => {
  const W = runWorker(worker, { fetch: () => Promise.reject(new Error('x')) });
  const d = W.sandbox.describe({ id: 'e1', room: 'r1', kind: 'chat', name: 'Bo' }, null); assert(d.url === FOLDER_URL, 'describe url ' + d.url);
  const faced = W.sandbox.face({}); assert(faced.icon === FOLDER_URL + 'icon-v2-192.png' && faced.badge === FOLDER_URL + 'icon-v2-badge-96.png', 'face ' + JSON.stringify(faced));
  let done; for (const h of W.handlers.notificationclick) h({ notification: { close() {}, data: { roomId: 'r1', eventId: 'e1' } }, waitUntil: (p) => { done = p; } }); await done;
  assert(W.sandbox.__opened === FOLDER_URL + '#ev=r1.e1', 'tap opened ' + W.sandbox.__opened);
});

/* ── M9 · differential ── */
console.log('M9 · the whole 28·post-ship script on both builds');
if (!process.env.TB_SKIP_M9) {
  const { snapA, snapC, RA, RC } = await runBoth(base, page);
  /* pb_writeback_err {e:'Error: get 0'} is the rig's own race (the first write-back GET against the fake network) — seen on either build in some runs, both in others; counted out, like HOUSEKEEPING */
  const strip = (s) => { const c = JSON.parse(JSON.stringify(s)); c.log = c.log.filter((l) => !(l.ev === 'build' && l.d && l.d.c === 'turn29-pre-ship-dir') && !ADDED_MARKERS.includes(l.ev) && !(l.ev === 'pb_writeback_err' && l.d && l.d.e === 'Error: get 0')); return c; };
  for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); for (const k of KEYS) await T('M9 ' + side + '.' + k + ' identical but the build line', () => { const out = []; diff(a[k], c[k], side + '.' + k, out); assert(out.length === 0, out.slice(0, 5).join('\n')); }); }
  await T('M9 no uncaught error on either build through the whole script (the build line itself is logged at boot, before the rig clears the log; M6.1 proves it in the source)', () => {
    assert([RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | '));
  });
}
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
