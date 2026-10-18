/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js  ·  v6.12 29·post-ship c5 — THE ACTIVITY LOG (who created, joined, called, chatted; no text) on v6.11 29·post-ship c4 — REACHABILITY FROM THE RECORD (reach on the peer announce, call-reach to the caller) on v6.10 29·ship c6 — A STATE WORD ANNOUNCES AT ONCE (G71) on v6.9 29·ship c5 — PERSISTED PRESENCE WORDS (a word rides an attached socket), RECEIPTS FROM THE RECORD (`mine`: delivered/seen for the sender) on v6.8 29·ship c4 — DEAD-ENDPOINT MEMORY (a 404/410 from the push service is remembered; the subscription is refused when re-offered, so the app re-mints) on v6.7 29·base — MULTI-USER, RELAY LEG (plan §7.8 R-parts, owner GO 2026-10-09)
   v6.7 adds, app untouched (every change is a no-op for a message without the new fields):
     · a room cap — MAX_PARTICIPANTS (4) or the creator's `cap` query parameter, kept with the
       session; a device beyond it is told {type:'full', cap, n} and closed with 4001 before it
       becomes a recipient of anything (R2 cap enforcement);
     · per-device addressing — a message carrying `to` reaches that device alone and is recorded
       for it alone; the words of an addressed call (accept / decline / end / signal / mic / cam)
       are routed to the other party of that call without the app having to say so (R1
       addressed-by-deviceId); a message without `to` fans out to every socket as before;
     · the peer announcement carries `inCall` — who is engaged in an open accepted call — so a
       third device can show "on a call" (A1 presence for N, app leg to come).
   v6.6 27·pre-ship (N-1: terminal push retracts a call card the relay itself requested, for recipients not connected) (v6.2 + additive: /log device-log route + peer presence announce; plan v20.49.0)
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
const REACH_FRESH_MS = 14 * 24 * 60 * 60 * 1000;   /* v6.11: a subscription counts toward `reach.subs` only when re-offered within this window (the app re-posts it on every boot and room entry); older ones still receive pushes until SUB_TTL_MS — the mark is the negative claim, so a stale-but-live sub costs a wrong "won't be alerted", never a false promise */
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
const RELAY_VERSION = '6.15';          /* v6.15 29·post-ship c8: THE ROOM SURVIVES A SLEEP (owner 2026-10-18: "room name is wrong" — three call lines read "room none"). The room code was kept only in memory, set by the request that opened the socket; a room's object sleeps between messages and woke without it, so every line written after a sleep said "none". The socket carries the room code in its attachment; the message handler takes it from there when memory has none. */
/* (prior) v6.14 29·post-ship c7: NAMES ONLY in the activity log (owner 2026-10-17: "get rid of flz, is confusing") — a person is the name they typed (letters and digits, any script, 16 at most); a person with no name is "Guest 1", "Guest 2" … numbered in the order they first appear in that room, and kept. No device tag. */
/* (prior) v6.13 29·post-ship c6: CLEAN LABELS in the activity log (owner 2026-10-16: "if there is a default name that hasn't been added yet it doesn't include one that has special characters; this should be super clean") — a person is "<Name> <tag>": the name keeps letters and digits only (any script), the tag is lowercase letters and digits, a device without a name is "Guest"; the room is letters and digits; a language that is not a language code is "unknown". */
/* (prior) v6.12 29·post-ship c5: THE ACTIVITY LOG (owner 2026-10-15: "I want a timestamp log: x created room 1 en to th; x joined; y joined; video call from x missed; video call from y answered; chat from x") — one line per event in a fixed Durable Object (tb::__activity__), person = the name they typed · their device tag, room = its short id; no message text; drained by the device-log workflow into talkbridge/ACTIVITY-LOG.md. */
/* v6.11 was:          /* v6.11 29·post-ship c4: REACHABILITY FROM THE RECORD — the peer announce carries reach {known, subs} (the negative claim only: a partner with no fresh subscription will not be alerted when away); a call-start answers its caller with call-reach {app, pushed, none, muted} read from the recipient record AFTER the push attempt (a 410 learned there counts as none); subscribe/unsubscribe announce at once. Owner 2026-10-12: "you cannot tell, before you call, whether the call can reach the other person". */
/* v6.10 was:          /* v6.10 29·ship c6: a STATE WORD ANNOUNCES AT ONCE — since v6.5 the announce for ev-state sat behind the event-word handler's early return and never ran; presence moved only with the 30 s heartbeat (device log 2026-10-11 23:58: a room entered at :10, the first dot at :38). v6.9 29·ship c5: the presence words are PERSISTED (the object sleeps between heartbeats and woke with an empty memory — the dot blinked, 2026-10-10 23:26 UTC) and a word counts only while its device has a socket attached; the sender's receipts (delivered, seen) come from the record (`mine` on every projection). v6.8 29·ship c4: dead-endpoint memory — a subscription the push service declared gone (404/410) is refused when re-registered, so the app re-mints */
const MAX_PARTICIPANTS = 4;           /* v6.7 §7.8 R2: the room cap unless the creator's socket says otherwise (1..8) */
const CALL_ROUTED = new Set(['call-accept', 'call-decline', 'call-end', 'webrtc-signal', 'mic-state', 'cam-state']);   /* v6.7 R1: words of a call that go to the other party of an ADDRESSED call */
const EVENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_EVENTS = 400;
const BURST_MS = 10000;               /* §4.11.4: first chat after ten quiet seconds may alert */
const STATE_FRESH_MS = 45000;         /* a reported visible state older than this is not trusted */
const EV_TYPES = new Set(['ev-state', 'ev-seen', 'ev-open', 'events-sync']);

/* v6.13 — clean labels for the activity log. A name keeps letters (with their marks, so Thai stays whole) and digits, in any
   script; spaces, punctuation, symbols and emoji are dropped; 16 at most; nothing left is a guest (v6.14: "Guest N", numbered
   per room, see _who). A language is a code. */
function cleanName(v) {
  let s = String(v == null ? '' : v).normalize('NFKC').replace(/[^\p{L}\p{M}\p{N}]+/gu, '').replace(/^\p{M}+/u, '');
  s = Array.from(s).slice(0, 16).join('');
  return s;
}
function cleanLang(v) {
  const s = String(v == null ? '' : v).trim();
  return /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(s) ? s : 'unknown';
}

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
    /* N16 — SHARED DEVICE LOG. Both handsets write their log lines here, in
       one place, in arrival order, so a mismatch between two devices can be
       read directly instead of correlated by hand from two exports. Held in
       one fixed room so every device lands in the same file; drained by the
       repository workflow and committed to talkbridge/DEVICE-LOG.md. */
    if (url.pathname === '/log') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
      const id = env.TALK_SESSION.idFromName('tb::__devicelog__');
      return env.TALK_SESSION.get(id).fetch(request);
    }
    /* v6.12 — the activity log: one fixed room holds every room's lines (GET reads, DELETE clears, POST is a room's own append) */
    if (url.pathname === '/activity') {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
      const id = env.TALK_SESSION.idFromName('tb::__activity__');
      return env.TALK_SESSION.get(id).fetch(request);
    }
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
    this.states = {};                   /* clientId -> { visible, inRoom, muted, at } last reported. v6.9: PERSISTED — kept in memory only, it vanished every time the object slept between two heartbeats, and the first phone to wake it was told nobody was there (device log 2026-10-10 23:26:42 UTC) */
    this.cap = 0;                       /* v6.7: the room cap once a creator's socket has said it; 0 = MAX_PARTICIPANTS */
    this.dead = {};                     /* v6.8: endpoint → when the push service said 404/410. Device log 2026-10-10 18:23 UTC: FCM answered 410 for a subscription Chrome still handed the app at every boot; the app re-registered it, the relay re-learned it was dead, nothing ever rang. */
    this.ready = this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['seq', 'messages', 'lastActivity', 'subs', 'events', 'devices', 'cap', 'dead', 'states']);
      this.cap = Number(stored.get('cap')) || 0;
      this.seq = Number(stored.get('seq')) || 0;
      this.messages = stored.get('messages') || [];
      this.lastActivity = Number(stored.get('lastActivity')) || 0;
      this.subs = stored.get('subs') || {};
      this.events = stored.get('events') || {};
      this.devices = stored.get('devices') || {};
      this.dead = stored.get('dead') || {};
      this.states = stored.get('states') || {};
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
    /* v6.9: the asker's OWN chat events — which the record says are delivered (any recipient has the bytes) and seen (any recipient saw) */
    const mine = { delivered: [], seen: [] };
    for (const ev of Object.values(this.events)) {
      if (ev.from !== clientId || ev.kind !== 'chat') continue;
      const rs = Object.values(ev.rcp); if (!rs.length) continue;
      if (rs.some((r) => r.s === 'seen')) mine.seen.push(ev.id);
      else if (rs.some((r) => r.dv)) mine.delivered.push(ev.id);
    }
    return { proj, unseen, calls, mine };
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
    this._sendTo(clientId, { type: 'ev-proj', transient: true, proj: p.proj, unseen: p.unseen, calls: p.calls, mine: p.mine, ts: Date.now() });
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
    if (msg.to) ev.to = String(msg.to);                                   /* v6.7: an addressed event has one recipient */
    if (kind === 'call') {
      ev.callId = String(msg.callId || id);
      ev.callKind = msg.kind === 'video' ? 'video' : 'voice';
      ev.ended = false;
    }
    for (const cid of (ev.to ? [ev.to] : this._recipients(senderId))) {
      const p = this._decide(ev, cid, now);
      ev.rcp[cid] = { p, push: 'not_requested', s: 'unseen', o: kind === 'call' ? 'offered' : null, at: now, seenAt: null, seenBy: null };
      if (this._isConnected(cid)) ev.rcp[cid].dv = now;                 /* v6.9: the fan-out that follows reaches an attached socket — delivered */
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
  async _applyCallWord(msg, clientId, sessionId) {
    const ev = (msg.callId && this._openCall(String(msg.callId))) || this._latestOpenCallFrom(clientId);
    if (!ev) return;
    msg.callId = ev.callId; msg.eventId = ev.id;
    const r = ev.rcp[clientId];
    if (msg.type === 'call-accept') { if (r && r.o === 'offered') { r.o = 'accepted'; r.s = 'seen'; r.seenAt = Date.now(); r.seenBy = 'accept'; if (!ev.logged) { ev.logged = true; this._activity(ev.callKind + ' call from ' + this._who(ev.from) + ' — answered by ' + this._who(clientId), null); } } }
    else if (msg.type === 'call-decline') { if (r && r.o === 'offered') { r.o = 'declined'; r.s = 'seen'; r.seenAt = Date.now(); r.seenBy = 'decline'; if (!ev.logged) { ev.logged = true; this._activity(ev.callKind + ' call from ' + this._who(ev.from) + ' — declined by ' + this._who(clientId), null); } } }
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
    if (msg.type === 'call-end' && ev.ended && !ev.logged) { ev.logged = true; this._activity(ev.callKind + ' call from ' + this._who(ev.from) + ' — missed', null); }   /* v6.12: ended with nobody answering */
    await this._saveEvents();
    for (const cid of Object.keys(ev.rcp)) this._pushProjection(cid);
    /* N-1 (plan §9) — the terminal wake. A card left by an OS-requested push
       is this relay's own doing and this relay's own responsibility to
       retract. Only recipients who are NOT connected need it — a connected
       device already has the socket truth via _pushProjection above, and
       never held an OS notification in the first place (_decide: visible +
       connected → 'in_app', no push was ever requested for it). One send
       per record, guarded exactly like every retry-safe push in this file. */
    for (const [cid, r] of Object.entries(ev.rcp)) {
      if (cid === clientId) continue;                       /* the actor sees it happen; no card exists to retract */
      if (r.o !== 'missed' && r.o !== 'ended') continue;
      if (r.termPushed) continue;
      if (this._isConnected(cid)) continue;
      r.termPushed = true;
      try { await this._pushCallEnd(cid, ev, sessionId || '', r.o); } catch (_) {}
    }
    await this._saveEvents();
  }
  /* N-1 — mirrors _pushOne's delivery mechanics exactly (encrypt, VAPID,
     same Topic so an undelivered offer push is superseded rather than
     duplicated) without touching _pushOne itself. Failure is swallowed;
     the card simply outlives the call, same as before this release. */
  async _pushCallEnd(clientId, ev, sessionId, outcome) {
    const rec = this.subs[clientId];
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    const keys = rec && rec.sub && rec.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) return;
    let body;
    try {
      const payload = { t: 'tb-call-end', id: ev.id, room: sessionId, callId: ev.callId, outcome, name: ev.name || null, ts: Date.now() };
      body = await webpushEncrypt(JSON.stringify(payload), keys.p256dh, keys.auth);
    } catch (_) { return; }
    const headers = {
      TTL: '60', Urgency: 'high', Topic: ('tb-call-' + ev.callId).slice(0, 32),
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length)
    };
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    try { await fetch(endpoint, { method: 'POST', headers, body }); } catch (_) {}
  }
  async _markSeen(clientId, ids, by) {
    let changed = 0; const senders = new Set();
    const now = Date.now();
    for (const id of ids) {
      const ev = this.events[id]; if (!ev) continue;
      const r = ev.rcp[clientId]; if (!r || r.s === 'seen') continue;
      r.s = 'seen'; r.seenAt = now; r.seenBy = by; if (!r.dv) r.dv = now; changed += 1;
      if (ev.from) senders.add(ev.from);
    }
    if (changed) { await this._saveEvents(); for (const sid of senders) this._pushProjection(sid); }   /* v6.9: the sender learns from the record, not from a throwaway socket word */
    return changed;
  }
  async _handleEventWord(msg, clientId) {
    if (msg.type === 'ev-state') {
      this.states[clientId] = { visible: msg.visible === true, inRoom: msg.inRoom === true, muted: msg.muted === true, at: Date.now() };
      await this._saveStates();
      try { this._announcePeers(); } catch (_) {}                             /* v6.10 (G71): the word is announced the moment it lands — not at the next heartbeat */
      return { ok: true };
    }
    if (msg.type === 'ev-seen') {
      const n = await this._markSeen(clientId, Array.isArray(msg.ids) ? msg.ids.map(String) : [], 'in_room');
      const p = this._projection(clientId);
      return { ok: true, seen: n, proj: p.proj, unseen: p.unseen, calls: p.calls, mine: p.mine };
    }
    if (msg.type === 'ev-open') {
      /* Opening the room acknowledges exactly the set durably applied to this recipient. */
      const acked = this._projection(clientId).unseen;
      await this._markDelivered(clientId);
      const n = await this._markSeen(clientId, acked.map((u) => u.id), 'room_open');
      const p = this._projection(clientId);
      return { ok: true, seen: n, acked, proj: p.proj, unseen: p.unseen, calls: p.calls, mine: p.mine };
    }
    if (msg.type === 'events-sync') {
      await this._markDelivered(clientId);                                   /* v6.9: a device that syncs has the bytes */
      const p = this._projection(clientId);
      return { ok: true, proj: p.proj, unseen: p.unseen, calls: p.calls, mine: p.mine };
    }
    return null;
  }
  /* Read-only diagnostics: fields and transitions of the same record, secrets redacted. */
  _diagEvents() {
    /* the 40 MOST RECENT by time — seq restarts at every session boundary, so the last 40 by insertion were the oldest session's (diag of 2026-10-10 showed a morning's chats and none of the evening's calls) */
    return Object.values(this.events).sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(-40).map((ev) => ({ id: ev.id, type: ev.type, kind: ev.kind, callKind: ev.callKind || null, callId: ev.callId || null, ended: !!ev.ended, ts: ev.ts, rcp: ev.rcp }));
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
    const to = payload && payload.to ? String(payload.to) : '';              /* v6.7: addressed → that device's sockets only */
    for (const ws of this.state.getWebSockets()) {
      const tag = ws.deserializeAttachment();
      if (tag && tag.clientId === skipClientId) continue;
      if (to && !(tag && tag.clientId === to)) continue;
      try { ws.send(text); } catch (_) {}
    }
  }
  /* v6.7 R1: the words of an ADDRESSED call go to its other party. A call that was
     offered to everyone (no `to`, today's app) keeps fanning out exactly as before. */
  _routeByCall(msg, clientId) {
    if (msg.to || !CALL_ROUTED.has(msg.type)) return;
    const ev = (msg.callId && this._openCall(String(msg.callId))) || this._latestOpenCallFrom(clientId);
    if (!ev || !ev.to) return;
    if (clientId === ev.from) msg.to = ev.to;
    else if (clientId === ev.to) msg.to = ev.from;
  }
  /* v6.7 A1: who is engaged in an open call — the caller and whoever accepted. */
  _inCall() {
    const ids = new Set();
    for (const ev of Object.values(this.events)) {
      if (ev.kind !== 'call' || ev.ended) continue;
      let accepted = false;
      for (const [cid, r] of Object.entries(ev.rcp)) if (r.o === 'accepted') { ids.add(cid); accepted = true; }
      if (accepted) ids.add(ev.from);
    }
    return [...ids].sort();
  }
  _capOf() { return (this.cap >= 1 && this.cap <= 8) ? this.cap : MAX_PARTICIPANTS; }

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
  /* v6.8: a dead endpoint is remembered (the newest 100) so the app that re-offers it is told, and re-mints. */
  async _noteDead(endpoint) {
    if (!endpoint) return;
    this.dead[endpoint] = Date.now();
    const keys = Object.keys(this.dead).sort((a, b) => this.dead[a] - this.dead[b]);
    while (keys.length > 100) delete this.dead[keys.shift()];
    await this.state.storage.put({ dead: this.dead });
  }
  _isDead(endpoint) { return !!(endpoint && this.dead[endpoint]); }
  /* v6.9: the presence word is written through — a wake must find it */
  async _saveStates() { await this.state.storage.put({ states: this.states }); }
  /* v6.9: delivered = the device has the bytes — it had a socket when the event fanned out, or it synced afterwards */
  async _markDelivered(clientId) {
    const now = Date.now(); const senders = new Set(); let changed = 0;
    for (const ev of Object.values(this.events)) { const r = ev.rcp[clientId]; if (!r || r.dv) continue; r.dv = now; changed++; if (ev.from) senders.add(ev.from); }
    if (changed) { await this._saveEvents(); for (const sid of senders) this._pushProjection(sid); }
    return changed;
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
        r.pushErr = 'dead-endpoint';
        await this._saveSubs();
        await this._noteDead(endpoint);
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

  /* v6.12 — THE ACTIVITY LOG. The fixed room tb::__activity__ keeps the lines (capped); every room appends through the worker's own
     endpoint so the drain reads one file. A line: "<ISO time>  room <id6>  <who> <what>"; who = the name typed in the app · the device tag the
     app's device log uses (hello carries it as `dev`), what = created en → th | joined | video call from … — answered | missed | declined | chat.
     No message text, no endpoint, no full id. */
  async _activityLog(request) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const lines = (await this.state.storage.get('activity')) || [];
      return new Response(lines.join('\n'), { status: 200, headers: { ...cors(), 'Content-Type': 'text/plain; charset=utf-8' } });
    }
    if (request.method === 'DELETE') { await this.state.storage.put({ activity: [] }); return new Response('cleared', { status: 200, headers: cors() }); }
    let body = null; try { body = await request.json(); } catch (_) { return err('bad json'); }
    const line = String((body && body.line) || '').slice(0, 300); if (!line) return err('no line');
    const lines = (await this.state.storage.get('activity')) || [];
    lines.push(line); while (lines.length > 5000) lines.shift();
    await this.state.storage.put({ activity: lines });
    return new Response('ok', { status: 200, headers: cors() });
  }
  _who(clientId) {   /* v6.14: the name only — letters and digits; no name is "Guest N", numbered per room in order of first appearance, and kept */
    const d = this.devices[clientId]; const name = cleanName(d && d.name);
    if (name) return name;
    if (!d) return 'Guest';
    if (!d.guest) {
      d.guest = Object.values(this.devices).filter((x) => x && x.guest).length + 1;
      try { const p = this.state.storage.put({ devices: this.devices }); if (p && p.catch) p.catch(() => {}); } catch (_) {}
    }
    return 'Guest ' + d.guest;
  }
  _activity(what, clientId) {
    try {
      const room = String(this.sessionId || '').replace(/[^A-Za-z0-9]/g, '').slice(-6) || 'none';
      const line = new Date().toISOString().replace('T', ' ').slice(0, 19) + '  room ' + room + '  ' + (clientId ? this._who(clientId) + ' ' : '') + what;
      const id = this.env.TALK_SESSION.idFromName('tb::__activity__');
      const p = this.env.TALK_SESSION.get(id).fetch(new Request('https://relay/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ line }) })).catch(() => {});
      try { this.state.waitUntil(p); } catch (_) {}
    } catch (_) {}
  }
  async _deviceLog(request) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const lines = (await this.state.storage.get('devlog')) || [];
      return new Response(lines.join('\n'), { status: 200, headers: { ...cors(), 'Content-Type': 'text/plain' } });
    }
    if (request.method === 'DELETE') {
      await this.state.storage.put('devlog', []);
      return new Response('cleared', { status: 200, headers: cors() });
    }
    let body = null;
    try { body = await request.json(); } catch (_) { return new Response('bad json', { status: 400, headers: cors() }); }
    const dev = String(body.dev || '?').slice(0, 24);
    const rows = Array.isArray(body.rows) ? body.rows.slice(0, 200) : [];
    const lines = (await this.state.storage.get('devlog')) || [];
    for (const r of rows) {
      const at = new Date(r.t || Date.now()).toISOString().slice(11, 23);
      lines.push(`${at} [${dev}] ${String(r.e || '').slice(0, 60)} ${JSON.stringify(r.d || {}).slice(0, 400)}`);
    }
    while (lines.length > 4000) lines.shift();
    await this.state.storage.put('devlog', lines);
    return new Response(JSON.stringify({ ok: true, n: lines.length }), { status: 200, headers: { ...cors(), 'Content-Type': 'application/json' } });
  }

  async fetch(request) {
    if (new URL(request.url).pathname === '/log') return this._deviceLog(request);
    if (new URL(request.url).pathname === '/activity') return this._activityLog(request);
    await this.ready;
    await this._touchSession();

    const url = new URL(request.url);
    const clientId = (url.searchParams.get('client') || '').trim();
    const sessionId = (url.searchParams.get('session') || '').trim().slice(0, 128);
    if (sessionId) this.sessionId = sessionId;                                  /* v6.12: the activity log names the room by its id */

    if (request.headers.get('Upgrade') === 'websocket') {
      if (!clientId) return err('Missing client', 400);
      /* v6.7 R2: the first socket to say `cap` sets the room's; a device beyond the cap is
         told so and closed before it is noted, pushed to, or counted as present. */
      const capParam = Number(url.searchParams.get('cap') || 0);
      if (!this.cap && capParam >= 1 && capParam <= 8) { this.cap = capParam; await this.state.storage.put({ cap: this.cap }); }
      const connected = this._connectedIds();
      if (!connected.has(clientId) && connected.size >= this._capOf()) {
        const pair = new WebSocketPair();
        this.state.acceptWebSocket(pair[1]);
        try { pair[1].send(JSON.stringify({ type: 'full', transient: true, cap: this._capOf(), n: connected.size, at: Date.now() })); } catch (_) {}
        try { pair[1].close(4001, 'full'); } catch (_) {}
        return new Response(null, { status: 101, webSocket: pair[0] });
      }
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      /* N17 — PRESENCE FROM THE RELAY, NOT FROM TRAFFIC. Presence used to be
         inferred on each device from messages happening to arrive, so a
         partner who was connected but quiet went dark. The relay is the only
         party that actually knows who is attached; it now says so on every
         join and every leave. */
      try { this._announcePeers(); } catch (_) {}
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
        return json({ ok: true, v: RELAY_VERSION, cap: this._capOf(), inCall: this._inCall(), connected: [...this._connectedIds()], subs: Object.keys(this.subs).length, lastWake: this.lastWake, events: this._diagEvents(), eventsTotal: Object.keys(this.events).length, states: this.states });
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
        if (this._isDead(body.subscription.endpoint)) {   /* v6.8: the push service already declared this one gone — the app must mint a new one */
          return json({ ok: false, dead: true, subscribed: false, vapid: VAPID_PUBLIC_KEY });
        }
        this.subs[clientId] = { sub: body.subscription, at: Date.now() };
        await this._saveSubs();
        await this._noteDevice(clientId);
        try { this._announcePeers(); } catch (_) {}                             /* v6.11: the partner's mark follows Turn on at once, not at the next heartbeat */
        return json({ ok: true, subscribed: true, vapid: VAPID_PUBLIC_KEY });
      }

      if (body && body.type === 'unsubscribe') {
        delete this.subs[clientId];
        await this._saveSubs();
        try { this._announcePeers(); } catch (_) {}                             /* v6.11 */
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
    if (!this.sessionId && tag.sessionId) this.sessionId = tag.sessionId;   /* v6.15: the room code survives a sleep (it rides the socket) */
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
    if (msg.type === 'hello') {
      await this._noteDevice(clientId);
      const d = this.devices[clientId]; let changed = false; const fresh = !d.hello; if (fresh) { d.hello = Date.now(); changed = true; }   /* the device's FIRST hello in this room (it is noted at the socket, earlier) */
      if (msg.name && d.name !== String(msg.name).slice(0, 24)) { d.name = String(msg.name).slice(0, 24); changed = true; }
      if (msg.dev && d.dev !== String(msg.dev).slice(0, 24)) { d.dev = String(msg.dev).slice(0, 24); changed = true; }
      if (changed) await this.state.storage.put({ devices: this.devices });
      if (fresh) this._activity((msg.role === 'creator' ? 'created  ' : 'joined  ') + cleanLang(msg.lang) + ' → ' + cleanLang(msg.targetLang), clientId);   /* v6.12 */
    }
    /* A ping may carry the device's state so a hidden phone cannot be mistaken for a watching one. */
    if (msg.type === 'ping' && typeof msg.visible === 'boolean') { this.states[clientId] = { visible: msg.visible, inRoom: msg.inRoom === true, muted: msg.muted === true, at: Date.now() }; await this._saveStates(); }
    if (msg.type === 'ping' && typeof msg.visible === 'boolean') { try { this._announcePeers(); } catch (_) {} }   /* v6.10: ev-state never reached this line (the event-word handler returns above) — it announces in _handleEventWord now */

    try { this._routeByCall(msg, clientId); } catch (_) {}                /* v6.7 R1 */
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
      if (msg.type === 'call-accept' || msg.type === 'call-decline' || msg.type === 'call-end') { try { await this._applyCallWord(msg, clientId, sessionOf(ws)); } catch (_) {} try { this._announcePeers(); } catch (_) {} }
    }

    this._broadcast(msg, clientId);

    if (ev) {
      if (ev.kind === 'chat' && ev.type === 'chat-msg' && ev.seq === msg.seq) this._activity('chat', clientId);   /* v6.12: once per new record (a retry reuses it) */
      for (const cid of Object.keys(ev.rcp)) this._pushProjection(cid);
      if (ev.kind === 'chat') this._pushProjection(clientId);               /* v6.9: the sender's own record (`mine`) — delivered at fan-out */
      /* Pushing must never delay or endanger delivery to one that is awake, so it
         happens after the broadcast and its failures are swallowed. */
      try { await this._deliverByRecord(ev, sessionOf(ws)); } catch (_) {}
      if (ev.kind === 'call') { try { this._sendCallReach(ev, clientId); } catch (_) {} }   /* v6.11: the caller hears what the record says, after the push attempt */
    }
  }

  /* Presence is one thing: is the other person LOOKING at it. Every device
     already reports that on every state announcement and heartbeat; the relay
     simply passes it on. No timers, no counting sockets, no grace. */
  /* v6.5 — PRESENCE IS DECLARED, NEVER OBSERVED (plan §7.13).
     A clientId is present when its own last word says it is in this room.
     Sockets carry the word; they never constitute it — one device on two
     sockets is one person, and a re-attached socket is not an arrival.
     The word is refreshed by the app on entering a room, leaving a room,
     hiding, showing, and every heartbeat, in every environment. */
  /* v6.11 — the OTHER devices this room knows (devices ∪ subs ∪ connected, minus the asker) and how many of them hold a fresh push
     subscription. Counts only: no id and no endpoint leaves the relay. The app shows the NEGATIVE claim alone (known > 0 and subs === 0:
     nobody will be alerted when away); a positive count is never a promise (an abandoned phone, a tab beside an installed copy, a
     subscription the push service has not yet declared dead all count as subs). */
  _reachOf(excludeId) {
    const now = Date.now(); let known = 0, subs = 0;
    for (const id of this._recipients(excludeId)) {
      known++;
      const rec = this.subs[id];
      if (rec && rec.at && now - rec.at <= REACH_FRESH_MS) subs++;
    }
    return { known, subs };
  }
  /* v6.11 — after the push attempt, the caller is told what the record says about its callees: app (ringing in the app), pushed (an OS
     card was accepted by the push service), none (the push failed: no subscription, stale, dead endpoint), muted. Counts only. */
  _sendCallReach(ev, callerId) {
    if (!ev || ev.kind !== 'call') return;
    let app = 0, pushed = 0, none = 0, muted = 0;
    for (const r of Object.values(ev.rcp)) {
      if (r.p === 'in_app') app++;
      else if (r.p === 'muted') muted++;
      else if (r.push === 'accepted') pushed++;
      else if (r.push === 'failed') none++;
    }
    this._sendTo(callerId, { type: 'call-reach', transient: true, callId: ev.callId, app, pushed, none, muted, at: Date.now() });
  }
  _announcePeers() {
    let inCall = []; try { inCall = this._inCall(); } catch (_) {}        /* v6.7 A1 */
    const present = []; const attached = this._connectedIds();          /* v6.9: a word counts only while its device has a socket — a persisted word with no socket is not a person */
    for (const id of Object.keys(this.states)) {
      const st = this.states[id];
      if (st && st.inRoom === true && attached.has(id)) present.push(id);
    }
    for (const ws of this.state.getWebSockets()) {
      const tag = ws.deserializeAttachment();
      if (!tag || !tag.clientId) continue;
      const others = present.filter((i) => i !== tag.clientId);
      let reach = { known: 0, subs: 0 }; try { reach = this._reachOf(tag.clientId); } catch (_) {}   /* v6.11 */
      try { ws.send(JSON.stringify({ type: 'peer', transient: true, focused: others.length > 0, others: others.length, inCall: inCall, reach: reach, at: Date.now() })); } catch (_) {}
    }
  }

  async webSocketClose(ws, code, reason) {
    /* Cleanup, not presence: when a device's LAST socket goes, its word is
       discarded so a killed app leaves no ghost. The closing socket never
       counts itself. A device that merely re-attaches re-declares at once. */
    try {
      const tag = ws.deserializeAttachment();
      const id = tag && tag.clientId;
      if (id) {
        let another = false;
        for (const other of this.state.getWebSockets()) {
          if (other === ws) continue;
          const t = other.deserializeAttachment();
          if (t && t.clientId === id) { another = true; break; }
        }
        if (!another) { delete this.states[id]; await this._saveStates(); }
      }
    } catch (_) {}
    try { this._announcePeers(); } catch (_) {}
  }

  async webSocketError(ws, error) {
    try { ws.close(1011, 'error'); } catch (_) {}
  }
}
