#!/usr/bin/env node
/* The four pre-push structural checks for 28·base (flattened relay path): syntax, HTML
   structure, wire, runtime. `--selftest` feeds every check a deliberately
   broken copy and fails unless the check rejects it. */
import { readFileSync } from 'fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const builtP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn28-base.html';
const selftest = process.argv.includes('--selftest');
const built = readFileSync(builtP, 'utf8');
const MARKERS = ['GAP PART · C1-signal-queue.js', 'GAP PART · V2-relay-retry.js', 'GAP PART · C3-joiner-restart.js', 'GAP PART · C2-stall-frames.js', 'GAP PART · S2-back-absorb.js', 'GAP PART · F1-flip-keeps-sender.js', 'GAP PART · K1-device-ids.js', 'GAP PART · K2-pb-merge.js', 'GAP PART · K4-rename-lww.js', 'GAP PART · T1-render-coalesce.js', 'GAP PART · T2-log-hygiene.js', 'GAP PART · T3-wrap-map.js', 'GAP PART · D10-tag-enter.js', 'GAP PART · FL1-relay-path.js'];

function scripts(html) { const out = []; const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; while ((m = re.exec(html))) out.push(m[1]); return out; }
function checkSyntax(html) { const b = scripts(html); if (!b.length) throw new Error('no inline script'); b.forEach((c, i) => { try { new vm.Script(c, { filename: 'inline-' + i + '.js' }); } catch (e) { throw new Error('inline script ' + i + ' does not parse: ' + e.message); } }); return b.length + ' inline script block(s) parse'; }
function checkStructure(html) {
  for (const tag of ['html', 'head', 'body', 'script', 'style']) { const o = (html.match(new RegExp('<' + tag + '\\b', 'gi')) || []).length, c = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length; if (o !== c) throw new Error('<' + tag + '> unbalanced'); }
  if (!/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html)) throw new Error('document does not end cleanly');
  const idx = MARKERS.map((mk) => html.indexOf(mk));
  idx.forEach((i, k) => { if (i === -1) throw new Error('part missing: ' + MARKERS[k]); if (k && i < idx[k - 1]) throw new Error('parts out of order at ' + MARKERS[k]); });
  if (html.indexOf('GAP PART · D1-call-diagnostics.js') !== -1) throw new Error('the D1 instrument is present — it was declared removed');
  return 'tags balanced, fourteen part markers in order (the thirteen of 27·post-ship, then FL-1); D1 absent';
}
function checkWire(html) {
  const tail = '\n</script>\n</body>\n</html>'; const start = html.indexOf('/* ═══════════ ' + MARKERS[0]);
  if (start === -1) throw new Error('appended region not found');
  const region = html.slice(start, html.length - tail.length); const ids = new Set(); let m; const re = /(?:getElementById|\$)\(\s*'([a-z0-9-]+)'\s*\)/gi;
  while ((m = re.exec(region))) ids.add(m[1]);
  for (const id of ids) if (!new RegExp('id=["\']' + id + '["\']').test(html)) throw new Error('appended part references #' + id + ', which does not exist');
  for (const sym of ['function relaySendWhenOpen(', 'CALL.runRecovery = function', 'CALL.startVideoWatchdog = function', 'CALL.stopVideoWatchdog = function', 'onSignal:async function', 'function tbSwapTap', 'function tbFlipCamera', 'history.pushState({tbCall:1}', 'function camSenders()', 'function replaceSenderTrack(', 'function uid()', 'function pbWriteBack()', 'function pbPull()', 'function onRoomNameSignal(', 'function renameRoom(', 'function renderTranscript()', 'function renderPanel()', 'function renderHome()', 'function log(', 'function pbAddTagTo(', 'function pbRerenderCard(', 'function renderPbList()', 'var LISTEN={', 'function cr3Apply(', 'function onLifecycleSignal(', 'function p6OnInvite(', 'function sendReadReceipts(']) if (html.slice(0, start).indexOf(sym) === -1) throw new Error('baseline symbol missing: ' + sym);
  const fl = html.indexOf('GAP PART · FL1-relay-path.js'); if (fl === -1) throw new Error('FL-1 missing');
  for (const sym of ['function relaySend(', 'function relayConnect(', 'function reconnectRelayNow(', 'LISTEN.open = function', 'LISTEN.handle = function', 'function handleRelay(']) { if (html.slice(0, fl).indexOf(sym) !== -1) throw new Error('flattened symbol still defined in the base: ' + sym); if (html.slice(fl).indexOf(sym) === -1) throw new Error('flattened symbol missing from FL-1: ' + sym); }
  return ids.size + ' element reference(s) resolve; every helper FL-1 calls exists in the base; the six flattened symbols are defined once, in FL-1 only';
}
async function checkRuntime(html) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, { url: 'https://acmeproducts.github.io/stuff/bridge-turn28-base.html', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
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
  if (typeof w.TBD1 !== 'undefined') throw new Error('D1 instrument is still live — it was declared removed');
  if (!w.TB_WRAP_MAP || !w.debugLog.some((l) => l.ev === 'wrap_map')) throw new Error('T-3 wrap_map did not come up');
  if (!/^[a-z0-9]{1,8}-/.test(w.uid())) throw new Error('uid is not the K-1 wrapper');
  if (!/_pbWriteBack/.test(String(w.pbWriteBack))) throw new Error('pbWriteBack is not the K-2 wrapper');
  if (!/_onRoomNameSignal/.test(String(w.onRoomNameSignal))) throw new Error('onRoomNameSignal is not the K-4 wrapper');
  if (!/pending/.test(String(w.renderTranscript))) throw new Error('renderTranscript is not the T-1 latch');
  if (!/LIMITED/.test(String(w.log))) throw new Error('log is not the T-2 wrapper');
  if (!/_pbAddTagTo/.test(String(w.pbAddTagTo))) throw new Error('pbAddTagTo is not the D-10 wrapper');
  for (const s of ['relaySend', 'relayConnect', 'reconnectRelayNow', 'LISTEN.open', 'LISTEN.handle', 'handleRelay']) { if (w.TB_WRAP_MAP[s]) throw new Error(s + ' is still wrapped: ' + JSON.stringify(w.TB_WRAP_MAP[s])); }
  if (!/c1_queued/.test(String(w.relaySend)) || !/v2Schedule/.test(String(w.relayConnect)) || !/handleRelayCore/.test(String(w.handleRelay)) || !/listenHandleCore/.test(String(w.LISTEN.handle))) throw new Error('a flattened symbol is not the FL-1 function');
  if (!/_runRecovery/.test(String(w.CALL.runRecovery))) throw new Error('CALL.runRecovery is not the V-3 wrapper');
  if (!/_start\.apply/.test(String(w.CALL.startVideoWatchdog))) throw new Error('CALL.startVideoWatchdog is not the V-4 wrapper');
  if (typeof w.tbSwapTap !== 'function' || typeof w.tbFlipCamera !== 'function') throw new Error('c5 video surface missing');
  if (!/_camSenders\.apply/.test(String(w.camSenders))) throw new Error('camSenders is not the F-1 wrapper');
  dom.window.close();
  return 'boots clean; D1 gone; carried wrappers, K-1/K-2/K-4, T-1/T-2/T-3, D-10 installed; the six relay-path symbols are flat (no wrap_map entry); wrap_map logged; c5 swap/flip surface live';
}
const CHECKS = [
  { id: '1 syntax', run: checkSyntax, break: (h) => h.replace('var C1_TRIES = 40;', 'var C1_TRIES = 40; {{{') },
  { id: '2 structure', run: checkStructure, break: (h) => h.replace('GAP PART · K2-pb-merge.js', 'GAP PART · K2-gone.js') },
  { id: '3 wire', run: checkWire, break: (h) => h.replace('function handleRelayCore(d) {', "function handleRelayCore(d) { document.getElementById('no-such-element');") },
  { id: '4 runtime', run: checkRuntime, break: (h) => h.replace('function handleRelay(d) {', 'var _flH = handleRelay; handleRelay = function (d) { return _flH.apply(this, arguments); };\nfunction handleRelay(d) {') }
];
let fail = 0;
for (const c of CHECKS) { try { console.log('  ok  ' + c.id + ' — ' + await c.run(built)); } catch (e) { console.log('FAIL  ' + c.id + ' — ' + ((e && e.message) || e)); fail++; } }
if (selftest) { console.log('\nself-test: each check must reject its own deliberate breakage'); for (const c of CHECKS) { let caught = false; try { await c.run(c.break(built)); } catch (_) { caught = true; } if (caught) console.log('  ok  ' + c.id + ' catches its own failure'); else { console.log('FAIL  ' + c.id + ' passed a broken build'); fail++; } } }
console.log(fail ? '\n' + fail + ' check failure(s)' : '\nall checks green');
process.exit(fail ? 1 : 0);
