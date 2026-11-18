#!/usr/bin/env node
/* 30·ship browser gate — the seven fixes (§7.25) in REAL Chromium (Playwright, the machine's global install; TB_PLAYWRIGHT overrides)
   over a local http origin; the relay is never reached. The clock's zone is pinned (America/Los_Angeles). One phone, three rooms.
   Usage: node talkbridge/build/harness-30s-browser.mjs [--page <html>] [--quiet] */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2); const quiet = args.includes('--quiet');
const pageArg = args.indexOf('--page') >= 0 ? args[args.indexOf('--page') + 1] : (process.env.TB_30S_PAGE || null);
const STAGE = '/stuff/talkbridge-app/bridge-turn30-ship.html';
const html = fs.readFileSync(pageArg || path.join(root, 'talkbridge-app/bridge-turn30-ship.html'), 'utf8');
const CHROME = process.env.TB_CHROME || (() => { const base = '/opt/pw-browsers'; try { const d = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().pop(); if (d) return path.join(base, d, 'chrome-linux', 'chrome'); } catch (_) {} return undefined; })();
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
const T = async (n, f) => { try { await f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + ((e && e.message) || e)); } };
const ok = (c, m) => { if (!c) throw new Error(m); };

const ROOMS = [
  { id: 'room-1', role: 'creator', title: 'One', partnerName: 'Bo', myLang: 'en', theirLang: 'th', myName: 'Ann', joined: true, createdAt: 1, lastAt: 3, unread: 0 },
  { id: 'room-2', role: 'creator', title: 'Two', partnerName: 'Cy', myLang: 'en', theirLang: 'es', myName: 'Ann', joined: true, createdAt: 1, lastAt: 2, unread: 0, muted: true },
  { id: 'room-3', role: 'creator', title: 'Three', partnerName: 'Di', myLang: 'en', theirLang: 'ja', myName: 'Ann', joined: true, createdAt: 1, lastAt: 1, unread: 0 }];
const SEED = { 'tba_rooms': JSON.stringify(ROOMS), 'tba_user': JSON.stringify({ name: 'Ann', lang: 'en', langFrom: 'setting' }), 'tb_dev': 'aaaa1111-0000-4000-8000-000000000001' };
const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'America/Los_Angeles', locale: 'en-US' });
await ctx.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(ORIGIN)) return r.continue(); return r.fulfill({ status: 503, body: '' }); });
await ctx.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); sessionStorage.setItem('__seeded', '1'); } }, SEED);
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(URL0);
await p.waitForFunction(() => window.TS && TS.mode !== 'loading' && window.BL && BL.applied > 0, null, { timeout: 20000 });
await p.waitForTimeout(300);
const logs = (re) => p.evaluate((src) => (window.debugLog || []).filter((l) => new RegExp(src).test(l.ev)).map((l) => ({ ev: l.ev, d: l.d })), re.source);
const R = {};

/* BL-1 */
R.bl = await p.evaluate(async () => {
  const o = { stage: window.TB_STAGE, version: VERSION, info: BUILD_INFO };
  $('m-s13').classList.add('show'); await new Promise((r) => setTimeout(r, 50)); o.footer = ($('s13-build') || {}).textContent; $('m-s13').classList.remove('show');
  openS11(); o.keys = $('build-info').textContent; $('m-s11').classList.remove('show');
  return o;
});
await T('BL1 the build record is the stage\'s; VERSION and BUILD_INFO read it', () => ok(R.bl.stage.c === 'turn30-ship-c2' && R.bl.version === 'turn30-ship-c2' && R.bl.info.release === 'turn30-ship-c2' && R.bl.info.builtAt === R.bl.stage.at, JSON.stringify(R.bl)));
await T('BL2 the settings footer shows the stage after the old painter ran (not turn27)', () => ok(R.bl.footer === 'turn30-ship-c2 · built 2026-11-18', R.bl.footer));
await T('BL3 the keys sheet shows the stage and its build day (18, not the 17th)', () => ok(/^turn30-ship-c2 · built /.test(R.bl.keys) && /18/.test(R.bl.keys) && !/turn23/.test(R.bl.keys), R.bl.keys));

/* MC-1 */
R.mc = await p.evaluate(() => {
  openPanel();
  const c2 = document.querySelector('#left-panel .rc2[data-room="room-2"]'), c3 = document.querySelector('#left-panel .rc2[data-room="room-3"]');
  const o = { mutedX: c2 ? c2.querySelectorAll('[data-del]').length : -1, bellInName: !!(c2 && c2.querySelector('.rc2-name > .rc2-mute')), bellFirst: !!(c2 && c2.querySelector('.rc2-name').firstElementChild && c2.querySelector('.rc2-name').firstElementChild.classList.contains('rc2-mute')),
    corner: c2 ? c2.querySelectorAll('.rc2-bell').length : -1, plainMute: c3 ? c3.querySelectorAll('.rc2-mute').length : -1, plainX: c3 ? c3.querySelectorAll('[data-del]').length : -1,
    same: roomCardHtmlCore(roomById('room-3'), 'panel') === _mcCard(roomById('room-3'), 'panel'), aria: c2 && c2.querySelector('.rc2-mute') ? c2.querySelector('.rc2-mute').getAttribute('aria-hidden') : null };
  const x2 = c2 && c2.querySelector('[data-del]'); if (x2) x2.click(); o.deleted = !!roomById('room-2').deletedAt;
  const r2 = roomById('room-2'); delete r2.deletedAt; r2.sendLocked = false; saveRooms(); closePanel();
  return o;
});
await T('MC1 a muted room\'s card keeps its X; the bell is the first thing on its name line (aria-hidden); no corner bell', () => ok(R.mc.mutedX === 1 && R.mc.bellInName && R.mc.bellFirst && R.mc.corner === 0 && R.mc.aria === 'true', JSON.stringify(R.mc)));
await T('MC2 an unmuted card is the original\'s output, byte for byte, with its X and no bell', () => ok(R.mc.same && R.mc.plainMute === 0 && R.mc.plainX === 1, JSON.stringify(R.mc)));
await T('MC3 the X on a muted room\'s card deletes it (to the bin)', () => ok(R.mc.deleted, JSON.stringify(R.mc)));

/* CI-1 */
R.ci = await p.evaluate(() => {
  const cam = $('rb-cam'), mic = $('rb-mic'), d = (el, sel) => { const x = el && el.querySelector(sel); return x ? getComputedStyle(x).display : 'missing'; };
  cam.classList.add('off'); mic.classList.add('off');
  const o = { offBody: d(cam, '.cam-fill'), offSlash: d(cam, '.cam-slash'), micFill: d(mic, '.mic-fill') };
  cam.classList.remove('off'); mic.classList.remove('off'); o.onBody = d(cam, '.cam-fill'); o.onSlash = d(cam, '.cam-slash');
  return o;
});
await T('CI1 camera off: the body AND the slash are drawn; camera on: the body, no slash', () => ok(R.ci.offBody !== 'none' && R.ci.offBody !== 'missing' && R.ci.offSlash !== 'none' && R.ci.onBody !== 'none' && R.ci.onSlash === 'none', JSON.stringify(R.ci)));
await T('CI2 the microphone is untouched: off still hides its level fill', () => ok(R.ci.micFill === 'none' || R.ci.micFill === 'missing', JSON.stringify(R.ci)));

/* RL-1 */
R.rl = await p.evaluate(async () => {
  const sent = [], rec = []; let buzz = [];
  window._rlSend = function (room, m) { sent.push({ room: room, type: m.type, ids: m.ids }); return true; };
  window._rlReceipts = function () { rec.push(1); };
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: function (ms) { buzz.push(ms); return true; } });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const of = (room, type) => sent.filter((x) => x.room === room && x.type === type).length;
  enterRoom('room-3'); await wait(60); cr3State.attended = true; RL.lastBuzz = 0; RL.pending = {};
  const o = {};
  sent.length = 0; rec.length = 0;
  cr3Send('room-3', { type: 'ev-seen', ids: ['e1'] }); o.closedSeen = of('room-3', 'ev-seen');
  openPanel(); closePanel(); await wait(40); sent.length = 0;
  cr3Send('room-3', { type: 'ev-seen', ids: ['e0'] }); o.emptyRail = of('room-3', 'ev-seen') === 1 && !RL.pending['room-3'];
  openPanel(); sent.length = 0; rec.length = 0; buzz = [];
  o.ret = cr3Send('room-3', { type: 'ev-seen', ids: ['e2'] }); cr3Send('room-3', { type: 'ev-seen', ids: ['e3'] });
  cr3Send('room-3', { type: 'ev-open' }); cr3Send('room-1', { type: 'ev-seen', ids: ['o1'] }); sendReadReceipts();
  o.held = of('room-3', 'ev-seen'); o.sync = of('room-3', 'events-sync'); o.openWhile = of('room-3', 'ev-open'); o.other = of('room-1', 'ev-seen'); o.recWhile = rec.length; o.buzz = buzz.slice();
  o.pending = !!RL.pending['room-3'];
  sent.length = 0; rec.length = 0;
  $('left-scrim').click(); await wait(60);
  o.afterClose = { open: of('room-3', 'ev-open'), rec: rec.length, panel: S.panelOpen, pending: !!RL.pending['room-3'] };
  buzz = []; cr3Send('room-3', { type: 'ev-seen', ids: ['e4'] }); sendReadReceipts(); cr3Send('room-3', { type: 'ev-open' });
  o.closedPending = { seen: of('room-3', 'ev-seen'), open: of('room-3', 'ev-open'), sync: of('room-3', 'events-sync'), rec: rec.length, buzz: buzz.length };
  /* the count from the relay's projection stays: on the rail card, and on the home card */
  cr3Apply('room-3', { proj: { chat: 3, voice: 0, video: 0 } }); openPanel();
  const rc = document.querySelector('#left-panel .rc2[data-room="room-3"] .rc2-n'); o.railCount = rc ? rc.textContent : null; closePanel(); await wait(40);
  exitToStart(); await wait(40); cr3Apply('room-3', { proj: { chat: 3, voice: 0, video: 0 } }); try { renderHome(); } catch (_) {}
  const hc = document.querySelector('.rc2[data-where="home"][data-room="room-3"] .rc2-n'); o.homeCount = hc ? hc.textContent : null; o.homeView = S.view;
  /* selected from home: the mark clears before the original, so its explicit open and the receipts are not held */
  sent.length = 0; rec.length = 0;
  const card = document.querySelector('.rc2[data-where="home"][data-room="room-3"]'); if (card) card.click(); await wait(60);
  o.homeSelect = { pending: !!RL.pending['room-3'], room: S.roomId, open: of('room-3', 'ev-open') + (cr3State.openPending['room-3'] ? 1 : 0) };
  sendReadReceipts(); o.homeSelect.rec = rec.length;
  /* selected while on screen (its rail card tapped): pending clears, the receipts go at once */
  openPanel(); cr3Send('room-3', { type: 'ev-seen', ids: ['e5'] }); closePanel(); await wait(40); rec.length = 0; sent.length = 0;
  o.beforeSelect = !!RL.pending['room-3'];
  openPanel(); const rcard = document.querySelector('#left-panel .rc2[data-room="room-3"]'); if (rcard) rcard.click(); await wait(60);
  o.railSelect = { pending: !!RL.pending['room-3'], rec: rec.length, open: of('room-3', 'ev-open') + (cr3State.openPending['room-3'] ? 1 : 0), panel: S.panelOpen };
  /* selected by a notification for the room on screen */
  openPanel(); cr3Send('room-3', { type: 'ev-seen', ids: ['e6'] }); closePanel(); await wait(40); rec.length = 0;
  cr3RouteEvent('room-3', 'e6', 'tap_warm'); await wait(40); o.routeSelect = { pending: !!RL.pending['room-3'], rec: rec.length };
  /* a projection while the rail is open marks it (a message that came while away) */
  openPanel(); RL.pending = {}; cr3Apply('room-3', { proj: { chat: 1, voice: 0, video: 0 } }); o.projMark = !!RL.pending['room-3']; closePanel(); await wait(40);
  RL.pending = {};
  /* closed by leaving the room: the old room stays pending and nothing is acknowledged for it */
  openPanel(); cr3Send('room-3', { type: 'ev-seen', ids: ['e7'] }); sent.length = 0; closePanel(); enterRoom('room-1'); await wait(60);
  o.leave = { open: of('room-3', 'ev-open'), pending: !!RL.pending['room-3'] };
  /* a muted room: held, but no buzz */
  RL.pending = {}; enterRoom('room-3'); await wait(40); roomById('room-3').muted = true; RL.lastBuzz = 0; buzz = []; openPanel(); cr3Send('room-3', { type: 'ev-seen', ids: ['m1'] }); o.mutedBuzz = buzz.length; roomById('room-3').muted = false; closePanel(); await wait(40);
  RL.pending = {}; cr3Apply('room-3', { proj: { chat: 0, voice: 0, video: 0 } });
  return o;
});
await T('RL1 rail closed: the room\'s ev-seen goes as today; a rail opened and closed with nothing arriving changes nothing', () => ok(R.rl.closedSeen === 1 && R.rl.emptyRail, JSON.stringify(R.rl)));
await T('RL2 rail open over the room: its ev-seen is held (twice) and the room marked pending, ev-open goes as events-sync, read receipts wait; another room\'s words pass', () => ok(R.rl.held === 0 && R.rl.ret === false && R.rl.pending && R.rl.sync === 1 && R.rl.openWhile === 0 && R.rl.recWhile === 0 && R.rl.other === 1, JSON.stringify(R.rl)));
await T('RL3 one 120 ms buzz for the arrivals (not one per message); none in a muted room', () => ok(R.rl.buzz.length === 1 && R.rl.buzz[0] === 120 && R.rl.mutedBuzz === 0, JSON.stringify(R.rl)));
await T('RL4 closing the rail acknowledges NOTHING; the room stays pending and keeps holding (rail closed: ev-seen, ev-open, receipts all held; no buzz)', () => ok(R.rl.afterClose.panel === false && R.rl.afterClose.open === 0 && R.rl.afterClose.rec === 0 && R.rl.afterClose.pending && R.rl.closedPending.seen === 0 && R.rl.closedPending.open === 0 && R.rl.closedPending.sync === 1 && R.rl.closedPending.rec === 0 && R.rl.closedPending.buzz === 0, JSON.stringify(R.rl)));
await T('RL5 the count stays: on the room\'s rail card and, at home, on the home card', () => ok(R.rl.railCount === '3' && R.rl.homeView !== 'room' && R.rl.homeCount === '3', JSON.stringify(R.rl)));
await T('RL6 SELECTED from home clears it: the room entered, its explicit open goes (or waits for the socket), the receipts are not held', () => ok(R.rl.homeSelect.pending === false && R.rl.homeSelect.room === 'room-3' && R.rl.homeSelect.open >= 1 && R.rl.homeSelect.rec >= 1, JSON.stringify(R.rl.homeSelect)));
await T('RL7 SELECTED by its rail card while on screen: pending clears and the receipts go at once (the read check)', () => ok(R.rl.beforeSelect && R.rl.railSelect.pending === false && R.rl.railSelect.rec >= 1 && R.rl.railSelect.open >= 1 && R.rl.railSelect.panel === false, JSON.stringify(R.rl.railSelect)));
await T('RL8 SELECTED by a notification for it: pending clears, the receipts go', () => ok(R.rl.routeSelect.pending === false && R.rl.routeSelect.rec >= 1, JSON.stringify(R.rl.routeSelect)));
await T('RL9 a projection showing the room waiting while the rail is open marks it pending (a message that came while away)', () => ok(R.rl.projMark, JSON.stringify(R.rl)));
await T('RL10 a rail closed by entering another room: the old room stays pending, nothing acknowledged for it', () => ok(R.rl.leave.open === 0 && R.rl.leave.pending, JSON.stringify(R.rl.leave)));

/* TN-1 */
R.tn = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const o = {};
  const r1 = roomById('room-1'), r2 = roomById('room-2'), t1 = r1.title, t2 = r2.title;
  r1.title = 'A very long room name for testing'; r2.title = '会议室名称非常非常长的房间'; saveRooms();
  o.cutLatin = tnCut(r1.title); o.cutCjk = tnCut(r2.title); o.fits = tnCut('Fourteen chars'); o.thai = tnCut('ห้องประชุมใหญ่มากๆ ของเรา');
  o.short = roomCardHtmlCore(roomById('room-3'), 'panel') === _tnCard(roomById('room-3'), 'panel');
  enterRoom('room-3'); await wait(40); openPanel();
  const c1 = document.querySelector('#left-panel .rc2[data-room="room-1"]'), c2 = document.querySelector('#left-panel .rc2[data-room="room-2"]');
  const nm = c1 && c1.querySelector('.rc2-nm'); o.span = nm ? nm.textContent : null; o.dir = nm ? nm.getAttribute('dir') : null;
  o.order2 = c2 ? Array.from(c2.querySelector('.rc2-name').children).map((x) => x.className) : [];
  if (nm) nm.click(); await wait(30); o.toast = $('toast').textContent; o.stayed = S.roomId; o.panel = S.panelOpen;
  const c3 = document.querySelector('#left-panel .rc2[data-room="room-3"] .rc2-name'); const c1b = document.querySelector('#left-panel .rc2[data-room="room-1"]');
  r1.title = t1; r2.title = t2; saveRooms(); closePanel(); await wait(30);
  openPanel(); const plain = document.querySelector('#left-panel .rc2[data-room="room-1"] .rc2-name'); if (plain) plain.click(); await wait(40); o.opened = S.roomId;
  closePanel(); enterRoom('room-3'); await wait(40);
  return o;
});
await T('TN1 a name over 14 units is cut at 13 and ends in "…" (Latin, CJK counted double, Thai not split); a name that fits is untouched', () => ok(R.tn.cutLatin === 'A very long r…' && R.tn.cutCjk === '会议室名称非…' && R.tn.fits === null && /…$/.test(R.tn.thai) && !/^[ัิ-ฺ็-๎]/.test(R.tn.thai.slice(-2)), JSON.stringify(R.tn)));
await T('TN2 the cut name is a span (dir=auto); the key and the bell sit directly before it; a card whose name fits is the original\'s output', () => ok(R.tn.span === 'A very long r…' && R.tn.dir === 'auto' && R.tn.order2.join(',') === 'rc2-mute,rc2-nm' && R.tn.short, JSON.stringify(R.tn)));
await T('TN3 a tap on a cut name shows the whole name and does not open the room; a tap on a name that fits opens it', () => ok(R.tn.toast === 'A very long room name for testing' && R.tn.stayed === 'room-3' && R.tn.panel === true && R.tn.opened === 'room-1', JSON.stringify(R.tn)));

/* RG-1 */
R.rg = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const closed = [];
  const fakeReg = { getNotifications: function (opt) { const all = [{ tag: 'tb-call-c-1', close: function () { closed.push(this.tag); } }, { tag: 'tb-other', close: function () { closed.push(this.tag); } }]; return Promise.resolve(opt && opt.tag ? all.filter((n) => n.tag === opt.tag) : all); } };
  try { Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { ready: Promise.resolve(fakeReg), addEventListener() {}, register() { return Promise.resolve(fakeReg); }, getRegistration() { return Promise.resolve(fakeReg); } } }); } catch (_) {}
  const reset = () => { try { clearTimeout(CALL.ringTimer); CALL.stopRing(); } catch (_) {} CALL.ringPending = null; $('ring-overlay').classList.remove('show'); };
  const ring = (id) => { CALL.onIncoming(roomById('room-3'), { type: 'call-start', kind: 'video', callId: id, name: 'Di' }); return !!CALL.ringPending; };
  enterRoom('room-3'); await wait(40); reset();
  const o = {};
  document.hasFocus = () => true; cr3State.attended = false; window.debugLog && (window.debugLog.length = 0);
  o.healRing = ring('c-1'); o.shown = $('ring-overlay').classList.contains('show'); await wait(80); o.closed = closed.slice(); reset();
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); cr3State.attended = false; o.hiddenRing = ring('c-2'); delete document.hidden; reset();
  document.hasFocus = () => false; cr3State.attended = false; o.blurRing = ring('c-3'); reset();
  document.hasFocus = () => true; cr3State.attended = true;
  openPanel(); $('drawer-s4b').classList.add('open'); $('m-s13').classList.add('show');
  o.menuRing = ring('c-4'); o.rail = S.panelOpen; o.drawer = $('drawer-s4b').classList.contains('open'); o.modal = $('m-s13').classList.contains('show'); reset();
  cr3State.attended = false; document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); o.inputHeal = cr3State.attended;
  return o;
});
R.rgLogs = await logs(/^rg_/);
await T('RG1 the flag stale (false) while the page is visible and focused: the ring screen presents; the check logged the UN-healed flag, then the heal', () => {
  const chk = R.rgLogs.find((l) => l.ev === 'rg_ring_check' && l.d.callId === 'c-1');
  ok(R.rg.healRing && R.rg.shown && chk && chk.d.flag === false && R.rgLogs.some((l) => l.ev === 'rg_healed' && l.d.why === 'ring_heal'), JSON.stringify(R.rg) + JSON.stringify(R.rgLogs.slice(0, 4)));
});
await T('RG2 the OS call card for that call is closed (by its tag only)', () => ok(R.rg.closed.length >= 1 && R.rg.closed.every((t) => t === 'tb-call-c-1'), JSON.stringify(R.rg.closed)));
await T('RG3 hidden: still deferred; not focused: still deferred (G23 unchanged)', () => ok(R.rg.hiddenRing === false && R.rg.blurRing === false, JSON.stringify(R.rg)));
await T('RG4 the ring closes the rail, the Customize drawer and an open sheet', () => ok(R.rg.menuRing && R.rg.rail === false && R.rg.drawer === false && R.rg.modal === false, JSON.stringify(R.rg)));
await T('RG5 a touch while the flag is false sets it (a touch is attention)', () => ok(R.rg.inputHeal === true, JSON.stringify(R.rg)));

/* RT-1 */
R.rt = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  enterRoom('room-3'); await wait(40);
  const hung = []; const _h = CALL.hangUp; CALL.hangUp = function () { hung.push(1); };
  const o = {};
  CALL.active = true; cr3RouteEvent('room-1', 'e1', 'tap_warm'); o.activeRoom = S.roomId; o.activeHung = hung.length;
  cr3RouteEvent('room-3', 'e2', 'tap_warm'); o.sameRoom = S.roomId; o.sameHung = hung.length;
  CALL.active = false; CALL._starting = true; cr3RouteEvent('room-1', 'e3', 'tap_warm'); o.startRoom = S.roomId; CALL._starting = false;
  CALL.hangUp = _h;
  cr3RouteEvent('room-1', 'e4', 'tap_warm'); await wait(40); o.freeRoom = S.roomId;
  return o;
});
R.rtLogs = await logs(/^rt_held$/);
await T('RT1 in a call, a tap for another room: still in the call\'s room, no hang-up, rt_held', () => ok(R.rt.activeRoom === 'room-3' && R.rt.activeHung === 0 && R.rtLogs.length >= 1, JSON.stringify(R.rt)));
await T('RT2 while a call is being started/accepted (_starting): held the same way', () => ok(R.rt.startRoom === 'room-3' && R.rtLogs.length >= 2, JSON.stringify(R.rt)));
await T('RT3 a tap for the call\'s own room, and a tap with no call: the original (no hang-up; enters the room)', () => ok(R.rt.sameRoom === 'room-3' && R.rt.sameHung === 0 && R.rt.freeRoom === 'room-1', JSON.stringify(R.rt)));

/* GK-1 */
R.gk = await p.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const o = {};
  const r1 = roomById('room-1'), r2 = roomById('room-2');
  const now = new Date(2026, 10, 16, 12, 0, 0).getTime(), end = new Date(2026, 11, 16, 23, 59, 59).getTime();
  r1.grant = true; r1.grantExpires = end; r2.grant = true; r2.grantExpires = end; saveRooms();
  o.en = gkText(r1, now); o.one = gkText({ grantExpires: now + 43200000 }, now); o.ended = gkText({ grantExpires: now - 1 }, now);
  const lang = S.user.lang; S.user.lang = 'th'; o.th = gkText(r1, now); S.user.lang = lang;
  o.keys = LANG_ORDER.filter((l) => !(L10N[l] && L10N[l].gk_until && L10N[l].gk_until_1 && L10N[l].gk_ended && GK_L10N[l]));
  enterRoom('room-3'); await wait(40); openPanel();
  const c1 = document.querySelector('#left-panel .rc2[data-room="room-1"]'), c2 = document.querySelector('#left-panel .rc2[data-room="room-2"]'), c3 = document.querySelector('#left-panel .rc2[data-room="room-3"]');
  o.k1 = c1 ? c1.querySelectorAll('.rc2-key').length : -1; o.k3 = c3 ? c3.querySelectorAll('.rc2-key').length : -1;
  const n2 = c2 && c2.querySelector('.rc2-name'); o.order = n2 ? Array.from(n2.children).map((x) => x.className) : [];
  c1.querySelector('.rc2-key').click(); await wait(30);
  o.toast = $('toast').textContent; o.toastOn = $('toast').classList.contains('show'); o.stayed = S.roomId; o.panel = S.panelOpen;
  closePanel(); delete r1.grant; delete r1.grantExpires; delete r2.grant; delete r2.grantExpires; saveRooms();
  return o;
});
await T('GK1 a granted room\'s card shows the key (first on its name line, before a muted room\'s bell); an ungranted room none', () => ok(R.gk.k1 === 1 && R.gk.k3 === 0 && R.gk.order[0] === 'rc2-key' && R.gk.order[1] === 'rc2-mute', JSON.stringify(R.gk)));
await T('GK2 the toast: end date and whole days left (rounded up), singular for 1, "ended" after the date', () => ok(R.gk.en === 'Initiator status · until Dec 16, 2026 · 31 days left' && R.gk.one === 'Initiator status · until Nov 17, 2026 · 1 day left' && /^Initiator status · ended Nov 16, 2026$/.test(R.gk.ended), JSON.stringify([R.gk.en, R.gk.one, R.gk.ended])));
await T('GK3 in Thai: the Thai words and the Buddhist year', () => ok(/^สถานะผู้ริเริ่ม · ถึง .*2569 · เหลือ 31 วัน$/.test(R.gk.th), R.gk.th));
await T('GK4 all three strings in every one of the 21 languages', () => ok(R.gk.keys.length === 0, R.gk.keys.join(',')));
await T('GK5 a tap on the key shows the toast and does NOT open that room (the rail stays, the room on screen stays)', () => ok(R.gk.toastOn && /^Initiator status · until /.test(R.gk.toast) && R.gk.stayed === 'room-3' && R.gk.panel === true, JSON.stringify(R.gk)));

await T('X no uncaught page error in the whole run', () => ok(errs.length === 0, errs.join(' | ').slice(0, 600)));
await browser.close(); server.close();
console.log('\n30·ship browser: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
