#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const run = () => { try { execFileSync('node', ['talkbridge/build/harness-n2-scope.mjs'], { stdio: 'pipe' }); return true; } catch { return false; } };
const save = {}; const restore = () => { for (const [f, b] of Object.entries(save)) fs.writeFileSync(f, b); };
let bad = 0; const mut = (name, f, from, to) => {
  save[f] = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, save[f].replace(from, to));
  const passed = run(); restore(); delete save[f];
  console.log((passed ? 'MISSED ' : 'CAUGHT ') + name); if (passed) bad++;
};
mut('start address reintroduced (the G25 defect)', 'talkbridge/tb-manifest.webmanifest', '"scope"', '"start_url": "/stuff/talkbridge/bridge-turn25-base.html",\n  "scope"');
mut('migration matcher loosened to prefix (would catch PRISM)', 'talkbridge/bridge-turn25-base.html',
  'String(r.scope) === LEGACY_SCOPE && LEGACY_SCRIPTS.indexOf(scriptUrl(r)) !== -1', 'String(r.scope).indexOf(LEGACY_SCOPE) === 0');
mut('unregister without unsubscribing', 'talkbridge/bridge-turn25-base.html',
  ".then(function () { return r.unregister(); })", ".then(function () {})");
process.exit(bad ? 1 : 0);
