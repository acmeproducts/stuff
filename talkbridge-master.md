# TalkBridge — Master Development & Test Record
**Version:** 6.2 | **Updated:** 2026-06-22
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

<!-- CC_STATUS: T06-PRE-BASE | PENDING -->

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

## T06 PRE-SHIP — STATUS NOTE (2026-06-19)

First pre-ship attempt was built off a stale leftover file (not the confirmed-clean base), discarded. Fresh copy of base started, work ran out mid-rebuild. No corruption — base v5.6.1 (GATE_PASS) is untouched. Confirmed done before stoppage:

- Schema rewrite, usage tracking, dirty flags
- pbCommitSrcEdit fixed (conditional logging) + Enter-to-commit handler
- Full old-system removal (NC/catalog/CDN/import/old GitHub push) — verified clean
- pbRenderOverlay/pbRenderOverlayFilter rebuilt (hard pair scope)
- pbSyncPullLatest/pbSyncWriteBack/pbOvUpdatePairLabel/pbOvUpdateSyncDot built
- pbAddCard built (dedup + source-field focus)

**Remaining steps to finish pre-ship v5.6.2:**
1. Wire pbSyncPullLatest/pbSyncWriteBack into enterCall/hangUp/relay_open
2. Fix trSaveToPb → pbAddCard
3. Remove leftover second pbAutoSeed() call
4. Build card HTML template (header, timestamp, source/target fields w/ keydown handler)
5. Overlay ribbon rebuild, search row layout, sticky footer
6. pbISend direct-send bypass (no MyMemory round trip)
7. Chat translationFailed flag + UI reuse from voice
8. Remove output censorship/filtering on translated text
9. Same-language resend short-circuit
10. Transcript-surface focus-redirect listener
11. Remove book icon from transcript ribbon
12. Full validation grep pass + Playwright smoke test

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

**1.19 — Sanitize TURN token to ASCII-safe before Authorization header**
```
FIND:
  var tid=((inviteCfTid||'')||(localStorage.getItem('tb_cf_tid')||'')).trim();
  var tok=((inviteCfTok||'')||(localStorage.getItem('tb_cf_tok')||'')).trim();
REPLACE:
  var tid=((inviteCfTid||'')||(localStorage.getItem('tb_cf_tid')||'')).trim().replace(/[^\x20-\x7E]/g,'');
  var tok=((inviteCfTok||'')||(localStorage.getItem('tb_cf_tok')||'')).trim().replace(/[^\x20-\x7E]/g,'');
```
**Commit:** `Turn 06 base 1.19 — sanitize TURN token to ASCII-safe` Push.

---

**1.20 — Strip joiner invite credentials from saveRecent and reuseRoom**
In `saveRecent()`:
```
FIND:
  if(room.role==='joiner'){
    rec.role='joiner';
    if(inviteDgKey)rec.jDgKey=inviteDgKey;
    if(inviteCfTid)rec.jCfTid=inviteCfTid;
    if(inviteCfTok)rec.jCfTok=inviteCfTok;
  }
REPLACE:
  if(room.role==='joiner'){
    rec.role='joiner';
  }
```
In `reuseRoom()`:
```
FIND:
  if(rec.role==='joiner'){
    room.role='joiner';
    if(rec.jDgKey){inviteDgKey=rec.jDgKey;if($('dg-key'))$('dg-key').value=rec.jDgKey;dgKeyVerified=true;}
    if(rec.jCfTid){inviteCfTid=rec.jCfTid;if($('cf-turn-id'))$('cf-turn-id').value=rec.jCfTid;}
    if(rec.jCfTok){inviteCfTok=rec.jCfTok;if($('cf-turn-tok'))$('cf-turn-tok').value=rec.jCfTok;}
  }else{
    room.role='creator';
  }
REPLACE:
  if(rec.role==='joiner'){
    room.role='joiner';
  }else{
    room.role='creator';
  }
```
`grep -c "jDgKey\|jCfTid\|jCfTok" bridge-turn06-base.html` EXPECTED: 0
**Commit:** `Turn 06 base 1.20 — strip joiner invite credentials from recent rooms` Push.

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

<!-- CC_STATUS: T06-BASE | PENDING -->

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

## T06 STAGE 2 — Pre-ship v5.6.2 — Complete PB Subsystem Replacement

**Why this is one stage, not two:** Partial PB replacement is untestable. Leaving the
old catalog/NC/CDN system coexisting with the new contract schema produces a fragmented
release that cannot pass any acceptance test. Pre-ship must be the complete replacement
of the entire PB subsystem — old system out, new system in, nothing coexisting.

**Acceptance criteria:** A full round trip: pull 1000-series at call start → cards
visible in overlay → add from transcript surface → add from overlay + button → edit
a card → soft delete a card → hang up → 1001-series written to GitHub with all changes.
Every existing working feature from base must survive: overlay X close, search X inside
omnibox, compose strip X, soft delete, clarify event capture, Enter in source, / search.

**What gets removed (old system, entirely gone):**
- `PB_SEED` inline blob + `pbAutoSeed()` — hardcoded seed
- `PB_CATS`, `pbGetCats()`, `pbSaveCats()` — catalog storage
- `pbOpenBooksModal()` and its HTML — switch phrasebook UI
- `pbRenderOverlayFilter()` catalog auto-force logic — replaced by pair-scoped render
- `_pbAutoLoad()`, `_pbFetchOne()`, `_pbCheckETag()` — CDN import chain + call site in enterCall()
- `pbApplyImport()` — replaced by pbSyncPullLatest() pair-scoped merge
- `#pb-new-card-overlay` HTML block — NC overlay
- All `pbNc*` functions and `_pbNc*` globals — entire NC system
- `pbOpenNewCard()`, `pbOpenNewCardForContext()` — NC entry points
- `pbOpenBooksModal()`, `pbTriggerImport()`, `pbOpenGitSheet()`, `pbExportPrompt()` — defunct actions
- `pbConfirmRemoveCat()`, `pbRemoveCat()`, `pbCatLangPair()`, `pbGetCatForLangPair()` — catalog helpers
- All `catalogIds` field references in pbNorm and rendering
- Overlay ribbon buttons: back `<`, ↑ upload, ↓ cloud download, → export
- Book icon from transcript top-centre ribbon (line 543 in base) — keep in `/` slide-up only
- Filter bar `#pb-ov-filter` HTML element

**What gets built (new system, complete, no stubs):**
- `pbNorm()` + `_pbNormCard()` rewritten to canonical contract schema: `categories[]`,
  `createdBy`, `updatedBy`, `lastUsed`; drop `confidence`, `parentCategory`, `primaryTag`,
  `semanticRelationships`, `catalogIds`; `verdict` default `'pending'`
- `_pbEmitUsage()`: set `lastUsed=pbNow(); updatedBy='tb';`
- `pbCommitSrcEdit()`: set `updatedBy='tb'; verdict='pending';` on source change
- `pbSaveCard()` + `pbHardDelete()`: set `_pbSyncState.dirty=true`
- `_pbSyncState` + `pbSyncPullLatest()` + `pbSyncWriteBack()`: versioned pull/push,
  conditional on dirty flag, pending/completed status, reconnect retry
- Wired: `pbSyncPullLatest` in `enterCall()`, `pbSyncWriteBack` in `hangUp()`,
  retry in `relay_open`
- `pbAddCard(opts)`: replaces NC system. Sets `categories:['unassigned']`,
  `createdBy:'tb'`, `verdict:'pending'`. Runs `translateWithRetry` at birth for BT.
  Saves via `pbSaveCard()`, sets dirty. Opens overlay, card visible immediately.
  Entry points: `trSaveToPb()` → `pbAddCard()`, overlay `+` button → `pbAddCard({})`
- Overlay ribbon rebuilt (phrase-desk pattern): pair label `🇺🇸 → 🇹🇭 en-th-1001` |
  omnisearch input with X **inside** the input | `+` | save (disk) | sync dot.
  X close button preserved top-right.
- `pbOvUpdatePairLabel()` + `pbOvUpdateSyncDot(status)` drive ribbon state
- `pbRenderOverlay()`: hard pair scope (room.myLang/theirLang), no catalog filter.
  Search results → row layout (TTS + send each side, no "tap to use").
  Zero-state → phrase-desk bubble card layout.
- `pbBubbleHtml()` rebuilt: header (`createdBy · date time`, dark readable text),
  source (contenteditable, 10px padding) + USE (in card's source lang) + TTS |
  target (contenteditable) + USE + TTS side by side. Backtranslate row + TTS.
  Verdict: ✓ Sounds Good (check icon) | ⚑ Flag — full-width pills.
  Footer: 3 icons only — # | clarify bubble | trash (no text, no BT drawer).
  Tag drawer: pills with ×, tag input — preserved from base exactly.
  Clarify drawer: scrollable thread (author = `createdBy`/`updatedBy` from schema,
  shows `tb`/`pb`/`xl` or actual initials if set by XL; timestamp; text; × to remove).
  All clarify event capture preserved: `pbAddClarify`, `pbSetVerdict`,
  `pbAddTag`/`pbRemoveTag` all push to clarifyChain. `pbCommitSrcEdit` always resets
  verdict to `'pending'` on blur or Enter — even if the source text is unchanged —
  and pushes two entries to clarifyChain: `"Was: <old source>"` (only if text actually
  changed) and a verdict-reset entry (always, regardless of whether text changed).
  Soft delete: trash icon → `pbSoftDelete()` — must work.
  Enter in source: `onblur` fires `pbCommitSrcEdit` — must work.
- Sticky footer on overlay: `TalkBridge · [live timestamp]`
- `pbOvRowHtml()` + `pbIRowHtml()` search row: source + TTS + `>` send |
  target + TTS + `>` send, side by side, no "tap to use" text
- Shortcuts (all already working in base — must not be broken):
  `/` in compose → search drawer. `/query` + Enter → overlay with query.
  `..` in compose → `/`. Compose strip X inside the strip.
  Overlay omnibox X inside the omnibox.
- Pair identity: `pairKey` set in `createRoom()` and `joinerProceed()`

Source of truth: Phrasebook Lifecycle Contract v1.5, Section 7.2. PB team confirmed:
no conflict resolution needed (single operator, sequential); one version per session;
write-back fires only if dirty; no-pair-file toasts and waits — does not block call.

```bash
cp bridge-turn06-base.html bridge-turn06-pre-ship.html
```
Version stamps to v5.6.2. Commit. Push.

---

**Implementation checklist (build order):**

1. pbNorm + _pbNormCard schema rewrite (categories[], createdBy, updatedBy, lastUsed, verdict default 'pending'; drop catalogIds, confidence, parentCategory, primaryTag, semanticRelationships)
2. _pbEmitUsage: lastUsed + updatedBy
3. pbCommitSrcEdit: verdict reset + updatedBy
4. pbSaveCard + pbHardDelete: dirty flag
5. Remove old system in one pass (all items listed above under "What gets removed")
6. _pbSyncState + pbSyncPullLatest + pbSyncWriteBack: versioned pull/push
7. Wire enterCall → pbSyncPullLatest, hangUp → pbSyncWriteBack, relay_open → retry
8. pbAddCard: new card creation replacing NC
9. Wire trSaveToPb → pbAddCard
10. Overlay ribbon rebuild (phrase-desk pattern, preserve X close button)
11. pbOvUpdatePairLabel + pbOvUpdateSyncDot
12. pbRenderOverlay: hard pair scope, search → row layout, zero-state → bubble layout
13. pbBubbleHtml: new card layout (header, phrase-desk body, 3-icon footer, all event wiring intact)
14. pbOvRowHtml + pbIRowHtml: search row layout (TTS + send, no "tap to use")
15. Sticky footer on overlay
16. Pair identity: pairKey in createRoom + joinerProceed
17. .. → / in chatInputEvt

**Validation:**
```bash
grep -c "pbNc\|PB_SEED\|_pbAutoLoad\|catalogIds\|pbApplyImport" bridge-turn06-pre-ship.html  # EXPECTED: 0
grep -c "categories:Array.isArray" bridge-turn06-pre-ship.html   # EXPECTED: 1
grep -c "function pbSyncPullLatest\|function pbSyncWriteBack" bridge-turn06-pre-ship.html  # EXPECTED: 2
grep -c "function pbAddCard" bridge-turn06-pre-ship.html         # EXPECTED: 1
grep -c "_pbSyncState.dirty=true;" bridge-turn06-pre-ship.html   # EXPECTED: 2
grep -c "tap to use\|pb-use-btn" bridge-turn06-pre-ship.html     # EXPECTED: 0
grep -c "pairKey" bridge-turn06-pre-ship.html                    # EXPECTED: >=2
```
Run lint. Must pass.

<!-- CC_STATUS: T06-PRE-SHIP | PENDING -->

### USER TEST — T06-PRE-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Enter en-th call, PB file exists | pb_sync_pulled in log, cards visible in overlay | | |
| 2 | Enter call, no PB file for pair | Toast: no shared phrasebook yet, call still connects | | |
| 3 | Open overlay, no search | Cards shown pair-scoped, pair label in ribbon correct | | |
| 4 | Overlay X button (top right) | Closes overlay | | |
| 5 | Type in omnibox, tap X inside it | Search clears, overlay stays open | | |
| 6 | / in compose | Search drawer opens immediately | | |
| 7 | /bank + Enter | Overlay opens with bank pre-searched | | |
| 8 | Compose strip X | Cancels /search, clears input, inside the strip | | |
| 9 | .. in compose | Becomes / | | |
| 10 | Tap phrase in search row | Sends that side's text to chat | | |
| 11 | Tap + in overlay ribbon | New blank card, source focused, auto-translates and backtranslates on Enter | | |
| 12 | Save from transcript surface | Card appears in overlay immediately | | |
| 13 | Open tag drawer, add tag | Tag appears as pill, Enter works | | |
| 14 | Open clarify drawer, add note | Note appears in thread with tb · timestamp | | |
| 15 | Edit card source, blur or Enter, even with no changes | Verdict resets to pending; clarify log shows verdict-reset entry, and "Was: <old source>" only if text actually changed | | |
| 16 | Trash icon on card | Soft delete works, card moves to deleted section | | |
| 17 | Verdict: Sounds Good | Check icon pill highlights green | | |
| 18 | Zero changes, hang up | pb_sync_skipped_no_changes in log | | |
| 19 | Edit card, hang up | pb_sync_upload_completed in log, v1001 in GitHub | | |
| 20 | pairKey | mike-pim in debug log when creator=Mike, joiner=Pim | | |

```
GATE-RESULT: PENDING[T06-PRE-SHIP]
```

---

## T06 STAGE 3 — Ship v5.6.3 — PB Card UX + Compose-Strip Search + O-Ring + PWA

**What this stage does:** Completes the phrasebook card as a fully interactive object
(Enter-to-commit on source, Enter-to-insert on tags and clarify, focus-return after
commit, auto-capitalize clarify author). Fixes compose-strip search triggers (`/` and
`..`). Adds search-drawer X dismiss. Moves PB name to overlay footer. Wires O-Ring.
Adds PWA manifest. Absorbs all open issues captured 2026-06-22 to avoid a patch cycle
in Stage 4.

**Baseline:** `bridge-turn06-pre-ship.html` (v5.6.2) — GATE_PASS required before starting.

```bash
cp bridge-turn06-pre-ship.html bridge-turn06-ship.html
```
Version stamps to v5.6.3. Commit. Push.

---

**OPEN ISSUES absorbed into this stage (2026-06-22):**

- OI-01: PB name label belongs in overlay sticky footer, not header ribbon
- OI-02: Tags — convert to new style (deferred to Stage 4, noted here for tracking)
- OI-03: Enter in tag input must return focus to tag input after committing tag pill
- OI-04: Enter in clarify input must insert entry and clear input (currently requires tapping Add)
- OI-05: Clarify entry author string must capitalize: `'TB'` not `'tb'`, `'Me'` already correct
- OI-06: `..` in compose must open search drawer immediately (before next character typed), same as `/`
- OI-07: `/` or `..` + Enter/go must open search drawer, NOT post to transcript
- OI-08: Search drawer (slide-up) must have an X button top-right to dismiss

---

**3.1 — PB name to overlay footer**
Remove pair-label span from overlay ribbon header. Add sticky footer div at bottom of
`#pb-overlay` with content `TalkBridge · <live timestamp>`. Live timestamp driven by
`setInterval` updating a `<span id="pb-ov-footer-ts">` every second.
`grep -c "pb-ov-pair-label" bridge-turn06-ship.html` EXPECTED: 0
`grep -c "pb-ov-footer" bridge-turn06-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 ship 3.1 — PB name to overlay footer with live timestamp` Push.

---

**3.2 — Enter-to-commit tag + focus return**
In tag input `onkeydown`: Enter calls `pbAddTagI(id)`, then immediately re-focuses
`document.getElementById('pb-ti-'+id)`. Must work after tag pill is added.
`grep -c "pb-ti-.*focus\|focus.*pb-ti" bridge-turn06-ship.html` EXPECTED: >=1
**Commit:** `Turn 06 ship 3.2 — Enter in tag input commits and returns focus` Push.

---

**3.3 — Enter-to-insert clarify + capitalize author**
In clarify input `onkeydown`: Enter calls `pbAddClarify(id)` directly then re-focuses
`document.getElementById('pb-ci-'+id)`.
Audit all `clarifyChain.push` call sites — `pbCommitSrcEdit`, `pbSetVerdict`,
`pbRemoveTag`, `pbAddTag` — and uppercase `'tb'` → `'TB'` in the author field.
`grep -c "author:'tb'" bridge-turn06-ship.html` EXPECTED: 0
`grep -c "author:'TB'" bridge-turn06-ship.html` EXPECTED: >=3
**Commit:** `Turn 06 ship 3.3 — Enter in clarify inserts entry, capitalize TB author` Push.

---

**3.4 — Compose-strip search trigger: `..` and `/` open drawer immediately, never post**
In `chatInputEvt()`:
- `raw === '..'`: set `ta.value = '/'`, open search drawer (`pbISearch('')`), show strip X, return.
- `raw === '/'`: open search drawer (`pbISearch('')`), show strip X, return.
- `raw[0] === '/' && raw.length > 1`: run `pbISearch(raw.slice(1))`, show strip X.
Guard in `sendChat()`: if `text === '/' || text === '..'` return early before any relay send.
`grep -c "text==='/'\\|text==='\.\.'\\|text==='\.\.'\\|text==='\\.\\.'\\|'\\.\\.'" bridge-turn06-ship.html` EXPECTED: >=1
**Commit:** `Turn 06 ship 3.4 — compose .. and / open drawer immediately, never post` Push.

---

**3.5 — Search drawer X dismiss button**
In `pbSearchDrawerHtml()`: add X button in drawer header (right side) calling
`pbCloseDrawer()` and `pbSearchExit()`. Style with existing `pb-drawer-x` class.
`grep -c "pbSearchExit" bridge-turn06-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 ship 3.5 — search drawer X dismiss button` Push.

---

**3.6 — Confirm PB Central sync wiring (no-op verification)**
`grep -c "function pbSyncPullLatest\|function pbSyncWriteBack" bridge-turn06-ship.html` EXPECTED: 2
**Commit:** `Turn 06 ship 3.6 — confirm PB Central sync wiring (no-op)` Push.

---

**3.7 — O-Ring visualization**
In `_qrOpen()`: render radial ring from `card.relatedIntents` (max 5). Position nodes
using cos/sin math. Tap node → fills compose with that card's source. Empty →
`toast('No related phrases'); return;`.
`grep -c "relatedIntents\|qr-ring" bridge-turn06-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 ship 3.7 — O-Ring radial related phrases` Push.

---

**3.8 — PWA manifest + install prompt**
Add `<link rel="manifest" href="manifest.json">` to `<head>`. Add
`beforeinstallprompt` listener showing a dismissible install banner on lobby.
Dismiss stores `tb_install_dismissed=1` in localStorage.
`grep -c "manifest.json\|beforeinstallprompt" bridge-turn06-ship.html` EXPECTED: >=2
**Commit:** `Turn 06 ship 3.8 — PWA manifest link and install prompt banner` Push.

---

**Full sweep validation:**
```bash
grep -c "_telBuf\|_PB_TEL\|saveTelCreds\|_initTelCreds\|_telPost\|_telFlush" bridge-turn06-ship.html  # EXPECTED: 0
grep -c "function pbSyncPullLatest\|function pbSyncWriteBack" bridge-turn06-ship.html  # EXPECTED: 2
grep -c "if(_recoveryLock)return;" bridge-turn06-ship.html         # EXPECTED: 1
grep -c "lastSessionContext.roomId" bridge-turn06-ship.html        # EXPECTED: 3
grep -c "handleHash(_pendingJoin)" bridge-turn06-ship.html         # EXPECTED: 1
grep -c "pairKey" bridge-turn06-ship.html                          # EXPECTED: >=2
grep -c "relatedIntents\|qr-ring" bridge-turn06-ship.html          # EXPECTED: >=2
grep -c "pb-ov-pair-label" bridge-turn06-ship.html                 # EXPECTED: 0
grep -c "pb-ov-footer" bridge-turn06-ship.html                     # EXPECTED: >=2
grep -c "author:'tb'" bridge-turn06-ship.html                      # EXPECTED: 0
grep -c "manifest.json" bridge-turn06-ship.html                    # EXPECTED: 1
grep -c "v5.6.3" bridge-turn06-ship.html                           # EXPECTED: 2
grep -m1 "RELAY_BASE" bridge-turn06-ship.html                      # must contain: talk-signal.myacctfortracking.workers.dev
```
Run lint. Must pass.

<!-- CC_STATUS: T06-SHIP | PENDING -->

### USER TEST — T06-SHIP

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| 1 | Open PB overlay | Pair label in sticky footer, not ribbon | | |
| 2 | Tap tag input, type, Enter | Tag pill added, focus stays in tag input | | |
| 3 | Tap clarify input, type, Enter | Entry appears in thread, input clears, focus returns | | |
| 4 | Clarify author on TB-generated entry | Shows `TB`, not `tb` | | |
| 5 | Type `..` in compose | Search drawer opens immediately, no text posted | | |
| 6 | Type `/` in compose | Search drawer opens immediately | | |
| 7 | Type `/bank` then Enter | Overlay opens with bank pre-searched, nothing posted | | |
| 8 | Type `..` then tap go/send | Search drawer opens, nothing posted | | |
| 9 | Search drawer open, tap X | Drawer closes, compose clears | | |
| 10 | Long-press PB card | O-Ring appears with related phrases | | |
| 11 | Tap O-Ring node | Fills compose with phrase | | |
| 12 | Install prompt on lobby | Banner appears, tap dismiss persists | | |
| 13 | All T06-PRE-SHIP tests | Pass | | |

```
GATE-RESULT: PENDING[T06-SHIP]
```

---

## T06 STAGE 4 — Post-ship v5.6.4 — UI Consistency + detectLang + Translation Badge

**Note:** Scope to be finalized after T06-SHIP GATE_PASS. Items expected to include:
UI standardization pass (lobby/welcome/goodbye/video/transcript/PB surfaces), detectLang
coverage improvements, chat translation-failure badge, tag new-style conversion (OI-02).

```bash
cp bridge-turn06-ship.html bridge-turn06-post-ship.html
```
Version stamps to v5.6.4. Commit. Push.

<!-- CC_STATUS: T06-POST-SHIP | PENDING -->

### USER TURN GATE — T06-FINAL

| # | Test | Expected | Actual | P/F |
|---|---|---|---|---|
| T1 | Full call + translation | EN→TH both directions working | | |
| T2 | Mute 90s | Zero recovery events | | |
| T3 | Joiner rejoins | Thai landing, reconnects cleanly | | |
| T4 | PB full roundtrip | Add → search → send [PB] → edit → BT → verify → GitHub syncs | | |
| T5 | PB card UX | Enter on source/tag/clarify all work, author capitalized | | |
| T6 | Compose search triggers | `..` and `/` open drawer, never post | | |
| T7 | O-Ring | Related phrases appear radially, tap fills compose | | |
| T8 | Pair key | Debug log shows `mike-pim` for Mike + Pim | | |
| T9 | Install prompt | Banner appears, installs to home screen | | |

```
GATE-RESULT: PENDING[T06-FINAL]
```

---

---

# TURN 07 — Translation Memory

**Goal:** Spoken phrases that are ~80% similar to a saved phrase used 3+ times get the phrasebook translation automatically.

**Baseline:** `bridge-turn06-post-ship.html` (v5.6.3)
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
Verify `categories[]`/`createdBy`/`updatedBy`/`lastUsed` still correctly set in `pbNorm` and `_pbNormCard` (from T06 Stage 2.1). Verify `_pbEmitUsage` still sets `lastUsed`/`updatedBy` (from T06 Stage 2.2). Verify `_pbSyncState.dirty` is still set on every mutation path (from T06 Stage 2.5). Add any missing guards.
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
| 06 | PENDING | v5.6.3 | WebRTC, telemetry stub, PB roundtrip, pair identity, PB Central, O-Ring, PWA |
| 07 | RESCOPED | TBD | Env vars + key rotation (Cloudflare), UI consistency pass across lobby/welcome/goodbye/video/transcript/PB surfaces — prep for Turn 10 premium look + whitelabel. Original scope (fuzzy TM, TM rebuild on save) deferred, not yet rescheduled. |
| 08 | PENDING | v5.8.4 | QR pairing, ring/accept/reject, contacts list |
| 09 | PENDING | v5.9.4 | Push notifications, badge, background ring |
| 10 | PENDING | v5.10.4 | CSS design system, high contrast, final RC |

---

*Single source of truth. One file. Baseline: bridge-turn01-post-ship.html (v5.2.4). Repo: /home/user/stuff*
