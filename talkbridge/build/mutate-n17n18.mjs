#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-n17n18.mjs'], { stdio: 'pipe', timeout: 120000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (n, f, from, to) => {
  const b = fs.readFileSync(f, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + n); bad++; return; }
  fs.writeFileSync(f, b.replace(from, to)); const p = green(); fs.writeFileSync(f, b);
  console.log((p ? 'MISSED ' : 'CAUGHT ') + n); if (p) bad++;
};
const P = 'talkbridge/parts/n17-presence.js', T = 'talkbridge/parts/n18-timer.js', R = 'talkbridge/worker-talk.js';
mut('presence ignores the relay again (back to guessing from traffic)', P, 'if (d && d.type === \'peer\') { apply(d); return; }', '');
mut('presence never goes dark', P, "d.others > 0 : false", "true : true");
mut('relay stops announcing on join', R, "      try { this._announcePeers(); } catch (_) {}", "      /* removed */");
mut('relay stops announcing on leave', R, "async webSocketClose(ws, code, reason) { try { this._announcePeers(); } catch (_) {} }", "async webSocketClose(ws, code, reason) {}");
mut('caller clock left at the dial (the D-5 defect)', T, "CALL.startTs = Date.now();", "");
mut('on-screen clock not restarted', T, "if (typeof startCallTimer === 'function') startCallTimer();", "");
mut('answering side not anchored', T, "return Promise.resolve(r).then(function (v) { if (CALL.active) anchor('answerer'); return v; });", "return r;");
process.exit(bad ? 1 : 0);
