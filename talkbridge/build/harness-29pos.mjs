#!/usr/bin/env node
/* 29·post-ship harness — LOCALIZATION (§7.17), candidate 1.
   S  the stage = the accepted 29·ship page + the GENERATED banked edits + L1, and nothing else (reversal proof); symbols, markers, no new network,
      credential or message type; the graveyard sweep clean; the fixture is what the inventory generates · M  manifests · L  the table (spec M1):
      English complete, every language every key, tokens kept, the worker's five rows · G  no hard-coded English left (spec M2): a tokenizer over the
      stage's JavaScript and a walk over its HTML, against the inventory's allow-list, each allowance earning its place · R  the rig (spec M3): a Thai
      phone boots Thai, an unknown language boots English, ONE language everywhere set by the first room (owner ruling 2026-10-12), a toast, a pill over the wire with a key (and no English text),
      the missed-pill guard by key, a runtime switch re-words without reload (shell, caps, renderers), Arabic right-to-left with per-column direction
      and Western digits, a missing key once, the joiner landing in the phone's language · W  the worker shim: cards worded in the phone's language ·
      T  structure (spec M4) · E  the 28·post-ship differential: the whole script, both builds, identical (pills compared by their English words).
   Usage: node harness-29pos.mjs   TB_IO_PART=<part.js>  TB_IO_KEEP=id,id  TB_IO_KEEP_W=id,id  TB_IO_DIR=<folder>  TB_IO_ONLY=S,M  TB_IO_SKIP_E=1 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage, baseWorker, pageReplacements, workerReplacements, assemblePage, assembleWorker, assembleManifests, FOLDER_PATH, STAGE_PAGE, WORKER_NAME, MANIFEST_NAME, MANIFEST_IOS_NAME, ADDED_SYMBOLS, EDIT_SYMBOLS, REMOVED_SYMBOLS, ADDED_MARKERS, ADDED_RECEIVED_TYPES, PART, PART2, TAIL } from './assemble-29pos.mjs';
import { sweep } from './graveyard-sweep.mjs';
import { inventory, writeFixture, OUT_DIR, fullTableJson, swTableJson } from './l10n-edits.mjs';
import { jsStrings, htmlTexts, appScript as scanScript } from './l10n-scan.mjs';
import { protect } from './l10n-translate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = process.env.TB_IO_DIR || path.join(root, 'talkbridge-app');
const rd = (f) => fs.readFileSync(f, 'utf8');
const part = process.env.TB_IO_PART ? rd(process.env.TB_IO_PART) : rd(path.join(root, PART)); const part2 = process.env.TB_IO_PART2 ? rd(process.env.TB_IO_PART2) : rd(path.join(root, PART2)); const parts = [part, part2];
const KEEP = process.env.TB_IO_KEEP ? process.env.TB_IO_KEEP.split(',') : [], KEEP_W = process.env.TB_IO_KEEP_W ? process.env.TB_IO_KEEP_W.split(',') : [];
const stage = rd(path.join(dir, STAGE_PAGE)), worker = rd(path.join(dir, WORKER_NAME));
const manChrome = rd(path.join(dir, MANIFEST_NAME)), manIos = rd(path.join(dir, MANIFEST_IOS_NAME));
const base = basePage(), baseW = baseWorker();
const inv = process.env.TB_IO_INVENTORY ? JSON.parse(rd(process.env.TB_IO_INVENTORY)) : inventory(); const table = JSON.parse(rd(process.env.TB_IO_TABLE || path.join(root, 'talkbridge/fixtures/l10n/table.json')));   /* the mutation gate hands in a mutant table or inventory */
const mOpts = {};

let pass = 0, fail = 0;
const ONLY = process.env.TB_IO_ONLY ? new Set(process.env.TB_IO_ONLY.split(',')) : null;
const T = async (name, fn) => { if (ONLY && !ONLY.has(name[0])) return; try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const code = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const appScript = (html) => [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).sort((a, b) => b.length - a.length)[0];
const markers = (js) => { const s = new Set(); const re = /\b(?:log|L|rhLog|cr3Log|p6Log|p4Log|netLog|rcLog|r8Log|lcLog|p3Log|n17Log|prLog|s2Log|f1Log|n10L|p2Log|rxLog|l10nLog|rkLog|rmLog|jLog)\(\s*'([a-z0-9_]+)'/g; let m; while ((m = re.exec(code(js)))) s.add(m[1]); return s; };
const types = (s) => { const t = new Set(); let m; const re = /type:\s*'([a-z-]+)'/g; while ((m = re.exec(s))) t.add(m[1]); return t; };
const netLines = (js) => code(js).split('\n').filter((l) => /new WebSocket\(|\bfetch\(|RELAY_WS|tb_dg_key|tb_cf_tid|tb_cf_tok|credentials\/generate|deepgram\.com/.test(l)).map((l) => l.trim());
const contractOf = (p) => { const i = p.indexOf('@contract'); return p.slice(i, p.indexOf('*/', i)); };
const LANG_ORDER = JSON.parse(base.match(/var LANG_ORDER=(\[[^\]]*\]);/)[1].replace(/'/g, '"'));
const fill = (t, vars) => String(t).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : ''));

console.log('S · the stage is the accepted page plus the generated banked edits plus L1');
await T('S1 the page, the worker and the manifests are the assembler\'s output', () => { assert(stage === assemblePage({ part, part2, keepReplacements: KEEP }), STAGE_PAGE + ' ≠ assemblePage()'); assert(worker === assembleWorker({ keepWorkerReplacements: KEEP_W }), WORKER_NAME + ' ≠ assembleWorker()'); const m = assembleManifests(mOpts); assert(manChrome === m.chrome && manIos === m.ios, 'manifests ≠ the assembler'); });
await T('S2 every find text is in the accepted file exactly once and gone from the stage; every replacement is in the stage exactly once (the manifest\'s count, two hundred and more page edits, ten worker edits)', () => {
  const reps = pageReplacements(), wreps = workerReplacements(); assert(reps.length >= 250 && wreps.length === 10, 'got ' + reps.length + ' + ' + wreps.length);
  for (const [list, src, out, tag] of [[reps, base, stage, 'page'], [wreps, baseW, worker, 'worker']]) for (const r of list) {
    assert(src.split(r.find).length - 1 === 1, tag + ' ' + r.id + ': find not exactly once in the accepted file');
    if ((tag === 'page' ? KEEP : KEEP_W).includes(r.id)) continue;
    assert(out.indexOf(r.find) === -1, tag + ' ' + r.id + ': find text survives'); if (r.replace !== '') assert(out.split(r.replace).length - 1 === 1, tag + ' ' + r.id + ': replacement not exactly once');
    assert(r.replace.indexOf(r.find) === -1, tag + ' ' + r.id + ': replace contains find');
  }
});
await T('S3 reversal: undo the replacements and drop the part and the stage is the accepted page byte for byte; the same for the worker — nothing else changed', () => {
  let back = stage; const tailPart = '\n\n' + part + '\n\n' + part2 + TAIL; assert(back.endsWith(tailPart), 'the two parts are not the tail of the stage'); back = back.slice(0, -tailPart.length) + TAIL;
  for (const r of pageReplacements().reverse()) { if (r.replace === '') continue; back = back.replace(r.replace, () => r.find); }
  /* an empty replacement (the dead L2 line) is re-inserted by its anchor: the line before it */
  for (const r of pageReplacements()) if (r.replace === '') { const anchor = base.slice(0, base.indexOf(r.find)).split('\n').slice(-2, -1)[0] + '\n'; const i = back.indexOf(anchor); assert(i !== -1, 'anchor for the empty replacement lost'); back = back.slice(0, i + anchor.length) + r.find + back.slice(i + anchor.length); }
  assert(back === base, 'the stage minus the banked edits and the part is not the accepted page');
  let wb = worker; for (const r of workerReplacements().reverse()) wb = wb.replace(r.replace, () => r.find); assert(wb === baseW, 'the worker minus the banked edits is not the accepted worker');
});
await T('S4 L1 and RK-1 replace and wrap nothing; each symbol they add is declared, bound once in the stage and never in the accepted page; the table edit binds its four; I18N is gone', () => {
  for (const pt of parts) { const c1 = contractOf(pt); assert(/replaces:\s*\(none\)/.test(c1) && /wraps:\s*\(none\)/.test(c1), 'a part replaces or wraps'); assert(!/^(?:enterRoom|openPanel|showScreen|renderPanel|renderHome|renderTranscript|cr3Apply|log|toast|addSysPill|handleRelay|setPresence|n10Show)\s*=/m.test(code(pt)), 'a part reassigns a function'); }
  const cc = parts.map(contractOf).join('\n');
  const js = code(appScript(stage)), bjs = code(appScript(base));
  for (const s of ADDED_SYMBOLS) { assert(new RegExp('adds:[^\\n]*\\b' + s + '\\b').test(cc), s + ' not declared'); const re = new RegExp('^(?:function\\s+' + s + '\\s*\\(|var\\s+' + s + '\\s*=)', 'mg'); assert((js.match(re) || []).length === 1, s + ' bound ' + (js.match(re) || []).length + 'x in the stage'); assert(!(bjs.match(re) || []).length, s + ' already in the accepted page'); }
  for (const s of EDIT_SYMBOLS) { const re = new RegExp('\\b' + s + '\\s*=\\s*[{\\[]', 'g'); assert((js.match(re) || []).length === 1, s + ' bound ' + (js.match(re) || []).length + 'x'); assert(!(bjs.match(re) || []).length, s + ' already in the accepted page'); }
  const declared = [...cc.matchAll(/adds:([^\n]*)/g)].flatMap((mm) => mm[1].split(',')).map((x) => x.trim()).filter(Boolean); const defined = [...new Set(parts.flatMap((pt) => [...code(pt).matchAll(/^(?:function\s+(\w+)\s*\(|var\s+(\w+)\s*=)/mg)].map((m) => m[1] || m[2])))];
  for (const d of defined) assert(declared.includes(d), 'a part defines ' + d + ' without declaring it'); assert(declared.length === ADDED_SYMBOLS.length, 'declared ' + declared.length + ' ≠ ' + ADDED_SYMBOLS.length);
  for (const s of REMOVED_SYMBOLS) { assert(new RegExp('^var\\s+' + s + '\\s*=', 'm').test(bjs), s + ' was never in the accepted page'); assert(!new RegExp('\\b' + s + '\\b').test(js), s + ' still named in the stage'); }
});
await T('S5 markers(stage) = markers(accepted) + l10n_*; none lost, none undeclared; each l10n marker is logged somewhere', () => {
  const bm = markers(appScript(base)), sm = markers(appScript(stage));
  const extra = [...sm].filter((m) => !bm.has(m) && !ADDED_MARKERS.includes(m)), lost = [...bm].filter((m) => !sm.has(m)); for (const m of ADDED_MARKERS) assert(!bm.has(m) && sm.has(m), m + ' already in the accepted page or never logged');
  assert(extra.length === 0, 'undeclared markers: ' + extra.join(', ')); assert(lost.length === 0, 'markers lost: ' + lost.join(', '));
  for (const m of ['user_lang_set', 'user_lang_adopted', 'user_lang_changed', 'missing', 'applied', 'rerender_failed', 'init_failed']) assert(new RegExp("l10nLog\\('" + m + "'").test(part), 'l10n_' + m + ' never logged');
  for (const m of ['reach_mark', 'reach_unreachable', 'init_failed']) assert(new RegExp("rkLog\\('" + m + "'").test(part2), 'rk_' + m + ' never logged');
});
await T('S6 no network, credential, endpoint or storage line is added or changed; the app SENDS no new relay message type; the one new type it RECEIVES (call-reach, relay v6.11) is declared; the parts reach for nothing', () => {
  const b = netLines(appScript(base)), s = netLines(appScript(stage)); assert(JSON.stringify(b) === JSON.stringify(s), 'network lines differ: +' + s.filter((l) => !b.includes(l)).join(' | ') + ' −' + b.filter((l) => !s.includes(l)).join(' | '));
  for (const pt of parts) { assert(netLines(pt).length === 0 && !/fetch\(|WebSocket|XMLHttpRequest|tb_dg_key|tb_cf_|tb_gh_pat|Authorization|credentials/.test(code(pt)), 'a part reaches for a network or a key'); assert(!/localStorage\./.test(code(pt)), 'a part touches storage itself'); assert(!/relaySend\(|\.send\(/.test(code(pt)), 'a part sends to the relay'); }
  const bt = types(code(appScript(base))), sent = new Set([...parts.flatMap((pt) => [...types(code(pt))]), ...pageReplacements().flatMap((r) => [...types(r.replace)])]); for (const t of sent) assert(bt.has(t), 'new message type sent: ' + t);
  const received = new Set(); let mm; const reRecv = /\.type === '([a-z-]+)'/g; const sjs = code(appScript(stage)), bjs2 = code(appScript(base)); while ((mm = reRecv.exec(sjs))) received.add(mm[1]); const breceived = new Set(); while ((mm = reRecv.exec(bjs2))) breceived.add(mm[1]);
  const newRecv = [...received].filter((t) => !breceived.has(t)); assert(JSON.stringify(newRecv.sort()) === JSON.stringify([...ADDED_RECEIVED_TYPES].sort()), 'received types changed: ' + newRecv.join(','));
});
await T('S7 the graveyard sweep: the stage page and the worker carry no buried pattern', () => { const hs = sweep(stage, { file: STAGE_PAGE }), hw = sweep(worker, { file: WORKER_NAME }); assert(hs.length === 0 && hw.length === 0, 'buried: ' + hs.concat(hw).map((h) => h.id + '@' + h.line).join(',')); });
await T('S8 the banked edits on disk are exactly what the inventory generates (nothing hand-written); the table edit carries table.json', () => {
  const files = writeFixture(); const d = path.join(root, OUT_DIR); const have = fs.readdirSync(d);
  for (const [f, c] of Object.entries(files)) assert(fs.existsSync(path.join(d, f)) && rd(path.join(d, f)) === c, f + ' differs from the generated fixture'); assert(have.length === Object.keys(files).length, 'stray fixture files');
  assert(stage.indexOf('L10N = ' + fullTableJson(inv) + ', L10N_MT = ') !== -1, 'the table in the stage is not table.json'); assert(worker.indexOf('SW_L10N = ' + swTableJson(inv) + ';') !== -1, 'the worker table is not table.json');
});

console.log('M · manifests');
await T('M1 Chrome manifest: scope "./", start_url this stage\'s page, id the folder; iPhone manifest: scope "./", no start_url, no id; everything else as tb-manifest-turn28; icons present', () => {
  const src = JSON.parse(rd(path.join(root, 'tb-manifest-turn28.webmanifest'))), c = JSON.parse(manChrome), i = JSON.parse(manIos);
  assert(c.scope === './' && c.start_url === './' + STAGE_PAGE && c.id === FOLDER_PATH, JSON.stringify({ s: c.scope, u: c.start_url, id: c.id })); assert(i.scope === './' && !('start_url' in i) && !('id' in i), JSON.stringify(i));
  for (const k of Object.keys(src)) if (k !== 'scope') assert(JSON.stringify(c[k]) === JSON.stringify(src[k]) && JSON.stringify(i[k]) === JSON.stringify(src[k]), 'key differs: ' + k);
  for (const m of [c, i]) for (const ic of m.icons) assert(fs.existsSync(path.join(dir, ic.src)), 'icon missing: ' + ic.src);
  assert(/tb-manifest-turn29-post-ship(-ios)?\.webmanifest/.test(stage.slice(0, 40000)) && !/tb-manifest-turn29-ship(-ios)?\.webmanifest/.test(stage.slice(0, 40000)), 'the head does not name this stage\'s manifests');
  assert(/'tb-sw5\.js'/.test(stage) && !/'tb-sw4\.js'/.test(stage), 'the page does not register tb-sw5.js alone');
});

console.log('L · the table (spec M1)');
const DYNAMIC_KEYS = ['pill_video_call_ended_min', 'pill_video_call_ended_sec', 'pill_voice_call_ended_min', 'pill_voice_call_ended_sec'];   /* built by concatenation at the call-end site */
const tableLine = (src, marker) => { const i = src.indexOf(marker); return i === -1 ? -1 : src.slice(0, i).split('\n').length; };
const stageNoTable = (() => { const s = scanScript(stage); const ln = tableLine(s.js, ', L10N = {'); return s.js.split('\n').filter((l, i) => i + 1 !== ln).join('\n'); })();   /* the table edit's line holds every translation; it is the table, not chrome */
const workerNoTable = worker.split('\n').filter((l) => l.indexOf('SW_L10N = {') === -1).join('\n');
const calledKeys = (() => { const s = new Set(); const js = stageNoTable + '\n' + workerNoTable; let m; const re = /\b(?:l10n|l10nIn\([^,]+,|l10nCap\([^,]+,|swL\([^,]+,)\s*\(?\s*'([a-z0-9_]+)'/g; while ((m = re.exec(js))) s.add(m[1]); return s; })();
const usedKeys = (() => { const s = new Set(calledKeys); let m; const re2 = /data-l10n(?:-html|-ph|-title|-aria)?="([a-z0-9_]+)"/g; while ((m = re2.exec(stage))) s.add(m[1]); for (const k of Object.keys(inv.keys)) if (stageNoTable.indexOf("'" + k + "'") !== -1 || workerNoTable.indexOf("'" + k + "'") !== -1) s.add(k); return s; })();
await T('L1 every key the stage or the worker uses exists in English; every English key is used (no dead rows); every key is snake_case', () => {
  const keys = Object.keys(inv.keys); for (const k of keys) assert(/^[a-z][a-z0-9_]*$/.test(k), 'key shape: ' + k);
  const missing = [...calledKeys].filter((k) => !inv.keys[k]); assert(missing.length === 0, 'called but not in the table: ' + missing.join(', '));
  const dead = keys.filter((k) => !usedKeys.has(k) && !DYNAMIC_KEYS.includes(k)); assert(dead.length === 0, 'in the table but never used: ' + dead.join(', '));
  for (const k of DYNAMIC_KEYS) assert(inv.keys[k] && stage.indexOf("'" + k.replace(/_(min|sec)$/, '') + "'") !== -1, 'dynamic key ' + k + ' has no prefix site');
  assert(JSON.stringify(table.keys) === JSON.stringify(keys) && JSON.stringify(table.en) === JSON.stringify(inv.keys), 'table.json keys/English ≠ inventory');
});
await T('L2 every language in LANGS (read from the page bytes) has every key, non-empty, with every {token} and tag of the English exactly once and no tag of its own', () => {
  assert(JSON.stringify(table.langs) === JSON.stringify(LANG_ORDER) && LANG_ORDER.length === 21 && LANG_ORDER.includes('fil'), 'languages ≠ LANG_ORDER');
  const gaps = [];
  for (const l of LANG_ORDER) { if (l === 'en') continue; assert(table[l], 'no rows for ' + l); for (const k of table.keys) { const en = inv.keys[k], tr = table[l][k]; if (tr == null || !String(tr).trim()) { gaps.push(l + '/' + k + ' empty'); continue; } const toks = protect(en).toks; for (const t of toks) { const n = String(tr).split(t).length - 1; if (n !== 1) gaps.push(l + '/' + k + ' token ' + t + ' x' + n); } if ((String(tr).match(/<[^>]+>/g) || []).join('|') !== (en.match(/<[^>]+>/g) || []).join('|') || /[<>]/.test(String(tr).replace(/<[^>]+>/g, ''))) gaps.push(l + '/' + k + ' tag'); } }
  assert(gaps.length === 0, gaps.length + ' gaps: ' + gaps.slice(0, 8).join('; '));
});
await T('L3 every non-English language is marked machine-translated; the owner\'s Thai overrides are in the table (the joiner landing\'s five words that shipped since 22·base)', () => {
  for (const l of LANG_ORDER) if (l !== 'en') assert(table._mt[l] === true, l + ' not marked _mt');
  const ov = JSON.parse(rd(path.join(root, 'talkbridge/fixtures/l10n/overrides.json'))); for (const k of Object.keys(ov.th)) assert(table.th[k] === ov.th[k], 'override not applied: ' + k);
  assert(table.th.join === 'เข้าร่วม' && table.th.your_name === 'ชื่อของคุณ', 'the shipped Thai words are not the table\'s');
  assert(fs.existsSync(path.join(root, 'talkbridge/L10N-THAI-REVIEW.md')) && rd(path.join(root, 'talkbridge/L10N-THAI-REVIEW.md')).split('\n').filter((l) => /^\| `/.test(l)).length === table.keys.length, 'the Thai review sheet does not list every key');
});
await T('L4 the worker carries the five card strings in every language, equal to the table', () => {
  const m = worker.match(/SW_L10N = (\{.*?\});\s*\/\*/); assert(m, 'no SW_L10N'); const sw = JSON.parse(m[1]);
  assert(JSON.stringify(Object.keys(sw)) === JSON.stringify(LANG_ORDER), 'worker languages'); for (const l of LANG_ORDER) for (const k of inv.sw_keys) assert(sw[l][k] === (l === 'en' ? inv.keys[k] : table[l][k]), 'worker row ' + l + '/' + k);
});

console.log('G · no hard-coded English left (spec M2)');
const allowFor = (scope) => inv.allow.filter((a) => (a.scope || 'page') === scope || a.scope === 'both');
const allowValue = new Set(allowFor('page').filter((a) => a.value).map((a) => a.value)), allowPat = allowFor('page').filter((a) => a.pattern).map((a) => new RegExp(a.pattern));
const allowed = (v) => allowValue.has(v) || allowPat.some((re) => re.test(v));
const allowedW = (v) => allowFor('worker').some((a) => a.value ? a.value === v : new RegExp(a.pattern).test(v));
const wordy = (v) => /[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(v) || /^[A-Z][a-z]+[.!?…:]?\s?$/.test(v.trim()) || /[A-Za-z]{3,}…/.test(v) || /^\s?[A-Z][a-z]+\s?$/.test(v);
const isMarkup = (v) => /<[a-z!\/]/i.test(v) || /^\\?"?\s*(?:[a-z-]+=\\?"|[a-z-]+=')/.test(v) || /^[\s"']*(?:class|style|id|data-[a-z-]+|title|placeholder|aria-label|href|src|for|name|value)=/.test(v);
const isCode = (v) => /^(?:&#x?[0-9a-f]+;|&[a-z]+;|\s)+$/i.test(v) || /^[\w$.#:\-\[\]=(),>*\s]*\{[^}]*:[^}]*\}/.test(v) || /;\s*[a-z-]+\s*:/.test(v) || /^[a-z-]+:[^;{}]+;/.test(v) || /\{[a-z-]+:[^}]*/.test(v) || /^[a-z0-9_\-.#\[\]=():,>\s*/]+$/.test(v) || /^https?:|^wss?:|^data:|^\.{1,2}\//.test(v) || /^[A-Z_]+$/.test(v) || /^[\d\s:.\-TZ]+$/.test(v);
const inL10n = (before) => /(?:\bl10n|\bl10nIn\([^,]+,|\bl10nCap\([^,]+,|\bswL\([^,]+,)\s*\(?\s*$/.test(before) || /\b(?:log|[A-Za-z0-9]*Log|L|jLog)\(\s*$/.test(before) || /\b(?:log|[A-Za-z0-9]*Log|L)\([^()]*,\s*\{[^}]*$/.test(before) || /new Error\(\s*$/.test(before) || /console\.\w+\(\s*$/.test(before);
function englishLeft(js, ok) {
  ok = ok || allowed; const out = [];
  for (const o of jsStrings(js)) {
    const v = o.value; if (!/[A-Za-z]{2,}/.test(v) || isCode(v) || ok(v) || inL10n(o.before)) continue;
    if (isMarkup(v)) { /* an HTML fragment: its visible text and its text attributes must carry no words */
      const texts = [...v.matchAll(/>([^<]*?)</g)].map((m) => m[1]).concat([...v.matchAll(/(?:title|placeholder|aria-label)="([^"]*)"/g)].map((m) => m[1])).map((t) => t.replace(/&#x?[0-9a-f]+;|&[a-z]+;/gi, '')).filter((t) => /[A-Za-z]{2,}/.test(t) && !ok(t) && !ok(v));
      if (texts.length) out.push({ line: o.line, value: texts.join(' | ').slice(0, 60), kind: 'html' }); continue;
    }
    if (wordy(v)) out.push({ line: o.line, value: v.slice(0, 60), kind: 'js' });
  }
  return out;
}
await T('G1 the stage\'s JavaScript holds no English chrome string outside l10n(): every string literal with words is a key call, a log, an error, or an allowed literal with a stated reason', () => {
  const s = scanScript(stage); const left = englishLeft(stageNoTable).map((o) => ({ ...o, line: o.line + s.offset }));
  assert(left.length === 0, left.length + ' left: ' + left.slice(0, 10).map((o) => o.line + ' ' + JSON.stringify(o.value)).join('; '));
});
await T('G2 the shell: every text node with letters sits under data-l10n/data-l10n-html, every placeholder/title/aria-label carries its data-l10n-*, or the text is allowed with a reason', () => {
  const dom = new JSDOM(stage, { runScripts: 'outside-only' }); const d = dom.window.document; const left = [];
  const walk = (el) => { for (const ch of el.childNodes) { if (ch.nodeType === 3) { const v = ch.textContent.replace(/\s+/g, ' ').trim(); if (v && /[A-Za-z]{2,}/.test(v) && !allowed(v) && !ch.parentNode.closest('[data-l10n],[data-l10n-html]')) left.push('text ' + JSON.stringify(v.slice(0, 50))); } else if (ch.nodeType === 1 && !/^(script|style|svg)$/i.test(ch.tagName)) { for (const [a, da] of [['placeholder', 'data-l10n-ph'], ['title', 'data-l10n-title'], ['aria-label', 'data-l10n-aria']]) if (ch.hasAttribute(a) && /[A-Za-z]{2,}/.test(ch.getAttribute(a)) && !ch.hasAttribute(da) && !allowed(ch.getAttribute(a))) left.push(a + ' ' + JSON.stringify(ch.getAttribute(a))); walk(ch); } } };
  walk(d.body); assert(left.length === 0, left.length + ' left: ' + left.slice(0, 10).join('; '));
  const n = (stage.match(/ data-l10n(?:-html|-ph|-title|-aria)?="/g) || []).length, want = inv.page.filter((e) => e.mode === 'html' || e.mode === 'htmlinner').length + inv.page.filter((e) => e.mode === 'raw').reduce((a, e) => a + (e.replace.match(/ data-l10n(?:-html|-ph|-title|-aria)?="/g) || []).length, 0); assert(n === want, n + ' data-l10n attributes in the stage, the inventory places ' + want);
});
await T('G3 the worker holds no English card text outside swL(); the allow-list is tight: every allowance matches a literal in the stage or the worker, and none allows a key or a key call', () => {
  const left = englishLeft(workerNoTable, allowedW); assert(left.length === 0, 'worker: ' + left.map((o) => o.line + ' ' + JSON.stringify(o.value)).join('; '));
  const lits = new Set([...jsStrings(scanScript(stage).js), ...jsStrings(worker)].map((o) => o.value)); const texts = htmlTexts(stage).map((o) => o.value);
  for (const a of inv.allow) { if (a.value) assert(lits.has(a.value) || texts.includes(a.value) || [...lits].some((v) => v.indexOf(a.value) !== -1), 'stale allowance: ' + a.value); else assert([...lits, ...texts].some((v) => new RegExp(a.pattern).test(v)), 'stale pattern: ' + a.pattern); assert(a.why && a.why.length > 8, 'an allowance without a reason: ' + (a.value || a.pattern)); assert(!(a.value && inv.keys[a.value]), 'an allowance names a key: ' + a.value); }
});

console.log('R · the rig (spec M3)');
const ORIGIN = 'https://acmeproducts.github.io', FOLDER_URL = ORIGIN + FOLDER_PATH, STAGE_URL = FOLDER_URL + STAGE_PAGE;
const UA = { android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' };
const ROOM = { id: 'room-1', role: 'creator', title: 'Gate', partnerName: 'Bo', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0, muted: false, goBtn: true, meta: 'top', autoRead: false };
const THROOM = { ...ROOM, id: 'room-2', myLang: 'th', theirLang: 'en', title: 'Thai side' };
const encInv = (p) => Buffer.from(JSON.stringify(p)).toString('base64url');
const openWindows = [];
async function live(o) {
  o = o || {}; const errors = [], html = o.html || stage; const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (!/Not implemented: navigation/.test(String(e.message || e))) errors.push('jsdom: ' + String(e.message || e).slice(0, 200)); });
  const dom = new JSDOM(html, { url: STAGE_URL + (o.hash || ''), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) {
    Object.defineProperty(w.navigator, 'userAgent', { value: UA.android, configurable: true });
    Object.defineProperty(w.navigator, 'language', { value: o.navLang || 'en-US', configurable: true }); Object.defineProperty(w.navigator, 'languages', { value: o.navLangs || [o.navLang || 'en-US'], configurable: true });
    w.__posted = []; w.__regs = []; w.__sent = [];
    w.Notification = class { static get permission() { return 'default'; } static requestPermission() { return Promise.resolve('granted'); } }; w.PushManager = function () {};
    w.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
    const reg = { scope: FOLDER_URL, active: { scriptURL: FOLDER_URL + WORKER_NAME, postMessage: (m) => w.__posted.push(m) }, pushManager: { getSubscription: () => Promise.resolve(null), subscribe: () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })) } };
    Object.defineProperty(w.navigator, 'serviceWorker', { value: { register(u) { w.__regs.push(String(u)); return Promise.resolve(reg); }, getRegistration() { return Promise.resolve(reg); }, getRegistrations() { return Promise.resolve([]); }, ready: Promise.resolve(reg), controller: null, addEventListener() {} }, configurable: true });
    w.fetch = () => Promise.resolve({ ok: false, status: 0, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
    w.WebSocket = class { constructor(u) { this.url = u; this.readyState = 1; const self = this; setTimeout(function () { try { if (self.onopen) self.onopen({}); } catch (_) {} }, 0); } send(s) { w.__sent.push(String(s)); } close() { this.readyState = 3; } addEventListener() {} removeEventListener() {} };   /* the socket opens, so hello is sent */
    w.AudioContext = w.webkitAudioContext = class { constructor() { this.destination = {}; } createOscillator() { return { frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; } createGain() { return { gain: { value: 0 }, connect() {} }; } close() { return Promise.resolve(); } };
    w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; }, addEventListener() {} }; w.SpeechSynthesisUtterance = class {};
    w.localStorage.setItem('tb_name', 'Ann'); w.localStorage.setItem('tb_dev', 'aaaa1111-0000-4000-8000-000000000001'); w.localStorage.setItem('tba_rooms', JSON.stringify(o.rooms === undefined ? [ROOM, THROOM] : o.rooms));
    for (const [k, v] of Object.entries(o.seed || {})) w.localStorage.setItem(k, v);
    w.addEventListener('error', (e) => errors.push('err: ' + String(e.message || e.error) + ' @' + (e.lineno || '')));
  } });
  const w = dom.window; openWindows.push(dom); await sleep(o.wait || 900);
  return { w, dom, errors, $: (id) => w.document.getElementById(id), ev: (e) => w.debugLog.filter((l) => l.ev === e), has: (e) => w.debugLog.some((l) => l.ev === e) };
}
const th = (k, vars) => fill(table.th[k], vars), en = (k, vars) => fill(inv.keys[k], vars);
const THAI = { tba_user: JSON.stringify({ name: 'Ann', lang: 'th', langFrom: 'setting' }) };   /* a phone that chose Thai */
const sentTypes = (I) => I.w.__sent.map((s) => { try { return JSON.parse(s); } catch (_) { return { type: '?' }; } });
await T('R1 a fresh Thai phone (navigator th-TH) boots in Thai: S.user.lang saved, html lang, the first screen\'s words, the compose placeholder; the worker is told; no error', async () => {
  const I = await live({ navLang: 'th-TH', rooms: [] });
  assert(I.errors.length === 0, I.errors.join(' | ')); assert(I.w.S.user.lang === 'th' && JSON.parse(I.w.localStorage.getItem('tba_user')).lang === 'th', 'S.user.lang ' + I.w.S.user.lang);
  assert(I.w.document.documentElement.lang === 'th' && I.w.document.documentElement.dir === 'ltr', 'html lang/dir'); assert(I.$('s0-go').textContent === th('continue') && I.w.document.querySelector('#scr-s0 .ask-title').textContent === th('s0_title'), 'first screen not Thai: ' + I.$('s0-go').textContent);
  assert(I.$('chat-input').getAttribute('placeholder') === th('compose_ph') && I.$('btn-send').getAttribute('aria-label') === th('send'), 'placeholder/aria not Thai');
  assert(I.ev('l10n_user_lang_set').length === 1 && I.ev('l10n_user_lang_set')[0].d.lang === 'th', 'user_lang_set'); assert(I.w.__posted.some((m) => m.t === 'tb-l10n' && m.lang === 'th'), 'the worker was not told th');
});
await T('R2 an unknown language boots English; Filipino\'s old tag (tl) maps to fil; a regional Chinese maps to zh; a saved choice beats the navigator', async () => {
  const a = await live({ navLang: 'xx-YY', rooms: [] }); assert(a.w.S.user.lang === 'en' && a.$('s0-go').textContent === en('continue'), 'unknown → ' + a.w.S.user.lang);
  const b = await live({ navLang: 'tl-PH', rooms: [] }); assert(b.w.S.user.lang === 'fil', 'tl → ' + b.w.S.user.lang);
  const c = await live({ navLang: 'zh-TW', rooms: [] }); assert(c.w.S.user.lang === 'zh', 'zh-TW → ' + c.w.S.user.lang);
  const d = await live({ navLang: 'th-TH', rooms: [], seed: { tba_user: JSON.stringify({ name: 'Ann', lang: 'de' }) } }); assert(d.w.S.user.lang === 'de' && d.$('s0-go').textContent === fill(table.de.continue), 'saved de lost: ' + d.w.S.user.lang);
});
await T('R3 ONE language everywhere: entering the Thai-side room changes nothing on a phone that already has its language; a creator\'s FIRST room sets it (my=th → the app is Thai), a second room with another language changes nothing, and the clock setting beats every later room', async () => {
  const I = await live({}); assert(I.w.document.documentElement.lang === 'en', 'not en at home');
  I.w.enterRoom('room-2'); await sleep(1300); assert(I.w.document.documentElement.lang === 'en' && I.$('chat-input').getAttribute('placeholder') === en('compose_ph'), 'the room overrode the app language'); assert(!I.ev('l10n_applied').some((l) => l.d.why === 'switch'), 'a switch happened');
  assert(/Oct/.test(I.w.fmtDate(new Date(2026, 9, 12).getTime())), 'fmtDate not English: ' + I.w.fmtDate(new Date(2026, 9, 12).getTime()));
  const J = await live({ rooms: [] }); assert(J.w.S.user.lang === 'en' && J.w.S.user.langFrom === undefined, 'fresh');
  J.w.l10nAdopt('th', 'create'); await sleep(50); assert(J.w.S.user.lang === 'th' && J.w.S.user.langFrom === 'room' && JSON.parse(J.w.localStorage.getItem('tba_user')).langFrom === 'room', 'first room not adopted: ' + J.w.S.user.lang);
  assert(J.$('s0-go').textContent === th('continue') && J.w.document.documentElement.lang === 'th' && J.ev('l10n_user_lang_adopted').length === 1 && J.ev('l10n_user_lang_adopted')[0].d.why === 'create', 'not re-worded on adopt');
  J.w.l10nAdopt('de', 'create'); await sleep(50); assert(J.w.S.user.lang === 'th' && J.ev('l10n_user_lang_adopted').length === 1, 'a second room changed the language');
  const sel = J.$('s13-lang'); sel.value = 'en'; sel.dispatchEvent(new J.w.Event('change')); await sleep(80); assert(J.w.S.user.lang === 'en' && J.w.S.user.langFrom === 'setting', 'setting');
  J.w.l10nAdopt('th', 'join'); await sleep(50); assert(J.w.S.user.lang === 'en', 'a room beat the clock setting');
  assert(stage.indexOf("l10nAdopt(my,'create');") !== -1 && stage.indexOf("l10nAdopt(p.tl,'join');") !== -1 && stage.indexOf("l10nAdopt(p.ml,'link');") !== -1, 'the three room-creation sites do not adopt');
  assert(I.errors.length === 0 && J.errors.length === 0, I.errors.concat(J.errors).join(' | '));
});
await T('R3b a creator\'s first room through the real dialog: Start new chat with Your language = Thai makes the phone Thai (buttons, drawer) before the first message', async () => {
  const I = await live({ rooms: [] }); I.w.openS3(); await sleep(50); const my = I.$('s3-my'), their = I.$('s3-their'); assert(my && their && I.$('m-s3').classList.contains('show'), 'no S3 dialog');
  my.value = 'th'; their.value = 'en'; if (I.$('s3-name')) I.$('s3-name').value = 'Test'; I.$('s3-ok').click(); await sleep(400);
  assert(!/needs a name|ต้องมีชื่อ/.test(I.$('toast').textContent) || I.w.S.rooms.length === 1, 'refused: ' + I.$('toast').textContent);
  assert(I.w.S.rooms.length === 1 && I.w.S.rooms[0].myLang === 'th', 'room not created: ' + I.w.S.rooms.length);
  assert(I.w.S.user.lang === 'th' && I.w.S.user.langFrom === 'room' && I.w.document.documentElement.lang === 'th' && I.$('chat-input').getAttribute('placeholder') === th('compose_ph'), 'the first room did not set Thai: ' + I.w.S.user.lang);
  assert(I.errors.length === 0, I.errors.join(' | '));
});
await T('R4 a toast speaks the phone\'s language: a refused empty rename on a Thai phone toasts the Thai line', async () => {
  const I = await live({ seed: THAI }); I.w.enterRoom('room-2'); await sleep(1200); I.w.renameRoom(''); await sleep(30);
  assert(I.$('toast').textContent === th('toast_room_needs_name'), 'toast: ' + I.$('toast').textContent);
});
await T('R5 a system pill crosses the wire as {key, vars} and nothing else: a rename sends key+vars (no text); the receiver stores key+vars and words it in ITS language; a pill with only English text stores no text and shows nothing', async () => {
  const I = await live({ seed: THAI }); I.w.enterRoom('room-2'); await sleep(1200);
  I.w.renameRoom('Delta'); await sleep(50); const pill = sentTypes(I).filter((m) => m.type === 'sys-pill').pop(); assert(pill && pill.key === 'pill_renamed' && pill.vars && pill.vars.to === 'Delta' && pill.vars.from === 'Thai side' && !('text' in pill), 'sent: ' + JSON.stringify(pill));
  const mine = I.w.transcript.filter((e) => e.kind === 'sys').pop(); assert(mine.key === 'pill_renamed' && !('text' in mine), 'stored: ' + JSON.stringify(mine));
  const dom1 = I.w.document.querySelector('.pill[data-id="' + mine.id + '"] span'); assert(dom1 && dom1.textContent.indexOf(th('pill_renamed', mine.vars)) === 0, 'pill words: ' + (dom1 && dom1.textContent));
  I.w.handleRelay({ type: 'sys-pill', from: 'bo-dev', ts: Date.now(), key: 'pill_joined', vars: { who: 'Bo' }, pillId: 'sp-wire-1' }); await sleep(30);
  const got = I.w.transcript.filter((e) => e.id === 'sp-wire-1')[0]; assert(got && got.key === 'pill_joined' && got.vars.who === 'Bo' && !('text' in got), 'received: ' + JSON.stringify(got));
  const dom2 = I.w.document.querySelector('.pill[data-id="sp-wire-1"] span'); assert(dom2 && dom2.textContent.indexOf(th('pill_joined', { who: 'Bo' })) === 0, 'received words: ' + (dom2 && dom2.textContent));
  I.w.handleRelay({ type: 'sys-pill', from: 'bo-dev', ts: Date.now(), text: 'Bo joined', pillId: 'sp-wire-2' }); await sleep(30);
  const old = I.w.transcript.filter((e) => e.id === 'sp-wire-2')[0]; assert(old && !('text' in old) && !old.key, 'English text was kept: ' + JSON.stringify(old)); const dom3 = I.w.document.querySelector('.pill[data-id="sp-wire-2"] span'); assert(dom3 && !/Bo joined/.test(dom3.textContent), 'English shown: ' + (dom3 && dom3.textContent));
  const bgMsg = { type: 'sys-pill', from: 'bo-dev', ts: Date.now(), key: 'pill_left_chat', vars: {}, text: 'Left the chat', pillId: 'sp-wire-3' }; if (I.w.LISTEN && typeof I.w.LISTEN.handle === 'function') I.w.LISTEN.handle('room-1', bgMsg); else I.w.listenHandleCore(I.w.LISTEN, 'room-1', bgMsg); await sleep(30);
  const bg = (I.w.loadTr('room-1') || []).filter((e) => e.id === 'sp-wire-3')[0]; assert(bg, 'the background room did not take the pill'); assert(bg.key === 'pill_left_chat' && !('text' in bg), 'background room kept the text: ' + JSON.stringify(bg));
  const sel5 = I.$('s13-lang'); sel5.value = 'en'; sel5.dispatchEvent(new I.w.Event('change')); await sleep(80);
  const dom5 = I.w.document.querySelector('.pill[data-id="sp-wire-1"] span'); assert(dom5 && dom5.textContent.indexOf(en('pill_joined', { who: 'Bo' })) === 0, 'history not re-worded on the switch: ' + (dom5 && dom5.textContent));
  assert(I.errors.length === 0, I.errors.join(' | '));
});
await T('R6 the local missed-call pill is still dropped (CR3: the relay\'s durable record makes the one pill) — the guard tests the KEY, so a Thai phone shows one missed pill, not two', async () => {
  const I = await live({ seed: THAI }); I.w.enterRoom('room-2'); await sleep(1200); const n = I.w.transcript.length;
  I.w.bgAddPill('room-2', 'pill_missed_voice_call'); await sleep(20); assert(I.w.transcript.length === n && I.has('cr3_local_missed_pill_dropped'), 'local missed pill not dropped');
  I.w.bgAddPill('room-2', 'pill_left_chat'); await sleep(20); const e = I.w.transcript[I.w.transcript.length - 1]; assert(I.w.transcript.length === n + 1 && e.key === 'pill_left_chat', 'another pill was dropped too');
});
await T('R7 a runtime switch re-words without reload: App language → Thai re-words the shell (first screen, welcome, drawer), the home summary, the live caption a l10nCap site set, the select, tells the worker; back to English the same way', async () => {
  const I = await live({}); const sel = I.$('s13-lang'); assert(sel && sel.options.length === 21 && sel.options[0].value === 'en' && sel.options[16].value === 'fil' && sel.value === 'en', 'select: ' + (sel && sel.options.length));
  I.$('rz-timer').textContent = I.w.l10nCap('rz-timer', 'connecting'); assert(I.$('rz-timer').textContent === en('connecting'), 'cap set');
  sel.value = 'th'; sel.dispatchEvent(new I.w.Event('change')); await sleep(80);
  assert(I.w.S.user.lang === 'th' && JSON.parse(I.w.localStorage.getItem('tba_user')).lang === 'th', 'not saved'); assert(I.has('l10n_user_lang_changed') && I.ev('l10n_applied').some((l) => l.d.why === 'setting' && l.d.lang === 'th'), 'logs');
  assert(I.$('s0-go').textContent === th('continue') && I.w.document.querySelector('.welcome-sub').innerHTML === th('welcome_sub') && I.w.document.querySelector('.drawer-title').textContent === th('customize_room'), 'shell not re-worded');
  assert(I.$('rz-timer').textContent === th('connecting'), 'the live caption kept its English: ' + I.$('rz-timer').textContent);
  assert(I.w.__posted.filter((m) => m.t === 'tb-l10n').pop().lang === 'th', 'worker not told'); assert(I.$('s13-privacy').textContent === th('privacy') && I.$('s13-keys').textContent === th('calling_sync_keys'), 'S13 buttons');
  const kb = I.$('s13-lang').parentNode.querySelector('[data-l10n="app_language"]'); assert(kb && kb.textContent === th('app_language'), 'App language label');
  sel.value = 'en'; sel.dispatchEvent(new I.w.Event('change')); await sleep(80); assert(I.$('s0-go').textContent === en('continue') && I.$('rz-timer').textContent === en('connecting') && I.w.document.documentElement.lang === 'en', 'not back to English');
  assert(I.errors.length === 0 && I.ev('l10n_rerender_failed').length === 0, I.errors.concat(I.ev('l10n_rerender_failed').map((l) => JSON.stringify(l.d))).join(' | '));
});
await T('R8 the menu labels and the JS-written labels carry their key: after a switch the drawer\'s relabelled rows (Hear their voice…) and the Manage tab read Thai', async () => {
  const I = await live({ seed: THAI }); I.w.enterRoom('room-2'); await sleep(1300);
  const ear = I.$('s4b-ear'); const span = ear && ear.parentNode.querySelector('span'); assert(span && span.getAttribute('data-l10n') === 'menu_hear_their_voice' && span.firstChild.nodeValue === th('menu_hear_their_voice') && span.querySelector('.info-pop'), 'ear row: ' + (span && span.firstChild.nodeValue));
  assert(ear.getAttribute('aria-label') === th('menu_hear_their_voice'), 'aria');
  const manage = [...I.w.document.querySelectorAll('[data-l10n="tab_manage"]')]; assert(manage.length === 1 && manage[0].textContent === th('tab_manage'), 'Manage tab: ' + manage.map((m) => m.textContent));
  const rn = [...I.w.document.querySelectorAll('[data-l10n="room_name"]')]; assert(rn.length >= 1 && rn.every((x) => x.textContent === th('room_name')), 'Room name labels: ' + rn.map((x) => x.textContent));
  const pop = I.$('status-pop'); assert(pop, 'no status-pop');
});
await T('R9 Arabic: the shell is right-to-left with the drawer/FAB rule, each transcript column carries the direction of its own language, dates are Gregorian with Western digits', async () => {
  const AR = { ...ROOM, id: 'room-3', myLang: 'ar', theirLang: 'en' }; const I = await live({ navLang: 'ar-EG', rooms: [AR] }); assert(I.w.S.user.lang === 'ar', 'not ar');
  assert(I.w.document.documentElement.dir === 'rtl' && I.$('l10n-style') && /\[dir=rtl\] \.left-panel/.test(I.$('l10n-style').textContent) && /\[dir=rtl\] \.fab/.test(I.$('l10n-style').textContent), 'rtl shell');
  I.w.enterRoom('room-3'); await sleep(1200); I.w.transcript.push({ id: 'cm-ar', kind: 'chat', who: 'partner', sourceText: 'hello', translatedText: 'مرحبا', srcLang: 'en', tgtLang: 'ar', ts: Date.now(), senderName: 'Bo' }); I.w.transcript.push({ id: 'cm-ar2', kind: 'chat', who: 'me', sourceText: 'hello', translatedText: 'مرحبا', srcLang: 'en', tgtLang: 'ar', ts: Date.now(), senderName: 'Ann' }); I.w.renderTranscript(); await sleep(30);
  const cols = [...I.w.document.querySelectorAll('.msg[data-id="cm-ar"] .tr-col, .msg[data-id="cm-ar2"] .tr-col')]; assert(cols.length === 4 && cols.some((c) => c.getAttribute('data-lang') === 'en' && c.getAttribute('data-side') === 'left'), 'cols ' + cols.length);
  for (const c of cols) assert(c.getAttribute('dir') === (c.getAttribute('data-lang') === 'ar' ? 'rtl' : 'ltr'), 'column dir ' + c.getAttribute('data-lang') + '=' + c.getAttribute('dir'));
  const d = I.w.fmtDate(new Date(2026, 9, 12).getTime()), t = I.w.fmtTime(new Date(2026, 9, 12, 8, 5).getTime()); assert(/12/.test(d) && !/[٠-٩]/.test(d + t) && /أكتوبر/.test(d), 'date: ' + d + ' ' + t);
  const en1 = await live({ rooms: [ROOM] }); en1.w.enterRoom('room-1'); await sleep(1200); en1.w.transcript.push({ id: 'cm-th', kind: 'chat', who: 'partner', sourceText: 'สวัสดี', translatedText: 'hello', srcLang: 'th', tgtLang: 'en', ts: Date.now(), senderName: 'Bo' }); en1.w.renderTranscript(); await sleep(30);
  assert([...en1.w.document.querySelectorAll('.msg[data-id="cm-th"] .tr-col')].every((c) => c.getAttribute('dir') === 'ltr') && en1.w.document.documentElement.dir === 'ltr', 'an English/Thai room is not ltr');
});
await T('R10 a missing key falls back to English and is logged once per language and key; a key missing from every language shows the key and logs an error once', async () => {
  const I = await live({ seed: THAI }); I.w.enterRoom('room-2'); await sleep(1200);
  const before = I.ev('l10n_missing').length; I.w.L10N.th.toast_copied = undefined; assert(I.w.l10n('toast_copied') === en('toast_copied') && I.w.l10n('toast_copied') === en('toast_copied'), 'no English fallback');
  assert(I.ev('l10n_missing').length === before + 1 && I.ev('l10n_missing').pop().d.key === 'toast_copied' && I.ev('l10n_missing').pop().d.lang === 'th', 'missing not logged once');
  assert(I.w.l10n('no_such_key_zz') === 'no_such_key_zz' && I.w.l10n('no_such_key_zz') === 'no_such_key_zz' && I.ev('l10n_missing').length === before + 3, 'unknown key: ' + I.ev('l10n_missing').length);   /* th then en, once each */
  assert(I.w.l10n(null) === '' && I.w.l10n('pill_joined', { who: 'Bo' }) === th('pill_joined', { who: 'Bo' }) && I.w.l10n('pill_joined', {}) === th('pill_joined', { who: '' }), 'vars');
});
await T('R11 the joiner landing adopts the invite\'s language for this phone: an English phone opening a Thai invite shows the Thai landing (the words that shipped since 22·base) and becomes a Thai phone; a phone that already chose keeps its choice; the inviter\'s name is filled', async () => {
  const inv1 = '#j=' + encInv({ r: 'room-9', ml: 'en', tl: 'th', n: 'Bo' });
  const a = await live({ rooms: [], hash: inv1 });
  assert(a.$('s10-line') && a.$('s10-line').textContent === 'Bo ชวนคุณมาคุยกัน' && a.$('s10-join').textContent === 'เข้าร่วม' && a.$('s10-note').textContent === 'การโทรจะขออนุญาตใช้กล้องและไมโครโฟน', 'th landing on an en phone: ' + (a.$('s10-line') && a.$('s10-line').textContent));
  assert(a.w.S.user.lang === 'th' && a.w.S.user.langFrom === 'room' && a.ev('l10n_user_lang_adopted')[0].d.why === 'invite' && a.w.document.documentElement.lang === 'th', 'the landing did not adopt: ' + a.w.S.user.lang);
  const b = await live({ rooms: [], hash: inv1, seed: { tba_user: JSON.stringify({ name: '', lang: 'de', langFrom: 'setting' }) } }); assert(b.$('s10-line').textContent === fill(table.de.joiner_invite, { who: 'Bo' }) && b.w.S.user.lang === 'de', 'a chosen language was overridden: ' + b.$('s10-line').textContent);
  const c = await live({ rooms: [], hash: '#j=' + encInv({ r: 'room-9', ml: 'en', tl: 'th' }) }); assert(c.$('s10-line').textContent === 'คู่สนทนา ชวนคุณมาคุยกัน', 'default inviter: ' + c.$('s10-line').textContent);
  const d = await live({ rooms: [], hash: '#j=' + encInv({ r: 'room-9', ml: 'th', tl: 'en', n: 'Som' }), navLang: 'th-TH' }); assert(d.$('s10-line').textContent === en('joiner_invite', { who: 'Som' }) && d.w.S.user.lang === 'en', 'an English invite on a Thai phone: ' + d.$('s10-line').textContent);
  assert(a.errors.length === 0 && b.errors.length === 0 && d.errors.length === 0, a.errors.concat(b.errors, d.errors).join(' | '));
});

await T('R12 the reach bar is due the moment the room has a partner: a joiner in an Android tab, permission not asked, NO message yet, sees "Turn on" above the composer at room entry (a call-first conversation prompts); an unjoined room shows no bar; the bar is logged', async () => {
  const JOINER = { ...ROOM, id: 'room-j', role: 'joiner', joined: true, myLang: 'en', theirLang: 'th' }; const I = await live({ rooms: [JOINER] }); I.w.enterRoom('room-j'); await sleep(1300);
  const bar = I.$('rh-bar'); assert(bar && bar.textContent.indexOf(en('rh_default')) !== -1 && bar.querySelector('[data-act="turnon"]'), 'no Turn on bar without a message: ' + (bar && bar.textContent)); assert(I.has('rh_bar_shown'), 'bar not logged');
  const U = await live({ rooms: [{ ...ROOM, id: 'room-u', joined: false }] }); U.w.enterRoom('room-u'); await sleep(1300); assert(!U.$('rh-bar'), 'a bar in a room with no partner');
  assert(!/transcript\.some\(function \(e\) \{ return e && e\.kind === 'chat'; \}\);\n\}\nfunction rhRenderBar/.test(stage), 'the first-message condition is still in the stage');
});

await T('R13 the partner\'s reachability, the negative claim only: a peer announce with reach {known 1, subs 0} puts "Bo won\'t be alerted when away" above the composer; subs 1 → the line is gone; known 0 → nothing; known 2 subs 0 → the generic line; a peer with no reach field changes nothing; outside a room nothing', async () => {
  const I = await live({}); I.w.enterRoom('room-1'); await sleep(1200);
  I.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 1, inCall: [], reach: { known: 1, subs: 0 } }); await sleep(30);
  const l1 = I.$('rk-line'); assert(l1 && l1.textContent === en('reach_none', { who: 'Bo' }) && l1.querySelector('.rh-warn'), 'line: ' + (l1 && l1.textContent)); assert(I.has('rk_reach_mark') && I.ev('rk_reach_mark')[0].d.known === 1, 'not logged');
  assert(I.w.document.querySelector('#scr-room .compose').previousElementSibling === l1 || l1.nextElementSibling === I.$('rh-bar'), 'the line is not above the composer');
  I.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 1, inCall: [], reach: { known: 1, subs: 1 } }); await sleep(30); assert(!I.$('rk-line'), 'a positive count showed a line');
  I.w.handleRelay({ type: 'peer', transient: true, focused: false, others: 0, inCall: [], reach: { known: 0, subs: 0 } }); await sleep(30); assert(!I.$('rk-line'), 'an unknown partner showed a line');
  I.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 2, inCall: [], reach: { known: 2, subs: 0 } }); await sleep(30); assert(I.$('rk-line') && I.$('rk-line').textContent === en('reach_none_many'), 'generic line: ' + I.$('rk-line').textContent);
  I.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 1, inCall: [] }); await sleep(30); assert(I.$('rk-line') && I.$('rk-line').textContent === en('reach_none_many'), 'a peer without reach changed the line');
  assert(I.w.S.partnerOnline === true, 'the presence dot no longer follows others'); assert(I.$('presence').classList.contains('on'), 'dot');
  const sel = I.$('s13-lang'); sel.value = 'th'; sel.dispatchEvent(new I.w.Event('change')); await sleep(80); I.w.handleRelay({ type: 'peer', transient: true, focused: true, others: 1, inCall: [], reach: { known: 1, subs: 0 } }); await sleep(30); assert(I.$('rk-line').textContent === th('reach_none', { who: 'Bo' }), 'not in the phone\'s language: ' + I.$('rk-line').textContent);
  I.errors.length === 0 || assert(false, I.errors.join(' | '));
});
await T('R14 the caller is told: call-reach {app 0, pushed 0, none 1} replaces "Ringing…" on the call screen with "Bo can\'t be reached when away yet" (logged, re-worded on a switch); pushed 1 or app 1 leaves "Ringing…"; muted counts; two unreachable → the generic line; the callee\'s own screen is never touched (no n10 overlay)', async () => {
  const I = await live({}); I.w.enterRoom('room-1'); await sleep(1200);
  I.w.n10Show('voice'); await sleep(30); const sub = I.$('n10-sub'); assert(sub && sub.textContent === en('voice_call_ringing'), 'n10: ' + (sub && sub.textContent));
  I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k1', app: 0, pushed: 1, none: 0, muted: 0 }); await sleep(20); assert(sub.textContent === en('voice_call_ringing'), 'pushed changed the caption');
  I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k1', app: 1, pushed: 0, none: 1, muted: 0 }); await sleep(20); assert(sub.textContent === en('voice_call_ringing'), 'in-app changed the caption');
  I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k1', app: 0, pushed: 0, none: 1, muted: 0 }); await sleep(20); assert(sub.textContent === en('n10_unreachable', { who: 'Bo' }), 'caption: ' + sub.textContent); assert(I.has('rk_reach_unreachable') && I.ev('rk_reach_unreachable')[0].d.none === 1, 'not logged');
  const sel = I.$('s13-lang'); sel.value = 'th'; sel.dispatchEvent(new I.w.Event('change')); await sleep(80); assert(sub.textContent === th('n10_unreachable', { who: 'Bo' }), 'not re-worded: ' + sub.textContent);
  I.w.n10Show('voice'); await sleep(20); assert(sub.textContent === th('voice_call_ringing'), 'reset'); I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k1', app: 0, pushed: 1, none: 1, muted: 0 }); await sleep(20); assert(sub.textContent === th('voice_call_ringing'), 'a pushed call was reported unreachable');
  I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k1', app: 0, pushed: 0, none: 0, muted: 1 }); await sleep(20); assert(sub.textContent === th('n10_unreachable', { who: 'Bo' }), 'muted not counted: ' + sub.textContent);
  I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k1', app: 0, pushed: 0, none: 2, muted: 0 }); await sleep(20); assert(sub.textContent === th('n10_unreachable_many'), 'generic: ' + sub.textContent);
  const before = I.w.S.rooms.map((r) => r.lastSeenAt).join(','); I.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k2', app: 0, pushed: 0, none: 1, muted: 0 }); await sleep(20); assert(I.w.S.rooms.map((r) => r.lastSeenAt).join(',') === before, 'call-reach touched presence (Last seen)');
  const J = await live({}); J.w.enterRoom('room-1'); await sleep(1200); J.w.handleRelay({ type: 'call-reach', transient: true, callId: 'k9', app: 0, pushed: 0, none: 1, muted: 0 }); await sleep(20); assert(!J.$('n10-sub') || !/can/.test(J.$('n10-sub').textContent), 'a callee screen was written'); assert(J.errors.length === 0 && I.errors.length === 0, I.errors.concat(J.errors).join(' | '));
});

console.log('W · the worker, live in a shim: cards in the phone\'s language');
function fakeIndexedDB() {
  const dbs = {}; const later = (fn) => setTimeout(fn, 0);
  function req(run) { const r = { onsuccess: null, onerror: null, result: undefined }; later(() => { try { r.result = run(); r.onsuccess && r.onsuccess({ target: r }); } catch (e) { r.error = e; r.onerror && r.onerror({ target: r }); } }); return r; }
  return { open(name) { const r = { onupgradeneeded: null, onsuccess: null, onerror: null, result: null };
    later(() => { const fresh = !dbs[name]; const db = dbs[name] = dbs[name] || { stores: {} };
      const api = { objectStoreNames: { contains: (n) => !!db.stores[n] }, createObjectStore(n, o) { db.stores[n] = { opts: o || {}, rows: new Map(), auto: 1 }; },
        transaction(n) { const tx = { oncomplete: null, onerror: null, _pending: 0 }; const done = () => { if (--tx._pending === 0) later(() => tx.oncomplete && tx.oncomplete()); }; const wrap = (run) => { tx._pending += 1; return req(() => { const v = run(); done(); return v; }); };
          tx.objectStore = function (sn) { const st = db.stores[sn]; return { add(v) { return wrap(() => { st.rows.set(st.auto++, JSON.parse(JSON.stringify(v))); return true; }); }, put(v) { return wrap(() => { st.rows.set(v[st.opts.keyPath], JSON.parse(JSON.stringify(v))); return true; }); }, get(k) { return wrap(() => st.rows.get(k)); } }; }; return tx; } };
      r.result = api; if (fresh) { r.onupgradeneeded && r.onupgradeneeded({ target: r }); } r.onsuccess && r.onsuccess({ target: r }); }); return r; }, _dbs: dbs };
}
function makeWorker(source, store) {
  const listeners = {}, shown = [];
  const self = { addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); }, skipWaiting() {}, location: { origin: ORIGIN, href: FOLDER_URL + WORKER_NAME },
    registration: { scope: FOLDER_URL, showNotification: (title, opts) => { shown.push({ title, opts }); return Promise.resolve(); }, getNotifications: () => Promise.resolve([]) },
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve([]), openWindow: () => Promise.resolve(null) }, indexedDB: store || fakeIndexedDB() };
  const caches = { open: () => Promise.resolve({ add: () => Promise.resolve(), put: () => Promise.resolve(), match: () => Promise.resolve(undefined) }), match: () => Promise.resolve(undefined) };
  const ctx = { self, indexedDB: self.indexedDB, caches, fetch: () => Promise.reject(new Error('offline')), URL, setTimeout, clearTimeout, Promise, JSON, String, Array, Object, Date, encodeURIComponent, console };
  vm.runInNewContext(source, ctx, { filename: WORKER_NAME });
  const fire = async (type, ev) => { const waits = []; ev.waitUntil = (p) => waits.push(p); for (const fn of listeners[type] || []) fn(ev); await Promise.all(waits); await sleep(5); };
  return { fire, shown, store: self.indexedDB, listeners };
}
const PUSH = (ev) => ({ data: { json: () => ev } });
const CALLEV = { t: 'tb-ev', id: 'k1', room: 'room-1', kind: 'voice', callId: 'k1', name: 'Ana', ts: Date.now() }, CHATEV = { t: 'tb-ev', id: 'c1', room: 'room-1', kind: 'chat', callId: null, name: 'Ana', ts: Date.now() };
await T('W1 the worker is the accepted folder worker plus the ten declared edits; its handler set, the fetch handler and the card shapes (silent missed card, persistent call alert) are untouched', () => {
  const ev = (s) => [...code(s).matchAll(/self\.addEventListener\('([a-z]+)'/g)].map((m) => m[1]); assert(ev(worker).join(',') === ev(baseW).join(','), 'handlers ' + ev(worker).join(','));
  const fetchPart = (s) => s.slice(s.indexOf("self.addEventListener('fetch'")); assert(fetchPart(worker) === fetchPart(baseW), 'the fetch handler changed');
  assert((worker.match(/silent: true/g) || []).length === 1 && /requireInteraction = true/.test(worker), 'card shapes changed'); assert(/tb-sw5\.js/.test(worker.split('\n')[0]) && !/tb-sw4\.js \(29·ship/.test(worker), 'the header does not name tb-sw5');
});
await T('W2 told th by the page (tb-l10n), the worker words the call alert, the chat banner, the missed card and the fallback card in Thai; a worker never told words them in English; the language survives a restart', async () => {
  const w = makeWorker(worker); await w.fire('message', { data: { t: 'tb-l10n', lang: 'th' }, source: { id: 'app-1' } }); await sleep(10);
  await w.fire('push', PUSH(CALLEV)); assert(w.shown[0].opts.body === th('sw_incoming_voice_call') && w.shown[0].title === 'Ana · TalkBridge', 'call body: ' + w.shown[0].opts.body);
  await w.fire('push', PUSH(CHATEV)); assert(w.shown[1].opts.body === th('sw_new_message'), 'chat body: ' + w.shown[1].opts.body);
  await w.fire('push', PUSH({ t: 'tb-call-end', id: 'e1', room: 'room-1', callId: 'k9', outcome: 'missed', name: 'Ana' })); assert(w.shown[2].opts.body === th('sw_missed_call') && w.shown[2].opts.silent === true, 'missed body: ' + w.shown[2].opts.body);
  await w.fire('push', PUSH({ nonsense: 1 })); assert(w.shown[3].opts.body === th('sw_new_activity'), 'fallback body: ' + w.shown[3].opts.body);
  const w2 = makeWorker(worker, w.store); await w2.fire('push', PUSH({ ...CALLEV, kind: 'video' })); assert(w2.shown[0].opts.body === th('sw_incoming_video_call'), 'restart lost the language: ' + w2.shown[0].opts.body);
  const w3 = makeWorker(worker); await w3.fire('push', PUSH(CALLEV)); assert(w3.shown[0].opts.body === en('sw_incoming_voice_call'), 'untold worker: ' + w3.shown[0].opts.body);
  const w4 = makeWorker(worker); await w4.fire('message', { data: { t: 'tb-l10n', lang: 'xx' }, source: { id: 'a' } }); await sleep(10); await w4.fire('push', PUSH(CHATEV)); assert(w4.shown[0].opts.body === en('sw_new_message'), 'unknown lang: ' + w4.shown[0].opts.body);
});

console.log('T · structure (spec M4)');
await T('T1 one table: 21 languages in LANG_ORDER, every language the same key set, English equal to the inventory; L10N_MT marks the twenty; no second table (I18N_RETIRED is bytes only, named once)', async () => {
  const I = await live({ rooms: [] }); const L = I.w.L10N; assert(JSON.stringify(Object.keys(L)) === JSON.stringify(LANG_ORDER), 'languages'); for (const l of LANG_ORDER) assert(JSON.stringify(Object.keys(L[l])) === JSON.stringify(Object.keys(inv.keys)), 'key set ' + l);
  assert(JSON.stringify(L.en) === JSON.stringify(inv.keys) && Object.keys(I.w.L10N_MT).length === 20 && !I.w.L10N_MT.en, 'en / mt');
  assert((code(appScript(stage)).match(/I18N_RETIRED/g) || []).length === 1 && !/\bI18N\b/.test(code(appScript(stage))), 'I18N');
});
await T('T2 the phone\'s language is the one app-level setting: saved in tba_user, read from navigator once, changed only in the S13 select; nothing in the relay decides it (no sys-pill, hello or ev carries a UI language)', async () => {
  const I = await live({ rooms: [ROOM] }); I.w.enterRoom('room-1'); await sleep(1100); const msgs = sentTypes(I); assert(msgs.length > 0, 'nothing sent'); for (const m of msgs) assert(!('uiLang' in m) && !('l10n' in m), 'a relay message carries a UI language');
  assert(!/relaySend\(|\.send\(/.test(code(part)), 'the part sends to the relay'); assert(JSON.parse(I.w.localStorage.getItem('tba_user')).lang === 'en', 'not saved');
  const sels = I.w.document.querySelectorAll('#s13-lang'); assert(sels.length === 1 && I.$('s13-lang').closest('#m-s13'), 'the select is not the S13 modal\'s');
});
await T('T3 size: the stage grows by the table alone (within 300 KB of the accepted page); the worker by its five rows', () => { const g = stage.length - base.length; assert(g > 150000 && g < 320000, 'growth ' + g); assert(worker.length - baseW.length < 12000, 'worker growth ' + (worker.length - baseW.length)); });

await T('T4 the second door names this stage: fixtures/dir/next-stage.json points at ' + STAGE_PAGE + ' (the newest candidate) and the folder\'s next.html forwards to it', () => {
  const nx = JSON.parse(rd(path.join(root, 'talkbridge/fixtures/dir/next-stage.json'))); assert(nx.page === STAGE_PAGE, 'next-stage.json names ' + nx.page);
  const door = rd(path.join(dir, 'next.html')); assert(door.indexOf("location.replace('./" + STAGE_PAGE + "' + location.search + location.hash)") !== -1, 'next.html does not forward to this stage');
});

await T('T5 the activity log names a phone by the device log\'s tag: every hello the stage sends carries `dev` = the device log tag (both the active room\'s and the listener lanes\')', async () => {
  const I = await live({ rooms: [ROOM] }); I.w.enterRoom('room-1'); await sleep(1100);
  const hellos = sentTypes(I).filter((m) => m.type === 'hello'); assert(hellos.length >= 1, 'no hello sent'); for (const h of hellos) assert(typeof h.dev === 'string' && /^(android|iphone|desktop|dev)-?/.test(h.dev) && h.dev === I.w._n16Dev, 'hello without the device tag: ' + JSON.stringify(h));
  assert((stage.match(/type: 'hello', dev: \(typeof _n16Dev === 'string' \? _n16Dev : ''\)/g) || []).length === 2, 'the two hello sites do not both carry dev');
});

await T('T6 the activity log names the room: every hello carries `title` = the room\'s shared name (relay v6.16 writes it after the code); a room with no name sends an empty title', async () => {
  const I = await live({ rooms: [ROOM] }); I.w.enterRoom('room-1'); await sleep(1100);
  const hellos = sentTypes(I).filter((m) => m.type === 'hello'); assert(hellos.length >= 1, 'no hello sent'); for (const h of hellos) assert(h.title === 'Gate', 'hello without the room name: ' + JSON.stringify(h));
  assert((stage.match(/role: room\.role, title: \(room\.title \|\| ''\), name: room\.myName \|\| S\.user/g) || []).length === 2, 'the two hello sites do not both carry the title');
  const U = await live({ rooms: [{ ...ROOM, id: 'room-u', title: '' }] }); U.w.enterRoom('room-u'); await sleep(1100);
  const uh = sentTypes(U).filter((m) => m.type === 'hello'); assert(uh.length >= 1 && uh.every((h) => h.title === ''), 'a nameless room: ' + JSON.stringify(uh));
});

console.log('E · the whole 28·post-ship script, both builds installed: identical (pills compared by their English words)');
if (!process.env.TB_IO_SKIP_E && (!ONLY || ONLY.has('E'))) {
  const force = (h) => h.replace('<head>', '<head><script>window.matchMedia = (q) => ({ matches: /standalone/.test(q), addEventListener() {}, addListener() {} });</script>');
  /* the differential runs the stage with an ALL-ENGLISH table and English dates: the rig's Thai-side phone would otherwise re-word in Thai, which is the feature (R3, R9), not the script. Everything else — the edits, the part, the keyed pills, the re-render at room entry — is live. */
  const enTable = JSON.stringify(Object.fromEntries(LANG_ORDER.map((l) => [l, inv.keys])));
  const eReps = pageReplacements().map((r) => r.replace.indexOf(', L10N = {') !== -1 ? { ...r, replace: r.replace.replace(/, L10N = \{[\s\S]*?\}, L10N_MT = /, () => ', L10N = ' + enTable + ', L10N_MT = ') } : r);
  const ePart = part.replace('function l10nLocale() {', "function l10nLocale() { return 'en-US'; }\nfunction l10nLocaleUnused() {");
  const eStage = assemblePage({ replacements: eReps, part: ePart, part2 }); assert(eStage !== stage && eStage.indexOf(enTable) !== -1, 'the differential stage was not built');
  const { snapA, snapC, RA, RC } = await runBoth(force(base), force(eStage));
  const words = (e) => (e && e.kind === 'sys' && e.key) ? { ...e, text: fill(inv.keys[e.key], e.vars), key: undefined, vars: undefined } : e;
  const wireWords = (m) => (m && m.type === 'sys-pill' && m.key) ? { ...m, text: fill(inv.keys[m.key], m.vars), key: undefined, vars: undefined } : m;
  const unmark = (h) => typeof h === 'string' ? h.replace(/ data-l10n(?:-html|-ph|-title|-aria)?="[a-z0-9_]+"/g, '').replace(/ dir="(?:ltr|rtl)"/g, '').replace(/<label class="field-label" for="s13-lang"[^<]*<\/label><select class="field-input" id="s13-lang">[\s\S]*?<\/select>/g, '') : h;
  const deep = (v, f) => Array.isArray(v) ? v.map((x) => deep(x, f)) : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x, f)])) : f(v);
  const norm = (c) => { for (const k of ['transcript', 'bgTranscript']) { if (Array.isArray(c[k])) c[k] = c[k].map(words); else if (c[k] && typeof c[k] === 'object') for (const r of Object.keys(c[k])) if (Array.isArray(c[k][r])) c[k][r] = c[k][r].map(words); } if (Array.isArray(c.wire)) c.wire = c.wire.map(wireWords); if (Array.isArray(c.sockets)) for (const sk of c.sockets) if (sk && Array.isArray(sk.sent)) sk.sent = sk.sent.map((m) => (m && m.type === 'hello' && ('dev' in m || 'title' in m)) ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'dev' && k !== 'title')) : m);   /* c5: hello carries the device tag for the activity log — the declared difference */ for (const k of Object.keys(c)) if (k !== 'log') c[k] = deep(c[k], unmark); return c; };   /* the stage's data-l10n marks, per-column dir and the S13 language row are the feature; the words must be the same */
  const strip = (s) => { const c = norm(JSON.parse(JSON.stringify(s))); c.log = c.log.map((l) => { if (l && l.d && 'dropped' in l.d) { const d = { ...l.d }; delete d.dropped; return { ...l, d }; } return l; }).filter((l) => !(l.ev === 'pb_writeback_err' && l.d && l.d.e === 'Error: get 0') && l.ev !== 'read_receipts_deferred' && !/^l10n_/.test(l.ev) && !/^rk_/.test(l.ev) && l.ev !== 'cr3_recover' && l.ev !== 'cr3_local_missed_pill_dropped'); if (c.housekeeping) delete c.housekeeping.t1_coalesced; return c; };   /* t1_coalesced: the stage's re-render when the first room adopts a language coalesces once — T-1's bookkeeping, not behaviour */
  if (process.env.TB_IO_DUMP) { for (const side of ['X', 'Y']) { fs.writeFileSync(process.env.TB_IO_DUMP + '-' + side + '-base.txt', strip(snapA[side]).log.map((l) => l.ev + ' ' + JSON.stringify(l.d || {})).join('\n')); fs.writeFileSync(process.env.TB_IO_DUMP + '-' + side + '-stage.txt', strip(snapC[side]).log.map((l) => l.ev + ' ' + JSON.stringify(l.d || {})).join('\n')); } }
  for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); for (const k of KEYS) await T('E ' + side + '.' + k + ' identical (installed, both builds)', () => { const out = []; diff(a[k], c[k], side + '.' + k, out); assert(out.length === 0, out.slice(0, 5).map((o) => { const m = /^(\S+): "([\s\S]*)" ≠ "([\s\S]*)"$/.exec(o); if (!m || m[2].length < 200) return o; let i = 0; while (i < m[2].length && m[2][i] === m[3][i]) i++; return m[1] + ' differs at ' + i + ': …' + m[2].slice(Math.max(0, i - 60), i + 120) + '… ≠ …' + m[3].slice(Math.max(0, i - 60), i + 120) + '…'; }).join('\n')); }); }
  await T('E no uncaught error on either build through the whole script', () => assert([RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ')));
}
await T('F no uncaught error on any phone above', () => { assert(openWindows.length > 8, 'only ' + openWindows.length + ' windows'); });

console.log('\n' + pass + ' pass, ' + fail + ' fail');
for (const d of openWindows) { try { d.window.close(); } catch (_) {} }
process.exit(fail ? 1 : 0);
