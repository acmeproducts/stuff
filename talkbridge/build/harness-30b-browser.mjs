#!/usr/bin/env node
/* 30·base browser gate — THE VIDEO BOX (§7.22, candidate 2) in a REAL layout engine (headless Chromium; jsdom has no layout).
   Stages a video call on the assembled page (seeded phone, CALL marked active, canvas streams: the partner a tall phone picture
   360×640, me a wide 640×480 — the Android's shape in G77), at phone size 390×844 inside a frame, and measures. The window must
   take the shape of the picture it shows; the inset the shape of the small picture. B3–B14.
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
  main: String.raw`
setTimeout(function(){ try{
  startCall('voice'); var cb=getComputedStyle(document.getElementById('call-band')); R.voice={display:cb.display,position:cb.position};
  endCall();
  setTimeout(function(){ startCall('video'); },100);
  setTimeout(function(){ try{
    var cs=getComputedStyle(document.getElementById('call-band')); R.pos=cs.position; R.box0=box(); R.vw=innerWidth; R.vh=innerHeight;
    var rib=document.getElementById('room-ribbon'); R.ribBottom=rib?Math.round(rib.getBoundingClientRect().bottom):null;
    R.fit=[getComputedStyle(document.getElementById('remote-video')).objectFit,getComputedStyle(document.getElementById('local-video')).objectFit];
    R.inset=rect('local-video'); R.big=rect('remote-video');
    R.sub=rect('subtitle-area'); R.handle=getComputedStyle(document.getElementById('local-video-handle')).display;
    R.shown=(window.debugLog||[]).filter(function(l){return l.ev==='vb_shown'}).length;
    var b=R.box0, cx=b.x+40, cy=b.y+60;
    M('mousedown',cx,cy); W('mousemove',cx-60,cy+100); W('mousemove',cx-150,cy+300); W('mouseup',cx-150,cy+300); M('click',cx-150,cy+300);
    R.afterDrag=box(); R.swapAfterDrag=document.getElementById('call-videos').classList.contains('swapped'); R.saved=localStorage.getItem('tb_vbox_pos');
    R.moved=(window.debugLog||[]).filter(function(l){return l.ev==='vb_moved'}).length;
    var b2=box(); M('mousedown',b2.x+30,b2.y+30); W('mousemove',b2.x-900,b2.y+2000); W('mouseup',b2.x-900,b2.y+2000);
    R.clampLow=box();
    var b3=box(); M('mousedown',b3.x+30,b3.y+30); W('mousemove',b3.x+3000,b3.y-3000); W('mouseup',b3.x+3000,b3.y-3000);
    R.clampHigh=box();
    setTimeout(function(){ try{
      var b4=box(); M('mousedown',b4.x+40,b4.y+40); W('mouseup',b4.x+40,b4.y+40); M('click',b4.x+40,b4.y+40);
      R.beforeSwap=b4; R.swapAfterTap=document.getElementById('call-videos').classList.contains('swapped');
      setTimeout(function(){ try{
      R.bigAfterSwap=rect('local-video'); R.smallAfterSwap=rect('remote-video'); R.boxAfterSwap=box();
      var rv=rect('remote-video'), RVE=document.getElementById('remote-video'); M('mousedown',rv.x+10,rv.y+10,RVE); M('mousemove',rv.x-60,rv.y-60,RVE); M('mousemove',rv.x-120,rv.y-120,RVE); M('mouseup',rv.x-120,rv.y-120,RVE);   /* the move goes to the element the press began on, as on a phone — the old drag listens there */
      var rv2=rect('remote-video'), bb=box(); R.afterInsetDrag=bb; R.insetInBox=(rv2.x>=bb.x&&rv2.x+rv2.w<=bb.x+bb.w+1&&rv2.y>=bb.y&&rv2.y+rv2.h<=bb.y+bb.h+1); R.insetInline=document.getElementById('remote-video').getAttribute('style');
      var fb=document.getElementById('btn-flip-overlay').getBoundingClientRect(); var before=box(); var flips=0; var orig=window.tbFlipCamera; window.tbFlipCamera=function(){flips++;};
      M('mousedown',fb.left+5,fb.top+5,document.getElementById('btn-flip-overlay')); W('mousemove',fb.left+80,fb.top+80); W('mouseup',fb.left+80,fb.top+80);
      R.flipNoDrag=JSON.stringify(before)===JSON.stringify(box());
      window.tbFlipCamera=orig;
      var mid=box(); R.shapes=(window.debugLog||[]).filter(function(l){return l.ev==='vb_shape'}).length; var dlg=document.createElement('div'); dlg.className='cl-bt'; document.getElementById('scr-room').appendChild(dlg);
      var top=document.elementFromPoint(mid.x+mid.w/2, mid.y+mid.h/2); R.dialogAbove=!!(top&&top.closest&&top.closest('.cl-bt')); dlg.remove();
      var top2=document.elementFromPoint(mid.x+mid.w/2, mid.y+mid.h/2); R.boxOnTopOfChat=!!(top2&&top2.closest&&top2.closest('#call-band'));
      endCall();
      var cb=getComputedStyle(document.getElementById('call-band')); R.afterEnd={display:cb.display,swapped:document.getElementById('call-videos').classList.contains('swapped'),lv:document.getElementById('local-video').getAttribute('style'),rv:document.getElementById('remote-video').getAttribute('style'),st:document.getElementById('scr-room').className};
      setTimeout(function(){ startCall('video');
      setTimeout(function(){ R.reopen=box(); try{ var sp=JSON.parse(localStorage.getItem('tb_vbox_pos')); var a=APP(); var rib=document.getElementById('room-ribbon').getBoundingClientRect(); R.savedPos=sp; R.reopenApp=a; }catch(e){}
        /* the partner hangs up while swapped and mid-press: teardown() directly, no hang-up wrap */
        var b5=box(); M('mousedown',b5.x+40,b5.y+40); W('mouseup',b5.x+40,b5.y+40); M('click',b5.x+40,b5.y+40); R.swappedBeforeRemoteEnd=document.getElementById('call-videos').classList.contains('swapped');
        M('mousedown',b5.x+40,b5.y+40);
        try{ CALL.onRemoteEnd(CALL.room||{id:'room-1'},{type:'call-end'}); }catch(e){ try{ CALL.teardown(); }catch(e2){ R.err.push('remoteEnd '+e2); } }
        setTimeout(function(){ W('mousemove',b5.x-100,b5.y+100); W('mouseup',b5.x-100,b5.y+100);
        R.afterRemoteEnd={display:getComputedStyle(document.getElementById('call-band')).display,swapped:document.getElementById('call-videos').classList.contains('swapped'),tbswap:(typeof TB_SWAP!=='undefined'?TB_SWAP:null),lv:document.getElementById('local-video').getAttribute('style'),rv:document.getElementById('remote-video').getAttribute('style')};
        setTimeout(function(){ startCall('video'); setTimeout(function(){ R.afterRemoteReopen=box(); R.app=APP(); document.title='VBRESULT'+JSON.stringify(R); },300); },100);
        },60);
      },300); },100);
      }catch(e){R.err.push('s3 '+e); document.title='VBRESULT'+JSON.stringify(R);} },1300);
    }catch(e){R.err.push('s2 '+e); document.title='VBRESULT'+JSON.stringify(R);} },500);
  }catch(e){R.err.push('s1 '+e); document.title='VBRESULT'+JSON.stringify(R);} },700);
}catch(e){R.err.push('s0 '+e); document.title='VBRESULT'+JSON.stringify(R);} },1500);`,
  laptop: String.raw`
PARTNER=[1280,720];
setTimeout(function(){ try{ startCall('video'); setTimeout(function(){ R.box=box(); R.app=APP(); R.fit=getComputedStyle(document.getElementById('remote-video')).objectFit; document.title='VBRESULT'+JSON.stringify(R); },1600); }catch(e){R.err.push(''+e); document.title='VBRESULT'+JSON.stringify(R);} },1500);`,
  rotate: String.raw`
setTimeout(function(){ try{ startCall('video'); setTimeout(function(){ /* after the 1 s shape poll */ R.box=box(); R.app=APP(); var rib=document.getElementById('room-ribbon'); R.ribBottom=rib?Math.round(rib.getBoundingClientRect().bottom):0;
  var b=R.box; M('mousedown',b.x+20,b.y+20); W('mousemove',b.x+3000,b.y+3000); W('mouseup',b.x+3000,b.y+3000); R.far=box(); M('mousedown',R.far.x+20,R.far.y+20); W('mousemove',R.far.x-3000,R.far.y-3000); W('mouseup',R.far.x-3000,R.far.y-3000); R.near=box();
  document.title='VBRESULT'+JSON.stringify(R); },1600); }catch(e){R.err.push(''+e); document.title='VBRESULT'+JSON.stringify(R);} },1500);`
};
function run(name, w, h, seedPos) {
  const page = html.replace('<head>', '<head>' + SEED.replace('__SEEDPOS__', seedPos ? "localStorage.setItem('tb_vbox_pos','" + seedPos + "');" : ''), 1).replace(/<\/body>(?![\s\S]*<\/body>)/, '<script>' + STAGE + SCENARIOS[name] + '</script></body>');
  const pf = path.join(dir, name + '.html'); fs.writeFileSync(pf, page);
  for (const f of fs.readdirSync('talkbridge-app')) if (/\.(png|webmanifest)$/.test(f)) { try { fs.copyFileSync(path.join('talkbridge-app', f), path.join(dir, f)); } catch (_) {} }
  const frame = path.join(dir, name + '-frame.html');
  fs.writeFileSync(frame, '<body style="margin:0"><iframe id=f src="' + name + '.html" style="width:' + w + 'px;height:' + h + 'px;border:0;display:block"></iframe><script>setInterval(function(){try{var t=document.getElementById("f").contentDocument.title;if(t.indexOf("VBRESULT")===0)document.title=t;}catch(e){}},100)</script></body>');
  const out = execFileSync(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--hide-scrollbars', '--window-size=' + (w + 200) + ',' + (h + 20), '--virtual-time-budget=9000', '--dump-dom', 'file://' + frame], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 });
  const m = /<title>VBRESULT([\s\S]*?)<\/title>/.exec(out); if (!m) throw new Error(name + ': no result from the page');
  return JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
}

let pass = 0, fail = 0;
const T = (n, f) => { try { f(); pass++; if (!quiet) console.log('  ok  ' + n); } catch (e) { fail++; console.log('FAIL  ' + n + ' — ' + (e && e.message || e)); } };
const ok = (c, m) => { if (!c) throw new Error(m); };
let R, Q, L, D, X, P;
try { R = run('main', 390, 844); Q = run('main', 390, 844, '{"fx":0,"fy":1}'); L = run('rotate', 844, 390); D = run('rotate', 1280, 800); X = run('rotate', 390, 844, '{"fx":"garbage","fy":null}'); P = run('laptop', 390, 844); }
catch (e) { console.log('FAIL  the browser run — ' + e.message); process.exit(1); }
const near = (a, b, d) => Math.abs(a - b) <= (d || 1);
T('B0 no page error through the whole script', () => ok([R, Q, L, D, X, P].every((z) => z.err.length === 0), JSON.stringify([R.err, Q.err, L.err, D.err, X.err, P.err])));
T('B3 a voice call shows no window (the band stays hidden)', () => ok(R.voice.display === 'none', JSON.stringify(R.voice)));
T('B4 a video call: the band is fixed to the screen, shaped like the partner\'s picture (a tall 360×640 phone picture → a tall 9:16 window), fully on screen, first place top-right under the ribbon', () => { const b = R.box0; ok(R.pos === 'fixed', 'position ' + R.pos); ok(near(b.h, b.w * 640 / 360, 2), 'not the partner\'s shape: ' + JSON.stringify(b)); ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= R.vw && b.y + b.h <= R.vh, 'off screen ' + JSON.stringify(b)); ok(b.x + b.w >= R.vw - 12 && b.y >= (R.ribBottom || 0), 'not top-right under the ribbon ' + JSON.stringify(b) + ' ribbon ' + R.ribBottom); ok(b.w >= 140 && b.w <= 240, 'width ' + b.w); ok(R.shown === 1, 'vb_shown ' + R.shown); });
T('B5 no band, no crop: each picture is whole in a frame of its OWN shape (contain in a matching frame) — the big one the window, the inset my own wide 640×480 picture', () => { ok(R.fit[0] === 'contain' && R.fit[1] === 'contain', R.fit.join('/')); ok(near(R.inset.h, R.inset.w * 480 / 640, 2), 'the inset is not my picture\'s shape ' + JSON.stringify(R.inset)); ok(near(R.big.w, R.box0.w, 1) && near(R.big.h, R.box0.h, 1), 'big ' + JSON.stringify(R.big)); });
T('B6 a press that moves drags the box and never swaps; the place is saved and logged', () => { ok(R.afterDrag.x === R.box0.x - 150 && R.afterDrag.y === R.box0.y + 300, JSON.stringify([R.box0, R.afterDrag])); ok(R.swapAfterDrag === false, 'a drag swapped'); ok(/"fx":/.test(R.saved || ''), 'not saved ' + R.saved); ok(R.moved >= 1, 'not logged'); });
T('B6b clamped on all four sides', () => { ok(R.clampLow.x === 0 && R.clampLow.y === R.vh - R.clampLow.h, 'low ' + JSON.stringify(R.clampLow)); ok(R.clampHigh.x === R.vw - R.clampHigh.w && R.clampHigh.y === 0, 'high ' + JSON.stringify(R.clampHigh)); });
T('B6c a press that does not move is a tap and swaps; the window RESHAPES to the new big picture (my wide one: a wide window), the partner goes to the corner in its tall shape; the window stays fully in the app column', () => { const w = R.boxAfterSwap; ok(R.swapAfterTap === true, 'no swap'); ok(near(w.h, w.w * 480 / 640, 2), 'the window did not take my picture\'s shape ' + JSON.stringify(w)); ok(near(R.bigAfterSwap.w, w.w, 1) && near(R.bigAfterSwap.h, w.h, 1), 'big after swap ' + JSON.stringify(R.bigAfterSwap)); ok(near(R.smallAfterSwap.h, R.smallAfterSwap.w * 640 / 360, 2) && R.smallAfterSwap.w < w.w / 2, 'small after swap ' + JSON.stringify(R.smallAfterSwap)); ok(R.smallAfterSwap.h <= w.h * 0.45 + 2, 'the tall inset overflows the wide window ' + JSON.stringify([R.smallAfterSwap, w])); ok(w.x >= R.app.x && w.x + w.w <= R.app.x + R.app.w && w.y >= 0 && w.y + w.h <= R.vh, 'left the app ' + JSON.stringify([w, R.app])); ok(w.y === R.beforeSwap.y, 'the top edge moved on the reshape ' + JSON.stringify([R.beforeSwap, w])); });
T('B7 the old small-video drag does nothing while the box shows (the inset stays in the box, no inline position); the edge handle is hidden', () => { ok(R.insetInBox, 'the inset left the box'); ok(!R.insetInline, 'inline style ' + R.insetInline); ok(R.handle === 'none', 'handle ' + R.handle); });
T('B8 the place is restored at the next call — as the same fraction of the free room (the window may be a different shape by then); a saved place restores exactly (bottom-left); a damaged saved place falls back to top-right', () => { const sp = R.savedPos, a = R.reopenApp, b = R.reopen; ok(sp && near(b.x, a.x + sp.fx * (a.w - b.w), 2), 'x ' + JSON.stringify([sp, a, b])); ok(X.box.x + X.box.w >= X.app.x + X.app.w - 12 && X.box.y >= X.ribBottom, 'damaged ' + JSON.stringify([X.box, X.app])); ok(Q.box0.x === 0 && Q.box0.y === Q.vh - Q.box0.h, 'seeded ' + JSON.stringify(Q.box0)); });
const inApp = (b, a) => b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
T('B8b a phone on its side and a wide desktop: the box keeps the picture\'s shape, fits under the ribbon, and never leaves the app column, even dragged to every corner', () => { for (const [n, z] of [['side', L], ['desktop', D]]) { const b = z.box; ok(near(b.h, b.w * 640 / 360, 2), n + ' not the picture\'s shape ' + JSON.stringify(b)); for (const c of [z.box, z.far, z.near]) ok(inApp(c, z.app), n + ' left the app column ' + JSON.stringify([c, z.app])); ok(b.y >= z.ribBottom, n + ' over the ribbon'); } });
T('B9 subtitles sit at the top of the box, inside it', () => ok(R.sub.y >= R.box0.y && R.sub.y <= R.box0.y + 12 && R.sub.x >= R.box0.x, JSON.stringify([R.sub, R.box0])));
T('B10 the call ends clean by the hang-up: no window, no swap, no inline position, no call class', () => { const a = R.afterEnd; ok(a.display === 'none' && !a.swapped && !a.lv && !a.rv && !/st-video|st-phone/.test(a.st), JSON.stringify(a)); });
T('B10b the partner hangs up while swapped and mid-press (teardown without the hang-up wrap): no window, no swap, TB_SWAP false, no inline position; the next call opens where it was', () => { const a = R.afterRemoteEnd; ok(R.swappedBeforeRemoteEnd === true, 'not swapped first'); ok(a.display === 'none' && !a.swapped && a.tbswap === false && !a.lv && !a.rv, JSON.stringify(a)); ok(R.afterRemoteReopen.x === R.reopen.x && R.afterRemoteReopen.y === R.reopen.y, 'moved by the press across the end ' + JSON.stringify([R.reopen, R.afterRemoteReopen])); });
T('B13 a laptop\'s wide 1280×720 picture makes a wide window, inside the app column, no band (contain in a matching frame)', () => { const b = P.box; ok(near(b.h, b.w * 720 / 1280, 2) && b.w > b.h, 'not wide ' + JSON.stringify(b)); ok(b.x >= P.app.x && b.x + b.w <= P.app.x + P.app.w, 'left the app ' + JSON.stringify([b, P.app])); ok(P.fit === 'contain', P.fit); });
T('B14 the shape is logged (vb_shape) when the first frames arrive', () => ok(R.shapes >= 1, 'no vb_shape'));
T('B12 layering: the box sits above the chat, and a dialog opened in the room sits above the box', () => { ok(R.boxOnTopOfChat, 'the box is under the chat'); ok(R.dialogAbove, 'a dialog is under the box'); });
T('B11 a press on the flip button is never a drag', () => ok(R.flipNoDrag, 'the box moved'));
fs.rmSync(dir, { recursive: true, force: true });
console.log('\n30·base browser: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
