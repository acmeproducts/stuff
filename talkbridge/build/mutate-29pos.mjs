#!/usr/bin/env node
/* 29·post-ship mutation gate (candidate 1): each mutation breaks or reverts ONE thing the stage declares — an edit to L1, a banked edit left
   unapplied, a row of the table, an inventory allowance, a post-assembly edit to the page or the worker — and harness-29pos must go red on
   the NAMED test. Nothing on disk is modified; each mutant folder is written to a temp dir.  Usage: node mutate-29pos.mjs   TB_MUT_ONLY=<id>  TB_MUT_WORKERS=3 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { assembleAll, FOLDER, OUT, PART, STAGE_PAGE, WORKER_NAME, MANIFEST_NAME, MANIFEST_IOS_NAME, pageReplacements } from './assemble-29pos.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const part0 = fs.readFileSync(path.join(root, PART), 'utf8');
const once = (s, find, rep) => { const i = s.indexOf(find); if (i === -1) throw new Error('mutation find missing: ' + find.slice(0, 60)); return s.slice(0, i) + rep + s.slice(i + find.length); };
const idOf = (needle) => { const r = pageReplacements().find((x) => x.find.indexOf(needle) !== -1 || x.replace.indexOf(needle) !== -1); if (!r) throw new Error('no edit holds ' + needle); return r.id; };

/* { catches: '<test id>', name, part?(s), page?(html), worker?(js), keep?: [ids], keepW?: [ids], group?: letter(s) } */
const M = [
  /* L1 itself */
  { catches: 'R1', name: 'navigator.language is ignored (every fresh phone boots English)', part: (s) => once(s, "    S.user.lang = l10nFromNavigator();", "    S.user.lang = 'en';") },
  { catches: 'R2', name: "Filipino's old tag is not mapped (a tl-PH phone boots English)", part: (s) => once(s, "if (prim === 'tl') prim = 'fil';", "") },
  { catches: 'R2', name: 'the saved choice is overwritten by the navigator on every boot', part: (s) => once(s, "  if (!S.user.lang || !LANGS[S.user.lang]) {", "  if (true) {") },
  { catches: 'R3', name: 'a room\'s language overrides the app language again (candidate 1\'s rule)', part: (s) => once(s, "function l10nLang() { return l10nUserLang(); }", "function l10nLang() { var r = null; try { if (S.view === 'room' && typeof activeRoom === 'function') r = activeRoom(); } catch (_) {} return (r && r.myLang && LANGS[r.myLang]) ? r.myLang : l10nUserLang(); }") },
  { catches: 'R3', name: 'the first room never sets the language', part: (s) => once(s, "  var was = S.user.lang; S.user.lang = lang; S.user.langFrom = 'room';", "  var was = S.user.lang; S.user.langFrom = 'room';") },
  { catches: 'R3', name: 'every room sets the language (a second room overrides the first)', part: (s) => once(s, "S.user.langFrom === 'room' || S.user.langFrom === 'setting') return S.user.lang;", "S.user.langFrom === 'setting') return S.user.lang;") },
  { catches: 'R3', name: 'a later room beats the clock setting', part: (s) => once(s, "S.user.langFrom === 'room' || S.user.langFrom === 'setting') return S.user.lang;", "S.user.langFrom === 'room') return S.user.lang;") },
  { catches: 'R3', name: 'the clock setting does not mark itself (the next room overrides it)', part: (s) => once(s, "S.user.lang = v; S.user.langFrom = 'setting'; try { saveUser(); } catch (_) {}", "S.user.lang = v; try { saveUser(); } catch (_) {}") },
  { catches: 'R3b', name: 'the creator\'s first room does not adopt (banked edit unapplied)', keep: [idOf("l10nAdopt(my,'create');")] },
  { catches: 'R11', name: 'the landing is worded in the phone\'s language, not the invite\'s (nothing adopted)', part: (s) => once(s, "function l10nLandingLang(p) { return l10nAdopt(p && p.tl, 'invite'); }", "function l10nLandingLang(p) { return l10nUserLang(); }") },
  { catches: 'R5', name: 'a received English text is kept beside the key (the fallback the owner ruled out)', page: (h) => once(h, "kind: 'sys', key: d.key, vars: d.vars || {}, ts: Date.now() });", "kind: 'sys', key: d.key, vars: d.vars || {}, text: d.text, ts: Date.now() });") },
  { catches: 'R5', name: 'a pill is rendered from its text, not its key', part: (s) => once(s, "function l10nPill(e) { return (e && e.key) ? l10n(e.key, e.vars) : ((e && e.text) || ''); }", "function l10nPill(e) { return (e && e.text) || (e && e.key ? l10n(e.key, e.vars) : ''); }"), page: (h) => once(h, "    addSysPill(d.key, d.vars, d.pillId);", "    addSysPill(d.key, d.vars, d.pillId); if (d.text) transcript[transcript.length - 1].text = d.text;") },
  { catches: 'R6', name: 'the missed-pill guard tests English again (reviewer finding 2: a Thai phone shows two missed pills)', page: (h) => once(h, "text.indexOf('pill_missed_') === 0", "text.indexOf('Missed ') === 0") },
  { catches: 'R7', name: 'a switch re-words nothing already on screen (no DOM walk)', part: (s) => once(s, "  l10nStyle(); l10nApplyDom(); l10nApplyCaps();", "  l10nStyle(); l10nApplyCaps();") },
  { catches: 'R7', name: 'a live caption keeps its old words after a switch', part: (s) => once(s, "function l10nApplyCaps() {\n", "function l10nApplyCaps() { return;\n") },
  { catches: 'R7', name: 'the worker is never told the language', part: (s) => once(s, "  l10nStyle(); l10nApplyDom(); l10nApplyCaps(); l10nFillLangSelect(); l10nPostLang();", "  l10nStyle(); l10nApplyDom(); l10nApplyCaps(); l10nFillLangSelect();") },
  { catches: 'R7', name: 'the choice is not saved', part: (s) => once(s, "S.user.lang = v; S.user.langFrom = 'setting'; try { saveUser(); } catch (_) {}", "S.user.lang = v; S.user.langFrom = 'setting';") },
  { catches: 'R8', name: 'the menu labels are relabelled without their key (a switch leaves them)', page: (h) => once(h, "kids[k].nodeValue = l10n(MENU_LABEL[id]); span.setAttribute('data-l10n', MENU_LABEL[id]);", "kids[k].nodeValue = l10n(MENU_LABEL[id]);") },
  { catches: 'R9', name: 'Arabic is not right-to-left', part: (s) => once(s, "function l10nDir(lang) { return L10N_RTL[lang] ? 'rtl' : 'ltr'; }", "function l10nDir(lang) { return 'ltr'; }") },
  { catches: 'R9', name: 'the columns carry the shell\'s direction, not their own language\'s', page: (h) => once(h, "data-lang=\"'+esc(leftLang)+'\" dir=\"'+l10nDir(leftLang)+'\">'", "data-lang=\"'+esc(leftLang)+'\" dir=\"'+l10nDir(l10nLang())+'\">'") },
  { catches: 'R9', name: 'Arabic dates in the Umm al-Qura calendar with Arabic-Indic digits', part: (s) => once(s, "return lang === 'ar' ? tts + '-u-ca-gregory-nu-latn' : tts;", "return tts;") },
  { catches: 'R9', name: 'no rtl rule for the drawer and the FAB', part: (s) => once(s, "[dir=rtl] .fab{right:auto;left:14px}", "") },
  { catches: 'R10', name: 'a missing key is logged every time (the device log floods)', part: (s) => once(s, "if (!l10nState.missing[lang + '/' + key]) { l10nState.missing[lang + '/' + key] = 1; l10nLog('missing', { lang: lang, key: key }, 'warn'); }", "l10nLog('missing', { lang: lang, key: key }, 'warn');") },
  { catches: 'R10', name: 'a missing row falls to nothing instead of English', part: (s) => once(s, "t = L10N.en[key]; }\n  if (t == null)", "t = ''; }\n  if (t == null)") },
  { catches: 'R12', name: 'the bar waits for a first message again (a call-first conversation never prompts)', keep: [idOf("return !!room.joined;")] },
  { catches: 'R4', name: 'the refused-rename toast is English again', keep: [idOf("toast(l10n('toast_room_needs_name')")] },
  { catches: 'R1', name: 'the compose placeholder is not keyed', page: (h) => once(h, ' data-l10n-ph="compose_ph"', '') },
  { catches: 'S4', name: 'L1 grows an undeclared symbol', part: (s) => once(s, 'function l10nLog(what, d, lvl)', 'function l10nExtra() { return 1; }\nfunction l10nLog(what, d, lvl)') },
  { catches: 'S5', name: 'L1 logs an undeclared marker', part: (s) => once(s, "l10nLog('applied', { lang: lang, why: why, changed: changed }, 'ok');", "l10nLog('applied', { lang: lang, why: why, changed: changed }, 'ok'); l10nLog('extra', {}, 'ok');") },
  { catches: 'S6', name: 'L1 reaches for the network', part: (s) => once(s, 'function l10nLog(what, d, lvl)', 'function l10nPing() { fetch("https://example.org/ping"); }\nfunction l10nLog(what, d, lvl)') },
  { catches: 'S6', name: 'L1 writes storage itself', part: (s) => once(s, "S.user.lang = v; S.user.langFrom = 'setting'; try { saveUser(); } catch (_) {}", "S.user.lang = v; S.user.langFrom = 'setting'; try { saveUser(); localStorage.setItem('tb_lang', v); } catch (_) {}") },
  { catches: 'S4', name: 'L1 reassigns a renderer (the wrap map grows)', part: (s) => once(s, 'function l10nLog(what, d, lvl)', 'renderHome = function () {};\nfunction l10nLog(what, d, lvl)') },
  { catches: 'S7', name: 'a buried pattern returns in the part (G68: the chat mic restored after a call)', part: (s) => once(s, 'function l10nLog(what, d, lvl)', 'var _chatMicWasOn = false;\nfunction l10nLog(what, d, lvl)') },
  /* banked edits left unapplied, the table, the inventory */
  { catches: 'G1', name: 'one toast left in English (a banked edit unapplied)', keep: [idOf("toast(l10n('toast_link_copied')")] },
  { catches: 'G1', name: 'a spaced hard-coded label (el.textContent = \'Foo bar\') added to the page', page: (h) => once(h, "function l10nLog(what, d, lvl)", "function l10nFoo() { var el = document.getElementById('x'); if (el) el.textContent = 'Please wait here'; }\nfunction l10nLog(what, d, lvl)") },
  { catches: 'G1', name: 'a confirm() in English', page: (h) => once(h, "function l10nLog(what, d, lvl)", "function l10nAsk() { return confirm('Delete this room?'); }\nfunction l10nLog(what, d, lvl)") },
  { catches: 'G1', name: 'an HTML string with a visible English label', page: (h) => once(h, "function l10nLog(what, d, lvl)", "function l10nBtn() { return '<button class=\"x\">Save now</button>'; }\nfunction l10nLog(what, d, lvl)") },
  { catches: 'G2', name: 'a shell text node left in English (the Continue button)', page: (h) => once(h, ' data-l10n="continue"', '') },
  { catches: 'G3', name: 'an allowance without a reason', inventory: (inv) => { inv.allow.push({ value: 'Please wait here', why: '' }); return inv; }, page: (h) => once(h, "function l10nLog(what, d, lvl)", "function l10nFoo() { return 'Please wait here'; }\nfunction l10nLog(what, d, lvl)") },
  { catches: 'G3', name: 'the worker shows an English card', worker: (w) => once(w, "body = swL(lang, 'sw_new_message');", "body = 'New message';") },
  { catches: 'L2', name: 'the Filipino row dropped from the table (the hand list of 20)', table: (t) => { delete t.fil; t.langs = t.langs.filter((l) => l !== 'fil'); return t; } },
  { catches: 'L2', name: 'a translation lost its {token}', table: (t) => { t.th.pill_joined = 'เข้าร่วมแล้ว'; return t; } },
  { catches: 'L2', name: 'a translation grew a tag', table: (t) => { t.de.continue = '<b>Weiter</b>'; return t; } },
  { catches: 'L2', name: 'an empty row', table: (t) => { t.ja.close = ''; return t; } },
  { catches: 'L3', name: 'a language not marked machine-translated', table: (t) => { delete t._mt.sv; return t; } },
  { catches: 'L4', name: 'the worker table holds one language fewer', worker: (w) => w.replace(/SW_L10N = (\{.*?\});/, (m, j) => { const o = JSON.parse(j); delete o.tr; return 'SW_L10N = ' + JSON.stringify(o) + ';'; }) },
  { catches: 'W2', name: 'the worker forgets the language it was told', worker: (w) => once(w, "e.waitUntil(saveKv('lang', d.lang.slice(0, 8))); return;", "return;") },
  { catches: 'W2', name: 'the missed card stays English', worker: (w) => once(w, "var body = swL(lang, 'sw_missed_call')", "var body = swL(null, 'sw_missed_call')") },
  { catches: 'M1', name: 'the head still names the 29·ship manifests', keep: [idOf("tb-manifest-turn29-post-ship-ios.webmanifest")] },
  { catches: 'M1', name: 'the page registers the old worker', keep: [idOf("'tb-sw5.js'")] },
  { catches: 'T1', name: 'I18N comes back as a second table', page: (h) => once(h, 'var I18N_RETIRED={', 'var I18N={en:{join:"Join"}};\nvar I18N_RETIRED={') },
  { catches: 'T2', name: 'a second language select outside the S13 modal', page: (h) => once(h, '<div id="app">', '<div id="app"><select id="s13-lang"></select>') },
  { catches: 'E X.transcript', name: 'the keyed rename carries different words than the accepted build (the English template changed)', group: 'E', table: (t) => { t.en.pill_renamed = '{who} renamed the room to "{to}"'; return t; }, inventory: (inv) => { inv.keys.pill_renamed = '{who} renamed the room to "{to}"'; return inv; } },
];

function build(m) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tb29pos-')); const dir = path.join(tmp, FOLDER); fs.mkdirSync(dir, { recursive: true });
  const part = m.part ? m.part(part0) : part0;
  let files; const opts = { part, keepReplacements: m.keep || [], keepWorkerReplacements: m.keepW || [] };
  files = assembleAll(opts);
  let page = files[OUT.page], worker = files[OUT.worker];
  if (m.page) page = m.page(page); if (m.worker) worker = m.worker(worker);
  if (m.table) { const t = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/fixtures/l10n/table.json'), 'utf8')); const t2 = m.table(t); fs.writeFileSync(path.join(tmp, 'table.json'), JSON.stringify(t2)); const full = {}; for (const l of t2.langs) { full[l] = {}; for (const k of t2.keys) full[l][k] = l === 'en' ? t2.en[k] : (t2[l] && t2[l][k] != null ? t2[l][k] : t2.en[k]); } page = page.replace(/, L10N = \{[\s\S]*?\}, L10N_MT = \{[^\n]*?\}, L10N_RTL/, () => ', L10N = ' + JSON.stringify(full) + ', L10N_MT = ' + JSON.stringify(t2._mt) + ', L10N_RTL'); }
  if (m.inventory) { const inv = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/fixtures/l10n/inventory.json'), 'utf8')); fs.writeFileSync(path.join(tmp, 'inventory.json'), JSON.stringify(m.inventory(inv))); }
  fs.writeFileSync(path.join(dir, STAGE_PAGE), page); fs.writeFileSync(path.join(dir, WORKER_NAME), worker); fs.writeFileSync(path.join(dir, MANIFEST_NAME), files[OUT.manifest]); fs.writeFileSync(path.join(dir, MANIFEST_IOS_NAME), files[OUT.manifestIos]);
  for (const f of fs.readdirSync(path.join(root, FOLDER))) if (/\.png$/.test(f)) fs.copyFileSync(path.join(root, FOLDER, f), path.join(dir, f));
  if (m.part) fs.writeFileSync(path.join(tmp, 'part.js'), part);
  return { tmp, dir, part: m.part ? path.join(tmp, 'part.js') : null };
}
function run(m) {
  return new Promise((resolve) => {
    let b; try { b = build(m); } catch (e) { return resolve({ m, caught: false, out: 'BUILD FAILED: ' + e.message }); }
    const env = { ...process.env, TB_IO_DIR: b.dir, TB_IO_ONLY: (m.group || m.catches[0]), TB_IO_SKIP_E: m.group === 'E' ? '' : '1' };
    if (b.part) env.TB_IO_PART = b.part; if (m.keep && m.keep.length) env.TB_IO_KEEP = m.keep.join(','); if (m.keepW && m.keepW.length) env.TB_IO_KEEP_W = m.keepW.join(',');
    if (m.table) env.TB_IO_TABLE = path.join(b.tmp, 'table.json'); if (m.inventory) env.TB_IO_INVENTORY = path.join(b.tmp, 'inventory.json');
    const p = spawn(process.execPath, [path.join(root, 'talkbridge/build/harness-29pos.mjs')], { env }); let out = '';
    p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
    p.on('close', () => { fs.rmSync(b.tmp, { recursive: true, force: true }); const re = new RegExp('^FAIL  ' + m.catches.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'm'); resolve({ m, caught: re.test(out), out }); });
  });
}
const only = process.env.TB_MUT_ONLY; const list = only ? M.filter((m) => m.name.indexOf(only) !== -1 || m.catches === only) : M;
const workers = Math.max(1, parseInt(process.env.TB_MUT_WORKERS || '3', 10)); let caught = 0, missed = 0; const queue = list.slice();
await Promise.all(Array.from({ length: workers }, async () => { while (queue.length) { const m = queue.shift(); const r = await run(m); if (r.caught) { caught++; console.log('  ok  [' + m.catches.slice(0, 40) + '] catches: ' + m.name); } else { missed++; console.log('MISSED [' + m.catches + '] ' + m.name + '\n' + r.out.split('\n').filter((l) => /^FAIL|BUILD FAILED|Error/.test(l)).slice(0, 4).join('\n')); } } }));
console.log('\nmutations ' + caught + '/' + (caught + missed) + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
