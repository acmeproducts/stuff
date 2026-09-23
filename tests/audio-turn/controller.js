/* Audio turn control. One device = one microphone and one speaker, so any
   read-aloud playback pauses STT submission for BOTH sides. Frames captured
   during playback are replaced with silence on the socket and never kept.
   Speaker ownership is decided here, before normalization. */
(function(){
 const W=window,synth=W.speechSynthesis,cancelNative=synth?synth.cancel.bind(synth):function(){};
 const SIDES=['south','north'],CFG_KEY='chat_test_audio';
 const DEF={mode:'open',tones:true,volume:0.12,resumeMs:300,threshold:0.55,margin:0.12,windowMs:700,lockMs:1500,turnMs:60000,echoMs:20000};
 const LIFECYCLE=/^(owner portal|room switch|trash room|storage changed|hidden|pagehide|mic denied)$/;
 const SCRIPT={th:'thai',zh:'han',ja:'kana',ko:'hangul',ar:'arabic',hi:'devanagari',ru:'cyrillic'};
 const SCRIPT_RE={thai:/[฀-๿]/g,kana:/[぀-ヿ]/g,han:/[一-鿿]/g,hangul:/[가-힯ᄀ-ᇿ]/g,arabic:/[؀-ۿ]/g,devanagari:/[ऀ-ॿ]/g,cyrillic:/[Ѐ-ӿ]/g,latin:/[A-Za-zÀ-ɏ]/g};
 let hooks=null,starting={},gen=1,muted={south:false,north:false},pend=null,last={side:null,ts:0},spoken=[],blockedLogged={},fallbackNoted='';
 const tts={phase:'idle',token:0,timer:null};let cueUntil=0,actx=null;

 function cfg(){let c={};try{c=JSON.parse(W.localStorage.getItem(CFG_KEY)||'{}')||{}}catch(_){}return Object.assign({},DEF,c)}
 function saveCfg(p){const c=Object.assign(cfg(),p);try{W.localStorage.setItem(CFG_KEY,JSON.stringify(c))}catch(_){}return c}
 function rec(ev,outcome,d){
  const data=Object.assign({outcome:outcome,gen:gen},d||{});
  log('audio:'+ev,data,outcome==='error'?'error':outcome==='blocked'?'warn':'ok');
  if(hooks&&hooks.diag){const parts=Object.keys(data).filter(k=>k!=='outcome').map(k=>k+'='+(typeof data[k]==='string'?data[k].slice(0,40):data[k]));hooks.diag('audio '+ev+' ['+outcome+'] '+parts.join(' '),outcome==='error')}
 }
 function langs(){return hooks?{south:hooks.langOf('south'),north:hooks.langOf('north')}:{south:'en',north:'en'}}
 function openMode(){const l=langs();return cfg().mode==='open'&&l.south!==l.north}
 function now(){return Date.now()}

 /* ---------- tones: soft, short, distinct by pitch ---------- */
 function ctx(){if(actx)return actx;const A=W.AudioContext||W.webkitAudioContext;if(!A)return null;try{actx=new A()}catch(_){actx=null}return actx}
 const TONES={wait:[660,440],speak:[440,660],bong:[220]};
 function cue(kind,done){
  const c=cfg(),notes=TONES[kind],dur=notes.length*180+40;
  if(!c.tones){done&&done();return}
  const a=ctx();
  if(!a){rec('cue-played','error',{cue:kind,reason:'cue-unavailable'});done&&done();return}
  try{
   if(a.state==='suspended'&&a.resume)a.resume();
   const t0=a.currentTime+0.02;
   notes.forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain(),s=t0+i*0.18;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(c.volume,s+0.02);g.gain.exponentialRampToValueAtTime(0.0001,s+(kind==='bong'?0.34:0.16));o.connect(g);g.connect(a.destination);o.start(s);o.stop(s+(kind==='bong'?0.36:0.17))});
   cueUntil=Math.max(cueUntil,now()+dur+(kind==='bong'?200:0));
   rec('cue-played','ok',{cue:kind});
  }catch(e){rec('cue-played','error',{cue:kind,reason:'cue-failed'})}
  setTimeout(()=>{done&&done()},dur+(kind==='bong'?200:0));
 }

 /* ---------- TTS turn gate ---------- */
 function remember(text){spoken.push({text:text,ts:now()});spoken=spoken.filter(s=>now()-s.ts<cfg().echoMs).slice(-8)}
 function speak(text,lang){
  text=norm(text);if(!text)return;
  if(!synth){rec('tts-start','error',{reason:'tts-unavailable'});return}
  clearTimeout(tts.timer);tts.timer=null;
  const token=++tts.token,before=tts.phase;tts.phase='playing';blockedLogged={};
  remember(text);
  rec('stt-submit-blocked','blocked',{reason:'tts-active',before:before,after:'playing'});
  cue('wait',()=>{
   if(token!==tts.token)return;
   const u=new SpeechSynthesisUtterance(text);u.lang=gL(lang).tts;
   u.onstart=()=>{if(token===tts.token)rec('tts-start','ok',{lang:lang})};
   // Browsers sometimes never fire end; never leave STT blocked.
   const guard=setTimeout(()=>{if(token===tts.token&&tts.phase==='playing'){cancelNative();end(token,'error','tts-timeout')}},Math.min(30000,2500+text.length*120));
   tts.guard=guard;
   u.onend=()=>end(token,'ok','completed');
   u.onerror=e=>{const r=e&&e.error||'playback-failed';end(token,/interrupt|cancel/.test(r)?'blocked':'error',r)};
   try{cancelNative();synth.speak(u)}catch(e){rec('tts-start','error',{reason:'speak-threw'});end(token,'error','speak-threw')}
  });
 }
 function end(token,outcome,reason){
  if(token!==tts.token||tts.phase!=='playing'){rec('tts-end','blocked',{reason:'stale-or-duplicate'});return}
  clearTimeout(tts.guard);
  rec(outcome==='ok'?'tts-completed':outcome==='blocked'?'tts-cancelled':'tts-failed',outcome,{reason:reason});
  tts.phase='decay';
  const ms=cfg().resumeMs;
  tts.timer=setTimeout(()=>{
   if(token!==tts.token){rec('resume-timer','blocked',{reason:'superseded'});return}
   tts.timer=null;rec('resume-delay','ok',{ms:ms});tts.phase='cue';
   cue('speak',()=>{
    if(token!==tts.token){rec('resume-timer','blocked',{reason:'superseded'});return}
    tts.phase='idle';
    SIDES.forEach(s=>{if(openMode()&&muted[s])rec('stt-submit-resumed','blocked',{side:s,reason:'user-muted'})});
    rec('stt-submit-resumed','ok',{before:'cue',after:'idle'});
   });
  },ms);
 }
 function cancel(reason){
  if(tts.phase!=='idle'){tts.token++;clearTimeout(tts.timer);clearTimeout(tts.guard);tts.timer=null;const before=tts.phase;tts.phase='idle';rec('tts-cancelled','blocked',{reason:reason||'cancelled',before:before,after:'idle'});rec('stt-submit-resumed','ok',{reason:'cancelled'})}
  cancelNative();
 }
 if(synth)synth.cancel=function(){cancel('lifecycle')};
 function admit(side){
  const ok=tts.phase==='idle'&&now()>=cueUntil;
  if(!ok&&!blockedLogged[side]){blockedLogged[side]=1;rec('stt-submit-blocked','blocked',{side:side,reason:tts.phase==='idle'?'cue':'tts-'+tts.phase})}
  if(ok&&blockedLogged[side]){delete blockedLogged[side]}
  return ok;
 }

 /* ---------- routing: before normalization ---------- */
 function clean(t){return String(t).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu,' ').trim()}
 function bigrams(t){const s=t.replace(/ /g,''),m={};for(let i=0;i<s.length-1;i++){const k=s.slice(i,i+2);m[k]=(m[k]||0)+1}return m}
 function dice(a,b){const A=bigrams(a),B=bigrams(b);let n=0,na=0,nb=0;for(const k in A){na+=A[k];if(B[k])n+=Math.min(A[k],B[k])}for(const k in B)nb+=B[k];return na+nb?2*n/(na+nb):0}
 function isEcho(text){const t=clean(text);if(t.length<2)return false;return spoken.some(s=>{if(now()-s.ts>cfg().echoMs)return false;const x=clean(s.text);return(t.length>=4&&x.includes(t))||dice(t,x)>=0.6})}
 function scriptOf(text){let best=null,n=0;for(const k in SCRIPT_RE){const m=String(text).match(SCRIPT_RE[k]);const c=m?m.length:0;if(c>n){n=c;best=k}}return best}
 function scriptSide(text){const sc=scriptOf(text);if(!sc)return null;const l=langs(),hit=SIDES.filter(s=>(SCRIPT[l[s]]||'latin')===sc||(sc==='han'&&l[s]==='ja'));return hit.length===1?hit[0]:null}
 function langCode(lang,alt){let c=lang;if(!c&&alt&&Array.isArray(alt.languages)&&alt.languages[0])c=alt.languages[0];return c?String(c).toLowerCase().split('-')[0]:null}
 function sideForLang(code){const l=langs();const hit=SIDES.filter(s=>l[s]===code);return hit.length===1?hit[0]:null}

 function heard(pipe,text,lang,alt){
  text=String(text||'').trim();if(!text)return;
  const item={pipe:pipe,text:text,lang:langCode(lang,alt),conf:alt&&typeof alt.confidence==='number'?alt.confidence:0.5,ts:now(),tts:tts.phase,gen:gen};
  rec('transcript-accepted','ok',{side:pipe,lang:item.lang||'?',conf:+item.conf.toFixed(2),tts:item.tts});
  if(!openMode()){
   if(isEcho(text)){rec('transcript-rejected','blocked',{side:pipe,reason:'echo'});return}
   deliver(pipe,item,'owner');return;
  }
  const running=SIDES.filter(s=>hooks&&hooks.mic[s]&&hooks.mic[s].on);
  if(running.length===1&&running[0]===pipe){
   if(isEcho(text)){rec('transcript-rejected','blocked',{side:pipe,reason:'echo'});return}
   deliver(pipe,item,'only-open-side');return;
  }
  if(!pend)pend={gen:gen,items:[],timer:setTimeout(decide,cfg().windowMs)};
  pend.items.push(item);
 }
 function decide(){
  const p=pend;pend=null;if(!p)return;
  if(p.gen!==gen){rec('stale-session','blocked',{reason:'discarded',items:p.items.length});return}
  if(p.items.some(i=>isEcho(i.text))){rec('transcript-rejected','blocked',{reason:'echo',items:p.items.length});return}
  const c=cfg(),t=now(),score={},best={};
  p.items.forEach(i=>{
   const ss=scriptSide(i.text);let owner=sideForLang(i.lang)||ss;if(!owner)return;
   let s=i.conf;if(ss)s+=ss===owner?0.3:-0.6;
   if(score[owner]==null||s>score[owner]){score[owner]=s;best[owner]=i}
  });
  if(last.side){const age=t-last.ts;if(age<c.lockMs&&score[last.side]!=null)score[last.side]+=0.15;else{const o=last.side==='south'?'north':'south';if(age<c.turnMs&&score[o]!=null)score[o]+=0.05}}
  const ranked=Object.keys(score).sort((a,b)=>score[b]-score[a]);
  const top=ranked[0],second=ranked[1];
  if(top&&score[top]>=c.threshold&&(!second||score[top]-score[second]>=c.margin)){deliver(top,best[top],'scored',{score:+score[top].toFixed(2),runnerUp:second?+score[second].toFixed(2):null});return}
  const side=top||p.items[0].pipe,item=best[side]||p.items[0];
  rec('low-confidence-owner','blocked',{side:side,score:top?+score[top].toFixed(2):null,runnerUp:second?+score[second].toFixed(2):null,reason:'placed-in-compose'});
  if(hooks)hooks.compose(side,item.text);
  cue('bong');
 }
 function deliver(side,item,reason,extra){
  if(item.gen!==gen){rec('stale-session','blocked',{side:side,reason:'discarded'});return}
  const l=langs();
  rec('transcript-routed','ok',Object.assign({side:side,reason:reason,src:l[side],tgt:l[side==='south'?'north':'south'],conf:+item.conf.toFixed(2),tts:item.tts},extra||{}));
  last={side:side,ts:now()};
  if(hooks)hooks.send(side,item.text);
 }

 /* ---------- microphones: open mode keeps both listening ---------- */
 function roomReady(){const b=document.body;return !!b&&!b.classList.contains('cl-open')&&!b.classList.contains('cl-empty-room')&&!document.hidden}
 function sync(){
  if(!hooks)return;
  const l=langs(),key=l.south+'|'+l.north;
  if(cfg().mode==='open'&&l.south===l.north&&roomReady()&&fallbackNoted!==key){fallbackNoted=key;rec('mode-fallback','blocked',{reason:'same-language-room',mode:'ask'});hooks.toast('Same language on both sides: tap a mic to talk')}
  if(!openMode())return;
  const ready=roomReady();
  SIDES.forEach(s=>{
   const P=hooks.mic[s],want=ready&&!muted[s];
   if(want&&!P.on&&!starting[s]){starting[s]=1;P.start().then(()=>{delete starting[s];rec('mic-open','ok',{side:s});if(!(roomReady()&&openMode()&&!muted[s]))P.hardStop()}).catch(e=>{delete starting[s];const denied=e&&e.name==='NotAllowedError';rec('mic-open','error',{side:s,reason:denied?'permission-denied':'open-failed'});muted[s]=true;hooks.paint(s,false)})}
   if(!want&&P.on)P.hardStop();
  });
  SIDES.filter(s=>!(ready&&!muted[s])).forEach(s=>hooks.paint(s,false));
  SIDES.filter(s=>ready&&!muted[s]).forEach(s=>hooks.paint(s,true));
 }
 function toggleMute(side){
  if(!openMode())return false;
  const before=muted[side]?'muted':'open';muted[side]=!muted[side];
  rec('user-mute','ok',{side:side,before:before,after:muted[side]?'muted':'open'});
  sync();return true;
 }
 function wantsMic(side){return openMode()&&roomReady()&&!muted[side]}
 function keepsMic(why){return openMode()&&!LIFECYCLE.test(why)}
 function afterTeardown(why){
  if(LIFECYCLE.test(why)){gen++;if(pend){clearTimeout(pend.timer);rec('stale-session','blocked',{reason:'discarded',items:pend.items.length});pend=null}last={side:null,ts:0};if(why==='room switch'){muted={south:false,north:false}}}
  sync();
 }

 /* ---------- settings ---------- */
 function settingsUI(f){
  const c=cfg(),el=(t,x,cls)=>{const e=document.createElement(t);if(x!=null)e.textContent=x;if(cls)e.className=cls;return e};
  const m=el('label','Microphone mode','cl-field'),sel=el('select');[['open','Both open, app decides who spoke'],['ask','Ask to talk, mic open until closed']].forEach(o=>{const x=el('option',o[1]);x.value=o[0];sel.appendChild(x)});sel.value=c.mode;m.appendChild(sel);f.appendChild(m);
  const t=el('label','Turn tones','cl-field'),tsel=el('select');[['on','On'],['off','Off']].forEach(o=>{const x=el('option',o[1]);x.value=o[0];tsel.appendChild(x)});tsel.value=c.tones?'on':'off';t.appendChild(tsel);f.appendChild(t);
  const v=el('label','Tone volume','cl-field'),vin=el('input');vin.type='range';vin.min='0.02';vin.max='0.4';vin.step='0.02';vin.value=String(c.volume);v.appendChild(vin);f.appendChild(v);
  const d=el('label','Pause after read-aloud (ms)','cl-field'),din=el('input');din.type='number';din.min='0';din.max='2000';din.step='50';din.value=String(c.resumeMs);d.appendChild(din);f.appendChild(d);
  return {mode:sel,tones:tsel,volume:vin,resume:din};
 }
 function saveSettings(ui){
  if(!ui)return;
  const c=saveCfg({mode:ui.mode.value==='ask'?'ask':'open',tones:ui.tones.value!=='off',volume:Math.max(0.02,Math.min(0.4,Number(ui.volume.value)||DEF.volume)),resumeMs:Math.max(0,Math.min(2000,Number(ui.resume.value)||0))});
  rec('settings-saved','ok',{mode:c.mode,tones:c.tones,resumeMs:c.resumeMs});
  if(hooks&&c.mode==='ask')SIDES.forEach(s=>{if(hooks.mic[s].on&&!hooks.ownsMic(s))hooks.mic[s].hardStop();hooks.paint(s,hooks.ownsMic(s))});
 }
 function note(stage,outcome,d){rec(stage,outcome,d)}

 W.audioTurn={bind(h){hooks=h;sync()},speak,cancel,admit,heard,decide,sync,toggleMute,wantsMic,keepsMic,afterTeardown,settingsUI,saveSettings,note,isEcho,scriptSide,cfg,
  state:()=>({phase:tts.phase,gen:gen,muted:Object.assign({},muted),pending:pend?pend.items.length:0,open:openMode(),last:Object.assign({},last)})};
 if(document&&document.addEventListener){
  const wake=()=>{const a=ctx();if(a&&a.state==='suspended'&&a.resume)a.resume();if(hooks)SIDES.forEach(s=>{const c=hooks.mic[s]&&hooks.mic[s].audioCtx;if(c&&c.state==='suspended'&&c.resume)c.resume().then(()=>rec('mic-open','ok',{side:s,reason:'audio-resumed-on-tap'})).catch(()=>rec('mic-open','error',{side:s,reason:'audio-resume-failed'}))})};
  document.addEventListener('pointerdown',wake,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>sync());
  document.addEventListener('DOMContentLoaded',()=>{if(W.MutationObserver)new MutationObserver(()=>sync()).observe(document.body,{attributes:true,attributeFilter:['class']})});
 }
})();
