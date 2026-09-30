#!/usr/bin/env node
/* 28·base mutation gate (§7.16 M5). Each mutation puts one defect into the
   flat part, or leaves one removed layer in the assembly, or edits the base
   undeclared. The differential harness must go red on the NAMED test.
   Nothing on disk is modified.   TB_MUT_ONLY=M3 X.log limits the run.      */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PART, PARTS2 } from './assemble-28b.mjs';

const src = readFileSync(PART, 'utf8');
const src2 = readFileSync(PARTS2[0], 'utf8');
const sw3 = readFileSync('tb-sw3.js', 'utf8');
const man = readFileSync('tb-manifest-turn28.webmanifest', 'utf8');
const MUTATIONS = [
  { catches: 'M3 X.wire identical on both builds', name: 'read receipts no longer sent after a message (S layer lost)', apply: (s) => s.replace("    try { sendReadReceipts(); } catch (_) {}\n", '') },
  { catches: 'M3 X.log identical on both builds', name: 'the presence dot no longer reads the peer count (PR3 layer lost)', apply: (s) => s.replace("  if (d && d.type === 'peer') {\n    var present", "  if (false) {\n    var present") },
  { catches: 'M3 X.log identical on both builds', name: 'a dropped signal is no longer queued (C1 layer lost)', apply: (s) => s.replace("      if (!ok && !m._c1) {", '      if (false) {') },
  { catches: 'M3 X.log identical on both builds', name: 'the socket no longer ramps back after a close (V2 layer lost)', apply: (s) => s.replace("        v2Schedule('close');", '') },
  { catches: 'M3 Y.wire identical on both builds', name: 'the heartbeat no longer carries the device word (CR3 ping layer lost)', apply: (s) => s.replace("  try { if (m && m.type === 'ping') { var w = cr3StateWord(S.roomId); m.visible = w.visible; m.inRoom = w.inRoom; m.muted = w.muted; } } catch (_) {}\n", '') },
  { catches: 'M3 X.log identical on both builds', name: 'a second connect while connecting is no longer coalesced (CR3 guard lost)', apply: (s) => s.replace("if (ws0 && ws0.readyState === 0 && room0 && ws0._cr3Room === room0.id) { cr3Log('connect_coalesced', { room: room0.id }); return; }", '') },
  { catches: 'M3 X.log identical on both builds', name: 'reconnectRelayNow no longer coalesces (CR3 guard lost)', apply: (s) => s.replace("if (ws0 && ws0.readyState === 0 && ws0._cr3Room === S.roomId) { cr3Log('reconnect_coalesced', { why: why }); return false; }", '') },
  { catches: 'M3 X.log identical on both builds', name: 'the socket\'s lifetime is no longer logged on close (T-net layer lost)', apply: (s) => s.replace("        netLog('relay_closed', { code: ev.code, livedMs: Date.now() - openedAt, hidden: !!document.hidden }, 'warn');\n", '') },
  { catches: 'M3 X.log identical on both builds', name: 'a background room\'s thread invite is no longer handled (P6 listen layer lost)', apply: (s) => s.replace("      if (d.type === 'thread-invite') p6OnInvite(roomId, d);\n      else if (d.type === 'sys-pill' && d.threadId) p6OnAnswer(roomId, d);\n      else if (d.type === 'hello' || d.type === 'hello-ack') p6ResendPending(roomId);", '') },
  { catches: 'M3 X.log identical on both builds', name: 'a background message no longer sets the waiting mark (R layer lost)', apply: (s) => s.replace("        bumpWaiting(room, kind);\n", '') },
  { catches: 'M3 X.log identical on both builds', name: 'a lifecycle signal now falls through to the base (L layer lost)', apply: (s) => s.replace("    try { if (d && onLifecycleSignal(S.roomId, d)) lifecycleTook = true; } catch (_) {}\n    if (!lifecycleTook) r = handleRelayCore(d);", '    r = handleRelayCore(d);') },
  { catches: 'M3 X.log identical on both builds', name: 'typing now falls through to the base (R8b early return lost)', apply: (s) => s.replace("      typingTook = true;                       /* never reaches the transcript */", '') },
  { catches: 'M3 X.wire identical on both builds', name: 'a record seen while attended is no longer acknowledged (CR3 after-layer lost)', apply: (s) => s.replace("cr3Send(S.roomId, { type: 'ev-seen', ids: [String(d.eventId)] });", 'void 0;') },
  { catches: 'M3 X.log identical on both builds', name: 'the "after" blocks of relayConnect are skipped when there is no room (order changed)', apply: (s) => s.replace("  var room = activeRoom();\n  if (room) {", "  var room = activeRoom();\n  if (!room) return;\n  {") },
  { catches: 'M2.1 the set of log markers in the candidate equals the accepted set (no marker added or lost)', name: 'a new marker appears', apply: (s) => s.replace("  var wasAttended = cr3Attended();", "  var wasAttended = cr3Attended(); log('fl1_seen', {}, 'info');") },
  { catches: 'M2.2 no wrapper of a flattened symbol survives in code; each symbol is bound once', name: 'the S-receipts wrapper is left in the assembly', keep: ['12-handleRelay-S-receipts.js'], apply: (s) => s },
  { catches: 'M2.2 no wrapper of a flattened symbol survives in code; each symbol is bound once', name: 'the C1 queue layer is left in the assembly (its once-flag hides the double effect from the log; the structure check is what catches it)', keep: ['26-relaySend-C1-signal-queue-IIFE.js'], apply: (s) => s },
  { catches: 'M1.1 candidate is the assembler\'s output for this part (every removal by its banked bytes)', name: 'the base is edited beyond the declared removals', apply: (s) => s, mangle: (h) => h.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 20001;') },
  { catches: 'M3 X.log identical on both builds', name: 'the ramp starts at the old flat 2 s', apply: (s) => s.replace('var V2_RAMP = [300, 600, 1200, 2000];', 'var V2_RAMP = [2000, 2000, 2000, 2000];') },
  /* candidate 2 · the app's face */
  { catches: 'M4.5 the app registers onto tb-sw3.js whichever old name the code asks for; K1 underneath is untouched', name: 'I-1 maps only tb-sw.js, so a tb-sw2.js registration reaches the browser', apply: (s) => s, part2: (s) => s.replace("if (/tb-sw2?\\.js$/.test(u)) { url = u.replace(/tb-sw2?\\.js$/, 'tb-sw3.js');", "if (/tb-sw\\.js$/.test(u)) { url = u.replace(/tb-sw\\.js$/, 'tb-sw3.js');") },
  { catches: 'M4.6 retirement: exact tb-sw2.js only, never tb-sw3.js, never tb-sw.js (K1 owns it), and only once the push subscription is live', name: 'I-1 would retire the new worker too', apply: (s) => s, part2: (s) => s.replace("          if (/tb-sw3\\.js$/.test(script)) return;                /* never the new one */\n", '') },
  { catches: 'M4.6 retirement: exact tb-sw2.js only, never tb-sw3.js, never tb-sw.js (K1 owns it), and only once the push subscription is live', name: 'I-1 retires before the new subscription is live', apply: (s) => s, part2: (s) => s.replace("          if (!(typeof p3State !== 'undefined' && p3State && p3State.sub)) { L('i1_retire_deferred', {}); return; }\n", '') },
  { catches: 'M2.1 the set of log markers in the candidate equals the accepted set (no marker added or lost)', name: 'I-1 logs an undeclared marker', apply: (s) => s, part2: (s) => s.replace("L('i1_sw3_register', {});", "L('i1_sw3_register', {}); L('i1_surprise', {});") },
  { catches: 'M4.3 the turn28 manifest is the turn26 manifest with only the icons changed (scope, display, name, colours identical — G25/G27)', name: 'the manifest scope drifts (G25/G27)', apply: (s) => s, manifest: (m) => m.replace('"scope": "/stuff/bridge-"', '"scope": "/stuff/"') },
  { catches: 'M4.3 the turn28 manifest is the turn26 manifest with only the icons changed (scope, display, name, colours identical — G25/G27)', name: 'the manifest gains a start_url (fb7ed76/G25)', apply: (s) => s, manifest: (m) => m.replace('"display": "standalone",', '"display": "standalone",\n  "start_url": "bridge-turn28-base.html",') },
  { catches: 'M4.4 tb-sw3.js is tb-sw2.js plus the face: every notification shown carries the v2 icon and badge; nothing else moved', name: 'the worker sets the icon but forgets the status-bar badge', apply: (s) => s, sw3: (w) => w.replace("o.badge = self.registration.scope + 'icon-v2-badge-96.png'; ", '') },
  { catches: 'M4.4 tb-sw3.js is tb-sw2.js plus the face: every notification shown carries the v2 icon and badge; nothing else moved', name: 'one notification goes out without the face', apply: (s) => s, sw3: (w) => w.replace("showNotification(d.title, face(opts))", 'showNotification(d.title, opts)') },
  { catches: 'M4.4 tb-sw3.js is tb-sw2.js plus the face: every notification shown carries the v2 icon and badge; nothing else moved', name: 'the worker changes something beyond the face', apply: (s) => s, sw3: (w) => w.replace('var CTX_MS = 250;', 'var CTX_MS = 400;') },
  { catches: 'M4.2 the head links point at the v2 set and nowhere else; every other head line is byte-identical', name: 'the runtime manifest swap still points at turn26 (the head edit would be undone on launch)', apply: (s) => s, mangle: (h) => h.replace("lk.href = 'tb-manifest-turn28.webmanifest'", "lk.href = 'tb-manifest-turn26.webmanifest'") },
  { catches: 'M4.2 the head links point at the v2 set and nowhere else; every other head line is byte-identical', name: 'the iPhone icon link is left on the old file', apply: (s) => s, mangle: (h) => h.replace('<link rel="apple-touch-icon" href="icon-v2-180.png">', '<link rel="apple-touch-icon" href="icon-180.png">') }
];
const ONLY = process.env.TB_MUT_ONLY || null;
const dir = mkdtempSync(path.join(tmpdir(), 'tb-28b-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  if (ONLY && m.catches !== ONLY) continue;
  const mutated = m.apply(src);
  const mutated2 = m.part2 ? m.part2(src2) : src2;
  const mutSw3 = m.sw3 ? m.sw3(sw3) : sw3, mutMan = m.manifest ? m.manifest(man) : man;
  if (!m.keep && !m.mangle && mutated === src && mutated2 === src2 && mutSw3 === sw3 && mutMan === man) { console.log('MISS  ' + m.catches + ' — mutation did not apply (source moved?): ' + m.name); missed++; continue; }
  const partPath = path.join(dir, 'part-' + i + '.js'); writeFileSync(partPath, mutated);
  const part2Path = path.join(dir, 'part2-' + i + '.js'); writeFileSync(part2Path, mutated2);
  const sw3Path = path.join(dir, 'sw3-' + i + '.js'); writeFileSync(sw3Path, mutSw3);
  const manPath = path.join(dir, 'man-' + i + '.json'); writeFileSync(manPath, mutMan);
  let html = assemble({ part: mutated, parts2: [mutated2], keepRemovals: m.keep || [] });
  if (m.mangle) { const b = html; html = m.mangle(html); if (html === b) { console.log('MISS  mangle did not apply: ' + m.name); missed++; continue; } }
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-diff-28b.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_PART_OVERRIDE: partPath, TB_PARTS2_OVERRIDE: part2Path, TB_SW3: sw3Path, TB_MANIFEST: manPath, TB_KEEP: (m.keep || []).join(',') } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + (out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ')) + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
