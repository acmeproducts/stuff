# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE — CANONICAL CLEAN REBUILD
**Date:** 2026-08-31

## Recovery anchor

- Accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Accepted pre-base backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`.
- Clean Base UI integrators: Base-22 at `603e8a331b13b72a097e9ebb9640e33707279777` and Base-24 at `083aa1334208b1e6995fa18852e82722a815f331`.
- Canonical AI/storage-default integrator: `integrate-SOT-turn01-base-ai.py`, rebuilt directly from clean Base-24 behavior. It replaces the defective Base-28 insertion boundary without consuming generated Base-28–Base-32 HTML.
- Live backend remains build `2026.08.30.sot-turn01-base-22`, schema `4`.
- Canonical target remains `SOT/SOT-turn01-base.html`.

## Simplified governance

Base development uses one plan, one graveyard, one canonical installer, and Git history as the version ledger.

1. `SOT-turn01-pre-base.html` is the frozen recovery anchor. Failed generated HTML is evidence only and is never an ancestor.
2. `install-SOT-turn01-base.sh` is the only active Base installer. Candidate identity is its Git commit and file SHA; numbered installers are retained only as history and are never patched forward.
3. Before an affected governed file changes, create one archive manifest under `SOT/archive/` containing the current commit, paths, and blob SHAs. Files already immutable in Git are not duplicated. Non-Git runtime evidence is copied into the archive.
4. Update this plan only when the product, lineage, release floor, or stage contract changes. Record rejected approaches in `SOT-GRAVEYARD.md`. Mechanical defect iterations do not create new governance documents.
5. The canonical installer generates from pinned clean sources, qualifies exact candidate bytes, archives the live target, cuts over once, qualifies exact public read-back, and rolls back automatically on any post-cutover failure.
6. The owner is the product tester, not the build or qualification runner. Development proceeds autonomously to a mechanically qualified canonical test URL. Base remains the stage until product testing accepts it.

## Base product contract

The canonical Base must retain all of the following:

1. Stable completed Index with `2-copy`, `3-copy`, and `4+ copy` findings and drill-down.
2. Current versus stale Plan separation with explicit re-index recovery.
3. One Source/Target/Backup/default selector with independent Available/Selected scrolling, local search, true move semantics, and a footer commit action.
4. Default Target and Default Backup configuration.
5. Dynamic Windows volume inventory shared across Source, Target, Backup, and defaults; operation-boundary validation remains deterministic.
6. Operational Venice/OpenRouter model discovery, real completion validation, browser-local keys, and explicit active provider/model state.
7. Every inference request begins with the SOT supervisor prompt, then exact project/evidence context, then conversation history and the operator request.
8. AI remains advisory: `Inference -> structured proposal -> deterministic validation -> SOT Plan -> approval -> execution`.

## Canonical source correction

The rejected Base-28 integrator inserted helpers at the inner `function` token of `async function openConfig`, leaving a standalone `async` expression before `const SOT_SUPERVISOR_PROMPT`. That JavaScript parses but throws `ReferenceError: async is not defined` at runtime.

The canonical integrator now:

- inserts at the complete function-declaration boundary;
- rejects any standalone `async` statement or `async` line-terminator hazard;
- proves each replaced function remains unique and structurally balanced;
- emits directly from clean Base-24 behavior.

## Release-quality floor

The exact generated candidate and exact canonical public read-back must each pass:

- per-inline-script JavaScript parse;
- combined-script JavaScript parse;
- standalone/line-terminated `async` runtime-hazard rejection;
- protected product-contract checks;
- exact SHA-256 identity through the served probe and canonical URL;
- a real Chrome/Edge execution with application boot sentinel;
- rendered application roots with no initialization error surface;
- zero boot error marker, `SyntaxError`, `ReferenceError`, `TypeError`, uncaught initialization error, or unhandled rejection.

The browser harness must first pass an exact-read-back JavaScript/DOM self-test. Windows Edge/Chrome launched from WSL must use a Windows-native `%TEMP%` profile, transport cleanup paths through standard input, prove profile deletion, and never use WSL/UNC profile storage.

Pre- and post-cutover health must prove backend build `2026.08.30.sot-turn01-base-22`, schema `4`, and status `ok`. The live volume gate must prove the current dynamic inventory and browse the required Windows volumes before cutover.

## Handoff rule

No installer or qualification experiment is an owner handoff. The only Base handoff is the canonical URL after the success marker `=== TURN 01 BASE MECHANICALLY QUALIFIED ===` is recorded by the host run.
