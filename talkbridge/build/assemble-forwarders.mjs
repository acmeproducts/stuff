#!/usr/bin/env node
/* THE FORWARDERS — the post-accept step of the directory release (§7.5), owner order 2026-10-10 ("forwarders").

   Every live-era release address (turns 26 to 29 pre-ship) becomes a 15-line page that sends the visitor to
   the app folder carrying the search and the hash — an invite, a grant, a notification deep link. The
   accepted bytes are not lost: they are in git at manifest.accepted_ref, sha-pinned per file, and
   build/accepted-bytes.mjs hands them to every historical gate that reads them.

   Left alone on purpose: bridge-turn29-pre-base.html (the base the folder release is assembled from),
   bridge-turn29-multi-user-v1.html (warm storage), every page older than turn 26 (bridge-turn24-post-ship.html
   is frozen by the governance gate), every worker, manifest and icon.
   Usage: node assemble-forwarders.mjs [--check | --init <ref>]                                            */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const MANIFEST = 'talkbridge/fixtures/forwarders/manifest.json';
export const LIST = [
  'bridge-turn26-base.html', 'bridge-turn26-post-ship.html', 'bridge-turn26-pre-base.html', 'bridge-turn26-pre-ship.html', 'bridge-turn26-ship.html',
  'bridge-turn27-base.html', 'bridge-turn27-post-ship.html', 'bridge-turn27-pre-ship.html', 'bridge-turn27-ship.html',
  'bridge-turn28-base.html', 'bridge-turn28-post-ship.html', 'bridge-turn28-pre-base.html', 'bridge-turn28-pre-ship.html', 'bridge-turn28-ship.html',
  'bridge-turn29-pre-ship.html'
];
export const NOT_FORWARDED = ['bridge-turn29-pre-base.html', 'bridge-turn29-multi-user-v1.html', 'bridge-turn24-post-ship.html'];
export const TARGET = './talkbridge-app/';
export const SCRIPT = "location.replace('" + TARGET + "' + location.search + location.hash);";
export function forwarderHtml(file, hash, ref) {
  return '<!-- TB-FORWARDER · ' + file + ' is now a forwarder to the app folder (§7.5; 29·pre-ship accepted 2026-10-10; owner order "forwarders"). Accepted bytes: sha256 ' + hash.slice(0, 12) + ', git ' + ref.slice(0, 10) + ':' + file + ' -->\n'
    + '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TalkBridge</title>\n'
    + '<meta name="theme-color" content="#2E8B8B"><link rel="icon" href="icon-v2-192.png" type="image/png">\n'
    + '<style>body{margin:0;background:#FDFAF7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#243230;padding:24px}</style>\n'
    + '</head><body>\n<noscript><a href="talkbridge-app/">Open TalkBridge</a></noscript>\n<script>' + SCRIPT + '</script>\n</body></html>\n';
}
export function manifest() { return JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')); }
export function expected(opts) {
  opts = opts || {}; const m = manifest(); const out = {};
  for (const f of (opts.list || LIST)) { const e = m.files.find((x) => x.file === f); if (!e) throw new Error('assemble-forwarders: ' + f + ' is not in the manifest'); out[f] = forwarderHtml(f, e.sha256, m.accepted_ref); }
  return out;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-forwarders.mjs')) {
  const a = process.argv.slice(2);
  if (a[0] === '--init') {
    const ref = execFileSync('git', ['rev-parse', a[1]], { cwd: root, encoding: 'utf8' }).trim(); const files = [];
    for (const f of LIST) {
      const w = fs.readFileSync(path.join(root, f)); if (w.slice(0, 400).toString('latin1').indexOf('TB-FORWARDER') !== -1) { console.error(f + ' is already a forwarder'); process.exit(1); }
      const g = execFileSync('git', ['show', ref + ':' + f], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
      if (sha(g) !== sha(w)) { console.error(f + ': the working bytes are not the bytes at ' + ref.slice(0, 8)); process.exit(1); }
      files.push({ file: f, sha256: sha(w), bytes: w.length });
    }
    fs.mkdirSync(path.dirname(path.join(root, MANIFEST)), { recursive: true });
    fs.writeFileSync(path.join(root, MANIFEST), JSON.stringify({ accepted_ref: ref, target: TARGET, order: 'owner, 2026-10-10: "forwarders"', files }, null, 1) + '\n');
    console.log('manifest written: ' + files.length + ' files at ' + ref.slice(0, 10)); process.exit(0);
  }
  const want = expected();
  if (a[0] === '--check') {
    let bad = 0;
    for (const [f, html] of Object.entries(want)) { const p = path.join(root, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== html) { console.error('assemble-forwarders --check: ' + f + ' is not its forwarder'); bad++; } }
    if (bad) process.exit(1); console.log('verified ' + Object.keys(want).length + ' forwarders');
  } else {
    for (const [f, html] of Object.entries(want)) fs.writeFileSync(path.join(root, f), html);
    console.log('wrote ' + Object.keys(want).length + ' forwarders → ' + TARGET);
  }
}
