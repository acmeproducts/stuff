#!/usr/bin/env node
/* R10-CR2 assembler (plan v20.10.0 §4.12.1). Proves the frozen inputs from the
   governance manifest byte-for-byte, then produces exactly the three declared
   outputs from the frozen bytes plus the two CR1 parts. Output-only:
   the artifacts are never hand-edited. Deterministic: same inputs, same bytes. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/governance/r10-cycle.json'), 'utf8'));
const base = manifest.baseline.rollback_merge_commit;
const frozen = manifest.baseline.files;
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const at = (rel) => execFileSync('git', ['show', `${base}:${rel}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });

const errors = [];
const html = at('bridge-turn24-post-ship.html');
const sw = at('tb-sw.js');
const wr = fs.readFileSync(path.join(root, 'talkbridge/wrangler.jsonc'));
for (const [rel, buf] of [['bridge-turn24-post-ship.html', html], ['tb-sw.js', sw], ['talkbridge/wrangler.jsonc', wr]]) {
  if (sha(buf) !== frozen[rel]) errors.push(`frozen input mismatch: ${rel}`);
}
if (sha(at('talkbridge/worker-talk.js')) !== frozen['talkbridge/worker-talk.js']) errors.push('frozen relay input mismatch');
if (errors.length) { for (const e of errors) console.error('assemble: ' + e); process.exit(1); }

const part = fs.readFileSync(path.join(root, 'talkbridge/parts/r10-cr2-event-state.js'), 'utf8');
const swPart = fs.readFileSync(path.join(root, 'talkbridge/parts/r10-cr2-sw.js'), 'utf8');
let out = html.toString('utf8');
const firstNl = out.indexOf('\n');
if (!out.startsWith('<!-- R10 build · bridge-turn24-post-ship')) { console.error('assemble: unexpected baseline header'); process.exit(1); }
out = '<!-- R10-CR2 build · bridge-turn24-post-ship · plan v20.10.0 §4.12 · frozen R10.2 bytes ' + frozen['bridge-turn24-post-ship.html'].slice(0, 12) + ' + talkbridge/parts/r10-cr2-event-state.js · pair: relay v6.1 -->' + out.slice(firstNl);
const tail = '\n</script>\n</body>\n</html>';
if (!out.endsWith(tail)) { console.error('assemble: unexpected baseline tail'); process.exit(1); }
out = out.slice(0, -tail.length) + '\n\n' + part + tail;

const dry = process.argv.includes('--check');
const outputs = { 'bridge-turn24-post-ship.html': out, 'tb-sw.js': swPart };
for (const [rel, text] of Object.entries(outputs)) {
  const full = path.join(root, rel);
  if (dry) {
    if (!fs.existsSync(full) || fs.readFileSync(full, 'utf8') !== text) { console.error('assemble --check: ' + rel + ' is not the assembled output'); process.exit(1); }
  } else fs.writeFileSync(full, text);
  console.log((dry ? 'verified ' : 'wrote ') + rel + ' sha256=' + sha(Buffer.from(text)));
}
