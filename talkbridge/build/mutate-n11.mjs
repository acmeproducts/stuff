#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const F = 'talkbridge/parts/n11-stale-subscription.js';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-n11.mjs'], { stdio: 'pipe', timeout: 180000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (n, from, to) => {
  const b = fs.readFileSync(F, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + n); bad++; return; }
  fs.writeFileSync(F, b.replace(from, to)); const p = green(); fs.writeFileSync(F, b);
  console.log((p ? 'MISSED ' : 'CAUGHT ') + n); if (p) bad++;
};
mut('stale key accepted again (the G34 defect)', "if (have && want && have === want) { L('n11_key_ok', {}); return; }", "L('n11_key_ok', {}); return;");
mut('dead subscription not discarded', "return sub.unsubscribe().catch(function () { }).then(function () {", "return Promise.resolve().then(function () {");
mut('rooms not re-registered on the new endpoint', "return (typeof p3RegisterAll === 'function') ? p3RegisterAll() : null;", "return null;");
mut('healthy subscription churned anyway', "if (have && want && have === want) { L('n11_key_ok', {}); return; }", "");
process.exit(bad ? 1 : 0);
