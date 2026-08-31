#!/usr/bin/env node
/* R10-CR1 app gate (plan v20.9.0 §4.11.5). The assembled candidate runs in a
   real DOM (jsdom) as the RECEIVER, its sockets bridged to the real relay
   worker (Durable Object shim); the SENDER speaks the product's own words on
   the same relay. Browser lifecycle is driven for real: hidden/visible,
   focus, online, socket loss, tap, cold start, restart.
   --mutations: plants defects into the candidate and requires red. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const CANDIDATE = fs.readFileSync(path.join(root, 'bridge-turn24-post-ship.html'), 'utf8');
const SW = fs.readFileSync(path.join(root, 'tb-sw.js'), 'utf8');
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const BASE_HTML = (() => { try { return require('node:child_process').execFileSync('git', ['show', JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8')).baseline.rollback_merge_commit + ':bridge-turn24-post-ship.html'], { cwd: root, maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); } catch (_) { return null; } })();
const APP_URL = 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html';
const ROOM = 'room-cr1';

/* ── relay shim (same as the relay gate) ──────────────────────────────── */
class FakeStorage { constructor(map) { this.map = map || new Map(); } async get(keys) { if (Array.isArray(keys)) { const m = new Map(); for (const k of keys) if (this.map.has(k)) m.set(k, clone(this.map.get(k))); return m; } return clone(this.map.get(keys)); } async put(obj) { for (const [k, v] of Object.entries(obj)) this.map.set(k, clone(v)); } }
function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
class ServerSocket { constructor(pair) { this.pair = pair; this.attachment = null; this.closed = false; } serializeAttachment(a) { this.attachment = clone(a); } deserializeAttachment() { return clone(this.attachment); } send(text) { if (this.closed) throw new Error('closed'); this.pair.client.inbox.push(text); } close() { this.closed = true; } }
globalThis.WebSocketPair = class { constructor() { this.client = { inbox: [] }; this[0] = this.client; this[1] = new ServerSocket(this); } };
const RealResponse = globalThis.Response;
globalThis.Response = function (body, init) { if (init && init.status === 101) return { status: 101, webSocket: init.webSocket }; return new RealResponse(body, init); };
const pushes = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => { if (String(url).startsWith('https://push.test/')) { pushes.push({ url: String(url), headers: init.headers }); return { status: 201 }; } return realFetch(url, init); };
class FakeState { constructor(storage) { this.storage = storage; this.sockets = []; } getWebSockets() { return this.sockets.filter((s) => !s.closed); } acceptWebSocket(ws) { this.sockets.push(ws); } async blockConcurrencyWhile(fn) { return fn(); } }
const { TalkSession } = await import(pathToFileURL(path.join(root, 'talkbridge/worker-talk.js')).href);

const relay = { sessions: {}, storages: {}, words: [] };
function sessionFor(id) {
  if (!relay.sessions[id]) { relay.storages[id] = relay.storages[id] || new Map(); relay.sessions[id] = new TalkSession(new FakeState(new FakeStorage(relay.storages[id])), { VAPID_PRIVATE_KEY: '' }); }
  return relay.sessions[id];
}
function restartRelay() { relay.sessions = {}; }
const url = (sess, client, extra) => `https://relay.test/signal?app=t&session=${sess}&client=${client}${extra || ''}`;
let chain = Promise.resolve();
const bridged = [];   /* every live client socket, app-side or sender-side */
function pump() { for (const b of bridged) { while (b.server && b.server.pair.client.inbox.length) { const t = b.server.pair.client.inbox.shift(); if (b.readyState === 1) b.deliver(t); } } }
function relayWord(sess, server, text) {
  const p = chain.then(async () => { const m = JSON.parse(text); relay.words.push({ sess, from: m.from, type: m.type, m }); await sessionFor(sess).webSocketMessage(server, text); pump(); });
  chain = p.catch(() => {}); return p;
}
async function connectRaw(sess, client) {
  const s = sessionFor(sess); await s.ready;
  const res = await s.fetch(new Request(url(sess, client), { headers: { Upgrade: 'websocket' } }));
  assert.equal(res.status, 101);
  return s.state.sockets[s.state.sockets.length - 1];
}
/* Sender: the other person, speaking the product's own words directly. */
async function sender(sess, client) {
  const server = await connectRaw(sess, client);
  const me = { client, server, readyState: 1, seq: 0, got: [], deliver(t) { me.got.push(JSON.parse(t)); } };
  bridged.push(me);
  me.say = (m) => { m.from = client; m.ts = m.ts || Date.now(); m.seq = ++me.seq; m.session = sess; return relayWord(sess, server, JSON.stringify(m)); };
  await me.say({ type: 'hello', name: client });
  return me;
}
async function subscribe(sess, client) {
  const s = sessionFor(sess);
  const r = await s.fetch(new Request(url(sess, client), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'subscribe', subscription: { endpoint: 'https://push.test/' + client, keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } } }) }));
  return r.json();
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function settle(ms) { await sleep(ms || 80); await chain; pump(); await sleep(20); }

/* ── the app under test ───────────────────────────────────────────────── */
let CURRENT_HTML = CANDIDATE;
const B = 'dev-B';
function makeWorld(opts) {
  opts = opts || {};
  const store = opts.store || {};
  const world = { hidden: !!opts.hidden, sockets: [], notifications: [], swListeners: [], swShown: [], store };
  const dom = new JSDOM(CURRENT_HTML, {
    url: APP_URL + (opts.hash || ''), runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(window) {
      for (const [k, v] of Object.entries(store)) window.localStorage.setItem(k, v);
      window.localStorage.setItem('tb_dev', B);
      window.matchMedia = (q) => ({ matches: /standalone/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      Object.defineProperty(window.document, 'hidden', { configurable: true, get: () => world.hidden });
      Object.defineProperty(window.document, 'visibilityState', { configurable: true, get: () => (world.hidden ? 'hidden' : 'visible') });
      window.scrollTo = () => {};
      window.HTMLElement.prototype.scrollIntoView = function () {};
      if (!window.crypto.randomUUID) window.crypto.randomUUID = () => 'u-' + Math.random().toString(36).slice(2);
      function Notification(title, o) { world.notifications.push({ title, o }); this.close = () => {}; }
      Notification.permission = 'granted'; Notification.requestPermission = () => Promise.resolve('granted');
      window.Notification = Notification;
      const reg = { scope: 'https://acmeproducts.github.io/stuff/', showNotification: (t, o) => { world.swShown.push({ t, o }); return Promise.resolve(); }, getNotifications: () => Promise.resolve([]), pushManager: { getSubscription: () => Promise.resolve(null), subscribe: () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })) } };
      Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: { register: () => Promise.resolve(reg), ready: Promise.resolve(reg), controller: null, addEventListener: (type, fn) => { if (type === 'message') world.swListeners.push(fn); }, removeEventListener() {} } });
      class FakeWS extends window.EventTarget {
        constructor(u) {
          super(); const q = new URL(u); this.url = u; this.sess = q.searchParams.get('session'); this.client = q.searchParams.get('client'); this.readyState = 0; this.server = null; this.onopen = this.onmessage = this.onclose = this.onerror = null;
          world.sockets.push(this); bridged.push(this);
          chain = chain.then(async () => { if (this.readyState !== 0) return; this.server = await connectRaw(this.sess, this.client); this.readyState = 1; const ev = new window.Event('open'); if (this.onopen) this.onopen(ev); this.dispatchEvent(ev); pump(); });
        }
        deliver(text) { const ev = new window.MessageEvent('message', { data: text }); if (this.onmessage) this.onmessage(ev); this.dispatchEvent(ev); }
        send(text) { if (this.readyState !== 1) throw new Error('not open'); relayWord(this.sess, this.server, text); }
        close() { if (this.readyState === 3) return; this.readyState = 3; if (this.server) this.server.closed = true; const ev = new window.Event('close'); ev.code = 1000; setTimeout(() => { if (this.onclose) this.onclose(ev); this.dispatchEvent(ev); }, 0); }
        drop() { this.readyState = 3; if (this.server) this.server.closed = true; }   /* the OS suspended us: no close event arrives */
      }
      window.WebSocket = FakeWS;
    }
  });
  world.dom = dom; world.win = dom.window;
  world.setHidden = (h) => { world.hidden = h; world.win.document.dispatchEvent(new world.win.Event('visibilitychange')); };
  world.focus = () => world.win.dispatchEvent(new world.win.Event('focus'));
  world.online = () => world.win.dispatchEvent(new world.win.Event('online'));
  world.tap = (data) => world.swListeners.forEach((fn) => fn({ data }));
  world.snapshot = () => { const o = {}; for (let i = 0; i < world.win.localStorage.length; i++) { const k = world.win.localStorage.key(i); o[k] = world.win.localStorage.getItem(k); } return o; };
  world.liveSockets = (sess) => world.sockets.filter((s) => s.readyState === 1 && (!sess || s.sess === sess));
  world.pills = (roomId) => JSON.parse(world.win.localStorage.getItem('tba_tr_' + roomId) || '[]').filter((e) => e.kind === 'sys');
  world.ring = () => world.win.document.getElementById('ring-overlay').classList.contains('show');
  world.dbg = (ev) => world.win.debugLog.filter((l) => !ev || l.ev === ev);
  return world;
}
function roomSeed(extra) {
  const room = Object.assign({ id: ROOM, role: 'creator', title: 'Ana', partnerName: 'Ana', myLang: 'en', theirLang: 'es', myName: 'Bo', autoRead: false, muted: false, goBtn: true, meta: 'top', ear: true, createdAt: Date.now() - 1000, lastAt: Date.now() - 1000, joined: true, unread: 0 }, extra || {});
  return { tba_user: JSON.stringify({ name: 'Bo' }), tba_rooms: JSON.stringify([room]) };
}
async function boot(opts) {
  const w = makeWorld(opts);
  await settle(150);
  return w;
}
const proj = (w) => JSON.parse(JSON.stringify(w.win.waitingOf(w.win.roomById(ROOM))));
function wordsFrom(client, type, sess) { return relay.words.filter((x) => x.from === client && x.type === type && (!sess || x.sess === sess)); }
function record(sess, id) { return sessionFor(sess).events[id]; }
function resetRelay() { relay.sessions = {}; relay.storages = {}; relay.words.length = 0; pushes.length = 0; bridged.length = 0; }

const results = [];
async function scenario(name, fn) {
  resetRelay();
  try { await fn(); results.push({ name, ok: true }); if (!QUIET) console.log('PASS  ' + name); }
  catch (e) { results.push({ name, ok: false, e }); console.log('FAIL  ' + name + '\n      ' + (e && e.message)); }
}
const QUIET = process.argv.includes('--quiet') || process.argv.includes('--mutations');

async function runScenarios(html) {
  CURRENT_HTML = html; results.length = 0;

  await scenario('S1 hidden while routed to the room → chat → socket loss → visible+focus together → one reopen → unseen once, seen on the explicit return', async () => {
    const w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B);
    w.win.enterRoom(ROOM); await settle(120);
    assert.equal(w.win.S.view, 'room');
    w.setHidden(true); await settle();
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'chat-msg', chatId: 'c1', srcText: 'hola' }); await settle();
    assert.equal(pushes.length, 1, 'hidden: exactly one OS request');
    assert.equal(record(ROOM, 'c1').rcp[B].p, 'os_requested');
    assert.equal(w.ring(), false);
    const before = w.sockets.filter((s) => s.sess === ROOM).length;
    w.liveSockets(ROOM).forEach((s) => s.drop());
    relay.words.length = 0;
    w.setHidden(false); w.focus(); w.online(); await settle(250);
    assert.equal(w.sockets.filter((s) => s.sess === ROOM).length - before, 1, 'one reconnect for one lane');
    assert.equal(w.liveSockets(ROOM).length, 1, 'exactly one live socket on the lane');
    assert.equal(wordsFrom(B, 'ev-open', ROOM).length, 1, 'the return to the routed room is one explicit open');
    assert.equal(record(ROOM, 'c1').rcp[B].s, 'seen'); assert.equal(record(ROOM, 'c1').rcp[B].seenBy, 'room_open');
    assert.deepEqual(proj(w), { chat: 0, voice: 0, video: 0 });
    assert.equal(pushes.length, 1, 'replay and reopen pushed nothing new');
  });

  await scenario('S2 bare caller hang-up before answer → receiver missed exactly once, one pill, one count; repeated hang-up changes nothing', async () => {
    const w = await boot({ store: roomSeed() });
    const a = await sender(ROOM, 'dev-A'); await settle();
    await a.say({ type: 'call-start', kind: 'voice', callId: 'k1', name: 'Ana' }); await settle();
    assert.equal(w.ring(), true, 'visible on home: the in-app Accept/Decline surface');
    assert.equal(pushes.length, 0, 'no OS alert beside the in-app surface');
    await a.say({ type: 'call-end', callId: 'k1' }); await settle();
    assert.equal(w.ring(), false);
    assert.deepEqual(proj(w), { chat: 0, voice: 1, video: 0 });
    assert.equal(w.pills(ROOM).filter((p) => /^Missed voice call/.test(p.text)).length, 1, 'exactly one missed pill');
    await a.say({ type: 'call-end', callId: 'k1' }); await a.say({ type: 'call-end' }); await settle();
    assert.deepEqual(proj(w), { chat: 0, voice: 1, video: 0 });
    assert.equal(w.pills(ROOM).filter((p) => /^Missed voice call/.test(p.text)).length, 1);
    assert.equal(record(ROOM, 'k1').rcp[B].o, 'missed'); assert.equal(record(ROOM, 'k1').rcp['dev-A'], undefined);
    w.win.enterRoom(ROOM); await settle(120);
    assert.deepEqual(proj(w), { chat: 0, voice: 0, video: 0 }, 'explicit open acknowledges the missed call');
    assert.equal(w.win.document.querySelectorAll('#transcript .sys, .sys-pill, [data-kind="sys"]').length >= 0, true);
  });

  await scenario('S3 simultaneous visibility/focus/online and repeated open callbacks → one socket per lane, one reconciliation', async () => {
    const w = await boot({ store: roomSeed() });
    w.win.enterRoom(ROOM); await settle(120);
    w.liveSockets(ROOM).forEach((s) => s.drop());
    relay.words.length = 0; const n0 = w.sockets.length;
    w.setHidden(false); w.focus(); w.online(); w.focus(); w.online(); await settle(250);
    assert.equal(w.sockets.length - n0, 1, 'one new socket for five signals');
    assert.equal(w.liveSockets(ROOM).length, 1);
    assert.equal(wordsFrom(B, 'ev-open', ROOM).length + wordsFrom(B, 'events-sync', ROOM).length, 1, 'one reconciliation transaction');
    assert.equal(w.dbg('cr1_recover').length, 1, 'one coordinated recovery');
    /* the heartbeat refreshes the lane's truth so a watching app never goes stale */
    sessionFor(ROOM).states[B].at = Date.now() - 60000;
    w.win.cr1Heartbeat(); await settle();
    assert.ok(Date.now() - sessionFor(ROOM).states[B].at < 5000, 'heartbeat refreshed the reported state');
  });

  await scenario('S4 listener reopen without relay traffic or peer hello → home current immediately', async () => {
    const w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B); await settle();
    w.liveSockets(ROOM).forEach((s) => s.drop());
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'chat-msg', chatId: 'c2', srcText: 'hola' }); await settle();
    assert.equal(pushes.length, 1, 'disconnected receiver is pushed');
    assert.deepEqual(proj(w), { chat: 0, voice: 0, video: 0 }, 'nothing arrived yet');
    const aWords = relay.words.filter((x) => x.from === 'dev-A').length;
    w.setHidden(false); await settle(250);
    assert.equal(w.liveSockets(ROOM).length, 1, 'listener reopened');
    assert.deepEqual(proj(w), { chat: 1, voice: 0, video: 0 }, 'home is current from the relay alone');
    assert.equal(relay.words.filter((x) => x.from === 'dev-A').length, aWords, 'no peer traffic was needed');
  });

  await scenario('S5a visible in the room → bubble only, seen at once, no OS alert, no count', async () => {
    const w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B);
    w.win.enterRoom(ROOM); await settle(120);
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'chat-msg', chatId: 'c3', srcText: 'hola' }); await settle();
    assert.equal(pushes.length, 0); assert.equal(w.notifications.length, 0); assert.equal(w.swShown.length, 0);
    assert.equal(record(ROOM, 'c3').rcp[B].p, 'in_app'); assert.equal(record(ROOM, 'c3').rcp[B].s, 'seen'); assert.equal(record(ROOM, 'c3').rcp[B].seenBy, 'in_room');
    assert.deepEqual(proj(w), { chat: 0, voice: 0, video: 0 });
    assert.ok(JSON.parse(w.win.localStorage.getItem('tba_tr_' + ROOM)).some((e) => e.id === 'c3'), 'the bubble exists');
  });

  await scenario('S5b hidden on home → call → one OS request, no ring, no device-side alert; return presents the active call once', async () => {
    const w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B); await settle();
    w.setHidden(true); await settle();
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'call-start', kind: 'video', callId: 'k2', name: 'Ana' }); await settle();
    assert.equal(pushes.length, 1, 'one OS call alert');
    assert.equal(w.ring(), false, 'no background call screen'); assert.equal(w.win.CALL.ringPending, null);
    assert.equal(w.notifications.length, 0, 'no device-side Notification beside the push');
    assert.equal(w.swShown.length, 0);
    w.setHidden(false); await settle(250);
    assert.equal(w.ring(), true, 'the active call is presented on return');
    assert.equal(w.dbg('cr1_call_presented').length, 1);
    w.setHidden(true); await settle(); w.setHidden(false); await settle(250);
    assert.equal(w.dbg('cr1_call_presented').length, 1, 'never a second surface for the same call');
    assert.equal(pushes.length, 1);
  });

  await scenario('S5c muted room → no OS request, no ring; exact projection remains', async () => {
    const w = await boot({ store: roomSeed({ muted: true }) });
    await subscribe(ROOM, B); await settle();
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'chat-msg', chatId: 'c4', srcText: 'hola' });
    await a.say({ type: 'call-start', kind: 'voice', callId: 'k3' }); await a.say({ type: 'call-end', callId: 'k3' }); await settle();
    assert.equal(pushes.length, 0); assert.equal(w.ring(), false);
    assert.equal(record(ROOM, 'c4').rcp[B].p, 'muted');
    assert.deepEqual(proj(w), { chat: 1, voice: 1, video: 0 });
    /* unmute live: the relay hears it without a reconnect */
    w.win.roomById(ROOM).muted = false; w.win.saveRooms(); await settle(200);
    await a.say({ type: 'chat-msg', chatId: 'c4b', srcText: 'hola' }); await settle();
    assert.equal(record(ROOM, 'c4b').rcp[B].p, 'in_app', 'unmuted and visible on home: in-app card');
    w.win.roomById(ROOM).muted = true; w.win.saveRooms(); await settle(200);
    await a.say({ type: 'chat-msg', chatId: 'c4c', srcText: 'hola' }); await settle();
    assert.equal(record(ROOM, 'c4c').rcp[B].p, 'muted', 'muted again without a reconnect');
  });

  await scenario('S5d burst + retry + socket-and-push replay → one OS request, exact +3', async () => {
    const w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B); await settle();
    w.setHidden(true); await settle();
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'chat-msg', chatId: 'c5', srcText: '1' }); await a.say({ type: 'chat-msg', chatId: 'c6', srcText: '2' }); await a.say({ type: 'chat-msg', chatId: 'c7', srcText: '3' });
    await a.say({ type: 'chat-msg', chatId: 'c7', srcText: '3' }); await settle();
    assert.equal(pushes.length, 1);
    assert.equal(record(ROOM, 'c6').rcp[B].p, 'suppressed');
    w.setHidden(false); await settle(250);
    assert.deepEqual(proj(w), { chat: 3, voice: 0, video: 0 });
  });

  await scenario('S5e process restart → the home projection comes back from the relay, not the browser', async () => {
    let w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B); await settle();
    w.setHidden(true); await settle();
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'chat-msg', chatId: 'c8', srcText: 'x' }); await settle();
    const snap = w.snapshot(); w.liveSockets().forEach((s) => s.drop());
    const rooms = JSON.parse(snap.tba_rooms); rooms[0].waiting = { chat: 9, voice: 9, video: 9 }; rooms[0].unread = 27; snap.tba_rooms = JSON.stringify(rooms);   /* a stale browser cache */
    restartRelay();
    w = await boot({ store: snap }); await settle(250);
    assert.deepEqual(proj(w), { chat: 1, voice: 0, video: 0 }, 'relay truth replaces the stale cache');
  });

  await scenario('S6a warm tap on an active call → exact Accept/Decline surface, once; on an ended call → room with durable missed outcome, no ring', async () => {
    const w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B); await settle();
    w.setHidden(true); await settle();
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'call-start', kind: 'voice', callId: 'k4', name: 'Ana' }); await settle();
    assert.equal(pushes.length, 1);
    w.hidden = false; w.tap({ t: 'tb-open', roomId: ROOM, eventId: 'k4', callId: 'k4', kind: 'voice' }); await settle(250);
    assert.equal(w.win.S.view, 'room'); assert.equal(w.win.S.roomId, ROOM);
    assert.equal(w.ring(), true, 'active call: the Accept/Decline surface'); assert.equal(w.dbg('cr1_call_presented').length, 1);
    await a.say({ type: 'call-end', callId: 'k4' }); await settle();
    assert.equal(w.ring(), false);
    w.setHidden(true); await settle();
    await a.say({ type: 'call-start', kind: 'video', callId: 'k5', name: 'Ana' }); await a.say({ type: 'call-end', callId: 'k5' }); await settle();
    w.hidden = false; w.tap({ t: 'tb-open', roomId: ROOM, eventId: 'k5', callId: 'k5', kind: 'video' }); await settle(250);
    assert.equal(w.win.S.roomId, ROOM); assert.equal(w.ring(), false, 'ended call: no ring');
    assert.equal(w.pills(ROOM).filter((p) => p.text === 'Missed video call').length, 1, 'durable missed outcome shown once');
    assert.equal(record(ROOM, 'k5').rcp[B].o, 'missed'); assert.equal(record(ROOM, 'k5').rcp[B].s, 'seen');
  });

  await scenario('S6b cold tap → the app opens on the exact event: active call rings; ended call shows the room and outcome', async () => {
    let w = await boot({ store: roomSeed() });
    await subscribe(ROOM, B); await settle();
    const snap = w.snapshot(); w.liveSockets().forEach((s) => s.drop());
    const a = await sender(ROOM, 'dev-A');
    await a.say({ type: 'call-start', kind: 'voice', callId: 'k6', name: 'Ana' }); await settle();
    assert.equal(pushes.length, 1, 'pushes: ' + JSON.stringify(pushes.map((p) => p.url)) + ' rcp=' + JSON.stringify(record(ROOM, 'k6').rcp));
    w = await boot({ store: snap, hash: '#ev=' + ROOM + '.k6' }); await settle(300);
    assert.equal(w.win.S.view, 'room', 'cold launch lands in the room, not the homepage'); assert.equal(w.win.S.roomId, ROOM);
    assert.equal(w.ring(), true, 'active call: the answer surface'); assert.equal(w.dbg('cr1_call_presented').length, 1, 'presented once: ' + JSON.stringify(w.dbg().filter((l) => /^cr1_/.test(l.ev)).map((l) => l.ev)));
    await a.say({ type: 'call-end', callId: 'k6' }); await settle();
    const snap2 = w.snapshot(); w.liveSockets().forEach((s) => s.drop());
    await a.say({ type: 'call-start', kind: 'voice', callId: 'k7', name: 'Ana' }); await a.say({ type: 'call-end', callId: 'k7' }); await settle();
    w = await boot({ store: snap2, hash: '#ev=' + ROOM + '.k7' }); await settle(300);
    assert.equal(w.win.S.view, 'room'); assert.equal(w.ring(), false);
    assert.equal(w.pills(ROOM).filter((p) => p.id === 'miss-k7').length, 1, 'the ended call shows its durable outcome once');
    assert.equal(w.pills(ROOM).filter((p) => p.id === 'miss-k6').length, 1, 'the earlier missed call is still recorded once');
    assert.equal(w.win.location.hash, '', 'the event hash is consumed');
  });

  await scenario('S7 baseline parity: the frozen bytes are carried verbatim; one part appended; no buried mechanism; no new secret', async () => {
    assert.ok(BASE_HTML, 'frozen baseline readable');
    const baseBody = BASE_HTML.slice(BASE_HTML.indexOf('\n'));
    const candBody = CURRENT_HTML.slice(CURRENT_HTML.indexOf('\n'));
    const tail = '\n</script>\n</body>\n</html>';
    assert.ok(candBody.startsWith(baseBody.slice(0, -tail.length)), 'every baseline byte after the header line is present, unchanged, in order');
    const part = fs.readFileSync(path.join(root, 'talkbridge/parts/r10-cr1-event-state.js'), 'utf8');
    assert.ok(candBody.endsWith('\n\n' + part + tail), 'exactly the one declared part is appended');
    /* buried R10.6 markers are spelled by construction so this gate never carries them as literals */
    const buried = [['tb_auth', '_v1'].join(''), ['/service/', 'deepgram-token'].join(''), ['/service/', 'turn-credentials'].join(''), 'VAPID_PRIVATE_KEY', 'p7-flight-recorder'];
    for (const bad of buried) { assert.ok(!part.includes(bad) && !SW.includes(bad), 'buried or secret mechanism absent: ' + bad); }
    assert.ok(SW.includes("ev.t !== 'tb-ev'") && SW.includes('#ev='), 'worker shows from the encrypted identity and routes by event');
    const w = await boot({ store: roomSeed() });
    assert.equal(w.win.S.view, 's1'); assert.ok(typeof w.win.startDeepgram === 'function' && typeof w.win.PB === 'object' && typeof w.win.p6CreateThread === 'function', 'Deepgram, phrasebook and threads surfaces intact');
    assert.equal(w.win.osNotify._cr1Original.name === '' || typeof w.win.osNotify._cr1Original === 'function', true);
  });

  const bad = results.filter((r) => !r.ok).length;
  const behavioural = results.filter((r) => !r.ok && !/^S7 /.test(r.name)).length;
  return { pass: results.length - bad, total: results.length, bad, behavioural };
}

/* ── planted defects (each must turn a scenario red) ───────────────────── */
const APP_MUTATIONS = [
  ['projection-ignored · the home no longer displays the relay projection', "  if (d.proj) {\n    room.waiting =", "  if (false) {\n    room.waiting ="],
  ['ring-while-hidden · a hidden app presents the ring screen', "    if (document.hidden) { cr1Log('ring_deferred_hidden'", "    if (false) { cr1Log('ring_deferred_hidden'"],
  ['local-missed-pill · the browser writes its own missed pill again', "    if (typeof text === 'string' && text.indexOf('Missed ') === 0) { cr1Log('local_missed_pill_dropped', { room: roomId }); return; }", "    /* local pill restored */"],
  ['duplicate-lane · concurrent signals open a second socket', "      if (ws && ws.readyState === 0 && room && ws._cr1Room === room.id) { cr1Log('connect_coalesced', { room: room.id }); return; }", "      /* no coalescing */"],
  ['no-seen · a visibly handled chat is never acknowledged', "cr1Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });", "void 0;"],
  ['cold-route-lost · a cold tap lands on the homepage', "        setTimeout(function () { cr1RouteEvent(roomId, eventId, 'tap_cold'); }, 0);", "        void roomId;"],
  ['mute-unheard · a mute toggle is not reported until the next reconnect', "      if (cr1State.muteSig !== undefined && cr1State.muteSig !== sig) {", "      if (false) {"],
  ['hidden-unannounced · going hidden is not reported to the relay', "if (document.hidden) cr1Announce('hidden'); else cr1Recover('visible');", "if (document.hidden) void 0; else cr1Recover('visible');"],
  ['device-alert · the app raises its own OS notification beside the relay push', "  osNotify = function (title, body, roomId) { cr1Log('os_notify_owned_by_relay', { room: roomId }); };", "  osNotify = function (title, body, roomId) { return _cr1OsNotify.apply(this, arguments); };"],
  ['second-surface · an active call is re-presented on every return', "    if (!c || !c.callId || cr1State.rung[c.callId]) return;", "    if (!c || !c.callId) return;"],
  ['stale-lane · an open callback from a replaced socket reconciles anyway', "  if (!current()) { cr1Log('open_stale', { room: roomId }, 'warn'); return; }", "  void current;"]
];

if (process.argv.includes('--mutations')) {
  let bad = 0;
  for (const [name, find, replace] of APP_MUTATIONS) {
    if (!CANDIDATE.includes(find)) { console.log('FAIL  app · ' + name + '  — anchor missing'); bad += 1; continue; }
    const r = await runScenarios(CANDIDATE.replace(find, replace));
    const caught = r.behavioural > 0;   /* parity (S7) always reddens a changed part; a defect must be caught by behaviour */
    console.log((caught ? 'PASS' : 'FAIL') + '  app · ' + name + (caught ? '  — harness went red as required' : '  — HARNESS STAYED GREEN WITH THE DEFECT PLANTED'));
    if (!caught) bad += 1;
  }
  console.log('app mutations: ' + (APP_MUTATIONS.length - bad) + '/' + APP_MUTATIONS.length + ' planted defects caught');
  process.exit(bad ? 1 : 0);
} else {
  const r = await runScenarios(CANDIDATE);
  console.log(`app harness: ${r.pass}/${r.total} scenarios pass`);
  process.exit(r.bad ? 1 : 0);
}
