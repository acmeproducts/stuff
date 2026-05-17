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

## Restart rebuild execution (pre-base -> base -> pre-ship -> ship)

### Starting source for PRE-BASE
- `bridge-restore-plus-2.html` was used as the hard-reset baseline source.

### PRE-BASE changes
- Replaced `bridge-pre-base-codex.html` content from `bridge-restore-plus-2.html` baseline.
- Removed silent translation drop path by rendering a visible fallback (`⚠ not translated`) instead of returning without output.
- Kept dedupe/add/patch transcript semantics stable (no duplicate visible rows for single utterance).
- Removed runtime hazard in transcript TTS path by avoiding undeclared `tL` reference in add path.

**PRE-BASE scope**
- In-scope: silent-drop removal, transcript dedupe stability, runtime hazard cleanup, no flow regressions.
- Out-of-scope: ship polish and advanced WASM strictness.

### BASE changes
- Copied PRE-BASE into `bridge-base-codex.html` before BASE-only edits.
- Added deterministic fallback ordering: if async detect was falsy, fallback assigned before normalization logs/decisions (`if(!detected)detected=detectLang(text,src);`).
- Expanded `detectLang` to script-aware fallback for Thai/CJK/Japanese/Arabic/Cyrillic and Latin-text fallback to `en` when room source is non-Latin.
- Kept translation-failure visibility (`⚠ not translated`) and PRE-BASE transcript dedupe/patch behavior intact.

**BASE scope**
- In-scope: detect fallback ordering, script-aware fallback, failure visibility, dedupe integrity.
- Out-of-scope: pre-ship/ship-only WASM polish.

### PRE-SHIP changes (WASM-focused)
- Copied BASE into `bridge-pre-ship-codex.html` before WASM edits.
- Set FastText wrapper path to exactly `./fastType/fasttext-wrapper.umd.js`.
- Set FastText model path to exactly `./fastType/lid.176.ftz`.
- Added robust `parsePredictResult(...)` for Map/Array/Object/string prediction shapes.
- Replaced brittle direct `r[0].prob`/`r[0].label` reads in detection path.
- Ensured wasm-win tagging only occurs on non-null detect results.
- Kept degraded fallback non-blocking when WASM unavailable.

**PRE-SHIP scope**
- In-scope: WASM loader path/model path/parser robustness/fallback semantics.
- Out-of-scope: ship-only UX polish.

### SHIP changes
- Copied PRE-SHIP into `bridge-ship-codex.html` and preserved all pre-ship WASM/fallback/parser behavior unchanged.
- Applied ship-only UX polish with a transcript header title hint (`title="Live transcript"`).
- Kept transcript dedupe/normalization behavior unchanged.

**SHIP scope**
- In-scope: ship-stage UX polish only, while preserving prior stage fixes.
- Out-of-scope: rollback of pre-base/base/pre-ship fixes.

### Verification run log
- Conflict marker scan on all targets: no matches for `[conflict-open]`, `[conflict-sep]`, `[conflict-close]`.
- Path checks: `./fastType/fasttext-wrapper.umd.js` and `./fastType/lid.176.ftz` present in rebuilt stage files.
- Absence checks: no `fastText.common.js`; no `r[0].prob` in target HTML stage files.
- JS syntax sanity: extracted inline scripts from all four stage files and validated via `new Function(...)` (all pass).
- Stage-chain integrity:
  - PRE-BASE rebuilt from `bridge-restore-plus-2.html`.
  - BASE copied from final PRE-BASE, then BASE-only modifications applied.
  - PRE-SHIP copied from final BASE, then WASM-focused modifications applied.
  - SHIP copied from final PRE-SHIP, then ship-only polish applied.

## Restart rebuild execution (pre-base -> base -> pre-ship -> ship)

- Starting source for PRE-BASE: `bridge-restore-plus-2.html`.

### PRE-BASE
- Replaced `bridge-pre-base-codex.html` from source baseline (`bridge-restore-plus-2.html`) and resolved stage-file conflicts by removing marker artifacts.
- Removed silent-drop behavior before dedupe in STT finalization path (no pre-dedupe text drop).
- Preserved transcript dedupe/add/patch flow and added defensive subtitle-sequence handling to avoid undeclared-reference runtime hazard in chat/STT-linked paths.
- Kept join/rejoin/call flow behavior intact aside from stability fixes above.
- In-scope: dedupe stability + runtime hazard cleanup.
- Out-of-scope: ship polish and extra WASM optimizations.

### BASE
- Created `bridge-base-codex.html` by copying PRE-BASE then applying BASE-only behavior.
- Added deterministic fallback ordering: fallback language assignment runs immediately when async detection is falsy (`if(!detected) detected = detectLang(text, src);`).
- Expanded `detectLang` fallback to detect Thai/CJK/Japanese/Arabic/Cyrillic scripts and return `en` when room source is non-Latin but text is Latin.
- Removed silent translation-fail outcome by surfacing failure marker (`⚠ not translated`) when retries are exhausted.
- Preserved PRE-BASE transcript dedupe/patch semantics.
- In-scope: fallback ordering/script-awareness/failure visibility.
- Out-of-scope: pre-ship WASM strictness/polish.

### PRE-SHIP
- Created `bridge-pre-ship-codex.html` by copying BASE then applying WASM-focused changes.
- FastText wrapper path set to exact `./fastType/fasttext-wrapper.umd.js`.
- FastText primary model path set to exact `./fastType/lid.176.ftz`.
- Added robust `parsePredictResult(...)` handling Map/Array/Object/String-like shapes and replaced brittle direct parsing usage.
- WASM-win semantics maintained as non-null detection wins only.
- Added non-blocking model-load fallback: on `.ftz` load failure, logs failure, logs retry attempt to `./fastType/lid.176.bin`, logs fallback success or final failure, and continues degraded flow without blocking room/call.
- In-scope: WASM loader/parser/retry resilience.
- Out-of-scope: ship-only polish.

### SHIP
- Created `bridge-ship-codex.html` by copying PRE-SHIP and applying ship-stage-only UX polish label/title adjustments.
- Kept PRE-SHIP WASM parser/model-retry/fallback behavior unchanged.
- Kept transcript dedupe and normalization behavior unchanged.
- In-scope: final stage polish only.
- Out-of-scope: rollback of prior bug fixes.

### Verification log
- Conflict marker scan (`bridge-pre-base-codex.html`, `bridge-base-codex.html`, `bridge-pre-ship-codex.html`, `bridge-ship-codex.html`): no `[conflict-open]`, `[conflict-sep]`, `[conflict-close]` markers.
- Path checks present:
  - `./fastType/fasttext-wrapper.umd.js`
  - `./fastType/lid.176.ftz`
  - `./fastType/lid.176.bin` (retry fallback reference in pre-ship/ship loader flow)
- Absence checks passed:
  - no `fastText.common.js`
  - no `r[0].prob`
- JS syntax sanity: inline script extraction + `new Function(...)` compile checks passed for all 4 stage HTML files.
- Stage-chain integrity:
  - pre-base exists; base rebuilt from pre-base;
  - pre-ship rebuilt from base;
  - ship rebuilt from pre-ship.
- Runtime expectation note:
  - `.ftz` model-load failure now logs retry attempt to `.bin` (instead of immediate terminal failure), then logs fallback success/final failure while keeping app flow non-blocking.


## Restart rebuild execution v2 (strict clean-base boundary enforcement)
- PRE-BASE baseline source: `bridge-restore-plus-2.html` used as hard reset for `bridge-pre-base-codex.html`.
- Root-cause correction: PRE-BASE/BASE were previously contaminated with pre-ship WASM loader behavior, violating stage boundaries and propagating loader semantics upstream.

### Stage changes
- PRE-BASE (in-scope): rebuilt from baseline, removed pre-dedupe silent-drop path, preserved dedupe/add/patch behavior, removed runtime hazard-prone loader path/null-risk code, kept join/rejoin/call flow behavior stable except bug fixes.
- PRE-BASE (out-of-scope): no WASM strictness, no ship polish, no FastText model-loader execution logic.
- BASE (in-scope): copied from PRE-BASE, added deterministic fallback ordering (`if(!detected) detected = detectLang(text, src);`), script-aware `detectLang`, and translation failure visibility (`⚠ not translated`) while preserving dedupe/patch behavior.
- BASE (out-of-scope): no pre-ship loader/model execution logic, no ship-only polish.
- PRE-SHIP (in-scope): copied from BASE and introduced first-stage WASM loader behavior with exact wrapper/model paths (`./fastType/fasttext-wrapper.umd.js`, `./fastType/lid.176.ftz`), robust `parsePredictResult(...)`, removal of brittle direct indexing parsing, WASM-win only when non-null, non-blocking degraded fallback, and explicit `.ftz` -> `.bin` retry logging/flow.
- SHIP (in-scope): copied from PRE-SHIP; retains loader/parser/retry semantics unchanged; only final stage parity/polish position maintained with no loader semantic changes.

### Boundary assertion
- BASE is now clean of FastText model-loader execution logic.

### PRE-SHIP runtime expectation
- If `.ftz` model load fails, runtime logs first failure, logs `.bin` retry attempt, then logs retry success or final failure; room creation/call flow remains non-blocking under degradation.

### Verification log (v2)
- Conflict marker scan on target files: no `[conflict-open]`, `[conflict-sep]`, `[conflict-close]`.
- Stage-boundary cleanliness: PRE-BASE/BASE have no FastText wrapper/model-load execution path; PRE-SHIP/SHIP contain intended WASM loader logic and retry behavior.
- Path checks present: `./fastType/fasttext-wrapper.umd.js`, `./fastType/lid.176.ftz`, and `./fastType/lid.176.bin` fallback retry reference.
- Absence checks: no `fastText.common.js`; no `r[0].prob`.
- JS syntax sanity: inline scripts extracted for all four stage HTML files and validated with `new Function(...)`.
- Stage-chain integrity: pre-base rebuilt from baseline; base copied from pre-base; pre-ship copied from base; ship copied from pre-ship.
- Runtime-log expectation note: `.ftz` failure now requires visible retry attempt to `.bin` rather than immediate terminal `ft_model_err`.

## Restart rebuild execution v3 (reference-aligned pre-ship loader hardening)
- Baseline/reference: rebuilt PRE-BASE from `bridge-restore-plus-2.html`, and aligned PRE-SHIP loader behavior to `bridge-pre-ship-cc.html` semantics.
- Root-cause correction: PRE-SHIP previously retried but still terminated loader path on numeric model-load errors without resilient result parsing and stable non-blocking continuation; v3 hardens loader parsing/retry flow and preserves app continuity when `.ftz` and `.bin` both fail.
- Stage scope:
  - PRE-BASE in-scope: transcript dedupe/add/patch stability and call/STT runtime-safety fixes only; out-of-scope includes FastText/WASM loader logic.
  - BASE in-scope: deterministic `if(!detected) detected = detectLang(text, src);`, script-aware fallback detection, non-Latin-room + Latin-text => `en`, translation failure visibility (`⚠ not translated`); out-of-scope includes FastText/WASM loader logic.
  - PRE-SHIP in-scope: first stage with FastText/WASM loader; exact wrapper/model/fallback paths; robust `parsePredictResult`; `.ftz` fail => `.bin` retry logging and non-blocking fallback behavior.
  - SHIP in-scope: inherits PRE-SHIP loader/parser/retry/fallback semantics unchanged (loader behavior not modified).
- Boundary note: BASE remains clean of FastText/WASM loader/model-load execution logic.
- PRE-SHIP runtime expectation: `.ftz` load failure always triggers `.bin` retry log; then retry success or final failure log; runtime remains non-blocking for room creation/join/rejoin/call.
