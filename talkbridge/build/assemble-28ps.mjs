#!/usr/bin/env node
/* 28·pre-ship assembler — FLATTENING, cluster 2: the call (§7.16, §0c-1),
   plus two declared additions at the owner's order (2026-10-03, "OK GO"):
   X-1 the translation check card, G-1 Google-first translation.

   Input : the 28·base candidate 2 bytes (sha-checked; the owner's device
           gate on it is still open — the plan records that this stage was
           ordered ahead of that acceptance).
   Output: bridge-turn28-pre-ship.html = those bytes MINUS every layer named
           in talkbridge/fixtures/flatten/28ps/removals.json (each removed by
           its exact banked text, exactly once) PLUS three appended parts:
           FL-2 (the call, flat), X-1, G-1.                                   */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn28-base.html';
export const BASE_SHA = 'ac70346cac704aadd53a08c789b59b522ac1682693073605858cc1436cb32321';
export const FIXTURES = 'talkbridge/fixtures/flatten/28ps';
export const MANIFEST = FIXTURES + '/removals.json';
export const PARTS = ['talkbridge/parts/fl2-call.js', 'talkbridge/parts/x1-check-card.js', 'talkbridge/parts/g1-google-first.js'];
export const SYMBOLS = ['CALL.keys', 'CALL.start', 'CALL.onIncoming', 'CALL.accept', 'CALL.onAccepted', 'CALL.mount', 'CALL.onSignal', 'CALL.runRecovery', 'CALL.startVideoWatchdog', 'CALL.stopVideoWatchdog', 'CALL.toggleMic', 'CALL.hangUp', 'CALL.teardown', 'camSenders', 'replaceSenderTrack', 'CALL.setupPC', 'CALL.toggleCam'];
/* log markers the two additions bring; FL-2 brings none */
export const ADDED_MARKERS = ['bt_check', 'x1_card', 'trans_ok', 'trans_fallback'];
export const OUT_FILE = 'bridge-turn28-pre-ship.html';
export const TAIL = '\n</script>\n</body>\n</html>';

export function base() {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) throw new Error('assemble: ' + BASE_FILE + ' is not the 28·base c2 bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
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
  const keep = new Set(opts.keepRemovals || []);
  for (const r of removals()) {
    if (keep.has(r.file)) continue;
    const n = out.split(r.text).length - 1;
    if (n !== 1) throw new Error('assemble: removal ' + r.file + ' occurs ' + n + ' times in the base (must be exactly 1)');
    out = out.replace(r.text, '');
  }
  const parts = PARTS.map((p, i) => (opts.parts && opts.parts[i] != null) ? opts.parts[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return out.slice(0, -TAIL.length) + parts.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-28ps.mjs')) {
  let out;
  try { out = assemble(); } catch (e) { console.error(e.message); process.exit(1); }
  const dest = path.join(root, OUT_FILE);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) { console.error('assemble --check: ' + OUT_FILE + ' is not the assembled output'); process.exit(1); }
    console.log('verified ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)) + ' (' + removals().length + ' layers removed, ' + PARTS.length + ' parts added)');
  }
}
