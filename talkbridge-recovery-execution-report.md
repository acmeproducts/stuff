# TalkBridge Build Plan (Final)

Starting point: **`bridge-restore-plus-2.html` @ `eb4ac22`**  
Not approved for ship yet: `bridge-patched-v1.html` (`8dc8a82`) and `8d168b1`.

---

## PRE-BASE (stabilize current working file)
Goal: lock one working file and remove blockers that cause user-visible failure.

1. Confirm single active file is `bridge-restore-plus-2.html`.
2. Remove silent text-drop path before dedupe (Thai-map empty-drop behavior).
3. Fix duplicate transcript behavior so one utterance = one row (row updates in place).
4. Fix obvious runtime errors in DG start path (no undeclared vars).
5. Keep current call/join/rejoin behavior unchanged while stabilizing transcript flow.

**Exit criteria (Pre-Base done):**
- No silent dropped utterances.
- No double rows (`source->source` then second `source->target`).
- No new regressions in call setup/join/rejoin.

---

## BASE (core correctness)
Goal: all conversation basics are correct and transparent.

1. Language detection fallback correctness:
   - If async detect returns null/falsy, run deterministic fallback.
   - Unicode-script detection must correctly route non-Latin scripts.
   - Latin-in-non-Latin room must normalize correctly.
2. Translation failure transparency:
   - If retries exhaust, show visible `⚠ not translated` indicator.
3. TTS correctness:
   - Play partner message in partner language, not global local language.
4. Use button correctness:
   - Populate compose and dispatch input so Send enables immediately.
5. Goodbye correctness:
   - Joiner goodbye screen is bilingual with rejoin/download/copy controls.

**Exit criteria (Base done):**
- Every spoken/chat message yields visible result.
- No silent translation failures.
- TTS language is correct.
- Use button enables Send immediately.
- Bilingual goodbye is complete.

---

## PRE-SHIP (WASM) ✅
Goal: WASM language detection is operational, observable, and safely degraded when unavailable.

1. Use correct wrapper and asset paths (`fasttext-wrapper.umd.js`, wasm core, model).
2. Use correct `locateFile` behavior (no double-prefix path bugs).
3. Use robust prediction parser that handles Map/Array/Object/string return shapes.
4. Keep `_ftStartupDone` as the only source of truth for WASM startup state.
5. Ensure degraded mode works:
   - Unicode fallback active,
   - room creation not blocked,
   - startup status clearly visible (ready/degraded/failed but can proceed).
6. Keep confidence thresholds split by speech/chat with bounded retry lowering.

**Exit criteria (Pre-Ship done):**
- WASM smoke tests pass (`en/es/fr/de` short phrase checks).
- Latin/Latin normalization works where expected.
- Degraded path works without blocking call flow.
- All Base criteria still pass.

---

## SHIP
Goal: user-facing polish/features after core reliability is proven.

1. Soft-delete room from initiator recent list (without relay hard delete).
2. Thai overlay display enhancement.
3. Transcript scroll behavior (`newest at top`, jump indicator).
4. Phrasebook card state reset before search render.
5. Phrasebook source/target edit behavior (source retranslate, target manual override persist).
6. Phrasebook button relocation to transcript header.

**Exit criteria (Ship done):**
- All Pre-Ship checks pass.
- No regressions in call, transcript, translation, TTS, or goodbye flow.
- Ship candidate tagged.

---

## Non-negotiable constraints
- No PiP changes.
- No auto-mute behavior changes.
- No “Ask Again” / retry UX feature.
- Every utterance/message must produce visible output.
- No out-of-scope features before Ship phase.

---

## Current decision
- We are executing this plan now.
- **Pre-Ship is WASM** (as requested).
- Release remains blocked until Pre-Base + Base + Pre-Ship exit criteria are all green.
