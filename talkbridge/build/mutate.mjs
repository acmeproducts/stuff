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
const [baseP, builtP, midP] = process.argv.slice(2);
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
  ['a media-control wrap sneaks back in',
   s => s.replace('function wireClockHome() {', "(function(){var _m=CALL.toggleMic;CALL.toggleMic=function(){return _m.apply(this,arguments)};})();\nfunction wireClockHome() {")],
  ['appended code reaches for the ribbon mic element',
   s => s.replace("var clock = document.querySelector('.left-clock');", "var _x = $('rb-mic'); if (_x) _x.classList.add('off');\n    var clock = document.querySelector('.left-clock');")],
  ['timer never writes the duration',
   s => s.replace("el.textContent = CALL.connBad ? 'Reconnecting…' : callDuration(CALL.startTs);", '/* mutation */')],
  ['typing indicator never gains its visible state',
   s => s.replace("el.classList.add('on');", '/* mutation */')],
  ['dedup always waves duplicates through',
   s => s.replace('function isDuplicatePhrase(text, now) {', 'function isDuplicatePhrase(text, now) { return false;')],
  ['PIP drag stops setting coordinates',
   s => s.replace("band.style.left = nx + 'px';", '/* mutation */')],
  ['tap-to-swap silently unwired',
   s => s.replace("if (host.dataset) host.dataset.r8Pip = '1';", '/* mutation */')],
  ['away-mute stops muting',
   s => s.replace('CALL.toggleMic();\n    R8_AWAY.mutedByAway = true;', 'R8_AWAY.mutedByAway = true;')],
  ['a real toggleMic reassignment sneaks into R8b',
   s => s.replace('function wirePipSwap() {', 'CALL.toggleMic = function(){};\nfunction wirePipSwap() {')],
  ['typed chat mark quietly dropped again',
   s => s.replace("return '<span class=\"origin-mark\">' + ICON.hdrChat + '</span>';", "return '';")],
  ['the inserter anchors on markup the renderer never produces (the exact shipped defect)',
   s => s.replace('html.replace(/(<span class="tr-who who[^"]*">)/', 'html.replace(/(<span class="who">)/')],
  ['instrumentation starts mutating the name it was only meant to observe',
   s => s.replace("had: _room ? _room.partnerName : null", "had: (_room ? (_room.partnerName = d.name || d.newName || d.senderName) : null)")],
  ['the base timer writer comes back to life',
   s => s.replace('if (CALL && CALL.durTimer) { clearInterval(CALL.durTimer); CALL.durTimer = null; }', '/* mutation */')],
  ['the relay Speaking stamp writes the slot again',
   s => s.replace("renderPartnerState = function () {", "renderPartnerState = function () { var el=$('rz-timer'); if (el) el.textContent='Speaking…';")],
];

let caught = 0, missed = [];
for (const [name, fn] of mutations) {
  const mutated = fn(built);
  if (mutated === built) { missed.push(name + ' (mutation did not apply — anchor drifted)'); continue; }
  const tmp = join(here, '.mut-tmp.html');
  writeFileSync(tmp, mutated);
  let failed = false;
  try { execFileSync('node', [join(here, 'harness.mjs'), baseP, tmp].concat(midP ? [midP] : []), { stdio: 'pipe' }); }
  catch { failed = true; }
  unlinkSync(tmp);
  if (failed) { caught++; console.log('  caught  ' + name); }
  else missed.push(name);
}
console.log('\n' + caught + '/' + mutations.length + ' fresh defects caught');
if (missed.length) { console.log('MISSED:\n  ' + missed.join('\n  ')); process.exit(1); }
