#!/usr/bin/env node
/* 30·base gate — THE VIDEO BOX (§7.22), candidate 1. Structure (B1, B2, C), the install files (F), the camera's asked shape (K),
   and the differential (E): the whole 28·post-ship script on the ACCEPTED 29·post-ship page and on this stage, identical but the
   declared differences (the build line, the vb_ markers, the camera constraints, the box's own inline variables).
   Layout (B3–B12) is gated in a real browser by harness-30b-browser.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage, assemblePage, assembleManifests, applyIdentity, IDENTITY, PARTS, STAGE_PAGE, STAGE_TAG, MANIFEST_NAME, MANIFEST_IOS_NAME, FOLDER_PATH, ADDED_SYMBOLS, ADDED_MARKERS, TAIL } from './assemble-30b.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const quiet = process.argv.includes('--quiet');
const PART_TEXT = process.env.TB_30B_PART ? fs.readFileSync(process.env.TB_30B_PART, 'utf8') : fs.readFileSync(path.join(root, PARTS[0]), 'utf8');
const stage = process.env.TB_30B_PAGE ? fs.readFileSync(process.env.TB_30B_PAGE, 'utf8') : fs.readFileSync(path.join(root, 'talkbridge-app', STAGE_PAGE), 'utf8');
const base = basePage();
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const contract = /\/\* @contract([\s\S]*?)\*\//.exec(PART_TEXT); const cc = contract ? contract[1] : '';

await T('B1 the stage is the accepted 29·post-ship page + the five declared edits (2 identity, 2 camera, 1 build line) + VB-1 appended — nothing else', () => {
  assert(stage === assemblePage({ part: PART_TEXT }), 'the stage is not the assembled output');
  assert(IDENTITY.length === 5, 'edits ' + IDENTITY.length);
  const edited = applyIdentity(base);
  for (const r of IDENTITY) { assert(base.split(r.find).length === 2, r.id + ' not once in the base'); assert(stage.split(r.replace).length >= 2 && stage.split(r.replace).length === edited.split(r.replace).length, r.id + ' not in the stage as assembled'); assert(stage.indexOf(r.find) === -1, r.id + ' find left in the stage'); }
  const head = edited.slice(0, -TAIL.length); assert(stage.startsWith(head) && stage.endsWith(TAIL), 'the edited base is not the stage\'s head');
  assert(stage.slice(head.length, -TAIL.length) === '\n\n' + PART_TEXT, 'more than VB-1 was appended');
});
await T('B2 VB-1 replaces and wraps nothing and reassigns no function; each symbol it adds is declared, bound once in the stage, never in the base; its markers are declared and logged', () => {
  assert(/replaces:\s*\(none\)/.test(cc) && /wraps:\s*\(none\)/.test(cc), 'a part replaces or wraps');
  assert(!/^\s*(?:CALL\.\w+|enterRoom|tbSwapTap|tbFlipCamera|tbWireDrag|tbClearPos|log|toast|handleRelay|renderPanel|showScreen)\s*=/m.test(code(PART_TEXT)), 'the part reassigns a function');
  const declared = (/adds:([^\n]*)/.exec(cc) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean);
  assert(declared.length === ADDED_SYMBOLS.length && ADDED_SYMBOLS.every((s) => declared.includes(s)), 'declared ' + declared.join(',') + ' ≠ ' + ADDED_SYMBOLS.join(','));
  const defined = [...code(PART_TEXT).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2]);
  for (const d of defined) assert(declared.includes(d), 'defines ' + d + ' undeclared');
  const js = code(stage), bjs = code(base);
  for (const s of ADDED_SYMBOLS) { const re = new RegExp('^(?:function\\s+' + s + '\\s*\\(|var\\s+' + s + '\\s*=)', 'mg'); assert((js.match(re) || []).length === 1, s + ' bound ' + (js.match(re) || []).length + 'x'); assert(!(bjs.match(re) || []).length, s + ' already in the base'); }
  for (const mk of ADDED_MARKERS) { assert(bjs.indexOf("'" + mk + "'") === -1 && bjs.indexOf("'vb_") === -1, mk + ' in the base'); assert(PART_TEXT.indexOf("vbLog('" + mk.replace(/^vb_/, '') + "'") !== -1, mk + ' never logged'); }
});
await T('C the box is scoped to a VIDEO call: every VB-1 rule sits under #scr-room.st-video #call-band.on (or is its own probe); no transform positions the box (a transform would capture the fixed handle)', () => {
  const css = /var css =([\s\S]*?);\n  var st =/.exec(PART_TEXT); assert(css, 'no css block');
  const sels = [...css[1].matchAll(/S \+ '([^{']*)\{/g)].map((m) => m[1]);
  assert(sels.length >= 8, 'selectors ' + sels.length); assert(/var S = '#scr-room\.st-video #call-band\.on';/.test(PART_TEXT), 'scope');
  assert(!/transform\s*:/.test(css[1]), 'a transform in the box css'); assert(/position:fixed/.test(css[1]) && /z-index:15/.test(css[1]), 'not fixed at z 15');
});
await T('F the stage\'s manifests: Chrome\'s starts THIS page with the folder id; the iPhone\'s has no start_url and no id; the page links them by platform and its load-time swap names them too (the accepted page swapped to 29·ship\'s — fixed here)', () => {
  const m = assembleManifests(), c = JSON.parse(m.chrome), i = JSON.parse(m.ios);
  assert(c.start_url === './' + STAGE_PAGE && c.id === FOLDER_PATH && c.scope === './', 'chrome ' + JSON.stringify(c));
  assert(!('start_url' in i) && !('id' in i) && i.scope === './', 'ios ' + JSON.stringify(i));
  for (const f of [MANIFEST_NAME, MANIFEST_IOS_NAME]) assert(fs.readFileSync(path.join(root, 'talkbridge-app', f), 'utf8') === (f === MANIFEST_NAME ? m.chrome : m.ios), f + ' is not the assembled output');
  assert(stage.indexOf('tb-manifest-turn29') === -1, 'the stage still names a 29 manifest');
  assert(stage.indexOf("log('build', { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "'") !== -1, 'build line');
});

/* a phone with a recording camera: what is asked of getUserMedia */
async function phone(html) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/Not implemented/.test(String(e.message || e))) errors.push(String(e.message || e).slice(0, 160)); });
  const dom = new JSDOM(html, { url: 'https://acmeproducts.github.io' + FOLDER_PATH + STAGE_PAGE, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) {
    w.__gum = []; w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
    const track = (kind) => ({ kind, id: kind + Math.random(), enabled: true, stop() {}, getSettings() { return { width: 720, height: 1280, facingMode: 'user' }; } });
    const stream = (c) => { const ts = []; if (c.audio) ts.push(track('audio')); if (c.video) ts.push(track('video')); return { getTracks: () => ts.slice(), getVideoTracks: () => ts.filter((t) => t.kind === 'video'), getAudioTracks: () => ts.filter((t) => t.kind === 'audio'), addTrack(t) { ts.push(t); }, removeTrack(t) { const i = ts.indexOf(t); if (i >= 0) ts.splice(i, 1); } }; };
    Object.defineProperty(w.navigator, 'mediaDevices', { value: { getUserMedia: (c) => { w.__gum.push(JSON.parse(JSON.stringify(c))); return Promise.resolve(stream(c)); }, enumerateDevices: () => Promise.resolve([]) }, configurable: true });
    w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.WebSocket = class { constructor() { this.readyState = 1; } send() {} close() {} addEventListener() {} removeEventListener() {} };
    w.localStorage.setItem('tb_name', 'Ann'); w.localStorage.setItem('tb_dev', 'aaaa1111-0000-4000-8000-000000000001');
  } });
  await sleep(700); return { w: dom.window, errors, dom };
}
await T('K the camera is asked for a tall picture as an IDEAL (720×1280, 9:16) at the call\'s start and on the flip; never exact, never min/max (a camera that cannot do it must still open); a voice call asks for no video', async () => {
  const P = await phone(stage), w = P.w;
  await w.CALL.acquire('video'); await w.CALL.acquire('voice');
  const v = w.__gum[0], a = w.__gum[1];
  assert(v && v.video && v.video.width.ideal === 720 && v.video.height.ideal === 1280 && Math.abs(v.video.aspectRatio.ideal - 0.5625) < 1e-9, 'start ' + JSON.stringify(v));
  assert(a && a.video === false, 'voice asked for video ' + JSON.stringify(a));
  w.CALL.active = true; w.CALL.kind = 'video'; w.CALL.stream = { getVideoTracks: () => [], removeTrack() {}, addTrack() {} }; w.tbFlipCamera(); await sleep(30);
  const f = w.__gum[2]; assert(f && f.video && f.video.facingMode === 'environment' && f.video.width.ideal === 720 && f.video.height.ideal === 1280 && f.audio === false, 'flip ' + JSON.stringify(f));
  for (const g of [v, f]) assert(!/"exact"|"min"|"max"/.test(JSON.stringify(g)), 'a hard constraint ' + JSON.stringify(g));
  const B = await phone(base); await B.w.CALL.acquire('video'); assert(B.w.__gum[0].video === true, 'the base asked ' + JSON.stringify(B.w.__gum[0]));
  assert(P.errors.length === 0, P.errors.join(' | ')); P.dom.window.close(); B.dom.window.close();
});

/* E — the whole 28·post-ship script on both builds */
const force = (h) => h.replace('<head>', '<head><script>window.matchMedia = (q) => ({ matches: /standalone/.test(q), addEventListener() {}, addListener() {} });</script>');
const { snapA, snapC, RA, RC } = await runBoth(force(base), force(stage));
const strip = (s) => {
  const c = JSON.parse(JSON.stringify(s));
  c.log = (c.log || []).map((l) => { if (l && l.d && 'dropped' in l.d) { const d = { ...l.d }; delete d.dropped; return { ...l, d }; } return l; }).filter((l) => !(l.ev === 'build') && !/^vb_/.test(l.ev) && l.ev !== 'read_receipts_deferred' && l.ev !== 'cr3_recover' && l.ev !== 'cr3_local_missed_pill_dropped');   /* timing-only events, and the log limiter's dropped count (VB-1 adds lines), ignored by harness-29pos the same way */
  const unbox = (v) => typeof v === 'string' ? v.replace(/ style="--vb-[^"]*"/g, '').replace(/--vb-[a-z]+:\s*[\d.]+px;?\s*/g, '') : v;
  const deep = (v) => Array.isArray(v) ? v.map(deep) : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)])) : unbox(v);
  const greet = (m) => (m && (m.type === 'hello' || m.type === 'hello-ack') && 'dev' in m) ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'dev')) : m;   /* the rig tags each build's phone differently (a-/c-) */
  if (Array.isArray(c.wire)) c.wire = c.wire.map(greet);
  if (Array.isArray(c.sockets)) for (const sk of c.sockets) if (sk && Array.isArray(sk.sent)) sk.sent = sk.sent.map(greet);
  return deep(c);
};
for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); for (const k of KEYS) await T('E ' + side + '.' + k + ' identical (both builds; the declared differences stripped)', () => { const out = []; diff(a[k], c[k], side + '.' + k, out); assert(out.length === 0, out.slice(0, 4).join('\n')); }); }
await T('E no uncaught error on either build through the whole script', () => assert([RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ')));
await T('E the stage logged vb_shown on each video call the script makes (and the base never did)', () => { const n = (S) => ['X', 'Y'].reduce((t, k) => t + ((S[k].log || []).filter((l) => l.ev === 'vb_shown').length), 0); assert(n(snapA) === 0, 'base logged vb_'); assert(n(snapC) >= 1, 'no vb_shown in the stage run'); });

console.log('\n30·base: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
