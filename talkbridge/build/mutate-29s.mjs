#!/usr/bin/env node
/* 29·ship mutation gate: each mutation breaks or reverts ONE thing the stage declares — an edit to IO-1, a banked page or worker edit
   left unapplied, a post-assembly edit to the page or the worker, a manifest rule — and harness-29s must go red on the NAMED test.
   Nothing on disk is modified; each mutant folder is written to a temp dir.  Usage: node mutate-29s.mjs   TB_MUT_ONLY=<id>  TB_MUT_WORKERS=3 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { assembleAll, FOLDER, OUT, PART, STAGE_PAGE, WORKER_NAME, MANIFEST_NAME, MANIFEST_IOS_NAME } from './assemble-29s.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const part0 = fs.readFileSync(path.join(root, PART), 'utf8');
const once = (s, find, rep) => { const i = s.indexOf(find); return i === -1 ? s : s.slice(0, i) + rep + s.slice(i + find.length); };
const NO_KEY = "  try { localStorage.setItem(NF_DONE_KEY, '1'); } catch (_) {}\n";

/* { catches: '<test id>', name, part?(s), page?(html), worker?(js), keep?: [ids], keepW?: [ids], env?: {}, group?: letter(s) } */
const M = [
  /* IO-1 itself */
  { catches: 'A1', name: 'p2Runs follows the display mode again (the app stack arms only when installed)', part: (s) => s.replace('function p2Runs() { return true; }', 'function p2Runs() { return p2IsStandalone(); }') },
  { catches: 'A1', name: 'an attempt with no tap may always run (a tab would prompt on its own)', part: (s) => s.replace("return p2IsStandalone() || (nfCanPush() && nfPerm() === 'granted');", 'return true;') },
  { catches: 'A3', name: 'a tab with the permission already granted may not attempt (the silent subscription is lost)', part: (s) => s.replace("return p2IsStandalone() || (nfCanPush() && nfPerm() === 'granted');", 'return p2IsStandalone();') },
  { catches: 'A5', name: 'an iPhone tab is not recognised as one', part: (s) => s.replace("  if (p2Platform() === 'ios' && !p2IsStandalone()) return 'ios-tab';\n", '') },
  { catches: 'B1', name: 'the offer needs no first message', part: (s) => s.replace("  return transcript.some(function (e) { return e && e.kind === 'chat'; });", '  return true;') },
  { catches: 'B1', name: 'the offer needs no partner', part: (s) => s.replace('if (!room || room.deletedAt || !room.joined) return false;', 'if (!room || room.deletedAt) return false;') },
  { catches: 'B1', name: 'the bar is mounted after the composer, not above it', part: (s) => s.replace('compose.parentNode.insertBefore(bar, compose); nf.bar = bar;', 'compose.parentNode.insertBefore(bar, compose.nextSibling); nf.bar = bar;') },
  { catches: 'B2', name: 'the offer is shown in the installed app too', part: (s) => s.replace('if (p2IsStandalone() || nfOfferDone()) return false;', 'if (nfOfferDone()) return false;') },
  { catches: 'B2', name: 'the decision key is ignored (nagging)', part: (s) => s.replace('if (p2IsStandalone() || nfOfferDone()) return false;', 'if (p2IsStandalone()) return false;') },
  { catches: 'B2', name: 'the offer is shown where the permission is already refused', part: (s) => s.replace("return st === 'default' || st === 'ios-tab';", "return st === 'default' || st === 'ios-tab' || st === 'denied';") },
  { catches: 'B3', name: '"Not now" does not persist', part: (s) => once(s, NO_KEY, '') },
  { catches: 'B3', name: '"Not now" leaves no line naming the way back', part: (s) => s.replace("  nfNote('You can turn this on later under Room settings → Notify.');\n", '  nfDropBar();\n') },
  { catches: 'B4', name: '"Turn on" asks outside the tap (a timer later — the prompt would be refused or stolen)', part: (s) => s.replace('nfTurnOn();                                                      /* still inside the tap that raised this handler */', 'setTimeout(nfTurnOn, 0);') },
  { catches: 'B4', name: '"Turn on" does not record the decision', part: (s) => { const i = s.indexOf(NO_KEY, s.indexOf(NO_KEY) + 1); return s.slice(0, i) + s.slice(i + NO_KEY.length); } },
  { catches: 'B4', name: 'the Notify tab stays after notifications are on', part: (s) => s.replace('    nfSyncTab(); try { nfRenderPane(); } catch (_) {}\n    return st;', '    return st;') },
  { catches: 'B5', name: 'a refusal says nothing', part: (s) => s.replace("nfNote('Notifications are blocked for this site. You can allow them in your browser’s site settings.');", 'nfDropBar();') },
  { catches: 'B5', name: 'a refusal is not logged', part: (s) => s.replace("nfLog('offer_blocked', { platform: p2Platform() }, 'warn'); ", '') },
  { catches: 'B6', name: 'the iPhone reload address has no new query (the browser would only change the hash and not reload)', part: (s) => s.replace("return i === -1 ? u : u.slice(0, i) + '?nf=' + Date.now().toString(36) + (to ? '&to=' + to : '') + u.slice(i);", 'return u;') },
  { catches: 'B6', name: 'the iPhone reload happens in the middle of a call', part: (s) => s.replace("  if (CALL.active) { try { toast('Finish the call first'); } catch (_) {} return false; }\n", '') },
  { catches: 'B6', name: 'the iPhone bar offers "Turn on" (a prompt that cannot exist there)', part: (s) => once(s, "var ios = nfState() === 'ios-tab';", 'var ios = false;') },
  { catches: 'C1', name: 'the Notify tab stays once notifications are on', part: (s) => s.replace("(st === 'ios-tab' || st === 'default' || st === 'granted' || st === 'denied')", "(st === 'ios-tab' || st === 'default' || st === 'granted' || st === 'denied' || st === 'on')") },
  { catches: 'C1', name: 'the Notify tab is hidden when the permission is blocked (the person loses the explanation)', part: (s) => s.replace("(st === 'ios-tab' || st === 'default' || st === 'granted' || st === 'denied')", "(st === 'ios-tab' || st === 'default' || st === 'granted')") },
  { catches: 'C1', name: 'the Notify tab is never added', part: (s) => s.replace('  tabs.appendChild(tab);\n', '') },
  { catches: 'C2', name: 'the pane\'s Turn on asks outside the tap', part: (s) => s.replace("if (b) b.addEventListener('click', nfTurnOn);", "if (b) b.addEventListener('click', function () { setTimeout(nfTurnOn, 0); });") },
  { catches: 'C3', name: 'tapping Notify on an iPhone tab does not reload at the link-device address', part: (s) => s.replace("  if (nfState() === 'ios-tab' && !NF_VIA_RELOAD) { if (nfReloadForSteps()) return; }\n", '') },
  { catches: 'C3', name: 'the iPhone steps are missing from the pane', part: (s) => s.replace("var steps = (p2GateHtml('', 'ios').match(/<ol class=\"p2-steps\">[\\s\\S]*?<\\/ol>/) || [''])[0];", "var steps = '';") },
  { catches: 'C4', name: 'the reloaded page reloads again (a loop)', part: (s) => s.replace("if (nfState() === 'ios-tab' && !NF_VIA_RELOAD) {", "if (nfState() === 'ios-tab') {") },
  { catches: 'C4', name: 'the reloaded page does not open the steps', part: (s) => s.replace("    if (NF_VIA_RELOAD && nfState() === 'ios-tab' && S.view === 'room') { nfLog('ios_steps', { loadedVia: 'reload', to: NF_TO || 'notify' }, 'ok'); nfOpenTab(NF_TO === 'install' ? 'install' : 'notify'); }\n", '') },
  { catches: 'C5', name: 'the browser\'s install offer is not held (the mini-infobar appears and the tap has nothing to raise)', part: (s) => s.replace('try { e.preventDefault(); } catch (_) {} nf.deferred = e;', 'nf.deferred = e;') },
  { catches: 'C5', name: 'the install dialog is raised outside the tap', part: (s) => s.replace("try { d.prompt(); } catch (_) { nfRenderInstallPane(); return Promise.resolve(null); }", "setTimeout(function () { try { d.prompt(); } catch (_) {} }, 0);") },
  { catches: 'C5', name: 'the install offer can be used twice', part: (s) => s.replace('  nf.deferred = null;\n  try { d.prompt(); }', '  try { d.prompt(); }') },
  { catches: 'C5', name: 'the install outcome is not logged', part: (s) => s.replace("nfLog('install_prompt', { outcome: out }, 'ok'); ", '') },
  { catches: 'C5', name: 'the Install tab survives the app being installed (appinstalled ignored)', part: (s) => s.replace('nf.deferred = null; nf.installed = true;', 'nf.deferred = null;') },
  { catches: 'C5', name: 'the Install tab is never shown', part: (s) => s.replace("itab.style.display = iwant ? '' : 'none';", "itab.style.display = 'none';") },
  { catches: 'C6', name: 'the Install tab shows in the installed app too', part: (s) => s.replace('var iwant = !p2IsStandalone() && !nf.installed;', 'var iwant = !nf.installed;') },
  { catches: 'C6', name: 'with no offer from the browser the pane gives no steps', part: (s) => s.replace("var steps = (p2GateHtml('', platform).match(/<ol class=\"p2-steps\">[\\s\\S]*?<\\/ol>/) || [''])[0];", "var steps = '';") },
  { catches: 'C7', name: 'tapping Install on an iPhone tab does not reload at the link-device address', part: (s) => s.replace("if (p2Platform() === 'ios' && !p2IsStandalone() && !NF_VIA_RELOAD) { if (nfReloadForSteps('install')) return; }", '') },
  { catches: 'C7', name: 'the reload forgets to=install (the reloaded page opens Notify)', part: (s) => s.replace("(to ? '&to=' + to : '')", "''") },
  { catches: 'C7', name: 'the reloaded page opens Notify whatever the reload was for', part: (s) => s.replace("nfOpenTab(NF_TO === 'install' ? 'install' : 'notify');", "nfOpenTab('notify');") },
  { catches: 'S4', name: 'IO-1 grows an undeclared symbol', part: (s) => s.replace('function nfLog(what, d, lvl)', 'function nfExtra() { return 1; }\nfunction nfLog(what, d, lvl)') },
  { catches: 'S5', name: 'IO-1 logs an undeclared marker', part: (s) => s.replace("nfLog('offer_declined', { platform: p2Platform() }, 'ok');", "nfLog('offer_declined', { platform: p2Platform() }, 'ok'); nfLog('offer_extra', {}, 'ok');") },
  { catches: 'S6', name: 'IO-1 reaches for the network', part: (s) => s.replace('function nfLog(what, d, lvl)', 'function nfPing() { fetch("https://example.org/ping"); }\nfunction nfLog(what, d, lvl)') },
  { catches: 'S6', name: 'IO-1 stores more than the one decision key', part: (s) => s.replace("nfLog('offer_declined', { platform: p2Platform() }, 'ok');", "nfLog('offer_declined', { platform: p2Platform() }, 'ok'); try { localStorage.setItem('tb_nf_seen', '1'); } catch (_) {}") },
  { catches: 'E X.rooms', name: 'IO-1 writes to the room records (an undeclared change in installed use)', group: 'E', part: (s) => s.replace('function nfTick() {\n  try {', 'function nfTick() {\n  try { if (S.rooms[0]) S.rooms[0].nfSeen = 1;') },
  /* banked page edits left unapplied */
  { catches: 'A1', name: 'P01 unapplied: the tab boots into the old gate path (the gate function is gone)', keep: ['P01-p2Entry'] },
  { catches: 'S5', name: 'P02 unapplied: the gate and its marker stay', keep: ['P02-p2ShowGate-gone'] },
  { catches: 'A1', name: 'P04 unapplied: a tab attempts the subscription with no tap', keep: ['P04-p3Attempt-guard'] },
  { catches: 'B5', name: 'P05 unapplied: a tab shows the app-settings recipe', keep: ['P05-recipe-guard'] },
  { catches: 'A3', name: 'P06 unapplied: the open-time attempt does not run in a tab', keep: ['P06-p3-entry-runs'] },
  { catches: 'A1', name: 'P07 unapplied: the alert journal and the worker-message listener do not arm in a tab', keep: ['P07-p4-entry-runs'] },
  { catches: 'A1', name: 'P08 unapplied: the presence stack does not arm in a tab', keep: ['P08-cr3-entry-runs'] },
  { catches: 'A8', name: 'P09 unapplied: the window does not say what it is', keep: ['P09-announce-kind'] },
  { catches: 'A6', name: 'P10 unapplied: a tab asks at a call', keep: ['P10-ensureNotifPerm'] },
  { catches: 'D1', name: 'P12 unapplied: the ring vibrates whoever hears it', keep: ['P12-ring-vibrate'] },
  { catches: 'D1', name: 'P13 unapplied: the caller\'s ring-back vibrates', keep: ['P13-ringback-quiet'] },
  { catches: 'A9', name: 'P14 unapplied: the page still registers the old worker name', keep: ['P14-sw4-register'] },
  { catches: 'M2', name: 'P15 unapplied: the head names the previous stage\'s manifests', keep: ['P15-head-manifest'] },
  { catches: 'M3', name: 'P16 unapplied: the later swap names the previous stage\'s manifests', keep: ['P16-manifest-swap'] },
  /* the worker */
  { catches: 'W3', name: 'W02 unapplied: a browser tab\'s announcement overwrites the installed app\'s', keepW: ['W02-announce-kind'] },
  { catches: 'W5', name: 'W03 unapplied: with no installed window the tab is never focused', keepW: ['W03-tap-prefers-app'] },
  { catches: 'W2', name: 'W04 unapplied: the missed-call card makes its sound', keepW: ['W04-missed-silent'] },
  { catches: 'W4', name: 'the tap prefers the browser tab over the installed app', worker: (s) => s.replace('if (announced && list[i].id === announced.id)', 'if (tabAnnounced && list[i].id === tabAnnounced.id)') },
  { catches: 'W6', name: 'with no announced window the first window of any kind is focused', worker: (s) => s.replace(/    if \(!app\) \{ for \(var j = 0;[^\n]*\n/, '    if (!app && list.length) app = list[0];\n') },
  { catches: 'W2', name: 'the call alert turns silent', worker: (s) => s.replace('var opts = { body: d.body, tag: d.tag, renotify: false, silent: false, data: data };', 'var opts = { body: d.body, tag: d.tag, renotify: false, silent: true, data: data };') },
  { catches: 'W2', name: 'the missed-call card vibrates', worker: (s) => s.replace('renotify: false, silent: true,', 'renotify: false, silent: true, vibrate: [200],') },
  /* manifests and the head */
  { catches: 'M1', name: 'the Chrome manifest loses start_url and id (G1 would fail as it did twice before)', env: { TB_IO_NO_START_URL: '1' } },
  { catches: 'M1', name: 'the iPhone manifest gains a start_url (the Home Screen copy would lose the person)', env: { TB_IO_IOS_START_URL: '1' } },
  { catches: 'M2', name: 'the head writes the Chrome manifest for every platform (the c1 failure, G65)', page: (s) => s.replace("? 'tb-manifest-turn29-ship-ios.webmanifest' : 'tb-manifest-turn29-ship.webmanifest'", "? 'tb-manifest-turn29-ship.webmanifest' : 'tb-manifest-turn29-ship.webmanifest'") },
  { catches: 'M2', name: 'the head writes the iPhone manifest for every platform (Android loses the install icon)', page: (s) => s.replace("? 'tb-manifest-turn29-ship-ios.webmanifest' : 'tb-manifest-turn29-ship.webmanifest'", "? 'tb-manifest-turn29-ship-ios.webmanifest' : 'tb-manifest-turn29-ship-ios.webmanifest'") }
];
const WORKERS = Math.max(1, Number(process.env.TB_MUT_WORKERS || 3));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-29s-mut-'));
const jobs = M.map((m, i) => ({ m, i })).filter(({ m }) => !process.env.TB_MUT_ONLY || m.catches === process.env.TB_MUT_ONLY);
const results = [];
function runOne({ m, i }) {
  return new Promise((resolve) => {
    const part = m.part ? m.part(part0) : part0; if (m.part && part === part0) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name });
    let files; try { files = assembleAll({ part, keepReplacements: m.keep || [], keepWorkerReplacements: m.keepW || [], noStartUrl: !!(m.env && m.env.TB_IO_NO_START_URL), iosStartUrl: !!(m.env && m.env.TB_IO_IOS_START_URL) }); } catch (e) { return resolve({ ok: false, line: 'MISS  assembly refused: ' + m.name + ' — ' + e.message }); }
    if (m.page) { const k = OUT.page, b = files[k]; files[k] = m.page(b); if (files[k] === b) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); }
    if (m.worker) { const k = OUT.worker, b = files[k]; files[k] = m.worker(b); if (files[k] === b) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); }
    const dir = path.join(tmp, 'f' + i); fs.mkdirSync(dir);
    for (const n of fs.readdirSync(path.join(root, FOLDER))) fs.symlinkSync(path.join(root, FOLDER, n), path.join(dir, n));
    for (const [f, c] of Object.entries(files)) { const p = path.join(dir, f.slice(FOLDER.length + 1)); fs.rmSync(p, { force: true }); fs.writeFileSync(p, c); }
    const partPath = path.join(tmp, 'part' + i + '.js'); fs.writeFileSync(partPath, part);
    const group = m.group || m.catches[0];
    const env = { ...process.env, TB_IO_DIR: dir, TB_IO_PART: partPath, TB_IO_KEEP: (m.keep || []).join(','), TB_IO_KEEP_W: (m.keepW || []).join(','), TB_IO_ONLY: 'S,' + group, ...(m.env || {}) };
    const child = spawn('node', ['talkbridge/build/harness-29s.mjs'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
    child.on('close', (exit) => {
      const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches + ' '));
      if (exit !== 0 && named) resolve({ ok: true, line: '  ok  [' + m.catches + '] catches: ' + m.name });
      else resolve({ ok: false, line: 'MISS  [' + m.catches + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 40)).join(' / ') + ')') });
    });
  });
}
let next = 0;
async function worker() { while (next < jobs.length) { const j = jobs[next++]; const r = await runOne(j); results.push(r); console.log(r.line); } }
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, worker));
fs.rmSync(tmp, { recursive: true, force: true });
const caught = results.filter((r) => r.ok).length;
console.log('\nmutations ' + caught + '/' + results.length + ' caught, ' + (results.length - caught) + ' missed');
process.exit(caught === results.length ? 0 : 1);
