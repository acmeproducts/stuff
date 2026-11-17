// wrist-relay: carries wrist motions from the watch to X (a page on the phone or desktop).
//   GET  /            the X practice page
//   GET  /health      {"ok":true,"v":"w1"}
//   POST /e/<code>    the watch posts one small JSON event; it is sent to every page listening on that code
//   GET  /s/<code>    a page listens (WebSocket)
//   GET  /log         recent events, newest last, codes masked (diagnostics the build session can read)
//   POST /t/<code>/<trial>/<n>   the Lab page saves one part of a trial (what the watch saw + what the owner did + rating)
//   GET  /trials      list of saved trial parts;  GET /trial/<key>  one part
// A page may send {"cmd":"raw","on":1} on its socket: the watch is then told (in the reply to its next post)
// to stream raw sensor rows, which are passed to pages but never written to the log.
import PAGE from './x.html';

const V = 'w3';
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(req, env) {
    let p = new URL(req.url).pathname;
    try { p = decodeURIComponent(p); } catch (e) { /* leave as sent */ }
    if (p === '/' || p === '/x') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    if (p === '/health') return json({ ok: true, v: V });
    if (p === '/log') return env.ROOM.get(env.ROOM.idFromName('log')).fetch(req);
    if (p === '/trials' || /^\/trial\/[\w.:-]{8,120}$/.test(p) || /^\/t\/\d{6}\/[\w.-]{8,80}\/\d{1,3}$/.test(p)) return env.ROOM.get(env.ROOM.idFromName('trials')).fetch(req);
    const m = p.match(/^\/(e|s)\/(\d{6})$/);
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
    if (p === '/log') {
      // Read the request before touching storage: get and put must run back to back, or two
      // events arriving together each save their own copy and one line is lost.
      const text = req.method === 'POST' ? (await req.text()).slice(0, 700) : '';
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
    if (p.startsWith('/s/')) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      await this.note(p.slice(-2), '{"t":"page-joined","pages":' + this.state.getWebSockets().length + '}');
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (p.startsWith('/e/') && req.method === 'POST') {
      const body = (await req.text()).slice(0, 600);
      let n = 0;
      let raw = 0;
      for (const ws of this.state.getWebSockets()) {
        try { ws.send(body); n++; const a = ws.deserializeAttachment(); if (a && a.raw) raw = 1; } catch (e) { /* a dead page */ }
      }
      if (body.indexOf('"rep":1') < 0 && body.indexOf('"t":"raw"') !== 1) await this.note(p.slice(-2), body + ' pages=' + n);   // after the pages already have it
      return json({ ok: true, pages: n, raw });
    }
    return new Response('not found', { status: 404 });
  }
  note(tail, text) {
    const log = this.env.ROOM.get(this.env.ROOM.idFromName('log'));
    return log.fetch('https://log/log', { method: 'POST', body: '****' + tail + ' ' + text }).then(r => r.text()).catch(() => {});
  }
  webSocketMessage(ws, msg) {
    if (msg === 'ping') { try { ws.send('pong'); } catch (e) { /* closed */ } return; }
    try { const m = JSON.parse(msg); if (m && m.cmd === 'raw') ws.serializeAttachment({ raw: m.on ? 1 : 0 }); } catch (e) { /* not a command */ }
  }
  webSocketClose(ws, code) { try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'closed'); } catch (e) { /* already closed */ } }
  webSocketError() { }
}
