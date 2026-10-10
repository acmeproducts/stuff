#!/usr/bin/env node
/* THE FORWARDERS harness (§7.5 post-accept step; owner order 2026-10-10).
   F1 the manifest and the accepted bytes in git · F2 each forwarder is exactly the generated page and does nothing but forward ·
   F3 it forwards with the search and the hash, and the folder's own forwarder takes them on · F4 the pages that must stay are untouched ·
   F5 nothing else in the repository changed · F6 the loader gives the historical gates the accepted bytes · F7 the old gates still pass ·
   F8 their npm scripts carry the loader.
   Usage: node harness-forwarders.mjs     TB_FW_DIR=<dir> TB_FW_MANIFEST=<file> TB_FW_LOADER=<file> TB_FW_PACKAGE=<file> TB_FW_SKIP_F7=1 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LIST, NOT_FORWARDED, SCRIPT, TARGET, forwarderHtml } from './assemble-forwarders.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = process.env.TB_FW_DIR || root, isRoot = dir === root;
const manifestPath = process.env.TB_FW_MANIFEST || path.join(root, 'talkbridge/fixtures/forwarders/manifest.json');
const loader = process.env.TB_FW_LOADER || path.join(root, 'talkbridge/build/accepted-bytes.mjs');
const pkgPath = process.env.TB_FW_PACKAGE || path.join(root, 'package.json');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const git = (args) => execFileSync('git', args, { cwd: root, maxBuffer: 256 * 1024 * 1024 });
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
let pass = 0, fail = 0;
const T = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + ((e && e.message) || e)); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
const read = (f) => fs.readFileSync(path.join(dir, f));
const isFwd = (b) => b.slice(0, 400).toString('latin1').indexOf('TB-FORWARDER') !== -1;

console.log('F1 · the manifest and the accepted bytes');
await T('F1.1 the manifest lists exactly the fifteen live-era addresses, and none of the pages that must stay', () => {
  const names = manifest.files.map((f) => f.file).sort(); assert(JSON.stringify(names) === JSON.stringify([...LIST].sort()), 'manifest ≠ list: ' + names.join(','));
  for (const n of NOT_FORWARDED) assert(!names.includes(n), n + ' is in the manifest');
});
await T('F1.2 the accepted commit exists, and for every listed page git has exactly the bytes the manifest pins — and they are real pages, not forwarders', () => {
  git(['cat-file', '-e', manifest.accepted_ref + '^{commit}']);
  for (const f of manifest.files) { const b = git(['show', manifest.accepted_ref + ':' + f.file]); assert(sha(b) === f.sha256 && b.length === f.bytes, f.file + ': git has ' + sha(b).slice(0, 12) + ', manifest pins ' + f.sha256.slice(0, 12)); assert(!isFwd(b), f.file + ' is already a forwarder at the accepted commit'); assert(/<script/i.test(b.toString('latin1')), f.file + ' is not an app page'); }
});

console.log('F2 · each forwarder is the generated page and only forwards');
await T('F2.1 every listed address is exactly its generated forwarder', () => { for (const f of manifest.files) { const got = read(f.file).toString('utf8'), want = forwarderHtml(f.file, f.sha256, manifest.accepted_ref); assert(isFwd(Buffer.from(got)), f.file + ' is not a forwarder'); assert(got === want, f.file + ' differs from the generated forwarder'); } });
await T('F2.2 a forwarder is at most 15 lines, holds one script whose text is exactly the redirect, and reaches for no network, storage or credential', () => {
  for (const f of manifest.files) { const t = read(f.file).toString('utf8'); assert(t.split('\n').length <= 16, f.file + ' is ' + t.split('\n').length + ' lines'); const sc = [...t.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]; assert(sc.length === 1 && sc[0][1] === SCRIPT, f.file + ': script is ' + JSON.stringify(sc.map((m) => m[1]))); assert(!/fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|tb_/.test(t), f.file + ' reaches for a network, storage or key'); assert(!/<link rel="manifest"|serviceWorker/.test(t), f.file + ' would install or register something'); }
});

console.log('F3 · it forwards, with the search and the hash');
const run = (script, loc) => { let went = null; new Function('location', script)({ search: loc.search, hash: loc.hash, replace: (u) => { went = u; } }); return went; };
const INVITE = '#j=eyJyIjoiYWJjIiwibWwiOiJlbiIsInRsIjoidGgiLCJuIjoiQW5uIiwiayI6IiJ9-_x';
const cases = [[{ search: '', hash: '' }, TARGET], [{ search: '?x=1', hash: '' }, TARGET + '?x=1'], [{ search: '', hash: INVITE }, TARGET + INVITE], [{ search: '?x=1', hash: INVITE }, TARGET + '?x=1' + INVITE], [{ search: '', hash: '#ev=room.e1' }, TARGET + '#ev=room.e1']];
await T('F3.1 every listed address sends the visitor to the folder, keeping the search and the hash exactly (an invite, a grant link, a notification deep link)', () => {
  for (const f of manifest.files) { const t = read(f.file).toString('utf8'); const body = t.match(/<script>([\s\S]*?)<\/script>/)[1]; for (const [loc, want] of cases) { const got = run(body, loc); assert(got === want, f.file + ' with ' + JSON.stringify(loc) + ' went to ' + got + ', wanted ' + want); } }
});
await T('F3.2 the target resolves, from /stuff/<page>, to the folder; the folder forwards on to the current stage page with the invite intact', () => {
  assert(new URL(TARGET, 'https://acmeproducts.github.io/stuff/bridge-turn28-post-ship.html').pathname === '/stuff/talkbridge-app/', 'target does not resolve to the folder');
  const idx = fs.readFileSync(path.join(root, 'talkbridge-app/index.html'), 'utf8'); const m = idx.match(/<script>location\.replace\(('\.\/[^']+') \+ location\.search \+ location\.hash\);<\/script>/); assert(m, 'the folder index is not the forwarder');
  const stage = JSON.parse("\"" + m[1].slice(1, -1) + "\""); assert(fs.existsSync(path.join(root, 'talkbridge-app', stage.replace('./', ''))), 'the stage page the folder forwards to does not exist: ' + stage);
  const one = run(read('bridge-turn28-post-ship.html').toString('utf8').match(/<script>([\s\S]*?)<\/script>/)[1], { search: '?x=1', hash: INVITE });
  const u = new URL(one, 'https://acmeproducts.github.io/stuff/bridge-turn28-post-ship.html'); const two = run('location.replace(' + m[1] + ' + location.search + location.hash);', { search: u.search, hash: u.hash });
  assert(two === stage + '?x=1' + INVITE, 'the chain ended at ' + two);
});

console.log('F4 · what must stay is untouched');
await T('F4.1 the base of the folder release, the warm storage and the governance-frozen page are the accepted bytes, not forwarders', () => {
  for (const n of NOT_FORWARDED) { if (!fs.existsSync(path.join(dir, n))) continue; const b = read(n); assert(!isFwd(b), n + ' was forwarded'); const g = git(['show', manifest.accepted_ref + ':' + n]); assert(sha(b) === sha(g), n + ' changed since ' + manifest.accepted_ref.slice(0, 8)); }
});
console.log('F5 · nothing else changed');
await T('F5.1 no root page, worker, manifest or icon outside the list differs from the accepted commit (and the two governance-frozen files are byte-identical)', () => {
  const names = fs.readdirSync(dir).filter((n) => /^(bridge-[^/]*\.html|tb-[^/]*\.(js|webmanifest)|icon-[^/]*|flags\.[a-z]+)$/.test(n) && !LIST.includes(n));
  assert(names.length >= 40, 'only ' + names.length + ' files to compare');
  const bad = []; for (const n of names) { let g = null; try { g = git(['show', manifest.accepted_ref + ':' + n]); } catch (_) { bad.push(n + ' (not in the accepted commit)'); continue; } if (sha(fs.readFileSync(path.join(dir, n))) !== sha(g)) bad.push(n); }
  assert(bad.length === 0, 'differs from ' + manifest.accepted_ref.slice(0, 8) + ': ' + bad.join(', '));
  for (const f of ['bridge-turn24-post-ship.html', 'tb-sw.js']) assert(names.includes(f) && sha(fs.readFileSync(path.join(dir, f))) === sha(git(['show', manifest.accepted_ref + ':' + f])), f + ' changed');
});

console.log('F6 · the loader gives the historical gates the accepted bytes');
const child = (code, withLoader) => spawnSync('node', ['--input-type=module', '-e', code], { cwd: root, encoding: 'utf8', env: { ...process.env, TB_ACCEPTED_ROOT: root, NODE_OPTIONS: withLoader ? '--import=' + loader : '' } });
const readAll = "import fs from 'node:fs'; import crypto from 'node:crypto'; const m = JSON.parse(fs.readFileSync(" + JSON.stringify(manifestPath) + ", 'utf8')); const o = {}; for (const f of m.files) { o[f.file] = crypto.createHash('sha256').update(fs.readFileSync(" + JSON.stringify(dir + '/') + " + f.file)).digest('hex'); } console.log(JSON.stringify(o));";
await T('F6.1 with the loader every listed page reads as its accepted bytes (string and buffer); without it, as the forwarder; a page that is not a forwarder is read as is', () => {
  if (!isRoot) { /* a mutation dir has its own files: the loader reads the REAL root, so only the mutated loader matters here */ }
  const withL = child(readAll, true), without = child(readAll, false); assert(withL.status === 0, 'loader run failed: ' + withL.stderr.slice(0, 300));
  const a = JSON.parse(withL.stdout), b = JSON.parse(without.stdout);
  if (isRoot) { for (const f of manifest.files) { assert(a[f.file] === f.sha256, f.file + ' with the loader reads ' + a[f.file].slice(0, 12) + ', wanted ' + f.sha256.slice(0, 12)); assert(b[f.file] !== f.sha256, f.file + ' without the loader reads the accepted bytes (nothing was forwarded)'); } }
  const str = child("import fs from 'node:fs'; const s = fs.readFileSync('bridge-turn28-ship.html', 'utf8'); const b = fs.readFileSync('bridge-turn28-ship.html'); const n = fs.readFileSync('bridge-turn29-pre-base.html', 'utf8'); console.log(JSON.stringify([typeof s, s.indexOf('TB-FORWARDER'), Buffer.isBuffer(b), b.length, n.indexOf('TB-FORWARDER')]));", true);
  const r = JSON.parse(str.stdout); assert(r[0] === 'string' && r[1] === -1 && r[2] === true && r[3] === manifest.files.find((f) => f.file === 'bridge-turn28-ship.html').bytes && r[4] === -1, 'string/buffer reads: ' + str.stdout + str.stderr.slice(0, 200));
});
await T('F6.2 a listed page that is NOT a forwarder (restored, or edited later) is read exactly as it is — the loader never hides a real file', () => {
  const tr = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-fw-r-')); fs.mkdirSync(path.join(tr, 'talkbridge/fixtures/forwarders'), { recursive: true }); fs.copyFileSync(manifestPath, path.join(tr, 'talkbridge/fixtures/forwarders/manifest.json'));
  const accepted = git(['show', manifest.accepted_ref + ':bridge-turn28-ship.html']); fs.writeFileSync(path.join(tr, 'bridge-turn28-ship.html'), Buffer.concat([accepted, Buffer.from('\n<!-- restored edit -->\n')]));
  const gd = git(['rev-parse', '--absolute-git-dir']).toString().trim();
  const r = spawnSync('node', ['--input-type=module', '-e', "import fs from 'node:fs'; process.stdout.write(fs.readFileSync('bridge-turn28-ship.html', 'utf8').slice(-40));"], { cwd: tr, encoding: 'utf8', env: { ...process.env, GIT_DIR: gd, TB_ACCEPTED_ROOT: tr, NODE_OPTIONS: '--import=' + loader } });
  fs.rmSync(tr, { recursive: true, force: true });
  assert(r.status === 0 && r.stdout.indexOf('<!-- restored edit -->') !== -1, 'the loader hid a real page: ' + JSON.stringify(r.stdout) + r.stderr.slice(0, 200));
});
console.log('F7 · the old gates still pass on the accepted bytes');
const OLD = ['assemble-27s8', 'assemble-27ps', 'assemble-28b', 'assemble-28ps', 'assemble-28s', 'assemble-28pos'];
if (!process.env.TB_FW_SKIP_F7 && isRoot) {
  await T('F7.1 the six historical assemblers verify their outputs under the loader (they read the pages that are now forwarders)', () => { for (const a of OLD) { const r = spawnSync('node', ['talkbridge/build/' + a + '.mjs', '--check'], { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '--import=' + loader } }); assert(r.status === 0, a + ' failed under the loader: ' + (r.stderr + r.stdout).slice(0, 300)); } });
  await T('F7.2 without the loader the same check fails (the proof the loader is what carries them)', () => { const r = spawnSync('node', ['talkbridge/build/assemble-28pos.mjs', '--check'], { cwd: root, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '' } }); assert(r.status !== 0, 'assemble-28pos passed without the loader'); });
}
console.log('F8 · the old gates carry the loader');
await T('F8.1 every npm script of the 27·ship-eight to 28·post-ship gates that runs node carries the loader prefix', () => {
  const sc = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).scripts; const want = Object.keys(sc).filter((k) => /^(gate|build):(27s8|27ps|28b|28ps|28s|28pos)(:|$)/.test(k) && !/npm run/.test(sc[k])); assert(want.length >= 30, 'only ' + want.length + ' old scripts found');
  const bare = want.filter((k) => sc[k].indexOf('NODE_OPTIONS="--import ./talkbridge/build/accepted-bytes.mjs"') !== 0); assert(bare.length === 0, 'without the loader: ' + bare.join(', '));
});
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
