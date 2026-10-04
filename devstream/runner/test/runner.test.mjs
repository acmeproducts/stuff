import { runPipeline, verifyAccess, checkBuild, msgSig, b64enc, b64dec } from '../core.js';

let pass = 0, fail = 0;
const ok = (n, c, extra) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300)); } };

function mock({ files = {}, ai = [], hook } = {}) {
  const fs = new Map(); let sn = 1;
  const sha = () => 'sha' + (sn++);
  for (const [p, c] of Object.entries(files)) fs.set(p, { content: c, sha: sha() });
  const calls = { ai: [], puts: [] };
  const res = (obj, status = 200, headers = {}) => new Response(typeof obj === 'string' ? obj : JSON.stringify(obj), { status, headers });
  const fetchFn = async (url, opts = {}) => {
    url = String(url); const m = opts.method || 'GET';
    if (hook) { const h = await hook(url, opts, fs, sha); if (h) return h; }
    if (/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url)) return res({ permissions: { push: !/nopush/.test(opts.headers.Authorization) } });
    const cm = url.match(/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\/([^?]+)/);
    if (cm) {
      const path = decodeURIComponent(cm[1]);
      if (m === 'GET') {
        const f = fs.get(path); if (!f) return res({ message: 'Not Found' }, 404);
        if ((opts.headers.Accept || '').includes('raw')) return res(f.content);
        return res({ content: b64enc(f.content), sha: f.sha, size: f.content.length });
      }
      const b = JSON.parse(opts.body), f = fs.get(path);
      if (f && b.sha !== f.sha) return res({ message: path + ' does not match' }, 409);
      if (!f && b.sha) return res({ message: 'bad sha' }, 422);
      const n = { content: b64dec(b.content), sha: sha() }; fs.set(path, n); calls.puts.push(path);
      return res({ content: { sha: n.sha }, commit: { sha: 'c' + n.sha } });
    }
    if (/venice\.ai/.test(url)) {
      const body = JSON.parse(opts.body); calls.ai.push(body);
      const next = ai.shift(); if (next === undefined) return res({ error: { message: 'no more fake answers' } }, 500);
      if (typeof next === 'function') return next(opts);
      const enc = new TextEncoder(), text = next;
      const stream = new ReadableStream({ start(c) { c.enqueue(enc.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: text } }] }) + '\n\ndata: [DONE]\n\n')); c.close(); } });
      return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
    }
    return res('unexpected ' + url, 500);
  };
  return { fetchFn, fs, calls };
}
const read = (fs, p) => JSON.parse(fs.get(p).content);
const GOOD = '<!doctype html><html><body><h1>hi</h1><script>\nfunction a(){return 1}\nfunction b(){return a()+1}\nconsole.log(b());</script><p>' + 'x'.repeat(100) + '</p></body></html>';
const BADJS = '<!doctype html><html><body><script>function a({ return 1 </script><p>' + 'x'.repeat(100) + '</p></body></html>';
const ans = (summary, target, body) => 'SUMMARY: ' + summary + '\nTARGET: ' + target + '\nSTATE: build | none | next: add a score\n' + body;

function scenario(over = {}) {
  const ts = '2026-10-04T10:00:00.000Z';
  const userMsg = { role: 'user', ts, text: 'make it blue', status: 'pending' };
  const files = {
    'devstream/devstream-status.json': JSON.stringify({ threads: { 'p/app.html': { project: 'p', file: 'app.html', state: 'executing', startedAt: ts, heartbeat: ts }, 'p/other.html': { project: 'p', file: 'other.html', state: 'ok' } }, projects: { p: { mainFile: 'app.html', planExists: true } } }),
    'devstream/threads/p__app.html.json': JSON.stringify({ project: 'p', outputFile: 'app.html', messages: [userMsg] }),
    'p-plan.md': '# plan\nbuild an app\n',
    'app.html': GOOD.replace('hi', 'old'),
    ...(over.files || {})
  };
  const req = {
    key: 'p/app.html',
    cfg: { owner: 'acmeproducts', repo: 'stuff', branch: 'main', pat: 'ghp_test', vkey: 'vk', vmodel: 'm1' },
    job: { codeFile: 'app.html', planFile: 'p-plan.md', inputFile: null, images: [], ghRefs: [], webSearch: false, patchMode: false, system: 'sys', history: [], instr: 'make it blue', chain: ['venice'], budgetMs: 60000, threadModel: null, threadEngine: 'venice', projectContext: '', allowPlanCreate: false, ...(over.job || {}) },
    post: { threadPath: 'devstream/threads/p__app.html.json', sotPath: 'devstream/devstream-status.json', project: 'p', tab: 'app', pendSigs: [msgSig(userMsg)], pendTexts: ['make it blue'], testUrl: '' }
  };
  return req;
}
const quiet = fetchFn => ({ fetch: fetchFn, sleep: () => new Promise(r => setTimeout(r, 1)), heartbeatMs: 40 });

(async () => {
  /* B68-1 normal run end to end */
  {
    const sc = scenario();
    const m2 = mock({ files: filesOf(sc), ai: [ans('Made it blue', 'app.html', GOOD.replace('hi', 'blue'))] });
    const r = await runPipeline(sc, quiet(m2.fetchFn));
    const th = read(m2.fs, 'devstream/threads/p__app.html.json'), sot = read(m2.fs, 'devstream/devstream-status.json');
    ok('B68-1 result ok', r && r.ok && /github\.io\/stuff\/app\.html/.test(r.testUrl), r);
    ok('B68-1 file committed', m2.fs.get('app.html').content.includes('blue'));
    ok('B68-1 user message marked done', th.messages[0].status === 'done', th.messages);
    ok('B68-1 reply saved with test link and diff link', th.messages.length === 2 && /Test: https:\/\/acmeproducts\.github\.io\/stuff\/app\.html/.test(th.messages[1].text) && /commit\//.test(th.messages[1].text), th.messages[1]);
    ok('B68-1 status ok, other tab untouched', sot.threads['p/app.html'].state === 'ok' && sot.threads['p/other.html'].state === 'ok' && !sot.threads['p/app.html'].error, sot.threads);
    ok('B68-1 plan log row written', /## RUN LOG/.test(m2.fs.get('p-plan.md').content) && /built app\.html/.test(m2.fs.get('p-plan.md').content));
    ok('B68-1 next step kept in reply state', th.lastState && /next: add a score/.test(th.lastState));
  }
  /* B68-2 broken result refused, retried quietly */
  {
    const sc = scenario();
    const m = mock({ files: filesOf(sc), ai: [ans('x', 'app.html', BADJS), ans('Made it blue', 'app.html', GOOD.replace('hi', 'blue'))] });
    const before = m.fs.get('app.html').content;
    const r = await runPipeline(sc, quiet(m.fetchFn));
    ok('B68-2 retried and succeeded', r.ok && m.calls.ai.length === 2, { r, n: m.calls.ai.length });
    ok('B68-2 retry prompt carries the reason', /PREVIOUS ATTEMPT WAS REJECTED[\s\S]*syntax error/.test(JSON.stringify(m.calls.ai[1])));
    ok('B68-2 only the good version was committed', m.calls.puts.filter(p => p === 'app.html').length === 1 && m.fs.get('app.html').content !== before && !m.fs.get('app.html').content.includes('function a({'));
  }
  {
    const sc = scenario();
    const m = mock({ files: filesOf(sc), ai: [ans('x', 'app.html', BADJS), ans('x', 'app.html', BADJS), ans('x', 'app.html', BADJS)] });
    const before = m.fs.get('app.html').content;
    const r = await runPipeline(sc, quiet(m.fetchFn));
    const th = read(m.fs, 'devstream/threads/p__app.html.json'), sot = read(m.fs, 'devstream/devstream-status.json');
    ok('B68-2 gives up after 3 tries, app unchanged', !r.ok && m.fs.get('app.html').content === before && m.calls.ai.length === 3, r);
    ok('B68-2 failure is recorded plainly and request stays pending', th.messages.some(x => x.role === 'agent' && /Failed:/.test(x.text) && /would have broken your app/.test(x.coachText)) && th.messages[0].status === 'pending', th.messages);
    ok('B68-2 status error', sot.threads['p/app.html'].state === 'error' && /would break/.test(sot.threads['p/app.html'].error));
  }
  /* patch mode */
  {
    const sc = scenario({ job: { patchMode: true } });
    const patch = '<<<<<<< SEARCH\n<h1>hi</h1>\n=======\n<h1>blue</h1>\n>>>>>>> REPLACE';
    const m = mock({ files: { ...filesOf(sc), 'app.html': GOOD }, ai: [ans('Patched', 'app.html', patch)] });
    const r = await runPipeline(sc, quiet(m.fetchFn));
    ok('patch mode applies SEARCH/REPLACE', r.ok && m.fs.get('app.html').content.includes('<h1>blue</h1>'), r);
  }
  /* B68-3 access */
  {
    const m = mock();
    ok('B68-3 token without push refused', /cannot push/.test(await verifyAccess(m.fetchFn, { owner: 'acmeproducts', repo: 'stuff', pat: 'nopush' }, 'acmeproducts')));
    ok('B68-3 other owner refused', /only serves/.test(await verifyAccess(m.fetchFn, { owner: 'someoneelse', repo: 'stuff', pat: 'ghp' }, 'acmeproducts')));
    ok('B68-3 good token accepted', (await verifyAccess(m.fetchFn, { owner: 'acmeproducts', repo: 'stuff', pat: 'ghp' }, 'acmeproducts')) === '');
  }
  /* B68-4 stop */
  {
    const sc = scenario(); let release;
    const hold = () => new Promise(res => { release = () => res(); });
    const ctl = { stopped: false, aborts: new Set() };
    const m = mock({ files: filesOf(sc), ai: [opts => new Promise((_, rej) => { opts.signal.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError'))); })] });
    const p = runPipeline(sc, quiet(m.fetchFn), ctl);
    await new Promise(r => setTimeout(r, 80));
    ctl.stopped = true; ctl.aborts.forEach(a => a.abort());
    const r = await p;
    const th = read(m.fs, 'devstream/threads/p__app.html.json'), sot = read(m.fs, 'devstream/devstream-status.json');
    ok('B68-4 stopped run reports interrupted', r.interrupted === true, r);
    ok('B68-4 message stays queued, no failure message, status idle', th.messages.length === 1 && th.messages[0].status === 'pending' && sot.threads['p/app.html'].state === 'idle', { th, sot });
  }
  /* B68-5 status write collision merges */
  {
    const sc = scenario(); let tripped = false;
    const m = mock({
      files: filesOf(sc), ai: [ans('Made it blue', 'app.html', GOOD.replace('hi', 'blue'))],
      hook: async (url, opts, fs, sha) => {
        if (!tripped && opts.method === 'PUT' && /devstream-status\.json/.test(url)) {
          tripped = true;
          const f = fs.get('devstream/devstream-status.json'), o = JSON.parse(f.content); o.threads['p/other.html'].state = 'error'; o.threads['p/other.html'].error = 'from another device';
          fs.set('devstream/devstream-status.json', { content: JSON.stringify(o), sha: sha() });
        }
        return null;
      }
    });
    const r = await runPipeline(sc, quiet(m.fetchFn));
    const sot = read(m.fs, 'devstream/devstream-status.json');
    ok('B68-5 collision merged, both changes kept', tripped && r.ok && sot.threads['p/app.html'].state === 'ok' && sot.threads['p/other.html'].error === 'from another device', { tripped, r, sot: sot.threads });
  }
  /* B68-6 heartbeat while running, never after finish */
  {
    const sc = scenario(); const stamps = [];
    const m = mock({
      files: filesOf(sc), ai: [opts => new Promise(res => setTimeout(() => res(new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify({ choices: [{ delta: { content: ans('ok', 'NONE', 'just an answer') } }] }) + '\n\ndata: [DONE]\n\n')); c.close(); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } })), 300))],
      hook: async (url, opts) => { if (opts.method === 'PUT' && /devstream-status/.test(url)) stamps.push(JSON.parse(b64dec(JSON.parse(opts.body).content)).threads['p/app.html'].heartbeat); return null; }
    });
    const r = await runPipeline(sc, quiet(m.fetchFn));
    const sot = read(m.fs, 'devstream/devstream-status.json');
    ok('B68-6 heartbeat refreshed during the run', new Set(stamps).size >= 2, stamps);
    ok('B68-6 answer-only run finishes ok with no file written', r.ok && !m.calls.puts.includes('app.html'), r);
    const n = stamps.length; await new Promise(r => setTimeout(r, 150));
    ok('B68-6 no heartbeat writes after the run ended', stamps.length === n && sot.threads['p/app.html'].state === 'ok');
  }
  /* engine failure goes to fallback engine */
  {
    const sc = scenario({ job: { chain: ['venice', 'openrouter'] } }); sc.cfg.orkey = 'ok'; sc.cfg.ormodel = 'm2';
    const m = mock({ files: filesOf(sc), ai: [] });
    const real = m.fetchFn; let n = 0;
    const f = async (u, o) => { if (/openrouter\.ai/.test(u)) { const enc = new TextEncoder(); return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode('data: ' + JSON.stringify({ choices: [{ delta: { content: ans('Made it blue', 'app.html', GOOD.replace('hi', 'blue')) } }] }) + '\n\ndata: [DONE]\n\n')); c.close(); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } }); } return real(u, o); };
    const r = await runPipeline(sc, quiet(f));
    const th = read(m.fs, 'devstream/threads/p__app.html.json');
    ok('fallback engine used and noted', r.ok && /\[fallback: openrouter/.test(th.messages[1].text), r);
  }
  /* checkBuild parity */
  ok('checkBuild passes good html', checkBuild('', GOOD) === '');
  ok('checkBuild catches syntax error', /syntax error/.test(checkBuild('', BADJS)));
  ok('checkBuild catches dropped function still used', /missing the function still being used: a/.test(checkBuild(GOOD, GOOD.replace('function a(){return 1}', ''))), checkBuild(GOOD, GOOD.replace('function a(){return 1}', '')));
  console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();

function filesOf(sc) { /* rebuild the file map the scenario started from */
  return scenarioFiles(sc);
}
function scenarioFiles(sc) {
  const ts = '2026-10-04T10:00:00.000Z';
  const userMsg = { role: 'user', ts, text: 'make it blue', status: 'pending' };
  return {
    'devstream/devstream-status.json': JSON.stringify({ threads: { 'p/app.html': { project: 'p', file: 'app.html', state: 'executing', startedAt: ts, heartbeat: ts }, 'p/other.html': { project: 'p', file: 'other.html', state: 'ok' } }, projects: { p: { mainFile: 'app.html', planExists: true } } }),
    'devstream/threads/p__app.html.json': JSON.stringify({ project: 'p', outputFile: 'app.html', messages: [userMsg] }),
    'p-plan.md': '# plan\nbuild an app\n',
    'app.html': GOOD.replace('hi', 'old')
  };
}
