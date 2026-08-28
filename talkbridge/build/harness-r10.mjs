#!/usr/bin/env node
/* R10 client gate — plan v19.5.0 §4.3: ship + P2..P6, nothing else.
   Usage: node harness-r10.mjs <ship> <post-ship> <tb-sw.js> <worker-talk.js> */
import { readFileSync } from 'fs';
import vm from 'vm';
import { JSDOM, VirtualConsole } from 'jsdom';
const [shipP, builtP, swP, relayP] = process.argv.slice(2);
const ship = readFileSync(shipP, 'utf8'), built = readFileSync(builtP, 'utf8');
const sw = readFileSync(swP, 'utf8'), relay = readFileSync(relayP, 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const A = (c, m) => { if (!c) throw new Error(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('S · static contract (P5: assembled from ship, ship verbatim)');
T('S1 ship segments verbatim: build = header + ship-with-parts-before-last-</script>', () => {
  const idx = ship.lastIndexOf('</script>');
  const head = built.slice(0, built.indexOf('\n') + 1);
  A(head.startsWith('<!-- R10 build') && head.includes('turn24-post-ship') && head.includes('relay v4'), 'header does not name stage + pair');
  A(built.startsWith(head + ship.slice(0, idx)), 'ship head segment altered');
  A(built.endsWith(ship.slice(idx)), 'ship tail segment altered');
});
T('S2 exactly P2, P3, P4, P6 present; buried machinery absent', () => {
  for (const p of ['P2-install-gate', 'P3-subscription', 'P4-alert-hygiene', 'P6-threads']) A(built.includes('R10 PART · ' + p), p + ' missing');
  for (const p of ['x-safari', 'tb_install_handoff', 'n7AdoptName', 'p.jn', 'pa5Banner', 'r10EnableNotifications', 'N4-listener-heartbeat', 'ACK_GRACE'])
    A(!built.includes(p), p + ' leaked in (buried)');
  A((built.match(/rel="manifest"/g) || []).length === 1, 'manifest count wrong');
  A(built.indexOf('<!DOCTYPE html>') < 300, 'doctype buried');
  A(!/turn ?25/.test(built), 'stale turn25 label');
});
T('S3 pair: every relay-bound type the client adds exists in relay v4; ack is transient; thread-invite is push-worthy', () => {
  A(/TRANSIENT_TYPES = new Set\(\[[^\]]*'ack'/.test(relay), 'relay v4 lacks transient ack');
  A(/PUSH_WORTHY = new Set\(\[[^\]]*'thread-invite'/.test(relay), 'relay v4 lacks thread-invite');
  A(/PUSH_WORTHY = new Set\(\[[^\]]*'call-end'/.test(relay), 'relay v4 lacks call-end wake');
  A(relay.includes("body.type === 'vapid'") && relay.includes("body.type === 'subscribe'") && relay.includes("body.type === 'unsubscribe'"), 'relay POST contract missing');
  A(relay.includes('pendingWakes'), 'relay is not v4 (no ack gate)');
  A(built.includes("{ type: 'ack', transient: true }"), 'client ack shape wrong');
  A(built.includes("type: 'thread-invite'"), 'client never sends thread-invite');
});
T('S2b no querySelectorAll(...).forEach in the parts (older WebKit throws; build gate G2)', () => {
  const partsRegion = built.slice(built.indexOf('R10 PART · P2-install-gate'));
  A(!/querySelectorAll\([^)]*\)\.forEach\(/.test(partsRegion) && !/querySelectorAll\([^)]*\)\.forEach\(/.test(sw), 'NodeList.forEach present');
});
T('S4 worker: shows on every push, per-room tag replaces, journals terminals, tap focuses running app', () => {
  A(sw.includes("addEventListener('push'") && sw.includes('e.waitUntil'), 'push handler not awaited');
  A(sw.includes("tag: tag, renotify: true") && sw.includes("var tag = 'tb-' + (roomId || 'unknown')"), 'per-room tag missing');
  A(sw.includes("journal('arrived'") && sw.includes("journal('shown'") && sw.includes("journal('failed'"), 'journal terminals missing');
  A(sw.includes("app.postMessage({ t: 'tb-open'") && sw.includes('app.focus'), 'tap does not focus the running app');
  A(!sw.includes("caches.open") , 'worker caches (stale-build risk)');
});

/* ── boot helpers ─────────────────────────────────────────────────────── */
function bootDom({ standalone, hash = '', name = 'Harness', rooms = null, perm = 'default', answer = 'denied', subscribeImpl = null, hidden = false }) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const errors = [], sockets = [], fetches = [];
  const dom = new JSDOM(built, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html' + hash,
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class { constructor(u){ this.url = u; this.readyState = 1; sockets.push(this); } send(m){ (this.sent = this.sent || []).push(JSON.parse(m)); } close(){} addEventListener(){} };
      w.RTCPeerConnection = class { addEventListener(){} createDataChannel(){ return { addEventListener(){}, send(){}, close(){} }; } close(){} };
      w.AudioContext = w.webkitAudioContext = class { constructor(){ this.state='running'; this.destination={}; } createMediaStreamSource(){ return { connect(){} }; } createScriptProcessor(){ return { connect(){}, disconnect(){} }; } createOscillator(){ return { connect(){}, start(){}, stop(){}, frequency:{} }; } createGain(){ return { connect(){}, gain:{} }; } resume(){ return Promise.resolve(); } close(){} };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
      w.SpeechSynthesisUtterance = class {};
      w.PushManager = class {};
      const notifs = [];
      const reg = { scope: 'https://acmeproducts.github.io/stuff/', pushManager: {
          getSubscription: () => Promise.resolve(w.__existingSub || null),
          subscribe: o => { w.__subscribeCalls = (w.__subscribeCalls || []); w.__subscribeCalls.push(o); return subscribeImpl ? subscribeImpl(o) : Promise.resolve({ endpoint: 'https://push.example/e1', toJSON(){ return { endpoint: 'https://push.example/e1', keys: { p256dh: 'p', auth: 'a' } }; } }); } },
        showNotification: (t, o) => { notifs.push({ t, o }); return Promise.resolve(); },
        getNotifications: q => Promise.resolve(notifs.filter(n => !q || !q.tag || n.o.tag === q.tag).map(n => ({ tag: n.o.tag, close(){ n.closed = true; } }))) };
      w.__notifs = notifs; w.__reg = reg;
      const swTarget = new w.EventTarget();
      swTarget.register = () => { w.__swRegistered = (w.__swRegistered || 0) + 1; return Promise.resolve(reg); };
      swTarget.ready = Promise.resolve(reg);
      Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true, value: swTarget });
      w.Notification = class { static requestPermission(){ w.__askCalls = (w.__askCalls || 0) + 1; w.__askSync = true; return Promise.resolve(answer); } };
      w.Notification.permission = perm;
      w.fetch = (u, o) => { fetches.push({ u, body: o && o.body ? JSON.parse(o.body) : null }); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(o && o.body && JSON.parse(o.body).type === 'vapid' ? { ok: true, vapid: 'BQQQQQQQQQQQQQQQQQQQQQQ', push: true } : { ok: true, subscribed: true }), text: () => Promise.resolve('') }); };
      w.matchMedia = q => ({ matches: standalone && q.includes('standalone'), addEventListener(){}, addListener(){} });
      w.HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
      w.indexedDB = undefined;
      if (hidden) Object.defineProperty(w.document, 'hidden', { get: () => true });
      if (name) w.localStorage.setItem('tba_user', JSON.stringify({ name }));
      if (rooms) w.localStorage.setItem('tba_rooms', JSON.stringify(rooms));
      w.addEventListener('error', e => errors.push(String(e.message || e.error)));
    }
  });
  return { w: dom.window, d: dom.window.document, errors, sockets, fetches };
}
const room = (id, extra) => Object.assign({ id, role: 'creator', title: '', partnerName: 'Alice', myLang: 'en', theirLang: 'th', myName: 'Bob', autoRead: false, muted: false, goBtn: true, meta: 'top', createdAt: 1, lastAt: 1, joined: true, unread: 0 }, extra || {});
const inviteHash = w => '#j=' + Buffer.from(JSON.stringify({ r: 'rInv', ml: 'en', tl: 'th', n: 'Alice' })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

console.log('G · P2 install gate (browser context)');
{
  const { w, d, errors, sockets, fetches } = bootDom({ standalone: false, hash: inviteHash(), name: '' });
  await sleep(1500);
  T('G1 browser + invite: ONE screen, room name, install steps; no name field, no room, no chat', () => {
    A(errors.length === 0, errors.join(' | '));
    const g = d.getElementById('p2-gate'); A(g, 'gate missing');
    A(g.textContent.includes('Alice'), 'room name missing');
    A(/Add to Home|Install/.test(g.textContent), 'install steps missing');
    A(d.getElementById('app').style.display === 'none', 'app not hidden');
    A(!g.querySelector('input'), 'a name field leaked into the gate');
    A(!d.querySelector('.screen.active'), 'a ship screen is active behind the gate');
  });
  T('G2 nothing usable ran: no relay socket, no relay fetch, no subscribe, no worker', () => {
    A(sockets.length === 0, 'websocket opened: ' + sockets.length);
    A(fetches.length === 0, 'fetch made');
    A(!w.__swRegistered, 'worker registered in a browser tab');
  });
}
{
  const { d } = bootDom({ standalone: false, name: 'Bob', rooms: [room('r1')] });
  await sleep(1200);
  T('G3 browser without invite: still the gate, even for a device with rooms and a name', () => A(d.getElementById('p2-gate') && !d.querySelector('.screen.active'), 'gate not enforced'));
}
T('G4 platform text: iOS gets Share → Add to Home Screen in ANY browser; Android its install flow; no Safari detour', () => {
  const { w } = bootDom({ standalone: false, name: '' });
  A(w.p2GateHtml('X', 'ios').includes('Add to Home Screen') && !w.p2GateHtml('X', 'ios').includes('Safari'), 'ios text wrong');
  A(w.p2GateHtml('X', 'android').includes('Install app'), 'android text wrong');
  const ua = s => Object.defineProperty(w.navigator, 'userAgent', { configurable: true, get: () => s });
  ua('Mozilla/5.0 (iPhone) CriOS/125'); A(w.p2Platform() === 'ios', 'chrome-on-ios not ios');
  ua('Mozilla/5.0 (Linux; Android 14) Chrome/125'); A(w.p2Platform() === 'android', 'android');
});

console.log('B · standalone boot = the real app (P2) + subscription attempt (P3)');
{
  const { w, d, errors, sockets, fetches } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1'), room('r2', { partnerName: 'Carl' })] });
  await sleep(2500);
  T('B1 boots to the start screen, no gate, no recipe, no uncaught errors', () => {
    A(errors.length === 0, errors.join(' | '));
    A(!d.getElementById('p2-gate') && !d.getElementById('p3-recipe'), 'extra surface visible');
    A(d.getElementById('scr-s1').classList.contains('active'), 'not on start screen');
  });
  T('B2 worker registered; vapid fetched; subscribe ATTEMPTED with the key; every room registered', () => {
    A(w.__swRegistered === 1, 'worker not registered once: ' + w.__swRegistered);
    A(fetches.some(f => f.body && f.body.type === 'vapid'), 'vapid never asked');
    A(w.__subscribeCalls && w.__subscribeCalls.length === 1 && w.__subscribeCalls[0].applicationServerKey.length > 0, 'subscribe not attempted');
    const subs = fetches.filter(f => f.body && f.body.type === 'subscribe').map(f => f.u);
    A(subs.some(u => u.includes('session=r1')) && subs.some(u => u.includes('session=r2')), 'not every room registered: ' + subs.join(','));
  });
  T('B3 background listeners heartbeat: every listener socket gets a ping on the 30s tick', () => {
    A(built.includes('setInterval(p3Heartbeat, HEARTBEAT_MS)'), 'heartbeat not scheduled');
    const before = sockets.map(s => (s.sent || []).filter(m => m.type === 'ping').length);
    w.p3Heartbeat();
    const after = sockets.map(s => (s.sent || []).filter(m => m.type === 'ping').length);
    A(Object.keys(w.LISTEN.socks).length === 2 && after.every((n, i) => n === before[i] + 1), 'listener ping missing');
  });
}
{
  const { w, d } = bootDom({ standalone: true, name: '' });
  await sleep(1500);
  T('B5 first standalone run asks the name once (ship S0), attempts nothing before a room exists', () => {
    A(d.getElementById('scr-s0').classList.contains('active'), 'S0 not shown');
    A(!w.__subscribeCalls, 'subscribe ran with no rooms');
  });
}
{
  const { w, d, sockets } = bootDom({ standalone: true, hash: inviteHash(), name: 'Zoe' });
  await sleep(2000);
  T('B6 standalone launch of the invite icon lands on the ship\'s joiner landing (name already known → no name field), Join enters the room', () => {
    A(d.getElementById('scr-s10').classList.contains('active'), 'joiner landing not shown');
    A(d.getElementById('s10-name').style.display === 'none', 'name asked twice');
    A(!d.getElementById('p2-gate'), 'gate shown in standalone');
    d.getElementById('s10-join').click();
    A(d.getElementById('scr-room').classList.contains('active'), 'room not entered');
    A(w.S.rooms.some(r => r.id === 'rInv' && r.role === 'joiner'), 'joiner room missing');
    A(sockets.some(s => s.url.includes('session=rInv')), 'relay not joined');
  });
  await sleep(300);
  T('B6b subscription attempted once the invite\'s room exists', () => A(w.__subscribeCalls && w.__subscribeCalls.length >= 1, 'subscription not attempted after joining'));
}

console.log('P · attempt-as-authority (P3)');
{
  /* the owner's recorded contradiction: property says granted, answer says denied → attempt anyway */
  const { w } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'granted', answer: 'denied' });
  await sleep(1500);
  const n0 = (w.__subscribeCalls || []).length;
  await w.p3AttemptInGesture();
  T('P1 under prop=granted/answer=denied the subscribe attempt still runs; both recorded verbatim', () => {
    A((w.__subscribeCalls || []).length === n0 + 1, 'attempt gated by the answer');
    A(w.debugLog.some(l => l.ev === 'p3_perm_answer' && l.d.answer === 'denied' && l.d.prop === 'granted'), 'contradiction not recorded');
    A(w.debugLog.some(l => l.ev === 'p3_perm_prop' && l.d.prop === 'granted'), 'property not recorded');
  });
}
{
  const nae = () => { const e = new Error('Push notification prompting can only be done from a user gesture.'); e.name = 'NotAllowedError'; return Promise.reject(e); };
  const { w, d } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'default', answer: 'granted', subscribeImpl: nae });
  await sleep(1500);
  T('P2 fresh-default: the open-time attempt is refused (no gesture) → NO recipe, next tap re-runs the attempt inside the gesture', () => {
    A((w.__subscribeCalls || []).length === 1, 'no open-time attempt');
    A(!d.getElementById('p3-recipe'), 'recipe shown for a gesture refusal');
    A(w.debugLog.some(l => l.ev === 'p3_gesture_armed'), 'gesture not armed');
  });
  d.body.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  const askedSync = w.__askCalls === 1;   /* read before any await: the ask must happen inside the tap itself */
  await sleep(300);
  T('P3 the gesture attempt asks permission synchronously in the tap, then subscribes; a NotAllowedError INSIDE the gesture shows the F1 device recipe', () => {
    A(askedSync, 'requestPermission not called synchronously inside the tap: ' + w.__askCalls);
    A((w.__subscribeCalls || []).length === 2, 'no gesture attempt');
    const r = d.getElementById('p3-recipe'); A(r, 'recipe missing');
    A(r.textContent.includes('Settings') && r.textContent.includes('Temporary') && r.textContent.includes('Sounds'), 'recipe text incomplete');
    A(w.debugLog.filter(l => l.ev === 'p3_sub_failed' && l.d.name === 'NotAllowedError').length === 2, 'failures not logged by name');
  });
}
{
  const { w, fetches } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1'), room('r2', { muted: true })] });
  await sleep(1500);
  T('B4 registration mirrors mute: muted room unsubscribed, live room subscribed', () => {
    A(fetches.some(f => f.u.includes('session=r1') && f.body.type === 'subscribe'), 'r1 not subscribed');
    A(fetches.some(f => f.u.includes('session=r2') && f.body.type === 'unsubscribe'), 'muted r2 not unsubscribed');
    A(!fetches.some(f => f.u.includes('session=r2') && f.body.type === 'subscribe'), 'muted r2 subscribed');
  });
  w.S.rooms[1].muted = false; w.renderPanel(); await sleep(200);
  T('B4b unmuting re-subscribes', () => A(fetches.some(f => f.u.includes('session=r2') && f.body.type === 'subscribe'), 'r2 not re-subscribed'));
}

console.log('H · exactly-one-alert hygiene (P4)');
{
  const { w, d, sockets } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1'), room('r2', { partnerName: 'Carl' })], perm: 'granted' });
  await sleep(1500);
  const sockFor = id => sockets.filter(s => s.url.includes('session=' + id)).slice(-1)[0];
  const acks = id => sockets.filter(s => s.url.includes('session=' + id)).reduce((n, s) => n + (s.sent || []).filter(m => m.type === 'ack' && m.transient === true).length, 0);
  w.LISTEN.handle('r2', { type: 'call-start', from: 'partner-dev', kind: 'voice', name: 'Carl' });
  await sleep(50);
  T('H1 ring presented in the foreground → ack on that room\'s socket at once; no notification beside the ring screen', () => {
    A(d.getElementById('ring-overlay').classList.contains('show'), 'ring screen not shown');
    A(acks('r2') === 1, 'ack not sent: ' + acks('r2'));
    A(!w.__notifs.some(n => n.o.tag === 'tb-r2'), 'a notification stacked beside the ring');
  });
  T('H1b a stale lock-screen notification for the room closes the moment the ring screen presents (not only on accept)', () => {
    A(w.__notifs.length === 0 || w.__notifs.every(n => n.closed), 'pre-state dirty');
    w.__notifs.push({ t: 'stale', o: { tag: 'tb-r2' } });
    w.CALL.stopRing(); w.CALL.ringPending = null;
    w.LISTEN.handle('r2', { type: 'call-start', from: 'partner-dev', kind: 'voice', name: 'Carl' });
    return null;
  });
  await sleep(120);
  T('H1c (async check) ring presented → stale tb-r2 closed', () => A(w.__notifs.filter(x => x.o.tag === 'tb-r2').every(x => x.closed), 'stale notification survived the ring'));
  w.CALL.stopRing(); w.CALL.ringPending = null;
  const ackB = acks('r2'), noteB = w.__notifs.filter(x => x.o.tag === 'tb-r2' && !x.closed).length;
  w.LISTEN.handle('r2', { type: 'chat-msg', from: 'partner-dev', chatId: 'c1', srcText: 'hi', tgtText: 'สวัสดี', senderName: 'Carl' });
  await sleep(100);
  T('H2 foreground other-room message: presented through the worker with the room tag, and acked (relay push suppressed) = exactly one', () => {
    A(acks('r2') === ackB + 1, 'ack missing for chat');
    const n = w.__notifs.filter(x => x.o.tag === 'tb-r2' && !x.closed); A(n.length === noteB + 1 && n[n.length - 1].o.renotify === true, 'worker notification missing/untagged');
  });
  w.LISTEN.handle('r2', { type: 'chat-msg', from: 'partner-dev', chatId: 'c2', srcText: 'again', tgtText: 'อีก', senderName: 'Carl' });
  await sleep(100);
  T('H3 tag replacement: a second message re-uses tag tb-r2 (replace, never stack)', () => {
    const n = w.__notifs.filter(x => x.o.tag === 'tb-r2' && !x.closed);
    A(n.length === noteB + 2 && n.every(x => x.o.tag === 'tb-r2'), 'tag changed');
  });
  w.enterRoom('r2'); await sleep(100);
  T('H4 room opened → its notifications closed as stale', () => A(w.__notifs.filter(x => x.o.tag === 'tb-r2').every(x => x.closed), 'stale notifications not closed'));
  T('H5 active-room message in the foreground → acked on the active socket', () => {
    const before = acks('r2');
    w.handleRelay({ type: 'chat-msg', from: 'partner-dev', chatId: 'c3', srcText: 'x', tgtText: 'y', senderName: 'Carl' });
    A(acks('r2') === before + 1, 'active room not acked');
  });
  T('H6 call answered → matching notification closed', () => {
    /* the call is in the ACTIVE room: no room entry happens, so only the answer itself can close it */
    w.__notifs.push({ t: 'Carl', o: { tag: 'tb-r2' } });
    w.CALL.ringPending = { roomId: 'r2', kind: 'voice', name: 'Carl' };
    w.CALL.accept();
  });
  await sleep(150);
  T('H6b (async check) call answered in the active room → tb-r2 closed', () => A(w.__notifs.filter(x => x.o.tag === 'tb-r2').every(x => x.closed), 'not closed'));
}
{
  const { w, sockets } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'granted', hidden: true });
  await sleep(1500);
  w.LISTEN.handle('r1', { type: 'chat-msg', from: 'partner-dev', chatId: 'c9', srcText: 'hi', tgtText: 'x', senderName: 'Alice' });
  await sleep(50);
  T('H7 a hidden (backgrounded) app acks NOTHING — the push is its only alert', () => A(!(sockets.find(s => s.url.includes('session=r1')).sent || []).some(m => m.type === 'ack'), 'hidden app acked'));
}
T('H8 the journal drain logs every receipt by name and logs the empty drain too (silence impossible)', () => {
  A(built.includes("p4Log('sw_receipt'") && built.includes("p4Log('sw_drained', { n: rows.length }"), 'drain unlogged');
  A(built.includes("document.addEventListener('visibilitychange', function () { if (!document.hidden) p4Drain(); })"), 'no drain on return to foreground');
});

console.log('W · the worker itself (P4), run headless');
{
  const journal = []; let shown = [], ctxRec = null; const fetched = [];
  const store = { journal, kv: new Map() };
  const mkReq = (result) => { const r = {}; setTimeout(() => { r.result = result; r.onsuccess && r.onsuccess(); }, 0); return r; };
  const fakeIdb = { open() { const r = {}; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, transaction(name) { const tx = {}; setTimeout(() => tx.oncomplete && tx.oncomplete(), 2); return { objectStore() { return { add: v => { store.journal.push(v); }, get: k => mkReq(store.kv.get(k) || null), put: v => store.kv.set(v.k, v) }; }, get oncomplete() { return tx.oncomplete; }, set oncomplete(f) { tx.oncomplete = f; }, set onerror(f) {} }; } }; r.onsuccess && r.onsuccess(); }, 0); return r; } };
  const self = { listeners: {}, addEventListener(n, f) { this.listeners[n] = f; }, skipWaiting(){}, clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([{ url: 'https://x/stuff/bridge-turn24-post-ship.html', focus: () => { self.focused = true; return Promise.resolve(); }, postMessage: m => { self.posted = m; } }]), openWindow: u => { self.opened = u; return Promise.resolve(); } },
    registration: { scope: 'https://x/stuff/', showNotification: (t, o) => { shown.push({ t, o }); return Promise.resolve(); } } };
  const ctx = new vm.createContext({ self, indexedDB: fakeIdb, setTimeout, fetch: u => { fetched.push(u); return Promise.resolve({ json: () => Promise.resolve(u.includes('session=rB') ? [{ type: 'chat-msg', from: 'other', ts: Date.now() - 1000, seq: 3 }] : [{ type: 'call-end', reason: 'missed', from: 'other', ts: Date.now() - 5000, seq: 2 }]) }); }, encodeURIComponent, Promise, Array, Date, String, JSON, Object, console });
  vm.runInContext(sw, ctx);
  store.kv.set('ctx', { k: 'ctx', v: { appUrl: 'https://x/stuff/bridge-turn24-post-ship.html', relay: 'https://relay/signal', app: 'talk-say-v1', client: 'me', rooms: [{ id: 'rA', title: 'Alice' }, { id: 'rB', title: 'Trip' }] } });
  const push = { data: { json: () => ({ t: 'tb-wake', at: Date.now() }) }, waitUntil: p => { self.pending = p; } };
  self.listeners.push(push); await self.pending; await sleep(20);
  T('W1 push → notification shown, tagged by the resolved room (newest across rooms), journaled arrived + shown', () => {
    A(shown.length === 1 && shown[0].o.tag === 'tb-rB' && shown[0].o.body.includes('New message') && shown[0].o.body.includes('Trip'), 'wrong notification: ' + JSON.stringify(shown));
    A(journal.some(j => j.ev === 'arrived') && journal.some(j => j.ev === 'shown' && j.room === 'rB'), 'journal incomplete: ' + JSON.stringify(journal));
    A(fetched.every(u => u.includes('client=me')), 'history fetched without the device id');
  });
  shown = []; store.kv.delete('ctx');
  self.listeners.push(push); await self.pending; await sleep(20);
  T('W2 no context → still a notification (Apple revokes silent handlers), tag tb-unknown', () => A(shown.length === 1 && shown[0].o.tag === 'tb-unknown', 'silent handler'));
  self.registration.showNotification = () => Promise.reject(new Error('boom'));
  self.listeners.push(push); await self.pending; await sleep(20);
  T('W3 a failed show is journaled as failed and a fallback is still attempted', () => A(journal.some(j => j.ev === 'failed' && j.e === 'boom'), 'failure not journaled'));
  self.listeners.notificationclick({ notification: { close(){ self.closed = true; }, data: { roomId: 'rB', url: 'https://x/stuff/bridge-turn24-post-ship.html' } }, waitUntil: p => { self.pending = p; } });
  await self.pending;
  T('W4 tap closes itself and focuses the running app with the room (no second copy)', () => A(self.closed && self.focused && self.posted && self.posted.roomId === 'rB' && !self.opened, 'tap opened a second copy / no focus'));
}

console.log('T · threads with consent (P6)');
{
  const { w, d, sockets } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'granted' });
  await sleep(1500);
  w.openPanel();
  const sockFor = id => sockets.find(s => s.url.includes('session=' + id));
  T('T1 every room card carries + (add a thread), reachable by tap', () => {
    const plus = d.querySelector('#panel-body .rc2 [data-thread="r1"]'); A(plus, '+ missing on card');
    plus.click();
    A(d.getElementById('m-p6').classList.contains('show'), 'name prompt not opened');
    A(!d.getElementById('scr-room').classList.contains('active'), 'tapping + opened the room instead');
  });
  d.getElementById('p6-name').value = 'Trip planning'; d.getElementById('p6-ok').click();
  await sleep(50);
  T('T2 Bob names it → derived room appears on his panel; INVITE rides the parent room to the relay (push-worthy type)', () => {
    const t = w.S.rooms.find(r => r.parentId === 'r1'); A(t && t.title === 'Trip planning' && t.role === 'creator' && t.myLang === 'en' && t.theirLang === 'th', 'thread room wrong');
    const inv = (sockFor('r1').sent || []).find(m => m.type === 'thread-invite'); A(inv && inv.threadId === t.id && inv.name === 'Trip planning' && inv.fromName === 'Bob', 'invite not sent: ' + JSON.stringify(inv));
    A(d.querySelector('#panel-body .rc2[data-room="' + t.id + '"]'), 'thread card not on panel');
    A(w.S.rooms.find(r => r.id === 'r1').threadsOffered[0].status === 'pending', 'offer not pending');
  });
  const tid = w.S.rooms.find(r => r.parentId === 'r1').id;
  T('T3 a pending invite is re-sent when the partner (re)appears on the parent', () => {
    const before = (sockFor('r1').sent || []).filter(m => m.type === 'thread-invite').length;
    w.LISTEN.handle('r1', { type: 'hello', from: 'partner-dev', name: 'Alice' });
    A((sockFor('r1').sent || []).filter(m => m.type === 'thread-invite').length === before + 1, 'not re-sent');
  });
  T('T4 Alice\'s answer closes the offer on Bob\'s side and lands timestamped in the PARENT transcript', () => {
    w.LISTEN.handle('r1', { type: 'sys-pill', from: 'partner-dev', text: 'Alice accepted ‘Trip planning’', pillId: 'p6-x', threadId: tid, answer: 'accepted' });
    A(w.S.rooms.find(r => r.id === 'r1').threadsOffered[0].status === 'accepted', 'offer not closed');
    const pill = w.loadTr('r1').find(e => e.id === 'p6-x'); A(pill && pill.kind === 'sys' && typeof pill.ts === 'number' && pill.text.includes('accepted'), 'stamp missing');
    const before = (sockFor('r1').sent || []).filter(m => m.type === 'thread-invite').length;
    w.LISTEN.handle('r1', { type: 'hello', from: 'partner-dev', name: 'Alice' });
    A((sockFor('r1').sent || []).filter(m => m.type === 'thread-invite').length === before, 'closed offer re-sent');
  });
}
{
  const { w, d, sockets } = bootDom({ standalone: true, name: 'Alice', rooms: [room('r1', { role: 'joiner', partnerName: 'Bob', myName: 'Alice', myLang: 'th', theirLang: 'en' })], perm: 'granted' });
  await sleep(1500);
  const sockFor = id => sockets.find(s => s.url.includes('session=' + id));
  w.LISTEN.handle('r1', { type: 'thread-invite', from: 'partner-dev', threadId: 'tX', name: 'Trip planning', fromName: 'Bob' });
  w.LISTEN.handle('r1', { type: 'thread-invite', from: 'partner-dev', threadId: 'tX', name: 'Trip planning', fromName: 'Bob' });
  w.openPanel(); await sleep(50);
  T('T5 Alice receives ONE invite card on her panel: thread name, from Bob, Accept / Decline; duplicates collapse; no room yet', () => {
    const cards = d.querySelectorAll('#panel-body .p6-inv'); A(cards.length === 1, 'cards=' + cards.length);
    A(cards[0].textContent.includes('Trip planning') && cards[0].textContent.includes('Bob'), 'card text');
    A(cards[0].querySelector('[data-p6-accept]') && cards[0].querySelector('[data-p6-decline]'), 'buttons');
    A(!w.S.rooms.some(r => r.id === 'tX'), 'room created before consent');
    A((sockFor('r1').sent || []).some(m => m.type === 'ack'), 'invite presented in the foreground but not acked');
  });
  d.querySelector('#panel-body .p6-inv [data-p6-accept]').click(); await sleep(50);
  T('T6 Accept → thread card appears (joiner role kept), registered with the relay, ‘Alice accepted’ timestamped into the parent on both sides', () => {
    const t = w.S.rooms.find(r => r.id === 'tX'); A(t && t.role === 'joiner' && t.parentId === 'r1' && t.myLang === 'th', 'thread room wrong');
    A(d.querySelector('#panel-body .rc2[data-room="tX"]') && !d.querySelector('#panel-body .p6-inv'), 'card/invite state wrong');
    const pill = w.loadTr('r1').find(e => e.kind === 'sys' && e.text.includes('Alice accepted')); A(pill && typeof pill.ts === 'number', 'local stamp missing');
    const sent = (sockFor('r1').sent || []).find(m => m.type === 'sys-pill' && m.threadId === 'tX'); A(sent && sent.answer === 'accepted' && sent.pillId === pill.id, 'stamp not sent to Bob');
    A(w.p3State.registered['tX'] !== undefined || w.debugLog.some(l => l.ev === 'p3_room_registered' && l.d.room === 'tX'.slice(-6)), 'thread not registered');
  });
  w.LISTEN.handle('r1', { type: 'thread-invite', from: 'partner-dev', threadId: 'tY', name: 'Budget', fromName: 'Bob' });
  w.openPanel(); await sleep(30);
  d.querySelector('#panel-body .p6-inv [data-p6-decline]').click(); await sleep(50);
  T('T7 Decline → nothing appears for Alice; ‘Alice declined’ stamped and sent; a re-sent invite for it is ignored', () => {
    A(!w.S.rooms.some(r => r.id === 'tY') && !d.querySelector('#panel-body .p6-inv'), 'declined thread appeared');
    const pill = w.loadTr('r1').find(e => e.kind === 'sys' && e.text.includes('Alice declined')); A(pill, 'decline stamp missing');
    A((sockFor('r1').sent || []).some(m => m.type === 'sys-pill' && m.threadId === 'tY' && m.answer === 'declined'), 'decline not sent');
    w.LISTEN.handle('r1', { type: 'thread-invite', from: 'partner-dev', threadId: 'tY', name: 'Budget', fromName: 'Bob' });
    A(!(w.S.rooms.find(r => r.id === 'r1').threadInvites || []).length, 'declined invite re-surfaced');
  });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
