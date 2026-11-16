#!/usr/bin/env node
/* 30·ship mutation gate (§7.25): each mutation breaks one rule in a copy of ONE part; the NAMED test must fail.
   Behaviour is caught by harness-30s-browser.mjs (real Chromium), structure and the whole-script differential by harness-30s.mjs.
   Nothing on disk changes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemblePage, PARTS } from './assemble-30s.mjs';
const P = Object.fromEntries(['bl1', 'mc1', 'ci1', 'rl1', 'rg1', 'rt1', 'gk1'].map((k, i) => [k, PARTS[i]]));
const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('mutation text found ' + n + 'x: ' + a.slice(0, 70)); return s.replace(a, () => b); };
const M = [
  { part: 'bl1', by: 'browser', catches: 'BL2', name: 'the footer is not repainted after the old painter (turn27 shows)', m: (s) => once(s, "['m-s13', 'm-s11', 'm-about']", "['m-s11', 'm-about']") },
  { part: 'bl1', by: 'browser', catches: 'BL1', name: 'the keys sheet keeps turn23 (BUILD_INFO not set)', m: (s) => once(s, "    BUILD_INFO = { release: s.c, builtAt: s.at };\n", '') },
  { part: 'mc1', by: 'browser', catches: 'MC1', name: 'a muted room keeps the bell in the corner (no X)', m: (s) => once(s, 'if (!r || !r.muted) return _mcCard.apply(this, arguments);', 'return _mcCard.apply(this, arguments);') },
  { part: 'mc1', by: 'browser', catches: 'MC1', name: 'the bell is added but the X is still missing', m: (s) => once(s, '{ muted: false }', '{ muted: true }') },
  { part: 'ci1', by: 'browser', catches: 'CI1', name: 'the camera-off rule is removed (the body vanishes)', m: (s) => once(s, "var CI_CSS = '#rb-cam.off .cam-fill{display:inline}';", "var CI_CSS = '';") },
  { part: 'rl1', by: 'browser', catches: 'RL2', name: 'ev-seen is not held under the rail', m: (s) => once(s, "if (m.type === 'ev-seen') {", 'if (false) {') },
  { part: 'rl1', by: 'browser', catches: 'RL2', name: 'read receipts go under the rail', m: (s) => once(s, "  if (rlCovering()) { rlLog('receipts_held', {}); return; }\n", '') },
  { part: 'rl1', by: 'browser', catches: 'RL3', name: 'one buzz per message', m: (s) => once(s, 'now - RL.lastBuzz < RL.BUZZ_MS', 'false') },
  { part: 'rl1', by: 'browser', catches: 'RL4', name: 'closing the rail never acknowledges the room', m: (s) => once(s, "if (was && view === 'room' && room) setTimeout", 'if (false) setTimeout') },
  { part: 'rl1', by: 'browser', catches: 'RL5', name: 'a rail closed by leaving the room acknowledges the old room', m: (s) => once(s, "if (S.view !== 'room' || S.roomId !== room || S.panelOpen || !cr3Attended())", 'if (false)') },
  { part: 'rg1', by: 'browser', catches: 'RG1', name: 'no heal on the ring path', m: (s) => once(s, '    cr3SetAttended(true, why); RG.heals++;', '    return false;') },
  { part: 'rg1', by: 'browser', catches: 'RG3', name: 'the heal ignores focus (a blurred phone rings)', m: (s) => once(s, "if (cr3State.attended !== false || document.hidden || !document.hasFocus || !document.hasFocus()) return false;", 'if (cr3State.attended !== false) return false;') },
  { part: 'rg1', by: 'browser', catches: 'RG2', name: 'the OS call card is left up', m: (s) => once(s, '  rgCloseCallCard(d && d.callId, room && room.id);\n', '') },
  { part: 'rg1', by: 'browser', catches: 'RG2', name: 'every notification is closed, not the call\'s', m: (s) => once(s, "if (x && x.tag === 'tb-call-' + callId)", 'if (x)') },
  { part: 'rg1', by: 'browser', catches: 'RG4', name: 'the menus stay open over the call', m: (s) => once(s, '  rgCloseMenus();\n}', '}') },
  { part: 'rg1', by: 'browser', catches: 'RG5', name: 'a touch does not count as attention', m: (s) => once(s, "  document.addEventListener('pointerdown', rgInput, true);\n", '') },
  { part: 'rt1', by: 'browser', catches: 'RT1', name: 'a tap during a call leaves it (the original runs)', m: (s) => once(s, 'if ((CALL.active || CALL._starting) && roomId && roomId !== S.roomId) {', 'if (false) {') },
  { part: 'rt1', by: 'browser', catches: 'RT2', name: 'a call being accepted is not protected', m: (s) => once(s, '(CALL.active || CALL._starting)', '(CALL.active)') },
  { part: 'gk1', by: 'browser', catches: 'GK1', name: 'the key on every card', m: (s) => once(s, 'if (!gkGranted(r) || !h) return h;', 'if (!h) return h;') },
  { part: 'gk1', by: 'browser', catches: 'GK2', name: 'no singular ("1 days left")', m: (s) => once(s, "return n === 1 ? l10n('gk_until_1', { date: date }) : ", 'return ') },
  { part: 'gk1', by: 'browser', catches: 'GK3', name: 'Thai left out (English shown)', m: (s) => once(s, '  th: { gk_until:', '  thx: { gk_until:') },
  { part: 'gk1', by: 'browser', catches: 'GK5', name: 'a tap on the key opens the room', m: (s) => once(s, 'ev.stopPropagation(); ev.preventDefault();', '') },
  { part: 'mc1', by: 'node', catches: 'E(a)', name: 'an unmuted card changes (the app\'s rendering moves)', m: (s) => once(s, 'if (!r || !r.muted) return _mcCard.apply(this, arguments);', "if (!r || !r.muted) return String(_mcCard.apply(this, arguments)).replace('rc2-name', 'rc2-name x');") },
  { part: 'rl1', by: 'node', catches: 'W', name: 'closePanel wrapped late (inside a function: the scrim keeps the original)', m: (s) => once(s, 'closePanel = function () {', '  closePanel = function () {') },
  { part: 'bl1', by: 'node', catches: 'B1', name: 'something else is appended to the page', m: (s) => s, page: (h) => h.replace(/\n<\/script>\n<\/body>\n<\/html>$/, '\nvar extra = 1;\n</script>\n</body>\n</html>') }
];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb30sm-'));
let caught = 0, missed = 0;
for (let i = 0; i < M.length; i++) {
  const m = M[i], file = P[m.part]; let p, page;
  try { p = m.m(fs.readFileSync(file, 'utf8')); page = assemblePage({ parts: { [file]: p } }); if (m.page) page = m.page(page); } catch (e) { console.log('MISS  mutation did not apply: ' + m.name + ' — ' + e.message); missed++; continue; }
  const pf = path.join(dir, 'page-' + i + '.html'), tf = path.join(dir, 'part-' + i + '.js'); fs.writeFileSync(pf, page); fs.writeFileSync(tf, p);
  let out = '', exit = 0;
  try {
    out = m.by === 'browser'
      ? execFileSync('node', ['talkbridge/build/harness-30s-browser.mjs', '--page', pf, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 900000 })
      : execFileSync('node', ['talkbridge/build/harness-30s.mjs', '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, TB_30S_PAGE: pf, TB_30S_PARTS: JSON.stringify({ [file]: tf }) }, timeout: 1800000 });
  } catch (e) { exit = e.status || 1; out = (e.stdout || '') + (e.stderr || ''); }
  const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches + ' ') || l.startsWith('FAIL  ' + m.catches + ':'));
  if (exit !== 0 && named) { console.log('  ok  [' + m.catches + '] catches: ' + m.name); caught++; }
  else { console.log('MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (other: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' | ') + ')')); missed++; }
}
fs.rmSync(dir, { recursive: true, force: true });
console.log('\n30·ship mutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
