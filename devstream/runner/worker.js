/* DevStream runner — Cloudflare Worker.
   Owner (Authorization: Bearer <GitHub token that can push to the owner's repo>):
     POST /run  GET /status  POST /stop     run a job with the keys sent in the job (as before)
     POST /admin/vault   store the owner's keys + token for sharing (kept only in this Worker's storage)
     POST /admin/invite  create an invite link for a guest      GET /admin/invites     POST /admin/revoke
   Guest (X-Invite: <code>), no keys, no setup:
     POST /run  GET /status  POST /stop     run with the owner's stored keys, only inside the guest's own folders
     ANY  /gh/repos/...                      GitHub access limited to the guest's own folders
     GET  /invite/<code>/info                what the app needs to start (no secrets)
   GET /health */
import { runPipeline, verifyAccess, failJob } from './core.js';
import { guestRequest, guestGhRule, makeSlug, SLUG_RE, enginesOf } from './guest.js';

const VERSION = 'b72';
const MAX_RUN_MS = 13 * 60 * 1000;
const DAILY_CAP = 30;
const ALLOWED_ORIGINS = ['https://acmeproducts.github.io'];

const cors = (req, extra) => {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Invite, Accept', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin', ...(extra || {}) };
};
const json = (req, obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', ...cors(req) } });
const relay = async (req, r) => new Response(await r.text(), { status: r.status, headers: { 'Content-Type': 'application/json', ...cors(req) } });

const okCache = new Map();
async function authed(env, cfg) {
  const k = cfg.owner + '/' + cfg.repo + '|' + cfg.pat;
  const hit = okCache.get(k); if (hit && hit > Date.now()) return '';
  const bad = await verifyAccess(fetch, cfg, env.ALLOWED_OWNER);
  if (!bad) { okCache.set(k, Date.now() + 10 * 60 * 1000); if (okCache.size > 50) okCache.clear(); }
  return bad;
}
const vaultStub = env => env.VAULT.get(env.VAULT.idFromName('vault'));
const vcall = async (env, path, body) => {
  const r = await vaultStub(env).fetch('https://do' + path, { method: 'POST', body: JSON.stringify(body || {}) });
  return r.json();
};
function randomId(n) {
  const a = new Uint8Array(n); crypto.getRandomValues(a);
  const al = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (const b of a) s += al[b % al.length]; return s;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === '/health') return json(req, { ok: true, v: VERSION });
    try {
      /* ---- guest side ---- */
      const im = /^\/invite\/([a-z0-9]{20,64})\/info$/.exec(url.pathname);
      if (im) {
        const g = await vcall(env, '/guest', { code: im[1] });
        if (!g.ok) return json(req, { ok: false, error: g.error }, 404);
        return json(req, { ok: true, name: g.invite.name, slug: g.invite.slug, owner: g.vault.owner, repo: g.vault.repo, branch: g.vault.branch, engines: enginesOf(g.vault) });
      }
      const code = req.headers.get('X-Invite');
      if (code) {
        const g = await vcall(env, '/guest', { code });
        if (!g.ok) return json(req, { ok: false, error: g.error }, 401);
        return await guestRoute(req, env, url, g);
      }
      /* ---- owner side ---- */
      let cfg, key, body = null;
      if (req.method === 'POST') { body = await req.json(); cfg = body.cfg; key = body.key; }
      else {
        const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        cfg = { owner: url.searchParams.get('owner'), repo: url.searchParams.get('repo'), pat: tok }; key = url.searchParams.get('key');
      }
      const isAdmin = url.pathname.startsWith('/admin/');
      if (!cfg || (!key && !isAdmin) || !/^[\w.-]+$/.test(cfg.repo || '')) return json(req, { ok: false, error: 'missing job details' }, 400);
      const bad = await authed(env, cfg);
      if (bad) return json(req, { ok: false, error: bad }, 403);
      if (isAdmin) return await adminRoute(req, env, url, cfg, body);
      const stub = env.RUNNER.get(env.RUNNER.idFromName(cfg.owner + '/' + cfg.repo + '/' + key));
      if (url.pathname === '/run' && req.method === 'POST') return relay(req, await stub.fetch('https://do/start', { method: 'POST', body: JSON.stringify(body) }));
      if (url.pathname === '/status') return relay(req, await stub.fetch('https://do/status'));
      if (url.pathname === '/stop' && req.method === 'POST') return relay(req, await stub.fetch('https://do/stop', { method: 'POST' }));
      return json(req, { ok: false, error: 'not found' }, 404);
    } catch (e) { return json(req, { ok: false, error: String(e && e.message || e) }, 500); }
  }
};

async function adminRoute(req, env, url, cfg, body) {
  if (url.pathname === '/admin/vault' && req.method === 'POST') {
    const v = { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch || 'main', pat: cfg.pat, vkey: body.keys && body.keys.vkey || '', vmodel: body.keys && body.keys.vmodel || '', orkey: body.keys && body.keys.orkey || '', ormodel: body.keys && body.keys.ormodel || '', akey: body.keys && body.keys.akey || '' };
    if (!Object.keys(enginesOf(v)).length) return json(req, { ok: false, error: 'save at least one AI key (and its model) in Config first' }, 400);
    await vcall(env, '/set-vault', { vault: v });
    return json(req, { ok: true, engines: Object.keys(enginesOf(v)) });
  }
  if (url.pathname === '/admin/invite' && req.method === 'POST') {
    const name = String(body.name || '').trim().slice(0, 40) || 'Guest';
    const r = await vcall(env, '/add-invite', { name, code: randomId(32), slug: makeSlug(name, randomId(4)), cap: Math.min(Math.max(+body.cap || DAILY_CAP, 1), 500) });
    return json(req, r, r.ok ? 200 : 400);
  }
  if (url.pathname === '/admin/invites' && req.method === 'GET') return json(req, await vcall(env, '/list'));
  if (url.pathname === '/admin/revoke' && req.method === 'POST') return json(req, await vcall(env, '/revoke', { code: String(body.code || '') }));
  return json(req, { ok: false, error: 'not found' }, 404);
}

async function guestRoute(req, env, url, g) {
  const slug = g.invite.slug;
  if (url.pathname.startsWith('/gh/')) return guestGh(req, env, url, g);
  const did = 'g:' + slug;
  if (url.pathname === '/run' && req.method === 'POST') {
    const body = await req.json();
    const gr = guestRequest(slug, g.vault, body);
    if (!gr.ok) return json(req, { ok: false, error: gr.error }, 400);
    const used = await vcall(env, '/bump', { code: g.code });
    if (!used.ok) return json(req, { ok: false, error: used.error }, 429);
    const stub = env.RUNNER.get(env.RUNNER.idFromName(did + '/' + body.key));
    return relay(req, await stub.fetch('https://do/start', { method: 'POST', body: JSON.stringify(gr.req) }));
  }
  const key = req.method === 'POST' ? (await req.json().catch(() => ({}))).key : url.searchParams.get('key');
  if (!key || typeof key !== 'string') return json(req, { ok: false, error: 'missing job details' }, 400);
  const stub = env.RUNNER.get(env.RUNNER.idFromName(did + '/' + key));
  if (url.pathname === '/status') return relay(req, await stub.fetch('https://do/status'));
  if (url.pathname === '/stop' && req.method === 'POST') return relay(req, await stub.fetch('https://do/stop', { method: 'POST' }));
  return json(req, { ok: false, error: 'not found' }, 404);
}

/* GitHub for guests: the owner's token is used, but only inside the guest's own folders */
async function guestGh(req, env, url, g) {
  const slug = g.invite.slug, v = g.vault;
  const rest = url.pathname.slice(4);
  const rule = guestGhRule(slug, v, req.method, rest, url.searchParams);
  if (rule.error) return json(req, { ok: false, error: rule.error }, 403);
  const hdr = { Authorization: 'Bearer ' + v.pat, Accept: req.headers.get('Accept') || 'application/vnd.github+json', 'User-Agent': 'devstream-runner' };
  const pass = async r => new Response(await r.arrayBuffer(), { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json', ...cors(req) } });
  if (rule.kind === 'contents') {
    const q = new URLSearchParams(); const ref = url.searchParams.get('ref'); if (ref && /^[\w.\-\/]{1,100}$/.test(ref)) q.set('ref', ref);
    const target = 'https://api.github.com/repos/' + v.owner + '/' + v.repo + '/contents/' + rule.path.split('/').map(encodeURIComponent).join('/') + (q.toString() ? '?' + q : '');
    let init = { method: req.method, headers: hdr };
    if (req.method !== 'GET') {
      const b = await req.json().catch(() => null); if (!b) return json(req, { ok: false, error: 'bad body' }, 400);
      init.headers = { ...hdr, 'Content-Type': 'application/json' };
      init.body = JSON.stringify({ message: String(b.message || 'devstream guest ' + slug).slice(0, 200), content: b.content, sha: b.sha, branch: v.branch });
    }
    return pass(await fetch(target, init));
  }
  if (rule.kind === 'tree') {
    const r = await fetch('https://api.github.com/repos/' + v.owner + '/' + v.repo + '/git/trees/' + encodeURIComponent(v.branch) + '?recursive=1', { headers: hdr });
    const j = await r.json().catch(() => ({}));
    const keep = (j.tree || []).filter(t => t.path.startsWith('projects/' + slug + '/') || t.path.startsWith('devstream/guests/' + slug + '/'));
    return json(req, { tree: keep, truncated: false }, r.status);
  }
  if (rule.kind === 'commits-list') {
    const p = url.searchParams.get('path');
    const r = await fetch('https://api.github.com/repos/' + v.owner + '/' + v.repo + '/commits?path=' + encodeURIComponent(p) + '&sha=' + encodeURIComponent(v.branch) + '&per_page=1', { headers: hdr });
    const j = await r.json().catch(() => []);
    return json(req, Array.isArray(j) ? j.map(c => ({ sha: c.sha })) : j, r.status);
  }
  if (rule.kind === 'commit-parents') {
    const r = await fetch('https://api.github.com/repos/' + v.owner + '/' + v.repo + '/' + rest.split('/').slice(3).join('/'), { headers: hdr });
    const j = await r.json().catch(() => ({}));
    return json(req, { sha: j.sha, parents: (j.parents || []).map(p => ({ sha: p.sha })) }, r.status);
  }
  return json(req, { ok: false, error: 'not allowed' }, 403);
}

/* holds the owner's shared keys and the invite list; the only place keys are stored */
export class Vault {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    const body = await request.json().catch(() => ({}));
    const st = this.state.storage;
    const J = o => new Response(JSON.stringify(o));
    const invites = (await st.get('invites')) || {};
    if (path === '/set-vault') { await st.put('vault', body.vault); return J({ ok: true }); }
    const vault = await st.get('vault');
    if (path === '/add-invite') {
      if (!vault) return J({ ok: false, error: 'store your keys first' });
      invites[body.code] = { name: body.name, slug: body.slug, cap: body.cap, created: Date.now(), revoked: false, day: '', n: 0 };
      await st.put('invites', invites);
      return J({ ok: true, code: body.code, slug: body.slug });
    }
    if (path === '/list') return J({ ok: true, invites: Object.entries(invites).map(([code, i]) => ({ code, name: i.name, slug: i.slug, revoked: i.revoked, created: i.created, today: i.day === new Date().toISOString().slice(0, 10) ? i.n : 0, cap: i.cap })) });
    if (path === '/revoke') { if (invites[body.code]) { invites[body.code].revoked = true; await st.put('invites', invites); return J({ ok: true }); } return J({ ok: false, error: 'unknown invite' }); }
    if (path === '/guest') {
      const i = invites[body.code];
      if (!i || i.revoked || !vault) return J({ ok: false, error: 'this invite is not valid any more' });
      return J({ ok: true, code: body.code, invite: { name: i.name, slug: i.slug }, vault });
    }
    if (path === '/bump') {
      const i = invites[body.code]; if (!i || i.revoked) return J({ ok: false, error: 'this invite is not valid any more' });
      const day = new Date().toISOString().slice(0, 10);
      if (i.day !== day) { i.day = day; i.n = 0; }
      if (i.n >= (i.cap || DAILY_CAP)) return J({ ok: false, error: 'You have used today\'s runs (' + (i.cap || DAILY_CAP) + '). Try again tomorrow.' });
      i.n++; await st.put('invites', invites); return J({ ok: true, n: i.n });
    }
    return new Response('not found', { status: 404 });
  }
}

export class Runner {
  constructor(state, env) { this.state = state; this.env = env; this.ctl = null; this.status = null; }
  async load() { if (!this.status) this.status = (await this.state.storage.get('status')) || { state: 'idle' }; return this.status; }
  async save(patch) { this.status = { ...(await this.load()), ...patch }; await this.state.storage.put('status', this.status); }

  async fetch(request) {
    const path = new URL(request.url).pathname;
    const st = await this.load();
    if (path === '/status') return new Response(JSON.stringify({ ok: true, ...st }), { headers: { 'Content-Type': 'application/json' } });
    if (path === '/stop') {
      if (this.ctl) { this.ctl.stopped = true; this.ctl.aborts.forEach(a => { try { a.abort(); } catch (e) { } }); }
      return new Response(JSON.stringify({ ok: true, running: st.state === 'running' }), { headers: { 'Content-Type': 'application/json' } });
    }
    if (path === '/start') {
      if (st.state === 'running' && Date.now() - (st.at || 0) < 5 * 60 * 1000) return new Response(JSON.stringify({ ok: false, error: 'already running' }), { status: 409 });
      const req = await request.json();
      await this.state.storage.put('req', req);
      await this.state.storage.delete('begun');
      this.status = { state: 'running', startedAt: Date.now(), at: Date.now(), line: 'starting', chars: 0, rchars: 0 };
      await this.state.storage.put('status', this.status);
      await this.state.storage.setAlarm(Date.now() + 20);
      return new Response(JSON.stringify({ ok: true, accepted: true }), { status: 202 });
    }
    return new Response('not found', { status: 404 });
  }

  async alarm() {
    const req = await this.state.storage.get('req');
    if (!req) return;
    await this.state.storage.delete('req');           /* the keys never outlive the job */
    if (await this.state.storage.get('begun')) {      /* alarm re-delivered after a restart: don't re-run */
      try { await failJob(req, { fetch: (u, o) => fetch(u, o) }, 'timeout: the runner was restarted mid-run'); } catch (e) { }
      await this.save({ state: 'done', result: { ok: false, error: 'the runner was restarted mid-run' }, at: Date.now() });
      return;
    }
    await this.state.storage.put('begun', true);
    const ctl = this.ctl = { stopped: false, timedOut: false, aborts: new Set() };
    const cap = setTimeout(() => { ctl.timedOut = true; ctl.stopped = true; ctl.aborts.forEach(a => { try { a.abort(); } catch (e) { } }); }, MAX_RUN_MS);
    let result;
    const io = {
      fetch: (u, o) => fetch(u, o),
      log: (line, err, chars, rchars) => {
        const p = { at: Date.now() };
        if (line) { p.line = line; p.err = !!err; p.chars = 0; p.rchars = 0; }
        if (typeof chars === 'number') { p.chars = chars; p.rchars = rchars || 0; }
        this.status = { ...this.status, ...p };
        if (line) this.state.storage.put('status', this.status).catch(() => { });
      }
    };
    try { result = await runPipeline(req, io, ctl); }
    catch (e) { result = { ok: false, error: String(e && e.message || e) }; }
    finally { clearTimeout(cap); this.ctl = null; }
    await this.state.storage.delete('begun');
    await this.save({ state: 'done', result, at: Date.now(), line: result && result.ok ? 'done' : 'stopped' });
  }
}
