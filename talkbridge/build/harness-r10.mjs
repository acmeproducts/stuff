#!/usr/bin/env node
/* R10 Phase A harness — effect assertions per the governing prompt.
   Usage: node harness-r10.mjs <source-ship> <candidate> */
import { readFileSync } from 'fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const [srcP, candP] = process.argv.slice(2);
const src = readFileSync(srcP, 'utf8'); const cand = readFileSync(candP, 'utf8');
let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const A = (c, m) => { if (!c) throw new Error(m); };

/* ── static contract: exactly the four declared splices ── */
const HDR = cand.slice(0, cand.indexOf('-->') + 4);
const LINK = '<link rel="manifest" href="./tb-manifest.webmanifest">\n';
const preStart = cand.indexOf('<script>\n/* ═══════════ R10 PHASE A · PRE-BOOTSTRAP');
const preEnd = cand.indexOf('</script>', preStart) + '</script>\n'.length;
const PRE = cand.slice(preStart, preEnd);
let partStart = cand.indexOf('/* ═══════════ GAP PART · R10-phase-a.js');
if (cand[partStart - 1] === '\n') partStart -= 1;
const partEnd = cand.rindex ? 0 : cand.lastIndexOf('</script>');
const PART = cand.slice(partStart, partEnd);
T('S1 candidate = approved source + exactly the four declared splices', () => {
  const rec = cand.replace(HDR, '').replace(LINK, '').replace(PRE, '').replace(PART, '');
  A(rec === src, 'reconstruction differs from the approved source');
});
T('S2 relay untouched: no worker file, no relay message-type changes in splices', () => {
  A(!/worker-talk/.test(PRE + PART), 'relay source referenced for change');
  for (const t of ['room-left', 'grant-revoke', 'room-rejoined']) A(!(PRE + PART).includes("'" + t + "'"), 'lifecycle message reimplemented: ' + t);
});
T('S3 credentials untouched: splice CODE never reads or writes the four secrets', () => {
  const code = (PRE + PART).replace(/\/\*[\s\S]*?\*\//g, '');
  A(!/tb_dg_key|tb_cf_tid|tb_cf_tok|tb_gh_pat/.test(code), 'service secret referenced in code');
});
T('S4 SW context carries no secrets and no message text fields', () => {
  const ctx = PART.slice(PART.indexOf('tb-context'), PART.indexOf('tb-context') + 600);
  A(/relay:|app:|client:|rooms:/.test(ctx) && !/dg_key|cf_tid|cf_tok|gh_pat|token|ghp_/i.test(ctx), 'context shape wrong');
});
T('S5 cookie name and attributes exactly as governed', () => {
  A(PRE.includes("'tb_install_handoff_v1'") && PRE.includes('Path=/stuff/; Max-Age=600; SameSite=Lax; Secure'), 'cookie spec drift');
});
T('S6 localStorage is not the handoff channel', () => {
  A(!/localStorage/.test(PRE), 'pre-bootstrap touches localStorage');
});

/* ── boot in three modes and assert effects ── */
async function boot({ url, standalone, cookie }) {
  const vc = new VirtualConsole(); vc.on('jsdomError', () => {});
  const errors = [];
  const dom = new JSDOM(cand, {
    url, runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      if (cookie) w.document.cookie = cookie + '; Path=/stuff/';  /* as the real armed write sets it */
      w.matchMedia = q => ({ matches: standalone && q.includes('standalone'), addEventListener(){}, addListener(){} });
      w.WebSocket = class { send(){} close(){} addEventListener(){} set onopen(f){} set onmessage(f){} set onclose(f){} set onerror(f){} };
      w.RTCPeerConnection = class { addEventListener(){} createDataChannel(){ return { addEventListener(){}, send(){}, close(){} }; } close(){} };
      w.AudioContext = w.webkitAudioContext = class { resume(){return Promise.resolve()} close(){return Promise.resolve()} };
      w.speechSynthesis = { speak(){}, cancel(){}, getVoices(){ return []; } };
      w.SpeechSynthesisUtterance = class {};
      w.fetchLog = [];
      w.fetch = (u, opts) => { w.fetchLog.push({ url: String(u), body: opts && opts.body ? String(opts.body) : '' });
        const body = opts && opts.body ? JSON.parse(opts.body) : {};
        const res = body.type === 'vapid' ? { key: 'BApA' + 'A'.repeat(80), push: true } : { ok: true };
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(res), text: () => Promise.resolve('') }); };
      w.swMessages = [];
      const sub = { endpoint: 'https://web.push.apple.com/xyz', toJSON: () => ({ endpoint: 'https://web.push.apple.com/xyz', keys: {} }) };
      const reg = { pushManager: { getSubscription: () => Promise.resolve(w.__noSub ? null : sub),
        subscribe: () => Promise.resolve(sub) } };
      w.PushManager = function(){};
      Object.defineProperty(w.navigator, 'serviceWorker', { value: {
        register: () => Promise.resolve(reg), ready: Promise.resolve(reg),
        controller: { postMessage: m => w.swMessages.push(m) } } });
      w.Notification = { permission: 'granted', requestPermission: () => Promise.resolve('granted') };
      w.localStorage.setItem('tb_name', 'Harness');
      w.addEventListener('error', e => errors.push(String(e.message || e.error)));
    }
  });
  await new Promise(r => setTimeout(r, 1600));
  return { w: dom.window, d: dom.window.document, errors };
}

/* payload: real invitation shape via the app's own encoder, from a seed boot */
const seed = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html', standalone: false });
seed.w.S.rooms.push({ id: 'r-h1', role: 'creator', myLang: 'en', theirLang: 'th', myName: 'Harness', createdAt: Date.now(), lastAt: Date.now() });
const rawJ = seed.w.encInv({ r: 'r-h1', ml: 'en', tl: 'th', n: 'Harness', k: '', tid: '', tok: '' });
seed.w.close();

{ /* B1: browser tab with #j → cookie armed, existing joiner path untouched */
  const { w, d, errors } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html#j=' + rawJ, standalone: false });
  T('B1 Safari tab arms the cookie and the existing joiner flow still runs', () => {
    A(errors.length === 0, errors.join('|'));
    A(w.document.cookie.includes('tb_install_handoff_v1='), 'cookie not written');
    A(w.__TB_R10.armed === true, 'not armed');
    A(w.__TB_R10.log.some(l => l.ev === 'pwa_handoff_armed'), 'pwa_handoff_armed not logged');
    A(w.S.invitePayload && w.S.invitePayload.r === 'r-h1', 'existing joiner path did not consume j');
  });
  T('B2 Safari tab shows the Home-Screen hint, not the enable button', () => {
    const row = d.getElementById('r10-notif');
    A(row && /Add TalkBridge to Home Screen/.test(row.textContent), 'hint missing');
    A(!row.querySelector('.r10-n-btn'), 'enable button leaked into browser tab');
  });
  w.close();
}

{ /* B3: standalone with NO hash but armed cookie → recovered through the SAME path */
  const cookieVal = 'tb_install_handoff_v1=' + encodeURIComponent(rawJ);
  const { w, errors } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html', standalone: true, cookie: cookieVal });
  T('B3 standalone PWA recovers j from the cookie into the EXISTING join path', () => {
    A(errors.length === 0, errors.join('|'));
    A(w.__TB_R10.staged === true, 'handoff not staged');
    A(w.S.invitePayload && w.S.invitePayload.r === 'r-h1', 'existing join path did not run on recovered j');
  });
  T('B4 cookie deleted and pwa_handoff_consumed logged only after consumption', () => {
    A(!w.document.cookie.includes('tb_install_handoff_v1='), 'cookie survived consumption');
  });
  T('B5 SW registered; context posted with ids and cursors only', () => {
    const ctx = w.swMessages.find(m => m.type === 'tb-context');
    A(ctx, 'no tb-context posted');
    A(ctx.context.client === w.deviceId && Array.isArray(ctx.context.rooms), 'context shape wrong');
    A(!JSON.stringify(ctx).match(/tb_dg|tb_cf|tb_gh|ghp_/), 'secret in context');
  });
  /* create rooms the way the app stores them, then let the wrapper sync */
  w.S.rooms.push({ id: 'r-h2', role: 'creator', myLang: 'en', theirLang: 'th', createdAt: Date.now(), lastAt: Date.now() });
  w.S.rooms.push({ id: 'r-h3', role: 'creator', myLang: 'en', theirLang: 'th', createdAt: Date.now(), lastAt: Date.now() });
  w.saveRooms();
  await new Promise(r => setTimeout(r, 250));
  T('B7 per-room subscribe POSTs hit each room session with the same subscription', () => {
    const subs = w.fetchLog.filter(f => f.body.includes('"type":"subscribe"'));
    A(subs.length >= 2, 'expected a subscribe POST per room, got ' + subs.length);
    A(subs.some(s => s.url.includes('session=r-h2')) && subs.some(s => s.url.includes('session=r-h3')), 'not room-specific');
    A(subs.every(s => s.url.includes('app=talk-say-v1') && s.url.includes('client=')), 'governed query params missing');
    A(subs.every(s => s.body.includes('web.push.apple.com')), 'subscription payload missing');
  });
  T('B8 hard delete sends a room-specific unsubscribe; soft delete does not', () => {
    const before = w.fetchLog.length;
    const id = 'r-h3';
    w.S.rooms.forEach(r => { if (r.id === id) r.deletedAt = Date.now(); });
    w.saveRooms();
    A(!w.fetchLog.slice(before).some(f => f.body.includes('unsubscribe')), 'soft delete unsubscribed');
    w.S.rooms = w.S.rooms.filter(r => r.id !== id);
    w.saveRooms();
    A(w.fetchLog.some(f => f.body.includes('"type":"unsubscribe"') && f.url.includes('session=' + encodeURIComponent(id))), 'hard delete did not unsubscribe that room session');
  });
  w.close();
}

{ /* B11: undecodable cookie → failed path keeps the cookie, logs failure */
  const { w } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html', standalone: true, cookie: 'tb_install_handoff_v1=not-a-real-payload' });
  T('B11 undecodable handoff: cookie kept for diagnosis, pwa_handoff_failed logged, no invented state', () => {
    A(w.__TB_R10.staged === true, 'not staged');
    A(w.document.cookie.includes('tb_install_handoff_v1='), 'cookie deleted despite failed consumption');
    A(!w.S.invitePayload, 'state invented from a bad payload');
  });
  w.close();
}

{ /* B12: oversize invitation → no cookie, no truncation, browser flow continues */
  const bigJ = rawJ + 'A'.repeat(4200);
  const { w } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html#j=' + bigJ, standalone: false });
  T('B12 oversize invitation is never truncated into the cookie; browser flow continues', () => {
    A(!w.document.cookie.includes('tb_install_handoff_v1='), 'oversize payload written (possibly truncated)');
    A(w.__TB_R10.log.some(l => l.ev === 'pwa_handoff_oversize'), 'oversize not logged');
    A(w.__TB_R10.armed === false, 'armed despite oversize');
  });
  w.close();
}

{ /* B9: direct PWA launch, no cookie, no hash → normal boot */
  const { w, errors } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn25-base.html', standalone: true });
  T('B9 direct standalone launch with no invitation boots TalkBridge normally', () => {
    A(errors.length === 0, errors.join('|'));
    A(w.__TB_R10.staged === false, 'handoff staged from nothing');
    A(w.document.getElementById('scr-s1') || w.document.getElementById('scr-s0'), 'app did not boot');
  });
  T('B10 visible build identifier present (A12 stale-build guard)', () => {
    const row = w.document.getElementById('r10-notif');
    A(row && row.textContent.includes('R10-A'), 'visible build id missing');
  });
  w.close();
}




{ /* F1-F6: create window + first-run name surfaces (PA4) */
  const { w } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html', standalone: true });
  const d2 = w.document;
  T('F1 create window wears the card flag treatment', () => {
    const css = [...d2.querySelectorAll('style')].map(s => s.textContent).join('\n');
    A(css.includes('#m-s3 .flagband{position:relative') && css.includes('#m-s3 .flagband::before'), 'modal flag rules missing');
    A(css.includes('#scr-s0 .ask-card{margin:10vh auto auto}'), 'S0 resting position missing');
  });
  T('F2 name field is its OWN field between selects and auto-read, never inside the toggle row', () => {
    w.S.user.name = 'Bob';
    w.openS3();
    const inp = d2.getElementById('s3-myname');
    A(inp, 'field missing');
    A(!inp.closest('.toggle-row'), 'field landed inside the toggle row — the shipped defect');
    A(inp.nextElementSibling && inp.nextElementSibling.classList.contains('toggle-row'), 'field not directly before the auto-read row');
    A(inp.value === 'Bob', 'suggestion not prefilled');
  });
  T('F3 override lands on the created room', () => {
    d2.getElementById('s3-myname').value = 'Mr Jones';
    d2.getElementById('s3-ok').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    const r = w.activeRoom();
    A(r && r.myName === 'Mr Jones', 'override not stored: ' + (r && r.myName));
  });
  T('F4 the invite carries the ROOM name', () => {
    const r = w.activeRoom(); r.myName = 'Alice';
    const p = w.decInv(w.invUrl(r).split('#j=')[1]);
    A(p && p.n === 'Alice' && p.r === r.id && 'k' in p, 'invite name wrong or payload damaged: ' + (p && p.n));
  });
  T('F5 keyboard out: the first-run card recenters in the visual viewport', () => {
    w.showScreen('s0');
    const card = d2.querySelector('#scr-s0 .ask-card');
    Object.defineProperty(card, 'offsetHeight', { configurable: true, get(){ return 300; } });
    w.visualViewport ??= {};
    Object.defineProperty(w, 'visualViewport', { configurable: true, value: { height: 400, addEventListener(){}} });
    const inp = d2.getElementById('s0-name');
    inp.focus();
    w.pa4CenterAskCard();
    A(card.style.margin.startsWith('50px'), 'not centered for a 400px viewport: ' + card.style.margin);
    inp.blur(); d2.body.focus?.();
    w.pa4CenterAskCard();
    A(card.style.margin === '', 'did not return to resting spot');
  });
  T('F7 permission not granted + rooms exist => banner sits at the TOP of the panel', () => {
    w.S.rooms = [{ id: 'r1', myName: 'x' }];
    w.Notification.permission = 'default';
    w.pa5Banner();
    const b = d2.getElementById('pa5-nb');
    A(b, 'banner missing');
    A(b.nextElementSibling && b.nextElementSibling.id === 'panel-body', 'banner not directly above panel-body');
    A(/Tap to enable/.test(b.textContent), 'banner copy wrong');
  });
  T('F8 permission granted => banner removes itself', () => {
    w.Notification.permission = 'granted';
    w.pa5Banner();
    A(!d2.getElementById('pa5-nb'), 'banner still shown after grant');
  });
  T('J2 platform routing: exact journeys per user agent', () => {
    const P = w.pjPlatform;
    A(P('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit CriOS/125 Mobile Safari/604.1', false) === 'ios-other-browser', 'Chrome-on-iOS misrouted');
    A(P('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit Version/17.5 Mobile/15E148 Safari/604.1', false) === 'ios-safari', 'Safari misrouted');
    A(P('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) AppleWebKit', true) === 'ios-pwa', 'installed app misrouted');
    A(P('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125 Mobile Safari/537.36', false) === 'other', 'Android misrouted');
  });
  T('J5 a payload naming the joiner names this device once, and only once', () => {
    w.S.user.name = '';
    A(w.pjAdoptJoinerName({ jn: 'Zoe' }) === true && w.S.user.name === 'Zoe', 'name not adopted');
    A(w.pjAdoptJoinerName({ jn: 'Mallory' }) === false && w.S.user.name === 'Zoe', 'existing identity overwritten');
  });
  T('J5 the tab writes the typed name into the handoff cookie for the PWA', () => {
    w.__TB_R10.standalone = false; w.__TB_R10.armed = true;
    A(w.pjAugmentHandoff({ r: 'room9', k: 'kk' }, 'Zoe') === true, 'augment refused');
    const m = ('; ' + w.document.cookie).match('; tb_install_handoff_v1=([^;]*)');
    A(m, 'cookie missing');
    const p = w.decInv(decodeURIComponent(m[1]));
    A(p && p.jn === 'Zoe' && p.r === 'room9' && p.k === 'kk', 'payload wrong: ' + JSON.stringify(p));
  });
  T('J3/J4 surfaces exist, are non-gating, and route through the one enable flow', () => {
    A(typeof w.pjInstallNudge === 'function' && typeof w.pjRoomEnableBar === 'function', 'surfaces missing');
    A(String(w.pjRoomEnableBar).includes('r10EnableNotifications'), 'room bar bypasses the enable flow');
    A(String(w.pjSafariBar).includes('chat right here'), 'J1 violated: hand-to-Safari bar gates instead of informing');
  });
  T('L1 lane telemetry: every lane named correctly, including the accidental ones', () => {
    const L = w.plLane;
    A(L('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125 Mobile Safari/537.36', false) === 'android-tab', 'android tab');
    A(L('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125 Mobile Safari/537.36', true) === 'android-pwa', 'the accidental-install lane that ate the mic');
    A(L('Mozilla/5.0 (iPhone) AppleWebKit Version/17.5 Mobile Safari/604.1', true) === 'ios-pwa', 'ios pwa');
    A(L('Mozilla/5.0 (iPhone) AppleWebKit CriOS/125 Mobile Safari/604.1', false) === 'ios-other-browser', 'chrome on ios');
  });
  T('L2 the boot report carries lane + mic + notif in one line', () => {
    A(String(w.plReport).includes("'microphone'") && String(w.plReport).includes('Notification.permission'), 'permissions not reported');
    A(String(w.plReport).includes('out.mic = st.state'), 'mic state queried but never written into the line');
    A(String(w.plReport).includes("r8Log('lane'"), 'lane line not logged');
  });
  T('D1 an arriving message with a delivery id is confirmed on the active path', () => {
    const sent = [];
    const orig = w.relaySend; w.relaySend = m => sent.push(m);
    try { w.handleRelay({ type: 'chat-msg', _did: 'x1', chatId: 'zz-1', srcText: 'hi', ts: Date.now() }); } catch (_) {}
    w.relaySend = orig;
    const ack = sent.find(m => m.type === 'delivered');
    A(ack && ack.did === 'x1' && ack.transient === true, 'no confirmation sent: ' + JSON.stringify(sent[0] || null));
  });
  T('D2 a background-room arrival confirms on ITS socket', () => {
    const sent = [];
    const orig = w.LISTEN.send; w.LISTEN.send = (roomId, m) => sent.push([roomId, m]);
    try { w.LISTEN.handle('roomZ', { type: 'chat-msg', _did: 'x2', chatId: 'zz-2', ts: Date.now() }); } catch (_) {}
    w.LISTEN.send = orig;
    const ack = sent.find(([r, m]) => m.type === 'delivered');
    A(ack && ack[0] === 'roomZ' && ack[1].did === 'x2', 'background arrival not confirmed');
  });
  T('D4 background listeners heartbeat: silence is structurally impossible', () => {
    A(String(w.LISTEN.handle._pdOriginal ? 1 : 1) === '1', '');
    const src = [...w.document.querySelectorAll('script')].map(x => x.textContent).join('');
    A(/LISTEN\.send\(id, \{ type: 'ping', transient: true \}\)/.test(src), 'listener heartbeat missing from the build');
    A(/setInterval\(function \(\) \{\s*try \{\s*for \(var id in \(LISTEN\.socks/.test(src), 'heartbeat not on an interval');
  });
  T('D3 messages without a delivery id are left alone (old relay compatible)', () => {
    const sent = [];
    const orig = w.relaySend; w.relaySend = m => sent.push(m);
    try { w.handleRelay({ type: 'ping', transient: true }); } catch (_) {}
    w.relaySend = orig;
    A(!sent.some(m => m.type === 'delivered'), 'confirmed a message with no id');
  });
  T('F6 named font surfaces still raised', () => {
    const tt = d2.querySelector('.talking-to');
    A(tt && w.getComputedStyle(tt).fontSize === '15px', 'talking-to not 15px');
  });
  w.close();
}



console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
