#!/usr/bin/env node
/* Relay v3 gate — Step 1, plan v17.1.0.
   The crypto is judged by RFC 8291 Appendix A itself: fixed inputs must
   produce the RFC's exact bytes. Not opinion — arithmetic. */
import { readFileSync } from 'fs';
/* node 22: global crypto already present */
const src = readFileSync(new URL('../worker-talk.js', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const A = (c, m) => { if (!c) throw new Error(m); };

/* extract the encryption functions into a sandbox */
const a = src.indexOf('function b64uToBytes');
const b = src.indexOf('const vapidCache');
const mod = src.slice(a, b);
const fns = new Function(mod + '\nreturn { webpushEncrypt, b64uToBytes };')();

await T('RFC 8291 Appendix A — byte-exact against the standard itself', async () => {
  const out = await fns.webpushEncrypt(
    'When I grow up, I want to be a watermelon',
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
    'BTBZMqHH6r4Tts7J_aSIgg',
    {
      asPrivateJwk: {
        kty: 'EC', crv: 'P-256',
        d: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
        /* x,y = the RFC's as_public raw key split (65 bytes: 04 | X32 | Y32) */
        x: Buffer.from(fns.b64uToBytes('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8').slice(1, 33)).toString('base64url'),
        y: Buffer.from(fns.b64uToBytes('BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8').slice(33)).toString('base64url')
      },
      asPublicRaw: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
      salt: 'DGv6ra1nlYgDCS1FRnbzlw'
    }
  );
  const hex = Buffer.from(out).toString('base64url');
  A(hex === 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN', 'ciphertext differs from RFC 8291: ' + hex.slice(0,60));
});
await T('delivery class matches the reference sender (urgency/topic/ttl/encoding)', () => {
  A(src.includes("Urgency: 'high'") && src.includes("Topic: 'tb-wake'"), 'urgency/topic missing');
  A(src.includes("TTL: '60'") && src.includes("'Content-Encoding': 'aes128gcm'"), 'ttl/encoding wrong');
  A(!src.includes("'Content-Length': '0'"), 'empty pushes still possible');
});
await T('R7 body intact: subscribe, broadcast, history, vapid, prune-on-404/410', () => {
  for (const t of ["type === 'subscribe'", '_broadcast', 'history', "type === 'vapid'", 'res.status === 404 || res.status === 410'])
    A(src.includes(t), t + ' missing');
});
await T('wake still skips the sender; presenting devices exempt via freshness', () => {
  A(src.includes('if (clientId === senderId) continue;'), 'sender skip gone');
  A(src.includes('connected.has(clientId) && fresh) continue;'), 'presenting exemption gone');
});
await T('observability: lastWake initialized IN THE CONSTRUCTOR and recorded per attempt; diag read-only', () => {
  const ctor = src.slice(src.indexOf('constructor(state, env)'), src.indexOf('this.ready ='));
  A(ctor.includes('this.lastWake = null'), 'lastWake not constructor-initialized — the exact defect class that 500d relay v2');
  A(src.includes('status: res.status'), 'wake result not recorded');
  A(src.includes("body.type === 'diag'"), 'diag missing');
});
await T('P1 wake set: call-end and thread-invite are wake-worthy (missed calls + invites reach locked phones)', () => {
  A(src.includes("'call-end'") && src.includes("'thread-invite'"), 'wake set incomplete');
});
await T('P1 ack-gate: fallback scheduled for the silent-but-connected, cancelled by any inbound word, absent pushed now', () => {
  A(src.includes('this.pendingWakes.set(clientId, t)') && src.includes('}, 1000);'), 'fallback not scheduled at 1s');
  A(src.includes('clearTimeout(t0); this.pendingWakes.delete(clientId);'), 'ack does not cancel');
  A(src.includes('/* absent: push is the only alert, now */'), 'absent path lost immediacy');
  A(src.includes('connected.has(clientId) && fresh) continue;'), 'presenting devices not exempt');
});
await T('P1 liveness constructor-anchored + stamped at accept and inbound', () => {
  const ctor = src.slice(src.indexOf('constructor(state, env)'), src.indexOf('this.ready ='));
  A(ctor.includes('this.lastSeen = new Map()') && ctor.includes('this.pendingWakes = new Map()'), 'state not constructor-anchored');
  A(src.includes('/* acceptance IS liveness */'), 'accept stamp missing');
});
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
