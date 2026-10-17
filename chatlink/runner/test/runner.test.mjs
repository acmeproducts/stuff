/* guest links end to end through the Worker: owner-only creation, one-time key delivery, lock after confirm, retries, expiry, stop */
import worker, { Vault } from '../worker.js';
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('PASS', n); } else { fail++; console.log('FAIL', n, x === undefined ? '' : JSON.stringify(x).slice(0, 260)); } };

const OWNER = 'ghp_owner_secret', DG = 'deepgram_secret_key_0123456789abcdef0123';
globalThis.fetch = async (url, opts = {}) => {            // stand-in for GitHub: only the repo-permission check is used
  url = String(url);
  if (/api\.github\.com\/repos\/[^/]+\/[^/]+$/.test(url)) return new Response(JSON.stringify({ permissions: { push: !/nopush/.test(opts.headers.Authorization) } }), { status: /bad/.test(opts.headers.Authorization) ? 401 : 200 });
  return new Response('?', { status: 500 });
};
let clock = 1_800_000_000_000;
const mem = new Map();
const state = { storage: { get: async k => mem.get(k), put: async (k, v) => { mem.set(k, JSON.parse(JSON.stringify(v))); } } };
let vault = null;
const env = { ALLOWED_OWNER: 'acmeproducts', NOW: () => clock,
  VAULT: { idFromName: n => n, get: () => { if (!vault) vault = new Vault(state, env); return { fetch: (u, o) => vault.fetch(new Request(u, o)) }; } } };
const O = 'https://acmeproducts.github.io';
const call = (path, { method = 'GET', body, token, origin = O } = {}) => worker.fetch(new Request('https://runner.example' + path, { method, headers: { Origin: origin, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }), env);
const cfg = { owner: 'acmeproducts', repo: 'stuff', pat: OWNER };
const list = async () => (await (await call('/admin/invites?owner=acmeproducts&repo=stuff', { token: OWNER })).json()).invites;
const newLink = async (name = 'Sam') => (await (await call('/admin/invite', { method: 'POST', body: { cfg, name } })).json());

(async () => {
  let r = await call('/health'); let j = await r.json(); ok('health answers', j.ok && j.v === 'c1');
  r = await call('/admin/vault', { method: 'POST', body: { cfg: { ...cfg, pat: 'nopush_token' }, keys: { deepgram: DG } } }); ok('owner area: a token without push access is refused', r.status === 403);
  r = await call('/admin/vault', { method: 'POST', body: { cfg: { ...cfg, pat: 'bad_token' }, keys: { deepgram: DG } } }); ok('owner area: a token GitHub rejects is refused', r.status === 403);
  r = await call('/admin/vault', { method: 'POST', body: { cfg: { ...cfg, owner: 'someoneelse' }, keys: { deepgram: DG } } }); ok('owner area: another owner is refused', r.status === 403);
  r = await call('/admin/invite', { method: 'POST', body: { cfg, name: 'Sam' } }); j = await r.json(); ok('a link cannot be made before the key is stored', !j.ok && r.status === 400, j);
  r = await call('/admin/vault', { method: 'POST', body: { cfg, keys: { deepgram: 'short' } } }); ok('a missing or short key is refused', r.status === 400);
  r = await call('/admin/vault', { method: 'POST', body: { cfg, keys: { deepgram: DG } } }); j = await r.json(); ok('key stored', j.ok && j.has[0] === 'deepgram', j);
  r = await call('/admin/invite', { method: 'POST', body: { cfg, name: '  ' } }); ok('a name is required', r.status === 400);

  const a = await newLink('Sam'); const code = a.code; ok('link created with a long code', a.ok && /^[a-z0-9]{40}$/.test(code), a);
  let l = (await list())[0]; ok('owner list shows the guest as unopened', l.name === 'Sam' && l.state === 'unopened' && l.openedAt === 0, l);
  r = await call('/admin/invites?owner=acmeproducts&repo=stuff', { token: 'nopush_token' }); ok('the list is owner-only', r.status === 403);
  ok('the list never contains a key', !JSON.stringify(await list()).includes(DG));

  for (let n = 0; n < 5; n++) r = await call('/invite/' + code + '/info'); j = await r.json();
  ok('preview/info works and returns no key', j.ok && j.name === 'Sam' && !JSON.stringify(j).includes(DG), j);
  ok('looking at a link many times does not use it up', (await list())[0].state === 'unopened');

  r = await call('/invite/' + 'z'.repeat(40) + '/info'); ok('an unknown code is a clean 404', r.status === 404);
  r = await call('/redeem', { method: 'POST', body: { code: 'short' } }); ok('a malformed code is refused', r.status === 404);

  r = await call('/redeem', { method: 'POST', body: { code } }); j = await r.json(); const claim1 = j.claim;
  ok('first redeem hands over the key once', j.ok && j.keys.deepgram === DG && claim1.length >= 24 && j.name === 'Sam', j);
  ok('while unconfirmed the state is opening', (await list())[0].state === 'opening');

  r = await call('/redeem', { method: 'POST', body: { code } }); j = await r.json(); const claim2 = j.claim;
  ok('a retry before confirm is allowed and gets a fresh claim', j.ok && claim2 !== claim1, j);
  r = await call('/confirm', { method: 'POST', body: { code, claim: claim1 } }); ok('the older claim can no longer confirm', r.status === 409);
  r = await call('/confirm', { method: 'POST', body: { code, claim: 'garbage' } }); ok('a made-up claim cannot confirm', r.status === 409);
  r = await call('/confirm', { method: 'POST', body: { code, claim: claim2 } }); j = await r.json(); ok('the current claim confirms and locks the link', j.ok, j);

  l = (await list())[0]; ok('owner list shows opened with a time', l.state === 'opened' && l.openedAt === clock, l);
  r = await call('/redeem', { method: 'POST', body: { code } }); j = await r.json(); ok('after the lock the key is never served again', r.status === 410 && !j.ok && !JSON.stringify(j).includes(DG), j);
  r = await call('/invite/' + code + '/info'); ok('after the lock the info page says the link is used', r.status === 404);
  r = await call('/confirm', { method: 'POST', body: { code, claim: claim2 } }); ok('confirming twice does not matter', r.status === 410);

  const b = await newLink('Kim'); r = await call('/redeem', { method: 'POST', body: { code: b.code } }); const kimClaim = (await r.json()).claim;
  clock += 11 * 60 * 1000;
  ok('an unconfirmed redeem frees the link again after ten minutes', (await list()).find(x => x.name === 'Kim').state === 'unopened');
  r = await call('/redeem', { method: 'POST', body: { code: b.code } }); j = await r.json(); ok('and it can be redeemed again', j.ok && j.keys.deepgram === DG);
  r = await call('/confirm', { method: 'POST', body: { code: b.code, claim: kimClaim } }); ok('the stale claim from before cannot confirm', r.status === 409);

  const c = await newLink('Lee'); r = await call('/redeem', { method: 'POST', body: { code: c.code } }); const leeClaim = (await r.json()).claim;
  r = await call('/redeem', { method: 'POST', body: { code: c.code } }); const forwarded = (await r.json()).claim;
  r = await call('/confirm', { method: 'POST', body: { code: c.code, claim: leeClaim } }); j = await r.json();
  ok('if the link was opened somewhere else first, the first device is told', r.status === 409 && /somewhere else/.test(j.error), j);

  const d = await newLink('Old'); clock += 8 * 86400000;
  ok('a never-opened link expires after seven days', (await list()).find(x => x.name === 'Old').state === 'expired');
  r = await call('/invite/' + d.code + '/info'); ok('an expired link is dead on the info page', r.status === 404);
  r = await call('/redeem', { method: 'POST', body: { code: d.code } }); ok('an expired link cannot be redeemed', r.status === 410);

  const e = await newLink('Max'); r = await call('/admin/revoke', { method: 'POST', body: { cfg, code: e.code } }); j = await r.json(); ok('owner can stop a link', j.ok);
  r = await call('/redeem', { method: 'POST', body: { code: e.code } }); ok('a stopped link cannot be redeemed', r.status === 410);
  r = await call('/admin/revoke', { method: 'POST', body: { cfg: { ...cfg, pat: 'nopush_token' }, code: code } }); ok('a guest-side caller cannot stop links', r.status === 403);
  r = await call('/admin/invite', { method: 'POST', body: { cfg: { ...cfg, pat: 'nopush_token' }, name: 'Eve' } }); ok('only the owner can create links (a guest cannot make more)', r.status === 403);

  r = await call('/invite/' + code + '/info', { origin: 'https://evil.example' }); ok('another website cannot be allowed by CORS', r.headers.get('Access-Control-Allow-Origin') === O);
  r = await call('/redeem', { method: 'OPTIONS' }); ok('preflight answers', r.status === 204);
  console.log(pass + ' passed, ' + fail + ' failed'); process.exit(fail ? 1 : 0);
})();
