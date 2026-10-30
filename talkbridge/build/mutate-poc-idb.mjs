#!/usr/bin/env node
/* IndexedDB proof mutation gate (plan §7.23): each mutation breaks one rule in a copy of the page; the NAMED test of
   harness-poc-idb.mjs must fail. Nothing on disk changes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const page = fs.readFileSync('talkbridge/poc/idb/index.html', 'utf8');
const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('mutation text found ' + n + 'x: ' + a.slice(0, 70)); return s.replace(a, () => b); };
const M = [
  { catches: 'P3', name: 'an append is lost now and then', m: (s) => once(s, "      S.msgs.add({ room: room, seq: seq, id: msg.id, ts: msg.ts || Date.now(), m: msg });", "      if (seq % 50) S.msgs.add({ room: room, seq: seq, id: msg.id, ts: msg.ts || Date.now(), m: msg });") },
  { catches: 'C2', name: 'the number is taken OUTSIDE the write (two writers collide)', m: (s) => once(s, "function append(room, msg, opts) {\n  return tx(", "function append(room, msg, opts) {\n  return tx('rooms', 'readonly', function (S) { var b = {}; req(S.rooms.get(room)).then(function (r) { b.n = r ? r.n : 0; }); return b; }).then(function (b) { return tx(['rooms', 'msgs'], 'readwrite', function (S) { var seq = b.n + 1; S.msgs.put({ room: room, seq: seq, id: undefined, ts: 0, m: msg }); S.rooms.put({ room: room, n: seq }); return { seq: seq }; }, opts); }).then(function (x) { return x.seq; });\n  return tx(") },
  { catches: 'P5', name: 'a room is copied in two transactions (a cut leaves half a room)', m: (s) => once(s, "S.rooms.put({ room: 'mig:cut', n: 100 }); t.abort(); })", "S.rooms.put({ room: 'mig:cut', n: 100 }); })") },
  { catches: 'P5', name: 'a re-run copies again (duplicates)', m: (s) => once(s, "if (r && r.src === hash) { box.v = 'same'; return; }", "") },
  { catches: 'P4', name: 'a write is counted before it completes', m: (s) => once(s, "for (fired = 0; fired < 100; fired++) one(fired).catch(function () {});", "for (fired = 0; fired < 100; fired++) { var s0 = stGet(); s0.p4.committed += 0.5; stSet(s0); one(fired).catch(function () {}); }") },
  { catches: 'P6', name: 'no reopen after the connection is lost', m: (s) => once(s, "    if (!RETRY[e && e.name]) throw e;", "    throw e;") },
  { catches: 'S1', name: 'the page writes a key in the app\'s storage', m: (s) => once(s, "function boot() {", "function boot() {\n  try { localStorage.setItem('tbpoc_run', '1'); } catch (_) {}") },
  { catches: 'S4', name: 'message text reaches the log', m: (s) => once(s, "  list.forEach(function (s) { d.kb += s.raw.length;", "  d.sample = (list[0] && list[0].raw || '').slice(0, 120);\n  list.forEach(function (s) { d.kb += s.raw.length;") },
  { catches: 'P8', name: 'the test store is left behind', m: (s) => once(s, "  return wipe().then(function () { return indexedDB.databases ? indexedDB.databases() : null; }).then(function (l) {", "  return Promise.resolve().then(function () { return indexedDB.databases ? indexedDB.databases() : null; }).then(function (l) {") },
  { catches: 'Q1', name: 'a full store loses what it had committed (the room is dropped on error)', m: (s) => once(s, "    return next().catch(function (e) { err = e; });", "    return next().catch(function (e) { err = e; return dropRoom(room); });") }
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tbpocm-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i]; let p;
  try { p = m.m(page); } catch (e) { console.log('MISS  mutation did not apply: ' + m.name + ' — ' + e.message); missed++; continue; }
  const f = path.join(dir, 'page-' + i + '.html'); fs.writeFileSync(f, p);
  let out = '', exit = 0;
  try { out = execFileSync('node', ['talkbridge/build/harness-poc-idb.mjs', '--page', f, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000 }); }
  catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches + ' '));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (other: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 30)).join(' | ') + ')')); missed++; }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log('\nIndexedDB proof mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
