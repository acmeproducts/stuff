# TalkBridge — Master Development & Test Record
**Version:** 2.0 | **Created:** 2026-05-30 | **Status:** ACTIVE
**Baseline:** `bridge-turn01-post-ship.html` (v5.2.4 · SHA f56b291 · 4001 lines)
**Repo:** `/home/user/stuff`
**Turns:** 04 → 10 | **Stages per Turn:** 5 | **Total Releases:** 35

---

## FOR CC: HOW TO USE THIS DOCUMENT

### This file is the only authority
Read this file in full before touching anything. Do not read CLAUDE.md or claude-bridge.md first. Do not apply rules or preferences from any other source. If anything in your context conflicts with an instruction in this file, this file wins. No exceptions.

### Your responsibilities
- Execute one substage at a time. Commit and push after every individual change.
- After completing all substages in a stage, update the checkpoint sentinel using `str_replace`, commit this file alongside the HTML file, and push.
- Then **STOP**. Post a status message to the user. Wait.
- Never proceed past a checkpoint without explicit `GATE_PASS` from the user.
- Never patch a failing stage forward. If the user posts `GATE_FAIL`, stop and wait for instruction.

### Checkpoint update format
Find the sentinel `PENDING[CHECKPOINT-ID]` and replace it with:
```
STATUS[CHECKPOINT-ID]
Result: PASS / ISSUE
Date: YYYY-MM-DD
File: bridge-turnNN-STAGE.html
Commits: [one per line]
Greps: [each validation grep + actual result]
Lint: PASS / FAIL
Notes: [any deviations or issues]
END[CHECKPOINT-ID]
```

### Test gate format — USER fills these in
After the user tests a stage, they will fill in the Actual column and mark Pass/Fail. Then post `GATE_PASS` or `GATE_FAIL [description]`.

### Fail protocol
`GATE_FAIL` means: **revert to the input file for that stage and retry from scratch.** Never patch a failed stage. The prior stage's output file is always the clean starting point for a retry.

---

## IMMUTABLE RULES

```
R1.  Each turn's baseline is the previous turn's post-ship file. Turn 04 starts from
     bridge-turn01-post-ship.html. No substitutions. Ever.
R2.  One atomic change per commit. Commit and push before the next change.
R3.  After every push: verify the commit appears on origin.
R4.  New CSS always appended at end of <style> block. Never injected mid-block.
R5.  Never touch:
       RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
       RELAY_WS   = 'wss://' + RELAY_BASE
       RELAY_APP  = 'talk-say-v1'
R6.  Never touch unless this document explicitly says otherwise:
       startDeepgram()   stopDeepgram()   reconcileDeepgramState()
       translateWithRetry()   translate()   handleChatMsg()   onDGFinal()
       LANGS   DG_LANGS   TTS_LOCALE   _loadFastText()   _detectLangAsync()
R7.  FIND text not found exactly as written → STOP. Report. Do not guess.
R8.  Lint fails → STOP. Do not push. Report.
R9.  Validation grep count differs from EXPECTED → STOP. Report.
R10. No stage begins until the previous stage is committed, pushed, and checkpoint updated.
R11. Stage model: Pre-base is a version-stamped copy only. The other four stages each
     contain real work. Post-ship is a dev stage, not a seal. Device testing gates
     happen between turns, not within stages.
R12. Fail = revert to stage input file, retry. Never patch forward.
```

### Lint helper — run before every validation block
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

# TURN 04 — Making the Call Work Reliably

**Goal:** Fix all the issues that cause the call to spiral into endless reconnect loops, break rejoining, and show extra credential fields that lead nowhere. After this turn, two people can make a video call, speak, see translations, and rejoin cleanly without anything dying.

**Baseline:** `bridge-turn01-post-ship.html` (v5.2.4)
**Output:** `bridge-turn04-post-ship.html` (v5.4.4)
**Execution prompt:** use `cc-turn04-execute-staged.md` alongside this file.

---

## T04 PRE-FLIGHT — Run before touching anything

```bash
cd /home/user/stuff

grep -m1 "v5\." bridge-turn01-post-ship.html
# EXPECTED: <!-- talkbridge · dcr · v5.2.4 -->

grep -c "" bridge-turn01-post-ship.html
# EXPECTED: 4001

git status --short
# EXPECTED: empty or untracked only

git log --oneline origin/main..main
# EXPECTED: empty

# Confirm 6 key find-texts exist exactly:
grep -c "var _telBuf=\[\];" bridge-turn01-post-ship.html                                        # EXPECTED: 1
grep -c "if(_recoveryLock||!room.id||lobbyState!==LS.call)return;" bridge-turn01-post-ship.html # EXPECTED: 1
grep -c "startRemoteVideoWatchdog();" bridge-turn01-post-ship.html                              # EXPECTED: 2
grep -c "armConnectTimeout();" bridge-turn01-post-ship.html                                     # EXPECTED: 3
grep -c "_recoveryTimer=setTimeout(function(){_recoveryLock=false;},800);" bridge-turn01-post-ship.html # EXPECTED: 1
grep -c "var lastSessionContext={role:null" bridge-turn01-post-ship.html                        # EXPECTED: 1
```

If any count differs from EXPECTED: post the failure and stop.

---

## T04 STAGE 0 — Pre-base v5.4.0

Version stamp copy only. No other changes.

```bash
cp bridge-turn01-post-ship.html bridge-turn04-pre-base.html
```

**Change 0.1 — HTML comment**
```
FIND:    <!-- talkbridge · dcr · v5.2.4 -->
REPLACE: <!-- TalkBridge v5.4.0 -->
```

**Change 0.2 — Footer span**
```
FIND:    <span style="font-size:10px;color:var(--text-muted);">v5.2.4</span>
REPLACE: <span style="font-size:10px;color:var(--text-muted);">v5.4.0</span>
```

**Validation:**
```bash
grep -c "v5.2.4" bridge-turn04-pre-base.html  # EXPECTED: 0
grep -c "v5.4.0" bridge-turn04-pre-base.html  # EXPECTED: 2
```

**Commit:** `bridge Turn 04 pre-base v5.4.0 — version stamp` Push.

<!-- CC_STATUS: T04-PRE-BASE
STATUS[T04-PRE-BASE]
Result: PASS
Date: 2026-05-31
File: bridge-turn04-pre-base.html
Commits: 162c334 bridge Turn 04 — add v5.4.0–v5.4.4 stage files to main
Greps: grep -c "v5.2.4" → 0 (PASS) | grep -c "v5.4.0" → 2 (PASS)
Lint: PASS
Notes: File was already present and correctly stamped on branch from prior session commit 162c334. Version stamps confirmed clean.
END[T04-PRE-BASE]
-->

---

## T04 STAGE 1 — Base v5.4.1 — Telemetry Cleanup

**What this stage does:** Removes the telemetry credential UI (endpoint + token input fields) that appeared in settings but led nowhere useful. The underlying push mechanism is stubbed — renamed to `_pbCentralPost()` with an empty body — so the call sites remain intact and can be wired to PB Central in Turn 06. Usage tracking (card.usage++) is preserved.

```bash
cp bridge-turn04-pre-base.html bridge-turn04-base.html
```

Update both version stamps to v5.4.1 first.
**Commit:** `Turn 04 base version stamp v5.4.1` Push.

---

**1.1 — Remove telemetry variable declarations**
```
FIND:
var _telBuf=[];
var _PB_TEL_ENDPOINT='';
var _PB_TEL_TOKEN='';
REPLACE: (delete all 3 lines)
```
`grep -c "_telBuf=\[\]\|_PB_TEL_ENDPOINT\|_PB_TEL_TOKEN" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.1 — remove telemetry variable declarations` Push.

---

**1.2 — Strip _telBuf push from _pbEmitUsage, preserve usage tracking**
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
`grep -c "_pbEmitUsage" bridge-turn04-base.html` EXPECTED: >=1
**Commit:** `Turn 04 base 1.2 — strip telemetry from _pbEmitUsage, keep usage tracking` Push.

---

**1.3 — Remove _clarifyEmit entirely**
```
FIND:
function _clarifyEmit(card,beforeSrc,beforeTgt,afterSrc,afterTgt){
  _telBuf.push({event:'clarify',ts:Date.now(),session_id:_sessionId,
    intent_id:card.intentId||'',src_lang:card.sourceLang,tgt_lang:card.targetLang,
    before_source:beforeSrc,before_target:beforeTgt,after_source:afterSrc,after_target:afterTgt});
  setTimeout(function(){_tmBuild(card.sourceLang,card.targetLang);},0);
}
REPLACE: (delete entire function)
```
`grep -c "_clarifyEmit" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.3 — remove _clarifyEmit` Push.

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
`grep -c "_telFlush\|beforeunload.*_telFlush" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.4 — remove _telFlush and beforeunload listener` Push.

---

**1.5 — STUB _telPost as _pbCentralPost (do NOT delete — wire later in Turn 06)**
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
  /* Stub — wired to PB Central in Turn 06 */
}
```
`grep -c "_pbCentralPost" bridge-turn04-base.html` EXPECTED: 1
**Commit:** `Turn 04 base 1.5 — stub _telPost as _pbCentralPost for Turn 06 wiring` Push.

---

**1.6 — Remove saveTelCreds**
```
FIND:
function saveTelCreds(){
  var ep=(document.getElementById('tel-endpoint')||{}).value||'';
  var tok=(document.getElementById('tel-token')||{}).value||'';
  _PB_TEL_ENDPOINT=ep.trim();_PB_TEL_TOKEN=tok.trim();
  if(ep.trim())localStorage.setItem('tb_pb_tel_ep',ep.trim());
  if(tok.trim())localStorage.setItem('tb_pb_tel_tok',tok.trim());
}
REPLACE: (delete entire function)
```
`grep -c "saveTelCreds\|tb_pb_tel_ep\|tb_pb_tel_tok" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.6 — remove saveTelCreds` Push.

---

**1.7 — Remove _initTelCreds**
```
FIND:
function _initTelCreds(){
  var ep=localStorage.getItem('tb_pb_tel_ep')||'';var tok=localStorage.getItem('tb_pb_tel_tok')||'';
  _PB_TEL_ENDPOINT=ep;_PB_TEL_TOKEN=tok;
  var epEl=document.getElementById('tel-endpoint');if(epEl&&ep)epEl.value=ep;
  var tokEl=document.getElementById('tel-token');if(tokEl&&tok)tokEl.value=tok;
}
REPLACE: (delete entire function)
```
`grep -c "_initTelCreds" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.7 — remove _initTelCreds` Push.

---

**1.8 — Remove _telPost() call from hangUp()**
```
FIND:
  if(room.role==='creator')_telPost();
REPLACE: (delete this line)
```
`grep -c "_telPost" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.8 — remove _telPost call from hangUp` Push.

---

**1.9 — Remove _initTelCreds() from INIT**
```
FIND:
pbAutoSeed();populateLangs();renderRecent();syncMic();syncCam();syncTranscriptToggleButton();syncTranscriptTtsButton();syncBtn();_loadFastText();_syncFtStatus();_initTelCreds();
REPLACE:
pbAutoSeed();populateLangs();renderRecent();syncMic();syncCam();syncTranscriptToggleButton();syncTranscriptTtsButton();syncBtn();_loadFastText();_syncFtStatus();
```
**Commit:** `Turn 04 base 1.9 — remove _initTelCreds from init` Push.

---

**1.10 — Remove telemetry HTML block**
```
FIND:
          <div id="tel-creds-section" style="display:none;"><div class="lobby-label" style="margin-bottom:6px;">Telemetry endpoint <span style="font-size:10px;opacity:.6;">(host only)</span></div>
          <input class="lobby-input" id="tel-endpoint" type="text" placeholder="https://…" oninput="saveTelCreds()">
          <div class="lobby-label" style="margin-bottom:6px;margin-top:10px;">Telemetry token</div>
          <input class="lobby-input" id="tel-token" type="password" placeholder="Bearer token — stored locally" oninput="saveTelCreds()">
          </div>
REPLACE: (delete all 5 lines)
```
`grep -c "tel-endpoint\|tel-token\|tel-creds-section" bridge-turn04-base.html` EXPECTED: 0
**Commit:** `Turn 04 base 1.10 — remove telemetry HTML inputs` Push.

---

**1.11 — Remove tel-creds-section ref from toggleKeysPanel**
```
FIND:
  var ts=document.getElementById('tel-creds-section');if(ts)ts.style.display=(!open&&!room.role||!open&&room.role==='creator')?'':'none';
REPLACE: (delete this line)
```

**Stage 1 final validation:**
```bash
grep -c "_telBuf\|_PB_TEL_ENDPOINT\|_PB_TEL_TOKEN\|_telPost\|_telFlush\|saveTelCreds\|_initTelCreds\|tel-endpoint\|tel-token\|tel-creds-section\|tb_pb_tel" bridge-turn04-base.html
# EXPECTED: 0
grep -c "_pbCentralPost" bridge-turn04-base.html  # EXPECTED: 1
```
Run lint. Must pass.

<!-- CC_STATUS: T04-BASE | PENDING -->

### USER TEST — T04-BASE

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Open settings panel | Telemetry endpoint and token fields are GONE | | |
| 2 | Basic call: speak English | Thai translation appears on other side | | |
| 3 | Card usage count | Increments when phrase used | | |

```
GATE-RESULT: PENDING[T04-BASE]
```

---

## T04 STAGE 2 — Pre-ship v5.4.2 — Recovery System Fixes

**What this stage does:** Fixes the core flapping problem. The watchdog was firing every 1000ms but the lock only held for 800ms, so recovery cascaded from Step 1 → 2 → 3 automatically. Five surgical changes stop the cascade.

```bash
cp bridge-turn04-base.html bridge-turn04-pre-ship.html
```

Update both version stamps to v5.4.2.
**Commit:** `Turn 04 pre-ship version stamp v5.4.2` Push.

---

**2.1 — Gate watchdog on recovery lock**
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
`grep -c "if(_recoveryLock)return;" bridge-turn04-pre-ship.html` EXPECTED: 1
**Commit:** `Turn 04 pre-ship 2.1 — gate watchdog on recovery lock` Push.

---

**2.2 — Reset stall state at runRecovery entry**
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
`grep -n "_remoteVideoStallCount=0" bridge-turn04-pre-ship.html` EXPECTED: 2 lines
**Commit:** `Turn 04 pre-ship 2.2 — reset stall state at runRecovery entry` Push.

---

**2.3 — Remove startRemoteVideoWatchdog() from Step 1**
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
`grep -c "startRemoteVideoWatchdog();" bridge-turn04-pre-ship.html` EXPECTED: 1
**Commit:** `Turn 04 pre-ship 2.3 — remove watchdog restart from Step 1` Push.

---

**2.4 — Remove armConnectTimeout() from Step 3**
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
`grep -c "armConnectTimeout();" bridge-turn04-pre-ship.html` EXPECTED: 2
**Commit:** `Turn 04 pre-ship 2.4 — remove armConnectTimeout from Step 3` Push.

---

**2.5 — Extend lock to 5000ms for Step 3**
```
FIND:
    clearTimeout(_recoveryTimer);
    _recoveryTimer=setTimeout(function(){_recoveryLock=false;},800);
REPLACE:
    clearTimeout(_recoveryTimer);
    _recoveryTimer=setTimeout(function(){_recoveryLock=false;},step===3?5000:800);
```
`grep -c "step===3?5000:800" bridge-turn04-pre-ship.html` EXPECTED: 1

**Stage 2 final validation:**
```bash
grep -c "if(_recoveryLock)return;" bridge-turn04-pre-ship.html      # EXPECTED: 1
grep -c "_remoteVideoStallCount=0" bridge-turn04-pre-ship.html      # EXPECTED: 2
grep -c "startRemoteVideoWatchdog();" bridge-turn04-pre-ship.html   # EXPECTED: 1
grep -c "armConnectTimeout();" bridge-turn04-pre-ship.html          # EXPECTED: 2
grep -c "step===3?5000:800" bridge-turn04-pre-ship.html             # EXPECTED: 1
```
Run lint. Must pass.

**Commit:** `Turn 04 pre-ship 2.5 — extend Step 3 lock to 5000ms` Push.

<!-- CC_STATUS: T04-PRE-SHIP | PENDING -->

### USER TEST — T04-PRE-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Active call — mute mic 90 seconds | ZERO recovery steps fire in debug log | | |
| 2 | Active call — unmute | DG reactivates, translation resumes | | |
| 3 | Cover joiner camera 5+ seconds | Step 1 fires once. Step 2 does NOT fire within 60 seconds | | |

```
GATE-RESULT: PENDING[T04-PRE-SHIP]
```

---

## T04 STAGE 3 — Ship v5.4.3 — Rejoin Fixes + ICE

**What this stage does:** Fixes all rejoining scenarios. Adds mDNS candidate filtering to improve connection reliability on certain networks.

```bash
cp bridge-turn04-pre-ship.html bridge-turn04-ship.html
```

Update both version stamps to v5.4.3.
**Commit:** `Turn 04 ship version stamp v5.4.3` Push.

---

**3.0 — Add roomId to lastSessionContext**
```
FIND:
var lastSessionContext={role:null,myLang:'',theirLang:'',roomName:'',pendingJoinSnapshot:null};
REPLACE:
var lastSessionContext={role:null,myLang:'',theirLang:'',roomName:'',roomId:null,pendingJoinSnapshot:null};
```
**Commit:** `Turn 04 ship 3.0 — add roomId to lastSessionContext` Push.

---

**3.1 — Fix A: resetRemoteMediaState in showHostLeftCountdown**
```
FIND:
  teardownSession('to_host_left_countdown','host_ended');
  room.id=null;room.role=null;
REPLACE:
  teardownSession('to_host_left_countdown','host_ended');
  resetRemoteMediaState();
  room.id=null;room.role=null;
```
**Commit:** `Turn 04 ship 3.1 — Fix A resetRemoteMediaState in showHostLeftCountdown` Push.

---

**3.2 — Fix B: null remoteStream before setupPC in handleSig**
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
**Commit:** `Turn 04 ship 3.2 — Fix B null remoteStream before setupPC` Push.

---

**3.3 — Fix C: rejoinCall joiner branch calls handleHash**
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
`grep -c "handleHash(_pendingJoin)" bridge-turn04-ship.html` EXPECTED: 1
**Commit:** `Turn 04 ship 3.3 — Fix C rejoinCall joiner calls handleHash` Push.

---

**3.4 — Fix D: creator re-arms setupPC on partner_left**
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
**Commit:** `Turn 04 ship 3.4 — Fix D creator re-arms setupPC on partner_left` Push.

---

**3.5 — Fix E: save roomId in createRoom()**
```
FIND:
  room.id=uid();room.role='creator';
  lastSessionContext.role='creator';lastSessionContext.myLang=room.myLang;lastSessionContext.theirLang=room.theirLang;lastSessionContext.roomName=room.name;
REPLACE:
  room.id=uid();room.role='creator';
  lastSessionContext.role='creator';lastSessionContext.myLang=room.myLang;lastSessionContext.theirLang=room.theirLang;lastSessionContext.roomName=room.name;lastSessionContext.roomId=room.id;
```
**Commit:** `Turn 04 ship 3.5 — Fix E save roomId in createRoom` Push.

---

**3.6 — Fix E: save roomId in joinerProceed()**
```
FIND:
    room.id=p.r;room.myLang=p.tl;room.theirLang=p.ml;room.name=p.n||'';room.role='joiner';
    lastSessionContext.role='joiner';lastSessionContext.myLang=p.tl;lastSessionContext.theirLang=p.ml;lastSessionContext.roomName=p.n||'';
REPLACE:
    room.id=p.r;room.myLang=p.tl;room.theirLang=p.ml;room.name=p.n||'';room.role='joiner';
    lastSessionContext.role='joiner';lastSessionContext.myLang=p.tl;lastSessionContext.theirLang=p.ml;lastSessionContext.roomName=p.n||'';lastSessionContext.roomId=p.r;
```
`grep -c "lastSessionContext.roomId" bridge-turn04-ship.html` EXPECTED: 3
**Commit:** `Turn 04 ship 3.6 — Fix E save roomId in joinerProceed` Push.

---

**3.7 — ICE1: mDNS candidate filtering**

Find the `pc.onicecandidate` handler. Inside the callback, immediately after `if(event.candidate)` (or at the start of the non-null candidate path), add:

```javascript
if(event.candidate.candidate.indexOf('.local')!==-1)return;
```

`grep -c "indexOf.*\.local" bridge-turn04-ship.html` EXPECTED: 1
**Commit:** `Turn 04 ship 3.7 — ICE1 filter mDNS local candidates` Push.

**Stage 3 final validation:**
```bash
grep -c "lastSessionContext.roomId" bridge-turn04-ship.html    # EXPECTED: 3
grep -c "handleHash(_pendingJoin)" bridge-turn04-ship.html     # EXPECTED: 1
grep -c "videoStream)(async" bridge-turn04-ship.html           # EXPECTED: 1
grep -c "t.onunmute=null" bridge-turn04-ship.html              # EXPECTED: >=2
grep -c "indexOf.*\.local" bridge-turn04-ship.html             # EXPECTED: 1
```
Run lint. Must pass.

<!-- CC_STATUS: T04-SHIP | PENDING -->

### USER TEST — T04-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Joiner hangs up | Creator sees partner disconnected, stays in call_connecting, NO spiral | | |
| 2 | Joiner opens same invite link | Landing screen in Thai, correct flags, Thai join button | | |
| 3 | Joiner taps join | Both reconnect within 10 seconds, translation works | | |
| 4 | Creator hangs up — joiner rejoins | Joiner landing repopulates correctly | | |
| 5 | Creator rejoins | Same room UUID, not a new one | | |

```
GATE-RESULT: PENDING[T04-SHIP]
```

---

## T04 STAGE 4 — Post-ship v5.4.4 — Goodbye Screen Cleanup

**What this stage does:** Removes the countdown timer and four action buttons from the goodbye screen. Cleans up orphaned DOM references.

```bash
cp bridge-turn04-ship.html bridge-turn04-post-ship.html
```

Update both version stamps to v5.4.4.
**Commit:** `Turn 04 post-ship version stamp v5.4.4` Push.

---

**4.1 — Remove 4 action buttons from goodbye HTML**
```
FIND:
  <button class="thankyou-btn" onclick="copyLogText();toast('Log copied')">📋 Copy log</button>
  <button class="thankyou-btn" onclick="downloadThankyouLog()">⬇ Download log</button>
  <button class="thankyou-btn" onclick="copyTr();toast('Transcript copied')">📋 Copy transcript</button>
  <button class="thankyou-btn" id="thankyou-dl-btn" onclick="exportTxt()">⬇ Download transcript</button>
REPLACE: (delete all 4 lines)
```
**Commit:** `Turn 04 post-ship 4.1 — remove 4 action buttons from goodbye` Push.

---

**4.2 — Remove lang-pill from goodbye HTML**
```
FIND:
  <div class="joiner-lang-pill" id="thankyou-lang-pill"></div>
REPLACE: (delete this line)
```
**Commit:** `Turn 04 post-ship 4.2 — remove lang-pill from goodbye` Push.

---

**4.3 — Remove countdown from showHostLeftCountdown**
```
FIND:
  var n=5,t=$('thankyou-title'),s=$('thankyou-sub'),lp=$('thankyou-lang-pill');
  if(t)t.textContent='Host ended the call.';
  if(s)s.textContent=bil('close_tab');
  if(lp)lp.textContent=_pendingJoin&&_pendingJoin.tl?gL(_pendingJoin.tl).flag:(ty_lang?gL(ty_lang).flag:'');
  var rb=$('thankyou-rejoin-btn');if(rb&&_pendingJoin){rb.style.display='';rb.textContent=bil('rejoin');}
  var dl=$('thankyou-dl-btn');if(dl)dl.textContent=bil('dl_transcript');
  $('thankyou-page').classList.add('show');
  history.replaceState({tbView:'thankyou'},'',location.pathname);
  var iv=setInterval(function(){n--;if(t)t.textContent=n>0?'Host ended the call. Closing in '+n+'s…':'Host ended the call.';if(n<=0){clearInterval(iv);try{window.close();}catch(_){}}},1000);
REPLACE:
  var t=$('thankyou-title'),s=$('thankyou-sub');
  if(t)t.textContent='Host ended the call.';
  if(s)s.textContent=bil('close_tab');
  var rb=$('thankyou-rejoin-btn');if(rb&&_pendingJoin){rb.style.display='';rb.textContent=bil('rejoin');}
  $('thankyou-page').classList.add('show');
  history.replaceState({tbView:'thankyou'},'',location.pathname);
```
**Commit:** `Turn 04 post-ship 4.3 — remove countdown from showHostLeftCountdown` Push.

---

**4.4 — Remove orphaned dl-btn ref from showThankYou**
```
FIND:
  var dl=$('thankyou-dl-btn');if(dl)dl.textContent=bil('dl_transcript');
REPLACE: (delete this line)
```
**Commit:** `Turn 04 post-ship 4.4 — remove orphaned dl-btn ref` Push.

**Full sweep validation:**
```bash
grep -c "_telBuf\|_PB_TEL\|saveTelCreds\|_initTelCreds\|tel-endpoint\|tel-creds-section" bridge-turn04-post-ship.html  # EXPECTED: 0
grep -c "_pbCentralPost" bridge-turn04-post-ship.html          # EXPECTED: 1
grep -c "if(_recoveryLock)return;" bridge-turn04-post-ship.html # EXPECTED: 1
grep -c "_remoteVideoStallCount=0" bridge-turn04-post-ship.html # EXPECTED: 2
grep -c "startRemoteVideoWatchdog();" bridge-turn04-post-ship.html # EXPECTED: 1
grep -c "armConnectTimeout();" bridge-turn04-post-ship.html    # EXPECTED: 2
grep -c "step===3?5000:800" bridge-turn04-post-ship.html       # EXPECTED: 1
grep -c "lastSessionContext.roomId" bridge-turn04-post-ship.html # EXPECTED: 3
grep -c "handleHash(_pendingJoin)" bridge-turn04-post-ship.html # EXPECTED: 1
grep -c "indexOf.*\.local" bridge-turn04-post-ship.html        # EXPECTED: 1
grep -c "thankyou-lang-pill\|Closing in\|var iv=setInterval\|thankyou-dl-btn" bridge-turn04-post-ship.html # EXPECTED: 0
grep -c "window.close" bridge-turn04-post-ship.html            # EXPECTED: 1
grep -c "v5.4.4" bridge-turn04-post-ship.html                  # EXPECTED: 2
grep -m1 "RELAY_BASE" bridge-turn04-post-ship.html             # must contain: talk-signal.myacctfortracking.workers.dev
```
Run lint. Must pass.

**Then merge to main:**
```bash
git checkout main && git merge - && git push origin main
git log --oneline origin/main..main  # EXPECTED: empty
git log --oneline -8                 # Report this output
```

<!-- CC_STATUS: T04-POST-SHIP | PENDING -->

### USER TURN GATE — T04-FINAL (all 8 must pass)

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| T1 | EN speaker + TH speaker | Each sees other's translation correctly | | |
| T2 | Mute 90 seconds | Zero recovery events in debug log | | |
| T3 | Joiner hangs up | Creator in call_connecting, no spiral, max 1 recovery in 12s | | |
| T4 | Joiner rejoins | Thai landing screen, reconnects in <10s | | |
| T5 | Creator hangs up | Joiner sees: NO countdown, NO 4 buttons, Rejoin present | | |
| T6 | Creator rejoins | Same room UUID reconnects | | |
| T7 | Cover camera 5s | Step 1 fires once, Step 2 does NOT fire in 60s | | |
| T8 | Credentials after all tests | DG key, CF TURN, GitHub PAT all still present | | |

```
GATE-RESULT: PENDING[T04-FINAL]
```

**CC: After this gate passes, begin Turn 05 pre-flight. Do not start until user posts GATE_PASS.**

---

---

# TURN 05 — The Phrasebook Works for Real

**Goal:** Two people on a call can use the phrasebook together end-to-end. Find, send, save, edit, back-translate, verify. Every mutation syncs to GitHub. Usage tracked per send. Related phrases field preserved for Turn 06 O-Ring.

**Baseline:** `bridge-turn04-post-ship.html` (v5.4.4)
**Output:** `bridge-turn05-post-ship.html` (v5.5.4)

---

## T05 PRE-FLIGHT

```bash
grep -m1 "v5\." bridge-turn04-post-ship.html  # EXPECTED: v5.4.4
grep -c "function pbRenderOverlay" bridge-turn04-post-ship.html  # EXPECTED: 1
grep -c "function pbPushCardToRepo" bridge-turn04-post-ship.html  # EXPECTED: 1
grep -c "pb-new-card-overlay" bridge-turn04-post-ship.html       # EXPECTED: >=1 (will be removed in stage 3)
grep -c "_pbCentralPost" bridge-turn04-post-ship.html            # EXPECTED: 1
```

## T05 STAGE 0 — Pre-base v5.5.0

```bash
cp bridge-turn04-post-ship.html bridge-turn05-pre-base.html
```
Version stamps to v5.5.0. Commit. Push.

<!-- CC_STATUS: T05-PRE-BASE | PENDING -->

---

## T05 STAGE 1 — Base v5.5.1 — PB Architecture

**What this stage does:** One consistent renderer for all phrase cards. Every mutation (create, edit, delete, restore) fires a GitHub sync. Usage is wired to every phrase send. The semanticRelationships field is preserved on every card save so Turn 06 O-Ring can use it.

```bash
cp bridge-turn05-pre-base.html bridge-turn05-base.html
```
Version stamps to v5.5.1. Commit. Push.

**1.1 — Remove compact-row branch from pbRenderOverlay**
Find pbRenderOverlay. Remove the `else if (q)` branch that renders compact rows. Overlay always renders via pbBubbleHtml.
`grep -c "else if.*pbOvRowHtml\|_pbICards.*map.*pbOvRowHtml" bridge-turn05-base.html` EXPECTED: 0
**Commit:** `Turn 05 base 1.1 — remove compact-row branch, one renderer` Push.

**1.2 — Add ICO.tts and ICO.edit; consolidate TTS_SVG**
Add to ICO object:
```javascript
tts:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
edit:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
```
After ICO closes: `ICO.speaker=ICO.tts;`
Remove any standalone `var TTS_SVG=` variable; replace all references with `ICO.tts`.
`grep -c "var TTS_SVG\b" bridge-turn05-base.html` EXPECTED: 0
**Commit:** `Turn 05 base 1.2 — add ICO.tts + ICO.edit, consolidate TTS_SVG` Push.

**1.3 — pbSetFilter clears search input**
In pbSetFilter(), add at start: `var si=document.getElementById('pb-ov-search');if(si){si.value='';}`
**Commit:** `Turn 05 base 1.3 — pbSetFilter clears search on chip change` Push.

**1.4 — Extend pbPushCardToRepo with operation param**
```
FIND:
async function pbPushCardToRepo(card){
REPLACE:
async function pbPushCardToRepo(card,operation){
  operation=operation||'update';
```
Update commit message string inside the function to include operation and card.id.
**Commit:** `Turn 05 base 1.4 — pbPushCardToRepo accepts operation parameter` Push.

**1.5 — Wire pbPushCardToRepo to all CRUD sites (fire-and-forget, no await)**
Wire after: pbSaveNewCard/pbAddCard→'create', pbCommitSrcEdit→'update', pbCommitTgtEdit→'update', pbSetVerdict→'update', pbAddTag→'update', pbRemoveTag→'update', pbSoftDelete→'softDelete', pbRestoreCard→'restore', pbHardDelete (capture card first)→'hardDelete', pbISend→'read'
`grep -c "pbPushCardToRepo" bridge-turn05-base.html` EXPECTED: >=9
**Commit:** `Turn 05 base 1.5 — wire pbPushCardToRepo to all CRUD call sites` Push.

**1.6 — semanticRelationships preserved in _pbNormCard**
In `_pbNormCard()`, ensure the return object maps: `semanticRelationships:c.semanticRelationships||null`
`grep -c "semanticRelationships" bridge-turn05-base.html` EXPECTED: >=1
**Commit:** `Turn 05 base 1.6 — preserve semanticRelationships in card schema` Push.

**Stage 1 validation:**
```bash
grep -c "pbPushCardToRepo" bridge-turn05-base.html  # EXPECTED: >=9
grep -c "ICO.tts\b\|ICO.edit\b" bridge-turn05-base.html  # EXPECTED: >=2
grep -c "var TTS_SVG\b" bridge-turn05-base.html  # EXPECTED: 0
grep -c "semanticRelationships" bridge-turn05-base.html  # EXPECTED: >=1
```

<!-- CC_STATUS: T05-BASE | PENDING -->

### USER TEST — T05-BASE

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Edit any phrase card | GitHub commit fires within seconds | | |
| 2 | Switch catalog chip | Search field clears automatically | | |
| 3 | PB overlay in search mode | Renders as full bubbles, not compact rows | | |

```
GATE-RESULT: PENDING[T05-BASE]
```

---

## T05 STAGE 2 — Pre-ship v5.5.2 — Use Flow

**What this stage does:** How you access the phrasebook during a call. Row layout. Entry points. Shortcuts.

```bash
cp bridge-turn05-base.html bridge-turn05-pre-ship.html
```
Version stamps to v5.5.2. Commit. Push.

**2.1 — Rewrite pbIRowHtml: phrase text + TTS/Send/Edit below**
Replace entire pbIRowHtml function with two-column layout: phrase text full-width on top, below it left-justified: TTS button · Send button · Edit button. Same pattern for pbOvRowHtml.
CSS to append: `.pb-iside{display:flex;flex-direction:column;flex:1;padding:8px 10px;cursor:pointer;} .pb-iside-txt{font-size:14px;line-height:1.35;} .pb-iside-acts{display:flex;align-items:center;gap:4px;margin-top:4px;}`
**Commit:** `Turn 05 pre-ship 2.1 — rewrite pbIRowHtml + pbOvRowHtml: phrase + actions below` Push.

**2.2 — Remove pb-use-btn and tap-to-use from pbBubbleHtml**
`grep -c "pb-use-btn\|tap to use\|Tap to use" bridge-turn05-pre-ship.html` EXPECTED: 0
**Commit:** `Turn 05 pre-ship 2.2 — remove pb-use-btn and tap-to-use` Push.

**2.3 — .. alias in chatInputEvt**
In chatInputEvt, before any other logic: `if(ta.value==='..')ta.value='/';`
**Commit:** `Turn 05 pre-ship 2.3 — .. mobile alias activates phrase search` Push.

**2.4 — Global / keydown shortcut**
Add near INIT: document.addEventListener for e.key==='/' that focuses chat-input and sets value to '/' when call screen is active and no input is focused.
**Commit:** `Turn 05 pre-ship 2.4 — global / keydown opens phrase search` Push.

**2.5 — pbOpenFromSlashSearch + pbOpenFromRibbon + pbOvClearSearch**
```javascript
function pbOpenFromSlashSearch(query){pbOpenOverlay();setTimeout(function(){var inp=document.getElementById('pb-ov-search');if(inp&&query){inp.value=query;inp.dispatchEvent(new Event('input',{bubbles:true}));}},80);}
function pbOpenFromRibbon(){var ta=$('chat-input');var val=(ta&&ta.value||'').trim();var query=(val.startsWith('/')&&!val.startsWith('//'))?val.slice(1).trim():'';if(query){pbOpenFromSlashSearch(query);}else{pbOpenOverlayClean();}}
function pbOvClearSearch(){var inp=document.getElementById('pb-ov-search');if(inp){inp.value='';inp.focus();}if(typeof pbRenderOverlay==='function')pbRenderOverlay();}
```
Wire: ribbon book icon → pbOpenFromRibbon(). X button in overlay → pbOvClearSearch(). chatKeydown Enter+/ → pbOpenFromSlashSearch(query).
**Commit:** `Turn 05 pre-ship 2.5 — entry points: slash search, ribbon, overlay X` Push.

**Stage 2 validation:**
```bash
grep -c "pb-use-btn\|tap to use" bridge-turn05-pre-ship.html  # EXPECTED: 0
grep -c "pbOpenFromSlashSearch\|pbOpenFromRibbon\|pbOvClearSearch" bridge-turn05-pre-ship.html  # EXPECTED: >=6
```

<!-- CC_STATUS: T05-PRE-SHIP | PENDING -->

### USER TEST — T05-PRE-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Phrase row layout | Phrase text top, TTS · Send · Edit below left-justified | | |
| 2 | Tap phrase text | Fills compose. Does NOT send. | | |
| 3 | Tap Send (arrow) | Sends immediately with [PB] prefix | | |
| 4 | Type /hello + Enter | Overlay opens pre-searched with "hello" | | |
| 5 | Type /food, tap book icon | Overlay opens with "food" pre-searched | | |
| 6 | X in overlay search | Search clears. Overlay stays open. | | |
| 7 | Type .. in compose | Becomes / and activates search | | |

```
GATE-RESULT: PENDING[T05-PRE-SHIP]
```

---

## T05 STAGE 3 — Ship v5.5.3 — Add/Edit Modal

**What this stage does:** Replaces the old NC system with a unified add/edit modal. One modal handles both adding from scratch and editing an existing phrase.

```bash
cp bridge-turn05-pre-ship.html bridge-turn05-ship.html
```
Version stamps to v5.5.3. Commit. Push.

**3.1 — Remove #pb-new-card-overlay HTML block**
`grep -c "pb-new-card-overlay" bridge-turn05-ship.html` EXPECTED: 0
**Commit:** `Turn 05 ship 3.1 — remove pb-new-card-overlay HTML` Push.

**3.2 — Remove all pbNc* functions and _pbNc* globals**
Remove: pbOpenNewCard, pbNcClose, pbNcCancel, pbSaveNewCard, pbNcAutoTranslate, pbNcOnSrcBlur, pbNcSrcKeydown, pbNcTagSugg, pbNcTagKey, pbNcSetVerdict, pbNcRunBt, pbNcTogPanel, pbNcClarifyKey, pbNcSpeakSrc, pbNcSpeakTgt, pbNcRenderTagChips, pbNcAddTag, pbNcRemoveTag, pbNcConfirmDiscard.
Remove globals: _pbNcSrcLang, _pbNcTgtLang, _pbNcDirty, _pbNcVerdict, _pbNcAttr, _pbNcTags, _pbNcCatalogIds, _pbNcClarifyNotes.
`grep -c "pbNc\b\|_pbNc\b" bridge-turn05-ship.html` EXPECTED: 0
**Commit:** `Turn 05 ship 3.2 — remove all pbNc functions and globals` Push.

**3.3 — Add unified add/edit modal HTML + pbAddCard + pbEditCard**
Add modal HTML before `</body>`. Implement `pbAddCard(opts)` and `pbEditCard(id)` controller functions. Wire: + button → pbAddCard(), trSaveToPb → pbAddCard({source,sourceLang,targetLang}), pbIEditCard(idx) → pbEditCard(card.id).
`grep -c "function pbAddCard\|function pbEditCard" bridge-turn05-ship.html` EXPECTED: 2
**Commit:** `Turn 05 ship 3.3 — unified add/edit modal + pbAddCard + pbEditCard` Push.

**3.4 — pbOpenOverlayClean prunes provisional empty cards**
`grep -c "prune\|provisional" bridge-turn05-ship.html` EXPECTED: >=1
**Commit:** `Turn 05 ship 3.4 — pbOpenOverlayClean prunes provisional cards` Push.

<!-- CC_STATUS: T05-SHIP | PENDING -->

### USER TEST — T05-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Tap + in overlay | Modal opens blank, source focused | | |
| 2 | Type source, wait 1s | Target auto-translates | | |
| 3 | Save new phrase | Appears in overlay. GitHub commit fires. | | |
| 4 | Tap ✎ on a phrase row | Modal opens pre-filled | | |
| 5 | Edit source, save | GitHub commit fires | | |
| 6 | Save from transcript bubble | Modal opens pre-filled with spoken text | | |
| 7 | New card — open immediately | Clarify chain is empty (no phantom entries) | | |

```
GATE-RESULT: PENDING[T05-SHIP]
```

---

## T05 STAGE 4 — Post-ship v5.5.4 — Quality + Usage Emit

**What this stage does:** Clarify UX improvements, verdict mechanics, tag logging, BT failure message, date search, usage emit wired to pbISend.

```bash
cp bridge-turn05-ship.html bridge-turn05-post-ship.html
```
Version stamps to v5.5.4. Commit. Push.

**4.1 — Clarify textarea + Enter-to-save**
Change clarify input from `<input type="text">` to `<textarea rows="1" style="resize:none;">`. Add pbClarifyKey: Enter saves + refocuses, Shift+Enter = newline.
**Commit:** `Turn 05 post-ship 4.1 — clarify textarea + Enter-to-save` Push.

**4.2 — Source edit inline ✓/✕ buttons**
Add pbSrcFocus, pbSrcKeydown, pbCancelSrcEdit. Show/hide button row on focus/blur.
**Commit:** `Turn 05 post-ship 4.2 — source edit inline confirm/cancel` Push.

**4.3 — Source edit resets verdict + removes ✓Verified**
In pbCommitSrcEdit: clear backtranslate.verdict, filter ✓Verified from tags, push "Source edited — verdict reset" to clarifyChain (only if card.source non-empty).
`grep -c "Source edited" bridge-turn05-post-ship.html` EXPECTED: 1
**Commit:** `Turn 05 post-ship 4.3 — source edit auto-resets verdict` Push.

**4.4 — Removing ✓Verified clears verdict**
In pbRemoveTag for ✓Verified: clear verdict, push "Back-translate removed" to clarifyChain.
**Commit:** `Turn 05 post-ship 4.4 — removing Verified tag clears verdict` Push.

**4.5 — BT verdict changes log clarify entries**
In pbSetVerdict: push "Back-translate verified/flagged/removed" to clarifyChain (guard: only if card.source non-empty).
**Commit:** `Turn 05 post-ship 4.5 — BT verdict changes auto-log clarify` Push.

**4.6 — Tag add/remove logs clarify**
In pbAddTag/pbRemoveTag for non-Verified tags: push "Tag added: X" / "Tag removed: X".
**Commit:** `Turn 05 post-ship 4.6 — tag changes logged in clarify chain` Push.

**4.7 — BT failure shows clear message**
In pbRunBT catch/empty path: set resultText to 'Translation unavailable — retry later'.
**Commit:** `Turn 05 post-ship 4.7 — BT failure shows unavailable message` Push.

**4.8 — Date search in pbSearch**
Add 4 date format strings from card.createdAt to pbSearch haystack.
**Commit:** `Turn 05 post-ship 4.8 — date strings added to pbSearch` Push.

**4.9 — Usage emit wired to pbISend**
In pbISend(), after sendChat(): `if(card)_pbEmitUsage(card,'pb_send');`
`grep -c "_pbEmitUsage.*pb_send\|pb_send.*_pbEmitUsage" bridge-turn05-post-ship.html` EXPECTED: 1
**Commit:** `Turn 05 post-ship 4.9 — usage emit wired to pbISend` Push.

**Full sweep validation:**
```bash
grep -c "function pbClarifyKey" bridge-turn05-post-ship.html    # EXPECTED: 1
grep -c "function pbSrcFocus" bridge-turn05-post-ship.html      # EXPECTED: 1
grep -c "Source edited" bridge-turn05-post-ship.html            # EXPECTED: 1
grep -c "Translation unavailable" bridge-turn05-post-ship.html  # EXPECTED: >=1
grep -c "Tag added:\|Tag removed:" bridge-turn05-post-ship.html # EXPECTED: >=2
grep -c "pb_send" bridge-turn05-post-ship.html                  # EXPECTED: >=1
grep -c "semanticRelationships" bridge-turn05-post-ship.html    # EXPECTED: >=1
grep -c "pbPushCardToRepo" bridge-turn05-post-ship.html         # EXPECTED: >=9
```
Run lint. Merge to main.

<!-- CC_STATUS: T05-POST-SHIP | PENDING -->

### USER TURN GATE — T05-FINAL

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Full roundtrip | Add → search → send [PB] → edit → BT → verify → GitHub shows commits | | |
| 2 | Usage count | Increases on card every time it is sent via [PB] | | |
| 3 | Edit source | ✓Verified removed, clarify logs "Source edited — verdict reset" | | |
| 4 | Remove Verified tag | Clarify logs "Back-translate removed", verdict clears | | |
| 5 | Add tag "restaurant" | Clarify logs "Tag added: restaurant" | | |
| 6 | BT with no internet | Shows "Translation unavailable — retry later" | | |
| 7 | Search today's date | Cards from today appear | | |
| 8 | All Turn 04 tests | Still pass | | |

```
GATE-RESULT: PENDING[T05-FINAL]
```

---

---

# TURN 06 — The Phrasebook Knows Who You're Talking To

**Goal:** PB loads automatically for the right pair. Usage flows to PB Central. Related phrases display in a radial ring. PWA install prompt added.

**Baseline:** `bridge-turn05-post-ship.html` (v5.5.4)
**Output:** `bridge-turn06-post-ship.html` (v5.6.4)
**Dependency:** PB Central endpoint URL and auth must be available before pre-ship executes.

## T06 STAGE 0 — Pre-base v5.6.0
Copy. Version stamp. Commit.
<!-- CC_STATUS: T06-PRE-BASE | PENDING -->

## T06 STAGE 1 — Base v5.6.1 — Pair Identity
In createRoom() and joinerProceed(): derive pairKey = creatorName + '-' + joinerName (normalized lowercase, creator first). Store in lastSessionContext.pairKey.
**Commit per change.** Lint. Push.
<!-- CC_STATUS: T06-BASE | PENDING -->

### USER TEST — T06-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Create room as "Mike", join as "Pim" | pairKey = "mike-pim" in debug log | | |
| 2 | Same two people, different sessions | Same pairKey every time | | |
```
GATE-RESULT: PENDING[T06-BASE]
```

## T06 STAGE 2 — Pre-ship v5.6.2 — PB Central Connection
On join: fetch pair's phrasebook from PB Central. If PB Central lastUpdated > local, run pbUpsert() for each fetched card silently. Route usage events (_pbCentralPost) to PB Central endpoint. Wire _pbCentralPost stub from Turn 04.
**Commit per change.** Lint. Push.
<!-- CC_STATUS: T06-PRE-SHIP | PENDING -->

### USER TEST — T06-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Join a call | Phrasebook loads automatically | | |
| 2 | PB Central has newer version | Local PB updates silently on join | | |
| 3 | Send a phrase via [PB] | Usage event appears in PB Central stats | | |
```
GATE-RESULT: PENDING[T06-PRE-SHIP]
```

## T06 STAGE 3 — Ship v5.6.3 — O-Ring Visualization
In pbBubbleHtml or card open handler: render radial ring of related phrases from card.semanticRelationships (max 5). Position using cos/sin math. Tap any ring phrase → sends or fills compose. If empty → toast "No related phrases".
**Commit per change.** Lint. Push.
<!-- CC_STATUS: T06-SHIP | PENDING -->

### USER TEST — T06-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Open card with related phrases | O-Ring appears with related phrases positioned radially | | |
| 2 | Tap O-Ring phrase | Sends or fills compose | | |
| 3 | Open card with no related phrases | "No related phrases" toast, no crash | | |
```
GATE-RESULT: PENDING[T06-SHIP]
```

## T06 STAGE 4 — Post-ship v5.6.4 — PWA Install Prompt
Add manifest.json to repo. Add `<link rel="manifest">` to HTML head. Add beforeinstallprompt listener that shows sticky footer install banner. Dismiss stores preference.
**Commit per change.** Lint. Merge to main.
<!-- CC_STATUS: T06-POST-SHIP | PENDING -->

### USER TURN GATE — T06-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Join call | PB loads for this pair automatically | | |
| 2 | PB Central sync | Usage events appear in PB Central | | |
| 3 | O-Ring | Related phrases visible, tappable | | |
| 4 | Install prompt | Banner appears on first visit, installs to home screen | | |
| 5 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T06-FINAL]
```

---

---

# TURN 07 — The Phrasebook Gets Smarter Over Time

**Goal:** Fuzzy TM matching. Spoken phrases that are ~80% similar to a saved phrase with 3+ uses get the phrasebook translation automatically.

**Baseline:** `bridge-turn06-post-ship.html` (v5.6.4)
**Output:** `bridge-turn07-post-ship.html` (v5.7.4)

## T07 STAGE 0 — Pre-base v5.7.0
Copy. Version stamp. Commit.
<!-- CC_STATUS: T07-PRE-BASE | PENDING -->

## T07 STAGE 1 — Base v5.7.1 — Fuzzy Match Implementation
Implement `_tmFuzzy(text, src, tgt)`: iterate _tmIndex, calculate Levenshtein similarity, return target if similarity >= 0.80 AND card.usage >= 3. Inject as fallback in translateWithRetry() after _tmCheck() miss.
**Commit per change.** Lint. Push.
<!-- CC_STATUS: T07-BASE | PENDING -->

### USER TEST — T07-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Phrase with 0 uses | Fuzzy match does NOT activate | | |
| 2 | Phrase with 3+ uses — speak variation | TM translation used, not live translator | | |
```
GATE-RESULT: PENDING[T07-BASE]
```

## T07 STAGE 2 — Pre-ship v5.7.2 — TM Rebuild on Save
At end of pbSaveCard() and pbUpsert(): `setTimeout(function(){_tmBuild(card.sourceLang,card.targetLang);},0);`
**Commit per change.** Lint. Push.
<!-- CC_STATUS: T07-PRE-SHIP | PENDING -->

### USER TEST — T07-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Edit phrase source | Speak new version | TM matches updated phrase | | |
| 2 | Add new phrase | TM includes it without reload | | |
```
GATE-RESULT: PENDING[T07-PRE-SHIP]
```

## T07 STAGE 3 — Ship v5.7.3 — Usage + Schema Integrity
In pbISend: confirm _pbEmitUsage wired (from Turn 05). In _pbNormCard: confirm semanticRelationships preserved (from Turn 05). Add any missing guards.
**Commit per change.** Lint. Push.
<!-- CC_STATUS: T07-SHIP | PENDING -->

## T07 STAGE 4 — Post-ship v5.7.4 — TM Fallback Guards
In _qrOpen (or wherever relatedIntents is consumed): replace silent empty-check with `toast('No related phrases'); return;`.
**Commit per change.** Lint. Merge to main.
<!-- CC_STATUS: T07-POST-SHIP | PENDING -->

### USER TURN GATE — T07-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Save phrase, use 3x, speak variation | TM activates, phrasebook translation used | | |
| 2 | Card usage count | Accurate after sends | | |
| 3 | semanticRelationships | Preserved after save/edit | | |
| 4 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T07-FINAL]
```

---

---

# TURN 08 — One Tap to Call

**Goal:** Pair with someone once via QR. After that, tap their name and they ring. Accept and connect. Works when app is open.

**Baseline:** `bridge-turn07-post-ship.html` (v5.7.4)
**Output:** `bridge-turn08-post-ship.html` (v5.8.4)

## T08 STAGE 0 — Pre-base v5.8.0
Copy. Version stamp. Commit.
<!-- CC_STATUS: T08-PRE-BASE | PENDING -->

## T08 STAGE 1 — Base v5.8.1 — QR Pairing Handshake
Generate QR from lastSessionContext.pairToken. Joiner scans. Both devices exchange pair token via relay one-time message. Store in localStorage under `tb_pairs`.
<!-- CC_STATUS: T08-BASE | PENDING -->

### USER TEST — T08-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Creator shows QR, joiner scans | Both see "Paired with [name]" confirmation | | |
| 2 | Contacts list | Both appear in each other's list | | |
```
GATE-RESULT: PENDING[T08-BASE]
```

## T08 STAGE 2 — Pre-ship v5.8.2 — Ring/Accept/Reject Messages
Add relay message type `{type:'ring', from:pairKey, name:myName}`. Receiving device (app open) shows full-screen incoming call overlay with Accept and Reject buttons.
<!-- CC_STATUS: T08-PRE-SHIP | PENDING -->

### USER TEST — T08-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Tap paired contact | Ring signal fires | | |
| 2 | Other device (app open) | Shows incoming call with Accept/Reject | | |
| 3 | Tap Accept | Call connects, no share link needed | | |
| 4 | Tap Reject | Ring dismissed cleanly | | |
```
GATE-RESULT: PENDING[T08-PRE-SHIP]
```

## T08 STAGE 3 — Ship v5.8.3 — Contacts List UI
Saved pairs list visible in app. Tap any contact to initiate ring. Correct pair phrasebook loads on connect.
<!-- CC_STATUS: T08-SHIP | PENDING -->

## T08 STAGE 4 — Post-ship v5.8.4 — Unpair + Edge Cases
Add unpair flow. Handle ring to offline/closed app gracefully (timeout + feedback).
Merge to main.
<!-- CC_STATUS: T08-POST-SHIP | PENDING -->

### USER TURN GATE — T08-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Full pairing flow | QR scan → contacts → ring → accept → call with PB | | |
| 2 | Unpair | Contact removed from list | | |
| 3 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T08-FINAL]
```

---

---

# TURN 09 — Works When You're Not Looking

**Goal:** Ring and push notifications when app is backgrounded. Badge on home screen for missed rings.

**Baseline:** `bridge-turn08-post-ship.html` (v5.8.4)
**Output:** `bridge-turn09-post-ship.html` (v5.9.4)

## T09 STAGE 0 — Pre-base v5.9.0
Copy. Version stamp. Commit.
<!-- CC_STATUS: T09-PRE-BASE | PENDING -->

## T09 STAGE 1 — Base v5.9.1 — Service Worker + VAPID
Register service worker. Generate VAPID keys. Service worker active in browser.
<!-- CC_STATUS: T09-BASE | PENDING -->

## T09 STAGE 2 — Pre-ship v5.9.2 — Push Subscription
Subscribe device to push. Ring signal triggers push notification to subscribed device when app is backgrounded.
<!-- CC_STATUS: T09-PRE-SHIP | PENDING -->

### USER TEST — T09-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | App minimized, contact rings | Notification appears at top of screen | | |
| 2 | Tap notification | App opens to call screen | | |
```
GATE-RESULT: PENDING[T09-PRE-SHIP]
```

## T09 STAGE 3 — Ship v5.9.3 — Auto-join + Badge
Notification tap → app opens → call auto-accepts. Missed ring → badge count on home screen icon. Open app → badge clears.
<!-- CC_STATUS: T09-SHIP | PENDING -->

## T09 STAGE 4 — Post-ship v5.9.4 — Full Background Flow
App fully closed. Ring fires. Push arrives. Notification leads to call join. Merge to main.
<!-- CC_STATUS: T09-POST-SHIP | PENDING -->

### USER TURN GATE — T09-FINAL
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | App closed, contact rings | Push notification appears | | |
| 2 | Tap notification | App opens, call auto-joins | | |
| 3 | Miss 2 rings | Badge shows 2 on icon | | |
| 4 | Open app | Badge clears | | |
| 5 | All prior tests | Pass | | |
```
GATE-RESULT: PENDING[T09-FINAL]
```

---

---

# TURN 10 — Looks Great, Works for Everyone

**Goal:** Consistent design system. High contrast accessibility mode. Full-screen installable app experience.

**Baseline:** `bridge-turn09-post-ship.html` (v5.9.4)
**Output:** `bridge-turn10-post-ship.html` (v5.10.4)

## T10 STAGE 0 — Pre-base v5.10.0
Copy. Version stamp. Commit.
<!-- CC_STATUS: T10-PRE-BASE | PENDING -->

## T10 STAGE 1 — Base v5.10.1 — CSS Variable Design System
Inject `:root` CSS variable definitions. Global find-replace: hardcoded hex colors → CSS variables. Convert primary font sizes to rem.
<!-- CC_STATUS: T10-BASE | PENDING -->

### USER TEST — T10-BASE
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | App renders | All colors correct, no black boxes or invisible text | | |
| 2 | 150% browser zoom | Text scales proportionally | | |
```
GATE-RESULT: PENDING[T10-BASE]
```

## T10 STAGE 2 — Pre-ship v5.10.2 — High Contrast Mode
Implement `toggleTheme()` that appends/removes `data-theme="high-contrast"` on document.body. High contrast CSS defined in `:root[data-theme="high-contrast"]`. Toggle persists in localStorage.
<!-- CC_STATUS: T10-PRE-SHIP | PENDING -->

### USER TEST — T10-PRE-SHIP
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Toggle high contrast | All text readable, all controls visible on every screen | | |
| 2 | Close and reopen app | High contrast mode persists | | |
```
GATE-RESULT: PENDING[T10-PRE-SHIP]
```

## T10 STAGE 3 — Ship v5.10.3 — Visual Polish
High contrast covers: lobby, call, PB overlay, O-Ring, add/edit modal, goodbye, incoming call, contacts list. All screens visually consistent.
<!-- CC_STATUS: T10-SHIP | PENDING -->

## T10 STAGE 4 — Post-ship v5.10.4 — Final Release Candidate
Full walkthrough all screens, both normal and high contrast. Merge to main.
<!-- CC_STATUS: T10-POST-SHIP | PENDING -->

### USER TURN GATE — T10-FINAL (Final Release Candidate)
| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Install to home screen | Icon appears, full-screen experience, no browser bar | | |
| 2 | Full session in high contrast | Every screen readable | | |
| 3 | Ring a contact → accept → PB → O-Ring → hang up → rejoin | All features work end to end | | |
| 4 | PB Central received usage events from session | Confirmed in PB Central | | |
| 5 | TM activated on fuzzy phrase during session | Confirmed | | |
| 6 | All Turn 04-09 tests | Pass | | |
```
GATE-RESULT: PENDING[T10-FINAL]
```

---

---

# APPENDIX — CHANGE LOG

CC appends a line here after each turn's post-ship merges to main.

| Turn | Merged | Version | Summary |
|---|---|---|---|
| 04 | PENDING | v5.4.4 | WebRTC stabilization, telemetry stub, rejoin, goodbye cleanup |
| 05 | PENDING | v5.5.4 | PB full roundtrip, usage emit, semanticRelationships |
| 06 | PENDING | v5.6.4 | Pair identity, PB Central, O-Ring, PWA manifest |
| 07 | PENDING | v5.7.4 | Fuzzy TM, TM rebuild on save |
| 08 | PENDING | v5.8.4 | QR pairing, ring/accept/reject, contacts list |
| 09 | PENDING | v5.9.4 | Push notifications, badge, background ring |
| 10 | PENDING | v5.10.4 | CSS design system, high contrast, final RC |

---

*Single source of truth. One file. All deviations require explicit user authorization.*
*Repo path: `/home/user/stuff` · File: `talkbridge-master.md` · Baseline: bridge-turn01-post-ship.html (v5.2.4)*
