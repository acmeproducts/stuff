#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
const part = fs.readFileSync(process.env.N13 || 'talkbridge/parts/n13-video.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

function world({ ua = 'Mozilla/5.0 (Linux; Android 14) Chrome/140', cams = 2, display = false, nativePip = true, pipRefuses = false } = {}) {
  const dom = new JSDOM(`<body><div id="scr-room" class="st-video">
    <div id="call-band"><button id="pip-x">x</button>
      <div class="videos" id="call-videos"><div id="remote-ph"></div>
      <video id="remote-video"></video><video id="local-video"></video></div></div></div></body>`,
    { url: 'https://x.test/a.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; const logged = []; const replaced = []; const st = { pipCalls: 0, exitPip: 0 };
  Object.defineProperty(w.navigator, 'userAgent', { value: ua, configurable: true });
  const md = { enumerateDevices: () => Promise.resolve(Array.from({ length: cams }, () => ({ kind: 'videoinput' }))),
    getUserMedia: () => Promise.resolve({ getVideoTracks: () => [{ id: 'newcam', stop() {} }] }) };
  if (display) md.getDisplayMedia = () => Promise.resolve({ getVideoTracks: () => [{ id: 'screen', addEventListener() {}, stop() {} }], getTracks: () => [{ stop() {} }] });
  Object.defineProperty(w.navigator, 'mediaDevices', { value: md, configurable: true });
  Object.defineProperty(w.document, 'pictureInPictureEnabled', { value: nativePip, configurable: true });
  Object.defineProperty(w.document, 'pictureInPictureElement', { value: null, writable: true, configurable: true });
  const rv = w.document.getElementById('remote-video'), lv = w.document.getElementById('local-video');
  rv.requestPictureInPicture = () => { st.pipCalls++; return pipRefuses ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve({}); };
  rv.srcObject = 'REMOTE'; lv.srcObject = 'LOCAL'; lv.muted = true;
  w.log = (e, d) => logged.push({ e, d });
  const cam = { kind: 'video', id: 'cam', getSettings: () => ({ facingMode: 'user' }), stop() {} };
  w.CALL = { active: true, kind: 'video', pip: false,
    stream: { _t: [cam], getVideoTracks() { return this._t; }, addTrack(t) { this._t.push(t); }, removeTrack(t) { this._t = this._t.filter(x => x !== t); } },
    pc: { getSenders: () => [{ track: cam, replaceTrack(t) { replaced.push(t.id); return Promise.resolve(); } }] },
    enterPip() { st.inPage = (st.inPage || 0) + 1; this.pip = true; },
    exitPip() { st.exitPip++; this.pip = false; },
    teardown() { this.active = false; } };
  w.eval(part);
  return { w, logged, replaced, st, d: w.document, rv, lv };
}
const settle = () => new Promise(r => setTimeout(r, 60));
const tap = t => t.d.getElementById('call-videos').dispatchEvent(new t.w.Event('click', { bubbles: true }));

/* 1. tap swaps the streams and changes nothing else */
let t = world(); await settle();
const bandClassesBefore = t.d.getElementById('scr-room').className;
tap(t); await settle();
ok(t.rv.srcObject === 'LOCAL' && t.lv.srcObject === 'REMOTE', 'tapping exchanges the two streams: big becomes small, small becomes big');
ok(t.d.getElementById('scr-room').className === bandClassesBefore, 'and changes NOTHING else — no mode, no size, no PiP (the N12 defect)');
ok(t.w.CALL.pip === false && t.st.pipCalls === 0, 'a tap never puts the call into picture-in-picture');
ok(t.lv.muted === false && t.rv.muted === true, 'whichever element carries our own camera stays muted');
tap(t); await settle();
ok(t.rv.srcObject === 'REMOTE' && t.lv.srcObject === 'LOCAL', 'tapping again puts them back');

/* 2. the back button asks the browser for real picture-in-picture */
t = world(); await settle();
await t.w.CALL.enterPip(); await settle();
ok(t.st.pipCalls === 1, 'the back button asks the BROWSER for picture-in-picture, the window that floats over other apps');
ok(t.logged.some(l => l.e === 'n13_native_pip'), 'and records that it got it');
ok(!t.st.inPage, 'the in-page overlay is not used when the real thing is available');

t = world({ pipRefuses: true }); await settle();
await t.w.CALL.enterPip(); await settle();
ok(t.st.inPage === 1, 'if the browser refuses, the frozen in-page view still runs — nothing is lost');
ok(t.logged.some(l => l.e === 'n13_inpage_pip'), 'and the log says which path was taken, so the cause is never a guess');

t = world({ nativePip: false }); await settle();
await t.w.CALL.enterPip(); await settle();
ok(t.st.inPage === 1, 'a browser without picture-in-picture falls back cleanly');

/* 3. the rest of the surface */
t = world({ cams: 2 }); await settle();
ok(t.d.getElementById('n13-flip').style.display !== 'none', 'camera swap is offered with two cameras');
t.d.getElementById('n13-flip').dispatchEvent(new t.w.Event('click', { bubbles: true })); await settle();
ok(t.replaced.includes('newcam'), 'and sends the other camera to the far side');
t = world({ cams: 1 }); await settle();
ok(t.d.getElementById('n13-flip').style.display === 'none', 'with one camera it is not offered');
t = world({ ua: 'Mozilla/5.0 (Macintosh) Chrome/140', display: true }); await settle();
ok(t.d.getElementById('n13-share').style.display !== 'none', 'desktop is offered screen share');
t.d.getElementById('n13-share').dispatchEvent(new t.w.Event('click', { bubbles: true })); await settle();
ok(t.replaced.includes('screen'), 'and sharing sends the screen');
t = world({ display: true }); await settle();
ok(t.d.getElementById('n13-share').style.display === 'none', 'phones are never offered screen share');

/* 4. drag, and drag is not a tap */
t = world(); await settle();
const lv = t.lv;
Object.defineProperty(lv, 'offsetWidth', { value: 82, configurable: true });
Object.defineProperty(lv, 'offsetHeight', { value: 110, configurable: true });
lv.getBoundingClientRect = () => ({ left: 200, top: 300, width: 82, height: 110 });
lv.dispatchEvent(new t.w.MouseEvent('mousedown', { clientX: 210, clientY: 310, bubbles: true }));
t.w.dispatchEvent(new t.w.MouseEvent('mousemove', { clientX: -400, clientY: 500, bubbles: true }));
ok(parseFloat(lv.style.left) > -82, 'the inset can hang off an edge but always leaves a sliver to grab');
t.w.dispatchEvent(new t.w.MouseEvent('mouseup', { bubbles: true }));
const before = t.rv.srcObject;
tap(t); await settle();
ok(t.rv.srcObject === before, 'letting go of a drag does not count as a tap');

/* 5. ending the call resets everything */
t = world(); await settle();
tap(t); await settle();
t.w.CALL.teardown();
ok(!t.lv.classList.contains('n13-free'), 'ending the call puts the inset back');
console.log(fail === 0 ? 'N13 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
