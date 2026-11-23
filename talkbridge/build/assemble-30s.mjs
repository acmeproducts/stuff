#!/usr/bin/env node
/* 30·ship assembler — SEVEN SEPARATE FIXES (§7.25; owner 2026-11-16 "go"): B-11 BL-1, B-9(a) MC-1, (b) CI-1, (c) RL-1, (d) RG-1,
   (e) RT-1, B-12 GK-1. Beta readiness (the language sweep) is this stage's device gate.
   CANDIDATE 2 (owner 2026-11-18, after testing c1): TN-1 (new, first of the card wraps) cuts a card's room name to a fixed length
   with a tap for the whole name; RL-1 keeps the count until the room is SELECTED (closing the rail acknowledges nothing).
   CANDIDATE 3 (owner 2026-11-20: the name field "is set as a password … garbage up my password manager"): PW edits, in the
   same find/replace list as the identity — the four key fields are never password fields (type=text, masked by CSS, the
   managers' ignore flags), and the old no-password sweep stamps autocomplete="off" where it stamped "new-password".
   CANDIDATE 4 (owner 2026-11-23: "add the invite link fix to the same release"): IL-1 — a link that leaves the phone names
   the folder's door (index.html / next.html) that forwards to this page, so it always opens the current version.

   Input (sha-checked): the ACCEPTED 30·pre-ship page — immutable under §0c.
   Outputs, in talkbridge-app/ (nothing hand-written; no accepted file touched):
     bridge-turn30-ship.html              = the accepted page + the stage's IDENTITY edits + the seven parts appended, in order
     tb-manifest-turn30-ship.webmanifest  = the accepted stage's Android manifest, starting THIS page (one app id for every stage)
     tb-manifest-turn30-ship-ios.webmanifest = the accepted stage's iPhone manifest, unchanged in content
   The worker is the accepted tb-sw5.js, unchanged. The relay is unchanged (v6.17).

   IDENTITY (B-11): the build line now RECORDS the stage — window.TB_STAGE — and BL-1 paints every visible label from it.
   A later stage rewrites this one line (as every stage rewrites its build line) and nothing else. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
export const FOLDER = 'talkbridge-app';
export const BASE_PAGE = FOLDER + '/bridge-turn30-pre-ship.html';
export const BASE_PAGE_SHA256 = '4dddf3c35284dfc59e6681f7eb97e314f793bb5a9a144efb51d167b91f703c60';
export const BASE_MANIFEST = FOLDER + '/tb-manifest-turn30-pre-ship.webmanifest';
export const BASE_MANIFEST_IOS = FOLDER + '/tb-manifest-turn30-pre-ship-ios.webmanifest';
export const PARTS = ['bl1-build-label', 'tn1-room-name', 'mc1-mute-card', 'ci1-camera-icon', 'rl1-rail-unread', 'rg1-ring-on-screen', 'rt1-route-in-call', 'gk1-grant-key', 'il1-invite-door'].map((p) => 'talkbridge/parts/' + p + '.js');
export const STAGE_PAGE = 'bridge-turn30-ship.html';
export const STAGE_TAG = 'turn30-ship-c4';
export const BUILT = '2026-11-23';
export const BUILT_AT = '2026-11-23T18:00:00Z';
export const MANIFEST_NAME = 'tb-manifest-turn30-ship.webmanifest';
export const MANIFEST_IOS_NAME = 'tb-manifest-turn30-ship-ios.webmanifest';
export const OUT = { page: FOLDER + '/' + STAGE_PAGE, manifest: FOLDER + '/' + MANIFEST_NAME, manifestIos: FOLDER + '/' + MANIFEST_IOS_NAME };
/* per part, in PARTS order: what its @contract adds, what it wraps, the markers it logs (with its own prefix) */
export const PART_DECL = [
  { file: PARTS[0], prefix: 'bl_', wraps: [], symbols: ['BL', 'blLog', 'blStage', 'blApply', 'blWatch', 'blInit'], markers: ['bl_applied', 'bl_failed'] },
  { file: PARTS[1], prefix: 'tn_', wraps: ['roomCardHtmlCore', 'wireRoomCards'], symbols: ['TN', 'tnLog', 'TN_MAX', 'tnUnits', 'tnCut', '_tnCard', '_tnWire'], markers: ['tn_shown', 'tn_failed'] },
  { file: PARTS[2], prefix: 'mc_', wraps: ['roomCardHtmlCore'], symbols: ['MC', 'mcLog', 'MC_CSS', 'MC_BELL', 'mcAfterName', '_mcCard', 'mcInit'], markers: ['mc_failed'] },
  { file: PARTS[3], prefix: 'ci_', wraps: [], symbols: ['CI_CSS', 'ciInit'], markers: ['ci_init_failed'] },
  { file: PARTS[4], prefix: 'rl_', wraps: ['cr3Send', 'sendReadReceipts', 'cr3Apply', 'enterRoom', 'cr3RouteEvent'], symbols: ['RL', 'rlLog', 'rlCovering', 'rlHolds', 'rlMark', 'rlBuzz', '_rlSend', '_rlReceipts', '_rlApply', '_rlEnter', '_rlRoute'], markers: ['rl_held', 'rl_open_deferred', 'rl_receipts_held', 'rl_pending', 'rl_selected'] },
  { file: PARTS[5], prefix: 'rg_', wraps: ['CALL.onIncoming', 'cr3PresentCalls'], symbols: ['RG', 'rgLog', 'rgMenus', 'rgState', 'rgHeal', 'rgCloseMenus', 'rgCloseCallCard', 'rgPresented', 'rgInput', '_rgIncoming', '_rgPresent', 'rgInit'], markers: ['rg_ring_check', 'rg_healed', 'rg_presented', 'rg_menus_closed', 'rg_card_closed', 'rg_failed'] },
  { file: PARTS[6], prefix: 'rt_', wraps: ['cr3RouteEvent'], symbols: ['RT', 'rtLog', '_rtRoute'], markers: ['rt_held'] },
  { file: PARTS[7], prefix: 'gk_', wraps: ['roomCardHtmlCore', 'wireRoomCards'], symbols: ['GKEY', 'gkLog', 'GK_CSS', 'GK_KEY', 'GK_L10N', 'gkGranted', 'gkDays', 'gkText', 'gkAfterName', '_gkCard', '_gkWire', 'gkInit'], markers: ['gk_shown', 'gk_failed'] },
  { file: PARTS[8], prefix: 'il_', wraps: ['invUrl', 'linkDeviceUrl', 'rhCarryUrl'], symbols: ['IL', 'ilLog', 'IL_DOOR_RE', 'ilDir', 'ilOwn', 'ilTarget', 'ilAsk', 'ilRewrite', 'ilRedraw', '_ilInv', '_ilDev', '_ilCarry'], markers: ['il_door', 'il_failed'] }
];
export const TAIL = '\n</script>\n</body>\n</html>';
export const STAGE_RECORD = "window.TB_STAGE = { c: '" + STAGE_TAG + "', file: 'talkbridge-app/" + STAGE_PAGE + "', built: '" + BUILT + "', at: '" + BUILT_AT + "' }; log('build', window.TB_STAGE, 'ok');";
/* the stage's identity — each find occurs exactly n times in the accepted page */
export const IDENTITY = [
  { id: 'I-manifest', n: 2, find: "'tb-manifest-turn30-pre-ship-ios.webmanifest' : 'tb-manifest-turn30-pre-ship.webmanifest'", replace: "'" + MANIFEST_IOS_NAME + "' : '" + MANIFEST_NAME + "'" },
  { id: 'I-build', n: 1, find: "log('build', { c: 'turn30-pre-ship-c1', file: 'talkbridge-app/bridge-turn30-pre-ship.html', built: '2026-11-11' }, 'ok');", replace: STAGE_RECORD },
  /* PW (c3): no field is a password — owner 2026-11-20 */
  { id: 'PW-k-dg', n: 1, find: '<input class="field-input" type="password" id="k-dg" autocomplete="off">', replace: '<input class="field-input nopw-mask" type="text" id="k-dg" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">' },
  { id: 'PW-k-tid', n: 1, find: '<input class="field-input" type="password" id="k-tid" autocomplete="off">', replace: '<input class="field-input nopw-mask" type="text" id="k-tid" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">' },
  { id: 'PW-k-tok', n: 1, find: '<input class="field-input" type="password" id="k-tok" autocomplete="off">', replace: '<input class="field-input nopw-mask" type="text" id="k-tok" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">' },
  { id: 'PW-k-pat', n: 1, find: '<input class="field-input" type="password" id="k-pat" autocomplete="off">', replace: '<input class="field-input nopw-mask" type="text" id="k-pat" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" data-1p-ignore data-lpignore="true" data-bwignore data-form-type="other">' },
  { id: 'PW-sweep', n: 1, find: "      if (el.getAttribute('autocomplete') !== 'new-password') {\n        el.setAttribute('autocomplete', 'new-password');", replace: "      if (el.getAttribute('autocomplete') !== 'off') {\n        el.setAttribute('autocomplete', 'off');" },
  { id: 'PW-formtype', n: 1, find: "      if (!el.hasAttribute('data-bwignore')) el.setAttribute('data-bwignore', '');", replace: "      if (!el.hasAttribute('data-bwignore')) el.setAttribute('data-bwignore', '');\n      if (!el.hasAttribute('data-form-type')) el.setAttribute('data-form-type', 'other');" }
];
export function basePage() { const b = fs.readFileSync(path.join(root, BASE_PAGE)); if (sha(b) !== BASE_PAGE_SHA256) throw new Error('assemble-30s: ' + BASE_PAGE + ' is not the accepted 30·pre-ship page (' + sha(b).slice(0, 12) + ')'); return b.toString('utf8'); }
export function applyIdentity(out) {
  for (const r of IDENTITY) {
    const n = out.split(r.find).length - 1;
    if (n !== r.n) throw new Error('assemble-30s: identity ' + r.id + ' finds its text ' + n + ' times (must be ' + r.n + ')');
    out = out.split(r.find).join(r.replace);
  }
  return out;
}
/* opts.parts = { <PARTS path>: text } overrides any part (the mutation gate's lever); opts.omit = [PARTS path] drops one */
export function partTexts(opts) { opts = opts || {}; return PARTS.filter((f) => !(opts.omit || []).includes(f)).map((f) => (opts.parts && opts.parts[f] != null) ? opts.parts[f] : fs.readFileSync(path.join(root, f), 'utf8')); }
export function assemblePage(opts) {
  let out = basePage();
  if (!out.endsWith(TAIL)) throw new Error('assemble-30s: unexpected baseline tail');
  out = applyIdentity(out);
  return out.slice(0, -TAIL.length) + partTexts(opts).map((p) => '\n\n' + p).join('') + TAIL;
}
export function assembleManifests() {
  const c = JSON.parse(fs.readFileSync(path.join(root, BASE_MANIFEST), 'utf8'));
  c.start_url = './' + STAGE_PAGE;
  return { chrome: JSON.stringify(c, null, 2) + '\n', ios: fs.readFileSync(path.join(root, BASE_MANIFEST_IOS), 'utf8') };
}
export function assembleAll(opts) { const m = assembleManifests(); return { [OUT.page]: assemblePage(opts), [OUT.manifest]: m.chrome, [OUT.manifestIos]: m.ios }; }

if (process.argv[1] && process.argv[1].endsWith('assemble-30s.mjs')) {
  let files; try { files = assembleAll(); } catch (e) { console.error(e.message); process.exit(1); }
  if (process.argv.includes('--check')) {
    let bad = 0;
    for (const [f, c] of Object.entries(files)) { const p = path.join(root, f); if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.error('assemble-30s --check: ' + f + ' is not the assembled output'); bad++; } }
    if (bad) process.exit(1);
    console.log('verified ' + Object.keys(files).length + ' files · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])));
  } else {
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(root, f), c);
    console.log('wrote ' + Object.keys(files).length + ' files to ' + FOLDER + '/ · ' + STAGE_PAGE + ' sha256=' + sha(Buffer.from(files[OUT.page])));
  }
}
