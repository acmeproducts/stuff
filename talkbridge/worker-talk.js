/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js · v5.1 (R10.5, plan v20.5.1 §4.9)

   One durable presentation owner is chosen per event/device. An exact
   foreground-ready response wins in_app; otherwise owner=os is committed
   before one encrypted, versioned Web Push is attempted. Late sockets cannot
   reverse that decision. Muted and burst-suppressed events receive explicit
   quiet commits. The durable ledger owns counters and terminal call outcomes.

   Pushes contain generic display text plus routing/dedupe identifiers only—no
   message text, transcript, name, key, or credential. The same envelope serves
   declarative Web Push and the legacy service-worker path. Integrated recorder
   data is bounded, redacted, read-only, and never consulted by product logic.
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_HISTORY = 500;
const SESSION_TTL_MS = 12 * 60 * 1000;
const SUB_TTL_MS = 90 * 24 * 60 * 60 * 1000;   /* a subscription unused for this long is dropped */
const TRANSIENT_TYPES = new Set(['hello', 'ping', 'pong', 'typing', 'reattach', 'ack', 'foreground-ready']);
/* v5 (plan v20.2.0 §4.7.3, review §7): alert-eligible event types. history-sync
   is sync traffic, never an alert and never a wake — the history-guessing wake
   class is forbidden. Counters count chat-msg and terminal timed_out calls only. */
const ALERT_TYPES = new Set(['chat-msg', 'sys-pill', 'call-start', 'thread-invite']);
const LEDGER_TYPES = new Set(['chat-msg', 'sys-pill', 'call-start', 'call-end', 'thread-invite']);
const CALL_TYPES = new Set(['call-start', 'call-accept', 'call-decline', 'call-end']);
const BURST_MS = 10000;          /* review §4.1: one alert per 10s-quiet-separated room burst */
const PRESENT_WAIT_MS = 500;     /* exact-event foreground offer, inside the five-second alert budget */
const LEDGER_CAP = 2000;
const LEDGER_TTL_MS = 90 * 24 * 3600 * 1000;   /* device subscription lifetime */
function topicSafe(x) { return String(x || 'tb').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) || 'tb'; }

/* Public by design — handed to every browser that subscribes. */
const VAPID_PUBLIC_KEY = 'BCpmWbu3Hdj3LM0tYiPkslNsr2hKUj1ol5VQBt_VLBuvgt4gimV7F0XfJTKlCk7OYxm8bvmIVbB34lRvd3-eIoc';

/* A contact point push services may use. Never shown in the app, never verified. */
const VAPID_SUBJECT = 'mailto:nobody@nowhere.com';

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

/* Integrated R10.5 recorder. Records are redacted, bounded, read-only and
   never consulted by product routing or presentation decisions. */
const FR_SCHEMA = 'tbfr/1.0';
const FR_BUILD = 'R10.5';
const FR_VERSION = 'r10.5-relay/1';
const FR_MAX = 2000;
const FR_AGE_MS = 24 * 60 * 60 * 1000;
let FR_SALT = null;
function frSalt() { if (!FR_SALT) FR_SALT = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; return FR_SALT; }
let frSeq = 0;
const frRing = [];
function frHex(buf) { let s=''; for (const n of new Uint8Array(buf)) s += n.toString(16).padStart(2,'0'); return s; }
async function frHash(value, trace = false) {
  if (value === null || value === undefined || value === '') return null;
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode((trace ? 'tbfr-tr|' : `tbfr-id|${frSalt()}|`) + String(value)));
  const h = frHex(b).slice(0, 16); return trace ? `trace:${h}` : h;
}
function frEventId(m) { return m && (m.eventId || m.chatId || m.pillId || m.threadId) || null; }
function frCallId(m) { return m && m.callId || null; }
function frTraceKey(m) { const id=frEventId(m)||frCallId(m); if(id)return `${m.type}|id|${id}`; return null; }
function frSafeDetail(input = {}) {
  const allow = new Set(['status','httpStatus','reason','messageType','worthy','attempted','accepted','connected','subscribed','muted','stale','count','errorName','idGap','traceGap','owner','eventIdPresent']);
  const out = {};
  for (const [k,v] of Object.entries(input)) { if (!allow.has(k)) continue; if (typeof v === 'string') out[k]=v.slice(0,80); else if (typeof v === 'number'||typeof v === 'boolean'||v===null) out[k]=v; }
  return out;
}
async function frRecord(sessionId, clientId, message, event, phase, outcome, detail = {}, roomShared = false) {
  try {
    const now=Date.now();
    const [roomHash,deviceHash,traceId,eventIdHash,callIdHash]=await Promise.all([frHash(sessionId),frHash(clientId),frHash(frTraceKey(message),true),frHash(frEventId(message)),frHash(frCallId(message))]);
    const safe=frSafeDetail(detail); if(message&&message.type&&!traceId)safe.traceGap=true; if(message&&message.type&&!frEventId(message)&&!frCallId(message))safe.idGap=true;
    const rec={schemaVersion:FR_SCHEMA,buildId:FR_BUILD,versions:{buildId:FR_BUILD,appVersion:null,swVersion:null,relayVersion:FR_VERSION},recordId:`relay-${now.toString(36)}-${(++frSeq).toString(36)}-${crypto.randomUUID?crypto.randomUUID().slice(0,8):Math.random().toString(36).slice(2,10)}`,seq:frSeq,ts:new Date(now).toISOString(),tsMs:now,time:{wallIso:new Date(now).toISOString(),epochMs:now,monotonicMs:null,provenance:'observed'},source:'relay',event,phase,action:`${event}_${phase}`,outcome:outcome||'observed',reason:safe.reason||null,testRunId:null,traceId,eventType:message&&message.type||null,eventKind:message&&message.type||null,eventId:eventIdHash?`event:${eventIdHash}`:null,callId:callIdHash?`call:${callIdHash}`:null,subject:{roomHash:roomHash?`room:${roomHash}`:null,deviceHash:deviceHash?`device:${deviceHash}`:null,subscriptionHash:null},state:{surface:'unknown',lifecycle:'unknown',visibility:'unknown',focus:null,currentRoomMatches:null,socket:'unknown',swController:null,permission:'unknown',testCondition:'unspecified',testConditionProvenance:'unknown'},provenance:'observed',detail:safe,redactions:[],error:outcome==='failed'?{name:safe.errorName||'Error',category:'normalized'}:null,_roomKey:String(sessionId||''),_clientKey:roomShared?null:String(clientId||'')};
    frRing.push(rec); const cutoff=now-FR_AGE_MS; while(frRing.length&&(frRing.length>FR_MAX||frRing[0].tsMs<cutoff))frRing.shift();
  } catch (_) {}
}
function frExport(sessionId,clientId,since,limit){const n=Math.max(1,Math.min(500,Number(limit)||500));return frRing.filter(r=>r._roomKey===String(sessionId||'')&&r.tsMs>=since&&(r._clientKey===null||r._clientKey===String(clientId||''))).slice(-n).map(r=>{const o={...r};delete o._roomKey;delete o._clientKey;return o;});}

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
    this.pendingDecisions = new Map();  /* `${clientId}|${eventId}` -> timeout handle */
    this.presentation = {};            /* durable irreversible owner per recipient/event */
    this.pushLog = [];                  /* per-event diagnostics ring (review §8.8): never a single slot */
    this.ready = this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['seq', 'messages', 'lastActivity', 'subs', 'mute', 'cursors', 'ledger', 'lseq', 'calls', 'burst', 'sessionName', 'presentation']);
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
      this.presentation = stored.get('presentation') || {};
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
        await this._resolveTerminalCall(callId, rec.state);
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
      try { ws.send(text); frRecord(this.sessionName, tag && tag.clientId, payload, 'socket_delivery', 'send', 'accepted', { accepted:true }); }
      catch (e) { frRecord(this.sessionName, tag && tag.clientId, payload, 'socket_delivery', 'send', 'failed', { accepted:false,errorName:e&&e.name||'Error' }); }
    }
  }

  _sendTo(clientId, payload) {
    const text = JSON.stringify(payload);
    let sent = 0;
    for (const ws of this.state.getWebSockets()) {
      const tag = ws.deserializeAttachment();
      if (!tag || tag.clientId !== clientId) continue;
      try { ws.send(text); sent++; frRecord(this.sessionName, clientId, payload, 'socket_delivery', 'targeted', 'accepted', { accepted:true }); }
      catch (e) { frRecord(this.sessionName, clientId, payload, 'socket_delivery', 'targeted', 'failed', { accepted:false,errorName:e&&e.name||'Error' }); }
    }
    return sent;
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
    let nav;
    try {
      const u = new URL(rec && rec.navigate || '');
      u.hash = '';
      u.searchParams.set('tbEvent', meta.eventId);
      u.searchParams.set('tbRoom', this.sessionName);
      u.searchParams.set('tbType', meta.type);
      if (meta.kind) u.searchParams.set('tbKind', meta.kind);
      if (meta.callId) u.searchParams.set('tbCall', meta.callId);
      nav = u.toString();
    } catch (_) { nav = undefined; }
    const envelope = {
      web_push: 8030,
      notification: {
        title: 'TalkBridge',
        body: this._bodyFor(meta),
        tag: 'tb-' + topicSafe(this.sessionName),
        silent: false
      },
      tb: { v: 2, eventId: meta.eventId, roomId: this.sessionName, type: meta.type, kind: meta.kind || null, callId: meta.callId || null, state: meta.state || null, ts: meta.ts }
    };
    if (nav) envelope.notification.navigate = nav;
    return envelope;
  }
  async _pushOne(clientId, rec, meta) {
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    const keys = rec && rec.sub && rec.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) { frRecord(this.sessionName,clientId,meta,'push_attempt','validate_subscription','not_attempted',{attempted:false,reason:'subscription_incomplete'}); return; }
    const envelope = this._envelope(rec, meta);
    let body;
    try {
      body = await webpushEncrypt(JSON.stringify(envelope), keys.p256dh, keys.auth);
    } catch (e) { frRecord(this.sessionName,clientId,meta,'push_attempt','encrypt','failed',{attempted:false,errorName:e&&e.name||'Error'}); return; }
    const topic = meta.type === 'call-start' ? topicSafe('c' + (meta.callId || meta.eventId)) : topicSafe('m' + this.sessionName);
    const headers = {
      TTL: '60', Urgency: 'high', Topic: topic,
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length)
    };
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    frRecord(this.sessionName,clientId,meta,'push_attempt','request','observed',{attempted:true});
    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      frRecord(this.sessionName,clientId,meta,'push_service','response',res.ok?'accepted':'rejected',{httpStatus:res.status,accepted:res.ok});
      this._logPush({ eventId: meta.eventId, client: clientId, outcome: 'pushed', status: res.status, at: Date.now() });
      if (res.status === 404 || res.status === 410) {
        delete this.subs[clientId];
        await this._saveSubs();
      }
    } catch (e) {
      frRecord(this.sessionName,clientId,meta,'push_service','request','failed',{errorName:e&&e.name||'Error'});
      this._logPush({ eventId: meta.eventId, client: clientId, outcome: 'error', status: 0, at: Date.now() });
    }
  }

  _logPush(entry) {
    this.pushLog.push(entry);
    if (this.pushLog.length > 50) this.pushLog = this.pushLog.slice(-50);
  }

  _presentationKey(clientId, eventId) { return clientId + '|' + eventId; }

  async _savePresentation() {
    const keys = Object.keys(this.presentation);
    if (keys.length > 2000) {
      keys.sort((a, b) => (this.presentation[a].at || 0) - (this.presentation[b].at || 0));
      for (const k of keys.slice(0, keys.length - 2000)) delete this.presentation[k];
    }
    await this.state.storage.put({ presentation: this.presentation });
  }

  async _commitOwner(clientId, meta, owner, reason, push) {
    const key = this._presentationKey(clientId, meta.eventId);
    const existing = this.presentation[key];
    if (existing && existing.owner) {
      this._sendTo(clientId, { type: existing.owner === 'in_app' ? 'presentation-grant' : 'presentation-commit',
        transient: true, eventId: meta.eventId, owner: existing.owner, reason: existing.reason,
        state: existing.state || null, presentationMeta: meta });
      return existing;
    }
    const timer = this.pendingDecisions.get(key);
    if (timer) clearTimeout(timer);
    this.pendingDecisions.delete(key);
    const rec = this.presentation[key] = { owner, reason, state: meta.state || null, at: Date.now() };
    await this._savePresentation();
    frRecord(this.sessionName, clientId, meta, 'presentation_owner', 'committed', 'accepted', { owner, reason, attempted:!!push });
    this._sendTo(clientId, { type: owner === 'in_app' ? 'presentation-grant' : 'presentation-commit', transient: true,
      eventId: meta.eventId, owner, reason, state: rec.state, presentationMeta: meta });
    this._logPush({ eventId: meta.eventId, client: clientId, outcome: 'owner-' + owner, reason, status: -1, at: rec.at });
    if (push && owner === 'os') await this._pushOne(clientId, this.subs[clientId], meta);
    return rec;
  }

  async _resolveTerminalCall(callId, state) {
    const call = this.calls[callId];
    if (!call || !call.startEventId) return;
    for (const clientId of Object.keys(this.subs)) {
      const key = this._presentationKey(clientId, call.startEventId);
      if (!this.pendingDecisions.has(key)) continue;
      await this._commitOwner(clientId, { eventId: call.startEventId, type: 'call-start', kind: call.kind,
        callId, state, ts: call.ts }, 'terminal', 'call-' + state, false);
    }
  }

  /* One irreversible presentation owner. A visible page asks for the exact
     event, then waits for the grant before presenting. Timeout commits the OS
     path first and only then submits one push. Late pages receive that commit
     and cannot ring. Mute and burst suppression are explicit quiet commits. */
  _offerPresentations(msg, senderId) {
    if (!ALERT_TYPES.has(msg.type)) return;
    const now = Date.now();
    const recipients = new Set([...Object.keys(this.subs), ...this._connectedIds()]);
    for (const clientId of recipients) {
      const rec = this.subs[clientId] || {};
      if (clientId === senderId) continue;
      if (rec.at && now - rec.at > SUB_TTL_MS) { delete this.subs[clientId]; continue; }
      const meta = { eventId: msg.eventId, type: msg.type, kind: msg.kind || (this.calls[msg.callId] && this.calls[msg.callId].kind) || null,
        callId: msg.callId || null, state: msg.callId && this.calls[msg.callId] ? this.calls[msg.callId].state : null, ts: msg.ts };
      const key = this._presentationKey(clientId, msg.eventId);
      if (this.presentation[key]) { this._commitOwner(clientId, meta, this.presentation[key].owner, this.presentation[key].reason, false); continue; }
      if (this.mute[clientId]) { this._commitOwner(clientId, meta, 'muted', 'room-muted', false); continue; }
      if (msg.type === 'chat-msg') {
        const last = Number(this.burst[clientId]) || 0;
        const eligible = now - last >= BURST_MS;
        this.burst[clientId] = now;
        if (!eligible) { this._commitOwner(clientId, meta, 'os', 'burst-suppressed', false); continue; }
      }
      if (msg.type === 'call-start') {
        const rec2 = this.calls[msg.callId || msg.eventId];
        if (rec2 && rec2.state !== 'started') continue;   /* terminal already known: no stale ring */
      }
      if (this.pendingDecisions.has(key)) continue;
      const t = setTimeout(() => {
        this.pendingDecisions.delete(key);
        this._commitOwner(clientId, meta, 'os', 'foreground-timeout', true);
      }, PRESENT_WAIT_MS);
      this.pendingDecisions.set(key, t);
      this._logPush({ eventId: msg.eventId, client: clientId, outcome: 'offer-pending', status: -1, at: now });
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
          .map((e) => ({ l: e.l, eventId: e.eventId, type: e.type, kind: e.kind || (e.callId && (this.calls[e.callId] || {}).kind) || null, callId: e.callId || null, state: e.callId ? ((this.calls[e.callId] || {}).state || null) : null, ts: e.ts }));
        return json({ ok: true, events, cursor: cur, lseq: this.lseq, complete: !stale });
      }
      if (url.searchParams.get('event')) {
        if (!clientId) return err('Missing client', 400);
        const eventId = String(url.searchParams.get('event')).slice(0, 160);
        const e = this.ledger.find((x) => x.eventId === eventId && x.from !== clientId);
        if (!e) return json({ ok: true, event: null });
        return json({ ok: true, event: { l: e.l, eventId: e.eventId, type: e.type, kind: e.kind || (e.callId && (this.calls[e.callId] || {}).kind) || null,
          callId: e.callId || null, state: e.callId ? ((this.calls[e.callId] || {}).state || null) : null, ts: e.ts } });
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
        return json({ ok: true, v: '5.1', connected: [...this._connectedIds()], subs: Object.keys(this.subs).length,
          pushLog: this.pushLog.slice(-20), pending: [...this.pendingDecisions.keys()], owners: this.presentation,
          cursors: this.cursors, mute: this.mute, lseq: this.lseq, ledgerLen: this.ledger.length });
      }
      if (body && body.type === 'diag-trace') {
        const related = this._connectedIds().has(clientId) || !!this.subs[clientId];
        if (!related) return err('Not related', 403);
        const since = Math.max(Date.now() - FR_AGE_MS, Number(body.since) || 0);
        frRecord(this.sessionName, clientId, body, 'diag_query', 'read', 'accepted', { count:Number(body.limit)||500 });
        return json({ ok:true, schemaVersion:FR_SCHEMA, buildId:FR_BUILD, version:FR_VERSION, records:frExport(this.sessionName,clientId,since,body.limit) });
      }
      if (body && body.type === 'vapid') {
        return json({ ok: true, vapid: VAPID_PUBLIC_KEY, push: !!this.env.VAPID_PRIVATE_KEY });
      }

      if (body && body.type === 'subscribe' && body.subscription && body.subscription.endpoint) {
        this.subs[clientId] = { sub: body.subscription, navigate: String(body.navigate || '').slice(0, 300), at: Date.now() };
        await this._saveSubs();
        frRecord(this.sessionName,clientId,body,'subscription','stored','accepted',{subscribed:true});
        return json({ ok: true, subscribed: true, vapid: VAPID_PUBLIC_KEY });
      }

      /* Review §4.3: mute is per device per room and the UI may claim it only
         after this acknowledgement. */
      if (body && body.type === 'mute') {
        this.mute[clientId] = body.muted === true;
        if (!this.mute[clientId]) delete this.mute[clientId];
        await this.state.storage.put({ mute: this.mute });
        frRecord(this.sessionName,clientId,body,'mute','stored','accepted',{muted:body.muted===true});
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
        frRecord(this.sessionName,clientId,body,'subscription','removed','accepted',{subscribed:false});
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
    if (msg.session && !this.sessionName) this.sessionName = String(msg.session).slice(0,128);
    frRecord(this.sessionName || msg.session, null, msg, 'relay_receive', 'websocket', 'observed', { messageType:msg.type,eventIdPresent:!!frEventId(msg) }, true);

    /* The page asks; the relay decides. The page still has no authority to
       create an attention surface until presentation-grant is returned. */
    if (msg.type === 'foreground-ready' && msg.eventId && clientId) {
      const key = this._presentationKey(clientId, msg.eventId);
      const prior = this.presentation[key];
      if (prior) {
        this._commitOwner(clientId, msg.presentationMeta || { eventId: msg.eventId }, prior.owner, prior.reason, false);
      } else if (this.pendingDecisions.has(key)) {
        const ledger = this.ledger.find((e) => e.eventId === msg.eventId);
        const meta = { eventId: msg.eventId, type: ledger && ledger.type, kind: ledger && ledger.kind,
          callId: ledger && ledger.callId, state: ledger && ledger.callId && this.calls[ledger.callId] ? this.calls[ledger.callId].state : null,
          ts: ledger && ledger.ts };
        await this._commitOwner(clientId, meta, 'in_app', 'foreground-ready', false);
      }
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

    const duplicateEvent = !isTransient && msg.eventId && this.messages.some((m) => m.eventId === msg.eventId && m.type === msg.type);
    if (duplicateEvent) return;

    if (!isTransient) {
      await this._persist(msg);
      frRecord(this.sessionName || msg.session, null, msg, 'persistence', 'stored', 'accepted', { messageType:msg.type }, true);
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

    if (ALERT_TYPES.has(msg.type)) msg.presentation = 'offer';
    this._broadcast(msg, clientId);

    /* Scheduling never delays socket delivery and its failures are swallowed. */
    if (!isTransient) {
      try { this._offerPresentations(msg, clientId); } catch (_) {}
    }
  }

  async webSocketClose(ws, code, reason) {}

  async webSocketError(ws, error) {
    try { ws.close(1011, 'error'); } catch (_) {}
  }
}
