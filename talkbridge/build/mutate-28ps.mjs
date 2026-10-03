#!/usr/bin/env node
/* 28·pre-ship mutation gate (§7.16 M5). Each mutation puts one defect into a
   part (FL-2, X-1 or G-1), or leaves one removed layer in the assembly, or
   edits the base undeclared. The differential harness must go red on the
   NAMED test. Nothing on disk is modified.   TB_MUT_ONLY=<test name> limits the run. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PARTS } from './assemble-28ps.mjs';

const [fl2, x1, g1] = PARTS.map((p) => readFileSync(p, 'utf8'));
const XLOG = 'M3 X.log identical on both builds', YLOG = 'M3 Y.log identical on both builds';
const MUTATIONS = [
  /* FL-2 · an absorbed layer's effect lost */
  { catches: XLOG, name: 'start: the generation no longer bumps (A layer lost)', fl2: (s) => s.replace("  GEN.bump('call_start');                                                        /* A */\n", '') },
  { catches: 'M3 X.n10 identical on both builds', name: 'start: the caller screen no longer shows (N10 layer lost)', fl2: (s) => s.replace("    n10Show(kind);\n", '') },
  { catches: XLOG, name: 'teardown: the generation bumps before the base instead of after (order changed)', fl2: (s) => s.replace("  var r = callTeardownCore.apply(this, arguments);                               /* base */\n  GEN.bump('call_end');                                                          /* A after */", "  GEN.bump('call_end');\n  var r = callTeardownCore.apply(this, arguments);") },
  { catches: YLOG, name: 'onIncoming: a hidden phone rings anyway (CR3 guard lost)', fl2: (s) => s.replace("  if (!cr3Attended()) { cr3Log('ring_deferred_hidden'", "  if (false) { cr3Log('ring_deferred_hidden'") },
  { catches: YLOG, name: 'accept: the answerer\'s clock no longer anchors (N18 layer lost)', fl2: (s) => s.replace("  }).then(function (v) { if (CALL.active) n18Anchor('answerer'); return v; });    /* N18 */", '  });') },
  { catches: YLOG, name: 'accept: the generation no longer bumps (A layer lost)', fl2: (s) => s.replace("  GEN.bump('call_accept');                                                       /* A */\n", '') },
  { catches: 'M3 X.n10 identical on both builds', name: 'onAccepted: the caller screen stays up after the answer (N10 after-block lost)', fl2: (s) => s.replace("    n10Hide();\n    /* G42: nothing to restore", "    /* G42: nothing to restore") },
  { catches: XLOG, name: 'onAccepted: the caller\'s clock no longer anchors (N18 layer lost)', fl2: (s) => s.replace("  if (CALL.active) n18Anchor('caller');                                          /* N18 after */\n", '') },
  { catches: XLOG, name: 'mount: the shared call timer no longer starts (R8b layer lost)', fl2: (s) => s.replace("    startCallTimer();\n    r8Log('call_timer', { caller: !!this.caller }, 'ok');\n", '') },
  { catches: XLOG, name: 'onSignal: the creator no longer serves a restart (C3 layer lost)', fl2: (s) => s.replace("    if (sig && sig.restart && c3IsCreator() && this.active && this.pc) {", "    if (false) {") },
  { catches: YLOG, name: 'onSignal: the joiner no longer answers a fresh ufrag on the same pc (C3 layer lost)', fl2: (s) => s.replace("      if (cur && nxt && cur !== nxt) {", "      if (false) {") },
  { catches: XLOG, name: 'onSignal: a restart inside the gap is served twice (C3 gap lost)', fl2: (s) => s.replace("var C3_MIN_GAP_MS = 8000;", "var C3_MIN_GAP_MS = 0;") },
  { catches: XLOG, name: 'onSignal: glare is no longer ignored (C guard lost)', fl2: (s) => s.replace("    log('rtc_glare_ignored', {}, 'warn');\n    return;", "    log('rtc_glare_ignored', {}, 'warn');") },
  { catches: YLOG, name: 'runRecovery: the joiner takes step 2 alone instead of asking (C3 layer lost)', fl2: (s) => s.replace("        this.recoveryStep + 1 === 2 && this.pc) {", "        false) {") },
  { catches: XLOG, name: 'startVideoWatchdog: the frame sampler is gone (C2 layer lost)', fl2: (s) => s.replace("  if (this.kind !== 'video') return r;\n\n  var armed = false", "  return r;\n\n  var armed = false") },
  { catches: 'M3 X.call identical on both builds', name: 'stopVideoWatchdog: the frame sampler is never cleared (C2 before-block lost)', fl2: (s) => s.replace("  clearInterval(this.c2Timer); this.c2Timer = null;                              /* C2 before */\n", '') },
  { catches: XLOG, name: 'toggleMic: transcription no longer stops with mute (M layer lost)', fl2: (s) => s.replace("      RM.dgWasOnBeforeMute = !!dgActive;\n      stopDeepgram();\n      rmLog('transcription_stopped_for_mute', { wasActive: RM.dgWasOnBeforeMute }, 'ok');", '') },
  { catches: 'M3 X.call identical on both builds', name: 'hangUp: the swapped surface is not put back (c5 layer lost)', fl2: (s) => s.replace("  TB_SWAP = false;\n", '') },
  { catches: XLOG, name: 'teardown: the generation no longer bumps (A layer lost)', fl2: (s) => s.replace("  GEN.bump('call_end');                                                          /* A after */\n", '') },
  { catches: 'M3 X.flip identical on both builds', name: 'camSenders: the tagged sender is dropped (F1 layer lost)', fl2: (s) => s.replace("      if (s && s.__tbVideoSender && found.indexOf(s) === -1) found.push(s);", '') },
  { catches: 'M3 X.pcs identical on both builds', name: 'replaceSenderTrack: a released video sender loses its tag (F1 layer lost)', fl2: (s) => s.replace("    if (sender && track === null && sender.track && sender.track.kind === 'video') f1Tag(sender);\n", '') },
  { catches: 'M3 X.keys identical on both builds', name: 'keys: the grant no longer fills empty keys (CR3 layer lost)', fl2: (s) => s.replace("    if (!rec || (typeof grantExpired === 'function' && grantExpired(rec))) return k;", "    return k;") },
  { catches: 'M3 X.keys identical on both builds', name: 'keys: an expired grant still fills (CR3 expiry lost)', fl2: (s) => s.replace("    if (!rec || (typeof grantExpired === 'function' && grantExpired(rec))) return k;", "    if (!rec) return k;") },
  { catches: 'M3 X.room identical on both builds except the one recorded difference: the caller screen is appended to #scr-room from FL-2\'s position (same parent, same children, same z-index)', name: 'the caller screen z-index moves', fl2: (s) => s.replace('z-index:80;display:none;', 'z-index:90;display:none;') },
  { catches: 'M2.1 the set of log markers in the candidate equals the base set plus exactly the declared additions', name: 'FL-2 logs a new marker', fl2: (s) => s.replace("  GEN.bump('call_start');                                                        /* A */", "  GEN.bump('call_start'); log('fl2_seen', {}, 'info');") },
  { catches: 'M2.3 nothing new on the wire or in the credential path (G19/G20): FL-2 adds no message type; the parts reach only the two translation hosts', name: 'FL-2 sends a new message type', fl2: (s) => s.replace("    try { relaySend({ type: 'call-end', reason: 'cancelled' }); } catch (_) {}", "    try { relaySend({ type: 'call-probe' }); relaySend({ type: 'call-end', reason: 'cancelled' }); } catch (_) {}") },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each call symbol is bound exactly once; no captured previous-layer reference remains', name: 'the N10 caller-screen layer is left in the assembly', keep: ['28-N10-caller-screen-IIFE.js'] },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each call symbol is bound exactly once; no captured previous-layer reference remains', name: 'the T-net toggleMic layer is left in the assembly', keep: ['20-T-toggleMic.js'] },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each call symbol is bound exactly once; no captured previous-layer reference remains', name: 'the C3 joiner-restart layer is left in the assembly', keep: ['31-C3-joiner-restart-IIFE.js'] },
  { catches: 'M1.1 candidate is the assembler\'s output for these parts (every removal by its banked bytes)', name: 'the base is edited beyond the declared removals', mangle: (h) => h.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 20001;') },
  /* X-1 · the check card */
  { catches: 'M4.5 scoring: identical wording is 1, reordered words still match, a different sentence misses, a near sentence is partial; thresholds 0.8 / 0.5; the verdict ignores case and punctuation', name: 'X-1 verdict threshold drifts to 0.9', x1: (s) => s.replace("return score >= 0.8 ? 'match'", "return score >= 0.9 ? 'match'") },
  { catches: 'M4.3 a single tap, taps 400 ms apart, taps on two different bubbles, taps far apart, and taps on a header button or receipt never open the card', name: 'X-1 double-tap window grows to a second', x1: (s) => s.replace('var X1_MS = 350, X1_PX = 30;', 'var X1_MS = 1000, X1_PX = 30;') },
  { catches: 'M4.3 a single tap, taps 400 ms apart, taps on two different bubbles, taps far apart, and taps on a header button or receipt never open the card', name: 'X-1 counts taps on the header buttons', x1: (s) => s.replace("    if (ev.target.closest('[data-hact]') || ev.target.closest('[data-receipt]')) { last = null; return; }\n", '') },
  { catches: 'M4.3 a single tap, taps 400 ms apart, taps on two different bubbles, taps far apart, and taps on a header button or receipt never open the card', name: 'X-1 pairs taps across two bubbles', x1: (s) => s.replace("if (last && last.id === id && now - last.t < X1_MS", "if (last && now - last.t < X1_MS") },
  { catches: 'M4.1 two taps on the same header inside 350 ms / 30 px open the card with Spoken, Translation and a back-translation scored Match', name: 'X-1 forgets the bt_check line', x1: (s) => s.replace("      try { log('bt_check', { id: e.id, ok: true, score: Math.round(score * 100) / 100, verdict: v, ms: Date.now() - t0 }, 'ok'); } catch (_) {}\n", '') },
  { catches: 'M4.1 two taps on the same header inside 350 ms / 30 px open the card with Spoken, Translation and a back-translation scored Match', name: 'X-1 back-translates the wrong way (source → target)', x1: (s) => s.replace("translateWithRetry(tr, e.tgtLang, e.srcLang, 1)", "translateWithRetry(tr, e.srcLang, e.tgtLang, 1)") },
  { catches: 'M4.2 Copy puts the three lines and the verdict on the clipboard; Close hides the card', name: 'X-1 Copy leaves out the back-translation', x1: (s) => s.replace("      + '\\nBack-translation: ' + (cur.__x1Back || document.getElementById('x1-bt').textContent) + '\\n' + document.getElementById('x1-score').textContent;", "      + '\\n' + document.getElementById('x1-score').textContent;") },
  { catches: 'M4.6 a failed back-translation says so and logs bt_check ok:false; a same-language entry asks nothing of the network', name: 'X-1 translates a same-language entry', x1: (s) => s.replace("if (!tr || !e.srcLang || !e.tgtLang || e.srcLang === e.tgtLang) {", "if (!tr || !e.srcLang || !e.tgtLang) {") },
  { catches: 'M4.4 the header\'s own single tap still highlights the bubble, and the header buttons still work (nothing existing moved)', name: 'X-1 swallows the header click', x1: (s) => s.replace("  function bind() { var t = document.getElementById('transcript'); (t || document).addEventListener('pointerup', onUp); }", "  function bind() { var t = document.getElementById('transcript'); (t || document).addEventListener('pointerup', onUp); (t || document).addEventListener('click', function (ev) { if (ev.target.closest('.meta')) ev.stopPropagation(); }, true); }") },
  { catches: 'M2.1 the set of log markers in the candidate equals the base set plus exactly the declared additions', name: 'X-1 logs an undeclared marker', x1: (s) => s.replace("    try { log('x1_card', { id: e.id }, 'ok'); } catch (_) {}", "    try { log('x1_card', { id: e.id }, 'ok'); log('x1_extra', {}, 'ok'); } catch (_) {}") },
  { catches: 'M2.3 nothing new on the wire or in the credential path (G19/G20): FL-2 adds no message type; the parts reach only the two translation hosts', name: 'X-1 reaches an AI host (the deferred tier)', x1: (s) => s.replace("  var cur = null;", "  var cur = null; var X1_AI = 'https://api.venice.ai/v1/chat';") },
  /* G-1 · Google first */
  { catches: 'M5.1 a translation goes to Google first and returns its text; the cache now holds it; the second ask makes no request; the log names the provider', name: 'G-1 asks MyMemory first after all', g1: (s) => s.replace("    var t0 = Date.now();\n    return fetch(", "    var t0 = Date.now();\n    return _translateWithRetry.apply(self, args); return fetch(") },
  { catches: 'M5.1 a translation goes to Google first and returns its text; the cache now holds it; the second ask makes no request; the log names the provider', name: 'G-1 forgets the cache', g1: (s) => s.replace("        keep(k, t);\n", '') },
  { catches: 'M5.1 a translation goes to Google first and returns its text; the cache now holds it; the second ask makes no request; the log names the provider', name: 'G-1 misnames the provider', g1: (s) => s.replace("log('trans_ok', { provider: 'google'", "log('trans_ok', { provider: 'mymemory'") },
  { catches: 'M5.2 when Google fails (network, HTTP error, empty body), MyMemory answers; trans_fallback then trans_ok mymemory; the frozen path is called through once', name: 'G-1 gives up when Google fails instead of falling back', g1: (s) => s.replace("        return Promise.resolve(_translateWithRetry.apply(self, args)).then(function (r) {", "        return Promise.resolve({ text: text, ok: false }).then(function (r) {") },
  { catches: 'M5.2 when Google fails (network, HTTP error, empty body), MyMemory answers; trans_fallback then trans_ok mymemory; the frozen path is called through once', name: 'G-1 treats an HTTP error as a translation', g1: (s) => s.replace("if (!r.ok) throw new Error('google http ' + r.status); ", '') },
  { catches: 'M5.3 when both fail the result is the frozen one (ok:false, text unchanged) after the frozen retries; same-language and empty text never touch the network; zh and fil map to Google\'s codes', name: 'G-1 drops the zh / fil code mapping', g1: (s) => s.replace("var gcode = function (c) { return c === 'zh' ? 'zh-CN' : c === 'fil' ? 'tl' : c; };", "var gcode = function (c) { return c; };") },
  { catches: 'M5.3 when both fail the result is the frozen one (ok:false, text unchanged) after the frozen retries; same-language and empty text never touch the network; zh and fil map to Google\'s codes', name: 'G-1 asks Google for a same-language pair', g1: (s) => s.replace("if (!text || !from || !to || from === to) return _translateWithRetry.apply(self, args);", "if (!text || !from || !to) return _translateWithRetry.apply(self, args);") },
  { catches: 'M5.4 the cache keeps its ceiling under Google (TR_CACHE_MAX)', name: 'G-1 lets the cache grow without bound', g1: (s) => s.replace("    if (trCache.size >= TR_CACHE_MAX) { var first = trCache.keys().next().value; trCache.delete(first); }\n", '') },
  { catches: 'M2.1 the set of log markers in the candidate equals the base set plus exactly the declared additions', name: 'G-1 logs an undeclared marker', g1: (s) => s.replace("        keep(k, t);", "        keep(k, t); log('g1_hit', {}, 'ok');") },
  { catches: 'M2.3 nothing new on the wire or in the credential path (G19/G20): FL-2 adds no message type; the parts reach only the two translation hosts', name: 'G-1 reaches a third host', g1: (s) => s.replace("var gcode = function (c) {", "var G1_ALT = 'https://libretranslate.com/translate'; var gcode = function (c) {") },
];
const ONLY = process.env.TB_MUT_ONLY || null;
const dir = mkdtempSync(path.join(tmpdir(), 'tb-28ps-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  if (ONLY && m.catches !== ONLY) continue;
  const parts = [m.fl2 ? m.fl2(fl2) : fl2, m.x1 ? m.x1(x1) : x1, m.g1 ? m.g1(g1) : g1];
  if (!m.keep && !m.mangle && parts[0] === fl2 && parts[1] === x1 && parts[2] === g1) { console.log('MISS  ' + m.catches + ' — mutation did not apply (source moved?): ' + m.name); missed++; continue; }
  const paths = parts.map((p, j) => { const f = path.join(dir, 'part' + j + '-' + i + '.js'); writeFileSync(f, p); return f; });
  let html = assemble({ parts, keepRemovals: m.keep || [] });
  if (m.mangle) { const b = html; html = m.mangle(html); if (html === b) { console.log('MISS  mangle did not apply: ' + m.name); missed++; continue; } }
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-diff-28ps.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_PARTS_OVERRIDE: paths.join(','), TB_KEEP: (m.keep || []).join(',') } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches.slice(0, 44) + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches.slice(0, 44) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + (out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 60)).join(' | ')) + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
