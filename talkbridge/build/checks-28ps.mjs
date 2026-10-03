#!/usr/bin/env node
/* The four pre-push structural checks for 28·pre-ship (flattened call, X-2,
   G-1): syntax, HTML structure, wire, runtime. `--selftest` feeds every
   check a deliberately broken copy and fails unless the check rejects it. */
import { readFileSync } from 'fs';
import vm from 'node:vm';
import { JSDOM, VirtualConsole } from 'jsdom';

const builtP = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'bridge-turn28-pre-ship.html';
const selftest = process.argv.includes('--selftest');
const built = readFileSync(builtP, 'utf8');
const MARKERS = ['A-session-and-transcription', 'B-language-resolution', 'C-call-recovery', 'E-speech-sequence', 'F-transcript-proof', 'R-room-card', 'J-joiner-shell', 'L-room-lifecycle', 'T-net-robustness', 'M-room-menu', 'S-receipts', 'RB-ribbon', 'R8-fine-touches', 'NP-no-password', 'LG-legibility', 'R8b-call-surface', 'R9-phrasebook-mirror', 'C1-signal-queue', 'V2-relay-retry', 'C3-joiner-restart', 'C2-stall-frames', 'S2-back-absorb', 'F1-flip-keeps-sender', 'K1-device-ids', 'K2-pb-merge', 'K4-rename-lww', 'T1-render-coalesce', 'T2-log-hygiene', 'T3-wrap-map', 'D10-tag-enter', 'FL1-relay-path', 'I1-app-face', 'FL2-call', 'X2-check-button', 'G1-google-first'].map((n) => 'GAP PART · ' + n + '.js');
const CALL_SYMBOLS = ['CALL.keys', 'CALL.start', 'CALL.onIncoming', 'CALL.accept', 'CALL.onAccepted', 'CALL.mount', 'CALL.onSignal', 'CALL.runRecovery', 'CALL.startVideoWatchdog', 'CALL.stopVideoWatchdog', 'CALL.toggleMic', 'CALL.hangUp', 'CALL.teardown', 'camSenders', 'replaceSenderTrack'];

function scripts(html) { const out = []; const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi; let m; while ((m = re.exec(html))) out.push(m[1]); return out; }
function checkSyntax(html) { const b = scripts(html); if (!b.length) throw new Error('no inline script'); b.forEach((c, i) => { try { new vm.Script(c, { filename: 'inline-' + i + '.js' }); } catch (e) { throw new Error('inline script ' + i + ': ' + e.message); } }); return b.length + ' inline script(s) parse'; }
function checkStructure(html) {
  for (const tag of ['html', 'head', 'body', 'script', 'style']) { const o = (html.match(new RegExp('<' + tag + '\\b', 'gi')) || []).length, c = (html.match(new RegExp('</' + tag + '>', 'gi')) || []).length; if (o !== c) throw new Error('<' + tag + '> open/close mismatch ' + o + '/' + c); }
  if (!/<\/script>\s*<\/body>\s*<\/html>\s*$/.test(html)) throw new Error('document does not end cleanly');
  const idx = MARKERS.map((mk) => html.indexOf(mk));
  idx.forEach((i, k) => { if (i === -1) throw new Error('part missing: ' + MARKERS[k]); if (k && i < idx[k - 1]) throw new Error('parts out of order at ' + MARKERS[k]); });
  if (html.indexOf('GAP PART · D1-call-diagnostics.js') !== -1) throw new Error('the D1 instrument is present — it was declared removed');
  for (const once of ['#n10-out{position:absolute', 'var C3_HOLD_MS', 'var C2_MS', 'function f1Tag(', 'CALL._c3LastServed = 0;', 'CALL.c2Timer = null;']) { const n = html.split(once).length - 1; if (n !== 1) throw new Error('"' + once + '" occurs ' + n + ' times (the absorbed block must live once, in FL-2)'); }
  return 'tags balanced, ' + MARKERS.length + ' part markers in order (the fifteen of 28·base, then FL-2, X-1, G-1); D1 absent; each absorbed block lives once';
}
function checkWire(html) {
  const tail = '\n</script>\n</body>\n</html>'; const start = html.indexOf('/* ═══════════ GAP PART · FL2-call.js');
  if (start === -1) throw new Error('appended region not found');
  const region = html.slice(start, html.length - tail.length); const ids = new Set(); let m; const re = /(?:getElementById|\$)\(\s*'([a-z0-9-]+)'\s*\)/gi;
  while ((m = re.exec(region))) ids.add(m[1]);
  const created = new Set(['n10-out', 'n10-name', 'n10-sub', 'n10-mic', 'n10-btns', 'n10-cancel', 'n10-lb', 'scr-room']);
  for (const id of ids) if (!created.has(id) && !new RegExp('id=["\']' + id + '["\']').test(html)) throw new Error('appended part references #' + id + ', which does not exist');
  for (const id of created) if (id !== 'scr-room' && !new RegExp('id="' + id + '"|#' + id + '\\b|\\.id = \'' + id + '\'').test(region)) throw new Error('FL-2 element #' + id + ' is never created');
  const fl = html.indexOf('GAP PART · FL2-call.js'); if (fl === -1) throw new Error('FL-2 missing');
  const before = html.slice(0, fl), after = html.slice(fl);
  for (const sym of ['CALL.runRecovery = function', 'CALL.startVideoWatchdog = function', 'CALL.stopVideoWatchdog = function', 'CALL.toggleMic = function', 'function camSenders(', 'function replaceSenderTrack(', '_origStart', '_c3OnSignal', '_f1Cam', 'tbN10Teardown', '_n18Accept']) { if (before.indexOf(sym) !== -1) throw new Error('"' + sym + '" still exists before FL-2 — a layer was not removed'); }
  const lit = before.slice(before.indexOf('var CALL={'), before.indexOf('\n};', before.indexOf('var CALL={')));
  for (const mem of ['keys', 'start', 'onIncoming', 'accept', 'onAccepted', 'mount', 'setupPC', 'onSignal', 'toggleMic', 'toggleCam', 'hangUp', 'teardown']) { if (new RegExp('^  ' + mem + ':\\s*(async\\s*)?function', 'm').test(lit)) throw new Error('CALL.' + mem + ' is still a member of the base literal'); }
  for (const mem of ['acquire', 'stopRing', 'decline', 'onDeclined', 'onRemoteEnd', 'flushCands', 'resendOffer', 'remoteMic', 'remoteCam', 'enterPip', 'exitPip', 'endPill', 'micConstraints']) { if (!new RegExp('^  ' + mem + ':\\s*(async\\s*)?function', 'm').test(lit)) throw new Error('CALL.' + mem + ' left the base literal — it was not declared removed'); }
  for (const s of CALL_SYMBOLS) { const n = (after.match(new RegExp('^(?:' + s.replace('.', '\\.') + ' = (?:async )?function|function ' + s + '\\()', 'mg')) || []).length; if (n !== 1) throw new Error(s + ' bound ' + n + ' times after FL-2 (must be 1)'); }
  for (const sym of ['CALL.setupPC = async function', 'CALL.toggleCam = function', 'CALL.resetRecoveryState = function', 'CALL.armConnectTimeout = function', 'CALL.startKeepalive = function', 'CALL.stopKeepalive = function', 'function micSenders(', 'function startCallTimer(', 'function stopCallTimer(', 'function callDuration(', 'function tbClearPos(', 'function p4CloseTag(', 'function p4PresentedClose(', 'function cr3Attended(', 'function grantRecord(', 'function grantedCreds(', 'function grantExpired(', 'var RM = ', 'function rmLog(', 'function r8Log(', 'function netLog(', 'function cr3Log(', 'var TB_SWAP = ', 'var GEN', 'function translateWithRetry(', 'var trCache=', 'function cleanTr(', 'function gL(', 'function toast(', 'function metaHtml(', 'function wireMsg(']) { if (before.indexOf(sym) === -1 && !new RegExp(sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('var GEN', 'var GEN\\b')).test(before)) throw new Error('helper the parts call is missing from the base: ' + sym); }
  return ids.size + ' element reference(s) resolve; the twelve base members are gone and the thirteen kept ones remain; the fifteen call symbols are bound once each, in FL-2; every helper the parts call exists before them';
}
async function checkRuntime(html) {
  const errors = []; const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const dom = new JSDOM(html, { url: 'https://acmeproducts.github.io/stuff/bridge-turn28-pre-ship.html', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.WebSocket = class { constructor() { this.readyState = 0; } send() {} close() {} addEventListener() {} removeEventListener() {} set onopen(f) {} set onmessage(f) {} set onclose(f) {} set onerror(f) {} };
      w.RTCPeerConnection = class { constructor() {} addEventListener() {} removeEventListener() {} getConfiguration() { return {}; } createDataChannel() { return { readyState: 'open', send() {}, close() {}, addEventListener() {} }; } createOffer() { return Promise.resolve({}); } setLocalDescription() { return Promise.resolve(); } getStats() { return Promise.resolve({ forEach() {} }); } close() {} getSenders() { return []; } };
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
  if (!w.TB_WRAP_MAP || !w.debugLog.some((l) => l.ev === 'wrap_map')) throw new Error('T-3 wrap_map did not come up');
  for (const s of ['relaySend', 'relayConnect', 'reconnectRelayNow', 'LISTEN.open', 'LISTEN.handle', 'handleRelay']) { if (w.TB_WRAP_MAP[s]) throw new Error(s + ' is still wrapped: ' + JSON.stringify(w.TB_WRAP_MAP[s])); }
  /* T-3 learns member names from every root object, so a `CALL.x = function` first binding in FL-2 is listed under FL-2 alone; a second name there would be a wrapper */
  for (const s of CALL_SYMBOLS) { const e = w.TB_WRAP_MAP[s]; if (e && !(e.length === 1 && e[0] === 'FL2-call.js')) throw new Error(s + ' is wrapped beyond its FL-2 definition: ' + JSON.stringify(e)); }
  const want = { start: 'callStartCore', onIncoming: 'callOnIncomingCore', accept: 'callAcceptCore', onAccepted: 'callOnAcceptedCore', mount: 'callMountCore', onSignal: 'callOnSignalGlare', hangUp: 'callHangUpCore', teardown: 'callTeardownCore', keys: 'grantedCreds', runRecovery: 'C3_HOLD_MS', startVideoWatchdog: 'C2_STILL', stopVideoWatchdog: 'c2Timer', toggleMic: 'dgWasOnBeforeMute' };
  for (const k of Object.keys(want)) if (!String(w.CALL[k]).includes(want[k])) throw new Error('CALL.' + k + ' is not the FL-2 function');
  if (!/__tbVideoSender/.test(String(w.camSenders)) || !/f1Tag/.test(String(w.replaceSenderTrack))) throw new Error('camSenders/replaceSenderTrack are not the FL-2 functions');
  if (!/callStartCore|callAcceptCore/.test(String(w.CALL.start) + String(w.CALL.accept)) || /_start\.apply|_accept\.apply/.test(String(w.CALL.start) + String(w.CALL.accept))) throw new Error('a wrapper chain survives on start/accept');
  if (!/_translateWithRetry/.test(String(w.translateWithRetry)) || !/googleapis/.test(String(w.translateWithRetry))) throw new Error('translateWithRetry is not the G-1 wrapper');
  if (!w.document.getElementById('n10-out') || w.document.getElementById('n10-out').parentNode.id !== 'scr-room') throw new Error('the caller screen is not mounted in #scr-room');
  if (typeof w.backCheck !== 'function' || !/_wireMsg/.test(String(w.wireMsg)) || !/data-hact', 'check'/.test(String(w.wireMsg))) throw new Error('the translation check button (X-2) is not installed on wireMsg');
  if (!w.TB_WRAP_MAP.wireMsg || w.TB_WRAP_MAP.wireMsg.slice(-1)[0] !== 'X2-check-button.js') throw new Error('X-2 is not the outermost wireMsg layer: ' + JSON.stringify(w.TB_WRAP_MAP.wireMsg));
  if (!/_pbAddTagTo/.test(String(w.pbAddTagTo))) throw new Error('pbAddTagTo is not the D-10 wrapper');
  if (typeof w.tbSwapTap !== 'function' || typeof w.tbFlipCamera !== 'function') throw new Error('c5 video surface missing');
  if (!/c1_queued/.test(String(w.relaySend)) || !/handleRelayCore/.test(String(w.handleRelay))) throw new Error('FL-1 is no longer in place');
  dom.window.close();
  return 'boots clean; the fifteen call symbols are flat (no wrap_map entry beyond the FL-2 definition, FL-2 bodies); FL-1 and D-10 still in place; caller screen in #scr-room; X-2 check button on wireMsg; G-1 wraps the translator';
}
const CHECKS = [
  { id: '1 syntax', run: checkSyntax, break: (h) => h.replace('var C3_HOLD_MS = 8000;', 'var C3_HOLD_MS = 8000; {{{') },
  { id: '2 structure', run: checkStructure, break: (h) => h.replace('GAP PART · X2-check-button.js', 'GAP PART · X2-gone.js') },
  { id: '3 wire', run: checkWire, break: (h) => h.replace('function callStartCore(kind) {', "function callStartCore(kind) { document.getElementById('no-such-element');") },
  { id: '4 runtime', run: checkRuntime, break: (h) => h.replace('/* ═══════════ GAP PART · X2-check-button.js', "var _flS = CALL.start; CALL.start = function () { return _flS.apply(this, arguments); };\n/* ═══════════ GAP PART · X2-check-button.js") }
];
let fail = 0;
for (const c of CHECKS) { try { console.log('  ok  ' + c.id + ' — ' + await c.run(built)); } catch (e) { console.log('FAIL  ' + c.id + ' — ' + ((e && e.message) || e)); fail++; } }
if (selftest) { console.log('\nself-test: each check must reject its own deliberate breakage'); for (const c of CHECKS) { let caught = false; try { await c.run(c.break(built)); } catch (_) { caught = true; } if (caught) console.log('  ok  ' + c.id + ' catches its own failure'); else { console.log('FAIL  ' + c.id + ' passed a broken file'); fail++; } } }
console.log(fail ? '\n' + fail + ' check failure(s)' : '\nall checks green');
process.exit(fail ? 1 : 0);
