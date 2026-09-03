#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const run = () => { try { execFileSync('node', ['talkbridge/build/harness-n5.mjs'], { stdio: 'pipe' }); return true; } catch { return false; } };
let bad = 0;
const mut = (name, f, from, to) => {
  const b = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, b.replace(from, to));
  const passed = run(); fs.writeFileSync(f, b);
  console.log((passed ? 'MISSED ' : 'CAUGHT ') + name); if (passed) bad++;
};
mut('relay withholds the push again (the G30 defect)', 'talkbridge/worker-talk.js',
  "if ((r.p !== 'os_requested' && r.p !== 'in_app') || r.push !== 'not_requested') continue;",
  "if (r.p !== 'os_requested' || r.push !== 'not_requested') continue;");
mut('muted no longer blocks the push', 'talkbridge/worker-talk.js',
  "if (st && st.muted) return 'muted';", "");
mut('device shows alerts even while the app is in front', 'tb-sw-25b.js',
  'if (visible) return;', '');
process.exit(bad ? 1 : 0);
