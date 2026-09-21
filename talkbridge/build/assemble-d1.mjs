#!/usr/bin/env node
/* D1 diagnostic assembler.

   Input : bridge-turn27-ship.html — the accepted 27·ship baseline, byte-checked
           against the sha256 the ledger records for it.
   Output: bridge-turn27-ship-diag1.html = those exact bytes, unaltered, plus
           one appended part.

   The baseline is never edited. If the input hash moves, this refuses to run. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const BASE_FILE = 'bridge-turn27-ship.html';
const BASE_SHA = '956ceb3815859f3e08ef1bd6c1556ef8f8eb367c605e71bdfc650474baf3d6a9';
const PART_FILE = 'talkbridge/parts/d1-call-diagnostics.js';
const OUT_FILE = 'bridge-turn27-ship-diag1.html';

const BASE = fs.readFileSync(path.join(root, BASE_FILE));
if (sha(BASE) !== BASE_SHA) {
  console.error('assemble: ' + BASE_FILE + ' is not the accepted 27·ship bytes');
  console.error('  expected ' + BASE_SHA);
  console.error('  found    ' + sha(BASE));
  process.exit(1);
}

/* The baseline's own first line is NOT rewritten. The output is the accepted
   bytes verbatim with one block inserted before the closing tags — so
   out === BASE_PREFIX + '\n\n' + part + tail, and the additive check is exact
   rather than approximate. Build identity is carried by the part's d1_build log
   line, not by editing a byte of the baseline. */
const part = fs.readFileSync(path.join(root, PART_FILE), 'utf8');
let out = BASE.toString('utf8');

const tail = '\n</script>\n</body>\n</html>';
if (!out.endsWith(tail)) { console.error('assemble: unexpected baseline tail'); process.exit(1); }
out = out.slice(0, -tail.length) + '\n\n' + part + tail;

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
