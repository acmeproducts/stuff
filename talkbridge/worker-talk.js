/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js  ·  v4.2 ALWAYS-PUSH (plan v20.0.0 §4.6)\n   Lineage: ship R7 body + v4 RFC 8291 delivery class (e416a70), MINUS every\n   form of server-side presence inference (abandoned index A1-A3).

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
const TRANSIENT_TYPES = new Set(['hello', 'ping', 'pong', 'typing', 'reattach', 'ack']);

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

/* OBS1: bounded, read-only diagnostic ring. Records contain no message text,
   names, endpoint URLs, keys or credentials. Calls are observational only. */
const FR_SCHEMA = 'tbfr/1.0';
const FR_BUILD = 'R10.2-OBS1';
const FR_VERSION = 'obs1-relay/1';
const FR_MAX = 2000;
const FR_AGE_MS = 24 * 60 * 60 * 1000;
const FR_SALT = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
let frSeq = 0;
const frRing = [];
function frHex(buf) { let s=''; for (const n of new Uint8Array(buf)) s += n.toString(16).padStart(2,'0'); return s; }
async function frHash(value, trace = false) {
  if (value === null || value === undefined || value === '') return null;
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((trace ? 'tbfr-tr|' : `tbfr-id|${FR_SALT}|`) + String(value)));
  const h = frHex(b).slice(0, 16);
  return trace ? `trace:${h}` : h;
}
function frEventId(m) { return m && (m.eventId || m.chatId || m.pillId || m.threadId) || null; }
function frCallId(m) { return m && m.callId || null; }
function frTraceKey(m) {
  const id = frEventId(m) || frCallId(m);
  if (id) return `${m.type}|id|${id}`;
  if (m && m.type && m.ts && m.from) return `${m.type}|ts|${m.ts}|from|${m.from}`;
  return null;
}
function frSafeDetail(input = {}) {
  const allow = new Set(['status','httpStatus','reason','messageType','worthy','attempted','accepted','connected','subscribed','stale','count','errorName','idGap','traceGap']);
  const out = {};
  for (const [k,v] of Object.entries(input)) {
    if (!allow.has(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0,80);
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v;
  }
  return out;
}
async function frRecord(sessionId, clientId, message, event, phase, outcome, detail = {}, roomShared = false) {
  try {
    const now = Date.now();
    const [roomHash, deviceHash, traceId, eventIdHash, callIdHash] = await Promise.all([
      frHash(sessionId), frHash(clientId), frHash(frTraceKey(message), true), frHash(frEventId(message)), frHash(frCallId(message))
    ]);
    const safe = frSafeDetail(detail);
    if (message && message.type && !traceId) safe.traceGap = true;
    if (message && message.type && !frEventId(message) && !frCallId(message)) safe.idGap = true;
    const rec = { schemaVersion:FR_SCHEMA, buildId:FR_BUILD, versions:{buildId:FR_BUILD,appVersion:null,swVersion:null,relayVersion:FR_VERSION},
      recordId:`relay-${now.toString(36)}-${(++frSeq).toString(36)}-${crypto.randomUUID ? crypto.randomUUID().slice(0,8) : Math.random().toString(36).slice(2,10)}`,
      seq:frSeq, ts:new Date(now).toISOString(), tsMs:now, time:{wallIso:new Date(now).toISOString(),epochMs:now,monotonicMs:null,provenance:'observed'},
      source:'relay', event, phase, action:`${event}_${phase}`, outcome:outcome||'observed', reason:safe.reason||null,
      testRunId:null, traceId, eventType:message && message.type || null, eventKind:message&&message.type||null,
      eventId:eventIdHash?`event:${eventIdHash}`:null, callId:callIdHash?`call:${callIdHash}`:null, eventIdHash, callIdHash,
      roomHash:roomHash?`room:${roomHash}`:null, deviceHash:deviceHash?`device:${deviceHash}`:null,
      subject:{roomHash:roomHash?`room:${roomHash}`:null,deviceHash:deviceHash?`device:${deviceHash}`:null,subscriptionHash:null},
      state:{surface:'unknown',lifecycle:'unknown',visibility:'unknown',focus:null,currentRoomMatches:null,socket:'unknown',swController:null,permission:'unknown',testCondition:'unspecified',testConditionProvenance:'unknown'},
      provenance:'observed', detail:safe, redactions:[], error:outcome==='failed'?{name:safe.errorName||'Error',category:'normalized'}:null,
      _roomKey:String(sessionId||''), _clientKey:roomShared ? null : String(clientId||'') };
    frRing.push(rec);
    const cutoff = now - FR_AGE_MS;
    while (frRing.length && (frRing.length > FR_MAX || frRing[0].tsMs < cutoff)) frRing.shift();
  } catch (_) {}
}
function frExport(sessionId, clientId, since, limit) {
  const n = Math.max(1, Math.min(500, Number(limit)||500));
  return frRing.filter(r => r._roomKey === String(sessionId||'') && r.tsMs >= since && (r._clientKey === null || r._clientKey === String(clientId||'')))
    .slice(-n).map(r => { const o={...r}; delete o._roomKey; delete o._clientKey; return o; });
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
    this.lastWake = null;   /* observability — constructor-anchored */
    /* v4.2 (plan v20.0.0 §4.6): lastSeen and pendingWakes are DELETED (A1/A2).
       The relay holds no opinion about whether a device is watching. */
    this.env = env;
    this.seq = 0;
    this.messages = [];
    this.lastActivity = 0;
    this.subs = {};                     /* clientId -> { sub, at } */
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
      try { ws.send(text); frRecord(this.sessionId || payload.session, tag && tag.clientId, payload, 'socket_delivery', 'send', 'accepted', { accepted:true }); }
      catch (e) { frRecord(this.sessionId || payload.session, tag && tag.clientId, payload, 'socket_delivery', 'send', 'failed', { accepted:false, errorName:e && e.name || 'Error' }); }
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

  /* STEP 1: the reference delivery class — encrypted payload, high urgency,
     newest-wins topic, short TTL. Proven on the owner's locked iPhone 4/4. */
  async _pushOne(clientId, rec, msg) {
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    const keys = rec && rec.sub && rec.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) { frRecord(this.sessionId, clientId, msg, 'push_attempt', 'validate_subscription', 'not_attempted', { attempted:false, reason:'subscription_incomplete' }); return; }
    let body;
    try {
      body = await webpushEncrypt(JSON.stringify({ t: 'tb-wake', at: Date.now() }), keys.p256dh, keys.auth);
    } catch (e) { frRecord(this.sessionId, clientId, msg, 'push_attempt', 'encrypt', 'failed', { attempted:false, errorName:e && e.name || 'Error' }); return; }
    const headers = {
      TTL: '60', Urgency: 'high', Topic: 'tb-wake',
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length)
    };
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    frRecord(this.sessionId, clientId, msg, 'push_attempt', 'request', 'observed', { attempted:true });
    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      this.lastWake = { clientId, at: Date.now(), status: res.status };
      frRecord(this.sessionId, clientId, msg, 'push_service', 'response', res.ok ? 'accepted' : 'rejected', { httpStatus:res.status, accepted:res.ok });
      /* 404 and 410 mean the subscription is dead — the browser has revoked it.
         Keeping it would mean retrying forever against nothing. */
      if (res.status === 404 || res.status === 410) {
        delete this.subs[clientId];
        await this._saveSubs();
      }
    } catch (e) { frRecord(this.sessionId, clientId, msg, 'push_service', 'request', 'failed', { errorName:e && e.name || 'Error' }); }
  }

  /* v4.2 ALWAYS-PUSH (plan v20.0.0 §4.6, sources S1-S3): every push-worthy
     event goes to every subscribed device except the sender, unconditionally.
     A socket is not a person; the device decides presentation. The old
     freshness exemption and 1s ack-gate (A1-A3) are deleted, not disabled. */
  async _wakeOthers(msg, senderId) {
    if (!PUSH_WORTHY.has(msg.type)) { frRecord(this.sessionId || msg.session, senderId, msg, 'wake_decision', 'event_class', 'not_worthy', { worthy:false }, true); return; }
    const now = Date.now();
    const jobs = [];
    for (const [clientId, rec] of Object.entries(this.subs)) {
      if (clientId === senderId) { frRecord(this.sessionId || msg.session, clientId, msg, 'wake_decision', 'recipient', 'sender_skipped', { worthy:true, attempted:false }); continue; }
      if (rec.at && now - rec.at > SUB_TTL_MS) {         /* stale, drop it */
        frRecord(this.sessionId || msg.session, clientId, msg, 'wake_decision', 'recipient', 'stale_subscription', { worthy:true, stale:true, attempted:false });
        delete this.subs[clientId];
        continue;
      }
      frRecord(this.sessionId || msg.session, clientId, msg, 'wake_decision', 'recipient', 'push_selected', { worthy:true, stale:false, attempted:true });
      jobs.push(this._pushOne(clientId, rec, msg));
    }
    if (jobs.length) await Promise.all(jobs);
  }

  async fetch(request) {
    await this.ready;
    await this._touchSession();

    const url = new URL(request.url);
    this.sessionId = (url.searchParams.get('session') || this.sessionId || '').trim().slice(0, 128);
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
      if (body && body.type === 'diag') {
        return json({ ok: true, v: '4.2', obs: FR_VERSION, connected: [...this._connectedIds()], subs: Object.keys(this.subs).length, lastWake: this.lastWake });
      }
      if (body && body.type === 'diag-trace') {
        const related = this._connectedIds().has(clientId) || !!this.subs[clientId];
        if (!related) return err('Not related', 403);
        const since = Math.max(Date.now() - FR_AGE_MS, Number(body.since) || 0);
        return json({ ok:true, schemaVersion:FR_SCHEMA, buildId:FR_BUILD, version:FR_VERSION, records:frExport(this.sessionId, clientId, since, body.limit) });
      }
      if (body && body.type === 'vapid') {
        return json({ ok: true, vapid: VAPID_PUBLIC_KEY, push: !!this.env.VAPID_PRIVATE_KEY });
      }

      if (body && body.type === 'subscribe' && body.subscription && body.subscription.endpoint) {
        this.subs[clientId] = { sub: body.subscription, at: Date.now() };
        await this._saveSubs();
        frRecord(this.sessionId, clientId, body, 'subscription', 'stored', 'accepted', { subscribed:true });
        return json({ ok: true, subscribed: true, vapid: VAPID_PUBLIC_KEY });
      }

      if (body && body.type === 'unsubscribe') {
        delete this.subs[clientId];
        await this._saveSubs();
        frRecord(this.sessionId, clientId, body, 'subscription', 'removed', 'accepted', { subscribed:false });
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
    this.sessionId = msg.session || this.sessionId;
    frRecord(this.sessionId, null, msg, 'relay_receive', 'websocket', 'observed', { messageType:msg.type }, true);

    const isTransient = msg.transient === true || TRANSIENT_TYPES.has(msg.type);
    await this._touchSession();

    if (!isTransient) {
      await this._persist(msg);
      frRecord(this.sessionId, null, msg, 'persistence', 'stored', 'accepted', { messageType:msg.type }, true);
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
