#!/usr/bin/env node
/* R10-CR1 app scenario harness (plan v20.9.0 §4.11.5 rows 1, 3, 5, 6).
   Loads the ASSEMBLED candidate bytes in a real DOM (jsdom), wires its network
   to the REAL relay Durable Object (the same class the worker deploys), and
   drives the browser lifecycle — visibility, focus, online, socket loss,
   notification taps, cold launches with #tbopen. No internal helper is called
   with manufactured state; assertions are about what the person would see.
   --mutations: plants app-side defects into a copy of the candidate and
   requires the same scenarios to go red.

   HONEST LIMITS (stated per §4.11.5): this machine proves routing, seen/count
   truth, coalescing, and surface choice inside a simulated DOM. It cannot
   prove OS banner display, banner timing, push transport, media, Deepgram, or
   install — those are live-gate and owner-device-gate facts only. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const MUTATION_MODE = process.argv.includes('--mutations');
const { TalkSession } = await import(path.join(here, '../worker-talk.js'));

/* ── the real authority behind the fake network ─────────────────────────── */
class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) { if (Array.isArray(k)) { const o = new Map(); for (const key of k) o.set(key, this.m.get(key)); return o; } return this.m.get(k); }
  async put(obj) { for (const [k, v] of Object.entries(obj)) this.m.set(k, structuredClone(v)); }
}
class FakeDoState {
  constructor() { this.storage = new FakeStorage(); this.ws = []; }
  blockConcurrencyWhile(fn) { return fn(); }
  acceptWebSocket(ws) { this.ws.push(ws); }
  getWebSockets() { return this.ws.filter(w => w.open); }
}
class Relay {
  constructor() { this.sessions = new Map(); }
  session(id) {
    if (!this.sessions.has(id)) this.sessions.set(id, { state: new FakeDoState(), dob: null });
    const s = this.sessions.get(id);
    if (!s.dob) s.dob = new TalkSession(s.state, {});
    return s;
  }
  async post(sessionId, clientId, body) {
    const s = this.session(sessionId);
    const r = await s.dob.fetch(new Request(`https://relay/signal?app=t&session=${encodeURIComponent(sessionId)}&client=${encodeURIComponent(clientId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    return r;
  }
  /* a peer device speaking the real product words over a real DO socket */
  async peerSay(sessionId, clientId, msg) {
    const s = this.session(sessionId);
    let ws = s.state.ws.find(w => w.open && w.tag && w.tag.clientId === clientId);
    if (!ws) {
      ws = { tag: { clientId }, open: true, sent: [], serializeAttachment(t) { this.tag = t; }, deserializeAttachment() { return this.tag; }, send(t) { if (this.open) this.sent.push(t); }, close() { this.open = false; } };
      s.state.acceptWebSocket(ws);
    }
    await s.dob.webSocketMessage(ws, JSON.stringify(Object.assign({ from: clientId, ts: Date.now() }, msg)));
  }
}

/* ── minimal, honest browser stubs (everything else is jsdom's real DOM) ── */
function makeWorld(html, { hash = '', relay, notifications, swNotifications, seed }) {
  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});
  const appSockets = [];  /* app-side fake WebSockets, per url */
  const dom = new JSDOM(html, {
    url: 'https://host.test/bridge-turn24-post-ship.html' + hash,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(window) {
      if (seed) seed(window);
      window.matchMedia = (q) => ({ matches: /standalone/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      window.scrollTo = () => {};
      window.HTMLMediaElement.prototype.play = () => Promise.resolve();
      window.AudioContext = class { createOscillator() { return { frequency: {}, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: {}, connect() {} }; } createMediaStreamSource() { return { connect() {} }; } createAnalyser() { return { fftSize: 0, connect() {}, getByteTimeDomainData() {} }; } close() {} get destination() { return {}; } };
      window.navigator.vibrate = () => {};
      window.crypto.randomUUID = () => crypto.randomUUID();
      /* OS alerts the APP raises — the contract says there must be none */
      window.Notification = class {
        constructor(title, opts) { notifications.push({ title, opts }); }
        static requestPermission() { return Promise.resolve('granted'); }
        close() {}
      };
      window.Notification.permission = 'granted';
      /* worker registration: showNotification records; push subscribe is fake */
      const reg = {
        scope: 'https://host.test/',
        showNotification: (title, opts) => { swNotifications.push({ title, opts }); return Promise.resolve(); },
        getNotifications: () => Promise.resolve([]),
        pushManager: { getSubscription: () => Promise.resolve(null), subscribe: () => Promise.resolve({ endpoint: 'https://push.example/app', toJSON: () => ({ endpoint: 'https://push.example/app', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } }) }) }
      };
      const swListeners = {};
      window.navigator.serviceWorker = {
        register: () => Promise.resolve(reg),
        ready: Promise.resolve(reg),
        addEventListener: (t, fn) => { (swListeners[t] = swListeners[t] || []).push(fn); },
        _emit: (t, data) => { (swListeners[t] || []).forEach(fn => fn({ data })); }
      };
      /* indexedDB: tiny in-memory kv/journal, enough for p4Idb */
      const stores = { journal: [], kv: new Map() };
      window.indexedDB = { open: () => { const r = {}; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, transaction: () => ({ objectStore: (n) => n === 'kv' ? ({ put: (v) => { stores.kv.set(v.k, v); }, get: (k) => { const g = {}; setTimeout(() => { g.result = stores.kv.get(k); g.onsuccess && g.onsuccess(); }, 0); return g; } }) : ({ add: (v) => { stores.journal.push(v); }, openCursor: () => { const c = {}; setTimeout(() => { c.result = null; c.onsuccess && c.onsuccess(); }, 0); return c; } }), oncomplete: null, onerror: null }) }; r.onsuccess && r.onsuccess(); }, 0); return r; } };
      /* network: the real DO answers */
      window.fetch = async (url, opts) => {
        const u = new URL(String(url), 'https://host.test/');
        if (u.pathname === '/signal') {
          const sessionId = u.searchParams.get('session');
          const clientId = u.searchParams.get('client');
          const s = relay.session(sessionId);
          const r = await s.dob.fetch(new Request('https://relay' + u.pathname + u.search, opts && opts.method === 'POST' ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: opts.body } : { method: 'GET' }));
          const text = await r.text();
          return { ok: r.status < 300, status: r.status, json: async () => JSON.parse(text), text: async () => text };
        }
        return { ok: false, status: 404, json: async () => ({}), text: async () => '' };
      };
      /* app-side WebSocket wired to the same DO */
      window.WebSocket = class {
        constructor(url) {
          this.url = String(url);
          this.readyState = 0;
          appSockets.push(this);
          const u = new URL(this.url.replace(/^wss:/, 'https:'));
          this._session = u.searchParams.get('session');
          this._client = u.searchParams.get('client');
          const s = relay.session(this._session);
          const self = this;
          this._do = { tag: { clientId: this._client }, open: true, serializeAttachment(t) { this.tag = t; }, deserializeAttachment() { return this.tag; }, send(t) { if (this.open && self.onmessage) setTimeout(() => self.readyState === 1 && self.onmessage({ data: t }), 0); }, close() { this.open = false; } };
          setTimeout(() => { if (this.readyState !== 0) return; this.readyState = 1; s.state.acceptWebSocket(this._do); this.onopen && this.onopen(); }, 0);
        }
        send(t) { if (this.readyState !== 1) throw new Error('not open'); relay.session(this._session).dob.webSocketMessage(this._do, t); }
        close() { this.readyState = 3; this._do.open = false; this.onclose && this.onclose({ code: 1000 }); }
      };
      window.WebSocket.prototype.OPEN = 1;
      window._appSockets = appSockets;
    }
  });
  return dom;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const CANDIDATE = fs.readFileSync(path.join(root, 'bridge-turn24-post-ship.html'), 'utf8');
let CURRENT_HTML = CANDIDATE;
const ROOM = 'room-xyz';
function seedStorage(win) {
  win.localStorage.setItem('tb_dev', 'DEV-APP');
  win.localStorage.setItem('tba_notif_asked', '1');
  win.localStorage.setItem('tba_user', JSON.stringify({ name: 'Tester' }));
  win.localStorage.setItem('tba_rooms', JSON.stringify([{ id: ROOM, role: 'creator', title: 'Pair', partnerName: 'Peer', myLang: 'en', theirLang: 'th', myName: 'Tester', autoRead: false, muted: false, goBtn: true, meta: 'top', createdAt: 1, lastAt: 1, joined: true, unread: 0 }]));
}
async function world(opts = {}) {
  const relay = opts.relay || new Relay();
  const notifications = [], swNotifications = [];
  const dom = makeWorld(opts.html || CURRENT_HTML, { hash: opts.hash || '', relay, notifications, swNotifications, seed: seedStorage });
  await sleep(50);
  return { dom, win: dom.window, relay, notifications, swNotifications };
}
function fire(win, type, target) { (target || win).dispatchEvent(new win.Event(type)); }
function setHidden(win, hidden) {
  Object.defineProperty(win.document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(win.document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
  win.document.dispatchEvent(new win.Event('visibilitychange'));
}
function logCount(win, name) { return (win.debugLog || []).filter(r => r.ev === name).length; }

async function runScenarios(html, label) {
  CURRENT_HTML = html;
  const results = [];
  async function scenario(name, fn) {
    try { await fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, e: String(e && e.message || e).split('\n')[0] }); }
  }

  await scenario('R6-cold · cold launch from a call notification lands on the answer surface, never the homepage', async () => {
    const relay = new Relay();
    await relay.peerSay(ROOM, 'PEER', { type: 'hello' });
    await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' });          /* this device belongs to the room */
    await relay.peerSay(ROOM, 'PEER', { type: 'call-start', kind: 'voice', name: 'Peer' });
    const w = await world({ relay, hash: '#tbopen=' + ROOM + ',call,voice,active' });
    await sleep(150);
    assert.equal(w.win.S.roomId, ROOM, 'cold boot must route to the event room');
    assert.equal(w.win.document.getElementById('ring-overlay').classList.contains('show'), true, 'the existing Accept/Decline surface must be up');
    assert.equal(w.notifications.length, 0, 'no app-side OS alert beside the ring');
  });

  await scenario('R6-warm-ended · tap on an ended call opens the room with its durable missed outcome, once', async () => {
    const relay = new Relay();
    await relay.peerSay(ROOM, 'PEER', { type: 'hello' });
    await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' });
    await relay.peerSay(ROOM, 'PEER', { type: 'call-start', kind: 'video', name: 'Peer' });
    await relay.peerSay(ROOM, 'PEER', { type: 'call-end' });             /* bare product word */
    const w = await world({ relay });
    await sleep(120);
    const pre = await (await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' })).json();
    assert.deepEqual(pre.proj, { chat: 0, voice: 0, video: 1 }, 'durable missed video before the tap');
    w.win.navigator.serviceWorker._emit('message', { t: 'tb-open', roomId: ROOM, eventId: 'x', kind: 'video', call: 'ended' });
    await sleep(150);
    assert.equal(w.win.S.roomId, ROOM);
    assert.equal(w.win.document.getElementById('ring-overlay').classList.contains('show'), false, 'an ended call must not replay a ring');
    const post = await (await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' })).json();
    assert.deepEqual(post.proj, { chat: 0, voice: 0, video: 0 }, 'explicit open acknowledged the exact set');
  });

  await scenario('R1 · hidden-but-routed arrival stays unseen through loss+replay; visible open clears exactly once', async () => {
    const relay = new Relay();
    const w = await world({ relay });
    await sleep(120);
    w.win.document.querySelector('.rc2') && w.win.document.querySelector('.rc2').click();
    w.win.enterRoom(ROOM);
    await sleep(120);
    setHidden(w.win, true);
    await relay.peerSay(ROOM, 'PEER', { type: 'hello' });
    await relay.peerSay(ROOM, 'PEER', { type: 'chat-msg', chatId: 'cH', srcText: 'hi', tgtText: 'hi', ts: Date.now() });
    await sleep(120);
    let r = await (await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' })).json();
    assert.deepEqual(r.proj, { chat: 1, voice: 0, video: 0 }, 'hidden delivery on a routed socket is NOT seen');
    assert.equal(w.notifications.length, 0, 'a hidden device gets its one OS alert from the push→worker path; the app raises none');
    /* socket loss + replay + simultaneous wake signals */
    (w.win._appSockets || []).forEach(s => s.readyState === 1 && s.close());
    setHidden(w.win, false); fire(w.win, 'focus'); fire(w.win, 'online');
    await sleep(250);
    r = await (await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' })).json();
    assert.deepEqual(r.proj, { chat: 0, voice: 0, video: 0 }, 'returning visible IN the routed room is the explicit open — it acknowledges once');
    assert.equal(w.win.waitingOf(w.win.roomById(ROOM)).chat, 0, 'the home display mirrors the authority — no browser-side count survives');
  });

  await scenario('R3 · simultaneous visibility/focus/online coalesce into one recovery pass', async () => {
    const relay = new Relay();
    const w = await world({ relay });
    await sleep(120);
    const before = logCount(w.win, 'cr1_recover');
    setHidden(w.win, true); setHidden(w.win, false); fire(w.win, 'focus'); fire(w.win, 'online');
    await sleep(60);
    const during = logCount(w.win, 'cr1_recover') - before;
    assert.equal(during <= 2, true, 'burst of wake signals must coalesce (one pass, at most one queued rerun), saw ' + during);
  });

  await scenario('R5 · visible-in-room chat: bubble only, seen at once, no OS alert, no count anywhere', async () => {
    const relay = new Relay();
    const w = await world({ relay });
    await sleep(120);
    w.win.enterRoom(ROOM);
    await sleep(120);
    await relay.peerSay(ROOM, 'PEER', { type: 'hello' });
    await relay.peerSay(ROOM, 'PEER', { type: 'chat-msg', chatId: 'cV', srcText: 'hi', tgtText: 'hi', ts: Date.now() });
    await sleep(160);
    const r = await (await relay.post(ROOM, 'DEV-APP', { type: 'events-sync' })).json();
    assert.deepEqual(r.proj, { chat: 0, voice: 0, video: 0 }, 'a visibly handled event is seen');
    assert.equal(w.notifications.length, 0, 'no app-side OS alert');
    assert.equal(w.swNotifications.length, 0, 'no app-raised worker notification');
    assert.equal(w.win.waitingOf(w.win.roomById(ROOM)).chat, 0, 'home projection shows nothing waiting');
  });

  let failed = 0;
  for (const r of results) {
    console.log((r.ok ? 'PASS' : 'FAIL') + '  [' + label + '] ' + r.name + (r.ok ? '' : '  — ' + r.e));
    if (!r.ok) failed += 1;
  }
  return failed;
}

if (!MUTATION_MODE) {
  const failed = await runScenarios(CANDIDATE, 'candidate');
  if (failed) { console.error(failed + ' app scenario(s) failed'); process.exit(1); }
  console.log('app harness: all scenarios pass on the candidate');
} else {
  /* Paired planted defects (§4.11.5): each buried failure goes back in; the
     same scenarios must go red. */
  const MUT = [
    ['app-counted-set · a browser-side count is the home truth again (R10.5 second authority)',
      [["waitingOf = function (r) {",
        "waitingOf = function (r) { if (r) { var w0 = r.waiting || (r.waiting = { chat: 0, voice: 0, video: 0 }); return w0; } "],
       ["bumpWaiting = function (r, kind) {",
        "bumpWaiting = function (r, kind) { if (r) { var w1 = r.waiting || (r.waiting = { chat: 0, voice: 0, video: 0 }); w1[kind] = (w1[kind] || 0) + 1; r.unread = w1.chat + w1.voice + w1.video; renderPanel(); return; }"],
       ["  var r = roomById(roomId);\n  if (r) {\n    r.waiting =",
        "  var r = roomById(roomId);\n  if (false) {\n    r.waiting ="]]],
    ['replay-marks-seen · every sync acknowledges everything',
      "  return p3RelayPost(roomId, { type: 'events-sync' }).then(function (out) {",
      "  return p3RelayPost(roomId, { type: 'events-sync' }).then(function (out) {\n    if (out && out.unseen && out.unseen.length) { p3RelayPost(roomId, { type: 'event-seen', ids: out.unseen.map(function (u) { return u.id; }) }); out = { ok: true, proj: { chat: 0, voice: 0, video: 0 }, unseen: [] }; }"],
    ['app-side-os-alert · osNotify raises a second surface again',
      "osNotify = function (title, body, roomId) {\n  /* Hidden device",
      "osNotify = function (title, body, roomId) { try { new Notification(title || 'TalkBridge', { body: body }); } catch (_) {}\n  /* Hidden device"],
    ['cold-open-ungated · boot ignores the notification hash and lands on the homepage',
      "  var open = cr1ParseHash();",
      "  var open = null; cr1ParseHash();"]
  ];
  let notCaught = 0;
  for (const [name, find, replace] of MUT) {
    const pairs = Array.isArray(find) ? find : [[find, replace]];
    let mutant = CANDIDATE, missing = false;
    for (const [f, rep] of pairs) { if (!mutant.includes(f)) { missing = true; break; } mutant = mutant.replace(f, rep); }
    if (missing) { console.log('FAIL  ' + name + '  — anchor missing'); notCaught += 1; continue; }
    const failed = await runScenarios(mutant, 'mutant');
    console.log((failed ? 'PASS' : 'FAIL') + '  planted: ' + name + (failed ? '  — scenarios went red as required' : '  — SCENARIOS STAYED GREEN'));
    if (!failed) notCaught += 1;
  }
  if (notCaught) { console.error(notCaught + ' app mutation(s) not caught'); process.exit(1); }
  console.log('app mutation gate: every planted defect was caught');
}
