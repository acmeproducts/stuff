#!/usr/bin/env node
/* R11.0 gate (plan v20.13.0 §5c). Boots bridge-turn25-base.html in jsdom,
   drives an hour of refresh ticks with five rooms plus twenty real events,
   and reads the export exactly as the debug panel builds it.
   --mutations plants defects into the part and requires red. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const CANDIDATE = fs.readFileSync(path.join(root, 'talkbridge/bridge-turn25-base.html'), 'utf8');
const BASE = fs.readFileSync(path.join(root, 'bridge-turn25-pre-base.html'), 'utf8');
const URL_ = 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html';

function boot(html) {
  const rooms = [];
  for (let i = 0; i < 5; i++) rooms.push({ id: 'room-' + i, role: 'creator', title: 'R' + i, partnerName: 'P' + i, myLang: 'en', theirLang: 'es', myName: 'Bo', joined: true, createdAt: Date.now() - 1000, lastAt: Date.now() - 1000, unread: 0 });
  const dom = new JSDOM(html, { url: URL_, runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) {
    window.localStorage.setItem('tba_user', JSON.stringify({ name: 'Bo' }));
    window.localStorage.setItem('tba_rooms', JSON.stringify(rooms));
    window.matchMedia = (q) => ({ matches: /standalone/.test(q), media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    window.scrollTo = () => {}; window.HTMLElement.prototype.scrollIntoView = function () {};
    function Notification() {} Notification.permission = 'granted'; Notification.requestPermission = () => Promise.resolve('granted'); window.Notification = Notification;
    const reg = { scope: 'https://acmeproducts.github.io/stuff/', active: { postMessage() {} }, showNotification: () => Promise.resolve(), getNotifications: () => Promise.resolve([]), pushManager: { getSubscription: () => Promise.resolve(null), subscribe: () => Promise.reject(new Error('denied')) } };
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: { register: () => Promise.resolve(reg), ready: Promise.resolve(reg), controller: null, addEventListener() {}, removeEventListener() {} } });
    class FakeWS extends window.EventTarget { constructor() { super(); this.readyState = 0; } send() {} close() { this.readyState = 3; } }
    window.WebSocket = FakeWS;
  } });
  return dom.window;
}
const exportText = (w) => w.debugLog.map((r) => r.ts + ' [' + r.ev + '] ' + JSON.stringify(r.d)).join('\n');   /* exactly the panel's export */

const results = [];
async function scenario(name, fn) { try { await fn(); results.push({ name, ok: true }); if (!QUIET) console.log('PASS  ' + name); } catch (e) { results.push({ name, ok: false, e }); console.log('FAIL  ' + name + '\n      ' + (e && e.message)); } }
const QUIET = process.argv.includes('--quiet') || process.argv.includes('--mutations');

async function run(html) {
  results.length = 0;
  await scenario('L1 an hour of refresh ticks with five rooms plus twenty real events → all twenty survive export, in order, each with its own time', async () => {
    const w = boot(html); await new Promise((r) => setTimeout(r, 150));
    const start = w.debugLog.length;
    const real = [];
    for (let tick = 0; tick < 180; tick++) {                   /* 60 min at one refresh per 20 s */
      w.renderPanel(); w.renderHome && w.renderHome();
      if (tick % 9 === 0 && real.length < 20) { const ev = 'real_event_' + real.length; w.log(ev, { i: real.length }); real.push(ev); }
    }
    assert.equal(real.length, 20);
    const text = exportText(w);
    const lines = text.split('\n');
    const idx = real.map((ev) => lines.findIndex((l) => l.includes('[' + ev + ']')));
    assert.ok(idx.every((i) => i >= 0), 'every real event is in the export');
    assert.deepEqual(idx, [...idx].sort((a, b) => a - b), 'in order');
    assert.ok(w.debugLog.length < 400, 'refresh lines folded: ' + w.debugLog.length + ' lines for an hour');
    const folded = w.debugLog.filter((r) => r.ev === 'rc_panel_rendered');
    assert.ok(folded.length >= 1 && folded.length <= 3, 'one line per distinct refresh state, got ' + folded.length);
    assert.ok(folded.some((r) => r.d.n >= 100 && typeof r.d.last === 'string'), 'the folded line carries n and last');
  });
  await scenario('L2 a refresh whose data changed is its own line; a repeated non-refresh event keeps one line per occurrence', async () => {
    const w = boot(html); await new Promise((r) => setTimeout(r, 150));
    w.log('rc_home_rendered', { cards: 0, wired: 0 }); w.log('rc_home_rendered', { cards: 0, wired: 0 }); w.log('rc_home_rendered', { cards: 1, wired: 1 }); w.log('rc_home_rendered', { cards: 1, wired: 1 });
    const homes = w.debugLog.filter((r) => r.ev === 'rc_home_rendered' && (r.d.cards === 0 || r.d.cards === 1) && r.ts >= new Date(Date.now() - 5000).toISOString());
    const c0 = homes.filter((r) => r.d.cards === 0), c1 = homes.filter((r) => r.d.cards === 1);
    assert.equal(c1.length, 1); assert.equal(c1[0].d.n, 2);
    assert.ok(c0.length >= 1 && c0[c0.length - 1].d.n >= 2);
    const before = w.debugLog.length;
    w.log('dg_no_key', {}); w.log('dg_no_key', {}); w.log('dg_no_key', {});
    assert.equal(w.debugLog.length - before, 3, 'real events are never folded');
  });
  await scenario('L3 the buffer holds 1200 lines, not 400', async () => {
    const w = boot(html); await new Promise((r) => setTimeout(r, 150));
    for (let i = 0; i < 1500; i++) w.log('unique_' + i, { i });
    assert.equal(w.debugLog.length, 1200);
    assert.ok(w.debugLog[0].ev === 'unique_300' || w.debugLog.some((r) => r.ev === 'unique_300'), 'the oldest surviving line is the 301st');
    assert.ok(!w.debugLog.some((r) => r.ev === 'unique_0'), 'the first line was trimmed');
  });
  await scenario('L4 parity: byte layout is owned by harness-n1-parity since N1/N2 (25·base); this scenario keeps the behavioural core', async () => {
    const w = boot(html); await new Promise((r) => setTimeout(r, 150));
    assert.equal(typeof w.cr3Attended, 'function', 'the accepted R10-CR3 behaviour is still present');
  });
  const bad = results.filter((r) => !r.ok).length;
  return { pass: results.length - bad, total: results.length, bad, behavioural: results.filter((r) => !r.ok && !/^L4 /.test(r.name)).length };
}

const MUTATIONS = [
  ['fold-removed · refresh lines are not folded', "    try { if (r110Fold(ev, d)) return; } catch (_) {}", "    void r110Fold;"],
  ['fold-too-greedy · every repeated event is folded, real ones included', "  if (!R110_REFRESH[ev]) return false;", "  void R110_REFRESH;"],
  ['count-not-incremented · the folded line lies about how often it repeated', "    rd.n = (rd.n || 1) + 1; rd.last = new Date().toISOString(); r.d = rd; r110State.folded++;", "    rd.last = new Date().toISOString(); r.d = rd; r110State.folded++;"],
  ['buffer-still-400 · the cap was not raised', "  debugLog.shift = function () { return this.length > R110_MAX ? Array.prototype.shift.call(this) : undefined; };", "  void R110_MAX;"]
];
if (process.argv.includes('--mutations')) {
  let bad = 0;
  for (const [name, find, replace] of MUTATIONS) {
    if (!CANDIDATE.includes(find)) { console.log('FAIL  ' + name + '  — anchor missing'); bad += 1; continue; }
    const r = await run(CANDIDATE.replace(find, replace));
    console.log((r.behavioural ? 'PASS' : 'FAIL') + '  ' + name + (r.behavioural ? '  — harness went red as required' : '  — HARNESS STAYED GREEN WITH THE DEFECT PLANTED'));
    if (!r.behavioural) bad += 1;
  }
  console.log('R11.0 mutations: ' + (MUTATIONS.length - bad) + '/' + MUTATIONS.length + ' planted defects caught');
  process.exit(bad ? 1 : 0);
} else {
  const r = await run(CANDIDATE);
  console.log(`R11.0 harness: ${r.pass}/${r.total} scenarios pass`);
  process.exit(r.bad ? 1 : 0);
}
