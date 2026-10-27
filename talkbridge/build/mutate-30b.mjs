#!/usr/bin/env node
/* 30·base mutation gate: each mutation breaks one rule of §7.22 in a copy (part or page); the NAMED test must fail.
   Layout rules are caught by harness-30b-browser.mjs (real Chromium), structure and the camera by harness-30b.mjs.
   Nothing on disk changes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemblePage, assembleManifests, PARTS } from './assemble-30b.mjs';
const part = fs.readFileSync(PARTS[0], 'utf8');
const CV = PARTS[1], NM = PARTS[2];   /* { file: CV|NM, part } mutates that part instead of VB-1 */
const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('mutation text found ' + n + 'x: ' + a.slice(0, 60)); return s.replace(a, () => b); };
const M = [
  /* VB-2 — the strip */
  { by: 'browser', catches: 'B4', name: 'the strip floats over the chat again', part: (s) => once(s, "S + ' .videos{height:var(--vb-vh,228px);background:#000}' +", "S + ' .videos{height:var(--vb-vh,228px);background:#000}' + S + '{position:fixed!important;top:0;left:0;right:0;z-index:15}' +") },
  { by: 'browser', catches: 'B5', name: 'the big picture is cropped (cover)', part: (s) => once(s, "'object-fit:contain;border:0;border-radius:0;background:#000;z-index:1;transform:none}'", "'object-fit:cover;border:0;border-radius:0;background:#000;z-index:1;transform:none}'") },
  { by: 'browser', catches: 'B5', name: 'the small frame ignores my picture\'s shape', part: (s) => once(s, "var ih = Math.min(240, Math.max(110, 0.45 * shown), shown - 12), iw = ih * a;", "var ih = Math.min(240, Math.max(110, 0.45 * shown), shown - 12), iw = ih * 0.75;") },
  { by: 'browser', catches: 'B6', name: 'the strip is not held to MAX', part: (s) => once(s, "var shown = Math.max(VB.min, Math.min(VB.vmax, VB.h));", "var shown = Math.max(VB.min, VB.h);").replace("p.moved = true; vbApply(Math.max(VB.min, Math.min(VB.vmax, p.h0 + dy)));", "p.moved = true; vbApply(p.h0 + dy);") },
  { by: 'browser', catches: 'B6', name: 'the height is not remembered', part: (s) => once(s, "try { localStorage.setItem(VB.KEY_H, String(VB.h)); } catch (_) {} ", "") },
  { by: 'browser', catches: 'B6', name: 'MIN is not the accepted 228 px', part: (s) => once(s, "var min = Math.min(VB.MIN0, max);", "var min = Math.min(150, max);") },
  { by: 'browser', catches: 'B7', name: 'the chat cannot be swiped during a video call', part: (s) => once(s, "'#scr-room.st-video #transcript{overscroll-behavior:contain}';", "'#scr-room.st-video #transcript{overscroll-behavior:contain;touch-action:none;overflow:hidden}';") },
  { by: 'browser', catches: 'B8', name: 'the small picture does not snap to a corner', part: (s) => once(s, "      vbCorner(c); vbApply();\n", "      vbApply();\n") },
  { by: 'browser', catches: 'B8', name: 'the accepted page-wide drag runs inside the strip', part: (s) => once(s, "  hv.addEventListener('mousedown', dead, true); hv.addEventListener('touchstart', dead, { capture: true, passive: true });\n", "") },
  { by: 'browser', catches: 'B9', name: 'a swap does not reshape the small frame', part: (s) => once(s, "  try { new MutationObserver(function () { vbReshape('swap'); }).observe(hv, { attributes: true, attributeFilter: ['class'] }); } catch (_) {}\n", "").replace("VB.poll = setInterval(function () { vbReshape('poll'); }, 1000);", "VB.poll = null;") },
  { by: 'browser', catches: 'B10', name: 'subtitles run under the small picture', part: (s) => once(s, "b.style.setProperty('--vb-sr', VB.corner === 'br' ? clear + 'px' : '8px');", "b.style.setProperty('--vb-sr', '8px');") },
  { by: 'browser', catches: 'B11', name: 'the partner\'s hang-up leaves the swap behind', part: (s) => once(s, "  try { var hv = document.getElementById('call-videos'); if (hv) hv.classList.remove('swapped'); } catch (_) {}\n", "") },
  { by: 'browser', catches: 'B11', name: 'the strip\'s size is left on the band after the call', part: (s) => once(s, "  if (b) ['--vb-vh', '--vb-iw', '--vb-ih', '--vb-sl', '--vb-sr', '--vb-dx', '--vb-dy'].forEach(function (p) { b.style.removeProperty(p); });\n", "") },
  { by: 'browser', catches: 'B12', name: 'no chat floor', part: (s) => once(s, "var max = Math.min(0.66 * below, below - others - VB.FLOOR) - VB.BAR;", "var max = 0.9 * below - VB.BAR;") },
  { by: 'browser', catches: 'B13', name: 'a wide picture lets the strip grow into black', part: (s) => once(s, "VB.vmax = Math.round(Math.max(min, Math.min(max, useful)));", "VB.vmax = Math.round(max);") },
  { by: 'browser', catches: 'B15', name: 'the strip sits above dialogs', part: (s) => once(s, "S + ' .videos{height:var(--vb-vh,228px);background:#000}' +", "S + ' .videos{height:var(--vb-vh,228px);background:#000}' + S + '{z-index:60}' +") },
  { by: 'browser', catches: 'B3', name: 'the grab bar shows outside a video call', part: (s) => once(s, "'#vb-bar{display:none}' +", "'#vb-bar{display:flex}' +") },
  { by: 'node', catches: 'K', name: 'the camera is asked for a tall shape again (c1, G77)', page: (h) => once(h, 'getUserMedia({video:wantVideo,audio:this.micConstraints()})', 'getUserMedia({video:wantVideo?{width:{ideal:720},height:{ideal:1280}}:false,audio:this.micConstraints()})') },
  { by: 'node', catches: 'F', name: 'the load-time swap names 29·ship\'s manifests again', page: (h) => once(h, "lk.href = (p2Platform() === 'ios') ? 'tb-manifest-turn30-base-ios.webmanifest' : 'tb-manifest-turn30-base.webmanifest';", "lk.href = (p2Platform() === 'ios') ? 'tb-manifest-turn29-ship-ios.webmanifest' : 'tb-manifest-turn29-ship.webmanifest';") },
  { by: 'node', catches: 'B1', name: 'something else is appended', page: (h) => h.replace(/\n<\/script>\n<\/body>\n<\/html>$/, '\nvar extra = 1;\n</script>\n</body>\n</html>') },
  { by: 'node', catches: 'C', name: 'a rule escapes the video-call scope', part: (s) => once(s, "var S = '#scr-room.st-video #call-band.on';", "var S = '#call-band.on';") },
  /* candidate 3 */
  { by: 'node', catches: 'CV1', file: CV, name: 'an ended camera is never replaced', part: (s) => once(s, "if (r) cvRestore(r + (why ? '/' + why : ''));", '') },
  { by: 'node', catches: 'CV1', file: CV, name: 'the dead track is left in the stream (two video tracks)', part: (s) => once(s, 'try { if (old) { s0.removeTrack(old); old.stop(); } } catch (_) {}', '') },
  { by: 'node', catches: 'CV2', file: CV, name: 'a mute is replaced at once (no 2 s grace)', part: (s) => once(s, 'if (now - CV.badSince < CV.MUTE_MS) return null;', '') },
  { by: 'node', catches: 'CV3', file: CV, name: 'it fights dictation (no focus gate)', part: (s) => once(s, "if (document.hidden || !document.hasFocus()) { CV.badSince = 0; return null; }", '') },
  { by: 'node', catches: 'CV4', file: CV, name: 'the camera is reopened while the person has it off', part: (s) => once(s, 'if (!CALL.camOn) return null;', '') },
  { by: 'node', catches: 'CV5', file: CV, name: 'the facing follows TB_FACING, not the dying track', part: (s) => once(s, "function cvFacing(t) { return (t && t.__cvFacing === 'environment')", "function cvFacing(t) { return (TB_FACING === 'environment')") },
  { by: 'node', catches: 'CV6', file: CV, name: 'a call that ends during the ask leaves the camera running', part: (s) => once(s, "if (!CALL.active || CALL.stream !== s0 || (live && live.readyState === 'live')) {", "if (false) {") },
  { by: 'node', catches: 'CV8', file: CV, name: 'failures are retried for ever', part: (s) => once(s, 'if (CV.fails >= CV.MAX) return null;', '') },
  { by: 'node', catches: 'CV9', file: CV, name: 'a refused camera is counted and never waits for a tap', part: (s) => once(s, "if (name === 'NotAllowedError') CV.needTap = true; else CV.fails++;", 'CV.fails++;') },
  { by: 'node', catches: 'CV10', file: CV, name: '"restored" is logged though the sender refused the track', part: (s) => once(s, "return Promise.resolve(sender.replaceTrack(t)).then(function () { return sender.track === t; }, function () { return false; });", "return Promise.resolve(sender.replaceTrack(t)).then(function () { return true; }, function () { return true; });") },
  { by: 'node', catches: 'CV11', file: CV, name: 'a voice call reopens the camera', part: (s) => once(s, "if (!CALL.active || CALL.kind !== 'video' || CV.busy) return null;", "if (!CALL.active || CV.busy) return null;") },
  { by: 'browser', catches: 'CV12', file: CV, name: 'the real sender is never given the new track', part: (s) => once(s, "var senders = CALL.camOn ? camSenders() : [];", "var senders = [];") },
  { by: 'browser', catches: 'N2', file: NM, name: 'the name keeps candidate 2\'s cap', part: (s) => once(s, "'#room-ribbon .rz-left{max-width:calc(50% - 25px)}' +", "") },
  { by: 'browser', catches: 'N1', file: NM, name: 'the name runs into the microphone', part: (s) => once(s, "max-width:calc(50% - 25px)", "max-width:none;flex:0 0 auto") },
  { by: 'browser', catches: 'N1', file: NM, name: 'right-to-left is not mirrored', part: (s) => once(s, "+\n  '[dir=rtl] #room-ribbon .rz-center{left:auto;right:50%;transform:translateX(17px)}'", "") },
  { by: 'node', catches: 'F', manifest: true, name: 'the Android strip is cream again', page: (h) => h },
  { by: 'node', catches: 'J', jenny: (j) => once(j, "'tb-manifest-turn30-base-jenny.webmanifest') + '\">');", "'tb-manifest-turn30-base.webmanifest') + '\">');"), name: 'Jenny\'s page installs as the owner\'s app', page: (h) => h }
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb30bm-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i]; let p = part, page, other = null;
  try {
    if (m.file) { other = m.part(fs.readFileSync(m.file, 'utf8')); page = assemblePage({ parts: { [m.file]: other } }); }
    else { if (m.part) p = m.part(part); page = assemblePage({ part: p }); }
    if (m.page) page = m.page(page);
  } catch (e) { console.log('MISS  mutation did not apply: ' + m.name + ' — ' + e.message); missed++; continue; }
  const pf = path.join(dir, 'page-' + i + '.html'), tf = path.join(dir, 'part-' + i + '.js'); fs.writeFileSync(pf, page); fs.writeFileSync(tf, p);
  const env = { ...process.env, TB_30B_PAGE: pf, TB_30B_PART: tf };
  if (other != null) { const of = path.join(dir, 'other-' + i + '.js'); fs.writeFileSync(of, other); env.TB_30B_PARTS = JSON.stringify({ [m.file]: of }); }
  if (m.manifest) env.TB_30B_CHROME_BG = '#FDFAF7';
  if (m.jenny) { const jf = path.join(dir, 'jenny-' + i + '.html'); fs.writeFileSync(jf, m.jenny(fs.readFileSync('talkbridge-app/bridge-turn30-base-jenny.html', 'utf8'))); env.TB_30B_JENNY = jf; }
  let out = '', exit = 0;
  try {
    out = m.by === 'browser'
      ? execFileSync('node', ['talkbridge/build/harness-30b-browser.mjs', '--page', pf, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 600000 })
      : execFileSync('node', ['talkbridge/build/harness-30b.mjs', '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env, timeout: 900000 });
  } catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches + ' '));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (other: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ') + ')')); missed++; }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log('\n30·base mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
