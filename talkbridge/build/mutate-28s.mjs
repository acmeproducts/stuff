#!/usr/bin/env node
/* 28·ship mutation gate (§7.16 M5). Each mutation puts one defect into a
   part (FL-3), or leaves one removed layer in the assembly, or
   edits the base undeclared. The differential harness must go red on the
   NAMED test. Nothing on disk is modified.   TB_MUT_ONLY=<test name> limits the run. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PARTS } from './assemble-28s.mjs';

const [fl3] = PARTS.map((p) => readFileSync(p, 'utf8'));
const XLOG = 'M3 X.log identical on both builds', YLOG = 'M3 Y.log identical on both builds';
const MUTATIONS = [
  { catches: XLOG, name: 'enterRoom: the generation no longer bumps (A layer lost)', fl3: (s) => s.replace("  if (!willLeave && S.roomId !== id) GEN.bump('room_enter');\n", '') },
  { catches: XLOG, name: 'enterRoom: the generation bumps after the base instead of before (order changed)', fl3: (s) => s.replace("  if (!willLeave && S.roomId !== id) GEN.bump('room_enter');\n  var r = enterRoomCore.apply(this, arguments);                   /* base */", "  var r = enterRoomCore.apply(this, arguments);\n  if (!willLeave && S.roomId !== id) GEN.bump('room_enter');") },
  { catches: 'M3 X.sockets identical on both builds', name: 'enterRoom: the device no longer declares its state on entry (PR2 layer lost — its log line is rate-limited by T-2, so the wire catches it)', fl3: (s) => s.replace("  fl3Declare('enter_room');                                       /* PR2 after */\n", '') },
  { catches: XLOG, name: 'enterRoom: the created room no longer takes its name and grant (L before-block lost)', fl3: (s) => s.replace("  try { applyPendingCreate(id); } catch (e) { lcLog('apply_pending_failed', { e: String(e && e.message || e) }, 'error'); }\n", '') },
  { catches: 'M3 X.created identical on both builds', name: 'enterRoom: the name typed on the create sheet is no longer adopted (B8c layer lost)', fl3: (s) => s.replace("      r0.myName = v; saveRooms(); log('b8c_room_name_set', { n: v.slice(0, 12) }, 'ok');", "      void 0;") },
  { catches: 'M3 X.lifecycle identical on both builds', name: 'enterRoom: the explicit open is no longer remembered for the relay (CR3 after-block lost)', fl3: (s) => s.replace("      else cr3State.openPending[id] = 1;\n", '') },
  { catches: XLOG, name: 'enterRoom: push is no longer attempted on first entry (P3 layer lost)', fl3: (s) => s.replace("    if (!p3State.sub && !p3State.attempts) p3Attempt(false);", "    if (!p3State.sub && !p3State.attempts) void 0;") },
  { catches: XLOG, name: 'enterRoom: the joiner-shell entry line is gone (J after-block lost)', fl3: (s) => s.replace("    if (roomJ) jLog('entered', { room: String(id).slice(-6), myLang: roomJ.myLang, theirLang: roomJ.theirLang, role: roomJ.role }, 'ok');\n", '') },
  { catches: XLOG, name: 'enterRoom: the invite payload is no longer applied before entry (J before-block lost)', fl3: (s) => s.replace("  try { if (S.invitePayload && S.invitePayload.r === id) applyInvitePayload(S.invitePayload); } catch (_) {}\n", '') },
  { catches: XLOG, name: 'leaveRoomInternals: the generation no longer bumps (A layer lost)', fl3: (s) => s.replace("  GEN.bump('room_leave');                                         /* A before */\n", '') },
  { catches: XLOG, name: 'leaveRoomInternals: the left room\'s lane no longer opens (CR3 layer lost)', fl3: (s) => s.replace("  try { LISTEN.sync(); cr3Log('leave_lane', { room: left }, 'ok'); cr3Recover('leave'); } catch (e) { cr3Log('leave_failed', { e: String(e && e.message || e) }, 'error'); }\n", '') },
  { catches: XLOG, name: 'leaveRoomInternals: the device no longer declares the leave (PR2 layer lost)', fl3: (s) => s.replace("  fl3Declare('leave_room');                                       /* PR2 after */\n", '') },
  { catches: 'M3 Y.dom identical on both builds', name: 'joinRoom: the welcome pill is gone (W1 layer lost)', fl3: (s) => s.replace("      addSysPill((p.n || 'Someone') + ' is inviting you to ' + (p.t || 'their chat') + langs);\n", '') },
  { catches: 'M3 Y.lifecycle identical on both builds', name: 'joinRoom: a grant link no longer persists (L layer lost)', fl3: (s) => s.replace("    if (p && p.g === 1) writeGrantedCredentials(p, p.r);\n    else lcLog('joined_plain', { room: p && String(p.r).slice(-6) }, 'ok');", "    lcLog('joined_plain', { room: p && String(p.r).slice(-6) }, 'ok');") },
  { catches: YLOG, name: 'joinRoom: the invite payload is no longer applied after the join (J layer lost)', fl3: (s) => s.replace("  try { applyInvitePayload(p); } catch (e) { jLog('join_apply_failed', { e: String(e && e.message || e) }, 'error'); }   /* J after */\n", '') },
  { catches: 'M3 X.s3 identical on both builds', name: 'openS3: the name-in-this-chat field is no longer added (B8c layer lost)', fl3: (s) => s.replace("  try { fl3EnsureField(); } catch (_) {}                          /* B8c · the name field */\n", '') },
  { catches: 'M3 X.s3 identical on both builds', name: 'openS3: the create sheet\'s own fields are no longer installed (L layer lost)', fl3: (s) => s.replace("    installCreateFields();\n", '') },
  { catches: 'M3 X.inv identical on both builds', name: 'invUrl: the link no longer carries the room\'s own name (the stamp lost its purpose)', fl3: (s) => s.replace("    if (p.n !== undefined) p.n = n;\n", '') },
  { catches: 'M3 X.inv identical on both builds', name: 'invUrl: a granting room gets a plain link (L layer lost)', fl3: (s) => s.replace("  if (room && room.grant && room.grantExpires) {", "  if (false) {") },
  { catches: XLOG, name: 'invUrl: the invite line is gone (L log lost)', fl3: (s) => s.replace("    lcLog('invite_built', { room: room && String(room.id).slice(-6), grant: false }, 'ok');\n", '') },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each of the five symbols is declared exactly once; no captured previous-layer reference remains except buildGrantLink\'s named dependency, defined once in FL-3', name: 'the grant link\'s dependency points at the outer invUrl (a grant link would recurse)', fl3: (s) => s.replace("var _lcInvUrl = function (room) { return fl3TStamp(fl3Stamp(invUrlCore(room), room), room); };", "var _lcInvUrl = function (room) { return invUrl(room); };") },
  { catches: 'M2.1 the set of log markers in the candidate equals the accepted set (no marker added or lost)', name: 'FL-3 logs a new marker', fl3: (s) => s.replace("  var before = S.roomId;                                          /* CR3 before */", "  var before = S.roomId; log('fl3_seen', {}, 'info');") },
  { catches: 'M2.3 nothing new on the wire or in the credential path (G19/G20): FL-3 adds no message type, no endpoint, no credential path', name: 'FL-3 sends a new message type', fl3: (s) => s.replace("      if (ws && ws.readyState === 1 && before === id) cr3Send(id, { type: 'ev-open' });", "      if (ws && ws.readyState === 1 && before === id) { cr3Send(id, { type: 'ev-open' }); cr3Send(id, { type: 'ev-probe' }); }") },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each of the five symbols is declared exactly once; no captured previous-layer reference remains except buildGrantLink\'s named dependency, defined once in FL-3', name: 'the A enter/leave layer is left in the assembly', keep: ['05-A-enter-leave-IIFE.js'] },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each of the five symbols is declared exactly once; no captured previous-layer reference remains except buildGrantLink\'s named dependency, defined once in FL-3', name: 'the L invUrl layer is left in the assembly', keep: ['09-L-invUrl.js'] },
  { catches: 'M2.2 no wrapper of a flattened symbol survives; each of the five symbols is declared exactly once; no captured previous-layer reference remains except buildGrantLink\'s named dependency, defined once in FL-3', name: 'the W1 join layer is left in the assembly', keep: ['23-W1-joinRoom.js'] },
  { catches: 'M1.1 candidate is the assembler\'s output for these parts (every removal by its banked bytes)', name: 'the accepted bytes are edited beyond the declared removals', mangle: (h) => h.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 20001;') },
];
const ONLY = process.env.TB_MUT_ONLY || null;
const dir = mkdtempSync(path.join(tmpdir(), 'tb-28s-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  if (ONLY && m.catches !== ONLY) continue;
  const parts = [m.fl3 ? m.fl3(fl3) : fl3];
  if (!m.keep && !m.mangle && parts[0] === fl3) { console.log('MISS  ' + m.catches + ' — mutation did not apply (source moved?): ' + m.name); missed++; continue; }
  const paths = parts.map((p, j) => { const f = path.join(dir, 'part' + j + '-' + i + '.js'); writeFileSync(f, p); return f; });
  let html = assemble({ parts, keepRemovals: m.keep || [] });
  if (m.mangle) { const b = html; html = m.mangle(html); if (html === b) { console.log('MISS  mangle did not apply: ' + m.name); missed++; continue; } }
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-diff-28s.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_PARTS_OVERRIDE: paths.join(','), TB_KEEP: (m.keep || []).join(',') } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches.slice(0, 44) + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches.slice(0, 44) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + (out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 60)).join(' | ')) + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
