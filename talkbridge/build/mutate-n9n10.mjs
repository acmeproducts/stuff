#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-n9n10.mjs'], { stdio: 'pipe', timeout: 180000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (name, f, from, to) => {
  const b = fs.readFileSync(f, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + name); bad++; return; }
  fs.writeFileSync(f, b.replace(from, to)); const passed = green(); fs.writeFileSync(f, b);
  console.log((passed ? 'MISSED ' : 'CAUGHT ') + name); if (passed) bad++;
};
const N9 = 'talkbridge/parts/n9-notif-permission.js', N10 = 'talkbridge/parts/n10-caller-call-screen.js';
mut('the tap thief comes back (hamburger eaten again)', N9,
  "  p3ArmGesture = function () {\n    if (document.getElementById('n9-bar')) return;",
  "  p3ArmGesture = function () {\n    document.addEventListener('click', function h() { document.removeEventListener('click', h); p3AttemptInGesture(); }, true);\n    if (document.getElementById('n9-bar')) return;");
mut('iPhone steps shown on Android again', N9, "var steps = ios\n        ?", "var steps = true\n        ?");
mut('caller mute removed', N10, "if (CALL.micOn) { try { CALL.toggleMic(); } catch (_) {} }", "");
mut('ring-back removed', N10, "try { RING.start(); } catch (_) {}", "");
mut('call screen never shown', N10, "ov.classList.add('show');", "");
mut('caller clock still starts at the dial (B-8a regression)', N10,
  "CALL.startTs = Date.now();                                     /* B-8a: clock starts at the answer */", "");
mut('answering side clock not anchored', N10,
  "if (CALL.active && !CALL.caller) { CALL.startTs = Date.now(); L('n10_accept_anchor', {}); }", "");
mut('mic stays muted after they answer', N10, "if (!CALL.micOn) { try { CALL.toggleMic(); } catch (_) {} }   /* live on answer */", "");
process.exit(bad ? 1 : 0);
