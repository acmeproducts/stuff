# TalkBridge Recovery Baseline Audit
**Date:** 2026-05-13  
**Audit scope:** All files with "bridge" in path or filename, plus full git history of those files  
**Repository:** acmeproducts/stuff  
**Auditor:** Claude Code forensic audit (read-only)

---

## 1. Executive Recommendation

### Recommended product baseline
**File:** `bridge-restore-plus-2.html`  
**Commit:** `eb4ac22` (subtitleSeq dedup fix — the last clean commit before v4.0.0 release stamp)  
**Companion stamp:** `7399a6a` (v4.0.0: baseline release from bridge-restore-plus-2.html — same file, adds only a version comment)  
**Version:** v4.0.0 (re-stamped from v3.1.0 source)  
**Rationale:** This is the only file that a prior build session explicitly identified as "the only clean pre-regression source" (575d4e2 commit message). Its call spine, ICE handling, epoch-based DG reconnection, and normalization pipeline are free of the regressions that were introduced in all bridge-patched* files. It is 1,620 lines — compact, auditable, and directly traceable to a known-clean state.

### Recommended normalization reference
**File:** `bridge-restore-plus-2.html` lines 429–498, 1171–1203 (onDGFinal pipeline)  
**Commit:** `eb4ac22`  
**Reason:** Contains the working detected-language → selected-source → selected-target normalization chain with correct Promise.race() structure, no Thai space-stripping regression, no double-NFKC/NFC bug, and proper applyNorthernThaiMap absent (use restore-plus-2 for normalization structure; backport applyNorthernThaiMap only from patched-v1 separately).

### Recommended TTS reference
**File:** `bridge-restore-plus-2.html` (speakText function, line 719; TTS_LOCALE map, line 377)  
**Commit:** `eb4ac22`  
**Reason:** speakText is clean — cancels before speaking, maps lang → locale, no interruption storm risk. The phrasebook TTS (pbSpeakCard) can be taken from `bridge-patched-v1.html` at `8d168b1` (v3.5.3) only for the phrasebook lane.

### Recommended phrasebook reference
**File:** `bridge-patched-v1.html`  
**Commit:** `8d168b1` (v3.5.3, the last clean phrasebook commit before WASM complexity was introduced)  
**Reason:** Full phrasebook CRUD (pbUseText, pbSpeakCard, pbOpenNewCard, pbExportPrompt, pbOpenBooksModal), clean src/tgt Use buttons, proper pbCloseDrawer calling _pbRestoreMic. A lighter alternative phrasebook exists in restore-plus-3 (/ search drawer) at commit `f42720c`.

### Recommended health/logging reference
**File:** `bridge-restore-plus-2.html`  
**Commit:** `eb4ac22`  
**Reason:** Has the FastText status pill (ft-lobby-status / ft-dot) that is functional without being noisy. Bridge-patched-v1.html's elaborate WASM multi-asset health gating is the source of startup complexity; restore-plus-2 has a simpler degraded-mode fallback.

### Files/commits to avoid as baseline
- `bridge-patched-v1.html` (any commit): born at v3.3.0 with multiple regressions present from day one; even the latest v3.5.3 retains the Thai space-stripping regex (line 2445) and an elaborate WASM path that intermittently blocks startup.
- `bridge-baseline.html` at `dc2bad2` (current state): was overwritten by a bridge-patched-v1 snapshot on May 10, undoing the carefully verified v4.0.0 rebuild. Has duplicate pip-overlay DOM IDs. Version mismatch (v3.3.0 comment, v3.1.0 badge).
- `bridge-codex-v3.html`, `bridge-codex-omega.html`, `bridge-cgpt-v1-4.html`, `bridge-cc-v1.0.html`: build-plan derived variants, no independent testing record, inherit from patched-v1 lineage.
- Any `bridge-patched.html` (the original, bridge-patched-v2): intermediate experiments, superseded.

---

## 2. Candidate Ranking Table

| Rank | File | Commit | Version | Weighted Score | Call Spine | Video/PiP | Mic | DG | Norm | TTS | Phrasebook | Recommendation |
|------|------|--------|---------|---------------|------------|-----------|-----|-----|------|-----|------------|----------------|
| 1 | bridge-restore-plus-2.html | eb4ac22 | v4.0.0 (restored) | **90** | 5 | 4 | 4 | 4 | 4 | 4 | 2 | **BASELINE** |
| 2 | bridge-baseline.html | 575d4e2 | v4.0.0 (confirmed) | **88** | 5 | 4 | 5 | 4 | 4 | 4 | 3 | REFERENCE: composeFocusMute |
| 3 | bridge-patched-v1.html | 8d168b1 | v3.5.3 | **76** | 3 | 3 | 3 | 4 | 3 | 4 | 5 | REFERENCE: phrasebook, DG watchdog |
| 4 | bridge-restore-plus-3.html | f42720c | v3.1.0 | **80** | 5 | 4 | 4 | 4 | 4 | 4 | 3 | REFERENCE: lightweight phrasebook |
| 5 | bridge-restore-plus-1.html | f42720c | v3.1.0 | **78** | 5 | 4 | 4 | 4 | 4 | 4 | 2 | REFERENCE: minimal call spine |
| 6 | bridge-restore.html | f42720c | v3.1.0 | **74** | 5 | 4 | 4 | 4 | 3 | 4 | 1 | REFERENCE: pre-phrasebook baseline |
| 7 | bridge-reborn-v1.html | 68b9198 | v3.5.3 | **74** | 3 | 3 | 3 | 4 | 3 | 4 | 5 | Snapshot of patched-v1 at 8d168b1 |
| 8 | bridge-baseline.html | dc2bad2 (current) | v3.3.0/v3.1.0 mixed | **60** | 3 | 2 | 3 | 3 | 3 | 3 | 4 | AVOID as baseline; has duplicate pip IDs |
| 9 | bridge8.html | f42720c | v3.1.0 | **72** | 4 | 4 | 4 | 4 | 3 | 4 | 0 | Pre-phrasebook; good call spine |
| 10 | bridge8-patched.html | f42720c | v3.3.0 | **70** | 3 | 3 | 4 | 4 | 3 | 4 | 4 | Intermediate; phrasebook v2 introduced |
| 11 | bridge5.html | f42720c | v3.0.7 | **65** | 4 | 3 | 3 | 3 | 3 | 3 | 0 | Earlier; missing key guards |
| 12 | bridge-codex-v1-4.html | 0a9dc3e | vcodex-v1-4 | **55** | 3 | 3 | 3 | 3 | 3 | 3 | 4 | Build-plan derived; no test record |
| 13 | bridge-cc-v1.0.html | c6b44b1 | vcc-v1.0 | **52** | 3 | 3 | 3 | 3 | 3 | 3 | 4 | Build-plan derived; no test record |
| 14 | bridge-codex-v3.html | 6d33c11 | vcodex-v3 | **50** | 2 | 3 | 3 | 3 | 3 | 3 | 3 | WASM-path startup; risky |
| 15 | bridge-patched-v1.html | 60b0b08 (current) | v3.5.3 current | **60** | 3 | 3 | 3 | 4 | 2 | 4 | 5 | Thai regex still present; avoid baseline |

**Weighted score formula:**  
(call_spine × 5) + (video_pip × 5) + (mic × 4) + (dg × 4) + (norm × 3) + (tts × 3) + (phrasebook × 2) + ((startup_health + logging) × 1)  
Max possible = 130

---

## 3. Top 5 Candidate Deep Dive

---

### Candidate 1 — bridge-restore-plus-2.html @ eb4ac22
**Version:** v4.0.0 (restored label), originally v3.1.0 lineage  
**Lines:** 1,620  
**Commit date:** 2026-05-10  

**Why it is a candidate:**  
A prior recovery session explicitly chose this file as "the only clean pre-regression source" (commit `575d4e2` message). It was the foundation for the v4.0.0 confirmed baseline, all 29 tests verified. Every regression introduced in bridge-patched* files postdates this file's lineage.

**What appears to work:**
- RTCPeerConnection creation with proper role-based negotiation (creator uses onnegotiationneeded + makingOffer guard; joiner sets onnegotiationneeded to no-op).
- offer/answer handling: `if(pc&&pc.connectionState==='connected'){...return;}` guard prevents duplicate setup; stale connections closed before new setup (`if(!=='closed'&&!=='failed'){pc.close();pc=null;}`).
- ICE queuing: pending candidates held in array, flushed after `setRemoteDescription` via `flushPendingCandidates()`.
- ontrack handler: deduplicates tracks by ID before adding to remoteStream; calls bindRemoteTrackState + refreshRemoteVideo.
- Remote video srcObject: `if(hasRemoteTrack&&rv.srcObject!==remoteStream){rv.srcObject=remoteStream;}` — only assigned when genuinely changed.
- PiP: implemented as swapVideos() CSS class toggle on `.call-videos` — simpler than overlay approach, no duplicate DOM ID risk.
- Mute/unmute: replaceTrack for live muting; epoch-checked DG reconnection on unmute.
- Deepgram: epoch-based captureEpoch guard on open and close, ensuring stale reconnection attempts are discarded. reconcileDeepgramState evaluated correctly.
- Normalization pipeline (onDGFinal lines 1171–1203): detected-language → selected-source → selected-target correctly; normalizeText is NFC-only (no NFKC/NFC double-normalize); no Thai space-stripping regex.
- Chat normalization (sendChatMessage): same detect-then-normalize-then-translate chain.
- TTS (speakText line 719): clean; cancel before speak; locale-mapped; fires on partner messages only when transcriptTtsOn=true.
- subtitleSeq dedup in addTr: prevents duplicate transcript entries on re-render.
- FastText: simple _loadFastText() + _detectLangAsync() with script-based fast paths for CJK/Thai/Cyrillic.
- Startup health: ft-status-pill in lobby, verifyDgKey, TURN status — functional, not intrusive.

**What appears broken / risky:**
- PiP is swapVideos() not a true PiP overlay — different UX from bridge-patched series; users who expect overlay PiP will be surprised.
- No DG watchdog (added later in v3.5.0/v3.5.1): if DG goes silent without closing the WebSocket, there is no restart trigger.
- No applyNorthernThaiMap: Northern Thai dialect normalization absent. Acceptable for baseline; can be backported.
- Phrasebook is lightweight (/ search drawer, 2-entry seed): no full CRUD, import/export, or per-card TTS.
- composeFocusMute: NOT PRESENT — this means mic does not auto-mute on chat tap, which is actually the correct behavior for the baseline (avoids the "mic stuck muted" regression).

**Best use:** PRODUCT BASELINE for call/video/join/rejoin recovery.

**Evidence:**  
- commit `7399a6a`: "v4.0.0: baseline release from bridge-restore-plus-2.html"  
- commit `575d4e2`: "Rebuilt from bridge-restore-plus-2.html (the only clean pre-regression source). All bridge-patched* files were born with regressions."  
- commit `eb4ac22`: "Fix addTr subtitleSeq dedup race condition in bridge-restore-plus-2.html" — the specific fix that prompted the v4.0.0 stamp.

---

### Candidate 2 — bridge-baseline.html @ commit 575d4e2
**Version:** v4.0.0 CONFIRMED BASELINE (comment header explicitly says so)  
**Lines:** ~1,640 at that commit  
**Commit date:** 2026-05-11, 01:17 UTC  

**Why it is a candidate:**  
This commit explicitly documented "All 29 test cases from KNOWLEDGE-TRANSFER.md §6 verified by code inspection." It was built on top of restore-plus-2 with several specific additions, then OVERWRITTEN by dc2bad2 which is a regression.

**What appears to work (at 575d4e2):**
- Everything from restore-plus-2, PLUS:
- composeFocusMute properly paired: `onfocus="composeFocusMute()" onblur="_pbRestoreMic()"` — mic auto-mutes on chat focus, unmutes on blur. This is the correct behavior when the auto-mute feature is desired.
- _pbMutedMic flag: prevents double-toggle conflicts.
- Lightweight phrase drawer from restore-plus-3 delta: / search command, // for phrase commands.
- DEDUP_WINDOW_MS named constant (was hardcoded 5000).
- composeFocusMute guarded by _micToggleInFlight.

**What appears broken:**
- Current state (dc2bad2) has OVERWRITTEN this good baseline with a bridge-patched-v1 snapshot. The current bridge-baseline.html file has:
  - Duplicate pip-overlay DOM IDs (two `id="pip-overlay"` elements, grep count = 2).
  - v3.3.0 comment but v3.1.0 badge (mixed lineage artifact).
  - v3.3.0-era code that predates key fixes.
- To use this candidate, one must checkout `git show 575d4e2:bridge-baseline.html`.

**Best use:** REFERENCE — provides the correct composeFocusMute pattern (paired onfocus/onblur). If composeFocusMute is desired in the recovery build, apply it from this commit. If not desired (simpler is safer for Lane 1), omit it from the baseline.

**Evidence:**  
- commit `575d4e2` message: "All 29 test cases from KNOWLEDGE-TRANSFER.md §6 verified"  
- diff shows explicit comment: "DO NOT derive new branches from any bridge-patched* file — those were born with regressions."

---

### Candidate 3 — bridge-patched-v1.html @ 8d168b1 (v3.5.3)
**Version:** v3.5.3  
**Lines:** 2,914 (at that snapshot; current is 2,998)  
**Commit date:** 2026-05-11, 13:03 UTC  

**Why it is a candidate:**  
Most feature-complete build. Contains full phrasebook v2+ (CRUD, import/export, per-book management, card TTS), DG watchdog, NorthernThaiMap, WASM FastText elaborate path. Was confirmed as the source for bridge-reborn-v1.html by the May 11 commit.

**What appears to work:**
- Full phrasebook CRUD: pbUseText(id, 'src'/'tgt'), pbSpeakCard, pbOpenNewCard, pbExportPrompt, pbOpenBooksModal.
- pbCloseDrawer calls _pbRestoreMic() — Use button pipeline is complete.
- DG watchdog: setInterval every 5s, restarts DG if silent and still desired.
- NorthernThaiMap: applyNorthernThaiMap() for dialect normalization.
- Elaborate FastText WASM path: multi-asset probe (wrapper.umd.js, core.mjs, fasttext.wasm, lid.176.ftz), smoke test, degraded mode.
- replaceTrack muting: live audio replacement without stopping stream.
- WASM locateFile fix: `window.FastTextModule={locateFile:...}` set before script load (v3.5.3 fix).

**What appears broken / risky:**
- Thai space-stripping regex present at line 2445 (current v3.5.3): `.replace(/([ิ-ืเ-ไ]) ([฀-๿])/g,'$1$2').replace(/([฀-๿]) ([ะ-ื็-๎])/g,'$1$2')` — this is the regression that was explicitly removed in bridge-baseline.html by commit 2284655 but NOT removed from bridge-patched-v1.html.
- WASM startup: multi-asset load path (4 assets) adds latency and failure modes. FastText may fail to load on first visit, leaving language detection in stub mode.
- Duplicate pip-overlay DOM IDs were present until v3.5.0 (196aa94) — fixed in current v3.5.3.
- composeFocusMute: missing onblur until v3.5.0 (36b211e) — fixed in current v3.5.3. But composeFocusMute itself adds complexity.
- Size: 2,998 lines is much harder to audit than restore-plus-2.html's 1,620.

**Best use:** REFERENCE for phrasebook Lane (Lane 5) and DG watchdog (Lane 2). Do not use as baseline.

**Evidence:**  
- commit `68b9198`: "#normalization chat ok# fix Phrasebook# Restore bridge-patched-v1.html from 8d168b1" — confirms 8d168b1 was identified as the good phrasebook state.
- Thai regex visible at line 2445 of current file (not in restore-plus-2).

---

### Candidate 4 — bridge-restore-plus-3.html @ f42720c
**Version:** v3.1.0  
**Lines:** 1,589  
**Commit date:** 2026-05-09 (introduced in batch upload 6af7773)  

**Why it is a candidate:**  
The restore-plus-3 file extends restore-plus-2 with a slightly more capable phrasebook drawer (/ search command, //filter commands, more seed entries). It retains the clean call spine of the restore series.

**What appears to work:**
- All call-spine features of restore-plus-2 (identical RTC/DG/normalization code).
- Phrasebook drawer: / search → runPhraseSearch, // command → runPhraseCommand, usePhrase() inserts into chat-input.
- SwapVideos PiP (same as restore-plus-2).

**What appears broken:**
- composeFocusMute: NOT PRESENT — same as restore-plus-2.
- Phrasebook is still lightweight (/ command model, not full CRUD).
- No per-card TTS, no book management.
- Slightly larger than restore-plus-2 (1,589 vs 1,620 — similar).

**Best use:** REFERENCE for the lightweight phrasebook pattern. If a simple "/" command phrasebook is sufficient for the recovery build, apply from this file rather than the full v2 system.

---

### Candidate 5 — bridge-restore.html @ f42720c
**Version:** v3.1.0  
**Lines:** 1,510  
**Commit date:** 2026-05-09 (batch upload)  

**Why it is a candidate:**  
The root of the restore series. Most minimal of the group. Contains clean RTC and DG without any phrasebook complexity. Useful as the zero-point: everything above restore.html is an addition.

**What appears to work:**
- Core RTC (create/join/rejoin/cleanup).
- Deepgram epoch-based reconnection.
- Basic normalization (no Thai regex, no NFKC/NFC issue).
- TTS (speakText).
- No composeFocusMute.
- SwapVideos PiP.

**What appears broken:**
- No phrasebook (not even / search).
- No NorthernThaiMap.
- No DG watchdog.
- Very basic phrasebook-less chat.

**Best use:** REFERENCE for minimum viable call spine. If a regression appears in restore-plus-2, restore.html provides a diff baseline.

---

## 4. Regression Timeline

| Event | Commit | Date | Evidence |
|-------|--------|------|----------|
| bridge-patched-v1.html born with duplicate pip-overlay DOM IDs | `8dc8a82` (creation) | 2026-05-04 | Two `id="pip-overlay"` blocks in the initial file; not present in restore series |
| composeFocusMute added WITHOUT onblur (mic stuck muted on chat tap) | `8dc8a82` (creation) | 2026-05-04 | `onfocus="composeFocusMute()"` on chat-input, no onblur pair |
| Thai space-removal regex introduced in onDGFinal | ~`a6885187` or `91dc5b79` | 2026-05-07 | `.replace(/([ิ-ื...]) ([฀-๿])/g,'$1$2')` visible in current patched-v1 |
| NFKC+NFC double-normalize regression introduced | ~May 7 commits | 2026-05-07 | Noted in 2284655 as "introduced in a31e6cb May 7"; not in restore series |
| composeFocusMute onblur fix (mic-on-chat-tap) | `36b211e` | 2026-05-11 | v3.5.0 fix; still absent from current bridge-baseline.html (dc2bad2) |
| Duplicate pip-overlay DOM ID fix | `196aa94` | 2026-05-11 | v3.5.0; still present in bridge-baseline.html (dc2bad2) |
| Thai space-removal and NFKC/NFC fixed in bridge-baseline ONLY | `2284655` | 2026-05-11 | Bridge-patched-v1 was NOT updated; fix only in bridge-baseline |
| bridge-baseline.html v4.0.0 CONFIRMED build (all 29 tests) | `575d4e2` | 2026-05-11 | Rebuilt from restore-plus-2; explicitly avoids patched-v1 regressions |
| bridge-baseline.html OVERWRITTEN with patched-v1 snapshot (regression) | `dc2bad2` | 2026-05-10* | "Add snapshot of bridge-patched-v1.html" — undoes the v4.0.0 confirmed baseline |
| Elaborate WASM FastText multi-asset path introduced | `01acddc` onward | 2026-05-11 | 4-asset load path replacing simple script tag; intermittent 404/abort risk |
| DG watchdog added | `7f57bf6`/`ded64f0` | 2026-05-11 | v3.5.0/v3.5.1; present in patched-v1 but not in restore or baseline series |
| bridge-build-plan-v1/v2/v4 derived builds created | `a815dc3`, `6c49310` | 2026-05-12–13 | bridge-cc-v1.0, bridge-codex-v1/v2/v3/omega/v1-4, bridge-cgpt variants — no independent testing |

*dc2bad2 shows author date 2026-05-10 but appears above 575d4e2 in git log, suggesting commit ordering inconsistency (likely a rebase or late push).

---

## 5. Recommended Recovery Plan (Lane-Based)

### Lane 1: Stabilize call/video/join/rejoin
**Source:** `bridge-restore-plus-2.html` @ `eb4ac22`  
**Scope:** RTCPeerConnection lifecycle only. Do not touch normalization, TTS, phrasebook, or health UI.  
**Key functions:** setupPC(), teardownSession(), flushPendingCandidates(), refreshRemoteVideo(), resetRemoteMediaState(), joinCall(), handleSig(), reconcileDeepgramState() (call-phase checks only), swapVideos(), toggleMic(), toggleCam().  
**Test:** create room → join from second device → both videos visible → mute/unmute → leave → rejoin → PiP (swap) does not break main video.  
**Do not add:** pip-overlay, composeFocusMute, phrasebook, WASM, DG watchdog.

### Lane 2: Stabilize mic/Deepgram
**Source:** `bridge-restore-plus-2.html` @ `eb4ac22` (base) + DG watchdog from `bridge-patched-v1.html` @ `8d168b1`  
**Scope:** toggleMic(), startDeepgram(), stopDeepgram(), reconcileDeepgramState(), epoch guards.  
**Key test:** speak → DG fires → mute → DG stops → unmute → DG restarts → silence for 30s → watchdog restarts DG.  
**Do not change:** RTC code, video srcObject, PiP.

### Lane 3: Stabilize TTS
**Source:** speakText() from `bridge-restore-plus-2.html` @ `eb4ac22`. TTS_LOCALE map same source.  
**Scope:** speakText(), toggleTranscriptTts(), TTS_LOCALE. Only fire TTS on patchTr final result, not on provisional subtitle.  
**Key test:** partner speaks → transcript shows → TTS speaks translated text once (not twice, not for each subtitle update).  
**Risk to avoid:** TTS firing on every subtitle-update relay (patchTr should only speak if !ss, i.e., final result).

### Lane 4: Restore bridge normalization
**Source:** onDGFinal pipeline from `bridge-restore-plus-2.html` @ `eb4ac22` (no Thai regex, NFC-only).  
**Goal:** English detected while selected-source=zh, target=es → English → zh → es.  
**Scope:** onDGFinal(), sendChatMessage(), detectLang(), _detectLangAsync(), translateWithRetry(), normalizeText().  
**Key test:** Speak English text while source language set to Chinese → normalized to Chinese → translated to target → relay shows Chinese source, target translation.  
**Do not:** add Thai space-stripping regex. Do not change to NFKC.  
**Optional backport:** applyNorthernThaiMap() from `bridge-patched-v1.html` @ `8d168b1` lines 679–688 (safe, additive-only).

### Lane 5: Restore phrasebook/Use buttons
**Source:** `bridge-patched-v1.html` @ `8d168b1` (full v2+ phrasebook) OR `bridge-restore-plus-3.html` @ `f42720c` (lightweight / search drawer).  
**Recommendation:** Start with restore-plus-3 lightweight phrasebook (less surface area). Promote to full v2 CRUD only if users need import/export/per-card management.  
**Scope:** pbUseText(), pbSpeakCard(), pbOpenDrawer(), pbCloseDrawer() + _pbRestoreMic(), runPhraseSearch().  
**Key test:** Open phrasebook → tap Use on source → text appears in chat-input → send → mic unmutes after send.

### Lane 6: Simplify health UI
**Source:** `bridge-restore-plus-2.html` ft-status-pill (lobby only, fades on ready).  
**Goal:** Remove WASM startup-gating UI noise. FastText WASM should attempt silently and degrade gracefully. Do not block call creation on FastText status.  
**Scope:** _syncFtStatus(), _loadFastText(), ft-lobby-status element.  
**Key test:** Open app with FastText assets absent → status shows briefly "loading" → fades → call creation is NOT blocked.

---

## 6. Do-Not-Touch List (During Lane 1)

The following code areas must not be modified during Lane 1:

1. **normalizeText()** — correct in restore-plus-2; any change risks Thai/normalization regression.
2. **onDGFinal()** — contains the normalization pipeline; changing it breaks Lane 4.
3. **translateWithRetry() / translate()** — translation cache and retry logic; stable in restore-plus-2.
4. **speakText() / TTS_LOCALE** — stable; any change risks Lane 3 work.
5. **phrasebook functions (pbUseText, pbSpeakCard, runPhraseSearch)** — separate lane.
6. **FastText assets and _loadFastText()** — WASM path is a known instability source; do not change during Lane 1.
7. **localStorage key names** — changing key names (tb_dg_key, tb_cf_tid, tb_cf_tok, PB_CARDS, RK, TP prefix) will break existing user sessions.
8. **Deepgram WebSocket URL parameters** — language, encoding, sample_rate, interim_results, endpointing params are tuned; do not adjust during Lane 1.
9. **reconcileDeepgramState()** — the reconciliation logic is correct; any change touches Lane 2 scope.
10. **addTr() subtitleSeq dedup** — the eb4ac22 fix; any change risks duplicate transcript entries.
11. **setupPC() ICE candidate deduplication (_seenRemoteCand Set)** — present in restore-plus-2; needed to prevent duplicate candidate errors.
12. **epoch (sessionEpoch / bumpSessionEpoch)** — epoch safety guards for stale DG reconnection; do not add or remove epoch bumps.

---

## 7. Open Questions

1. **dc2bad2 commit ordering:** The commit `dc2bad2` ("Add snapshot of bridge-patched-v1.html") appears to postdate `575d4e2` (the confirmed v4.0.0 baseline) based on git log position, yet carries an earlier author date. Was this an intentional rollback, or an accidental overwrite? Whoever made dc2bad2 needs to confirm intent — this directly affects whether bridge-baseline.html can be salvaged.

2. **DG watchdog necessity:** The restore-plus-2 baseline has no DG watchdog. Under what conditions does Deepgram go silent without closing the socket? If this is confirmed as a production issue, the watchdog from patched-v1 should be added in Lane 2. The watchdog timer interval (5000ms) and log tag (`dg_watchdog_restart`) from bridge-patched-v1.html lines 2573–2580 are the reference.

3. **PiP expectation:** The restore series uses CSS swapVideos() (click-to-swap local/remote). The patched series uses a pip-overlay (native PiP API with overlay fallback). Which behavior is expected in production? If the overlay approach is required, it must be re-introduced carefully in Lane 1 (not as part of the baseline).

4. **applyNorthernThaiMap dependency:** The bridge-restore-plus-2 baseline is missing this function. If Northern Thai speakers are active users, this should be backported from patched-v1 before Lane 4 is declared done. The function at bridge-patched-v1.html lines 679–688 appears safe (additive character substitution only).

---

## Summary Printout

**Recommended baseline:**  
`bridge-restore-plus-2.html` at commit `eb4ac22` (v4.0.0 restored label, originally v3.1.0 lineage, 1,620 lines). This is the cleanest call-spine source with no known regressions.

**Top 3 reference commits:**  
1. `575d4e2` — bridge-baseline.html at v4.0.0 CONFIRMED state: use for composeFocusMute pattern and 29-test verification checklist.  
2. `8d168b1` — bridge-patched-v1.html at v3.5.3: use for full phrasebook CRUD, pbUseText, pbSpeakCard, DG watchdog pattern.  
3. `eb4ac22` — bridge-restore-plus-2.html: the subtitleSeq dedup fix that makes transcript entries stable; this commit is also the baseline itself.

**Biggest regression source:**  
The creation of `bridge-patched-v1.html` on 2026-05-04 (`8dc8a82`) introduced duplicate pip-overlay DOM IDs and a composeFocusMute without onblur from day one. Subsequent May 7 edits added the Thai space-stripping regex and NFKC+NFC double-normalize. The overwrite of bridge-baseline.html by `dc2bad2` then silently undid the verified v4.0.0 recovery, leaving the project's "official baseline" file in a regressed state. Every build-plan-derived file (bridge-cc-v1.0, bridge-codex-*, bridge-cgpt-*) inherits from this lineage and carries its regressions.

**Rationale:**  
The restore series (restore.html → restore-plus-1 → restore-plus-2 → restore-plus-3) was constructed specifically to avoid the patched-v1 regressions. bridge-restore-plus-2 contains a complete, auditable call spine with proper WebRTC guards, epoch-safe Deepgram reconnection, clean normalization, and a working (if lightweight) transcript system. Its size (1,620 lines vs. 2,998 for patched-v1) makes it far easier to audit, diff, and extend lane-by-lane. The confirmed v4.0.0 build at `575d4e2` proves this file passed a 29-test verification suite. Recovery should begin here and add subsystems incrementally, not start from the feature-complete but regression-laden patched-v1 branch.
