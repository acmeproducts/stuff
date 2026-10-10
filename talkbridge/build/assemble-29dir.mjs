#!/usr/bin/env node
/* 29·pre-ship assembler — THE DIRECTORY RELEASE (§7.5 + §7.12), candidate 1.

   Everything in /stuff/talkbridge-app/ is produced here from accepted sources and
   banked edits; nothing in the folder is hand-written and no root file changes.
     index.html                 = the 29·pre-base bytes (sha-checked) with the three banked
                                  page edits (E1 head manifest, E2 the manifest swap picks the
                                  folder's by platform, E5 the fastText path) + the DR-1 part
                                  (E3 legacy-worker retirement, E4 the build line)
     tb-sw3.js                  = root tb-sw3.js (sha-checked) with two banked edits (W0 header,
                                  W1 APP_FILE '') + the R-3 fetch handler appended
     tb-manifest.webmanifest    = tb-manifest-turn28.webmanifest content with scope "./",
                                  start_url "./", id "/stuff/talkbridge-app/" (R-1, R-2, E1)
     tb-manifest-ios.webmanifest= the same with scope "./" and NO start_url / id (the load-time
                                  address carries into the Home Screen copy, §7.19)
     icon-v2-*.png, flags.png   = byte copies of the root files the page and the worker load   */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn29-pre-base.html';
export const BASE_SHA = 'c5e9b5ebb402b49ab2b0eebf6b41732efe5808302ac4eb19ed4f66282ee5159b';
export const WORKER_FILE = 'tb-sw3.js';
export const MANIFEST_SRC = 'tb-manifest-turn28.webmanifest';
export const FOLDER = 'talkbridge-app';
export const FOLDER_PATH = '/stuff/talkbridge-app/';
export const FIXTURES = 'talkbridge/fixtures/dir/29ps';
export const MANIFEST = FIXTURES + '/replacements.json';
export const PAGE_PARTS = ['talkbridge/parts/dr1-folder.js'];
export const WORKER_PARTS = ['talkbridge/parts/dr-sw-fetch.js'];
export const COPIES = ['icon-v2-180.png', 'icon-v2-192.png', 'icon-v2-512.png', 'icon-v2-maskable-512.png', 'icon-v2-badge-96.png', 'flags.png'];
export const ADDED_MARKERS = ['dr_root_worker_retired', 'dr_retire_deferred', 'dr_retire_failed'];
export const ADDED_SYMBOLS = ['drRetireRoot'];
export const TAIL = '\n</script>\n</body>\n</html>';
export const OUT = { page: FOLDER + '/index.html', worker: FOLDER + '/tb-sw3.js', manifest: FOLDER + '/tb-manifest.webmanifest', manifestIos: FOLDER + '/tb-manifest-ios.webmanifest' };

function checked(file, want) { const b = fs.readFileSync(path.join(root, file)); if (want && sha(b) !== want) throw new Error('assemble: ' + file + ' is not the expected bytes\n  expected ' + want + '\n  found    ' + sha(b)); return b; }
export function base() { return checked(BASE_FILE, BASE_SHA).toString('utf8'); }
export function workerSrc() { const m = manifestJson(); const b = checked(WORKER_FILE, null); if (sha(b).slice(0, 12) !== m.worker_sha12) throw new Error('assemble: root ' + WORKER_FILE + ' moved (' + sha(b).slice(0, 12) + ' ≠ ' + m.worker_sha12 + ')'); return b.toString('utf8'); }
function manifestJson() { return JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')); }
function loadReps(list) {
  return list.map((r) => {
    const find = fs.readFileSync(path.join(root, FIXTURES, r.find), 'utf8'), replace = fs.readFileSync(path.join(root, FIXTURES, r.replace), 'utf8');
    if (sha(find).slice(0, 12) !== r.sha_find || sha(replace).slice(0, 12) !== r.sha_replace) throw new Error('assemble: replacement bytes moved: ' + r.id);
    return { id: r.id, find, replace };
  });
}
export function pageReplacements() { return loadReps(manifestJson().page); }
export function workerReplacements() { return loadReps(manifestJson().worker_edits); }
function apply(out, reps, keep, what) {
  for (const r of reps) {
    if (keep.has(r.id)) continue;
    const n = out.split(r.find).length - 1;
    if (n !== 1) throw new Error('assemble: ' + what + ' replacement ' + r.id + ' finds its text ' + n + ' times (must be exactly 1)');
    if (out.indexOf(r.replace) !== -1) throw new Error('assemble: ' + what + ' replacement ' + r.id + ' already present');
    out = out.replace(r.find, () => r.replace);
  }
  return out;
}
export function assemblePage(opts) {
  opts = opts || {};
  let out = base();
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  out = apply(out, opts.replacements || pageReplacements(), new Set(opts.keepReplacements || []), 'page');
  const parts = PAGE_PARTS.map((p, i) => (opts.parts && opts.parts[i] != null) ? opts.parts[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return out.slice(0, -TAIL.length) + parts.map((p) => '\n\n' + p).join('') + TAIL;
}
export function assembleWorker(opts) {
  opts = opts || {};
  let out = workerSrc();
  out = apply(out, opts.workerReplacements || workerReplacements(), new Set(opts.keepWorkerReplacements || []), 'worker');
  const parts = WORKER_PARTS.map((p, i) => (opts.workerParts && opts.workerParts[i] != null) ? opts.workerParts[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return out.replace(/\s*$/, '\n') + parts.join('');
}
export function assembleManifests(opts) {
  opts = opts || {};
  const src = JSON.parse(fs.readFileSync(path.join(root, MANIFEST_SRC), 'utf8'));
  const chrome = {}; const ios = {};
  for (const k of Object.keys(src)) {
    if (k === 'scope') { chrome.scope = './'; ios.scope = './'; if (!opts.noStartUrl) { chrome.start_url = './'; chrome.id = FOLDER_PATH; } continue; }
    chrome[k] = src[k]; ios[k] = src[k];
  }
  if (opts.iosStartUrl) ios.start_url = './';
  return { chrome: JSON.stringify(chrome, null, 2) + '\n', ios: JSON.stringify(ios, null, 2) + '\n' };
}
export function assembleAll(opts) {
  const m = assembleManifests(opts);
  const files = { [OUT.page]: assemblePage(opts), [OUT.worker]: assembleWorker(opts), [OUT.manifest]: m.chrome, [OUT.manifestIos]: m.ios };
  for (const c of COPIES) files[FOLDER + '/' + c] = fs.readFileSync(path.join(root, c));
  return files;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-29dir.mjs')) {
  let files;
  try { files = assembleAll(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.argv.includes('--check')) {
    let bad = 0;
    for (const [f, content] of Object.entries(files)) {
      const p = path.join(root, f);
      const same = fs.existsSync(p) && Buffer.compare(fs.readFileSync(p), Buffer.isBuffer(content) ? content : Buffer.from(content)) === 0;
      if (!same) { console.error('assemble --check: ' + f + ' is not the assembled output'); bad++; }
    }
    const extra = fs.readdirSync(path.join(root, FOLDER)).filter((f) => !(FOLDER + '/' + f in files));
    if (extra.length) { console.error('assemble --check: files in the folder the assembler did not write: ' + extra.join(', ')); bad++; }
    if (bad) process.exit(1);
    console.log('verified ' + Object.keys(files).length + ' files in ' + FOLDER + '/ · index.html sha256=' + sha(Buffer.from(files[OUT.page])) + ' · tb-sw3.js sha256=' + sha(Buffer.from(files[OUT.worker])));
  } else {
    fs.mkdirSync(path.join(root, FOLDER), { recursive: true });
    for (const [f, content] of Object.entries(files)) fs.writeFileSync(path.join(root, f), content);
    console.log('wrote ' + Object.keys(files).length + ' files to ' + FOLDER + '/ · index.html sha256=' + sha(Buffer.from(files[OUT.page])) + ' · tb-sw3.js sha256=' + sha(Buffer.from(files[OUT.worker])));
  }
}
