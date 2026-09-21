#!/usr/bin/env node
/* 27·ship candidate 6 assembler (§7.15).

   Input : bridge-turn27-pre-ship.html — the accepted baseline the video work
           is rebuilt on, byte-checked against the sha256 the ledger records.
   Output: bridge-turn27-ship.html = those exact bytes + five appended parts,
           in this order: D1 (instrument), V-1 (signalling queue, file c1),
           V-2 (relay retry ramp), V-3 (joiner restart, file c3),
           V-4 (stall by decoded frames, file c2).

   The baseline is never edited. Refuses to run if the input hash moves. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn27-pre-ship.html';
export const BASE_SHA = '69ec6482db24812c0904cc9f7d70a81a910d4be87c3d5e25bbb55649b8234f67';
export const PARTS = [
  'talkbridge/parts/d1-call-diagnostics.js',
  'talkbridge/parts/c1-signal-queue.js',
  'talkbridge/parts/v2-relay-retry.js',
  'talkbridge/parts/c3-joiner-restart.js',
  'talkbridge/parts/c2-stall-frames.js'
];
export const OUT_FILE = 'bridge-turn27-ship.html';
export const TAIL = '\n</script>\n</body>\n</html>';

export function assemble(partOverrides) {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) {
    throw new Error('assemble: ' + BASE_FILE + ' is not the accepted 27·pre-ship bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
  }
  const out = BASE.toString('utf8');
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  const prefix = out.slice(0, -TAIL.length);
  const parts = PARTS.map((p, i) => (partOverrides && partOverrides[i] != null) ? partOverrides[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return prefix + parts.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-27s6.mjs')) {
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
