#!/usr/bin/env node
import fs from 'fs'; import crypto from 'crypto';
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
let fail = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const man = JSON.parse(fs.readFileSync('talkbridge/tb-manifest.webmanifest', 'utf8'));
ok(man.scope === '/stuff/talkbridge/', 'manifest scope is /stuff/talkbridge/');
ok(!('start_url' in man), 'NO start address — installs keep the grant-carrying invite URL (G25)');
ok(man.id === '/stuff/tb', 'deliberate stable app id');
const app = fs.readFileSync('talkbridge/bridge-turn25-base.html', 'utf8');
ok(app.includes("register('./tb-sw-25b.js', { scope: '/stuff/talkbridge/' })"), 'worker registered with explicit canonical scope');
ok(app.includes('n2_legacy_retired'), 'migration part present');
ok(sha('tb-sw-25b.js') === sha('talkbridge/tb-sw-25b.js'), 'worker bytes identical root vs canonical');
// rule 0c: accepted pair byte-untouched
ok(sha('bridge-turn24-post-ship.html') === sha('bridge-turn25-pre-base.html'), 'accepted app untouched');
const s13 = fs.readFileSync('tb-manifest.webmanifest', 'utf8');
ok(!s13.includes('start_url'), 'root manifest (accepted app link) untouched — no start address ever added');
const stub = fs.readFileSync('bridge-turn25-base.html', 'utf8');
ok(stub.includes("location.replace('/stuff/talkbridge/bridge-turn25-base.html' + location.search + location.hash)"), 'root forwards with query+hash intact');
ok(!/serviceWorker|rel="manifest"/.test(stub), 'root stub registers no worker, links no manifest');
ok(fs.readFileSync('talkbridge/worker-talk.js', 'utf8').includes("/stuff/talkbridge/bridge-turn25-base.html'"), 'declarative taps land on the canonical URL');
// behavioral migration mock
const mig = app.slice(app.indexOf('/* N2 ('), app.lastIndexOf('})();') + 5);
const events = [];
const mk = (scope, script, sub) => ({ scope, active: { scriptURL: script },
  pushManager: { getSubscription: () => Promise.resolve(sub ? { unsubscribe: () => { events.push('unsub:' + script) ; return Promise.resolve(true); } } : null) },
  unregister: () => { events.push('unreg:' + script); return Promise.resolve(true); } });
const O = 'https://acmeproducts.github.io';
const newReg = { scope: O + '/stuff/talkbridge/', pushManager: { getSubscription: () => Promise.resolve({ endpoint: 'new' }) } };
const regs = [ newReg,
  mk(O + '/stuff/', O + '/stuff/tb-sw-25b.js', true),
  mk(O + '/stuff/', O + '/stuff/tb-sw.js', true),
  mk(O + '/stuff/', O + '/stuff/sw.js', false),
  mk(O + '/stuff/prism/', O + '/stuff/prism/sw.js', true),
  mk(O + '/stuff/', O + '/stuff/other.js', true) ];
global.location = { origin: O };
global.window = { Notification: { permission: 'granted' } };
global.Notification = { permission: 'granted' };
Object.defineProperty(global, 'navigator', { value: { serviceWorker: { ready: Promise.resolve(newReg), getRegistrations: () => Promise.resolve(regs) } }, configurable: true });
eval(mig);
await new Promise(r => setTimeout(r, 80));
ok(events.includes('unreg:' + O + '/stuff/tb-sw-25b.js') && events.includes('unreg:' + O + '/stuff/tb-sw.js') && events.includes('unreg:' + O + '/stuff/sw.js'), 'all three legacy workers retired');
ok(events.indexOf('unsub:' + O + '/stuff/tb-sw.js') < events.indexOf('unreg:' + O + '/stuff/tb-sw.js'), 'unsubscribe fires BEFORE unregister');
ok(!events.some(e => e.includes('prism')) && !events.some(e => e.includes('other')), 'PRISM and foreign workers untouched');
console.log(fail === 0 ? 'N2 GREEN' : fail + ' FAILURES'); process.exit(fail ? 1 : 0);
