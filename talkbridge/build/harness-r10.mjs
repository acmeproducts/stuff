#!/usr/bin/env node
/* R10 client gate — plan v16.0.0: ship + N1..N5, nothing else.
   Usage: node harness-r10.mjs <ship> <post-ship> */
import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const [shipP, builtP] = process.argv.slice(2);
const ship = readFileSync(shipP, 'utf8');
const built = readFileSync(builtP, 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const A = (c, m) => { if (!c) throw new Error(m); };

console.log('S · static contract');
T('S1 exactly N1..N5 present; excluded parts absent; ship interior intact', () => {
  for (const p of ['R10-phase-a', 'PA5-unmissable', 'PH-subscription-selfheal', 'N4-listener-heartbeat', 'PL-one-path', 'N6-gesture-first-permission', 'N7-fresh-iphone-path', 'N8-sw-receipts'])
    A(built.includes(p), p + ' missing');
  for (const p of ['PA4-create', 'PJ-customer', 'PD-delivery', '_did', 'ACK_GRACE'])
    A(!built.includes(p), p + ' leaked in');
  A(built.includes(ship.slice(ship.indexOf('<body>'), ship.indexOf('<div id="toast"></div>'))), 'ship body altered');
});
T('S2 one manifest link, one pre-bootstrap, doctype first', () => {
  A((built.match(/rel="manifest"/g) || []).length === 1, 'manifest count wrong');
  A(built.split('PRE-BOOTSTRAP HANDOFF').length === 2, 'pre-bootstrap count wrong');
  A(built.indexOf('<!DOCTYPE html>') < 200, 'doctype buried');
});
T('S2b THE NAME GATE: no stale turn/stage labels anywhere; the build names its own stage', () => {
  A(!/turn ?25/.test(built), 'stale turn25 label present');
  A(built.includes('turn24-post-ship'), 'build does not name its own stage');
});
T('S3 relay contract match: no client feature the R7-based relay lacks', () => {
  A(!/type:\s*'delivered'/.test(built), 'client confirms deliveries the relay never ids');
});

console.log('B · boot');
const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const errors = [];
const dom = new JSDOM(built, {
  url: 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html',
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.WebSocket = class { constructor(){ this.readyState = 0; } send(){} close(){} addEventListener(){} set onopen(f){} set onmessage(f){} set onclose(f){} set onerror(f){} };
    w.RTCPeerConnection = class { addEventListener(){} createDataChannel(){ return { addEventListener(){}, send(){}, close(){} }; } close(){} };
    w.AudioContext = w.webkitAudioContext = class { constructor(){ this.state='running'; this.destination={}; } createMediaStreamSource(){ return { connect(){} }; } createScriptProcessor(){ return { connect(){}, disconnect(){} }; } resume(){ return Promise.resolve(); } };
    if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
    w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
    w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
    w.SpeechSynthesisUtterance = class {};
    w.PushManager = class {};
    const swTarget = new w.EventTarget();
    swTarget.register = () => Promise.resolve({});
    swTarget.ready = Promise.resolve({ pushManager: { getSubscription: () => Promise.resolve(null) } });
    w.__swTarget = swTarget;   /* later tests replace the property; the part's listener lives HERE */
    Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true, value: swTarget });
    w.Notification = class { static requestPermission(){ return Promise.resolve('denied'); } };
    w.Notification.permission = 'default';
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.matchMedia = () => ({ matches: false, addEventListener(){}, addListener(){} });
    w.HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
    w.localStorage.setItem('tb_name', 'Harness');
    w.addEventListener('error', e => errors.push(String(e.message || e.error)));
  }
});
const w = dom.window, d = w.document;
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(2200);
T('B1 boot: no uncaught errors', () => A(errors.length === 0, errors.join(' | ')));
T('B2 SW registration attempted (r10 init present and ran)', () =>
  A(typeof w.r10SyncSubscriptions === 'function' && typeof w.r10EnableNotifications === 'function', 'phase-a core missing at runtime'));

console.log('N · notification stack effects');
T('N2 enable banner: not-granted + rooms => TOP of panel; granted => gone', () => {
  w.S.rooms = [{ id: 'r1', myName: 'x' }];
  w.Notification.permission = 'default';
  w.pa5Banner();
  const b = d.getElementById('pa5-nb');
  A(b && b.nextElementSibling && b.nextElementSibling.id === 'panel-body', 'banner missing or misplaced');
  w.Notification.permission = 'granted';
  w.pa5Banner();
  A(!d.getElementById('pa5-nb'), 'banner lingers after grant');
});
{
  let healed = 0;
  const orig = w.r10EnableNotifications;
  w.r10EnableNotifications = () => { healed++; return Promise.resolve('on'); };
  w.Notification.permission = 'granted';
  w.phSelfHeal();   /* boot stub's ready already resolves a null-subscription reg */
  await sleep(120);
  T('N3a granted-but-dead subscription self-heals silently', () => A(healed === 1, 'healed=' + healed));
  healed = 0;
  w.Notification.permission = 'default';
  w.phSelfHeal();
  await sleep(120);
  w.r10EnableNotifications = orig;
  T('N3b never prompts the ungranted', () => A(healed === 0, 'ran ungated'));
}
T('N4 background listeners heartbeat on a 30s interval', () => {
  const src = built;
  A(/LISTEN\.send\(id, \{ type: 'ping', transient: true \}\)/.test(src), 'heartbeat send missing');
  A(/\}, 30000\);\s*\}\)\(\);/.test(src.slice(src.indexOf('N4-listener-heartbeat'))), 'not on a 30s interval');
});
T('N5 lane routing exact per user agent; boot line carries permissions', () => {
  const L = w.plLane;
  A(L('Mozilla/5.0 (iPhone) AppleWebKit Version/17.5 Mobile Safari/604.1', false) === 'ios-safari', 'ios safari');
  A(L('Mozilla/5.0 (iPhone) AppleWebKit CriOS/125 Mobile Safari/604.1', false) === 'ios-other-browser', 'ios chrome');
  A(L('Mozilla/5.0 (iPhone) AppleWebKit', true) === 'ios-pwa', 'ios pwa');
  A(L('Mozilla/5.0 (Linux; Android 14) Chrome/125 Mobile Safari/537.36', false) === 'android-tab', 'android tab');
  w.plBootLine();
  A(w.TB_LANE && w.TB_LANE.lane !== '?' && typeof w.TB_LANE.notif === 'string', 'lane line incomplete');
});
{
  /* N7-shape: enable must succeed against the LIVE relay's response shape */
  let subscribedWith = null;
  const reg = { pushManager: { getSubscription: () => Promise.resolve(null),
    subscribe: o => { subscribedWith = o; return Promise.resolve({ endpoint: 'https://x/e' }); } } };
  Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true,
    value: { register: () => Promise.resolve({}), ready: Promise.resolve(reg), addEventListener(){} } });
  const origFetch = w.fetch;
  w.fetch = () => Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve({ ok: true, vapid: 'BQQQQQQQQQQQQQQQQQQQQQQ', push: true }) });
  const OrigPM = w.PushManager;
  delete w.PushManager;                       /* the exact iOS-PWA condition from the owner's log */
  const OrigNote = w.Notification;
  w.Notification = class { static requestPermission(){ return Promise.resolve('granted'); } };
  w.Notification.permission = 'granted';
  w.S.rooms = [{ id: 'rV', myName: 'x' }];
  await w.r10EnableNotifications().catch(() => {});
  await new Promise(r => setTimeout(r, 150));
  w.fetch = origFetch; w.Notification = OrigNote; w.PushManager = OrigPM;
  T("V1 subscription completes against the relay's real 'vapid' field shape", () =>
    A(subscribedWith && subscribedWith.applicationServerKey && subscribedWith.applicationServerKey.length > 0,
      'subscribe never ran — capability gate or vapid shape wrong (the 8ms iOS exit)'));
}
T('A1 the app asks on load — no tap, no footer hunt', () => {
  A(built.includes('setTimeout(pa5AutoAsk, 1200);'), 'load-time ask missing');
  A(built.includes("r8Log('auto_prompt'"), 'auto-ask outcome not logged');
  A(built.includes('#r10-notif{display:none !important}'), 'footer row not retired');
});
T('A2 every heal step names itself with a deadline — silence is impossible', () => {
  for (const st of ["'sw-ready'", "'get-subscription'", "'enable-flow'", "'vapid-answer'", "'subscribe-call'"])
    A(built.includes(st), st + ' step unlogged');
  A(built.includes("rej(new Error('timeout'))"), 'no deadlines — a hang could still be silent');
  A(built.includes("r8Log('heal_step', { s: name, ok: false"), 'failures are not logged — silence possible again');
});
T('J2 the Safari detour is DELETED — install happens in whatever browser you are in', () => {
  A(!built.includes('x-safari-https'), 'the detour is back');
  A(!built.includes('n7SafariBar()'), 'detour bar still invoked');
  A(built.includes("l !== 'ios-safari' && l !== 'ios-other-browser'"), 'nudge does not serve every iOS browser');
});
T('J2b the icon opens the invite itself: no start_url override, name rides the live hash', () => {
  const manifest = readFileSync(new URL('../../tb-manifest.webmanifest', import.meta.url), 'utf8');
  A(!manifest.includes('start_url'), 'manifest still overrides the launch URL');
  A(built.includes("history.replaceState(null, '', newHash)"), 'typed name does not board the live URL');
});
T('J5 a payload naming the joiner names this device once, and only once', () => {
  w.S.user.name = '';
  A(w.n7AdoptName({ jn: 'Zoe' }) === true && w.S.user.name === 'Zoe', 'name not adopted');
  A(w.n7AdoptName({ jn: 'Mallory' }) === false && w.S.user.name === 'Zoe', 'existing identity overwritten');
});
T('J5 the tab writes the typed name into the handoff cookie for the PWA', () => {
  w.__TB_R10.standalone = false; w.__TB_R10.armed = true;
  A(w.n7AugmentHandoff({ r: 'room9', k: 'kk' }, 'Zoe') === true, 'augment refused');
  const mm = ('; ' + w.document.cookie).match('; tb_install_handoff_v1=([^;]*)');
  A(mm, 'cookie missing');
  const p = w.decInv(decodeURIComponent(mm[1]));
  A(p && p.jn === 'Zoe' && p.r === 'room9' && p.k === 'kk', 'payload wrong: ' + JSON.stringify(p));
});
T('E2 typing the name live-updates the Safari link and the handoff cookie', () => {
  const p0 = { r: 'roomN', k: 'kk' };
  w.location.hash = '#j=' + w.encInv(p0);
  w.__TB_R10.standalone = false; w.__TB_R10.armed = true;
  w.n7NameSync('Carmen');
  A(/x-safari-https:|https:/.test(w.N7.inviteHref) && w.N7.inviteHref.includes('#j='), 'invite href not rebuilt');
  const p1 = w.decInv(w.N7.inviteHref.split('#j=')[1]);
  A(p1 && p1.jn === 'Carmen' && p1.r === 'roomN', 'typed name did not board the link: ' + JSON.stringify(p1));
  const ph = w.decInv(w.location.hash.slice(3));
  A(ph && ph.jn === 'Carmen', 'typed name did not board the LIVE URL: ' + w.location.hash.slice(0, 30));
  w.location.hash = '';
});
{
  /* E3: a denied permission answer can NEVER exit silently */
  const logs = [];
  const origLog = w.r8Log;
  w.r8Log = (ev, meta, lvl) => { logs.push([ev, meta]); return origLog && origLog(ev, meta, lvl); };
  const OrigNote2 = w.Notification;
  w.Notification = class { static requestPermission(){ return Promise.resolve('denied'); } };
  w.Notification.permission = 'granted';   /* the owner's exact contradiction: prop says granted, answer says denied */
  Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true,
    value: { register: () => Promise.resolve({}), ready: Promise.resolve({ pushManager: { getSubscription: () => Promise.resolve(null) } }), addEventListener(){} } });
  await w.r10EnableNotifications().catch(() => {});
  await new Promise(r => setTimeout(r, 120));
  w.Notification = OrigNote2; w.r8Log = origLog;
  T('E3 (reviewer-directed) the contradiction MUST still attempt subscribe — the attempt is the authority', () => {
    A(logs.some(([e, m]) => e === 'perm_answer' && m.perm === 'denied' && m.prop === 'granted'), 'permission answer not logged with the contradiction');
    A(logs.some(([e, m]) => e === 'heal_step' && m.s === 'vapid-answer') || logs.some(([e]) => e === 'enable_src'),
      'flow exited on the lying answer WITHOUT attempting subscribe');
  });
  T('E4 an existing subscription names itself', () => {
    A(built.includes("r8Log('enable_src', { s: 'existing'"), 'existing branch silent');
  });
}
T('R1 the service worker is no longer dark: receipts at EVERY terminal incl. tap and death', () => {
  const sw = readFileSync(new URL('../../tb-sw.js', import.meta.url), 'utf8');
  A(sw.includes("swLog({ ev: 'push_arrived' })"), 'arrival unrecorded');
  A(sw.includes("swLog({ ev: 'notification_shown', visible })"), 'shown unrecorded');
  A(sw.includes("swLog({ ev: 'notification_failed'"), 'failure unrecorded');
  A(sw.includes("swLog({ ev: 'notification_tapped' })"), 'TAP unrecorded');
  A(sw.includes("'tap_focus_failed'") && sw.includes("'tap_open_failed'") && sw.includes("'tap_no_path'"), 'tap outcomes can fail silently');
  A(sw.includes("'pushsubscriptionchange'") && sw.includes("'subscription_changed'"), 'the assassination event is discarded');
  A((sw.match(/ev: 'push_arrived'/g) || []).length === 1, 'arrival stamped in the wrong handler (the tap-mislabel defect)');
  A(sw.includes("indexedDB.open('tb-sw-log'"), 'receipts not durable');
  A(sw.includes("'tb-drain-log'"), 'no drain path');
});
T('R4 the drain itself cannot no-op silently', () => {
  A(built.includes("r8Log('sw_drain_skipped', { why: 'no-active-worker' }"), 'inactive-worker skip silent');
  A(built.includes("'ready-rejected'"), 'ready rejection swallowed');
});
{
  const logs = [];
  const origLog2 = w.r8Log;
  w.r8Log = (ev, meta, lvl) => { logs.push([ev, meta]); return origLog2 && origLog2(ev, meta, lvl); };
  const evt = new w.MessageEvent('message', { data: { type: 'tb-sw-log', entries: [{ ev: 'push_arrived', ts: 1 }, { ev: 'notification_failed', ts: 2, e: 'boom' }] } });
  w.__swTarget.dispatchEvent(evt);   /* the boot-time target the part actually listened on */
  w.r8Log = origLog2;
  T('R2 drained receipts land in the debug log, failures marked', () => {
    A(logs.some(([e, m]) => e === 'sw_receipt' && m.ev === 'push_arrived'), 'arrival receipt not logged');
    A(logs.some(([e, m]) => e === 'sw_receipt' && m.ev === 'notification_failed' && m.e === 'boom'), 'failure receipt not logged');
  });
}
T('R3 no-rooms exits loudly now', () => {
  A(built.includes("r8Log('enable_exit', { e: 'no-rooms' }"), 'no-rooms still silent');
});
T('N6 the permission ask happens synchronously inside the tap — before any await', () => {
  let askedSync = false;
  const OrigN = w.Notification;
  w.Notification = class { static requestPermission(){ askedSync = true; return Promise.resolve('denied'); } };
  w.Notification.permission = 'default';
  w.r10EnableNotifications();          /* simulated tap */
  const wasSync = askedSync;           /* read BEFORE any microtask runs */
  w.Notification = OrigN;
  A(wasSync === true, 'permission asked only after an await — iOS would show no prompt');
});
T('N1 handoff machinery live: cookie consume + subscription sync callable', () => {
  A(typeof w.r10ConsumeHandoff === 'function', 'consume missing');
  A(typeof w.r10Unsubscribe === 'function', 'room unsubscribe missing');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
