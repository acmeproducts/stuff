#!/usr/bin/env node
/* Relay v4.2 gate — plan v20.0.0 §4.6 ALWAYS-PUSH.
   Crypto judged by RFC 8291 Appendix A byte-exact; behavior judged by running
   TalkSession headless: every subscribed non-sender is pushed, no matter what. */
import { readFileSync } from 'fs';
const src = readFileSync(process.argv[2] || new URL('../worker-talk.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const A = (c, m) => { if (!c) throw new Error(m); };

const a = src.indexOf('function b64uToBytes');
const b = src.indexOf('const vapidCache');
const fns = new Function(src.slice(a, b) + '\nreturn { webpushEncrypt, b64uToBytes };')();

await T('RFC 8291 Appendix A — byte-exact against the standard itself', async () => {
  const out = await fns.webpushEncrypt(
    'When I grow up, I want to be a watermelon',
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    'BTBZMqHH6r4Tts7J_aSIgg',
    {
      asPrivateJwk: {
        kty: 'EC', crv: 'P-256',
        d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
        x: Buffer.from(fns.b64uToBytes('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8').slice(1, 33)).toString('base64url'),
        y: Buffer.from(fns.b64uToBytes('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8').slice(33)).toString('base64url')
      },
      asPublicRaw: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
      salt: 'DGv6ra1nlYgDCS1FRnbzlw'
    }
  );
  A(Buffer.from(out).toString('base64url') === 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN', 'ciphertext differs from RFC 8291');
});
await T('delivery class matches the reference sender (urgency/topic/ttl/encoding)', () => {
  A(src.includes("Urgency: 'high'") && src.includes("Topic: 'tb-wake'") && src.includes("TTL: '60'") && src.includes("'Content-Encoding': 'aes128gcm'"), 'delivery class wrong');
});
await T('R7 body intact: subscribe, unsubscribe, broadcast, history, vapid, diag, prune-on-404/410, session TTL', () => {
  for (const t of ["type === 'subscribe'", "type === 'unsubscribe'", '_broadcast', 'GET', "type === 'vapid'", "type === 'diag'", 'res.status === 404 || res.status === 410', 'SESSION_TTL_MS'])
    A(src.includes(t), t + ' missing');
});
await T('A1-A3 DELETED as code: no ack gate, no liveness map, no freshness, no connected-skip, no timers in the wake path', () => {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '');   /* comments may name the burial; code may not contain it */
  for (const t of ['pendingWakes', 'lastSeen', '105000', 'setTimeout', 'clearTimeout', 'fresh'])
    A(!code.includes(t), t + ' still in code');
  const wake = code.slice(code.indexOf('async _wakeOthers'), code.indexOf('async fetch('));
  A(!wake.includes('_connectedIds'), 'wake path still consults socket presence');
});

/* Behavior: run TalkSession headless. */
function mkSession() {
  const pre = src.slice(0, src.indexOf('export default'));   /* consts + helpers the class uses */
  const S = new Function(pre + src.slice(src.indexOf('export class TalkSession')).replace('export class', 'return class'))();
  const storage = { data: new Map(),
    get: async k => { const m = new Map(); (Array.isArray(k) ? k : [k]).forEach(x => m.set(x, storage.data.get(x))); return Array.isArray(k) ? m : storage.data.get(k); },
    put: async o => { for (const [k, v] of Object.entries(o)) storage.data.set(k, v); } };
  const sockets = [];
  const state = { storage, blockConcurrencyWhile: f => f(), getWebSockets: () => sockets, acceptWebSocket(){} };
  const s = new S(state, {});
  return { s, sockets };
}
const sub = id => ({ sub: { endpoint: 'https://push/' + id, keys: { p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4', auth: 'BTBZMqHH6r4Tts7J_aSIgg' } }, at: Date.now() });
{
  const { s, sockets } = mkSession();
  await s.ready;
  const pushed = [];
  s._pushOne = async (clientId) => { pushed.push(clientId); };
  s.subs = { alice: sub('a'), bob: sub('b'), carol: sub('c') };
  /* alice has a LIVE socket and just spoke — the old relay would have skipped or delayed her */
  sockets.push({ deserializeAttachment: () => ({ clientId: 'alice' }), send(){} });
  await s._wakeOthers({ type: 'chat-msg' }, 'bob');
  await T('B1 always-push: every subscribed non-sender pushed at once — connected, silent, or absent alike', () => {
    A(pushed.sort().join(',') === 'alice,carol', 'pushed=' + pushed.join(','));
  });
  pushed.length = 0;
  await s._wakeOthers({ type: 'ping' }, 'bob');
  await T('B2 non-push-worthy types push nobody', () => A(pushed.length === 0, 'pushed for ping'));
  pushed.length = 0;
  await s._wakeOthers({ type: 'call-end', reason: 'missed' }, 'bob');
  await T('B3 missed call wakes everyone but the sender', () => A(pushed.sort().join(',') === 'alice,carol', 'pushed=' + pushed.join(',')));
  await T('B4 a stale subscription is dropped, not pushed', async () => {
    pushed.length = 0;
    s.subs.dave = { sub: sub('d').sub, at: Date.now() - (91 * 24 * 3600 * 1000) };
    await s._wakeOthers({ type: 'chat-msg' }, 'bob');
    A(!pushed.includes('dave') && !s.subs.dave, 'stale sub survived');
  });
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
