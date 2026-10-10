#!/usr/bin/env node
/* 29·ship assembler — INSTALL OPTIONAL (§7.19), candidate 1.

   Inputs (sha-checked): the ACCEPTED 29·pre-ship folder page and folder worker.
   Outputs, in talkbridge-app/ (nothing is hand-written; no accepted file is touched):
     bridge-turn29-ship.html               = the accepted page with sixteen banked edits + one part, IO-1
     tb-sw4.js                             = the accepted folder worker with four banked edits
     tb-manifest-turn29-ship.webmanifest   = scope "./", start_url this stage's page, id the folder (one app id for every stage)
     tb-manifest-turn29-ship-ios.webmanifest = scope "./", no start_url, no id (the load-time address carries, §7.19)  */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const FOLDER = 'talkbridge-app';
export const FOLDER_PATH = '/stuff/talkbridge-app/';
export const BASE_PAGE = FOLDER + '/bridge-turn29-pre-ship.html';
export const BASE_WORKER = FOLDER + '/tb-sw3.js';
export const FIXTURES = 'talkbridge/fixtures/ship/29s';
export const MANIFEST = FIXTURES + '/replacements.json';
export const PART = 'talkbridge/parts/io1-install-optional.js';
export const STAGE_PAGE = 'bridge-turn29-ship.html';
export const WORKER_NAME = 'tb-sw4.js';
export const MANIFEST_NAME = 'tb-manifest-turn29-ship.webmanifest';
export const MANIFEST_IOS_NAME = 'tb-manifest-turn29-ship-ios.webmanifest';
export const MANIFEST_SRC = 'tb-manifest-turn28.webmanifest';
export const OUT = { page: FOLDER + '/' + STAGE_PAGE, worker: FOLDER + '/' + WORKER_NAME, manifest: FOLDER + '/' + MANIFEST_NAME, manifestIos: FOLDER + '/' + MANIFEST_IOS_NAME };
export const ADDED_SYMBOLS = ['NF_DONE_KEY', 'NF_VIA_RELOAD', 'NF_TO', 'nf', 'p2Runs', 'nfLog', 'nfPerm', 'nfCanPush', 'nfState', 'nfMayAttempt', 'nfOfferDone', 'nfOfferEligible', 'nfQualifies', 'nfMountBar', 'nfDropBar', 'nfNote', 'nfOnYes', 'nfOnNo', 'nfReloadUrl', 'nfReloadForSteps', 'nfMakeTab', 'nfEnsureTab', 'nfEnsureInstallTab', 'nfSyncTab', 'nfRenderPane', 'nfRenderInstallPane', 'nfInstallNow', 'nfTurnOn', 'nfOnTabClick', 'nfOnInstallClick', 'nfOpenTab', 'nfOpenNotify', 'nfTick', 'nfInit'];
/* log markers the stage brings, by the literal name each log call carries (the p2_/p3_ prefixes are added by their helpers; 'nf_' is nfLog's own prefix, the way 'p3_' is p3Log's) */
export const ADDED_MARKERS = ['nf_', 'tab_boot', 'attempt_skipped', 'recipe_skipped', 'offer_shown', 'offer_declined', 'offer_taken', 'offer_blocked', 'tab_shown', 'tab_hidden', 'ios_reload', 'ios_steps', 'init_failed', 'install_available', 'install_tab_shown', 'install_prompt', 'install_done'];
export const REMOVED_MARKERS = ['gate_shown'];                    /* p2ShowGate is gone with the gate it showed */
export const TAIL = '\n</script>\n</body>\n</html>';

function manifestJson() { return JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')); }
export function basePage() { const m = manifestJson(); const b = fs.readFileSync(path.join(root, BASE_PAGE)); if (sha(b) !== m.base_page_sha256) throw new Error('assemble-29s: ' + BASE_PAGE + ' is not the accepted 29·pre-ship page (' + sha(b).slice(0, 12) + ' ≠ ' + m.base_page_sha256.slice(0, 12) + ')'); return b.toString('utf8'); }
export function baseWorker() { const m = manifestJson(); const b = fs.readFileSync(path.join(root, BASE_WORKER)); if (sha(b) !== m.base_worker_sha256) throw new Error('assemble-29s: ' + BASE_WORKER + ' is not the accepted folder worker (' + sha(b).slice(0, 12) + ' ≠ ' + m.base_worker_sha256.slice(0, 12) + ')'); return b.toString('utf8'); }
function loadReps(list) {
  return list.map((r) => {
    const find = fs.readFileSync(path.join(root, FIXTURES, r.find), 'utf8'), replace = fs.readFileSync(path.join(root, FIXTURES, r.replace), 'utf8');
    if (sha(find).slice(0, 12) !== r.sha_find || sha(replace).slice(0, 12) !== r.sha_replace) throw new Error('assemble-29s: replacement bytes moved: ' + r.id);
    return { id: r.id, find, replace };
  });
}
export function pageReplacements() { return loadReps(manifestJson().page); }
export function workerReplacements() { return loadReps(manifestJson().worker); }
function apply(out, reps, keep, what) {
  for (const r of reps) {
    if (keep.has(r.id)) continue;
    const n = out.split(r.find).length - 1;
    if (n !== 1) throw new Error('assemble-29s: ' + what + ' replacement ' + r.id + ' finds its text ' + n + ' times (must be exactly 1)');
    if (out.indexOf(r.replace) !== -1) throw new Error('assemble-29s: ' + what + ' replacement ' + r.id + ' already present');
    out = out.replace(r.find, () => r.replace);
  }
  return out;
}
export function assemblePage(opts) {
  opts = opts || {}; let out = basePage();
  if (!out.endsWith(TAIL)) throw new Error('assemble-29s: unexpected baseline tail');
  out = apply(out, opts.replacements || pageReplacements(), new Set(opts.keepReplacements || []), 'page');
  const part = opts.part != null ? opts.part : fs.readFileSync(path.join(root, PART), 'utf8');
  return out.slice(0, -TAIL.length) + '\n\n' + part + TAIL;
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

if (process.argv[1] && process.argv[1].endsWith('assemble-29s.mjs')) {
  let files; try { files = assembleAll(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.argv.includes('--check')) {
    let bad = 0;
    for (const [f, c] of Object.entries(files)) { const p = path.join(root, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.error('assemble-29s --check: ' + f + ' is not the assembled output'); bad++; } }
    if (bad) process.exit(1);
    console.log('verified ' + Object.keys(files).length + ' files · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])) + ' · ' + WORKER_NAME + ' sha256=' + sha(Buffer.from(files[OUT.worker])));
  } else {
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(root, f), c);
    console.log('wrote ' + Object.keys(files).length + ' files to ' + FOLDER + '/ · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])) + ' · ' + WORKER_NAME + ' sha256=' + sha(Buffer.from(files[OUT.worker])));
  }
}
