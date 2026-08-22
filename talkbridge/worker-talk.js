/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js  ·  push-capable replacement

   Everything the existing relay did is unchanged: the same route, the same
   session addressing, the same broadcast, the same history and transient
   handling. Three things are added, and nothing existing is altered.

     POST /signal?app=&session=&client=   body {type:'subscribe', ...}
         stores a push subscription for a client in that session.
     POST … {type:'unsubscribe'}          removes it.
     Any persisted message broadcast to a session also wakes every other
         subscribed client in it by push.

   PUSH CARRIES NO PAYLOAD, DELIBERATELY. A payload would have to be encrypted
   per subscription, which is a large amount of cryptography to get exactly
   right, and it would put message content in a third party's queue. Instead the
   push is a bare wake: the service worker receives it, fetches what it missed
   over the existing history endpoint, and decides what to show. The relay never
   sends content to a push service, and the encryption problem disappears.

   SETUP IS ONE SECRET. The public key and the contact subject are in this file
   below — the public key is handed to every browser that subscribes, so it is
   not a secret and keeping it in configuration only makes deployment harder.

     In the worker's settings, add one entry of type Secret:
        VAPID_PRIVATE_KEY   the base64url PKCS#8 string

   With that secret absent the worker runs exactly as the current one does and
   simply never pushes, so this file can be deployed before push is wanted.

   The relay is deliberately decoupled from where the app is hosted: nothing
   here refers to an origin, an account, or a repository.
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_HISTORY = 500;
const SESSION_TTL_MS = 12 * 60 * 1000;
const SUB_TTL_MS = 90 * 24 * 60 * 60 * 1000;   /* a subscription unused for this long is dropped */
/* A client counts as listening only if its socket is alive AND it has spoken
   recently. iOS keeps a backgrounded PWA's socket half-open for minutes while
   its JavaScript — and therefore its 30s ping — is frozen; a silent socket is
   a phone that needs waking. Two ping intervals plus grace. */
const LISTENING_MAX_SILENCE_MS = 75 * 1000;
export function isListening(hasSocket, lastSeenAt, now) {
  return !!hasSocket && typeof lastSeenAt === 'number' && (now - lastSeenAt) <= LISTENING_MAX_SILENCE_MS;
}
const TRANSIENT_TYPES = new Set(['hello', 'ping', 'pong', 'typing', 'reattach', 'ack']);

/* Public by design — handed to every browser that subscribes. */
const VAPID_PUBLIC_KEY = 'BCpmWbu3Hdj3LM0tYiPkslNsr2hKUj1ol5VQBt_VLBuvgt4gimV7F0XfJTKlCk7OYxm8bvmIVbB34lRvd3-eIoc';

/* A contact point push services may use. Never shown in the app, never verified. */
const VAPID_SUBJECT = 'mailto:nobody@nowhere.com';

/* Types worth waking a device for. A wake is cheap but not free, and waking for
   a heartbeat would be worse than not waking at all. */
const PUSH_WORTHY = new Set(['chat-msg', 'sys-pill', 'call-start', 'history-sync']);

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' }
  });
}
function err(msg, status = 400) {
  return new Response(msg, { status, headers: cors() });
}

/* ── base64url ────────────────────────────────────────────────────────────── */
function b64urlToBytes(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(bytes) {
  let bin = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* ── VAPID ────────────────────────────────────────────────────────────────
   A signed assertion that this server is who it claims to be. Cached per
   audience because it is valid for hours and signing it per push is waste. */
const vapidCache = new Map();

async function vapidHeader(env, endpoint) {
  if (!env.VAPID_PRIVATE_KEY) return null;
  const aud = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);

  const cached = vapidCache.get(aud);
  if (cached && cached.exp - now > 600) return cached.header;

  const exp = now + 12 * 60 * 60;
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud, exp, sub: VAPID_SUBJECT
  })));
  const signingInput = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    'pkcs8', b64urlToBytes(env.VAPID_PRIVATE_KEY),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${bytesToB64url(sig)}`;
  const value = `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`;
  vapidCache.set(aud, { header: value, exp });
  return value;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/signal') {
      return new Response('Not found', { status: 404, headers: cors() });
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }
    const app = (url.searchParams.get('app') || '').trim().slice(0, 64);
    const sessionId = (url.searchParams.get('session') || '').trim().slice(0, 128);
    if (!app) return err('Missing app');
    if (!sessionId) return err('Missing session');

    const id = env.TALK_SESSION.idFromName(`${app}::${sessionId}`);
    return env.TALK_SESSION.get(id).fetch(request);
  }
};

export class TalkSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.seq = 0;
    this.messages = [];
    this.lastActivity = 0;
    this.subs = {};
    this.lastSeen = this.lastSeen || {};   /* in-memory; missing = stale = wake — fails safe */                     /* clientId -> { sub, at } */
    this.ready = this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['seq', 'messages', 'lastActivity', 'subs']);
      this.seq = Number(stored.get('seq')) || 0;
      this.messages = stored.get('messages') || [];
      this.lastActivity = Number(stored.get('lastActivity')) || 0;
      this.subs = stored.get('subs') || {};
    });
  }

  async _touchSession() {
    const now = Date.now();
    if (this.lastActivity && now - this.lastActivity > SESSION_TTL_MS) {
      this.seq = 0;
      this.messages = [];
      await this.state.storage.put({ seq: 0, messages: [], lastActivity: now });
    } else {
      this.lastActivity = now;
      await this.state.storage.put({ lastActivity: now });
    }
  }

  async _persist(msg) {
    msg.seq = ++this.seq;
    this.messages.push(msg);
    if (this.messages.length > MAX_HISTORY) {
      this.messages = this.messages.slice(-MAX_HISTORY);
    }
    await this.state.storage.put({ seq: this.seq, messages: this.messages });
  }

  _broadcast(payload, skipClientId) {
    const text = JSON.stringify(payload);
    for (const ws of this.state.getWebSockets()) {
      const tag = ws.deserializeAttachment();
      if (tag && tag.clientId === skipClientId) continue;
      try { ws.send(text); } catch (_) {}
    }
  }

  /* Which clients are currently connected — those need no waking. */
  _connectedIds() {
    const ids = new Set();
    for (const ws of this.state.getWebSockets()) {
      const tag = ws.deserializeAttachment();
      if (tag && tag.clientId) ids.add(tag.clientId);
    }
    return ids;
  }

  async _saveSubs() {
    await this.state.storage.put({ subs: this.subs });
  }

  /* A bare wake. No content leaves for the push service — the worker fetches
     what it missed over the history endpoint it already has. */
  async _pushOne(clientId, rec) {
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    if (!endpoint) return;
    const headers = { TTL: '86400', 'Content-Length': '0', Urgency: 'high' };
    /* Urgency high: without it the push service may hold a payload-less wake
       for battery batching — the observed sporadic, pile-up delivery. Calls
       and missed calls are time-critical; high requests immediate delivery. */
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers });
      /* 404 and 410 mean the subscription is dead — the browser has revoked it.
         Keeping it would mean retrying forever against nothing. */
      if (res.status === 404 || res.status === 410) {
        delete this.subs[clientId];
        await this._saveSubs();
      }
    } catch (_) {}
  }

  async _wakeOthers(msg, senderId) {
    if (!PUSH_WORTHY.has(msg.type)) return;
    const connected = this._connectedIds();
    const now = Date.now();
    const jobs = [];
    for (const [clientId, rec] of Object.entries(this.subs)) {
      if (clientId === senderId) continue;
      if (isListening(connected.has(clientId), this.lastSeen[clientId], now)) continue;   /* live socket AND recent ping */
      if (rec.at && now - rec.at > SUB_TTL_MS) {         /* stale, drop it */
        delete this.subs[clientId];
        continue;
      }
      jobs.push(this._pushOne(clientId, rec));
    }
    if (jobs.length) await Promise.all(jobs);
  }

  async fetch(request) {
    await this.ready;
    await this._touchSession();

    const url = new URL(request.url);
    const clientId = (url.searchParams.get('client') || '').trim();

    if (request.headers.get('Upgrade') === 'websocket') {
      if (!clientId) return err('Missing client', 400);
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ clientId });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (request.method === 'GET') {
      const since = Number(url.searchParams.get('since') || 0);
      const msgs = this.messages.filter((m) => {
        if (m.seq <= since) return false;
        if (m.to && m.to !== clientId) return false;
        if (clientId && m.from === clientId) return false;
        return true;
      });
      return json(msgs);
    }

    if (request.method === 'POST') {
      if (!clientId) return err('Missing client', 400);
      let body;
      try { body = await request.json(); } catch (_) { return err('Bad body'); }

      /* The app asks for the public key before it can subscribe at all. */
      if (body && body.type === 'vapid') {
        return json({ ok: true, vapid: VAPID_PUBLIC_KEY, push: !!this.env.VAPID_PRIVATE_KEY });
      }

      if (body && body.type === 'subscribe' && body.subscription && body.subscription.endpoint) {
        this.subs[clientId] = { sub: body.subscription, at: Date.now() };
        await this._saveSubs();
        return json({ ok: true, subscribed: true, vapid: VAPID_PUBLIC_KEY });
      }

      if (body && body.type === 'unsubscribe') {
        delete this.subs[clientId];
        await this._saveSubs();
        return json({ ok: true, subscribed: false });
      }

      return err('Unknown request');
    }

    return err('Method not allowed', 405);
  }

  async webSocketMessage(ws, raw) {
    await this.ready;
    let msg;
    try { msg = JSON.parse(raw); } catch (_) { return; }
    if (!msg || !msg.type) return;

    const tag = ws.deserializeAttachment() || {};
    const clientId = tag.clientId || msg.from || '';
    if (clientId) this.lastSeen[clientId] = Date.now();
    msg.from = msg.from || clientId;
    msg.ts = msg.ts || Date.now();

    const isTransient = msg.transient === true || TRANSIENT_TYPES.has(msg.type);
    await this._touchSession();

    if (!isTransient) {
      await this._persist(msg);
    } else {
      this.seq++;
      await this.state.storage.put({ seq: this.seq });
    }

    this._broadcast(msg, clientId);

    /* Waking a sleeping device must never delay or endanger delivery to one
       that is awake, so it happens after the broadcast and its failures are
       swallowed. */
    if (!isTransient) {
      try { await this._wakeOthers(msg, clientId); } catch (_) {}
    }
  }

  async webSocketClose(ws, code, reason) {}

  async webSocketError(ws, error) {
    try { ws.close(1011, 'error'); } catch (_) {}
  }
}
