#!/usr/bin/env node
/* 27·post-ship assembler (§7.9 + §7.10 — technical debt & concurrency).

   Input : the accepted 27·ship candidate 5 bytes (fixture, sha-checked) —
           the same base c8 was built on.
   Output: bridge-turn27-post-ship.html = c5 bytes + the six transport /
           surface parts CARRIED from accepted c8, byte for byte, + six new
           parts: K-1 device-namespaced ids, K-2 phrasebook merge, K-4 rename
           convergence, T-1 render coalescing, T-2 log hygiene, T-3 wrap map.

   ONE DECLARED REMOVAL: the D1 read-only instrument (d1-call-diagnostics.js)
   is not carried — it existed to read the 27·ship gates, not to ship to
   beta. `proveRemoval()` proves it is the ONLY difference: accepted c8 bytes
   must equal c5 + D1 + the carried parts, exactly.

   The baseline is never edited. Refuses to run if the input hash moves. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'talkbridge/fixtures/bridge-turn27-ship-c5-accepted-2026-09-14.html';
export const BASE_SHA = '956ceb3815859f3e08ef1bd6c1556ef8f8eb367c605e71bdfc650474baf3d6a9';
export const C8_FILE = 'bridge-turn27-ship.html';
export const C8_SHA = '8f017cf47b64';                       /* ledger prefix of the accepted c8 sha256 */
export const REMOVED_PART = 'talkbridge/parts/d1-call-diagnostics.js';
export const CARRIED = [
  'talkbridge/parts/c1-signal-queue.js',
  'talkbridge/parts/v2-relay-retry.js',
  'talkbridge/parts/c3-joiner-restart.js',
  'talkbridge/parts/c2-stall-frames.js',
  'talkbridge/parts/s2-back-absorb.js',
  'talkbridge/parts/f1-flip-keeps-sender.js'
];
export const NEW = [
  'talkbridge/parts/k1-device-ids.js',
  'talkbridge/parts/k2-pb-merge.js',
  'talkbridge/parts/k4-rename-lww.js',
  'talkbridge/parts/t1-render-coalesce.js',
  'talkbridge/parts/t2-log-hygiene.js',
  'talkbridge/parts/t3-wrap-map.js'
];
export const PARTS = CARRIED.concat(NEW);
export const OUT_FILE = 'bridge-turn27-post-ship.html';
export const TAIL = '\n</script>\n</body>\n</html>';

function basePrefix() {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) {
    throw new Error('assemble: ' + BASE_FILE + ' is not the accepted 27·ship c5 bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
  }
  const out = BASE.toString('utf8');
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  return out.slice(0, -TAIL.length);
}

/* accepted c8 === c5 + D1 + carried parts + tail — so D1 is the only removal */
export function proveRemoval() {
  const c8 = fs.readFileSync(path.join(root, C8_FILE));
  if (!sha(c8).startsWith(C8_SHA)) throw new Error('proveRemoval: ' + C8_FILE + ' is not the accepted c8 bytes (' + sha(c8).slice(0, 12) + ')');
  const expect = basePrefix() + [REMOVED_PART].concat(CARRIED).map((p) => '\n\n' + fs.readFileSync(path.join(root, p), 'utf8')).join('') + TAIL;
  if (c8.toString('utf8') !== expect) throw new Error('proveRemoval: accepted c8 is not c5 + D1 + carried parts — the carried parts are not the accepted bytes');
  return true;
}

export function assemble(partOverrides) {
  proveRemoval();
  const prefix = basePrefix();
  const parts = PARTS.map((p, i) => (partOverrides && partOverrides[i] != null) ? partOverrides[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return prefix + parts.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-27ps.mjs')) {
  let out;
  try { out = assemble(); } catch (e) { console.error(e.message); process.exit(1); }
  const dest = path.join(root, OUT_FILE);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) { console.error('assemble --check: ' + OUT_FILE + ' is not the assembled output'); process.exit(1); }
    console.log('verified ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  }
}
