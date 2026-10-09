#!/usr/bin/env node
/* 28·post-ship assembler — FLATTENING, clusters 4 and 5: render and the shallow sweep (§7.16, §0c-1).

   Input : the accepted 28·ship c1 bytes (sha-checked).
   Output: bridge-turn28-ship.html = those bytes MINUS every layer named in
           talkbridge/fixtures/flatten/28pos/removals.json (each removed by its
           exact banked text, exactly once) PLUS one appended part, FL-3
           (enterRoom, leaveRoomInternals, joinRoom, openS3, invUrl, flat).    */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

export const BASE_FILE = 'bridge-turn28-ship.html';
export const BASE_SHA = '1b138efb15740ed599bc538caba61a2d2d939d7b58a873956592cbbd2db6a5d2';
export const FIXTURES = 'talkbridge/fixtures/flatten/28pos';
export const MANIFEST = FIXTURES + '/removals.json';
export const PARTS = ['talkbridge/parts/fl4-render.js', 'talkbridge/parts/fl5-sweep.js'];
export const RENDER_SYMBOLS = ['renderPanel', 'renderHome', 'renderTranscript', 'renderRoomHead', 'appendMsgDom', 'msgHtml', 'roomCardHtml', 'wireRoomCards'];
export const SWEEP_SYMBOLS = ['uid', 'log', 'saveRooms', 'loadTr', 'translateWithRetry', 'speakText', 'applyBubbleTheme', 'linkDeviceUrl', 'renderPartnerState', 'chatPayload', 'handleChatMsg', 'sendChatText', 'pbWriteBack', 'showScreen', 'wireMsg', 'renderPbList', 'pbRerenderCard', 'pbCommitEdit', 'pbAddTagTo', 'closeDrawer', 'osNotify', 'bgAddPill', 'addSpeech', 'onDGFinal', 'stopDeepgram', 'startDeepgram', 'normalizeOutgoing', 'waitingOf', 'bumpWaiting', 'clearWaiting', 'onVisible', 'onRoomNameSignal'];
export const SYMBOLS = RENDER_SYMBOLS.concat(SWEEP_SYMBOLS);
/* every name a layer captured the previous layer under; none may survive in the candidate's code */
export const CAPTURED = ['_jRenderPanel', '_lcRenderPanel', '_p3RenderPanel', '_p6RenderPanel', '_npRenderHome', '_rmRenderHead', '_r8MsgHtml', '_append', '_appendMsgDom', '_p6CardHtml', '_p6Wire',
  '_fAddSpeech', '_r8AddSpeech', '_r8AddSpeechDedup', '_rmApplyTheme', '_cr3BgAddPill', '_cr3BumpWaiting', '_chatPayload', '_r8ClearWaiting', '_rmCloseDrawer', '_rHandleChat', '_handleChatMsg', '_ld', '_tbLoadTr', '_log', '_normalizeOutgoing', '_onDGFinal', '_onRoomNameSignal', '_cr3OnVisible', '_p4OsNotify', '_cr3OsNotify', '_pbAddTagTo', '_r9CommitEdit', '_pbRerenderCard', '_pbWriteBack', '_r8Rps', '_renderPbList', '_p4SaveRooms', '_cr3SaveRooms', '_sendChatText', '_jSendChatText', '_lcSendChatText', '_show', '_speak', '_sd', '_rmStartDG', '_stop', '_translateWithRetry', '_uid', '_cr3WaitingOf', '_rmWireMsg', '_wireMsg', '_cr3Original', '_r8Original', '_r9Original'];
/* log markers the parts bring; a flattening brings none */
export const ADDED_MARKERS = [];
/* markers that leave the SOURCE with a dead layer, each with the proof the harness checks:
   'shadow' — the layer's declaration was shadowed by a later declaration of the same name (two declarations);
   a fixture name — that later layer REPLACED the symbol by assignment and never called the captured previous one.
   The accepted build never logged these; the removal takes the dead text with it. */
export const DEAD_MARKERS = {
  'card_tap': { layer: '06-R-wireRoomCards.js', by: 'shadow' }, 'room_delete_failed': { layer: '06-R-wireRoomCards.js', by: 'shadow' },
  'waiting_migrated': { layer: '55-R-waitingOf.js', by: '77-CR3-waitingOf.js' },
  'waiting_bump_ignored': { layer: '56-R-bumpWaiting.js', by: '78-CR3-bumpWaiting.js' }, 'waiting_bump': { layer: '56-R-bumpWaiting.js', by: '78-CR3-bumpWaiting.js' }
};
export const OUT_FILE = 'bridge-turn28-post-ship.html';
/* ── stage 2 · the declared behaviour changes of 28·post-ship, each a removal of exact text from the FLAT build plus one part ──
   D-11 relayConnect with no room hooks nothing · D-14 the More menu closes when a call is answered · D-15 a short English
   win still suppresses its letter-spaced Thai twin · T-4 speech logs its voice and says when none is installed ·
   X-4 the receiver's copy of what was said in a call */
export const FIX_FIXTURES = 'talkbridge/fixtures/flatten/28pos-fixes';
export const FIX_MANIFEST = FIX_FIXTURES + '/removals.json';
export const FIX_PARTS = ['talkbridge/parts/d11-relay-noroom.js', 'talkbridge/parts/d14-drawer-on-accept.js', 'talkbridge/parts/d15-short-english.js', 'talkbridge/parts/t4-speech-log.js', 'talkbridge/parts/x4-said-in-call.js', 'talkbridge/parts/d18-caller-builds.js'];
/* one-line rule changes inside functions too large to move: each a banked find/replace pair applied exactly once (D-18) */
export const FIX_REPLACEMENTS = FIX_FIXTURES + '/replacements.json';
/* log markers the fixes bring */
export const FIX_MARKERS = ['d14_drawer_closed', 'tts_speak', 'tts_no_voice', 'call_builder'];
export const TAIL = '\n</script>\n</body>\n</html>';

export function base() {
  const BASE = fs.readFileSync(path.join(root, BASE_FILE));
  if (sha(BASE) !== BASE_SHA) throw new Error('assemble: ' + BASE_FILE + ' is not the accepted 28·ship c1 bytes\n  expected ' + BASE_SHA + '\n  found    ' + sha(BASE));
  return BASE.toString('utf8');
}
export function removals() {
  const m = JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8'));
  return m.removals.map((r) => {
    const text = fs.readFileSync(path.join(root, FIXTURES, r.file), 'utf8');
    if (sha(text).slice(0, 12) !== r.sha256) throw new Error('assemble: fixture bytes moved: ' + r.file);
    return { file: r.file, text, lines: r.lines };
  });
}
export function fixRemovals() {
  if (!fs.existsSync(path.join(root, FIX_MANIFEST))) return [];
  const m = JSON.parse(fs.readFileSync(path.join(root, FIX_MANIFEST), 'utf8'));
  return m.removals.map((r) => {
    const text = fs.readFileSync(path.join(root, FIX_FIXTURES, r.file), 'utf8');
    if (sha(text).slice(0, 12) !== r.sha256) throw new Error('assemble: fix fixture bytes moved: ' + r.file);
    return { file: r.file, text, lines: r.lines };
  });
}
export function fixReplacements() {
  if (!fs.existsSync(path.join(root, FIX_REPLACEMENTS))) return [];
  const m = JSON.parse(fs.readFileSync(path.join(root, FIX_REPLACEMENTS), 'utf8'));
  return m.replacements.map((r) => {
    const find = fs.readFileSync(path.join(root, FIX_FIXTURES, r.find), 'utf8'), replace = fs.readFileSync(path.join(root, FIX_FIXTURES, r.replace), 'utf8');
    if (sha(find).slice(0, 12) !== r.sha_find || sha(replace).slice(0, 12) !== r.sha_replace) throw new Error('assemble: replacement bytes moved: ' + r.id);
    return { id: r.id, find, replace };
  });
}
/* stage 1: the flat build — the base minus every banked layer plus FL-4 and FL-5 */
export function assembleFlat(opts) {
  opts = opts || {};
  let out = base();
  if (!out.endsWith(TAIL)) throw new Error('assemble: unexpected baseline tail');
  const keep = new Set(opts.keepRemovals || []);
  for (const r of removals()) {
    if (keep.has(r.file)) continue;
    const n = out.split(r.text).length - 1;
    if (n !== 1) throw new Error('assemble: removal ' + r.file + ' occurs ' + n + ' times in the base (must be exactly 1)');
    out = out.replace(r.text, '');
  }
  const parts = PARTS.map((p, i) => (opts.parts && opts.parts[i] != null) ? opts.parts[i] : fs.readFileSync(path.join(root, p), 'utf8'));
  return out.slice(0, -TAIL.length) + parts.map((p) => '\n\n' + p).join('') + TAIL;
}
/* stage 2: the flat build minus the exact text each fix replaces plus the fix parts */
export function assemble(opts) {
  opts = opts || {};
  let out = assembleFlat(opts);
  if (opts.fixes === false) return out;
  const keep = new Set(opts.keepFixRemovals || []);
  for (const r of fixRemovals()) {
    if (keep.has(r.file)) continue;
    const n = out.split(r.text).length - 1;
    if (n !== 1) throw new Error('assemble: fix removal ' + r.file + ' occurs ' + n + ' times in the flat build (must be exactly 1)');
    out = out.replace(r.text, '');
  }
  const keepR = new Set(opts.keepFixReplacements || []);
  for (const r of (opts.replacements || fixReplacements())) {
    if (keepR.has(r.id)) continue;
    const n = out.split(r.find).length - 1;
    if (n !== 1) throw new Error('assemble: replacement ' + r.id + ' finds its text ' + n + ' times (must be exactly 1)');
    if (out.indexOf(r.replace) !== -1) throw new Error('assemble: replacement ' + r.id + ' already present');
    out = out.replace(r.find, r.replace);
  }
  const parts = FIX_PARTS.map((p, i) => (opts.fixParts && opts.fixParts[i] != null) ? opts.fixParts[i] : (fs.existsSync(path.join(root, p)) ? fs.readFileSync(path.join(root, p), 'utf8') : null)).filter((p) => p != null);
  return out.slice(0, -TAIL.length) + parts.map((p) => '\n\n' + p).join('') + TAIL;
}

if (process.argv[1] && process.argv[1].endsWith('assemble-28pos.mjs')) {
  let out;
  try { out = assemble(); } catch (e) { console.error(e.message); process.exit(1); }
  const dest = path.join(root, OUT_FILE);
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== out) { console.error('assemble --check: ' + OUT_FILE + ' is not the assembled output'); process.exit(1); }
    console.log('verified ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)));
  } else {
    fs.writeFileSync(dest, out);
    console.log('wrote ' + OUT_FILE + ' sha256=' + sha(Buffer.from(out)) + ' (' + removals().length + ' layers removed, ' + PARTS.length + ' flat parts; ' + fixRemovals().length + ' fix removals, ' + FIX_PARTS.length + ' fix parts)');
    if (process.argv.includes('--flat')) { fs.writeFileSync(process.argv[process.argv.indexOf('--flat') + 1], assembleFlat()); console.log('wrote the flat build too'); }
  }
}
