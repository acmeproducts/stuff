/* DevStream runner — Cloudflare Worker + one Durable Object per tab.
   Keys come with each job from the page's Config (saved in that browser); nothing is stored beyond the job.
   POST /run     hand over a job (the GitHub token must be able to push to the owner's repo)
   GET  /status  progress / result of the tab's current or last job
   POST /stop    stop the tab's job (message stays queued)
   GET  /health  version check */
import { runPipeline, verifyAccess, failJob } from './core.js';

const VERSION = 'b70';
const MAX_RUN_MS = 13 * 60 * 1000;
const ALLOWED_ORIGINS = ['https://acmeproducts.github.io'];

const cors = (req, extra) => {
  const o = req.headers.get('Origin') || '';
  return { 'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin', ...(extra || {}) };
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

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    if (url.pathname === '/health') return json(req, { ok: true, v: VERSION });
    try {
      let cfg, key, body = null;
      if (req.method === 'POST') { body = await req.json(); cfg = body.cfg; key = body.key; }
      else {
        const tok = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        cfg = { owner: url.searchParams.get('owner'), repo: url.searchParams.get('repo'), pat: tok }; key = url.searchParams.get('key');
      }
      if (!cfg || !key || !/^[\w.-]+$/.test(cfg.repo || '')) return json(req, { ok: false, error: 'missing job details' }, 400);
      const bad = await authed(env, cfg);
      if (bad) return json(req, { ok: false, error: bad }, 403);
      const stub = env.RUNNER.get(env.RUNNER.idFromName(cfg.owner + '/' + cfg.repo + '/' + key));
      if (url.pathname === '/run' && req.method === 'POST') return relay(req, await stub.fetch('https://do/start', { method: 'POST', body: JSON.stringify(body) }));
      if (url.pathname === '/status') return relay(req, await stub.fetch('https://do/status'));
      if (url.pathname === '/stop' && req.method === 'POST') return relay(req, await stub.fetch('https://do/stop', { method: 'POST' }));
      return json(req, { ok: false, error: 'not found' }, 404);
    } catch (e) { return json(req, { ok: false, error: String(e && e.message || e) }, 500); }
  }
};

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
