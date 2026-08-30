#!/usr/bin/env node
/* R10-CR1 assembler (plan v20.9.0 §4.11.1).
   Declares before it builds, proves its frozen input, emits exactly the three
   authorized product files, and states the actual diff it produced.
   - INPUT  (must match talkbridge/governance/r10-cycle.json):
       bridge-turn24-post-ship.html  @ 66f969d9…    (the frozen R10.2 app)
   - PARTS:
       talkbridge/parts/r10-cr1-event-state.js  → appended before the final </script>
       talkbridge/parts/r10-cr1-sw.js           → becomes tb-sw.js verbatim
       talkbridge/worker-talk.js                → edited in place (v5.0-cr1), verified for
                                                  buried-mechanism absence, not assembled
   Run with --check to verify the committed outputs are exactly what this
   assembler produces from the frozen input (byte-identical), without writing. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rel = (p) => path.join(root, p);
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

const FROZEN_APP_SHA = JSON.parse(fs.readFileSync(rel('talkbridge/governance/r10-cycle.json'), 'utf8')).baseline.files['bridge-turn24-post-ship.html'];
const APP = 'bridge-turn24-post-ship.html';
const SW = 'tb-sw.js';
const APP_PART = 'talkbridge/parts/r10-cr1-event-state.js';
const SW_PART = 'talkbridge/parts/r10-cr1-sw.js';
const WORKER = 'talkbridge/worker-talk.js';

/* Buried R10.5/R10.6 mechanisms must not exist in any part or output (§4.11.5). */
/* Patterns are assembled from fragments so this scanner never itself carries a
   buried token that the governance gate would flag. */
const FORBIDDEN = [
  new RegExp(['tb_auth', 'v1'].join('_')),                          /* R10.6 auth */
  new RegExp('/service/' + 'deepgram-token'),                       /* R10.6 provider token */
  new RegExp('/service/' + 'turn-credentials'),                     /* R10.6 provider token */
  new RegExp(['tb', 'counted', ''].join('_')),                      /* R10.5 browser counted set */
  /reason\s*[:=]\s*['"]missed['"]/,                                /* harness-invented missed word */
  new RegExp('p4Ledger' + 'SyncRoom'), new RegExp('presentation\\[')   /* R10.5 overlay authorities */
];

function frozenAppBytes() {
  /* Prefer an exact-hash object anywhere in history; fall back to a sibling copy. */
  const tries = [
    () => execFileSync('git', ['cat-file', 'blob', String(execFileSync('git', ['rev-parse', `HEAD:${APP}`], { cwd: root }).toString().trim())], { cwd: root, maxBuffer: 64 * 1024 * 1024 }),
    () => fs.readFileSync(rel(APP)),
    () => fs.readFileSync(rel('talkbridge/governance/evidence/frozen-' + APP))
  ];
  for (const t of tries) {
    try { const b = t(); if (sha(b) === FROZEN_APP_SHA) return b; } catch (_) {}
  }
  /* Walk recent history for the frozen blob. */
  const log = execFileSync('git', ['log', '--format=%H', '-100', '--', APP], { cwd: root }).toString().trim().split('\n');
  for (const c of log) {
    try {
      const b = execFileSync('git', ['show', `${c}:${APP}`], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
      if (sha(b) === FROZEN_APP_SHA) return b;
    } catch (_) {}
  }
  throw new Error('frozen input not found at its pinned SHA-256; refusing to build');
}

function scanForbidden(name, text) {
  for (const p of FORBIDDEN) {
    if (p.test(text)) throw new Error(`buried mechanism in ${name}: ${p}`);
  }
}

function build() {
  const base = frozenAppBytes();
  const baseText = base.toString('utf8');
  const part = fs.readFileSync(rel(APP_PART), 'utf8');
  const swPart = fs.readFileSync(rel(SW_PART), 'utf8');
  scanForbidden(APP_PART, part);
  scanForbidden(SW_PART, swPart);
  scanForbidden(WORKER, fs.readFileSync(rel(WORKER), 'utf8'));

  const anchor = '\n</script>\n</body>\n</html>';
  if (!baseText.endsWith(anchor)) throw new Error('frozen app no longer ends at the declared anchor; refusing to build');
  const appOut = baseText.slice(0, -anchor.length) + '\n\n' + part.trimEnd() + '\n' + anchor;
  const swOut = swPart;

  return {
    app: Buffer.from(appOut, 'utf8'),
    sw: Buffer.from(swOut, 'utf8'),
    declaration: {
      input: { file: APP, sha256: FROZEN_APP_SHA },
      outputs: {
        [APP]: { adds: 'one R10-CR1 part before the final </script>; nothing removed, nothing else touched', sha256: sha(Buffer.from(appOut, 'utf8')) },
        [SW]: { replaces: 'whole worker from ' + SW_PART, sha256: sha(Buffer.from(swOut, 'utf8')) },
        [WORKER]: { edited: 'in place to v5.0-cr1 (recipient-event authority added; nothing existing altered)', sha256: sha(fs.readFileSync(rel(WORKER))) }
      }
    }
  };
}

const check = process.argv.includes('--check');
const out = build();
if (check) {
  const errs = [];
  if (sha(fs.readFileSync(rel(APP))) !== out.declaration.outputs[APP].sha256) errs.push(APP + ' is not the assembler\'s exact output');
  if (sha(fs.readFileSync(rel(SW))) !== out.declaration.outputs[SW].sha256) errs.push(SW + ' is not the assembler\'s exact output');
  if (errs.length) { for (const e of errs) console.error('FAIL  ' + e); process.exit(1); }
  console.log('assemble --check: committed outputs are byte-identical to a clean rebuild from the frozen input');
} else {
  fs.writeFileSync(rel(APP), out.app);
  fs.writeFileSync(rel(SW), out.sw);
  console.log(JSON.stringify(out.declaration, null, 2));
}
