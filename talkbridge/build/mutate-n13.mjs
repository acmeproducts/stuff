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
mut('the new stream is never told to play (the tap looks dead)',
  "try { var q = el.play(); if (q && q.catch) q.catch(function () {}); } catch (_) {}", "");
mut('our own camera left unmuted after a swap (microphone feeds back)',
  "el.muted = isMine ? true : !earOn;", "el.muted = false;");
mut('a swap overrides the room Ear setting', "el.muted = isMine ? true : !earOn;", "el.muted = isMine;");
mut('a swap left running carries into the next call',
  "if (S.swapped) {\n        var b = $$('remote-video'), sm = $$('local-video');", "if (false) {\n        var b = $$('remote-video'), sm = $$('local-video');");
mut('tap does nothing', "swap();\n    }, true);", "}, true);");
mut('back button no longer asks for the browser window', "return nativePip().then(function () {", "return Promise.reject(new Error('x')).then(function () {");
mut('no fallback when the browser refuses', "return _enter.apply(self, args);             /* browser refused — keep the frozen behaviour */", "return null;");
mut('inset draggable fully off screen', "keep = 28;", "keep = -9999;");
mut('screen share offered on phones', "!/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')", "true");
mut('camera swap does not reach the far side', "if (sender) sender.replaceTrack(nt);", "");
process.exit(bad ? 1 : 0);
