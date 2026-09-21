#!/usr/bin/env node
/* D1 mutation gate.

   A gate that has never been seen to fail is not a gate. Each mutation below
   reintroduces, in the part source, exactly the defect one harness test claims
   to catch. The harness must fail, and it must fail on the NAMED test — a
   mutation that merely makes the suite red somewhere else proves nothing.

   Nothing on disk is modified: each mutation is assembled into a scratch file
   under the system temp directory and thrown away.

   Usage: node mutate-d1.mjs                                                  */

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { tmpdir } from 'os';
import path from 'path';

const BASE_FILE = 'bridge-turn27-ship.html';
const PART_FILE = 'talkbridge/parts/d1-call-diagnostics.js';
const TAIL = '\n</script>\n</body>\n</html>';

const base = readFileSync(BASE_FILE, 'utf8');
const prefix = base.slice(0, base.length - TAIL.length);
const part = readFileSync(PART_FILE, 'utf8');

const MUTATIONS = [
  {
    name: 'ICE transitions stop being logged',
    catches: 'M4.5',
    apply: (s) => s.replace(
      "pc.addEventListener('iceconnectionstatechange', transition('ice', function () { return pc.iceConnectionState; }));",
      "/* mutated: ice listener removed */")
  },
  {
    name: 'connection transitions stop being logged',
    catches: 'M4.6',
    apply: (s) => s.replace(
      "pc.addEventListener('connectionstatechange', transition('conn', function () { return pc.connectionState; }));",
      "/* mutated: conn listener removed */")
  },
  {
    name: 'the freeze detector never trips',
    catches: 'M5.2',
    apply: (s) => s.replace('var DEAD_SAMPLES = 2;', 'var DEAD_SAMPLES = 99999;')
  },
  {
    name: 'the freeze fires but carries no evidence',
    catches: 'M5.3',
    apply: (s) => s.replace(
      "path: pairKey, ka: row.ka, wd: row.wd, rs: c.recoveryStep, net: netInfo()",
      "path: pairKey")
  },
  {
    name: 'no TURN probe when video dies',
    catches: 'M5.4',
    apply: (s) => s.replace("turnProbe('video_dead');", "/* mutated: probe suppressed */")
  },
  {
    name: 'the probe reports success without a relay candidate',
    catches: 'M5.5b',
    apply: (s) => s.replace('ok: relay > 0, relay: relay,', 'ok: true, relay: relay,')
  },
  {
    name: 'the media path is not resolved from the candidate pair',
    catches: 'M5.1',
    apply: (s) => s.replace("var pairKey = lt + '/' + rt;", "var pairKey = '?';")
  },
  {
    name: 'a path change mid-call goes unreported',
    catches: 'M5.8',
    apply: (s) => s.replace(
      "L('d1_path_change', { pc: rec.id, from: rec.pair, to: pairKey, ms: now() - rec.t0 }, 'warn');",
      "/* mutated: path change silent */")
  },
  {
    name: 'the instrument overwrites the recovery ladder handler',
    catches: 'M2.3',
    apply: (s) => s.replace(
      "pc.addEventListener('connectionstatechange', transition('conn', function () { return pc.connectionState; }));",
      "pc.onconnectionstatechange = transition('conn', function () { return pc.connectionState; });")
  },
  {
    name: 'the instrument takes over CALL.setupPC',
    catches: 'M2.2',
    apply: (s) => s.replace('var ticks = 0;', 'CALL.setupPC = function () {};\n  var ticks = 0;')
  },
  {
    name: 'the instrument paints something on screen',
    catches: 'M2.4',
    apply: (s) => s.replace(
      "L('d1_build', { c: BUILD.c, file: BUILD.file, base: BUILD.base }, 'ok');",
      "L('d1_build', { c: BUILD.c, file: BUILD.file, base: BUILD.base }, 'ok');\n  try { document.body.appendChild(document.createElement('div')); } catch (_) {}")
  },
  {
    name: 'the probe fetches fresh credentials instead of reusing the live config',
    catches: 'M2.5',
    apply: (s) => s.replace(
      'S.lastServers = servers;',
      "S.lastServers = servers;\n    try { fetch('https://rtc.live.cloudflare.com/v1/turn/keys/x/credentials/generate'); } catch (_) {}")
  },
  {
    name: 'the appended part is not appended — the baseline is edited instead',
    catches: 'M1.2',
    apply: (s) => s,
    mangleBuild: (built) => built.replace('CALL.CONNECT_TIMEOUT_MS = 20000;', 'CALL.CONNECT_TIMEOUT_MS = 9000;')
  }
];

const dir = mkdtempSync(path.join(tmpdir(), 'tb-d1-mut-'));
let caught = 0, missed = 0;

for (let i = 0; i < MUTATIONS.length; i++) {
  const m = MUTATIONS[i];
  const mutatedPart = m.apply(part);
  if (!m.mangleBuild && mutatedPart === part) {
    console.log('MISS  ' + m.name + ' — mutation did not apply (source moved?)');
    missed++;
    continue;
  }
  const partPath = path.join(dir, 'part-' + i + '.js');
  const builtPath = path.join(dir, 'built-' + i + '.html');
  writeFileSync(partPath, mutatedPart);
  let built = prefix + '\n\n' + mutatedPart + TAIL;
  if (m.mangleBuild) built = m.mangleBuild(built);
  writeFileSync(builtPath, built);

  let out = '';
  let exit = 0;
  try {
    out = execFileSync('node', ['talkbridge/build/harness-d1.mjs', BASE_FILE, builtPath, partPath],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    exit = e.status || 1;
    out = (e.stdout || '') + (e.stderr || '');
  }

  const failedNamed = new RegExp('FAIL\\s+' + m.catches.replace('.', '\\.') + '\\b').test(out);
  if (exit !== 0 && failedNamed) {
    console.log('  ok  ' + m.catches + ' catches: ' + m.name);
    caught++;
  } else {
    console.log('MISS  ' + m.catches + ' did NOT catch: ' + m.name + (exit === 0 ? ' (suite stayed green)' : ' (wrong test failed)'));
    missed++;
  }
}

rmSync(dir, { recursive: true, force: true });
console.log('\nmutations ' + caught + '/' + MUTATIONS.length + ' caught, ' + missed + ' missed');
process.exit(missed ? 1 : 0);
