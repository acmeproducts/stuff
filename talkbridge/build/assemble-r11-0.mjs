#!/usr/bin/env node
/* R11.0 assembler (plan v20.13.0 §5d). Input: the accepted 24·post-ship bytes
   (= 25·pre-base). Output: bridge-turn25-base.html = frozen bytes + one part. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const BASE = fs.readFileSync(path.join(root, 'bridge-turn25-pre-base.html'));
const ACCEPTED = fs.readFileSync(path.join(root, 'bridge-turn24-post-ship.html'));
if (sha(BASE) !== sha(ACCEPTED)) { console.error('assemble: 25·pre-base is not the accepted 24·post-ship bytes'); process.exit(1); }
const part = fs.readFileSync(path.join(root, 'talkbridge/parts/r11-0-log-fidelity.js'), 'utf8');
let out = BASE.toString('utf8');
const firstNl = out.indexOf('\n');
out = '<!-- 25·base · R11.0 log fidelity · bridge-turn25-base.html · frozen 25·pre-base bytes ' + sha(BASE).slice(0, 12) + ' + talkbridge/parts/r11-0-log-fidelity.js · pair: tb-sw.js + relay v6.2 unchanged -->' + out.slice(firstNl);
const tail = '\n</script>\n</body>\n</html>';
if (!out.endsWith(tail)) { console.error('assemble: unexpected baseline tail'); process.exit(1); }
out = out.slice(0, -tail.length) + '\n\n' + part + tail;
const dest = path.join(root, 'bridge-turn25-base.html');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) { console.error('assemble --check: bridge-turn25-base.html is not the assembled output'); process.exit(1); }
  console.log('verified bridge-turn25-base.html sha256=' + sha(Buffer.from(out)));
} else { fs.writeFileSync(dest, out); console.log('wrote bridge-turn25-base.html sha256=' + sha(Buffer.from(out))); }
