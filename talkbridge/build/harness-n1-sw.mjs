#!/usr/bin/env node
/* N1 gate: assembled tb-sw-25b.js shows every banner with icon+badge+sound,
   preserves call options, and frozen behavior (tags, journal flow) intact. */
import fs from 'fs'; import vm from 'vm';
const src = fs.readFileSync(process.argv[2] || 'tb-sw-25b.js', 'utf8');
const calls = []; const listeners = {};
function FakeReg() {} // prototype target
const reg = new FakeReg();
const ctx = {
  self: { addEventListener: (t, f) => { listeners[t] = f; }, registration: reg, clients: { matchAll: async () => [], openWindow: async () => {} }, skipWaiting: () => {} },
  __shown: () => calls,
  ServiceWorkerRegistration: FakeReg,
  indexedDB: { open: () => { const r = {}; setTimeout(() => r.onerror && r.onerror(new Error('no idb')), 0); return r; } },
  setTimeout, clearTimeout, Promise, JSON, console, Date,
};
FakeReg.prototype.showNotification = async function (title, opts) { calls.push({ title, opts }); };
vm.createContext(ctx); vm.runInContext(src, ctx);
const mkEvent = (payload) => ({ data: { json: () => payload }, waitUntil: (p) => p });
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
// chat event
await listeners['push'](mkEvent({ t: 'tb-ev', id: 'e1', room: 'r1', kind: 'chat', name: 'Sally', ts: 1 }));
// call event
await listeners['push'](mkEvent({ t: 'tb-ev', id: 'e2', room: 'r1', kind: 'video', callId: 'c9', name: 'Sally', ts: 2 }));
// declarative-envelope payload (Safari path unwrapped by browser; Chrome SW must still work when tb fields ride along)
await listeners['push'](mkEvent({ web_push: 8030, notification: { title: 'x' }, t: 'tb-ev', id: 'e3', room: 'r2', kind: 'chat', name: 'Mike', ts: 3 }));
// malformed payload -> frozen fallback banner (sets no silent itself; only the wrapper does)
await listeners['push'](mkEvent({ nonsense: true }));
await new Promise(r => setTimeout(r, 30));
ok(calls.length === 4, '4 pushes -> 4 banners');
ok(calls.every(c => c.opts.icon === '/stuff/icon-192.png'), 'icon injected on every banner');
ok(calls.every(c => c.opts.badge === '/stuff/icon-badge-96.png'), 'badge injected on every banner');
ok(calls.every(c => c.opts.silent === false), 'silent:false on every banner');
const byTag = t => calls.find(c => c.opts.tag === t);
ok(!!byTag('tb-r1') && !!byTag('tb-call-c9') && !!byTag('tb-fallback'), 'frozen tag scheme intact');
ok(byTag('tb-call-c9').opts.requireInteraction === true && Array.isArray(byTag('tb-call-c9').opts.vibrate), 'call persistence+vibrate intact');
ok(byTag('tb-r1').title === 'Sally · TalkBridge', 'frozen title scheme intact');
ok(!!byTag('tb-r2'), 'declarative-envelope payload still parsed by SW (Chrome path)');
// N3: a push whose handler shows nothing must still leave a notification visible (Chrome substitution guard)
const before = calls.length;
FakeReg.prototype.getNotifications = async () => [];
const silentEv = { data: { json: () => { throw new Error('unparseable'); } }, waitUntil: (p) => p };
try { await listeners['push'](silentEv); } catch (_) {}
await new Promise(r => setTimeout(r, 40));
ok(calls.length > before, 'a push that shows nothing still leaves a notification visible (no Chrome substitution)');
console.log(fail === 0 ? 'N1-SW GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
