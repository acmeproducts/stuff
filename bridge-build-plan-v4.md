# bridge-build-plan-v4.md
**Single source of truth for next TalkBridge shippable build**

**Date:** 2026-05-13  
**Baseline:** `bridge-cgpt-v1-2.html` uploaded pre-mistranslation/pre-swipe candidate  
**Regression reference:** `bridge-patched-v1.html`    
**Build output convention:** `bridge-<target>.html`  
**Default next version suggestion:** `dojo-version 1.1.0`

---

## 0. Non-Negotiable Scope

This plan produces a shippable system. It must not introduce experimental UX features that are not fully specified.

Explicitly excluded from v4:

1. Swipe-to-reply.
2. Permanent transcript-bubble `Mistranslation?` button.
3. Threaded inline replies.
4. Any new interaction model not explicitly defined in this plan.

These items are backlog only.

---

## 1. Build Command Format

```text
build <target> version <version> using bridge-build-plan-v4.md
```

Example:

```text
build bridge-prod-v4.html version dojo-version 1.1.0 using bridge-build-plan-v4.md
```

Codex/build agent must:

1. Use `bridge-cgpt-v1-2.html` as the implementation baseline.
2. Use `bridge-patched-v1.html` as a regression reference for call/video behavior.
3. Apply the changes in this plan only.
4. Stamp `<version>` in exactly three required places.
5. Produce one complete HTML file.
6. Produce a validation report.
7. Do not build from alpha.
8. Do not pull in mistranslation/swipe features.

---

## 2. Version Stamping

Update exactly these three locations:

1. HTML comment at top:

```html
<!-- talkbridge · dcr · v<version> -->
```

2. Lobby/footer visible version:

```html
<span style="font-size:10px;color:var(--text-muted);">v<version></span>
```

3. Startup log:

```js
log('startup',{v:'<version>',ua:navigator.userAgent.slice(0,80)});
```

Validation must fail if the version appears in fewer or more than these three intentional stamp locations, except where the validation report names the version as metadata.

---

## 3. Do-Not-Touch Constants

These must remain unchanged:

```js
RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
RELAY_WS   = 'wss://'+RELAY_BASE
RELAY_APP  = 'talk-say-v1'
```

Also preserve:

```text
localStorage prefix: ts3_
Transcript key prefix: tb_transcript_
Recent rooms key: tb_recent_rooms
Device ID key: tb_dev
```

The relay Cloudflare Worker remains read-only. Do not change relay behavior, relay message format, or relay connection protocol unless explicitly called out in this plan.

---

## 4. Startup Health System

### 4.1 Required dependencies

Add or complete a launch health registry:

```js
var startupHealth={
  ft:{status:'pending',message:'Language model pending',required:false},
  dg:{status:'pending',message:'Deepgram pending',required:true},
  relay:{status:'pending',message:'Relay pending',required:true},
  turn:{status:'pending',message:'TURN pending',required:true},
  media:{status:'pending',message:'Media pending',required:true}
};
```

### 4.2 Health pill behavior

Add a bottom-center lobby pill.

| Pill color | Meaning | Proceed? |
|---|---|---:|
| Green | Required dependencies ready; optional dependencies ready or acceptable. | Yes |
| Yellow | Degraded but not broken, e.g. FastText unavailable but Unicode fallback active. | Yes only when no required dependency failed |
| Red | Required dependency failed: DG, Relay, TURN, or Media. | No |

Required log events:

```text
startup_check_start
startup_check_result
startup_health
startup_health_red_block
```

### 4.3 Dependency-specific checks

| Dependency | Check | Required logs |
|---|---|---|
| FastText | UMD asset loads, model loads, smoke predictions pass or degrade. | `ft_startup_step`, `ft_startup_ready`, `ft_startup_degraded` |
| Deepgram | API key verification plus test WebSocket accessibility where possible. | `dg_check_start`, `dg_check_ok`, `dg_check_fail` |
| Relay | WebSocket probe against relay endpoint. | `relay_check_start`, `relay_check_ok`, `relay_check_fail` |
| TURN | Credential generation request succeeds and returns ICE server config. | `turn_check_start`, `turn_check_ok`, `turn_check_fail` |
| Media | On call entry, local audio/video tracks exist and are live. | `media_check_start`, `media_check_ok`, `media_check_fail` |

---

## 5. Manual Mic and Deepgram Reliability

### 5.1 Remove compose auto-mute

Remove or neutralize:

```html
onfocus="composeFocusMute()"
onblur="_pbRestoreMic()"
```

`composeFocusMute()` and `_pbRestoreMic()` must not toggle the microphone. If retained as compatibility functions, they must be no-ops and log `compose_auto_mute_disabled` at most once per session.

### 5.2 Deepgram startup hardening

Fix all undeclared variables in `startDeepgram()`. In particular, no `role:role` logging or equivalent undeclared reference is allowed.

Required structure:

```js
function reconcileDeepgramState(reason){
  var should=...;
  log('dg_reconcile',{why:reason,desired:dgDesired,muted:micMutedByUser,active:dgActive,should:should,liveMic:isLiveMicTrackPresent()});
  if(should&&!dgActive){
    try{startDeepgram();}
    catch(e){log('dg_start_err',{why:reason,e:String(e)},'error');showSpeechStatus('Transcription failed to start');}
  }else if(!should&&dgActive){stopDeepgram();}
}
```

### 5.3 Voice-heard indicators

Add visible UI indicators for speech capture:

| State | UI requirement | Required log |
|---|---|---|
| DG starting | Small transcription status text or mic halo. | `dg_reconcile` |
| DG open | Listening state. | `dg_open` |
| Capture active | Listening state remains visible. | `dg_worklet_active` or `dg_scriptproc_active` |
| First frame | “Mic receiving audio.” | `dg_audio_first_frame` |
| Voice hot | Mic glow or equivalent. | `dg_audio_hot` |
| Audio cold | “I am listening but audio is quiet.” | `dg_audio_cold` |
| No final after voice | “I heard you but no transcript was produced.” | `dg_no_final_after_voice` |
| Final received | Transcript row appears. | `dg_final` |

No spoken input may disappear without visible feedback.

---

## 6. Normalization and Translation Pipeline

Keep `processConversationInput`, but enforce this contract:

```js
{
  rawText,
  srcText,
  tgtText,
  detected,
  detectionMethod,
  detectionConfidence,
  preNormalized,
  translated,
  translationFailed,
  userVisibleStatus
}
```

### 6.1 Speech channel rules

1. Speech starts with the selected speaker language as the default source.
2. FastText may override the selected source only when confidence meets the speech threshold and the text has enough evidence.
3. Short Latin phrases must log `LANG_DETECT_TOO_SHORT` and stay in selected source language.
4. When pre-normalization occurs, log `norm_latin_to_latin` for Latin-to-Latin cases.
5. When translation succeeds, log `speech_source_sent` and `speech_translation_sent`.
6. When translation fails or returns identity, show an inline failed-translation marker.

### 6.2 Chat channel rules

1. Chat may use detection more aggressively than speech.
2. Typed/pasted text in the target language may be pre-normalized back to source only if confidence and detection method justify it.
3. Translation identity must be treated as failure unless source and target are equal.
4. All failures must be visible inline and logged.

Required log events:

```text
norm_pipeline_speech stage:start
norm_pipeline_speech stage:detect
norm_pipeline_speech stage:prenorm
norm_pipeline_speech stage:translate
norm_pipeline_speech stage:pipeline_err
norm_pipeline_chat stage:start
norm_pipeline_chat stage:detect
norm_pipeline_chat stage:prenorm
norm_pipeline_chat stage:translate
norm_pipeline_chat stage:pipeline_err
trans_silent_fail
speech_source_sent
speech_translation_sent
```

---

## 7. TTS Architecture

Replace the v2 “all TTS calls go through `speakText`” rule.

### 7.1 Required low-level adapter

Only one low-level adapter may call `speechSynthesis.speak()` directly:

```js
function ttsSpeakNow(opts){
  // opts: {text, lang, surface, mode, entryId}
}
```

### 7.2 Required surface-specific functions

```js
function speakTranscriptManual(entryId, side){...}
function speakPartnerAuto(entryId){...}
function speakPhrasebook(cardId, side){...}
function speakBackTranslate(text, lang){...}
function ttsStop(reason){...}
```

### 7.3 Cancellation rules

| Surface | May cancel existing TTS? | Notes |
|---|---:|---|
| Transcript manual tap | Yes | User explicitly requested playback. |
| Partner auto TTS | No | Queue or skip; never hammer manual playback. |
| Phrasebook manual TTS | Yes only against same surface | Do not kill partner auto unless user explicitly taps stop. |
| Back-translate TTS | Yes only against same surface | Do not generate repeated interruption errors. |

Expected interruption caused by explicit user stop must not log as an error.

Required logs:

```text
tts_request
tts_start
tts_end
tts_skip
tts_stop
tts_interrupted_expected
tts_err
```

Validation must confirm every TTS surface works independently.

---

## 8. Video, PiP, Join, and Rejoin

### 8.1 Remote video requirements

1. `remote-video` must always retain the remote stream while the call is active.
2. PiP must not steal or clear `remote-video.srcObject`.
3. PiP overlay IDs must be unique exactly once.
4. `pip-remote` must not be permanently muted unless there is a documented browser-autoplay fallback; main remote audio/video must remain functional.
5. `refreshRemoteVideo()` must verify both track state and playback state.

Required logs:

```text
rtc_track
rtc_refresh
rtc_remote_video_attached
rtc_remote_video_play_ok
rtc_remote_video_play_err
rtc_remote_video_track_muted
rtc_remote_video_track_unmuted
rtc_remote_video_blank_warn
```

### 8.2 Bilateral video acceptance tests

Must pass in both directions:

| Test | Expected result |
|---|---|
| Creator starts room; joiner joins | Joiner sees creator main video. |
| Joiner camera active | Creator sees joiner main video. |
| Creator enters PiP then expands | Main remote video restores. |
| Joiner enters PiP then expands | Main remote video restores. |
| Creator leaves and rejoins | Joiner sees creator after rejoin. |
| Joiner leaves and rejoins | Creator sees joiner after rejoin. |

---

## 9. Phrasebook and Use Buttons

### 9.1 Required behavior

| Surface | Required Use behavior |
|---|---|
| Transcript Use | Puts selected text into compose, dispatches `input`, focuses compose, enables send. |
| Phrasebook Use during active call | Sends the selected phrase immediately only if the button is explicitly labeled or treated as “Send phrase”; otherwise it must populate compose. |
| Phrasebook Use outside active call | Populates compose or prepares room context without sending. |
| Back-translate Use | Populates the proper side/context and dispatches `input`. |

No Use button may appear to do nothing. Every Use action must log:

```text
use_action
use_action_sent
use_action_composed
use_action_failed
```

### 9.2 Phrasebook editing

Keep source/target editing only if the implementation passes:

1. Editing source retranslates target.
2. Editing target stores manual override.
3. Both save to phrasebook and persist after reload.
4. Errors are inline, not toast-only.

---

## 10. Backlog Items Explicitly Deferred

Create backlog entries, but do not implement in this build:

| Backlog item | Reason deferred |
|---|---|
| Mistranslation button | Needs product definition: placement, recipient behavior, queueing, context, transcript representation. |
| Swipe-to-reply | Gesture UX was poorly defined and risks accidental actions. |
| Inline threaded replies | Requires transcript data model and relay contract changes. |

---

## 11. Required Validation Report

Every v4 build must output a validation report with this table:

| Area | Pass/Fail | Evidence |
|---|---|---|
| Version stamped exactly 3 places |  |  |
| JS syntax passes |  |  |
| Static DOM ID uniqueness |  |  |
| Do-not-touch constants unchanged |  |  |
| Startup health pill present |  |  |
| FT check logged |  |  |
| DG check logged |  |  |
| Relay check logged |  |  |
| TURN check logged |  |  |
| Media check logged |  |  |
| Manual mic only |  |  |
| No `role:role` or undeclared startup refs |  |  |
| DG hot/cold/no-final indicators |  |  |
| Speech pipeline no silent failure |  |  |
| Chat pipeline no silent failure |  |  |
| TTS transcript manual |  |  |
| TTS partner auto |  |  |
| TTS phrasebook |  |  |
| TTS back-translate |  |  |
| Use buttons function |  |  |
| Creator-to-joiner video |  |  |
| Joiner-to-creator video |  |  |
| PiP restore |  |  |
| Join/rejoin |  |  |
| Mistranslation/swipe absent |  |  |

---

## 12. Final Build Gate

A build is blocked if any of these are true:

1. Any required startup dependency is red.
2. DG can open but no audio-frame indicator appears after mic permission.
3. User speech can be heard but no visible UI status appears.
4. TTS logs repeated unexpected `interrupted` errors.
5. Remote main video is blank on either role while PiP/local preview works.
6. Compose focus changes mic state.
7. `role:role` or any undeclared variable remains in startup paths.
8. Swipe/mistranslation UI appears in the shippable build.
9. Duplicate static DOM IDs exist.
10. JavaScript syntax check fails.


## Clean-base boundary gate (restart v3)
- Enforce copy chain exactly: PRE-BASE -> BASE -> PRE-SHIP -> SHIP; verify with file hash checkpoints after each copy.
- Pre-promotion checklist: no merge markers; no forbidden stage contamination; JS syntax passes inline script `new Function(...)` validation.
- PRE-BASE/BASE forbidden grep: `fasttext-wrapper.umd.js|lid.176.ftz|lid.176.bin|loadModel\(|FastText\(`.
- WASM-stage required reference validation: compare PRE-SHIP loader flow against `bridge-pre-ship-cc.html` before promotion.
- PRE-SHIP acceptance: wrapper `./fastType/fasttext-wrapper.umd.js`; model `./fastType/lid.176.ftz`; fallback `./fastType/lid.176.bin`; robust `parsePredictResult`; no `r[0].prob`/`r[0].label`; non-blocking flow on load failure.
- Runtime log gate: `.ftz` failure must emit retry attempt for `.bin`, then retry success or final failure; app must continue join/rejoin/call path.
