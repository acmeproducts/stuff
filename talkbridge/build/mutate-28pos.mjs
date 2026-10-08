#!/usr/bin/env node
/* 28·post-ship mutation gate (§7.16 M5). Each mutation puts one defect into a
   part (FL-4), or leaves one removed layer in the assembly, or
   edits the base undeclared. The differential harness must go red on the
   NAMED test. Nothing on disk is modified.   TB_MUT_ONLY=<test name> limits the run. */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PARTS } from './assemble-28pos.mjs';

const [fl4] = PARTS.map((p) => readFileSync(p, 'utf8'));
const XLOG = 'M3 X.log identical on both builds', XREN = 'M3 X.render identical on both builds';
const M22 = 'M2.2 no wrapper of a flattened symbol survives; each of the eight symbols is declared exactly once; no captured previous-layer reference and no latch assignment remains';
const MUTATIONS = [
  { catches: XREN, name: 'renderPanel: the latch is gone (every call renders synchronously; T1 layer lost)', fl4: (s) => s.replace("function renderPanel() { return fl4Latched(_fl4PanelLatch, 'renderPanel', renderPanelFlat, renderPanel, this, arguments); }", "function renderPanel() { return renderPanelFlat.apply(this, arguments); }") },
  { catches: XREN, name: 'the latch never re-renders after a collapsed burst (the trailing render lost)', fl4: (s) => s.replace("      outer.apply(self, args);\n", "") },
  { catches: 'M3 X.housekeeping identical on both builds', name: 'the latch no longer logs the collapse', fl4: (s) => s.replace("      try { log('t1_coalesced', { fn: name, n: n }, 'info'); } catch (_) {}\n", "") },
  { catches: XREN, name: 'renderPanel: the create control is no longer synced (J layer lost)', fl4: (s) => s.replace("  syncCreateControl();                                                     /* J after */\n", "") },
  { catches: 'M3 X.wire identical on both builds', name: 'renderPanel: restore no longer carries lifecycle meaning (L layer lost — no room-rejoined on the wire)', fl4: (s) => s.replace("        el.addEventListener('click', function (ev) { ev.stopPropagation(); restoreRoom(el.dataset.restore); });\n", "") },
  { catches: XREN, name: 'renderPanel: thread invites are no longer shown (P6 layer lost)', fl4: (s) => s.replace("        body.insertBefore(wrap, body.firstChild);\n", "") },
  { catches: 'M3 X.rooms identical on both builds', name: 'renderPanel: accepting a thread invite does nothing (P6 wiring lost)', fl4: (s) => s.replace("          card.querySelector('[data-p6-accept]').addEventListener('click', function (ev) { ev.stopPropagation(); p6Accept(pid, tid); });\n", "") },
  { catches: XREN, name: 'renderPanel: the bin no longer opens (base toggle lost)', fl4: (s) => s.replace("      renderPanel._binOpen = !renderPanel._binOpen;\n", "") },
  { catches: 'M3 X.rooms identical on both builds', name: 'renderPanel: delete forever no longer deletes (base handler lost)', fl4: (s) => s.replace("        S.rooms = S.rooms.filter(function (x) { return x.id !== r.id; });\n", "") },
  { catches: XREN, name: 'renderHome: the summary line is gone (R body edited)', fl4: (s) => s.replace("    var h = '<div class=\"home-sum\">' + esc(homeSummaryText()) + '</div>';", "    var h = '';") },
  { catches: XLOG, name: 'renderHome: the password sweep no longer re-runs on redraw (NP layer lost)', fl4: (s) => s.replace("    try { suppressPasswordUI(); } catch (_) {}\n  return r;\n}\nfunction renderHome()", "  return r;\n}\nfunction renderHome()") },
  { catches: 'M3 Y.dom identical on both builds', name: 'renderTranscript: the date marker is not reset on a bulk repaint (base edited — pills lost)', fl4: (s) => s.replace("  var t=$('transcript');t.innerHTML='';_lastDateStr=null;", "  var t=$('transcript');t.innerHTML='';") },
  { catches: XREN, name: 'renderRoomHead: the name popup is no longer wired (M layer lost)', fl4: (s) => s.replace("      el.dataset.rmWired = '1';\n", "      el.dataset.rmWired = '0';\n") },
  { catches: XREN, name: 'msgHtml: the origin mark is no longer swapped (R8 layer lost)', fl4: (s) => s.replace("        return html.replace(/<span class=\"origin-mark\">[\\s\\S]*?<\\/span>/, want);\n", "        return html;\n") },
  { catches: XREN, name: 'msgHtml: typed entries get no mark (R8 inserter lost)', fl4: (s) => s.replace("      return html.replace(/(<span class=\"tr-who who[^\"]*\">)/, '$1' + want);", "      return html;") },
  { catches: XLOG, name: 'appendMsgDom: what the partner said is no longer kept (X3 layer lost)', fl4: (s) => s.replace("            log('said_kept', { id: e.id, lang: e.saidLang, chars: e.said.length, who: e.who }, 'ok');\n", "") },
  { catches: 'M3 X.transcript identical on both builds', name: 'appendMsgDom: the said is logged but not attached (X3 layer edited)', fl4: (s) => s.replace("            e.said = p.said; e.saidLang = p.saidLang;\n", "") },
  { catches: 'M3 X.dom identical on both builds', name: 'appendMsgDom: markdown is no longer painted (MD1 layer lost)', fl4: (s) => s.replace("      fl4CellFill(node, 'left',  mine ? e.sourceText     : e.translatedText);\n      fl4CellFill(node, 'right', mine ? e.translatedText : e.sourceText);\n", "") },
  { catches: 'M3 X.dom identical on both builds', name: 'appendMsgDom: an entry is painted while another screen is showing (base guard lost)', fl4: (s) => s.replace("  var t=$('transcript');if(!t||S.view!=='room')return;", "  var t=$('transcript');if(!t)return;") },
  { catches: XREN, name: 'roomCardHtml: a send-locked room gets a thread button (P6 guard lost)', fl4: (s) => s.replace("      if (h && r && !r.sendLocked) h = h.replace(", "      if (h && r) h = h.replace(") },
  { catches: XREN, name: 'roomCardHtml: the muted bell is gone (R body edited)', fl4: (s) => s.replace("    var right1 = r.muted\n", "    var right1 = false\n") },
  { catches: XREN, name: 'wireRoomCards: the thread button is not wired (P6 layer lost)', fl4: (s) => s.replace("        el.addEventListener('click', function (ev) { ev.stopPropagation(); ev.preventDefault(); p6AskName(el.dataset.thread); });\n", "") },
  { catches: XLOG, name: 'wireRoomCards: a home card no longer dismisses on tap (L body edited)', fl4: (s) => s.replace("        if (el.dataset.where === 'home') dismissHome(id, true); else closePanel();", "        closePanel();") },
  { catches: 'M3 X.wire identical on both builds', name: 'wireRoomCards: the card delete no longer soft-deletes (L body edited)', fl4: (s) => s.replace("    el.addEventListener('click', function (ev) { ev.stopPropagation(); softDeleteRoom(el.dataset.del); });", "    el.addEventListener('click', function (ev) { ev.stopPropagation(); });") },
  { catches: 'M2.1 the set of log markers in the candidate equals the accepted set (no marker added or lost)', name: 'FL-4 logs a new marker', fl4: (s) => s.replace("  var r = renderPanelCore.apply(this, arguments);\n  syncCreateControl();", "  var r = renderPanelCore.apply(this, arguments); log('fl4_seen', {}, 'info');\n  syncCreateControl();") },
  { catches: 'M2.3 nothing new on the wire or in the credential path (G19/G20): FL-4 adds no message type, no endpoint, no credential path', name: 'FL-4 sends a new message type', fl4: (s) => s.replace("function wireRoomCards(host) {\n  var r = wireRoomCardsCore.apply(this, arguments);", "function wireRoomCards(host) {\n  var r = wireRoomCardsCore.apply(this, arguments); relaySend({ type: 'ev-probe' });") },
  { catches: M22, name: 'the J renderPanel layer is left in the assembly', keep: ['09-J-renderPanel-IIFE.js'] },
  { catches: M22, name: 'the T1 latch is left in the assembly', keep: ['18-T1-latch-IIFE.js'] },
  { catches: M22, name: 'X3\'s pending declarations are left in the assembly (declared twice)', keep: ['19-X3-pending-vars.js'] },
  { catches: M22, name: 'the base renderPanel declaration is left in the assembly (declared twice)', keep: ['00-BASE-renderPanel.js'] },
  { catches: 'M1.1 candidate is the assembler\'s output for these parts (every removal by its banked bytes)', name: 'the base bytes are edited beyond the declared removals', mangle: (h) => h.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 20001;') },
];
const ONLY = process.env.TB_MUT_ONLY || null;
const dir = mkdtempSync(path.join(tmpdir(), 'tb-28pos-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  if (ONLY && m.catches !== ONLY) continue;
  const parts = [m.fl4 ? m.fl4(fl4) : fl4];
  if (!m.keep && !m.mangle && parts[0] === fl4) { console.log('MISS  ' + m.catches + ' — mutation did not apply (source moved?): ' + m.name); missed++; continue; }
  const paths = parts.map((p, j) => { const f = path.join(dir, 'part' + j + '-' + i + '.js'); writeFileSync(f, p); return f; });
  let html = assemble({ parts, keepRemovals: m.keep || [] });
  if (m.mangle) { const b = html; html = m.mangle(html); if (html === b) { console.log('MISS  mangle did not apply: ' + m.name); missed++; continue; } }
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-diff-28pos.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_PARTS_OVERRIDE: paths.join(','), TB_KEEP: (m.keep || []).join(',') } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches.slice(0, 44) + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches.slice(0, 44) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + (out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 60)).join(' | ')) + ')')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
