#!/usr/bin/env node
/* 30·pre-ship mutation gate (§7.24, TS-1): each mutation breaks one rule in a copy of the part; the NAMED test must fail.
   Browser rules are caught by harness-30ps-browser.mjs (real Chromium), structure and the whole-script differential by harness-30ps.mjs.
   Nothing on disk changes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemblePage, PARTS } from './assemble-30ps.mjs';
const part = fs.readFileSync(PARTS[0], 'utf8');
const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('mutation text found ' + n + 'x: ' + a.slice(0, 70)); return s.replace(a, () => b); };
const M = [
  { by: 'browser', catches: 'S3', name: 'every save rewrites the whole room', m: (s) => once(s, "} else if (m.sig.get(x.n) !== x.sig || m.pos.get(x.n) !== x.i) {", "} else if (true) {") },
  { by: 'browser', catches: 'S4', name: 'a changed row is never written (a lost receipt)', m: (s) => once(s, "          S.msgs.put(row2);\n", "") },
  { by: 'browser', catches: 'S7', name: 'the row number is taken from memory, outside the write (two copies collide)', m: (s) => once(s, "          x.n = rec.next++; res.adds++;", "          m.next = Math.max(m.next || 0, 0, ...Array.from(m.sig.keys())) + 1; x.n = m.next; res.adds++;") },
  { by: 'browser', catches: 'S5', name: 'a save held during start-up replaces the room', m: (s) => once(s, "    var m = tsMirror(room), at = new Map();", "    var m = tsMirror(room), at = new Map(); m.arr.length = 0;") },
  { by: 'browser', catches: 'S6', name: 'an old key is never absorbed again once its room is in the store', m: (s) => once(s, "          var have = h.result || [], ids = new Set(), sigs = new Map(), maxI = -1;", "          var have = h.result || [], ids = new Set(), sigs = new Map(), maxI = -1; if (have.length) { box.ok = true; return; }") },
  { by: 'browser', catches: 'S6b', name: 'an old key is removed though it changed after reading', m: (s) => once(s, "          if (all && now === raw) {", "          if (all) {") },
  { by: 'browser', catches: 'S1', name: 'the broken key is removed', m: (s) => once(s, "      if (!Array.isArray(arr)) { d.broken++; tsLog('absorbed', { room: key.slice(-6), broken: true }, 'warn'); return; }", "      if (!Array.isArray(arr)) { d.broken++; _tsRemove.call(localStorage, key); return; }") },
  { by: 'browser', catches: 'S1', name: 'an old key is removed before it is verified (and the copy misses rows)', m: (s) => once(s, "          if (all && now === raw) {", "          if (now === raw) {").replace("            var row = { room: room, n: rec.next++, i: ++maxI, e: tsClean(e) }; if (id) row.id = id;\n            S.msgs.add(row);", "            var row = { room: room, n: rec.next++, i: ++maxI, e: tsClean(e) }; if (id) row.id = id;\n            if (row.n % 7) S.msgs.add(row);") },
  { by: 'browser', catches: 'S2', name: 'the app starts twice (at once and after the chats)', m: (s) => once(s, "  TS.ready.then(function () { _tsEntry.apply(self, args); });", "  _tsEntry.apply(self, args); TS.ready.then(function () { _tsEntry.apply(self, args); });") },
  { by: 'browser', catches: 'S2', name: 'the app starts before the chats are in', m: (s) => once(s, "  if (TS.mode !== 'loading') return _tsEntry.apply(self, args);", "  return _tsEntry.apply(self, args);") },
  { by: 'browser', catches: 'S7', name: 'the other copy\'s refresh swaps in a new array', m: (s) => once(s, "    m.arr.length = 0; Array.prototype.push.apply(m.arr, keep);", "    m.arr = keep;") },
  { by: 'browser', catches: 'S7', name: 'no refresh from the other copy', m: (s) => once(s, "tsRefresh(d.room); };", "}; ") },
  { by: 'browser', catches: 'S10', name: 'journal mode drops the save', m: (s) => once(s, "  if (typeof k === 'string' && k.indexOf('tba_tr_') === 0 && TS.mode !== 'ls' && TS.mode !== 'journal') return tsSave(k.slice(7), v);", "  if (typeof k === 'string' && k.indexOf('tba_tr_') === 0) { if (TS.mode === 'journal') return; if (TS.mode !== 'ls') return tsSave(k.slice(7), v); }") },
  { by: 'browser', catches: 'S8', name: 'a quota error clears the dirty flag (the message is never retried)', m: (s) => once(s, "    TS.dirty.add(room);                           /* kept dirty: retried at the next save and on return */", "") },
  { by: 'browser', catches: 'S9', name: 'no IndexedDB breaks the app (no ls mode)', m: (s) => once(s, "  if (!window.indexedDB) { tsFinish('ls', 'no-indexeddb'); return; }", "") },
  { by: 'node', catches: 'E(a)', name: 'TS-1 draws on Math.random (the app\'s ids shift)', m: (s) => s.replace("return crypto.getRandomValues(new Uint32Array(1))[0].toString(36);", "return Math.random().toString(36).slice(2, 8);") },
  { by: 'node', catches: 'W', name: 'TS-1 is not p2Entry\'s wrapper (the app starts at once)', m: (s) => once(s, "p2Entry = function () {\n  if (TS.entered) return;", "var _unused = function () {\n  if (TS.entered) return;") },
  { by: 'node', catches: 'B1', name: 'something else is appended to the page', m: (s) => s, page: (h) => h.replace(/\n<\/script>\n<\/body>\n<\/html>$/, '\nvar extra = 1;\n</script>\n</body>\n</html>') }
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb30psm-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i]; let p, page;
  try { p = m.m(part); page = assemblePage({ parts: { [PARTS[0]]: p } }); if (m.page) page = m.page(page); } catch (e) { console.log('MISS  mutation did not apply: ' + m.name + ' — ' + e.message); missed++; continue; }
  const pf = path.join(dir, 'page-' + i + '.html'), tf = path.join(dir, 'part-' + i + '.js'); fs.writeFileSync(pf, page); fs.writeFileSync(tf, p);
  let out = '', exit = 0;
  try {
    out = m.by === 'browser'
      ? execFileSync('node', ['talkbridge/build/harness-30ps-browser.mjs', '--page', pf, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000 })
      : execFileSync('node', ['talkbridge/build/harness-30ps.mjs', '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_30PS_PAGE: pf, TB_30PS_PARTS: JSON.stringify({ [PARTS[0]]: tf }) }, timeout: 1800000 });
  } catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches + ' ') || l.startsWith('FAIL  ' + m.catches + ':'));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (other: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ') + ')')); missed++; }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log('\n30·pre-ship mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
