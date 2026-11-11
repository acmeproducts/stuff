#!/usr/bin/env node
/* 30·pre-ship differential (child of harness-30ps.mjs): the whole 28·post-ship script on the accepted 30·base page and on the stage
   (TB_30PS_STAGE_FILE), identical but the declared differences: the build line, the ts_ lines, the log limiter's dropped count, the
   rig's own per-build tags. TB_RIG_IDB=1 gives each phone an IndexedDB. Writes {rows:[{n, ok, m}]} to TB_30PS_OUT. */
import fs from 'node:fs';
import { runBoth, KEYS, diff } from './rig-28pos.mjs';
import { basePage } from './assemble-30ps.mjs';
const stage = fs.readFileSync(process.env.TB_30PS_STAGE_FILE, 'utf8');
const force = (h) => h.replace('<head>', '<head><script>window.matchMedia = (q) => ({ matches: /standalone/.test(q), addEventListener() {}, addListener() {} });</script>');
const rows = [];
let snapA, snapC, RA, RC;
try { ({ snapA, snapC, RA, RC } = await runBoth(force(basePage()), force(stage))); }
catch (e) { rows.push({ n: 'the run', ok: false, m: String(e && e.stack || e).slice(0, 500) }); fs.writeFileSync(process.env.TB_30PS_OUT, JSON.stringify({ rows })); process.exit(0); }
const strip = (s) => {
  const c = JSON.parse(JSON.stringify(s));
  c.log = (c.log || []).map((l) => { if (l && l.d && 'dropped' in l.d) { const d = { ...l.d }; delete d.dropped; return { ...l, d }; } return l; })
    .filter((l) => l.ev !== 'build' && !/^ts_/.test(l.ev) && l.ev !== 'read_receipts_deferred' && l.ev !== 'cr3_recover' && l.ev !== 'cr3_local_missed_pill_dropped');
  const greet = (m) => (m && (m.type === 'hello' || m.type === 'hello-ack') && 'dev' in m) ? Object.fromEntries(Object.entries(m).filter(([k]) => k !== 'dev')) : m;
  if (Array.isArray(c.wire)) c.wire = c.wire.map(greet);
  if (Array.isArray(c.sockets)) for (const sk of c.sockets) if (sk && Array.isArray(sk.sent)) sk.sent = sk.sent.map(greet);
  return c;
};
for (const side of ['X', 'Y']) { const a = strip(snapA[side]), c = strip(snapC[side]); for (const k of KEYS) { const out = []; diff(a[k], c[k], side + '.' + k, out); rows.push({ n: side + '.' + k + ' identical', ok: out.length === 0, m: out.slice(0, 4).join('\n') }); } }
rows.push({ n: 'no uncaught error on either build', ok: [RA.X, RA.Y, RC.X, RC.Y].every((I) => I.errors.length === 0), m: [RA.X, RA.Y, RC.X, RC.Y].flatMap((I) => I.errors).join(' | ').slice(0, 500) });
const mode = (W) => { try { return W.w.TS && W.w.TS.mode; } catch (_) { return null; } };
rows.push({ n: 'the stage ran in mode ' + (process.env.TB_RIG_IDB ? 'idb' : 'ls') + ' on both phones (and the base has no TS)', ok: mode(RC.X) === (process.env.TB_RIG_IDB ? 'idb' : 'ls') && mode(RC.Y) === mode(RC.X) && !RA.X.w.TS, m: [mode(RC.X), mode(RC.Y)].join('/') });
if (process.env.TB_RIG_IDB) {
  /* the chats really live in the store: no tba_tr_* key left, and the store holds the room the script talked in */
  const keys = (W) => { const o = []; for (let i = 0; i < W.w.localStorage.length; i++) { const k = W.w.localStorage.key(i); if (k.indexOf('tba_tr_') === 0) o.push(k); } return o; };
  rows.push({ n: 'no chat left in localStorage on either phone (absorbed or never written there)', ok: keys(RC.X).length === 0 && keys(RC.Y).length === 0, m: keys(RC.X).concat(keys(RC.Y)).join(',') });
  const rowsIn = await new Promise((res) => { try { const r = RC.X.w.indexedDB.open('tb-chats'); r.onsuccess = () => { const q = r.result.transaction('msgs').objectStore('msgs').count(); q.onsuccess = () => res(q.result); q.onerror = () => res(-1); }; r.onerror = () => res(-1); } catch (e) { res(-2); } });
  rows.push({ n: 'the store holds the chats the script wrote (rows > 0)', ok: rowsIn > 0, m: 'rows ' + rowsIn });
} else {
  rows.push({ n: 'jsdom has no BroadcastChannel and no IndexedDB here (so this run is the ls path)', ok: !RC.X.w.indexedDB, m: 'indexedDB ' + typeof RC.X.w.indexedDB });
}
fs.writeFileSync(process.env.TB_30PS_OUT, JSON.stringify({ rows }));
process.exit(0);
