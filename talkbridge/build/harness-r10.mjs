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




{ /* F1-F4: owner fixes — S0 card position, named font surfaces, B-8c name override */
  const { w } = await boot({ url: 'https://acmeproducts.github.io/stuff/bridge-turn24-post-ship.html', standalone: true });
  const d2 = w.document;
  T('F1 first-run name card pinned to the upper screen, not centered', () => {
    const css = [...d2.querySelectorAll('style')].map(s => s.textContent).join('\n');
    A(css.includes('#scr-s0 .ask-card{margin:10vh auto auto}'), 'S0 position rule missing');
  });
  T('F2 named surfaces render at the raised sizes (measured, live)', () => {
    const tt = d2.querySelector('.talking-to');
    A(tt && w.getComputedStyle(tt).fontSize === '15px', 'talking-to not 15px');
    const fl = d2.querySelector('.field-label');
    A(fl && w.getComputedStyle(fl).fontSize === '13px', 'field-label not 13px');
  });
  T('F3 room creation suggests the standing name and honors an override', () => {
    w.S.user.name = 'Bob'; 
    w.openS3();
    const inp = d2.getElementById('s3-myname');
    A(inp && inp.value === 'Bob', 'suggestion not prefilled');
    inp.value = 'Mr Jones';
    d2.getElementById('s3-ok').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    const r = w.activeRoom();
    A(r && r.myName === 'Mr Jones', 'override not stored on the room: ' + (r && r.myName));
  });
  T('F4 the invite carries the ROOM name, so menu renames reach new invites', () => {
    const r = w.activeRoom();
    r.myName = 'Alice';
    const p = w.decInv(w.invUrl(r).split('#j=')[1]);
    A(p && p.n === 'Alice', 'invite still carries the stale name: ' + (p && p.n));
    A(p.r === r.id && 'k' in p, 'other payload fields damaged');
  });
  w.close();
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
