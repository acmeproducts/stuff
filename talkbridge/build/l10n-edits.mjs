#!/usr/bin/env node
/* L10N EDITS — turns fixtures/l10n/inventory.json into the banked replacements of 29·post-ship (fixtures/post-ship/29pos/).
   Nothing is hand-written twice: every find is a whole source line (plus the line before it when the line repeats), every
   replace is that line with the keyed substitutions, and both are asserted to occur exactly once in the accepted file and
   exactly once in the result before anything is written. Modes: lit · inhtml · html · htmlinner · raw (see the inventory's _about).
   Usage: node l10n-edits.mjs [--check]        Exports: buildEdits(src, entries) → [{id, find, replace, keys}] */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const INVENTORY = 'talkbridge/fixtures/l10n/inventory.json';
export const OUT_DIR = 'talkbridge/fixtures/post-ship/29pos';
export const BASE_PAGE = 'talkbridge-app/bridge-turn29-ship.html';
export const BASE_WORKER = 'talkbridge-app/tb-sw4.js';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export function inventory() { return JSON.parse(fs.readFileSync(path.join(root, INVENTORY), 'utf8')); }

const jsQuote = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const htmlEnc = (s) => s.replace(/&/g, '&amp;');
const count = (hay, needle) => hay.split(needle).length - 1;

/* one line's substitutions, composed */
function substitute(line, group, lineNo) {
  let out = line;
  for (const e of group) {
    if (e.mode === 'lit') {
      const lit = jsQuote(e.en); const alt = '"' + e.en + '"';
      const n = count(out, lit) + count(out, alt); if (!n) throw new Error('lit ' + e.key + ' not on line ' + lineNo + ': ' + e.en);
      out = out.split(lit).join("l10n('" + e.key + "')"); out = out.split(alt).join("l10n('" + e.key + "')");
    } else if (e.mode === 'inhtml') {
      const txt = htmlEnc(e.en).replace(/'/g, "\\'");
      if (e.attr) { const f = e.attr + '="' + txt + '"'; if (!count(out, f)) throw new Error('inhtml attr ' + e.key + ' not on line ' + lineNo); out = out.split(f).join(e.attr + '="\'+esc(l10n(\'' + e.key + '\'))+\'"'); }
      else { const f = '>' + txt + '<'; if (!count(out, f)) throw new Error('inhtml text ' + e.key + ' not on line ' + lineNo + ': ' + e.en); out = out.split(f).join(">'+esc(l10n('" + e.key + "'))+'<"); }
    } else if (e.mode === 'html') {
      const txt = htmlEnc(e.en);
      if (e.attr) { const f = e.attr + '="' + txt + '"'; if (count(out, f) !== 1) throw new Error('html attr ' + e.key + ' not once on line ' + lineNo); const a = { placeholder: 'data-l10n-ph', title: 'data-l10n-title', 'aria-label': 'data-l10n-aria' }[e.attr]; out = out.replace(f, f + ' ' + a + '="' + e.key + '"'); }
      else { const f = '>' + txt + '<'; if (count(out, f) !== 1) throw new Error('html text ' + e.key + ' not once on line ' + lineNo + ': ' + e.en + ' | ' + line.slice(0, 80)); const i = out.indexOf(f); out = out.slice(0, i) + ' data-l10n="' + e.key + '"' + out.slice(i); }
    } else if (e.mode === 'htmlinner') {
      const f = '>' + htmlEnc(e.en) + '<'; if (count(out, f) !== 1) throw new Error('htmlinner ' + e.key + ' not once on line ' + lineNo); const i = out.indexOf(f); out = out.slice(0, i) + ' data-l10n-html="' + e.key + '"' + out.slice(i);
    } else throw new Error('mode ' + e.mode);
  }
  return out;
}

export const TABLE = 'talkbridge/fixtures/l10n/table.json';
/* the worker's five strings in every language, from the generated table (English alone until the table exists) */
export function tableJson() { const tp = path.join(root, TABLE); if (!fs.existsSync(tp)) throw new Error('fixtures/l10n/table.json missing — run l10n-translate.mjs first'); return JSON.parse(fs.readFileSync(tp, 'utf8')); }
export function fullTableJson(inv) { const t = tableJson(); const langs = {}; for (const l of t.langs) { langs[l] = {}; for (const k of Object.keys(inv.keys)) langs[l][k] = l === 'en' ? inv.keys[k] : (t[l] && t[l][k] != null ? t[l][k] : inv.keys[k]); } return JSON.stringify(langs); }
export function mtJson() { return JSON.stringify(tableJson()._mt || {}); }
export function swTableJson(inv) {
  const tp = path.join(root, TABLE); const t = fs.existsSync(tp) ? JSON.parse(fs.readFileSync(tp, 'utf8')) : null; const out = {};
  const langs = t ? t.langs : ['en'];
  for (const l of langs) { const row = {}; for (const k of inv.sw_keys) row[k] = l === 'en' ? inv.keys[k] : (t[l][k] != null ? t[l][k] : inv.keys[k]); out[l] = row; }
  return JSON.stringify(out);
}
export function buildEdits(src, entries, tag, inv) {
  const lines = src.split('\n'); const byLine = new Map(); const edits = [];
  for (const e of entries) {
    if (e.mode === 'raw') { let rep = e.replace; if (rep.indexOf('__SW_L10N__') !== -1) rep = rep.replace('__SW_L10N__', () => swTableJson(inv)); if (rep.indexOf('__L10N__') !== -1) rep = rep.replace('__L10N__', () => fullTableJson(inv)).replace('__L10N_MT__', () => mtJson()); edits.push({ id: tag + '-raw-' + sha(e.find).slice(0, 8), find: e.find, replace: rep, keys: e.keys || [], note: e.note || '' }); continue; }
    for (const ln of e.lines) { if (!byLine.has(ln)) byLine.set(ln, []); byLine.get(ln).push(e); }
  }
  for (const [ln, group] of [...byLine.entries()].sort((a, b) => a[0] - b[0])) {
    const line = lines[ln - 1]; if (line === undefined) throw new Error('no line ' + ln);
    const rep = substitute(line, group, ln);
    let find = line, replace = rep;
    if (count(src, line + '\n') !== 1 || count(src, line) !== 1) { find = lines[ln - 2] + '\n' + line; replace = lines[ln - 2] + '\n' + rep; }
    edits.push({ id: tag + '-L' + ln, find, replace, keys: [...new Set(group.map((g) => g.key))], line: ln });
  }
  /* every find once in the source; applying all in order leaves every replace once and no find */
  let out = src;
  for (const e of edits) {
    const n = count(src, e.find); if (n !== 1) throw new Error(e.id + ': find occurs ' + n + 'x in the accepted file: ' + e.find.slice(0, 100));
    if (e.replace !== '' && out.indexOf(e.replace) !== -1) throw new Error(e.id + ': replace already present: ' + e.replace.slice(0, 100));
    if (count(out, e.find) !== 1) throw new Error(e.id + ': find no longer once after earlier edits');
    out = out.replace(e.find, () => e.replace);
    if (e.replace.indexOf(e.find) !== -1) throw new Error(e.id + ': replace contains find (S2 shape rule)');
  }
  for (const e of edits) { if (e.replace !== '' && count(out, e.replace) !== 1) throw new Error(e.id + ': replace not exactly once in the result (' + count(out, e.replace) + ')'); }
  return edits;
}

export function writeFixture() {
  const inv = inventory(); const page = fs.readFileSync(path.join(root, BASE_PAGE)); const worker = fs.readFileSync(path.join(root, BASE_WORKER));
  const pe = buildEdits(page.toString('utf8'), inv.page, 'P', inv), we = buildEdits(worker.toString('utf8'), inv.worker, 'W', inv);
  const dir = path.join(root, OUT_DIR); fs.mkdirSync(dir, { recursive: true });
  const files = {}; const entry = (e) => { files[e.id + '.find.txt'] = e.find; files[e.id + '.replace.txt'] = e.replace; return { id: e.id, find: e.id + '.find.txt', replace: e.id + '.replace.txt', sha_find: sha(e.find).slice(0, 12), sha_replace: sha(e.replace).slice(0, 12), keys: e.keys }; };
  const manifest = { _about: '29·post-ship banked edits, GENERATED by l10n-edits.mjs from fixtures/l10n/inventory.json — never edit by hand', base_page: BASE_PAGE, base_page_sha256: sha(page), base_worker: BASE_WORKER, base_worker_sha256: sha(worker), page: pe.map(entry), worker: we.map(entry) };
  files['replacements.json'] = JSON.stringify(manifest, null, 1) + '\n';
  return files;
}

if (process.argv[1] && process.argv[1].endsWith('l10n-edits.mjs')) {
  let files; try { files = writeFixture(); } catch (e) { console.error('l10n-edits: ' + e.message); process.exit(1); }
  const dir = path.join(root, OUT_DIR);
  if (process.argv.includes('--check')) {
    let bad = 0; const have = new Set(fs.readdirSync(dir));
    for (const [f, c] of Object.entries(files)) { if (!have.has(f) || fs.readFileSync(path.join(dir, f), 'utf8') !== c) { console.error('l10n-edits --check: ' + f + ' is not the generated fixture'); bad++; } have.delete(f); }
    for (const f of have) { console.error('l10n-edits --check: stray fixture file ' + f); bad++; }
    if (bad) process.exit(1); console.log('verified ' + Object.keys(files).length + ' fixture files'); 
  } else {
    for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), c);
    const m = JSON.parse(files['replacements.json']); console.log('wrote ' + m.page.length + ' page edits + ' + m.worker.length + ' worker edits → ' + OUT_DIR);
  }
}
