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
  ['label rewrite clobbers the whole span (tooltip destroyed)',
   s => s.replace("kids[k].nodeValue = MENU_LABEL[id];", "span.textContent = MENU_LABEL[id];")],
  ['an icon swap sneaks back into the menu toggles',
   s => s.replace("      applyMenuLabels();\n      dressFlagBands();",
                  "      applyMenuLabels();\n      try{var b=document.getElementById('s4b-ear');var sv=b&&b.querySelector('svg');if(sv)sv.outerHTML='<svg><path d=\\\"M9 9\\\"/></svg>';}catch(_){}\n      dressFlagBands();")],
  ['password sweep gutted',
   s => s.replace('function suppressPasswordUI() {', 'function suppressPasswordUI() { return 0;')],
  ['a gif layer sneaks back in',
   s => s.replace('"url(\'./flags-tall.png\'),"', '"url(\'./flags-tall.gif\'),url(\'./flags-tall.png\'),"')],
  ['flag CSS loses its scoping',
   s => s.replace("'#scr-s0 .flagband,#scr-s10 .flagband{position:relative;", "'.flagband,#scr-s10 .flagband{position:relative;")],
  ['the gif-killing override is dropped',
   s => s.replace(".flagband{background-image:url(\\'./flags.png\\')}", "")],
  ['a NodeList.forEach lands in shipped code',
   s => s.replace('function wireClockHome() {', "function wireClockHome() { document.querySelectorAll('.x').forEach(function(){});")],
  ['&debug=1 quietly returns',
   s => s.replace('var R8_CSS', "var R8_DEBUG_ON = /[?&]debug=1/.test(location.search);\nvar R8_CSS")],
  ['legibility CSS silently dropped',
   s => s.replace("'.drawer-tab{font-size:14px}' +", "")],
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
