#!/usr/bin/env node
/* Mechanical assembly · R10.2-OBS1: byte-verified R10.2 + observation-only P7.
   Outputs: bridge-turn24-post-ship.html (app) and tb-sw.js (worker). Pair: relay v4.2 OBS1. */
import { readFileSync, writeFileSync } from 'fs';
const P = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const ship = P('../../bridge-turn24-ship.html');
const headComment = '<!-- R10 build · R10.2-OBS1 · bridge-turn24-post-ship · plan v20.4.1 §4.8 · source: R10.2 rollback e74c7cb2 · observation only · pair: relay v4.2 OBS1 -->\n';
const parts = ['../parts/p2-install-gate.js', '../parts/p3-subscription.js', '../parts/p4-alert-hygiene.js', '../parts/p6-threads.js', '../parts/p7-flight-recorder.js'].map(P);
let out = headComment + ship;
const idx = out.lastIndexOf('</script>');
out = out.slice(0, idx) + '\n' + parts.join('') + '\n' + out.slice(idx);
const target = process.argv[2] || '/tmp/assembled.html';
const swTarget = process.argv[3] || '/tmp/tb-sw.js';
writeFileSync(target, out);
writeFileSync(swTarget, P('../parts/p4-sw.js'));
console.log('assembled', out.length, 'chars ->', target, '| worker ->', swTarget);
