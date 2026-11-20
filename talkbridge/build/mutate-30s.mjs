#!/usr/bin/env node
/* 30·ship mutation gate (§7.25): each mutation breaks one rule in a copy of ONE part; the NAMED test must fail.
   Behaviour is caught by harness-30s-browser.mjs (real Chromium), structure and the whole-script differential by harness-30s.mjs.
   Nothing on disk changes. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemblePage, PARTS } from './assemble-30s.mjs';
const P = Object.fromEntries(['bl1', 'tn1', 'mc1', 'ci1', 'rl1', 'rg1', 'rt1', 'gk1'].map((k, i) => [k, PARTS[i]]));
const once = (s, a, b) => { const n = s.split(a).length - 1; if (n !== 1) throw new Error('mutation text found ' + n + 'x: ' + a.slice(0, 70)); return s.replace(a, () => b); };
const M = [
  { part: 'bl1', by: 'browser', catches: 'BL2', name: 'the footer is not repainted after the old painter (turn27 shows)', m: (s) => once(s, "['m-s13', 'm-s11', 'm-about']", "['m-s11', 'm-about']") },
  { part: 'bl1', by: 'browser', catches: 'BL1', name: 'the keys sheet keeps turn23 (BUILD_INFO not set)', m: (s) => once(s, "    BUILD_INFO = { release: s.c, builtAt: s.at };\n", '') },
  { part: 'mc1', by: 'browser', catches: 'MC1', name: 'a muted room keeps the bell in the corner (no X)', m: (s) => once(s, 'if (!r || !r.muted) return _mcCard.apply(this, arguments);', 'return _mcCard.apply(this, arguments);') },
  { part: 'mc1', by: 'browser', catches: 'MC1', name: 'the bell before the name (c1\'s place)', m: (s) => once(s, 'return h.slice(0, a) + open + inner + icon + h.slice(c);', 'return h.slice(0, a) + open + icon + inner + h.slice(c);') },
  { part: 'gk1', by: 'browser', catches: 'GK1', name: 'the key before the name (c1\'s place)', m: (s) => once(s, 'return h.slice(0, a) + open + inner + icon + h.slice(c);', 'return h.slice(0, a) + open + icon + inner + h.slice(c);') },
  { part: 'mc1', by: 'browser', catches: 'MC1', name: 'the bell is added but the X is still missing', m: (s) => once(s, '{ muted: false }', '{ muted: true }') },
  { part: 'ci1', by: 'browser', catches: 'CI1', name: 'the camera-off rule is removed (the body vanishes)', m: (s) => once(s, "var CI_CSS = '#rb-cam.off .cam-fill{display:inline}';", "var CI_CSS = '';") },
  { part: 'rl1', by: 'browser', catches: 'RL2', name: 'ev-seen is not held under the rail', m: (s) => once(s, "if (m.type === 'ev-seen') {", 'if (false) {') },
  { part: 'rl1', by: 'browser', catches: 'RL2', name: 'read receipts go under the rail', m: (s) => once(s, "  if (S.roomId && rlHolds(S.roomId)) { rlLog('receipts_held', {}); return; }\n", '') },
  { part: 'rl1', by: 'browser', catches: 'RL3', name: 'one buzz per message', m: (s) => once(s, 'now - RL.lastBuzz < RL.BUZZ_MS', 'false') },
  { part: 'rl1', by: 'browser', catches: 'RL2', name: 'an arrival under the rail does not mark the room pending', m: (s) => once(s, "if (rlCovering(roomId)) { rlMark(roomId, 'arrived'); rlBuzz(roomId); }", 'if (rlCovering(roomId)) { rlBuzz(roomId); }') },
  { part: 'rl1', by: 'browser', catches: 'RL4', name: 'a closed rail stops holding (the count clears without selection)', m: (s) => once(s, 'return !!(roomId && (RL.pending[roomId] || rlCovering(roomId)));', 'return !!(roomId && rlCovering(roomId));') },
  { part: 'rl1', by: 'browser', catches: 'RL6', name: 'entering the room does not clear pending (stuck unread)', m: (s) => once(s, "  if (was) { delete RL.pending[id]; rlLog('selected', { room: String(id).slice(-6), how: 'enter', same: same }, 'ok'); }", '') },
  { part: 'rl1', by: 'browser', catches: 'RL7', name: 'selecting the room on screen sends no read receipts', m: (s) => once(s, '  if (was && same) { try { sendReadReceipts(); } catch (_) {} }\n  return r;\n};\ncr3RouteEvent', '  return r;\n};\ncr3RouteEvent') },
  { part: 'rl1', by: 'browser', catches: 'RL8', name: 'a notification for the room does not select it', m: (s) => once(s, "  if (was) { delete RL.pending[roomId]; rlLog('selected', { room: String(roomId).slice(-6), how: 'route', same: same }, 'ok'); }", '') },
  { part: 'rl1', by: 'browser', catches: 'RL9', name: 'a projection under the rail does not mark it', m: (s) => once(s, "rlMark(roomId, 'projection');", '0;') },
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
  { part: 'rl1', by: 'node', catches: 'W', name: 'RL-1 wraps closePanel again (c1\'s flush on close)', m: (s) => s + "\nvar _rlC = closePanel;\nclosePanel = function () { return _rlC.apply(this, arguments); };\n" },
  { part: 'tn1', by: 'browser', catches: 'TN1', name: 'no name is cut', m: (s) => once(s, 'var TN_MAX = 14;', 'var TN_MAX = 99;') },
  { part: 'tn1', by: 'browser', catches: 'TN1', name: 'a CJK character counted as one', m: (s) => once(s, '\\p{Extended_Pictographic}/u.test(g) ? 2 : 1', '\\p{Extended_Pictographic}/u.test(g) ? 1 : 1') },
  { part: 'tn1', by: 'browser', catches: 'TN3', name: 'a tap on a cut name opens the room', m: (s) => once(s, "        ev.stopPropagation(); ev.preventDefault();\n        toast(roomTitle(room), 4000);", '        toast(roomTitle(room), 4000);') },
  { part: 'tn1', by: 'browser', catches: 'TN2', name: 'the cut name is not a span (no dir=auto)', m: (s) => once(s, "'<div class=\"rc2-name\"><span class=\"rc2-nm\" dir=\"auto\">'", "'<div class=\"rc2-name\"><span class=\"rc2-nm\">'") },
  { part: 'bl1', by: 'node', catches: 'PW0', name: 'a key field is a password field again in the markup (c2\'s; the live page hides it — the sweep turns it to text — but the browser remembers it was a password, so only the source gate can see it)', m: (s) => s, page: (h) => h.replace('<input class="field-input nopw-mask" type="text" id="k-dg" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">', '<input class="field-input" type="password" id="k-dg" autocomplete="off">') },
  { part: 'bl1', by: 'browser', catches: 'PW1', name: 'the sweep stamps new-password again (the name field becomes a password)', m: (s) => s, page: (h) => h.replace("      if (el.getAttribute('autocomplete') !== 'off') {\n        el.setAttribute('autocomplete', 'off');", "      if (el.getAttribute('autocomplete') !== 'new-password') {\n        el.setAttribute('autocomplete', 'new-password');") },
  { part: 'bl1', by: 'browser', catches: 'PW2', name: 'the sweep stops adding data-form-type', m: (s) => s, page: (h) => h.replace("\n      if (!el.hasAttribute('data-form-type')) el.setAttribute('data-form-type', 'other');", '') },
  { part: 'bl1', by: 'browser', catches: 'PW3', name: 'a key field shows its key in clear', m: (s) => s, page: (h) => h.replace('<input class="field-input nopw-mask" type="text" id="k-tok"', '<input class="field-input" type="text" id="k-tok"') },
  { part: 'bl1', by: 'node', catches: 'PW0', name: 'a type=password is shipped', m: (s) => s, page: (h) => h.replace('<input class="field-input nopw-mask" type="text" id="k-pat" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">', '<input class="field-input" type="password" id="k-pat" autocomplete="off">') },
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
