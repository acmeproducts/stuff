#!/usr/bin/env node
/* 30·pre-ship assembler — CHATS IN INDEXEDDB (§7.24, TS-1), candidate 1 (owner 2026-10-27: "Both, video first"; 30·base accepted 2026-11-11).

   Input (sha-checked): the ACCEPTED 30·base page (candidate 4) — immutable under §0c.
   Outputs, in talkbridge-app/ (nothing hand-written; no accepted file touched):
     bridge-turn30-pre-ship.html              = the accepted page + the stage's IDENTITY edits (its manifests, its build line) + TS-1 appended
     tb-manifest-turn30-pre-ship.webmanifest  = the accepted stage's Android manifest, starting THIS page (one app id for every stage)
     tb-manifest-turn30-pre-ship-ios.webmanifest = the accepted stage's iPhone manifest, unchanged in content
   The worker is the accepted tb-sw5.js, unchanged. The relay is unchanged (v6.17). */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const FOLDER = 'talkbridge-app';
export const BASE_PAGE = FOLDER + '/bridge-turn30-base.html';
export const BASE_PAGE_SHA256 = 'a4155be904a94b3900f04afa11e3a22d99bd1b6fe1cc4f5d9686e8cc12988f54';
export const BASE_MANIFEST = FOLDER + '/tb-manifest-turn30-base.webmanifest';
export const BASE_MANIFEST_IOS = FOLDER + '/tb-manifest-turn30-base-ios.webmanifest';
export const PARTS = ['talkbridge/parts/ts1-transcript-store.js'];
export const STAGE_PAGE = 'bridge-turn30-pre-ship.html';
export const STAGE_TAG = 'turn30-pre-ship-c1';
export const BUILT = '2026-11-11';
export const MANIFEST_NAME = 'tb-manifest-turn30-pre-ship.webmanifest';
export const MANIFEST_IOS_NAME = 'tb-manifest-turn30-pre-ship-ios.webmanifest';
export const OUT = { page: FOLDER + '/' + STAGE_PAGE, manifest: FOLDER + '/' + MANIFEST_NAME, manifestIos: FOLDER + '/' + MANIFEST_IOS_NAME };
export const PART_DECL = [{ file: PARTS[0], logger: 'tsLog', prefix: 'ts_',
  symbols: ['TS', 'tsLog', 'tsHash', 'tsSig', 'tsClean', 'tsKeyId', 'tsOpen', 'tsDb', 'tsTx', 'tsRange', 'tsMirror', 'tsGet', 'tsSave', 'tsFlush', 'tsFlushAll', 'tsAbsorb', 'tsLoadAll', 'tsMergeHeld', 'tsRefresh', 'tsDrop', 'tsFinish', 'tsStart', 'TS_RETRY', '_tsLsSet', '_tsLoadTrCore', '_tsEntry', '_tsRemove'],
  markers: ['ts_ready', 'ts_absorbed', 'ts_early_read', 'ts_flush_failed', 'ts_row_failed', 'ts_fallback', 'ts_refresh', 'ts_dropped'] }];
export const TAIL = '\n</script>\n</body>\n</html>';
/* the stage's identity — each find occurs exactly n times in the accepted page */
export const IDENTITY = [
  { id: 'I-manifest', n: 2, find: "'tb-manifest-turn30-base-ios.webmanifest' : 'tb-manifest-turn30-base.webmanifest'", replace: "'" + MANIFEST_IOS_NAME + "' : '" + MANIFEST_NAME + "'" },
  { id: 'I-build', n: 1, find: "log('build', { c: 'turn30-base-c4', file: 'talkbridge-app/bridge-turn30-base.html', built: '2026-10-27' }, 'ok');", replace: "log('build', { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "', built: '" + BUILT + "' }, 'ok');" }
];
export function basePage() { const b = fs.readFileSync(path.join(root, BASE_PAGE)); if (sha(b) !== BASE_PAGE_SHA256) throw new Error('assemble-30ps: ' + BASE_PAGE + ' is not the accepted 30·base page (' + sha(b).slice(0, 12) + ')'); return b.toString('utf8'); }
export function applyIdentity(out) {
  for (const r of IDENTITY) {
    const n = out.split(r.find).length - 1;
    if (n !== r.n) throw new Error('assemble-30ps: identity ' + r.id + ' finds its text ' + n + ' times (must be ' + r.n + ')');
    out = out.split(r.find).join(r.replace);
  }
  return out;
}
export function partTexts(opts) { opts = opts || {}; return PARTS.map((f) => (opts.parts && opts.parts[f] != null) ? opts.parts[f] : fs.readFileSync(path.join(root, f), 'utf8')); }
export function assemblePage(opts) {
  let out = basePage();
  if (!out.endsWith(TAIL)) throw new Error('assemble-30ps: unexpected baseline tail');
  out = applyIdentity(out);
  return out.slice(0, -TAIL.length) + partTexts(opts).map((p) => '\n\n' + p).join('') + TAIL;
}
export function assembleManifests() {
  const c = JSON.parse(fs.readFileSync(path.join(root, BASE_MANIFEST), 'utf8'));
  c.start_url = './' + STAGE_PAGE;
  return { chrome: JSON.stringify(c, null, 2) + '\n', ios: fs.readFileSync(path.join(root, BASE_MANIFEST_IOS), 'utf8') };
}
export function assembleAll(opts) { const m = assembleManifests(); return { [OUT.page]: assemblePage(opts), [OUT.manifest]: m.chrome, [OUT.manifestIos]: m.ios }; }

if (process.argv[1] && process.argv[1].endsWith('assemble-30ps.mjs')) {
  let files; try { files = assembleAll(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.argv.includes('--check')) {
    let bad = 0;
    for (const [f, c] of Object.entries(files)) { const p = path.join(root, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.error('assemble-30ps --check: ' + f + ' is not the assembled output'); bad++; } }
    if (bad) process.exit(1);
    console.log('verified ' + Object.keys(files).length + ' files · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])));
  } else {
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(root, f), c);
    console.log('wrote ' + Object.keys(files).length + ' files to ' + FOLDER + '/ · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])));
  }
}
