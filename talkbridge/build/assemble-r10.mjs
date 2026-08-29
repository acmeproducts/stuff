#!/usr/bin/env node
/* Mechanical assembly · R10.5 per plan v20.5.1 §4.9: frozen ship + P2/P3/P4/P6 + integrated P7 recorder. */
import { readFileSync, writeFileSync } from 'fs';
const P = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const ship = P('../../bridge-turn24-ship.html');
const headComment = '<!-- R10.5 build · bridge-turn24-post-ship · plan v20.5.1 §4.9 · integrated recorder · pair: relay v5.1 -->\n';
const parts = ['../parts/p2-install-gate.js', '../parts/p3-subscription.js', '../parts/p4-alert-hygiene.js', '../parts/p6-threads.js', '../parts/p7-flight-recorder.js'].map(P);
let out = headComment + ship;
const idx = out.lastIndexOf('</script>');
out = out.slice(0, idx) + '\n' + parts.join('') + '\n' + out.slice(idx);
const target = process.argv[2] || '/tmp/assembled.html';
const swTarget = process.argv[3] || '/tmp/tb-sw.js';
writeFileSync(target, out);
writeFileSync(swTarget, P('../parts/p4-sw.js'));
console.log('assembled', out.length, 'chars ->', target, '| worker ->', swTarget);
