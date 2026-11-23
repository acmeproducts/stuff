// wrist-relay: carries wrist motions from the watch to X (a page on the phone or desktop).
//   GET  /            the Lab (lab.html)
//   GET  /x           X itself (x.html)
//   GET  /signals.js  what the Lab and X share: hand, head and watch numbers; taught signals; combinations; actions (signals.lib.js)
//   POST /xlog        X writes one line of what happened (never what was said) to the shared log
//   GET  /health      {"ok":true,"v":"w1"}
//   POST /e/<code>    the watch posts one small JSON event; it is sent to every page listening on that code
//   GET  /s/<code>    a page listens (WebSocket)
//   GET  /log         recent events, newest last, codes masked (diagnostics the build session can read)
//   POST /t/<code>/<trial>/<n>   the Lab page saves one part of a trial (what the watch saw + what the owner did + rating)
//   GET  /trials      list of saved trial parts;  GET /trial/<key>  one part
//   POST /pair/<code> a page asks to listen: {"k":"<its secret or empty>"}. Reply: its secret, or legacy:true for an older watch
//   GET  /report/<code>?k=  the watch's sessions and panel snapshots, for the Lab's results table
// A page may send on its socket, and the watch is told in the reply to its next post:
//   {"cmd":"raw","on":1}  stream raw sensor rows (passed to pages, never written to the log)
//   {"cmd":"sleep"}       stop the reader (Watch off)
//   {"cmd":"buzz","p":[0,40,60,40]}  vibrate this pattern (milliseconds: wait, buzz, wait, buzz ...)
// Pairing (W1): a watch that sends the header x-wrist-key hardens its code. From then on posts need that key,
// and a page needs a secret, which /pair hands out once per watch start while the watch says its window is open ("pw").
import LAB from './lab.html';
import XPAGE from './x.html';
import SIGNALS from './signals.lib.js';

const V = 'w12';
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(req, env) {
    let p = new URL(req.url).pathname;
    try { p = decodeURIComponent(p); } catch (e) { /* leave as sent */ }
    const html = { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } };
    if (p === '/') return new Response(LAB, html);
    if (p === '/x') return new Response(XPAGE, html);
    if (p === '/signals.js') return new Response(SIGNALS, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' } });
    if (p === '/xlog' && req.method === 'POST') {
      const line = (await req.text()).slice(0, 400).replace(/[\r\n]+/g, ' ');
      await env.ROOM.get(env.ROOM.idFromName('log')).fetch('https://log/log', { method: 'POST', body: 'X ' + line });
      return json({ ok: true });
    }
    if (p === '/health') return json({ ok: true, v: V });
    if (p === '/log') return env.ROOM.get(env.ROOM.idFromName('log')).fetch(req);
    if (p === '/trials' || /^\/trial\/[\w.:-]{8,120}$/.test(p) || /^\/t\/\d{6}\/[\w.-]{8,80}\/\d{1,3}$/.test(p)) return env.ROOM.get(env.ROOM.idFromName('trials')).fetch(req);
    const pm = p.match(/^\/pair\/(\d{6})$/);
    if (pm && req.method === 'POST') {
      const ip = encodeURIComponent(req.headers.get('cf-connecting-ip') || 'local');
      const lim = env.ROOM.get(env.ROOM.idFromName('limits'));
      const can = await lim.fetch('https://l/limit?ip=' + ip).then(r => r.json()).catch(() => ({ ok: true }));
      if (!can.ok) return json({ ok: false, why: 'too many tries, wait a minute' }, 429);
      const r = await env.ROOM.get(env.ROOM.idFromName('room-' + pm[1])).fetch(req);
      if (r.status === 403) await lim.fetch('https://l/limit?fail=1&ip=' + ip).catch(() => {});
      return r;
    }
    const m = p.match(/^\/(e|s|report)\/(\d{6})$/);
    if (!m) return new Response('not found', { status: 404 });
    return env.ROOM.get(env.ROOM.idFromName('room-' + m[2])).fetch(req);
  }
};

export class Room {
  constructor(state, env) {
    this.state = state; this.env = env;
    try { state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong')); } catch (e) { /* older runtime */ }
  }
  async fetch(req) {
    const u = new URL(req.url);
    let p = u.pathname;
    try { p = decodeURIComponent(p); } catch (e) { /* leave as sent */ }
    if (p === '/limit') {
      // failed pairing attempts per address, last minute (kept in memory: losing it only forgives)
      this.tries = this.tries || new Map();
      const ip = u.searchParams.get('ip') || '?', now = Date.now();
      const a = (this.tries.get(ip) || []).filter(x => now - x < 60000);
      if (u.searchParams.get('fail')) a.push(now);
      if (this.tries.size > 5000) this.tries.clear();
      this.tries.set(ip, a);
      return json({ ok: a.length < 5 });
    }
    if (p === '/log') {
      // Read the request before touching storage: get and put must run back to back, or two
      // events arriving together each save their own copy and one line is lost.
      const text = req.method === 'POST' ? (await req.text()).slice(0, 1000) : '';
      let lines = (await this.state.storage.get('lines')) || [];
      if (req.method === 'POST') {
        lines.push(new Date().toISOString() + ' ' + text);
        if (lines.length > 500) lines = lines.slice(-500);
        await this.state.storage.put('lines', lines);
        return json({ ok: true });
      }
      if (req.method === 'DELETE') { await this.state.storage.delete('lines'); return json({ ok: true }); }
      return new Response(lines.join('\n') + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
    }
    if (p === '/trials') {
      const list = await this.state.storage.list({ prefix: 't:' });
      const out = [];
      for (const [k, v] of list) out.push({ key: k.slice(2), bytes: String(v).length });
      return json(out);
    }
    if (p.startsWith('/trial/')) {
      const v = await this.state.storage.get('t:' + p.slice(7));
      return v == null ? new Response('not found', { status: 404 }) : new Response(v, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    }
    if (p.startsWith('/t/') && req.method === 'POST') {
      const m = p.match(/^\/t\/\d{6}\/([\w.-]{8,80})\/(\d{1,3})$/);
      const body = await req.text();
      if (!m || body.length > 400000) return json({ ok: false, why: 'too big or bad name' }, 400);
      await this.state.storage.put('t:' + m[1] + ':' + m[2].padStart(3, '0'), body);
      const all = await this.state.storage.list({ prefix: 't:' });
      if (all.size > 1500) { let drop = all.size - 1500; for (const k of all.keys()) { if (drop-- <= 0) break; await this.state.storage.delete(k); } }
      return json({ ok: true, parts: all.size });
    }
    if (p.startsWith('/pair/') && req.method === 'POST') {
      await this.load();
      let k = '';
      try { k = String((await req.json()).k || ''); } catch (e) { /* no body */ }
      const info = { lastDiag: this.lastDiag, lastSeen: this.cur ? this.cur.end : 0, v: V };
      if (!this.wk) return json(Object.assign({ ok: true, legacy: true }, info));
      if (k && this.pks.includes(k)) return json(Object.assign({ ok: true, k }, info));
      if (Date.now() < this.pw.until && this.pw.nonce !== this.claimed) {
        const b = new Uint8Array(20);
        crypto.getRandomValues(b);
        const nk = Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
        this.pks.push(nk);
        if (this.pks.length > 8) this.pks = this.pks.slice(-8);
        this.claimed = this.pw.nonce;
        await this.state.storage.put({ pks: this.pks, claimed: this.claimed });
        await this.note(p.slice(-2), '{"t":"paired","browsers":' + this.pks.length + '}');
        return json(Object.assign({ ok: true, k: nk }, info));
      }
      return json({ ok: false, why: 'Open Wrist on the watch to pair this browser' }, 403);
    }
    if (p.startsWith('/report/')) {
      await this.load();
      if (this.wk && !this.pks.includes(u.searchParams.get('k') || '')) return json({ ok: false, why: 'pair first' }, 403);
      const sess = (await this.state.storage.get('sess')) || [];
      const snaps = (await this.state.storage.get('snaps')) || [];
      return json({ ok: true, hard: this.wk ? 1 : 0, lastDiag: this.lastDiag, sessions: this.cur ? sess.concat([this.cur]) : sess, snaps });
    }
    if (p.startsWith('/s/')) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
      await this.load();
      if (this.wk && !this.pks.includes(u.searchParams.get('k') || '')) return new Response('pair first', { status: 403 });
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      await this.note(p.slice(-2), '{"t":"page-joined","pages":' + this.state.getWebSockets().length + '}');
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (p.startsWith('/e/') && req.method === 'POST') {
      await this.load();
      const key = req.headers.get('x-wrist-key') || '';
      if (this.wk && key !== this.wk) return json({ ok: false, why: 'key' }, 403);
      if (!this.wk && key) { this.wk = key; await this.state.storage.put('wk', key); }
      const body = (await req.text()).slice(0, 900);
      let n = 0;
      let raw = 0;
      for (const ws of this.state.getWebSockets()) {
        try { ws.send(body); n++; const a = ws.deserializeAttachment(); if (a && a.raw) raw = 1; } catch (e) { /* a dead page */ }
      }
      if (body.indexOf('"rep":1') < 0 && body.indexOf('"t":"raw"') !== 1) await this.note(p.slice(-2), body + ' pages=' + n);   // after the pages already have it
      const reply = { ok: true, pages: n, raw };
      if (body.indexOf('"t":"raw"') !== 1) {
        let ev = null;
        try { ev = JSON.parse(body); } catch (e) { /* not JSON: carried, not tracked */ }
        if (ev) await this.track(ev, body);
      }
      if (this.cmd.at) {
        // a word from a page for the watch: handed over once, and only while it is fresh (a sleeping watch must not be put to sleep when it next starts)
        if (Date.now() - this.cmd.at < 20000) { if (this.cmd.sleep) reply.sleep = 1; if (this.cmd.buzz) reply.buzz = this.cmd.buzz; }
        this.cmd = {};
        await this.state.storage.delete('cmd');
      }
      return json(reply);
    }
    return new Response('not found', { status: 404 });
  }
  async load() {
    if (this.wk !== undefined) return;
    const m = await this.state.storage.get(['wk', 'pks', 'cur', 'lastDiag', 'claimed', 'cmd']);
    this.wk = m.get('wk') || ''; this.pks = m.get('pks') || []; this.cur = m.get('cur') || null;
    this.lastDiag = m.get('lastDiag') || 0; this.claimed = m.get('claimed') || 0; this.cmd = m.get('cmd') || {};
    this.pw = { nonce: 0, until: 0 }; this.saved = 0;
  }
  // One watch run = one session: start, end, battery at both ends, links used, longest silence, how it ended.
  async track(ev, body) {
    const now = Date.now(), up = +ev.up || 0;
    if (ev.pw) this.pw = { nonce: ev.pw, until: now + 15000 };
    let s = this.cur;
    if (!s || s.endWhy || up + 5 < s.up || now - s.end > 900000) {
      if (s) { const sess = (await this.state.storage.get('sess')) || []; sess.push(s); await this.state.storage.put('sess', sess.slice(-40)); }
      s = this.cur = { start: now - up * 1000, end: now, up, bat0: -1, bat1: -1, ln: {}, n: 0, gap: 0, b: ev.b || '', endWhy: '' };
      this.saved = 0;
    }
    if (now - s.end > s.gap) s.gap = now - s.end;
    s.end = now; s.up = up; s.n++;
    if (typeof ev.bat === 'number' && ev.bat >= 0) { if (s.bat0 < 0) s.bat0 = ev.bat; s.bat1 = ev.bat; }
    if (ev.ln) s.ln[ev.ln] = (s.ln[ev.ln] || 0) + 1;
    let must = false;
    if (ev.t === 'sleep') { s.endWhy = String(ev.why || 'sleep').slice(0, 20); must = true; }
    if (ev.t === 'diag') {
      this.lastDiag = now;
      const snaps = (await this.state.storage.get('snaps')) || [];
      snaps.push({ at: now, d: body });
      await this.state.storage.put({ snaps: snaps.slice(-60), lastDiag: now });
      must = true;
    }
    if (must || now - this.saved > 15000) { this.saved = now; await this.state.storage.put('cur', s); }
  }
  note(tail, text) {
    const log = this.env.ROOM.get(this.env.ROOM.idFromName('log'));
    return log.fetch('https://log/log', { method: 'POST', body: '****' + tail + ' ' + text }).then(r => r.text()).catch(() => {});
  }
  async webSocketMessage(ws, msg) {
    if (msg === 'ping') { try { ws.send('pong'); } catch (e) { /* closed */ } return; }
    let m = null;
    try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m) return;
    if (m.cmd === 'raw') { ws.serializeAttachment({ raw: m.on ? 1 : 0 }); return; }
    const buzzOk = m.cmd === 'buzz' && Array.isArray(m.p) && m.p.length >= 2 && m.p.length <= 12 && m.p.every(x => typeof x === 'number' && x >= 0 && x <= 600);
    if (m.cmd !== 'sleep' && !buzzOk) return;
    await this.load();
    this.cmd = Object.assign({}, this.cmd, m.cmd === 'sleep' ? { sleep: 1 } : { buzz: m.p.map(x => Math.round(x)) }, { at: Date.now() });
    await this.state.storage.put('cmd', this.cmd);
  }
  webSocketClose(ws, code) { try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'closed'); } catch (e) { /* already closed */ } }
  webSocketError() { }
}
