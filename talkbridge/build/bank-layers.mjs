#!/usr/bin/env node
/* Bank layers for a flattening stage: copy exact line ranges of a base file
   into fixture files and write removals.json (§0c-1 b: removals by banked
   text). Each banked text must occur exactly once in the base.
   Usage: node bank-layers.mjs <base.html> <fixtureDir> <spec.json>
     spec.json = [{ "file": "00-X.js", "lines": [from, to] }, ...] (1-based, inclusive) */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const [baseP, dir, specP] = process.argv.slice(2);
const base = fs.readFileSync(baseP, 'utf8');
const lines = base.split('\n');
const spec = JSON.parse(fs.readFileSync(specP, 'utf8'));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const out = [];
for (const s of spec) {
  const [a, b] = s.lines;
  const text = lines.slice(a - 1, b).join('\n') + '\n';
  const n = base.split(text).length - 1;
  if (n !== 1) { console.error('NOT UNIQUE (' + n + '): ' + s.file + ' ' + a + '-' + b); process.exit(1); }
  fs.writeFileSync(path.join(dir, s.file), text);
  out.push({ file: s.file, lines: [a, b], sha256: sha(text).slice(0, 12) });
}
const manifest = { base: path.basename(baseP), base_sha12: sha(base).slice(0, 12), removals: out };
fs.writeFileSync(path.join(dir, 'removals.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log('banked ' + out.length + ' layers into ' + dir);
