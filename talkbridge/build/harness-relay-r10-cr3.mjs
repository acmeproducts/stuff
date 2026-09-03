#!/usr/bin/env node
/* R10-CR3 relay gate (plan v20.9.0 §4.11.5). Drives the worker with the
   product's real words through a Durable Object shim; asserts the one
   recipient-event authority. Set TB_WORKER to gate a mutated worker file.
   Exit 1 on any failure. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WORKER = process.env.TB_WORKER || path.resolve('talkbridge/worker-talk.js');
const quiet = process.argv.includes('--quiet');

/* ── shims ─────────────────────────────────────────────────────────────── */
class FakeStorage {
  constructor(map) { this.map = map || new Map(); }
  async get(keys) { if (Array.isArray(keys)) { const m = new Map(); for (const k of keys) if (this.map.has(k)) m.set(k, clone(this.map.get(k))); return m; } return clone(this.map.get(keys)); }
  async put(obj) { for (const [k, v] of Object.entries(obj)) this.map.set(k, clone(v)); }
}
function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
class ServerSocket {
  constructor(pair) { this.pair = pair; this.attachment = null; this.closed = false; }
  serializeAttachment(a) { this.attachment = clone(a); }
  deserializeAttachment() { return clone(this.attachment); }
  send(text) { if (this.closed) throw new Error('closed'); this.pair.client.inbox.push(JSON.parse(text)); }
  close() { this.closed = true; }
}
class ClientSocket { constructor() { this.inbox = []; } }
globalThis.WebSocketPair = class { constructor() { this.client = new ClientSocket(); const s = new ServerSocket(this); this[0] = this.client; this[1] = s; } };
const RealResponse = globalThis.Response;
globalThis.Response = function (body, init) { if (init && init.status === 101) return { status: 101, webSocket: init.webSocket }; return new RealResponse(body, init); };
const pushes = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).startsWith('https://push.test/')) { pushes.push({ url: String(url), headers: init.headers, body: init.body }); return { status: 201 }; }
  return realFetch(url, init);
};
class FakeState {
  constructor(storage) { this.storage = storage; this.sockets = []; }
  getWebSockets() { return this.sockets.filter((s) => !s.closed); }
  acceptWebSocket(ws) { this.sockets.push(ws); }
  async blockConcurrencyWhile(fn) { return fn(); }
}

const mod = await import(pathToFileURL(WORKER).href);
const { TalkSession } = mod;
const ENV = { VAPID_PRIVATE_KEY: '' };
const ROOM = 'room-1';
const SUB = { endpoint: 'https://push.test/ep', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } };

function world(storageMap) {
  const state = new FakeState(new FakeStorage(storageMap));
  const session = new TalkSession(state, ENV);
  const url = (client, extra) => `https://relay.test/signal?app=t&session=${ROOM}&client=${client}${extra || ''}`;
  const w = {
    state, session, pushes,
    async connect(client) {
      const res = await session.fetch(new Request(url(client), { headers: { Upgrade: 'websocket' } }));
      assert.equal(res.status, 101);
      const server = state.sockets[state.sockets.length - 1];
      const sock = { client, server, inbox: server.pair.client.inbox, seq: 0 };
      sock.say = async (m) => { m.from = client; m.ts = m.ts || Date.now(); m.seq = ++sock.seq; await session.webSocketMessage(server, JSON.stringify(m)); };
      sock.ask = async (m) => { sock.inbox.length = 0; await sock.say(m); return sock.inbox.find((x) => x.type === 'ev-reply'); };
      sock.drop = () => { server.closed = true; };
      await sock.say({ type: 'hello', name: client });
      return sock;
    },
    async post(client, body) { const r = await session.fetch(new Request(url(client), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); return r.json(); },
    async history(client) { const r = await session.fetch(new Request(url(client, '&since=0'))); return r.json(); },
    async subscribe(client) { return w.post(client, { type: 'subscribe', subscription: SUB }); }
  };
  return w;
}

const results = [];
async function scenario(name, fn) {
  pushes.length = 0;
  try { await fn(); results.push({ name, ok: true }); if (!quiet) console.log('PASS  ' + name); }
  catch (e) { results.push({ name, ok: false, e }); console.log('FAIL  ' + name + '\n      ' + (e && e.message)); }
}
const proj = async (sock) => (await sock.ask({ type: 'events-sync' }));
const CHAT = (id, text) => ({ type: 'chat-msg', chatId: id, srcText: text || 'hi' });

await scenario('R1 replay-seen · hidden-in-room receiver, socket loss, reopen, replay: unseen exactly once until explicit open', async () => {
  const w = world(); const a = await w.connect('A'); await w.subscribe('B'); let b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: true, muted: false });
  await a.say(CHAT('c1'));
  assert.equal(pushes.length, 1, 'hidden receiver is pushed once');
  const payload = pushes[0]; assert.equal(payload.headers.Urgency, 'high'); assert.equal(payload.headers['Content-Encoding'], 'aes128gcm');
  b.drop();
  b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: true, inRoom: true, muted: false });
  const h = await w.history('B'); assert.equal(h.filter((m) => m.type === 'chat-msg').length, 1, 'replay delivers the chat');
  let p = await proj(b); assert.deepEqual(p.proj, { chat: 1, voice: 0, video: 0 }, 'replay does not mark seen');
  p = await proj(b); assert.deepEqual(p.proj, { chat: 1, voice: 0, video: 0 }, 'reconciliation is idempotent');
  const o = await b.ask({ type: 'ev-open' }); assert.deepEqual(o.proj, { chat: 0, voice: 0, video: 0 }); assert.deepEqual(o.acked.map((u) => u.id), ['c1']);
  p = await proj(b); assert.deepEqual(p.proj, { chat: 0, voice: 0, video: 0 });
  assert.equal(pushes.length, 1, 'reopen and replay push nothing new');
});

await scenario('R2 bare caller hang-up before answer · receiver missed exactly once; caller termination separate', async () => {
  const w = world(); const a = await w.connect('A'); await w.subscribe('B'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false });
  await a.say({ type: 'call-start', kind: 'voice', callId: 'k1', name: 'A' });
  assert.equal(pushes.length, 1, 'one OS call alert requested');
  let p = await proj(b); assert.deepEqual(p.proj, { chat: 0, voice: 0, video: 0 }, 'an active offered call is not yet missed'); assert.equal(p.calls.length, 1);
  await a.say({ type: 'call-end', callId: 'k1' });
  p = await proj(b); assert.deepEqual(p.proj, { chat: 0, voice: 1, video: 0 }); assert.equal(p.calls.length, 0);
  assert.equal(p.unseen[0].o, 'missed');
  await a.say({ type: 'call-end', callId: 'k1' });
  await a.say({ type: 'call-end' });
  p = await proj(b); assert.deepEqual(p.proj, { chat: 0, voice: 1, video: 0 }, 'repeated call-end cannot re-miss');
  assert.equal(pushes.length, 1, 'call-end raises no second alert');
  const ev = w.session.events.k1; assert.equal(ev.ended, true); assert.equal(ev.rcp.A, undefined, 'caller holds no recipient outcome');
});

await scenario('R3 receiver declines · durable declined outcome, no missed increment', async () => {
  const w = world(); const a = await w.connect('A'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: true, inRoom: false, muted: false });
  await a.say({ type: 'call-start', kind: 'video', callId: 'k2', name: 'A' });
  assert.equal(pushes.length, 0, 'visible receiver gets the in-app surface, no OS alert');
  await b.say({ type: 'call-decline', callId: 'k2' });
  await a.say({ type: 'call-end', callId: 'k2' });
  const p = await proj(b); assert.deepEqual(p.proj, { chat: 0, voice: 0, video: 0 });
  assert.equal(w.session.events.k2.rcp.B.o, 'declined');
});

await scenario('R4 accept then end · ended outcome, nothing counted', async () => {
  const w = world(); const a = await w.connect('A'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: true, inRoom: true, muted: false });
  await a.say({ type: 'call-start', kind: 'voice', callId: 'k3' });
  await b.say({ type: 'call-accept', callId: 'k3' });
  assert.equal(w.session.events.k3.rcp.B.o, 'accepted');
  await b.say({ type: 'call-end', callId: 'k3' });
  assert.equal(w.session.events.k3.rcp.B.o, 'ended');
  assert.deepEqual((await proj(b)).proj, { chat: 0, voice: 0, video: 0 });
});

await scenario('R5 presentation by state · visible in room = in_app + seen on handling; visible elsewhere = in_app card until open', async () => {
  const w = world(); const a = await w.connect('A'); await w.subscribe('B'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: true, inRoom: true, muted: false });
  await a.say(CHAT('c2'));
  /* N6 (plan v20.29.0): the relay returned to R10.2 always-push. The
     presentation word is unchanged — the relay still believes 'in_app' — but
     the transport no longer depends on that belief, because a backgrounded or
     locked Android page can keep a socket alive and still read 'visible'. The
     device decides display: the worker shows nothing while a window is
     visible, which harness-n5 proves. So: push sent, no alert seen. */
  assert.equal(pushes.length, 1, 'always-push: the handset is always reachable'); assert.equal(w.session.events.c2.rcp.B.p, 'in_app');
  const s1 = await b.ask({ type: 'ev-seen', ids: ['c2'] }); assert.deepEqual(s1.proj, { chat: 0, voice: 0, video: 0 });
  assert.equal(w.session.events.c2.rcp.B.seenBy, 'in_room');
  await b.say({ type: 'ev-state', visible: true, inRoom: false, muted: false });
  await a.say(CHAT('c3'));
  assert.equal(pushes.length, 2, 'always-push: sent; the device suppresses display while visible (harness-n5)'); assert.equal(w.session.events.c3.rcp.B.p, 'in_app');
  const bproj = b.inbox.filter((m) => m.type === 'ev-proj'); assert.ok(bproj.length >= 1, 'the projection rides the socket');
  assert.deepEqual(bproj[bproj.length - 1].proj, { chat: 1, voice: 0, video: 0 });
  assert.deepEqual((await proj(b)).proj, { chat: 1, voice: 0, video: 0 });
});

await scenario('R6 muted device · no push, exact projection remains; muted call ends unanswered counts once', async () => {
  const w = world(); const a = await w.connect('A'); await w.subscribe('B'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: true });
  await a.say(CHAT('c4'));
  await a.say({ type: 'call-start', kind: 'video', callId: 'k4' });
  await a.say({ type: 'call-end', callId: 'k4' });
  assert.equal(pushes.length, 0);
  assert.equal(w.session.events.c4.rcp.B.p, 'muted'); assert.equal(w.session.events.k4.rcp.B.p, 'muted');
  assert.deepEqual((await proj(b)).proj, { chat: 1, voice: 0, video: 1 });
});

await scenario('R7 burst · three locked chats in ten seconds: one OS request, two suppressed, exact +3', async () => {
  const w = world(); const a = await w.connect('A'); await w.subscribe('B'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false });
  await a.say(CHAT('c5')); await a.say(CHAT('c6')); await a.say(CHAT('c7'));
  assert.equal(pushes.length, 1);
  assert.equal(w.session.events.c6.rcp.B.p, 'suppressed'); assert.equal(w.session.events.c7.rcp.B.p, 'suppressed');
  assert.deepEqual((await proj(b)).proj, { chat: 3, voice: 0, video: 0 });
});

await scenario('R8 restart + session boundary · records survive a new instance and a history reset', async () => {
  const map = new Map();
  let w = world(map); let a = await w.connect('A'); await w.subscribe('B'); let b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false });
  await a.say(CHAT('c8'));
  map.set('lastActivity', Date.now() - 13 * 60 * 1000);
  w = world(map); await w.session.ready; b = await w.connect('B');
  const h = await w.history('B'); assert.equal(h.length, 0, 'history reset at the session boundary');
  assert.deepEqual((await proj(b)).proj, { chat: 1, voice: 0, video: 0 }, 'the record outlives history and the process');
});

await scenario('R9 retry · the same chat resent reuses its record; stale visible state is not trusted', async () => {
  const w = world(); const a = await w.connect('A'); await w.subscribe('B'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: true, inRoom: false, muted: false });
  w.session.states.B.at = Date.now() - 60000;
  await a.say(CHAT('c9')); await a.say(CHAT('c9'));
  assert.equal(Object.keys(w.session.events).length, 1);
  assert.equal(w.session.events.c9.rcp.B.p, 'os_requested', 'a state reported a minute ago is stale');
  assert.equal(pushes.length, 1);
  assert.deepEqual((await proj(b)).proj, { chat: 1, voice: 0, video: 0 });
});

await scenario('R10 read-only HTTPS reconciliation equals the socket answer; caller expiry word is not required', async () => {
  const w = world(); const a = await w.connect('A'); const b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false });
  await a.say({ type: 'call-start', kind: 'voice', callId: 'k5' });
  await a.say({ type: 'call-end', callId: 'k5', reason: 'missed' });
  const viaSocket = await proj(b); const viaHttp = await w.post('B', { type: 'events-sync' });
  assert.deepEqual(viaHttp.proj, viaSocket.proj); assert.deepEqual(viaHttp.proj, { chat: 0, voice: 1, video: 0 });
  const d = await w.post('A', { type: 'diag' }); assert.equal(d.v, '6.2'); assert.ok(Array.isArray(d.events));
});

const bad = results.filter((r) => !r.ok).length;
console.log(`relay harness: ${results.length - bad}/${results.length} scenarios pass`);
process.exit(bad ? 1 : 0);
