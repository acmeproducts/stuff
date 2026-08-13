#!/usr/bin/env node
/* Mutation gate — FRESH defects, not replays. Each mutation below is a defect
   the suite has never seen. If the harness stays green under any of them, the
   harness is decorative and the run fails.
   Usage: node mutate.mjs <approved-base.html> <built.html>                  */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const [baseP, builtP] = process.argv.slice(2);
const built = readFileSync(builtP, 'utf8');

const mutations = [
  ['clock tap silently unwired',
   s => s.replace("clock.addEventListener('click',", "clock.addEventListener('r8-never',")],
  ['info card left in place',
   s => s.replace("if (card && card.remove) { card.remove();", "if (false) { card.remove();")],
  ['menu label drifts back to the old wording',
   s => s.replace("'s4b-autoread': 'Hear translation'", "'s4b-autoread': 'Auto-read incoming'")],
  ['headset glyph replaced by a second ear',
   s => s.replace("'<path d=\"M4 14v-2a8 8 0 0 1 16 0v2\"/>' +", "'<path d=\"M6 8.5a5.5 5.5 0 1 1 11 0c0 2.5-2 3.2-2.8 4.6-.6 1-.4 2.4-1.2 3.2a2.5 2.5 0 0 1-4.2-1.8\"/>' +")],
  ['password sweep gutted',
   s => s.replace('function suppressPasswordUI() {', 'function suppressPasswordUI() { return 0;')],
  ['dedup always waves duplicates through',
   s => s.replace('function isDuplicatePhrase(text, now) {', 'function isDuplicatePhrase(text, now) { return false;')],
  ['timer never writes the duration',
   s => s.replace("el.textContent = CALL.connBad ? 'Reconnecting…' : callDuration(CALL.startTs);", "/* mutation */")],
  ['typing indicator never gains its visible state',
   s => s.replace("el.classList.add('on');", "/* mutation */")],
  ['away-mute stops muting',
   s => s.replace('CALL.toggleMic();\n    R8_AWAY.mutedByAway = true;', 'R8_AWAY.mutedByAway = true;')],
  ['PIP drag stops setting coordinates',
   s => s.replace("band.style.left = nx + 'px';", "/* mutation */")],
  ['a gif layer sneaks back in',
   s => s.replace('"url(\'./flags-tall.png\'),"', '"url(\'./flags-tall.gif\'),url(\'./flags-tall.png\'),"')],
  ['flag CSS loses its scoping',
   s => s.replace("'#scr-s0 .flagband,#scr-s10 .flagband{position:relative;", "'.flagband,#scr-s10 .flagband{position:relative;")],
  ['a NodeList.forEach lands in shipped code',
   s => s.replace('function wireClockHome() {', "function wireClockHome() { document.querySelectorAll('.x').forEach(function(){});")],
  ['&debug=1 quietly returns',
   s => s.replace('var R8_AWAY', "var R8_DEBUG_ON = /[?&]debug=1/.test(location.search);\nvar R8_AWAY")],
];

let caught = 0, missed = [];
for (const [name, fn] of mutations) {
  const mutated = fn(built);
  if (mutated === built) { missed.push(name + ' (mutation did not apply — anchor drifted)'); continue; }
  const tmp = join(here, '.mut-tmp.html');
  writeFileSync(tmp, mutated);
  let failed = false;
  try { execFileSync('node', [join(here, 'harness.mjs'), baseP, tmp], { stdio: 'pipe' }); }
  catch { failed = true; }
  unlinkSync(tmp);
  if (failed) { caught++; console.log('  caught  ' + name); }
  else missed.push(name);
}
console.log('\n' + caught + '/' + mutations.length + ' fresh defects caught');
if (missed.length) { console.log('MISSED:\n  ' + missed.join('\n  ')); process.exit(1); }
