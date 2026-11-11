#!/usr/bin/env node
/* 30·pre-ship browser gate — CHATS IN INDEXEDDB (§7.24, TS-1) in REAL Chromium (Playwright, the machine's global install; TB_PLAYWRIGHT
   overrides) over a local http origin (real quota, real storage). The relay is never reached (every network call is answered here).
   S1–S14 per §7.24 "Gates". Usage: node talkbridge/build/harness-30ps-browser.mjs [--page <html>] [--quiet] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2); const quiet = args.includes('--quiet');
const pageArg = args.indexOf('--page') >= 0 ? args[args.indexOf('--page') + 1] : null;
const STAGE = '/stuff/talkbridge-app/bridge-turn30-pre-ship.html';
const html = fs.readFileSync(pageArg || path.join(root, 'talkbridge-app/bridge-turn30-pre-ship.html'), 'utf8');
const CHROME = process.env.TB_CHROME || (() => { const base = '/opt/pw-browsers'; try { const d = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().pop(); if (d) return path.join(base, d, 'chrome-linux', 'chrome'); } catch (_) {} return 'chromium'; })();
const pw = process.env.TB_PLAYWRIGHT || path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright', 'index.mjs');
const { chromium } = await import(pw);
const server = http.createServer((q, s) => {
  const u = new URL(q.url, 'http://x');
  if (u.pathname === STAGE) { s.writeHead(200, { 'Content-Type': 'text/html' }); s.end(html); return; }
  const f = path.join(root, u.pathname.replace(/^\/stuff\//, ''));
  if (u.pathname.startsWith('/stuff/') && fs.existsSync(f) && fs.statSync(f).isFile()) { s.writeHead(200); s.end(fs.readFileSync(f)); return; }
  s.writeHead(404); s.end();
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = 'http://127.0.0.1:' + server.address().port, URL0 = ORIGIN + STAGE;

let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const ok = (c, m) => { if (!c) throw new Error(m); };

/* a phone with history: two rooms, a 50 KB attachment, the same id twice, an entry without an id (twice, identical), a broken key */
const R1 = [], R2 = [];
for (let i = 0; i < 60; i++) R1.push({ id: 'm' + i, kind: 'chat', who: i % 2 ? 'me' : 'partner', sourceText: 'hello ' + i, translatedText: 'สวัสดี ' + i, srcLang: 'en', tgtLang: 'th', ts: 1760000000000 + i * 1000, senderName: 'Bo', origin: 'typed', attachment: i === 7 ? { kind: 'image', dataUrl: 'data:image/png;base64,' + 'A'.repeat(50000) } : null });
R1.push({ id: 'm3', kind: 'chat', who: 'me', sourceText: 'the same id again', ts: 1760000100000 });
R1.push({ kind: 'sys', key: 'pill_joined', vars: { who: 'Bo' }, ts: 1760000200000 }); R1.push({ kind: 'sys', key: 'pill_joined', vars: { who: 'Bo' }, ts: 1760000200000 });
for (let i = 0; i < 5; i++) R2.push({ id: 'b' + i, kind: 'chat', who: 'partner', sourceText: 'bg ' + i, ts: 1760000000000 + i });
const ROOMS = [{ id: 'room-1', role: 'creator', title: 'One', partnerName: 'Bo', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0 }, { id: 'room-2', role: 'creator', title: 'Two', partnerName: 'Cy', myLang: 'en', theirLang: 'es', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0 }];
const USER = { name: 'Ann', lang: 'en', langFrom: 'setting' };
const SEED = { 'tba_rooms': JSON.stringify(ROOMS), 'tba_user': JSON.stringify(USER), 'tb_dev': 'aaaa1111-0000-4000-8000-000000000001', 'tba_tr_room-1': JSON.stringify(R1), 'tba_tr_room-2': JSON.stringify(R2), 'tba_tr_room-3': '{"broken":' };

const browser = await chromium.launch({ executablePath: CHROME });
async function ctxWith(opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(ORIGIN)) return r.continue(); return r.fulfill({ status: 503, body: '' }); });
  if (opts.seed) await ctx.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); sessionStorage.setItem('__seeded', '1'); } }, opts.seed);
  if (opts.init) await ctx.addInitScript(opts.init);
  return ctx;
}
const open = async (ctx, q) => { const p = await ctx.newPage(); p.__errs = []; p.on('pageerror', (e) => p.__errs.push(String(e))); await p.goto(URL0 + (q || '')); await p.waitForFunction(() => window.TS && TS.mode !== 'loading', null, { timeout: 20000 }); await p.waitForTimeout(250); return p; };
const st = (p) => p.evaluate(() => {
  const keys = []; for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
  return { mode: TS.mode, keys: keys.sort(), r1: JSON.stringify(loadTr('room-1')), r2: JSON.stringify(loadTr('room-2')), n1: loadTr('room-1').length, n2: loadTr('room-2').length, rooms: localStorage.getItem('tba_rooms'), user: localStorage.getItem('tba_user'), broken: localStorage.getItem('tba_tr_room-3'),
    logs: (window.debugLog || []).filter((l) => /^ts_|^boot$|^storage_write_failed$/.test(l.ev)).map((l) => ({ ev: l.ev, d: l.d })), view: S.view, last: TS.last || null, dirty: Array.from(TS.dirty) };
});
const R = {};
try {
  /* S1–S4: one phone, its first start on this stage */
  const c1 = await ctxWith({ seed: SEED }); const p1 = await open(c1);
  R.first = await st(p1); R.err1 = p1.__errs;
  R.rows = await p1.evaluate(async () => {
    enterRoom('room-1'); await new Promise((r) => setTimeout(r, 200));
    const out = { mirror: transcript === TS.rooms.get('room-1').arr, shown: document.querySelectorAll('#transcript .msg').length };
    const step = async (fn) => { fn(); await new Promise((r) => setTimeout(r, 250)); return Object.assign({}, TS.last); };
    out.send = await step(() => { transcript.push({ id: 'new-1', kind: 'chat', who: 'me', sourceText: 'sent', ts: Date.now() }); saveTr(); });
    out.receipt = await step(() => { transcript.find((e) => e.id === 'm10').readAt = 123; saveTr(); });
    out.fill = await step(() => { transcript.find((e) => e.id === 'm11').translatedText = 'filled'; saveTr(); });
    out.del = await step(() => { transcript = transcript.filter((e) => e.id !== 'm12'); saveTr(); });
    out.bg = await step(() => { const tr = loadTr('room-2'); tr.push({ id: 'pill-x', kind: 'sys', key: 'pill_missed_voice_call', vars: {}, ts: Date.now() }); lsSet(trKey('room-2'), tr); });
    out.fn = await step(() => { transcript.push({ id: 'fn-1', kind: 'chat', sourceText: 'with a function', cb: function () {}, ts: Date.now() }); saveTr(); });
    out.afterSends = { n1: loadTr('room-1').length, n2: loadTr('room-2').length };
    return out;
  });
  await p1.reload(); await p1.waitForFunction(() => window.TS && TS.mode !== 'loading'); await p1.waitForTimeout(250);
  R.reload = await st(p1);
  /* S6: an older stage page writes the old key after the move — absorbed at the next start, merged by id */
  await p1.evaluate(() => { const old = JSON.parse(JSON.stringify(loadTr('room-2'))); old.push({ id: 'old-page-1', kind: 'chat', sourceText: 'from an old page', ts: 5 }); localStorage.setItem('tba_tr_room-2', JSON.stringify(old)); });
  await p1.reload(); await p1.waitForFunction(() => window.TS && TS.mode !== 'loading'); await p1.waitForTimeout(250);
  R.oldPage = await st(p1);
  /* S6b: an older page writes the old key WHILE it is being absorbed — the key is kept (not removed under it), absorbed next start */
  const rc = await ctxWith({ seed: SEED, init: () => { if (sessionStorage.getItem('race')) { const g = Storage.prototype.getItem; let n = 0; Storage.prototype.getItem = function (k) { if (this === localStorage && k === 'tba_tr_room-2' && ++n === 2) { const v = JSON.parse(g.call(this, k)); v.push({ id: 'mid-absorb', kind: 'chat', sourceText: 'written mid-absorb', ts: 6 }); localStorage.setItem(k, JSON.stringify(v)); } return g.apply(this, arguments); }; } } });
  const r1 = await open(rc); await r1.evaluate(() => { localStorage.setItem('tba_tr_room-2', JSON.stringify(loadTr('room-2').concat([{ id: 'pre-race', kind: 'chat', sourceText: 'p', ts: 4 }]))); sessionStorage.setItem('race', '1'); });
  await r1.reload(); await r1.waitForFunction(() => window.TS && TS.mode !== 'loading'); await r1.waitForTimeout(250);
  R.race = await r1.evaluate(() => ({ kept: !!localStorage.getItem('tba_tr_room-2') && localStorage.getItem('tba_tr_room-2').indexOf('mid-absorb') > 0, inStore: loadTr('room-2').some((e) => e.id === 'pre-race') }));
  await r1.evaluate(() => sessionStorage.removeItem('race')); await r1.reload(); await r1.waitForFunction(() => window.TS && TS.mode !== 'loading'); await r1.waitForTimeout(250);
  R.raceNext = await r1.evaluate(() => ({ key: localStorage.getItem('tba_tr_room-2'), has: loadTr('room-2').some((e) => e.id === 'mid-absorb') }));
  /* S7: TWO COPIES OPEN (the installed app and a tab) — each sees the other's message; the active array stays the mirror */
  const p2 = await open(c1);
  await p1.evaluate(() => { enterRoom('room-1'); }); await p2.evaluate(() => { enterRoom('room-1'); });
  await p1.evaluate(() => { transcript.push({ id: 'from-a', kind: 'chat', sourceText: 'A', ts: Date.now() }); saveTr(); }); await p1.waitForTimeout(600);
  R.two1 = await p2.evaluate(() => ({ has: loadTr('room-1').some((e) => e.id === 'from-a'), same: transcript === TS.rooms.get('room-1').arr }));
  await Promise.all([p1, p2].map((p, w) => p.evaluate(async (w) => { for (let k = 0; k < 20; k++) { transcript.push({ id: 'both-' + 'ab'[w] + k, kind: 'chat', sourceText: 'x', ts: Date.now() }); saveTr(); if (k % 3 === 0) await new Promise((r) => setTimeout(r, 0)); } }, w)));
  await p1.waitForTimeout(1500);
  R.two2 = await Promise.all([p1, p2].map((p) => p.evaluate(() => ({ ids: loadTr('room-1').map((e) => e.id).filter((x) => /^both-|^from-a$/.test(x || '')).length, n: loadTr('room-1').length, errs: (window.debugLog || []).filter((l) => l.ev === 'ts_flush_failed').length }))));
  R.two2rows = await p1.evaluate(() => new Promise((res) => { const r = indexedDB.open('tb-chats'); r.onsuccess = () => { const q = r.result.transaction('msgs').objectStore('msgs').getAll(); q.onsuccess = () => { const v = q.result.filter((x) => x.room === 'room-1'); res({ n: v.length, ids: v.filter((x) => /^both-/.test(x.id || '')).length }); }; }; }));
  R.err2 = p1.__errs.concat(p2.__errs);
  /* S5: a background message DURING THE HOLD on an already-moved store merges in, nothing lost */
  const hold = await ctxWith({ seed: SEED, init: () => { if (sessionStorage.getItem('hold')) document.addEventListener('DOMContentLoaded', () => { const tr = loadTr('room-1'); tr.push({ id: 'during-hold', kind: 'chat', sourceText: 'arrived in the hold', ts: 7 }); lsSet(trKey('room-1'), tr); window.__holdMode = TS.mode; }); } });
  const h1 = await open(hold); const before = await h1.evaluate(() => loadTr('room-1').length);
  await h1.evaluate(() => sessionStorage.setItem('hold', '1')); await h1.reload(); await h1.waitForFunction(() => window.TS && TS.mode !== 'loading'); await h1.waitForTimeout(400);
  R.hold = Object.assign(await st(h1), { before, holdMode: await h1.evaluate(() => window.__holdMode), has: await h1.evaluate(() => loadTr('room-1').some((e) => e.id === 'during-hold')) });
  await h1.evaluate(() => sessionStorage.removeItem('hold')); await h1.reload(); await h1.waitForFunction(() => window.TS && TS.mode !== 'loading'); await h1.waitForTimeout(300);
  R.holdNext = await st(h1);
  /* S8: a FULL store (held to 3 MB): the toast, the room stays dirty, nothing saved before is lost */
  const qc = await ctxWith({ seed: SEED }); const q1 = await qc.newPage(); q1.__errs = [];
  const cdp = await qc.newCDPSession(q1); await cdp.send('Storage.overrideQuotaForOrigin', { origin: ORIGIN, quotaSize: 3 * 1048576 });   /* before the store is opened: the limit binds from the first open */
  await q1.goto(URL0); await q1.waitForFunction(() => window.TS && TS.mode !== 'loading', null, { timeout: 20000 }); await q1.waitForTimeout(250);
  R.quota = await q1.evaluate(async () => { enterRoom('room-1'); const n0 = loadTr('room-1').length; const rnd = new Uint8Array(4 * 1048576); for (let o = 0; o < rnd.length; o += 65536) crypto.getRandomValues(rnd.subarray(o, o + 65536)); let b64 = ''; for (let o = 0; o < rnd.length; o += 32768) b64 += btoa(String.fromCharCode.apply(null, rnd.subarray(o, o + 32768)));   /* random: storage compresses a repeated letter to nothing */
    transcript.push({ id: 'huge', kind: 'chat', sourceText: 'x', attachment: { kind: 'image', dataUrl: 'data:image/png;base64,' + b64 }, ts: 1 }); saveTr(); for (let i = 0; i < 40 && (TS.flushing.size || !(window.debugLog || []).some((l) => l.ev === 'storage_write_failed' || l.ev === 'ts_flush_failed')); i++) await new Promise((r) => setTimeout(r, 250)); return { flushing: TS.flushing.size, last: TS.last, n0, toast: document.getElementById('toast').classList.contains('show'), dirty: TS.dirty.has('room-1'), logged: (window.debugLog || []).some((l) => l.ev === 'storage_write_failed' && l.d && l.d.store === 'idb'), logs: (window.debugLog || []).filter((l) => /ts_|storage/.test(l.ev)).slice(-6).map((l) => l.ev + JSON.stringify(l.d)) }; });
  await cdp.send('Storage.overrideQuotaForOrigin', { origin: ORIGIN }); await q1.evaluate(() => { transcript = transcript.filter((e) => e.id !== 'huge'); saveTr(); });
  await q1.waitForTimeout(500); await q1.reload(); await q1.waitForFunction(() => window.TS && TS.mode !== 'loading'); R.quotaAfter = await st(q1);
  /* S9: NO IndexedDB → mode ls, today's app: chats in the old keys */
  const nc = await ctxWith({ seed: SEED, init: () => { try { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); } catch (_) {} } });
  const n1 = await open(nc); R.ls = await st(n1); R.lsSave = await n1.evaluate(() => { enterRoom('room-1'); transcript.push({ id: 'ls-1', kind: 'chat', sourceText: 'ls', ts: 1 }); saveTr(); return JSON.parse(localStorage.getItem('tba_tr_room-1')).some((e) => e.id === 'ls-1'); });
  /* S10: IndexedDB STALLED → after 10 s mode journal: the app starts, a save lands in the old key; the next start absorbs it */
  const jc = await ctxWith({ seed: SEED, init: () => { if (!sessionStorage.getItem('unstall')) { const o = indexedDB.open.bind(indexedDB); indexedDB.open = function () { return {}; }; window.__o = o; } } });
  const j1 = await jc.newPage(); j1.__errs = []; await j1.goto(URL0); await j1.waitForFunction(() => window.TS && TS.mode !== 'loading', null, { timeout: 20000 }); await j1.waitForTimeout(300);
  R.journal = await st(j1); R.journalSave = await j1.evaluate(() => { enterRoom('room-1'); transcript.push({ id: 'journal-1', kind: 'chat', sourceText: 'j', ts: 1 }); saveTr(); return JSON.parse(localStorage.getItem('tba_tr_room-1') || '[]').some((e) => e.id === 'journal-1'); });
  await j1.evaluate(() => sessionStorage.setItem('unstall', '1')); await j1.reload(); await j1.waitForFunction(() => window.TS && TS.mode !== 'loading', null, { timeout: 20000 }); await j1.waitForTimeout(300);
  R.journalNext = Object.assign(await st(j1), { has: await j1.evaluate(() => loadTr('room-1').some((e) => e.id === 'journal-1')) });
  /* S12: READY on a 5 MB / 15-room store */
  const big = { 'tba_rooms': JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ id: 'big-' + i, role: 'creator', title: 'B' + i, partnerName: 'P', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0 }))), 'tba_user': JSON.stringify(USER) };
  for (let i = 0; i < 15; i++) big['tba_tr_big-' + i] = JSON.stringify(Array.from({ length: 1100 }, (_, k) => ({ id: 'x' + i + '-' + k, kind: 'chat', who: 'me', sourceText: 'message number ' + k + ' with some ordinary length text in it', translatedText: 'ข้อความ ' + k + ' ที่มีความยาวปกติ', srcLang: 'en', tgtLang: 'th', ts: k, senderName: 'Ann', origin: 'typed' })));
  const bc = await ctxWith({ seed: big }); const b1 = await open(bc); R.big = await st(b1);
  await b1.reload(); await b1.waitForFunction(() => window.TS && TS.mode !== 'loading'); R.bigWarm = await st(b1);
} catch (e) { R.harnessError = (e && e.stack || String(e)).slice(0, 600); }
await browser.close(); server.close();

const ev = (s, name) => (s && s.logs || []).filter((l) => l.ev === name);
T('S0 the run completed; no page error', () => { ok(!R.harnessError, R.harnessError); ok((R.err1 || []).length === 0 && (R.err2 || []).length === 0, JSON.stringify([R.err1, R.err2])); });
T('S1 FIRST START: the chats move — mode idb; both rooms in the store equal to the old copies (the same id twice: both kept; two identical entries without an id: both kept); the old keys removed; the broken key KEPT; tba_rooms and tba_user untouched; logged', () => {
  const f = R.first; ok(f.mode === 'idb', 'mode ' + f.mode); ok(f.r1 === JSON.stringify(R1) && f.r2 === JSON.stringify(R2), 'not equal: ' + f.n1 + '/' + f.n2);
  ok(f.keys.indexOf('tba_tr_room-1') < 0 && f.keys.indexOf('tba_tr_room-2') < 0, 'old keys left ' + f.keys.join(',')); ok(f.broken === '{"broken":', 'the broken key ' + f.broken);
  ok(f.rooms === SEED.tba_rooms && f.user === SEED.tba_user, 'rooms/user touched'); const a = ev(f, 'ts_absorbed').filter((x) => x.d && x.d.rooms != null)[0]; ok(a && a.d.rooms === 2 && a.d.removed === 2 && a.d.broken === 1, JSON.stringify(a)); ok(ev(f, 'ts_ready').length === 1, 'ts_ready');
});
T('S2 the app starts ONCE, after the chats are in (its boot line follows ts_ready); a room opens with its history; the active transcript IS the mirror', () => { ok(ev(R.first, 'boot').length === 1, 'boot ' + ev(R.first, 'boot').length); const L = R.first.logs.map((l) => l.ev); ok(L.indexOf('boot') > L.indexOf('ts_ready') && L.indexOf('ts_ready') >= 0, 'boot before the chats: ' + L.join(',')); ok(R.rows.mirror, 'transcript is not the mirror'); ok(R.rows.shown >= 50, 'shown ' + R.rows.shown); });
T('S3 EACH SAVE WRITES ONLY WHAT CHANGED: a send = 1 add; a receipt = 1 write; a translation fill = 1 write; a delete = 1 delete and 0 writes; a missed-call pill to a background room = 1 add; an entry holding a function = 1 add (stored as JSON)', () => { const r = R.rows;
  ok(r.send.adds === 1 && r.send.writes === 0 && r.send.deletes === 0, 'send ' + JSON.stringify(r.send)); ok(r.receipt.writes === 1 && r.receipt.adds === 0, 'receipt ' + JSON.stringify(r.receipt)); ok(r.fill.writes === 1 && r.fill.adds === 0, 'fill ' + JSON.stringify(r.fill));
  ok(r.del.deletes === 1 && r.del.writes === 0 && r.del.adds === 0, 'delete ' + JSON.stringify(r.del)); ok(r.bg.adds === 1 && r.bg.writes === 0, 'bg ' + JSON.stringify(r.bg)); ok(r.fn.adds === 1, 'fn ' + JSON.stringify(r.fn)); });
T('S4 a reload shows the same chats (the sends, the receipt, the fill, the delete, the pill), nothing doubled; nothing back in localStorage', () => { const r = JSON.parse(R.reload.r1), r2 = JSON.parse(R.reload.r2);
  ok(R.reload.n1 === R.rows.afterSends.n1 && R.reload.n2 === R.rows.afterSends.n2, 'counts ' + [R.reload.n1, R.rows.afterSends.n1, R.reload.n2, R.rows.afterSends.n2]); ok(r.find((e) => e.id === 'm10').readAt === 123 && r.find((e) => e.id === 'm11').translatedText === 'filled' && !r.some((e) => e.id === 'm12') && r.some((e) => e.id === 'new-1') && r2.some((e) => e.id === 'pill-x'), 'content');
  ok(r.find((e) => e.id === 'fn-1') && !('cb' in r.find((e) => e.id === 'fn-1')), 'the function entry'); ok(R.reload.keys.filter((k) => /^tba_tr_room-[12]$/.test(k)).length === 0, 'keys ' + R.reload.keys.join(',')); });
T('S5 A MESSAGE DURING THE HOLD on an already-moved store (the early read is a temporary array) merges in BY ID — every earlier message still there; the next start absorbs the old-key copy the hold wrote and removes it', () => { const h = R.hold;
  ok(h.holdMode === 'loading', 'not in the hold: ' + h.holdMode); ok(h.has && h.n1 === h.before + 1, 'lost or doubled: ' + h.before + ' → ' + h.n1); ok(ev(h, 'ts_early_read').length >= 1, 'early read not logged'); ok(R.holdNext.keys.indexOf('tba_tr_room-1') < 0 && R.holdNext.n1 === h.n1, 'next start ' + R.holdNext.n1 + ' keys ' + R.holdNext.keys.join(',')); });
T('S6 an OLDER page\'s write to the old key after the move is absorbed at the next start, merged by id (nothing doubled), and the key removed', () => { const o = R.oldPage, r2 = JSON.parse(o.r2); ok(r2.some((e) => e.id === 'old-page-1') && r2.length === R.reload.n2 + 1, 'room-2 ' + r2.length); ok(o.keys.indexOf('tba_tr_room-2') < 0, 'key left'); });
T('S6b an older page writing the old key WHILE it is absorbed: the key is not removed under it (kept, with the new message); the next start absorbs it and removes it', () => { ok(R.race.kept && R.race.inStore, JSON.stringify(R.race)); ok(R.raceNext.has && R.raceNext.key === null, JSON.stringify(R.raceNext)); });
T('S7 TWO COPIES OPEN: each sees the other\'s message; the active array stays the mirror; both writing at once (20 each, interleaved) — all 40 in both copies and once each in the store, no flush failure', () => { ok(R.two1.has && R.two1.same, JSON.stringify(R.two1));
  for (const c of R.two2) { ok(c.ids === 41, 'ids in this copy ' + c.ids); ok(c.errs === 0, 'flush failures ' + c.errs); } ok(R.two2[0].n === R.two2[1].n, 'counts ' + R.two2.map((c) => c.n)); ok(R.two2rows.ids === 40 && R.two2rows.n === R.two2[0].n, 'store ' + JSON.stringify(R.two2rows)); });
T('S8 A FULL STORE (held to 3 MB): the write fails → storage_write_failed (store idb) and the storage-full toast; the room stays dirty; after room is made, what was saved before is all there', () => { const q = R.quota; ok(q.toast && q.logged && q.dirty, JSON.stringify(q)); ok(R.quotaAfter.n1 === q.n0, 'lost: ' + q.n0 + ' → ' + R.quotaAfter.n1); });
T('S9 NO IndexedDB → mode ls: today\'s app (the chats read from and saved to the old keys), logged', () => { ok(R.ls.mode === 'ls' && R.ls.n1 === R1.length && R.lsSave, JSON.stringify({ mode: R.ls.mode, n: R.ls.n1, save: R.lsSave })); ok(ev(R.ls, 'ts_fallback').length === 1, 'not logged'); });
T('S10 IndexedDB STALLED → after 10 s mode journal: the app starts (once), a save lands in the old key; the next start absorbs it', () => { ok(R.journal.mode === 'journal' && ev(R.journal, 'boot').length === 1, 'mode ' + R.journal.mode + ' boot ' + ev(R.journal, 'boot').length); ok(R.journalSave, 'the save did not land'); ok(R.journalNext.mode === 'idb' && R.journalNext.has, 'not absorbed: ' + R.journalNext.mode); });
T('S12 READY on a 5 MB / 15-room store: the first start (moving 16,500 messages) and a warm start, measured and logged', () => { const a = ev(R.big, 'ts_absorbed').filter((x) => x.d && x.d.rooms != null)[0], r1 = ev(R.big, 'ts_ready')[0], r2 = ev(R.bigWarm, 'ts_ready')[0];
  ok(a && a.d.rooms === 15 && a.d.removed === 15 && r1 && r1.d.msgs === 16500, JSON.stringify([a, r1])); ok(r2 && r2.d.ms < 3000, 'warm ' + JSON.stringify(r2)); if (!quiet) console.log('      first start ' + r1.d.ms + ' ms (absorb ' + a.d.ms + ' ms, ' + a.d.kb + ' KB) · warm start ' + r2.d.ms + ' ms'); });
console.log('\n30·pre-ship browser: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
