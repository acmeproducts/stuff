#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const src = fs.readFileSync('talkbridge/parts/n1-app-join-thread.js', 'utf8');
const muts = [
  ['button injection removed', src.replace('menu.appendChild(b);', '')],
  ['link validation removed', src.replace("if (!m) return null;", "if (!m) return String(text);")],
  ['same-page reload dropped', src.replace('if (samePage) location.reload();', '')],
];
let bad = 0;
for (const [name, m] of muts) {
  fs.writeFileSync('/tmp/mut-app.js', m);
  let failed = false;
  try { execFileSync('node', ['talkbridge/build/harness-n1-app.mjs', '/tmp/mut-app.js'], { stdio: 'pipe' }); } catch { failed = true; }
  console.log((failed ? 'CAUGHT ' : 'MISSED ') + name); if (!failed) bad++;
}
process.exit(bad ? 1 : 0);
