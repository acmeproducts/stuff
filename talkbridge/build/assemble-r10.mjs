#!/usr/bin/env node
/* Mechanical assembly: ship + N1..N6, per plan v16 §4b. No hand edits, ever. */
import { readFileSync, writeFileSync } from 'fs';
const P = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const ship = P('../../bridge-turn24-ship.html');
const headComment = '<!-- R10 build · notifications-only per plan v16.0.0 · source: bridge-turn24-ship.html (device-passed 2026-08-15) -->\n';
const pre = P('../parts/n1-prebootstrap.html');
const parts = ['../parts/n1-r10-phase-a.js','../parts/n2-enable-banner.js','../parts/n3-subscription-selfheal.js',
               '../parts/n4-listener-heartbeat.js','../parts/n5-lane-telemetry.js','../parts/n6-gesture-first-permission.js'].map(P);
const anchor = '<div id="toast"></div>\n</div>\n';
let out = headComment + ship;
if (!out.includes(anchor)) throw new Error('anchor missing');
out = out.replace(anchor, anchor + '\n' + pre + '\n');
const idx = out.lastIndexOf('</script>');
out = out.slice(0, idx) + '\n' + parts.join('') + '\n' + out.slice(idx);
const target = process.argv[2] || '/tmp/assembled.html';
writeFileSync(target, out);
console.log('assembled', out.length, 'chars ->', target);
