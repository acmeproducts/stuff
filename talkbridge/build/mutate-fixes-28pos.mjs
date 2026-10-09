#!/usr/bin/env node
/* 28·post-ship fixes mutation gate: each mutation reverts or breaks ONE fix part;
   harness-fixes-28pos must go red on the NAMED test. Nothing on disk is modified. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, FIX_PARTS, fixReplacements } from './assemble-28pos.mjs';

const parts0 = FIX_PARTS.map((p) => readFileSync(p, 'utf8'));
const MUTATIONS = [
  { catches: 'F3 D-11 · a connect with no active room hooks nothing: the stale socket keeps one close listener, one open listener and its room (the flat build added a listener each and nulled the room)', name: 'D-11 reverted (the early return removed)', part: 0, edit: (s) => s.replace("  if (!room) return;\n", "") },
  { catches: 'F3 D-14 · the More menu closes when a call is answered, on the answerer and on the caller (the flat build left both open)', name: 'D-14 reverted on the answerer', part: 1, edit: (s) => s.replace("log('d14_drawer_closed', { role: 'answerer' }, 'ok'); } } catch (_) {}", "log('d14_drawer_closed', { role: 'answerer' }, 'ok'); } } catch (_) {}".replace("closeDrawerCore(); ", "")).replace("if (dr && dr.classList.contains('open')) { closeDrawerCore(); log('d14_drawer_closed', { role: 'answerer' }", "if (dr && dr.classList.contains('open')) { log('d14_drawer_closed', { role: 'answerer' }") },
  { catches: 'F3 D-14 · the More menu closes when a call is answered, on the answerer and on the caller (the flat build left both open)', name: 'D-14 reverted on the caller', part: 1, edit: (s) => s.replace("if (dr && dr.classList.contains('open')) { closeDrawerCore(); log('d14_drawer_closed', { role: 'caller' }", "if (dr && dr.classList.contains('open')) { log('d14_drawer_closed', { role: 'caller' }") },
  { catches: 'F3 D-15 · a short English word suppresses its letter-spaced Thai twin in both orders; a real short Thai sentence and a two-word Thai line are still delivered; a long English win still suppresses everything in its window', name: 'D-15: the short-English window is never armed', part: 2, edit: (s) => s.replace("    _dgEnShortAt = Date.now();\n", "") },
  { catches: 'F3 D-15 · a short English word suppresses its letter-spaced Thai twin in both orders; a real short Thai sentence and a two-word Thai line are still delivered; a long English win still suppresses everything in its window', name: 'D-15: the rule is too wide (any native line falls to a short English word)', part: 2, edit: (s) => s.replace("  if (Date.now() - _dgEnShortAt < _DG_CROSS_MS && dgLooksPhonetic(text)) {", "  if (Date.now() - _dgEnShortAt < _DG_CROSS_MS) {") },
  { catches: 'F3 D-15 · a short English word suppresses its letter-spaced Thai twin in both orders; a real short Thai sentence and a two-word Thai line are still delivered; a long English win still suppresses everything in its window', name: 'D-15: a held twin is not displaced by the short English that follows it', part: 2, edit: (s) => s.replace("    if (_dgPrimHoldTimer !== null && dgLooksPhonetic(_dgPrimHeldText)) {", "    if (false) {") },
  { catches: 'F3 T-4 · speech logs its voice match and says when the device has no voice for the language; nothing is said when the device reports no voices at all', name: 'T-4: no toast when the voice is missing', part: 3, edit: (s) => s.replace(" toast('No voice installed for ' + (gL(lang).name || lang)); }", " }") },
  { catches: 'F3 T-4 · speech logs its voice match and says when the device has no voice for the language; nothing is said when the device reports no voices at all', name: 'T-4: a toast even when the device reports no voices at all', part: 3, edit: (s) => s.replace("  if (voices.length && !match) {", "  if (!match) {") },
  { catches: 'F3 X-4 · what was said in a call reaches the other phone: the speaker\'s entry keeps it on both builds, the receiver\'s only on the candidate (said_kept {who: partner})', name: 'X-4: the said no longer rides the subtitle', part: 4, edit: (s) => s.replace("var saidF=(saidE&&saidE.said)?{said:saidE.said,saidLang:saidE.saidLang||''}:{};", "var saidF={};") },
  { catches: 'F3 X-4 · what was said in a call reaches the other phone: the speaker\'s entry keeps it on both builds, the receiver\'s only on the candidate (said_kept {who: partner})', name: 'X-4: the receiver no longer holds it', part: 4, edit: (s) => s.replace("  try { x3PendingIn = (d && typeof d.said === 'string' && norm(d.said) && s0) ? { said: norm(d.said), saidLang: String(d.saidLang || ''), normalized: s0, at: Date.now() } : null; } catch (_) { x3PendingIn = null; }", "  x3PendingIn = null;") },
  { catches: 'F3 D-18 · the caller builds the connection: a two-joiner room carries a call on the candidate and none on the flat build; a joiner calling the creator builds it; the creator calling still builds it', name: 'D-18: builds() answers by role again (the old rule)', part: 5, edit: (s) => s.replace("CALL.builds = function () { return !!this.caller; };", "CALL.builds = function () { return !!(activeRoom() && activeRoom().role === 'creator'); };") },
  { catches: 'F3 both builds reach the D-18 cut with the same wire, socket, peer and transcript counts (a call-path change before the cut would show here)', name: 'D-18: builds() is true on both sides (both would offer)', part: 5, edit: (s) => s.replace("CALL.builds = function () { return !!this.caller; };", "CALL.builds = function () { return true; };") },
  { catches: 'F3 D-18 · the caller builds the connection: a two-joiner room carries a call on the candidate and none on the flat build; a joiner calling the creator builds it; the creator calling still builds it', name: 'D-18: the builder decision is never logged on the caller (the onAccepted replacement loses its line)', editR: { id: '11-D18-onAccepted', fn: (t) => t.replace("  log('call_builder', { builds: this.builds(), role: room.role }, 'ok');          /* D-18: the caller builds, whatever the room says its role is */\n", '') } },
  { catches: 'F3 D-18 · the caller builds the connection: a two-joiner room carries a call on the candidate and none on the flat build; a joiner calling the creator builds it; the creator calling still builds it', name: 'D-18: the onAccepted replacement is left out (the creator rule survives there)', keepR: ['11-D18-onAccepted'] },
  { catches: 'F3 D-18 · the caller builds the connection: a two-joiner room carries a call on the candidate and none on the flat build; a joiner calling the creator builds it; the creator calling still builds it', name: 'D-18: the setupPC replacement is left out (a joiner caller builds a pc that never offers)', keepR: ['12-D18-setupPC-offer'] },
  { catches: 'F2.1 the candidate\'s log markers are the flat build\'s plus exactly the declared ones', name: 'a fix logs an undeclared marker', part: 0, edit: (s) => s.replace("  if (!room) return;\n", "  if (!room) { log('d11_no_room', {}, 'info'); return; }\n") },
  { catches: 'F1.3 each part declares what it replaces; every replaced symbol is bound exactly once in the candidate', name: 'a banked text is left in place (two relayConnect declarations)', keep: ['00-FL1-relayConnect.js'] },
];
const ONLY = process.env.TB_MUT_ONLY || null;
const dir = mkdtempSync(path.join(tmpdir(), 'tb-28pos-fixmut-'));
let caught = 0, missed = 0;
for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i]; if (ONLY && m.catches !== ONLY) continue;
  const parts = parts0.slice(); if (m.edit) { parts[m.part] = m.edit(parts[m.part]); if (parts[m.part] === parts0[m.part]) { console.log('MISS  mutation did not apply: ' + m.name); missed++; continue; } }
  let reps = null, repsPath = '';
  if (m.editR) { const orig = fixReplacements(); reps = orig.map((r) => r.id === m.editR.id ? { ...r, replace: m.editR.fn(r.replace) } : r); const o = orig.filter((r) => r.id === m.editR.id)[0]; if (!o || reps.filter((r) => r.id === m.editR.id)[0].replace === o.replace) { console.log('MISS  replacement edit did not apply: ' + m.name); missed++; continue; } repsPath = path.join(dir, 'reps-' + i + '.json'); writeFileSync(repsPath, JSON.stringify(reps)); }
  const paths = parts.map((p, j) => { const f = path.join(dir, 'fix' + j + '-' + i + '.js'); writeFileSync(f, p); return f; });
  let html; try { html = assemble({ fixParts: parts, keepFixRemovals: m.keep || [], keepFixReplacements: m.keepR || [], replacements: reps }); } catch (e) { console.log('MISS  assembly refused: ' + m.name + ' — ' + e.message); missed++; continue; }
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-fixes-28pos.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_FIX_PARTS_OVERRIDE: paths.join(','), TB_KEEP_FIX: (m.keep || []).join(','), TB_KEEP_FIX_R: (m.keepR || []).join(','), TB_FIX_REPS: repsPath } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches.slice(0, 40) + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches.slice(0, 40) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 70)).join(' | ') + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nfix mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
