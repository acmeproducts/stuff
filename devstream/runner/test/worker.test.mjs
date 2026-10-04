/* the Worker + Durable Object shell, driven with a fake Cloudflare state (routing, auth, start/status/stop, restart safety) */
import worker, { Runner } from '../worker.js';
import { b64enc, b64dec, msgSig } from '../core.js';

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } };

const fs = new Map(); let sn = 1;
const GOOD = '<!doctype html><html><body><script>\nfunction a(){return 1}\nconsole.log(a())</script><p>' + 'x'.repeat(100) + '</p></body></html>';
const ts = '2026-10-04T10:00:00.000Z', um = { role: 'user', ts, text: 'go', status: 'pending' };
const put = (p, c) => fs.set(p, { content: c, sha: 's' + (sn++) });
put('devstream/devstream-status.json', JSON.stringify({ threads: { 'p/app.html': { project: 'p', file: 'app.html', state: 'executing', heartbeat: ts } }, projects: { p: {} } }));
put('devstream/threads/p__app.html.json', JSON.stringify({ messages: [um] }));
put('plan.md', '# plan\n'); put('app.html', GOOD);

let aiHold = null;
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); const res = (o, s = 200) => new Response(typeof o === 'string' ? o : JSON.stringify(o), { status: s });
  if (/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url)) return res({ permissions: { push: !/bad/.test(opts.headers.Authorization) } });
  const cm = url.match(/contents\/([^?]+)/);
  if (cm) {
    const p = decodeURIComponent(cm[1]);
    if (!opts.method || opts.method === 'GET') { const f = fs.get(p); return f ? res({ content: b64enc(f.content), sha: f.sha, size: f.content.length }) : res({}, 404); }
    const b = JSON.parse(opts.body), f = fs.get(p); if (f && f.sha !== b.sha) return res({ message: 'conflict' }, 409);
    put(p, b64dec(b.content)); return res({ content: { sha: fs.get(p).sha }, commit: { sha: 'c' + fs.get(p).sha } });
  }
  if (/venice\.ai/.test(url)) {
    if (aiHold) await aiHold;
    const enc = new TextEncoder(), t = 'SUMMARY: done\nTARGET: app.html\n' + GOOD.replace('console.log(a())', 'console.log(a()+1)');
    return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: t } }] }) + '\n\ndata: [DONE]\n\n')); c.close(); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }
  return res('?', 500);
};

/* fake DO runtime */
const stores = new Map(), alarms = new Map();
let env;
function makeStub(name) {
  if (!stores.has(name)) { const m = new Map(); stores.set(name, { m, state: { storage: { get: async k => m.get(k), put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); }, setAlarm: async t => { alarms.set(name, t); } } } }); }
  const s = stores.get(name); if (!s.obj) s.obj = new Runner(s.state, env);
  return { fetch: (u, o) => s.obj.fetch(new Request(u, o)) };
}
env = { ALLOWED_OWNER: 'acmeproducts', RUNNER: { idFromName: n => n, get: id => makeStub(id) } };
const call = (path, { method = 'GET', body, token = 'ghp_ok', origin = 'https://acmeproducts.github.io' } = {}) =>
  worker.fetch(new Request('https://runner.example' + path, { method, headers: { Origin: origin, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }), env);

const cfg = { owner: 'acmeproducts', repo: 'stuff', branch: 'main', pat: 'ghp_ok', vkey: 'vk-secret', vmodel: 'm' };
const jobBody = () => ({ key: 'p/app.html', cfg, job: { codeFile: 'app.html', planFile: 'plan.md', images: [], ghRefs: [], system: 's', history: [], instr: 'go', chain: ['venice'], budgetMs: 30000, threadEngine: 'venice' }, post: { threadPath: 'devstream/threads/p__app.html.json', sotPath: 'devstream/devstream-status.json', project: 'p', tab: 'app', pendSigs: [msgSig(um)], pendTexts: ['go'] } });

(async () => {
  let r = await call('/health'); ok('health answers with version', (await r.json()).v === 'b70');
  r = await call('/health', { origin: 'https://evil.example' }); ok('cors never echoes another origin', r.headers.get('Access-Control-Allow-Origin') === 'https://acmeproducts.github.io');
  r = await call('/run', { method: 'POST', body: { ...jobBody(), cfg: { ...cfg, pat: 'bad' } } }); ok('B68-3 run refused for a token without push', r.status === 403, r.status);
  r = await call('/run', { method: 'POST', body: { ...jobBody(), cfg: { ...cfg, owner: 'someoneelse' } } }); ok('B68-3 run refused for another owner', r.status === 403);
  r = await call('/run', { method: 'POST', body: { ...jobBody(), cfg: { ...cfg, repo: '../evil' } } }); ok('B68-3 odd repo names refused', r.status === 400);
  r = await call('/status?owner=acmeproducts&repo=stuff&key=p/app.html', { token: 'bad' }); ok('B68-3 status refused without access', r.status === 403);
  ok('nothing was started by refused calls', alarms.size === 0);

  r = await call('/run', { method: 'POST', body: jobBody() }); ok('run accepted (202)', r.status === 202, r.status);
  ok('alarm scheduled', alarms.size === 1);
  r = await call('/run', { method: 'POST', body: jobBody() }); ok('second start while running is refused', r.status === 409);
  const name = [...stores.keys()][0], obj = stores.get(name).obj;
  r = await call('/status?owner=acmeproducts&repo=stuff&key=p/app.html'); let st = await r.json(); ok('status says running', st.state === 'running', st);
  await obj.alarm();
  r = await call('/status?owner=acmeproducts&repo=stuff&key=p/app.html'); st = await r.json();
  ok('B68-1 status says done with result', st.state === 'done' && st.result && st.result.ok, st);
  const th = JSON.parse(fs.get('devstream/threads/p__app.html.json').content), sot = JSON.parse(fs.get('devstream/devstream-status.json').content);
  ok('B68-1 thread and status written by the runner', th.messages[0].status === 'done' && th.messages.length === 2 && sot.threads['p/app.html'].state === 'ok');
  ok('the job request is not kept after the job', !stores.get(name).m.has('req'));
  ok('status never contains the token or keys', !JSON.stringify(st).includes('ghp_ok') && !JSON.stringify(st).includes('vk-secret'));
  ok('keys are not kept in storage after the job', ![...stores.get(name).m.values()].some(v => JSON.stringify(v || '').includes('vk-secret') || JSON.stringify(v || '').includes('ghp_ok')));

  /* stop */
  th.messages[0].status = 'pending'; th.messages.pop(); put('devstream/threads/p__app.html.json', JSON.stringify(th));
  const s2 = JSON.parse(fs.get('devstream/devstream-status.json').content); s2.threads['p/app.html'].state = 'executing'; put('devstream/devstream-status.json', JSON.stringify(s2));
  let release; aiHold = new Promise(res => { release = res; });
  await call('/run', { method: 'POST', body: jobBody() });
  const running = obj.alarm();
  await new Promise(r => setTimeout(r, 60));
  r = await call('/stop', { method: 'POST', body: jobBody() }); ok('stop accepted', r.status === 200);
  release(); aiHold = null; await running;
  r = await call('/status?owner=acmeproducts&repo=stuff&key=p/app.html'); st = await r.json();
  const th2 = JSON.parse(fs.get('devstream/threads/p__app.html.json').content);
  ok('B68-4 stopped through the Worker: message queued, interrupted', st.result && st.result.interrupted && th2.messages[0].status === 'pending' && th2.messages.length === 1, { st, th2 });

  /* restart safety: a re-delivered alarm must not run the job twice */
  await call('/run', { method: 'POST', body: jobBody() });
  stores.get(name).m.set('begun', true);
  const before = fs.get('app.html').sha;
  await obj.alarm();
  r = await call('/status?owner=acmeproducts&repo=stuff&key=p/app.html'); st = await r.json();
  ok('redelivered alarm after restart does not re-run, reports it', st.result && !st.result.ok && /restarted/.test(st.result.error) && fs.get('app.html').sha === before, st);
  globalThis.fetch = realFetch;
  console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
