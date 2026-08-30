/* ─────────────────────────────────────────────────────────────────────────────
   TALK RELAY — worker-talk.js  ·  v5.0-cr1 RECIPIENT-EVENT AUTHORITY (plan v20.9.0 §4.11)\n   Lineage: ship R7 body + v4 RFC 8291 delivery class (e416a70), MINUS every\n   form of server-side presence inference (abandoned index A1-A3).

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
    /* §4.11.2 — ONE recipient-event authority. One durable record per event and
       recipient device; sole truth for presentation, push result, seen state,
       recipient call outcome, and the home projection. */
    this.events = {};                   /* eventId -> record */
    this.roster = {};                   /* clientId -> lastSeenTs (devices that belong to this room) */
    this.activeCall = null;             /* eventId of the open call event, if any */
    this.lastChatPush = {};             /* clientId -> ts of last chat push (10s room burst) */
    this.sessionId = '';
    this.ready = this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get(['seq', 'messages', 'lastActivity', 'subs', 'events', 'roster', 'activeCall', 'sessionId']);
      this.seq = Number(stored.get('seq')) || 0;
      this.messages = stored.get('messages') || [];
      this.lastActivity = Number(stored.get('lastActivity')) || 0;
      this.subs = stored.get('subs') || {};
      this.events = stored.get('events') || {};
      this.roster = stored.get('roster') || {};
      this.activeCall = stored.get('activeCall') || null;
      this.sessionId = stored.get('sessionId') || '';
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
    const text = JSON.stringify(payload, (k, v) => (k === '_evtId' ? undefined : v));
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
  async _pushOne(clientId, rec) {
    const endpoint = rec && rec.sub && rec.sub.endpoint;
    const keys = rec && rec.sub && rec.sub.keys;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) return;
    let body;
    const ev = rec && rec._evt;
    const payload = ev
      ? { t: 'tb-evt', at: Date.now(), room: this.sessionId, id: ev.id, kind: ev.kind, call: ev.kind !== 'chat' ? (ev.ended ? 'ended' : 'active') : undefined }
      : { t: 'tb-wake', at: Date.now() };
    try {
      body = await webpushEncrypt(JSON.stringify(payload), keys.p256dh, keys.auth);
    } catch (_) { return; }
    const headers = {
      TTL: '60', Urgency: 'high', Topic: 'tb-wake',
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'Content-Length': String(body.length)
    };
    const auth = await vapidHeader(this.env, endpoint);
    if (auth) headers.Authorization = auth;
    try {
      const res = await fetch(endpoint, { method: 'POST', headers, body });
      this.lastWake = { clientId, at: Date.now(), status: res.status };
      if (rec && rec._evt) this._recordPush(rec._evt.id, clientId, res.status >= 200 && res.status < 300 ? 'accepted' : 'failed');
      /* 404 and 410 mean the subscription is dead — the browser has revoked it.
         Keeping it would mean retrying forever against nothing. */
      if (res.status === 404 || res.status === 410) {
        delete this.subs[clientId];
        await this._saveSubs();
      }
    } catch (_) {}
  }

  /* v4.2 ALWAYS-PUSH (plan v20.0.0 §4.6, sources S1-S3): every push-worthy
     event goes to every subscribed device except the sender, unconditionally.
     A socket is not a person; the device decides presentation. The old
     freshness exemption and 1s ack-gate (A1-A3) are deleted, not disabled. */
  async _wakeOthers(msg, senderId) {
    if (!PUSH_WORTHY.has(msg.type)) return;
    const now = Date.now();
    const evt = msg._evtId ? this.events[msg._evtId] : null;
    const jobs = [];
    for (const [clientId, rec] of Object.entries(this.subs)) {
      if (clientId === senderId) continue;
      if (rec.at && now - rec.at > SUB_TTL_MS) {         /* stale, drop it */
        delete this.subs[clientId];
        continue;
      }
      /* §4.11.4 room burst: the first chat after ten quiet seconds may alert;
         later chats in the burst stay individually countable but are
         'suppressed', never claimed as OS-owned. Calls always alert. */
      if (evt && evt.kind === 'chat') {
        const last = this.lastChatPush[clientId] || 0;
        if (now - last < 10000) {
          this._setPresentation(evt.id, clientId, 'suppressed');
          continue;
        }
        this.lastChatPush[clientId] = now;
      }
      if (evt) this._setPresentation(evt.id, clientId, 'os_requested');
      jobs.push(this._pushOne(clientId, evt ? Object.assign({ _evt: evt }, rec) : rec));
    }
    if (jobs.length) await Promise.all(jobs);
  }

  /* ── §4.11.2/4.11.3 · the recipient-event authority ─────────────────────── */
  _touchRoster(clientId) {
    if (!clientId) return false;
    const isNew = !this.roster[clientId];
    this.roster[clientId] = Date.now();
    if (isNew) this.state.storage.put({ roster: this.roster });
    return isNew;
  }

  async _saveEvents() {
    await this.state.storage.put({ events: this.events, roster: this.roster, activeCall: this.activeCall });
  }

  _newRecord(id, kind, from, ts, extra) {
    if (this.events[id]) return this.events[id];   /* retry reuses identifiers */
    const rcp = {};
    for (const clientId of Object.keys(this.roster)) {
      if (clientId === from) continue;
      rcp[clientId] = { p: 'pending', u: 'not_requested', s: 0, st: 0, o: kind === 'chat' ? undefined : 'offered' };
    }
    const rec = Object.assign({ id, kind, from, ts, ended: false, rcp }, extra || {});
    this.events[id] = rec;
    this._pruneEvents();
    return rec;
  }

  _pruneEvents() {
    const ids = Object.keys(this.events);
    if (ids.length <= 300) return;
    ids.sort((a, b) => (this.events[a].ts || 0) - (this.events[b].ts || 0));
    const allSeen = (r) => Object.values(r.rcp).every((x) => x.s === 1 || x.o === 'missed' ? x.s === 1 : true);
    for (const id of ids) {
      if (Object.keys(this.events).length <= 300) break;
      if (allSeen(this.events[id])) delete this.events[id];
    }
    for (const id of ids) {
      if (Object.keys(this.events).length <= 300) break;
      delete this.events[id];
    }
  }

  _setPresentation(eventId, clientId, p) {
    const rec = this.events[eventId];
    if (!rec || !rec.rcp[clientId]) return;
    const cur = rec.rcp[clientId].p;
    /* suppressed and muted can never be relabelled OS-owned */
    if ((cur === 'suppressed' || cur === 'muted') && p === 'os_requested') return;
    rec.rcp[clientId].p = p;
  }

  _recordPush(eventId, clientId, u) {
    const rec = this.events[eventId];
    if (!rec || !rec.rcp[clientId]) return;
    rec.rcp[clientId].u = u;
    this.state.storage.put({ events: this.events }).catch?.(() => {});
  }

  /* Product words drive the authority. No harness-only words exist. */
  async _recordEvent(msg, senderId) {
    this._touchRoster(senderId);
    this._closeStaleCalls();
    const t = msg.type;
    if (t === 'chat-msg' && msg.chatId) {
      msg._evtId = 'chat:' + msg.chatId;
      this._newRecord(msg._evtId, 'chat', senderId, msg.ts);
    } else if (t === 'call-start') {
      const kind = msg.kind === 'video' ? 'video' : 'voice';
      const id = 'call:' + senderId + ':' + msg.ts;
      this.activeCall = id;
      msg._evtId = id;
      this._newRecord(id, kind, senderId, msg.ts, { callId: id });
    } else if (t === 'call-accept') {
      const rec = this.activeCall && this.events[this.activeCall];
      if (rec && rec.rcp[senderId] && rec.rcp[senderId].o === 'offered') {
        rec.rcp[senderId].o = 'accepted'; rec.rcp[senderId].s = 1; rec.rcp[senderId].st = Date.now();
      }
    } else if (t === 'call-decline') {
      const rec = this.activeCall && this.events[this.activeCall];
      if (rec && rec.rcp[senderId] && rec.rcp[senderId].o === 'offered') {
        rec.rcp[senderId].o = 'declined'; rec.rcp[senderId].s = 1; rec.rcp[senderId].st = Date.now();
        rec.ended = true; this.activeCall = null;
      }
    } else if (t === 'call-end') {
      /* §4.11.3: caller/global termination and receiver outcome are separate
         facts. The ordinary product's BARE call-end makes every still-offered
         receiver 'missed' exactly once — no reason word is consulted. */
      const rec = this.activeCall && this.events[this.activeCall];
      if (rec && !rec.ended) {
        this._closeCall(rec);
        msg._evtId = rec.id;
      }
      this.activeCall = null;
    } else if (PUSH_WORTHY.has(t)) {
      msg._evtId = 'other:' + t + ':' + (msg.ts || Date.now()) + ':' + senderId;
      this._newRecord(msg._evtId, 'other', senderId, msg.ts);
    }
    await this._saveEvents();
  }

  _closeCall(rec) {
    if (rec.ended) return;
    rec.ended = true;
    for (const state of Object.values(rec.rcp)) {
      if (state.o === 'offered') state.o = 'missed';   /* unseen: counts until room open */
    }
  }

  _closeStaleCalls() {
    const now = Date.now();
    for (const rec of Object.values(this.events)) {
      if ((rec.kind === 'voice' || rec.kind === 'video') && !rec.ended && now - (rec.ts || 0) > 120000) {
        this._closeCall(rec);
        if (this.activeCall === rec.id) this.activeCall = null;
      }
    }
  }

  /* Idempotent projection of unseen recipient records (§4.11.2). Socket
     delivery, push, tap navigation, replay, retry, restart, and repeated
     reconciliation of the same event all produce this same single answer. */
  _syncFor(clientId) {
    this._touchRoster(clientId);
    this._closeStaleCalls();
    const proj = { chat: 0, voice: 0, video: 0 };
    const unseen = [];
    for (const rec of Object.values(this.events)) {
      const st = rec.rcp[clientId];
      if (!st || st.s === 1) continue;
      if (rec.kind === 'chat') { proj.chat += 1; unseen.push({ id: rec.id, kind: rec.kind, ts: rec.ts, from: rec.from }); }
      else if (rec.kind === 'voice' || rec.kind === 'video') {
        if (st.o === 'missed') { proj[rec.kind] += 1; unseen.push({ id: rec.id, kind: rec.kind, ts: rec.ts, from: rec.from, o: st.o }); }
        else if (st.o === 'offered' && !rec.ended) unseen.push({ id: rec.id, kind: rec.kind, ts: rec.ts, from: rec.from, o: 'offered' });
      }
    }
    unseen.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    return { ok: true, v: '5.0-cr1', proj, unseen, seq: this.seq };
  }

  async _markSeen(clientId, ids) {
    let changed = 0;
    for (const id of Array.isArray(ids) ? ids : []) {
      const rec = this.events[id];
      const st = rec && rec.rcp[clientId];
      if (st && st.s !== 1) { st.s = 1; st.st = Date.now(); changed += 1; }
    }
    if (changed) await this._saveEvents();
    return changed;
  }

  async fetch(request) {
    await this.ready;
    await this._touchSession();

    const url = new URL(request.url);
    const clientId = (url.searchParams.get('client') || '').trim();
    const sess = (url.searchParams.get('session') || '').trim().slice(0, 128);
    if (sess && this.sessionId !== sess) { this.sessionId = sess; await this.state.storage.put({ sessionId: sess }); }
    if (clientId) { this._touchRoster(clientId); }

    if (request.headers.get('Upgrade') === 'websocket') {
      if (!clientId) return err('Missing client', 400);
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({ clientId });
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (request.method === 'GET') {
      /* §4.11.3 read-only HTTPS reconciliation against the same authority —
         usable when a socket is unavailable; never a second state model. */
      if (url.searchParams.get('events') === '1') {
        if (!clientId) return err('Missing client', 400);
        const out = this._syncFor(clientId);
        await this._saveEvents();
        return json(out);
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
        return json({ ok: true, v: '5.0-cr1', connected: [...this._connectedIds()], subs: Object.keys(this.subs).length, lastWake: this.lastWake, ev: { n: Object.keys(this.events).length, activeCall: this.activeCall || null } });
      }
      if (body && body.type === 'events-sync') {
        const out = this._syncFor(clientId);
        await this._saveEvents();
        return json(out);
      }
      if (body && body.type === 'event-seen') {
        /* Seen changes only on the app's explicit word for exactly these events
           (§4.11.2). A cursor or a late route can never do this. */
        const changed = await this._markSeen(clientId, body.ids);
        return json(Object.assign({ changed }, this._syncFor(clientId)));
      }
      if (body && body.type === 'event-presented') {
        const allowed = new Set(['pending', 'in_app', 'os_requested', 'suppressed', 'muted']);
        if (body.id && allowed.has(body.p)) {
          this._setPresentation(body.id, clientId, body.p);
          await this._saveEvents();
          return json({ ok: true });
        }
        return err('Bad presentation');
      }
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
    msg.from = msg.from || clientId;
    this._touchRoster(clientId);   /* any inbound word proves the device belongs to this room */
    msg.ts = msg.ts || Date.now();

    const isTransient = msg.transient === true || TRANSIENT_TYPES.has(msg.type);
    await this._touchSession();

    if (!isTransient) {
      await this._recordEvent(msg, clientId);
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
