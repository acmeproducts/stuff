#!/usr/bin/env node
/* R10.5 corrected behavior + integrated recorder gate — plan v20.5.1 §4.9. */
import { readFileSync } from 'fs';
import vm from 'vm';
import { JSDOM, VirtualConsole } from 'jsdom';
const [shipP, builtP, swP, relayP] = process.argv.slice(2);
const ship = readFileSync(shipP, 'utf8'), built = readFileSync(builtP, 'utf8');
const sw = readFileSync(swP, 'utf8'), relay = readFileSync(relayP, 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); if(process.env.FAIL_FAST) throw e; } };
const A = (c, m) => { if (!c) throw new Error(m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

console.log('S · static contract (P5: assembled from ship, ship verbatim)');
T('S1 ship segments verbatim: build = header + ship-with-parts-before-last-</script>', () => {
  const idx = ship.lastIndexOf('</script>');
  const head = built.slice(0, built.indexOf('\n') + 1);
  A(head.startsWith('<!-- R10.5 build') && head.includes('turn24-post-ship') && head.includes('relay v5.1'), 'header does not name stage + pair');
  A(built.startsWith(head + ship.slice(0, idx)), 'ship head segment altered');
  A(built.endsWith(ship.slice(idx)), 'ship tail segment altered');
});
T('S2 exactly P2, P3, corrected P4, P6 and integrated P7 present; buried machinery absent', () => {
  for (const p of ['P2-install-gate', 'P3-subscription', 'P4-presentation-owner', 'P6-threads', 'P7-flight-recorder']) A(built.includes('R10 PART · ' + p), p + ' missing');
  for (const p of ['x-safari', 'tb_install_handoff', 'n7AdoptName', 'p.jn', 'pa5Banner', 'r10EnableNotifications', 'N4-listener-heartbeat', 'ACK_GRACE'])
    A(!built.includes(p), p + ' leaked in (buried)');
  A((built.match(/rel="manifest"/g) || []).length === 1, 'manifest count wrong');
  A(built.indexOf('<!DOCTYPE html>') < 300, 'doctype buried');
  A(!/turn ?25/.test(built), 'stale turn25 label');
});
T('S3 pair (v20.5.1): irreversible owner/grant contract present; failed ack race absent', () => {
  for (const t of ["'foreground-ready'", "'presentation-grant'", "'presentation-commit'", 'pendingDecisions', 'presentation', "type === 'mute'", "type === 'cursor'", "get('ledger') === '1'", 'PRESENT_WAIT_MS']) A(relay.includes(t), 'relay v5.1 missing: ' + t);
  const rcode = relay.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const t of ['pendingWakes', 'lastSeen', '105000', "'tb-wake'"]) A(!rcode.includes(t), 'buried machinery in relay: ' + t);
  A(!built.includes('p4Ack('), 'A4 ack machinery in client');
  A(!built.includes('setInterval(p3Heartbeat'), 'A5 heartbeat in client');
  A(!built.includes('p3SyncMutes'), 'mute-as-unsubscribe still in client');
  A(built.includes("type: 'foreground-ready'"), 'client never asks for an exact grant');
  A(built.includes("osNotify = function () { p4Log('page_notification_blocked'"), 'page OS notification helper is not disabled');
  A(built.includes('location.origin + location.pathname'), 'subscription lacks canonical navigate base');
  A(built.includes("type: 'thread-invite'"), 'client never sends thread-invite');
});
T('S2b no querySelectorAll(...).forEach in the parts (older WebKit throws; build gate G2)', () => {
  const partsRegion = built.slice(built.indexOf('R10 PART · P2-install-gate'));
  A(!/querySelectorAll\([^)]*\)\.forEach\(/.test(partsRegion) && !/querySelectorAll\([^)]*\)\.forEach\(/.test(sw), 'NodeList.forEach present');
});
T('S4 worker: parses the one envelope, dedupes by eventId, journals telemetry, tap focuses the running app; no history guessing', () => {
  A(sw.includes("addEventListener('push'") && sw.includes('e.waitUntil'), 'push handler not awaited');
  A(sw.includes('env.tb') && sw.includes('env.notification'), 'envelope not parsed');
  A(sw.includes('seenBefore('), 'eventId dedupe missing');
  A(sw.includes("journal('arrived'") && sw.includes("journal('shown'") && sw.includes("journal('failed'") && sw.includes("journal('deduped'") && sw.includes("journal('tap'"), 'journal telemetry incomplete');
  A(sw.includes("app.postMessage({ t: 'tb-open'") && sw.includes('client.focus'), 'tap does not focus the running app');
  A(!sw.includes('since=') && !sw.includes('resolveRoom') && !sw.includes('visibleClient'), 'wake inference machinery still present');
  A(!sw.includes('caches.open'), 'worker caches (stale-build risk)');
});

/* ── boot helpers ─────────────────────────────────────────────────────── */
function bootDom({ standalone, hash = '', name = 'Harness', rooms = null, perm = 'default', answer = 'denied', subscribeImpl = null, hidden = false, ledger = null, events = null }) {
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
      w.fetch = (u, o) => {
        const body = o && o.body ? JSON.parse(o.body) : null;
        fetches.push({ u, body });
        if (w.__failNext && body && body.type === w.__failNext.type) { w.__failNext = null; return Promise.reject(new Error('net down')); }
        let payload = { ok: true, subscribed: true };
        if (body && body.type === 'vapid') payload = { ok: true, vapid: 'BQQQQQQQQQQQQQQQQQQQQQQ', push: true };
        else if (body && body.type === 'mute') payload = { ok: true, muted: body.muted === true };
        else if (body && body.type === 'cursor') payload = { ok: true, cursor: body.l };
        else if (!body && String(u).includes('event=')) {
          const m = String(u).match(/[?&]event=([^&]+)/), eventId = m ? decodeURIComponent(m[1]) : '';
          payload = { ok:true, event:(events && events[eventId]) || null };
        }
        else if (!body && String(u).includes('ledger=1')) {
          const m = String(u).match(/session=([^&]+)/);
          const roomId = m ? decodeURIComponent(m[1]) : '';
          payload = (ledger && ledger[roomId]) || { ok: true, cursor: 0, lseq: 0, complete: true, events: [] };
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payload), text: () => Promise.resolve('') });
      };
      w.matchMedia = q => ({ matches: standalone && q.includes('standalone'), addEventListener(){}, addListener(){} });
      w.HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
      w.indexedDB = undefined;
      Object.defineProperty(w.document, 'hasFocus', { configurable: true, value: () => !hidden });
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

console.log('H · irreversible presentation owner / counters / mute (P4 v4)');
{
  const { w, d, sockets, fetches } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1'), room('r2', { partnerName: 'Carl' })], perm: 'granted',
    ledger: { r2: { ok: true, cursor: 0, lseq: 2, complete: true, events: [{ l: 2, eventId: 'seed1', type: 'chat-msg', kind: null, callId: null, state: null, ts: 1 }] } } });
  await sleep(1500);
  const sockFor = id => sockets.filter(s => s.url.includes('session=' + id)).slice(-1)[0];
  const ready = id => sockets.filter(s => s.url.includes('session=' + id)).reduce((n, s) => n.concat((s.sent || []).filter(m => m.type === 'foreground-ready' && m.transient === true)), []);
  w.__notifs.push({ t: 'stale', o: { tag: 'tb-r2' } });
  const callOffer={ type: 'call-start', presentation:'offer', from: 'partner-dev', kind: 'voice', name: 'Carl', callId: 'K9', eventId: 'K9:start' };
  w.LISTEN.handle('r2', callOffer);
  await sleep(80);
  T('H1 offer alone never rings; visible/focused page asks for the exact grant', () => {
    A(!d.getElementById('ring-overlay').classList.contains('show'), 'ring shown before grant');
    const p = ready('r2'); A(p.length === 1 && p[0].eventId === 'K9:start', 'ready wrong: ' + JSON.stringify(p));
  });
  w.LISTEN.handle('r2',{type:'presentation-grant',eventId:'K9:start',owner:'in_app',reason:'foreground-ready',transient:true});
  await sleep(50);
  T('H1b exact grant mounts one call screen and adopts stable callId', () => {
    A(d.getElementById('ring-overlay').classList.contains('show'), 'ring screen not shown');
    A(w.__notifs.filter(n => n.o.tag === 'tb-r2').every(n => n.closed), 'stale banner survived the ring');
    A(w.CALL.ringPending.callId === 'K9', 'callId not adopted by the ring');
  });
  T('H2 visible other-room chat waits for grant and raises no OS-style surface', () => {
    const before = w.__notifs.filter(n => !n.closed).length;
    w.CALL.stopRing(); w.CALL.ringPending = null;
    w.LISTEN.handle('r2', { type: 'chat-msg', presentation:'offer', from: 'partner-dev', chatId: 'c1', eventId: 'c1', srcText: 'hi', tgtText: 'x', senderName: 'Carl' });
    A(ready('r2').some(m => m.eventId === 'c1'), 'chat readiness missing');
    w.LISTEN.handle('r2',{type:'presentation-grant',eventId:'c1',owner:'in_app',reason:'foreground-ready',transient:true});
    A(w.__notifs.filter(n => !n.closed).length === before, 'app raised a notification while visible');
  });
  T('H3 granted chat is counted once; unresolved call remains ledger-owned until terminal', () => {
    A(w.p4Counted('r2').indexOf('c1') >= 0 && w.p4Counted('r2').indexOf('K9:start') < 0, 'count ownership wrong');
  });
  T('H4 active-room chat also waits for an exact grant', () => {
    w.__notifs.push({ t: 'stale2', o: { tag: 'tb-r2' } });   /* landed while away; must die on open */
    w.enterRoom('r2');
    w.handleRelay({ type: 'chat-msg', presentation:'offer', from: 'partner-dev', chatId: 'c3', eventId: 'c3', srcText: 'x', tgtText: 'y', senderName: 'Carl' });
    A(ready('r2').some(m => m.eventId === 'c3'), 'active-room readiness missing');
    w.handleRelay({type:'presentation-grant',eventId:'c3',owner:'in_app',reason:'foreground-ready',transient:true});
    A(w.p4Counted('r2').includes('c3'), 'granted active chat not counted');
  });
  await sleep(150);
  T('H5 opening the room: stale notifications closed, ledger consulted, cursor advanced (items seen, review §7.3)', () => {
    A(w.__notifs.filter(x => x.o.tag === 'tb-r2').every(x => x.closed), 'stale notifications not closed on open');
    A(fetches.some(f => f.u.includes('session=r2') && f.u.includes('ledger=1')), 'enterRoom did not consult the ledger');
    A(fetches.some(f => f.body && f.body.type === 'cursor' && f.u.includes('session=r2')), 'cursor not advanced on open');
  });
  T('H6 call answered → matching notification closed (cosmetic hygiene)', () => {
    w.__notifs.push({ t: 'Carl', o: { tag: 'tb-r2' } });
    w.CALL.ringPending = { roomId: 'r2', kind: 'voice', name: 'Carl', callId: 'K9' };
    w.CALL.accept();
  });
  await sleep(150);
  T('H6b (async) answered in the active room → tb-r2 closed', () => A(w.__notifs.filter(x => x.o.tag === 'tb-r2').every(x => x.closed), 'not closed'));
  T('H9 every call word carries stable identity by construction (relaySend enrichment)', () => {
    w.S.roomId = 'r2'; w.S.view = 'room';
    w.relaySend({ type: 'call-start', kind: 'video', name: 'Bob' });
    const sent = sockets.reduce((a, s) => a.concat((s.sent || []).filter(m => m.type === 'call-start')), []).slice(-1)[0];
    A(sent && sent.callId && sent.eventId === sent.callId + ':start' && sent.kind === 'video', 'call identity missing: ' + JSON.stringify(sent));
    w.relaySend({ type: 'call-accept' });
    const acc = sockets.reduce((a, s) => a.concat((s.sent || []).filter(m => m.type === 'call-accept')), []).slice(-1)[0];
    A(acc && acc.callId === sent.callId, 'accept lost the callId');
  });
}
{
  const { w, sockets } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'granted', hidden: true });
  await sleep(1500);
  const n0 = w.__notifs.length;
  w.LISTEN.handle('r1', { type: 'call-start', presentation:'offer', from: 'partner-dev', kind:'voice', name:'Alice', callId:'KH', eventId:'KH:start' });
  await sleep(50);
  w.LISTEN.handle('r1',{type:'presentation-commit',eventId:'KH:start',owner:'os',reason:'foreground-timeout',transient:true});
  T('H7 hidden app sends no readiness and an OS commit can never auto-ring', () => {
    A(!sockets.some(s => (s.sent || []).some(m => m.type === 'foreground-ready')), 'hidden app sent readiness');
    A(w.__notifs.length === n0, 'hidden app raised a surface');
    A(!w.CALL.ringPending, 'hidden/late app auto-rang after OS won');
  });
}
T('H8 worker receipts drain as telemetry — and never touch a counter', () => {
  A(built.includes("p4Log('sw_receipt'") && built.includes("p4Log('sw_drained', { n: rows.length }"), 'drain unlogged');
  const drain = built.slice(built.indexOf('function p4Drain'), built.indexOf('function p4SaveCtx'));
  A(!drain.includes('bumpWaiting') && !drain.includes('waitingOf'), 'journal feeds a counter (forbidden, review §7.3)');
});

console.log('N · notification tap routing is a boot input');
{
  const route='?tbEvent=KT%3Astart&tbRoom=r1&tbType=call-start&tbKind=voice&tbCall=KT';
  const {w,d}=bootDom({standalone:true,hash:route,name:'Bob',rooms:[room('r1')],perm:'granted',events:{'KT:start':{eventId:'KT:start',type:'call-start',kind:'voice',callId:'KT',state:'started',ts:1}}});
  await sleep(1800);
  T('N1 cold notification tap for an active call mounts its room and Accept/Decline screen',()=>{
    A(w.S.roomId==='r1'&&d.getElementById('ring-overlay').classList.contains('show'),'active call route missed');
    A(w.CALL.ringPending&&w.CALL.ringPending.callId==='KT','active call identity lost');
  });
}
{
  const route='?tbEvent=KM%3Astart&tbRoom=r1&tbType=call-start&tbKind=video&tbCall=KM';
  const {w,d}=bootDom({standalone:true,hash:route,name:'Bob',rooms:[room('r1')],perm:'granted',events:{'KM:start':{eventId:'KM:start',type:'call-start',kind:'video',callId:'KM',state:'timed_out',ts:1}}});
  await sleep(1800);
  T('N2 cold notification tap for an ended call opens the room with one durable outcome, never home',()=>{
    const tr=w.loadTr('r1').filter(x=>x.id==='outcome-KM');
    A(w.S.roomId==='r1'&&d.getElementById('scr-room').classList.contains('active'),'ended call landed outside room');
    A(tr.length===1&&/Missed video call/.test(tr[0].text),'durable missed outcome wrong');
    A(!w.CALL.ringPending,'ended call rang');
  });
}

console.log('C · exact counters from the durable ledger (P4 v3, review §7.3)');
{
  const ledgerResponses = { r1: { ok: true, cursor: 0, lseq: 4, complete: true, events: [
    { l: 1, eventId: 'x1', type: 'chat-msg', kind: null, callId: null, state: null, ts: 1 },
    { l: 2, eventId: 'x2', type: 'chat-msg', kind: null, callId: null, state: null, ts: 2 },
    { l: 3, eventId: 'KV:call-end', type: 'call-end', kind: 'video', callId: 'KV', state: 'timed_out', ts: 3 },
    { l: 4, eventId: 'KA:call-end', type: 'call-end', kind: 'voice', callId: 'KA', state: 'ended', ts: 4 } ] } };
  const { w, fetches } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'granted', ledger: ledgerResponses });
  await sleep(1800);
  T('C1 on open: exact counts — +2 chat, +1 video missed; answered call adds nothing; cursor advanced to max l', () => {
    const r = w.S.rooms.find(x => x.id === 'r1'); const wt = w.waitingOf(r);
    A(wt.chat === 2 && wt.video === 1 && (wt.voice || 0) === 0, 'counts wrong: ' + JSON.stringify(wt));
    A(fetches.some(f => f.body && f.body.type === 'cursor' && f.body.l === 4), 'cursor not advanced to 4');
  });
  await w.p4LedgerSync();
  await sleep(200);
  T('C2 replay of the same ledger events cannot double-increment (counted set)', () => {
    const r = w.S.rooms.find(x => x.id === 'r1'); const wt = w.waitingOf(r);
    A(wt.chat === 2 && wt.video === 1, 'double counted: ' + JSON.stringify(wt));
  });
}
console.log('M · mute confirmed by the relay before the UI claims it (P3 v3, review §4.3)');
{
  const { w, d, fetches } = bootDom({ standalone: true, name: 'Bob', rooms: [room('r1')], perm: 'granted' });
  await sleep(1500);
  w.enterRoom('r1'); w.openRoomSettings && w.openRoomSettings();
  const btn = d.getElementById('s4b-mute');
  btn.click(); await sleep(150);
  T('M1 toggle → relay mute POST → only the ack flips the state and the control', () => {
    A(fetches.some(f => f.body && f.body.type === 'mute' && f.body.muted === true && f.u.includes('session=r1')), 'no mute POST');
    A(w.S.rooms[0].muted === true && btn.classList.contains('off'), 'state not applied after ack');
  });
  w.__failNext = { type: 'mute' };
  btn.click(); await sleep(150);
  T('M2 relay unreachable → state unchanged, control unchanged, concise retry error', () => {
    A(w.S.rooms[0].muted === true && btn.classList.contains('off'), 'state flipped without ack');
    A(w.debugLog.some(l => l.ev === 'p3_mute_acked' && l.d.ok === false) || w.debugLog.some(l => l.ev === 'p3_mute_acked' && l.level === 'error'), 'failure not logged');
  });
  T('M3 subscribe carries the navigate target for declarative tap-through', () => {
    A(fetches.some(f => f.body && f.body.type === 'subscribe' && String(f.body.navigate || '').includes('bridge-turn24-post-ship.html')), 'navigate missing from subscription');
  });
  T('M4 muted room keeps an exact, quiet home record', () => {
    const room=w.S.rooms[0];w.bumpWaiting(room,'chat');w.bumpWaiting(room,'voice');w.saveRooms();w.renderHome();
    A(w.homeCards().some(r=>r.id==='r1'),'muted room omitted from home');
    const wt=w.waitingOf(room);A(wt.chat===1&&wt.voice===1,'muted counts wrong');
  });
}

console.log('W · the legacy worker parses the one envelope (P4-sw v3, review §7.4)');
{
  const journal = []; let shown = [];
  const store = { journal, kv: new Map() };
  const mkReq = (result) => { const r = {}; setTimeout(() => { r.result = result; r.onsuccess && r.onsuccess(); }, 0); return r; };
  const fakeIdb = { open() { const r = {}; setTimeout(() => { r.result = { objectStoreNames: { contains: () => true }, transaction(name) { const tx = {}; setTimeout(() => tx.oncomplete && tx.oncomplete(), 2); return { objectStore() { return { add: v => { store.journal.push(v); }, get: k => mkReq(store.kv.get(k) ? { k, v: store.kv.get(k) } : null), put: v => store.kv.set(v.k, v.v) }; }, get oncomplete() { return tx.oncomplete; }, set oncomplete(f) { tx.oncomplete = f; }, set onerror(f) {} }; } }; r.onsuccess && r.onsuccess(); }, 0); return r; } };
  const self = { listeners: {}, addEventListener(n, f) { this.listeners[n] = f; }, skipWaiting(){},
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([{ url: 'https://x/stuff/bridge-turn24-post-ship.html', focus: () => { self.focused = true; return Promise.resolve(); }, postMessage: m => { self.posted = m; } }]), openWindow: u => { self.opened = u; return Promise.resolve(); } },
    registration: { scope: 'https://x/stuff/', showNotification: (t, o) => { shown.push({ t, o }); return Promise.resolve(); } } };
  const ctx = new vm.createContext({ self, indexedDB: fakeIdb, setTimeout, Promise, Array, Date, String, JSON, Object, console });
  vm.runInContext(sw, ctx);
  const envelope = { web_push: 8030, notification: { title: 'TalkBridge', body: 'Incoming video call', tag: 'tb-roomZ', navigate: 'https://x/stuff/bridge-turn24-post-ship.html?tbEvent=K1%3Astart&tbRoom=roomZ&tbType=call-start&tbKind=video&tbCall=K1', silent: false }, tb: { v: 2, eventId: 'K1:start', roomId: 'roomZ', type: 'call-start', kind: 'video', callId: 'K1', ts: 1 } };
  const push = { data: { json: () => envelope }, waitUntil: p => { self.pending = p; } };
  self.listeners.push(push); await self.pending; await sleep(30);
  T('W1 envelope push → shown with its tag, generic body, tap-through data; arrived+shown journaled with the eventId', () => {
    A(shown.length === 1 && shown[0].o.tag === 'tb-roomZ' && shown[0].o.body === 'Incoming video call', 'display wrong: ' + JSON.stringify(shown));
    A(shown[0].o.data.roomId === 'roomZ' && shown[0].o.data.eventId === 'K1:start' && String(shown[0].o.data.url).includes('tbEvent='), 'tap data wrong');
    A(journal.some(j => j.ev === 'arrived' && j.eventId === 'K1:start') && journal.some(j => j.ev === 'shown' && j.eventId === 'K1:start'), 'journal incomplete');
  });
  self.listeners.push(push); await self.pending; await sleep(30);
  T('W2 the same eventId again → deduped: at most one display attempt per event per device', () => {
    A(shown.length === 1, 'displayed twice');
    A(journal.some(j => j.ev === 'deduped' && j.eventId === 'K1:start'), 'dedupe not journaled');
  });
  const bad = { data: { json: () => { throw new Error('not json'); } }, waitUntil: p => { self.pending = p; } };
  self.listeners.push(bad); await self.pending; await sleep(30);
  T('W3 an unparseable push still shows something (fail toward delivery)', () => A(shown.length === 2, 'silent on bad payload'));
  self.registration.showNotification = () => Promise.reject(new Error('boom'));
  const envelope2 = { ...envelope, tb: { ...envelope.tb, eventId: 'K2:start' } };
  self.listeners.push({ data: { json: () => envelope2 }, waitUntil: p => { self.pending = p; } }); await self.pending; await sleep(30);
  T('W4 a failed show is journaled failed with its eventId and a fallback is attempted', () => A(journal.some(j => j.ev === 'failed' && j.eventId === 'K2:start'), 'failure not journaled'));
  self.registration.showNotification = (t, o) => { shown.push({ t, o }); return Promise.resolve(); };
  self.listeners.notificationclick({ notification: { close(){ self.closed = true; }, data: { roomId: 'roomZ', url: 'https://x/stuff/bridge-turn24-post-ship.html', eventId: 'K1:start' } }, waitUntil: p => { self.pending = p; } });
  await self.pending; await sleep(20);
  T('W5 tap: journaled, closes itself, focuses the running app with the room (no second copy)', () => {
    A(self.closed && self.focused && self.posted && self.posted.roomId === 'roomZ' && !self.opened, 'tap behavior wrong');
    A(journal.some(j => j.ev === 'tap' && j.eventId === 'K1:start'), 'tap not journaled');
  });
  const exactUrl = envelope.notification.navigate;
  self.clients.matchAll = () => Promise.resolve([]); self.opened = null;
  self.listeners.notificationclick({ notification: { close(){}, data: { roomId: 'roomZ', url: exactUrl, eventId: 'K1:start', type: 'call-start', kind: 'video', callId: 'K1' } }, waitUntil: p => { self.pending = p; } });
  await self.pending; await sleep(20);
  T('W6 cold tap opens the exact event URL, including room, event, type, kind and call identity', () => {
    A(self.opened === exactUrl, 'cold tap lost exact URL: ' + self.opened);
  });
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
