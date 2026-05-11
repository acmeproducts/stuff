# Knowledge Transfer: Bridge Baseline Rationalization

> **Context:** This document captures the full findings of a session that surveyed
> all `bridge*.html` versions, cross-referenced the lineage timeline model, selected
> a baseline, produced a test plan, and identified a critical transcript bug.
> Intended audience: a follow-on session trying to rationalize and validate a baseline.

---

## 1. What Was Surveyed

33 `bridge*.html` files were analyzed — ranging from 21 KB (`bridge (7).html`) to
214 KB (`bridge-patched-v2.html`) — plus the full git history and the local copy of
`bridge-lineage-timeline-model.json`.

### Core feature pipeline that was used as the evaluation frame

```
Join / Rejoin
  └─ Speak (Deepgram audio) or Chat (typed)
       └─ normalizeText()
            └─ _detectLangAsync() [fastText WASM — Latin detection]
                 └─ translateWithRetry() → source language
                      └─ translateWithRetry() → target language
                           └─ subtitle overlay + transcript entry
Video: 9:16, tap-to-swap, PiP
```

---

## 2. Latin / WASM Audio Detection Pipeline

**Technology:** fastText WebAssembly (`/fastText/fasttext.js` + model `lid.176.ftz`).

**What it does:** When a speaker accidentally uses Latin/English words mid-sentence,
fastText detects the language mismatch and normalizes back to `myLang` before
translating to `theirLang`.

**Flow (from `onDGFinal`):**

```js
Promise.race([
  _detectLangAsync(text),                          // fastText WASM
  new Promise(res => setTimeout(() => res(detectLang(text, src)), 150))  // sync fallback
]).then(detected => {
  return (detected && detected !== src)
    ? translateWithRetry(text, detected, src, 2)   // normalize Latin → source lang
    : Promise.resolve(text);
}).then(srcText => {
  translateWithRetry(srcText, src, tgt, 2);        // source → target lang
});
```

**Files with this pipeline fully wired:**

| File | Status |
|---|---|
| `bridge3.html` / `bridge4.html` (v2.9) | Most complete — proper `detectLang` sync fallback |
| `bridge5.html` (v3.0.7) | Adds `translateWithRetry`; `detectLang` fallback missing (silent ReferenceError on timeout; WASM path still works) |
| `bridge8.html` / `bridge-restore.html` (v3.1.0) | Correct promise nesting, `translateWithRetry`, `normalizeText`; `detectLang` stubbed as `return src\|\|'en'` — WASM activates when loaded, fails gracefully when not |

---

## 3. Lineage Model Findings

The local `bridge-lineage-timeline-model.json` (32 entries, May 3–9 2026) was
overlaid against the live file survey.

**Critical finding: the model starts too late.**

- All 32 entries cover only `bridge-patched.html`, `bridge-patched-v1.html`,
  `bridge-patched-v2.html`, `bridge-try.html`, and the restore series.
- The very first entry (seq=1, `ec23f33`, May 3) already has 14 regression
  markers — `composeFocusMute` and the full phrasebook v2 system were present
  from the start of the model's window.
- The earliest `bridge-patched-v1` commit (seq=7, `8dc8a82`) already had 21
  regression markers on creation day.
- **There is no clean window in the lineage model.** It does not reveal any
  committed version superior to `bridge8.html`.

The pre-regression files (`bridge8`, `bridge-restore`, restore-plus series) appear
only as a side-effect of seq=25 (`7375fa6`), which the model tracked as a
lineage-json change. Their html content was not modeled.

---

## 4. Restore Series Breakdown

The `bridge-restore*` files are clean incremental builds with no regressions:

| File | Size | What's added |
|---|---|---|
| `bridge-restore.html` = `bridge8.html` | 105 KB | — baseline — identical md5 |
| `bridge-restore-plus-1.html` | 107 KB | `_silentAudioCtx` / `_silentOsc` / `_cleanupSilentAudioHelper()` — keeps WebRTC alive with a 0 Hz silent oscillator track when manually muted |
| `bridge-restore-plus-2.html` | 107 KB | `_pendingJoin`, `inviteDgKey`, `inviteCfTid`, `inviteCfTok` — pass Deepgram + TURN credentials via invite URL params (`?k=&tid=&tok=`) |
| `bridge-restore-plus-3.html` | 113 KB | Lightweight phrase drawer: `/` search, `//` commands, plain localStorage, 2-entry seed. **No** `composeFocusMute`, **no** `PB_SEED` blob, **no** `pbGetCards` system |

All four files confirmed zero `composeFocusMute`, zero phrasebook system
(`pbGetCards` / `PB_SEED` / `pbSaveNewCard`), zero duplicate DOM IDs.

---

## 5. Recommended Baseline

**`bridge-restore-plus-2.html` — v3.1.0, 107 KB**

Rationale:
- Last clean version before any phrase feature enters the codebase
- Adds the silent-audio mute helper (real infrastructure, no UI regression)
- Adds invite-URL credential passing (clean join flow improvement)
- Full `callPhase` state machine (23 states), `lastSessionContext`, `rejoinCall()`
- `normalizeText()` (NFKC + invisible char stripping)
- `translateWithRetry()` with exponential backoff
- `_detectLangAsync()` WASM Latin detection in both audio and chat pipelines
- 9:16 video layout, tap-to-swap, no PiP (PiP is backlog — see §7)
- Zero `composeFocusMute`, zero duplicate DOM, zero phrasebook system

**Do not use `bridge-patched-v1.html` or any `bridge-patched*` file as a
baseline** — they were born with regressions and every committed snapshot
of those files contains `composeFocusMute` and the full phrasebook v2 system.

---

## 6. Test Plan

Test against **`bridge-restore-plus-2.html`**. All 29 items below must pass
before the file is accepted as baseline.

### A. Join / Rejoin Flow

1. Creator opens file → idle screen, no console errors, no stale state.
2. Creator fills room name, source language, Deepgram key, taps **Start Call** →
   `callPhase`: `idle → prejoin → joining_media → call_connecting`, camera + mic
   requested, local video appears in 9:16.
3. Joiner opens invite link → URL params (`k`, `tid`, `tok`, `ml`, `tl`, `n`)
   pre-fill credentials and language, **Join Call** button active, no manual entry needed.
4. Joiner taps **Join Call** → `callPhase → call_live` on both sides, remote video
   appears, mic indicator active.
5. Creator taps **End** → `callPhase → ending_local`, both sides see post-call
   screen, **Rejoin** button visible on joiner's device.
6. Joiner taps **Rejoin** → `rejoinCall()` restores `lastSessionContext`, re-enters
   join flow with same languages and room, reaches `call_live` without re-entering
   credentials.
7. Repeat end + rejoin three times → no memory leaks, no duplicate Deepgram
   connections, no stale event listeners causing double-transcription.

### B. Speak (Audio) Pipeline

8. Creator speaks in source language → Deepgram STT fires `onDGFinal()` →
   `normalizeText('speech')` strips invisible chars → `_detectLangAsync()` runs;
   language matches `myLang` → text passes through unchanged.
9. Creator accidentally speaks a Latin/English word mid-sentence → fastText detects
   mismatch → `translateWithRetry(text, detected, myLang)` normalizes back →
   feeds into source→target translation → joiner sees correct target subtitle.
10. WASM not yet loaded at call start (first ~2 s) → 150 ms timeout fires,
    `detectLang` stub returns `src` gracefully, translation still completes — no
    silent failure, no `undefined` subtitle.
11. Joiner speaks → symmetrical pipeline → creator sees target-language subtitle.
12. Both speak simultaneously → no cross-contamination of subtitle tracks.

### C. Chat (Typed Text) Pipeline

13. Creator types and sends → `sendChat()` → `normalizeText('chat')` →
    `_detectLangAsync` races 150 ms timeout → `translateWithRetry` → both
    `sourceText` and `translatedText` relay to other side → both transcript panes
    update.
14. Creator types in wrong language → Latin-detection path normalizes to `myLang`
    before translating for joiner.
15. Creator sends empty / whitespace message → `normalizeText` returns empty string,
    `sendChat` returns early — no empty transcript entry, no relay.
16. Joiner types a reply → symmetrical, arrives in creator's language in creator's
    transcript.

### D. Video / Swap

17. Local video in bottom-right at 9:16 aspect ratio, remote fills screen — no
    letterboxing, no overflow.
18. Tap local video → `swapVideos()` toggles `.swapped` — local becomes full-screen,
    remote moves to corner.
19. Tap remote video → same swap behavior.
20. Rotate device to landscape → layout adapts, videos visible and unclipped.

### E. Mute / Unmute (Silent-Audio Helper)

21. Creator taps mic during live call → `_micToggleInFlight` guard active, audio
    tracks removed, `_makeSilentTrack()` inserts 0 Hz oscillator via
    `_silentAudioCtx`, `replaceTrack()` on WebRTC sender — remote side silent but
    connection stays alive, Deepgram stops.
22. Creator taps mic again to unmute → silent track removed, real mic re-added via
    `replaceTrack()`, Deepgram restarts, transcription resumes.
23. Mute → end call → rejoin → no stale `_silentAudioTrack`, fresh mic on rejoin.

### F. Credentials via Invite URL

24. Joiner opens invite URL with `k`, `tid`, `tok` on a fresh device (no prior
    localStorage) → fields pre-fill, no credential prompt, join proceeds.
25. Invite credentials must NOT persist to localStorage → after join + refresh,
    credential fields are empty.

### G. Regression Guards

26. Inspect DOM → confirm no duplicate `id="pip-overlay"` (or none at all,
    since plus-2 has no PiP overlay).
27. Chat textarea has no `onfocus` handler → typing in chat does not mute mic.
28. Call `sendChat()` with valid message during `call_live` in browser console →
    no `ReferenceError: detectLang is not defined`, no `undefined` subtitle.
29. Send 20 chat messages rapidly → `translateWithRetry` backoff visible in logs
    for rate-limited attempts, all messages eventually resolve, no UI freeze,
    no lost messages.

---

## 7. Bug Found: `addTr` Transcript Dedup Drops Joiner Speech

### Symptom

Joiner speaks → **subtitle appears correctly on the video overlay** → but the
entry is **silently dropped from the transcript panel**. Reproducible when the
joiner repeats any phrase within ~5 seconds without the creator speaking in between.

### Root Cause

`addTr()` (line 1234) uses **text-content equality** as its dedup key, not
`subtitleSeq`. Every speech entry arrives with a unique `subtitleSeq` counter
(incremented per Deepgram final), but `addTr` ignores it:

```js
// Line 1237 — the bug
var prev = transcript.length ? transcript[transcript.length - 1] : null;
if (prev && prev.who === who
    && normalizeText(prev.sourceText, 'compare') === normalizeText(src, 'compare')
    && Date.now() - prev.ts < 5000) return;  // ← drops legitimate repeat utterances
```

**Failure chain in full:**

1. Joiner says "Hello" → sender relays `subtitle` (ss=1) + `subtitle-update` (ss=1)
2. Creator receives `subtitle` → `showSub()` fires (overlay ✓) → `addTr('partner', 'Hello', ..., ss=1)` → added ✓
3. Creator receives `subtitle-update` → `patchTr('partner', ss=1, 'สวัสดี', ...)` → patches entry ✓
4. Joiner says "Hello" again 3 s later → sender relays `subtitle` (ss=2) + `subtitle-update` (ss=2)
5. Creator receives `subtitle` → `showSub()` fires (overlay ✓) → `addTr('partner', 'Hello', ..., ss=2)` → **prev.who=partner, prev.sourceText='Hello', same text, <5 s → DROPPED**
6. Creator receives `subtitle-update` → `patchTr('partner', ss=2, 'สวัสดี', ...)` → searches for `subtitleSeq===2` → **not found** → falls through to `addTr('partner', 'สวัสดี', 'สวัสดี', ..., ss=2)`
7. This `addTr` call passes (prev.sourceText='Hello' ≠ 'สวัสดี') → entry added but with **`sourceText = translatedText = 'สวัสดี'`** — no original source language text stored

There is also a 1-second dedup window mismatch: the sender-side `isDupe` guard
expires at 4000 ms (`DEDUP_MS`), but `addTr`'s receiver-side check is 5000 ms.
In the 4–5 s range, the sender relays (correct) but the receiver silently drops.

### Fix

Gate the text-content dedup on entries **without** a `subtitleSeq`. If `ss` is
present, use it as the uniqueness key (exact ID match only):

```js
function addTr(who, src, tr, sL, tL, ss) {
  src = normalizeText(src, 'speech');
  tr = normalizeText(tr, 'speech');
  if (!src && !tr) return;
  if (!tr) tr = src;

  if (ss) {
    // subtitleSeq is the unique key per utterance — block only exact replay
    if (transcript.some(function(e){ return e.who===who && e.subtitleSeq===ss; })) return;
  } else {
    // text-dedup only for ss-less entries (shouldn't occur for speech in practice)
    var prev = transcript.length ? transcript[transcript.length-1] : null;
    if (prev && prev.who===who
        && normalizeText(prev.sourceText,'compare')===normalizeText(src,'compare')
        && Date.now()-prev.ts < 5000) return;
  }

  var entry = {type:'speech', who:who, sourceText:src, translatedText:tr,
               srcLang:sL, tgtLang:tL, subtitleSeq:ss||null, ts:Date.now()};
  transcript.push(entry);
  if (transcript.length > MAX_TR) transcript.splice(0, transcript.length-MAX_TR);
  saveTr(); appendTrDom(entry);
  if (transcriptTtsOn && who==='partner' && tr && !ss) speakText(tr, tL||room.myLang);
}
```

The sender-side `isDupe` / `recentFinals` guard is correct and should be kept —
it prevents Deepgram from double-firing the same final within 4 s.
Only the receiver-side `addTr` dedup needed fixing.

### Test cases to add for this bug

- Joiner says the same phrase twice within 4 s → both entries appear in transcript
- Joiner says the same phrase twice with 4.5 s gap → both entries appear (window mismatch fixed)
- Joiner says the same phrase twice with the creator speaking in between → both entries appear (this already worked)

---

## 8. Backlog (ordered)

**Next release (v3.2.0) — pending baseline confirmation:**
1. Apply `addTr` fix above
2. Phrase drawer — lightweight (`bridge-restore-plus-3` delta): `/` search, `//` commands, localStorage, small seed
3. `detectLang` sync fallback: explicit named stub so the 150 ms timeout path is traceable in logs
4. `onDGFinal` `.catch()` added so Latin-detect pipeline errors surface in logs
5. `DEDUP_WINDOW_MS` named constant (currently hardcoded `5000` in `addTr`, `4000` in `isDupe`)

**High — core quality:**
6. PiP — reintroduce on single `id="pip-overlay"` element; native `requestPictureInPicture` primary, custom overlay fallback
7. `composeFocusMute` rebuild — paired `onfocus` / `onblur` (mute on focus, restore on blur); guarded by `_micToggleInFlight`
8. `translateWithRetry` toast on final failure ("Translation delayed — retrying")

**Medium — feature completeness:**
9. Phrasebook v2 — save/add cards (`pbSaveNewCard`, `pbGetCards`/`pbSetCards`)
10. Phrasebook catalog system — multi-catalog, import/export by URL, `pbOpenBooksModal`
11. Back-translation / verdict — round-trip QA check per phrase card
12. File attachment in chat — direct `href` to dataUrl (not the modal approach)

**Low — polish and tooling:**
13. Transcript export: rename `type:'phrasebook'` → `type:'transcript'`, add `detectedLang` and `normalizedText` fields
14. Lineage model: wire `scripts/build-lineage-model.mjs` into CI
15. `callPhase` debug HUD: tap-to-reveal, gated on `?debug=1`
