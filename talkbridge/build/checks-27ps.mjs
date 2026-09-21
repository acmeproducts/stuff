#!/usr/bin/env node
/* The four pre-push structural checks for 27·post-ship: syntax, HTML
   structure, wire, runtime. `--selftest` feeds every check a deliberately
   broken copy and fails unless the check rejects it.

   Usage: node checks-27ps.mjs [built.html] [--selftest]                      */

import { readFileSync } from 'fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const builtP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn27-post-ship.html';
const selftest = process.argv.includes('--selftest');
const built = readFileSync(builtP, 'utf8');
const PART_MARKERS = ['GAP PART · D1-call-diagnostics.js', 'GAP PART · C1-signal-queue.js', 'GAP PART · C3-joiner-restart.js', 'GAP PART · C2-stall-frames.js'];

function scripts(html) {
  const out = []; const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

function checkSyntax(html) {
  const blocks = scripts(html);
  if (!blocks.length) throw new Error('no inline script found');
  blocks.forEach((code, i) => { try { new vm.Script(code, { filename: 'inline-' + i + '.js' }); } catch (e) { throw new Error('inline script ' + i + ' does not parse: ' + e.message); } });
  return blocks.length + ' inline script block(s) parse';
}

function checkStructure(html) {
  for (const tag of ['html', 'head', 'body', 'script', 'style']) {
    const open = (html.match(new RegExp('<' + tag + '\\b', 'gi')) || []).length;
    const close = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length;
    if (open !== close) throw new Error('<' + tag + '> unbalanced: ' + open + ' open, ' + close + ' close');
  }
  if (!/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html)) throw new Error('document does not end with the expected closing tags');
  for (const mk of PART_MARKERS) if (html.indexOf(mk) === -1) throw new Error('part missing: ' + mk);
  const idx = PART_MARKERS.map((mk) => html.indexOf(mk));
  for (let i = 1; i < idx.length; i++) if (idx[i] < idx[i - 1]) throw new Error('parts out of order at ' + PART_MARKERS[i]);
  return 'tags balanced, four parts present in order (D1, C-1, C-3, C-2)';
}

function checkWire(html) {
  const tail = '\n</script>\n</body>\n</html>';
  const start = html.indexOf('/* ═══════════ ' + PART_MARKERS[0]);
  if (start === -1) throw new Error('appended region not found');
  const region = html.slice(start, html.length - tail.length);
  const ids = new Set(); let m; const re = /(?:getElementById|\$)\(\s*'([a-z0-9-]+)'\s*\)/gi;
  while ((m = re.exec(region))) ids.add(m[1]);
  for (const id of ids) if (!new RegExp('id=["\']' + id + '["\']').test(html)) throw new Error('appended part references #' + id + ', which does not exist');
  /* every wrapped symbol the parts name must exist in the baseline */
  for (const sym of ['function relaySend(', 'function relaySendWhenOpen(', 'CALL.runRecovery = function', 'CALL.startVideoWatchdog = function', 'CALL.stopVideoWatchdog = function', 'onSignal:async function']) {
    if (html.slice(0, start).indexOf(sym) === -1) throw new Error('baseline symbol not found for wrapping: ' + sym);
  }
  return ids.size + ' element reference(s) resolve; all five wrap targets exist in the baseline';
}

async function checkRuntime(html) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn27-post-ship.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} removeEventListener() {} set onopen(f) {} set onmessage(f) {} set onclose(f) {} set onerror(f) {} };
      w.RTCPeerConnection = class { constructor() {} addEventListener() {} removeEventListener() {} getConfiguration() { return {}; } createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; } createOffer() { return Promise.resolve({}); } setLocalDescription() { return Promise.resolve(); } getStats() { return Promise.resolve({ forEach() {} }); } close() {} };
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} };
      w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } }; w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
  await new Promise((r) => setTimeout(r, 1500));
  const w = dom.window;
  if (errors.length) throw new Error('uncaught error during boot: ' + errors.join(' | '));
  if (!w.TBD1) throw new Error('D1 instrument did not come up');
  for (const f of ['runRecovery', 'onSignal', 'startVideoWatchdog', 'stopVideoWatchdog']) {
    if (typeof w.CALL[f] !== 'function') throw new Error('CALL.' + f + ' missing after boot');
  }
  if (!/_runRecovery\.apply|_runRecovery/.test(String(w.CALL.runRecovery))) throw new Error('CALL.runRecovery is not the C-3 wrapper');
  if (!/_start\.apply/.test(String(w.CALL.startVideoWatchdog))) throw new Error('CALL.startVideoWatchdog is not the C-2 wrapper');
  if (!/_relaySend\.apply/.test(String(w.relaySend))) throw new Error('relaySend is not the C-1 wrapper');
  dom.window.close();
  return 'boots clean; C-1, C-3, C-2 wrappers installed over the baseline functions';
}

const CHECKS = [
  { id: '1 syntax', run: checkSyntax, break: (h) => h.replace('var C1_TRIES = 40;', 'var C1_TRIES = 40; {{{') },
  { id: '2 structure', run: checkStructure, break: (h) => h.replace('GAP PART · C3-joiner-restart.js', 'GAP PART · C3-gone.js') },
  { id: '3 wire', run: checkWire, break: (h) => h.replace('var C2_MS = 2000;', "var C2_MS = 2000; document.getElementById('no-such-element');") },
  { id: '4 runtime', run: checkRuntime, break: (h) => h.replace("if (typeof relaySend !== 'function' || typeof relaySendWhenOpen !== 'function') return;", 'return;') }
];

let fail = 0;
for (const c of CHECKS) {
  try { console.log('  ok  ' + c.id + ' — ' + await c.run(built)); }
  catch (e) { console.log('FAIL  ' + c.id + ' — ' + ((e && e.message) || e)); fail++; }
}
if (selftest) {
  console.log('\nself-test: each check must reject its own deliberate breakage');
  for (const c of CHECKS) {
    let caught = false;
    try { await c.run(c.break(built)); } catch (_) { caught = true; }
    if (caught) console.log('  ok  ' + c.id + ' catches its own failure');
    else { console.log('FAIL  ' + c.id + ' passed a broken build'); fail++; }
  }
}
console.log(fail ? '\n' + fail + ' check failure(s)' : '\nall checks green');
process.exit(fail ? 1 : 0);
