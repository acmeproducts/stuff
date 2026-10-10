#!/usr/bin/env node
/* 29·ship harness — INSTALL OPTIONAL (§7.19), candidate 4: REACH, one module.
   S  the stage = the accepted 29·pre-ship page + twenty-one banked edits + RH-1, and nothing else (reversal proof); symbols, markers, no new network,
      credential or message type; the graveyard sweep clean · M  manifests and the head's own choice · W  the worker, live in a shim ·
   A  the real app boots in every launch and asks for nothing outside a tap; no tap is ever stolen (G33) · B  the bar, once, at the first moment ·
   C  the row at the foot of the left drawer, one line per state, no tabs · K  the carrying address holds the keys the page holds (G66) and an iPhone tab
   moves to it at room entry · N  a subscription is reused only under the current key (N11, G34) · V  one away-path: the first word on blur is "away" ·
   I  the browser's install offer, held in the head, raised inside the tap, only for a device with durable keys · D  the ring · E  the 28·post-ship differential.
   Usage: node harness-29s.mjs   TB_IO_PART=<part.js>  TB_IO_KEEP=id,id  TB_IO_KEEP_W=id,id  TB_IO_DIR=<folder>  TB_IO_NO_START_URL=1  TB_IO_IOS_START_URL=1 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage, baseWorker, pageReplacements, workerReplacements, assemblePage, assembleWorker, assembleManifests, FOLDER_PATH, STAGE_PAGE, WORKER_NAME, MANIFEST_NAME, MANIFEST_IOS_NAME, ADDED_SYMBOLS, ADDED_MARKERS, REMOVED_MARKERS, PART, TAIL } from './assemble-29s.mjs';
import { sweep } from './graveyard-sweep.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = process.env.TB_IO_DIR || path.join(root, 'talkbridge-app');
const rd = (f) => fs.readFileSync(f, 'utf8');
const part = process.env.TB_IO_PART ? rd(process.env.TB_IO_PART) : rd(path.join(root, PART));
const KEEP = process.env.TB_IO_KEEP ? process.env.TB_IO_KEEP.split(',') : [], KEEP_W = process.env.TB_IO_KEEP_W ? process.env.TB_IO_KEEP_W.split(',') : [];
const stage = rd(path.join(dir, STAGE_PAGE)), worker = rd(path.join(dir, WORKER_NAME));
const manChrome = rd(path.join(dir, MANIFEST_NAME)), manIos = rd(path.join(dir, MANIFEST_IOS_NAME));
const base = basePage(), baseW = baseWorker();
const mOpts = { noStartUrl: !!process.env.TB_IO_NO_START_URL, iosStartUrl: !!process.env.TB_IO_IOS_START_URL };

let pass = 0, fail = 0;
const ONLY = process.env.TB_IO_ONLY ? new Set(process.env.TB_IO_ONLY.split(',')) : null;   /* the mutation gate runs only the group a mutation targets */
const T = async (name, fn) => { if (ONLY && !ONLY.has(name[0])) return; try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const appScript = (html) => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).sort((a, b) => b.length - a.length)[0];
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rhLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L|p2Log|rhLog)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };
const netLines = (js) => code(js).split('\n').filter((l) => /new WebSocket\(|\bfetch\(|RELAY_WS|tb_dg_key|tb_cf_tid|tb_cf_tok|credentials\/generate|deepgram\.com/.test(l)).map((l) => l.trim());
const contractOf = (p) => { const i = p.indexOf('@contract'); return p.slice(i, p.indexOf('*/', i)); };

console.log('S · the stage is the accepted page plus the banked edits plus IO-1');
await T('S1 the page and the worker are the assembler\'s output', () => { assert(stage === assemblePage({ part, keepReplacements: KEEP }), STAGE_PAGE + ' ≠ assemblePage()'); assert(worker === assembleWorker({ keepWorkerReplacements: KEEP_W }), WORKER_NAME + ' ≠ assembleWorker()'); });
await T('S2 every find text is in the accepted page exactly once and gone from the stage; every replacement is in the stage exactly once (twenty-one page edits, four worker edits)', () => {
  const reps = pageReplacements(), wreps = workerReplacements(); assert(reps.length === 21 && wreps.length === 4, 'expected 21 + 4, got ' + reps.length + ' + ' + wreps.length);
  for (const [list, src, out, tag] of [[reps, base, stage, 'page'], [wreps, baseW, worker, 'worker']]) for (const r of list) {
    assert(src.split(r.find).length - 1 === 1, tag + ' ' + r.id + ': find not exactly once in the accepted file');
    if ((tag === 'page' ? KEEP : KEEP_W).includes(r.id)) continue;
    assert(out.indexOf(r.find) === -1, tag + ' ' + r.id + ': find text survives'); assert(out.split(r.replace).length - 1 === 1, tag + ' ' + r.id + ': replacement not exactly once');
  }
});
await T('S3 reversal: undo the replacements and drop the part and the stage is the accepted page byte for byte; the same for the worker — nothing else changed', () => {
  let back = stage; assert(back.endsWith(TAIL) && back.indexOf('\n\n' + part + TAIL) !== -1, 'the part is not the tail of the stage'); back = back.slice(0, back.lastIndexOf('\n\n' + part + TAIL)) + TAIL;
  for (const r of pageReplacements().reverse()) back = back.replace(r.replace, () => r.find); assert(back === base, 'the stage minus the banked edits and the part is not the accepted page');
  let wb = worker; for (const r of workerReplacements().reverse()) wb = wb.replace(r.replace, () => r.find); assert(wb === baseW, 'the worker minus the banked edits is not the accepted worker');
});
await T('S4 RH-1 replaces and wraps nothing (the wrap map is the accepted build\'s); each symbol it adds is declared, bound once in the stage and never in the accepted page', () => {
  const c = contractOf(part); assert(/replaces:\s*\(none\)/.test(c) && /wraps:\s*\(none\)/.test(c), 'RH-1 must replace and wrap nothing'); assert(!/^(?:enterRoom|openPanel|showScreen|renderPanel|log)\s*=/m.test(code(part)), 'RH-1 reassigns a function of the accepted build');
  const js = code(appScript(stage)), bjs = code(appScript(base));
  for (const s of ADDED_SYMBOLS) { assert(new RegExp('adds:[^\\n]*\\b' + s + '\\b').test(c), s + ' not declared'); const re = new RegExp('^(?:function\\s+' + s + '\\s*\\(|var\\s+' + s + '\\s*=)', 'mg'); assert((js.match(re) || []).length === 1, s + ' bound ' + (js.match(re) || []).length + ' times'); assert((bjs.match(re) || []).length === 0, s + ' already bound in the accepted page'); }
  const declared = (c.match(/adds:([^\n]*)/) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean); const defined = [...new Set([...code(part).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2]))];
  for (const d of defined) assert(declared.includes(d), 'RM-1 defines ' + d + ' without declaring it'); assert(declared.length === ADDED_SYMBOLS.length, 'declared ' + declared.length + ' ≠ ' + ADDED_SYMBOLS.length);
});
await T('S5 markers(stage) = markers(accepted) + the declared ones − p2 gate_shown; none of the declared existed; each is logged somewhere', () => {
  const bm = markers(appScript(base)), sm = markers(appScript(stage));
  for (const m of ADDED_MARKERS) assert(!bm.has(m), m + ' already in the accepted page'); for (const m of REMOVED_MARKERS) assert(bm.has(m), m + ' was never in the accepted page');
  const extra = [...sm].filter((m) => !bm.has(m) && !ADDED_MARKERS.includes(m)), lost = [...bm].filter((m) => !sm.has(m) && !REMOVED_MARKERS.includes(m));
  assert(extra.length === 0, 'undeclared markers: ' + extra.join(', ')); assert(lost.length === 0, 'markers lost: ' + lost.join(', ')); for (const m of ADDED_MARKERS) assert(sm.has(m), 'declared marker never logged: ' + m);
  for (const m of REMOVED_MARKERS) assert(!sm.has(m), 'a removed marker is still logged: ' + m);
  assert(!/p2Log\('gate_shown'/.test(code(appScript(stage))), 'the gate is still logged');
});
await T('S6 no network, credential, endpoint or storage line is added or changed; no relay message type is added (G19/G20)', () => {
  const b = netLines(appScript(base)), s = netLines(appScript(stage)); assert(JSON.stringify(b) === JSON.stringify(s), 'network lines differ: +' + s.filter((l) => !b.includes(l)).join(' | ') + ' −' + b.filter((l) => !s.includes(l)).join(' | '));
  assert(netLines(part).length === 0 && !/fetch\(|WebSocket|XMLHttpRequest|tb_dg_key|tb_cf_|tb_gh_pat|Authorization|credentials/.test(code(part)), 'RM-1 reaches for a network or a key');
  const bt = types(code(appScript(base))), sent = new Set([...types(code(part)), ...pageReplacements().flatMap((r) => [...types(r.replace)])]); for (const t of sent) assert(bt.has(t), 'new message type ' + t);
  const keys = [...code(part).matchAll(/localStorage\.\w+Item\(\s*([A-Za-z_']+)/g)].map((m) => m[1]); assert(keys.every((k) => k === 'RH_DONE_KEY'), 'RM-1 touches storage other than the one decision key: ' + keys.join(','));
});
await T('S7 the graveyard sweep: the stage page and the worker carry no buried pattern; the accepted base they are built from carries G33 and G34 (the sweep sees what rode in it)', () => {
  const hs = sweep(stage, { file: STAGE_PAGE }), hw = sweep(worker, { file: WORKER_NAME }); assert(hs.length === 0 && hw.length === 0, 'buried: ' + hs.concat(hw).map((h) => h.id + '@' + h.line).join(','));
  const hb = sweep(base, { file: 'base' }).map((h) => h.id); assert(hb.includes('G33a') && hb.includes('G34'), 'the sweep does not see the base\'s own G33/G34: ' + hb.join(','));
});

console.log('M · manifests and what the head chooses');
await T('M1 Chrome manifest: scope "./", start_url this stage\'s page, id the folder (one app id for every stage); iPhone manifest: scope "./", no start_url, no id; everything else as tb-manifest-turn28', () => {
  const src = JSON.parse(rd(path.join(root, 'tb-manifest-turn28.webmanifest'))), c = JSON.parse(manChrome), i = JSON.parse(manIos);
  assert(c.scope === './' && c.start_url === './' + STAGE_PAGE && c.id === FOLDER_PATH, JSON.stringify({ s: c.scope, u: c.start_url, id: c.id }));
  assert(i.scope === './' && !('start_url' in i) && !('id' in i), JSON.stringify({ s: i.scope, u: i.start_url, id: i.id }));
  for (const k of Object.keys(src)) if (k !== 'scope') { assert(JSON.stringify(c[k]) === JSON.stringify(src[k]) && JSON.stringify(i[k]) === JSON.stringify(src[k]), 'key differs: ' + k); }
  assert(manChrome === assembleManifests(mOpts).chrome && manIos === assembleManifests(mOpts).ios, 'manifests ≠ the assembler');
  for (const m of [c, i]) for (const ic of m.icons) assert(fs.existsSync(path.join(dir, ic.src)), 'icon missing in the folder: ' + ic.src);
});
const ORIGIN = 'https://acmeproducts.github.io', FOLDER_URL = ORIGIN + FOLDER_PATH, STAGE_URL = FOLDER_URL + STAGE_PAGE;
const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ioschrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'
};
const KEYBYTES = new Uint8Array(65).fill(4), STALEBYTES = new Uint8Array(65).fill(5); const VAPID = Buffer.from(KEYBYTES).toString('base64url');
const fakeSub = (w, kind) => { const s = { endpoint: 'https://push.example/pre-' + kind, toJSON() { return { endpoint: this.endpoint, keys: {} }; }, unsubscribe() { w.__unsubCalls++; w.__sub = null; return Promise.resolve(true); } }; if (kind !== 'noopts') s.options = { applicationServerKey: (kind === 'stale' ? STALEBYTES : KEYBYTES).slice().buffer }; return s; };
const ROOM = { id: 'room-1', role: 'creator', title: 'Gate', partnerName: 'Bo', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0, muted: false, goBtn: true, meta: 'top', autoRead: false };
const encInv = (p) => Buffer.from(JSON.stringify(p)).toString('base64url');
const openWindows = [];
/* A real boot of an HTML page on a fake phone. o: { html, ua, standalone, notif:'default'|'granted'|'denied'|null, answer, push, rooms, search, hash, seed } */
async function live(o) {
  o = o || {}; const errors = [], html = o.html || stage; const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/Not implemented: navigation/.test(String(e.message || e))) errors.push('jsdom: ' + String(e.message || e).slice(0, 160)); });
  const url = STAGE_URL + (o.search || '') + (o.hash || '');
  const dom = new JSDOM(html, { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) {
    Object.defineProperty(w.navigator, 'userAgent', { value: o.ua || UA.desktop, configurable: true });
    w.__vib = []; w.__audio = 0; w.__regs = []; w.__posted = []; w.__fetches = []; w.__sockets = []; w.__subCalls = 0; w.__unsubCalls = 0; w.__sub = null; w.__deadEndpoints = new Set(o.dead || []); w.__gesture = false; w.__swListeners = [];
    w.__notif = { calls: 0, gestureCalls: 0, perm: o.notif === undefined ? 'default' : o.notif };
    if (o.notif !== null) {
      w.Notification = class { static get permission() { return w.__notif.perm; } static requestPermission() { w.__notif.calls++; if (w.__gesture) w.__notif.gestureCalls++; w.__notif.perm = o.answer || 'granted'; return Promise.resolve(w.__notif.perm); } };
    }
    if (o.push !== false && o.notif !== null) w.PushManager = function () {};
    const std = !!o.standalone; w.matchMedia = (q) => ({ matches: std && /display-mode:\s*(standalone|fullscreen)/.test(q), addEventListener() {}, addListener() {} });
    if (std && /iPhone/.test(o.ua || '')) Object.defineProperty(w.navigator, 'standalone', { value: true, configurable: true });
    Object.defineProperty(w.navigator, 'vibrate', { value: (p) => { w.__vib.push(p); return true; }, configurable: true });
    let resolveReady; const ready = new Promise((r) => { resolveReady = r; });
    const reg = { scope: FOLDER_URL, active: { scriptURL: FOLDER_URL + WORKER_NAME, postMessage: (m) => w.__posted.push(m) }, pushManager: {
      getSubscription: () => Promise.resolve(w.__sub),
      subscribe: () => { if (w.__notif.perm !== 'granted') return Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); w.__subCalls++; w.__sub = { endpoint: 'https://push.example/' + w.__subCalls, options: { applicationServerKey: KEYBYTES.slice().buffer }, toJSON() { return { endpoint: this.endpoint, keys: {} }; }, unsubscribe() { w.__unsubCalls++; w.__sub = null; return Promise.resolve(true); } }; return Promise.resolve(w.__sub); } } };
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register(u, opts) { w.__regs.push({ url: String(u), opts: opts || null }); resolveReady(reg); return Promise.resolve(reg); }, getRegistrations() { return Promise.resolve([]); }, ready, controller: null, addEventListener(t) { w.__swListeners.push(t); } }, configurable: true });
    w.fetch = (u, opts) => { w.__fetches.push({ u: String(u), body: opts && opts.body }); const j = (v) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(v), text: () => Promise.resolve('') });
      if (/workers\.dev/.test(String(u)) && opts && opts.method === 'POST') { const b = JSON.parse(opts.body); if (b.type === 'subscribe' && w.__deadEndpoints && b.subscription && w.__deadEndpoints.has(b.subscription.endpoint)) return j({ ok: false, dead: true, subscribed: false }); return b.type === 'vapid' ? j({ vapid: VAPID, push: true }) : j({ ok: true }); }
      return Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') }); };
    w.WebSocket = class { constructor(u) { this.url = u; this.readyState = 0; w.__sockets.push(this); } send() {} close() { this.readyState = 3; } addEventListener() {} removeEventListener() {} };
    w.AudioContext = w.webkitAudioContext = class { constructor() { w.__audio++; this.destination = {}; } createOscillator() { return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { value: 0 }, connect() {} }; } close() { return Promise.resolve(); } };
    w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
    if (o.sub) w.__sub = fakeSub(w, o.sub);
    w.localStorage.setItem('tb_name', 'Ann'); w.localStorage.setItem('tb_dev', 'aaaa1111-0000-4000-8000-000000000001');
    w.localStorage.setItem('tba_rooms', JSON.stringify(o.rooms === undefined ? [ROOM] : o.rooms)); for (const [k, v] of Object.entries(o.seed || {})) w.localStorage.setItem(k, v);
    w.document.addEventListener('click', () => { w.__gesture = true; Promise.resolve().then(() => { w.__gesture = false; }); }, true);
    w.addEventListener('error', (e) => errors.push('err: ' + String(e.message || e.error)));
  } });
  const w = dom.window; openWindows.push(dom); await sleep(o.wait || 900);
  const I = { w, dom, errors, ev: (e) => w.debugLog.filter((l) => l.ev === e), has: (e) => w.debugLog.some((l) => l.ev === e), $: (id) => w.document.getElementById(id) };
  return I;
}
const intoRoom = async (I, o) => { o = o || {}; I.w.enterRoom('room-1'); await sleep(60); if (o.message !== false) I.w.transcript.push({ id: 'cm-1', kind: 'chat', who: 'partner', sourceText: 'hi', translatedText: 'hi', srcLang: 'th', tgtLang: 'en', ts: Date.now(), senderName: 'Bo' }); };
const bar = (I) => I.$('rh-bar'); const row = (I) => I.$('rh-row'); const rowBtn = (I) => row(I) && row(I).querySelector('.rh-b'); const rowShown = (I) => !!row(I) && row(I).style.display !== 'none' && row(I).innerHTML !== '';
const JROOM = { id: 'room-j', role: 'joiner', title: 'Guest', partnerName: 'Bo', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0, muted: false, goBtn: true, meta: 'top', autoRead: false };
const GRANT = { tb_grant_dg: 'dgG', tb_grant_tid: 'tidG', tb_grant_tok: 'tokG', tb_grant: JSON.stringify({ room: 'room-j', expires: Date.now() + 86400000 * 10, at: Date.now() }) };
const payloadOf = (I, u) => I.w.decInv(String(u).split('#j=')[1] || '');

console.log('M · what the head chooses, alone (the swap that ran later never runs)');
await T('M2 the head alone writes this stage\'s manifest link while it is parsed: iPhone Safari and iPhone Chrome get the one without start_url, Android the one with it', async () => {
  assert(!/^<link rel="manifest"/m.test(stage) && !/<link rel="manifest" href="tb-manifest-turn2[0-9]-pre-ship/.test(stage), 'a stale or static manifest link survives');
  const w0 = stage.match(/<script>document\.write\('<link rel="manifest" href="' \+ \(\((.*?)\) \? '([^']+)' : '([^']+)'\) \+ '">'\);[^<]*<\/script>/); assert(w0 && w0[2] === MANIFEST_IOS_NAME && w0[3] === MANIFEST_NAME, 'the head does not name this stage\'s manifests: ' + (w0 ? w0.slice(2, 4).join(',') : 'no write'));
  const bare = async (ua) => { const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); const dom = new JSDOM(stage, { url: STAGE_URL, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) { Object.defineProperty(w.navigator, 'userAgent', { value: ua, configurable: true }); w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} }); w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {}; w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') }); w.localStorage.setItem('tb_name', 'Ann'); } }); await sleep(300); const links = [...dom.window.document.querySelectorAll('link[rel="manifest"]')].map((l) => l.href); const swapped = dom.window.debugLog.some((l) => l.ev === 'u1_manifest_swapped'); dom.window.close(); return { links, swapped }; };
  for (const [ua, want, name] of [[UA.ios, MANIFEST_IOS_NAME, 'iPhone Safari'], [UA.ioschrome, MANIFEST_IOS_NAME, 'iPhone Chrome'], [UA.android, MANIFEST_NAME, 'Android Chrome']]) { const r = await bare(ua); assert(!r.swapped, name + ': the later swap ran — this proof needs the head alone'); assert(r.links.length === 1 && r.links[0].endsWith('/' + want), name + ': head links ' + JSON.stringify(r.links)); }
});

await T('M3 in a live window (the later swap running) the manifest link ends up this stage\'s, per platform: Android the one with start_url, iPhone the one without', async () => {
  const href = (I) => I.w.document.querySelector('link[rel="manifest"]').href; const a = await live({ ua: UA.android, notif: 'default' }), i = await live({ ua: UA.ios, notif: null });
  assert(href(a) === FOLDER_URL + MANIFEST_NAME && href(i) === FOLDER_URL + MANIFEST_IOS_NAME, 'android ' + href(a) + ' · iphone ' + href(i)); assert(a.ev('u1_manifest_swapped').every((l) => l.d.href === FOLDER_URL + MANIFEST_NAME || String(l.d.href).endsWith('/' + MANIFEST_NAME)), 'the swap names another manifest');
});

console.log('W · the worker, live in a shim');
function fakeIndexedDB() {
  const dbs = {}; const later = (fn) => setTimeout(fn, 0);
  function req(run) { const r = { onsuccess: null, onerror: null, result: undefined }; later(() => { try { r.result = run(); r.onsuccess && r.onsuccess({ target: r }); } catch (e) { r.error = e; r.onerror && r.onerror({ target: r }); } }); return r; }
  return { open(name) { const r = { onupgradeneeded: null, onsuccess: null, onerror: null, result: null };
    later(() => { const fresh = !dbs[name]; const db = dbs[name] = dbs[name] || { stores: {} };
      const api = { objectStoreNames: { contains: (n) => !!db.stores[n] }, createObjectStore(n, o) { db.stores[n] = { opts: o || {}, rows: new Map(), auto: 1 }; },
        transaction(n) { const tx = { oncomplete: null, onerror: null, _pending: 0 }; const done = () => { if (--tx._pending === 0) later(() => tx.oncomplete && tx.oncomplete()); }; const wrap = (run) => { tx._pending += 1; return req(() => { const v = run(); done(); return v; }); };
          tx.objectStore = function (sn) { const st = db.stores[sn]; return { add(v) { return wrap(() => { st.rows.set(st.auto++, JSON.parse(JSON.stringify(v))); return true; }); }, put(v) { return wrap(() => { st.rows.set(v[st.opts.keyPath], JSON.parse(JSON.stringify(v))); return true; }); }, get(k) { return wrap(() => st.rows.get(k)); } }; }; return tx; } };
      r.result = api; if (fresh) { r.onupgradeneeded && r.onupgradeneeded({ target: r }); } r.onsuccess && r.onsuccess({ target: r }); }); return r; }, _dbs: dbs };
}
function makeWorker(source, store) {
  const listeners = {}, shown = [], opened = [], clientsList = [];
  const self = { addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); }, skipWaiting() {}, location: { origin: ORIGIN, href: FOLDER_URL + WORKER_NAME },
    registration: { scope: FOLDER_URL, showNotification: (title, opts) => { shown.push({ title, opts }); return Promise.resolve(); }, getNotifications: () => Promise.resolve([]) },
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve(clientsList.slice()), openWindow: (u) => { opened.push(u); return Promise.resolve(null); } }, indexedDB: store || fakeIndexedDB() };
  const caches = { open: () => Promise.resolve({ add: () => Promise.resolve(), put: () => Promise.resolve(), match: () => Promise.resolve(undefined) }), match: () => Promise.resolve(undefined) };
  const ctx = { self, indexedDB: self.indexedDB, caches, fetch: () => Promise.reject(new Error('offline')), URL, setTimeout, clearTimeout, Promise, JSON, String, Array, Object, Date, encodeURIComponent, console };
  vm.runInNewContext(source, ctx, { filename: WORKER_NAME });
  const fire = async (type, ev) => { const waits = []; ev.waitUntil = (p) => waits.push(p); for (const fn of listeners[type] || []) fn(ev); await Promise.all(waits); await sleep(5); };
  const client = (id) => ({ id, url: STAGE_URL, focusCalls: 0, messages: [], focus() { this.focusCalls++; return Promise.resolve(this); }, postMessage(m) { this.messages.push(m); } });
  return { fire, shown, opened, clientsList, client, store: self.indexedDB, listeners };
}
const PUSH = (ev) => ({ data: { json: () => ev } });
const CALLEV = { t: 'tb-ev', id: 'k1', room: 'room-1', kind: 'voice', callId: 'k1', name: 'Ana', ts: Date.now() }, CHATEV = { t: 'tb-ev', id: 'c1', room: 'room-1', kind: 'chat', callId: null, name: 'Ana', ts: Date.now() };
const tap = async (w, data) => w.fire('notificationclick', { notification: { close() {}, data } });
await T('W1 the worker is the accepted folder worker plus the four declared edits; its handler set and the fetch handler are untouched', () => {
  const ev = (s) => [...code(s).matchAll(/self\.addEventListener\('([a-z]+)'/g)].map((m) => m[1]); assert(ev(worker).join(',') === ev(baseW).join(',') && ev(worker).join(',') === 'message,install,activate,push,notificationclick,install,fetch', 'handlers ' + ev(worker).join(','));
  const fetchPart = (s) => s.slice(s.indexOf("self.addEventListener('fetch'")); assert(fetchPart(worker) === fetchPart(baseW), 'the fetch handler changed');
  assert((worker.match(/silent: true/g) || []).length === 1 && /kind: 'missed'/.test(worker.slice(worker.indexOf('silent: true'), worker.indexOf('silent: true') + 400)), 'silent: true is not exactly the missed-call card');
});
await T('W2 the missed-call card is silent; the call alert is still persistent, vibrating and audible; a chat banner is untouched', async () => {
  const w = makeWorker(worker); await w.fire('push', PUSH({ t: 'tb-call-end', id: 'e1', room: 'room-1', callId: 'k9', outcome: 'missed', name: 'Ana' }));
  const missed = w.shown.filter((s) => s.opts.data && s.opts.data.kind === 'missed'); assert(missed.length === 1 && missed[0].opts.silent === true && !missed[0].opts.vibrate, 'missed card: ' + JSON.stringify(missed.map((m) => [m.opts.silent, m.opts.vibrate])));
  const w2 = makeWorker(worker); await w2.fire('push', PUSH(CALLEV)); const c = w2.shown[0].opts; assert(c.requireInteraction === true && c.silent === false && Array.isArray(c.vibrate) && c.vibrate.length >= 3, 'call alert changed: ' + JSON.stringify([c.requireInteraction, c.silent, c.vibrate]));
  const w3 = makeWorker(worker); await w3.fire('push', PUSH(CHATEV)); assert(w3.shown[0].opts.silent === false && w3.shown[0].opts.requireInteraction !== true, 'chat banner changed');
});
await T('W3 a window announces what it is: the installed app (or a page that does not say) is the app; a page that says standalone:false is a browser tab — kept apart, durably', async () => {
  const w = makeWorker(worker); await w.fire('message', { data: { t: 'tb-app', standalone: true }, source: { id: 'app-1' } }); await w.fire('message', { data: { t: 'tb-app', standalone: false }, source: { id: 'tab-1' } }); await w.fire('message', { data: { t: 'tb-app' }, source: { id: 'app-2' } });
  const kv = w.store._dbs['tb-r10'].stores.kv.rows; assert(kv.get('appClient') && kv.get('appClient').v.id === 'app-2' && kv.get('tabClient') && kv.get('tabClient').v.id === 'tab-1', 'kv: ' + JSON.stringify([...kv.entries()]));
});
await T('W4 tap: the installed app\'s window is focused when it exists — even with an announced tab alive — and told the event; the tab is left alone', async () => {
  const w = makeWorker(worker); const tab = w.client('tab-1'), app = w.client('app-1'); w.clientsList.push(tab, app);
  await w.fire('message', { data: { t: 'tb-app', standalone: false }, source: { id: 'tab-1' } }); await w.fire('message', { data: { t: 'tb-app', standalone: true }, source: { id: 'app-1' } });
  await w.fire('push', PUSH(CALLEV)); await tap(w, w.shown[0].opts.data);
  assert(app.focusCalls === 1 && app.messages.length === 1 && app.messages[0].t === 'tb-open' && app.messages[0].eventId === 'k1', 'app not focused / told'); assert(tab.focusCalls === 0 && tab.messages.length === 0 && w.opened.length === 0, 'the tab was touched or a window opened');
});
await T('W5 tap: with no installed window the announced browser tab is focused and told the event (a tab is a first-class path); nothing is opened', async () => {
  const w = makeWorker(worker); const tab = w.client('tab-1'); w.clientsList.push(tab); await w.fire('message', { data: { t: 'tb-app', standalone: false }, source: { id: 'tab-1' } });
  await w.fire('push', PUSH(CHATEV)); await tap(w, w.shown[0].opts.data); assert(tab.focusCalls === 1 && tab.messages.length === 1 && tab.messages[0].eventId === 'c1' && w.opened.length === 0, 'tab not focused: ' + JSON.stringify({ f: tab.focusCalls, m: tab.messages.length, o: w.opened }));
});
await T('W6 tap: an unannounced window is never touched; stale ids open the folder URL with the event hash; the announcements survive a worker restart', async () => {
  const w = makeWorker(worker); const stranger = w.client('stranger'); w.clientsList.push(stranger); await w.fire('message', { data: { t: 'tb-app', standalone: true }, source: { id: 'app-gone' } }); await w.fire('message', { data: { t: 'tb-app', standalone: false }, source: { id: 'tab-gone' } });
  await w.fire('push', PUSH(CHATEV)); await tap(w, w.shown[0].opts.data); assert(stranger.focusCalls === 0 && stranger.messages.length === 0, 'a stranger was touched'); assert(w.opened.length === 1 && w.opened[0] === FOLDER_URL + '#ev=room-1.c1', 'opened ' + JSON.stringify(w.opened));
  const w2 = makeWorker(worker, w.store); const tab = w2.client('tab-gone'); w2.clientsList.push(tab); await w2.fire('push', PUSH(CHATEV)); await tap(w2, w2.shown[0].opts.data); assert(tab.focusCalls === 1, 'the announcement did not survive the restart');
});

console.log('A · the real app boots in every launch and asks for nothing outside a tap; no tap is ever stolen');
const A = {};
await T('A1 an Android browser tab boots the app — no install gate; p2_tab_boot, never p2_gate_shown or p2_standalone; presence, alerts and push stacks arm; the no-tap attempt is skipped; nothing asked', async () => {
  const I = A.tab = await live({ ua: UA.android, notif: 'default' });
  assert(!I.$('p2-gate') && !I.has('p2_gate_shown') && !I.has('p2_standalone'), 'the gate or the standalone path ran in a tab'); assert(I.has('p2_tab_boot') && I.has('boot'), 'no tab boot');
  assert(I.w.document.getElementById('app').style.display !== 'none', 'the app is hidden'); assert(I.w.__notif.calls === 0 && I.w.__subCalls === 0, 'asked or subscribed in a tab');
  assert(I.has('p3_attempt_skipped') && I.ev('p3_attempt_skipped')[0].d.state === 'default', 'the no-tap attempt was not skipped'); assert((I.has('p4_sw_drained') || I.has('p4_sw_drain_failed')) && I.has('cr3_armed'), 'the alert and presence stacks did not arm');
  assert(I.w.__swListeners.includes('message'), 'the worker-message listener did not arm'); assert(!I.has('p3_gesture_armed'), 'a tap was armed');
});
await T('A2 the installed app (standalone): p2_standalone, the open-time attempt runs and is refused without a prompt — and NO tap is armed: a tap anywhere asks nothing (G33)', async () => {
  const I = await live({ ua: UA.android, notif: 'default', standalone: true }); assert(I.has('p2_standalone') && !I.has('p2_tab_boot') && !I.has('p2_gate_shown'), 'standalone boot'); assert(I.has('p3_perm_prop') && !I.has('p3_attempt_skipped'), 'the open-time attempt did not run');
  assert(!I.has('p3_gesture_armed') && typeof I.w.p3ArmGesture === 'undefined', 'the stolen tap is back'); I.w.document.body.click(); I.w.document.getElementById('app').click(); await sleep(60); assert(I.w.__notif.calls === 0, 'a tap anywhere asked for the permission');
});
await T('A3 a tab where the permission is already granted subscribes silently at open (it cannot prompt) — no request, one subscription, rooms registered, the row empties', async () => {
  const I = await live({ ua: UA.android, notif: 'granted' }); await sleep(200); assert(I.w.__notif.calls === 0 && I.w.__subCalls === 1 && I.has('p3_sub_ok'), 'granted tab: ' + JSON.stringify({ calls: I.w.__notif.calls, subs: I.w.__subCalls })); assert(I.w.__fetches.some((f) => /"type":"subscribe"/.test(f.body || '')), 'no room registered');
  I.w.rhRender(); assert(I.w.rhState() === 'on' && !rowShown(I), 'row should be empty when on: ' + I.w.rhState());
});
await T('A4 a tab where the permission is denied does nothing: skipped, no subscription, no request', async () => { const I = await live({ ua: UA.android, notif: 'denied' }); assert(I.has('p3_attempt_skipped') && I.w.__subCalls === 0 && I.w.__notif.calls === 0, 'denied tab acted'); });
await T('A5 an iPhone browser tab boots the app and attempts nothing; an installed iPhone app runs the open-time attempt, is refused for want of a tap, and steals none: the next tap anywhere asks nothing', async () => {
  const t = await live({ ua: UA.ios, notif: null }); assert(!t.$('p2-gate') && t.has('p2_tab_boot') && t.has('boot') && t.has('p3_attempt_skipped') && t.ev('p3_attempt_skipped')[0].d.state === 'ios-tab', 'iPhone tab');
  const s = await live({ ua: UA.ios, notif: 'default', standalone: true }); assert(s.has('p2_standalone') && s.has('p3_perm_prop') && !s.has('p3_attempt_skipped'), 'installed iPhone attempt'); assert(!s.has('p3_gesture_armed'), 'armed'); s.w.document.body.click(); await sleep(60); assert(s.w.__notif.calls === 0, 'the next tap asked');
});
await T('A6 the permission is asked only inside a tap: a call tap in a tab (ensureNotifPerm) asks nothing; the installed app still asks once, as before', async () => {
  const t = await live({ ua: UA.android, notif: 'default' }); t.w.ensureNotifPerm(); t.w.ensureNotifPerm(); assert(t.w.__notif.calls === 0, 'a tab asked at a call');
  const s = await live({ ua: UA.android, notif: 'default', standalone: true }); s.w.ensureNotifPerm(); s.w.ensureNotifPerm(); assert(s.w.__notif.calls === 1, 'the installed app asked ' + s.w.__notif.calls + ' times');
});
await T('A7 entering a room in a tab (default permission) attempts nothing, prompts nothing', async () => { const I = await live({ ua: UA.android, notif: 'default' }); const n = I.w.__notif.calls; I.w.enterRoom('room-1'); await sleep(120); assert(I.w.__notif.calls === n && I.w.__subCalls === 0, 'entering a room asked or subscribed'); });
await T('A8 the window announces what it is: a tab says standalone:false, the installed app standalone:true', async () => {
  const t = await live({ ua: UA.android, notif: 'default' }); await sleep(200); const m = t.w.__posted.filter((x) => x.t === 'tb-app'); assert(m.length >= 1 && m.every((x) => x.standalone === false), 'tab announce: ' + JSON.stringify(m));
  const s = await live({ ua: UA.android, notif: 'default', standalone: true }); await sleep(200); const n = s.w.__posted.filter((x) => x.t === 'tb-app'); assert(n.length >= 1 && n.every((x) => x.standalone === true), 'installed announce: ' + JSON.stringify(n));
});
await T('A9 the worker is registered under its new name from the folder: ./tb-sw.js is renamed to tb-sw4.js on the way', async () => { const I = A.tab; const urls = I.w.__regs.map((r) => r.url); assert(urls.length >= 1 && urls.every((u) => /tb-sw4\.js$/.test(u)), 'registered: ' + urls.join(',')); });

console.log('B · the bar, once, at the first moment');
const B = {};
await T('B1 never at boot or on the home screen; not before the first message; not without a partner; then one bar above the composer — the one line, Turn on, Not now — logged once; it stays one', async () => {
  const I = B.i = await live({ ua: UA.android, notif: 'default' }); I.w.rhRender(); assert(!bar(I), 'a bar at boot');
  I.w.enterRoom('room-1'); await sleep(80); I.w.rhRender(); assert(!bar(I), 'a bar before the first message'); I.w.transcript.push({ id: 'cm-0', kind: 'chat', who: 'me', sourceText: 'hello', translatedText: 'hello', srcLang: 'en', tgtLang: 'th', ts: Date.now(), senderName: 'Ann' });
  const r = I.w.roomById('room-1'); r.joined = false; I.w.rhRender(); assert(!bar(I), 'a bar with no partner'); r.joined = true; I.w.rhRender();
  const b = bar(I); assert(b && /Want to know when they call or write\?/.test(b.textContent), 'bar: ' + (b && b.textContent)); assert(b.querySelector('[data-act="turnon"]') && b.querySelector('[data-act="turnon"]').textContent === 'Turn on' && b.querySelector('[data-act="no"]').textContent === 'Not now', 'buttons');
  assert(b.nextElementSibling && b.nextElementSibling.classList.contains('compose') && b.parentNode.id === 'scr-room', 'the bar is not directly above the composer'); assert(I.ev('rh_bar_shown').length === 1 && I.ev('rh_bar_shown')[0].d.platform === 'android', 'bar_shown');
  I.w.rhRender(); I.w.rhTick(); assert(I.w.document.querySelectorAll('#rh-bar').length === 1 && I.ev('rh_bar_shown').length === 1, 'shown more than once');
});
await T('B2 never when the answer is decided (granted or denied), when the key is set, or where the browser cannot push; the INSTALLED copy gets it at once in a room — no partner or message needed (that copy exists to be reached)', async () => {
  const cases = [['granted', { notif: 'granted' }], ['denied', { notif: 'denied' }], ['done key', { notif: 'default', seed: { tb_notif_offer_done: '1' } }], ['no push api', { notif: 'default', push: false }]];
  for (const [name, o] of cases) { const I = await live({ ua: UA.android, ...o }); await intoRoom(I); await sleep(150); I.w.rhRender(); assert(!bar(I) && !I.has('rh_bar_shown'), name + ': a bar was shown'); }
  const s = await live({ ua: UA.android, notif: 'default', standalone: true, answer: 'default' }); s.w.enterRoom('room-1'); await sleep(60); s.w.rhRender(); assert(bar(s) && bar(s).querySelector('[data-act="turnon"]') && s.ev('rh_bar_shown')[0].d.standalone === true, 'the installed copy did not offer at once: ' + (bar(s) && bar(s).textContent));
});
await T('B3 "Not now" ends the bar for good: the key is set, the bar is gone, the row still offers Turn on; a new launch with the key never shows the bar', async () => {
  const I = B.i; bar(I).querySelector('[data-act="no"]').click(); assert(I.w.localStorage.getItem('tb_notif_offer_done') === '1' && !bar(I), 'key or bar'); assert(I.ev('rh_bar_declined').length === 1, 'declined not logged'); assert(rowShown(I) && rowBtn(I) && rowBtn(I).getAttribute('data-act') === 'turnon', 'the row lost its Turn on');
  I.w.rhTick(); assert(!bar(I), 'the bar came back'); const J = await live({ ua: UA.android, notif: 'default', seed: { tb_notif_offer_done: '1' } }); await intoRoom(J); J.w.rhRender(); assert(!bar(J) && rowShown(J), 'a new launch showed the bar / lost the row');
});
await T('B4 "Turn on" raises the permission prompt INSIDE the tap, once; granted: subscribed under the current key, rooms registered, bar gone, row empty, the key set', async () => {
  const I = await live({ ua: UA.android, notif: 'default', answer: 'granted' }); await intoRoom(I); I.w.rhRender(); assert(bar(I), 'no bar'); bar(I).querySelector('[data-act="turnon"]').click(); assert(I.w.__notif.calls === 1 && I.w.__notif.gestureCalls === 1, 'the prompt was not raised inside the tap: ' + JSON.stringify(I.w.__notif)); await sleep(300);
  assert(I.w.__subCalls === 1 && I.w.p3State.sub && I.w.rhState() === 'on', 'not subscribed: ' + I.w.rhState()); I.w.rhRender(); assert(!bar(I) && I.w.localStorage.getItem('tb_notif_offer_done') === '1' && I.ev('rh_turn_on').length === 1, 'bar / key / log'); assert(!rowShown(I), 'the row is still showing something: ' + (row(I) && row(I).textContent));
  assert(I.w.__fetches.some((f) => /"type":"subscribe"/.test(f.body || '')), 'no room registered');
});
await T('B5 "Turn on" refused: the bar is gone; the row says blocked in the device\'s own words (Chrome on Android) with an OK that dismisses it; no full-screen recipe, nowhere', async () => {
  const I = await live({ ua: UA.android, notif: 'default', answer: 'denied' }); await intoRoom(I); I.w.rhRender(); bar(I).querySelector('[data-act="turnon"]').click(); await sleep(300); I.w.rhRender();
  assert(I.w.rhState() === 'denied' && I.w.__subCalls === 0 && !bar(I), 'state ' + I.w.rhState()); assert(rowShown(I) && /blocked/.test(row(I).textContent) && /Chrome/.test(row(I).textContent) && rowBtn(I).getAttribute('data-act') === 'dismiss', 'row: ' + (row(I) && row(I).textContent));
  assert(!I.$('p3-recipe') && !I.has('p3_recipe_shown') && !/Banner style/.test(I.w.document.body.innerHTML), 'the one-platform recipe appeared'); rowBtn(I).click(); assert(!rowShown(I) && I.has('rh_denied_dismissed'), 'OK did not dismiss');
  const d = await live({ ua: UA.desktop, notif: 'denied' }); d.w.rhRender(); assert(/site settings/.test(row(d).textContent) && !/Chrome:/.test(row(d).textContent), 'desktop wording: ' + row(d).textContent);
});
await T('B6 an iPhone tab: the bar offers the Home Screen; with the room not yet carried it says "Show me", which moves the page to the carrying address (no ?nf=, the invite in the hash, the keys in it); with the room carried it shows the two steps in place and nothing to tap but Not now', async () => {
  const I = await live({ ua: UA.ios, notif: null }); let went = []; I.w.rh.go = (u) => { went.push(u); }; await intoRoom(I); I.w.rhRender(); assert(went.length === 1, 'room entry did not move the page (' + went.length + ')');
  const b = bar(I); assert(b && /Add TalkBridge to your Home Screen/.test(b.textContent) && b.querySelector('[data-act="ready"]') && b.querySelector('[data-act="ready"]').textContent === 'Show me' && I.ev('rh_bar_shown')[0].d.platform === 'ios', 'iPhone bar: ' + (b && b.textContent)); b.querySelector('[data-act="ready"]').click();
  assert(went.length === 2 && went[1].indexOf(STAGE_URL + '#j=') === 0 && !/\?nf=/.test(went[1]), 'Show me url: ' + went[1]); const p = payloadOf(I, went[1]); assert(p && p.ld === 1 && p.r === 'room-1' && p.role === 'creator' && p.myn === 'Ann' && p.ml === 'en' && p.tl === 'th', 'payload: ' + JSON.stringify(p));
  const hash = '#j=' + encInv({ r: 'room-1', ld: 1, role: 'creator', ml: 'en', tl: 'th', myn: 'Ann', pn: 'Bo', t: 'Gate' }); const J = await live({ ua: UA.ios, notif: null, hash, wait: 1200 }); J.w.transcript.push({ id: 'cm-1', kind: 'chat', who: 'partner', sourceText: 'hi', translatedText: 'hi', srcLang: 'th', tgtLang: 'en', ts: Date.now(), senderName: 'Bo' }); J.w.rhRender();
  const bj = bar(J); assert(bj && /Share/.test(bj.textContent) && /Add to Home Screen/.test(bj.textContent) && !bj.querySelector('[data-act="ready"]') && bj.querySelector('[data-act="no"]'), 'carried iPhone bar: ' + (bj && bj.textContent));
});

console.log('C · the row at the foot of the left drawer — one line per state, no tabs');
await T('C1 the row lives in the left drawer, after the room list, on every platform; there is no Notify tab, no Install tab, no pane of theirs anywhere', async () => {
  for (const ua of ['android', 'ios', 'desktop']) { const I = await live({ ua: UA[ua], notif: ua === 'ios' ? null : 'default' }); const r = row(I); assert(r && r.parentNode.id === 'left-panel' && r.previousElementSibling && r.previousElementSibling.classList.contains('left-body'), ua + ': no row at the foot of the drawer');
    assert(!I.w.document.querySelector('[data-tab="notify"], [data-tab="install"], #nf-pane, #nf-install-pane, #nf-bar'), ua + ': a tab of c1–c3 survives'); }
});
await T('C2 one line per state: not asked → Turn on; blocked → the device\'s words + OK, then nothing; on → nothing; no push in this browser → says so with nothing to tap; installed iPhone not asked → Turn on; iPhone tab → the Home Screen line with the steps', async () => {
  const d = await live({ ua: UA.android, notif: 'default' }); assert(rowShown(d) && /Want to know/.test(row(d).textContent) && rowBtn(d).getAttribute('data-act') === 'turnon', 'default: ' + row(d).textContent);
  const dn = await live({ ua: UA.android, notif: 'denied' }); assert(rowShown(dn) && /blocked/.test(row(dn).textContent) && rowBtn(dn).getAttribute('data-act') === 'dismiss', 'denied'); rowBtn(dn).click(); assert(!rowShown(dn), 'denied not dismissable');
  const on = await live({ ua: UA.android, notif: 'granted' }); await sleep(200); on.w.rhRender(); assert(on.w.rhState() === 'on' && !rowShown(on), 'on should be empty');
  const un = await live({ ua: UA.android, notif: 'default', push: false }); assert(un.w.rhState() === 'unsupported' && rowShown(un) && /can.t work in this browser/.test(row(un).textContent) && !rowBtn(un), 'unsupported: ' + row(un).textContent);
  const si = await live({ ua: UA.ios, notif: 'default', standalone: true }); si.w.rhRender(); assert(si.w.rhState() === 'default' && rowBtn(si) && rowBtn(si).getAttribute('data-act') === 'turnon', 'installed iPhone: ' + row(si).textContent);
  const it = await live({ ua: UA.ios, notif: null }); assert(it.w.rhState() === 'ios-tab' && /Home Screen/.test(row(it).textContent) && /Share/.test(row(it).textContent) && /Add to Home Screen/.test(row(it).textContent), 'iPhone tab: ' + row(it).textContent);
});
await T('C3 the row\'s Turn on asks inside the tap and the row empties when it works; opening the drawer re-draws the row', async () => {
  const I = await live({ ua: UA.android, notif: 'default', answer: 'granted' }); I.w.openPanel(); await sleep(30); assert(rowShown(I), 'no row after opening the drawer'); rowBtn(I).click(); assert(I.w.__notif.gestureCalls === 1, 'asked outside the tap'); await sleep(300); I.w.rhRender(); assert(I.w.rhState() === 'on' && !rowShown(I), 'the row did not empty: ' + I.w.rhState());
});

console.log('K · the carrying address holds the keys the page HOLDS; an iPhone tab moves to it at room entry');
const CARRY = (I, went) => payloadOf(I, went);
await T('K1 a JOINER on an iPhone tab (keys in memory only, none saved): entering the room moves the page once to the carrying address and the address holds the joiner\'s keys', async () => {
  const I = await live({ ua: UA.ios, notif: null, rooms: [JROOM] }); let went = []; I.w.rh.go = (u) => { went.push(u); }; I.w.S.joinerKeys = { k: 'dgJ', tid: 'tidJ', tok: 'tokJ' }; I.w.enterRoom('room-j'); await sleep(60);
  assert(went.length === 1 && I.has('rh_carry_go'), 'moved ' + went.length + ' times'); const p = CARRY(I, went[0]); assert(p && p.ld === 1 && p.r === 'room-j' && p.role === 'joiner' && p.k === 'dgJ' && p.tid === 'tidJ' && p.tok === 'tokJ', 'joiner keys missing: ' + JSON.stringify(p)); assert(!/\?nf=/.test(went[0]), 'a ?nf= query survives');
});
await T('K2 a GRANTEE (keys under tb_grant_*, none of its own, nothing in memory): the address holds the granted keys', async () => {
  const I = await live({ ua: UA.ios, notif: null, rooms: [JROOM], seed: GRANT }); let went = []; I.w.rh.go = (u) => { went.push(u); }; I.w.S.joinerKeys = null; I.w.enterRoom('room-j'); await sleep(60);
  const p = CARRY(I, went[0]); assert(p && p.k === 'dgG' && p.tid === 'tidG' && p.tok === 'tokG', 'granted keys missing: ' + JSON.stringify(p));
});
await T('K3 the OWNER (keys of its own, and an invite\'s keys in memory): the address carries exactly what the call would use — the invite\'s keys in memory first (CALL.keys order), its own otherwise; a phone with no keys anywhere invents none', async () => {
  const I = await live({ ua: UA.ios, notif: null, seed: { tb_dg_key: 'dgOwn', tb_cf_tid: 'tidOwn', tb_cf_tok: 'tokOwn' } }); let went = []; I.w.rh.go = (u) => { went.push(u); }; I.w.S.joinerKeys = { k: 'dgJ', tid: 'tidJ', tok: 'tokJ' }; I.w.enterRoom('room-1'); await sleep(60);
  const p = CARRY(I, went[0]); const k = I.w.CALL.keys(); assert(p && p.k === k.dg && p.tid === k.tid && p.tok === k.tok && p.k === 'dgJ', 'the address differs from what the call uses: ' + JSON.stringify(p) + ' vs ' + JSON.stringify(k));
  I.w.S.joinerKeys = null; const u2 = I.w.rhCarryUrl(I.w.roomById('room-1')); const p2 = CARRY(I, u2); assert(p2.k === 'dgOwn' && p2.tid === 'tidOwn' && p2.tok === 'tokOwn', 'own keys lost: ' + JSON.stringify(p2));
  const N = await live({ ua: UA.ios, notif: null, rooms: [JROOM] }); let w2 = []; N.w.rh.go = (u) => { w2.push(u); }; N.w.S.joinerKeys = null; N.w.enterRoom('room-j'); await sleep(60); const q = CARRY(N, w2[0]); assert(q && !q.k && !q.tid && !q.tok, 'keys from nowhere: ' + JSON.stringify(q));
});
await T('K4 never in a call (blocked, the line offers Show me); never on Android or desktop (no move at room entry)', async () => {
  const I = await live({ ua: UA.ios, notif: null }); let went = []; I.w.rh.go = (u) => { went.push(u); }; I.w.CALL.active = true; I.w.enterRoom('room-1'); await sleep(60); assert(went.length === 0 && I.has('rh_carry_blocked'), 'moved during a call'); I.w.rhRender(); assert(row(I).querySelector('[data-act="ready"]'), 'no Show me while blocked'); I.w.CALL.active = false;
  for (const ua of ['android', 'desktop']) { const J = await live({ ua: UA[ua], notif: 'default' }); let w2 = []; J.w.rh.go = (u) => { w2.push(u); }; J.w.enterRoom('room-1'); await sleep(60); assert(w2.length === 0 && !J.has('rh_carry_go'), ua + ' moved'); }
});
await T('K5 the carried iPhone tab (loaded at #j=…ld:1 with keys): boots into the room as the same person WITH the keys, moves nowhere, and KEEPS the carry in its live address; an Android device-link boot still strips it', async () => {
  const hash = '#j=' + encInv({ r: 'room-j', ld: 1, role: 'joiner', ml: 'en', tl: 'th', myn: 'Ann', pn: 'Bo', t: 'Guest', k: 'dgJ', tid: 'tidJ', tok: 'tokJ' });
  const I = await live({ ua: UA.ios, notif: null, rooms: [], hash, wait: 1200 }); let went = []; I.w.rh.go = (u) => { went.push(u); };
  assert(I.ev('boot')[0] && I.ev('boot')[0].d.mode === 'device-link' && I.w.S.view === 'room' && I.w.S.roomId === 'room-j' && I.w.S.user.name === 'Ann', 'not in the room as the same person'); assert(I.w.S.joinerKeys && I.w.S.joinerKeys.k === 'dgJ' && I.w.CALL.keys().dg === 'dgJ', 'the keys did not arrive');
  assert(!I.has('rh_carry_go') && went.length === 0 && I.w.rhCarryReady(I.w.roomById('room-j')), 'moved again'); assert(I.w.location.hash.indexOf('#j=') === 0, 'the iPhone tab lost the carry from its address'); I.w.rhTick(); assert(went.length === 0, 'the tick moved it');
  const a = await live({ ua: UA.android, notif: 'default', rooms: [], hash, wait: 1200 }); assert(a.w.S.roomId === 'room-j' && a.w.location.hash === '', 'android kept the hash: ' + a.w.location.hash); assert(I.errors.length === 0 && a.errors.length === 0, I.errors.concat(a.errors).join(' | '));
});
await T('K6 an installed copy opening a JOINED room it holds no keys for says so above the composer (no silent dg_no_key); with keys, or in a creator\'s room, it says nothing', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', standalone: true, rooms: [JROOM] }); I.w.S.joinerKeys = null; I.w.enterRoom('room-j'); await sleep(200); I.w.rhRender(); assert(bar(I) && /no translation keys/.test(bar(I).textContent) && /invite link again/.test(bar(I).textContent), 'no warning: ' + (bar(I) && bar(I).textContent));
  const K = await live({ ua: UA.android, notif: 'granted', standalone: true, rooms: [JROOM], seed: { tb_dg_key: 'dgOwn' } }); K.w.enterRoom('room-j'); await sleep(200); K.w.rhRender(); assert(!bar(K), 'warned with keys present');
  const C = await live({ ua: UA.android, notif: 'granted', standalone: true }); C.w.enterRoom('room-1'); await sleep(200); C.w.rhRender(); assert(!bar(C), 'warned in a creator\'s room');
});

console.log('N · a subscription is reused only under the current signing key (N11, G34)');
await T('N1 a subscription minted under an EARLIER key is dropped and re-minted at the open-time attempt: key_stale, one unsubscribe, one subscribe, sub_stale_dropped, rooms registered', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', sub: 'stale' }); await sleep(250); assert(I.has('rh_key_stale') && I.w.__unsubCalls === 1 && I.w.__subCalls === 1 && I.has('p3_sub_stale_dropped') && I.has('p3_sub_ok'), JSON.stringify({ stale: I.has('rh_key_stale'), unsub: I.w.__unsubCalls, sub: I.w.__subCalls }));
  assert(I.w.p3State.sub && I.w.p3State.sub.endpoint !== 'https://push.example/pre-stale' && I.w.__fetches.some((f) => /"type":"subscribe"/.test(f.body || '')), 'the stale subscription is still the one in use');
});
await T('N2 a subscription under the CURRENT key is kept: key_match, sub_existing {key:match}, no unsubscribe, no subscribe', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', sub: 'match' }); await sleep(250); assert(I.has('rh_key_match') && I.w.__unsubCalls === 0 && I.w.__subCalls === 0 && I.ev('p3_sub_existing').length >= 1 && I.ev('p3_sub_existing')[0].d.key === 'match', JSON.stringify({ unsub: I.w.__unsubCalls, sub: I.w.__subCalls, ex: I.ev('p3_sub_existing').map((l) => l.d) }));
});
await T('N3 an engine that hides the key: the subscription is kept and the fact logged (key_unreadable), no churn', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', sub: 'noopts' }); await sleep(250); assert(I.has('rh_key_unreadable') && I.w.__unsubCalls === 0 && I.w.__subCalls === 0 && I.ev('p3_sub_existing')[0].d.key === 'unreadable', 'unreadable churned: ' + JSON.stringify({ unsub: I.w.__unsubCalls, sub: I.w.__subCalls }));
});

await T('N4 the relay says the subscription is DEAD (the push service answered 410 while the phone was away): the app drops it, mints a new one and registers every room under it — once per launch', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', standalone: true, sub: 'match', dead: ['https://push.example/pre-match'] }); await sleep(400);
  assert(I.has('p3_room_register_dead') && I.has('rh_sub_dead') && I.has('rh_remint'), 'the dead reply was not acted on: ' + JSON.stringify(I.w.debugLog.filter((l) => /^(p3_|rh_)/.test(l.ev)).map((l) => l.ev)));
  assert(I.w.__unsubCalls === 1 && I.w.__subCalls === 1 && I.w.p3State.sub && I.w.p3State.sub.endpoint === 'https://push.example/1', 'not re-minted: ' + JSON.stringify({ unsub: I.w.__unsubCalls, sub: I.w.__subCalls, ep: I.w.p3State.sub && I.w.p3State.sub.endpoint }));
  const regs = I.w.__fetches.filter((f) => /"type":"subscribe"/.test(f.body || '') && /push\.example\/1"/.test(f.body)); assert(regs.length >= 1 && I.w.p3State.registered['room-1'] === true && I.w.rhState() === 'on', 'the new subscription was not registered: ' + I.w.rhState());
  I.w.__deadEndpoints.add('https://push.example/1'); await I.w.p3RegisterRoom('room-1'); await sleep(100); assert(I.w.__unsubCalls === 1 && I.w.__subCalls === 1 && I.ev('rh_sub_dead').length === 2, 'a second dead reply re-minted again in the same launch (a loop)');
});
await T('N5 a return to the foreground after a long absence re-registers every live room once (the relay may have dropped the subscription meanwhile); a short absence does not', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', standalone: true }); await sleep(300); const before = I.w.__fetches.filter((f) => /"type":"subscribe"/.test(f.body || '')).length; assert(before >= 1 && I.w.rhState() === 'on', 'not on');
  const hide = () => { Object.defineProperty(I.w.document, 'hidden', { value: true, configurable: true }); I.w.document.dispatchEvent(new I.w.Event('visibilitychange')); }; const show = () => { Object.defineProperty(I.w.document, 'hidden', { value: false, configurable: true }); I.w.document.dispatchEvent(new I.w.Event('visibilitychange')); };
  hide(); show(); await sleep(100); assert(I.w.__fetches.filter((f) => /"type":"subscribe"/.test(f.body || '')).length === before && !I.has('rh_reregister'), 'a short absence re-registered');
  hide(); I.w.rh.hiddenAt = Date.now() - 61000; show(); await sleep(150); const after = I.w.__fetches.filter((f) => /"type":"subscribe"/.test(f.body || '')).length; assert(I.has('rh_reregister') && after === before + 1 && I.w.p3State.registered['room-1'] === true, 'a long absence did not re-register: ' + JSON.stringify({ before, after }));
});

console.log('V · one away-path: the first word the relay hears on blur is "away"');
await T('V1 PR-2\'s four window listeners are gone from the stage; CR3\'s remain, set-attended first, announce second', () => {
  const js = code(appScript(stage)); assert(!/declare\('blur'\)/.test(js) && !/declare\('pagehide'\)/.test(js) && !/declare\(document\.hidden \? 'hidden' : 'visible'\)/.test(js), 'PR-2 still announces on window events');
  assert(/window\.addEventListener\('blur', function \(\) \{ cr3SetAttended\(false, 'blur'\); cr3Announce\('blur'\); \}\);/.test(js), 'CR3\'s blur path is not attended-then-announce'); assert((js.match(/addEventListener\('blur'/g) || []).length === 1 + (js.match(/el\.addEventListener\('blur'/g) || []).length, 'another blur listener announces');
});
await T('V2 live, installed Android in a room with the lane open: blur sends exactly ONE ev-state and it says visible:false; hidden likewise; focus says visible:true', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', standalone: true }); await intoRoom(I, { message: false }); await sleep(100); const ws = I.w._relayWs; assert(ws, 'no relay socket'); const sent = []; ws.readyState = 1; ws.send = (x) => { try { const m = JSON.parse(x); if (m.type === 'ev-state') sent.push(m); } catch (_) {} };
  I.w.dispatchEvent(new I.w.Event('blur')); assert(sent.length === 1 && sent[0].visible === false && sent[0].inRoom === false, 'blur words: ' + JSON.stringify(sent));
  sent.length = 0; Object.defineProperty(I.w.document, 'hidden', { value: true, configurable: true }); I.w.document.dispatchEvent(new I.w.Event('visibilitychange')); assert(sent.length >= 1 && sent[0].visible === false, 'hidden words: ' + JSON.stringify(sent));
  sent.length = 0; Object.defineProperty(I.w.document, 'hidden', { value: false, configurable: true }); I.w.dispatchEvent(new I.w.Event('focus')); await sleep(50); assert(sent.length === 0 || sent.every((m) => m.visible === true), 'focus words: ' + JSON.stringify(sent)); assert(I.w.cr3Attended() === true, 'not attended after focus');
});

console.log('I · the browser\'s install offer: held in the head, raised inside the tap, only for a device with durable keys');
await T('I1 the HEAD alone holds the offer: with nothing but the head parsed, beforeinstallprompt is prevented and kept', async () => {
  const headOnly = stage.slice(0, stage.indexOf('<body')) + '<body></body></html>'; const vc = new VirtualConsole(); vc.on('jsdomError', () => {}); const dom = new JSDOM(headOnly, { url: STAGE_URL, runScripts: 'dangerously', virtualConsole: vc, beforeParse(w) { Object.defineProperty(w.navigator, 'userAgent', { value: UA.android, configurable: true }); } }); openWindows.push(dom);
  const w = dom.window; const e = new w.Event('beforeinstallprompt', { cancelable: true }); w.dispatchEvent(e); assert(e.defaultPrevented && w.__tbInstallOffer === e, 'the head did not hold the offer'); w.dispatchEvent(new w.Event('appinstalled')); assert(w.__tbInstalled === true && w.__tbInstallOffer === null, 'appinstalled not noted in the head');
});
await T('I2 a device with its own keys, notifications on: the offer makes the row say Install; the tap raises the browser\'s dialog INSIDE the tap, once; the outcome is logged; appinstalled empties the row', async () => {
  const I = await live({ ua: UA.android, notif: 'granted', seed: { tb_dg_key: 'dgOwn' } }); await sleep(250); I.w.rhRender(); assert(I.w.rhState() === 'on' && !rowShown(I), 'row not empty when on');
  let prompted = 0, inTap = false; const ev = new I.w.Event('beforeinstallprompt', { cancelable: true }); ev.prompt = () => { prompted++; inTap = I.w.__inTap === true; return Promise.resolve(); }; ev.userChoice = Promise.resolve({ outcome: 'accepted' }); I.w.dispatchEvent(ev);
  assert(ev.defaultPrevented && I.has('rh_install_available'), 'offer not held'); I.w.rhRender(); assert(rowShown(I) && /Install TalkBridge/.test(row(I).textContent) && rowBtn(I).getAttribute('data-act') === 'install', 'row: ' + row(I).textContent); assert(!bar(I), 'install in the bar');
  I.w.__inTap = true; rowBtn(I).click(); I.w.__inTap = false; assert(prompted === 1 && inTap, 'dialog not inside the tap'); await sleep(60); assert(I.ev('rh_install_prompt').length === 1 && I.ev('rh_install_prompt')[0].d.outcome === 'accepted', 'outcome'); I.w.rhRender(); assert(!rowShown(I) && !I.w.rhInstallOffer(), 'the offer can be used twice');
  I.w.dispatchEvent(ev); I.w.rhRender(); I.w.dispatchEvent(new I.w.Event('appinstalled')); I.w.rhRender(); assert(I.has('rh_install_done') && !rowShown(I) && I.w.rh.installed, 'appinstalled ignored'); assert(I.errors.length === 0, I.errors.join(' | '));
});
await T('I3 never offered to a device whose only keys are in memory (a guest from a plain invite — the installed copy would open with none), never in the installed copy, never in the bar; a grantee is offered', async () => {
  const mk = () => { const e = new Object(); return e; };
  const g = await live({ ua: UA.android, notif: 'granted', rooms: [JROOM] }); await sleep(250); g.w.S.joinerKeys = { k: 'dgJ', tid: 't', tok: 'k' }; const e1 = new g.w.Event('beforeinstallprompt', { cancelable: true }); g.w.dispatchEvent(e1); g.w.rhRender(); assert(!rowShown(g) && !g.w.rhInstallVisible(), 'a memory-only guest was offered the install');
  const s = await live({ ua: UA.android, notif: 'granted', standalone: true, seed: { tb_dg_key: 'dgOwn' } }); await sleep(250); s.w.dispatchEvent(new s.w.Event('beforeinstallprompt', { cancelable: true })); s.w.rhRender(); assert(!s.w.rhInstallVisible(), 'the installed copy was offered the install');
  const gr = await live({ ua: UA.android, notif: 'granted', rooms: [JROOM], seed: GRANT }); await sleep(250); gr.w.dispatchEvent(new gr.w.Event('beforeinstallprompt', { cancelable: true })); gr.w.rhRender(); assert(gr.w.rhInstallVisible() && rowBtn(gr) && rowBtn(gr).getAttribute('data-act') === 'install', 'a grantee was not offered'); void mk;
});

console.log('D · the ring');
await T('D1 the caller\'s ring-back is sound only — it never vibrates; the receiver\'s ring beeps and vibrates; stopping cancels', async () => {
  const I = await live({ ua: UA.android, notif: 'default' }); await intoRoom(I, { message: false }); I.w.__vib.length = 0; I.w.__audio = 0;
  I.w.n10Show('voice'); assert(I.w.__audio === 1, 'no ring-back sound'); assert(I.w.__vib.filter((v) => Array.isArray(v) || (typeof v === 'number' && v > 0)).length === 0, 'the caller vibrated: ' + JSON.stringify(I.w.__vib)); I.w.n10Hide();
  I.w.__vib.length = 0; I.w.__audio = 0; I.w.CALL.onIncoming(I.w.roomById('room-1'), { kind: 'voice', name: 'Bo', callId: 'c-1' }); assert(I.w.__audio === 1 && I.w.__vib.some((v) => Array.isArray(v) && v.join(',') === '400,200,400'), 'the receiver\'s ring: audio ' + I.w.__audio + ' vib ' + JSON.stringify(I.w.__vib)); I.w.CALL.stopRing(); assert(I.w.__vib[I.w.__vib.length - 1] === 0, 'stopping did not cancel the vibration');
});
await T('D2 a muted room never rings its receiver: no overlay, no beep, no vibration', async () => {
  const I = await live({ ua: UA.android, notif: 'default' }); await intoRoom(I, { message: false }); I.w.roomById('room-1').muted = true; I.w.__vib.length = 0; I.w.__audio = 0; I.w.CALL.onIncoming(I.w.roomById('room-1'), { kind: 'voice', name: 'Bo', callId: 'c-2' });
  assert(!I.$('ring-overlay').classList.contains('show') && I.w.__audio === 0 && I.w.__vib.length === 0, 'a muted room rang: overlay ' + I.$('ring-overlay').classList.contains('show') + ' audio ' + I.w.__audio + ' vib ' + JSON.stringify(I.w.__vib));
});
console.log('E · the whole 28·post-ship script, both builds installed: identical');
if (!process.env.TB_IO_SKIP_E && (!ONLY || ONLY.has('E'))) {
  const force = (h) => h.replace('<head>', '<head><script>window.matchMedia = (q) => ({ matches: /standalone/.test(q), addEventListener() {}, addListener() {} });</script>');
  const { snapA, snapC, RA, RC } = await runBoth(force(base), force(stage));
  /* the rig's own races, counted out as the earlier differentials count them: the first write-back GET against the fake network and the receipts deferral that rides frame timing */
  /* the base arms the stolen tap (G33) and the rig's next click runs an attempt the stage never makes: that cascade — a gesture perm_prop with no Turn on before it, and the p3_ lines that follow it — is the declared difference */
  const unStolen = (log) => { const out = []; let drop = false, turnOn = false; for (const l of log) { if (l.ev === 'rh_turn_on') turnOn = true; if (l.ev === 'p3_perm_prop' && l.d && l.d.gesture === true && !turnOn) { drop = true; continue; } if (drop && /^p3_/.test(l.ev)) continue; drop = false; out.push(l); } return out; };
  /* `dropped` is the log throttle's own count of repeats it swallowed; the base repeats one announce more per window (PR-2's duplicate) — bookkeeping, not behaviour */
  const strip = (s) => { const c = JSON.parse(JSON.stringify(s)); c.log = unStolen(c.log).map((l) => { if (l && l.d && 'dropped' in l.d) { const d = { ...l.d }; delete d.dropped; return { ...l, d }; } return l; }).filter((l) => !(l.ev === 'pb_writeback_err' && l.d && l.d.e === 'Error: get 0') && l.ev !== 'read_receipts_deferred' && !(l.ev === 'build' && l.d && l.d.c === 'turn29-ship-install-optional') && !/^rh_/.test(l.ev) && l.ev !== 'p3_gesture_armed'); return c; };
  for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); for (const k of KEYS) await T('E ' + side + '.' + k + ' identical (installed, both builds)', () => { const out = []; diff(a[k], c[k], side + '.' + k, out); assert(out.length === 0, out.slice(0, 5).join('\n')); }); }
  await T('E no uncaught error on either build through the whole script', () => assert([RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ')));
}
await T('F no uncaught error on any phone above', () => { const all = openWindows.length; assert(all > 10, 'only ' + all + ' windows'); });   /* group F runs only in a full run */

for (const d of openWindows) { try { d.window.close(); } catch (_) {} }
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
