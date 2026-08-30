#!/usr/bin/env node
import { readFileSync } from 'fs';
const src = readFileSync(process.argv[2] || new URL('../worker-talk.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const A = (v, m) => { if (!v) throw new Error(m); };
const T = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + (e.message || e)); } };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const c0 = src.indexOf('function b64uToBytes'), c1 = src.indexOf('const vapidCache');
const cryptoFns = new Function(src.slice(c0, c1) + '\nreturn {webpushEncrypt,b64uToBytes};')();
await T('C1 RFC 8291 Appendix A encryption remains byte-exact', async () => {
  const pub = 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
  const raw = cryptoFns.b64uToBytes(pub);
  const out = await cryptoFns.webpushEncrypt('When I grow up, I want to be a watermelon',
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', 'BTBZMqHH6r4Tts7J_aSIgg',
    { asPrivateJwk: { kty: 'EC', crv: 'P-256', d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
      x: Buffer.from(raw.slice(1, 33)).toString('base64url'), y: Buffer.from(raw.slice(33)).toString('base64url') }, asPublicRaw: pub, salt: 'DGv6ra1nlYgDCS1FRnbzlw' });
  A(Buffer.from(out).toString('base64url') === 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN', 'ciphertext mismatch');
});
await T('C2 no global push topic, socket-presence suppression, or history-guessing worker contract', async () => {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '');
  A(!code.includes("Topic: 'tb-wake'"), 'global topic returned');
  A(!code.includes('lastSeen') && !code.includes('105000'), 'presence inference returned');
  A(code.includes("'suppressed', 'chat-burst'"), 'truthful burst state absent');
  A(code.includes("msg.type === 'call-end' && clientId === call.senderId"), 'recipient missed rule absent');
  A(code.includes('const duplicate = !transient && msg.eventId'), 'stable retry guard absent');
  A(code.includes("data.record.deviceId !== deviceId") && code.includes("'device-out-of-scope'"), 'service device binding absent');
});

function storage(seed) {
  const data = seed || new Map();
  return { data,
    get: async keys => { if (!Array.isArray(keys)) return data.get(keys); const out = new Map(); keys.forEach(k => out.set(k, data.get(k))); return out; },
    put: async obj => { Object.entries(obj).forEach(([k, v]) => data.set(k, v)); }, setAlarm: async at => data.set('__alarm', at) };
}
function session(seed) {
  const pre = src.slice(0, src.indexOf('export default'));
  const Klass = new Function(pre + src.slice(src.indexOf('export class TalkSession')).replace('export class', 'return class'))();
  const st = storage(seed), sockets = [];
  const state = { storage: st, blockConcurrencyWhile: fn => fn(), getWebSockets: () => sockets, acceptWebSocket() {}, waitUntil(p) { Promise.resolve(p).catch(() => {}); } };
  const s = new Klass(state, {}); s.sessionName = 'roomZ';
  const pushed = [];
  s._pushOne = async (clientId, rec) => { pushed.push({ clientId, eventId: rec.eventId, outcome: rec.outcome }); return { accepted: true, status: 201 }; };
  const sent = {};
  s._sendTo = (clientId, payload) => { (sent[clientId] || (sent[clientId] = [])).push(payload); return 1; };
  const ws = id => ({ deserializeAttachment: () => ({ clientId: id }), send(raw) { (sent[id] || (sent[id] = [])).push(JSON.parse(raw)); }, close() {} });
  const say = (id, msg) => s.webSocketMessage(ws(id), JSON.stringify(msg));
  return { s, st, sockets, pushed, sent, say };
}
const fakeSub = muted => ({ sub: { endpoint: 'https://push.invalid/e', keys: { p256dh: 'p', auth: 'a' } }, navigate: 'https://example.test/app.html', at: Date.now(), muted: !!muted });

{
  const x = session(); await x.s.ready; x.s.subs.alice = fakeSub(false);
  await x.say('bob', { type: 'chat-msg', chatId: 'c1', eventId: 'chat:c1', srcText: 'one' });
  await T('P1 alert is durably recipient-ledgered before presentation', async () => {
    const rec = x.s._event('alice', 'chat:c1'); A(rec && rec.seen === false && rec.presentation === 'pending', JSON.stringify(rec));
    A(x.sent.alice.some(m => m.type === 'presentation-offer'), 'offer missing'); A(x.pushed.length === 0, 'push raced offer window');
  });
  await x.say('alice', { type: 'foreground-ready', eventId: 'chat:c1', transient: true });
  await sleep(20);
  await T('P2 exact readiness grants in_app and prevents OS push', async () => {
    const rec = x.s._event('alice', 'chat:c1'); A(rec.presentation === 'in_app', rec.presentation); A(x.pushed.length === 0, 'double path');
  });
  await x.say('alice', { type: 'surface-ready', eventId: 'chat:c1', seen: true, transient: true });
  await T('P3 exact rendered surface—not route—marks the event seen', async () => A(x.s._event('alice', 'chat:c1').seen === true, 'not seen'));

  x.s.burst.alice = 0;
  await x.say('bob', { type: 'chat-msg', chatId: 'c2', eventId: 'chat:c2', srcText: 'two' });
  await sleep(720);
  await T('P4 no readiness selects one OS path and records push acceptance separately', async () => {
    const rec = x.s._event('alice', 'chat:c2'); A(rec.presentation === 'os' && rec.pushAccepted === true && rec.pushStatus === 201, JSON.stringify(rec)); A(x.pushed.length === 1, 'push count');
  });
  await x.say('alice', { type: 'foreground-ready', eventId: 'chat:c2', transient: true });
  await T('P5 late readiness cannot mount a second surface', async () => {
    const decisions = (x.sent.alice || []).filter(m => m.type === 'presentation-decision' && m.event.eventId === 'chat:c2');
    A(decisions.at(-1).presentation === 'os' && x.pushed.length === 1, 'owner reversed');
  });
}

{
  const x = session(); await x.s.ready; x.s.subs.alice = fakeSub(false);
  const retry = { type: 'chat-msg', chatId: 'same', eventId: 'chat:same', srcText: 'once' };
  await x.say('bob', retry);
  await x.say('bob', retry);
  await T('P6 stable retry is persisted, ledgered, and offered exactly once', async () => {
    A(x.s.messages.filter(m => m.eventId === retry.eventId).length === 1, 'history duplicated');
    A(x.s.recipientEvents.alice.filter(m => m.eventId === retry.eventId).length === 1, 'ledger duplicated');
    A((x.sent.alice || []).filter(m => m.type === 'presentation-offer' && m.event.eventId === retry.eventId).length === 1, 'surface offered twice');
  });
}

{
  const x = session(); await x.s.ready; x.s.subs.alice = fakeSub(false);
  await x.say('bob', { type: 'chat-msg', chatId: 'b1', eventId: 'chat:b1' });
  await x.say('bob', { type: 'chat-msg', chatId: 'b2', eventId: 'chat:b2' });
  await x.say('bob', { type: 'chat-msg', chatId: 'b3', eventId: 'chat:b3' });
  await sleep(720);
  await T('B1 three-message burst is one push, three exact unseen records, truthful suppression', async () => {
    A(x.pushed.length === 1, 'pushes=' + x.pushed.length);
    const list = x.s.recipientEvents.alice; A(list.length === 3 && list.every(r => !r.seen), 'ledger wrong');
    A(list[1].presentation === 'suppressed' && list[2].presentation === 'suppressed', 'suppression mislabeled');
  });
}

{
  const x = session(); await x.s.ready; x.s.subs.alice = fakeSub(true);
  await x.say('bob', { type: 'chat-msg', chatId: 'm1', eventId: 'chat:m1' });
  await x.say('bob', { type: 'call-start', callId: 'K1', eventId: 'K1:start', kind: 'video' });
  await sleep(20);
  await T('M1 muted chat/call have no attention or push but remain unseen', async () => {
    A(x.pushed.length === 0, 'muted push');
    A(x.s._event('alice', 'chat:m1').presentation === 'muted' && x.s._event('alice', 'K1:start').presentation === 'muted', 'mute decision');
  });
  await x.say('bob', { type: 'call-end', callId: 'K1', eventId: 'K1:end' });
  await T('M2 ordinary bare caller teardown produces recipient-specific missed outcome', async () => {
    const rec = x.s._event('alice', 'K1:start'); A(rec.outcome === 'missed' && rec.seen === false, JSON.stringify(rec));
  });
}

{
  const x = session(); await x.s.ready; x.s.subs.alice = fakeSub(false);
  await x.say('bob', { type: 'call-start', callId: 'K2', eventId: 'K2:start', kind: 'voice' });
  await x.say('alice', { type: 'foreground-ready', eventId: 'K2:start', transient: true });
  await x.say('alice', { type: 'call-accept', callId: 'K2', eventId: 'K2:accept' });
  await x.say('bob', { type: 'call-end', callId: 'K2', eventId: 'K2:end' });
  await T('F1 accepted recipient never becomes missed when caller later ends', async () => A(x.s._event('alice', 'K2:start').outcome === 'accepted', 'not accepted'));
  await x.say('bob', { type: 'call-start', callId: 'K3', eventId: 'K3:start', kind: 'voice' });
  await x.say('alice', { type: 'foreground-ready', eventId: 'K3:start', transient: true });
  await x.say('alice', { type: 'call-decline', callId: 'K3', eventId: 'K3:decline' });
  await x.say('bob', { type: 'call-end', callId: 'K3', eventId: 'K3:end' });
  await T('F2 declined recipient never becomes missed', async () => A(x.s._event('alice', 'K3:start').outcome === 'declined', 'not declined'));
}

{
  const first = session(); await first.s.ready; first.s.subs.alice = fakeSub(true);
  await first.say('bob', { type: 'chat-msg', chatId: 'r1', eventId: 'chat:r1' });
  const second = session(first.st.data); await second.s.ready;
  await T('R1 unseen recipient record survives process restart independently of chat history', async () => A(second.s._event('alice', 'chat:r1') && !second.s._event('alice', 'chat:r1').seen, 'record lost'));
  await second.s._markSeen('alice', second.s.lseq);
  await T('R2 seen-through is monotonic and idempotent', async () => {
    await second.s._markSeen('alice', second.s.lseq); A(second.s.recipientEvents.alice.filter(r => !r.seen).length === 0, 'unseen resurrected');
  });
}

{
  const x = session(); await x.s.ready;
  const req = (action, body) => new Request('https://auth.internal/auth/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const boot = await (await x.s._authFetch(req('bootstrap', { deviceId: 'd1', rooms: ['roomZ'] }), new URL('https://auth.internal/auth/bootstrap'))).json();
  const invite = await (await x.s._authFetch(req('invite-create', { token: boot.auth, roomId: 'roomZ', invite: { r: 'roomZ', ml: 'en', tl: 'es' }, ttlSeconds: 600 }), new URL('https://auth.internal/auth/invite-create'))).json();
  const exchange = await (await x.s._authFetch(req('invite-exchange', { code: invite.code, deviceId: 'd2' }), new URL('https://auth.internal/auth/invite-exchange'))).json();
  await T('A1 invite and device authorization are opaque and contain no provider credential', async () => {
    A(boot.auth && invite.code && exchange.auth, 'opaque values missing');
    const wire = JSON.stringify({ code: invite.code, auth: exchange.auth, invite: exchange.invite });
    A(!/deepgram|turn|api.?key|tid|tok/i.test(wire), wire);
  });
  const replay = await x.s._authFetch(req('invite-exchange', { code: invite.code, deviceId: 'd3' }), new URL('https://auth.internal/auth/invite-exchange'));
  await T('A2 one-time invite replay is rejected', async () => A(replay.status === 410, 'status=' + replay.status));
  const check = await (await x.s._authFetch(req('check', { token: exchange.auth }), new URL('https://auth.internal/auth/check'))).json();
  await T('A3 exchanged authorization is device/relationship/room scoped', async () => A(check.record.deviceId === 'd2' && check.record.rooms.length === 1 && check.record.rooms[0] === 'roomZ', JSON.stringify(check)));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
