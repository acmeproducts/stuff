#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const F = 'talkbridge/parts/n13-video.js';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-n13.mjs'], { stdio: 'pipe', timeout: 200000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (n, from, to) => {
  const b = fs.readFileSync(F, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + n); bad++; return; }
  fs.writeFileSync(F, b.replace(from, to)); const p = green(); fs.writeFileSync(F, b);
  console.log((p ? 'MISSED ' : 'CAUGHT ') + n); if (p) bad++;
};
mut('tap changes the layout instead of swapping streams (the N12/G35 defect)',
  "var a = big.srcObject, b = small.srcObject;\n    big.srcObject = b; small.srcObject = a;",
  "$$('scr-room').classList.toggle('pip');");
mut('tap does nothing', "swap();\n    }, true);", "}, true);");
mut('back button no longer asks for the browser window', "return nativePip().then(function () {", "return Promise.reject(new Error('x')).then(function () {");
mut('no fallback when the browser refuses', "return _enter.apply(self, args);             /* browser refused — keep the frozen behaviour */", "return null;");
mut('own camera left unmuted after a swap', "big.muted = !S.swapped;", "");
mut('drag release counted as a tap', "if (S.moved) { S.moved = false; return; }", "");
mut('inset draggable fully off screen', "keep = 28;", "keep = -9999;");
mut('screen share offered on phones', "!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')", "true");
mut('camera swap does not reach the far side', "if (sender) sender.replaceTrack(nt);", "");
process.exit(bad ? 1 : 0);
