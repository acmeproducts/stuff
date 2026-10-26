/* Chatlink runner — Cloudflare Worker. Guest links for chat-test: one-time delivery of the owner's speech key.
   Owner (GitHub token that can push to the owner's repo):
     POST /admin/vault    store the key(s) guests receive            (kept only in this Worker's storage)
     POST /admin/invite   create a link for a named guest            GET /admin/invites   POST /admin/revoke
   Guest (no credentials of their own):
     GET  /invite/<code>/info   is the link usable (never consumes it, never returns a key)
     POST /redeem               hands over the key ONCE, with a claim token
     POST /confirm              the device says it saved the key; the link is then locked for good
   Usage log (own storage, no message text):
     POST /usage          a device sends a batch of events          GET /admin/usage    owner reads them back
   GET /health
   A link cannot be passed on: after /confirm the server never serves the key for that code again. */
const VERSION = 'c2';
const ALLOWED_ORIGINS = ['https://acmeproducts.github.io'];
const PENDING_MS = 10 * 60 * 1000;          // a redeem that is never confirmed frees the link again after this
const DEFAULT_DAYS = 7, MAX_DAYS = 30;       // a never-opened link expires
const CODE_RE = /^[a-z0-9]{32,64}$/;
const KEEP_DAYS = 90, MAX_BATCH = 50, MAX_DAY_EVENTS = 5000, DAY_MS = 86400000;
const KINDS = ['message', 'room', 'session', 'opened'];
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
/* only these fields are ever kept; anything else a device sends (including message text) is dropped */
function cleanEvent(e, dev, now) {
  if (!e || KINDS.indexOf(e.kind) < 0) return null;
  const t = +e.t, o = { kind: e.kind, t: t > now - DAY_MS && t < now + DAY_MS ? t : now, who: str(e.who, 40) || 'unknown', dev: str(dev, 16).replace(/[^a-z0-9]/gi, '') };
  if (e.room) o.room = str(e.room, 60);
  if (/^[a-z]{2,3}>[a-z]{2,3}$/.test(e.pair)) o.pair = e.pair;
  if (e.side === 'south' || e.side === 'north') o.side = e.side;
  if (e.mode === 'typed' || e.mode === 'spoken') o.mode = e.mode;
  if (typeof e.trOk === 'boolean') o.trOk = e.trOk;
  if (e.stt) o.stt = str(e.stt, 16);
  if (e.build) o.build = str(e.build, 40);
  return o;
}
const ucall = async (env, path, body) => {
  const stub = env.USAGE.get(env.USAGE.idFromName('usage'));
  const r = await stub.fetch('https://do' + path, { method: 'POST', body: JSON.stringify(body || {}) });
  return { status: r.status, body: await r.json() };
};
const dayOf = t => new Date(t).toISOString().slice(0, 10);

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
        if (url.pathname === '/confirm' && r.body.ok && r.body.name) {      // the first row of a guest's log: their link was opened
          const now = env.NOW ? env.NOW() : Date.now();
          try { await ucall(env, '/add', { events: [{ kind: 'opened', t: now, who: str(r.body.name, 40), dev: '' }], now }); } catch (e) { }   // the log can never block a guest
          delete r.body.name;
        }
        return json(req, r.body, r.status);
      }
      if (url.pathname === '/usage' && req.method === 'POST') {
        const raw = await req.text();
        if (raw.length > 32768) return json(req, { ok: false, error: 'too large' }, 413);
        let body = {}; try { body = JSON.parse(raw); } catch (e) { }
        const now = env.NOW ? env.NOW() : Date.now();
        const events = (Array.isArray(body.events) ? body.events : []).slice(0, MAX_BATCH).map(e => cleanEvent(e, body.dev, now)).filter(Boolean);
        try { if (events.length) await ucall(env, '/add', { events, now }); } catch (e) { return json(req, { ok: false, error: 'not saved' }, 500); }
        return json(req, { ok: true, kept: events.length });
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
        if (url.pathname === '/admin/usage' && req.method === 'GET') { const r = await ucall(env, '/read', { days: Math.min(Math.max(+url.searchParams.get('days') || 30, 1), KEEP_DAYS), now: env.NOW ? env.NOW() : Date.now() }); return json(req, r.body, r.status); }
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
      return J({ ok: true, name: i.name });
    }
    return J({ ok: false, error: 'not found' }, 404);
  }
}


/* the usage log: its own Durable Object and its own storage, nothing shared with the vault. One row per event, no message text.
   Raw events are kept 90 days; daily totals are kept for good. */
export class Usage {
  constructor(state, env) { this.state = state; this.env = env || {}; }
  async fetch(request) {
    const path = new URL(request.url).pathname, body = await request.json().catch(() => ({}));
    const st = this.state.storage, J = (o, s) => new Response(JSON.stringify(o), { status: s || 200 });
    const now = body.now || Date.now();
    if (path === '/add') {
      let days = (await st.get('days')) || [], totals = (await st.get('totals')) || {};
      const byDay = {};
      for (const e of body.events) (byDay[dayOf(e.t)] = byDay[dayOf(e.t)] || []).push(e);
      for (const d of Object.keys(byDay)) {
        const cur = (await st.get('d:' + d)) || [];
        await st.put('d:' + d, cur.concat(byDay[d]).slice(-MAX_DAY_EVENTS));
        if (days.indexOf(d) < 0) days.push(d);
        const tot = totals[d] = totals[d] || { day: d, n: {}, pairs: {}, spoken: 0, typed: 0, failed: 0 };
        for (const e of byDay[d]) {
          tot.n[e.kind] = (tot.n[e.kind] || 0) + 1;
          if (e.kind === 'message') { if (e.pair) tot.pairs[e.pair] = (tot.pairs[e.pair] || 0) + 1; if (e.mode === 'spoken') tot.spoken++; if (e.mode === 'typed') tot.typed++; if (e.trOk === false) tot.failed++; }
        }
      }
      const cutoff = dayOf(now - KEEP_DAYS * DAY_MS), keep = [];
      for (const d of days) { if (d < cutoff) await st.delete('d:' + d); else keep.push(d); }
      await st.put('days', keep.sort()); await st.put('totals', totals);
      return J({ ok: true });
    }
    if (path === '/read') {
      const from = dayOf(now - (body.days || 30) * DAY_MS), days = ((await st.get('days')) || []).filter(d => d >= from), events = [];
      for (const d of days) events.push(...((await st.get('d:' + d)) || []));
      events.sort((a, b) => a.t - b.t);
      const totals = Object.values((await st.get('totals')) || {}).sort((a, b) => a.day < b.day ? -1 : 1);
      return J({ ok: true, events: events.slice(-5000), totals, keepDays: KEEP_DAYS });
    }
    return J({ ok: false, error: 'not found' }, 404);
  }
}
