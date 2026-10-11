#!/usr/bin/env node
/* 29·ship mutation gate (candidate 4): each mutation breaks or reverts ONE thing the stage declares — an edit to RH-1, a banked page or worker edit
   left unapplied, a post-assembly edit to the page or the worker, a manifest rule — and harness-29s must go red on the NAMED test.
   Nothing on disk is modified; each mutant folder is written to a temp dir.  Usage: node mutate-29s.mjs   TB_MUT_ONLY=<id>  TB_MUT_WORKERS=3 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { assembleAll, FOLDER, OUT, PART, PART2, STAGE_PAGE, WORKER_NAME, MANIFEST_NAME, MANIFEST_IOS_NAME } from './assemble-29s.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const part0 = fs.readFileSync(path.join(root, PART), 'utf8'); const part20 = fs.readFileSync(path.join(root, PART2), 'utf8');
const once = (s, find, rep) => { const i = s.indexOf(find); return i === -1 ? s : s.slice(0, i) + rep + s.slice(i + find.length); };

/* { catches: '<test id>', name, part?(s), page?(html), worker?(js), keep?: [ids], keepW?: [ids], env?: {}, group?: letter(s) } */
const M = [
  /* RM-1 itself */
  { catches: 'A1', name: 'p2Runs follows the display mode again (the app stack arms only when installed)', part: (s) => s.replace('function p2Runs() { return true; }', 'function p2Runs() { return p2IsStandalone(); }') },
  { catches: 'A1', name: 'an attempt with no tap may always run (a tab would prompt on its own)', part: (s) => s.replace("function rhMayAttempt() { return p2IsStandalone() || (rhCanPush() && rhPerm() === 'granted'); }", 'function rhMayAttempt() { return true; }') },
  { catches: 'A3', name: 'a tab with the permission already granted may not attempt (the silent subscription is lost)', part: (s) => s.replace("function rhMayAttempt() { return p2IsStandalone() || (rhCanPush() && rhPerm() === 'granted'); }", 'function rhMayAttempt() { return p2IsStandalone(); }') },
  { catches: 'A2', name: 'a stolen tap comes back (G33): the next tap anywhere re-runs the attempt', part: (s) => s.replace("    rh.timer = setInterval(rhTick, 3000);", "    rh.timer = setInterval(rhTick, 3000); document.addEventListener('click', function h0() { document.removeEventListener('click', h0, true); p3AttemptInGesture(); }, true);") },
  { catches: 'B1', name: 'the bar needs no first message', part: (s) => s.replace("  return transcript.some(function (e) { return e && e.kind === 'chat'; });\n}\nfunction rhRenderBar()", "  return true;\n}\nfunction rhRenderBar()") },
  { catches: 'B1', name: 'the bar needs no partner', part: (s) => s.replace("  if (!room.joined) return false;\n", '') },
  { catches: 'B1', name: 'the bar is mounted after the composer, not above it', part: (s) => s.replace("compose.parentNode.insertBefore(bar, compose); }", "compose.parentNode.insertBefore(bar, compose.nextSibling); }") },
  { catches: 'B2', name: 'the decision key is ignored (nagging)', part: (s) => s.replace("  if (rhOfferDone()) return false;\n", '') },
  { catches: 'B2', name: 'the bar is shown where the browser cannot push', part: (s) => s.replace("if (!line || line.kind === 'unsupported' || line.kind === 'denied' || line.kind === 'install') return false;", "if (!line || line.kind === 'denied' || line.kind === 'install') return false;") },
  { catches: 'B2', name: 'the installed copy is not offered at once', part: (s) => s.replace("  if (p2IsStandalone()) return true;\n  if (!room.joined) return false;", "  if (!room.joined) return false;") },
  { catches: 'B3', name: '"Not now" does not persist', part: (s) => s.replace("function rhOnNo() { try { localStorage.setItem(RH_DONE_KEY, '1'); } catch (_) {} rhLog", "function rhOnNo() { rhLog") },
  { catches: 'B4', name: '"Turn on" asks outside the tap (a timer later — the prompt would be refused or stolen)', part: (s) => s.replace("  var p = p3AttemptInGesture();                                /* synchronously, still inside the tap */", "  var p = new Promise(function (res) { setTimeout(function () { res(p3AttemptInGesture()); }, 0); });") },
  { catches: 'B4', name: '"Turn on" does not record the decision', part: (s) => s.replace("if (st === 'on' || st === 'registering' || st === 'denied') { try { localStorage.setItem(RH_DONE_KEY, '1'); } catch (_) {} }", '') },
  { catches: 'B5', name: 'the blocked line cannot be dismissed (the nag the owner forbade)', part: (s) => s.replace("function rhDismissDenied() { rh.deniedDismissed = true;", "function rhDismissDenied() {") },
  { catches: 'B5', name: 'the blocked line gives one platform\'s words to every platform (G33 part 2)', part: (s) => s.replace("return { kind: 'denied', text: platform === 'android' ?", "return { kind: 'denied', text: true ?") },
  { catches: 'B6', name: '"Show me" moves nowhere', part: (s) => s.replace("function rhOnReady() { rhGoCarry('tap'); }", "function rhOnReady() { rhRender(); }") },
  { catches: 'C1', name: 'the row is never mounted', part: (s) => s.replace("  var panel = document.getElementById('left-panel'); if (!panel) return;", "  var panel = null; if (!panel) return;") },
  { catches: 'C1', name: 'a Notify tab is added to Room settings again', part: (s) => s.replace("    rhRender();\n  } catch (e) { rhLog('init_failed'", "    rhRender(); var tabs0 = document.getElementById('drawer-tabs'); if (tabs0) { var t0 = document.createElement('button'); t0.setAttribute('data-tab', 'notify'); t0.textContent = 'Notify'; tabs0.appendChild(t0); }\n  } catch (e) { rhLog('init_failed'") },
  { catches: 'C2', name: 'a browser that cannot push is told to Turn on', part: (s) => s.replace("  if (!rhCanPush()) return 'unsupported';\n", '') },
  { catches: 'C2', name: 'the row keeps showing Turn on once notifications are on', part: (s) => s.replace("  if (!p3State.sub) return 'granted';", "  if (!p3State.sub) return 'default';\n  return 'default';") },
  { catches: 'K1', name: 'the carrying address is built from the keys the phone SAVED (G66 — a joiner saves none)', part: (s) => s.replace("    var k = CALL.keys();\n    p.k = k.dg || p.k || ''; p.tid = k.tid || p.tid || ''; p.tok = k.tok || p.tok || '';", '') },
  { catches: 'K2', name: 'the grant is not consulted for the carrying address (a grantee carries nothing)', part: (s) => s.replace("    var k = CALL.keys();\n", "    var k = { dg: (S.joinerKeys && S.joinerKeys.k) || localStorage.getItem('tb_dg_key') || '', tid: (S.joinerKeys && S.joinerKeys.tid) || '', tok: (S.joinerKeys && S.joinerKeys.tok) || '' };\n") },
  { catches: 'K4', name: 'the page moves in the middle of a call', part: (s) => s.replace("  if (CALL.active) { rhLog('carry_blocked', { why: why }, 'info'); return false; }\n", '') },
  { catches: 'K4', name: 'an Android tab moves to the carrying address too', part: (s) => s.replace("  if (rhState() !== 'ios-tab' || rhCarryReady(room)) return false;", "  if (rhCarryReady(room)) return false;") },
  { catches: 'K5', name: 'the carried page moves again (a loop)', part: (s) => s.replace("    return !!(p.k || !CALL.keys().dg);\n  } catch (_) { return false; }\n}\n/* An iPhone tab moves", "    return false;\n  } catch (_) { return false; }\n}\n/* An iPhone tab moves") },
  { catches: 'K6', name: 'a joined room with no keys fails silently again', part: (s) => s.replace("  var k = CALL.keys(); if (k.dg) return null;\n  return { kind: 'nokeys'", "  return null;\n  return { kind: 'nokeys'") },
  { catches: 'N1', name: 'every existing subscription is judged to be under the current key (G34)', part: (s) => s.replace("    var have = sub && sub.options && sub.options.applicationServerKey;\n    if (!have) { rhLog('key_unreadable', {}, 'warn'); return 'unreadable'; }", "    return 'match';\n    var have = sub && sub.options && sub.options.applicationServerKey;") },
  { catches: 'N3', name: 'an unreadable key is treated as stale (every launch re-mints and the relay churns endpoints)', part: (s) => s.replace("if (!have) { rhLog('key_unreadable', {}, 'warn'); return 'unreadable'; }", "if (!have) { rhLog('key_unreadable', {}, 'warn'); return 'stale'; }") },
  { catches: 'I2', name: 'the install dialog is raised outside the tap', part: (s) => s.replace("  try { d.prompt(); } catch (_) { rhRender(); return Promise.resolve(null); }", "  setTimeout(function () { try { d.prompt(); } catch (_) {} }, 0);") },
  { catches: 'I2', name: 'the install offer can be used twice', part: (s) => s.replace("  rh.offer = null; window.__tbInstallOffer = null;             /* the browser's offer is good for one use */\n", '') },
  { catches: 'I2', name: 'the row survives the app being installed (appinstalled ignored)', part: (s) => s.replace("rh.offer = null; rh.installed = true; window.__tbInstallOffer = null; rhLog('install_done'", "rhLog('install_done'") },
  { catches: 'I3', name: 'the install is offered to a device whose only keys are in memory (its installed copy would open with none)', part: (s) => s.replace("&& !!rhInstallOffer() && rhHasDurableKeys(); }", "&& !!rhInstallOffer(); }") },
  { catches: 'N4', name: 'a dead subscription is kept (the relay\'s refusal is ignored — the 2026-10-10 loop)', part: (s) => s.replace("  var old = p3State.sub; p3State.sub = null; p3State.registered = {};", "  return Promise.resolve(false); var old = p3State.sub;") },
  { catches: 'N4', name: 'a dead subscription re-mints on every refusal (a loop)', part: (s) => s.replace("  if (rh.reminted) return Promise.resolve(false);\n", "") },
  { catches: 'N5', name: 'a return after a long absence re-registers nothing', part: (s) => s.replace("  if (away >= 60000 && p3State.sub) {", "  if (false) {") },
  { catches: 'N4', name: 'P23 unapplied: the relay\'s dead verdict never reaches the module', keep: ['P23-dead-subscription'] },
  { catches: 'R1', name: 'a mark may move backwards (a stale projection un-reads a message)', part2: (s) => s.replace("var cur = e.receipt || 'sent'; if ((RX_RANK[cur] || 0) >= RX_RANK[level]) return;", "var cur = e.receipt || 'sent';") },
  { catches: 'R1', name: 'the partner\'s entries are marked too', part2: (s) => s.replace("if (!e || e.who !== 'me') return;", "if (!e) return;") },
  { catches: 'R1', name: 'the mark is not saved', part2: (s) => s.replace("  if (active) { saveTr(); changed.forEach", "  if (active) { changed.forEach") },
  { catches: 'R2', name: 'a room not on screen is never marked', part2: (s) => s.replace("  else lsSet(trKey(roomId), tr);\n", "") },
  { catches: 'X1', name: 'P24 unapplied: a ring leaves the chat mic on', keep: ['P24-ring-closes-chat-mic'] },
  { catches: 'X2', name: 'P25 unapplied: a call\'s end restores the chat mic (G68)', keep: ['P25a-no-precall-mic-memory', 'P25b-no-precall-mic-restore'] },
  { catches: 'X3', name: 'P26 unapplied: the counter resets before the audio check — the 2-second loop (G70)', keep: ['P26-dead-track-counts'] },
  { catches: 'X1', name: 'P27 unapplied: a decline logs nothing', keep: ['P27-decline-logs'] },
  { catches: 'R1', name: 'P28 unapplied: the record never reaches the bubbles', keep: ['P28-receipts-from-record'] },
  { catches: 'S4', name: 'RM-1 grows an undeclared symbol', part: (s) => s.replace('function rhLog(what, d, lvl)', 'function rhExtra() { return 1; }\nfunction rhLog(what, d, lvl)') },
  { catches: 'S5', name: 'RM-1 logs an undeclared marker', part: (s) => s.replace("rhLog('bar_declined', { platform: p2Platform() }, 'ok');", "rhLog('bar_declined', { platform: p2Platform() }, 'ok'); rhLog('bar_extra', {}, 'ok');") },
  { catches: 'S6', name: 'RM-1 reaches for the network', part: (s) => s.replace('function rhLog(what, d, lvl)', 'function rhPing() { fetch("https://example.org/ping"); }\nfunction rhLog(what, d, lvl)') },
  { catches: 'S6', name: 'RM-1 stores more than the one decision key', part: (s) => s.replace("rhLog('bar_declined', { platform: p2Platform() }, 'ok');", "rhLog('bar_declined', { platform: p2Platform() }, 'ok'); try { localStorage.setItem('tb_rm_seen', '1'); } catch (_) {}") },
  { catches: 'S7', name: 'a buried pattern returns in the part (G33: a capture-phase tap armed to retry)', part: (s) => s.replace('function rhLog(what, d, lvl)', 'function p3ArmGesture() { var h = function () {}; document.addEventListener(\'click\', h, true); }\nfunction rhLog(what, d, lvl)') },
  { catches: 'E X.rooms', name: 'RM-1 writes to the room records (an undeclared change in installed use)', group: 'E', part: (s) => s.replace('function rhTick() { try { rhSyncRegistration(); } catch (_) {}', 'function rhTick() { try { if (S.rooms[0]) S.rooms[0].rhSeen = 1; rhSyncRegistration(); } catch (_) {}') },
  /* banked page edits left unapplied */
  { catches: 'A1', name: 'P01 unapplied: the tab boots into the old gate path (the gate function is gone)', keep: ['P01-p2Entry'] },
  { catches: 'S5', name: 'P02 unapplied: the gate and its marker stay', keep: ['P02-p2ShowGate-gone'] },
  { catches: 'A1', name: 'P04 unapplied: a tab attempts the subscription with no tap', keep: ['P04-p3Attempt-guard'] },
  { catches: 'A3', name: 'P06 unapplied: the open-time attempt does not run in a tab', keep: ['P06-p3-entry-runs'] },
  { catches: 'A1', name: 'P07 unapplied: the alert journal and the worker-message listener do not arm in a tab', keep: ['P07-p4-entry-runs'] },
  { catches: 'A1', name: 'P08 unapplied: the presence stack does not arm in a tab', keep: ['P08-cr3-entry-runs'] },
  { catches: 'A8', name: 'P09 unapplied: the window does not say what it is', keep: ['P09-announce-kind'] },
  { catches: 'A6', name: 'P10 unapplied: a tab asks at a call', keep: ['P10-ensureNotifPerm'] },
  { catches: 'D1', name: 'P12 unapplied: the ring vibrates whoever hears it', keep: ['P12-ring-vibrate'] },
  { catches: 'D1', name: 'P13 unapplied: the caller\'s ring-back vibrates', keep: ['P13-ringback-quiet'] },
  { catches: 'A9', name: 'P14 unapplied: the page still registers the old worker name', keep: ['P14-sw4-register'] },
  { catches: 'M2', name: 'P15 unapplied: the head names the previous stage\'s manifests and holds no install offer', keep: ['P15-head-manifest'] },
  { catches: 'M3', name: 'P16 unapplied: the later swap names the previous stage\'s manifests', keep: ['P16-manifest-swap'] },
  { catches: 'K5', name: 'P17 unapplied: the iPhone tab strips the carry from its live address (an evicted tab reloads bare — G65\'s outcome)', keep: ['P17-ios-tab-keeps-carry'] },
  { catches: 'N1', name: 'P18 unapplied: an existing subscription is reused unchecked (G34)', keep: ['P18-n11-key-check'] },
  { catches: 'A2', name: 'P19 unapplied: the stolen tap is back (G33)', keep: ['P19-no-stolen-tap'] },
  { catches: 'S5', name: 'P20 unapplied: the one-platform recipe and its marker stay', keep: ['P20-recipe-gone'] },
  { catches: 'V2', name: 'P21 unapplied: PR-2\'s listeners announce "visible" before CR3 says "away"', keep: ['P21-one-away-path'] },
  { catches: 'S5', name: 'P22 unapplied: a failed save names no quota', keep: ['P22-storage-estimate'] },
  /* post-assembly edits to the page */
  { catches: 'I1', name: 'the head no longer holds the install offer (a listener at the end of the page misses Chrome\'s one early fire)', page: (s) => s.replace("window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__tbInstallOffer=e;});", '') },
  { catches: 'V2', name: 'CR3 announces before it sets attended (the relay hears "visible" on blur)', page: (s) => s.replace("window.addEventListener('blur', function () { cr3SetAttended(false, 'blur'); cr3Announce('blur'); });", "window.addEventListener('blur', function () { cr3Announce('blur'); cr3SetAttended(false, 'blur'); });") },
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
    const part2 = m.part2 ? m.part2(part20) : part20; if (m.part2 && part2 === part20) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name });
    let files; try { files = assembleAll({ part, part2, keepReplacements: m.keep || [], keepWorkerReplacements: m.keepW || [], noStartUrl: !!(m.env && m.env.TB_IO_NO_START_URL), iosStartUrl: !!(m.env && m.env.TB_IO_IOS_START_URL) }); } catch (e) { return resolve({ ok: false, line: 'MISS  assembly refused: ' + m.name + ' — ' + e.message }); }
    if (m.page) { const k = OUT.page, b = files[k]; files[k] = m.page(b); if (files[k] === b) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); }
    if (m.worker) { const k = OUT.worker, b = files[k]; files[k] = m.worker(b); if (files[k] === b) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); }
    const dir = path.join(tmp, 'f' + i); fs.mkdirSync(dir);
    for (const n of fs.readdirSync(path.join(root, FOLDER))) fs.symlinkSync(path.join(root, FOLDER, n), path.join(dir, n));
    for (const [f, c] of Object.entries(files)) { const p = path.join(dir, f.slice(FOLDER.length + 1)); fs.rmSync(p, { force: true }); fs.writeFileSync(p, c); }
    const partPath = path.join(tmp, 'part' + i + '.js'); fs.writeFileSync(partPath, part); const part2Path = path.join(tmp, 'part2-' + i + '.js'); fs.writeFileSync(part2Path, part2);
    const group = m.group || m.catches[0];
    const env = { ...process.env, TB_IO_DIR: dir, TB_IO_PART: partPath, TB_IO_PART2: part2Path, TB_IO_KEEP: (m.keep || []).join(','), TB_IO_KEEP_W: (m.keepW || []).join(','), TB_IO_ONLY: 'S,' + group, ...(m.env || {}) };
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
