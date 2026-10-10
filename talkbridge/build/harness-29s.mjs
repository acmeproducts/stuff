#!/usr/bin/env node
/* 29·ship harness — INSTALL OPTIONAL (§7.19), candidate 1.
   S  the stage = the accepted 29·pre-ship page + sixteen banked edits + IO-1, and nothing else (reversal proof); symbols, markers,
      no new network, credential or message type · M  manifests and the head's own choice · W  the worker, live in a shim ·
   A  the real app boots in every launch and asks for nothing outside a tap · B  the offer, once · C  the Notify tab ·
   D  the ring: the caller never vibrates, a muted room is silent · E  the window announces what it is.
   Usage: node harness-29s.mjs   TB_IO_PART=<part.js>  TB_IO_KEEP=id,id  TB_IO_KEEP_W=id,id  TB_IO_DIR=<folder>  TB_IO_NO_START_URL=1  TB_IO_IOS_START_URL=1 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage, baseWorker, pageReplacements, workerReplacements, assemblePage, assembleWorker, assembleManifests, FOLDER_PATH, STAGE_PAGE, WORKER_NAME, MANIFEST_NAME, MANIFEST_IOS_NAME, ADDED_SYMBOLS, ADDED_MARKERS, REMOVED_MARKERS, PART, TAIL } from './assemble-29s.mjs';

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
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rmLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L|p2Log|nfLog)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };
const netLines = (js) => code(js).split('\n').filter((l) => /new WebSocket\(|\bfetch\(|RELAY_WS|tb_dg_key|tb_cf_tid|tb_cf_tok|credentials\/generate|deepgram\.com/.test(l)).map((l) => l.trim());
const contractOf = (p) => { const i = p.indexOf('@contract'); return p.slice(i, p.indexOf('*/', i)); };

console.log('S · the stage is the accepted page plus the banked edits plus IO-1');
await T('S1 the page and the worker are the assembler\'s output', () => { assert(stage === assemblePage({ part, keepReplacements: KEEP }), STAGE_PAGE + ' ≠ assemblePage()'); assert(worker === assembleWorker({ keepWorkerReplacements: KEEP_W }), WORKER_NAME + ' ≠ assembleWorker()'); });
await T('S2 every find text is in the accepted page exactly once and gone from the stage; every replacement is in the stage exactly once (fifteen page edits, four worker edits)', () => {
  const reps = pageReplacements(), wreps = workerReplacements(); assert(reps.length === 15 && wreps.length === 4, 'expected 15 + 4, got ' + reps.length + ' + ' + wreps.length);
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
await T('S4 IO-1 replaces and wraps nothing; each symbol it adds is declared, bound once in the stage and never in the accepted page', () => {
  const c = contractOf(part); assert(/replaces:\s*\(none\)/.test(c) && /wraps:\s*\(none\)/.test(c), 'IO-1 must replace and wrap nothing');
  const js = code(appScript(stage)), bjs = code(appScript(base));
  for (const s of ADDED_SYMBOLS) { assert(new RegExp('adds:[^\\n]*\\b' + s + '\\b').test(c), s + ' not declared'); const re = new RegExp('^(?:function\\s+' + s + '\\s*\\(|var\\s+' + s + '\\s*=)', 'mg'); assert((js.match(re) || []).length === 1, s + ' bound ' + (js.match(re) || []).length + ' times'); assert((bjs.match(re) || []).length === 0, s + ' already bound in the accepted page'); }
  const declared = (c.match(/adds:([^\n]*)/) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean); const defined = [...new Set([...code(part).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2]))];
  for (const d of defined) assert(declared.includes(d), 'IO-1 defines ' + d + ' without declaring it'); assert(declared.length === ADDED_SYMBOLS.length, 'declared ' + declared.length + ' ≠ ' + ADDED_SYMBOLS.length);
});
await T('S5 markers(stage) = markers(accepted) + the declared ones − p2 gate_shown; none of the declared existed; each is logged somewhere', () => {
  const bm = markers(appScript(base)), sm = markers(appScript(stage));
  for (const m of ADDED_MARKERS) assert(!bm.has(m), m + ' already in the accepted page'); for (const m of REMOVED_MARKERS) assert(bm.has(m), m + ' was never in the accepted page');
  const extra = [...sm].filter((m) => !bm.has(m) && !ADDED_MARKERS.includes(m)), lost = [...bm].filter((m) => !sm.has(m) && !REMOVED_MARKERS.includes(m));
  assert(extra.length === 0, 'undeclared markers: ' + extra.join(', ')); assert(lost.length === 0, 'markers lost: ' + lost.join(', ')); for (const m of ADDED_MARKERS) assert(sm.has(m), 'declared marker never logged: ' + m);
  assert(!/p2Log\('gate_shown'/.test(code(appScript(stage))), 'the gate is still logged');
});
await T('S6 no network, credential, endpoint or storage line is added or changed; no relay message type is added (G19/G20)', () => {
  const b = netLines(appScript(base)), s = netLines(appScript(stage)); assert(JSON.stringify(b) === JSON.stringify(s), 'network lines differ: +' + s.filter((l) => !b.includes(l)).join(' | ') + ' −' + b.filter((l) => !s.includes(l)).join(' | '));
  assert(netLines(part).length === 0 && !/fetch\(|WebSocket|XMLHttpRequest|tb_dg_key|tb_cf_|tb_gh_pat|Authorization|credentials/.test(code(part)), 'IO-1 reaches for a network or a key');
  const bt = types(code(appScript(base))), sent = new Set([...types(code(part)), ...pageReplacements().flatMap((r) => [...types(r.replace)])]); for (const t of sent) assert(bt.has(t), 'new message type ' + t);
  const keys = [...code(part).matchAll(/localStorage\.\w+Item\(\s*([A-Za-z_']+)/g)].map((m) => m[1]); assert(keys.every((k) => k === 'NF_DONE_KEY'), 'IO-1 touches storage other than the one decision key: ' + keys.join(','));
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
const VAPID = Buffer.from(new Uint8Array(65).fill(4)).toString('base64url');
const ROOM = { id: 'room-1', role: 'creator', title: 'Gate', partnerName: 'Bo', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0, muted: false, goBtn: true, meta: 'top', autoRead: false };
const encInv = (p) => Buffer.from(JSON.stringify(p)).toString('base64url');
const openWindows = [];
/* A real boot of an HTML page on a fake phone. o: { html, ua, standalone, notif:'default'|'granted'|'denied'|null, answer, push, rooms, search, hash, seed } */
async function live(o) {
  o = o || {}; const errors = [], html = o.html || stage; const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/Not implemented: navigation/.test(String(e.message || e))) errors.push('jsdom: ' + String(e.message || e).slice(0, 160)); });
  const url = STAGE_URL + (o.search || '') + (o.hash || '');
  const dom = new JSDOM(html, { url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) {
    Object.defineProperty(w.navigator, 'userAgent', { value: o.ua || UA.desktop, configurable: true });
    w.__vib = []; w.__audio = 0; w.__regs = []; w.__posted = []; w.__fetches = []; w.__sockets = []; w.__subCalls = 0; w.__sub = null; w.__gesture = false; w.__swListeners = [];
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
      subscribe: () => { if (w.__notif.perm !== 'granted') return Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })); w.__subCalls++; w.__sub = { endpoint: 'https://push.example/' + w.__subCalls, toJSON() { return { endpoint: this.endpoint, keys: {} }; } }; return Promise.resolve(w.__sub); } } };
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register(u, opts) { w.__regs.push({ url: String(u), opts: opts || null }); resolveReady(reg); return Promise.resolve(reg); }, getRegistrations() { return Promise.resolve([]); }, ready, controller: null, addEventListener(t) { w.__swListeners.push(t); } }, configurable: true });
    w.fetch = (u, opts) => { w.__fetches.push({ u: String(u), body: opts && opts.body }); const j = (v) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(v), text: () => Promise.resolve('') });
      if (/workers\.dev/.test(String(u)) && opts && opts.method === 'POST') { const b = JSON.parse(opts.body); return b.type === 'vapid' ? j({ vapid: VAPID, push: true }) : j({ ok: true }); }
      return Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') }); };
    w.WebSocket = class { constructor(u) { this.url = u; this.readyState = 0; w.__sockets.push(this); } send() {} close() { this.readyState = 3; } addEventListener() {} removeEventListener() {} };
    w.AudioContext = w.webkitAudioContext = class { constructor() { w.__audio++; this.destination = {}; } createOscillator() { return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { value: 0 }, connect() {} }; } close() { return Promise.resolve(); } };
    w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
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
const bar = (I) => I.$('nf-bar');

console.log('M · what the head chooses, alone (the swap that ran later never runs)');
await T('M2 the head alone writes this stage\'s manifest link while it is parsed: iPhone Safari and iPhone Chrome get the one without start_url, Android the one with it', async () => {
  assert(!/^<link rel="manifest"/m.test(stage) && !/<link rel="manifest" href="tb-manifest-turn2[0-9]-pre-ship/.test(stage), 'a stale or static manifest link survives');
  const w0 = stage.match(/<script>document\.write\('<link rel="manifest" href="' \+ \(\((.*?)\) \? '([^']+)' : '([^']+)'\) \+ '">'\);<\/script>/); assert(w0 && w0[2] === MANIFEST_IOS_NAME && w0[3] === MANIFEST_NAME, 'the head does not name this stage\'s manifests: ' + (w0 ? w0.slice(2, 4).join(',') : 'no write'));
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

console.log('A · the real app boots in every launch and asks for nothing outside a tap');
const A = {};
await T('A1 an Android browser tab boots the app — no install gate; p2_tab_boot, never p2_gate_shown or p2_standalone; presence, alerts and push stacks arm; the permission is not asked and nothing is subscribed', async () => {
  const I = A.tab = await live({ ua: UA.android, notif: 'default' });
  assert(!I.$('p2-gate') && !I.has('p2_gate_shown') && !I.has('p2_standalone'), 'the gate or the standalone path ran in a tab'); assert(I.has('p2_tab_boot') && I.has('boot') && I.has('cr3_armed'), 'tab boot / boot / cr3_armed: ' + [I.has('p2_tab_boot'), I.has('boot'), I.has('cr3_armed')]);
  assert(I.w.document.getElementById('app').style.display !== 'none', 'the app is hidden'); assert(I.w.__notif.calls === 0 && I.w.__subCalls === 0, 'asked or subscribed: ' + JSON.stringify([I.w.__notif.calls, I.w.__subCalls]));
  assert(I.has('p3_attempt_skipped') && I.ev('p3_attempt_skipped')[0].d.state === 'default', 'the no-tap attempt was not skipped'); assert((I.has('p4_sw_drained') || I.has('p4_sw_drain_failed')) && I.w.__swListeners.includes('message'), 'the alert journal drain and the worker-message listener did not arm in a tab'); assert(I.errors.length === 0, I.errors.join(' | '));
});
await T('A2 the installed app (standalone) is as before: p2_standalone, never p2_tab_boot; the open-time attempt runs; nothing is skipped', async () => {
  const I = await live({ ua: UA.android, notif: 'default', standalone: true }); assert(I.has('p2_standalone') && !I.has('p2_tab_boot') && !I.has('p2_gate_shown'), 'standalone logs'); assert(I.has('p3_perm_prop') && I.ev('p3_perm_prop')[0].d.gesture === false && !I.has('p3_attempt_skipped'), 'the open-time attempt did not run as before'); assert(I.errors.length === 0, I.errors.join(' | '));
});
await T('A3 a tab where the permission is already granted subscribes silently at open (it cannot prompt) — no request, one subscription, rooms registered', async () => {
  const I = await live({ ua: UA.android, notif: 'granted' }); assert(I.w.__notif.calls === 0 && I.w.__subCalls === 1 && I.has('p3_sub_ok'), 'granted tab: ' + JSON.stringify([I.w.__notif.calls, I.w.__subCalls, I.has('p3_sub_ok')])); assert(I.w.__fetches.some((f) => /subscribe/.test(f.body || '')), 'rooms were not registered with the relay');
});
await T('A4 a tab where the permission is denied does nothing: skipped, no subscription, no request', async () => { const I = await live({ ua: UA.android, notif: 'denied' }); assert(I.has('p3_attempt_skipped') && I.w.__subCalls === 0 && I.w.__notif.calls === 0, 'denied tab acted'); });
await T('A5 an iPhone browser tab boots the app and attempts nothing (no Notification, no PushManager there); an installed iPhone app runs the open-time attempt as before', async () => {
  const t = await live({ ua: UA.ios, notif: null }); assert(!t.$('p2-gate') && t.has('p2_tab_boot') && t.has('boot') && t.has('p3_attempt_skipped') && t.ev('p3_attempt_skipped')[0].d.state === 'ios-tab' && t.w.__subCalls === 0, 'iPhone tab'); assert(t.errors.length === 0, t.errors.join(' | '));
  const s = await live({ ua: UA.ios, notif: 'default', standalone: true }); assert(s.has('p2_standalone') && s.has('p3_perm_prop') && !s.has('p3_attempt_skipped'), 'iPhone standalone');
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
await T('A9 the worker is registered under its new name from the folder: ./tb-sw.js is renamed to tb-sw4.js on the way (the old name never reaches the browser)', async () => { const I = A.tab; const urls = I.w.__regs.map((r) => r.url); assert(urls.length >= 1 && urls.every((u) => /tb-sw4\.js$/.test(u)), 'registered: ' + urls.join(',')); });

console.log('B · the offer, once');
const B = {};
await T('B1 never at boot or on the home screen; not in a room with no partner, or with no first message; once the room has a partner and a first message and is on screen, one bar above the composer with the words and two buttons — logged once', async () => {
  const I = B.i = await live({ ua: UA.android, notif: 'default' }); I.w.nfTick(); assert(!bar(I), 'a bar at boot');
  I.w.enterRoom('room-1'); await sleep(80); I.w.nfTick(); assert(!bar(I), 'a bar before the first message'); I.w.transcript.push({ id: 'cm-0', kind: 'chat', who: 'me', sourceText: 'hello', translatedText: 'hello', srcLang: 'en', tgtLang: 'th', ts: Date.now(), senderName: 'Ann' });
  const r = I.w.roomById('room-1'); r.joined = false; I.w.nfTick(); assert(!bar(I), 'a bar with no partner'); r.joined = true; I.w.nfTick();
  const b = bar(I); assert(b && /Want to know when they call or write\?/.test(b.textContent) && I.$('nf-yes').textContent === 'Turn on' && I.$('nf-no').textContent === 'Not now', 'bar: ' + (b && b.textContent));
  assert(b.nextElementSibling && b.nextElementSibling.classList.contains('compose') && b.parentNode.id === 'scr-room', 'the bar is not directly above the composer'); assert(I.ev('nf_offer_shown').length === 1 && I.ev('nf_offer_shown')[0].d.platform === 'android', 'offer_shown');
  I.w.nfTick(); I.w.nfTick(); assert(I.w.document.querySelectorAll('#nf-bar').length === 1 && I.ev('nf_offer_shown').length === 1, 'shown more than once');
});
await T('B2 never when the answer is already decided, or the app is installed, or the decision key is set, or the browser cannot push', async () => {
  const cases = [['granted', { notif: 'granted' }], ['denied', { notif: 'denied' }], ['installed', { notif: 'default', standalone: true, answer: 'default' }], ['done key', { notif: 'default', seed: { tb_notif_offer_done: '1' } }], ['no push api', { notif: 'default', push: false }]];
  for (const [name, o] of cases) { const I = await live({ ua: UA.android, ...o }); await intoRoom(I); I.w.nfTick(); if (name === 'installed') assert(I.w.nfState() === 'default' && I.w.nfQualifies(), 'the installed case must be otherwise eligible (state ' + I.w.nfState() + ')'); assert(!bar(I) && !I.has('nf_offer_shown'), name + ': a bar was shown'); }
});
await T('B3 "Not now" ends it for good: the key is set, the bar is gone, one short line names the way back; a new launch with the key never shows the bar', async () => {
  const I = B.i; I.$('nf-no').click(); assert(I.w.localStorage.getItem('tb_notif_offer_done') === '1' && !bar(I), 'key or bar'); const n = I.$('nf-note'); assert(n && /Room settings → Notify/.test(n.textContent) && n.nextElementSibling.classList.contains('compose'), 'note: ' + (n && n.textContent)); assert(I.ev('nf_offer_declined').length === 1, 'declined not logged');
  I.w.nfTick(); assert(!bar(I), 'the bar came back'); const J = await live({ ua: UA.android, notif: 'default', seed: { tb_notif_offer_done: I.w.localStorage.getItem('tb_notif_offer_done') } }); await intoRoom(J); J.w.nfTick(); assert(!bar(J), 'a new launch showed it again');
});
await T('B4 "Turn on" raises the permission prompt INSIDE the tap, once; granted: subscribed, rooms registered, bar and Notify tab gone, offer_taken logged', async () => {
  const I = await live({ ua: UA.android, notif: 'default', answer: 'granted' }); await intoRoom(I); I.w.nfTick(); assert(bar(I), 'no bar'); I.$('nf-yes').click(); assert(I.w.__notif.calls === 1 && I.w.__notif.gestureCalls === 1, 'the prompt was not raised inside the tap: ' + JSON.stringify(I.w.__notif)); await sleep(250);
  assert(I.w.__subCalls === 1 && I.w.p3State.sub && I.w.nfState() === 'on', 'not subscribed: ' + I.w.nfState()); assert(!bar(I) && I.w.localStorage.getItem('tb_notif_offer_done') === '1' && I.ev('nf_offer_taken').length === 1, 'bar / key / log');
  assert(I.w.document.querySelector('#drawer-tabs [data-tab="notify"]').style.display === 'none' && I.ev('nf_tab_hidden').some((l) => l.d.why === 'on'), 'the Notify tab is still there'); assert(I.w.__fetches.some((f) => /"type":"subscribe"/.test(f.body || '')), 'no room registered');
});
await T('B5 "Turn on" refused: the bar is replaced by one line saying it is blocked and where to allow it; offer_blocked is logged; the Notify tab stays and says so', async () => {
  const I = await live({ ua: UA.android, notif: 'default', answer: 'denied' }); await intoRoom(I); I.w.nfTick(); I.$('nf-yes').click(); await sleep(250);
  assert(I.w.nfState() === 'denied' && I.w.__subCalls === 0, 'state ' + I.w.nfState()); const n = I.$('nf-note'); assert(n && /blocked/.test(n.textContent), 'note: ' + (n && n.textContent)); assert(I.ev('nf_offer_blocked').length === 1, 'blocked not logged');
  assert(I.w.document.querySelector('#drawer-tabs [data-tab="notify"]').style.display !== 'none' && /blocked/i.test(I.$('nf-pane').textContent), 'the tab does not explain'); assert(!I.has('p3_recipe_shown') && I.has('p3_recipe_skipped') && !I.$('p3-recipe'), 'the app-settings recipe was shown in a tab');
});
await T('B6 an iPhone tab: the bar offers the Home Screen (words and "Show me"); "Show me" reloads the page at the room\'s link-device address — a new query so it is a navigation, the invite in the hash — and asks the browser for nothing', async () => {
  const I = await live({ ua: UA.ios, notif: null }); await intoRoom(I); let went = null; I.w.nf.go = (u) => { went = u; }; I.w.nfTick(); const b = bar(I);
  assert(b && /add TalkBridge to your Home Screen/.test(b.textContent) && I.$('nf-yes').textContent === 'Show me' && I.ev('nf_offer_shown')[0].d.platform === 'ios', 'iPhone bar: ' + (b && b.textContent)); I.$('nf-yes').click();
  assert(went && /\?nf=[a-z0-9]+#j=/.test(went) && went.indexOf(STAGE_URL) === 0, 'reload url: ' + went); const p = I.w.decInv(went.split('#j=')[1]); assert(p && p.ld === 1 && p.r === 'room-1' && p.role === 'creator' && p.myn === 'Ann' && p.ml === 'en' && p.tl === 'th', 'payload: ' + JSON.stringify(p));
  assert(I.ev('nf_ios_reload').length === 1 && I.w.localStorage.getItem('tb_notif_offer_done') === '1' && !bar(I) && I.w.__subCalls === 0, 'log / key / bar / subscribe');
  const J = await live({ ua: UA.ios, notif: null }); await intoRoom(J); J.w.nf.go = (u) => { went = 'second:' + u; }; J.w.CALL.active = true; J.w.nfReloadForSteps(); assert(went && !/^second:/.test(went), 'the page reloaded in the middle of a call'); J.w.CALL.active = false;
});

console.log('C · the Notify tab');
await T('C1 present only while notifications are not set up: shown for not-asked, allowed-but-not-subscribed, blocked and iPhone-tab; hidden once on, and where the browser cannot', async () => {
  const st = async (o) => { const I = await live({ ua: UA.android, ...o }); I.w.nfTick(); const t = I.w.document.querySelector('#drawer-tabs [data-tab="notify"]'); return { shown: !!t && t.style.display !== 'none', state: I.w.nfState(), I }; };
  const d = await st({ notif: 'default' }); assert(d.shown && d.state === 'default', 'default'); const dn = await st({ notif: 'denied' }); assert(dn.shown, 'denied'); const un = await st({ notif: 'default', push: false }); assert(!un.shown && un.state === 'unsupported', 'unsupported ' + un.state);
  const gr = await st({ notif: 'granted' }); await sleep(200); gr.I.w.nfTick(); assert(!(gr.I.w.document.querySelector('#drawer-tabs [data-tab="notify"]').style.display !== 'none') && gr.I.w.nfState() === 'on', 'granted+subscribed should hide the tab (state ' + gr.I.w.nfState() + ')');
  const ip = await live({ ua: UA.ios, notif: null }); ip.w.nfTick(); assert(ip.w.document.querySelector('#drawer-tabs [data-tab="notify"]').style.display !== 'none' && ip.w.nfState() === 'ios-tab', 'iPhone tab'); assert(d.I.ev('nf_tab_shown').length === 1 && d.I.ev('nf_tab_shown')[0].d.state === 'default', 'tab_shown log');
});
await T('C2 it is a real tab of the room settings: opening the drawer and tapping Notify shows its pane and hides the others; Turn on there asks inside the tap and the tab disappears when it works', async () => {
  const I = await live({ ua: UA.android, notif: 'default', answer: 'granted' }); await intoRoom(I); I.$('btn-drawer').click(); const tab = I.w.document.querySelector('#drawer-tabs [data-tab="notify"]'); assert(tab && tab.style.display !== 'none', 'no Notify tab after the drawer opened'); tab.click();
  assert(I.w.document.querySelector('.drawer-pane.active').getAttribute('data-pane') === 'notify' && I.w.document.querySelectorAll('.drawer-pane.active').length === 1, 'pane not active'); assert(/Get told about calls and messages/.test(I.$('nf-pane').textContent), 'pane text'); const b = I.$('nf-turnon'); assert(b, 'no Turn on button');
  b.click(); assert(I.w.__notif.gestureCalls === 1, 'the pane\'s Turn on did not ask inside the tap'); await sleep(250); assert(I.w.nfState() === 'on' && tab.style.display === 'none', 'the tab is still there after it worked'); assert(I.w.document.querySelector('.drawer-pane.active').getAttribute('data-pane') === 'general', 'the drawer was left on a hidden pane');
});
await T('C3 an installed iPhone app that has not set it up gets Turn on (it can ask in a tap); an iPhone tab gets the two Home Screen steps and nothing to turn on', async () => {
  const s = await live({ ua: UA.ios, notif: 'default', standalone: true }); await intoRoom(s); s.w.nfTick(); s.$('btn-drawer').click(); s.w.document.querySelector('#drawer-tabs [data-tab="notify"]').click(); assert(s.$('nf-turnon') && !/Add to Home Screen/.test(s.$('nf-pane').textContent), 'installed iPhone pane: ' + s.$('nf-pane').textContent.slice(0, 80));
  const t = await live({ ua: UA.ios, notif: null }); await intoRoom(t); let went = null; t.w.nf.go = (u) => { went = u; }; t.w.nfTick(); t.$('btn-drawer').click(); t.w.document.querySelector('#drawer-tabs [data-tab="notify"]').click(); assert(went && /\?nf=/.test(went), 'tapping Notify on an iPhone tab did not reload at the link-device address');
  t.w.nfRenderPane(); const txt = t.$('nf-pane').textContent; assert(/Share/.test(txt) && /Add to Home Screen/.test(txt) && !t.$('nf-turnon'), 'steps: ' + txt.slice(0, 120));
});
await T('C4 the reloaded iPhone page: loaded at ?nf=…#j=<link-device>, it boots into the room as the same person and opens Notify with the steps, asks nothing, subscribes nothing, and does not reload again', async () => {
  const hash = '#j=' + encInv({ r: 'room-1', ld: 1, role: 'creator', ml: 'en', tl: 'th', myn: 'Ann', pn: 'Bo', t: 'Gate' }); let went = null;
  const I = await live({ ua: UA.ios, notif: null, search: '?nf=abc', hash, wait: 1200 }); assert(I.has('p2_tab_boot') && I.ev('boot')[0].d.mode === 'device-link', 'boot mode: ' + JSON.stringify(I.ev('boot').map((l) => l.d)));
  assert(I.w.S.view === 'room' && I.w.S.roomId === 'room-1' && I.w.S.user.name === 'Ann', 'not in the room as the same person'); assert(I.has('nf_ios_steps') && I.w.document.querySelector('.drawer-pane.active').getAttribute('data-pane') === 'notify', 'the Notify pane did not open');
  I.w.nf.go = (u) => { went = u; }; I.w.nfRenderPane(); assert(/Add to Home Screen/.test(I.$('nf-pane').textContent), 'steps missing'); I.w.document.querySelector('#drawer-tabs [data-tab="notify"]').click(); assert(went === null, 'reloaded again'); assert(I.w.__subCalls === 0 && !I.w.__notif.calls, 'asked the browser'); assert(I.errors.length === 0, I.errors.join(' | '));
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
  const strip = (s) => { const c = JSON.parse(JSON.stringify(s)); c.log = c.log.filter((l) => !(l.ev === 'pb_writeback_err' && l.d && l.d.e === 'Error: get 0') && l.ev !== 'read_receipts_deferred' && !(l.ev === 'build' && l.d && l.d.c === 'turn29-ship-install-optional') && !/^nf_/.test(l.ev)); return c; };
  for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); for (const k of KEYS) await T('E ' + side + '.' + k + ' identical (installed, both builds)', () => { const out = []; diff(a[k], c[k], side + '.' + k, out); assert(out.length === 0, out.slice(0, 5).join('\n')); }); }
  await T('E no uncaught error on either build through the whole script', () => assert([RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ')));
}
await T('F no uncaught error on any phone above', () => { const all = openWindows.length; assert(all > 10, 'only ' + all + ' windows'); });   /* group F runs only in a full run */

for (const d of openWindows) { try { d.window.close(); } catch (_) {} }
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
