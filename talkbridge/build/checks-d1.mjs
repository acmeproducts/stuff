#!/usr/bin/env node
/* The four pre-push structural checks for the D1 diagnostic build:
   syntax, HTML structure, wire, runtime.

   Each check is verified to catch its own failure: `--selftest` feeds every
   check a deliberately broken copy and fails unless the check rejects it.

   Usage: node checks-d1.mjs [built.html] [--selftest]                        */

import { readFileSync } from 'fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const builtP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn27-ship-diag1.html';
const selftest = process.argv.includes('--selftest');
const built = readFileSync(builtP, 'utf8');

function scripts(html) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

/* 1 · SYNTAX — every inline script parses. */
function checkSyntax(html) {
  const blocks = scripts(html);
  if (!blocks.length) throw new Error('no inline script found');
  blocks.forEach((code, i) => {
    try { new vm.Script(code, { filename: 'inline-' + i + '.js' }); }
    catch (e) { throw new Error('inline script ' + i + ' does not parse: ' + e.message); }
  });
  return blocks.length + ' inline script block(s) parse';
}

/* 2 · HTML STRUCTURE — the document closes what it opens. */
function checkStructure(html) {
  const pairs = ['html', 'head', 'body', 'script', 'style'];
  for (const tag of pairs) {
    const open = (html.match(new RegExp('<' + tag + '\\b', 'gi')) || []).length;
    const close = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length;
    if (open !== close) throw new Error('<' + tag + '> unbalanced: ' + open + ' open, ' + close + ' close');
  }
  if (!/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html)) throw new Error('document does not end with the expected closing tags');
  return 'tags balanced, document closes cleanly';
}

/* 3 · WIRE — every element id the appended part names exists in the document. */
function checkWire(html) {
  const tail = '\n</script>\n</body>\n</html>';
  const partStart = html.lastIndexOf('/* ═══════════ GAP PART · D1-call-diagnostics.js');
  if (partStart === -1) throw new Error('the D1 part is not present in the build');
  const region = html.slice(partStart, html.length - tail.length);
  const ids = new Set();
  let m;
  const re = /(?:getElementById|\$)\(\s*'([a-z0-9-]+)'\s*\)/gi;
  while ((m = re.exec(region))) ids.add(m[1]);
  for (const id of ids) {
    if (!new RegExp('id="' + id + '"').test(html) && !new RegExp("id='" + id + "'").test(html)) {
      throw new Error('appended part references #' + id + ', which does not exist');
    }
  }
  return ids.size + ' element reference(s) in the appended part resolve';
}

/* 4 · RUNTIME — the artifact boots and the instrument comes up live. */
async function checkRuntime(html) {
  const errors = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn27-ship-diag1.html',
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} removeEventListener() {} set onopen(f) {} set onmessage(f) {} set onclose(f) {} set onerror(f) {} };
      w.RTCPeerConnection = class { constructor() {} addEventListener() {} removeEventListener() {} getConfiguration() { return {}; } createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; } createOffer() { return Promise.resolve({}); } setLocalDescription() { return Promise.resolve(); } getStats() { return Promise.resolve({ forEach() {} }); } close() {} };
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} };
      w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } };
      w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    }
  });
  await new Promise((r) => setTimeout(r, 1500));
  const w = dom.window;
  if (errors.length) throw new Error('uncaught error during boot: ' + errors.join(' | '));
  if (!w.TBD1 || typeof w.TBD1.tick !== 'function') throw new Error('the instrument did not come up');
  if (!(w.debugLog || []).some((r) => r.ev === 'd1_build')) throw new Error('no d1_build line after boot');
  const n = (w.debugLog || []).length;
  dom.window.close();
  return 'boots clean, instrument live, ' + n + ' log lines at boot';
}

const CHECKS = [
  { id: '1 syntax', run: checkSyntax, break: (h) => h.replace('var TBD1 = (function () {', 'var TBD1 = (function () { {{{') },
  { id: '2 structure', run: checkStructure, break: (h) => h.replace('</body>\n</html>', '</html>') },
  { id: '3 wire', run: checkWire, break: (h) => h.replace("L('d1_build',", "document.getElementById('no-such-element'); L('d1_build',") },
  { id: '4 runtime', run: checkRuntime, break: (h) => h.replace("var TBD1 = (function () {", "var TBD1 = (function () { throw new Error('deliberate');") }
];

let fail = 0;
for (const c of CHECKS) {
  try {
    const detail = await c.run(built);
    console.log('  ok  ' + c.id + ' — ' + detail);
  } catch (e) {
    console.log('FAIL  ' + c.id + ' — ' + ((e && e.message) || e));
    fail++;
  }
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
