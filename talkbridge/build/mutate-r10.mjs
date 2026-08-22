#!/usr/bin/env node
/* R10 mutation gate — fresh defects only. */
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const here = dirname(fileURLToPath(import.meta.url));
const [srcP, candP] = process.argv.slice(2);
const cand = readFileSync(candP, 'utf8');
const mutations = [
  ['handoff arms into localStorage instead of the cookie',
   s => s.replace("document.cookie = COOKIE + '=' + enc + '; ' + ATTRS;", "localStorage.setItem(COOKIE, enc);")],
  ['cookie attributes silently weakened',
   s => s.replace("var ATTRS = 'Path=/stuff/; Max-Age=600; SameSite=Lax; Secure';", "var ATTRS = 'Max-Age=600';")],
  ['standalone recovery stops feeding the existing join path',
   s => s.replace("try { history.replaceState(null, '', location.pathname + location.search + '#j=' + rawJ); } catch (_) {}", "")
         .replace("if ((location.hash || '').indexOf('#j=') !== 0) location.hash = '#j=' + rawJ;", "/* mutation */")],
  ['cookie deleted even when consumption never happened',
   s => s.replace("r8Log('pwa_handoff_failed'", "document.cookie='tb_install_handoff_v1=; Path=/stuff/; Max-Age=0'; r8Log('pwa_handoff_failed'")],
  ['oversize invitation silently truncated',
   s => s.replace("plog('pwa_handoff_oversize', { bytes: enc.length, standalone: false });",
                  "document.cookie = COOKIE + '=' + enc.slice(0, 3800) + '; ' + ATTRS; plog('pwa_handoff_oversize', { bytes: enc.length, standalone: false });")],
  ['enable button leaks into the Safari tab',
   s => s.replace("if (TB_R10.standalone) {\n    row.innerHTML = '<span class=\"r10-n-label\">Notifications</span>'", "if (true) {\n    row.innerHTML = '<span class=\"r10-n-label\">Notifications</span>'")],
  ['subscribe stops being per-room',
   s => s.replace("var jobs = r10ActiveRooms().filter(function (r) { return !TB_R10.subscribedRooms[r.id]; })", "var jobs = r10ActiveRooms().slice(0, 1).filter(function (r) { return !TB_R10.subscribedRooms[r.id]; })")],
  ['hard delete stops unsubscribing that room session',
   s => s.replace("if (!seen[id]) r10Unsubscribe(id);", "/* mutation */")],
  ['soft delete starts unsubscribing (lifecycle change)',
   s => s.replace("if (!seen[id]) r10Unsubscribe(id);", "if (!seen[id]) r10Unsubscribe(id);\n        else if (S.rooms.find(function(r){return r.id===id}) && S.rooms.find(function(r){return r.id===id}).deletedAt) r10Unsubscribe(id);")],
  ['a service secret rides into SW context',
   s => s.replace("client: deviceId,", "client: deviceId, tb_gh_pat_hint: (localStorage.getItem('tb_gh_pat')||'').slice(0,4),")],
  ['visible build id dropped',
   s => s.replace("'<span class=\"r10-build\">' + TB_R10.build + '</span>'", "''")],
  ['the name override is read but never stored on the room',
   s => s.replace("if (r && v && v !== r.myName) { r.myName = v; saveRooms(); }", ';')],
  ['the invite silently reverts to the standing name',
   s => s.replace('p.n = room.myName;', ';')],
  ['the S0 card slides back to center screen',
   s => s.replace("'#scr-s0 .ask-card{margin:10vh auto auto}' +", "'' +")],
  ['the name field crawls back inside the toggle row (the shipped defect)',
   s => s.replace("row.parentNode.insertBefore(lab, row);        /* BEFORE the row — its own field */\n    row.parentNode.insertBefore(inp, row);", 'row.insertBefore(lab, tog); row.insertBefore(inp, tog);')],
  ['the create window quietly loses its flag band',
   s => s.replace("'#m-s3 .flagband{position:relative", "'#m-s3-none .flagband{position:relative")],
  ['keyboard centering stops centering',
   s => s.replace("card.style.margin = top + 'px auto auto';", ';')],
  ['the room-menu label size quietly shrinks again',
   s => s.replace("'.talking-to{font-size:15px}' +", "'' +")],
  ['the enable banner never renders',
   s => s.replace("host.parentNode.insertBefore(b, host);          /* TOP of the panel, unmissable */", ';')],
  ['the banner lingers after permission is granted',
   s => s.replace("if (!pa5NeedsEnable()) { if (existing) existing.remove(); return; }", 'if (!pa5NeedsEnable()) { return; }')],
];
let caught = 0, missed = [];
for (const [name, fn] of mutations) {
  const m = fn(cand);
  if (m === cand) { missed.push(name + ' (anchor drifted)'); continue; }
  const tmp = join(here, '.mut-r10.html');
  writeFileSync(tmp, m);
  let failed = false;
  try { execFileSync('node', [join(here, 'harness-r10.mjs'), srcP, tmp], { stdio: 'pipe', timeout: 120000 }); }
  catch { failed = true; }
  unlinkSync(tmp);
  if (failed) { caught++; console.log('  caught  ' + name); } else missed.push(name);
}
console.log('\n' + caught + '/' + mutations.length + ' fresh defects caught');
if (missed.length) { console.log('MISSED:\n  ' + missed.join('\n  ')); process.exit(1); }
