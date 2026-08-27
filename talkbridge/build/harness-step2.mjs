#!/usr/bin/env node
/* Step 2 gate: ship + one part; subscribe-as-authority proven by effect. */
import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const ship = readFileSync(new URL('../../bridge-turn24-ship.html', import.meta.url), 'utf8');
const built = readFileSync(new URL('../../bridge-turn24-post-ship.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => Promise.resolve().then(f).then(() => { pass++; console.log('  ok  ' + n); }, e => { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); });
const A = (c, m) => { if (!c) throw new Error(m); };

await T('S1 additive: ship intact, exactly one part, no old-R10 identifiers', () => {
  const idx = ship.lastIndexOf('</script>');
  A(built.includes(ship.slice(0, idx)), 'ship body altered');
  A(built.includes('n1-step2-subscribe'), 'part missing');
  for (const bad of ['R10-phase-a', 'PA5-', 'PH-subscription', 'N6-gesture', 'pa5AutoAsk']) A(!built.includes(bad), bad + ' leaked in');
});

const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const errors = [];
const dom = new JSDOM(built, { url: 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html',
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.WebSocket = class { send(){} close(){} addEventListener(){} };
    w.RTCPeerConnection = class { addEventListener(){} createDataChannel(){ return { addEventListener(){} }; } close(){} };
    w.AudioContext = w.webkitAudioContext = class { createMediaStreamSource(){ return { connect(){} }; } resume(){ return Promise.resolve(); } };
    if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
    w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
    w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
    w.SpeechSynthesisUtterance = class {};
    w.matchMedia = () => ({ matches: false, addEventListener(){}, addListener(){} });
    w.HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
    w.localStorage.setItem('tb_name', 'H');
    /* the exact device condition: prop granted, answer denied */
    w.Notification = class { static requestPermission(){ return Promise.resolve('denied'); } };
    w.Notification.permission = 'granted';
    w.__subscribedWith = null;
    const reg = { pushManager: { getSubscription: () => Promise.resolve(null),
      subscribe: o => { w.__subscribedWith = o; return Promise.resolve({ endpoint: 'https://web.push.apple.com/xx', toJSON: () => ({ endpoint: 'https://web.push.apple.com/xx', keys: { p256dh: 'p', auth: 'a' } }) }); } } };
    Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true,
      value: { register: () => Promise.resolve(reg), ready: Promise.resolve(reg), addEventListener(){} } });
    w.fetch = (u, o) => Promise.resolve({ status: 200, ok: true, json: () => Promise.resolve(
      (o && o.body && o.body.includes('"vapid"')) ? { ok: true, vapid: 'BQQQ' } : { ok: true }) });
    w.addEventListener('error', e => errors.push(String(e.message || e.error)));
  } });
const w = dom.window;
w.S.rooms = [{ id: 'roomA' }, { id: 'roomB' }];
await new Promise(r => setTimeout(r, 2400));

await T('B1 boot clean', () => A(errors.length === 0, errors.join('|')));
await T('E1 THE DEVICE CONDITION: answer=denied + prop=granted → subscribe STILL attempted and succeeds', () =>
  A(w.__subscribedWith && w.__subscribedWith.applicationServerKey && w.__subscribedWith.applicationServerKey.length > 0,
    'the lying answer stopped the subscribe again'));
await T('E2 every room registered with the relay', () =>
  A(w.S2 && w.S2.subscribedRooms.roomA === 1 && w.S2.subscribedRooms.roomB === 1, JSON.stringify(w.S2 && w.S2.subscribedRooms)));
await T('E3 state=on and no banner after success', () =>
  A(w.S2.state === 'on' && !w.document.getElementById('s2-nb'), 'state=' + (w.S2 && w.S2.state)));
await T('E4 NotAllowedError → blocked state → banner names the Settings switch', () => {
  A(built.includes("n === 'NotAllowedError'") && built.includes('Settings → Notifications → TalkBridge'), 'authoritative denial path missing');
});
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
