#!/usr/bin/env node
/* 30·base gate — THE VIDEO BOX (§7.22), candidate 2 (c1 rejected, G77). Structure (B1, B2, C), the install files (F), the camera's asked shape (K),
   and the differential (E): the whole 28·post-ship script on the ACCEPTED 29·post-ship page and on this stage, identical but the
   declared differences (the build line, the vb_ markers, the box's own inline variables). The camera is the accepted app's.
   Layout (B3–B12) is gated in a real browser by harness-30b-browser.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage, assemblePage, assembleManifests, applyIdentity, IDENTITY, PARTS, PART_DECL, CHROME_BACKGROUND, JENNY, JENNY_EDITS, assembleJenny, STAGE_PAGE, STAGE_TAG, MANIFEST_NAME, MANIFEST_IOS_NAME, FOLDER_PATH, TAIL } from './assemble-30b.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const quiet = process.argv.includes('--quiet');
/* each part's text: from disk, or a mutated copy (TB_30B_PART = VB-1's, TB_30B_PARTS = {"<PARTS path>": "<file>"}) */
const OVR = process.env.TB_30B_PARTS ? JSON.parse(process.env.TB_30B_PARTS) : {};
const PT = Object.fromEntries(PARTS.map((f, i) => [f, fs.readFileSync(OVR[f] || (i === 0 && process.env.TB_30B_PART) || path.join(root, f), 'utf8')]));
const PART_TEXT = PT[PARTS[0]];
const stage = process.env.TB_30B_PAGE ? fs.readFileSync(process.env.TB_30B_PAGE, 'utf8') : fs.readFileSync(path.join(root, 'talkbridge-app', STAGE_PAGE), 'utf8');
const base = basePage();
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const contractOf = (t) => { const m = /\/\* @contract([\s\S]*?)\*\//.exec(t); return m ? m[1] : ''; };
const cc = contractOf(PART_TEXT);

await T('B1 the stage is the accepted 29·post-ship page + the three declared identity edits (2 manifest names, the build line) + VB-2, CV-1, NM-1 appended in order — nothing else', () => {
  assert(PARTS.length === 3 && /vb2/.test(PARTS[0]) && /cv1/.test(PARTS[1]) && /nm1/.test(PARTS[2]), 'parts ' + PARTS.join(','));
  assert(stage === assemblePage({ parts: PT }), 'the stage is not the assembled output');
  assert(IDENTITY.length === 3 && IDENTITY.every((r) => /^I-/.test(r.id)), 'edits ' + IDENTITY.map((r) => r.id).join(','));
  const edited = applyIdentity(base);
  for (const r of IDENTITY) { assert(base.split(r.find).length === 2, r.id + ' not once in the base'); assert(stage.split(r.replace).length >= 2 && stage.split(r.replace).length === edited.split(r.replace).length, r.id + ' not in the stage as assembled'); assert(stage.indexOf(r.find) === -1, r.id + ' find left in the stage'); }
  const head = edited.slice(0, -TAIL.length); assert(stage.startsWith(head) && stage.endsWith(TAIL), 'the edited base is not the stage\'s head');
  assert(stage.slice(head.length, -TAIL.length) === PARTS.map((f) => '\n\n' + PT[f]).join(''), 'more than the three parts was appended');
});
for (const P of PART_DECL) await T('B2 ' + path.basename(P.file) + ' replaces and wraps nothing and reassigns no function; each symbol it adds is declared, bound once in the stage, never in the base; its markers are declared and logged', () => {
  const text = PT[P.file], c = contractOf(text);
  assert(/replaces:\s*\(none\)/.test(c) && /wraps:\s*\(none\)/.test(c), 'a part replaces or wraps');
  assert(!/^\s*(?:CALL\.\w+|enterRoom|tbSwapTap|tbFlipCamera|tbWireDrag|tbClearPos|log|toast|handleRelay|renderPanel|showScreen|camSenders|replaceSenderTrack|TB_FACING)\s*=/m.test(code(text)), 'the part reassigns a function');
  const declared = (/adds:([^\n]*)/.exec(c) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean);
  assert(declared.length === P.symbols.length && P.symbols.every((x) => declared.includes(x)), 'declared ' + declared.join(',') + ' ≠ ' + P.symbols.join(','));
  const defined = [...code(text).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2]);
  for (const d of defined) assert(declared.includes(d), 'defines ' + d + ' undeclared');
  const js = code(stage), bjs = code(base);
  for (const x of P.symbols) { const re = new RegExp('^(?:function\\s+' + x + '\\s*\\(|var\\s+' + x + '\\s*=)', 'mg'); assert((js.match(re) || []).length === 1, x + ' bound ' + (js.match(re) || []).length + 'x'); assert(!(bjs.match(re) || []).length, x + ' already in the base'); }
  const listed = (/markers[^:]*:([^\n]*)/.exec(c) || ['', ''])[1];
  for (const mk of P.markers) {
    assert(bjs.indexOf("'" + mk + "'") === -1 && bjs.indexOf("'" + P.prefix) === -1, mk + ' in the base');
    const call = P.logger === 'log' ? "log('" + mk + "'" : P.logger + "('" + mk.slice(P.prefix.length) + "'";
    assert(text.indexOf(call) !== -1, mk + ' never logged'); assert(listed.indexOf(mk.slice(P.prefix.length)) !== -1, mk + ' not in the contract');
  }
});
await T('C the strip is scoped to a VIDEO call: every VB-2 rule sits under #scr-room.st-video (the bar\'s hidden default aside); the band itself is never moved by a transform; it is never fixed or absolute (it stays in the room\'s flow)', () => {
  const css = /var css =([\s\S]*?);\n  var st =/.exec(PART_TEXT); assert(css, 'no css block');
  assert(/var S = '#scr-room\.st-video #call-band\.on';/.test(PART_TEXT), 'scope');
  /* every literal selector not built on S (or on SMALL / corner(), both built on S) is one of the two declared exceptions */
  const bare = [...css[1].matchAll(/(S \+ |\) \+ |corner\('\w\w', )?'([^'{]*)\{/g)].filter((m) => !m[1] && m[2] !== '').map((m) => m[2]);
  for (const l of bare) assert(l === '#vb-bar' || l === '#scr-room.st-video #transcript', 'unscoped selector ' + JSON.stringify(l));
  assert(bare.length === 2, 'bare selectors ' + JSON.stringify(bare));
  assert(!/S \+ '\{[^}]*transform/.test(css[1]) && !/S \+ '\{[^}]*position:(fixed|absolute)/.test(css[1]), 'the band moved by a transform or taken out of the flow');
  assert(/'#scr-room\.st-video #transcript\{overscroll-behavior:contain\}'/.test(css[1]), 'the chat\'s overscroll is not contained during a video call');
});
await T('F the stage\'s manifests: Chrome\'s starts THIS page with the folder id; the iPhone\'s has no start_url and no id; the page links them by platform and its load-time swap names them too (the accepted page swapped to 29·ship\'s — fixed here)', () => {
  const m = assembleManifests(), c = JSON.parse(m.chrome), i = JSON.parse(m.ios);
  assert(c.start_url === './' + STAGE_PAGE && c.id === FOLDER_PATH && c.scope === './', 'chrome ' + JSON.stringify(c));
  assert(!('start_url' in i) && !('id' in i) && i.scope === './', 'ios ' + JSON.stringify(i));
  const src = JSON.parse(fs.readFileSync(path.join(root, 'tb-manifest-turn28.webmanifest'), 'utf8'));
  assert(c.background_color === CHROME_BACKGROUND && c.background_color === c.theme_color && CHROME_BACKGROUND === '#2E8B8B', 'F3 the Android background is not the teal under the system buttons: ' + c.background_color);
  assert(i.background_color === src.background_color, 'F3 the iPhone manifest\'s background changed: ' + i.background_color);
  for (const f of [MANIFEST_NAME, MANIFEST_IOS_NAME]) assert(fs.readFileSync(path.join(root, 'talkbridge-app', f), 'utf8') === (f === MANIFEST_NAME ? m.chrome : m.ios), f + ' is not the assembled output');
  assert(stage.indexOf('tb-manifest-turn29') === -1, 'the stage still names a 29 manifest');
  assert(stage.indexOf("log('build', { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "'") !== -1, 'build line');
});

await T('J Jenny\'s instance (owner 2026-10-25, "a separate instance"): the stage page with ONLY its identity changed — its own manifests, its own home-screen title, its own build file — and its own install identity (its own app id and start page, named TalkBridge Jenny); the files on disk are the assembled output', () => {
  const jp = process.env.TB_30B_JENNY ? fs.readFileSync(process.env.TB_30B_JENNY, 'utf8') : fs.readFileSync(path.join(root, 'talkbridge-app', JENNY.page), 'utf8');
  const m = assembleManifests(), j = assembleJenny(stage, m);
  assert(jp === j.page, 'the Jenny page is not the stage page with the Jenny edits');
  let back = jp; for (const e of JENNY_EDITS) back = back.split(e.replace).join(e.find); assert(back === stage, 'the Jenny page differs from the stage page by more than its identity');
  assert(jp.indexOf(MANIFEST_NAME) === -1 && jp.indexOf(MANIFEST_IOS_NAME) === -1, 'the Jenny page still names the owner\'s manifests');
  const c = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge-app', JENNY.manifest), 'utf8')), i = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge-app', JENNY.manifestIos), 'utf8'));
  assert(fs.readFileSync(path.join(root, 'talkbridge-app', JENNY.manifest), 'utf8') === j.chrome && fs.readFileSync(path.join(root, 'talkbridge-app', JENNY.manifestIos), 'utf8') === j.ios, 'the Jenny manifests are not the assembled output');
  assert(c.id === JENNY.id && c.id !== FOLDER_PATH && c.start_url === './' + JENNY.page && c.name === 'TalkBridge Jenny' && c.scope === './', 'chrome ' + JSON.stringify(c));
  assert(!('id' in i) && !('start_url' in i) && i.name === 'TalkBridge Jenny', 'ios ' + JSON.stringify(i));
  assert(/<meta name="apple-mobile-web-app-title" content="TB Jenny">/.test(jp), 'home-screen title');
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
await T('K the camera is opened EXACTLY as the accepted app opens it (G77): video:true at the call\'s start, { facingMode } alone on the flip, no shape asked; a voice call asks for no video', async () => {
  const P = await phone(stage), B = await phone(base);
  for (const X of [P, B]) { await X.w.CALL.acquire('video'); await X.w.CALL.acquire('voice'); X.w.CALL.active = true; X.w.CALL.kind = 'video'; X.w.CALL.stream = { getVideoTracks: () => [], removeTrack() {}, addTrack() {} }; X.w.tbFlipCamera(); await sleep(30); }
  assert(JSON.stringify(P.w.__gum) === JSON.stringify(B.w.__gum), 'the stage asks the camera differently: ' + JSON.stringify(P.w.__gum) + ' vs ' + JSON.stringify(B.w.__gum));
  assert(P.w.__gum[0].video === true && P.w.__gum[1].video === false && JSON.stringify(P.w.__gum[2].video) === JSON.stringify({ facingMode: 'environment' }), JSON.stringify(P.w.__gum));
  assert(P.errors.length === 0, P.errors.join(' | ')); P.dom.window.close(); B.dom.window.close();
});

/* CV — the camera comes back (CV-1, candidate 3): a video call in a phone whose camera, senders, focus and permission the test
   controls. Time is moved by the test (CV.badSince / CV.lastTry / CV.liveSince), never slept through. */
async function callPhone(html) {
  const P = await phone(html), w = P.w; const doc = w.document;
  let n = 0; const mk = (kind, facing) => { const t = { kind, id: kind + (++n), enabled: true, readyState: 'live', muted: false, L: {}, stopped: false,
    stop() { this.readyState = 'ended'; this.stopped = true; }, addEventListener(e, f) { (this.L[e] = this.L[e] || []).push(f); }, fire(e) { if (e === 'ended') this.readyState = 'ended'; if (e === 'mute') this.muted = true; if (e === 'unmute') this.muted = false; (this.L[e] || []).forEach((f) => f()); },
    getSettings() { return { width: 480, height: 640, facingMode: facing || 'user' }; } }; return t; };
  const stream = (ts) => ({ getTracks: () => ts.slice(), getVideoTracks: () => ts.filter((t) => t.kind === 'video'), getAudioTracks: () => ts.filter((t) => t.kind === 'audio'), addTrack(t) { ts.push(t); }, removeTrack(t) { const i = ts.indexOf(t); if (i >= 0) ts.splice(i, 1); } });
  const C = { asks: [], mode: 'ok', delay: 0, facing: 'user', got: [], focus: true, rejectReplace: false };
  w.navigator.mediaDevices.getUserMedia = (c) => { C.asks.push(JSON.parse(JSON.stringify(c))); const ts = []; if (c.video) ts.push(mk('video', c.video && c.video.facingMode)); if (c.audio) ts.push(mk('audio')); C.got.push(...ts);
    if (C.mode !== 'ok') { const e = new Error(C.mode); e.name = C.mode; return new Promise((_, rj) => setTimeout(() => rj(e), C.delay)); }
    return new Promise((r) => setTimeout(() => r(stream(ts)), C.delay)); };
  doc.hasFocus = () => C.focus;
  const v = mk('video', C.facing), a = mk('audio');
  const sender = { track: v, replaceTrack(t) { if (C.rejectReplace && t) return Promise.reject(new Error('x')); this.track = t; return Promise.resolve(); } };
  const aSender = { track: a, replaceTrack(t) { this.track = t; return Promise.resolve(); } };
  w.CALL.active = true; w.CALL.kind = 'video'; w.CALL.camOn = true; w.CALL.stream = stream([a, v]); w.CALL.pc = { getSenders: () => [aSender, sender], close() {} };
  const logs = () => (w.debugLog || []).filter((l) => /^cv_/.test(l.ev)).map((l) => l.ev);
  const settle = () => sleep(C.delay + 30);
  const kick = (why) => { w.CV.lastTry = 0; w.cvCheck(why || ''); };
  w.cvCheck('');   /* the watcher's first tick: the call's tracks are wired */
  return { ...P, w, C, v, a, sender, mk, logs, settle, kick, vids: () => w.CALL.stream ? w.CALL.stream.getVideoTracks() : [] };
}
await T('CV1 a video call whose camera track ENDED (visible, focused, camera on) gets the camera back: asked exactly as the call\'s start asks it (video:true), the dead track stopped, ONE live video track in the call\'s stream, the sender given it, the self-view re-pointed, logged', async () => {
  const X = await callPhone(stage); X.v.fire('ended'); await X.settle();
  assert(JSON.stringify(X.C.asks) === JSON.stringify([{ video: true, audio: false }]), 'asks ' + JSON.stringify(X.C.asks));
  const vs = X.vids(); assert(vs.length === 1 && vs[0] !== X.v && vs[0].readyState === 'live' && vs[0].enabled === true, 'stream ' + JSON.stringify(vs.map((t) => [t.id, t.readyState])));
  assert(X.sender.track === vs[0], 'the sender does not send the new track'); assert(X.a.readyState === 'live' && X.w.CALL.stream.getAudioTracks()[0] === X.a, 'the microphone was touched');
  assert(X.w.document.getElementById('local-video').srcObject === X.w.CALL.stream, 'self-view');
  const L = X.logs(); assert(L.includes('cv_track') && L.includes('cv_restore') && L.includes('cv_restored'), L.join(','));
  assert(X.errors.length === 0, X.errors.join(' | ')); X.dom.window.close();
});
await T('CV2 a MUTED camera is replaced only after 2 visible-and-focused seconds; a mute that ends in time is left alone; the microphone\'s mute is logged, never acted on', async () => {
  const X = await callPhone(stage); X.v.fire('mute'); X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'replaced at once');
  X.v.fire('unmute'); X.kick(); X.w.CV.badSince = 0; X.v.fire('mute'); X.kick(); X.w.CV.badSince = Date.now() - 1500; X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'replaced before 2 s');
  X.w.CV.badSince = Date.now() - 2100; X.kick(); await X.settle(); assert(X.C.asks.length === 1 && X.sender.track !== X.v && X.sender.track.readyState === 'live', 'not replaced after 2 s ' + X.C.asks.length);
  X.a.fire('mute'); X.a.fire('ended'); await X.settle(); assert(X.C.asks.length === 1, 'acted on the microphone');
  assert(X.logs().filter((e) => e === 'cv_track').length >= 3, 'track events not logged'); X.dom.window.close();
});
await T('CV3 it never fights dictation: hidden or unfocused, nothing is asked (even a muted camera\'s clock does not run); focus brings it back at once', async () => {
  const X = await callPhone(stage); X.C.focus = false; X.v.fire('ended'); X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'asked while unfocused');
  X.C.focus = true; Object.defineProperty(X.w.document, 'hidden', { value: true, configurable: true }); X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'asked while hidden');
  Object.defineProperty(X.w.document, 'hidden', { value: false, configurable: true }); X.w.CV.lastTry = 0; X.w.dispatchEvent(new X.w.Event('focus')); await X.settle(); assert(X.C.asks.length === 1 && X.vids()[0].readyState === 'live', 'focus did not bring it back');
  X.dom.window.close();
});
await T('CV4 camera OFF: nothing is opened (no camera light after the person turned it off); turned back on, the camera comes back and is sent', async () => {
  const X = await callPhone(stage); X.w.CALL.camOn = false; X.v.fire('ended'); X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'opened the camera while off');
  X.w.CALL.camOn = true; X.kick(); await X.settle(); assert(X.C.asks.length === 1 && X.sender.track === X.vids()[0] && X.vids()[0].readyState === 'live', 'not back when turned on'); X.dom.window.close();
});
await T('CV5 the facing is the dying track\'s own: a back camera comes back as the back ({facingMode:"environment"}, the flip\'s ask); a new call after a flipped call (TB_FACING still "environment", the call\'s track the front) comes back as the front (video:true)', async () => {
  const X = await callPhone(stage); X.dom.window.close();
  const B = await callPhone(stage); const back = B.mk('video', 'environment'); B.w.CALL.stream.removeTrack(B.v); B.w.CALL.stream.addTrack(back); B.sender.track = back; B.kick(); back.fire('ended'); await B.settle();
  assert(JSON.stringify(B.C.asks) === JSON.stringify([{ video: { facingMode: 'environment' }, audio: false }]), 'back ' + JSON.stringify(B.C.asks)); B.dom.window.close();
  const F = await callPhone(stage); F.w.TB_FACING = 'environment'; F.v.fire('ended'); await F.settle();
  assert(JSON.stringify(F.C.asks) === JSON.stringify([{ video: true, audio: false }]), 'front ' + JSON.stringify(F.C.asks)); F.dom.window.close();
});
await T('CV6 the call ends while the camera is being asked: the new track is STOPPED (no orphaned camera), nothing is added to anything, logged as abandoned', async () => {
  const X = await callPhone(stage); X.C.delay = 120; X.v.fire('ended'); await sleep(20);
  try { X.w.CALL.teardown(); } catch (e) { X.w.CALL.active = false; X.w.CALL.stream = null; }
  await X.settle(); const t = X.C.got.find((g) => g.kind === 'video');
  assert(t && t.stopped, 'the camera was left running'); assert(X.logs().includes('cv_restore_abandoned') && !X.logs().includes('cv_restored'), X.logs().join(',')); X.dom.window.close();
});
await T('CV7 the flip runs while the camera is being asked: the stream keeps the flip\'s live track, ours is stopped — one video track, never two', async () => {
  const X = await callPhone(stage); X.C.delay = 120; X.v.fire('ended'); await sleep(20);
  const flip = X.mk('video', 'environment'); X.w.CALL.stream.addTrack(flip); await X.settle();
  const vs = X.vids(); assert(vs.length === 1 && vs[0] === flip, 'tracks ' + vs.length); assert(X.C.got.find((g) => g.kind === 'video').stopped, 'ours left running'); X.dom.window.close();
});
await T('CV8 three failures in a row stop the tries (the camera is still asked while the dead track is already removed); the person coming back (focus) is a new incident; the count is per call', async () => {
  const X = await callPhone(stage); X.C.mode = 'NotReadableError'; X.v.fire('ended'); await X.settle();
  for (let i = 0; i < 4; i++) { X.kick(); await X.settle(); }
  assert(X.C.asks.length === 3, 'asks ' + X.C.asks.length); assert(X.vids().length === 0, 'tracks');
  X.C.mode = 'ok'; X.w.CV.lastTry = 0; X.w.dispatchEvent(new X.w.Event('focus')); await X.settle(); assert(X.C.asks.length === 4 && X.vids().length === 1 && X.sender.track === X.vids()[0], 'focus did not start a new incident');
  X.w.CALL.active = false; X.w.cvCheck(''); assert(X.w.CV.fails === 0 && X.w.CV.lost === null, 'not reset when the call ended'); X.dom.window.close();
});
await T('CV9 a refused camera (NotAllowedError) is not counted and waits for the person\'s next tap — then it is asked inside that tap', async () => {
  const X = await callPhone(stage); X.C.mode = 'NotAllowedError'; X.v.fire('ended'); await X.settle();
  X.kick(); await X.settle(); X.kick(); await X.settle(); assert(X.C.asks.length === 1 && X.w.CV.fails === 0 && X.w.CV.needTap, 'asks ' + X.C.asks.length);
  X.C.mode = 'ok'; X.w.CV.lastTry = 0; X.w.document.dispatchEvent(new X.w.Event('pointerdown')); await X.settle(); assert(X.C.asks.length === 2 && X.vids()[0].readyState === 'live', 'the tap did not ask'); X.dom.window.close();
});
await T('CV10 a second dictation in the same call comes back too; a sender that refuses the track is a failure, never "restored"', async () => {
  const X = await callPhone(stage); X.v.fire('ended'); await X.settle(); const t1 = X.vids()[0];
  X.w.CV.liveSince = Date.now() - 6000; X.kick(); X.w.CV.lastTry = 0; t1.fire('ended'); await X.settle();
  assert(X.C.asks.length === 2 && X.vids()[0] !== t1 && X.sender.track === X.vids()[0], 'second incident ' + X.C.asks.length);
  const R = await callPhone(stage); R.C.rejectReplace = true; R.v.fire('ended'); await R.settle(); assert(!R.logs().includes('cv_restored') && R.logs().includes('cv_restore_failed') && R.w.CV.fails === 1, R.logs().join(','));
  X.dom.window.close(); R.dom.window.close();
});
await T('CV11 a voice call and no call never ask for the camera; a video call with no camera track at all (the flip\'s gap) is not a trigger', async () => {
  const X = await callPhone(stage); X.w.CALL.kind = 'voice'; X.v.fire('ended'); X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'voice');
  X.w.CALL.kind = 'video'; X.w.CALL.stream.removeTrack(X.v); X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'no track');
  X.w.CALL.active = false; X.kick(); await X.settle(); assert(X.C.asks.length === 0, 'no call'); X.dom.window.close();
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
