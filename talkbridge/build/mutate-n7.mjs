#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const runs = [['talkbridge/build/harness-n7.mjs'], ['talkbridge/build/harness-relay-r10-cr3.mjs']];
const green = () => runs.every(r => { try { execFileSync('node', r, { stdio: 'pipe' }); return true; } catch { return false; } });
let bad = 0;
const mut = (name, f, from, to) => {
  const b = fs.readFileSync(f, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + name); bad++; return; }
  fs.writeFileSync(f, b.replace(from, to));
  const passed = green(); fs.writeFileSync(f, b);
  console.log((passed ? 'MISSED ' : 'CAUGHT ') + name); if (passed) bad++;
};
mut('relay withholds the push again (the G30 Android silence)', 'talkbridge/worker-talk.js',
  "if ((r.p !== 'os_requested' && r.p !== 'in_app') || r.push !== 'not_requested') continue;",
  "if (r.p !== 'os_requested' || r.push !== 'not_requested') continue;");
mut('muted stops blocking the push', 'talkbridge/worker-talk.js', "if (st && st.muted) return 'muted';", "");
mut('renotify back to false (the G29 silent replacement)', 'tb-sw-25b.js', 'if (opts.tag) opts.renotify = true;', '');
mut('icon dropped (generic bell returns, #652)', 'tb-sw-25b.js', "if (!('icon' in opts)) opts.icon = ICON;", '');
mut('device alerts even with the app on screen', 'tb-sw-25b.js', 'if (vc && !isIOS()) return;', '');
mut('iPhone push silently swallowed (Apple revokes the subscription)', 'tb-sw-25b.js',
  'if (vc && !isIOS()) return;', 'if (vc) return;');
mut('wrapper swallows the frozen call', 'tb-sw-25b.js', 'return orig.call(reg, title, opts).then(function () {',
  'return Promise.resolve().then(function () {');
process.exit(bad ? 1 : 0);
