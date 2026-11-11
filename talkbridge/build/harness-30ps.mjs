#!/usr/bin/env node
/* 30·pre-ship gate — CHATS IN INDEXEDDB (§7.24, TS-1). Structure (B1, B2, W the wraps), the install files (F), and the differential
   (E): the whole 28·post-ship script on the ACCEPTED 30·base page and on this stage, identical but the declared differences —
   (a) as jsdom is (no IndexedDB → TS-1's mode ls: today's app), (b) with an IndexedDB in each phone (fake-indexeddb, TB_RIG_IDB):
   the whole script on the new store. The browser behaviour (absorption, the hold, rows, two copies, quota, fallbacks) is gated in
   real Chromium by harness-30ps-browser.mjs. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basePage, assemblePage, assembleManifests, applyIdentity, IDENTITY, PARTS, PART_DECL, STAGE_PAGE, STAGE_TAG, MANIFEST_NAME, MANIFEST_IOS_NAME, TAIL } from './assemble-30ps.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const quiet = process.argv.includes('--quiet');
const OVR = process.env.TB_30PS_PARTS ? JSON.parse(process.env.TB_30PS_PARTS) : {};
const PT = Object.fromEntries(PARTS.map((f) => [f, fs.readFileSync(OVR[f] || path.join(root, f), 'utf8')]));
const stage = process.env.TB_30PS_PAGE ? fs.readFileSync(process.env.TB_30PS_PAGE, 'utf8') : fs.readFileSync(path.join(root, 'talkbridge-app', STAGE_PAGE), 'utf8');
const base = basePage();
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const contractOf = (t) => { const m = /\/\* @contract([\s\S]*?)\*\//.exec(t); return m ? m[1] : ''; };

await T('B1 the stage is the accepted 30·base page + its identity edits (its manifests ×2, the build line) + TS-1 appended — nothing else', () => {
  assert(stage === assemblePage({ parts: PT }), 'the stage is not the assembled output');
  const edited = applyIdentity(base);
  for (const r of IDENTITY) { assert(base.split(r.find).length - 1 === r.n, r.id + ' not ' + r.n + 'x in the base'); assert(stage.indexOf(r.find) === -1, r.id + ' left in the stage'); }
  const head = edited.slice(0, -TAIL.length); assert(stage.startsWith(head) && stage.endsWith(TAIL), 'the edited base is not the stage\'s head');
  assert(stage.slice(head.length, -TAIL.length) === PARTS.map((f) => '\n\n' + PT[f]).join(''), 'more than TS-1 was appended');
});
for (const P of PART_DECL) await T('B2 ' + path.basename(P.file) + ': each symbol it adds is declared, bound once in the stage, never in the base; its markers are declared and logged; it replaces nothing', () => {
  const text = PT[P.file], c = contractOf(text);
  assert(/replaces:\s*\(none\)/.test(c), 'replaces');
  const declared = (/adds:([^\n]*)/.exec(c) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean);
  assert(declared.length === P.symbols.length && P.symbols.every((x) => declared.includes(x)), 'declared ' + declared.join(',') + ' ≠ ' + P.symbols.join(','));
  const js = code(stage), bjs = code(base);
  for (const x of P.symbols) { const re = new RegExp('(?:^function\\s+' + x + '\\s*\\(|^var\\s+(?:[^;\\n]*[ ,])?' + x + '\\s*=)', 'mg'); assert((js.match(re) || []).length === 1, x + ' bound ' + (js.match(re) || []).length + 'x'); assert(!(bjs.match(re) || []).length, x + ' already in the base'); }
  for (const mk of P.markers) { assert(bjs.indexOf("'" + mk + "'") === -1 && bjs.indexOf("'" + P.prefix) === -1, mk + ' in the base'); assert(text.indexOf(P.logger + "('" + mk.slice(P.prefix.length) + "'") !== -1, mk + ' never logged'); }
});
await T('W the wraps are exactly the declared four, each once, keeping the original: lsSet (tba_tr_* only), loadTrCore, Storage.prototype.removeItem (tba_tr_* only) and p2Entry — TS-1 is p2Entry\'s OUTERMOST wrapper (the last assignment in the page; the live DOMContentLoaded listener calls it by name), run once', () => {
  const t = code(PT[PARTS[0]]);
  for (const w of ['lsSet', 'loadTrCore', 'p2Entry', 'Storage.prototype.removeItem']) assert((t.match(new RegExp('^' + w.replace(/\./g, '\\.') + ' = function', 'mg')) || []).length === 1, w + ' not wrapped once');
  assert(/var _tsLsSet = lsSet, _tsLoadTrCore = loadTrCore, _tsEntry = p2Entry, _tsRemove = Storage\.prototype\.removeItem;/.test(t), 'originals not kept');
  const js = code(stage), assigns = [...js.matchAll(/^\s*p2Entry = function/mg)].map((m) => m.index), tsAt = js.indexOf('var TS = {');
  assert(assigns.length >= 4 && assigns[assigns.length - 1] > tsAt, 'TS-1 is not the last p2Entry wrapper');
  assert(/document\.addEventListener\('DOMContentLoaded', function \(\) \{ p2Entry\(\); \}\);/.test(js), 'the live listener does not call p2Entry by name');
  assert(/if \(TS\.entered\) return; TS\.entered = true;/.test(t), 'not run once');
  assert(/k\.indexOf\('tba_tr_'\) === 0/.test(t) && (t.match(/indexOf\('tba_tr_'\) === 0/g) || []).length >= 3, 'the tba_tr_ scoping');
});
await T('F the stage\'s manifests: Android starts THIS page (teal background, the folder id); the iPhone\'s is the accepted one; the page links them by platform and swaps to them; the build line names the stage', () => {
  const m = assembleManifests(), c = JSON.parse(m.chrome), i = JSON.parse(m.ios);
  assert(c.start_url === './' + STAGE_PAGE && c.id === '/stuff/talkbridge-app/' && c.background_color === '#2E8B8B', 'chrome ' + JSON.stringify(c));
  assert(!('start_url' in i) && !('id' in i), 'ios ' + JSON.stringify(i));
  for (const f of [MANIFEST_NAME, MANIFEST_IOS_NAME]) assert(fs.readFileSync(path.join(root, 'talkbridge-app', f), 'utf8') === (f === MANIFEST_NAME ? m.chrome : m.ios), f + ' is not the assembled output');
  assert(stage.split("'" + MANIFEST_IOS_NAME + "' : '" + MANIFEST_NAME + "'").length - 1 === 2 && stage.indexOf('tb-manifest-turn30-base') === -1, 'manifest names');
  assert(stage.indexOf("log('build', { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "'") !== -1, 'build line');
});

/* E — the whole 28·post-ship script on both builds, in a child process per variant (the rig reads TB_RIG_IDB at load) */
function variant(idb) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tb30ps-')), 'e.json');
  execFileSync(process.execPath, [path.join(root, 'talkbridge/build/harness-30ps-e.mjs')], { stdio: 'ignore', env: { ...process.env, TB_RIG_IDB: idb ? '1' : '', TB_30PS_OUT: f, TB_30PS_STAGE_FILE: process.env.TB_30PS_PAGE || path.join(root, 'talkbridge-app', STAGE_PAGE) }, timeout: 900000 });
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
for (const [label, idb] of [['E(a) jsdom as it is — no IndexedDB, TS-1 in mode ls (today\'s app)', false], ['E(b) an IndexedDB in each phone — the whole script on the new store', true]]) {
  let V; try { V = variant(idb); } catch (e) { await T(label + ': ran', () => { throw new Error(String(e.stdout || e.message).slice(-600)); }); continue; }
  for (const r of V.rows) await T(label + ': ' + r.n, () => assert(r.ok, r.m));
}
console.log('\n30·pre-ship: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
