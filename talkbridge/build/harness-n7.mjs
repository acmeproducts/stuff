#!/usr/bin/env node
/* N7 gate. Proves the two halves of the R10.2 recipe on the real artifacts:
   the relay reaches a phone whose last self-report still says "visible", and
   the worker presents correctly on each platform. */
import fs from 'fs'; import vm from 'vm'; import crypto from 'crypto';
const swSrc = fs.readFileSync(process.argv[2] || 'tb-sw-25b.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

function boot({ ua = 'Android Chrome', clients = [] } = {}) {
  const calls = []; const closed = []; const L = {};
  function Reg() {}
  const reg = new Reg(); reg.scope = 'https://acmeproducts.github.io/stuff/';
  Reg.prototype.showNotification = async function (t, o) { calls.push({ t, o }); };
  Reg.prototype.getNotifications = async function ({ tag } = {}) {
    return calls.filter(c => !tag || c.o.tag === tag).map(c => ({ close() { closed.push(c.o.tag); } }));
  };
  const ctx = {
    self: { addEventListener: (t, f) => { L[t] = f; }, registration: reg,
      navigator: { userAgent: ua, maxTouchPoints: 0 },
      clients: { matchAll: async () => clients, openWindow: async () => {} }, skipWaiting: () => {} },
    ServiceWorkerRegistration: Reg,
    indexedDB: { open: () => { const r = {}; setTimeout(() => r.onerror && r.onerror(new Error('x')), 0); return r; } },
    setTimeout, clearTimeout, Promise, JSON, console, Date };
  vm.createContext(ctx); vm.runInContext(swSrc, ctx);
  return { calls, closed, push: p => L['push']({ data: { json: () => p }, waitUntil: x => x }) };
}
const CHAT = (id, room = 'r1') => ({ t: 'tb-ev', id, room, kind: 'chat', name: 'Sally', ts: Date.now() });

// 1. phone asleep / app not on screen — the case that has been failing
let w = boot({ clients: [] });
await w.push(CHAT('e1')); await w.push(CHAT('e2')); await new Promise(r => setTimeout(r, 30));
ok(w.calls.length === 2, 'locked or backgrounded phone: every push shows an alert');
ok(w.calls.every(c => c.o.renotify === true), 'every alert re-alerts, so the second message in a room rings too');
ok(w.calls.every(c => c.o.icon === '/stuff/icon-192.png' && c.o.badge === '/stuff/icon-badge-96.png'), 'alerts carry the TalkBridge icon and badge');
ok(w.calls.every(c => c.o.silent === false), 'alerts are never silent');
ok(w.calls[0].o.tag === 'tb-r1' && w.calls[0].t === 'Sally · TalkBridge', 'frozen tag and title scheme intact');
ok(w.calls.every(c => c.o.data && c.o.data.url), 'frozen tap destination intact');

// 2. Android with the app on screen — the app is the alert
w = boot({ clients: [{ visibilityState: 'visible' }] });
await w.push(CHAT('e3')); await new Promise(r => setTimeout(r, 30));
ok(w.calls.length === 0, 'Android with the app on screen: no OS alert (the app presents it)');

// 3. iPhone with the app on screen — must still show, then clear (Apple revokes silent handlers)
w = boot({ ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X)', clients: [{ visibilityState: 'visible' }] });
await w.push(CHAT('e4')); await new Promise(r => setTimeout(r, 40));
ok(w.calls.length === 1, 'iPhone with the app on screen: the push is still displayed');
ok(w.closed.length === 1, 'and it is closed straight away, so nothing is left on screen');

// 4. a call alert keeps its frozen persistence
w = boot({ clients: [] });
await w.push({ t: 'tb-ev', id: 'e5', room: 'r1', kind: 'voice', callId: 'c1', name: 'Sally', ts: Date.now() });
await new Promise(r => setTimeout(r, 30));
ok(w.calls[0].o.requireInteraction === true && Array.isArray(w.calls[0].o.vibrate), 'call alerts stay persistent and vibrate');

// 5. relay half
const relay = fs.readFileSync('talkbridge/worker-talk.js', 'utf8');
ok(relay.includes("(r.p !== 'os_requested' && r.p !== 'in_app')"), 'relay pushes even when it believes the app is in front');
ok(relay.includes("if (st && st.muted) return 'muted';"), 'muted still blocks the push');
ok(relay.includes("if (ev.kind === 'chat' && now - this._lastOsChat(clientId) < BURST_MS) return 'suppressed';"), 'chat burst suppression untouched');

// 6. artifacts
const app = fs.readFileSync('bridge-turn25-base.html', 'utf8');
ok(app.includes("register('./tb-sw-25b.js')"), 'app loads the candidate worker');
const h = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
ok(h('bridge-turn24-post-ship.html') === h('bridge-turn25-pre-base.html'), 'accepted release untouched');
ok(fs.readFileSync('tb-sw-25b.js').slice(0, fs.statSync('tb-sw.js').size).equals(fs.readFileSync('tb-sw.js')), 'accepted worker bytes carried verbatim');
console.log(fail === 0 ? 'N7 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
