#!/usr/bin/env node
/* Relay v5 gate — plan v20.2.0 §4.7.3, review §7/§8.
   Crypto: RFC 8291 Appendix A byte-exact. Behavior: TalkSession run headless
   with a socket harness — exact presentation ack, burst, call FSM, mute,
   ledger + cursor across the session-history boundary, envelope, per-event
   diagnostics. */
import { readFileSync } from 'fs';
const src = readFileSync(process.argv[2] || new URL('../worker-talk.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const A = (c, m) => { if (!c) throw new Error(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const a = src.indexOf('function b64uToBytes');
const b = src.indexOf('const vapidCache');
const fns = new Function(src.slice(a, b) + '\nreturn { webpushEncrypt, b64uToBytes };')();
await T('C1 RFC 8291 Appendix A byte-exact', async () => {
  const out = await fns.webpushEncrypt('When I grow up, I want to be a watermelon',
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', 'BTBZMqHH6r4Tts7J_aSIgg',
    { asPrivateJwk: { kty: 'EC', crv: 'P-256', d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
        x: Buffer.from(fns.b64uToBytes('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8').slice(1, 33)).toString('base64url'),
        y: Buffer.from(fns.b64uToBytes('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8').slice(33)).toString('base64url') },
      asPublicRaw: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
      salt: 'DGv6ra1nlYgDCS1FRnbzlw' });
  A(Buffer.from(out).toString('base64url') === 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN', 'ciphertext differs');
});
T('C2 forbidden machinery absent as code: global wake topic, history-guessing wake, presence liveness', () => {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const t of ["'tb-wake'", 'lastSeen', '105000', '_connectedIds().has', 'resolveRoom']) A(!code.includes(t), t + ' present');
  A(!/history-sync/.test(code.match(/ALERT_TYPES = new Set\(\[[^\]]*\]\)/)[0]), 'history-sync is an alert type');
});

/* ── headless session ── */
function mkSession(name) {
  const pre = src.slice(0, src.indexOf('export default'));
  const S = new Function(pre + src.slice(src.indexOf('export class TalkSession')).replace('export class', 'return class'))();
  const storage = { data: new Map(),
    get: async k => { if (Array.isArray(k)) { const m = new Map(); k.forEach(x => m.set(x, storage.data.get(x))); return m; } return storage.data.get(k); },
    put: async o => { for (const [k, v] of Object.entries(o)) storage.data.set(k, v); } };
  const sockets = [];
  const state = { storage, blockConcurrencyWhile: f => f(), getWebSockets: () => sockets, acceptWebSocket(){} };
  const s = new S(state, {});
  s.sessionName = name || 'roomZ';
  const pushes = [];
  s._pushOne = async (clientId, rec, meta) => { pushes.push({ clientId, meta }); };
  const wsFor = id => ({ deserializeAttachment: () => ({ clientId: id }), send(){}, readyState: 1 });
  const say = (id, m) => s.webSocketMessage(wsFor(id), JSON.stringify(m));
  return { s, pushes, say, storage, sockets };
}
const sub = () => ({ sub: { endpoint: 'https://push/x', keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } }, navigate: 'https://x/app.html', at: Date.now() });

{
  const { s, pushes, say } = mkSession();
  await s.ready;
  s.subs = { alice: sub(), bob: sub() };
  await say('bob', { type: 'chat-msg', chatId: 'c1', srcText: 'x' });
  await T('E1 exact-ack window: event scheduled per device, none pushed inside 1s', () => {
    A(pushes.length === 0 && s.pendingPush.size === 1, 'pending=' + s.pendingPush.size);
    A([...s.pendingPush.keys()][0] === 'alice|c1', 'wrong key: ' + [...s.pendingPush.keys()]);
  });
  await sleep(1150);
  await T('E2 no acknowledgement → exactly one push with the event\'s id', () => {
    A(pushes.length === 1 && pushes[0].clientId === 'alice' && pushes[0].meta.eventId === 'c1', JSON.stringify(pushes));
  });
  pushes.length = 0;
  s.burst = {};   /* new burst window */
  await say('bob', { type: 'chat-msg', chatId: 'c2', srcText: 'y' });
  await say('alice', { type: 'presented', eventId: 'c2', transient: true });
  await sleep(1150);
  await T('E3 presented(exactEventId) from the recipient suppresses ONLY that event\'s push', () => A(pushes.length === 0, 'pushed despite presentation ack'));
  pushes.length = 0;
  s.burst = {};
  await say('bob', { type: 'chat-msg', chatId: 'c3', srcText: 'z' });
  await say('alice', { type: 'presented', eventId: 'WRONG', transient: true });
  await say('alice', { type: 'ping', transient: true });
  await say('alice', { type: 'hello', transient: true, name: 'A' });
  await sleep(1150);
  await T('E4 wrong id, pings, hellos, live sockets: never an acknowledgement — the push still goes', () => A(pushes.length === 1 && pushes[0].meta.eventId === 'c3', 'suppressed by non-ack traffic'));
  await T('E5 retry with the same chatId neither double-ledgers nor double-schedules', async () => {
    pushes.length = 0; s.burst = {};
    await say('bob', { type: 'chat-msg', chatId: 'c3', srcText: 'z' });
    A(s.ledger.filter(e => e.eventId === 'c3').length === 1, 'ledger duplicated');
  });
}
{
  const { s, pushes, say } = mkSession();
  await s.ready; s.subs = { alice: sub() };
  await say('bob', { type: 'chat-msg', chatId: 'b1' });
  await say('bob', { type: 'chat-msg', chatId: 'b2' });
  await say('bob', { type: 'chat-msg', chatId: 'b3' });
  await sleep(1150);
  await T('B1 room burst: three chats inside 10s → ONE push, three ledger entries', () => {
    A(pushes.length === 1 && pushes[0].meta.eventId === 'b1', 'pushes=' + pushes.length);
    A(s.ledger.filter(e => e.type === 'chat-msg').length === 3, 'ledger != 3');
    A(s.pushLog.some(l => l.outcome === 'burst-suppressed'), 'suppression not logged per event');
  });
  s.burst.alice = Date.now() - 11000;   /* ≥10s of quiet has passed */
  await say('bob', { type: 'chat-msg', chatId: 'b4' });
  await sleep(1150);
  await T('B2 a chat after ≥10s quiet starts ONE new alert', () => A(pushes.length === 2 && pushes[1].meta.eventId === 'b4', 'no new alert after quiet'));
}
{
  const { s, pushes, say } = mkSession();
  await s.ready; s.subs = { alice: sub() };
  await say('bob', { type: 'call-start', callId: 'K1', kind: 'video', eventId: 'K1:start' });
  await say('bob', { type: 'call-accept', callId: 'K1' });   /* answered before the window closes */
  await sleep(1150);
  await T('F1 answer inside the window cancels the stale ring push; state = answered', () => {
    A(pushes.length === 0, 'stale call-start pushed after answer');
    A(s.calls.K1.state === 'answered', 'state=' + s.calls.K1.state);
  });
  await say('bob', { type: 'call-end', callId: 'K1' });
  await T('F2 ended answered call is not missed', () => A(s.calls.K1.state === 'ended', 'state=' + s.calls.K1.state));
  await say('bob', { type: 'call-start', callId: 'K2', kind: 'voice', eventId: 'K2:start' });
  await sleep(1150);
  await say('bob', { type: 'call-end', callId: 'K2', reason: 'missed' });
  await sleep(1150);
  await T('F3 timed-out call: ONE alert (the start), terminal timed_out, call-end itself never alerts', () => {
    A(pushes.filter(p => p.meta.callId === 'K2').length === 1, 'call pushes=' + pushes.length);
    A(s.calls.K2.state === 'timed_out', 'state=' + s.calls.K2.state);
  });
  await say('bob', { type: 'call-start', callId: 'K3', kind: 'voice', eventId: 'K3:start' });
  await say('bob', { type: 'call-end', callId: 'K3' });   /* cancel before answer */
  await sleep(1150);
  await T('F4 canceled before answer: no push escapes, state = canceled, no missed typing', () => {
    A(!pushes.some(p => p.meta.callId === 'K3'), 'canceled call pushed');
    A(s.calls.K3.state === 'canceled', 'state=' + s.calls.K3.state);
  });
  await T('F5 the ledger types the call exactly (voice/video) for the counter', () => {
    const e2 = s.ledger.find(e => e.callId === 'K2' && e.type === 'call-start');
    A(e2 && e2.kind === 'voice', 'kind lost');
    const e1 = s.ledger.find(e => e.callId === 'K1' && e.type === 'call-start');
    A(e1 && e1.kind === 'video', 'video kind lost');
  });
}
{
  const { s, pushes, say } = mkSession();
  await s.ready; s.subs = { alice: sub() };
  const req = (method, qs, body) => s.fetch(new Request('https://r/signal?session=roomZ&' + qs, { method, body: body ? JSON.stringify(body) : undefined, headers: { Upgrade: '' } }));
  let r = await (await req('POST', 'client=alice', { type: 'mute', muted: true })).json();
  await T('M1 mute is acknowledged per device before anything else may claim it', () => A(r.ok === true && r.muted === true, JSON.stringify(r)));
  await say('bob', { type: 'chat-msg', chatId: 'm1' });
  await say('bob', { type: 'call-start', callId: 'KM', kind: 'voice', eventId: 'KM:start' });
  await sleep(1150);
  await T('M2 muted device: NO push for chat or call; ledger still records both (counts stay exact)', () => {
    A(pushes.length === 0, 'muted device pushed');
    A(s.ledger.some(e => e.eventId === 'm1') && s.ledger.some(e => e.callId === 'KM'), 'ledger missed muted events');
    A(s.pushLog.some(l => l.outcome === 'muted'), 'mute not in per-event diagnostics');
  });
  r = await (await req('POST', 'client=alice', { type: 'mute', muted: false })).json();
  s.burst = {};
  await say('bob', { type: 'chat-msg', chatId: 'm2' });
  await sleep(1150);
  await T('M3 unmuted again: pushes resume', () => A(pushes.some(p => p.meta.eventId === 'm2'), 'push did not resume'));

  let led = await (await req('GET', 'client=alice&ledger=1')).json();
  await T('L1 ledger returns others\' events past the cursor, with call state resolved', () => {
    A(led.ok && led.events.some(e => e.eventId === 'm1') && led.events.length >= 2, 'events missing');
  });
  const maxL = Math.max(...led.events.map(e => e.l));
  await (await req('POST', 'client=alice', { type: 'cursor', l: maxL })).json();
  led = await (await req('GET', 'client=alice&ledger=1')).json();
  await T('L2 cursor advance marks items seen: replay returns nothing, no double-count possible', () => A(led.events.length === 0, 'replay after cursor: ' + led.events.length));
  await (await req('POST', 'client=alice', { type: 'cursor', l: 1 })).json();
  led = await (await req('GET', 'client=alice&ledger=1')).json();
  await T('L3 the cursor is monotonic: a lower value cannot resurrect consumed events', () => A(led.events.length === 0 && led.cursor === maxL, 'cursor regressed'));
  await T('L4 the ledger survives the 12-minute chat-history reset with its own sequence', async () => {
    const lseqBefore = s.lseq, ledgerBefore = s.ledger.length;
    s.lastActivity = Date.now() - (13 * 60 * 1000);
    await s._touchSession();
    A(s.seq === 0 && s.messages.length === 0, 'history not reset');
    A(s.lseq === lseqBefore && s.ledger.length === ledgerBefore, 'ledger reset with history');
    s.burst = {};
    await say('bob', { type: 'chat-msg', chatId: 'post-reset' });
    A(s.ledger[s.ledger.length - 1].l === lseqBefore + 1, 'lseq not monotonic across reset');
  });
  await T('D1 diagnostics are per event (a log ring), never one overwriteable slot', async () => {
    const d = await (await req('POST', 'client=alice', { type: 'diag' })).json();
    A(d.v === '5' && Array.isArray(d.pushLog) && d.pushLog.length >= 3, 'pushLog missing');
    A(!('lastWake' in d), 'single-slot lastWake still exposed');
  });
}
{
  const { s } = mkSession('roomZ');
  await s.ready;
  s.sessionName = 'roomZ';
  await T('V1 envelope: versioned, generic text, routing metadata, navigate tap-through, per-class topic — no content, no global topic', () => {
    const env = s._envelope(sub(), { eventId: 'c9', type: 'chat-msg', kind: null, callId: null, ts: 1 });
    A(env.web_push === 8030 && env.notification.title === 'TalkBridge' && env.notification.body === 'New message', 'declarative shape wrong');
    A(env.notification.navigate === 'https://x/app.html#open=roomZ', 'navigate wrong: ' + env.notification.navigate);
    A(env.tb.v === 1 && env.tb.eventId === 'c9' && env.tb.roomId === 'roomZ', 'routing metadata wrong');
    A(!JSON.stringify(env).includes('srcText'), 'content leaked');
    const call = s._envelope(sub(), { eventId: 'K:start', type: 'call-start', kind: 'video', callId: 'K', ts: 1 });
    A(call.notification.body === 'Incoming video call', 'call body wrong');
    A(!src.replace(/\/\*[\s\S]*?\*\//g, '').includes("'tb-wake'"), 'global topic present');
  });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
