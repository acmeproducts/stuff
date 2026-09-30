#!/usr/bin/env node
/* 28·base assembler — FLATTENING, cluster 1: the relay path (§7.16, §0c-1).

   Input : the accepted 27·post-ship bytes (banked as bridge-turn28-pre-base.html,
           sha-checked) — the first base this project has ever edited, under
           the owner's §0c-1 licence of 2026-09-21.
   Output: bridge-turn28-base.html = those bytes MINUS every layer named in
           talkbridge/fixtures/flatten/28b/removals.json (each removed by its
           exact banked text, which must occur exactly once) PLUS one appended
           part, FL-1, that holds the six symbols flat.
   Candidate 2 (owner order 2026-09-30, "N turning, go"): PLUS three declared
           head edits (manifest, apple-touch icon, tab icon → the v2 set) and
           one more part, I-1, that registers the app onto tb-sw3.js.

   Refuses to run if the base hash moves, if a removal text is missing or
   ambiguous, or if a removed layer's bytes differ from its fixture. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn28-pre-base.html';
export const BASE_SHA = 'a38d6abbcfd115829e09ff409f79955227f7dd6f7f5ab5b31629036286279df3';
export const FIXTURES = 'talkbridge/fixtures/flatten/28b';
export const MANIFEST = FIXTURES + '/removals.json';
export const PART = 'talkbridge/parts/fl1-relay-path.js';
export const PARTS2 = ['talkbridge/parts/i1-app-face.js'];          /* candidate 2: the app's face (owner order 2026-09-30) */
/* declared head edits — each exact text must occur exactly once in the base */
export const HEAD_EDITS = [
  ['<link rel="manifest" href="tb-manifest-turn26.webmanifest">', '<link rel="manifest" href="tb-manifest-turn28.webmanifest">'],
  ['<link rel="apple-touch-icon" href="icon-180.png">', '<link rel="apple-touch-icon" href="icon-v2-180.png">'],
  ['<link rel="icon" href="icon-192.png" type="image/png">', '<link rel="icon" href="icon-v2-192.png" type="image/png">'],
  /* the U1 block re-points the manifest link at runtime; without this fourth edit the head edit above would be undone on every launch */
  ["if (lk) { lk.href = 'tb-manifest-turn26.webmanifest'; L('u1_manifest_swapped', {}); }", "if (lk) { lk.href = 'tb-manifest-turn28.webmanifest'; L('u1_manifest_swapped', {}); }"]
];
/* log markers the candidate adds beyond the accepted set — every one declared here, nothing else */
export const ADDED_MARKERS = ['i1_sw3_register', 'i1_retire_deferred', 'i1_old_sw_retired', 'i1_retire_failed'];
export const NEW_FILES = ['tb-manifest-turn28.webmanifest', 'tb-sw3.js', 'icon-v2-512.png', 'icon-v2-192.png', 'icon-v2-180.png', 'icon-v2-maskable-512.png', 'icon-v2-badge-96.png'];
export const SYMBOLS = ['relaySend', 'relayConnect', 'reconnectRelayNow', 'LISTEN.open', 'LISTEN.handle', 'handleRelay'];
export const OUT_FILE = 'bridge-turn28-base.html';
export const TAIL = '\n</script>\n</body>\n</html>';

export function base() {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) throw new Error('assemble: ' + BASE_FILE + ' is not the accepted 27·post-ship bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
  return BASE.toString('utf8');
}
export function removals() {
  const m = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8'));
  return m.removals.map((r) => {
    const text = fs.readFileSync(path.join(root, FIXTURES, r.file), 'utf8');
    if (sha(text).slice(0, 12) !== r.sha256) throw new Error('assemble: fixture bytes moved: ' + r.file);
    return { file: r.file, text, lines: r.lines };
  });
}
export function assemble(opts) {
  opts = opts || {};
  let out = base();
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  const keep = new Set(opts.keepRemovals || []);           /* mutation gate: leave a layer in */
  for (const r of removals()) {
    if (keep.has(r.file)) continue;
    const n = out.split(r.text).length - 1;
    if (n !== 1) throw new Error('assemble: removal ' + r.file + ' occurs ' + n + ' times in the base (must be exactly 1)');
    out = out.replace(r.text, '');
  }
  for (const [a, b] of HEAD_EDITS) {
    const n = out.split(a).length - 1;
    if (n !== 1) throw new Error('assemble: head edit target occurs ' + n + ' times (must be exactly 1): ' + a);
    out = out.replace(a, b);
  }
  const part = opts.part != null ? opts.part : fs.readFileSync(path.join(root, PART), 'utf8');
  const parts2 = PARTS2.map((p, i) => (opts.parts2 && opts.parts2[i] != null) ? opts.parts2[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return out.slice(0, -TAIL.length) + '\n\n' + part + parts2.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-28b.mjs')) {
  let out;
  try { out = assemble(); } catch (e) { console.error(e.message); process.exit(1); }
  const dest = path.join(root, OUT_FILE);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) { console.error('assemble --check: ' + OUT_FILE + ' is not the assembled output'); process.exit(1); }
    console.log('verified ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)) + ' (' + removals().length + ' layers removed, 1 part added)');
  }
}
