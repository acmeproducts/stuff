/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js  ·  v6.2 R10-CR3 (plan v20.12.0 §4.13; §4.11 authority)
   Lineage: v4.2 body (route, session addressing, broadcast, history, transient
   handling, subscribe/unsubscribe, RFC 8291 encrypted push) — unchanged —
   plus ONE recipient-event authority (§4.11.2), owned by this Durable Object.

   For every chat, call start, call end and thread invite the session keeps one
   durable record per event and per recipient device:
     presentation  pending | in_app | os_requested | suppressed | muted
     push          not_requested | accepted | failed | unknown
     seen          unseen | seen  (with the exact transition recorded)
     outcome       offered | accepted | declined | missed | ended  (calls)
   That record — not the app, not a replay, not a route — decides what a device
   is asked to show, whether a push was requested, whether the event was seen,
   what a receiver's call outcome is, and what the home projection reads.

   Devices tell the relay two truths, over the socket they already hold:
     {type:'ev-state', visible, inRoom, muted}   who is looking, where, muted?
     {type:'ev-seen', ids:[…]} / {type:'ev-open'} exact events visibly handled /
                                                 explicit room open
   and ask it one question, over the socket or read-only HTTPS:
     {type:'events-sync'}  → { proj:{chat,voice,video}, unseen:[…], calls:[…] }

   The push, when the record says os_requested, carries the ENCRYPTED event
   identity (id, room, kind, callId, sender name — never message text) at
   Urgency high, so the service worker shows a banner at once with nothing to
   look up. Setup is the same one secret as v4.2: VAPID_PRIVATE_KEY.
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
/* v6: only events that own a recipient record can alert. Everything else is
   data on the socket, never a wake. */
const RECORD_KIND = { 'chat-msg': 'chat', 'thread-invite': 'chat', 'call-start': 'call' };
const RELAY_VERSION = '6.2';
const EVENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 400;
const BURST_MS = 10000;               /* §4.11.4: first chat after ten quiet seconds may alert */
const STATE_FRESH_MS = 45000;         /* a reported visible state older than this is not trusted */
const EV_TYPES = new Set(['ev-state', 'ev-seen', 'ev-open', 'events-sync']);

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
function sessionOf(ws) { try { const t = ws.deserializeAttachment(); return (t && t.sessionId) || ''; } catch (_) { return ''; } }
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
    this.lastWake = null;   /* observability — constructor-anchored */
    /* v4.2 (plan v20.0.0 §4.6): lastSeen and pendingWakes are DELETED (A1/A2).
       The relay holds no opinion about whether a device is watching. */
    this.env = env;
    this.seq = 0;
    this.messages = [];
    this.lastActivity = 0;
    this.subs = {};                     /* clientId -> { sub, at } */
    this.events = {};                   /* eventId -> recipient-event record (the one authority) */
    this.devices = {};                  /* clientId -> { at } every device ever seen in this session */
    this.states = {};                   /* clientId -> { visible, inRoom, muted, at } last reported, in memory only */
    this.ready = this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['seq', 'messages', 'lastActivity', 'subs', 'events', 'devices']);
      this.seq = Number(stored.get('seq')) || 0;
      this.messages = stored.get('messages') || [];
      this.lastActivity = Number(stored.get('lastActivity')) || 0;
      this.subs = stored.get('subs') || {};
      this.events = stored.get('events') || {};
      this.devices = stored.get('devices') || {};
    });
  }

  /* ── recipient-event authority ─────────────────────────────────────────── */
  async _saveEvents() {
    const now = Date.now();
    const ids = Object.keys(this.events).filter((id) => now - (this.events[id].ts || 0) < EVENT_TTL_MS);
    ids.sort((a, b) => (this.events[a].seq || 0) - (this.events[b].seq || 0));
    const keep = ids.slice(-MAX_EVENTS);
    const next = {};
    for (const id of keep) next[id] = this.events[id];
    this.events = next;
    await this.state.storage.put({ events: this.events });
  }
  async _noteDevice(clientId) {
    if (!clientId) return;
    if (!this.devices[clientId]) {
      this.devices[clientId] = { at: Date.now() };
      await this.state.storage.put({ devices: this.devices });
    }
  }
  _stateOf(clientId) {
    const st = this.states[clientId];
    if (!st) return null;
    if (Date.now() - st.at > STATE_FRESH_MS) return null;   /* stale: a suspended app is not looking */
    return st;
  }
  _isConnected(clientId) { return this._connectedIds().has(clientId); }
  _lastOsChat(clientId) {
    let last = 0;
    for (const ev of Object.values(this.events)) {
      if (ev.kind !== 'chat') continue;
      const r = ev.rcp[clientId];
      if (r && r.p === 'os_requested' && ev.ts > last) last = ev.ts;
    }
    return last;
  }
  /* Presentation for one recipient, from what the relay durably knows. */
  _decide(ev, clientId, now) {
    const st = this._stateOf(clientId);
    if (st && st.muted) return 'muted';
    if (st && st.visible && this._isConnected(clientId)) return 'in_app';
    if (ev.kind === 'chat' && now - this._lastOsChat(clientId) < BURST_MS) return 'suppressed';
    return 'os_requested';
  }
  _projection(clientId) {
    const proj = { chat: 0, voice: 0, video: 0 };
    const unseen = [];
    const calls = [];
    for (const ev of Object.values(this.events)) {
      const r = ev.rcp[clientId];
      if (!r) continue;
      if (ev.kind === 'call' && r.o === 'offered' && !ev.ended) calls.push({ id: ev.id, callId: ev.callId, callKind: ev.callKind, from: ev.from, name: ev.name || null, ts: ev.ts });
      if (r.s !== 'unseen') continue;
      if (ev.kind === 'chat') { proj.chat += 1; unseen.push({ id: ev.id, kind: 'chat', ts: ev.ts, p: r.p }); }
      else if (ev.kind === 'call' && r.o === 'missed') { proj[ev.callKind] += 1; unseen.push({ id: ev.id, kind: ev.callKind, callId: ev.callId, ts: ev.ts, o: r.o, p: r.p }); }
    }
    return { proj, unseen, calls };
  }
  _sendTo(clientId, payload) {
    const text = JSON.stringify(payload);
    for (const ws of this.state.getWebSockets()) {
      const tag = ws.deserializeAttachment();
      if (tag && tag.clientId === clientId) { try { ws.send(text); } catch (_) {} }
    }
  }
  _pushProjection(clientId) {
    const p = this._projection(clientId);
    this._sendTo(clientId, { type: 'ev-proj', transient: true, proj: p.proj, unseen: p.unseen, calls: p.calls, ts: Date.now() });
  }
  _recipients(senderId) {
    const ids = new Set(Object.keys(this.devices));
    for (const id of Object.keys(this.subs)) ids.add(id);
    for (const id of this._connectedIds()) ids.add(id);
    ids.delete(senderId);
    ids.delete('');
    return [...ids];
  }
  /* One durable record per event and recipient, created before any delivery. */
  async _recordEvent(msg, senderId) {
    const kind = RECORD_KIND[msg.type];
    if (!kind) return null;
    const id = String(msg.eventId || (kind === 'call' && msg.callId) || msg.chatId || msg.inviteId || (msg.type + '-' + msg.seq + '-' + msg.ts));
    if (this.events[id]) { msg.eventId = id; return this.events[id]; }   /* retry reuses the record */
    const now = Date.now();
    const ev = { id, seq: msg.seq, type: msg.type, kind, from: senderId, ts: now, name: msg.name || msg.senderName || null, rcp: {} };
    if (kind === 'call') {
      ev.callId = String(msg.callId || id);
      ev.callKind = msg.kind === 'video' ? 'video' : 'voice';
      ev.ended = false;
    }
    for (const cid of this._recipients(senderId)) {
      const p = this._decide(ev, cid, now);
      ev.rcp[cid] = { p, push: 'not_requested', s: 'unseen', o: kind === 'call' ? 'offered' : null, at: now, seenAt: null, seenBy: null };
    }
    this.events[id] = ev;
    msg.eventId = id;
    if (kind === 'call') msg.callId = ev.callId;
    await this._saveEvents();
    return ev;
  }
  _openCall(callId) {
    for (const ev of Object.values(this.events)) if (ev.kind === 'call' && ev.callId === callId && !ev.ended) return ev;
    return null;
  }
  _latestOpenCallFrom(fromId) {
    let best = null;
    for (const ev of Object.values(this.events)) {
      if (ev.kind !== 'call' || ev.ended) continue;
      if (fromId && ev.from !== fromId && !ev.rcp[fromId]) continue;
      if (!best || ev.ts > best.ts) best = ev;
    }
    return best;
  }
  /* Recipient outcome transitions ride the product's own call words. */
  async _applyCallWord(msg, clientId) {
    const ev = (msg.callId && this._openCall(String(msg.callId))) || this._latestOpenCallFrom(clientId);
    if (!ev) return;
    msg.callId = ev.callId; msg.eventId = ev.id;
    const r = ev.rcp[clientId];
    if (msg.type === 'call-accept') { if (r && r.o === 'offered') { r.o = 'accepted'; r.s = 'seen'; r.seenAt = Date.now(); r.seenBy = 'accept'; } }
    else if (msg.type === 'call-decline') { if (r && r.o === 'offered') { r.o = 'declined'; r.s = 'seen'; r.seenAt = Date.now(); r.seenBy = 'decline'; } }
    else if (msg.type === 'call-end') {
      /* Caller/global termination is separate from each receiver's outcome:
         a receiver who neither accepted nor declined becomes missed exactly once. */
      if (clientId === ev.from || !r) {
        ev.ended = true; ev.endedAt = Date.now();
        for (const [cid, rr] of Object.entries(ev.rcp)) { if (rr.o === 'offered') rr.o = 'missed'; else if (rr.o === 'accepted') rr.o = 'ended'; }
      } else {
        if (r.o === 'accepted') r.o = 'ended';
        else if (r.o === 'offered') r.o = 'missed';
        ev.ended = true; ev.endedAt = Date.now();
        for (const rr of Object.values(ev.rcp)) { if (rr.o === 'offered') rr.o = 'missed'; else if (rr.o === 'accepted') rr.o = 'ended'; }
      }
    }
    await this._saveEvents();
    for (const cid of Object.keys(ev.rcp)) this._pushProjection(cid);
  }
  async _markSeen(clientId, ids, by) {
    let changed = 0;
    const now = Date.now();
    for (const id of ids) {
      const ev = this.events[id]; if (!ev) continue;
      const r = ev.rcp[clientId]; if (!r || r.s === 'seen') continue;
      r.s = 'seen'; r.seenAt = now; r.seenBy = by; changed += 1;
    }
    if (changed) await this._saveEvents();
    return changed;
  }
  async _handleEventWord(msg, clientId) {
    if (msg.type === 'ev-state') {
      this.states[clientId] = { visible: msg.visible === true, inRoom: msg.inRoom === true, muted: msg.muted === true, at: Date.now() };
      return { ok: true };
    }
    if (msg.type === 'ev-seen') {
      const n = await this._markSeen(clientId, Array.isArray(msg.ids) ? msg.ids.map(String) : [], 'in_room');
      const p = this._projection(clientId);
      return { ok: true, seen: n, proj: p.proj, unseen: p.unseen, calls: p.calls };
    }
    if (msg.type === 'ev-open') {
      /* Opening the room acknowledges exactly the set durably applied to this recipient. */
      const acked = this._projection(clientId).unseen;
      const n = await this._markSeen(clientId, acked.map((u) => u.id), 'room_open');
      const p = this._projection(clientId);
      return { ok: true, seen: n, acked, proj: p.proj, unseen: p.unseen, calls: p.calls };
    }
    if (msg.type === 'events-sync') {
      const p = this._projection(clientId);
      return { ok: true, proj: p.proj, unseen: p.unseen, calls: p.calls };
    }
    return null;
  }
  /* Read-only diagnostics: fields and transitions of the same record, secrets redacted. */
  _diagEvents() {
    return Object.values(this.events).slice(-40).map((ev) => ({ id: ev.id, type: ev.type, kind: ev.kind, callKind: ev.callKind || null, callId: ev.callId || null, ended: !!ev.ended, ts: ev.ts, rcp: ev.rcp }));
  }

  async _touchSession() {
    const now = Date.now();
    if (this.lastActivity && now - this.lastActivity > SESSION_TTL_MS) {
      /* History resets at the session boundary; the recipient-event records do not. */
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

  /* STEP 1: the reference delivery class — encrypted payload, high urgency,
     newest-wins topic, short TTL. Proven on the owner's locked iPhone 4/4. */
  async _pushOne(clientId, rec, ev, sessionId) {
    const r = ev.rcp[clientId];
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    const keys = rec && rec.sub && rec.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) { r.push = 'failed'; r.pushErr = 'no-subscription'; return; }
    let body;
    try {
      /* The event identity only — never message text. */
      const payload = { t: 'tb-ev', id: ev.id, room: sessionId, kind: ev.kind === 'call' ? ev.callKind : 'chat', callId: ev.callId || null, name: ev.name || null, ts: ev.ts };
      body = await webpushEncrypt(JSON.stringify(payload), keys.p256dh, keys.auth);
    } catch (e) { r.push = 'failed'; r.pushErr = 'encrypt'; return; }
    const headers = {
      TTL: '60', Urgency: 'high', Topic: ev.kind === 'call' ? ('tb-call-' + ev.callId).slice(0, 32) : ('tb-' + sessionId).slice(0, 32),
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length)
    };
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      this.lastWake = { clientId, at: Date.now(), status: res.status, eventId: ev.id };
      r.push = (res.status >= 200 && res.status < 300) ? 'accepted' : 'failed';
      r.pushStatus = res.status;
      /* 404 and 410 mean the subscription is dead — the browser has revoked it.
         Keeping it would mean retrying forever against nothing. */
      if (res.status === 404 || res.status === 410) {
        delete this.subs[clientId];
        await this._saveSubs();
      }
    } catch (_) { r.push = 'unknown'; }
  }

  /* v6: the record decides. Only os_requested recipients are pushed; the push
     result is written back to the same record. Nothing here waits for an ack. */
  async _deliverByRecord(ev, sessionId) {
    if (!ev) return;
    const now = Date.now();
    const jobs = [];
    for (const [clientId, r] of Object.entries(ev.rcp)) {
      if (r.p !== 'os_requested' || r.push !== 'not_requested') continue;   /* a retry reuses the record; it never pushes twice */
      const rec = this.subs[clientId];
      if (rec && rec.at && now - rec.at > SUB_TTL_MS) { delete this.subs[clientId]; r.push = 'failed'; r.pushErr = 'stale-subscription'; continue; }
      jobs.push(this._pushOne(clientId, rec, ev, sessionId));
    }
    if (jobs.length) await Promise.all(jobs);
    await this._saveEvents();
  }

  async fetch(request) {
    await this.ready;
    await this._touchSession();

    const url = new URL(request.url);
    const clientId = (url.searchParams.get('client') || '').trim();
    const sessionId = (url.searchParams.get('session') || '').trim().slice(0, 128);

    if (request.headers.get('Upgrade') === 'websocket') {
      if (!clientId) return err('Missing client', 400);
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ clientId, sessionId });
      await this._noteDevice(clientId);
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
        return json({ ok: true, v: RELAY_VERSION, connected: [...this._connectedIds()], subs: Object.keys(this.subs).length, lastWake: this.lastWake, events: this._diagEvents(), states: this.states });
      }
      /* Read-only reconciliation against the same authority when a socket is unavailable. */
      if (body && EV_TYPES.has(body.type)) {
        await this._noteDevice(clientId);
        const out = await this._handleEventWord(body, clientId);
        return json(out || { ok: false });
      }
      if (body && body.type === 'vapid') {
        return json({ ok: true, vapid: VAPID_PUBLIC_KEY, push: !!this.env.VAPID_PRIVATE_KEY });
      }

      if (body && body.type === 'subscribe' && body.subscription && body.subscription.endpoint) {
        this.subs[clientId] = { sub: body.subscription, at: Date.now() };
        await this._saveSubs();
        await this._noteDevice(clientId);
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
    msg.from = msg.from || clientId;
    msg.ts = msg.ts || Date.now();

    await this._touchSession();

    /* Event words: answered to this device only, never broadcast, never history. */
    if (EV_TYPES.has(msg.type)) {
      await this._noteDevice(clientId);
      const out = await this._handleEventWord(msg, clientId);
      if (out) { out.type = 'ev-reply'; out.of = msg.type; out.transient = true; out.reqId = msg.reqId || null; try { ws.send(JSON.stringify(out)); } catch (_) {} }
      return;
    }

    const isTransient = msg.transient === true || TRANSIENT_TYPES.has(msg.type);
    if (msg.type === 'hello') await this._noteDevice(clientId);
    /* A ping may carry the device's state so a hidden phone cannot be mistaken for a watching one. */
    if (msg.type === 'ping' && typeof msg.visible === 'boolean') this.states[clientId] = { visible: msg.visible, inRoom: msg.inRoom === true, muted: msg.muted === true, at: Date.now() };

    if (!isTransient) {
      await this._persist(msg);
    } else {
      this.seq++;
      await this.state.storage.put({ seq: this.seq });
    }

    /* The recipient record exists before delivery; the socket copy carries its id. */
    let ev = null;
    if (!isTransient) {
      try { ev = await this._recordEvent(msg, clientId); } catch (_) {}
      if (msg.type === 'call-accept' || msg.type === 'call-decline' || msg.type === 'call-end') { try { await this._applyCallWord(msg, clientId); } catch (_) {} }
    }

    this._broadcast(msg, clientId);

    if (ev) {
      for (const cid of Object.keys(ev.rcp)) this._pushProjection(cid);
      /* Pushing must never delay or endanger delivery to one that is awake, so it
         happens after the broadcast and its failures are swallowed. */
      try { await this._deliverByRecord(ev, sessionOf(ws)); } catch (_) {}
    }
  }

  async webSocketClose(ws, code, reason) {}

  async webSocketError(ws, error) {
    try { ws.close(1011, 'error'); } catch (_) {}
  }
}
