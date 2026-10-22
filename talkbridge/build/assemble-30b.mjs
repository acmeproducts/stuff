#!/usr/bin/env node
/* 30·base assembler — THE VIDEO BOX (§7.22), candidate 2 (owner 2026-10-22: "it should be the tall 9:16 that's draggable").

   Input (sha-checked): the ACCEPTED 29·post-ship folder page (30·pre-base, banked by reference — immutable under §0c).
   Outputs, in talkbridge-app/ (nothing hand-written; no accepted file touched):
     bridge-turn30-base.html              = the accepted page + the stage's IDENTITY edits (its manifests, its build line) + VB-1 appended
     tb-manifest-turn30-base.webmanifest  = scope "./", start_url this stage's page, id the folder (one app id for every stage)
     tb-manifest-turn30-base-ios.webmanifest = scope "./", no start_url, no id
   The worker is the accepted tb-sw5.js, unchanged. The relay is unchanged (v6.17).

   IDENTITY (found while building, 2026-10-22): the accepted 29·post-ship page still swapped its manifest link to 29·ship's
   at load (DR-1's line, carried) and logged its build as 29·ship c6 — an install from it opened the 29·ship page. This stage
   names itself in all three places.

   CANDIDATE 2 (2026-10-22, after the owner rejected c1 — G77): the camera is opened EXACTLY as the accepted app opens it
   (c1 asked for 720×1280; the Android sent 1280×720 landscape, banded in a fixed 9:16 window). The window takes the shape of
   the picture it shows instead. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const FOLDER = 'talkbridge-app';
export const FOLDER_PATH = '/stuff/talkbridge-app/';
export const BASE_PAGE = FOLDER + '/bridge-turn29-post-ship.html';
export const BASE_PAGE_SHA256 = 'c1c417e21dd1015e6a3519edbc90a796b80033f8e3412238932633ac4c974828';
export const PARTS = ['talkbridge/parts/vb1-video-box.js'];
export const STAGE_PAGE = 'bridge-turn30-base.html';
export const STAGE_TAG = 'turn30-base-c2';
export const BUILT = '2026-10-22';
export const MANIFEST_NAME = 'tb-manifest-turn30-base.webmanifest';
export const MANIFEST_IOS_NAME = 'tb-manifest-turn30-base-ios.webmanifest';
export const MANIFEST_SRC = 'tb-manifest-turn28.webmanifest';
export const OUT = { page: FOLDER + '/' + STAGE_PAGE, manifest: FOLDER + '/' + MANIFEST_NAME, manifestIos: FOLDER + '/' + MANIFEST_IOS_NAME };
export const ADDED_SYMBOLS = ['VB', 'vbLog', 'vbCss', 'vbBox', 'vbActive', 'vbBounds', 'vbAspect', 'vbShapes', 'vbSize', 'vbClamp', 'vbPlace', 'vbReshape', 'vbSave', 'vbLoad', 'vbShow', 'vbHide', 'vbWire', 'vbInit'];
export const ADDED_MARKERS = ['vb_shown', 'vb_moved', 'vb_init_failed', 'vb_camera', 'vb_shape'];
export const TAIL = '\n</script>\n</body>\n</html>';

/* the stage's identity — each find occurs exactly once in the accepted page */
export const IDENTITY = [
  { id: 'I-manifest-link', find: "'tb-manifest-turn29-post-ship-ios.webmanifest' : 'tb-manifest-turn29-post-ship.webmanifest'", replace: "'tb-manifest-turn30-base-ios.webmanifest' : 'tb-manifest-turn30-base.webmanifest'" },
  { id: 'I-manifest-swap', find: "lk.href = (p2Platform() === 'ios') ? 'tb-manifest-turn29-ship-ios.webmanifest' : 'tb-manifest-turn29-ship.webmanifest';", replace: "lk.href = (p2Platform() === 'ios') ? 'tb-manifest-turn30-base-ios.webmanifest' : 'tb-manifest-turn30-base.webmanifest';" },
  { id: 'I-build', find: "log('build', { c: 'turn29-ship-c6', file: 'talkbridge-app/bridge-turn29-ship.html', built: '2026-10-12' }, 'ok');", replace: "log('build', { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "', built: '" + BUILT + "' }, 'ok');" }
];

export function basePage() { const b = fs.readFileSync(path.join(root, BASE_PAGE)); if (sha(b) !== BASE_PAGE_SHA256) throw new Error('assemble-30b: ' + BASE_PAGE + ' is not the accepted 29·post-ship page (' + sha(b).slice(0, 12) + ')'); return b.toString('utf8'); }
export function applyIdentity(out, keep) {
  for (const r of IDENTITY) {
    if (keep && keep.has(r.id)) continue;
    const n = out.split(r.find).length - 1;
    if (n !== 1) throw new Error('assemble-30b: identity ' + r.id + ' finds its text ' + n + ' times (must be exactly 1)');
    out = out.replace(r.find, () => r.replace);
  }
  return out;
}
export function assemblePage(opts) {
  opts = opts || {}; let out = basePage();
  if (!out.endsWith(TAIL)) throw new Error('assemble-30b: unexpected baseline tail');
  out = applyIdentity(out, new Set(opts.keepIdentity || []));
  const part = opts.part != null ? opts.part : fs.readFileSync(path.join(root, PARTS[0]), 'utf8');
  return out.slice(0, -TAIL.length) + '\n\n' + part + TAIL;
}
export function assembleManifests() {
  const src = JSON.parse(fs.readFileSync(path.join(root, MANIFEST_SRC), 'utf8')); const chrome = {}, ios = {};
  for (const k of Object.keys(src)) {
    if (k === 'scope') { chrome.scope = './'; ios.scope = './'; chrome.start_url = './' + STAGE_PAGE; chrome.id = FOLDER_PATH; continue; }
    chrome[k] = src[k]; ios[k] = src[k];
  }
  return { chrome: JSON.stringify(chrome, null, 2) + '\n', ios: JSON.stringify(ios, null, 2) + '\n' };
}
export function assembleAll(opts) {
  const m = assembleManifests();
  return { [OUT.page]: assemblePage(opts), [OUT.manifest]: m.chrome, [OUT.manifestIos]: m.ios };
}

if (process.argv[1] && process.argv[1].endsWith('assemble-30b.mjs')) {
  let files; try { files = assembleAll(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.argv.includes('--check')) {
    let bad = 0;
    for (const [f, c] of Object.entries(files)) { const p = path.join(root, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.error('assemble-30b --check: ' + f + ' is not the assembled output'); bad++; } }
    if (bad) process.exit(1);
    console.log('verified ' + Object.keys(files).length + ' files · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])));
  } else {
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(root, f), c);
    console.log('wrote ' + Object.keys(files).length + ' files to ' + FOLDER + '/ · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])));
  }
}
