#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const src = fs.readFileSync('tb-sw-25b.js', 'utf8');
const muts = [
  ['icon injection removed', src.replace("if (!('icon' in opts)) opts.icon = ICON;", '')],
  ['wrapper swallows original (no call-through)', src.replace('return orig.call(this, title, opts);', 'return Promise.resolve();')],
  ['silent forcing removed', src.replace("if (!('silent' in opts)) opts.silent = false;", '')],
];
let bad = 0;
for (const [name, m] of muts) {
  fs.writeFileSync('/tmp/mut-sw.js', m);
  let failed = false;
  try { execFileSync('node', ['talkbridge/build/harness-n1-sw.mjs', '/tmp/mut-sw.js'], { stdio: 'pipe' }); } catch { failed = true; }
  console.log((failed ? 'CAUGHT ' : 'MISSED ') + name); if (!failed) bad++;
}
process.exit(bad ? 1 : 0);
