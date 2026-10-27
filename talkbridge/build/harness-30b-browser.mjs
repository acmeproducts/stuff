#!/usr/bin/env node
/* 30·base browser gate — THE STRIP YOU PULL DOWN (§7.22, candidate 4) in a REAL layout engine (headless Chromium; jsdom has no layout).
   Stages a video call on the assembled page (seeded phone with a chat, CALL marked active, canvas streams: the partner a tall phone
   picture 360×640, me a wide 640×480 — the Android's shape in G77) and drives it with REAL TOUCH (CDP Input.dispatchTouchEvent on a
   touch-enabled page): the grab bar, a chat swipe, the small picture's drag and tap, the flip button. B3–B15; N1–N2 the room's name;
   CV12 the camera coming back.
   Usage: node talkbridge/build/harness-30b-browser.mjs [--page <html>] [--quiet]   (TB_CHROME overrides the browser path) */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { assemblePage } from './assemble-30b.mjs';

const args = process.argv.slice(2); const quiet = args.includes('--quiet');
const pageArg = args.indexOf('--page') >= 0 ? args[args.indexOf('--page') + 1] : null;
const CHROME = process.env.TB_CHROME || (() => { const base = '/opt/pw-browsers'; try { const d = fs.readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().pop(); if (d) return path.join(base, d, 'chrome-linux', 'chrome'); } catch (_) {} return 'chromium'; })();
const html = pageArg ? fs.readFileSync(pageArg, 'utf8') : assemblePage();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb30b-'));

const SEED = "<script>try{localStorage.clear();localStorage.setItem('tb_name','Ann');localStorage.setItem('tb_dev','aaaa1111-0000-4000-8000-000000000001');localStorage.setItem('tba_rooms',JSON.stringify([{id:'room-1',role:'creator',title:'Miko chat',partnerName:'Bo',myLang:'en',theirLang:'th',myName:'Ann',joined:true,createdAt:1,lastAt:1,unread:0}]));__SEEDPOS__}catch(e){}</script>";
const STAGE = String.raw`
function pattern(w,h,c){var k=document.createElement('canvas');k.width=w;k.height=h;var g=k.getContext('2d');g.fillStyle=c;g.fillRect(0,0,w,h);return k.captureStream(5);}
function box(){var b=document.getElementById('call-band').getBoundingClientRect();return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)};}
function rect(id){var b=document.getElementById(id).getBoundingClientRect();return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)};}
function M(t,x,y,el){(el||document.getElementById('remote-video')).dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,clientX:x,clientY:y}));}
function W(t,x,y){document.dispatchEvent(new MouseEvent(t,{bubbles:true,clientX:x,clientY:y}));}
function APP(){var a=document.getElementById('app').getBoundingClientRect();return {x:Math.round(a.left),y:Math.round(a.top),w:Math.round(a.width),h:Math.round(a.height)};}
var PARTNER=[360,640], ME=[640,480];
function startCall(kind){ if(typeof enterRoom==='function')enterRoom('room-1'); CALL.active=true; CALL.kind=kind; var s=document.getElementById('scr-room'); s.classList.remove('st-phone','st-video'); s.classList.add(kind==='video'?'st-video':'st-phone'); if(kind==='video'){ document.getElementById('call-band').classList.add('on'); var rv=document.getElementById('remote-video'); rv.muted=true; rv.srcObject=pattern(PARTNER[0],PARTNER[1],'#2a78d6'); document.getElementById('local-video').srcObject=pattern(ME[0],ME[1],'#1baf7a'); document.getElementById('remote-ph').style.display='none'; document.getElementById('subtitle-area').innerHTML='<div class="subtitle-line">Hello there</div>'; } }
function endCall(){ try{ CALL.hangUp(false); }catch(e){ R.err.push('hangUp '+e); } }
var R={err:[]};
window.addEventListener('error',function(e){R.err.push(String(e.message))});
`;
const SCENARIOS = {
  ribbon: String.raw`
/* NM-1: the name's side against the microphone's slot, each call state, left-to-right and right-to-left */
function rr(sel){var e=document.querySelector(sel);if(!e)return null;var b=e.getBoundingClientRect();return {l:Math.round(b.left*10)/10,r:Math.round(b.right*10)/10,w:Math.round(b.width*10)/10};}
function measure(){var s=document.getElementById('scr-room');var out={};[['idle',''],['voice','st-phone'],['video','st-video']].forEach(function(st){s.classList.remove('st-phone','st-video');if(st[1])s.classList.add(st[1]);document.getElementById('rz-timer').textContent=st[1]?'Speaking…':'';
  out[st[0]]={left:rr('#room-ribbon .rz-left'),mic:rr('#room-ribbon .rz-slot.mic-slot'),rib:rr('#room-ribbon'),title:rr('#room-head-title'),titleFull:document.getElementById('room-head-title').scrollWidth};});s.classList.remove('st-phone','st-video');return out;}
setTimeout(function(){ try{ enterRoom('room-1'); R.ltr=measure(); document.documentElement.dir='rtl'; R.rtl=measure(); document.documentElement.dir='ltr'; R.vw=innerWidth; }catch(e){R.err.push(''+e);} document.title='VBRESULT'+JSON.stringify(R); },1500);`,
  cam: String.raw`
/* CV-1 with a REAL camera stream (Chromium's fake camera) and a real RTCPeerConnection video sender */
setTimeout(function(){ try{ startCall('video'); document.hasFocus=function(){return true;};
  navigator.mediaDevices.getUserMedia({video:true,audio:true}).then(function(st){ CALL.stream=st; CALL.camOn=true; var pc=new RTCPeerConnection(); st.getTracks().forEach(function(t){pc.addTrack(t,st);}); CALL.pc=pc; document.getElementById('local-video').srcObject=st;
    setTimeout(function(){ var old=st.getVideoTracks()[0]; R.oldLive=old.readyState; old.stop(); R.stopped=old.readyState;
      setTimeout(function(){ var nv=CALL.stream.getVideoTracks(); var snd=pc.getSenders().filter(function(x){return x.track&&x.track.kind==='video';});
        R.after={n:nv.length,live:nv[0]&&nv[0].readyState,same:nv[0]===old,sent:snd.length&&snd[0].track===nv[0],self:document.getElementById('local-video').srcObject===CALL.stream};
        R.cv=(window.debugLog||[]).filter(function(l){return /^cv_/.test(l.ev);}).map(function(l){return l.ev;});
        try{ CALL.hangUp(false); }catch(e){} R.endLive=nv[0]&&nv[0].readyState; document.title='VBRESULT'+JSON.stringify(R); },3000);
    },1200);
  }).catch(function(e){R.err.push('gum '+e); document.title='VBRESULT'+JSON.stringify(R);});
}catch(e){R.err.push(''+e); document.title='VBRESULT'+JSON.stringify(R);} },1500);`,

};
function run(name, w, h, seedPos, longName) {
  const seed = longName ? SEED.replace("partnerName:'Bo'", "partnerName:'" + longName + "'") : SEED;
  const page = html.replace('<head>', '<head>' + seed.replace('__SEEDPOS__', seedPos ? "localStorage.setItem('tb_vbox_pos','" + seedPos + "');" : ''), 1).replace(/<\/body>(?![\s\S]*<\/body>)/, '<script>' + STAGE + SCENARIOS[name] + '</script></body>');
  const pf = path.join(dir, name + '.html'); fs.writeFileSync(pf, page);
  for (const f of fs.readdirSync('talkbridge-app')) if (/\.(png|webmanifest)$/.test(f)) { try { fs.copyFileSync(path.join('talkbridge-app', f), path.join(dir, f)); } catch (_) {} }
  const frame = path.join(dir, name + '-frame.html');
  fs.writeFileSync(frame, '<body style="margin:0"><iframe id=f src="' + name + '.html" style="width:' + w + 'px;height:' + h + 'px;border:0;display:block"></iframe><script>setInterval(function(){try{var t=document.getElementById("f").contentDocument.title;if(t.indexOf("VBRESULT")===0)document.title=t;}catch(e){}},100)</script></body>');
  const out = execFileSync(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars', '--window-size=' + (w + 200) + ',' + (h + 20), '--virtual-time-budget=9000', '--dump-dom', 'file://' + frame], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 });
  const m = /<title>VBRESULT([\s\S]*?)<\/title>/.exec(out); if (!m) throw new Error(name + ': no result from the page');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

/* a real camera needs a live browser (headless --dump-dom never settles getUserMedia): the same page, the same Chromium, driven
   by Playwright with Chromium's fake camera. Playwright is the machine's global install (TB_PLAYWRIGHT overrides). */
async function runLive(name, w, h) {
  const pw = process.env.TB_PLAYWRIGHT || path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright', 'index.mjs');
  const { chromium } = await import(pw);
  const page = html.replace('<head>', '<head>' + SEED.replace('__SEEDPOS__', ''), 1).replace(/<\/body>(?![\s\S]*<\/body>)/, '<script>' + STAGE + SCENARIOS[name] + '</script></body>');
  const pf = path.join(dir, name + '.html'); fs.writeFileSync(pf, page);
  const b = await chromium.launch({ executablePath: CHROME, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--allow-file-access-from-files'] });
  try {
    const p = await b.newPage({ viewport: { width: w, height: h } }); await p.goto('file://' + pf);
    await p.waitForFunction(() => document.title.indexOf('VBRESULT') === 0, null, { timeout: 30000 });
    return JSON.parse((await p.title()).slice(8));
  } finally { await b.close(); }
}

let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const ok = (c, m) => { if (!c) throw new Error(m); };
/* THE STRIP, driven by touch in a live page */
const CHAT = JSON.stringify(Array.from({ length: 60 }, (_, i) => ({ id: 'm' + i, kind: 'chat', who: i % 2 ? 'me' : 'partner', sourceText: 'line ' + i + ' of the chat so it scrolls', translatedText: 'บรรทัด ' + i, srcLang: 'en', tgtLang: 'th', ts: 1760000000000 + i * 1000, senderName: 'Bo', origin: 'typed' })));
async function runStrip(w, h, partner) {
  const pw = process.env.TB_PLAYWRIGHT || path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'playwright', 'index.mjs');
  const { chromium } = await import(pw);
  const seed = SEED.replace('__SEEDPOS__', "localStorage.setItem('tba_tr_room-1'," + JSON.stringify(CHAT) + ");");
  const page = html.replace('<head>', '<head>' + seed, 1).replace(/<\/body>(?![\s\S]*<\/body>)/, '<script>' + STAGE + (partner ? 'PARTNER=' + JSON.stringify(partner) + ';' : '') + '</script></body>');
  const pf = path.join(dir, 'strip-' + w + 'x' + h + '.html'); fs.writeFileSync(pf, page);
  const b = await chromium.launch({ executablePath: CHROME, args: ['--allow-file-access-from-files'] });
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  const wait = (ms) => p.waitForTimeout(ms);
  const touch = async (pts) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] }); for (let i = 1; i < pts.length; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pts[i][0], y: pts[i][1] }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(120); };
  const drag = (x0, y0, x1, y1) => { const pts = []; for (let i = 0; i <= 10; i++) pts.push([x0 + (x1 - x0) * i / 10, y0 + (y1 - y0) * i / 10]); return touch(pts); };
  const tap = (x, y) => touch([[x, y]]);
  const M = () => p.evaluate(() => {
    const r = (el) => { if (!el) return null; const q = el.getBoundingClientRect(); return { x: Math.round(q.left), y: Math.round(q.top), w: Math.round(q.width), h: Math.round(q.height), b: Math.round(q.bottom) }; };
    const $ = (id) => document.getElementById(id), sw = $('call-videos').classList.contains('swapped');
    const small = sw ? $('remote-video') : $('local-video'), big = sw ? $('local-video') : $('remote-video');
    const band = $('call-band'), bs = getComputedStyle(band);
    return { band: r(band), display: bs.display, position: bs.position, videos: r($('call-videos')), bar: r($('vb-bar')), barShown: $('vb-bar') ? getComputedStyle($('vb-bar')).display : null, ribbon: r($('room-ribbon')), transcript: r($('transcript')), tScroll: $('transcript').scrollTop, app: r($('app')),
      small: r(small), big: r(big), fit: [getComputedStyle(big).objectFit, getComputedStyle(small).objectFit], swapped: sw, corner: ['tl', 'tr', 'bl', 'br'].filter((c) => band.classList.contains('vb-c-' + c))[0] || null,
      inline: [$('remote-video').getAttribute('style') || '', $('local-video').getAttribute('style') || ''], bandVars: band.getAttribute('style') || '', flip: r($('btn-flip-overlay')),
      vb: { min: VB.min, max: VB.max, vmax: VB.vmax, h: VB.h, shown: VB.shown }, saved: [localStorage.getItem('tb_vband_h'), localStorage.getItem('tb_vband_corner')],
      st: $('scr-room').className, err: R.err.slice(), logs: (window.debugLog || []).filter((l) => /^vb_/.test(l.ev)).map((l) => l.ev) };
  });
  const out = {};
  try {
    await p.goto('file://' + pf); await wait(1500);
    await p.evaluate(() => startCall('voice')); out.voice = await M(); await p.evaluate(() => endCall()); await wait(150);
    await p.evaluate(() => startCall('video')); await wait(1800);
    out.first = await M();
    const bar = () => [out.cur.bar.x + out.cur.bar.w / 2, out.cur.bar.y + out.cur.bar.h / 2];
    out.cur = out.first; let [bx, by] = bar(); await drag(bx, by, bx, by + 200); out.down200 = out.cur = await M();
    [bx, by] = bar(); await drag(bx, by, bx, by + 1000); out.downMax = out.cur = await M();
    [bx, by] = bar(); await drag(bx, by, bx, Math.max(2, by - 2000)); out.upMin = out.cur = await M();
    [bx, by] = bar(); await drag(bx, by, bx, by + 100); out.down100 = out.cur = await M();
    /* a swipe on the chat scrolls the chat and never resizes */
    const t = out.cur.transcript; await p.evaluate(() => { document.getElementById('transcript').scrollTop = 0; }); out.cur = await M();
    await drag(t.x + t.w / 2, t.y + t.h - 20, t.x + t.w / 2, t.y + 20); out.chatSwipe = out.cur = await M();
    /* the small picture dragged to the top-left snaps there; a drag never swaps */
    const s0 = out.cur.small, v0 = out.cur.videos; await drag(s0.x + s0.w / 2, s0.y + s0.h / 2, v0.x + 30, v0.y + 30); await wait(300); out.inset = out.cur = await M();
    /* a tap on it swaps; after the shape poll the inset is the partner's tall picture */
    const s1 = out.cur.small; await tap(s1.x + s1.w / 2, s1.y + s1.h / 2); await wait(1600); out.swap = out.cur = await M();
    /* a press on the flip button that moves is never a drag or a resize */
    const f = out.cur.flip; await p.evaluate(() => { window.__flips = 0; window.tbFlipCamera = function () { window.__flips++; }; });
    await drag(f.x + f.w / 2, f.y + f.h / 2, f.x + f.w / 2 + 60, f.y + f.h / 2 + 80); out.flip = out.cur = await M();
    /* the call ends by the hang-up while swapped */
    await p.evaluate(() => endCall()); await wait(200); out.ended = await M();
    await p.evaluate(() => startCall('video')); await wait(1500); out.again = out.cur = await M();
    /* the partner hangs up while swapped and mid-press */
    const s2 = out.cur.small; await tap(s2.x + s2.w / 2, s2.y + s2.h / 2); await wait(300);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: out.cur.bar.x + 20, y: out.cur.bar.y + 10 }] });
    await p.evaluate(() => { try { CALL.onRemoteEnd(CALL.room || { id: 'room-1' }, { type: 'call-end' }); } catch (e) { try { CALL.teardown(); } catch (e2) { R.err.push('remoteEnd ' + e2); } } });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: out.cur.bar.x + 20, y: out.cur.bar.y + 150 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(150);
    out.remoteEnd = await M(); out.tbswap = await p.evaluate(() => TB_SWAP);
    await p.evaluate(() => startCall('video')); await wait(1500); out.again2 = await M();
    /* the banner and the reach bar showing: the chat keeps its floor */
    await p.evaluate(() => { const d = document.getElementById('dg-fail-banner'); if (d) d.style.display = 'flex'; }); await wait(300);
    out.cur = await M(); [bx, by] = bar(); await drag(bx, by, bx, by + 1000); await wait(300); out.banner = await M();
    out.dialog = await p.evaluate(() => { const v = document.getElementById('call-videos').getBoundingClientRect(); const dlg = document.createElement('div'); dlg.className = 'cl-bt'; document.getElementById('scr-room').appendChild(dlg); const top = document.elementFromPoint(v.left + v.width / 2, v.top + v.height / 2); const r = !!(top && top.closest && top.closest('.cl-bt')); dlg.remove(); return r; });
  } catch (e) { out.harnessError = e && e.message; }
  await b.close(); return out;
}
let N = {}, CM, S = {}, SL, SP;
const LONG = 'Marisol Fernandez Ortega';
try { for (const w of [360, 390, 430, 1280]) N[w] = run('ribbon', w, w === 1280 ? 800 : 844, null, LONG); CM = await runLive('cam', 390, 844);
  S = await runStrip(390, 844); SL = await runStrip(844, 390); SP = await runStrip(390, 844, [1280, 720]); }
catch (e) { console.log('FAIL  the browser run — ' + e.message); process.exit(1); }
const near = (a, b, d) => Math.abs(a - b) <= (d || 1);
T('B0 no page error through the whole script; every strip run completed', () => { ok([CM, ...Object.values(N)].every((z) => z.err.length === 0), JSON.stringify([CM.err, Object.values(N).map((z) => z.err)])); for (const [n, z] of [['phone', S], ['side', SL], ['laptop', SP]]) { ok(!z.harnessError, n + ' ' + z.harnessError); ok(((z.banner || z.again2 || z.first || {}).err || []).length === 0, n + ' ' + JSON.stringify((z.banner || {}).err)); } });
T('N1 the name\'s side ends at least 8 px before the microphone\'s slot, and the microphone stays on the centre line — idle, voice call, video call; left-to-right and right-to-left (Arabic); at 360, 390, 430 px and a 1280 px window', () => {
  for (const [w, z] of Object.entries(N)) for (const dir of ['ltr', 'rtl']) for (const st of ['idle', 'voice', 'video']) {
    const m = z[dir][st], c = (m.rib.l + m.rib.r) / 2, mc = (m.mic.l + m.mic.r) / 2, at = w + ' ' + dir + ' ' + st + ' ' + JSON.stringify(m);
    ok(Math.abs(mc - c) <= 1, 'the microphone left the centre line ' + at);
    ok(dir === 'ltr' ? m.left.r <= m.mic.l - 8 + 0.5 : m.left.l >= m.mic.r + 8 - 0.5, 'the name\'s side reaches the microphone ' + at);
    ok(m.left.l >= m.rib.l && m.left.r <= m.rib.r, 'the name\'s side left the ribbon ' + at);
  }
});
T('N2 the name gets the room up to the microphone: at 390 px (an iPhone 13) in a video call with "Speaking…" showing, a long name\'s side reaches within 9 px of the microphone\'s slot and shows at least 70 px of the name (candidate 2: a 116 px side, ~32 px of the name — "m..")', () => {
  const m = N[390].ltr.video; ok(m.mic.l - m.left.r <= 9, 'room left unused ' + JSON.stringify(m)); ok(m.title.w >= 70 && m.titleFull > m.title.w, 'name shown ' + JSON.stringify(m.title) + ' of ' + m.titleFull);
});
T('CV12 a REAL camera track (Chromium\'s fake camera) stopped mid video call comes back: one live video track, a real RTCPeerConnection sender sending it, the self-view re-pointed, cv_restored logged; the hang-up stops it', () => {
  ok(CM.oldLive === 'live' && CM.stopped === 'ended', 'setup ' + JSON.stringify(CM));
  const a = CM.after; ok(a.n === 1 && a.live === 'live' && !a.same && a.sent && a.self, JSON.stringify(a)); ok(CM.cv.includes('cv_restored'), CM.cv.join(',')); ok(CM.endLive === 'ended', 'still running after the hang-up: ' + CM.endLive);
});
const sh = (r) => r.w / r.h;
T('B3 a voice call shows no band and no grab bar', () => ok(S.voice.display === 'none' && S.voice.barShown === 'none', JSON.stringify([S.voice.display, S.voice.barShown])));
T('B4 a video call: the band is IN THE ROOM\'S FLOW under the ribbon (not floating), the app column\'s width, the pictures MIN (228 px) high at the first call, the grab bar its own row under them, and the chat starts below it — never covered', () => { const m = S.first;
  ok(m.position !== 'fixed' && m.position !== 'absolute', 'position ' + m.position); ok(near(m.band.y, m.ribbon.b, 1), 'not under the ribbon ' + JSON.stringify([m.band, m.ribbon])); ok(near(m.band.w, m.app.w, 1), 'width ' + m.band.w + ' vs ' + m.app.w);
  ok(m.videos.h === 228 && m.vb.min === 228, 'height ' + m.videos.h + ' min ' + m.vb.min); ok(m.bar.y >= m.videos.b - 1 && m.bar.h === 20, 'bar ' + JSON.stringify([m.bar, m.videos])); ok(m.transcript.y >= m.band.b - 1, 'the chat is under the band ' + JSON.stringify([m.transcript, m.band])); });
T('B5 no crop at any height: both pictures contain; the small picture\'s frame is MY picture\'s shape (640×480, wide), ≥ 110 px high, ≤ 40% of the strip\'s width, inside the strip', () => { const m = S.first; ok(m.fit[0] === 'contain' && m.fit[1] === 'contain', m.fit.join('/')); ok(near(sh(m.small), 640 / 480, 0.03), 'shape ' + JSON.stringify(m.small)); ok(m.small.h >= 109 && m.small.w <= 0.4 * m.videos.w + 1, 'size ' + JSON.stringify(m.small)); ok(m.small.x >= m.videos.x && m.small.y >= m.videos.y && m.small.x + m.small.w <= m.videos.x + m.videos.w + 1 && m.small.y + m.small.h <= m.videos.y + m.videos.h + 1, 'outside ' + JSON.stringify([m.small, m.videos])); });
T('B6 THE GRAB BAR, by touch: down 200 → +200; down past MAX → MAX; up past MIN → MIN; the height is saved only by the drag and restored at the next call', () => {
  ok(S.down200.videos.h === Math.min(428, S.first.vb.vmax), 'down 200 → ' + S.down200.videos.h); ok(S.downMax.videos.h === S.downMax.vb.vmax && S.downMax.vb.vmax > 428, 'max ' + S.downMax.videos.h + ' / ' + S.downMax.vb.vmax);
  ok(S.upMin.videos.h === 228, 'min ' + S.upMin.videos.h); ok(S.down100.saved[0] === '328' && S.down100.videos.h === 328, 'saved ' + S.down100.saved[0]); ok(S.again.videos.h === 328, 'restored ' + S.again.videos.h); ok(S.down100.logs.includes('vb_resized'), 'not logged'); });
T('B7 a swipe on the chat scrolls the chat and never resizes the strip', () => ok(S.chatSwipe.tScroll > 50 && S.chatSwipe.videos.h === S.down100.videos.h, JSON.stringify([S.chatSwipe.tScroll, S.chatSwipe.videos.h])));
T('B8 the small picture dragged by touch snaps to the nearest corner (top-left), remembered; no inline position; a drag never swaps; a tap swaps', () => { const m = S.inset; ok(m.corner === 'tl' && m.saved[1] === 'tl', 'corner ' + m.corner + ' saved ' + m.saved[1]); ok(m.small.x - m.videos.x <= 8 && m.small.y - m.videos.y <= 8, 'not in the corner ' + JSON.stringify([m.small, m.videos])); ok(!/left|top/.test(m.inline.join(' ')), 'inline ' + m.inline.join(' | ')); ok(m.swapped === false, 'a drag swapped'); ok(S.swap.swapped === true, 'a tap did not swap'); ok(S.again.corner === 'tl', 'not restored ' + S.again.corner); });
T('B9 after a swap the big picture is my wide 640×480 (contain), the small frame the partner\'s TALL 360×640 shape, in the remembered corner', () => { const m = S.swap; ok(m.fit[0] === 'contain', m.fit[0]); ok(near(sh(m.small), 360 / 640, 0.03), 'shape ' + JSON.stringify(m.small)); ok(m.corner === 'tl', m.corner); });
T('B10 subtitles clear a small picture in a bottom corner (they follow its live width)', () => { const v = S.first.bandVars; ok(/--vb-sr:\s*\d+px/.test(v) && parseInt(/--vb-sr:\s*(\d+)px/.exec(v)[1], 10) >= S.first.small.w + 10, v); });
T('B11 the call ends by the hang-up (swapped) and by the partner (swapped, mid-press): no band, no swap, TB_SWAP false, no inline position, no strip size left on the band; the next call opens at the remembered height and corner', () => {
  for (const [n, m] of [['hang-up', S.ended], ['partner', S.remoteEnd]]) { ok(m.display === 'none' && m.swapped === false && !/left|top/.test(m.inline.join(' ')) && !/--vb-/.test(m.bandVars) && !/st-video|st-phone/.test(m.st), n + ' ' + JSON.stringify([m.display, m.swapped, m.inline, m.bandVars, m.st])); }
  ok(S.tbswap === false, 'TB_SWAP'); ok(S.again2.videos.h === 328 && S.again2.corner === 'tl', 'next call ' + S.again2.videos.h + ' ' + S.again2.corner); });
T('B12 the chat keeps a floor: pulled all the way down, ≥ 118 px of chat stays — on a phone with the error banner and the reach bar showing, and on a phone on its side with the reach bar; on its side with the banner too the picture stops at its 80 px floor; MIN never above MAX', () => { for (const [n, m] of [['phone+banner', S.banner], ['side', SL.downMax]]) { ok(m && m.transcript.h >= 118, n + ' chat ' + (m && m.transcript.h)); ok(m.vb.min <= m.vb.max, n + ' min ' + m.vb.min + ' max ' + m.vb.max); } ok(SL.banner.videos.h >= 80 && SL.banner.vb.min <= SL.banner.vb.max, 'side+banner ' + SL.banner.videos.h); });
T('B13 a laptop\'s wide 1280×720 picture: contain, and the strip does not grow past what the picture can use (no black added below it)', () => { ok(SP.first.fit[0] === 'contain', SP.first.fit[0]); ok(SP.downMax.videos.h <= Math.max(228, Math.ceil(SP.downMax.videos.w * 720 / 1280)) + 1, 'grew to ' + SP.downMax.videos.h); });
T('B14 a press on the flip button that moves is never a resize or a corner move', () => ok(S.flip.videos.h === S.swap.videos.h && S.flip.corner === S.swap.corner, JSON.stringify([S.flip.videos.h, S.swap.videos.h, S.flip.corner])));
T('B15 layering: a dialog opened in the room sits above the strip', () => ok(S.dialog === true, 'dialog under the strip'));
T('B16 logged: vb_shown at each call, vb_shape when the frames arrive, vb_corner on a move', () => { const l = S.again.logs; ok(l.includes('vb_shown') && l.includes('vb_shape') && l.includes('vb_corner'), l.join(',')); });
fs.rmSync(dir, { recursive: true, force: true });
console.log('\n30·base browser: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
