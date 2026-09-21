#!/usr/bin/env node
/* The four pre-push structural checks for 27·ship candidate 6: syntax, HTML
   structure, wire, runtime. `--selftest` feeds every check a deliberately
   broken copy and fails unless the check rejects it. */
import { readFileSync } from 'fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const builtP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn27-ship.html';
const selftest = process.argv.includes('--selftest');
const built = readFileSync(builtP, 'utf8');
const MARKERS = ['GAP PART · D1-call-diagnostics.js', 'GAP PART · C1-signal-queue.js', 'GAP PART · V2-relay-retry.js', 'GAP PART · C3-joiner-restart.js', 'GAP PART · C2-stall-frames.js'];

function scripts(html) { const out = []; const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; while ((m = re.exec(html))) out.push(m[1]); return out; }
function checkSyntax(html) { const b = scripts(html); if (!b.length) throw new Error('no inline script'); b.forEach((c, i) => { try { new vm.Script(c, { filename: 'inline-' + i + '.js' }); } catch (e) { throw new Error('inline script ' + i + ' does not parse: ' + e.message); } }); return b.length + ' inline script block(s) parse'; }
function checkStructure(html) {
  for (const tag of ['html', 'head', 'body', 'script', 'style']) { const o = (html.match(new RegExp('<' + tag + '\\b', 'gi')) || []).length, c = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length; if (o !== c) throw new Error('<' + tag + '> unbalanced'); }
  if (!/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html)) throw new Error('document does not end cleanly');
  const idx = MARKERS.map((mk) => html.indexOf(mk));
  idx.forEach((i, k) => { if (i === -1) throw new Error('part missing: ' + MARKERS[k]); if (k && i < idx[k - 1]) throw new Error('parts out of order at ' + MARKERS[k]); });
  return 'tags balanced, five parts present in order (D1, V-1, V-2, V-3, V-4)';
}
function checkWire(html) {
  const tail = '\n</script>\n</body>\n</html>'; const start = html.indexOf('/* ═══════════ ' + MARKERS[0]);
  if (start === -1) throw new Error('appended region not found');
  const region = html.slice(start, html.length - tail.length); const ids = new Set(); let m; const re = /(?:getElementById|\$)\(\s*'([a-z0-9-]+)'\s*\)/gi;
  while ((m = re.exec(region))) ids.add(m[1]);
  for (const id of ids) if (!new RegExp('id=["\']' + id + '["\']').test(html)) throw new Error('appended part references #' + id + ', which does not exist');
  for (const sym of ['function relaySend(', 'function relaySendWhenOpen(', 'function relayConnect(', 'CALL.runRecovery = function', 'CALL.startVideoWatchdog = function', 'CALL.stopVideoWatchdog = function', 'onSignal:async function', "addEventListener('popstate'"]) if (html.slice(0, start).indexOf(sym) === -1) throw new Error('baseline symbol missing: ' + sym);
  return ids.size + ' element reference(s) resolve; all wrap targets and the back-button absorber exist in the baseline';
}
async function checkRuntime(html) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, { url: 'https://acmeproducts.github.io/stuff/bridge-turn27-ship.html', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} removeEventListener() {} set onopen(f) {} set onmessage(f) {} set onclose(f) {} set onerror(f) {} };
      w.RTCPeerConnection = class { constructor() {} addEventListener() {} removeEventListener() {} getConfiguration() { return {}; } createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; } createOffer() { return Promise.resolve({}); } setLocalDescription() { return Promise.resolve(); } getStats() { return Promise.resolve({ forEach() {} }); } close() {} };
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createAnalyser() { return { connect() {}, disconnect() {}, getByteFrequencyData() {}, frequencyBinCount: 32 }; } resume() { return Promise.resolve(); } close() { return Promise.resolve(); } };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no hw'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
      w.Notification = class { static requestPermission() { return Promise.resolve('denied'); } }; w.Notification.permission = 'default';
      w.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
      w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.addEventListener('error', (e) => errors.push(String(e.message || e.error)));
    } });
  await new Promise((r) => setTimeout(r, 1500));
  const w = dom.window;
  if (errors.length) throw new Error('uncaught error during boot: ' + errors.join(' | '));
  if (!w.TBD1) throw new Error('D1 instrument did not come up');
  if (!/_relaySend\.apply/.test(String(w.relaySend))) throw new Error('relaySend is not the V-1 wrapper');
  if (!/_relayConnect\.apply/.test(String(w.relayConnect))) throw new Error('relayConnect is not the V-2 wrapper');
  if (!/_runRecovery/.test(String(w.CALL.runRecovery))) throw new Error('CALL.runRecovery is not the V-3 wrapper');
  if (!/_start\.apply/.test(String(w.CALL.startVideoWatchdog))) throw new Error('CALL.startVideoWatchdog is not the V-4 wrapper');
  if (typeof w.CALL.enterPip !== 'function') throw new Error('corner-band video surface missing');
  dom.window.close();
  return 'boots clean; V-1..V-4 wrappers installed; corner-band surface live';
}
const CHECKS = [
  { id: '1 syntax', run: checkSyntax, break: (h) => h.replace('var C1_TRIES = 40;', 'var C1_TRIES = 40; {{{') },
  { id: '2 structure', run: checkStructure, break: (h) => h.replace('GAP PART · V2-relay-retry.js', 'GAP PART · V2-gone.js') },
  { id: '3 wire', run: checkWire, break: (h) => h.replace('var C2_MS = 2000;', "var C2_MS = 2000; document.getElementById('no-such-element');") },
  { id: '4 runtime', run: checkRuntime, break: (h) => h.replace("if (typeof relayConnect !== 'function') return;", 'return;') }
];
let fail = 0;
for (const c of CHECKS) { try { console.log('  ok  ' + c.id + ' — ' + await c.run(built)); } catch (e) { console.log('FAIL  ' + c.id + ' — ' + ((e && e.message) || e)); fail++; } }
if (selftest) { console.log('\nself-test: each check must reject its own deliberate breakage'); for (const c of CHECKS) { let caught = false; try { await c.run(c.break(built)); } catch (_) { caught = true; } if (caught) console.log('  ok  ' + c.id + ' catches its own failure'); else { console.log('FAIL  ' + c.id + ' passed a broken build'); fail++; } } }
console.log(fail ? '\n' + fail + ' check failure(s)' : '\nall checks green');
process.exit(fail ? 1 : 0);
