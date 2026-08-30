/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js · R10.6 RECIPIENT STATE + ONE PRESENTATION PATH

   Lineage: the frozen R7 signaling/history behavior and RFC 8291/VAPID delivery
   implementation remain. R10.6 adds durable per-recipient event state, exact
   page-vs-OS presentation ownership, declarative-compatible push envelopes,
   one-time invitations, opaque device authorization, and server-side issuance
   of temporary Deepgram/TURN credentials.

   Long-lived provider credentials are Worker secrets only. Push acceptance is
   recorded separately from presentation selection and is never called display.
   ───────────────────────────────────────────────────────────────────────────── */

const MAX_HISTORY = 500;
const RECIPIENT_CAP = 1200;
const PRESENT_WAIT_MS = 650;
const CHAT_BURST_MS = 10000;
const CALL_TIMEOUT_MS = 45000;
const SESSION_TTL_MS = 12 * 60 * 1000;
const SUB_TTL_MS = 90 * 24 * 60 * 60 * 1000;   /* a subscription unused for this long is dropped */
const TRANSIENT_TYPES = new Set(['hello', 'ping', 'pong', 'typing', 'reattach', 'ack', 'foreground-ready', 'surface-ready']);
const ALERT_TYPES = new Set(['chat-msg', 'call-start', 'thread-invite']);

/* Public by design — handed to every browser that subscribes. */
const VAPID_PUBLIC_KEY = 'BCpmWbu3Hdj3LM0tYiPkslNsr2hKUj1ol5VQBt_VLBuvgt4gimV7F0XfJTKlCk7OYxm8bvmIVbB34lRvd3-eIoc';

/* A contact point push services may use. Never shown in the app, never verified. */
const VAPID_SUBJECT = 'mailto:nobody@nowhere.com';

/* Types worth waking a device for. A wake is cheap but not free, and waking for
   a heartbeat would be worse than not waking at all. */
const PUSH_WORTHY = ALERT_TYPES;

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-TalkBridge-Auth, X-TalkBridge-Device'
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

function randomOpaque(bytes = 32) {
  return bytesToB64url(crypto.getRandomValues(new Uint8Array(bytes)));
}
async function digestText(value) {
  return bytesToB64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || ''))));
}
function topicSafe(value) {
  return String(value || 'tb').replace(/[^A-Za-z0-9_-]/g, '').slice(-32) || 'tb';
}
async function requestJson(request) {
  try { return await request.json(); } catch (_) { throw new Error('Bad body'); }
}
function authObject(env) {
  return env.TALK_SESSION.get(env.TALK_SESSION.idFromName('__talkbridge_auth_r106__'));
}
async function authCall(env, action, body) {
  return authObject(env).fetch('https://auth.internal/auth/' + action, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {})
  });
}
async function checkedAuth(request, env, roomId) {
  const token = request.headers.get('X-TalkBridge-Auth') || '';
  const deviceId = request.headers.get('X-TalkBridge-Device') || '';
  if (!token) return { error: json({ ok: false, error: 'authorization-required' }, 401) };
  if (!deviceId) return { error: json({ ok: false, error: 'device-required' }, 401) };
  const res = await authCall(env, 'check', { token });
  const data = await res.json();
  if (!res.ok || !data.ok) return { error: json({ ok: false, error: data.error || 'authorization-refused' }, res.status || 403) };
  if (data.record.deviceId !== deviceId) return { error: json({ ok: false, error: 'device-out-of-scope' }, 403) };
  if (roomId && !data.record.rooms.includes(roomId)) return { error: json({ ok: false, error: 'room-out-of-scope' }, 403) };
  return { token, record: data.record };
}
async function handleService(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);
  const action = url.pathname.slice('/service/'.length);
  let body;
  try { body = await requestJson(request); } catch (_) { return json({ ok: false, error: 'bad-body' }, 400); }

  if (action === 'bootstrap') {
    const rooms = Array.isArray(body.rooms) ? body.rooms.map(String).filter(Boolean).slice(0, 100) : [];
    if (!body.deviceId || !rooms.length) return json({ ok: false, error: 'device-and-room-required' }, 400);
    return authCall(env, 'bootstrap', { deviceId: String(body.deviceId), rooms });
  }
  if (action === 'invite-exchange') {
    if (!body.code || !body.deviceId) return json({ ok: false, error: 'code-and-device-required' }, 400);
    return authCall(env, 'invite-exchange', body);
  }

  const roomId = String(body.roomId || '');
  const auth = await checkedAuth(request, env, action === 'authorize-room' ? null : (roomId || null));
  if (auth.error) return auth.error;

  if (action === 'authorize-room') {
    if (!roomId || !auth.record.canCreate) return json({ ok: false, error: 'room-authorization-refused' }, 403);
    const res = await authCall(env, 'authorize-room', { token: auth.token, roomId, deviceId: String(body.deviceId || auth.record.deviceId) });
    const data = await res.json();
    return json(data, res.status);
  }
  if (action === 'invite-create') {
    if (!roomId) return json({ ok: false, error: 'room-required' }, 400);
    return authCall(env, 'invite-create', {
      token: auth.token, roomId, invite: body.invite || {}, ttlSeconds: Math.max(60, Math.min(3600, Number(body.ttlSeconds) || 600))
    });
  }
  if (action === 'revoke') {
    return authCall(env, 'revoke', { token: auth.token, roomId });
  }
  if (action === 'deepgram-token') {
    const apiKey = env.DEEPGRAM_API_KEY || env.TB_DEEPGRAM_API_KEY || env.DG_API_KEY;
    if (!apiKey) return json({ ok: false, error: 'deepgram-service-not-configured' }, 503);
    const ttl = Math.max(1, Math.min(3600, Number(body.ttlSeconds) || 120));
    try {
      const upstream = await fetch('https://api.deepgram.com/v1/auth/grant', {
        method: 'POST', headers: { Authorization: 'Token ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl_seconds: ttl })
      });
      const data = await upstream.json();
      if (!upstream.ok || !data.access_token) return json({ ok: false, error: 'deepgram-token-refused', upstreamStatus: upstream.status }, 502);
      return json({ ok: true, access_token: data.access_token, expires_in: Number(data.expires_in) || ttl });
    } catch (_) { return json({ ok: false, error: 'deepgram-token-unavailable' }, 502); }
  }
  if (action === 'turn-credentials') {
    const keyId = env.CF_TURN_KEY_ID || env.TURN_KEY_ID || env.TB_CF_TURN_ID;
    const apiToken = env.CF_TURN_API_TOKEN || env.TURN_API_TOKEN || env.TB_CF_TURN_TOKEN;
    if (!keyId || !apiToken) return json({ ok: false, error: 'turn-service-not-configured' }, 503);
    const ttl = Math.max(300, Math.min(86400, Number(body.ttlSeconds) || 21600));
    try {
      const upstream = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + encodeURIComponent(keyId) + '/credentials/generate-ice-servers', {
        method: 'POST', headers: { Authorization: 'Bearer ' + apiToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl })
      });
      const data = await upstream.json();
      if (!upstream.ok || !Array.isArray(data.iceServers)) return json({ ok: false, error: 'turn-credentials-refused', upstreamStatus: upstream.status }, 502);
      return json({ ok: true, iceServers: data.iceServers, expiresAt: Date.now() + ttl * 1000 });
    } catch (_) { return json({ ok: false, error: 'turn-credentials-unavailable' }, 502); }
  }
  if (action === 'status') {
    return json({ ok: true, version: 'R10.6', scopeClass: auth.record.scopeClass,
      deepgramConfigured: !!(env.DEEPGRAM_API_KEY || env.TB_DEEPGRAM_API_KEY || env.DG_API_KEY),
      turnConfigured: !!((env.CF_TURN_KEY_ID || env.TURN_KEY_ID || env.TB_CF_TURN_ID) && (env.CF_TURN_API_TOKEN || env.TURN_API_TOKEN || env.TB_CF_TURN_TOKEN)) });
  }
  return json({ ok: false, error: 'unknown-service-action' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/service/')) return handleService(request, env, url);
    if (url.pathname !== '/signal') return new Response('Not found', { status: 404, headers: cors() });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
    const app = (url.searchParams.get('app') || '').trim().slice(0, 64);
    const sessionId = (url.searchParams.get('session') || '').trim().slice(0, 128);
    if (!app || !sessionId) return err('Missing app or session');
    return env.TALK_SESSION.get(env.TALK_SESSION.idFromName(app + '::' + sessionId)).fetch(request);
  }
};

export class TalkSession {
  constructor(state, env) {
    this.state = state; this.env = env;
    this.seq = 0; this.messages = []; this.lastActivity = 0; this.subs = {}; this.devices = {};
    this.recipientEvents = {}; this.lseq = 0; this.presentation = {}; this.calls = {}; this.burst = {};
    this.pendingPresentation = {}; this.sessionName = ''; this.pushLog = [];
    this.authRecords = {}; this.invites = {};
    this.pendingTimers = new Map();
    this.ready = state.blockConcurrencyWhile(async () => {
      const keys = ['seq', 'messages', 'lastActivity', 'subs', 'devices', 'recipientEvents', 'lseq', 'presentation', 'calls', 'burst', 'pendingPresentation', 'sessionName', 'pushLog', 'authRecords', 'invites'];
      const s = await state.storage.get(keys);
      this.seq = Number(s.get('seq')) || 0; this.messages = s.get('messages') || []; this.lastActivity = Number(s.get('lastActivity')) || 0;
      this.subs = s.get('subs') || {}; this.devices = s.get('devices') || {}; this.recipientEvents = s.get('recipientEvents') || {};
      this.lseq = Number(s.get('lseq')) || 0; this.presentation = s.get('presentation') || {}; this.calls = s.get('calls') || {};
      this.burst = s.get('burst') || {}; this.pendingPresentation = s.get('pendingPresentation') || {}; this.sessionName = s.get('sessionName') || '';
      this.pushLog = s.get('pushLog') || []; this.authRecords = s.get('authRecords') || {}; this.invites = s.get('invites') || {};
    });
  }

  async _authFetch(request, url) {
    const body = await requestJson(request).catch(() => null); if (!body) return json({ ok: false, error: 'bad-body' }, 400);
    const action = url.pathname.slice('/auth/'.length), now = Date.now();
    const find = async token => this.authRecords[await digestText(token || '')] || null;
    const publicRecord = rec => ({ id: rec.id, deviceId: rec.deviceId, rooms: rec.rooms, canCreate: rec.canCreate, expiresAt: rec.expiresAt, scopeClass: rec.scopeClass });
    if (action === 'check') {
      const rec = await find(body.token);
      if (!rec || rec.revoked || rec.expiresAt <= now) return json({ ok: false, error: 'authorization-invalid' }, 403);
      return json({ ok: true, record: publicRecord(rec) });
    }
    if (action === 'bootstrap') {
      const token = randomOpaque(), hash = await digestText(token), rec = {
        id: randomOpaque(12), parentId: null, deviceId: String(body.deviceId), rooms: [...new Set(body.rooms || [])],
        canCreate: true, scopeClass: 'legacy-room-capability', createdAt: now, expiresAt: now + 365 * 86400000, revoked: false
      };
      this.authRecords[hash] = rec; await this.state.storage.put({ authRecords: this.authRecords });
      return json({ ok: true, auth: token, ...publicRecord(rec) });
    }
    if (action === 'invite-create') {
      const parent = await find(body.token);
      if (!parent || parent.revoked || parent.expiresAt <= now || !parent.rooms.includes(String(body.roomId))) return json({ ok: false, error: 'authorization-refused' }, 403);
      const code = randomOpaque(), codeHash = await digestText(code), expiresAt = now + Math.max(60, Math.min(3600, Number(body.ttlSeconds) || 600)) * 1000;
      this.invites[codeHash] = { parentId: parent.id, roomId: String(body.roomId), invite: body.invite || {}, expiresAt, usedAt: 0 };
      await this.state.storage.put({ invites: this.invites });
      return json({ ok: true, code, expiresAt });
    }
    if (action === 'invite-exchange') {
      const codeHash = await digestText(body.code), invite = this.invites[codeHash];
      if (!invite || invite.usedAt || invite.expiresAt <= now) return json({ ok: false, error: 'invite-expired-or-used' }, 410);
      invite.usedAt = now;
      let rooms = [invite.roomId];
      if (body.currentAuth) { const current = await find(body.currentAuth); if (current && !current.revoked && current.expiresAt > now) rooms = [...new Set(current.rooms.concat(rooms))]; }
      const token = randomOpaque(), hash = await digestText(token), rec = {
        id: randomOpaque(12), parentId: invite.parentId, deviceId: String(body.deviceId), rooms,
        canCreate: invite.invite && (invite.invite.g === 1 || invite.invite.ld === 1), scopeClass: 'relationship-device',
        createdAt: now, expiresAt: now + 365 * 86400000, revoked: false
      };
      this.authRecords[hash] = rec; await this.state.storage.put({ authRecords: this.authRecords, invites: this.invites });
      return json({ ok: true, auth: token, invite: invite.invite, ...publicRecord(rec) });
    }
    if (action === 'authorize-room') {
      const rec = await find(body.token);
      if (!rec || rec.revoked || rec.expiresAt <= now || !rec.canCreate) return json({ ok: false, error: 'authorization-refused' }, 403);
      if (!rec.rooms.includes(String(body.roomId))) rec.rooms.push(String(body.roomId));
      await this.state.storage.put({ authRecords: this.authRecords });
      return json({ ok: true, auth: body.token, ...publicRecord(rec) });
    }
    if (action === 'revoke') {
      const parent = await find(body.token); if (!parent) return json({ ok: false, error: 'authorization-refused' }, 403);
      const roomId = String(body.roomId), descendants = new Set([parent.id]); let changed = true;
      while (changed) { changed = false; for (const rec of Object.values(this.authRecords)) if (rec.parentId && descendants.has(rec.parentId) && !descendants.has(rec.id)) { descendants.add(rec.id); changed = true; } }
      let n = 0; for (const rec of Object.values(this.authRecords)) if (rec.id !== parent.id && descendants.has(rec.id) && rec.rooms.includes(roomId)) { rec.revoked = true; n++; }
      await this.state.storage.put({ authRecords: this.authRecords }); return json({ ok: true, revoked: n });
    }
    return json({ ok: false, error: 'unknown-auth-action' }, 404);
  }

  async _touchSession() {
    const now = Date.now();
    if (this.lastActivity && now - this.lastActivity > SESSION_TTL_MS) { this.seq = 0; this.messages = []; }
    this.lastActivity = now; await this.state.storage.put({ seq: this.seq, messages: this.messages, lastActivity: now });
  }
  async _persistMessage(msg) {
    msg.seq = ++this.seq; this.messages.push(msg); if (this.messages.length > MAX_HISTORY) this.messages = this.messages.slice(-MAX_HISTORY);
    await this.state.storage.put({ seq: this.seq, messages: this.messages });
  }
  _connectedIds() {
    const ids = new Set(); for (const ws of this.state.getWebSockets()) { const tag = ws.deserializeAttachment(); if (tag && tag.clientId) ids.add(tag.clientId); } return ids;
  }
  _sendTo(clientId, payload) {
    const text = JSON.stringify(payload); let sent = 0;
    for (const ws of this.state.getWebSockets()) { const tag = ws.deserializeAttachment(); if (!tag || tag.clientId !== clientId) continue; try { ws.send(text); sent++; } catch (_) {} }
    return sent;
  }
  _broadcast(payload, skipClientId) {
    const text = JSON.stringify(payload);
    for (const ws of this.state.getWebSockets()) { const tag = ws.deserializeAttachment(); if (tag && tag.clientId === skipClientId) continue; try { ws.send(text); } catch (_) {} }
  }
  _recipients(senderId) {
    return [...new Set([...Object.keys(this.devices), ...Object.keys(this.subs), ...this._connectedIds()])].filter(id => id && id !== senderId);
  }
  _event(clientId, eventId) { return (this.recipientEvents[clientId] || []).find(e => e.eventId === eventId) || null; }
  _presentationKey(clientId, eventId) { return clientId + '|' + eventId; }
  _publicEvent(rec) {
    return { l: rec.l, eventId: rec.eventId, roomId: this.sessionName, type: rec.type, kind: rec.kind || null, callId: rec.callId || null,
      createdAt: rec.createdAt, presentation: rec.presentation, seen: rec.seen === true, outcome: rec.outcome || null, message: rec.message || null,
      pushAccepted: rec.pushAccepted === true, pushStatus: rec.pushStatus == null ? null : rec.pushStatus };
  }
  async _saveRecipientState() {
    await this.state.storage.put({ recipientEvents: this.recipientEvents, lseq: this.lseq, presentation: this.presentation, calls: this.calls,
      burst: this.burst, pendingPresentation: this.pendingPresentation, devices: this.devices, pushLog: this.pushLog });
  }
  async _appendRecipients(msg, senderId) {
    const recipients = this._recipients(senderId), now = Date.now();
    for (const clientId of recipients) {
      const list = this.recipientEvents[clientId] || (this.recipientEvents[clientId] = []);
      if (list.some(e => e.eventId === msg.eventId)) continue;
      list.push({ l: ++this.lseq, eventId: msg.eventId, type: msg.type, kind: msg.kind || null, callId: msg.callId || null,
        createdAt: msg.ts || now, presentation: 'pending', seen: false, outcome: msg.type === 'call-start' ? 'ringing' : null, message: msg });
      if (list.length > RECIPIENT_CAP) this.recipientEvents[clientId] = list.slice(-RECIPIENT_CAP);
    }
    if (msg.type === 'call-start') {
      const callId = msg.callId || msg.eventId;
      this.calls[callId] = { callId, senderId, eventId: msg.eventId, kind: msg.kind === 'video' ? 'video' : 'voice',
        createdAt: msg.ts || now, expiresAt: now + CALL_TIMEOUT_MS, recipients: Object.fromEntries(recipients.map(id => [id, 'ringing'])) };
    }
    await this._saveRecipientState(); return recipients;
  }
  _notificationBody(rec) {
    if (rec.type === 'call-start') return rec.outcome === 'missed' ? 'Missed ' + (rec.kind === 'video' ? 'video' : 'voice') + ' call' : 'Incoming ' + (rec.kind === 'video' ? 'video' : 'voice') + ' call';
    if (rec.type === 'thread-invite') return 'New thread invitation'; return 'New message';
  }
  _envelope(sub, rec) {
    let navigate = sub && sub.navigate;
    try {
      const u = new URL(navigate || ''); u.hash = '';
      u.searchParams.set('tbEvent', rec.eventId); u.searchParams.set('tbRoom', this.sessionName); u.searchParams.set('tbType', rec.type);
      if (rec.kind) u.searchParams.set('tbKind', rec.kind); if (rec.callId) u.searchParams.set('tbCall', rec.callId); navigate = u.toString();
    } catch (_) { navigate = undefined; }
    const note = { title: 'TalkBridge', body: this._notificationBody(rec), tag: 'tb-' + topicSafe(rec.eventId), silent: false };
    if (navigate) note.navigate = navigate;
    return { web_push: 8030, notification: note, tb: { v: 3, eventId: rec.eventId, roomId: this.sessionName, type: rec.type, kind: rec.kind || null, callId: rec.callId || null, outcome: rec.outcome || null, createdAt: rec.createdAt } };
  }
  async _pushOne(clientId, rec) {
    const sub = this.subs[clientId], endpoint = sub && sub.sub && sub.sub.endpoint, keys = sub && sub.sub && sub.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) return { accepted: false, status: null, reason: 'no-subscription' };
    let body; try { body = await webpushEncrypt(JSON.stringify(this._envelope(sub, rec)), keys.p256dh, keys.auth); }
    catch (_) { return { accepted: false, status: null, reason: 'encryption-failed' }; }
    const headers = { TTL: '60', Urgency: 'high', Topic: topicSafe(rec.eventId), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', 'Content-Length': String(body.length) };
    const auth = await vapidHeader(this.env, endpoint); if (auth) headers.Authorization = auth;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      this.pushLog.push({ eventId: rec.eventId, clientId, requestedAt: Date.now(), status: res.status, accepted: res.ok }); this.pushLog = this.pushLog.slice(-100);
      if (res.status === 404 || res.status === 410) delete this.subs[clientId];
      return { accepted: res.ok, status: res.status };
    } catch (_) { return { accepted: false, status: 0, reason: 'fetch-failed' }; }
  }
  async _commit(clientId, eventId, presentation, reason) {
    const key = this._presentationKey(clientId, eventId), rec = this._event(clientId, eventId); if (!rec) return null;
    if (rec.presentation !== 'pending') {
      this._sendTo(clientId, { type: 'presentation-decision', transient: true, presentation: rec.presentation, reason: rec.presentationReason, event: this._publicEvent(rec), pushAccepted: rec.pushAccepted, pushStatus: rec.pushStatus });
      return rec;
    }
    rec.presentation = presentation; rec.presentationReason = reason; rec.decidedAt = Date.now(); this.presentation[key] = { presentation, reason, at: rec.decidedAt };
    delete this.pendingPresentation[key]; const timer = this.pendingTimers.get(key); if (timer) clearTimeout(timer); this.pendingTimers.delete(key);
    if (presentation === 'os') { const push = await this._pushOne(clientId, rec); rec.pushAccepted = push.accepted; rec.pushStatus = push.status; rec.pushReason = push.reason || null; }
    await this._saveRecipientState();
    this._sendTo(clientId, { type: 'presentation-decision', transient: true, presentation, reason, event: this._publicEvent(rec), pushAccepted: rec.pushAccepted, pushStatus: rec.pushStatus });
    return rec;
  }
  async _scheduleAlarm() {
    const due = [];
    for (const p of Object.values(this.pendingPresentation)) due.push(p.dueAt);
    for (const c of Object.values(this.calls)) if (Object.values(c.recipients || {}).includes('ringing')) due.push(c.expiresAt);
    if (due.length) await this.state.storage.setAlarm(Math.min(...due));
  }
  async _offer(clientId, msg) {
    const rec = this._event(clientId, msg.eventId); if (!rec || rec.presentation !== 'pending') return;
    const sub = this.subs[clientId] || {};
    if (sub.muted === true) return this._commit(clientId, msg.eventId, 'muted', 'room-muted');
    if (msg.type === 'chat-msg') {
      const last = Number(this.burst[clientId]) || 0; this.burst[clientId] = Date.now();
      if (Date.now() - last < CHAT_BURST_MS) return this._commit(clientId, msg.eventId, 'suppressed', 'chat-burst');
    }
    const key = this._presentationKey(clientId, msg.eventId), dueAt = Date.now() + PRESENT_WAIT_MS;
    this.pendingPresentation[key] = { clientId, eventId: msg.eventId, dueAt };
    this._sendTo(clientId, { type: 'presentation-offer', transient: true, event: this._publicEvent(rec) });
    const timer = setTimeout(() => { this.state.waitUntil(this._commit(clientId, msg.eventId, 'os', 'foreground-timeout')); }, PRESENT_WAIT_MS);
    this.pendingTimers.set(key, timer); await this._saveRecipientState(); await this._scheduleAlarm();
  }
  async _handleCallControl(msg, clientId) {
    const call = this.calls[msg.callId]; if (!call) return;
    if (msg.type === 'call-accept' || msg.type === 'call-decline') {
      const outcome = msg.type === 'call-accept' ? 'accepted' : 'declined'; call.recipients[clientId] = outcome;
      const rec = this._event(clientId, call.eventId); if (rec) { rec.outcome = outcome; rec.seen = true; }
    }
    if (msg.type === 'call-end' && clientId === call.senderId) {
      for (const [recipientId, outcome] of Object.entries(call.recipients)) if (outcome === 'ringing') {
        call.recipients[recipientId] = 'missed'; const rec = this._event(recipientId, call.eventId); if (rec) rec.outcome = 'missed';
      }
      call.endedAt = Date.now();
    }
    await this._saveRecipientState();
  }
  async _markSeen(clientId, through) {
    let n = 0; for (const rec of this.recipientEvents[clientId] || []) if (rec.l <= through && !rec.seen) { rec.seen = true; n++; }
    await this._saveRecipientState(); return n;
  }

  async fetch(request) {
    await this.ready; const url = new URL(request.url);
    if (url.pathname.startsWith('/auth/')) return this._authFetch(request, url);
    await this._touchSession();
    const clientId = (url.searchParams.get('client') || '').trim(), session = (url.searchParams.get('session') || '').trim();
    if (session && session !== this.sessionName) { this.sessionName = session; await this.state.storage.put({ sessionName: session }); }
    if (request.headers.get('Upgrade') === 'websocket') {
      if (!clientId) return err('Missing client', 400);
      this.devices[clientId] = { at: Date.now() }; await this.state.storage.put({ devices: this.devices });
      const pair = new WebSocketPair(); this.state.acceptWebSocket(pair[1]); pair[1].serializeAttachment({ clientId });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    if (request.method === 'GET') {
      if (!clientId) return err('Missing client', 400);
      if (url.searchParams.get('ledger') === '1') return json({ ok: true, events: (this.recipientEvents[clientId] || []).map(e => this._publicEvent(e)), lseq: this.lseq, complete: true });
      if (url.searchParams.has('event')) { const rec = this._event(clientId, String(url.searchParams.get('event'))); return json({ ok: true, event: rec ? this._publicEvent(rec) : null }); }
      const since = Number(url.searchParams.get('since') || 0);
      return json(this.messages.filter(m => m.seq > since && (!m.to || m.to === clientId) && m.from !== clientId));
    }
    if (request.method !== 'POST') return err('Method not allowed', 405);
    if (!clientId) return err('Missing client', 400);
    let body; try { body = await requestJson(request); } catch (_) { return err('Bad body'); }
    if (body.type === 'diag') return json({ ok: true, v: 'R10.6', connected: [...this._connectedIds()], devices: Object.keys(this.devices).length,
      subs: Object.keys(this.subs).length, lseq: this.lseq, recipientCounts: Object.fromEntries(Object.entries(this.recipientEvents).map(([k, v]) => [k, v.length])),
      pending: Object.keys(this.pendingPresentation), pushLog: this.pushLog.slice(-20) });
    if (body.type === 'vapid') return json({ ok: true, vapid: VAPID_PUBLIC_KEY, push: !!this.env.VAPID_PRIVATE_KEY });
    if (body.type === 'subscribe' && body.subscription && body.subscription.endpoint) {
      this.devices[clientId] = { at: Date.now() }; this.subs[clientId] = { sub: body.subscription, at: Date.now(), navigate: body.navigate || '', muted: body.muted === true };
      await this.state.storage.put({ devices: this.devices, subs: this.subs }); return json({ ok: true, subscribed: true, muted: this.subs[clientId].muted });
    }
    if (body.type === 'mute') {
      const sub = this.subs[clientId] || (this.subs[clientId] = { sub: null, at: Date.now(), navigate: '', muted: false }); sub.muted = body.muted === true; sub.at = Date.now();
      await this.state.storage.put({ subs: this.subs }); return json({ ok: true, muted: sub.muted });
    }
    if (body.type === 'seen-through') { const through = Math.max(0, Number(body.through) || 0), n = await this._markSeen(clientId, through); return json({ ok: true, through, marked: n }); }
    if (body.type === 'unsubscribe') { delete this.subs[clientId]; await this.state.storage.put({ subs: this.subs }); return json({ ok: true, subscribed: false }); }
    return err('Unknown request');
  }

  async webSocketMessage(ws, raw) {
    await this.ready; let msg; try { msg = JSON.parse(raw); } catch (_) { return; } if (!msg || !msg.type) return;
    const tag = ws.deserializeAttachment() || {}, clientId = tag.clientId || msg.from || ''; msg.from = clientId; msg.ts = msg.ts || Date.now();
    this.devices[clientId] = { at: Date.now() };
    if (msg.type === 'foreground-ready') {
      const rec = this._event(clientId, msg.eventId); if (!rec) return;
      if (rec.presentation === 'pending' && this.pendingPresentation[this._presentationKey(clientId, msg.eventId)]) await this._commit(clientId, msg.eventId, 'in_app', 'foreground-ready');
      else this._sendTo(clientId, { type: 'presentation-decision', transient: true, presentation: rec.presentation, reason: rec.presentationReason, event: this._publicEvent(rec), pushAccepted: rec.pushAccepted, pushStatus: rec.pushStatus });
      return;
    }
    if (msg.type === 'surface-ready') {
      const rec = this._event(clientId, msg.eventId); if (rec && (rec.presentation === 'in_app' || rec.presentation === 'suppressed') && msg.seen === true) { rec.seen = true; rec.seenAt = Date.now(); await this._saveRecipientState(); }
      return;
    }
    const transient = msg.transient === true || TRANSIENT_TYPES.has(msg.type);
    await this._touchSession();
    if (ALERT_TYPES.has(msg.type)) {
      if (!msg.eventId) msg.eventId = 'relay-' + randomOpaque(12);
      if (msg.type === 'call-start' && !msg.callId) msg.callId = msg.eventId;
    }
    const duplicate = !transient && msg.eventId && this.messages.some(old => old.eventId === msg.eventId && old.from === clientId && old.type === msg.type);
    if (duplicate) return;
    if (!transient) await this._persistMessage(msg); else { this.seq++; await this.state.storage.put({ seq: this.seq }); }
    if (ALERT_TYPES.has(msg.type)) {
      const recipients = await this._appendRecipients(msg, clientId);
      for (const recipient of recipients) await this._offer(recipient, msg);
      return;
    }
    if (msg.type === 'call-accept' || msg.type === 'call-decline' || msg.type === 'call-end') await this._handleCallControl(msg, clientId);
    this._broadcast(msg, clientId);
  }

  async alarm() {
    await this.ready; const now = Date.now();
    for (const p of Object.values(this.pendingPresentation)) if (p.dueAt <= now) await this._commit(p.clientId, p.eventId, 'os', 'foreground-timeout');
    for (const call of Object.values(this.calls)) if (call.expiresAt <= now) {
      for (const [clientId, outcome] of Object.entries(call.recipients || {})) if (outcome === 'ringing') {
        call.recipients[clientId] = 'missed'; const rec = this._event(clientId, call.eventId); if (rec) rec.outcome = 'missed';
      }
    }
    await this._saveRecipientState(); await this._scheduleAlarm();
  }
  async webSocketClose() {}
  async webSocketError(ws) { try { ws.close(1011, 'error'); } catch (_) {} }
}
