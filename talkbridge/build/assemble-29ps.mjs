#!/usr/bin/env node
/* 29·pre-ship assembler — MULTI-USER, the app leg, candidate 1 (§7.8 A-1…A-5).

   Input : the banked 29·pre-base bytes (= accepted 28·post-ship c2, sha-checked).
   Output: bridge-turn29-pre-ship.html = those bytes with twenty banked find/replace
           pairs applied (talkbridge/fixtures/mu/29ps/replacements.json, each find
           text exactly once, sha-pinned) PLUS one appended part, MU-1
           (talkbridge/parts/mu1-room-size.js). Nothing is removed.              */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn29-pre-base.html';
export const BASE_SHA = 'c5e9b5ebb402b49ab2b0eebf6b41732efe5808302ac4eb19ed4f66282ee5159b';
export const FIXTURES = 'talkbridge/fixtures/mu/29ps';
export const MANIFEST = FIXTURES + '/replacements.json';
export const PARTS = ['talkbridge/parts/mu1-room-size.js'];
export const ADDED_SYMBOLS = ['MU1_FULL_HOLD_MS', 'MU1_CAPS', 'mu1State', 'mu1EnsureField', 'mu1CapFromSheet', 'mu1CapParam', 'mu1InvCap', 'mu1Hold', 'mu1OnFull', 'mu1Presence', 'mu1Member', 'mu1DisplayName', 'mu1Others', 'mu1Call', 'mu1Chooser', 'mu1Addressed', 'mu1ReadBy', 'mu1Tok', 'mu1ReadLabel'];
/* log markers the part brings; every other marker of the candidate is the base's */
export const ADDED_MARKERS = ['room_full', 'relay_full_hold', 'mu1_member', 'mu1_chooser', 'call_to'];
/* the ONE network line that changes, in both lanes: the socket URL gains the room's cap */
export const NETWORK_CHANGE = { find: "'&client=' + encodeURIComponent(deviceId));", replace: "'&client=' + encodeURIComponent(deviceId) + mu1CapParam(room));" };
export const OUT_FILE = 'bridge-turn29-multi-user-v1.html';   /* WARM STORAGE (owner, 2026-10-09): withdrawn from the rotation; the pre-ship address went back to the 29·pre-base bytes */
export const TAIL = '\n</script>\n</body>\n</html>';

export function base() {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  const want = BASE_SHA;
  if (sha(BASE) !== want) throw new Error('assemble: ' + BASE_FILE + ' is not the banked 29·pre-base bytes\n  expected ' + want + '\n  found    ' + sha(BASE));
  return BASE.toString('utf8');
}
export function replacements() {
  const m = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8'));
  return m.replacements.map((r) => {
    const find = fs.readFileSync(path.join(root, FIXTURES, r.find), 'utf8'), replace = fs.readFileSync(path.join(root, FIXTURES, r.replace), 'utf8');
    if (sha(find).slice(0, 12) !== r.sha_find || sha(replace).slice(0, 12) !== r.sha_replace) throw new Error('assemble: replacement bytes moved: ' + r.id);
    return { id: r.id, find, replace };
  });
}
export function assemble(opts) {
  opts = opts || {};
  let out = base();
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  const keep = new Set(opts.keepReplacements || []);
  for (const r of (opts.replacements || replacements())) {
    if (keep.has(r.id)) continue;
    const n = out.split(r.find).length - 1;
    if (n !== 1) throw new Error('assemble: replacement ' + r.id + ' finds its text ' + n + ' times (must be exactly 1)');
    if (out.indexOf(r.replace) !== -1) throw new Error('assemble: replacement ' + r.id + ' already present');
    out = out.replace(r.find, () => r.replace);
  }
  const parts = PARTS.map((p, i) => (opts.parts && opts.parts[i] != null) ? opts.parts[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return out.slice(0, -TAIL.length) + parts.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-29ps.mjs')) {
  let out;
  try { out = assemble(); } catch (e) { console.error(e.message); process.exit(1); }
  const dest = path.join(root, OUT_FILE);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) { console.error('assemble --check: ' + OUT_FILE + ' is not the assembled output'); process.exit(1); }
    console.log('verified ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)) + ' (' + replacements().length + ' replacements, ' + PARTS.length + ' part)');
  }
}
