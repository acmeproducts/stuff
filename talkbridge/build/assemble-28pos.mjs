#!/usr/bin/env node
/* 28·post-ship assembler — FLATTENING, clusters 4 and 5: render and the shallow sweep (§7.16, §0c-1).

   Input : the accepted 28·ship c1 bytes (sha-checked).
   Output: bridge-turn28-ship.html = those bytes MINUS every layer named in
           talkbridge/fixtures/flatten/28pos/removals.json (each removed by its
           exact banked text, exactly once) PLUS one appended part, FL-3
           (enterRoom, leaveRoomInternals, joinRoom, openS3, invUrl, flat).    */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn28-ship.html';
export const BASE_SHA = '1b138efb15740ed599bc538caba61a2d2d939d7b58a873956592cbbd2db6a5d2';
export const FIXTURES = 'talkbridge/fixtures/flatten/28pos';
export const MANIFEST = FIXTURES + '/removals.json';
export const PARTS = ['talkbridge/parts/fl4-render.js'];
export const SYMBOLS = ['renderPanel', 'renderHome', 'renderTranscript', 'renderRoomHead', 'appendMsgDom', 'msgHtml', 'roomCardHtml', 'wireRoomCards'];
/* log markers the parts bring; a flattening brings none */
export const ADDED_MARKERS = [];
/* markers that leave the SOURCE with a dead layer: R's wireRoomCards declaration was shadowed by L's later
   declaration of the same name, so the accepted build never logged these; the removal takes the dead text with it */
export const DEAD_MARKERS = { 'card_tap': '06-R-wireRoomCards.js', 'room_delete_failed': '06-R-wireRoomCards.js' };
export const OUT_FILE = 'bridge-turn28-post-ship.html';
export const TAIL = '\n</script>\n</body>\n</html>';

export function base() {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) throw new Error('assemble: ' + BASE_FILE + ' is not the accepted 28·ship c1 bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
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

if (process.argv[1] && process.argv[1].endsWith('assemble-28pos.mjs')) {
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
