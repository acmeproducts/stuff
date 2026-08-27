#!/usr/bin/env node
/* Step 2 assembly: ship + exactly one part. */
import { readFileSync, writeFileSync } from 'fs';
const P = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const ship = P('../../bridge-turn24-ship.html');
const part = P('../parts2/n1-step2-subscribe.js');
const head = '<!-- STEP2 build · plan v17.2.0 · ship + n1-step2-subscribe -->\n';
const idx = ship.lastIndexOf('</script>');
const out = head + ship.slice(0, idx) + '\n' + part + '\n' + ship.slice(idx);
writeFileSync(process.argv[2] || '/tmp/step2.html', out);
console.log('assembled', out.length);
