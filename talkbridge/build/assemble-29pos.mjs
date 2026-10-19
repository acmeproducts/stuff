#!/usr/bin/env node
/* 29·post-ship assembler — LOCALIZATION (§7.17), candidate 2: every word the app says, in the phone's language — one language everywhere, set by the first room (owner ruling 2026-10-12).

   Inputs (sha-checked): the ACCEPTED 29·ship folder page and folder worker.
   Outputs, in talkbridge-app/ (nothing is hand-written; no accepted file is touched):
     bridge-turn29-post-ship.html              = the accepted page with the GENERATED banked edits (l10n-edits.mjs from fixtures/l10n/inventory.json) + two parts: L1 (the table rides an early generated edit) and RK-1 (reachability, c4)
     tb-sw5.js                                 = the accepted folder worker with the generated worker edits (cards worded in the phone's app language)
     tb-manifest-turn29-post-ship.webmanifest  = scope "./", start_url this stage's page, id the folder (one app id for every stage)
     tb-manifest-turn29-post-ship-ios.webmanifest = scope "./", no start_url, no id (the load-time address carries, §7.19)  */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const FOLDER = 'talkbridge-app';
export const FOLDER_PATH = '/stuff/talkbridge-app/';
export const BASE_PAGE = FOLDER + '/bridge-turn29-ship.html';
export const BASE_WORKER = FOLDER + '/tb-sw4.js';
export const FIXTURES = 'talkbridge/fixtures/post-ship/29pos';
export const MANIFEST = FIXTURES + '/replacements.json';
export const PARTS = ['talkbridge/parts/l1-locale.js', 'talkbridge/parts/rk1-reach-mark.js'];   /* L1 (the table rides a banked edit early in the script) · RK-1 reachability (c4) */
export const PART = PARTS[0]; export const PART2 = PARTS[1];
export const STAGE_PAGE = 'bridge-turn29-post-ship.html';
export const WORKER_NAME = 'tb-sw5.js';
export const MANIFEST_NAME = 'tb-manifest-turn29-post-ship.webmanifest';
export const MANIFEST_IOS_NAME = 'tb-manifest-turn29-post-ship-ios.webmanifest';
export const MANIFEST_SRC = 'tb-manifest-turn28.webmanifest';
export const OUT = { page: FOLDER + '/' + STAGE_PAGE, worker: FOLDER + '/' + WORKER_NAME, manifest: FOLDER + '/' + MANIFEST_NAME, manifestIos: FOLDER + '/' + MANIFEST_IOS_NAME };
export const EDIT_SYMBOLS = ['L10N', 'L10N_MT', 'L10N_RTL', 'l10nState'];   /* bound by the table edit on the LANG_ORDER line */
export const EDIT_FUNCTIONS = ['rnOnGreeting'];   /* c7: RN-1's banked edit beside K4 adds this function (a part would be a third part for one function) */
export const ADDED_SYMBOLS = ['l10nLog', 'l10nFromNavigator', 'l10nUserLang', 'l10nLang', 'l10nAdopt', 'l10nIn', 'l10n', 'l10nPill', 'l10nLocale', 'l10nDir', 'l10nLandingLang', 'l10nCap', 'l10nApplyCaps', 'l10nApplyDom', 'l10nRerender', 'l10nFillLangSelect', 'l10nPostLang', 'l10nApply', 'l10nStyle', 'l10nTick', 'l10nInit', 'rkState', 'rkLog', 'rkLine', 'rkRender', 'rkOnPeer', 'rkOnCallReach', 'rkInit'];
export const ADDED_MARKERS = ['l10n_', 'user_lang_set', 'user_lang_adopted', 'user_lang_changed', 'missing', 'applied', 'rerender_failed', 'rk_', 'reach_mark', 'reach_unreachable', 'rn_name_adopted'];
export const ADDED_RECEIVED_TYPES = ['call-reach'];   /* relay v6.11 → app; the app sends no new type */   /* l10nLog's literals (its prefix is 'l10n_'); 'init_failed' is RH-1's literal too and is not new */
export const REMOVED_SYMBOLS = ['I18N'];   /* the two-language joiner table is retired: the table has every language */
export const TAIL = '\n</script>\n</body>\n</html>';

function manifestJson() { return JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')); }
export function basePage() { const m = manifestJson(); const b = fs.readFileSync(path.join(root, BASE_PAGE)); if (sha(b) !== m.base_page_sha256) throw new Error('assemble-29pos: ' + BASE_PAGE + ' is not the accepted 29·ship page (' + sha(b).slice(0, 12) + ' ≠ ' + m.base_page_sha256.slice(0, 12) + ')'); return b.toString('utf8'); }
export function baseWorker() { const m = manifestJson(); const b = fs.readFileSync(path.join(root, BASE_WORKER)); if (sha(b) !== m.base_worker_sha256) throw new Error('assemble-29pos: ' + BASE_WORKER + ' is not the accepted folder worker (' + sha(b).slice(0, 12) + ')'); return b.toString('utf8'); }
function loadReps(list) {
  return list.map((r) => {
    const find = fs.readFileSync(path.join(root, FIXTURES, r.find), 'utf8'), replace = fs.readFileSync(path.join(root, FIXTURES, r.replace), 'utf8');
    if (sha(find).slice(0, 12) !== r.sha_find || sha(replace).slice(0, 12) !== r.sha_replace) throw new Error('assemble-29pos: replacement bytes moved: ' + r.id);
    return { id: r.id, find, replace, keys: r.keys || [] };
  });
}
export function pageReplacements() { return loadReps(manifestJson().page); }
export function workerReplacements() { return loadReps(manifestJson().worker); }
function apply(out, reps, keep, what) {
  for (const r of reps) {
    if (keep.has(r.id)) continue;
    const n = out.split(r.find).length - 1;
    if (n !== 1) throw new Error('assemble-29pos: ' + what + ' replacement ' + r.id + ' finds its text ' + n + ' times (must be exactly 1)');
    if (r.replace !== '' && out.indexOf(r.replace) !== -1) throw new Error('assemble-29pos: ' + what + ' replacement ' + r.id + ' already present');
    out = out.replace(r.find, () => r.replace);
  }
  return out;
}
export function assemblePage(opts) {
  opts = opts || {}; let out = basePage();
  if (!out.endsWith(TAIL)) throw new Error('assemble-29pos: unexpected baseline tail');
  out = apply(out, opts.replacements || pageReplacements(), new Set(opts.keepReplacements || []), 'page');
  const part = opts.part != null ? opts.part : fs.readFileSync(path.join(root, PART), 'utf8');
  const part2 = opts.part2 != null ? opts.part2 : fs.readFileSync(path.join(root, PART2), 'utf8');
  return out.slice(0, -TAIL.length) + '\n\n' + part + '\n\n' + part2 + TAIL;
}
export function assembleWorker(opts) {
  opts = opts || {};
  return apply(baseWorker(), opts.workerReplacements || workerReplacements(), new Set(opts.keepWorkerReplacements || []), 'worker');
}
export function assembleManifests(opts) {
  opts = opts || {}; const src = JSON.parse(fs.readFileSync(path.join(root, MANIFEST_SRC), 'utf8')); const chrome = {}, ios = {};
  for (const k of Object.keys(src)) {
    if (k === 'scope') { chrome.scope = './'; ios.scope = './'; if (!opts.noStartUrl) { chrome.start_url = './' + STAGE_PAGE; chrome.id = FOLDER_PATH; } continue; }
    chrome[k] = src[k]; ios[k] = src[k];
  }
  if (opts.iosStartUrl) ios.start_url = './' + STAGE_PAGE;
  return { chrome: JSON.stringify(chrome, null, 2) + '\n', ios: JSON.stringify(ios, null, 2) + '\n' };
}
export function assembleAll(opts) {
  opts = opts || {}; const m = assembleManifests(opts);
  return { [OUT.page]: assemblePage(opts), [OUT.worker]: assembleWorker(opts), [OUT.manifest]: m.chrome, [OUT.manifestIos]: m.ios };
}

if (process.argv[1] && process.argv[1].endsWith('assemble-29pos.mjs')) {
  let files; try { files = assembleAll(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.argv.includes('--check')) {
    let bad = 0;
    for (const [f, c] of Object.entries(files)) { const p = path.join(root, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.error('assemble-29pos --check: ' + f + ' is not the assembled output'); bad++; } }
    if (bad) process.exit(1);
    console.log('verified ' + Object.keys(files).length + ' files · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])) + ' · ' + WORKER_NAME + ' sha256=' + sha(Buffer.from(files[OUT.worker])));
  } else {
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(root, f), c);
    console.log('wrote ' + Object.keys(files).length + ' files to ' + FOLDER + '/ · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])) + ' · ' + WORKER_NAME + ' sha256=' + sha(Buffer.from(files[OUT.worker])));
  }
}
