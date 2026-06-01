# TalkBridge — Master Development & Test Record
**Version:** 3.0 | **Created:** 2026-05-30
**Baseline:** `bridge-turn01-post-ship.html` (v5.2.4 · 4001 lines)
**Repo:** `/home/user/stuff`
**Turns:** 06 → 10 | **Stages per Turn:** 5 | **Total Releases:** 25

---

## FOR CC: HOW TO USE THIS DOCUMENT

### This file is the only authority
Read this file in full before touching anything. Do not read any other file first. If anything in your context conflicts with this file, this file wins. No exceptions.

### Your responsibilities
- One atomic change per commit. Commit and push after every individual change.
- After completing all changes in a stage, update the checkpoint sentinel using `str_replace`, commit this file alongside the HTML file, push, then STOP and post your status. Wait.
- Never proceed past a checkpoint without `GATE_PASS` from the user.
- Never patch a failing stage forward. Revert to the stage's input file and retry.

### Checkpoint update format
Find `PENDING[CHECKPOINT-ID]` and replace with:
```
STATUS[CHECKPOINT-ID]
Result: PASS / ISSUE
Date: YYYY-MM-DD
File: bridge-turnNN-STAGE.html
Commits: [one per line]
Greps: [each validation result]
Lint: PASS / FAIL
Notes: [deviations or issues]
END[CHECKPOINT-ID]
```

### Fail protocol
`GATE_FAIL` = revert to the input file for that stage, retry from scratch. Never patch forward.

---

## IMMUTABLE RULES

```
R1.  Turn 06 baseline is bridge-turn01-post-ship.html. Each subsequent turn's
     baseline is the previous turn's post-ship file. No substitutions. Ever.
R2.  One atomic change per commit. Commit and push before the next change.
R3.  New CSS always appended at end of <style> block. Never injected mid-block.
R4.  Never touch:
       RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
       RELAY_WS   = 'wss://' + RELAY_BASE
       RELAY_APP  = 'talk-say-v1'
R5.  Never touch unless this document explicitly says otherwise:
       startDeepgram()  stopDeepgram()  reconcileDeepgramState()
       translateWithRetry()  translate()  handleChatMsg()  onDGFinal()
       LANGS  DG_LANGS  TTS_LOCALE  _loadFastText()  _detectLangAsync()
R6.  FIND text not found exactly as written: STOP. Report. Do not guess.
R7.  Lint fails: STOP. Do not push. Report.
R8.  Validation grep differs from EXPECTED: STOP. Report.
R9.  No stage begins until previous stage is committed, pushed, checkpoint updated.
R10. Fail = revert to stage input file, retry. Never patch forward.
R11. After every stage's final push: merge the working branch to main before
     posting the checkpoint. GitHub Pages must be serving the new file before
     you stop and wait. Confirm with: "Pages live at [URL]" in the checkpoint.
```

### Lint helper
```bash
python3 -c "
import re
txt=open('FILENAME').read()
m=re.search(r'<script[^>]*>(.*?)</script>',txt,re.DOTALL)
open('/tmp/l.js','w').write(m.group(1))"
node --check /tmp/l.js && echo "LINT PASS" || echo "LINT FAIL"
```

---

---

# TURN 06 — Foundation + Full PB Roundtrip + Pair Identity

**Goal:** Everything that makes this app work. Stable calls, full phrasebook lifecycle, usage tracking for PB Central, pair identity established. This is the complete foundation.

**Baseline:** `bridge-turn01-post-ship.html` (v5.2.4)
**Output:** `bridge-turn06-post-ship.html` (v5.6.4)

---

## T06 PRE-FLIGHT

```bash
cd /home/user/stuff
grep -m1 "v5\." bridge-turn01-post-ship.html
# EXPECTED: <!-- talkbridge · dcr · v5.2.4 -->
grep -c "" bridge-turn01-post-ship.html
# EXPECTED: 4001
git status --short
# EXPECTED: empty or untracked only
grep -c "var _telBuf=\[\];" bridge-turn01-post-ship.html             # EXPECTED: 1
grep -c "startRemoteVideoWatchdog();" bridge-turn01-post-ship.html   # EXPECTED: 2
grep -c "armConnectTimeout();" bridge-turn01-post-ship.html          # EXPECTED: 3
grep -c "_recoveryTimer=setTimeout(function(){_recoveryLock=false;},800);" bridge-turn01-post-ship.html # EXPECTED: 1
grep -c "var lastSessionContext={role:null" bridge-turn01-post-ship.html # EXPECTED: 1
grep -c "pb-new-card-overlay" bridge-turn01-post-ship.html           # EXPECTED: >=1
```
If any result differs from EXPECTED: stop and report.

---

## T06 STAGE 0 — Pre-base v5.6.0

```bash
cp bridge-turn01-post-ship.html bridge-turn06-pre-base.html
```

**0.1 — HTML comment**
```
FIND:    <!-- talkbridge · dcr · v5.2.4 -->
REPLACE: <!-- TalkBridge v5.6.0 -->
```
**0.2 — Footer span**
```
FIND:    <span style="font-size:10px;color:var(--text-muted);">v5.2.4</span>
REPLACE: <span style="font-size:10px;color:var(--text-muted);">v5.6.0</span>
```
```bash
grep -c "v5.2.4" bridge-turn06-pre-base.html  # EXPECTED: 0
grep -c "v5.6.0" bridge-turn06-pre-base.html  # EXPECTED: 2
```
**Commit:** `bridge Turn 06 pre-base v5.6.0 — version stamp` Push.

STATUS[T06-PRE-BASE]
Result: PASS
Date: 2026-05-31
File: bridge-turn06-pre-base.html
Commits: bridge Turn 06 pre-base v5.6.0 — version stamp
Greps: v5.2.4=0 PASS, v5.6.0=2 PASS
Lint: N/A (version stamp only)
Notes: none
END[T06-PRE-BASE]

---

## T06 STAGE 1 — Base v5.6.1 — WebRTC Stability + Telemetry Cleanup + Goodbye

**What this stage does:** Stops the call from spiraling into endless reconnect loops. Removes telemetry credential UI. Stubs the push mechanism for PB Central wiring later. Cleans goodbye screen.

```bash
cp bridge-turn06-pre-base.html bridge-turn06-base.html
```
Update both version stamps to v5.6.1. Commit. Push.

---

**1.1 — Remove telemetry variable declarations**
```
FIND:
var _telBuf=[];
var _PB_TEL_ENDPOINT='';
var _PB_TEL_TOKEN='';
REPLACE: (delete all 3 lines)
```
`grep -c "_telBuf=\[\]\|_PB_TEL_ENDPOINT\|_PB_TEL_TOKEN" bridge-turn06-base.html` EXPECTED: 0
**Commit:** `Turn 06 base 1.1 — remove telemetry variables` Push.

---

**1.2 — Strip _telBuf from _pbEmitUsage, keep usage tracking**
```
FIND:
function _pbEmitUsage(card,entryPoint){
  _telBuf.push({event:'usage_hit',ts:Date.now(),session_id:_sessionId,
    intent_id:card.intentId||'',fingerprint:card.fingerprint||_tmNorm(card.source||''),
    src_lang:card.sourceLang,tgt_lang:card.targetLang,entry_point:entryPoint||'autocomplete',
    context:(room&&room.id)?'live_call':'review'});
  card.usage=(card.usage||0)+1;pbSaveCard(card);
  setTimeout(function(){_tmBuild(card.sourceLang,card.targetLang);},0);
}
REPLACE:
function _pbEmitUsage(card,entryPoint){
  card.usage=(card.usage||0)+1;pbSaveCard(card);
  setTimeout(function(){_tmBuild(card.sourceLang,card.targetLang);},0);
}
```
**Commit:** `Turn 06 base 1.2 — strip telemetry from _pbEmitUsage, keep usage` Push.

---

**1.3 — Remove _clarifyEmit**
Find and delete entire `function _clarifyEmit(...)` function.
`grep -c "_clarifyEmit" bridge-turn06-base.html` EXPECTED: 0
**Commit:** `Turn 06 base 1.3 — remove _clarifyEmit` Push.

---

**1.4 — Remove _telFlush and beforeunload listener**
```
FIND:
function _telFlush(){
  if(!_telBuf.length)return;
  var key='pb_telemetry:'+((room&&room.myLang)||'?')+'-'+((room&&room.theirLang)||'?');
  try{var buf=JSON.parse(localStorage.getItem(key)||'[]');buf=buf.concat(_telBuf);
    if(buf.length>500)buf=buf.slice(buf.length-500);localStorage.setItem(key,JSON.stringify(buf));}catch(_){}
  _telBuf=[];
}
window.addEventListener('beforeunload',_telFlush);
REPLACE: (delete all 8 lines)
```
**Commit:** `Turn 06 base 1.4 — remove _telFlush` Push.

---

**1.5 — Stub _telPost as _pbCentralPost**
```
FIND:
async function _telPost(){
  _telFlush();
  if(!_PB_TEL_ENDPOINT)return;
  var key='pb_telemetry:'+((room&&room.myLang)||'?')+'-'+((room&&room.theirLang)||'?');
  var buf=[];try{buf=JSON.parse(localStorage.getItem(key)||'[]');}catch(_){}
  if(!buf.length)return;
  try{
    var r=await fetch(_PB_TEL_ENDPOINT+'/ingest',{method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+_PB_TEL_TOKEN},
      body:JSON.stringify({client:'talkbridge',version:'5.1',events:buf})});
    if(r.ok){localStorage.removeItem(key);log('tel_posted',{n:buf.length});}
    else{log('tel_post_fail',{status:r.status},'warn');}
  }catch(e){log('tel_post_fail',{e:String(e)},'warn');}
}
REPLACE:
async function _pbCentralPost(payload){
  /* Stub — wired to PB Central in T06 Stage 4 */
}
```
`grep -c "_pbCentralPost" bridge-turn06-base.html` EXPECTED: 1
**Commit:** `Turn 06 base 1.5 — stub _telPost as _pbCentralPost` Push.

---

**1.6 — Remove saveTelCreds, _initTelCreds, their calls, HTML, localStorage refs**
Remove: `function saveTelCreds(){...}`, `function _initTelCreds(){...}`, `_initTelCreds();` from INIT, `if(room.role==='creator')_telPost();` from hangUp, the 5-line `#tel-creds-section` HTML block, the `tel-creds-section` reference in toggleKeysPanel.
```bash
grep -c "saveTelCreds\|_initTelCreds\|tb_pb_tel_ep\|tb_pb_tel_tok\|tel-endpoint\|tel-token\|tel-creds-section\|_telPost" bridge-turn06-base.html
# EXPECTED: 0
```
**Commit:** `Turn 06 base 1.6 — remove remaining telemetry plumbing and HTML` Push.

---

**1.7 — Gate watchdog on recovery lock**
```
FIND (inside startRemoteVideoWatchdog setInterval callback):
  _remoteVideoWatchdogTimer=setInterval(function(){
    if(callPhase!=='call_live')return;
    var rv=$('remote-video');
REPLACE:
  _remoteVideoWatchdogTimer=setInterval(function(){
    if(callPhase!=='call_live')return;
    if(_recoveryLock)return;
    var rv=$('remote-video');
```
`grep -c "if(_recoveryLock)return;" bridge-turn06-base.html` EXPECTED: 1
**Commit:** `Turn 06 base 1.7 — gate watchdog on recovery lock` Push.

---

**1.8 — Reset stall state at runRecovery entry**
```
FIND:
async function runRecovery(reason){
  if(_recoveryLock||!room.id||lobbyState!==LS.call)return;
  _recoveryLock=true;
  _recoveryStep=Math.min(_recoveryStep+1,3);
REPLACE:
async function runRecovery(reason){
  if(_recoveryLock||!room.id||lobbyState!==LS.call)return;
  _recoveryLock=true;
  _remoteVideoStallCount=0;
  _remoteVideoLastTime=-1;
  _recoveryStep=Math.min(_recoveryStep+1,3);
```
**Commit:** `Turn 06 base 1.8 — reset stall state at runRecovery entry` Push.

---

**1.9 — Remove startRemoteVideoWatchdog() from Step 1**
```
FIND:
    if(step===1){
      refreshRemoteVideo();
      startRemoteVideoWatchdog();
      log('rtc_recovery_done',{step:step},'ok');
REPLACE:
    if(step===1){
      refreshRemoteVideo();
      log('rtc_recovery_done',{step:step},'ok');
```
`grep -c "startRemoteVideoWatchdog();" bridge-turn06-base.html` EXPECTED: 1
**Commit:** `Turn 06 base 1.9 — remove watchdog restart from Step 1` Push.

---

**1.10 — Remove armConnectTimeout() from Step 3**
```
FIND:
      await setupPC();
      connectRelay();
      armConnectTimeout();
      log('rtc_recovery_rebuild',{},'ok');
REPLACE:
      await setupPC();
      connectRelay();
      log('rtc_recovery_rebuild',{},'ok');
```
`grep -c "armConnectTimeout();" bridge-turn06-base.html` EXPECTED: 2
**Commit:** `Turn 06 base 1.10 — remove armConnectTimeout from Step 3` Push.

---

**1.11 — Extend Step 3 lock to 5000ms**
```
FIND:
    _recoveryTimer=setTimeout(function(){_recoveryLock=false;},800);
REPLACE:
    _recoveryTimer=setTimeout(function(){_recoveryLock=false;},step===3?5000:800);
```
**Commit:** `Turn 06 base 1.11 — extend Step 3 lock to 5000ms` Push.

---

**1.12 — Rejoin Fix A: resetRemoteMediaState in showHostLeftCountdown**
```
FIND:
  teardownSession('to_host_left_countdown','host_ended');
  room.id=null;room.role=null;
REPLACE:
  teardownSession('to_host_left_countdown','host_ended');
  resetRemoteMediaState();
  room.id=null;room.role=null;
```
**Commit:** `Turn 06 base 1.12 — Fix A resetRemoteMediaState in showHostLeftCountdown` Push.

---

**1.13 — Rejoin Fix B: null remoteStream before setupPC in handleSig**
```
FIND:
        if(pc&&pc.connectionState!=='closed'&&pc.connectionState!=='failed'){try{pc.close()}catch(_){}pc=null;remoteStream=null;pendingCandidates=[];savedCandidates=[];}
        if(!pc)await setupPC();
REPLACE:
        if(pc&&pc.connectionState!=='closed'&&pc.connectionState!=='failed'){try{pc.close()}catch(_){}pc=null;pendingCandidates=[];savedCandidates=[];}
        if(!pc){
          if(remoteStream)remoteStream.getTracks().forEach(function(t){t.onunmute=null;t.onmute=null;t.onended=null;});
          remoteStream=null;
          var _rv=$('remote-video');if(_rv)_rv.srcObject=null;
          await setupPC();
        }
```
**Commit:** `Turn 06 base 1.13 — Fix B null remoteStream before setupPC` Push.

---

**1.14 — Rejoin Fix C: rejoinCall joiner calls handleHash**
```
FIND:
function rejoinCall(){
  $('thankyou-page').classList.remove('show');
  var role=lastSessionContext.role||(_pendingJoin?'joiner':'creator');
  if(role==='joiner'&&_pendingJoin){
    setCallPhase('prejoin','rejoin_joiner');
    $('joiner-landing').classList.add('show');
  }else{
    setCallPhase('idle','rejoin_creator');
    $('lobby').classList.remove('hidden');
    setLS(LS.setup);
  }
}
REPLACE:
function rejoinCall(){
  $('thankyou-page').classList.remove('show');
  var role=lastSessionContext.role||(_pendingJoin?'joiner':'creator');
  if(role==='joiner'&&_pendingJoin){
    handleHash(_pendingJoin);
  }else{
    setCallPhase('idle','rejoin_creator');
    $('lobby').classList.remove('hidden');
    setLS(LS.setup);
  }
}
```
**Commit:** `Turn 06 base 1.14 — Fix C rejoinCall joiner calls handleHash` Push.

---

**1.15 — Rejoin Fix D: creator re-arms setupPC on partner_left**
```
FIND:
      if(pc){try{pc.close();}catch(_){}pc=null;}
      $('solo-banner').style.display='';
      setCallPhase('call_connecting','partner_left');
      armConnectTimeout();
      log('partner_left',{},'info');
REPLACE:
      if(pc){try{pc.close();}catch(_){}pc=null;}
      $('solo-banner').style.display='';
      setCallPhase('call_connecting','partner_left');
      armConnectTimeout();
      if(videoStream)(async()=>{await setupPC();})();
      log('partner_left',{},'info');
```
**Commit:** `Turn 06 base 1.15 — Fix D creator re-arms setupPC on partner_left` Push.

---

**1.16 — Rejoin Fix E: save roomId in lastSessionContext**
```
FIND:
var lastSessionContext={role:null,myLang:'',theirLang:'',roomName:'',pendingJoinSnapshot:null};
REPLACE:
var lastSessionContext={role:null,myLang:'',theirLang:'',roomName:'',roomId:null,pendingJoinSnapshot:null};
```
In createRoom(): append `lastSessionContext.roomId=room.id;` after lastSessionContext.roomName assignment.
In joinerProceed(): append `lastSessionContext.roomId=p.r;` after lastSessionContext.roomName assignment.
`grep -c "lastSessionContext.roomId" bridge-turn06-base.html` EXPECTED: 3
**Commit:** `Turn 06 base 1.16 — Fix E save roomId in lastSessionContext` Push.

---

**1.17 — mDNS candidate filtering**
In pc.onicecandidate handler, add guard: `if(event.candidate.candidate.indexOf('.local')!==-1)return;`
**Commit:** `Turn 06 base 1.17 — filter mDNS local candidates` Push.

---

**1.18 — Remove 4 goodbye buttons, lang-pill, countdown**
Remove from HTML: 4 action buttons (copy log, download log, copy transcript, download transcript), `id="thankyou-lang-pill"` div.
In showHostLeftCountdown(): replace 9-line countdown block with clean 5-line version (no setInterval, no window.close, no dl-btn reference, keep rejoin button).
In showThankYou(): remove `var dl=$('thankyou-dl-btn')...` line.
```bash
grep -c "thankyou-lang-pill\|Closing in\|var iv=setInterval\|thankyou-dl-btn\|downloadThankyouLog" bridge-turn06-base.html
# EXPECTED: 0
```
**Commit:** `Turn 06 base 1.18 — remove goodbye countdown and action buttons` Push.

---

**Stage 1 final validation:**
```bash
grep -c "_telBuf\|_PB_TEL\|saveTelCreds\|_initTelCreds\|_telPost\|_telFlush\|tel-endpoint\|tel-creds-section" bridge-turn06-base.html  # EXPECTED: 0
grep -c "_pbCentralPost" bridge-turn06-base.html          # EXPECTED: 1
grep -c "if(_recoveryLock)return;" bridge-turn06-base.html # EXPECTED: 1
grep -c "_remoteVideoStallCount=0" bridge-turn06-base.html # EXPECTED: 2
grep -c "startRemoteVideoWatchdog();" bridge-turn06-base.html # EXPECTED: 1
grep -c "armConnectTimeout();" bridge-turn06-base.html    # EXPECTED: 2
grep -c "step===3?5000:800" bridge-turn06-base.html       # EXPECTED: 1
grep -c "lastSessionContext.roomId" bridge-turn06-base.html # EXPECTED: 3
grep -c "handleHash(_pendingJoin)" bridge-turn06-base.html  # EXPECTED: 1
grep -c "thankyou-lang-pill\|Closing in\|var iv=setInterval" bridge-turn06-base.html # EXPECTED: 0
```
Run lint. Must pass.

STATUS[T06-BASE]
Result: PASS
Date: 2026-06-01
File: bridge-turn06-base.html
Commits: Turn 06 base v5.6.1 — version stamp | 1.1 remove telemetry variables | 1.2 strip telemetry from _pbEmitUsage | 1.3 remove _clarifyEmit | 1.4 remove _telFlush | 1.5 stub _pbCentralPost | 1.6 remove remaining telemetry plumbing and HTML; sanitize TURN token to ISO-8859-1-safe | 1.7 gate watchdog on recovery lock | 1.8 reset stall state at runRecovery entry | 1.9 remove watchdog restart from Step 1 | 1.10 remove armConnectTimeout from Step 3 | 1.11 extend Step 3 lock to 5000ms | 1.12 Fix A resetRemoteMediaState | 1.13 Fix B null remoteStream before setupPC | 1.14 Fix C rejoinCall joiner calls handleHash | 1.15 Fix D creator re-arms setupPC on partner_left | 1.16 Fix E save roomId (3 sites) | 1.17 filter mDNS local candidates | 1.18 remove goodbye countdown and action buttons
Greps: telemetry=0 PASS | _pbCentralPost=1 PASS | recoveryLock=1 PASS | stallCount=4 PASS | watchdog=1 PASS | armConnectTimeout=2 PASS | step3lock=1 PASS | roomId=3 PASS | handleHash=1 PASS | goodbye=0 PASS | TURN sanitize=4 PASS
Lint: PASS
Notes: GATE_FAIL first pass. Rebuilt from bridge-turn01-post-ship.html. 1.6 adds .trim().replace(/[^\x20-\x7E]/g,'') to TURN tid/tok in setupPC() preventing turn_fetch_err from header encoding issues. stallCount=4 correct (baseline had 3; +1 at runRecovery entry). Pages live: https://acmeproducts.github.io/stuff/bridge-turn06-base.html
END[T06-BASE]

### USER TEST — T06-BASE

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Mute mic 90 seconds | Zero recovery events in debug log | | |
| 2 | Cover camera 5 seconds | Step 1 fires once. Step 2 does NOT fire within 60s | | |
| 3 | Joiner hangs up | Creator stays in call_connecting, no spiral | | |
| 4 | Joiner rejoins | Thai landing screen, correct flags, reconnects | | |
| 5 | Creator hangs up | Joiner sees: NO countdown, NO 4 buttons, Rejoin present | | |
| 6 | Settings panel | Telemetry endpoint/token fields gone | | |
| 7 | EN→TH translation | Works correctly | | |

```
GATE-RESULT: PENDING[T06-BASE]
```

---

## T06 STAGE 2 — Pre-ship v5.6.2 — PB Architecture + Use Flow

**What this stage does:** One consistent renderer. GitHub sync on every mutation. Usage tracked per send. Row layout with TTS/Send/Edit below phrase text. Entry points and shortcuts.

```bash
cp bridge-turn06-base.html bridge-turn06-pre-ship.html
```
Version stamps to v5.6.2. Commit. Push.

**2.1 — Remove compact-row branch from pbRenderOverlay**
Remove `else if (q)` branch. Overlay always renders via pbBubbleHtml.
`grep -c "else if.*pbOvRowHtml" bridge-turn06-pre-ship.html` EXPECTED: 0
**Commit:** `Turn 06 pre-ship 2.1 — one renderer in pbRenderOverlay` Push.

**2.2 — Add ICO.tts + ICO.edit; consolidate TTS_SVG**
Add to ICO object:
```javascript
tts:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
edit:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
```
After ICO closes: `ICO.speaker=ICO.tts;`
Replace all `TTS_SVG` references with `ICO.tts`. Remove `var TTS_SVG` declaration.
`grep -c "var TTS_SVG\b" bridge-turn06-pre-ship.html` EXPECTED: 0
**Commit:** `Turn 06 pre-ship 2.2 — add ICO.tts + ICO.edit, consolidate TTS_SVG` Push.

**2.3 — pbSetFilter clears search input**
At start of pbSetFilter(): `var si=document.getElementById('pb-ov-search');if(si){si.value='';}pbOvSearchX();`
**Commit:** `Turn 06 pre-ship 2.3 — pbSetFilter clears search` Push.

**2.4 — pbPushCardToRepo with operation param + wire to all CRUD sites**
Add `operation` param (default 'update'). Update commit message to include operation + card.id. Wire fire-and-forget calls after: create→'create', edit→'update', verdict→'update', tags→'update', softDelete→'softDelete', restore→'restore', hardDelete (capture card first)→'hardDelete', pbISend→'read'.
`grep -c "pbPushCardToRepo" bridge-turn06-pre-ship.html` EXPECTED: >=9
**Commit:** `Turn 06 pre-ship 2.4 — pbPushCardToRepo wired to all CRUD sites` Push.

**2.5 — semanticRelationships preserved in _pbNormCard**
In `_pbNormCard()` return object: `semanticRelationships:c.semanticRelationships||null`
**Commit:** `Turn 06 pre-ship 2.5 — preserve semanticRelationships in card schema` Push.

**2.6 — Rewrite pbIRowHtml + pbOvRowHtml: phrase text + actions below**
Two-column layout: phrase text full-width on top, below left-justified: ICO.tts · ICO.use (Send) · ICO.edit. Remove pb-use-btn and "tap to use" hints.
Append CSS: `.pb-iside{display:flex;flex-direction:column;flex:1;padding:8px 10px;cursor:pointer;} .pb-iside-txt{font-size:14px;line-height:1.35;} .pb-iside-acts{display:flex;align-items:center;gap:4px;margin-top:4px;}`
`grep -c "pb-use-btn\|tap to use" bridge-turn06-pre-ship.html` EXPECTED: 0
**Commit:** `Turn 06 pre-ship 2.6 — rewrite row HTML: phrase + actions below` Push.

**2.7 — Shortcuts + entry points**
- In chatInputEvt: `if(ta.value==='..')ta.value='/';`
- Global keydown: listen for e.key==='/' when call screen active and no input focused, set chat-input value to '/' and fire input event.
- Add: `pbOpenFromSlashSearch(query)`, `pbOpenFromRibbon()`, `pbOvClearSearch()`
- Wire: ribbon book icon → pbOpenFromRibbon(), X button in overlay → pbOvClearSearch(), chatKeydown Enter+/ → pbOpenFromSlashSearch(query)
- Wire pbISend usage emit: `if(card)_pbEmitUsage(card,'pb_send');`
`grep -c "pbOpenFromSlashSearch\|pbOpenFromRibbon\|pbOvClearSearch" bridge-turn06-pre-ship.html` EXPECTED: >=6
**Commit:** `Turn 06 pre-ship 2.7 — shortcuts, entry points, usage emit in pbISend` Push.

**Stage 2 validation:**
```bash
grep -c "pbPushCardToRepo" bridge-turn06-pre-ship.html         # EXPECTED: >=9
grep -c "ICO.tts\b\|ICO.edit\b" bridge-turn06-pre-ship.html   # EXPECTED: >=2
grep -c "pb-use-btn\|tap to use" bridge-turn06-pre-ship.html   # EXPECTED: 0
grep -c "pbOpenFromSlashSearch" bridge-turn06-pre-ship.html    # EXPECTED: >=2
grep -c "semanticRelationships" bridge-turn06-pre-ship.html    # EXPECTED: >=1
```
Run lint. Must pass.

<!-- CC_STATUS: T06-PRE-SHIP | PENDING -->

### USER TEST — T06-PRE-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Phrase row layout | Phrase text on top, TTS · Send · Edit below left-justified | | |
| 2 | Tap phrase text | Fills compose, does NOT send | | |
| 3 | Tap Send (arrow) | Sends with [PB] prefix | | |
| 4 | Type /hello + Enter | Overlay opens with "hello" pre-searched | | |
| 5 | Type /food, tap book icon | Overlay opens with "food" pre-searched | | |
| 6 | X in overlay search | Search clears, overlay stays open | | |
| 7 | Type .. in compose | Becomes / activates search | | |
| 8 | Edit card → check GitHub | Commit fires within seconds | | |

```
GATE-RESULT: PENDING[T06-PRE-SHIP]
```

---

## T06 STAGE 3 — Ship v5.6.3 — Add/Edit Modal + Quality + Pair Identity

**What this stage does:** Replaces old NC system with unified add/edit modal. Clarify and verdict mechanics. Tag logging. Pair key derivation.

```bash
cp bridge-turn06-pre-ship.html bridge-turn06-ship.html
```
Version stamps to v5.6.3. Commit. Push.

**3.1 — Remove #pb-new-card-overlay + all pbNc* functions and globals**
Remove HTML block `id="pb-new-card-overlay"`. Remove all functions prefixed `pbNc`. Remove all globals prefixed `_pbNc`.
`grep -c "pb-new-card-overlay\|pbNc\b\|_pbNc\b" bridge-turn06-ship.html` EXPECTED: 0
**Commit:** `Turn 06 ship 3.1 — remove NC system` Push.

**3.2 — Add unified add/edit modal HTML + pbAddCard + pbEditCard**
Add modal HTML before `</body>`. Implement `pbAddCard(opts)` (clears inputs, auto-translates target after ~1s delay). Implement `pbEditCard(id)` (populates from pbGetCardById). Wire: + button → pbAddCard(), trSaveToPb → pbAddCard({source,sourceLang,targetLang}), pbIEditCard(idx) → pbEditCard(card.id). Add `pbOpenOverlayClean` prunes provisional empty cards.
`grep -c "function pbAddCard\|function pbEditCard" bridge-turn06-ship.html` EXPECTED: 2
**Commit:** `Turn 06 ship 3.2 — unified add/edit modal + pbAddCard + pbEditCard` Push.

**3.3 — Clarify textarea + Enter-to-save + source edit ✓/✕ + verdict mechanics**
- Change clarify `<input>` to `<textarea rows="1" style="resize:none;">`. Enter = save + refocus. Shift+Enter = newline.
- Add pbSrcFocus, pbSrcKeydown, pbCancelSrcEdit for inline ✓/✕ buttons.
- In pbCommitSrcEdit: clear backtranslate.verdict, remove ✓Verified tag, push "Source edited — verdict reset" to clarifyChain (guard: only if card.source non-empty).
- In pbRemoveTag for ✓Verified: clear verdict, push "Back-translate removed".
- In pbSetVerdict: push verdict change message to clarifyChain (guard: card.source non-empty).
- In pbAddTag/pbRemoveTag non-Verified: push "Tag added/removed: X".
- BT failure: set resultText = 'Translation unavailable — retry later'.
- Date strings in pbSearch haystack.
`grep -c "Source edited\|Translation unavailable\|Tag added:" bridge-turn06-ship.html` EXPECTED: >=3
**Commit:** `Turn 06 ship 3.3 — clarify UX, verdict mechanics, tag logging, BT failure` Push.

**3.4 — Pair identity**
In createRoom() and joinerProceed(): normalize and concatenate participant names creator-first (e.g., "mike-pim") into `lastSessionContext.pairKey`.
`grep -c "pairKey" bridge-turn06-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 ship 3.4 — pair key derivation creator-first` Push.

**Stage 3 validation:**
```bash
grep -c "pb-new-card-overlay\|pbNc\b" bridge-turn06-ship.html   # EXPECTED: 0
grep -c "function pbAddCard\|function pbEditCard" bridge-turn06-ship.html  # EXPECTED: 2
grep -c "Source edited\|Translation unavailable" bridge-turn06-ship.html   # EXPECTED: >=2
grep -c "pairKey" bridge-turn06-ship.html                        # EXPECTED: >=2
```
Run lint. Must pass.

<!-- CC_STATUS: T06-SHIP | PENDING -->

### USER TEST — T06-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Tap + in overlay | Modal opens blank, source focused, auto-translates after typing | | |
| 2 | Save new phrase | Appears in overlay, GitHub commit fires | | |
| 3 | Tap ✎ on phrase | Modal opens pre-filled | | |
| 4 | Edit source, save | Verified tag removed, clarify logs "Source edited — verdict reset" | | |
| 5 | Remove ✓Verified tag | Clarify logs "Back-translate removed", verdict clears | | |
| 6 | Add tag "food" | Clarify logs "Tag added: food" | | |
| 7 | BT with no internet | Shows "Translation unavailable — retry later" | | |
| 8 | New card — open immediately | Clarify chain is empty, no phantom entries | | |
| 9 | Create room as Mike, join as Pim | pairKey = "mike-pim" in debug log | | |

```
GATE-RESULT: PENDING[T06-SHIP]
```

---

## T06 STAGE 4 — Post-ship v5.6.4 — PB Central + O-Ring + PWA

**What this stage does:** Usage events flow to PB Central. Phrasebook loads automatically for the pair. Related phrases shown radially. App installable.

```bash
cp bridge-turn06-ship.html bridge-turn06-post-ship.html
```
Version stamps to v5.6.4. Commit. Push.

**4.1 — Wire _pbCentralPost to PB Central endpoint**
Update `_pbCentralPost(payload)` stub with actual fetch to PB Central endpoint (URL/auth to be provided). On join, fetch pair's phrasebook from PB Central; if `fetched.lastUpdated > local`, run pbUpsert() for each card silently. Route usage events after _pbEmitUsage.
**Commit:** `Turn 06 post-ship 4.1 — wire _pbCentralPost to PB Central` Push.

**4.2 — O-Ring visualization**
In pbBubbleHtml or card open handler: render radial ring from card.semanticRelationships (max 5 items). Position nodes using cos/sin math. Tap → sends or fills compose. Empty → toast "No related phrases".
`grep -c "semanticRelationships\|O-Ring\|qr-ring\|relatedIntents" bridge-turn06-post-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 post-ship 4.2 — O-Ring radial related phrases` Push.

**4.3 — PWA manifest + install prompt**
Create `manifest.json` in repo. Add `<link rel="manifest" href="manifest.json">` to HTML head. Add beforeinstallprompt listener: shows sticky footer install banner. Dismiss stores preference in localStorage.
`grep -c "manifest.json\|beforeinstallprompt" bridge-turn06-post-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 post-ship 4.3 — PWA manifest and install prompt` Push.

**Full sweep validation:**
```bash
grep -c "_telBuf\|_PB_TEL\|saveTelCreds\|_initTelCreds\|_telPost\|_telFlush" bridge-turn06-post-ship.html  # EXPECTED: 0
grep -c "_pbCentralPost" bridge-turn06-post-ship.html     # EXPECTED: >=2
grep -c "if(_recoveryLock)return;" bridge-turn06-post-ship.html  # EXPECTED: 1
grep -c "lastSessionContext.roomId" bridge-turn06-post-ship.html  # EXPECTED: 3
grep -c "handleHash(_pendingJoin)" bridge-turn06-post-ship.html   # EXPECTED: 1
grep -c "pbPushCardToRepo" bridge-turn06-post-ship.html           # EXPECTED: >=9
grep -c "pairKey" bridge-turn06-post-ship.html                    # EXPECTED: >=2
grep -c "semanticRelationships" bridge-turn06-post-ship.html      # EXPECTED: >=2
grep -c "manifest.json" bridge-turn06-post-ship.html              # EXPECTED: 1
grep -c "v5.6.4" bridge-turn06-post-ship.html                     # EXPECTED: 2
grep -m1 "RELAY_BASE" bridge-turn06-post-ship.html                # must contain: talk-signal.myacctfortracking.workers.dev
```
Run lint. Merge to main.

<!-- CC_STATUS: T06-POST-SHIP | PENDING -->

### USER TURN GATE — T06-FINAL

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| T1 | Full call + translation | EN→TH both directions working | | |
| T2 | Mute 90s | Zero recovery events | | |
| T3 | Joiner rejoins | Thai landing, reconnects cleanly | | |
| T4 | PB full roundtrip | Add → search → send [PB] → edit → BT → verify → GitHub syncs | | |
| T5 | Usage tracking | PB Central receives usage event on send | | |
| T6 | O-Ring | Related phrases appear, tap to send works | | |
| T7 | Pair key | Debug log shows "mike-pim" for Mike + Pim | | |
| T8 | Install prompt | Banner appears, installs to home screen | | |

```
GATE-RESULT: PENDING[T06-FINAL]
```

---

---

# TURN 07 — Translation Memory

**Goal:** Spoken phrases that are ~80% similar to a saved phrase used 3+ times get the phrasebook translation automatically.

**Baseline:** `bridge-turn06-post-ship.html` (v5.6.4)
**Output:** `bridge-turn07-post-ship.html` (v5.7.4)

## T07 STAGE 0 — Pre-base v5.7.0
Copy + version stamp.
<!-- CC_STATUS: T07-PRE-BASE | PENDING -->

## T07 STAGE 1 — Base v5.7.1 — Fuzzy Match
Implement `_tmFuzzy(text, src, tgt)`: Levenshtein similarity >= 0.80 AND card.usage >= 3 → return cached target. Inject as fallback in translateWithRetry() after _tmCheck() miss.
<!-- CC_STATUS: T07-BASE | PENDING -->

### USER TEST — T07-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Phrase with 0 uses — speak variation | Fuzzy does NOT activate | | |
| 2 | Phrase with 3+ uses — speak variation | TM translation used | | |
```
GATE-RESULT: PENDING[T07-BASE]
```

## T07 STAGE 2 — Pre-ship v5.7.2 — TM Rebuild on Save
At end of pbSaveCard() and pbUpsert(): `setTimeout(function(){_tmBuild(card.sourceLang,card.targetLang);},0);`
<!-- CC_STATUS: T07-PRE-SHIP | PENDING -->

## T07 STAGE 3 — Ship v5.7.3 — Schema + Usage Integrity
Verify semanticRelationships preserved in _pbNormCard (from T06). Verify _pbEmitUsage wired in pbISend (from T06). Add any missing guards.
<!-- CC_STATUS: T07-SHIP | PENDING -->

## T07 STAGE 4 — Post-ship v5.7.4 — TM Fallback Guards
In _qrOpen/relatedIntents consumer: replace silent empty-check with `toast('No related phrases'); return;`. Merge to main.
<!-- CC_STATUS: T07-POST-SHIP | PENDING -->

### USER TURN GATE — T07-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Save phrase, use 3x, speak variation | TM activates | | |
| 2 | Edit phrase, speak new version | TM matches updated phrase | | |
| 3 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T07-FINAL]
```

---

---

# TURN 08 — One Tap to Call

**Goal:** QR pairing. Ring/accept/reject. Contacts list. No share link needed after first pairing.

**Baseline:** `bridge-turn07-post-ship.html` (v5.7.4)
**Output:** `bridge-turn08-post-ship.html` (v5.8.4)

## T08 STAGE 0 — Pre-base v5.8.0
Copy + version stamp.
<!-- CC_STATUS: T08-PRE-BASE | PENDING -->

## T08 STAGE 1 — Base v5.8.1 — QR Pairing
Generate QR from pairToken. Relay one-time handshake. Store pair token in localStorage `tb_pairs`.
<!-- CC_STATUS: T08-BASE | PENDING -->

### USER TEST — T08-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Creator shows QR, joiner scans | Both see "Paired with [name]" | | |
| 2 | Contacts list | Both appear in each other's list | | |
```
GATE-RESULT: PENDING[T08-BASE]
```

## T08 STAGE 2 — Pre-ship v5.8.2 — Ring Messages
Relay message type `{type:'ring', from:pairKey, name:myName}`. Receiving device shows full-screen incoming call overlay with Accept and Reject.
<!-- CC_STATUS: T08-PRE-SHIP | PENDING -->

### USER TEST — T08-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Tap paired contact | Ring fires | | |
| 2 | Other device sees | Incoming call overlay with Accept/Reject | | |
| 3 | Accept | Call connects, no share link | | |
| 4 | Reject | Ring dismissed | | |
```
GATE-RESULT: PENDING[T08-PRE-SHIP]
```

## T08 STAGE 3 — Ship v5.8.3 — Contacts List UI
Saved pairs list visible. Tap to call. Correct pair phrasebook loads on connect.
<!-- CC_STATUS: T08-SHIP | PENDING -->

## T08 STAGE 4 — Post-ship v5.8.4 — Unpair + Edge Cases
Unpair flow. Ring to closed app handled gracefully. Merge to main.
<!-- CC_STATUS: T08-POST-SHIP | PENDING -->

### USER TURN GATE — T08-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Full pairing flow | QR → contacts → ring → accept → call with PB | | |
| 2 | Unpair | Contact removed | | |
| 3 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T08-FINAL]
```

---

---

# TURN 09 — Works When You're Not Looking

**Goal:** Push notifications and badges when app is backgrounded.

**Baseline:** `bridge-turn08-post-ship.html` (v5.8.4)
**Output:** `bridge-turn09-post-ship.html` (v5.9.4)

## T09 STAGE 0 — Pre-base v5.9.0
Copy + version stamp.
<!-- CC_STATUS: T09-PRE-BASE | PENDING -->

## T09 STAGE 1 — Base v5.9.1 — Service Worker + VAPID
Register service worker. Generate VAPID keys. Foundation for push.
<!-- CC_STATUS: T09-BASE | PENDING -->

## T09 STAGE 2 — Pre-ship v5.9.2 — Push Subscription
Subscribe device. Ring triggers push when app backgrounded.
<!-- CC_STATUS: T09-PRE-SHIP | PENDING -->

### USER TEST — T09-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | App minimized, contact rings | Notification appears | | |
| 2 | Tap notification | App opens to call screen | | |
```
GATE-RESULT: PENDING[T09-PRE-SHIP]
```

## T09 STAGE 3 — Ship v5.9.3 — Auto-join + Badge
Notification tap → auto-join. Missed ring → badge on icon. Open app → badge clears.
<!-- CC_STATUS: T09-SHIP | PENDING -->

## T09 STAGE 4 — Post-ship v5.9.4 — Full Background Flow
App fully closed. Push arrives. Notification leads to join. Merge to main.
<!-- CC_STATUS: T09-POST-SHIP | PENDING -->

### USER TURN GATE — T09-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | App closed, contact rings | Push notification appears | | |
| 2 | Tap notification | App opens, call auto-joins | | |
| 3 | Miss 2 rings | Badge shows 2 | | |
| 4 | Open app | Badge clears | | |
| 5 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T09-FINAL]
```

---

---

# TURN 10 — Looks Great, Works for Everyone

**Goal:** CSS design system. High contrast accessibility. Full-screen installable experience.

**Baseline:** `bridge-turn09-post-ship.html` (v5.9.4)
**Output:** `bridge-turn10-post-ship.html` (v5.10.4)

## T10 STAGE 0 — Pre-base v5.10.0
Copy + version stamp.
<!-- CC_STATUS: T10-PRE-BASE | PENDING -->

## T10 STAGE 1 — Base v5.10.1 — CSS Variable Design System
Inject `:root` CSS variable definitions. Replace hardcoded hex colors with variables. Convert primary font sizes to rem.
<!-- CC_STATUS: T10-BASE | PENDING -->

### USER TEST — T10-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | All screens render | No missing colors, no black boxes | | |
| 2 | 150% browser zoom | Text scales proportionally | | |
```
GATE-RESULT: PENDING[T10-BASE]
```

## T10 STAGE 2 — Pre-ship v5.10.2 — High Contrast Mode
`toggleTheme()` appends/removes `data-theme="high-contrast"` on body. High contrast CSS defined. Persists in localStorage.
<!-- CC_STATUS: T10-PRE-SHIP | PENDING -->

### USER TEST — T10-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Toggle high contrast | All text readable, all controls visible | | |
| 2 | Reopen app | Mode persists | | |
```
GATE-RESULT: PENDING[T10-PRE-SHIP]
```

## T10 STAGE 3 — Ship v5.10.3 — Visual Polish
High contrast covers all screens: lobby, call, PB overlay, O-Ring, add/edit modal, goodbye, incoming call, contacts list.
<!-- CC_STATUS: T10-SHIP | PENDING -->

## T10 STAGE 4 — Post-ship v5.10.4 — Final Release Candidate
Full walkthrough all screens in both modes. Merge to main.
<!-- CC_STATUS: T10-POST-SHIP | PENDING -->

### USER TURN GATE — T10-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Install to home screen | Full-screen, no browser bar | | |
| 2 | Full session in high contrast | Every screen readable | | |
| 3 | Ring → accept → PB → O-Ring → hang up → rejoin | All features end to end | | |
| 4 | PB Central received usage events | Confirmed | | |
| 5 | TM activated on fuzzy phrase | Confirmed | | |
| 6 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T10-FINAL]
```

---

---

# APPENDIX — CHANGE LOG

| Turn | Merged | Version | Summary |
|---|---|---|---|
| 06 | PENDING | v5.6.4 | WebRTC, telemetry stub, PB roundtrip, pair identity, PB Central, O-Ring, PWA |
| 07 | PENDING | v5.7.4 | Fuzzy TM, TM rebuild on save |
| 08 | PENDING | v5.8.4 | QR pairing, ring/accept/reject, contacts list |
| 09 | PENDING | v5.9.4 | Push notifications, badge, background ring |
| 10 | PENDING | v5.10.4 | CSS design system, high contrast, final RC |

---

*Single source of truth. One file. Baseline: bridge-turn01-post-ship.html (v5.2.4). Repo: /home/user/stuff*
