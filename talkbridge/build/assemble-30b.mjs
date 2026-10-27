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
   the picture it shows instead.

   CANDIDATE 3 (2026-10-23, the owner's feedback on c2): two more parts — CV-1 (the camera comes back after keyboard dictation
   takes it) and NM-1 (the room's name gets the room up to the microphone) — and the Android manifest's background is teal, the
   colour Android paints under its own buttons (it was cream: pale buttons on cream). VB-1 is unchanged.

   CANDIDATE 4 (2026-10-27, the owner after testing c3: "maybe being able to just drag the length of the video … with the tall pip
   inside maybe that's a better solve"): VB-2 (the strip you pull down) replaces VB-1 (the floating window); CV-1, NM-1, the teal
   Android strip and Jenny's instance are unchanged. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const FOLDER = 'talkbridge-app';
export const FOLDER_PATH = '/stuff/talkbridge-app/';
export const BASE_PAGE = FOLDER + '/bridge-turn29-post-ship.html';
export const BASE_PAGE_SHA256 = 'c1c417e21dd1015e6a3519edbc90a796b80033f8e3412238932633ac4c974828';
export const PARTS = ['talkbridge/parts/vb2-video-strip.js', 'talkbridge/parts/cv1-camera-back.js', 'talkbridge/parts/nm1-name-room.js'];
export const STAGE_PAGE = 'bridge-turn30-base.html';
export const STAGE_TAG = 'turn30-base-c4';
export const BUILT = '2026-10-27';
export const MANIFEST_NAME = 'tb-manifest-turn30-base.webmanifest';
export const MANIFEST_IOS_NAME = 'tb-manifest-turn30-base-ios.webmanifest';
export const MANIFEST_SRC = 'tb-manifest-turn28.webmanifest';
/* JENNY'S INSTANCE (owner 2026-10-25: "a separate instance", not a pointer): the same candidate at its own address with its own
   install identity — its own manifests (its own app id, named "TalkBridge Jenny"), its own home-screen title — so it installs as a
   separate app beside the owner's. Rebuilt with every 30·base candidate. Same site, so on ONE phone it shares the browser's storage
   (name, rooms) with the other copies; on Jenny's own phone that does not arise. */
export const JENNY = { page: 'bridge-turn30-base-jenny.html', manifest: 'tb-manifest-turn30-base-jenny.webmanifest', manifestIos: 'tb-manifest-turn30-base-jenny-ios.webmanifest', name: 'TalkBridge Jenny', short: 'TB Jenny', id: FOLDER_PATH + 'jenny' };
export const OUT = { page: FOLDER + '/' + STAGE_PAGE, manifest: FOLDER + '/' + MANIFEST_NAME, manifestIos: FOLDER + '/' + MANIFEST_IOS_NAME,
  jennyPage: FOLDER + '/' + JENNY.page, jennyManifest: FOLDER + '/' + JENNY.manifest, jennyManifestIos: FOLDER + '/' + JENNY.manifestIos };
export const ADDED_SYMBOLS = ['VB', 'vbLog', 'vbCss', 'vbBox', 'vbActive', 'vbAspect', 'vbShapes', 'vbLimits', 'vbApply', 'vbCorner', 'vbReshape', 'vbShow', 'vbHide', 'vbWire', 'vbInit'];
export const ADDED_MARKERS = ['vb_shown', 'vb_resized', 'vb_corner', 'vb_shape', 'vb_camera', 'vb_init_failed'];
/* per part, in PARTS order: the symbols its @contract declares and the markers it logs (prefix, the part's own logger) */
export const PART_DECL = [
  { file: PARTS[0], logger: 'vbLog', prefix: 'vb_', symbols: ADDED_SYMBOLS, markers: ADDED_MARKERS },
  { file: PARTS[1], logger: 'cvLog', prefix: 'cv_', symbols: ['CV', 'cvLog', 'cvTrack', 'cvWire', 'cvFacing', 'cvDue', 'cvCheck', 'cvRestore', 'cvTick', 'cvInit'], markers: ['cv_track', 'cv_restore', 'cv_restored', 'cv_restore_failed', 'cv_restore_abandoned', 'cv_init_failed'] },
  { file: PARTS[2], logger: 'log', prefix: 'nm_', symbols: ['NM_CSS', 'nmInit'], markers: ['nm_init_failed'] }
];
/* the Android manifest only: the colour Android paints under its own Back/Home/Recents (candidate 3) */
export const CHROME_BACKGROUND = process.env.TB_30B_CHROME_BG || '#2E8B8B';   /* the env is the mutation gate's only lever */
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
/* opts.part overrides VB-1 (PARTS[0]); opts.parts = { <PARTS path>: text } overrides any part */
export function partTexts(opts) {
  opts = opts || {};
  return PARTS.map((f, i) => (opts.parts && opts.parts[f] != null) ? opts.parts[f] : (i === 0 && opts.part != null) ? opts.part : fs.readFileSync(path.join(root, f), 'utf8'));
}
export function assemblePage(opts) {
  opts = opts || {}; let out = basePage();
  if (!out.endsWith(TAIL)) throw new Error('assemble-30b: unexpected baseline tail');
  out = applyIdentity(out, new Set(opts.keepIdentity || []));
  const parts = partTexts(opts);
  return out.slice(0, -TAIL.length) + parts.map((p) => '\n\n' + p).join('') + TAIL;
}
export function assembleManifests() {
  const src = JSON.parse(fs.readFileSync(path.join(root, MANIFEST_SRC), 'utf8')); const chrome = {}, ios = {};
  for (const k of Object.keys(src)) {
    if (k === 'scope') { chrome.scope = './'; ios.scope = './'; chrome.start_url = './' + STAGE_PAGE; chrome.id = FOLDER_PATH; continue; }
    chrome[k] = k === 'background_color' ? CHROME_BACKGROUND : src[k]; ios[k] = src[k];
  }
  return { chrome: JSON.stringify(chrome, null, 2) + '\n', ios: JSON.stringify(ios, null, 2) + '\n' };
}
/* each find occurs a known number of times in the stage page (the link at load + the load-time swap; the title; the build line) */
export const JENNY_EDITS = [
  { find: "'" + MANIFEST_IOS_NAME + "'", replace: "'" + JENNY.manifestIos + "'", n: 2 },
  { find: "'" + MANIFEST_NAME + "'", replace: "'" + JENNY.manifest + "'", n: 2 },
  { find: '<meta name="apple-mobile-web-app-title" content="TalkBridge">', replace: '<meta name="apple-mobile-web-app-title" content="' + JENNY.short + '">', n: 1 },
  { find: "file: 'talkbridge-app/" + STAGE_PAGE + "'", replace: "file: 'talkbridge-app/" + JENNY.page + "'", n: 1 }
];
export function assembleJenny(page, m) {
  let out = page;
  for (const e of JENNY_EDITS) { const n = out.split(e.find).length - 1; if (n !== e.n) throw new Error('assemble-30b: jenny edit finds ' + e.find + ' ' + n + ' times (must be ' + e.n + ')'); out = out.split(e.find).join(e.replace); }
  const re = (j, start) => { const o = JSON.parse(j); o.name = JENNY.name; o.short_name = JENNY.short; if (start) { o.start_url = './' + JENNY.page; o.id = JENNY.id; } return JSON.stringify(o, null, 2) + '\n'; };
  return { page: out, chrome: re(m.chrome, true), ios: re(m.ios, false) };
}
export function assembleAll(opts) {
  const m = assembleManifests(), page = assemblePage(opts), j = assembleJenny(page, m);
  return { [OUT.page]: page, [OUT.manifest]: m.chrome, [OUT.manifestIos]: m.ios, [OUT.jennyPage]: j.page, [OUT.jennyManifest]: j.chrome, [OUT.jennyManifestIos]: j.ios };
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
