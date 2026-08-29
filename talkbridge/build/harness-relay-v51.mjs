#!/usr/bin/env node
/* Relay v5.1 gate — plan v20.5.1 §4.9.
   Crypto: RFC 8291 Appendix A byte-exact. Behavior: TalkSession run headless
   with a socket harness — exact presentation ack, burst, call FSM, mute,
   ledger + cursor across the session-history boundary, envelope, per-event
   diagnostics. */
import { readFileSync } from 'fs';
const src = readFileSync(process.argv[2] || new URL('../worker-talk.js', import.meta.url), 'utf8');
const workflow = readFileSync(process.argv[3] || new URL('../../.github/workflows/deploy-relay.yml', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); if(process.env.FAIL_FAST) throw e; } };
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
  for (const t of ["'tb-wake'", 'lastSeen', '105000', 'resolveRoom']) A(!code.includes(t), t + ' present');
  const ownerCode=code.slice(code.indexOf('_offerPresentations'),code.indexOf('async fetch(request)'));
  A(!ownerCode.includes('_connectedIds().has'),'socket presence suppresses a push');
  A(!/history-sync/.test(code.match(/ALERT_TYPES = new Set\(\[[^\]]*\]\)/)[0]), 'history-sync is an alert type');
  A(!/let\s+FR_SALT\s*=\s*crypto\.randomUUID/.test(code) && code.includes('function frSalt()'), 'recorder salt is generated at module scope (Cloudflare upload rejection)');
});
T('C3 deployment is fail-closed on the R10.5 manifest and live owner/push/ledger/recorder contract', () => {
  for (const t of ["d.v!=='5.1'", 'foreground-owner=ok', 'os-owner=ok', 'push-post=ok status-', 'retry-dedupe=ok', 'missed-call-ledger=ok', 'recorder=ok']) A(workflow.includes(t), 'deploy probe missing: ' + t);
  A(workflow.includes('set -o pipefail') && workflow.includes("grep -qx 'foreground-owner=ok'") && workflow.includes("grep -qx 'recorder=ok'"), 'deploy probe can pass without required assertions');
  A(!workflow.includes('live R10.2 rollback manifest mismatch'), 'stale rollback manifest remains in deploy gate');
});

/* ── headless session ── */
function mkSession(name, priorStorage) {
  const pre = src.slice(0, src.indexOf('export default'));
  const S = new Function(pre + src.slice(src.indexOf('export class TalkSession')).replace('export class', 'return class'))();
  const storage = priorStorage || { data: new Map(),
    get: async k => { if (Array.isArray(k)) { const m = new Map(); k.forEach(x => m.set(x, storage.data.get(x))); return m; } return storage.data.get(k); },
    put: async o => { for (const [k, v] of Object.entries(o)) storage.data.set(k, v); } };
  const sockets = [];
  const state = { storage, blockConcurrencyWhile: f => f(), getWebSockets: () => sockets, acceptWebSocket(){} };
  const s = new S(state, {});
  s.sessionName = name || 'roomZ';
  const pushes = [];
  s._pushOne = async (clientId, rec, meta) => { pushes.push({ clientId, meta, ownerAtPush:(s.presentation[clientId+'|'+meta.eventId]||{}).owner||null }); };
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
  await T('E1 exact offer window: no push and no owner before the bounded decision', () => {
    A(pushes.length === 0 && s.pendingDecisions.size === 1, 'pending=' + s.pendingDecisions.size);
    A([...s.pendingDecisions.keys()][0] === 'alice|c1', 'wrong key: ' + [...s.pendingDecisions.keys()]);
  });
  await sleep(650);
  await T('E2 no foreground response → owner=os is committed before exactly one push', () => {
    A(pushes.length === 1 && pushes[0].clientId === 'alice' && pushes[0].meta.eventId === 'c1' && pushes[0].ownerAtPush==='os', JSON.stringify(pushes));
    A(s.presentation['alice|c1'].owner==='os','OS owner not durable');
  });
  pushes.length = 0;
  s.burst = {};   /* new burst window */
  await say('bob', { type: 'chat-msg', chatId: 'c2', srcText: 'y' });
  await say('alice', { type: 'foreground-ready', eventId: 'c2', transient: true });
  await sleep(650);
  await T('E3 exact foreground response commits owner=in_app and grants before any presentation; no push', () => {
    A(pushes.length === 0, 'pushed despite foreground grant');
    A(s.presentation['alice|c2'].owner==='in_app','in-app owner not committed');
  });
  pushes.length = 0;
  s.burst = {};
  await say('bob', { type: 'chat-msg', chatId: 'c3', srcText: 'z' });
  await say('alice', { type: 'foreground-ready', eventId: 'WRONG', transient: true });
  await say('alice', { type: 'ping', transient: true });
  await say('alice', { type: 'hello', transient: true, name: 'A' });
  await sleep(650);
  await say('alice', { type: 'foreground-ready', eventId: 'c3', transient: true });
  await T('E4 wrong id, pings and sockets cannot win; late exact response cannot reverse owner=os', () => {
    A(pushes.length === 1 && pushes[0].meta.eventId === 'c3','suppressed by non-proof traffic');
    A(s.presentation['alice|c3'].owner==='os','late response reversed owner');
  });
  await T('E5 retry with the same event neither double-ledgers nor sends a second push', async () => {
    s.burst = {};
    await say('bob', { type: 'chat-msg', chatId: 'c3', srcText: 'z' });
    A(s.ledger.filter(e => e.eventId === 'c3').length === 1, 'ledger duplicated');
    A(s.messages.filter(e => e.eventId === 'c3').length === 1, 'history duplicated');
    await sleep(650); A(pushes.length===1,'retry pushed twice');
  });
}
{
  const first=mkSession();await first.s.ready;first.s.subs={alice:sub()};
  await first.say('bob',{type:'chat-msg',chatId:'restart1'});await sleep(650);
  const second=mkSession('roomZ',first.storage);await second.s.ready;second.s.subs={alice:sub()};
  await T('E6 process restart reloads the irreversible owner and retry cannot create another surface',async()=>{
    A(second.s.presentation['alice|restart1'].owner==='os','owner did not survive restart');
    await second.say('bob',{type:'chat-msg',chatId:'restart1'});await sleep(650);
    A(second.pushes.length===0,'restart retry pushed again');
  });
}
{
  const { s, pushes, say } = mkSession();
  await s.ready; s.subs = { alice: sub() };
  await say('bob', { type: 'chat-msg', chatId: 'b1' });
  await say('bob', { type: 'chat-msg', chatId: 'b2' });
  await say('bob', { type: 'chat-msg', chatId: 'b3' });
  await sleep(650);
  await T('B1 room burst: three chats inside 10s → ONE push, three ledger entries', () => {
    A(pushes.length === 1 && pushes[0].meta.eventId === 'b1', 'pushes=' + pushes.length);
    A(s.ledger.filter(e => e.type === 'chat-msg').length === 3, 'ledger != 3');
    A(s.presentation['alice|b2'].reason === 'burst-suppressed' && s.presentation['alice|b3'].reason === 'burst-suppressed', 'suppression not committed per event');
  });
  s.burst.alice = Date.now() - 11000;   /* ≥10s of quiet has passed */
  await say('bob', { type: 'chat-msg', chatId: 'b4' });
  await sleep(650);
  await T('B2 a chat after ≥10s quiet starts ONE new alert', () => A(pushes.length === 2 && pushes[1].meta.eventId === 'b4', 'no new alert after quiet'));
}
{
  const { s, pushes, say } = mkSession();
  await s.ready; s.subs = { alice: sub() };
  await say('bob', { type: 'call-start', callId: 'K1', kind: 'video', eventId: 'K1:start' });
  await say('bob', { type: 'call-accept', callId: 'K1' });   /* answered before the window closes */
  await sleep(650);
  await T('F1 answer inside the window cancels the stale ring push; state = answered', () => {
    A(pushes.length === 0, 'stale call-start pushed after answer');
    A(s.calls.K1.state === 'answered', 'state=' + s.calls.K1.state);
  });
  await say('bob', { type: 'call-end', callId: 'K1' });
  await T('F2 ended answered call is not missed', () => A(s.calls.K1.state === 'ended', 'state=' + s.calls.K1.state));
  await say('bob', { type: 'call-start', callId: 'K2', kind: 'voice', eventId: 'K2:start' });
  await sleep(650);
  await say('bob', { type: 'call-end', callId: 'K2', reason: 'missed' });
  await sleep(650);
  await T('F3 timed-out call: ONE alert (the start), terminal timed_out, call-end itself never alerts', () => {
    A(pushes.filter(p => p.meta.callId === 'K2').length === 1, 'call pushes=' + pushes.length);
    A(s.calls.K2.state === 'timed_out', 'state=' + s.calls.K2.state);
  });
  await say('bob', { type: 'call-start', callId: 'K3', kind: 'voice', eventId: 'K3:start' });
  await say('bob', { type: 'call-end', callId: 'K3' });   /* cancel before answer */
  await sleep(650);
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
  await sleep(650);
  await T('M2 muted device: NO push for chat or call; ledger still records both (counts stay exact)', () => {
    A(pushes.length === 0, 'muted device pushed');
    A(s.ledger.some(e => e.eventId === 'm1') && s.ledger.some(e => e.callId === 'KM'), 'ledger missed muted events');
    A(s.presentation['alice|m1'].owner === 'muted' && s.presentation['alice|KM:start'].owner === 'muted', 'mute not committed per event');
  });
  r = await (await req('POST', 'client=alice', { type: 'mute', muted: false })).json();
  s.burst = {};
  await say('bob', { type: 'chat-msg', chatId: 'm2' });
  await sleep(650);
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
    A(d.v === '5.1' && Array.isArray(d.pushLog) && d.pushLog.length >= 3 && d.owners, 'owner diagnostics missing');
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
    A(env.notification.navigate === 'https://x/app.html?tbEvent=c9&tbRoom=roomZ&tbType=chat-msg', 'navigate wrong: ' + env.notification.navigate);
    A(env.tb.v === 2 && env.tb.eventId === 'c9' && env.tb.roomId === 'roomZ', 'routing metadata wrong');
    A(!JSON.stringify(env).includes('srcText'), 'content leaked');
    const call = s._envelope(sub(), { eventId: 'K:start', type: 'call-start', kind: 'video', callId: 'K', ts: 1 });
    A(call.notification.body === 'Incoming video call', 'call body wrong');
    A(!src.replace(/\/\*[\s\S]*?\*\//g, '').includes("'tb-wake'"), 'global topic present');
  });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
