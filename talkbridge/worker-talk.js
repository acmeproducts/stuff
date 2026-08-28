/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js  ·  v5 (plan v20.2.0 §4.7.3, review contract §7)\n   Lineage: ship R7 body + v4 RFC 8291 delivery class (e416a70), MINUS every\n   form of server-side presence inference (abandoned index A1-A3).

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
const TRANSIENT_TYPES = new Set(['hello', 'ping', 'pong', 'typing', 'reattach', 'ack', 'presented']);
/* v5 (plan v20.2.0 §4.7.3, review §7): alert-eligible event types. history-sync
   is sync traffic, never an alert and never a wake — the history-guessing wake
   class is forbidden. Counters count chat-msg and terminal timed_out calls only. */
const ALERT_TYPES = new Set(['chat-msg', 'sys-pill', 'call-start', 'thread-invite']);
const LEDGER_TYPES = new Set(['chat-msg', 'sys-pill', 'call-start', 'call-end', 'thread-invite']);
const CALL_TYPES = new Set(['call-start', 'call-accept', 'call-decline', 'call-end']);
const BURST_MS = 10000;          /* review §4.1: one alert per 10s-quiet-separated room burst */
const PRESENT_WAIT_MS = 1000;    /* review §7.2: exact presentation ack window */
const LEDGER_CAP = 2000;
const LEDGER_TTL_MS = 90 * 24 * 3600 * 1000;   /* device subscription lifetime */
function topicSafe(x) { return String(x || 'tb').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'tb'; }

/* Public by design — handed to every browser that subscribes. */
const VAPID_PUBLIC_KEY = 'BCpmWbu3Hdj3LM0tYiPkslNsr2hKUj1ol5VQBt_VLBuvgt4gimV7F0XfJTKlCk7OYxm8bvmIVbB34lRvd3-eIoc';

/* A contact point push services may use. Never shown in the app, never verified. */
const VAPID_SUBJECT = 'mailto:nobody@nowhere.com';

/* Types worth waking a device for. A wake is cheap but not free, and waking for
   a heartbeat would be worse than not waking at all. */
const PUSH_WORTHY = new Set(['chat-msg', 'sys-pill', 'call-start', 'call-end', 'thread-invite', 'history-sync']);  /* v4.2: missed-call + thread invites wake locked phones */

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

/* ── STEP 1 (plan v17.1.0) · RFC 8291 payload encryption ─────────────────────
   The reference push that showed on the owner's LOCKED iPhone four-for-four
   carried an encrypted payload at Urgency: high. Empty unmarked pushes are
   the class Apple defers on locked devices. This is that same delivery
   class, implemented per RFC 8291 (aes128gcm) with WebCrypto, and gated by
   the RFC's own Appendix-A test vector — byte-exact or the build fails. */
function b64uToBytes(s) {
  const pad = '='.repeat((4 - s.length % 4) % 4);
  const b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}
function concatBytes(...arrs) {
  const n = arrs.reduce((t, a) => t + a.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
async function hkdf(salt, ikm, info, len) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8);
  return new Uint8Array(bits);
}
/* Encrypt plaintext for a push subscription (RFC 8291 single record).
   testKeys (optional): { asPrivateJwk, asPublicRaw, salt } for the RFC vector. */
async function webpushEncrypt(plaintext, p256dhB64u, authB64u, testKeys) {
  const uaPub = b64uToBytes(p256dhB64u);
  const authSecret = b64uToBytes(authB64u);
  let asKeys, salt;
  if (testKeys) {
    asKeys = {
      privateKey: await crypto.subtle.importKey('jwk', testKeys.asPrivateJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']),
      publicRaw: b64uToBytes(testKeys.asPublicRaw)
    };
    salt = b64uToBytes(testKeys.salt);
  } else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asKeys = { privateKey: kp.privateKey, publicRaw: new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)) };
    salt = crypto.getRandomValues(new Uint8Array(16));
  }
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256));
  const enc = new TextEncoder();
  const keyInfo = concatBytes(enc.encode('WebPush: info\0'), uaPub, asKeys.publicRaw);
  const ikm = await hkdf(authSecret, ecdh, keyInfo, 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const padded = concatBytes(enc.encode(plaintext), new Uint8Array([2]));   /* 0x02 = last record */
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded));
  const header = concatBytes(salt, new Uint8Array([0, 0, 16, 0, asKeys.publicRaw.length]), asKeys.publicRaw);
  return concatBytes(header, ct);
}

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
    /* v5 (plan v20.2.0 §4.7.3): presence inference stays deleted. What exists
       instead is PROOF tied to the exact event: a pending push per
       (device,eventId), cancelled only by presented(thatExactEventId) from a
       visible app within 1s (review §7.2). Plus the durable counter ledger
       with its own monotonic sequence and per-device cursors, on an
       independent lifetime from the 12-minute chat history (review §7.3). */
    this.env = env;
    this.seq = 0;
    this.messages = [];
    this.lastActivity = 0;
    this.subs = {};                     /* clientId -> { sub, navigate, at } */
    this.mute = {};                     /* clientId -> true when this device muted this room */
    this.cursors = {};                  /* clientId -> highest ledger l acknowledged seen */
    this.ledger = [];                   /* [{l,eventId,type,kind,callId,state,ts,from}] */
    this.lseq = 0;                      /* ledger sequence — NEVER reset with session history */
    this.calls = {};                    /* callId -> {state,kind,ts,startEventId} */
    this.burst = {};                    /* clientId -> ts of last chat event considered for alerting */
    this.sessionName = '';
    this.pendingPush = new Map();       /* `${clientId}|${eventId}` -> timeout handle */
    this.pushLog = [];                  /* per-event diagnostics ring (review §8.8): never a single slot */
    this.ready = this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['seq', 'messages', 'lastActivity', 'subs', 'mute', 'cursors', 'ledger', 'lseq', 'calls', 'burst', 'sessionName']);
      this.seq = Number(stored.get('seq')) || 0;
      this.messages = stored.get('messages') || [];
      this.lastActivity = Number(stored.get('lastActivity')) || 0;
      this.subs = stored.get('subs') || {};
      this.mute = stored.get('mute') || {};
      this.cursors = stored.get('cursors') || {};
      this.ledger = stored.get('ledger') || [];
      this.lseq = Number(stored.get('lseq')) || 0;
      this.calls = stored.get('calls') || {};
      this.burst = stored.get('burst') || {};
      this.sessionName = stored.get('sessionName') || '';
    });
  }

  /* Session-history TTL resets CHAT HISTORY ONLY. The ledger, cursors, mute
     state, call records, and subscriptions live on their own durable lifetime
     (review §7.3) — a counter must survive the 12-minute history boundary. */
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

  _minCursor() {
    const ids = Object.keys(this.subs);
    if (!ids.length) return this.lseq;
    let m = Infinity;
    for (const id of ids) m = Math.min(m, Number(this.cursors[id]) || 0);
    return m;
  }

  async _ledgerAppend(entry) {
    entry.l = ++this.lseq;
    this.ledger.push(entry);
    /* compaction only behind the acknowledged cursor of every live device,
       plus the hard cap and the 90-day lifetime */
    const floor = this._minCursor();
    const cutoff = Date.now() - LEDGER_TTL_MS;
    this.ledger = this.ledger.filter((e, i, a) => (e.l > floor || e.ts > cutoff) && i >= a.length - LEDGER_CAP);
    await this.state.storage.put({ ledger: this.ledger, lseq: this.lseq });
  }

  /* Call outcome state machine (review §7.1, §8.3). Ship vocabulary mapped to
     canonical states; a call-state transition can never be mistaken for an
     earlier call-start, and a terminal state cancels that call's still-pending
     start pushes (no stale call-start after cancel/answer). */
  async _callFsm(msg) {
    const callId = msg.callId || (msg.type === 'call-start' ? msg.eventId : null);
    if (!callId) return null;
    let rec = this.calls[callId];
    if (msg.type === 'call-start') {
      if (rec) { msg.eventId = rec.startEventId; return rec; }   /* retry keeps the same IDs */
      rec = this.calls[callId] = { state: 'started', kind: msg.kind === 'video' ? 'video' : 'voice', ts: msg.ts, startEventId: msg.eventId };
    } else if (rec) {
      if (msg.type === 'call-accept') rec.state = 'answered';
      else if (msg.type === 'call-decline') rec.state = 'declined';
      else if (msg.type === 'call-end') {
        if (rec.state === 'answered') rec.state = 'ended';
        else if (rec.state === 'started') rec.state = (msg.reason === 'missed') ? 'timed_out' : 'canceled';
      }
      if (rec.state !== 'started') {
        for (const key of [...this.pendingPush.keys()]) {
          if (key.endsWith('|' + rec.startEventId)) { clearTimeout(this.pendingPush.get(key)); this.pendingPush.delete(key); }
        }
      }
    }
    const trimmed = Object.keys(this.calls);
    if (trimmed.length > 100) for (const k of trimmed.slice(0, trimmed.length - 100)) delete this.calls[k];
    await this.state.storage.put({ calls: this.calls });
    return this.calls[callId] || null;
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

  /* The one event envelope (review §7.1/§7.4): versioned, encrypted, generic
     text plus routing/dedupe metadata — never message content. Declarative on
     supporting Apple systems; the identical decrypted JSON is parsed by the
     legacy worker elsewhere. Topic is per event class and room — the global
     tb-wake topic is forbidden because it collapses unrelated events. */
  _bodyFor(meta) {
    if (meta.type === 'call-start') return meta.kind === 'video' ? 'Incoming video call' : 'Incoming voice call';
    if (meta.type === 'thread-invite') return 'New thread invite';
    return 'New message';
  }
  _envelope(rec, meta) {
    const nav = (rec && rec.navigate || '') ? rec.navigate + '#open=' + encodeURIComponent(this.sessionName) : undefined;
    const envelope = {
      web_push: 8030,
      notification: {
        title: 'TalkBridge',
        body: this._bodyFor(meta),
        tag: 'tb-' + topicSafe(this.sessionName),
        silent: false
      },
      tb: { v: 1, eventId: meta.eventId, roomId: this.sessionName, type: meta.type, kind: meta.kind || null, callId: meta.callId || null, ts: meta.ts }
    };
    if (nav) envelope.notification.navigate = nav;
    return envelope;
  }
  async _pushOne(clientId, rec, meta) {
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    const keys = rec && rec.sub && rec.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) return;
    const envelope = this._envelope(rec, meta);
    let body;
    try {
      body = await webpushEncrypt(JSON.stringify(envelope), keys.p256dh, keys.auth);
    } catch (_) { return; }
    const topic = meta.type === 'call-start' ? topicSafe('c' + (meta.callId || meta.eventId)) : topicSafe('m' + this.sessionName);
    const headers = {
      TTL: '60', Urgency: 'high', Topic: topic,
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length)
    };
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      this._logPush({ eventId: meta.eventId, client: clientId, outcome: 'pushed', status: res.status, at: Date.now() });
      if (res.status === 404 || res.status === 410) {
        delete this.subs[clientId];
        await this._saveSubs();
      }
    } catch (e) {
      this._logPush({ eventId: meta.eventId, client: clientId, outcome: 'error', status: 0, at: Date.now() });
    }
  }

  _logPush(entry) {
    this.pushLog.push(entry);
    if (this.pushLog.length > 50) this.pushLog = this.pushLog.slice(-50);
  }

  /* Review §7.2 — exact presentation acknowledgement, per device, per event:
     1. event written to the ledger and broadcast on sockets (already done);
     2. a VISIBLE app presents and returns presented(eventId);
     3. the relay waits at most 1s for THAT acknowledgement; absence → one push.
     Sockets, pings, heartbeats, unrelated words: never suppression.
     Mute (per device, per room) means no push is ever scheduled; the ledger
     still records the event so counts stay exact.
     Chat burst (review §4.1): the first chat after ≥10s of quiet alerts; later
     chats inside 10s extend the burst without another alert — per device. */
  _scheduleWakes(msg, senderId) {
    if (!ALERT_TYPES.has(msg.type)) return;
    const now = Date.now();
    for (const [clientId, rec] of Object.entries(this.subs)) {
      if (clientId === senderId) continue;
      if (rec.at && now - rec.at > SUB_TTL_MS) { delete this.subs[clientId]; continue; }
      if (this.mute[clientId]) { this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'muted', status: -1, at: now }); continue; }
      if (msg.type === 'chat-msg') {
        const last = Number(this.burst[clientId]) || 0;
        const eligible = now - last >= BURST_MS;
        this.burst[clientId] = now;
        if (!eligible) { this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'burst-suppressed', status: -1, at: now }); continue; }
      }
      if (msg.type === 'call-start') {
        const rec2 = this.calls[msg.callId || msg.eventId];
        if (rec2 && rec2.state !== 'started') continue;   /* terminal already known: no stale ring */
      }
      const key = clientId + '|' + msg.eventId;
      if (this.pendingPush.has(key)) continue;            /* retry keeps the same IDs; one attempt */
      const meta = { eventId: msg.eventId, type: msg.type, kind: msg.kind || (this.calls[msg.callId] && this.calls[msg.callId].kind) || null, callId: msg.callId || null, ts: msg.ts };
      const t = setTimeout(() => {
        this.pendingPush.delete(key);
        this._pushOne(clientId, this.subs[clientId], meta);
      }, PRESENT_WAIT_MS);
      this.pendingPush.set(key, t);
      this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'scheduled', status: -1, at: now });
    }
    try { this.state.storage.put({ burst: this.burst }); } catch (_) {}
  }

  async fetch(request) {
    await this.ready;
    await this._touchSession();

    const url = new URL(request.url);
    const clientId = (url.searchParams.get('client') || '').trim();
    const sess = (url.searchParams.get('session') || '').trim();
    if (sess && sess !== this.sessionName) {
      this.sessionName = sess;
      await this.state.storage.put({ sessionName: sess });
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      if (!clientId) return err('Missing client', 400);
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ clientId });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (request.method === 'GET') {
      /* Review §7.3: the counter ledger, on its own durable lifetime. Events
         from other devices after this device's acknowledged cursor. */
      if (url.searchParams.get('ledger') === '1') {
        if (!clientId) return err('Missing client', 400);
        const cur = Number(this.cursors[clientId]) || 0;
        const stale = this.subs[clientId] && this.subs[clientId].at && (Date.now() - this.subs[clientId].at > SUB_TTL_MS);
        const events = this.ledger.filter((e) => e.l > cur && e.from !== clientId)
          .map((e) => ({ l: e.l, eventId: e.eventId, type: e.type, kind: e.kind || null, callId: e.callId || null, state: e.callId ? ((this.calls[e.callId] || {}).state || null) : null, ts: e.ts }));
        return json({ ok: true, events, cursor: cur, lseq: this.lseq, complete: !stale });
      }
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
      if (body && body.type === 'diag') {
        /* Per-event diagnostics (review §8.8): a ring of outcomes, never one
           overwriteable slot. */
        return json({ ok: true, v: '5', connected: [...this._connectedIds()], subs: Object.keys(this.subs).length,
          pushLog: this.pushLog.slice(-20), pending: [...this.pendingPush.keys()],
          cursors: this.cursors, mute: this.mute, lseq: this.lseq, ledgerLen: this.ledger.length });
      }
      if (body && body.type === 'vapid') {
        return json({ ok: true, vapid: VAPID_PUBLIC_KEY, push: !!this.env.VAPID_PRIVATE_KEY });
      }

      if (body && body.type === 'subscribe' && body.subscription && body.subscription.endpoint) {
        this.subs[clientId] = { sub: body.subscription, navigate: String(body.navigate || '').slice(0, 300), at: Date.now() };
        await this._saveSubs();
        return json({ ok: true, subscribed: true, vapid: VAPID_PUBLIC_KEY });
      }

      /* Review §4.3: mute is per device per room and the UI may claim it only
         after this acknowledgement. */
      if (body && body.type === 'mute') {
        this.mute[clientId] = body.muted === true;
        if (!this.mute[clientId]) delete this.mute[clientId];
        await this.state.storage.put({ mute: this.mute });
        return json({ ok: true, muted: body.muted === true });
      }

      /* Review §7.3: atomic, monotonic cursor advance — marks ledger items seen. */
      if (body && body.type === 'cursor') {
        const l = Number(body.l) || 0;
        this.cursors[clientId] = Math.max(Number(this.cursors[clientId]) || 0, l);
        await this.state.storage.put({ cursors: this.cursors });
        return json({ ok: true, cursor: this.cursors[clientId] });
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
    msg.from = msg.from || clientId;
    msg.ts = msg.ts || Date.now();

    /* Exact presentation ack (review §7.2): cancels ONLY its own event's
       pending push for this device. Nothing else a socket says suppresses. */
    if (msg.type === 'presented' && msg.eventId && clientId) {
      const key = clientId + '|' + msg.eventId;
      const t = this.pendingPush.get(key);
      if (t) { clearTimeout(t); this.pendingPush.delete(key);
        this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'presented', status: -1, at: Date.now() }); }
      return;
    }

    const isTransient = msg.transient === true || TRANSIENT_TYPES.has(msg.type);
    await this._touchSession();

    /* Stable event identity (review §7.1): client-supplied when it exists
       (chatId / pillId / threadId / callId+state), else relay-derived. A retry
       carries the same id and cannot double-schedule or double-count. */
    if (LEDGER_TYPES.has(msg.type) || CALL_TYPES.has(msg.type)) {
      msg.eventId = msg.eventId || msg.chatId || msg.pillId || (msg.threadId ? 'ti-' + msg.threadId : '') || (msg.callId ? msg.callId + ':' + msg.type : '') || ('e' + (this.lseq + 1) + ':' + msg.type);
    }
    if (CALL_TYPES.has(msg.type)) {
      msg.callId = msg.callId || (msg.type === 'call-start' ? msg.eventId : msg.callId);
      try { await this._callFsm(msg); } catch (_) {}
    }

    if (!isTransient) {
      await this._persist(msg);
    } else {
      this.seq++;
      await this.state.storage.put({ seq: this.seq });
    }

    if (LEDGER_TYPES.has(msg.type)) {
      const dup = this.ledger.some((e) => e.eventId === msg.eventId && e.type === msg.type);
      if (!dup) {
        try { await this._ledgerAppend({ eventId: msg.eventId, type: msg.type, kind: msg.kind || null, callId: msg.callId || null, ts: msg.ts, from: clientId }); } catch (_) {}
      }
    }

    this._broadcast(msg, clientId);

    /* Scheduling never delays socket delivery and its failures are swallowed. */
    if (!isTransient) {
      try { this._scheduleWakes(msg, clientId); } catch (_) {}
    }
  }

  async webSocketClose(ws, code, reason) {}

  async webSocketError(ws, error) {
    try { ws.close(1011, 'error'); } catch (_) {}
  }
}
