#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
const part = fs.readFileSync(process.env.N11 || 'talkbridge/parts/n11-stale-subscription.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const b64 = s => Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const CURRENT = b64('current-signing-key-bytes');
const OLD = b64('an-older-signing-key!!');

function world(subKeyB64) {
  const dom = new JSDOM('<body></body>', { url: 'https://x.test/a.html', runScripts: 'outside-only' });
  const w = dom.window; const logged = []; const state = { unsubscribed: 0, subscribed: 0, reRegistered: 0 };
  w.btoa = s => Buffer.from(s, 'binary').toString('base64');
  w.p3Log = (e, d) => logged.push({ e, d });
  w.p3State = { sub: null, registered: { r1: true, r2: true } };
  w.p3Vapid = () => Promise.resolve(CURRENT);
  w.p3B64ToBytes = s => new Uint8Array(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  w.p3RegisterAll = () => { state.reRegistered++; return Promise.resolve([true]); };
  w.p2IsStandalone = () => true;
  const existing = subKeyB64 === null ? null : {
    endpoint: 'https://fcm.example/abc',
    options: { applicationServerKey: new Uint8Array(Buffer.from(subKeyB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')) },
    unsubscribe: () => { state.unsubscribed++; return Promise.resolve(true); },
  };
  const reg = { pushManager: {
    getSubscription: () => Promise.resolve(existing),
    subscribe: () => { state.subscribed++; return Promise.resolve({ endpoint: 'https://fcm.example/NEW', options: {} }); },
  } };
  Object.defineProperty(w.navigator, 'serviceWorker', { value: { ready: Promise.resolve(reg) }, configurable: true });
  w.eval(part);
  return { w, logged, state };
}
const settle = () => new Promise(r => setTimeout(r, 2900));

let t = world(OLD);
await settle();
ok(t.logged.some(l => l.e === 'n11_key_stale'), 'a subscription minted under an old signing key is detected');
ok(t.state.unsubscribed === 1, 'the dead subscription is discarded');
ok(t.state.subscribed === 1, 'a fresh one is minted with the current key');
ok(t.state.reRegistered === 1, 'and every room is registered again with the new endpoint');
ok(t.w.p3State.sub && /NEW/.test(t.w.p3State.sub.endpoint), 'the app now holds the fresh subscription');
ok(Object.keys(t.w.p3State.registered).length === 0 || t.state.reRegistered === 1, 'stale room registrations are not trusted');

t = world(CURRENT);
await settle();
ok(t.logged.some(l => l.e === 'n11_key_ok'), 'a healthy subscription is recognised');
ok(t.state.unsubscribed === 0 && t.state.subscribed === 0, 'and is left completely alone — no churn, no duplicate endpoints');

t = world(null);
await settle();
ok(t.state.unsubscribed === 0 && t.state.subscribed === 0, 'with no subscription at all this stays out of the way (the normal path owns it)');
console.log(fail === 0 ? 'N11 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
