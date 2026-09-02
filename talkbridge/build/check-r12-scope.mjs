// R12 scope-migration acceptance gate (plan v20.14.0)
import { readFileSync } from 'fs';
let fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
const man = JSON.parse(readFileSync('talkbridge/tb-manifest.webmanifest', 'utf8'));
ok(man.scope === '/stuff/talkbridge/', 'manifest scope is /stuff/talkbridge/');
ok(man.start_url === '/stuff/talkbridge/bridge-turn24-post-ship.html', 'manifest start_url under /stuff/talkbridge/');
ok(man.id === '/stuff/bridge-turn24-post-ship.html', 'manifest id preserves legacy install identity');
const rootMan = readFileSync('tb-manifest.webmanifest', 'utf8');
ok(rootMan === readFileSync('talkbridge/tb-manifest.webmanifest', 'utf8'), 'root manifest byte-identical (legacy update path)');
const app = readFileSync('talkbridge/bridge-turn24-post-ship.html', 'utf8');
ok(app.includes("register('./tb-sw.js', { scope: '/stuff/talkbridge/' })"), 'SW registered with explicit /stuff/talkbridge/ scope');
ok(app.includes('SCOPE MIGRATION'), 'migration block present');
const swSame = readFileSync('tb-sw.js') .equals ? false : true;
import('crypto').then(() => {});
const crypto = await import('crypto');
const h = f => crypto.createHash('sha256').update(readFileSync(f)).digest('hex');
ok(h('tb-sw.js') === h('talkbridge/tb-sw.js'), 'SW bytes identical root vs scoped (assembled artifact untouched)');
const stub = readFileSync('bridge-turn24-post-ship.html', 'utf8');
ok(stub.includes("location.replace('/stuff/talkbridge/bridge-turn24-post-ship.html'"), 'root stub forwards to canonical URL');
ok(!/serviceWorker\.register/.test(stub), 'root stub registers no worker');
for (const gone of ['manifest.json','manifest.webmanifest','talk.webmanifest','testpwa.webmanifest']) {
  let exists = true; try { readFileSync(gone); } catch { exists = false; }
  ok(!exists, 'retired root manifest absent: ' + gone);
}
// Behavioral: migration retires ONLY exact-scope+script legacy workers, unsubscribe fires before unregister, new sub awaited
const mig = app.slice(app.indexOf('/* SCOPE MIGRATION'), app.lastIndexOf('})();') + 5);
const events = [];
function mkReg(scope, script, sub) {
  return { scope, active: { scriptURL: script },
    pushManager: { getSubscription: () => Promise.resolve(sub ? { unsubscribe: () => { events.push('unsub:' + scope + '|' + script); return Promise.resolve(true); } } : null) },
    unregister: () => { events.push('unreg:' + scope + '|' + script); return Promise.resolve(true); } };
}
const O = 'https://acmeproducts.github.io';
const newReg = { scope: O + '/stuff/talkbridge/', pushManager: { getSubscription: () => Promise.resolve({ endpoint: 'new' }) } };
const regs = [
  newReg,
  mkReg(O + '/stuff/', O + '/stuff/tb-sw.js', true),          // legacy push worker -> retire
  mkReg(O + '/stuff/', O + '/stuff/sw.js', false),            // legacy cache worker -> retire
  mkReg(O + '/stuff/prism/', O + '/stuff/prism/sw.js', true), // NOT ours -> untouched
  mkReg(O + '/stuff/', O + '/stuff/other-app-sw.js', true),   // same scope, foreign script -> untouched
];
global.location = { origin: O };
global.window = { Notification: { permission: 'granted' } };
global.Notification = { permission: 'granted' };
Object.defineProperty(global, 'navigator', { value: { serviceWorker: { ready: Promise.resolve(newReg), getRegistrations: () => Promise.resolve(regs) } }, configurable: true });
await eval('(async () => { ' + mig.replace('(function () {', 'await (async function () {').replace(/\}\)\(\);$/, '})();') + ' })()');
await new Promise(r => setTimeout(r, 50));
ok(events.includes('unsub:' + O + '/stuff/|' + O + '/stuff/tb-sw.js'), 'legacy push subscription unsubscribed');
ok(events.indexOf('unsub:' + O + '/stuff/|' + O + '/stuff/tb-sw.js') < events.indexOf('unreg:' + O + '/stuff/|' + O + '/stuff/tb-sw.js'), 'unsubscribe fires BEFORE unregister');
ok(events.includes('unreg:' + O + '/stuff/|' + O + '/stuff/sw.js'), 'legacy cache worker unregistered');
ok(!events.some(e => e.includes('prism')), 'PRISM worker untouched');
ok(!events.some(e => e.includes('other-app')), 'foreign same-scope worker untouched');
console.log(fail === 0 ? 'ALL GATES GREEN (' + events.length + ' effects asserted)' : fail + ' GATE FAILURES');
process.exit(fail === 0 ? 0 : 1);
