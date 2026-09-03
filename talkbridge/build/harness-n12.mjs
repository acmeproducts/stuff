#!/usr/bin/env node
import fs from 'fs'; import { JSDOM } from 'jsdom';
const part = fs.readFileSync(process.env.N12 || 'talkbridge/parts/n12-video.js', 'utf8');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };

function world({ ua = 'Mozilla/5.0 (Linux; Android 14) Chrome/140', cams = 2, display = false } = {}) {
  const dom = new JSDOM(`<body><div id="scr-room" class="st-video">
    <div id="call-band"><button id="pip-x">x</button>
      <div class="videos" id="call-videos">
        <div id="remote-ph"></div><video id="remote-video"></video><video id="local-video"></video>
      </div></div></div></body>`, { url: 'https://x.test/a.html', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window; const logged = []; const replaced = [];
  Object.defineProperty(w.navigator, 'userAgent', { value: ua, configurable: true });
  const md = {
    enumerateDevices: () => Promise.resolve(Array.from({ length: cams }, () => ({ kind: 'videoinput' }))),
    getUserMedia: () => Promise.resolve({ getVideoTracks: () => [{ id: 'newcam', stop() {} }] }),
  };
  if (display) md.getDisplayMedia = () => Promise.resolve({
    getVideoTracks: () => [{ id: 'screen', addEventListener() {}, stop() {} }],
    getTracks: () => [{ stop() {} }],
  });
  Object.defineProperty(w.navigator, 'mediaDevices', { value: md, configurable: true });
  w.log = (e, d) => logged.push({ e, d });
  const camTrack = { kind: 'video', id: 'cam', getSettings: () => ({ facingMode: 'user' }), stop() {} };
  w.CALL = {
    active: true, kind: 'video', pip: false,
    stream: { _t: [camTrack], getVideoTracks() { return this._t; }, addTrack(t) { this._t.push(t); }, removeTrack(t) { this._t = this._t.filter(x => x !== t); } },
    pc: { getSenders: () => [{ track: camTrack, replaceTrack(t) { replaced.push(t.id); return Promise.resolve(); } }] },
    enterPip() { this.pip = true; },
    exitPip() { this.pip = false; },
    teardown() { this.active = false; },
  };
  w.eval(part);
  return { w, logged, replaced, d: w.document };
}
const settle = () => new Promise(r => setTimeout(r, 60));

/* tap to swap */
let t = world(); await settle();
const tapVideos = () => t.d.getElementById('call-videos').dispatchEvent(new t.w.Event('click', { bubbles: true }));
tapVideos(); await settle();
ok(t.d.getElementById('scr-room').classList.contains('n12-swap'), 'tapping a video swaps which stream is large');
tapVideos(); await settle();
ok(!t.d.getElementById('scr-room').classList.contains('n12-swap'), 'tapping again swaps them back');

/* drag the inset anywhere, including mostly off-screen */
const lv = t.d.getElementById('local-video');
Object.defineProperty(lv, 'offsetWidth', { value: 96, configurable: true });
Object.defineProperty(lv, 'offsetHeight', { value: 128, configurable: true });
lv.getBoundingClientRect = () => ({ left: 200, top: 300, width: 96, height: 128 });
lv.dispatchEvent(new t.w.MouseEvent('mousedown', { clientX: 210, clientY: 310, bubbles: true }));
ok(lv.classList.contains('n12-free'), 'the inset lifts off the video pane when grabbed');
t.w.dispatchEvent(new t.w.MouseEvent('mousemove', { clientX: 40, clientY: 700, bubbles: true }));
ok(lv.style.left && lv.style.top, 'it follows the finger across the whole screen');
t.w.dispatchEvent(new t.w.MouseEvent('mousemove', { clientX: -500, clientY: -500, bubbles: true }));
const x = parseFloat(lv.style.left), y = parseFloat(lv.style.top);
ok(x > -96 && y > -128, 'it can hang off the edge but always leaves a sliver to grab');
t.w.dispatchEvent(new t.w.MouseEvent('mouseup', { bubbles: true }));
ok(t.logged.some(l => l.e === 'n12_inset_moved'), 'the move is recorded');
const swapsBefore = t.logged.filter(l => l.e === 'n12_swap').length;
tapVideos(); await settle();
ok(t.logged.filter(l => l.e === 'n12_swap').length === swapsBefore, 'the release of a drag is not treated as a tap');

/* PiP: two controls, call stays live */
t = world(); await settle();
ok(!!t.d.getElementById('n12-grow'), 'PiP offers an expand control');
ok(!!t.d.getElementById('pip-x'), 'PiP keeps the end-call control');
t.w.CALL.enterPip();
ok(t.w.CALL.active === true, 'the call stays live in PiP');
t.d.getElementById('n12-grow').dispatchEvent(new t.w.Event('click', { bubbles: true }));
ok(t.w.CALL.pip === false, 'the expand control returns to full size');

/* camera swap */
t = world({ cams: 2 }); await settle();
ok(t.d.getElementById('n12-flip').style.display !== 'none', 'a camera-swap control is offered when there are two cameras');
t.d.getElementById('n12-flip').dispatchEvent(new t.w.Event('click', { bubbles: true }));
await settle();
ok(t.replaced.includes('newcam'), 'swapping actually sends the other camera to the far side');
t = world({ cams: 1 }); await settle();
ok(t.d.getElementById('n12-flip').style.display === 'none', 'with one camera the control is not offered');

/* screen share: desktop only */
t = world({ ua: 'Mozilla/5.0 (Macintosh) Chrome/140', display: true }); await settle();
ok(t.d.getElementById('n12-share').style.display !== 'none', 'a desktop browser is offered screen share');
t.d.getElementById('n12-share').dispatchEvent(new t.w.Event('click', { bubbles: true }));
await settle();
ok(t.replaced.includes('screen'), 'sharing replaces the outgoing video with the screen');
t = world({ ua: 'Mozilla/5.0 (Linux; Android 14) Chrome/140', display: true }); await settle();
ok(t.d.getElementById('n12-share').style.display === 'none', 'a phone is never offered screen share');

/* leaving the call resets the surface */
t = world(); await settle();
tapVideos(); await settle();
t.w.CALL.teardown();
ok(!t.d.getElementById('scr-room').classList.contains('n12-swap'), 'ending the call resets the swap');
ok(!t.d.getElementById('local-video').classList.contains('n12-free'), 'and puts the inset back where it belongs');
console.log(fail === 0 ? 'N12 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
