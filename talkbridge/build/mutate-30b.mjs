#!/usr/bin/env node
/* 30·base mutation gate: each mutation breaks one rule of §7.22 in a copy (part or page); the NAMED test must fail.
   Layout rules are caught by harness-30b-browser.mjs (real Chromium), structure and the camera by harness-30b.mjs.
   Nothing on disk changes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemblePage, PARTS } from './assemble-30b.mjs';
const part = fs.readFileSync(PARTS[0], 'utf8');
const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('mutation text found ' + n + 'x: ' + a.slice(0, 60)); return s.replace(a, () => b); };
const M = [
  { by: 'browser', catches: 'B12', name: 'the box sits above dialogs (z 50)', part: (s) => once(s, 'z-index:15;', 'z-index:50;') },
  { by: 'browser', catches: 'B4', name: 'the box is not fixed to the screen', part: (s) => once(s, "S + '{position:fixed;", "S + '{position:absolute;") },
  { by: 'node', catches: 'K', name: 'the camera is asked for a tall shape again (c1, G77)', page: (h) => once(h, 'getUserMedia({video:wantVideo,audio:this.micConstraints()})', 'getUserMedia({video:wantVideo?{width:{ideal:720},height:{ideal:1280}}:false,audio:this.micConstraints()})') },
  { by: 'browser', catches: 'B13', name: 'the window is a fixed 9:16 again (c1, G77)', part: (s) => once(s, 'var b = VB.b = vbBounds(), aw = b.right - b.left, a = VB.big || VB.DEF, W, H;', 'var b = VB.b = vbBounds(), aw = b.right - b.left, a = 9 / 16, W, H;') },
  { by: 'browser', catches: 'B6c', name: 'a reshape moves the window\'s top edge', part: (s) => once(s, 'if (why !== \'show\' && right) VB.x = rx - VB.W;', 'if (why !== \'show\') VB.y = VB.y + 40;') },
  { by: 'browser', catches: 'B5', name: 'the big picture is cropped (cover)', part: (s) => once(s, "'object-fit:contain;border:0;border-radius:0;", "'object-fit:cover;border:0;border-radius:0;") },
  { by: 'browser', catches: 'B5', name: 'the inset ignores the small picture\'s shape', part: (s) => once(s, 'aspect-ratio:var(--vb-sar,0.75);', 'aspect-ratio:9/16;') },
  { by: 'browser', catches: 'B6c', name: 'a swap does not reshape the window', part: (s) => once(s, "new MutationObserver(function () { vbReshape('swap'); })", "new MutationObserver(function () {})").replace("VB.poll = setInterval(function () { vbReshape('poll'); }, 1000);", "VB.poll = null;") },
  { by: 'browser', catches: 'B6c', name: 'the inset is not capped (a tall inset overflows a wide window)', part: (s) => once(s, "width:min(32%, calc(var(--vb-h,240px) * 0.45 * var(--vb-sar,0.75)));", "width:32%;") },
  { by: 'browser', catches: 'B13', name: 'a laptop\'s wide picture gets a tall window', part: (s) => once(s, 'W = Math.min(W, aw - 16); H = W / a;', 'W = Math.min(W, aw - 16); H = a > 1 ? W * 16 / 9 : W / a;') },
  { by: 'browser', catches: 'B6b', name: 'the box is not clamped', part: (s) => once(s, "VB.x = Math.max(b.left, Math.min(b.right - VB.W, VB.x)); VB.y = Math.max(b.top, Math.min(b.bottom - VB.H, VB.y));", '') },
  { by: 'browser', catches: 'B6', name: 'a drag also swaps (the click is not swallowed)', part: (s) => once(s, 'VB.swallowClick = true; vbLog', 'VB.swallowClick = false; vbLog') },
  { by: 'browser', catches: 'B6', name: 'a drag does not save the place', part: (s) => once(s, "vbLog('moved', vbSave(), 'ok');", "vbLog('moved', {}, 'ok');") },
  { by: 'browser', catches: 'B7', name: 'the old small-video drag still runs inside the box', part: (s) => once(s, '    ev.stopPropagation();   /* capture phase', '    /* capture phase') },
  { by: 'browser', catches: 'B8b', name: 'the height is not capped (a phone on its side)', part: (s) => once(s, 'if (H > room) { H = Math.max(100, room); W = H * a; }', '') },
  { by: 'browser', catches: 'B8b', name: 'the bounds are the window, not the app column', part: (s) => once(s, 'if (r.width > 0 && r.height > 0) a = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };', '') },
  { by: 'browser', catches: 'B9', name: 'subtitles stay at the bottom', part: (s) => once(s, "S + ' #subtitle-area{left:6px;right:6px;top:6px;bottom:auto}' +", '') },
  { by: 'browser', catches: 'B10b', name: 'a partner\'s hang-up leaves the swap behind', part: (s) => once(s, "try { var h = document.getElementById('call-videos'); if (h) h.classList.remove('swapped'); } catch (_) {}", '') },
  { by: 'browser', catches: 'B11', name: 'the flip button starts a drag', part: (s) => once(s, "if (ev.target && ev.target.closest && ev.target.closest('button')) return;   /* the flip button is never a drag */", '') },
  { by: 'browser', catches: 'B3', name: 'a voice call shows the band', part: (s) => once(s, "var S = '#scr-room.st-video #call-band.on';", "var S = '#scr-room.st-video #call-band.on';\n  var V = '#scr-room.st-phone #call-band{display:block!important}';") .replace("var st = document.createElement('style'); st.id = 'vb-css'; st.textContent = css;", "var st = document.createElement('style'); st.id = 'vb-css'; st.textContent = css + V;") },
  { by: 'node', catches: 'F', name: 'the load-time swap names 29·ship\'s manifests again', page: (h) => once(h, "lk.href = (p2Platform() === 'ios') ? 'tb-manifest-turn30-base-ios.webmanifest' : 'tb-manifest-turn30-base.webmanifest';", "lk.href = (p2Platform() === 'ios') ? 'tb-manifest-turn29-ship-ios.webmanifest' : 'tb-manifest-turn29-ship.webmanifest';") },
  { by: 'node', catches: 'B1', name: 'something else is appended', page: (h) => h.replace(/\n<\/script>\n<\/body>\n<\/html>$/, '\nvar extra = 1;\n</script>\n</body>\n</html>') },
  { by: 'node', catches: 'C', name: 'a rule escapes the video-call scope', part: (s) => once(s, "var S = '#scr-room.st-video #call-band.on';", "var S = '#call-band.on';") }
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb30bm-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i]; let p = part, page;
  try { if (m.part) p = m.part(part); page = assemblePage({ part: p }); if (m.page) page = m.page(page); } catch (e) { console.log('MISS  mutation did not apply: ' + m.name + ' — ' + e.message); missed++; continue; }
  const pf = path.join(dir, 'page-' + i + '.html'), tf = path.join(dir, 'part-' + i + '.js'); fs.writeFileSync(pf, page); fs.writeFileSync(tf, p);
  let out = '', exit = 0;
  try {
    out = m.by === 'browser'
      ? execFileSync('node', ['talkbridge/build/harness-30b-browser.mjs', '--page', pf, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 })
      : execFileSync('node', ['talkbridge/build/harness-30b.mjs', '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_30B_PAGE: pf, TB_30B_PART: tf }, timeout: 900000 });
  } catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches + ' '));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (other: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ') + ')')); missed++; }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log('\n30·base mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
