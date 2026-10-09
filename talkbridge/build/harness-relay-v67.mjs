#!/usr/bin/env node
/* 29·base relay gate — MULTI-USER, RELAY LEG (plan §7.8 R-parts, v6.7). Three and
   more sockets through the Durable Object shim: fan-out to all, the room cap
   (default and the creator's), per-device addressing of a call and its words,
   the `inCall` presence field, and the 1:1 behaviour of today's app unchanged
   (no `to` anywhere → exactly v6.6). Set TB_WORKER to gate a mutated worker.
   Exit 1 on any failure. Mutation-tested by build/mutate-relay-v67.mjs. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const WORKER = process.env.TB_WORKER || path.resolve('talkbridge/worker-talk.js');
const quiet = process.argv.includes('--quiet');

class FakeStorage {
  constructor(map) { this.map = map || new Map(); }
  async get(keys) { if (Array.isArray(keys)) { const m = new Map(); for (const k of keys) if (this.map.has(k)) m.set(k, clone(this.map.get(k))); return m; } return clone(this.map.get(keys)); }
  async put(obj) { for (const [k, v] of Object.entries(obj)) this.map.set(k, clone(v)); }
}
function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }
class ServerSocket {
  constructor(pair) { this.pair = pair; this.attachment = null; this.closed = false; this.closeCode = null; }
  serializeAttachment(a) { this.attachment = clone(a); }
  deserializeAttachment() { return clone(this.attachment); }
  send(text) { if (this.closed) throw new Error('closed'); this.pair.client.inbox.push(JSON.parse(text)); }
  close(code, reason) { this.closed = true; this.closeCode = code || 1000; this.closeReason = reason || ''; }
}
class ClientSocket { constructor() { this.inbox = []; } }
globalThis.WebSocketPair = class { constructor() { this.client = new ClientSocket(); const s = new ServerSocket(this); this[0] = this.client; this[1] = s; } };
const RealResponse = globalThis.Response;
globalThis.Response = function (body, init) { if (init && init.status === 101) return { status: 101, webSocket: init.webSocket }; return new RealResponse(body, init); };
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => { if (String(url).startsWith('https://push.test/')) return { status: 201 }; return realFetch(url, init); };
class FakeState {
  constructor(storage) { this.storage = storage; this.sockets = []; }
  getWebSockets() { return this.sockets.filter((s) => !s.closed); }
  acceptWebSocket(ws) { this.sockets.push(ws); }
  async blockConcurrencyWhile(fn) { return fn(); }
}
const mod = await import(pathToFileURL(WORKER).href);
const { TalkSession } = mod;
const ENV = { VAPID_PRIVATE_KEY: '' };
const ROOM = 'room-n';

function world(storageMap) {
  const state = new FakeState(new FakeStorage(storageMap));
  const session = new TalkSession(state, ENV);
  const url = (client, extra) => `https://relay.test/signal?app=t&session=${ROOM}&client=${client}${extra || ''}`;
  const w = {
    state, session,
    /* connect returns the socket; a refused device gets back { full: {...}, closeCode } */
    async connect(client, extra, opts) {
      const res = await session.fetch(new Request(url(client, extra), { headers: { Upgrade: 'websocket' } }));
      assert.equal(res.status, 101);
      const server = state.sockets[state.sockets.length - 1];
      const sock = { client, server, inbox: server.pair.client.inbox, seq: 0, closeCode: () => server.closeCode };
      sock.say = async (m) => { m.from = client; m.ts = m.ts || Date.now(); m.seq = ++sock.seq; await session.webSocketMessage(server, JSON.stringify(m)); };
      sock.ask = async (m) => { sock.inbox.length = 0; await sock.say(m); return sock.inbox.find((x) => x.type === 'ev-reply'); };
      sock.drop = async () => { server.closed = true; await session.webSocketClose(server, 1001, 'gone'); };
      sock.got = (type) => sock.inbox.filter((x) => x.type === type);
      sock.clear = () => { sock.inbox.length = 0; };
      if (server.closed) return sock;                                     /* refused at the door */
      if (!(opts && opts.silent)) { await sock.say({ type: 'hello', name: client }); await sock.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); }
      return sock;
    },
    async post(client, body) { const r = await session.fetch(new Request(url(client), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); return r.json(); },
    async history(client) { const r = await session.fetch(new Request(url(client, '&since=0'))); return r.json(); }
  };
  return w;
}
const results = [];
async function scenario(name, fn) {
  try { await fn(); results.push({ name, ok: true }); if (!quiet) console.log('PASS  ' + name); }
  catch (e) { results.push({ name, ok: false, e }); console.log('FAIL  ' + name + '\n      ' + (e && e.message)); }
}
const clearAll = (...socks) => socks.forEach((s) => s.clear());

await scenario('N1 fan-out · three devices in one room: a chat from A reaches B and C, is recorded for both, and A\'s history shows nothing of its own', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'), c = await w.connect('C');
  clearAll(a, b, c);
  await a.say({ type: 'chat-msg', chatId: 'cm-1', srcText: 'hi all', tgtText: 'hi all', senderName: 'A' });
  assert.equal(b.got('chat-msg').length, 1); assert.equal(c.got('chat-msg').length, 1); assert.equal(a.got('chat-msg').length, 0);
  const d = await w.post('A', { type: 'diag' }); const ev = d.events.find((e) => e.id === 'cm-1');
  assert.deepEqual(Object.keys(ev.rcp).sort(), ['B', 'C']);
  assert.equal(d.v, '6.7'); assert.equal(d.cap, 4);
  const pb = await b.ask({ type: 'events-sync' }); assert.equal(pb.proj.chat, 1); assert.equal((await b.ask({ type: 'ev-seen', ids: ['cm-1'] })).proj.chat, 0);   /* in_app, unseen until the app says so */
  const hb = await w.history('B'); assert.equal(hb.filter((m) => m.type === 'chat-msg').length, 1);
});

await scenario('N2 the default cap · four devices join; the fifth is told {type:"full", cap:4, n:4}, closed with 4001, never noted, never a recipient; a known device may reconnect', async () => {
  const w = world(); const socks = []; for (const id of ['A', 'B', 'C', 'D']) socks.push(await w.connect(id));
  const e = await w.connect('E', '', { silent: true });
  assert.equal(e.closeCode(), 4001); assert.equal(e.got('full').length, 1); assert.deepEqual([e.got('full')[0].cap, e.got('full')[0].n], [4, 4]);
  clearAll(...socks); e.clear();
  await socks[0].say({ type: 'chat-msg', chatId: 'cm-2', srcText: 'four of us', senderName: 'A' });
  assert.equal(e.got('chat-msg').length, 0); for (const s of socks.slice(1)) assert.equal(s.got('chat-msg').length, 1);
  const d = await w.post('A', { type: 'diag' }); assert.deepEqual(Object.keys(d.events.find((x) => x.id === 'cm-2').rcp).sort(), ['B', 'C', 'D']);
  assert.ok(!d.connected.includes('E'));
  await socks[3].drop(); const d2 = await w.connect('D'); assert.equal(d2.closeCode(), null);   /* D again: not a fifth device */
  const d2b = await w.connect('D', '', { silent: true }); assert.equal(d2b.closeCode(), null);   /* a second socket of a connected device is the same device */
  const f = await w.connect('F', '', { silent: true }); assert.equal(f.closeCode(), 4001);
});

await scenario('N3 the creator\'s cap · the first socket to say cap=2 sets the room\'s; a later socket cannot raise it; the third device is full; the cap survives a restart', async () => {
  const w = world(); const a = await w.connect('A', '&cap=2'); const b = await w.connect('B', '&cap=8');
  const c = await w.connect('C', '', { silent: true }); assert.equal(c.closeCode(), 4001); assert.equal(c.got('full')[0].cap, 2);
  const d = await w.post('A', { type: 'diag' }); assert.equal(d.cap, 2);
  const w2 = world(w.state.storage.map); const a2 = await w2.connect('A'); const b2 = await w2.connect('B'); const c2 = await w2.connect('C', '', { silent: true });
  assert.equal(c2.closeCode(), 4001);
  const bad = world(); await bad.connect('X', '&cap=99'); assert.equal((await bad.post('X', { type: 'diag' })).cap, 4);   /* out of range: the default */
});

await scenario('N4 an addressed call · A calls B by deviceId: only B rings, only B is recorded; C\'s projection is untouched; B\'s accept and the signalling reach A alone; A\'s end reaches B alone; C saw none of it', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'), c = await w.connect('C');
  clearAll(a, b, c);
  await a.say({ type: 'call-start', kind: 'video', callId: 'c-1', to: 'B', name: 'A' });
  assert.equal(b.got('call-start').length, 1); assert.equal(c.got('call-start').length, 0);
  const d = await w.post('A', { type: 'diag' }); const ev = d.events.find((e) => e.callId === 'c-1'); assert.deepEqual(Object.keys(ev.rcp), ['B']);
  assert.equal((await c.ask({ type: 'events-sync' })).calls.length, 0); assert.equal((await b.ask({ type: 'events-sync' })).calls.length, 1);
  clearAll(a, b, c);
  await b.say({ type: 'call-accept', callId: 'c-1' });
  assert.equal(a.got('call-accept').length, 1); assert.equal(c.got('call-accept').length, 0);
  await a.say({ type: 'webrtc-signal', transient: true, signal: { description: { type: 'offer', sdp: 'v=0' } } });
  await b.say({ type: 'webrtc-signal', transient: true, signal: { description: { type: 'answer', sdp: 'v=0' } } });
  await b.say({ type: 'mic-state', micOn: false, transient: true }); await a.say({ type: 'cam-state', camOn: false, transient: true });
  assert.equal(b.got('webrtc-signal').length, 1); assert.equal(a.got('webrtc-signal').length, 1); assert.equal(c.got('webrtc-signal').length, 0);
  assert.equal(a.got('mic-state').length, 1); assert.equal(b.got('cam-state').length, 1); assert.equal(c.got('mic-state').length + c.got('cam-state').length, 0);
  clearAll(a, b, c);
  await a.say({ type: 'call-end', callId: 'c-1' });
  assert.equal(b.got('call-end').length, 1); assert.equal(c.got('call-end').length, 0);
  const d2 = await w.post('A', { type: 'diag' }); const ev2 = d2.events.find((e) => e.callId === 'c-1'); assert.equal(ev2.ended, true); assert.equal(ev2.rcp.B.o, 'ended');
  /* a chat in the same room still reaches everyone */
  clearAll(a, b, c); await a.say({ type: 'chat-msg', chatId: 'cm-3', srcText: 'after the call', senderName: 'A' }); assert.equal(c.got('chat-msg').length, 1);
});

await scenario('N5 today\'s app unchanged · a call without `to` rings every other device, is recorded for all, its words fan out to all (v6.6 behaviour, byte for byte of the wire)', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'), c = await w.connect('C');
  clearAll(a, b, c);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'c-2', name: 'A' });
  assert.equal(b.got('call-start').length, 1); assert.equal(c.got('call-start').length, 1);
  const d = await w.post('A', { type: 'diag' }); assert.deepEqual(Object.keys(d.events.find((e) => e.callId === 'c-2').rcp).sort(), ['B', 'C']);
  clearAll(a, b, c);
  await b.say({ type: 'call-accept', callId: 'c-2' }); assert.equal(a.got('call-accept').length, 1); assert.equal(c.got('call-accept').length, 1);
  await a.say({ type: 'webrtc-signal', transient: true, signal: { x: 1 } }); assert.equal(b.got('webrtc-signal').length, 1); assert.equal(c.got('webrtc-signal').length, 1);
  for (const m of [...a.inbox, ...b.inbox, ...c.inbox]) assert.equal(m.to, undefined, 'no `to` may appear on an unaddressed call');
  clearAll(a, b, c); await a.say({ type: 'call-end', callId: 'c-2' }); assert.equal(c.got('call-end').length, 1);
  const d2 = await w.post('A', { type: 'diag' }); const ev = d2.events.find((e) => e.callId === 'c-2'); assert.equal(ev.rcp.B.o, 'ended'); assert.equal(ev.rcp.C.o, 'missed');
});

await scenario('N6 presence for N · every peer announcement counts the others; while an addressed call is accepted the announcement names who is in it; it empties when the call ends', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'), c = await w.connect('C');
  clearAll(a, b, c); await c.say({ type: 'ping', transient: true, visible: true, inRoom: true, muted: false });   /* a heartbeat with the device's word re-announces presence */
  const pc = c.got('peer').slice(-1)[0]; assert.equal(pc.others, 2); assert.deepEqual(pc.inCall, []);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'c-3', to: 'B', name: 'A' }); clearAll(a, b, c);
  await b.say({ type: 'call-accept', callId: 'c-3' });
  const p = c.got('peer').slice(-1)[0]; assert.ok(p, 'C must be told'); assert.deepEqual(p.inCall, ['A', 'B']);
  assert.deepEqual((await w.post('C', { type: 'diag' })).inCall, ['A', 'B']);
  clearAll(a, b, c); await a.say({ type: 'call-end', callId: 'c-3' });
  assert.deepEqual(c.got('peer').slice(-1)[0].inCall, []);
});

await scenario('N7 the refused socket is inert · it gets no later word, its drop changes no one\'s presence, and the room\'s records never name it', async () => {
  const w = world(); const socks = []; for (const id of ['A', 'B', 'C', 'D']) socks.push(await w.connect(id));
  const e = await w.connect('E', '', { silent: true }); assert.equal(e.closeCode(), 4001);
  clearAll(...socks);
  await socks[0].say({ type: 'ping', transient: true, visible: true, inRoom: true, muted: false });
  assert.equal(socks[0].got('peer').slice(-1)[0].others, 3);
  await socks[0].say({ type: 'call-start', kind: 'voice', callId: 'c-4', name: 'A' });
  const d = await w.post('A', { type: 'diag' }); assert.ok(!Object.keys(d.events.find((x) => x.callId === 'c-4').rcp).includes('E'));
  assert.equal(e.inbox.filter((m) => m.type !== 'full').length, 0);
});

const bad = results.filter((r) => !r.ok).length;
console.log(`relay v6.7 harness: ${results.length - bad}/${results.length} scenarios pass`);
process.exit(bad ? 1 : 0);
