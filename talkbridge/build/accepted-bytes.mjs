/* TalkBridge accepted-bytes loader (29·pre-ship forwarders, owner order 2026-10-10).

   Preload for the historical build gates:  NODE_OPTIONS="--import ./talkbridge/build/accepted-bytes.mjs"
   Once an accepted root page has been replaced by its forwarder (§7.5), the gates that read it as a
   sha-checked base — or compare an assembled output with it — must still see the ACCEPTED bytes.
   When a file listed in talkbridge/fixtures/forwarders/manifest.json is a forwarder, fs.readFileSync
   answers with `git show <accepted_ref>:<file>` instead, checked against the manifest's sha256.
   A file that is not a forwarder, or not listed, is read exactly as before. Nothing is ever written. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import module from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = process.env.TB_ACCEPTED_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST = path.join(root, 'talkbridge/fixtures/forwarders/manifest.json');
const read0 = fs.readFileSync.bind(fs);
let manifest = null;
try { manifest = JSON.parse(read0(MANIFEST, 'utf8')); } catch (_) { manifest = null; }
const listed = new Map(manifest ? manifest.files.map((f) => [f.file, f]) : []);
const cache = new Map();

function accepted(abs) {
  if (!manifest) return null;
  const rel = path.relative(root, abs);
  const entry = listed.get(rel); if (!entry) return null;
  if (cache.has(rel)) return cache.get(rel);
  let head = ''; try { head = read0(abs, 'latin1').slice(0, 400); } catch (_) { return null; }
  if (head.indexOf('TB-FORWARDER') === -1) { cache.set(rel, null); return null; }          /* restored or never forwarded: read as is */
  const bytes = execFileSync('git', ['show', manifest.accepted_ref + ':' + rel], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  const got = crypto.createHash('sha256').update(bytes).digest('hex');
  if (got !== entry.sha256) throw new Error('accepted-bytes: git ' + manifest.accepted_ref.slice(0, 8) + ':' + rel + ' is not the accepted bytes (' + got.slice(0, 12) + ' ≠ ' + entry.sha256.slice(0, 12) + ')');
  cache.set(rel, bytes); return bytes;
}
fs.readFileSync = function (p, opts) {
  try {
    if (typeof p === 'string' || p instanceof URL) {
      const abs = p instanceof URL ? fileURLToPath(p) : path.resolve(p);
      const b = accepted(abs);
      if (b) { const enc = typeof opts === 'string' ? opts : opts && opts.encoding; return enc ? Buffer.from(b).toString(enc) : Buffer.from(b); }
    }
  } catch (e) { if (/accepted-bytes:/.test(String(e && e.message))) throw e; }
  return read0.apply(fs, arguments);
};
module.syncBuiltinESMExports();
