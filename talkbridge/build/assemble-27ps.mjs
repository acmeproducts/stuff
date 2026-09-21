#!/usr/bin/env node
/* 27·post-ship assembler (§7.14).

   Input : bridge-turn27-ship.html — the accepted baseline, byte-checked against
           the sha256 the ledger records. Refuses to run if it has moved.
   Output: bridge-turn27-post-ship.html = those exact bytes + four appended
           parts, in this order: D1 (instrument, unchanged), C-1, C-3, C-2.

   The baseline is never edited. The output is prefix + parts + closing tags,
   so the additive check in the harness is exact. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn27-ship.html';
export const BASE_SHA = '956ceb3815859f3e08ef1bd6c1556ef8f8eb367c605e71bdfc650474baf3d6a9';
export const PARTS = [
  'talkbridge/parts/d1-call-diagnostics.js',
  'talkbridge/parts/c1-signal-queue.js',
  'talkbridge/parts/c3-joiner-restart.js',
  'talkbridge/parts/c2-stall-frames.js'
];
export const OUT_FILE = 'bridge-turn27-post-ship.html';
export const TAIL = '\n</script>\n</body>\n</html>';

export function assemble(partOverrides) {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) {
    throw new Error('assemble: ' + BASE_FILE + ' is not the accepted 27·ship bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
  }
  let out = BASE.toString('utf8');
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  const prefix = out.slice(0, -TAIL.length);
  const parts = PARTS.map((p, i) => (partOverrides && partOverrides[i] != null) ? partOverrides[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return prefix + parts.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-27ps.mjs')) {
  let out;
  try { out = assemble(); } catch (e) { console.error(e.message); process.exit(1); }
  const dest = path.join(root, OUT_FILE);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) {
      console.error('assemble --check: ' + OUT_FILE + ' is not the assembled output');
      process.exit(1);
    }
    console.log('verified ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  }
}
