#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-d2-prism.mjs'], { stdio: 'pipe', timeout: 200000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (n, f, from, to) => {
  const b = fs.readFileSync(f, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + n); bad++; return; }
  fs.writeFileSync(f, b.replace(from, to)); const p = green(); fs.writeFileSync(f, b);
  console.log((p ? 'MISSED ' : 'CAUGHT ') + n); if (p) bad++;
};
const M = 'talkbridge/tb-manifest.webmanifest', A = 'talkbridge/bridge-turn25-pre-ship.html';
mut('manifest claims the whole /stuff/ path again (PRISM captured)', M, '"scope": "/stuff/talkbridge/"', '"scope": "/stuff/"');
mut('a start address is added back (breaks invite installs, G25)', M, '"scope"', '"start_url": "/stuff/talkbridge/bridge-turn25-pre-ship.html",\n  "scope"');
mut('migration matches by prefix and would retire PRISM', A,
  'String(r.scope) === LEGACY_SCOPE && LEGACY_SCRIPTS.indexOf(scriptUrl(r)) !== -1', 'String(r.scope).indexOf(LEGACY_SCOPE) === 0');
mut('old worker unregistered without releasing its push', A,
  ".then(function (s) { return s ? s.unsubscribe().catch(function () {}) : null; })\n          .then(function () { return r.unregister(); })",
  ".then(function () { return r.unregister(); })");
process.exit(bad ? 1 : 0);
