#!/usr/bin/env node
/* TalkBridge OWNERSHIP GATE (G61, owner order 2026-09-30).

   A commit that changes or deletes a TalkBridge file must be a TalkBridge
   commit: its message names TalkBridge, a turn·stage, or a plan version.
   Anything else — a stale checkout from another project, a bulk "refresh"
   — is refused. The gate reads git, not documents.

   Protected: talkbridge/**  bridge-turn*.html  tb-*.js  tb-manifest-*  icon-v2-*
   Exempt from the mark (automated): talkbridge/DEVICE-LOG.md, talkbridge/devlog/**

   Usage: node talkbridge/build/ownership-gate.mjs --range <from>..<to>
          node talkbridge/build/ownership-gate.mjs --commits <sha> [<sha>…]
          node talkbridge/build/ownership-gate.mjs --selftest                */
import { execFileSync } from 'node:child_process';

export const PROTECTED = [/^talkbridge\//, /^bridge-turn[^/]*\.html$/, /^tb-[^/]*\.js$/, /^tb-manifest-[^/]*$/, /^icon-v2-[^/]*$/];
export const EXEMPT = [/^talkbridge\/DEVICE-LOG\.md$/, /^talkbridge\/devlog\//];
export const MARK = /talkbridge|\b\d{2}[-·](?:pre-)?(?:base|ship|post-ship)\b|\bplan v\d+\.\d+/i;

export function judge(message, changed) {
  /* changed: [{ status: 'A'|'M'|'D'|'R'|'C'|'T', path }] */
  const touched = changed.filter((c) => PROTECTED.some((re) => re.test(c.path)));
  const needsMark = touched.filter((c) => !EXEMPT.some((re) => re.test(c.path)));
  if (needsMark.length === 0) return { ok: true, touched, reason: touched.length ? 'exempt paths only' : 'no protected path' };
  if (MARK.test(message || '')) return { ok: true, touched, reason: 'TalkBridge commit' };
  return { ok: false, touched: needsMark, reason: 'changes TalkBridge files without naming TalkBridge, a turn·stage or a plan version in its message' };
}

function git(args) { return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }); }
function changedIn(sha) {
  /* first-parent diff, so a merge commit is judged by what it brought to main */
  const parents = git(['rev-list', '--parents', '-n', '1', sha]).trim().split(/\s+/).slice(1);
  const out = parents.length ? git(['diff', '--name-status', '-M', parents[0], sha]) : git(['show', '--name-status', '--format=', sha]);
  return out.split('\n').filter(Boolean).map((l) => { const p = l.split('\t'); return { status: p[0][0], path: p[p.length - 1] }; });
}
function message(sha) { return git(['log', '-1', '--format=%s%n%b', sha]); }

export function run(shas) {
  let bad = 0;
  for (const sha of shas) {
    const v = judge(message(sha), changedIn(sha));
    const short = sha.slice(0, 7), subj = message(sha).split('\n')[0];
    if (v.ok) console.log('  ok  ' + short + ' ' + subj + (v.touched.length ? ' — ' + v.reason + ' (' + v.touched.length + ' TalkBridge file' + (v.touched.length === 1 ? '' : 's') + ')' : ''));
    else { bad++; console.log('FAIL  ' + short + ' ' + subj + '\n      ' + v.reason + ':\n' + v.touched.map((c) => '        ' + c.status + '  ' + c.path).join('\n')); }
  }
  return bad;
}

if (process.argv[1] && process.argv[1].endsWith('ownership-gate.mjs')) {
  const a = process.argv.slice(2);
  if (a[0] === '--selftest') {
    const cases = [
      ['foreign commit deleting the worker is refused', judge('SOT Release D: refine Report capacity', [{ status: 'D', path: 'tb-sw3.js' }]).ok === false],
      ['foreign commit editing the candidate is refused', judge('data: refresh caches', [{ status: 'M', path: 'bridge-turn28-base.html' }]).ok === false],
      ['foreign commit deleting an icon is refused', judge('deploy: publish Turn 30 candidate', [{ status: 'D', path: 'icon-v2-192.png' }]).ok === false],
      ['foreign commit touching talkbridge/** is refused', judge('Market Navigator: index modes', [{ status: 'M', path: 'talkbridge/TALKBRIDGE-PLAN-v9.md' }]).ok === false],
      ['foreign commit touching a manifest is refused', judge('SOT: estate', [{ status: 'M', path: 'tb-manifest-turn28.webmanifest' }]).ok === false],
      ['a TalkBridge-named commit passes', judge('TalkBridge: restore 28-base c2', [{ status: 'M', path: 'bridge-turn28-base.html' }]).ok === true],
      ['a turn·stage commit passes', judge('28-base c2: the app\'s face', [{ status: 'A', path: 'tb-sw3.js' }]).ok === true],
      ['a plan-version commit passes', judge('Plan v21.63.0: identity', [{ status: 'M', path: 'talkbridge/TALKBRIDGE-PLAN-v9.md' }]).ok === true],
      ['the automated device log passes without a mark', judge('device log [skip ci]', [{ status: 'M', path: 'talkbridge/DEVICE-LOG.md' }]).ok === true],
      ['a device-log commit that also touches a candidate is refused', judge('device log [skip ci]', [{ status: 'M', path: 'talkbridge/DEVICE-LOG.md' }, { status: 'M', path: 'bridge-turn28-base.html' }]).ok === false],
      ['a commit touching nothing protected passes', judge('SOT Release D', [{ status: 'A', path: 'SOT/x.html' }, { status: 'M', path: 'devstream/status.json' }]).ok === true],
      ['the word inside a path is not a mark: the MESSAGE must say it', judge('refresh', [{ status: 'M', path: 'talkbridge/parts/x.js' }]).ok === false],
      ['the old accepted files are protected too', judge('tidy', [{ status: 'M', path: 'tb-sw.js' }, { status: 'M', path: 'bridge-turn24-post-ship.html' }]).ok === false]
    ];
    let f = 0; for (const [n, ok] of cases) { console.log((ok ? '  ok  ' : 'FAIL  ') + n); if (!ok) f++; }
    console.log(f ? '\n' + f + ' self-test failure(s)' : '\nownership gate self-test green (' + cases.length + ')'); process.exit(f ? 1 : 0);
  }
  let shas = [];
  if (a[0] === '--range') { let r = a[1]; if (/^0{40}\.\./.test(r)) r = r.replace(/^0{40}\.\./, 'HEAD~1..'); shas = git(['rev-list', '--reverse', r]).trim().split('\n').filter(Boolean); }
  else if (a[0] === '--commits') shas = a.slice(1);
  else { console.error('usage: --range A..B | --commits sha… | --selftest'); process.exit(2); }
  if (!shas.length) { console.log('ownership gate: no commits in range'); process.exit(0); }
  const bad = run(shas);
  console.log(bad ? '\nownership gate: ' + bad + ' commit(s) changed TalkBridge files without owning them' : '\nownership gate: every commit that touched TalkBridge files was a TalkBridge commit');
  process.exit(bad ? 1 : 0);
}
