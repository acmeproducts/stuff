#!/usr/bin/env node
/* L10N TRANSLATE — the table, generated ONCE at build time (§7.17 item 6) from the inventory's English through the same Google
   path the app uses for chat (g1, bridge-turn29-ship.html ~8831: translate.googleapis.com, client=gtx). Per language the strings
   are joined with newlines in chunks of ≤ 2.5 KB (~15 calls a language), 1.5 s apart, backing off on a non-200; every response
   is cached on disk by the chunk's sha so a re-run fetches nothing. Variables `{name}` and HTML tags are replaced by `{0}`-style
   tokens before translation and restored after; a row that lost a token, grew a tag, emptied or tripled in length falls back to
   English and is listed. Every non-English row is machine-translated and marked so (`_mt`). Thai corrections the owner makes go
   into fixtures/l10n/overrides.json by key and win over the machine row (the row loses `_mt`).
   Usage: node l10n-translate.mjs [--offline]      Output: talkbridge/fixtures/l10n/table.json */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { inventory } from './l10n-edits.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const TABLE = 'talkbridge/fixtures/l10n/table.json';
export const OVERRIDES = 'talkbridge/fixtures/l10n/overrides.json';
export const REVIEW = 'talkbridge/L10N-THAI-REVIEW.md';
/* the owner reads Thai: one line per key, English beside the Thai the phone will show; a corrected row goes into overrides.json (th) by key */
export function reviewSheet(t, overrides) {
  const ov = (overrides && overrides.th) || {}; const lines = ['# TalkBridge · Thai review sheet (29·post-ship localization, generated ' + t.generated + ')', '', 'Every word the app itself says, English beside the Thai the phone shows. Rows marked MT are machine translation (Google, the app\'s own chat path); rows marked OK were reviewed. To correct a row: write the Thai into `talkbridge/fixtures/l10n/overrides.json` under `th` by key (the builder does this from your notes) and the row loses its MT mark on the next build. `{name}` tokens are filled at runtime and must stay.', '', '| key | English | Thai | |', '|---|---|---|---|'];
  for (const k of t.keys) lines.push('| `' + k + '` | ' + String(t.en[k]).replace(/\|/g, '\\|').replace(/\n/g, ' ') + ' | ' + String(t.th[k]).replace(/\|/g, '\\|').replace(/\n/g, ' ') + ' | ' + (ov[k] != null ? 'OK' : 'MT') + ' |');
  return lines.join('\n') + '\n';
}
const CACHE = path.join(root, 'talkbridge/fixtures/l10n/.cache');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/* the app's own code mapping (g1Gcode) */
export const gcode = (c) => (c === 'zh' ? 'zh-CN' : c === 'fil' ? 'tl' : c);
export function langsOf(pageText) { const m = pageText.match(/var LANG_ORDER=(\[[^\]]*\]);/); if (!m) throw new Error('LANG_ORDER not found in the page'); return JSON.parse(m[1].replace(/'/g, '"')); }

/* tokens: {var} and <tag> → {0}, {1}… and back */
export function protect(s) { const toks = []; const out = s.replace(/\{\w+\}|<[^>]+>/g, (m) => { toks.push(m); return '{' + (toks.length - 1) + '}'; }); return { out, toks }; }
export function restore(s, toks) { return s.replace(/\{\s*(\d+)\s*\}/g, (m, i) => (toks[+i] == null ? m : toks[+i])); }
export function check(en, tr, toks) {
  if (!tr || !tr.trim()) return 'empty';
  for (let i = 0; i < toks.length; i++) { const re = new RegExp('\\{\\s*' + i + '\\s*\\}', 'g'); const n = (tr.match(re) || []).length; if (n !== 1) return 'token ' + i + ' x' + n; }
  if (/[<>]/.test(tr.replace(/\{\s*\d+\s*\}/g, ''))) return 'tag introduced';
  if (tr.length > Math.max(40, en.length * 3)) return 'length x' + (tr.length / Math.max(1, en.length)).toFixed(1);   /* short words legitimately grow (de 'Join' → 'Machen Sie mit'); the ratio guards long rows */
  return null;
}
/* the cache is per STRING and language (a new key costs one small call per language, not a re-fetch of every chunk); a failed fetch is a retry, not a crash */
const cacheFile = (to, q) => path.join(CACHE, sha(to + '\n' + q) + '.json');
const cached = (to, q) => { const cf = cacheFile(to, q); return fs.existsSync(cf) ? JSON.parse(fs.readFileSync(cf, 'utf8')) : undefined; };
async function gtx(q, to) {
  fs.mkdirSync(CACHE, { recursive: true }); const hit = cached(to, q); if (hit !== undefined) return hit;
  if (process.argv.includes('--offline')) throw new Error('offline and not cached: ' + to + ' ' + q.slice(0, 40));
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=' + gcode(to) + '&dt=t&q=' + encodeURIComponent(q);
  let wait = 3000;
  for (let attempt = 0; attempt < 6; attempt++) {
    try { const r = await fetch(url, { redirect: 'manual' }); if (r.status === 200) { const j = await r.json(); const text = (j[0] || []).map((seg) => seg[0]).join(''); fs.writeFileSync(cacheFile(to, q), JSON.stringify(text)); await sleep(1500); return text; } } catch (_) {}
    await sleep(wait); wait *= 2;
  }
  throw new Error('gtx ' + to + ' failed after retries');
}
async function translateLang(keys, en, to, report) {
  const items = Object.keys(keys).map((k) => { const p = protect(en[k]); return { k, en: en[k], q: p.out, toks: p.toks }; });
  const out = {}; let chunk = [], size = 0;
  const take = (it, seg) => { const tr = restore(seg.trim(), it.toks); const bad = check(it.en, seg, it.toks); if (bad) { report.push({ lang: to, key: it.k, why: bad, got: seg.slice(0, 80) }); out[it.k] = it.en; } else out[it.k] = tr; };
  const flush = async () => {
    if (!chunk.length) return; const q = chunk.map((it) => it.q).join('\n');
    let segs = (await gtx(q, to)).split('\n');
    if (segs.length !== chunk.length) { report.push({ lang: to, why: 'segments ' + segs.length + ' for ' + chunk.length + ' — per string' }); segs = []; for (const it of chunk) segs.push(await gtx(it.q, to)); }
    chunk.forEach((it, i) => { fs.writeFileSync(cacheFile(to, it.q), JSON.stringify(segs[i])); take(it, segs[i]); });   /* every string cached on its own */
    chunk = []; size = 0;
  };
  for (const it of items) { const hit = cached(to, it.q); if (hit !== undefined) { take(it, hit); continue; } if (size + it.q.length + 1 > 2500) await flush(); chunk.push(it); size += it.q.length + 1; }
  await flush();
  return out;
}
export function emitTable(inv, langs, rows, overrides, report) {
  const en = inv.keys; const table = { _about: 'GENERATED by l10n-translate.mjs — every non-English row is machine translation (see _mt); owner-reviewed rows come from overrides.json and are not marked', generated: new Date().toISOString().slice(0, 10), langs, keys: Object.keys(en), en, _mt: {}, fallback: {} };
  for (const l of langs) { if (l === 'en') continue; const row = {}; let mt = false; for (const k of Object.keys(en)) { const ov = overrides[l] && overrides[l][k]; if (ov != null) row[k] = ov; else { row[k] = rows[l][k]; if (rows[l][k] === en[k] && report.some((r) => r.lang === l && r.key === k)) (table.fallback[l] = table.fallback[l] || []).push(k); mt = true; } } table[l] = row; if (mt) table._mt[l] = true; }
  return table;
}
if (process.argv[1] && process.argv[1].endsWith('l10n-translate.mjs')) {
  const inv = inventory(); const page = fs.readFileSync(path.join(root, 'talkbridge-app/bridge-turn29-ship.html'), 'utf8'); const langs = langsOf(page);
  const overrides = fs.existsSync(path.join(root, OVERRIDES)) ? JSON.parse(fs.readFileSync(path.join(root, OVERRIDES), 'utf8')) : {};
  const report = []; const rows = {};
  for (const l of langs) { if (l === 'en') continue; rows[l] = await translateLang(inv.keys, inv.keys, l, report); console.log(l + ': ' + Object.keys(rows[l]).length + ' rows, ' + report.filter((r) => r.lang === l && r.key).length + ' fell back to English'); }
  const table = emitTable(inv, langs, rows, overrides, report);
  fs.writeFileSync(path.join(root, TABLE), JSON.stringify(table, null, 1) + '\n');
  fs.writeFileSync(path.join(root, 'talkbridge/fixtures/l10n/translate-report.json'), JSON.stringify(report, null, 1) + '\n');
  fs.writeFileSync(path.join(root, REVIEW), reviewSheet(table, overrides));
  console.log('wrote ' + TABLE + ' · ' + langs.length + ' languages × ' + table.keys.length + ' keys · ' + report.length + ' report lines · ' + REVIEW);
}
