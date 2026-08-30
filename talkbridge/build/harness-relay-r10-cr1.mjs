#!/usr/bin/env node
/* R10-CR1 relay scenario harness (plan v20.9.0 §4.11.5).
   Drives the REAL TalkSession with the product's real event words over the
   real webSocketMessage/fetch surfaces. No internal helper is invoked with
   manufactured state; every assertion is about what a recipient would durably
   see. Paired planted defects live in mutate-r10-cr1.mjs. */
import assert from 'node:assert/strict';
const WORKER = process.env.TB_WORKER || '../worker-talk.js';
const { TalkSession } = await import(WORKER);

/* ── faithful DO runtime ─────────────────────────────────────────────────── */
class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) {
    if (Array.isArray(k)) { const out = new Map(); for (const key of k) out.set(key, this.m.get(key)); return out; }
    return this.m.get(k);
  }
  async put(obj) { for (const [k, v] of Object.entries(obj)) this.m.set(k, structuredClone(v)); }
}
class FakeWs {
  constructor(tag) { this.tag = tag; this.sent = []; this.open = true; }
  serializeAttachment(t) { this.tag = t; }
  deserializeAttachment() { return this.tag; }
  send(t) { if (this.open) this.sent.push(JSON.parse(t)); }
  close() { this.open = false; }
}
class FakeState {
  constructor() { this.storage = new FakeStorage(); this.ws = []; }
  blockConcurrencyWhile(fn) { return fn(); }
  acceptWebSocket(ws) { this.ws.push(ws); }
  getWebSockets() { return this.ws.filter(w => w.open); }
}
const PUSHES = [];
globalThis.fetch = async (url, opts) => {
  if (String(url).startsWith('https://push.example/')) {
    PUSHES.push({ url: String(url), at: Date.now() });
    return { status: 201 };
  }
  throw new Error('unexpected network call: ' + url);
};

function session() {
  const state = new FakeState();
  const dob = new TalkSession(state, { VAPID_PRIVATE_KEY: '' }); /* no key: push path exercised via subscribe+status separately */
  return { state, dob };
}
function connect(ctx, clientId) {
  const ws = new FakeWs({ clientId });
  ctx.state.acceptWebSocket(ws);
  return ws;
}
async function say(ctx, clientId, msg) {
  const ws = ctx.state.ws.find(w => w.tag.clientId === clientId) || connect(ctx, clientId);
  await ctx.dob.webSocketMessage(ws, JSON.stringify(Object.assign({ from: clientId, ts: Date.now() }, msg)));
}
function req(ctx, clientId, body, method = 'POST', extra = '') {
  const url = 'https://relay/signal?app=t&session=room-1&client=' + clientId + extra;
  return ctx.dob.fetch(new Request(url, method === 'POST'
    ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method }));
}
async function sync(ctx, clientId) { return (await req(ctx, clientId, { type: 'events-sync' })).json(); }
async function seen(ctx, clientId, ids) { return (await req(ctx, clientId, { type: 'event-seen', ids })).json(); }

const results = [];
async function scenario(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, e: String(e && e.message || e) }); }
}

/* Roster note: a device belongs to the room once it has connected or called in
   — exactly what the product does on room entry (socket + hello). */

await scenario('S1 · unseen survives socket loss, simultaneous wake signals, and replay; explicit open clears exactly once', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' });
  await say(ctx, 'B', { type: 'hello' });
  /* B's device goes away without closing the socket (iOS suspend), then the socket drops */
  ctx.state.ws.find(w => w.tag.clientId === 'B').close();
  await say(ctx, 'A', { type: 'chat-msg', chatId: 'c1', srcText: 'x' });
  /* B returns: visibility+focus+online fire together → several identical reconciliations */
  const [r1, r2, r3] = await Promise.all([sync(ctx, 'B'), sync(ctx, 'B'), sync(ctx, 'B')]);
  for (const r of [r1, r2, r3]) assert.deepEqual(r.proj, { chat: 1, voice: 0, video: 0 });
  /* history replay (transport) must not erase it */
  await req(ctx, 'B', null, 'GET', '&since=0');
  const r4 = await sync(ctx, 'B');
  assert.deepEqual(r4.proj, { chat: 1, voice: 0, video: 0 }, 'replay/cursor must never mark seen');
  /* explicit room open acknowledges exactly the applied set */
  const r5 = await seen(ctx, 'B', r4.unseen.map(u => u.id));
  assert.deepEqual(r5.proj, { chat: 0, voice: 0, video: 0 });
  /* repeated ack of the same set is idempotent */
  const r6 = await seen(ctx, 'B', r4.unseen.map(u => u.id));
  assert.deepEqual(r6.proj, { chat: 0, voice: 0, video: 0 });
});

await scenario('S2 · ordinary bare caller hang-up → receiver missed exactly once; caller termination separate', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  await say(ctx, 'A', { type: 'call-start', kind: 'voice' });
  await say(ctx, 'A', { type: 'call-end' });            /* the real product word: bare, no reason */
  const r = await sync(ctx, 'B');
  assert.deepEqual(r.proj, { chat: 0, voice: 1, video: 0 }, 'bare hang-up must produce one missed voice record');
  const again = await sync(ctx, 'B');
  assert.deepEqual(again.proj, { chat: 0, voice: 1, video: 0 }, 'exactly once');
  const caller = await sync(ctx, 'A');
  assert.deepEqual(caller.proj, { chat: 0, voice: 0, video: 0 }, 'the caller is not a recipient of their own call');
});

await scenario('S2b · duplicate call-end cannot double the missed record', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  await say(ctx, 'A', { type: 'call-start', kind: 'video' });
  await say(ctx, 'A', { type: 'call-end' });
  await say(ctx, 'A', { type: 'call-end' });
  const r = await sync(ctx, 'B');
  assert.deepEqual(r.proj, { chat: 0, voice: 0, video: 1 });
});

await scenario('S3 · accept and decline are explicit recipient outcomes; no missed increment', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  await say(ctx, 'A', { type: 'call-start', kind: 'voice' });
  await say(ctx, 'B', { type: 'call-decline' });
  await say(ctx, 'A', { type: 'call-end' });
  let r = await sync(ctx, 'B');
  assert.deepEqual(r.proj, { chat: 0, voice: 0, video: 0 }, 'declined is not missed');
  await say(ctx, 'A', { type: 'call-start', kind: 'voice' });
  await say(ctx, 'B', { type: 'call-accept' });
  await say(ctx, 'A', { type: 'call-end' });
  r = await sync(ctx, 'B');
  assert.deepEqual(r.proj, { chat: 0, voice: 0, video: 0 }, 'accepted is not missed');
});

await scenario('S4 · an active offered call is presented on sync but never counted as missed while ringing', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  await say(ctx, 'A', { type: 'call-start', kind: 'voice' });
  const r = await sync(ctx, 'B');
  assert.deepEqual(r.proj, { chat: 0, voice: 0, video: 0 });
  assert.equal(r.unseen.length, 1);
  assert.equal(r.unseen[0].o, 'offered', 'cold notification tap can reach the live answer surface');
});

await scenario('S5 · projection is idempotent across restart of the durable object', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  await say(ctx, 'A', { type: 'chat-msg', chatId: 'c1', srcText: 'x' });
  await say(ctx, 'A', { type: 'call-start', kind: 'voice' });
  await say(ctx, 'A', { type: 'call-end' });
  const before = await sync(ctx, 'B');
  /* process restart: a new object over the same storage */
  const dob2 = new TalkSession(ctx.state, {});
  const after = await (await dob2.fetch(new Request('https://relay/signal?app=t&session=room-1&client=B', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'events-sync' }) }))).json();
  assert.deepEqual(after.proj, before.proj, 'restart must not change the projection');
  assert.deepEqual(after.proj, { chat: 1, voice: 1, video: 0 });
});

await scenario('S6 · read-only HTTPS reconciliation equals the socket-side authority', async () => {
  const ctx = session();
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  await say(ctx, 'A', { type: 'chat-msg', chatId: 'c9', srcText: 'x' });
  const post = await sync(ctx, 'B');
  const get = await (await req(ctx, 'B', null, 'GET', '&events=1')).json();
  assert.deepEqual(get.proj, post.proj);
  assert.deepEqual(get.unseen.map(u => u.id), post.unseen.map(u => u.id));
});

await scenario('S7 · suppressed burst members stay individually countable and are never OS-owned', async () => {
  const ctx = session();
  const dob = new TalkSession(new FakeState(), { VAPID_PRIVATE_KEY: '' });
  connect(ctx, 'A'); connect(ctx, 'B');
  await say(ctx, 'A', { type: 'hello' }); await say(ctx, 'B', { type: 'hello' });
  /* subscribe B so push decisions are exercised (push transport itself is a live-gate concern) */
  await req(ctx, 'B', { type: 'subscribe', subscription: { endpoint: 'https://push.example/b', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } } });
  await say(ctx, 'A', { type: 'chat-msg', chatId: 'b1', srcText: '1' });
  await say(ctx, 'A', { type: 'chat-msg', chatId: 'b2', srcText: '2' });
  await say(ctx, 'A', { type: 'chat-msg', chatId: 'b3', srcText: '3' });
  const r = await sync(ctx, 'B');
  assert.deepEqual(r.proj, { chat: 3, voice: 0, video: 0 }, 'every burst member counts');
  const recs = ctx.dob.events;
  const ps = ['chat:b1', 'chat:b2', 'chat:b3'].map(id => recs[id].rcp['B'].p);
  assert.equal(ps.filter(p => p === 'suppressed').length >= 2, true, 'later burst members are suppressed, not OS-owned');
});

/* ── report ──────────────────────────────────────────────────────────────── */
let failed = 0;
for (const r of results) {
  console.log((r.ok ? 'PASS' : 'FAIL') + '  ' + r.name + (r.ok ? '' : '  — ' + r.e));
  if (!r.ok) failed += 1;
}
if (failed) { console.error(failed + ' scenario(s) failed'); process.exit(1); }
console.log('relay harness: ' + results.length + '/' + results.length + ' scenarios pass');
