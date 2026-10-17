/* Chatlink runner — Cloudflare Worker. Guest links for chat-test: one-time delivery of the owner's speech key.
   Owner (GitHub token that can push to the owner's repo):
     POST /admin/vault    store the key(s) guests receive            (kept only in this Worker's storage)
     POST /admin/invite   create a link for a named guest            GET /admin/invites   POST /admin/revoke
   Guest (no credentials of their own):
     GET  /invite/<code>/info   is the link usable (never consumes it, never returns a key)
     POST /redeem               hands over the key ONCE, with a claim token
     POST /confirm              the device says it saved the key; the link is then locked for good
   GET /health
   A link cannot be passed on: after /confirm the server never serves the key for that code again. */
const VERSION = 'c1';
const ALLOWED_ORIGINS = ['https://acmeproducts.github.io'];
const PENDING_MS = 10 * 60 * 1000;          // a redeem that is never confirmed frees the link again after this
const DEFAULT_DAYS = 7, MAX_DAYS = 30;       // a never-opened link expires
const CODE_RE = /^[a-z0-9]{32,64}$/;

const cors = req => {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Vary': 'Origin' };
};
const json = (req, obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(req) } });

function randomId(n) {
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  const al = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (const b of a) s += al[b % al.length]; return s;
}

/* a token is accepted only if it can push to the configured owner's repo */
export async function verifyAccess(fetchFn, cfg, allowedOwner, apiBase) {
  if (!cfg || !cfg.pat || !cfg.owner || !cfg.repo) return 'missing GitHub settings';
  if (allowedOwner && String(cfg.owner).toLowerCase() !== String(allowedOwner).toLowerCase()) return 'this runner only serves ' + allowedOwner;
  const r = await fetchFn((apiBase || 'https://api.github.com') + '/repos/' + cfg.owner + '/' + cfg.repo, { headers: { Authorization: 'Bearer ' + cfg.pat, Accept: 'application/vnd.github+json', 'User-Agent': 'chatlink-runner' } });
  if (!r.ok) return 'GitHub rejected the token (' + r.status + ')';
  const j = await r.json();
  if (!(j.permissions && j.permissions.push)) return 'the token cannot push to ' + cfg.owner + '/' + cfg.repo;
  return '';
}

const okCache = new Map();
async function authed(env, cfg) {
  const k = String(cfg && cfg.owner) + '/' + String(cfg && cfg.repo) + '|' + String(cfg && cfg.pat);
  const hit = okCache.get(k); if (hit && hit > Date.now()) return '';
  const bad = await verifyAccess(fetch, cfg, env.ALLOWED_OWNER, env.GITHUB_API);
  if (!bad) { okCache.set(k, Date.now() + 10 * 60 * 1000); if (okCache.size > 50) okCache.clear(); }
  return bad;
}
const vcall = async (env, path, body) => {
  const stub = env.VAULT.get(env.VAULT.idFromName('vault'));
  const r = await stub.fetch('https://do' + path, { method: 'POST', body: JSON.stringify(body || {}) });
  return { status: r.status, body: await r.json() };
};

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === '/health') return json(req, { ok: true, v: VERSION });
    try {
      /* ---- guest side ---- */
      const im = /^\/invite\/([a-z0-9]+)\/info$/.exec(url.pathname);
      if (im && req.method === 'GET') {
        if (!CODE_RE.test(im[1])) return json(req, { ok: false, error: 'This link is not valid.' }, 404);
        const r = await vcall(env, '/info', { code: im[1] });
        return json(req, r.body, r.status);
      }
      if ((url.pathname === '/redeem' || url.pathname === '/confirm') && req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        if (!CODE_RE.test(String(body.code || ''))) return json(req, { ok: false, error: 'This link is not valid.' }, 404);
        const r = await vcall(env, url.pathname, { code: body.code, claim: String(body.claim || '') });
        return json(req, r.body, r.status);
      }
      /* ---- owner side ---- */
      if (url.pathname.startsWith('/admin/')) {
        let cfg, body = {};
        if (req.method === 'GET') {
          const h = req.headers.get('Authorization') || '';
          cfg = { owner: url.searchParams.get('owner'), repo: url.searchParams.get('repo'), pat: h.replace(/^Bearer\s+/i, '') };
        } else { body = await req.json().catch(() => ({})); cfg = body.cfg || {}; }
        const bad = await authed(env, cfg);
        if (bad) return json(req, { ok: false, error: bad }, 403);
        if (url.pathname === '/admin/vault' && req.method === 'POST') {
          const k = body.keys || {}, dg = String(k.deepgram || '').trim();
          if (dg.length < 20 || dg.length > 200) return json(req, { ok: false, error: 'a speech key is needed' }, 400);
          const r = await vcall(env, '/set-vault', { vault: { owner: cfg.owner, repo: cfg.repo, keys: { deepgram: dg } } });
          return json(req, { ...r.body, has: ['deepgram'] }, r.status);
        }
        if (url.pathname === '/admin/invite' && req.method === 'POST') {
          const name = String(body.name || '').trim().slice(0, 60);
          if (!name) return json(req, { ok: false, error: 'a name is needed' }, 400);
          const days = Math.min(Math.max(+body.days || DEFAULT_DAYS, 1), MAX_DAYS);
          const r = await vcall(env, '/add-invite', { name, code: randomId(40), days });
          return json(req, r.body, r.status);
        }
        if (url.pathname === '/admin/invites' && req.method === 'GET') { const r = await vcall(env, '/list'); return json(req, r.body, r.status); }
        if (url.pathname === '/admin/revoke' && req.method === 'POST') { const r = await vcall(env, '/revoke', { code: String(body.code || '') }); return json(req, r.body, r.status); }
      }
      return json(req, { ok: false, error: 'not found' }, 404);
    } catch (e) {
      return json(req, { ok: false, error: 'the runner failed: ' + String(e && e.message || e).slice(0, 120) }, 500);
    }
  }
};

/* holds the owner's key and the invites; the only place the key is stored */
export class Vault {
  constructor(state, env) { this.state = state; this.env = env || {}; }
  now() { return this.env.NOW ? this.env.NOW() : Date.now(); }
  stateOf(i, t) {
    if (i.revoked) return 'stopped';
    if (i.claimedAt) return 'opened';
    if (t > i.expires) return 'expired';
    if (i.pending && t - i.pending.at < PENDING_MS) return 'opening';
    return 'unopened';
  }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const body = await request.json().catch(() => ({}));
    const st = this.state.storage, t = this.now();
    const J = (o, s) => new Response(JSON.stringify(o), { status: s || 200 });
    const invites = (await st.get('invites')) || {};
    if (path === '/set-vault') { await st.put('vault', body.vault); return J({ ok: true }); }
    const vault = await st.get('vault');
    const dead = { ok: false, error: 'This link has already been used or is no longer valid.' };
    if (path === '/add-invite') {
      if (!vault) return J({ ok: false, error: 'store your key first' }, 400);
      invites[body.code] = { name: body.name, created: t, expires: t + body.days * 86400000, revoked: false, pending: null, claimedAt: 0 };
      await st.put('invites', invites);
      return J({ ok: true, code: body.code });
    }
    if (path === '/list') {
      return J({ ok: true, invites: Object.entries(invites).map(([code, i]) => ({ code, name: i.name, created: i.created, expires: i.expires, openedAt: i.claimedAt || 0, state: this.stateOf(i, t) })).sort((a, b) => b.created - a.created) });
    }
    if (path === '/revoke') {
      const i = invites[body.code]; if (!i) return J({ ok: false, error: 'unknown link' }, 404);
      i.revoked = true; await st.put('invites', invites); return J({ ok: true });
    }
    const i = invites[body.code];
    if (path === '/info') {
      if (!i || !vault) return J(dead, 404);
      const s = this.stateOf(i, t);
      if (s !== 'unopened' && s !== 'opening') return J(dead, 404);
      return J({ ok: true, name: i.name });                                   // never a key, never a state change
    }
    if (path === '/redeem') {
      if (!i || !vault) return J(dead, 404);
      const s = this.stateOf(i, t);
      if (s !== 'unopened' && s !== 'opening') return J(dead, 410);
      const claim = (() => { const a = new Uint8Array(18); crypto.getRandomValues(a); return [...a].map(b => b.toString(16).padStart(2, '0')).join(''); })();
      i.pending = { token: claim, at: t };                                    // a retry replaces the earlier claim token
      await st.put('invites', invites);
      return J({ ok: true, name: i.name, keys: vault.keys, claim });
    }
    if (path === '/confirm') {
      if (!i || !vault) return J(dead, 404);
      if (i.revoked) return J(dead, 410);
      if (i.claimedAt) return J({ ok: false, error: 'This link was already opened.' }, 410);
      if (!i.pending || !body.claim || i.pending.token !== body.claim) return J({ ok: false, error: 'This link was opened somewhere else first.' }, 409);
      i.claimedAt = t; i.pending = null;
      await st.put('invites', invites);
      return J({ ok: true });
    }
    return J({ ok: false, error: 'not found' }, 404);
  }
}
