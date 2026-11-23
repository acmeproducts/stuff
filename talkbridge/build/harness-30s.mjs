#!/usr/bin/env node
/* 30·ship gate — SEVEN SEPARATE FIXES (§7.25). Structure (B1, B2, W), the install files (F), the build record (I), and the
   differential (E): the whole 28·post-ship script on the ACCEPTED 30·pre-ship page and on this stage, identical but the declared
   differences — (a) as jsdom is (no IndexedDB: the chat store in mode ls), (b) with an IndexedDB in each phone. Each part's own
   behaviour is gated in real Chromium by harness-30s-browser.mjs. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basePage, assemblePage, assembleManifests, applyIdentity, IDENTITY, PARTS, PART_DECL, STAGE_PAGE, STAGE_TAG, BUILT, BUILT_AT, MANIFEST_NAME, MANIFEST_IOS_NAME, TAIL } from './assemble-30s.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const quiet = process.argv.includes('--quiet');
const OVR = process.env.TB_30S_PARTS ? JSON.parse(process.env.TB_30S_PARTS) : {};
const PT = Object.fromEntries(PARTS.map((f) => [f, fs.readFileSync(OVR[f] || path.join(root, f), 'utf8')]));
const stage = process.env.TB_30S_PAGE ? fs.readFileSync(process.env.TB_30S_PAGE, 'utf8') : fs.readFileSync(path.join(root, 'talkbridge-app', STAGE_PAGE), 'utf8');
const base = basePage();
let pass = 0, fail = 0;
const T = async (n, f) => { try { await f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const contractOf = (t) => { const m = /\/\* @contract([\s\S]*?)\*\//.exec(t); return m ? m[1] : ''; };
const rx = (s) => s.replace(/[.$]/g, (c) => '\\' + c);

await T('B1 the stage is the accepted 30·pre-ship page + its identity edits (its manifests ×2, the build record, the six PW edits of c3) + the parts appended in order — nothing else', () => {
  assert(stage === assemblePage({ parts: PT }), 'the stage is not the assembled output');
  const edited = applyIdentity(base);
  for (const r of IDENTITY) { assert(base.split(r.find).length - 1 === r.n, r.id + ' not ' + r.n + 'x in the base'); assert(r.replace.indexOf(r.find) !== -1 ? stage.split(r.replace).length - 1 === r.n : stage.indexOf(r.find) === -1, r.id + ' left in the stage'); }
  const head = edited.slice(0, -TAIL.length); assert(stage.startsWith(head) && stage.endsWith(TAIL), 'the edited base is not the stage\'s head');
  assert(stage.slice(head.length, -TAIL.length) === PARTS.map((f) => '\n\n' + PT[f]).join(''), 'more than the parts was appended');
});
for (const P of PART_DECL) await T('B2 ' + path.basename(P.file) + ': each symbol it adds is declared, bound once in the stage, never in the base; its markers are its own prefix, absent from the base, and logged; it replaces nothing', () => {
  const text = PT[P.file], c = contractOf(text);
  assert(/replaces:\s*\(none\)/.test(c), 'replaces');
  const declared = (/adds:([^\n]*)/.exec(c) || ['', ''])[1].split(',').map((x) => x.trim()).filter(Boolean);
  assert(declared.length === P.symbols.length && P.symbols.every((x) => declared.includes(x)), 'declared ' + declared.join(',') + ' ≠ ' + P.symbols.join(','));
  const js = code(stage), bjs = code(base);
  for (const x of P.symbols) {
    const re = new RegExp('(?:^function\\s+' + rx(x) + '\\s*\\(|^var\\s+(?:[^;\\n]*[ ,])?' + rx(x) + '\\s*=)', 'mg');
    assert((js.match(re) || []).length === 1, x + ' bound ' + (js.match(re) || []).length + 'x');
    assert(!new RegExp('(^|[^A-Za-z0-9_.$])' + rx(x) + '(?![A-Za-z0-9_$])').test(bjs), x + ' already named in the base');
  }
  assert(bjs.indexOf("'" + P.prefix) === -1, P.prefix + ' already a marker prefix in the base');
  for (const mk of P.markers) { assert(mk.indexOf(P.prefix) === 0, mk + ' not ' + P.prefix); assert(text.indexOf("Log('" + mk.slice(P.prefix.length) + "'") !== -1 || text.indexOf("log('" + mk + "'") !== -1, mk + ' never logged'); }
});
await T('W the wraps are exactly the declared ones, each assigned once in its part, the original kept and called; roomCardHtmlCore: TN-1, MC-1, GK-1 in that order; RT-1 outside RL-1; RL-1 no longer wraps closePanel', () => {
  for (const P of PART_DECL) {
    const t = code(PT[P.file]), c = contractOf(PT[P.file]);
    for (const w of P.wraps) {
      assert((t.match(new RegExp('^' + rx(w) + ' = function', 'mg')) || []).length === 1, path.basename(P.file) + ': ' + w + ' not wrapped once');
      assert(new RegExp('(?:var |, )(_\\w+) = ' + rx(w) + '[,;]').test(t), path.basename(P.file) + ': ' + w + ' original not kept');
      assert(c.indexOf(w) !== -1, path.basename(P.file) + ': ' + w + ' not in its contract');
    }
    const assigned = [...t.matchAll(/^([A-Za-z_$][\w$.]*) = function/mg)].map((m) => m[1]);
    assert(assigned.every((a) => P.wraps.includes(a)), path.basename(P.file) + ' reassigns undeclared ' + assigned.filter((a) => !P.wraps.includes(a)).join(','));
  }
  const js = code(stage), tn = js.indexOf('var _tnCard = roomCardHtmlCore'), mc = js.indexOf('var _mcCard = roomCardHtmlCore'), gk = js.indexOf('var _gkCard = roomCardHtmlCore');
  assert(tn > 0 && mc > tn && gk > mc, 'roomCardHtmlCore must be wrapped TN-1, then MC-1, then GK-1');
  const rl = code(PT[PART_DECL.find((d) => d.prefix === 'rl_').file]);
  assert(!/^closePanel = function/m.test(rl), 'RL-1 must not wrap closePanel (c2: closing the rail acknowledges nothing)');
  const rlAt = js.indexOf('var _rlSend = cr3Send'), rtAt = js.indexOf('var _rtRoute = cr3RouteEvent');
  assert(rlAt > 0 && rtAt > rlAt, 'RT-1 must be the outer cr3RouteEvent wrap (a route held in a call never selects)');
});
await T('PW0 no field is a password in the shipped code: no type=password anywhere, no "new-password" outside comments; the four key fields are masked text with the managers\' ignore flags (c3)', () => {
  const js = code(stage);
  assert(!/type\s*=\s*["']password["']/i.test(stage), 'a type=password is left in the page');
  assert(js.indexOf('new-password') === -1, '"new-password" is still set somewhere');
  for (const k of ['k-dg', 'k-tid', 'k-tok', 'k-pat']) assert(stage.indexOf('<input class="field-input nopw-mask" type="text" id="' + k + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">') !== -1, k + ' is not the masked text field');
});
await T('IL0 the doors are read fresh (cache no-store), strictly (the forward line only, in the folder), and the door files still have that exact forward line', () => {
  const t = PT[PARTS.find((f) => /il1-invite-door/.test(f))];
  assert(/fetch\(door, \{ cache: 'no-store' \}\)/.test(t), 'not no-store');
  assert(t.indexOf('/\\/talkbridge-app\\/$/.test(ilDir())') !== -1, 'not limited to the folder');
  const re = /location\.replace\('\.\/(bridge-[A-Za-z0-9-]+\.html)'\s*\+\s*location\.search\s*\+\s*location\.hash\)/;
  for (const d of ['index.html', 'next.html']) assert(re.test(fs.readFileSync(path.join(root, 'talkbridge-app', d), 'utf8')), d + ' no longer has the forward line IL-1 reads');
});
await T('I the build record: the stage records itself once (window.TB_STAGE: tag, page, date, a full ISO time with Z) and logs it; no other stage\'s tag is recorded', () => {
  const rec = "window.TB_STAGE = { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "', built: '" + BUILT + "', at: '" + BUILT_AT + "' }; log('build', window.TB_STAGE, 'ok');";
  assert(stage.split(rec).length - 1 === 1, 'the record');
  assert(/T\d\d:\d\d:\d\dZ$/.test(BUILT_AT), 'at is not a full ISO time');
  assert(stage.indexOf("c: 'turn30-pre-ship-c1'") === -1, '30·pre-ship tag still recorded');
});
await T('F the stage\'s manifests: Android starts THIS page (teal background, the folder id); the iPhone\'s is the accepted one; the page links them by platform and swaps to them', () => {
  const m = assembleManifests(), c = JSON.parse(m.chrome), i = JSON.parse(m.ios);
  assert(c.start_url === './' + STAGE_PAGE && c.id === '/stuff/talkbridge-app/' && c.background_color === '#2E8B8B', 'chrome ' + JSON.stringify(c));
  assert(!('start_url' in i) && !('id' in i), 'ios ' + JSON.stringify(i));
  for (const f of [MANIFEST_NAME, MANIFEST_IOS_NAME]) assert(fs.readFileSync(path.join(root, 'talkbridge-app', f), 'utf8') === (f === MANIFEST_NAME ? m.chrome : m.ios), f + ' is not the assembled output');
  assert(stage.split("'" + MANIFEST_IOS_NAME + "' : '" + MANIFEST_NAME + "'").length - 1 === 2 && stage.indexOf('tb-manifest-turn30-pre-ship') === -1, 'manifest names');
});

/* E — the whole 28·post-ship script on both builds, in a child process per variant (the rig reads TB_RIG_IDB at load) */
function variant(idb) {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tb30s-')), 'e.json');
  execFileSync(process.execPath, [path.join(root, 'talkbridge/build/harness-30s-e.mjs')], { stdio: 'ignore', env: { ...process.env, TB_RIG_IDB: idb ? '1' : '', TB_30S_OUT: f, TB_30S_STAGE_FILE: process.env.TB_30S_PAGE || path.join(root, 'talkbridge-app', STAGE_PAGE) } });
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}
for (const [label, idb] of [['E(a) jsdom as it is — the chat store in mode ls', false], ['E(b) an IndexedDB in each phone — the chat store in mode idb', true]]) {
  let V; try { V = variant(idb); } catch (e) { await T(label + ': ran', () => { throw new Error(String(e.stdout || e.message).slice(-600)); }); continue; }
  for (const r of V.rows) await T(label + ': ' + r.n, () => assert(r.ok, r.m));
}
console.log('\n30·ship: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
