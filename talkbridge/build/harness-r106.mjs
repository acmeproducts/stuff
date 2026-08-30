#!/usr/bin/env node
import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const [shipPath, builtPath, swPath, relayPath] = process.argv.slice(2);
const ship = readFileSync(shipPath), built = readFileSync(builtPath, 'utf8'), sw = readFileSync(swPath, 'utf8'), relay = readFileSync(relayPath, 'utf8');
let pass = 0, fail = 0;
const A = (v, m) => { if (!v) throw new Error(m); };
const T = async (name, fn) => { try { await fn(); pass++; console.log('  ok  ' + name); } catch (e) { fail++; console.log('FAIL  ' + name + ' — ' + (e.message || e)); } };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

await T('S1 clean assembly preserves the frozen ship byte-for-byte around named R10.6 parts', async () => {
  const text = ship.toString('utf8'), cut = text.lastIndexOf('</script>'), bodyStart = built.indexOf('\n') + 1;
  A(built.startsWith('<!-- TalkBridge R10.6'), 'header');
  A(built.slice(bodyStart, bodyStart + cut) === text.slice(0, cut), 'ship prefix changed');
  A(built.endsWith(text.slice(cut)), 'ship suffix changed');
});
await T('S2 candidate contains only the explicitly named clean parts plus inherited P6', async () => {
  for (const name of ['P2 install handoff', 'opaque authorization', 'push subscription', 'P6-threads', 'recipient ledger', 'flight recorder']) A(built.includes(name), name + ' missing');
  A(!built.includes('R10 PART · P4-presentation-owner'), 'rejected R10.5 P4 included');
});
await T('S3 QR/client service path contains no provider credential fields and temporary values are memory-only', async () => {
  const part = built.slice(built.indexOf('R10.6 PART · opaque authorization'), built.indexOf('R10.6 PART · push subscription'));
  const meta = part.slice(part.indexOf('function r106InviteMeta'), part.indexOf('function r106CreateInvite'));
  A(!/\bk\s*:|\btid\s*:|\btok\s*:|\bdeepgram\b|\bturn\b/i.test(meta), meta);
  A(part.includes("var r106Provider = { dg: ''") && !part.includes("localStorage.setItem('tb_dg_key'"), 'provider token persisted');
  A(part.includes("headers['X-TalkBridge-Device'] = deviceId"), 'device binding header absent');
  A(part.includes("ev === 'turn_unavailable'") && part.includes('usingRelay'), 'temporary TURN would be falsely reported missing');
  A(relay.includes('/v1/auth/grant') && relay.includes('/credentials/generate-ice-servers'), 'server token services missing');
});
await T('S4 worker consumes the event envelope directly, dedupes stable IDs, and cold/warm taps preserve room+event', async () => {
  A(sw.includes('env && env.tb') && sw.includes('r106SeenBefore(tb.eventId)'), 'envelope/dedupe absent');
  A(sw.includes("target.postMessage({ t: 'tb-open', eventId: data.eventId, roomId: data.roomId"), 'warm route incomplete');
  A(sw.includes('self.clients.openWindow(data.url'), 'cold route incomplete');
  A(!sw.includes('resolveRoom') && !sw.includes('since=') && !sw.includes('visibleClient'), 'history or visibility guessing returned');
});

function room(id, extra) { return Object.assign({ id, role: 'creator', title: 'Room ' + id, partnerName: 'Alice', myLang: 'en', theirLang: 'es', myName: 'Bob', autoRead: false, muted: false, goBtn: true, meta: 'top', createdAt: 1, lastAt: 1, joined: true, unread: 0 }, extra || {}); }
function bootDom(opts = {}) {
  const errors = [], fetches = [], sockets = [], notifications = [];
  const vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(String(e.message || e)));
  const dom = new JSDOM(built, {
    url: 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html' + (opts.hash || ''), runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      class WS extends w.EventTarget {
        constructor(url, protocols) { super(); this.url = url; this.protocols = protocols; this.readyState = 0; this.sent = []; sockets.push(this); setTimeout(() => { this.readyState = 1; if (this.onopen) this.onopen({}); this.dispatchEvent(new w.Event('open')); }, 0); }
        send(raw) { this.sent.push(JSON.parse(raw)); } close() { this.readyState = 3; if (this.onclose) this.onclose({ code: 1000 }); this.dispatchEvent(new w.Event('close')); }
      }
      w.WebSocket = WS;
      w.RTCPeerConnection = class { constructor(cfg) { this.cfg = cfg; this.connectionState = 'new'; } addEventListener() {} addTrack() {} close() {} setConfiguration(c) { this.cfg = c; } createDataChannel() { return { addEventListener() {}, send() {}, close() {} }; } };
      w.AudioContext = w.webkitAudioContext = class { constructor() { this.state = 'running'; this.destination = {}; } createMediaStreamSource() { return { connect() {}, disconnect() {} }; } createScriptProcessor() { return { connect() {}, disconnect() {} }; } createGain() { return { connect() {}, gain: {} }; } resume() { return Promise.resolve(); } close() {} };
      if (!w.navigator.mediaDevices) Object.defineProperty(w.navigator, 'mediaDevices', { value: {} });
      w.navigator.mediaDevices.getUserMedia = () => Promise.reject(new Error('no-hardware'));
      w.speechSynthesis = { speak() {}, cancel() {}, getVoices() { return []; } }; w.SpeechSynthesisUtterance = class {};
      const sub = { endpoint: 'https://push.example/e1', toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'p', auth: 'a' } }; } };
      const reg = { scope: 'https://acmeproducts.github.io/stuff/', pushManager: { getSubscription: () => Promise.resolve(opts.noSubscription ? null : sub), subscribe: () => Promise.resolve(sub) },
        showNotification: (title, options) => { notifications.push({ title, options }); return Promise.resolve(); } };
      const swTarget = new w.EventTarget(); swTarget.register = () => Promise.resolve(reg); swTarget.ready = Promise.resolve(reg); swTarget.controller = { postMessage() {} };
      Object.defineProperty(w.navigator, 'serviceWorker', { configurable: true, value: swTarget });
      w.Notification = class { static requestPermission() { return Promise.resolve(opts.permissionAnswer || 'denied'); } }; w.Notification.permission = opts.permission || 'granted';
      w.matchMedia = q => ({ matches: opts.standalone === true && (q.includes('standalone') || q.includes('fullscreen')), addEventListener() {}, addListener() {} });
      Object.defineProperty(w.navigator, 'standalone', { configurable: true, value: opts.standalone === true });
      Object.defineProperty(w.document, 'hasFocus', { configurable: true, value: () => opts.focused !== false });
      if (opts.hidden) Object.defineProperty(w.document, 'hidden', { configurable: true, get: () => true });
      w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      w.fetch = (input, init = {}) => {
        const url = String(input), body = init.body ? JSON.parse(init.body) : null; fetches.push({ url, body, headers: init.headers || {} });
        let data = { ok: true }, status = 200;
        if (url.includes('/service/bootstrap')) data = { ok: true, auth: 'opaque-bootstrap', expiresAt: Date.now() + 86400000, rooms: (body && body.rooms) || [], canCreate: true, scopeClass: 'legacy-room-capability' };
        else if (url.includes('/service/invite-exchange')) {
          if (opts.inviteReplay) { data = { ok: false, error: 'invite-expired-or-used' }; status = 410; }
          else data = { ok: true, auth: 'opaque-joined', expiresAt: Date.now() + 86400000, rooms: ['rInvite'], canCreate: false, scopeClass: 'relationship-device', invite: { r: 'rInvite', ml: 'en', tl: 'es', n: 'Alice', t: 'Secure room' } };
        } else if (url.includes('/service/invite-create')) data = { ok: true, code: 'one-time-code', expiresAt: Date.now() + 600000 };
        else if (url.includes('/service/authorize-room')) data = { ok: true, auth: 'opaque-bootstrap', expiresAt: Date.now() + 86400000, rooms: [body.roomId], canCreate: true, scopeClass: 'legacy-room-capability' };
        else if (url.includes('/service/deepgram-token')) data = { ok: true, access_token: 'temporary-dg-token', expires_in: 120 };
        else if (url.includes('/service/turn-credentials')) data = { ok: true, iceServers: [{ urls: ['turns:turn.cloudflare.com:443'], username: 'temporary-user', credential: 'temporary-password' }], expiresAt: Date.now() + 21600000 };
        else if (body && body.type === 'vapid') data = { ok: true, vapid: 'BQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQQ', push: true };
        else if (url.includes('ledger=1')) data = (opts.ledger && opts.ledger[url.match(/session=([^&]+)/)?.[1]]) || { ok: true, events: [], lseq: 0, complete: true };
        else if (url.includes('&event=')) data = { ok: true, event: opts.event || null };
        return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(data), text: () => Promise.resolve(JSON.stringify(data)) });
      };
      w.addEventListener('error', e => errors.push(String(e.message || e.error)));
      if (opts.name !== false) w.localStorage.setItem('tba_user', JSON.stringify({ name: 'Bob' }));
      if (opts.rooms) w.localStorage.setItem('tba_rooms', JSON.stringify(opts.rooms));
      if (opts.legacySecrets) { w.localStorage.setItem('tb_dg_key', 'LONG-DG'); w.localStorage.setItem('tb_cf_tid', 'LONG-ID'); w.localStorage.setItem('tb_cf_tok', 'LONG-TOKEN'); }
    }
  });
  return { w: dom.window, d: dom.window.document, errors, fetches, sockets, notifications };
}

{
  const x = bootDom({ standalone: false, hash: '#i=browser-code', name: false }); await sleep(100);
  await T('I1 browser invite is an install-only screen: no app boot, relay, worker, or name form', async () => {
    A(x.d.getElementById('r106-install'), 'gate missing'); A(x.d.getElementById('app').style.display === 'none', 'app visible');
    A(x.sockets.length === 0 && x.fetches.length === 0 && !x.d.querySelector('.screen.active'), 'product ran behind gate'); A(!x.d.querySelector('#r106-install input'), 'name asked in browser');
  });
  await T('I2 browser handoff cookie is path-scoped, short-lived source for installed PWA', async () => A(x.d.cookie.includes('tb_install_handoff_v1=browser-code'), x.d.cookie));
}
{
  const x = bootDom({ standalone: true, hash: '#i=one-time-code', rooms: [] }); await sleep(700);
  await T('I3 installed PWA exchanges one-time code before ship boot and lands on join screen', async () => {
    A(x.fetches.some(f => f.url.includes('/service/invite-exchange') && f.body.code === 'one-time-code'), 'exchange absent');
    A(x.d.getElementById('scr-s10').classList.contains('active'), 'join screen absent');
    A(x.w.r106ReadAuth().token === 'opaque-joined', 'auth not stored'); A(!x.d.cookie.includes('tb_install_handoff'), 'cookie not cleared');
  });
}
{
  const x = bootDom({ standalone: true, rooms: [room('r1')], legacySecrets: true }); await sleep(900);
  await T('A1 existing device bootstraps opaque auth without sending a provider secret', async () => {
    const f = x.fetches.find(v => v.url.includes('/service/bootstrap')); A(f && f.body.rooms[0] === 'r1', 'bootstrap absent');
    A(!/LONG-DG|LONG-ID|LONG-TOKEN/.test(JSON.stringify(x.fetches)), 'provider secret sent');
  });
  await T('A2 successful migration retires legacy Deepgram/TURN storage while preserving GitHub scope', async () => {
    A(!x.w.localStorage.getItem('tb_dg_key') && !x.w.localStorage.getItem('tb_cf_tid') && !x.w.localStorage.getItem('tb_cf_tok'), 'legacy call secret retained');
  });
  await T('N1 attempt-as-authority subscribes even when permission property and answer disagree', async () => {
    A(x.fetches.some(f => f.body && f.body.type === 'subscribe'), 'subscription absent');
    await x.w.r106AttemptPush(true); A(x.w.debugLog.some(r => r.ev === 'r106_push_permission_answer'), 'answer not recorded');
  });
  await T('N2 subscription self-heal is single-flight across focus/visibility triggers', async () => {
    const one = x.w.r106AttemptPush(false), two = x.w.r106AttemptPush(false);
    A(one === two, 'concurrent subscription attempts'); await one;
  });
  const url = await x.w.r106CreateInvite(x.w.S.rooms[0], 'share');
  await T('A3 generated invitation is code-only and contains no room/provider credentials', async () => A(url.endsWith('#i=one-time-code') && !/[?&#](k|tid|tok|r)=/.test(url), url));
  await x.w.r106DeepgramToken('r1'); await x.w.r106TurnCredentials('r1');
  await T('A4 provider credentials come from authenticated service actions and remain memory-only', async () => {
    const dg = x.fetches.find(f => f.url.includes('/service/deepgram-token')), turn = x.fetches.find(f => f.url.includes('/service/turn-credentials'));
    A(dg && turn && dg.headers['X-TalkBridge-Auth'] === 'opaque-bootstrap', 'service auth missing');
    A(dg.headers['X-TalkBridge-Device'] === x.w.deviceId && turn.headers['X-TalkBridge-Device'] === x.w.deviceId, 'service device binding missing');
    A(!JSON.stringify([...Array(x.w.localStorage.length)].map((_, i) => x.w.localStorage.getItem(x.w.localStorage.key(i)))).includes('temporary-dg-token'), 'temporary token persisted');
  });
  x.w.enterRoom('r1');
  x.w.r106OnDecision('r1', { presentation: 'in_app', event: { eventId: 'chat:foreground', type: 'chat-msg', seen: false,
    message: { type: 'chat-msg', eventId: 'chat:foreground', chatId: 'foreground', from: 'peer', srcText: 'hola', tgtText: 'hello', srcLang: 'es', tgtLang: 'en', senderName: 'Alice', ts: Date.now() } } });
  await sleep(50);
  await T('P1 visible same-room chat uses the existing bubble and sends no page OS notification/home increment', async () => {
    const tr = x.w.lsGet(x.w.trKey('r1'), []), r = x.w.roomById('r1');
    A(tr.some(e => e.id === 'foreground'), 'bubble absent'); A(x.notifications.length === 0, 'page OS notification'); A(x.w.waitingTotal(r) === 0, 'home increment');
  });
  x.w.r106OnDecision('r1', { presentation: 'os', event: { eventId: 'call:hidden:start', type: 'call-start', callId: 'call:hidden', kind: 'voice', outcome: 'ringing',
    message: { type: 'call-start', eventId: 'call:hidden:start', callId: 'call:hidden', from: 'peer', kind: 'voice', name: 'Alice', ts: Date.now() } } });
  await T('P2 OS-selected call cannot mount a late in-app ring', async () => A(!x.w.CALL.ringPending, 'double ring mounted'));
  x.w.r106OnDecision('r1', { presentation: 'in_app', event: { eventId: 'call:visible:start', type: 'call-start', callId: 'call:visible', kind: 'video', outcome: 'ringing',
    message: { type: 'call-start', eventId: 'call:visible:start', callId: 'call:visible', from: 'peer', kind: 'video', name: 'Alice', ts: Date.now() } } });
  await T('P3 in-app call grant mounts exactly the existing Accept/Decline surface with stable call ID', async () => A(x.w.CALL.ringPending && x.w.CALL.ringPending.r106CallId === 'call:visible', 'ring/call identity missing'));
  x.w.R106_TRACE.add('authorization', 'redaction-test', 'observed', { auth: 'DO-NOT-EXPORT', text: 'PRIVATE MESSAGE', eventId: 'trace-event' });
  x.w.R106_TRACE.observedDisplay('trace-event', '2026-08-30T00:00:00.000Z');
  await T('T1 one snapshot is human+machine readable, correlated, bounded, and redacts secrets/content', async () => {
    const snap = x.w.R106_TRACE.snapshot(), wire = JSON.stringify(snap);
    A(Array.isArray(snap.records) && snap.human.includes('trace-event'), 'dual-format snapshot absent');
    A(!wire.includes('DO-NOT-EXPORT') && !wire.includes('PRIVATE MESSAGE') && wire.includes('[redacted]') && wire.includes('[content omitted]'), 'redaction failed');
    A(snap.records.length <= 1600, 'unbounded');
  });
  await T('T2 iOS display time is recorded only as tester observation, never inferred from push acceptance', async () => {
    const rec = x.w.R106_TRACE.records().find(r => r.stage === 'os_observation' && r.eventId === 'trace-event');
    A(rec && rec.detail.source === 'tester', 'display observation mislabeled');
  });
  await T('R1 standalone boot has no uncaught runtime errors', async () => A(x.errors.length === 0, x.errors.join(' | ')));
}
{
  const records = [
    { l: 1, eventId: 'chat:away', roomId: 'r1', type: 'chat-msg', createdAt: 1, presentation: 'os', seen: false, outcome: null,
      message: { type: 'chat-msg', eventId: 'chat:away', chatId: 'away', from: 'peer', srcText: 'x', tgtText: 'x', srcLang: 'es', tgtLang: 'en', senderName: 'Alice', ts: 1 } },
    { l: 2, eventId: 'call:away:start', roomId: 'r1', type: 'call-start', kind: 'voice', callId: 'call:away', createdAt: 2, presentation: 'os', seen: false, outcome: 'missed', message: { type: 'call-start', eventId: 'call:away:start', callId: 'call:away', from: 'peer', kind: 'voice', name: 'Alice', ts: 2 } }
  ];
  const x = bootDom({ standalone: true, rooms: [room('r1')], ledger: { r1: { ok: true, events: records, lseq: 2, complete: true } }, focused: true }); await sleep(1000);
  await T('L1 boot HTTPS reconciliation restores exact unseen chat+missed-call state without peer traffic', async () => {
    const r = x.w.roomById('r1'); A(r.waiting.chat === 1 && r.waiting.voice === 1 && r.waiting.video === 0, JSON.stringify(r.waiting));
    A(x.fetches.some(f => f.url.includes('ledger=1')), 'ledger not fetched');
  });
  await x.w.r106ReconcileRoom('r1', 'test-replay');
  await T('L2 replay is idempotent: same event IDs do not double content or counts', async () => {
    const r = x.w.roomById('r1'), tr = x.w.lsGet(x.w.trKey('r1'), []); A(r.waiting.chat === 1 && r.waiting.voice === 1, 'counts doubled'); A(tr.filter(e => e.id === 'away').length === 1, 'chat doubled');
  });
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
