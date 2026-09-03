#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const F = 'talkbridge/worker-talk.js';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-relay-r10-cr3.mjs'], { stdio: 'pipe', timeout: 150000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (name, from, to) => {
  const b = fs.readFileSync(F, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + name); bad++; return; }
  fs.writeFileSync(F, b.replace(from, to)); const passed = green(); fs.writeFileSync(F, b);
  console.log((passed ? 'MISSED ' : 'CAUGHT ') + name); if (passed) bad++;
};
mut('liveness gate removed — a locked phone is never pushed again (the G30 silence)',
  "        const awake = await this._proveAwake(clientId);\n        if (!awake) jobs.push(this._pushOne(clientId, rec0, ev, sessionId));",
  "");
mut('gate always answers awake — same silence by another route',
  "if (!this._isConnected(clientId)) return Promise.resolve(false);",
  "if (true) return Promise.resolve(true);");
mut('gate always answers asleep — a live app gets duplicate alerts',
  "if (!this._isConnected(clientId)) return Promise.resolve(false);",
  "if (true) return Promise.resolve(false);");
mut('stale-subscription rule dropped on the new path',
  "if (rec0.at && now - rec0.at > SUB_TTL_MS) { delete this.subs[clientId]; continue; }", "");
mut('ack no longer settles the wait — every in-app message pushes',
  "if (msg.type === 'ev-alive-ack' && msg.token && this._alive && this._alive[msg.token])",
  "if (false && msg.type === 'ev-alive-ack')");
process.exit(bad ? 1 : 0);
