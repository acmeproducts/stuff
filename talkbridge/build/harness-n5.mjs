#!/usr/bin/env node
/* N5 gate: the assembled worker must re-alert Android on every replacement. */
import fs from 'fs'; import vm from 'vm'; import crypto from 'crypto';
const src = fs.readFileSync(process.argv[2] || 'tb-sw-25b.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const calls = []; const listeners = {};
function FakeReg() {}
const reg = new FakeReg(); reg.scope = 'https://acmeproducts.github.io/stuff/';
FakeReg.prototype.showNotification = async function (t, o) { calls.push({ t, o }); };
let VISIBLE = [];
const ctx = { self: { addEventListener: (t, f) => { listeners[t] = f; }, registration: reg, clients: { matchAll: async () => VISIBLE, openWindow: async () => {} }, skipWaiting: () => {} },
  ServiceWorkerRegistration: FakeReg, indexedDB: { open: () => { const r = {}; setTimeout(() => r.onerror && r.onerror(new Error('x')), 0); return r; } },
  setTimeout, clearTimeout, Promise, JSON, console, Date };
vm.createContext(ctx); vm.runInContext(src, ctx);
const ev = p => ({ data: { json: () => p }, waitUntil: x => x });
await listeners['push'](ev({ t: 'tb-ev', id: 'e1', room: 'r1', kind: 'chat', name: 'Sally', ts: 1 }));
await listeners['push'](ev({ t: 'tb-ev', id: 'e2', room: 'r1', kind: 'chat', name: 'Sally', ts: 2 }));  /* same room = same tag = replacement */
await listeners['push'](ev({ t: 'tb-ev', id: 'e3', room: 'r1', kind: 'voice', callId: 'c1', name: 'Sally', ts: 3 }));
await listeners['push'](ev({ nonsense: true }));
await new Promise(r => setTimeout(r, 40));
ok(calls.length === 4, 'every push shows a notification');
ok(calls.every(c => c.o.renotify === true), 'EVERY tagged notification re-alerts (renotify true) — the regression fixed');
const tags = calls.map(c => c.o.tag);
ok(tags.filter(t => t === 'tb-r1').length === 2, 'second message reuses the room tag, so renotify is what makes it ring');
ok(calls.every(c => c.o.icon === '/stuff/icon-192.png' && c.o.badge === '/stuff/icon-badge-96.png'), 'icon and badge on every alert (#652)');
ok(calls.every(c => c.o.silent === false), 'never silent');
ok(calls.find(c => c.o.tag === 'tb-call-c1').o.requireInteraction === true, 'frozen call persistence intact');
ok(calls.find(c => c.o.tag === 'tb-r1').t === 'Sally · TalkBridge', 'frozen title scheme intact');
ok(calls.every(c => c.o.data), 'frozen tap data intact on every alert');
// N6: always-push means the DEVICE decides display
const n = calls.length;
VISIBLE = [{ visibilityState: 'visible' }];
await listeners['push'](ev({ t: 'tb-ev', id: 'e9', room: 'r1', kind: 'chat', name: 'Sally', ts: 9 }));
await new Promise(r => setTimeout(r, 30));
ok(calls.length === n, 'no alert while a window is visible (app already showing it)');
VISIBLE = [{ visibilityState: 'hidden' }];
await listeners['push'](ev({ t: 'tb-ev', id: 'e10', room: 'r1', kind: 'chat', name: 'Sally', ts: 10 }));
await new Promise(r => setTimeout(r, 30));
ok(calls.length === n + 1, 'backgrounded or locked window still alerts (the Android case)');
ok(calls[calls.length - 1].o.renotify === true, 'that alert re-alerts, so the phone rings');
const relay = fs.readFileSync('talkbridge/worker-talk.js', 'utf8');
ok(relay.includes("(r.p !== 'os_requested' && r.p !== 'in_app')"), 'relay pushes even when it believes the app is in front (always-push, as R10.2)');
ok(relay.includes("if (st && st.muted) return 'muted';"), 'muted still blocks the push');
const app = fs.readFileSync('bridge-turn25-base.html', 'utf8');
ok(app.includes("register('./tb-sw-25b.js')"), 'app registers the new worker');
ok(!/\/stuff\/talkbridge\//.test(app), 'no scope move in this candidate — one change at a time');
const h = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
ok(h('bridge-turn24-post-ship.html') === h('bridge-turn25-pre-base.html'), 'accepted release untouched');
ok(fs.readFileSync('tb-sw-25b.js').slice(0, fs.statSync('tb-sw.js').size).equals(fs.readFileSync('tb-sw.js')), 'frozen worker bytes carried verbatim');
console.log(fail === 0 ? 'N5 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
