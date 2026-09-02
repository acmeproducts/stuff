#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const src = fs.readFileSync('tb-sw-25b.js', 'utf8');
const muts = [
  ['renotify flipped back to false (the exact 339eb402 regression)', src.replace('if (opts.tag) opts.renotify = true;', '')],
  ['renotify only on the first alert', src.replace('if (opts.tag) opts.renotify = true;', "if (opts.tag && !this.__seen) { opts.renotify = true; this.__seen = 1; }")],
  ['icon injection removed', src.replace("if (!('icon' in opts)) opts.icon = ICON;", '')],
  ['wrapper swallows the original call', src.replace('return orig.call(this, title, opts);', 'return Promise.resolve();')],
];
let bad = 0;
for (const [n, m] of muts) {
  fs.writeFileSync('/tmp/mut-n5.js', m);
  let failed = false;
  try { execFileSync('node', ['talkbridge/build/harness-n5.mjs', '/tmp/mut-n5.js'], { stdio: 'pipe' }); } catch { failed = true; }
  console.log((failed ? 'CAUGHT ' : 'MISSED ') + n); if (!failed) bad++;
}
process.exit(bad ? 1 : 0);
