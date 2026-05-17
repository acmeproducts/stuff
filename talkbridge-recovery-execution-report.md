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

---

## Verification rerun (2026-05-15)
Performed non-browser logic checks across all codex stage artifacts:

1. JavaScript parse/lint sanity
   - Extracted inline `<script>` blocks from all four files.
   - Compiled each script via `new Function(...)` (syntax check).
   - Result: pass for pre-base, base, pre-ship, ship.

2. Core flow invariants (static logic assertions)
   - Pre-base: `onDGFinal` exists, dedupe guard present, subtitle patch path present.
   - Base: relative FastText wrapper path, robust parse function, null-detect fallback in chat path.
   - Pre-ship/Ship: relative FastText wrapper path, robust parse function, null-detect fallback in normalization path.
   - Ship: host-left bilingual-style copy composition present.
   - Result: all assertions pass.

Current status: no syntax errors found; targeted core logic assertions pass in all 4 codex variants.

## WASM path hotfix checklist (2026-05-16)
Scope: `bridge-base-codex.html`, `bridge-pre-ship-codex.html`, `bridge-ship-codex.html`

- [x] `FT_SCRIPT` changed from root-absolute path to dot-relative path: `./fastType/fasttext-wrapper.umd.js`.
- [x] `FT_MODEL` changed from root-absolute path to dot-relative path: `./fastType/lid.176.ftz`.
- [x] Confirmed all three files now log/load the same relative paths.
- [x] JS parse sanity for all 3 files passed after patch.

Expected startup log after patch:
- `ft_load_start ... "src":"./fastType/fasttext-wrapper.umd.js"`

## Stage-chain rebuild checklist (2026-05-17)
Goal: enforce intended progression `pre-base -> base -> pre-ship -> ship` and remove cross-stage drift.

### Base rebuilt from pre-base bugfix set
- [x] Fixed pre-base WASM wrapper path (`./fastType/fasttext-wrapper.umd.js`).
- [x] Fixed pre-base WASM model path (`./fastType/lid.176.ftz`).
- [x] Added robust FastText parse handler (`parsePredictResult`) in pre-base.
- [x] Added deterministic null-detect fallback ordering before normalization decisions/logs.

### Pre-ship validated as Base + WASM readiness
- [x] Base/pre-ship/ship now share relative FastText wrapper/model paths.
- [x] Base/pre-ship/ship use robust prediction parsing and non-null wasm-win semantics.

### Ship validated as Pre-ship + final features
- [x] Ship preserves pre-ship WASM path + parser/fallback fixes.
- [x] Ship host-left joiner copy path remains resilient (no missing i18n-key dependency).

### Confirmation checks run after edits
- [x] JS parse checks passed for all four variants (`new Function(...)`).
- [x] Static invariant checks for wrapper path/parser/fallback presence passed.

## Merge-conflict resolution check (2026-05-17)
Requested conflict files checked directly:
- `bridge-base-codex.html`
- `bridge-pre-base-codex.html`
- `bridge-pre-ship-codex.html`
- `bridge-ship-codex.html`
- `talkbridge-recovery-execution-report.md`

Resolution status:
- [x] No Git conflict markers remain (`<<<<<<<`, `=======`, `>>>>>>>`).
- [x] Stage chain consistency retained after resolution check.
- [x] Files are ready for PR merge once remote branch state is synced.
