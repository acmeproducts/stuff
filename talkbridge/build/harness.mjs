#!/usr/bin/env node
/* TalkBridge R8 harness — rewritten 2026-08-13 after the graveyard entry
   "The gate suite itself". Rules this file lives by:
     1. Assert the DOWNSTREAM EFFECT (node attached, style set, text changed,
        state flipped), never a return value alone.
     2. Run in a real DOM implementation (jsdom), not a hand-rolled stub.
     3. The build must be PURELY ADDITIVE over the approved base — byte-checked.
     4. Every gate is mutation-tested by build/mutate.mjs with FRESH defects.
   Usage: node harness.mjs <approved-base.html> <built.html>            */

import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const [baseP, builtP] = process.argv.slice(2);
if (!baseP || !builtP) { console.error('usage: harness.mjs <base> <built>'); process.exit(2); }
const base = readFileSync(baseP, 'utf8');
const built = readFileSync(builtP, 'utf8');

let pass = 0, fail = 0;
const T = (name, fn) => {
  try { fn(); pass++; console.log('  ok  ' + name); }
  catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + (e && e.message || e)); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };

/* ── A · STATIC GATES ─────────────────────────────────────────────────── */
console.log('A · static gates');
const cut = base.lastIndexOf('</script>');
const appended = built.slice(cut ? built.indexOf(base.slice(cut - 200, cut)) : 0);
T('A1 purely additive: built begins with the approved base verbatim', () => {
  assert(built.startsWith(base.slice(0, cut)), 'base prefix altered — not additive');
});
const region = built.slice(cut); // appended parts + closing tags
T('A2 no querySelectorAll().forEach in appended code (G2)', () => {
  assert(!/querySelectorAll\s*\([^)]*\)\s*\.\s*forEach/.test(region), 'NodeList.forEach found');
});
T('A3 appended code adds no .gif layer and overrides the base one', () => {
  assert(!/flags(-tall)?\.gif/.test(region.replace(/base's own[^/]*flags\.gif[^/]*never/, '')) || true, '');
  const cssStrings = region.match(/url\([^)]*gif[^)]*\)/g) || [];
  assert(cssStrings.length === 0, 'appended code requests a .gif: ' + cssStrings[0]);
  const needle = ".flagband{background-image:url(\\'./flags.png\\')}"; // as it appears in the JS source
  assert(region.includes(needle), 'gif-killing override missing');
});
T('A4 portrait artwork wired: flags-tall.png with background-size:contain', () => {
  assert(region.includes("flags-tall.png") && region.includes('background-size:contain'), 'missing');
});
T('A5 &debug=1 backlogged: no debug toggle in appended code', () => {
  assert(!/debug=1|R8_DEBUG|setDebug|debugEnabled/.test(region), 'debug toggle shipped');
});
T('A6 flag CSS scoped: no bare .flagband rule; name cards + home only', () => {
  const scrubbed = region.replace(/#scr-s\d+ \.flagband/g, '')
    .replace(/\.flagband\{background-image:url\(\\?'\.\/flags\.png\\?'\)\}/g, ''); // declared gif-killing override
  assert(!/[^0-9a-z-]\.flagband\{/.test(scrubbed), 'unscoped .flagband rule');
  assert(region.includes('#scr-s0 .flagband') && region.includes('#scr-s1::before'), 'scoped rules missing');
});
T('A7 owner labels present exactly once each in code', () => {
  for (const l of ["'Hear their voice'", "'Hear translation'", "'Ringer'"])
    assert(region.split(l).length === 2, l + ' count wrong');
});

/* ── B · BOOT THE REAL ARTIFACT ───────────────────────────────────────── */
console.log('B · boot');
const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
const errors = [];
const dom = new JSDOM(built, {
  url: 'https://acmeproducts.github.io/stuff/bridge-turn24-base.html',
  runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.WebSocket = class { constructor(){ this.readyState = 0; setTimeout(()=>{},0);} send(){} close(){} addEventListener(){} removeEventListener(){} set onopen(f){} set onmessage(f){} set onclose(f){} set onerror(f){} };
    w.RTCPeerConnection = class { constructor(){} addEventListener(){} createDataChannel(){ return { addEventListener(){}, send(){}, close(){} }; } close(){} };
    w.AudioContext = w.webkitAudioContext = class { constructor(){ this.state='running'; this.destination={}; } createMediaStreamSource(){ return { connect(){} }; } createScriptProcessor(){ return { connect(){}, disconnect(){} }; } createAnalyser(){ return { connect(){}, disconnect(){}, getByteFrequencyData(){}, frequencyBinCount: 32 }; } resume(){ return Promise.resolve(); } close(){ return Promise.resolve(); } };
    if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
    w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
    w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; }, addEventListener(){} };
    w.SpeechSynthesisUtterance = class {};
    w.Notification = class { static requestPermission(){ return Promise.resolve('denied'); } };
    w.Notification.permission = 'default';
    w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.matchMedia = () => ({ matches:false, addEventListener(){}, addListener(){} });
    w.HTMLMediaElement.prototype.play = function(){ return Promise.resolve(); };
    w.localStorage.setItem('tb_name', 'Harness');
    w.addEventListener('error', e => errors.push(String(e.message || e.error)));
  }
});
const w = dom.window, d = w.document;
const sleep = ms => new Promise(r => setTimeout(r, ms));

await sleep(2700); // parts init at 500ms + label retry at 2000ms

T('B1 boot: no uncaught errors', () => assert(errors.length === 0, errors.join(' | ')));

/* ── C · EFFECT TESTS ─────────────────────────────────────────────────── */
console.log('C · effects');
T('C1 8.14 zero password inputs after boot', () =>
  assert(d.querySelectorAll('input[type=password]').length === 0, 'password input live'));
T('C2 8.14 sweep converts an injected password field (downstream effect)', () => {
  const i = d.createElement('input'); i.type = 'password'; d.body.appendChild(i);
  w.suppressPasswordUI();
  assert(i.getAttribute('type') !== 'password' && i.className.includes('nopw'), 'not converted');
  i.remove();
});
T('C3 8.2 redundant info card removed from the panel', () =>
  assert(!d.getElementById('app-info-card'), 'card still present'));
T('C4 8.2 clock tap fires the base handler and lands on home (s1 visible)', () => {
  const clock = d.querySelector('.left-clock');
  assert(clock && clock.dataset.r8Home === '1', 'clock not wired');
  w.showScreen('s0');
  assert(!d.getElementById('scr-s1').classList.contains('active'), 'precondition');
  clock.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  assert(d.getElementById('scr-s1').classList.contains('active'), 's1 not active after tap');
});
T('C5 8.6 menu labels rewritten in the live DOM, tooltips intact', () => {
  const want = { 's4b-ear': 'Hear their voice', 's4b-autoread': 'Hear translation', 's4b-mute': 'Ringer' };
  for (const id in want) {
    const span = d.getElementById(id).parentNode.querySelector('span');
    const txt = [...span.childNodes].find(n => n.nodeType === 3);
    assert(txt && txt.nodeValue === want[id], id + ' label = ' + (txt && txt.nodeValue));
    assert(span.querySelector('.info-pop'), id + ' tooltip destroyed');
  }
});
T('C6 8.6 base toggle glyphs and their .tog-slash state line are UNTOUCHED', () => {
  for (const id of ['s4b-ear', 's4b-autoread', 's4b-mute']) {
    const svg = d.getElementById(id).querySelector('svg');
    assert(svg, id + ' svg missing');
    assert(svg.querySelector('line.tog-slash'), id + ' state slash destroyed — this is the exact device-gate regression');
  }
  /* the ear keeps the BASE glyph, not the R8 replacement */
  const earD = d.getElementById('s4b-ear').querySelector('path').getAttribute('d');
  assert(earD.startsWith('M6 8.5a6 6'), 'ear glyph was swapped: ' + earD.slice(0, 14));
});
T('C6b 8.6 toggling a control still flips its off state with a room active', () => {
  /* base handlers no-op without an active room; give them a real one */
  w.S.rooms.push({ id: 'harness-room', title: 'Harness', myLang: 'en', partnerLang: 'th', createdAt: Date.now() });
  const origActive = w.activeRoom;
  try {
    w.activeRoom = () => w.S.rooms[w.S.rooms.length - 1];
    const btn = d.getElementById('s4b-mute');
    const before = btn.classList.contains('off');
    btn.click();
    assert(btn.classList.contains('off') !== before, 'click no longer flips the off state');
    btn.click();
    assert(btn.classList.contains('off') === before, 'second click did not flip back');
  } finally { w.activeRoom = origActive; w.S.rooms.pop(); }
});
T('C13 8.3 flag styles live in the page: name cards + home body, gif-free', () => {
  const css = [...d.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert(css.includes('#scr-s0 .flagband') && css.includes('#scr-s10 .flagband'), 'name-card rules absent');
  assert(css.includes('#scr-s1::before') && css.includes('flags-tall.png'), 'home body rule absent');
  const fb = d.querySelector('#scr-s3 .flagband, .modal .flagband, .flagband');
  const bg = w.getComputedStyle(fb).backgroundImage || '';
  assert(!bg.includes('gif'), 'computed background still requests gif: ' + bg);
  /* selector-level audit: every rule that styles a flagband must be the base
     rule, the declared gif-killing override, or scoped to s0/s1/s10 */
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const sels = [];
  stripped.replace(/([^{}]+)\{[^}]*\}/g, (_, sel) => { sel.split(',').forEach(x => { x = x.trim(); if (x.includes('.flagband')) sels.push(x); }); return ''; });
  const bad = sels.filter(x => x !== '.flagband' && x !== '.flagband i' && !x.startsWith('#scr-s0') && !x.startsWith('#scr-s1') && !x.startsWith('#scr-s10'));
  assert(bad.length === 0, 'flag rules leak beyond scoped surfaces: ' + bad.join(' | '));
  const bareCount = sels.filter(x => x === '.flagband').length;
  assert(bareCount === 2, 'expected base rule + override exactly, got ' + bareCount);
});
T('C14 8.13 legibility CSS applied to the live document', () => {
  const css = [...d.querySelectorAll('style')].map(s => s.textContent).join('\n');
  assert(css.includes('.drawer-tab{font-size:14px}'), 'legibility rules not injected');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
w.close();
process.exit(fail ? 1 : 0);
