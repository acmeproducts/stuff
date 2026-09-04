#!/usr/bin/env node
import fs from 'fs'; import crypto from 'crypto'; import { JSDOM } from 'jsdom';
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

/* ---- D-2: the app claims only its own folder ---- */
const man = JSON.parse(fs.readFileSync('talkbridge/tb-manifest.webmanifest', 'utf8'));
ok(man.scope === '/stuff/talkbridge/', 'the manifest claims only /stuff/talkbridge/, so PRISM is not captured');
ok(!('start_url' in man), 'and carries NO start address, so an install from an invite keeps the invite (G25)');
const app = fs.readFileSync('talkbridge/bridge-turn25-pre-ship.html', 'utf8');
ok(/rel="manifest" href="tb-manifest\.webmanifest"/.test(app), 'the app links the manifest beside it, not the root one');
ok(app.includes("register('./tb-sw.js')"), "the worker is registered from this folder, so its scope is this folder");
ok(sha('tb-sw.js') === sha('talkbridge/tb-sw.js'), 'the worker is the accepted worker, byte for byte');
const stub = fs.readFileSync('bridge-turn25-pre-ship.html', 'utf8');
ok(stub.includes("location.replace('/stuff/talkbridge/bridge-turn25-pre-ship.html' + location.search + location.hash)"), 'the old address forwards with the invite intact');
ok(!/serviceWorker|rel="manifest"/.test(stub), 'and the forwarder registers no worker and links no manifest');
ok(sha('bridge-turn24-post-ship.html') === sha('bridge-turn25-pre-base.html'), 'the accepted release is untouched');

/* the migration retires only OUR old workers */
const _m0 = app.indexOf('/* N15 (D-2)');
const mig = app.slice(_m0, app.indexOf('\n\n/* N16', _m0));
const events = [];
const mk = (scope, script, sub) => ({ scope, active: { scriptURL: script },
  pushManager: { getSubscription: () => Promise.resolve(sub ? { unsubscribe: () => { events.push('unsub:' + script); return Promise.resolve(); } } : null) },
  unregister: () => { events.push('unreg:' + script); return Promise.resolve(true); } });
const O = 'https://acmeproducts.github.io';
const here = { scope: O + '/stuff/talkbridge/', pushManager: { getSubscription: () => Promise.resolve({ endpoint: 'x' }) } };
const regs = [here,
  mk(O + '/stuff/', O + '/stuff/tb-sw.js', true),
  mk(O + '/stuff/', O + '/stuff/sw.js', false),
  mk(O + '/stuff/prism/', O + '/stuff/prism/sw.js', true),
  mk(O + '/stuff/', O + '/stuff/someone-else.js', true)];
global.location = { origin: O };
global.window = { Notification: { permission: 'granted' } };
global.Notification = { permission: 'granted' };
global.log = () => {};
Object.defineProperty(global, 'navigator', { value: { serviceWorker: { ready: Promise.resolve(here), getRegistrations: () => Promise.resolve(regs) } }, configurable: true });
eval(mig);
await new Promise(r => setTimeout(r, 80));
ok(events.includes('unreg:' + O + '/stuff/tb-sw.js') && events.includes('unreg:' + O + '/stuff/sw.js'), 'the old root workers that were capturing /stuff/ are retired');
const ui = events.indexOf('unsub:' + O + '/stuff/tb-sw.js'), ri = events.indexOf('unreg:' + O + '/stuff/tb-sw.js');
ok(ui !== -1 && ri !== -1 && ui < ri, 'their push is released first, so no alert is lost mid-flight');
ok(!events.some(e => /prism|someone-else/.test(e)), "PRISM's worker and other apps' workers are never touched");

/* D-1 visibility was rolled back with the relay; nothing here claims it. */

console.log(fail === 0 ? 'D2 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
