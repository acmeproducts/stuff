#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const src = fs.readFileSync('talkbridge/parts/n4-caller-call-screen.js', 'utf8');
const muts = [
  ['caller mute removed', src.replace("if (CALL.micOn) { try { CALL.toggleMic(); } catch (_) {} }", '')],
  ['ring-back removed', src.replace('RING.start();', '')],
  ['clock re-anchor removed (B-8a regression)', src.replace('CALL.startTs = Date.now();          /* B-8a: both clocks start at the accept */', '')],
  ['call screen never hidden on answer', src.replace('function hideCaller() { ov.classList.remove(\'show\'); RING.stop(); }', 'function hideCaller() {}')],
];
let bad = 0;
for (const [n, m] of muts) {
  fs.writeFileSync('/tmp/mut-n4.js', m);
  let failed = false;
  try { execFileSync('node', ['talkbridge/build/harness-n4-call.mjs', '/tmp/mut-n4.js'], { stdio: 'pipe' }); } catch { failed = true; }
  console.log((failed ? 'CAUGHT ' : 'MISSED ') + n); if (!failed) bad++;
}
process.exit(bad ? 1 : 0);
