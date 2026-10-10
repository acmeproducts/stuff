#!/usr/bin/env node
/* THE GRAVEYARD SWEEP (29·ship c4, owner 2026-10-10: "we keep going over old ground") — every stage file is scanned against the
   byte-level signature of every burial that has one (talkbridge/fixtures/graveyard-signatures.json) before it can be pushed.
   Two buried patterns (G33, G34) rode inside the accepted bytes for five weeks because nothing looked for them; this does.
   Usage: node graveyard-sweep.mjs <file>...            fail on any hit
          node graveyard-sweep.mjs --inherited <file>   report hits, do not fail (the accepted base a stage is built from)
   Exports: sweep(text, { file }) → [{ id, entry, what, line }] */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const SIGNATURES_FILE = 'talkbridge/fixtures/graveyard-signatures.json';
/* G66's second shape is the accepted base's own linkDeviceUrl, which a stage WRAPS rather than replaces; it counts only when the stage has no page-held carrying path */
const ALLOW = { G66: (text) => /function rhCarryUrl\s*\(/.test(text) };

export function signatures() { return JSON.parse(fs.readFileSync(path.join(root, SIGNATURES_FILE), 'utf8')).signatures; }
export function stripComments(s) { return s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' ')); }
export function sweep(text, opts) {
  opts = opts || {}; const code = stripComments(text), hits = [];
  for (const s of signatures()) {
    const re = new RegExp(s.regex, (s.flags || '') + (s.flags && s.flags.includes('g') ? '' : 'g'));
    let m; while ((m = re.exec(code))) {
      if (ALLOW[s.id] && ALLOW[s.id](code)) break;
      hits.push({ id: s.id, entry: s.entry, what: s.what, line: code.slice(0, m.index).split('\n').length, file: opts.file || '' });
      if (!re.global) break;
    }
  }
  return hits;
}

if (process.argv[1] && process.argv[1].endsWith('graveyard-sweep.mjs')) {
  const args = process.argv.slice(2); const inherited = args[0] === '--inherited'; const files = inherited ? args.slice(1) : args;
  if (!files.length) { console.error('usage: graveyard-sweep.mjs [--inherited] <file>...'); process.exit(2); }
  let total = 0;
  for (const f of files) {
    const text = fs.readFileSync(path.resolve(root, f), 'utf8'); const hits = sweep(text, { file: f });
    for (const h of hits) console.log((inherited ? 'INHERITED ' : 'BURIED    ') + '[' + h.id + '] ' + f + ':' + h.line + ' — ' + h.what);
    total += hits.length;
    if (!hits.length) console.log('  clean   ' + f + ' · ' + signatures().length + ' signatures');
  }
  if (inherited) { console.log(total + ' inherited hit(s) in the base — the stage must have none'); process.exit(0); }
  console.log(total ? total + ' buried pattern(s) found — the stage cannot ship' : 'graveyard sweep: clean'); process.exit(total ? 1 : 0);
}
