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
  for (const p of ['R10-phase-a', 'PA5-unmissable', 'PH-subscription-selfheal', 'N4-listener-heartbeat', 'PL-one-path', 'N6-gesture-first-permission', 'N7-fresh-iphone-path'])
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
    Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true,
      value: { register: () => Promise.resolve({}), ready: Promise.resolve({ pushManager: { getSubscription: () => Promise.resolve(null) } }), addEventListener(){} } });
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
  const OrigNote = w.Notification;
  w.Notification = class { static requestPermission(){ return Promise.resolve('granted'); } };
  w.Notification.permission = 'granted';
  w.S.rooms = [{ id: 'rV', myName: 'x' }];
  await w.r10EnableNotifications().catch(() => {});
  await new Promise(r => setTimeout(r, 150));
  w.fetch = origFetch; w.Notification = OrigNote;
  T("V1 subscription completes against the relay's real 'vapid' field shape", () =>
    A(subscribedWith && subscribedWith.applicationServerKey && subscribedWith.applicationServerKey.length > 0,
      'subscribe never ran — the vapid field-name mismatch is back'));
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
T('J2 one-tap Safari: the bar carries an x-safari-https link to the exact invite', () => {
  A(built.includes("N7.inviteHref.replace(/^https:/, 'x-safari-https:')"), 'x-safari scheme missing');
  A(built.includes('You can chat right here'), 'J1 violated: bar gates instead of informing');
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
