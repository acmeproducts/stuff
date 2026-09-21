#!/usr/bin/env node
/* 27·post-ship mutation gate (§7.9 / §7.10 M5). Each mutation reintroduces,
   in one part's source or in the assembled bytes, exactly the defect one
   harness test claims to catch. The harness must fail on the NAMED test.
   Nothing on disk is modified.

   Usage: node mutate-27ps.mjs                                                */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';
import { assemble, PARTS, REMOVED_PART } from './assemble-27ps.mjs';

const P = { c1: 0, v2: 1, c3: 2, c2: 3, s2: 4, f1: 5, k1: 6, k2: 7, k4: 8, t1: 9, t2: 10, t3: 11, d10: 12 };
const src = PARTS.map((p) => readFileSync(p, 'utf8'));
const d1 = readFileSync(REMOVED_PART, 'utf8');

const MUTATIONS = [
  /* the declared removal, and the carried bytes */
  { part: P.c1, catches: 'M1.2', name: 'the D1 instrument is smuggled back into the build', apply: (s) => s, mangleBuild: (h) => h.replace('\n\n/* ═══════════ GAP PART · C1-signal-queue.js', '\n\n' + d1 + '\n\n/* ═══════════ GAP PART · C1-signal-queue.js') },
  { part: P.c1, catches: 'M1.3', name: 'a carried part drifts from the accepted c8 bytes', apply: (s) => s.replace('var C1_TRIES = 40;', 'var C1_TRIES = 41;') },
  { part: P.k1, catches: 'M1.2', name: 'the baseline is edited instead of appended to', apply: (s) => s, mangleBuild: (h) => h.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 20001;') },
  /* K-1 */
  { part: P.k1, catches: 'M3a.1', name: 'K-1 forgets the device prefix', apply: (s) => s.replace("uid = function () { return prefix + '-' + _uid.apply(this, arguments); };", 'uid = function () { return _uid.apply(this, arguments); };') },
  { part: P.k1, catches: 'M3a.2', name: 'K-1 prefixes but the tail is no longer unique per call', apply: (s) => s.replace("uid = function () { return prefix + '-' + _uid.apply(this, arguments); };", "var one = _uid(); uid = function () { return prefix + '-' + one; };") },
  { part: P.k1, catches: 'M2.2', name: 'K-1 replaces uid outright', apply: (s) => s.replace("return prefix + '-' + _uid.apply(this, arguments);", "return prefix + '-' + Math.random().toString(36).slice(2);") },
  /* K-2 unit */
  { part: P.k2, catches: 'M3b.2', name: 'K-2 merge always keeps local (no last-write-wins)', apply: (s) => s.replace('if (clock(c) > clock(mine)) { byId[c.id] = c; took++; } else { kept++; }', 'kept++;') },
  { part: P.k2, catches: 'M3b.3', name: 'K-2 merge drops cards only the remote has', apply: (s) => s.replace('if (!mine) { byId[c.id] = c; order.push(c.id); added++; return; }', 'if (!mine) return;') },
  { part: P.k2, catches: 'M3b.5', name: 'K-2 merge ignores deletedAt in the clock', apply: (s) => s.replace('return Math.max(Number(c.updatedAt) || 0, Number(c.deletedAt) || 0);', 'return Number(c.updatedAt) || 0;') },
  /* K-2 wire */
  { part: P.k2, catches: 'M3c.1', name: 'the expected sha is removed from the PUT (the frozen compare-and-swap)', apply: (s) => s, mangleBuild: (h) => h.replace('if(existing&&existing.sha)body.sha=existing.sha;', '') },
  { part: P.k2, catches: 'M3c.2', name: 'K-2 re-pushes without pulling — last writer wins the file (the bug)', apply: (s) => s.replace("return Promise.resolve(pbPull()).then(function (p) {\n        if (!p || p.status !== 'ok' || p.unchanged) { PB.version = localVersion; throw new Error('pull ' + ((p && p.status) || 'failed')); }", "return Promise.resolve({ status: 'ok', version: localVersion }).then(function (p) { PB.version = localVersion;") },
  { part: P.k2, catches: 'M3c.2', name: 'K-2 leaves the frozen version short-cut in place → the pull skips the fetch', apply: (s) => s.replace('PB.version = null;\n      return Promise.resolve(pbPull())', 'return Promise.resolve(pbPull())') },
  { part: P.k2, catches: 'M3c.4', name: 'K-2 re-pushes through its own wrapper → merges on every refusal, loops', apply: (s) => s.replace('return _pbWriteBack.call(self);', 'return pbWriteBack.call(self);') },
  { part: P.k2, catches: 'M3c.5', name: 'K-2 treats every failure as a conflict', apply: (s) => s.replace("function refused() { return /put 409|put 422/.test(lastErr || ''); }", 'function refused() { return true; }') },
  { part: P.k2, catches: 'M3c.6', name: 'K-2 re-pushes even when the pull failed', apply: (s) => s.replace("if (!p || p.status !== 'ok' || p.unchanged) { PB.version = localVersion; throw new Error('pull ' + ((p && p.status) || 'failed')); }", 'PB.version = PB.version || localVersion;') },
  { part: P.k2, catches: 'M2.2', name: 'K-2 replaces pbWriteBack outright', apply: (s) => s.replace('return Promise.resolve(_pbWriteBack.apply(self, args)).then(function (r) {', "return Promise.resolve({ status: 'ok' }).then(function (r) {") },
  /* K-4 */
  { part: P.k4, catches: 'M3d.1', name: 'K-4 applies every rename (the frozen behaviour) → phones swap names', apply: (s) => s.replace("if (r && ts && mine && (ts < mine || (ts === mine && to <= (r.title || '')))) {", 'if (false) {') },
  { part: P.k4, catches: 'M3d.4', name: 'K-4 has no tie-break → equal stamps diverge', apply: (s) => s.replace("(ts < mine || (ts === mine && to <= (r.title || '')))", '(ts < mine)') },
  { part: P.k4, catches: 'M3d.6', name: 'K-4 records a wrong stamp for an applied rename → every later rename is judged stale', apply: (s) => s.replace("if (r && ts && r.title === to) { r.titleTs = ts; try { saveRooms(); } catch (_) {} }", "if (r && ts && r.title === to) { r.titleTs = Number.MAX_SAFE_INTEGER; try { saveRooms(); } catch (_) {} }") },
  { part: P.k4, catches: 'M3d.1', name: 'K-4 sender does not remember the stamp it sent → its own rename is overwritten by an older one', apply: (s) => s.replace("if (r && r.title === m.newRoomName) { r.titleTs = m.ts; try { saveRooms(); } catch (_) {} }", '') },
  { part: P.k4, catches: 'M2.2', name: 'K-4 replaces onRoomNameSignal outright', apply: (s) => s.replace(/_onRoomNameSignal\.apply\(this, arguments\)/g, 'false') },
  /* T-1 */
  { part: P.t1, catches: 'M3e.1', name: 'T-1 defers even the first call', apply: (s) => s.replace('if (busy) { pending++; return; }\n      busy = true;\n      var r = orig.apply(self, args);', 'if (busy) { pending++; return; }\n      busy = true; pending++;\n      var r;') },
  { part: P.t1, catches: 'M3e.3', name: 'T-1 collapses but never renders the trailing state', apply: (s) => s.replace('latched.apply(self, args);', '') },
  { part: P.t1, catches: 'M3e.2', name: 'T-1 renders every call (no latch)', apply: (s) => s.replace('if (busy) { pending++; return; }', 'if (busy) { pending++; return orig.apply(self, args); }') },
  { part: P.t1, catches: 'M3e.4', name: 'T-1 latches renderTranscript only', apply: (s) => s.replace("renderPanel = latch('renderPanel', renderPanel);\n  renderHome = latch('renderHome', renderHome);", '') },
  /* T-2 */
  { part: P.t2, catches: 'M3f.1', name: 'T-2 limits nothing', apply: (s) => s.replace('if (last[ev] && now - last[ev] < WINDOW_MS) { dropped[ev] = (dropped[ev] || 0) + 1; return; }', '') },
  { part: P.t2, catches: 'M3f.2', name: 'T-2 drops silently — the count never rides the next line', apply: (s) => s.replace('d2.dropped = dropped[ev]; dropped[ev] = 0;', 'dropped[ev] = 0;') },
  { part: P.t2, catches: 'M3f.3', name: 'T-2 limits every marker', apply: (s) => s.replace('if (LIMITED[ev]) {', 'if (true) {') },
  { part: P.t2, catches: 'M2.2', name: 'T-2 replaces log outright', apply: (s) => s.replace('return _log.apply(this, arguments);', 'return;') },
  /* T-3 */
  { part: P.t3, catches: 'M3g.1', name: 'T-3 never logs the map', apply: (s) => s.replace("try { log('wrap_map', { symbols: count, map: map }, 'ok'); } catch (_) {}", '') },
  { part: P.t3, catches: 'M3g.2', name: 'T-3 only sees `= function` wraps, misses `= latch(...)`', apply: (s) => s.replace("var assignRe = /(^|[^\\w$.])((?:[A-Za-z_$][\\w$]*)(?:\\.[A-Za-z_$][\\w$]*)?)\\s*=(?!=)/g;", "var assignRe = /(^|[^\\w$.])((?:[A-Za-z_$][\\w$]*)(?:\\.[A-Za-z_$][\\w$]*)?)\\s*=\\s*(?:async\\s+)?function\\b/g;") },
  { part: P.t3, catches: 'M3g.3', name: 'T-3 counts any `function x(` anywhere and any `var x =` — locals flood the map', apply: (s) => s.replace("re = /^(?:async\\s+)?function\\s+([A-Za-z_$][\\w$]*)\\s*\\(/gm;", "re = /(?:async\\s+)?function\\s+([A-Za-z_$][\\w$]*)\\s*\\(/g;").replace("if (/(?:var|let|const)\\s*$/.test(chunk.slice(Math.max(0, m.index - 6), m.index + m[1].length))) continue;  /* a local of the same name */", '') },
  { part: P.t3, catches: 'M2.4', name: 'T-3 calls what it finds', apply: (s) => s.replace('(map[sym] = map[sym] || []).push(bounds[b].name);', '(map[sym] = map[sym] || []).push(bounds[b].name); try { window[sym](); } catch (_) {}') },
  /* D-10 */
  { part: P.d10, catches: 'M3h.1', name: 'D-10 forgets the enterkeyhint', apply: (s) => s.replace("ti.setAttribute('enterkeyhint', 'enter');", '') },
  { part: P.d10, catches: 'M3h.2', name: 'D-10 never wraps the input in a form → the keyboard\'s submit has nowhere to go', apply: (s) => s.replace("if (!(p && p.tagName === 'FORM' && p.hasAttribute('data-tagform'))) {", 'if (false) {') },
  { part: P.d10, catches: 'M3h.2', name: 'D-10 lets the submit through → the page navigates', apply: (s) => s.replace("    if (!(f && f.hasAttribute && f.hasAttribute('data-tagform'))) return;\n    ev.preventDefault();", "    if (!(f && f.hasAttribute && f.hasAttribute('data-tagform'))) return;").replace("  function commit(ti, via, ev) {\n    ev.preventDefault();", '  function commit(ti, via, ev) {') },
  { part: P.d10, catches: 'M3h.3', name: 'D-10 drops the keyCode-13 ear', apply: (s) => s.replace("if ((ev.keyCode === 13 || ev.which === 13) && ti.value && ti.value.trim()) commit(ti, 'keycode', ev);", '') },
  { part: P.d10, catches: 'M3h.4', name: 'D-10 drops the keyup ear', apply: (s) => s.replace("if ((ev.key === 'Enter' || ev.keyCode === 13 || ev.which === 13) && ti.value && ti.value.trim()) commit(ti, 'keyup', ev);", '') },
  { part: P.d10, catches: 'M3h.4', name: 'D-10 keyup adds without the text guard → double handling', apply: (s) => s.replace("if ((ev.key === 'Enter' || ev.keyCode === 13 || ev.which === 13) && ti.value && ti.value.trim()) commit(ti, 'keyup', ev);", "if (ev.key === 'Enter' || ev.keyCode === 13 || ev.which === 13) commit(ti, 'keyup', ev);") },
  { part: P.d10, catches: 'M3h.5', name: 'D-10 never puts focus back', apply: (s) => s.replace("    setTimeout(function () { refocus(id, 0); }, 0);\n    setTimeout(function () { refocus(id, 60); }, 60);", '') },
  { part: P.d10, catches: 'M3h.6', name: 'D-10 submit adds on an empty field', apply: (s) => s.replace("if (ti && ti.value && ti.value.trim()) commit(ti, 'submit', ev);", "if (ti) commit(ti, 'submit', ev);") },
  { part: P.d10, catches: 'M3h.7', name: 'D-10 dresses only the one re-rendered card, never the full list render', apply: (s) => s.replace("  var _renderPbList = renderPbList;\n  renderPbList = function () { var r = _renderPbList.apply(this, arguments); try { dress(); } catch (_) {} return r; };\n", '') },
  { part: P.d10, catches: 'M2.2', name: 'D-10 replaces pbAddTagTo outright', apply: (s) => s.replace('var r = _pbAddTagTo.apply(this, arguments);', 'var r; PB.byId(id).tags.push(arguments[1]);') },
  /* fences */
  { part: P.k2, catches: 'M2.6', name: 'a part reads the PAT', apply: (s) => s + "\nvar _k2pat = localStorage.getItem('tb_gh_pat');\n" },
  { part: P.k4, catches: 'M2.5', name: 'K-4 invents a relay message type of its own', apply: (s) => s.replace("if (m && m.type === 'sys-pill' && typeof m.newRoomName === 'string') {", "if (m && (m.type === 'sys-pill' || m.type === 'room-name') && typeof m.newRoomName === 'string') {") },
  { part: P.t1, catches: 'M6.1', name: 'a part retunes the baseline connect timeout', apply: (s) => s + '\nCALL.CONNECT_TIMEOUT_MS = 9000;\n' }
];

const ONLY = process.env.TB_MUT_ONLY ? process.env.TB_MUT_ONLY.split(',') : null;   /* run a subset while iterating: TB_MUT_ONLY=M3h.7 */
const dir = mkdtempSync(path.join(tmpdir(), 'tb-27ps-mut-'));
let caught = 0, missed = 0;
for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  if (ONLY && !ONLY.includes(m.catches)) continue;
  const mutated = m.apply(src[m.part]);
  if (!m.mangleBuild && mutated === src[m.part]) { console.log('MISS  ' + m.catches + ' — mutation did not apply (source moved?): ' + m.name); missed++; continue; }
  const overrides = src.slice(); overrides[m.part] = mutated;
  const partPaths = overrides.map((s, k) => { const p = path.join(dir, 'part-' + i + '-' + k + '.js'); writeFileSync(p, s); return p; });
  let html = assemble(overrides);
  if (m.mangleBuild) { const before = html; html = m.mangleBuild(html); if (html === before) { console.log('MISS  ' + m.catches + ' — build mangle did not apply: ' + m.name); missed++; continue; } }
  const builtPath = path.join(dir, 'built-' + i + '.html'); writeFileSync(builtPath, html);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-27ps.mjs', builtPath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_PART_OVERRIDE: JSON.stringify(partPaths) } }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = new RegExp('FAIL\\s+' + m.catches.replace(/\./g, '\\.') + '(?![\\w.])').test(out);
  if (exit !== 0 && named) { console.log('  ok  ' + m.catches + ' catches: ' + m.name); caught++; }
  else { console.log('MISS  ' + m.catches + ' did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed)')); missed++; }
}
rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + (ONLY ? caught + missed : MUTATIONS.length) + ' caught, ' + missed + ' missed' + (ONLY ? ' (subset)' : ''));
process.exit(missed ? 1 : 0);
