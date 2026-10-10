#!/usr/bin/env node
/* The forwarders mutation gate: each mutation breaks ONE thing the forwarders promise — in a temp copy of the
   forwarded pages, the loader, the manifest or the package scripts — and harness-forwarders must go red on the
   NAMED test. Nothing in the repository is modified.                                                         */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { LIST, SCRIPT, forwarderHtml } from './assemble-forwarders.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'talkbridge/fixtures/forwarders/manifest.json'), 'utf8'));
const loaderSrc = fs.readFileSync(path.join(root, 'talkbridge/build/accepted-bytes.mjs'), 'utf8');
const pkgSrc = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
const F2_1 = 'F2.1 every listed address is exactly its generated forwarder';
const F2_2 = 'F2.2 a forwarder is at most 15 lines, holds one script whose text is exactly the redirect, and reaches for no network, storage or credential';
const F3_1 = 'F3.1 every listed address sends the visitor to the folder, keeping the search and the hash exactly (an invite, a grant link, a notification deep link)';
const F4_1 = 'F4.1 the base of the folder release, the warm storage and the governance-frozen page are the accepted bytes, not forwarders';
const F5_1 = 'F5.1 no root page, worker, manifest or icon outside the list differs from the accepted commit (and the two governance-frozen files are byte-identical)';
const F6_1 = 'F6.1 with the loader every listed page reads as its accepted bytes (string and buffer); without it, as the forwarder; a page that is not a forwarder is read as is';
const F6_2 = 'F6.2 a listed page that is NOT a forwarder (restored, or edited later) is read exactly as it is — the loader never hides a real file';
const F1_2 = 'F1.2 the accepted commit exists, and for every listed page git has exactly the bytes the manifest pins — and they are real pages, not forwarders';
const F8_1 = 'F8.1 every npm script of the 27·ship-eight to 28·post-ship gates that runs node carries the loader prefix';
const replaceAll = (script) => (f) => forwarderHtml(f.file, f.sha256, manifest.accepted_ref).replace(SCRIPT, script);
const same = (f) => forwarderHtml(f.file, f.sha256, manifest.accepted_ref);

/* a mutation = { catches, name, page?: (f)=>html, only?: n, extra?: {file: html}, loader?: (src)=>src, manifest?: (m)=>m, pkg?: (src)=>src, copy?: [names] } */
const MUTATIONS = [
  { catches: F3_1, name: 'the forwarder drops the search (a query would be lost)', page: replaceAll("location.replace('./talkbridge-app/' + location.hash);") },
  { catches: F3_1, name: 'the forwarder drops the hash (an invite or a grant link would be lost — the iPhone failure of c1, again)', page: replaceAll("location.replace('./talkbridge-app/' + location.search);") },
  { catches: F3_1, name: 'the forwarder points at the wrong folder', page: replaceAll("location.replace('./talkbridge/' + location.search + location.hash);") },
  { catches: F3_1, name: 'the forwarder points at the root-relative folder from the wrong depth', page: replaceAll("location.replace('../talkbridge-app/' + location.search + location.hash);") },
  { catches: F2_2, name: 'the forwarder grows a network call', page: (f) => same(f).replace('</body>', '<script>fetch("https://example.org/x");</script>\n</body>') },
  { catches: F2_2, name: 'the forwarder links a manifest (an old address would offer an install)', page: (f) => same(f).replace('<meta name="theme-color"', '<link rel="manifest" href="tb-manifest-turn28.webmanifest"><meta name="theme-color"') },
  { catches: F2_1, name: 'one listed address is left as the accepted page (never forwarded)', only: 'bridge-turn28-post-ship.html' },
  { catches: F4_1, name: 'the base of the folder release is forwarded too (the gates would lose their base)', extra: 'bridge-turn29-pre-base.html' },
  { catches: F4_1, name: 'the warm-storage page is forwarded too', extra: 'bridge-turn29-multi-user-v1.html' },
  { catches: F5_1, name: 'a worker outside the list is changed (tb-sw3.js)', touch: 'tb-sw3.js' },
  { catches: F5_1, name: 'a page outside the list is forwarded (turn 24, frozen by the governance gate)', extra: 'bridge-turn24-post-ship.html' },
  { catches: F6_1, name: 'the loader hands out the forwarder instead of the accepted bytes', loader: (s) => s.replace("if (head.indexOf('TB-FORWARDER') === -1) { cache.set(rel, null); return null; }", "cache.set(rel, null); return null;") },
  { catches: F6_1, name: 'the loader answers a string read with a buffer', loader: (s) => s.replace("return enc ? Buffer.from(b).toString(enc) : Buffer.from(b);", "return Buffer.from(b);") },
  { catches: F6_2, name: 'the loader serves accepted bytes for a page that is not a forwarder (a restored page would be hidden)', loader: (s) => s.replace("if (head.indexOf('TB-FORWARDER') === -1) { cache.set(rel, null); return null; }", "") },
  { catches: F1_2, name: 'the manifest pins the wrong bytes for one page', manifest: (m) => { m.files[3].sha256 = 'f'.repeat(64); return m; } },
  { catches: F1_2, name: 'the manifest names a commit that does not exist', manifest: (m) => { m.accepted_ref = '0'.repeat(40); return m; } },
  { catches: F8_1, name: 'one old gate script lacks the loader prefix', pkg: (s) => s.replace('"gate:28s:assembled": "NODE_OPTIONS=\\"--import ./talkbridge/build/accepted-bytes.mjs\\" node', '"gate:28s:assembled": "node') }
];
const WORKERS = Math.max(1, Number(process.env.TB_MUT_WORKERS || 3));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-fw-mut-'));
const jobs = MUTATIONS.map((m, i) => ({ m, i }));
const results = [];
function runOne({ m, i }) {
  return new Promise((resolve) => {
    const dir = path.join(tmp, 'd' + i); fs.mkdirSync(dir);
    const rootFiles = fs.readdirSync(root).filter((n) => /^(bridge-[^/]*\.html|tb-[^/]*\.(js|webmanifest)|icon-[^/]*|flags\.[a-z]+)$/.test(n));
    for (const n of rootFiles) fs.symlinkSync(path.join(root, n), path.join(dir, n));          /* the real files, by link, until a mutation replaces one */
    const put = (n, content) => { fs.rmSync(path.join(dir, n), { force: true }); fs.writeFileSync(path.join(dir, n), content); };
    for (const f of manifest.files) {
      if (m.only && f.file === m.only) { put(f.file, execFileSync('git', ['show', manifest.accepted_ref + ':' + f.file], { cwd: root, maxBuffer: 256 * 1024 * 1024 })); continue; }
      put(f.file, (m.page || same)(f));
    }
    if (m.extra) put(m.extra, forwarderHtml(m.extra, 'a'.repeat(64), manifest.accepted_ref));
    if (m.touch) put(m.touch, fs.readFileSync(path.join(root, m.touch), 'utf8') + '\n/* mutated */\n');
    const env = { ...process.env, TB_FW_DIR: dir, TB_FW_SKIP_F7: '1' };
    if (m.manifest) { const p = path.join(tmp, 'm' + i + '.json'); fs.writeFileSync(p, JSON.stringify(m.manifest(JSON.parse(JSON.stringify(manifest))))); env.TB_FW_MANIFEST = p; }
    if (m.loader) { const src = m.loader(loaderSrc); if (src === loaderSrc) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); const p = path.join(tmp, 'loader' + i + '.mjs'); fs.writeFileSync(p, src); env.TB_FW_LOADER = p; }
    if (m.pkg) { const src = m.pkg(pkgSrc); if (src === pkgSrc) return resolve({ ok: false, line: 'MISS  mutation did not apply: ' + m.name }); const p = path.join(tmp, 'pkg' + i + '.json'); fs.writeFileSync(p, src); env.TB_FW_PACKAGE = p; }
    const child = spawn('node', ['talkbridge/build/harness-forwarders.mjs'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
    child.on('close', (exit) => {
      const named = out.split('\n').some((l) => l.startsWith('FAIL  ' + m.catches));
      if (exit !== 0 && named) resolve({ ok: true, line: '  ok  [' + m.catches.slice(0, 40) + '] catches: ' + m.name });
      else resolve({ ok: false, line: 'MISS  [' + m.catches.slice(0, 40) + '] did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed: ' + out.split('\n').filter((l) => l.startsWith('FAIL')).map((l) => l.slice(6, 80)).join(' / ') + ')') });
    });
  });
}
let next = 0;
async function worker() { while (next < jobs.length) { const j = jobs[next++]; const r = await runOne(j); results.push(r); console.log(r.line); } }
await Promise.all(Array.from({ length: WORKERS }, worker));
fs.rmSync(tmp, { recursive: true, force: true });
const caught = results.filter((r) => r.ok).length;
console.log('\nmutations ' + caught + '/' + results.length + ' caught, ' + (results.length - caught) + ' missed');
process.exit(caught === results.length ? 0 : 1);
