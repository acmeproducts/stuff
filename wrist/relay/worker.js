// wrist-relay: carries wrist motions from the watch to X (a page on the phone or desktop).
//   GET  /            the X practice page
//   GET  /health      {"ok":true,"v":"w1"}
//   POST /e/<code>    the watch posts one small JSON event; it is sent to every page listening on that code
//   GET  /s/<code>    a page listens (WebSocket)
//   GET  /log         recent events, newest last, codes masked (diagnostics the build session can read)
import PAGE from './x.html';

const V = 'w1';
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export default {
  async fetch(req, env) {
    const p = new URL(req.url).pathname;
    if (p === '/' || p === '/x') return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    if (p === '/health') return json({ ok: true, v: V });
    if (p === '/log') return env.ROOM.get(env.ROOM.idFromName('log')).fetch(req);
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
    const u = new URL(req.url), p = u.pathname;
    if (p === '/log') {
      let lines = (await this.state.storage.get('lines')) || [];
      if (req.method === 'POST') {
        lines.push(new Date().toISOString() + ' ' + (await req.text()).slice(0, 700));
        if (lines.length > 500) lines = lines.slice(-500);
        await this.state.storage.put('lines', lines);
        return json({ ok: true });
      }
      if (req.method === 'DELETE') { await this.state.storage.delete('lines'); return json({ ok: true }); }
      return new Response(lines.join('\n') + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
    }
    if (p.startsWith('/s/')) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket only', { status: 426 });
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      this.note(p.slice(-2), '{"t":"page-joined","pages":' + this.state.getWebSockets().length + '}');
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (p.startsWith('/e/') && req.method === 'POST') {
      const body = (await req.text()).slice(0, 600);
      let n = 0;
      for (const ws of this.state.getWebSockets()) { try { ws.send(body); n++; } catch (e) { /* a dead page */ } }
      if (body.indexOf('"rep":1') < 0) this.note(p.slice(-2), body + ' pages=' + n);
      return json({ ok: true, pages: n });
    }
    return new Response('not found', { status: 404 });
  }
  note(tail, text) {
    const log = this.env.ROOM.get(this.env.ROOM.idFromName('log'));
    this.state.waitUntil(log.fetch('https://log/log', { method: 'POST', body: '****' + tail + ' ' + text }).catch(() => {}));
  }
  webSocketMessage(ws, msg) { if (msg === 'ping') { try { ws.send('pong'); } catch (e) { /* closed */ } } }
  webSocketClose(ws, code) { try { ws.close(code === 1005 || code === 1006 ? 1000 : code, 'closed'); } catch (e) { /* already closed */ } }
  webSocketError() { }
}
