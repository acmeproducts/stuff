#!/usr/bin/env node
/* 30·ship differential (child of harness-30s.mjs): the whole 28·post-ship script on the ACCEPTED 30·pre-ship page and on the stage
   (TB_30S_STAGE_FILE), identical but the declared differences: the build line, the seven parts' own log lines (bl_ mc_ ci_ rl_
   rg_ rt_ gk_), the log limiter's dropped count, the rig's per-build tags, TN-1's cut names, the lines the 30·pre-ship differential already declared.
   TB_RIG_IDB=1 gives each phone an IndexedDB. Writes {rows:[{n, ok, m}]} to TB_30S_OUT. */
import fs from 'node:fs';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage } from './assemble-30s.mjs';
const stage = fs.readFileSync(process.env.TB_30S_STAGE_FILE, 'utf8');
const force = (h) => h.replace('<head>', '<head><script>window.matchMedia = (q) => ({ matches: /standalone/.test(q), addEventListener() {}, addListener() {} });</script>');
const rows = [];
let snapA, snapC, RA, RC;
try { ({ snapA, snapC, RA, RC } = await runBoth(force(basePage()), force(stage))); }
catch (e) { rows.push({ n: 'the run', ok: false, m: String(e && e.stack || e).slice(0, 500) }); fs.writeFileSync(process.env.TB_30S_OUT, JSON.stringify({ rows })); process.exit(0); }
const OURS = /^(bl|tn|mc|ci|rl|rg|rt|gk)_/;
const strip = (s) => {
  const c = JSON.parse(JSON.stringify(s));
  c.log = (c.log || []).map((l) => { if (l && l.d && 'dropped' in l.d) { const d = { ...l.d }; delete d.dropped; return { ...l, d }; } return l; })
    /* idb only: the app's 400 ms start-up timer (syncCreateControl → joiner_create_control) races the store's open in real time —
       proven nondeterministic with the SAME page on both sides (30·pre-ship vs itself: 4 of 6 runs under load, 2026-11-16) */
    .filter((l) => !(process.env.TB_RIG_IDB && l.ev === 'joiner_create_control'))
    .filter((l) => l.ev !== 'build' && !OURS.test(l.ev) && l.ev !== 'read_receipts_deferred' && l.ev !== 'cr3_recover' && l.ev !== 'cr3_local_missed_pill_dropped');
  const greet = (m) => (m && (m.type === 'hello' || m.type === 'hello-ack') && 'dev' in m) ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'dev')) : m;
  if (Array.isArray(c.wire)) c.wire = c.wire.map(greet);
  if (Array.isArray(c.sockets)) for (const sk of c.sockets) if (sk && Array.isArray(sk.sent)) sk.sent = sk.sent.map(greet);
  return c;
};
/* declared in the rendered cards: GK-1's key button and MC-1's moved bell (a muted card: the base's corner bell is the stage's X) */
const KEY_RE = /<button class="rc2-key"[^>]*>[\s\S]*?<\/button>/g, MUTE_RE = /<span class="rc2-mute"[^>]*>[\s\S]*?<\/span>/g;
const BELL_RE = /<span class="rc2-bell">[\s\S]*?<\/span>/g;
/* TN-1: a name over 14 display units is the stage's cut span; the base's full name is compared as @CUT@ (same rule as TN-1) */
const units = (str) => { let n = 0; for (const { segment } of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)) n += /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]|\p{Extended_Pictographic}/u.test(segment) ? 2 : 1; return n; };
const unesc = (h) => h.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const names = (v, stageSide) => stageSide ? v.replace(/<span class="rc2-nm" dir="auto">[\s\S]*?<\/span>/g, '@CUT@') : v.replace(/<div class="rc2-name">([^<]*)<\/div>/g, (m, t) => units(unesc(t)) > 14 ? '<div class="rc2-name">@CUT@</div>' : m);
const cards = (v, stageSide) => { if (typeof v === 'string') return cardsStr(names(v, stageSide), stageSide); if (Array.isArray(v)) return v.map((x) => cards(x, stageSide)); if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cards(x, stageSide)])); return v; };
const cardsStr = (v, stageSide) => { return stageSide ? v.replace(KEY_RE, '').replace(/<div class="rc2-name"><span class="rc2-mute"[^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/div><button class="rc2-del"[^>]*>[\s\S]*?<\/button>/g, '<div class="rc2-name">$1</div>@MUTED@').replace(MUTE_RE, '') : v.replace(/<div class="rc2-name">([\s\S]*?)<\/div><span class="rc2-bell">[\s\S]*?<\/span>/g, '<div class="rc2-name">$1</div>@MUTED@'); };
for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); a.render = cards(a.render, false); c.render = cards(c.render, true); for (const k of KEYS) { const out = []; diff(a[k], c[k], side + '.' + k, out); rows.push({ n: side + '.' + k + ' identical', ok: out.length === 0, m: out.slice(0, 4).join(' | ') }); } }
rows.push({ n: 'no uncaught error on either build', ok: [RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), m: [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ').slice(0, 500) });
const mode = (W) => { try { return W.w.TS && W.w.TS.mode; } catch (_) { return null; } };
rows.push({ n: 'both builds ran the chat store in mode ' + (process.env.TB_RIG_IDB ? 'idb' : 'ls') + ' on both phones', ok: [RA.X, RA.Y, RC.X, RC.Y].every((W) => mode(W) === (process.env.TB_RIG_IDB ? 'idb' : 'ls')), m: [RA.X, RA.Y, RC.X, RC.Y].map(mode).join(',') });
rows.push({ n: 'the stage records itself (TB_STAGE) and the base does not', ok: !!(RC.X.w.TB_STAGE && RC.X.w.TB_STAGE.c === 'turn30-ship-c2') && !RA.X.w.TB_STAGE, m: JSON.stringify(RC.X.w.TB_STAGE || null) });
fs.writeFileSync(process.env.TB_30S_OUT, JSON.stringify({ rows }));
process.exit(0);
