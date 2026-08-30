#!/usr/bin/env node
/* Mechanical R10.6 assembly: frozen ship plus explicitly named clean parts. */
import { readFileSync, writeFileSync } from 'fs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const ship = read('../../bridge-turn24-ship.html');
const parts = [
  '../parts/r106-p2-install-handoff.js',
  '../parts/r106-auth-services.js',
  '../parts/r106-p3-subscription.js',
  '../parts/p6-threads.js',
  '../parts/r106-event-state.js',
  '../parts/r106-flight-recorder.js'
].map(read);
const header = '<!-- TalkBridge R10.6 · clean assembly from bridge-turn24-ship.html · relay R10.6 -->\n';
const cut = ship.lastIndexOf('</script>');
if (cut < 0) throw new Error('ship script terminator missing');
const output = header + ship.slice(0, cut) + '\n' + parts.join('\n') + '\n' + ship.slice(cut);
const appTarget = process.argv[2] || 'bridge-turn24-post-ship.html';
const swTarget = process.argv[3] || 'tb-sw.js';
writeFileSync(appTarget, output);
writeFileSync(swTarget, read('../parts/r106-sw.js'));
console.log('R10.6 assembled:', output.length, 'chars ->', appTarget, '| worker ->', swTarget);
