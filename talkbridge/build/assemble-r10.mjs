#!/usr/bin/env node
/* Mechanical assembly · R10 post-ship per plan v19.5.0 §4.1: ship + P2..P6. No hand edits, ever.
   Outputs: bridge-turn24-post-ship.html (app) and tb-sw.js (worker). Pair: relay v4. */
import { readFileSync, writeFileSync } from 'fs';
const P = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const ship = P('../../bridge-turn24-ship.html');
const headComment = '<!-- R10 build · bridge-turn24-post-ship · plan v19.5.0 §4.1 P2-P6 · source: bridge-turn24-ship.html (device-passed 2026-08-15, revalidated 2026-08-27) · pair: relay v4 -->\n';
const parts = ['../parts/p2-install-gate.js', '../parts/p3-subscription.js', '../parts/p4-alert-hygiene.js', '../parts/p6-threads.js'].map(P);
let out = headComment + ship;
const idx = out.lastIndexOf('</script>');
out = out.slice(0, idx) + '\n' + parts.join('') + '\n' + out.slice(idx);
const target = process.argv[2] || '/tmp/assembled.html';
const swTarget = process.argv[3] || '/tmp/tb-sw.js';
writeFileSync(target, out);
writeFileSync(swTarget, P('../parts/p4-sw.js'));
console.log('assembled', out.length, 'chars ->', target, '| worker ->', swTarget);
