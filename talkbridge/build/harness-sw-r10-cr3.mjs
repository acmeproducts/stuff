#!/usr/bin/env node
/* R10-CR3 service-worker gate (plan v20.12.0 §4.13.3, §4.11.4). Runs tb-sw.js
   in a worker-global shim with a real (in-memory) IndexedDB contract and
   drives push, app announcement and notification taps with two window
   clients: the install-step browser tab and the installed app.
   --mutations: plants defects into the worker source and requires red. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const SW_SOURCE = fs.readFileSync(path.join(root, 'tb-sw.js'), 'utf8');
const SCOPE = 'https://acmeproducts.github.io/stuff/';
const APP = SCOPE + 'bridge-turn24-post-ship.html';

/* ── minimal IndexedDB (async callbacks, transactions, cursors) ─────────── */
function fakeIndexedDB() {
  const dbs = {};
  const later = (fn) => setTimeout(fn, 0);
  function req(run) { const r = { onsuccess: null, onerror: null, result: undefined }; later(() => { try { r.result = run(); r.onsuccess && r.onsuccess({ target: r }); } catch (e) { r.error = e; r.onerror && r.onerror({ target: r }); } }); return r; }
  return { open(name) {
    const r = { onupgradeneeded: null, onsuccess: null, onerror: null, result: null };
    later(() => {
      const fresh = !dbs[name];
      const db = dbs[name] = dbs[name] || { stores: {} };
      const api = {
        objectStoreNames: { contains: (n) => !!db.stores[n] },
        createObjectStore(n, o) { db.stores[n] = { opts: o || {}, rows: new Map(), auto: 1 }; },
        transaction(n, mode) {
          const tx = { oncomplete: null, onerror: null, _pending: 0 };
          const done = () => { if (--tx._pending === 0) later(() => tx.oncomplete && tx.oncomplete()); };
          const wrap = (run) => { tx._pending += 1; return req(() => { const v = run(); done(); return v; }); };
          tx.objectStore = function (sn) { const st = db.stores[sn]; return {
            add(v) { return wrap(() => { st.rows.set(st.auto++, JSON.parse(JSON.stringify(v))); return true; }); },
            put(v) { return wrap(() => { st.rows.set(v[st.opts.keyPath], JSON.parse(JSON.stringify(v))); return true; }); },
            get(k) { return wrap(() => st.rows.get(k)); },
            openCursor() { const keys = [...st.rows.keys()]; let i = 0; const r = { onsuccess: null }; const step = () => later(() => { if (i < keys.length) { const k = keys[i++]; r.result = { value: st.rows.get(k), delete() { st.rows.delete(k); }, continue: step }; } else r.result = null; r.onsuccess && r.onsuccess(); if (!r.result) done(); }); tx._pending += 1; step(); return r; }
          }; };
          return tx;
        }
      };
      r.result = api;
      if (fresh) { r.onupgradeneeded && r.onupgradeneeded({ target: r }); }
      r.onsuccess && r.onsuccess({ target: r });
    });
    return r;
  }, _dbs: dbs };
}

function makeWorker(source, store) {
  const listeners = {};
  const shown = [], opened = [];
  const clientsList = [];
  const self = {
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    skipWaiting: () => {},
    registration: { scope: SCOPE, showNotification: (title, opts) => { shown.push({ title, opts }); return Promise.resolve(); } },
    clients: { claim: () => Promise.resolve(), matchAll: () => Promise.resolve(clientsList.slice()), openWindow: (u) => { opened.push(u); return Promise.resolve(null); } },
    navigator: { userAgent: 'Android Chrome' },
    indexedDB: store || fakeIndexedDB()
  };
  const ctx = { self, indexedDB: self.indexedDB, setTimeout, clearTimeout, Promise, JSON, String, Array, Object, Date, encodeURIComponent, console };
  vm.runInNewContext(source, ctx, { filename: 'tb-sw.js' });
  const fire = async (type, ev) => { const waits = []; ev.waitUntil = (p) => waits.push(p); for (const fn of listeners[type] || []) fn(ev); await Promise.all(waits); await new Promise((r) => setTimeout(r, 30)); };
  const client = (id, extra) => Object.assign({ id, url: APP, focused: false, visibilityState: 'hidden', focus() { this.focusCalls = (this.focusCalls || 0) + 1; return Promise.resolve(this); }, postMessage(m) { (this.messages = this.messages || []).push(m); } }, extra || {});
  const journal = async () => { const db = self.indexedDB._dbs['tb-r10']; return db && db.stores.journal ? [...db.stores.journal.rows.values()].map((r) => r.ev) : []; };
  return { fire, shown, opened, clientsList, client, journal, store: self.indexedDB };
}

const PUSH = (ev) => ({ data: { json: () => ev } });
const CALL = { t: 'tb-ev', id: 'k1', room: 'room-1', kind: 'voice', callId: 'k1', name: 'Ana', ts: Date.now() };
const CHAT = { t: 'tb-ev', id: 'c1', room: 'room-1', kind: 'chat', callId: null, name: 'Ana', ts: Date.now() };

const results = [];
async function scenario(name, fn) {
  try { await fn(); results.push({ name, ok: true }); if (!QUIET) console.log('PASS  ' + name); }
  catch (e) { results.push({ name, ok: false, e }); console.log('FAIL  ' + name + '\n      ' + (e && e.message)); }
}
const QUIET = process.argv.includes('--quiet') || process.argv.includes('--mutations');

async function run(source) {
  results.length = 0;
  await scenario('W1 call push → one persistent, vibrating, audible alert from the encrypted identity, shown at once', async () => {
    const w = makeWorker(source);
    await w.fire('push', PUSH(CALL));
    assert.equal(w.shown.length, 1);
    const n = w.shown[0];
    assert.equal(n.opts.tag, 'tb-call-k1'); assert.equal(n.opts.requireInteraction, true); assert.ok(Array.isArray(n.opts.vibrate) && n.opts.vibrate.length >= 3); assert.equal(n.opts.silent, false);
    assert.equal(n.opts.data.eventId, 'k1'); assert.equal(n.opts.data.roomId, 'room-1'); assert.equal(n.opts.data.callId, 'k1');
    assert.ok(/Incoming voice call/.test(n.opts.body));
    const j = await w.journal(); assert.deepEqual(j, ['arrived', 'shown']);
  });
  await scenario('W2 chat push → one banner per room burst, not persistent', async () => {
    const w = makeWorker(source);
    await w.fire('push', PUSH(CHAT));
    assert.equal(w.shown.length, 1); assert.equal(w.shown[0].opts.tag, 'tb-room-1'); assert.notEqual(w.shown[0].opts.requireInteraction, true);
  });
  await scenario('W3 tap with an install-gate tab AND an announced app window → only the app is focused and told the event', async () => {
    const w = makeWorker(source);
    const tab = w.client('tab-1'), app = w.client('app-1');
    w.clientsList.push(tab, app);
    await w.fire('message', { data: { t: 'tb-app' }, source: { id: 'app-1' } });
    await w.fire('push', PUSH(CALL));
    await w.fire('notificationclick', { notification: { close() {}, data: w.shown[0].opts.data } });
    assert.equal(app.focusCalls, 1, 'the app window is focused once');
    assert.equal((app.messages || []).length, 1); assert.equal(app.messages[0].t, 'tb-open'); assert.equal(app.messages[0].eventId, 'k1');
    assert.equal(tab.focusCalls, undefined, 'the browser tab is never focused'); assert.equal(tab.messages, undefined, 'the browser tab is never messaged');
    assert.equal(w.opened.length, 0);
  });
  await scenario('W4 tap with only the install-gate tab alive → the tab is left alone; the app URL opens with the event hash', async () => {
    const w = makeWorker(source);
    const tab = w.client('tab-1'); w.clientsList.push(tab);
    await w.fire('push', PUSH(CALL));
    await w.fire('notificationclick', { notification: { close() {}, data: w.shown[0].opts.data } });
    assert.equal(tab.focusCalls, undefined); assert.equal(tab.messages, undefined);
    assert.deepEqual(w.opened, [APP + '#ev=room-1.k1']);
  });
  await scenario('W5 announced window gone (stale id) → open with hash, never a stranger', async () => {
    const w = makeWorker(source);
    await w.fire('message', { data: { t: 'tb-app' }, source: { id: 'app-old' } });
    const tab = w.client('tab-1'); w.clientsList.push(tab);
    await w.fire('push', PUSH(CHAT));
    await w.fire('notificationclick', { notification: { close() {}, data: w.shown[0].opts.data } });
    assert.equal(tab.focusCalls, undefined); assert.deepEqual(w.opened, [APP + '#ev=room-1.c1']);
  });
  await scenario('W6 the announcement survives a worker restart (durable on-device, not memory)', async () => {
    const w = makeWorker(source);
    await w.fire('message', { data: { t: 'tb-app' }, source: { id: 'app-1' } });
    const w2 = makeWorker(source, w.store);                       /* a fresh worker over the same device store */
    const tab = w2.client('tab-1'), app = w2.client('app-1'); w2.clientsList.push(tab, app);
    await w2.fire('push', PUSH(CALL));
    await w2.fire('notificationclick', { notification: { close() {}, data: w2.shown[0].opts.data } });
    assert.equal(app.focusCalls, 1); assert.equal(tab.focusCalls, undefined); assert.equal(w2.opened.length, 0);
  });
  await scenario('W7 malformed push still shows something (Apple revokes a silent worker)', async () => {
    const w = makeWorker(source);
    await w.fire('push', { data: null });
    assert.equal(w.shown.length, 1); assert.equal(w.shown[0].opts.tag, 'tb-fallback');
  });
  const bad = results.filter((r) => !r.ok).length;
  return { pass: results.length - bad, total: results.length, bad };
}

const SW_MUTATIONS = [
  ['focus-first-match · the tap focuses the first window at the app address (the install-step tab)', "    for (var i = 0; i < list.length; i++) { if (announced && list[i].id === announced.id) { app = list[i]; break; } }", "    for (var i = 0; i < list.length; i++) { if (String(list[i].url).indexOf(APP_FILE) >= 0) { app = list[i]; break; } }"],
  ['message-every-window · every window at the address is told the event', "        try { app.postMessage(msg); } catch (_) {}", "        list.forEach(function (c) { try { c.postMessage(msg); } catch (_) {} });"],
  ['tab-focused-fallback · with no announced window the first tab is focused instead of opening the app', "      return self.clients.openWindow(target + hash);", "      if (list.length) { return list[0].focus(); } return self.clients.openWindow(target + hash);"],
  ['call-alert-not-persistent · a call alert is a plain banner', "      if (isCall) { opts.requireInteraction = true; opts.vibrate = [300, 150, 300, 150, 300]; }", "      void isCall;"],
  ['announcement-forgotten · the announcement is kept in memory only', "  e.waitUntil(saveKv('appClient', { id: e.source.id, at: Date.now() }).then(function () { return journal('app_announced', {}); }));", "  self.__app = e.source.id;"]
];

if (process.argv.includes('--mutations')) {
  let bad = 0;
  for (const [name, find, replace] of SW_MUTATIONS) {
    if (!SW_SOURCE.includes(find)) { console.log('FAIL  worker · ' + name + '  — anchor missing'); bad += 1; continue; }
    const r = await run(SW_SOURCE.replace(find, replace));
    console.log((r.bad ? 'PASS' : 'FAIL') + '  worker · ' + name + (r.bad ? '  — harness went red as required' : '  — HARNESS STAYED GREEN WITH THE DEFECT PLANTED'));
    if (!r.bad) bad += 1;
  }
  console.log('worker mutations: ' + (SW_MUTATIONS.length - bad) + '/' + SW_MUTATIONS.length + ' planted defects caught');
  process.exit(bad ? 1 : 0);
} else {
  const r = await run(SW_SOURCE);
  console.log(`worker harness: ${r.pass}/${r.total} scenarios pass`);
  process.exit(r.bad ? 1 : 0);
}
