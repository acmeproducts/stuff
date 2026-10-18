#!/usr/bin/env node
/* 29·post-ship c7 relay gate — v6.14 NAMES ONLY (L5, L6; L1–L4 read the name alone) on v6.13 CLEAN LABELS on v6.12 THE ACTIVITY LOG (L1–L4) on v6.11 REACHABILITY FROM THE RECORD (Q1–Q4) on v6.10 A STATE WORD ANNOUNCES AT ONCE (P3) on v6.9 PERSISTED PRESENCE + RECEIPTS FROM THE RECORD (P1, P2, R1, R2) on v6.8 DEAD-ENDPOINT MEMORY on the v6.7 multi-user relay leg: every v6.7 scenario at the new version, plus D1/D2.
   29·base relay gate — MULTI-USER, RELAY LEG (plan §7.8 R-parts, v6.7). Three and
   more sockets through the Durable Object shim: fan-out to all, the room cap
   (default and the creator's), per-device addressing of a call and its words,
   the `inCall` presence field, and the 1:1 behaviour of today's app unchanged
   (no `to` anywhere → exactly v6.6). Set TB_WORKER to gate a mutated worker.
   Exit 1 on any failure. Mutation-tested by build/mutate-relay-v612.mjs. */
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
globalThis.fetch = async (url, init) => { if (String(url).startsWith('https://push.test/dead/')) return { status: 410 }; if (String(url).startsWith('https://push.test/')) return { status: 201 }; return realFetch(url, init); };
class FakeState {
  constructor(storage) { this.storage = storage; this.sockets = []; }
  getWebSockets() { return this.sockets.filter((s) => !s.closed); }
  acceptWebSocket(ws) { this.sockets.push(ws); }
  async blockConcurrencyWhile(fn) { return fn(); }
}
const mod = await import(pathToFileURL(WORKER).href);
const { TalkSession } = mod;
const ENV = { VAPID_PRIVATE_KEY: '' };
/* v6.12: a room appends to the fixed activity room through env.TALK_SESSION; the shim routes that one name to a shared session */
function makeNamespace(env) {
  const stubs = {};
  return { idFromName: (n) => ({ name: n }), get: (id) => { if (!stubs[id.name]) { const st = new FakeState(new FakeStorage()); const ses = new TalkSession(st, env); stubs[id.name] = { fetch: (req) => ses.fetch(req), session: ses }; } return stubs[id.name]; } };
}
const ROOM = 'room-n';

function world(storageMap) {
  const state = new FakeState(new FakeStorage(storageMap));
  const env = { ...ENV }; env.TALK_SESSION = makeNamespace(env); const session = new TalkSession(state, env);
  const activity = async () => { const r = await env.TALK_SESSION.get(env.TALK_SESSION.idFromName('tb::__activity__')).fetch(new Request('https://relay/activity')); return (await r.text()).split('\n').filter(Boolean); };
  const url = (client, extra) => `https://relay.test/signal?app=t&session=${ROOM}&client=${client}${extra || ''}`;
  const w = {
    state, session, activity,
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
      if (!(opts && opts.silent)) { await sock.say(Object.assign({ type: 'hello', name: client }, (opts && opts.hello) || {})); await sock.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); }
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
  assert.equal(d.v, '6.14'); assert.equal(d.cap, 4);
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

const SUB = (ep) => ({ endpoint: ep, keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } });   /* the R10 harnesses' valid P-256 point */
await scenario('D1 a dead endpoint is remembered · B is registered; B is away; A calls; the push service says 410: the record says failed/410/dead-endpoint, B\'s subscription is gone, and B re-offering the SAME endpoint is told {ok:false, dead:true}; the memory survives a restart', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B');
  const r0 = await w.post('B', { type: 'subscribe', subscription: SUB('https://push.test/dead/b-1') }); assert.equal(r0.ok, true);
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false }); clearAll(a, b);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'c-d1', name: 'A' });
  const d = await w.post('A', { type: 'diag' }); const ev = d.events.find((e) => e.callId === 'c-d1'); assert.equal(ev.rcp.B.p, 'os_requested'); assert.equal(ev.rcp.B.push, 'failed'); assert.equal(ev.rcp.B.pushStatus, 410); assert.equal(ev.rcp.B.pushErr, 'dead-endpoint');
  assert.equal(d.subs, 0);
  const r1 = await w.post('B', { type: 'subscribe', subscription: SUB('https://push.test/dead/b-1') }); assert.equal(r1.ok, false); assert.equal(r1.dead, true); assert.equal((await w.post('A', { type: 'diag' })).subs, 0);
  const w2 = world(w.state.storage.map); const r2 = await w2.post('B', { type: 'subscribe', subscription: SUB('https://push.test/dead/b-1') }); assert.equal(r2.dead, true);
});
await scenario('D2 a fresh endpoint is welcome · after the refusal B registers a NEW endpoint: ok, stored, and the next call is pushed to it (accepted/201); an unrelated device\'s endpoint is never refused', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B');
  await w.post('B', { type: 'subscribe', subscription: SUB('https://push.test/dead/b-2') }); await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false });
  await a.say({ type: 'call-start', kind: 'voice', callId: 'c-d2a', name: 'A' });
  assert.equal((await w.post('B', { type: 'subscribe', subscription: SUB('https://push.test/dead/b-2') })).dead, true);
  const r = await w.post('B', { type: 'subscribe', subscription: SUB('https://push.test/live/b-3') }); assert.equal(r.ok, true); assert.equal(r.subscribed, true); assert.equal((await w.post('A', { type: 'diag' })).subs, 1);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'c-d2b', name: 'A' });
  const ev = (await w.post('A', { type: 'diag' })).events.find((e) => e.callId === 'c-d2b'); assert.equal(ev.rcp.B.push, 'accepted'); assert.equal(ev.rcp.B.pushStatus, 201);
  const c = await w.connect('C'); const rc = await w.post('C', { type: 'subscribe', subscription: SUB('https://push.test/live/c-1') }); assert.equal(rc.ok, true); void c;
});

/* a wake = a fresh object over the SAME state (its sockets survive hibernation; its memory does not) */
const wake = (w) => { const session = new TalkSession(w.state, ENV); const w2 = { ...w, session }; w2.say = async (sock, m) => { m.from = sock.client; m.ts = m.ts || Date.now(); m.seq = ++sock.seq; await session.webSocketMessage(sock.server, JSON.stringify(m)); }; w2.post = async (client, body) => { const r = await session.fetch(new Request(`https://relay.test/signal?app=t&session=${ROOM}&client=${client}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })); return r.json(); }; return w2; };
await scenario('P1 the presence word survives a sleep · A and B in the room; the object wakes with an empty memory; B\'s heartbeat is answered with others:1 (A is still there), never 0; the word is in storage', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'); clearAll(a, b);
  const w2 = wake(w); b.clear(); await w2.say(b, { type: 'ping', transient: true, visible: true, inRoom: true, muted: false });
  const peers = b.got('peer'); assert.ok(peers.length >= 1, 'no announcement'); assert.equal(peers[peers.length - 1].others, 1, 'the woken object forgot A: ' + JSON.stringify(peers));
  assert.ok(w.state.storage.map.get('states') && w.state.storage.map.get('states').A, 'the word is not in storage');
  /* a device whose only word came by heartbeat (no ev-state): the heartbeat must be written through too */
  const c = await w2.connect('C', '', { silent: true }); await w2.say(c, { type: 'ping', transient: true, visible: true, inRoom: true, muted: false });
  const w3 = wake(w2); b.clear(); await w3.say(b, { type: 'ping', transient: true, visible: true, inRoom: true, muted: false }); const p3 = b.got('peer'); assert.equal(p3[p3.length - 1].others, 2, 'the heartbeat-only word was forgotten on wake: ' + JSON.stringify(p3));
  const d = await w2.post('B', { type: 'diag' }); assert.equal(d.v, '6.14');
});
await scenario('P2 a word rides a socket · a persisted word whose device has no socket is not a person: after A\'s last socket closes, B hears others:0 at once; a later wake with the stale word still says 0', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'); clearAll(a, b);
  await a.drop(); const after = b.got('peer'); assert.ok(after.length >= 1 && after[after.length - 1].others === 0, 'A\'s departure not announced: ' + JSON.stringify(after));
  /* a stale word planted in storage with no socket behind it */
  const st = w.state.storage.map.get('states') || {}; st.Z = { visible: true, inRoom: true, muted: false, at: Date.now() }; w.state.storage.map.set('states', st);
  const w2 = wake(w); b.clear(); await w2.say(b, { type: 'ping', transient: true, visible: true, inRoom: true, muted: false }); const p = b.got('peer'); assert.equal(p[p.length - 1].others, 0, 'a socketless word counted as a person');
});
await scenario('R1 receipts from the record, both online · A chats to B (attached): A\'s projection says delivered; B marks it seen: A\'s projection says seen; a sync reply carries the same', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'); clearAll(a, b);
  await a.say({ type: 'chat-msg', chatId: 'cm-r1', srcText: 'hi', senderName: 'A' });
  const pa = a.got('ev-proj'); assert.ok(pa.length >= 1 && pa[pa.length - 1].mine && pa[pa.length - 1].mine.delivered.includes('cm-r1'), 'delivered not reported to A: ' + JSON.stringify(pa.map((x) => x.mine)));
  a.clear(); await b.ask({ type: 'ev-seen', ids: ['cm-r1'] });
  const pa2 = a.got('ev-proj'); assert.ok(pa2.length >= 1 && pa2[pa2.length - 1].mine.seen.includes('cm-r1') && !pa2[pa2.length - 1].mine.delivered.includes('cm-r1'), 'seen not reported to A: ' + JSON.stringify(pa2.map((x) => x.mine)));
  const rep = await a.ask({ type: 'events-sync' }); assert.ok(rep.mine && rep.mine.seen.includes('cm-r1'), 'the sync reply lacks mine');
});
await scenario('R2 receipts from the record, B away · A chats while B has no socket: not delivered; B connects and syncs: delivered reaches A; B opens the room: seen reaches A; A offline meanwhile learns it from its own next sync', async () => {
  const w = world(); const a = await w.connect('A'); clearAll(a);
  await a.say({ type: 'chat-msg', chatId: 'cm-r2', srcText: 'hi', senderName: 'A' });
  /* B is a known device (it was in the room before) but has no socket now */
  const w0 = world(); void w0; const dev = w.state.storage.map.get('devices') || {}; dev.B = { at: Date.now() }; w.state.storage.map.set('devices', dev); w.session.devices.B = { at: Date.now() };
  a.clear(); await a.say({ type: 'chat-msg', chatId: 'cm-r2b', srcText: 'again', senderName: 'A' });
  const p0 = a.got('ev-proj'); assert.ok(p0.length && !p0[p0.length - 1].mine.delivered.includes('cm-r2b'), 'delivered to an absent B');
  a.clear(); const b = await w.connect('B', '', { silent: true }); await b.ask({ type: 'events-sync' });
  const p1 = a.got('ev-proj'); assert.ok(p1.length && p1[p1.length - 1].mine.delivered.includes('cm-r2b'), 'B\'s sync did not deliver: ' + JSON.stringify(p1.map((x) => x.mine)));
  a.clear(); await b.ask({ type: 'ev-open' }); const p2 = a.got('ev-proj'); assert.ok(p2.length && p2[p2.length - 1].mine.seen.includes('cm-r2b'), 'B\'s open did not read');
  await a.drop(); const a2 = await w.connect('A', '', { silent: true }); const rep = await a2.ask({ type: 'events-sync' }); assert.ok(rep.mine.seen.includes('cm-r2b'), 'A\'s own sync lacks the seen record');
});

await scenario('P3 a state word announces at once · A blurs (ev-state visible:false): B is told others:0 in the same turn, no heartbeat needed; A focuses: others:1 at once; a device entering the room is told who is there on its first word', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'); clearAll(a, b);
  await a.say({ type: 'ev-state', visible: false, inRoom: false, muted: false }); let p = b.got('peer'); assert.ok(p.length >= 1 && p[p.length - 1].others === 0, 'B was not told A left: ' + JSON.stringify(p));
  clearAll(a, b); await a.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); p = b.got('peer'); assert.ok(p.length >= 1 && p[p.length - 1].others === 1, 'B was not told A is back: ' + JSON.stringify(p));
  const c = await w.connect('C', '', { silent: true }); c.clear(); await c.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); const pc = c.got('peer'); assert.ok(pc.length >= 1 && pc[pc.length - 1].others === 2, 'a newcomer\'s first word was not answered with who is there: ' + JSON.stringify(pc));
});

/* ───── v6.11 REACHABILITY FROM THE RECORD ───── */
const SUBQ = (n) => SUB('https://push.test/ep-' + n);   /* the R10 harness's valid keys */
await scenario('Q1 the peer announce carries reach {known, subs} over the OTHER devices, the asker excluded: no subs → known 1 subs 0; B subscribes → A hears subs 1 at once (no heartbeat); B unsubscribes → 0 at once; a stale subscription (older than the fresh window) does not count', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'); clearAll(a, b);
  await a.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); const p0 = a.got('peer').pop(); assert.ok(p0 && p0.reach, 'no reach field'); assert.deepEqual(p0.reach, { known: 1, subs: 0 });
  clearAll(a, b); const r = await w.post('B', { type: 'subscribe', subscription: SUBQ(1) }); assert.equal(r.subscribed, true);
  const p1 = a.got('peer').pop(); assert.ok(p1, 'no announce after subscribe'); assert.deepEqual(p1.reach, { known: 1, subs: 1 });
  const pb = b.got('peer').pop(); assert.deepEqual(pb.reach, { known: 1, subs: 0 }, 'B counts itself');
  clearAll(a, b); await w.post('B', { type: 'unsubscribe' }); const p2 = a.got('peer').pop(); assert.ok(p2, 'no announce after unsubscribe'); assert.deepEqual(p2.reach, { known: 1, subs: 0 });
  await w.post('B', { type: 'subscribe', subscription: SUBQ(1) }); w.session.subs['B'].at = Date.now() - 15 * 24 * 3600 * 1000; clearAll(a, b);
  await a.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); assert.deepEqual(a.got('peer').pop().reach, { known: 1, subs: 0 }, 'a stale subscription counted');
  const dg = await w.post('A', { type: 'diag' }); assert.equal(dg.v, '6.14');
});
await scenario('Q2 call-reach to the caller, from the record after the push attempt: callee away with no subscription → none 1 (record push failed, no-subscription); away with a subscription → pushed 1 (201); in the app → app 1; the callee hears nothing of it', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: false, inRoom: false, muted: false }); clearAll(a, b);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'k1', name: 'A' });
  const cr = a.got('call-reach'); assert.equal(cr.length, 1, 'call-reach count ' + cr.length); assert.deepEqual([cr[0].callId, cr[0].app, cr[0].pushed, cr[0].none, cr[0].muted], ['k1', 0, 0, 1, 0]); assert.equal(cr[0].transient, true);
  assert.equal(b.got('call-reach').length, 0, 'the callee heard call-reach');
  const d = await w.post('A', { type: 'diag' }); const rB = d.events.find((e) => e.id === 'k1').rcp.B; assert.equal(rB.p, 'os_requested'); assert.equal(rB.push, 'failed'); assert.equal(rB.pushErr, 'no-subscription');
  await w.post('B', { type: 'subscribe', subscription: SUBQ(2) }); clearAll(a, b);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'k2', name: 'A' }); const c2 = a.got('call-reach')[0]; assert.deepEqual([c2.app, c2.pushed, c2.none, c2.muted], [0, 1, 0, 0]);
  await b.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); clearAll(a, b);
  await a.say({ type: 'call-start', kind: 'video', callId: 'k3', name: 'A' }); const c3 = a.got('call-reach')[0]; assert.deepEqual([c3.app, c3.pushed, c3.none, c3.muted], [1, 0, 0, 0]);
});
await scenario('Q3 a muted callee counts as muted (the app unsubscribes a muted room; nothing rings, and the caller is told); a dead endpoint (410) counts as none, its record failed dead-endpoint', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B');
  await b.say({ type: 'ev-state', visible: true, inRoom: true, muted: true }); clearAll(a, b);
  await a.say({ type: 'call-start', kind: 'voice', callId: 'k4', name: 'A' }); const c4 = a.got('call-reach')[0]; assert.deepEqual([c4.app, c4.pushed, c4.none, c4.muted], [0, 0, 0, 1]);
  const w2 = world(); const a2 = await w2.connect('A'), b2 = await w2.connect('B'); await b2.say({ type: 'ev-state', visible: false, inRoom: false, muted: false });
  await w2.post('B', { type: 'subscribe', subscription: { endpoint: 'https://push.test/dead/ep-9', keys: SUBQ(9).keys } }); clearAll(a2, b2);
  await a2.say({ type: 'call-start', kind: 'voice', callId: 'k5', name: 'A' }); const c5 = a2.got('call-reach')[0]; assert.deepEqual([c5.app, c5.pushed, c5.none, c5.muted], [0, 0, 1, 0]);
  const d = await w2.post('A', { type: 'diag' }); assert.equal(d.events.find((e) => e.id === 'k5').rcp.B.pushErr, 'dead-endpoint');
});
await scenario('Q4 a chat sends no call-reach; the reach counts carry no id or endpoint; three devices: known 2, subs counts the fresh ones only', async () => {
  const w = world(); const a = await w.connect('A'), b = await w.connect('B'), c = await w.connect('C'); clearAll(a, b, c);
  await a.say({ type: 'chat-msg', chatId: 'cm-q', srcText: 'x', senderName: 'A' }); assert.equal(a.got('call-reach').length, 0);
  await w.post('B', { type: 'subscribe', subscription: SUBQ(3) }); clearAll(a, b, c); await a.say({ type: 'ev-state', visible: true, inRoom: true, muted: false });
  const p = a.got('peer').pop(); assert.deepEqual(p.reach, { known: 2, subs: 1 }); assert.deepEqual(Object.keys(p.reach).sort(), ['known', 'subs']);
  for (const m of [...a.inbox]) { const t = JSON.stringify(m); assert.ok(!/push\.test/.test(t), 'an endpoint leaked'); }
});


/* ───── v6.12 THE ACTIVITY LOG ───── */
const tick = () => new Promise((r) => setTimeout(r, 5));
await scenario('L1 created and joined: the creator\'s first hello writes "created en → th", the joiner\'s "joined th → en", each once (a second hello of the same device writes nothing); person = the name alone (no device tag), room = the short id', async () => {
  const w = world(); const a = await w.connect('A', '', { hello: { name: 'Ann', dev: 'android-flz', role: 'creator', lang: 'en', targetLang: 'th' } }); await tick();
  const b = await w.connect('B', '', { hello: { name: 'Bo', dev: 'android-m66', role: 'joiner', lang: 'th', targetLang: 'en' } }); await tick();
  await a.say({ type: 'hello', name: 'Ann', dev: 'android-flz', role: 'creator', lang: 'en', targetLang: 'th' }); await tick();
  const lines = await w.activity(); assert.equal(lines.length, 2, lines.join(' | '));
  assert.match(lines[0], /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d  room roomn  Ann created  en → th$/); assert.match(lines[1], /  room roomn  Bo joined  th → en$/);
});
await scenario('L2 a chat writes "chat from" once (a retry of the same message writes nothing); the text never reaches the log', async () => {
  const w = world(); const a = await w.connect('A', '', { hello: { name: 'Ann', dev: 'android-flz', role: 'creator', lang: 'en', targetLang: 'th' } }); const b = await w.connect('B', '', { hello: { name: 'Bo', dev: 'android-m66', role: 'joiner' } }); await tick();
  await a.say({ type: 'chat-msg', chatId: 'cm-l2', srcText: 'secret words', tgtText: 'คำลับ', senderName: 'Ann' }); await tick();
  await a.say({ type: 'chat-msg', chatId: 'cm-l2', srcText: 'secret words', tgtText: 'คำลับ', senderName: 'Ann' }); await tick();
  const lines = (await w.activity()).filter((l) => /chat/.test(l)); assert.equal(lines.length, 1, lines.join(' | ')); assert.match(lines[0], /  room roomn  Ann chat$/); assert.ok(!/secret|คำลับ/.test((await w.activity()).join('\n')), 'text leaked');
});
await scenario('L3 calls: answered writes "video call from Ann — answered by Bo"; declined likewise; a call nobody answered writes "— missed" at its end; each call once', async () => {
  const w = world(); const a = await w.connect('A', '', { hello: { name: 'Ann', dev: 'android-flz', role: 'creator' } }); const b = await w.connect('B', '', { hello: { name: 'Bo', dev: 'android-m66', role: 'joiner' } }); await tick();
  await a.say({ type: 'call-start', kind: 'video', callId: 'c1', name: 'Ann' }); await b.say({ type: 'call-accept', callId: 'c1' }); await a.say({ type: 'call-end', callId: 'c1' }); await tick();
  await b.say({ type: 'call-start', kind: 'voice', callId: 'c2', name: 'Bo' }); await a.say({ type: 'call-decline', callId: 'c2' }); await b.say({ type: 'call-end', callId: 'c2' }); await tick();
  await a.say({ type: 'call-start', kind: 'video', callId: 'c3', name: 'Ann' }); await a.say({ type: 'call-end', callId: 'c3', reason: 'missed' }); await tick();
  const lines = (await w.activity()).filter((l) => /call/.test(l)); assert.equal(lines.length, 3, lines.join(' | '));
  assert.match(lines[0], /  room roomn  video call from Ann — answered by Bo$/); assert.match(lines[1], /  room roomn  voice call from Bo — declined by Ann$/); assert.match(lines[2], /  room roomn  video call from Ann — missed$/);
});
await scenario('L4 the log is readable and clearable at /activity, capped, carries no endpoint or full id; a device without a name is "Guest 1"', async () => {
  const w = world(); const a = await w.connect('AAAA-1234', '', { silent: true }); await a.say({ type: 'hello', role: 'creator', lang: 'en', targetLang: 'th' }); await a.say({ type: 'ev-state', visible: true, inRoom: true, muted: false }); await tick();
  const lines = await w.activity(); assert.equal(lines.length, 1); assert.match(lines[0], /  room roomn  Guest 1 created  en → th$/);
  await w.post('AAAA-1234', { type: 'subscribe', subscription: SUB('https://push.test/ep-l4') }); await tick(); assert.ok(!/push\.test|AAAA-1234/.test((await w.activity()).join('\n')), 'leak');
  const r = await w.session.env.TALK_SESSION.get(w.session.env.TALK_SESSION.idFromName('tb::__activity__')).fetch(new Request('https://relay/activity', { method: 'DELETE' })); assert.equal(r.status, 200); assert.equal((await w.activity()).length, 0);
});
await scenario('L5 clean labels · a name keeps letters and digits only, in any script (Thai whole), 16 at most; spaces, punctuation and emoji go; a name with nothing left is a guest; no device tag; the room is letters and digits; a language that is not a code is "unknown"; every label is the name or "Guest N" and nothing else', async () => {
  const cases = [
    ['C1', { name: "Ann·Lee!! 😀", dev: 'android-flz' }, 'AnnLee'], ['C2', { name: 'สมชาย', dev: 'iphone-k2p' }, 'สมชาย'], ['C3', { name: '😀😀', dev: 'android-Q_9' }, 'Guest 1'],
    ['C4', { name: '   ', dev: '' }, 'Guest 1'], ['C5', { name: '<b>Zoë</b>', dev: 'desktop-x1y' }, 'bZoëb'], ['C6', { name: 'a'.repeat(30), dev: 'android-abc' }, 'a'.repeat(16)] ];
  const lines = [];   /* one room per case (a room holds four) */
  for (const [id, h] of cases) { const w = world(); await w.connect('dev-' + id, '', { hello: Object.assign({ role: 'joiner', lang: id === 'C4' ? '<x>' : 'th', targetLang: 'en' }, h) }); await tick(); lines.push(...(await w.activity())); }
  assert.equal(lines.length, cases.length, lines.join(' | '));
  cases.forEach(([id, , want], i) => assert.ok(lines[i].includes('  room roomn  ' + want + ' joined  '), id + ': ' + lines[i]));
  assert.match(lines[3], /joined  unknown → en$/);
  for (const l of lines) { const who = l.split('  ')[2].replace(/ joined$/, ''); assert.match(who, /^([\p{L}\p{M}\p{N}]{1,16}|Guest \d+)$/u, 'unclean label: ' + who); assert.ok(!/flz|k2p|q9|x1y|abc$/.test(who) || who === 'a'.repeat(16), 'a device tag leaked: ' + who); }
  const w = world(); const a = await w.connect('dev-C7', '', { silent: true }); await a.say({ type: 'hello', role: 'creator', lang: 'en', targetLang: 'th' }); await tick();
  assert.match((await w.activity()).pop(), /  Guest 1 created  en → th$/);
});
await scenario('L6 guests are numbered per room and keep their number · two nameless devices are "Guest 1" and "Guest 2" in the order they appear; each keeps its number on later lines and after a restart; a guest who later types a name is written by the name', async () => {
  const store = new Map(); const w = world(store);
  const a = await w.connect('dev-g1', '', { hello: { name: '', role: 'creator', lang: 'en', targetLang: 'th' } }); await tick();
  const b = await w.connect('dev-g2', '', { hello: { name: '', role: 'joiner', lang: 'th', targetLang: 'en' } }); await tick();
  await a.say({ type: 'chat-msg', chatId: 'cm-g1', srcText: 'x', senderName: '' }); await tick();
  await b.say({ type: 'chat-msg', chatId: 'cm-g2', srcText: 'y', senderName: '' }); await tick();
  let lines = await w.activity(); assert.equal(lines.length, 4, lines.join(' | '));
  assert.match(lines[0], /  Guest 1 created  /); assert.match(lines[1], /  Guest 2 joined  /); assert.match(lines[2], /  Guest 1 chat$/); assert.match(lines[3], /  Guest 2 chat$/);
  const w2 = world(store); const b2 = await w2.connect('dev-g2', '', { silent: true }); await b2.say({ type: 'chat-msg', chatId: 'cm-g3', srcText: 'z', senderName: '' }); await tick();
  assert.match((await w2.activity()).pop(), /  Guest 2 chat$/);
  await b2.say({ type: 'hello', name: 'Bo', role: 'joiner', lang: 'th', targetLang: 'en' }); await b2.say({ type: 'chat-msg', chatId: 'cm-g4', srcText: 'w', senderName: 'Bo' }); await tick();
  assert.match((await w2.activity()).pop(), /  Bo chat$/);
  /* the number is saved when it is given: a restart straight after a guest's first line, then a second guest, is Guest 2 */
  const s3 = new Map(); const w3 = world(s3); await w3.connect('dev-h1', '', { silent: true }).then((x) => x.say({ type: 'hello', name: '', role: 'creator', lang: 'en', targetLang: 'th' })); await tick();
  const w4 = world(s3); await w4.connect('dev-h2', '', { silent: true }).then((x) => x.say({ type: 'hello', name: '', role: 'joiner', lang: 'th', targetLang: 'en' })); await tick();
  assert.match((await w4.activity()).pop(), /  Guest 2 joined  /);
});
const bad = results.filter((r) => !r.ok).length;
console.log(`relay v6.14 harness: ${results.length - bad}/${results.length} scenarios pass`);
process.exit(bad ? 1 : 0);
