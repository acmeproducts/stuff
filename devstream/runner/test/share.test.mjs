/* sharing end to end through the Worker: vault, invites, guest GitHub proxy, guest runs, revoke, cap */
import worker, { Vault } from '../worker.js';
import { b64enc, b64dec } from '../core.js';
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 260)); } };

const OWNER_TOKEN = 'ghp_owner_secret', VKEY = 'venice_secret_key';
const gh = new Map(); let sn = 1; const ghCalls = [];
const put = (p, c) => gh.set(p, { content: c, sha: 's' + (sn++) });
put('earth.html', 'OWNERS PRIVATE FILE'); put('projects/zed-9999/z.html', 'OTHER GUEST'); put('devstream/devstream-status.json', '{"owners":"status"}');
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); const m = opts.method || 'GET'; ghCalls.push(m + ' ' + url + ' ' + (opts.headers && opts.headers.Authorization));
  const res = (o, s = 200) => new Response(typeof o === 'string' ? o : JSON.stringify(o), { status: s });
  if (/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url)) return res({ permissions: { push: !/nopush/.test(opts.headers.Authorization) } });
  const cm = url.match(/contents\/([^?]+)/);
  if (cm) {
    const p = decodeURIComponent(cm[1]);
    if (m === 'GET') { const f = gh.get(p); return f ? res({ content: b64enc(f.content), sha: f.sha, size: f.content.length }) : res({}, 404); }
    const b = JSON.parse(opts.body); const f = gh.get(p); if (f && f.sha !== b.sha) return res({ message: 'conflict' }, 409);
    put(p, b64dec(b.content)); ghCalls.push('PUTBODY ' + JSON.stringify({ branch: b.branch })); return res({ content: { sha: gh.get(p).sha }, commit: { sha: 'c1' } });
  }
  if (/git\/trees\//.test(url)) return res({ tree: [...gh.keys()].map(path => ({ path, type: 'blob' })), truncated: false });
  if (/\/commits\?/.test(url)) return res([{ sha: 'abc1234', commit: { message: 'secret message', author: { email: 'owner@x' } } }]);
  if (/\/commits\/[0-9a-f]+$/.test(url)) return res({ sha: 'abc1234', parents: [{ sha: 'par1234' }], files: [{ filename: 'earth.html', patch: 'PRIVATE DIFF' }], commit: { message: 'secret message' } });
  return res('?', 500);
};

const stores = new Map(), alarms = new Map();
const mkState = name => { const m = new Map(); return { m, state: { storage: { get: async k => m.get(k), put: async (k, v) => { m.set(k, v); }, delete: async k => { m.delete(k); }, setAlarm: async t => { alarms.set(name, t); } } } }; };
let vaultObj = null; const runnerStarts = [];
const env = {
  ALLOWED_OWNER: 'acmeproducts',
  VAULT: { idFromName: n => n, get: () => { if (!vaultObj) vaultObj = new Vault(mkState('vault').state, env); return { fetch: (u, o) => vaultObj.fetch(new Request(u, o)) }; } },
  RUNNER: { idFromName: n => n, get: id => ({ fetch: async (u, o) => { const path = new URL(u).pathname; if (path === '/start') { runnerStarts.push({ id, req: JSON.parse(o.body) }); return new Response(JSON.stringify({ ok: true, accepted: true }), { status: 202 }); } return new Response(JSON.stringify({ ok: true, state: 'idle', id })); } }) }
};
const O = 'https://acmeproducts.github.io';
const call = (path, { method = 'GET', body, token, invite, origin = O } = {}) => worker.fetch(new Request('https://runner.example' + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(invite ? { 'X-Invite': invite } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
const cfg = { owner: 'acmeproducts', repo: 'stuff', branch: 'main', pat: OWNER_TOKEN };
const keys = { vkey: VKEY, vmodel: 'm1' };

(async () => {
  let r = await call('/admin/vault', { method: 'POST', body: { cfg: { ...cfg, pat: 'nopush_token' }, keys } }); ok('vault: a token without push access is refused', r.status === 403);
  r = await call('/admin/vault', { method: 'POST', body: { cfg, keys: { vkey: '', vmodel: '' } } }); ok('vault: refuses when no AI key is given', r.status === 400);
  r = await call('/admin/invite', { method: 'POST', body: { cfg, name: 'Sam' } }); let j = await r.json(); ok('invite: refused before keys are stored', !j.ok);
  r = await call('/admin/vault', { method: 'POST', body: { cfg, keys } }); j = await r.json(); ok('vault stored', j.ok && j.engines[0] === 'venice', j);
  r = await call('/admin/invite', { method: 'POST', body: { cfg, name: "Sam O'Neil" } }); j = await r.json(); const code = j.code, slug = j.slug;
  ok('invite created with a long code and a safe folder name', j.ok && code.length >= 32 && /^samoneil-[a-z0-9]{4}$/.test(slug), j);
  r = await call('/admin/invites?owner=acmeproducts&repo=stuff', { token: OWNER_TOKEN }); j = await r.json(); ok('owner can list invites', j.invites.length === 1 && j.invites[0].code === code);
  r = await call('/admin/invites?owner=acmeproducts&repo=stuff', { token: 'nopush_token' }); ok('list refused without owner token', r.status === 403);

  r = await call('/invite/' + code + '/info'); j = await r.json();
  ok('guest info: name, folder, repo, engines', j.ok && j.slug === slug && j.repo === 'stuff' && j.engines.venice === 'm1', j);
  ok('B72-6 guest info carries no key or token', !JSON.stringify(j).includes(VKEY) && !JSON.stringify(j).includes(OWNER_TOKEN));
  r = await call('/invite/' + 'x'.repeat(32) + '/info'); ok('unknown invite refused', r.status === 404);

  const base = '/gh/repos/acmeproducts/stuff/';
  const own = 'projects/' + slug + '/a.html';
  r = await call(base + 'contents/' + own, { method: 'PUT', invite: code, body: { message: 'x', content: b64enc('<html>guest</html>'), branch: 'evil-branch' } });
  ok('guest write inside own folder works, on the owner\'s branch only', r.ok && gh.get(own).content === '<html>guest</html>' && ghCalls.some(c => c === 'PUTBODY {"branch":"main"}'), r.status);
  r = await call(base + 'contents/' + own, { invite: code }); j = await r.json(); ok('guest reads own file', r.ok && b64dec(j.content) === '<html>guest</html>');
  for (const [label, p] of [['owner file', 'earth.html'], ['owner status', 'devstream/devstream-status.json'], ['other guest', 'projects/zed-9999/z.html'], ['traversal', 'projects/' + slug + '/%2e%2e/%2e%2e/earth.html'], ['workflow', '.github/workflows/deploy-devstream-runner.yml']]) {
    const rr = await call(base + 'contents/' + p, { invite: code }); ok('B72-2 refused: ' + label, rr.status === 403, rr.status);
  }
  r = await call(base + 'contents/earth.html', { method: 'PUT', invite: code, body: { message: 'x', content: b64enc('pwn') } }); ok('B72-2 cannot overwrite the owner\'s file', r.status === 403 && gh.get('earth.html').content === 'OWNERS PRIVATE FILE');
  r = await call('/gh/repos/acmeproducts/other/contents/projects/' + slug + '/a.html', { invite: code }); ok('B72-2 other repo refused', r.status === 403);
  r = await call(base + 'git/trees/main?recursive=1', { invite: code }); j = await r.json();
  ok('B72-3 tree shows only the guest\'s own files', j.tree.length === 1 && j.tree[0].path === own, j.tree);
  r = await call(base + 'commits?path=' + encodeURIComponent(own), { invite: code }); j = await r.json(); ok('B72-3 commit list reduced to ids', JSON.stringify(j) === '[{"sha":"abc1234"}]', j);
  r = await call(base + 'commits?path=earth.html', { invite: code }); ok('B72-3 commit list for owner file refused', r.status === 403);
  r = await call(base + 'commits/abc1234', { invite: code }); j = await r.json(); ok('B72-3 commit lookup shows parents only', JSON.stringify(j) === '{"sha":"abc1234","parents":[{"sha":"par1234"}]}', j);
  r = await call(base + 'actions/secrets', { invite: code }); ok('other API areas refused', r.status === 403);
  ok('owner token only ever sent to GitHub, never to guests', ghCalls.every(c => !c.includes(OWNER_TOKEN) || c.includes('api.github.com')));

  const job = () => ({ key: 'P/a', job: { codeFile: own, planFile: 'projects/' + slug + '/a-plan.md', images: [], ghRefs: [], chain: ['venice'], threadEngine: 'venice', instr: 'x', system: 's', history: [] }, post: { threadPath: 'devstream/guests/' + slug + '/threads/P__a.json', sotPath: 'devstream/guests/' + slug + '/devstream-status.json', project: 'P', tab: 'a', pendSigs: [], pendTexts: [] } });
  r = await call('/run', { method: 'POST', invite: code, body: job() }); ok('guest run accepted', r.status === 202, r.status);
  const st = runnerStarts[0];
  ok('run uses the owner\'s stored keys and token', st.req.cfg.vkey === VKEY && st.req.cfg.pat === OWNER_TOKEN && st.id.startsWith('g:' + slug));
  let b = job(); b.job.codeFile = 'earth.html'; r = await call('/run', { method: 'POST', invite: code, body: b }); ok('B72-5 run on the owner\'s file refused', r.status === 400 && runnerStarts.length === 1);
  b = job(); b.post.sotPath = 'devstream/devstream-status.json'; r = await call('/run', { method: 'POST', invite: code, body: b }); ok('B72-5 run writing the owner\'s status refused', r.status === 400);
  r = await call('/status?key=P/a', { invite: code }); ok('guest can read own run status', (await r.json()).ok === true);

  /* cap */
  for (let i = 0; i < 40; i++) await call('/run', { method: 'POST', invite: code, body: job() });
  r = await call('/run', { method: 'POST', invite: code, body: job() }); j = await r.json(); ok('B72-4 daily cap blocks extra runs with a plain message', r.status === 429 && /today's runs/.test(j.error), j);

  /* revoke */
  r = await call('/admin/revoke', { method: 'POST', body: { cfg, code } }); ok('owner revokes', (await r.json()).ok);
  r = await call(base + 'contents/' + own, { invite: code }); ok('B72-4 revoked invite stops working at once', r.status === 401);
  r = await call('/run', { method: 'POST', invite: code, body: job() }); ok('B72-4 revoked invite cannot run', r.status === 401);
  r = await call('/invite/' + code + '/info'); ok('B72-4 revoked invite info gone', r.status === 404);
  r = await call('/health', { origin: 'https://evil.example' }); ok('cors never echoes another origin', r.headers.get('Access-Control-Allow-Origin') === O);
  globalThis.fetch = realFetch;
  console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
