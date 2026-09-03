#!/usr/bin/env node
import fs from 'fs'; import { execFileSync } from 'child_process';
const F = 'talkbridge/parts/n12-video.js';
const green = () => { try { execFileSync('node', ['talkbridge/build/harness-n12.mjs'], { stdio: 'pipe', timeout: 200000 }); return true; } catch { return false; } };
let bad = 0;
const mut = (n, from, to) => {
  const b = fs.readFileSync(F, 'utf8');
  if (!b.includes(from)) { console.log('ANCHOR-MISSING ' + n); bad++; return; }
  fs.writeFileSync(F, b.replace(from, to)); const p = green(); fs.writeFileSync(F, b);
  console.log((p ? 'MISSED ' : 'CAUGHT ') + n); if (p) bad++;
};
mut('tap no longer swaps', "swap();\n    }, true);", "}, true);");
mut('a drag is mistaken for a tap', "if (S12.moved) { S12.moved = false; return; }", "");
mut('inset confined to the video pane again', "el.classList.add('n12-free');", "");
mut('inset can be dragged fully off screen with nothing to grab', "var keep = 28;", "var keep = -9999;");
mut('camera swap does not reach the far side', "if (sender) sender.replaceTrack(nt);", "");
mut('camera control offered with only one camera', "if (cams < 2) $$('n12-flip').style.display = 'none';", "");
mut('screen share offered on phones', "!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')", "true");
mut('PiP expand control does nothing', "if (CALL.pip) { CALL.exitPip(); L('n12_pip_expand', {}); }", "");
mut('surface not reset when the call ends', "S12.swapped = false;\n      try { $$('scr-room').classList.remove('n12-swap'); } catch (_) {}", "");
process.exit(bad ? 1 : 0);
