# bridge-build-plan-v1.md
**Single source of truth for all TalkBridge build runs.**
**Date:** 2026-05-12

---

## How to Use This Plan

Executing prompt format:

```
build <xyz> version <abc> using bridge-build-plan-v1.md
```
 baseline sourcecode: bridge-patched-v1.html
- `<xyz>` — target  filename to create
- `<abc>` — version string to stamp into the output (e.g. `3.6.0`, `4.0-beta1`)

Codex must:
1. Locate file `bridge-patched-v1.html` as the input = baseline sourcecode
2. Apply every change in Section 6 surgically
3. Stamp `<abc>` into exactly three locations (Section 3)
4. Output a single complete HTML file named `<xyz>.html`
5. Verify the do-not-touch constants (Section 4) are unchanged

---

## 1. Governing Rules

1. Nobody gets locked out. WASM failure degrades gracefully — controls unblock,
   app continues with Unicode-range detection only.
2. No retry button anywhere. Failures surface in status pill and debug log only.
3. No full-screen startup blocker.
4. Surgical edits only. No section rewrites. No new external dependencies.
5. Both mic and chat route through `processConversationInput`.
6. All failures surface inline — never toast-only for critical failures.
7. Speech confidence threshold 0.58. Chat threshold 0.50. Separate constants.
8. Latin-to-Latin normalization is a primary validated use case, not a side case.
9. Pipeline log events use `norm_pipeline_speech` / `norm_pipeline_chat` with
   a `stage:` field. Acceptance matrix validates exact event+stage pairs.
10. `_ftStartupDone` is the sole writer of `_langRuntime.status`, `_ftReady`,
    and `_ftLoadFailed`. No other function may write these.
11. All TTS playback must call `speakText(text, lang)`. No direct calls to
    `speechSynthesis.speak()` anywhere in the file except inside `_doSpeak`.
12. UMD loading only. No ESM. No module conversion.
13. Single-file HTML constraint. One output file. No split files.

---

## 2. Source References

```
sourcecode baseline: https://github.com/acmeproducts/stuff/blob/main/bridge-patched-v1.html
 
Package:  https://github.com/acmeproducts/stuff/blob/main/fastType/README.md
          https://github.com/acmeproducts/stuff/blob/main/fastType/fasttext-wrapper.umd.js
          https://github.com/acmeproducts/stuff/blob/main/fastType/validation-report.txt
          https://github.com/acmeproducts/stuff/blob/main/docs/fasttext-wasm-poc.md
CDN:      https://cdn.jsdelivr.net/npm/fasttext.wasm@1.0.1/dist/
Upstream: https://github.com/DreamOfIce/fasttext.wasm
          https://fasttext.cc/docs/en/webassembly-module.html
```

---

## 3. Version Stamping — Three Required Locations

When building version `<abc>`, Codex must update exactly these three locations
and nowhere else:

**Location 1 — HTML comment at top of file (line 2):**
```html
<!-- talkbridge · dcr · v<abc> -->
```

**Location 2 — Footer version display in lobby:**
Find the existing version string in the lobby footer (currently `v3.5.3`):
```html
<span style="font-size:10px;color:var(--text-muted);">v3.5.3</span>
```
Replace with:
```html
<span style="font-size:10px;color:var(--text-muted);">v<abc></span>
```

**Location 3 — Startup log in JavaScript:**
Find:
```js
log('startup',{v:'3.5.3',ua:navigator.userAgent.slice(0,80)});
```
Replace with:
```js
log('startup',{v:'<abc>',ua:navigator.userAgent.slice(0,80)});
```

Output filename: `bridge-<xyz>.html`

---

## 4. Do-Not-Touch Constants

These values must never change. Modifying them breaks the relay and other
apps that share the same infrastructure. Codex must verify these are
unchanged in the output before completing the build.

```js
RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
RELAY_WS   = 'wss://'+RELAY_BASE
RELAY_APP  = 'talk-say-v1'
```

localStorage prefix for all keys: `ts3_`
Transcript key prefix: `tb_transcript_`
Recent rooms key: `tb_recent_rooms` (`RK`)
Device ID key: `tb_dev`

The relay Cloudflare Worker is strictly read-only. No changes to relay
behavior, relay message format, or relay connection logic are permitted
unless explicitly called out in Section 6.

---

## 5. WASM Package Facts

```
Hosted path: /stuff/fastType/

Required files:
  /stuff/fastType/fasttext-wrapper.umd.js   ← load via dynamic script tag
  /stuff/fastType/core/fasttext.wasm        ← 335457 bytes
  /stuff/fastType/model/lid.176.ftz         ← 938013 bytes
  /stuff/fastType/smoke-test.html

API:
  new FastText()
  loadModel('/stuff/fastType/model/lid.176.ftz')
  predict(text, k)

Loading: UMD global via dynamic script tag inside existing _loadFastText.
window.FastTextModule.locateFile set before script tag appended. Keep dynamic.
Do not use a static inline script block.
```

Asset verification — run before testing:
```
/stuff/fastType/fasttext-wrapper.umd.js  → HTTP 200
/stuff/fastType/core/fasttext.wasm       → HTTP 200, 335457 bytes
/stuff/fastType/model/lid.176.ftz        → HTTP 200, 938013 bytes

If any returns HTML: host is rewriting asset requests. Fix routing first.

Smoke tests (all four must pass):
  predict("hello how are you today", 1)       → en
  predict("hola como estas hoy", 1)           → es
  predict("bonjour comment allez vous", 1)    → fr
  predict("guten morgen wie geht es dir", 1)  → de
```

---

## 6. Architecture Additions

Add these before the first existing fastText variable declaration.

### 6a. Runtime State Object

```js
var _langRuntime={
  status:'idle',       // idle | loading | ready | failed
  startedAt:0,
  readyAt:0,
  error:null,
  detector:null,
  loadPromise:null     // memoizes getFastTextDetector — prevents duplicate polling
};
// _ftReady and _ftLoadFailed remain as compatibility booleans.
// Both are always valid simultaneously with _langRuntime.status.
// Updated exclusively by _ftStartupDone. Never written elsewhere.
```

Replace `var FT_LOAD_TIMEOUT_MS=5000` with:
```js
var FT_CONF_SPEECH=0.58;
var FT_LOAD_TIMEOUT_MS=15000;
```

### 6b. Error Code Constants

```js
var ERR={
  LANG_RUNTIME_LOADING:  'LANG_RUNTIME_LOADING',
  LANG_RUNTIME_FAILED:   'LANG_RUNTIME_LOAD_FAILED',
  LANG_DETECT_TOO_SHORT: 'LANG_DETECT_TOO_SHORT',
  LANG_DETECT_LOW_CONF:  'LANG_DETECT_LOW_CONFIDENCE',
  LANG_DETECT_FAILED:    'LANG_DETECT_PREDICT_FAILED',
  LANG_DETECT_EMPTY:     'LANG_DETECT_EMPTY_RESULT',
  TRANS_FAILED:          'TRANSLATION_REQUEST_FAILED',
  TRANS_EMPTY:           'TRANSLATION_EMPTY_OR_IDENTITY',
  TRANS_EXHAUSTED:       'TRANSLATION_EXHAUSTED',
  NORM_FAILED:           'NORMALIZATION_FAILED',
  TTS_FAILED:            'TTS_SPEAK_FAILED',
  TTS_UNAVAILABLE:       'TTS_UNAVAILABLE'
};
```

`TRANS_EMPTY` fires when translation returns empty or identical to source
before retries are exhausted. `TRANS_EXHAUSTED` fires when all retries fail.
These are distinct failure modes and must log separately.

### 6c. getFastTextDetector Singleton

```js
function getFastTextDetector(){
  if(_langRuntime.loadPromise)return _langRuntime.loadPromise;
  if(_langRuntime.status==='ready'){
    _langRuntime.loadPromise=Promise.resolve(_langRuntime.detector);
    return _langRuntime.loadPromise;
  }
  if(_langRuntime.status==='failed'){
    _langRuntime.loadPromise=Promise.resolve(null);
    return _langRuntime.loadPromise;
  }
  _langRuntime.loadPromise=new Promise(function(resolve){
    var check=setInterval(function(){
      if(_langRuntime.status==='ready'){clearInterval(check);resolve(_langRuntime.detector);}
      else if(_langRuntime.status==='failed'){clearInterval(check);resolve(null);}
    },100);
  });
  return _langRuntime.loadPromise;
}
```

### 6d. Robust Prediction Parser

Replaces `_ftPredictLabel`. Old name kept as alias for one release.

```js
function parseFastTextPrediction(raw,conf){
  conf=(conf!=null?conf:FT_CONF);
  var label=null,confidence=null;
  if(raw instanceof Map){
    var first=raw.entries().next();
    if(!first.done){label=first.value[0];confidence=first.value[1];}
  }else if(Array.isArray(raw)&&raw.length){
    var item=raw[0];
    if(Array.isArray(item)){label=item[0];confidence=item[1];}
    else if(item&&typeof item==='object'){
      label=item.label!=null?item.label:item[0];
      confidence=item.prob!=null?item.prob:item.score!=null?item.score:item.probability;
    }else if(typeof item==='string'){label=item;}
  }else if(raw&&typeof raw==='object'){
    label=raw.label!=null?raw.label:raw[0];
    confidence=raw.prob!=null?raw.prob:raw.score!=null?raw.score:raw.probability;
  }else if(typeof raw==='string'){label=raw;}
  var lang=label?String(label).replace(/^(__label__|label__)/,''):null;
  if(!lang||_ftWhitelist().indexOf(lang)<0)return{language:null,confidence:null};
  var n=Number(confidence);
  if(!isFinite(n))return{language:lang,confidence:null};
  return{language:n>=conf?lang:null,confidence:n};
}
function _ftPredictLabel(ft,text,conf){
  return parseFastTextPrediction(ft.predict(text,1),conf).language;
}
```

### 6e. Speech Detection Wrapper

```js
function _detectLangAsyncSpeech(text){
  return _detectLangAsync(text,FT_CONF_SPEECH);
}
```

`onDGFinal` calls `_detectLangAsyncSpeech`. `sendChat` calls `_detectLangAsync`.
These are the only two call sites. Do not inline.

### 6f. Shared Pipeline Function

Short-text guard: inputs under 4 space-separated tokens without non-Latin
Unicode skip fastText and log `stage:'detect' method:'stub_short'`.
Use 4+ word phrases for all Latin acceptance testing.

```js
async function processConversationInput(opts){
  var text=opts.text,channel=opts.channel,src=opts.src,tgt=opts.tgt,ss=opts.ss;
  var pipelineEvent=channel==='speech'?'norm_pipeline_speech':'norm_pipeline_chat';

  log(pipelineEvent,{stage:'start',src:src,tgt:tgt,ss:ss||null,raw:text.slice(0,60)});

  var detected=null,detectionMethod='none';
  var wordCount=text.trim().split(/\s+/).length;
  var isNonLatin=/[\u0E00-\u0E7F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7A3\u0600-\u06FF\u0900-\u097F\u0400-\u04FF]/.test(text);
  var tooShort=(wordCount<4&&!isNonLatin);

  if(tooShort){
    log(pipelineEvent,{stage:'detect',code:ERR.LANG_DETECT_TOO_SHORT,
      words:wordCount,detected:src,method:'stub_short'});
    detected=src;detectionMethod='stub_short';
  }else{
    var _ftWon=false;
    try{
      detected=await Promise.race([
        (channel==='speech'?_detectLangAsyncSpeech(text):_detectLangAsync(text))
          .then(function(d){_ftWon=true;return d;}),
        new Promise(function(res){setTimeout(function(){
          if(!_ftWon)log(pipelineEvent,{stage:'detect_timeout',
            code:_langRuntime.status==='loading'
              ?ERR.LANG_RUNTIME_LOADING:'predict_slow',
            ft_status:_langRuntime.status,
            ft_ready:_ftReady,ft_failed:_ftLoadFailed},'warn');
          res(src);
        },150);})
      ]);
      detectionMethod=_ftWon
        ?(_langRuntime.status==='ready'?'wasm':'stub')
        :'timeout';
    }catch(e){
      log(pipelineEvent,{stage:'detect_err',
        code:ERR.LANG_DETECT_FAILED,e:String(e)},'error');
      detected=src;detectionMethod='error';
    }
  }

  log(pipelineEvent,{stage:'detect',detected:detected||'null',
    method:detectionMethod,needs_prenorm:!!(detected&&detected!==src)});

  if(detected&&detected!==src&&!isNonLatin){
    log('norm_latin_to_latin',{from:detected,to:src,
      channel:channel,text:text.slice(0,40)},'warn');
  }

  var srcText=text;
  if(detected&&detected!==src){
    try{
      var normed=await translateWithRetry(text,detected,src,2);
      if(normed&&normed!==text){
        srcText=normalizeText(normed,'speech');
        log(pipelineEvent,{stage:'prenorm',from:detected,to:src,
          changed:true,srcText:srcText.slice(0,60)});
      }else{
        log(pipelineEvent,{stage:'prenorm',from:detected,to:src,
          changed:false},'warn');
      }
    }catch(e){
      log(pipelineEvent,{stage:'prenorm_err',
        code:ERR.NORM_FAILED,e:String(e)},'error');
    }
  }

  var tgtText=srcText,translationFailed=false;
  if(src&&tgt&&src!==tgt){
    try{
      var tr=await translateWithRetry(srcText,src,tgt,2);
      tr=normalizeText(tr||'','speech');
      if(!tr||normalizeText(tr,'compare')===normalizeText(srcText,'compare')){
        log(pipelineEvent,{stage:'translate',failed:true,
          code:ERR.TRANS_EMPTY,src:src,tgt:tgt,
          srcText:srcText.slice(0,40)},'error');
        log('trans_silent_fail',{src:src,tgt:tgt,
          srcText:srcText.slice(0,40),channel:channel},'error');
        translationFailed=true;tgtText=srcText;
      }else{
        tgtText=tr;
        log(pipelineEvent,{stage:'translate',failed:false,
          result:tr.slice(0,60)},'ok');
      }
    }catch(e){
      log(pipelineEvent,{stage:'translate',failed:true,
        code:ERR.TRANS_FAILED,e:String(e)},'error');
      translationFailed=true;tgtText=srcText;
    }
  }

  return{srcText:srcText,tgtText:tgtText,
    translationFailed:translationFailed,
    detected:detected,method:detectionMethod};
}
```

---

## 7. Surgical Change Plan

```
Execution order:
C1–C3    WASM foundation
C4–C6    Startup UX and gating
C7–C9    Logging, confidence, pipeline wiring
C10–C11  TTS, click fixes, failure UX
C12–C13  Scroll and phrasebook state
C14–C15  Phrasebook editing and relocation
C16      Additional bugs
```

---

### C1 — Fix WASM Asset Paths

```js
FT_WRAPPER_JS='/stuff/fastType/fasttext-wrapper.umd.js'
FT_CORE_JS='/stuff/fastType/core/fasttext.mjs'
FT_CORE_WASM='/stuff/fastType/core/fasttext.wasm'
FT_MODEL='/stuff/fastType/model/lid.176.ftz'
```

In `_loadFastText` locateFile:
```js
return '/stuff/fastType/'+base;
```

---

### C2 — Fix `_ftWhitelist`

```js
function _ftWhitelist(){return LANGS.map(function(l){return l.code;});}
```

---

### C3 — Add All Architecture Variables

After `var FT_CONF=0.5`, add `FT_CONF_SPEECH`, `FT_LOAD_TIMEOUT_MS`, `ERR`,
`_langRuntime` from Section 6a–6b.

Add `parseFastTextPrediction`, `_ftPredictLabel` alias, `getFastTextDetector`,
`_detectLangAsyncSpeech`, `processConversationInput` from Sections 6c–6f.

---

### C4 — Update `_ftPredictLabel` Call Sites

Update all existing `_ftPredictLabel(ft,text)` calls to:
```js
parseFastTextPrediction(ft.predict(text,1),conf).language
```

Update `_detectLangAsync` to accept optional `conf` and pass it to
`parseFastTextPrediction` in both the ready and pending paths.

---

### C5 — Update `_loadFastText` to Delegate to `_ftStartupDone`

At the start:
```js
_langRuntime.status='loading';
_langRuntime.startedAt=Date.now();
_syncFtStatus();
```

Replace ALL success/failure state assignments inside `_loadFastText` callbacks
with a single call to `_ftStartupDone(ok, msg)`. Do not write `_ftReady`,
`_ftLoadFailed`, or `_langRuntime` anywhere inside `_loadFastText`.

---

### C6 — Remove Overlay; Make `_ftStartupDone` Sole State Writer

Delete `_ftEnsureStartupOverlay`, `_ftStartupOverlay`, `_ftStartupStatus`
and all references.

```js
function _ftStartupStep(step,extra){
  log('ft_startup_step',{step:step,extra:extra||null,
    ft_status:_langRuntime.status});
}

function _ftStartupDone(ok,msg){
  // SOLE writer of _langRuntime, _ftReady, _ftLoadFailed
  _langRuntime.status=ok?'ready':'failed';
  if(ok){_langRuntime.readyAt=Date.now();_langRuntime.detector=_ftModule;}
  else{_langRuntime.error=msg||null;}
  _ftReady=ok;
  _ftLoadFailed=!ok;
  log('ft_startup_'+(ok?'ready':'degraded'),{
    message:msg||null,
    elapsed:Date.now()-_langRuntime.startedAt,
    ft_ready:_ftReady,ft_failed:_ftLoadFailed
  },ok?'ok':'warn');
  _syncFtStatus();syncBtn();syncModalBtn();
}
```

Add CSS for lobby spinner:
```css
.ft-loading .lobby-btn::after{
  content:'';display:inline-block;width:10px;height:10px;
  border:2px solid rgba(255,255,255,.35);border-top-color:#fff;
  border-radius:50%;animation:spin .7s linear infinite;
  margin-left:8px;vertical-align:middle;
}
```

In `_syncFtStatus`:
```js
var lc=document.querySelector('.lobby-card');
if(lc)lc.classList.toggle('ft-loading',_langRuntime.status==='loading');
```

---

### C7 — Gate Room Creation, Nobody Locked Out

```js
// syncModalBtn()
var ftOk=(_ftReady||_ftLoadFailed);
if(btn)btn.disabled=!(ml&&ml.value&&tl&&tl.value&&k
  &&dgKeyVerified&&tid&&tok&&ftOk);

// syncBtn()
var ftOk2=(_ftReady||_ftLoadFailed);
if(cb)cb.disabled=!($('my-lang').value&&$('their-lang').value
  &&k&&dgKeyVerified&&tid&&tok2&&ftOk2);
```

---

### C8 — Verbose Logging

In `_detectLangAsync`, after every resolution path:
```js
log('ft_detect_result',{
  text:text.slice(0,40),detected:result||'null',method:method,
  ft_status:_langRuntime.status,ft_ready:_ftReady,ft_failed:_ftLoadFailed,
  conf:conf||null
});
```

Allowed `method` values:
```
unicode_th | unicode_ja | unicode_zh | unicode_ko |
unicode_ar | unicode_hi | unicode_ru |
wasm | stub | timeout | stub_short | error
```

In `translateWithRetry`:
```js
// on each retry
log('trans_retry_detail',{code:ERR.TRANS_FAILED,attempt:retries-n+1,
  from:from,to:to,text:text.slice(0,40),error:String(e)},'warn');
// on final exhaustion
log('trans_exhausted',{code:ERR.TRANS_EXHAUSTED,
  from:from,to:to,text:text.slice(0,40)},'error');
```

---

### C9 — Wire Both Channels Through processConversationInput

**`onDGFinal`** — replace detection/normalization/translation block after
`recFinal(text)` through the relay sends:

```js
var src=room.myLang,tgt=room.theirLang,ss=++localSubSeq;
showSub(text,'mine');
processConversationInput({text:text,channel:'speech',src:src,tgt:tgt,ss:ss})
  .then(function(result){
    var srcText=result.srcText,tgtText=result.tgtText;
    relaySend({type:'subtitle',subtitleSeq:ss,text:srcText,
      sourceText:srcText,sourceLang:src,targetLang:tgt,provisional:true});
    addTr('me',srcText,srcText,src,tgt,ss,result.translationFailed);
    relaySend({type:'subtitle-update',subtitleSeq:ss,text:tgtText,
      sourceText:srcText,sourceLang:src,targetLang:tgt});
    patchTr('me',ss,tgtText,src,tgt);
  }).catch(function(e){
    log('norm_pipeline_speech',{stage:'pipeline_err',e:String(e)},'error');
  });
```

**`sendChat`** — replace detection/normalization/translation block:
```js
var result=await processConversationInput({
  text:text,channel:'chat',src:src,tgt:tgt,ss:null});
var srcText=result.srcText,tgtText=result.tgtText;
```
Pass `result.translationFailed` to entry. After `relaySend` at end:
```js
var ct=$('call-transcript');if(ct)ct.scrollTop=0;
```

---

### C10 — Fix TTS and Click Surfaces

All TTS playback routes through `speakText(text, lang)`. No direct calls to
`speechSynthesis.speak()` except inside `_doSpeak`. Audit for any other call
sites and redirect them.

```js
function speakText(text,lang){
  text=norm(text);
  if(!text){log('tts_skip',{code:ERR.TTS_UNAVAILABLE,reason:'empty'});return;}
  if(!window.speechSynthesis){
    log('tts_skip',{code:ERR.TTS_UNAVAILABLE,reason:'no_synth'});return;}
  window.speechSynthesis.cancel();
  setTimeout(function(){
    if(window.speechSynthesis.speaking||window.speechSynthesis.pending){
      setTimeout(function(){_doSpeak(text,lang);},80);return;
    }
    _doSpeak(text,lang);
  },80);
}
function _doSpeak(text,lang){
  var u=new SpeechSynthesisUtterance(text);
  u.lang=TTS_LOCALE[lang]||lang||TTS_LOCALE[room.myLang]||'en-US';
  u.onerror=function(e){
    log('tts_err',{code:ERR.TTS_FAILED,e:e.error,lang:lang},'error');};
  window.speechSynthesis.speak(u);
}
```

`lang` must be the language of the message being played. Use `data-tts-lang`
attribute value — never override with `room.myLang` globally.

CSS — prevents SVG children intercepting clicks:
```css
.tr-tts svg,.tr-tts path,.tr-tts polygon{pointer-events:none;}
.tr-use-ico svg,.tr-use-ico path{pointer-events:none;}
.pb-tts-btn svg,.pb-tts-btn path,.pb-tts-btn polygon{pointer-events:none;}
.pb-use-btn svg,.pb-use-btn path{pointer-events:none;}
.ctrl-btn svg,.ctrl-btn path,.ctrl-btn polygon{pointer-events:none;}
.vc-btn svg,.vc-btn path,.vc-btn polygon{pointer-events:none;}
```

Confirm transcript click handler dispatches `input` event after Use:
```js
ci.value=use.getAttribute('data-use-text')||'';
ci.dispatchEvent(new Event('input'));
```

---

### C11 — Inline Failed Translation with Ask Again

Update `addTr` to accept and store `failedTranslation` boolean.
`failedTranslation` entries serialize in export with source=target preserved.

In `trHtml`, when `e.failedTranslation` is true, append inside `tr-head`:
```js
+'<span style="font-size:10px;color:#f39c12;margin-left:6px;">⚠ not translated</span>'
+'<button class="tr-bump-btn" data-entry-id="'+esc(e.id||'')+'"'
+' style="background:rgba(243,156,18,.15);border:1px solid rgba(243,156,18,.4);'
+'color:#f39c12;border-radius:12px;padding:2px 8px;font-size:10px;font-weight:700;'
+'cursor:pointer;margin-left:6px;font-family:inherit;">Ask again</button>'
```

In `call-transcript` click handler:
```js
var bump=ev.target.closest('.tr-bump-btn');
if(bump){
  var eid=bump.getAttribute('data-entry-id');
  var entry=transcript.find(function(e){return e.id===eid;});
  if(entry){
    var clarifyPhrase='Could you please repeat that? There was a translation issue.';
    translateWithRetry(clarifyPhrase,'en',room.theirLang,2).then(function(msg){
      var ta=$('chat-input');
      if(ta){ta.value=msg||clarifyPhrase;
        ta.dispatchEvent(new Event('input'));ta.focus();
        toast('Clarification ready — tap send');}
    });
  }
  return;
}
```

---

### C12 — Fix Transcript Scroll

After `pbUseText` sets compose value:
```js
var ct=$('call-transcript');if(ct)ct.scrollTop=0;
```

CSS — move indicator to top:
```css
.transcript-more-indicator{top:42px;bottom:auto;}
```

Change indicator content `↓` → `↑`.

Rename `scrollToBottom` → `scrollToNewest` everywhere:
```js
function scrollToNewest(){
  var c=$('call-transcript');
  if(c){c.scrollTop=0;setTranscriptMore(false);}
}
```

Update `checkAutoScroll`:
```js
function checkAutoScroll(){
  var c=$('call-transcript');
  if(transcriptNearBottom()){c.scrollTop=0;setTranscriptMore(false);}
  else{setTranscriptMore(true);}
}
```

---

### C13 — Fix Phrasebook Card State

In `pbRunSearch`, before `host.innerHTML`:
```js
_pbCardState={};
```

In `pbAddTagI`, after `pbAddTag` and clearing input:
```js
var sd=document.getElementById('pb-search-results');
if(sd&&_pbDrawerMode==='search')pbRunSearch();
```

---

### C14 — Phrasebook Source Editing

Make source and target divs in `pbBubbleHtml` contenteditable with
`onblur` handlers `pbSrcEdited` and `pbTgtEdited`.

```js
function pbSrcEdited(id,newText){
  newText=(newText||'').trim();
  var card=pbGetCardById(id);
  if(!card||!newText||newText===card.source)return;
  card.source=newText;card.updatedAt=pbNow();
  card.clarifyChain=card.clarifyChain||[];
  card.clarifyChain.push({text:'Source edited: '+newText,
    author:'Me',timestamp:pbNow()});
  pbSaveCard(card);
  var tgtEl=document.getElementById('pbtgt-'+id);
  if(tgtEl)tgtEl.textContent='Translating…';
  translateWithRetry(newText,card.sourceLang,card.targetLang,2)
    .then(function(tr){
      if(!tr)return;
      card=pbGetCardById(id);if(!card)return;
      card.target=tr;card.updatedAt=pbNow();
      card.clarifyChain.push({text:'Auto-retranslated: '+tr,
        author:'System',timestamp:pbNow()});
      pbSaveCard(card);
      var el=document.getElementById('pbtgt-'+id);if(el)el.textContent=tr;
      pbReRenderCardPanel('clarify',id);toast('Retranslated');
    }).catch(function(){
      var el=document.getElementById('pbtgt-'+id);
      if(el){var c2=pbGetCardById(id);if(c2)el.textContent=c2.target||'';}
      toast('Retranslation failed');
    });
}
function pbTgtEdited(id,newText){
  newText=(newText||'').trim();
  var card=pbGetCardById(id);
  if(!card||!newText||newText===card.target)return;
  card.target=newText;card.updatedAt=pbNow();
  card.clarifyChain=card.clarifyChain||[];
  card.clarifyChain.push({text:'Translation manually set: '+newText,
    author:'Me',timestamp:pbNow()});
  pbSaveCard(card);pbReRenderCardPanel('clarify',id);toast('Saved');
}
```

---

### C15 — Move Phrasebook Button to Transcript Header

Remove `pb-strip-btn` and wrapper from `chat-compose-strip`.

Add to `call-transcript-header` left actions:
```html
<button class="call-transcript-btn" id="pb-strip-btn"
  onclick="pbToggleDrawer()" title="Phrases">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
</button>
```

---

### C16 — Additional Bugs

**A — PiP remote video permanently muted**
Remove `muted` from `<video id="pip-remote">`.

**B — Back-translate no loading state**
In `pbRunBT`, before `translateWithRetry`, show "Translating…" in result area.

**C — saveRecent before camera confirmed**
Move `saveRecent()` in `reuseRoom` into `.then(s){...}` after media acquired.

**D — Joining spinner stuck**
```js
var jsTimeout=setTimeout(function(){
  $('joining-screen').classList.remove('show');},10000);
```
Clear in both `.then` and `.catch`.

**E — Relay reconnect silent**
```js
if(_relayFailCount===3){
  var chip=$('room-name-chip');
  if(chip)chip.style.borderColor='rgba(243,156,18,.6)';
  toast('Reconnecting…');
}
```
Clear border in `ws.onopen`.

**F — Use button send stays disabled**
After `ci.value=...` in `tr-use-ico` handler:
```js
ci.dispatchEvent(new Event('input'));
```

---

## 8. Known Limitations

- fastText detects language only. Translation uses MyMemory via `translateWithRetry`.
- Short Latin text under 4 words skips fastText. Use 4+ word phrases for acceptance testing.
- Latin-to-Latin detection fails silently in degraded mode. Logs `method:'stub'`.
- Deepgram is locked to `room.myLang`. Cross-language speech quality is variable.
- TTS voice availability is device-dependent. `tts_err` logs on failure.

---

## 9. Explicit Conflict Resolutions

| Conflict | Resolution |
|---|---|
| Retry button | None. No retry button anywhere. Degrade, log, unblock. |
| ESM vs UMD | UMD only. No module conversion. |
| Permanent lock-out | Never. `_ftLoadFailed=true` unblocks room creation. |
| Short-text guard vs UC3 "Bonjour" | Guard is correct. Use `bonjour comment allez vous` for acceptance testing. Single-word detection is not a guaranteed feature. |
| Static vs dynamic loading | Dynamic inside `_loadFastText`. Static script block rejected. |
| State write ownership | `_ftStartupDone` only. No split updates. |
| Log event names | `norm_pipeline_speech` / `norm_pipeline_chat` + `stage:` field. |
| `TRANS_EMPTY` vs `TRANS_EXHAUSTED` | Both required. Empty/identity result = `TRANS_EMPTY`. All retries failed = `TRANS_EXHAUSTED`. |

---

## 10. Acceptance Matrix

| Role | Channel | Scenario | Required Log | Pass |
|---|---|---|---|---|
| Initiator | Speech | Same lang | `norm_pipeline_speech stage:'detect'` | Translation reaches joiner |
| Initiator | Speech | Wrong Latin (4+ words) | `norm_latin_to_latin channel:'speech'` + `norm_pipeline_speech stage:'prenorm' changed:true` | Correct translation |
| Initiator | Chat | Same lang | `norm_pipeline_chat stage:'detect'` | Translation reaches joiner |
| Initiator | Chat | Wrong Latin (4+ words) | `norm_latin_to_latin channel:'chat'` + `norm_pipeline_chat stage:'prenorm' changed:true` | Correct translation |
| Joiner | Speech | Same lang | `norm_pipeline_speech stage:'detect'` | Translation reaches initiator |
| Joiner | Speech | Wrong Latin (4+ words) | `norm_latin_to_latin channel:'speech'` | Correct translation |
| Joiner | Chat | Same lang | `norm_pipeline_chat stage:'detect'` | Translation reaches initiator |
| Joiner | Chat | Wrong Latin (4+ words) | `norm_latin_to_latin channel:'chat'` | Correct translation |
| Either | Speech | Translation fails | `trans_exhausted` + inline `⚠` | No silent failure |
| Either | Chat | Translation fails | `trans_exhausted` + inline `⚠` | No silent failure |
| Either | Any | WASM fails | `ft_startup_degraded` + `ft_failed:true` | Controls unblock |
| Either | Phrasebook | Source edit | clarify chain: edit + auto-retranslation | Target updates ≤5s |
| Either | TTS | Any button | no `tts_err` unless genuine failure | TTS plays audibly |
| Either | Transcript | New message while scrolled | `↑` indicator at top | Tap returns to newest |

---

## 11. Troubleshooting Guide

**Status pill never turns green**
Assets must return HTTP 200 with correct byte counts, not HTML.
Expected: `ft_startup_step` entries then `ft_startup_ready`.
Failure: `ft_startup_degraded` with elapsed and error.

**Room creation stays disabled after WASM failure**
Confirm `_ftStartupDone` calls `syncBtn()` and `syncModalBtn()` on failure.
Confirm gating uses `(_ftReady||_ftLoadFailed)`.

**Latin normalization does not fire**
1. `ft_detect_result method:'wasm'` absent → WASM not running
2. `method:'stub_short'` → input under 4 words, use longer test phrase
3. `_ftWhitelist` returning indices → C2 not applied
4. Detected equals src → no mismatch, no prenorm needed — this is correct behavior
Test: `bonjour comment allez vous` / `hola como estas hoy`

**TTS does nothing**
Check `tts_skip` and `tts_err`. Causes: mobile cancel race (C10 delay),
SVG intercept (`pointer-events:none`), wrong locale, direct `speechSynthesis.speak`
call bypassing `speakText`.

**Translation failure is silent**
Verify: `trans_exhausted` in log → `entry.failedTranslation===true` →
`⚠ not translated` visible → Ask Again button present.

**Use button send stays disabled**
Confirm `ci.dispatchEvent(new Event('input'))` fires after `ci.value` is set.

**Phrasebook panels inert after search**
Confirm `_pbCardState={}` resets before `host.innerHTML` in `pbRunSearch`.

---

## 12. Priority Order

```
P0 — Must ship:
  C1  asset paths
  C2  whitelist fix
  C3  architecture variables
  C4  prediction parser call sites
  C5  _loadFastText delegates to _ftStartupDone
  C6  overlay removal + _ftStartupDone as sole state writer
  C7  readiness gating — nobody locked out
  C8  verbose logging
  C9  shared pipeline wiring

P1 — Required before broad use:
  C10  TTS + SVG pointer-events + Use button input event
  C11  failed translation + Ask Again
  C12  transcript scroll

P2 — Polish:
  C13  phrasebook card state
  C14  phrasebook source editing
  C15  phrasebook button move
  C16  remaining bugs
```

**Production-ready when:** WASM loads or degrades cleanly · room creation never
permanently locks · both channels use `processConversationInput` · Latin-to-Latin
verified in speech and chat · translation failures are inline and actionable ·
TTS works across all surfaces · all acceptance matrix rows pass · version stamp
present in all three locations.
