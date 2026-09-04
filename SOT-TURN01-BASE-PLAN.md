# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** REPOSITORY QUALIFIED — HOST CUTOVER / LIVE QUALIFICATION PENDING  
**Date:** 2026-09-04

## Recovery anchor

- Accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Accepted pre-base backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`.
- Clean Base UI integrators: Base-22 at `603e8a331b13b72a097e9ebb9640e33707279777` and Base-24 at `083aa1334208b1e6995fa18852e82722a815f331`.
- Canonical AI/storage-default integrator: `5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5/integrate-SOT-turn01-base-ai.py`.
- Canonical target remains `SOT/SOT-turn01-base.html`.
- 2026-09-02 coordination failure remains rejected evidence: `SOT/archive/2026-09-02-turn01-coordination-owner-rejection/` / `GY-019.md`.
- 2026-09-03 build `2026.09.03.sot-turn01-coordination-1` is REJECTED evidence only. Owner gate failed 1, 3, 4, 5, 6 and 7; only same-project conflict blocking passed. Record: `SOT/archive/2026-09-03-turn01-coordination-owner-rejection/GY-020.md`.
- 2026-09-04 false-positive gate-9 / installer handoff failure is rejected qualification evidence at `SOT/archive/2026-09-04-turn01-qualified-installer-handoff-failure/GY-021.md`.
- The current clean-lineage coordination implementation is unchanged from core-qualified commit `141de8b2a46d705848462365473447e7e0827f45`; corrected real-polling UI qualification is pinned at commit `b58920f014960c9b18b705a0fdcf0406c621fd5f`.

## Governance

1. `SOT-turn01-pre-base.html` remains the frozen recovery anchor. Failed generated HTML is evidence only and never becomes an implementation ancestor.
2. `install-SOT-turn01-base.sh` is the only active Base installer. Numbered installers are history only.
3. Before governed SOT files change, archive the current commit/path/blob state under `SOT/archive/`.
4. Product development proceeds from the pinned clean lineage above. Do not patch either rejected coordination runtime forward.
5. Rollback is SOT-scoped. Never rewind unrelated repository projects merely to recover SOT.
6. The owner is the browser/device product tester. Mechanical QA must remove mechanically reproducible failures before owner testing.
7. No forward feature work until coordination, observability, durable evidence/plan state, and UI reconciliation pass executable behavioral gates.

Prechange state for the initial executable qualification transition is archived at `SOT/archive/2026-09-04-1405-turn01-base-executable-qualification/ARCHIVE-MANIFEST.md`. The failed handoff and qualification defect are archived in GY-021 before the corrected workflow/installer changes.

## Base product contract

The canonical Base must retain: stable completed Index with 2-copy/3-copy/4+ findings; explicit current/stale Plan separation; one shared Source/Target/Backup/default storage selector; Default Target/Backup; dynamic Windows volume inventory; operational Venice/OpenRouter provider/model state; SOT supervisor prompt and exact evidence context; advisory AI proposal flow; responsive UI during work; cross-project concurrency with one mutation owner per project.

## Coordination architecture — authoritative

- Different projects may index/plan/execute concurrently subject only to global resource limits.
- One project has exactly one state-mutating lifecycle owner at a time.
- Indexing may use bounded read/hash workers under that owner.
- Lifecycle is backend truth: `idle -> indexing -> indexed -> planning -> planned -> executing`, with explicit `paused`, `failed`, `cancelled`/interrupted outcomes.
- Every mutation has durable operation ID + generation; stale completions are discarded and logged.
- Re-index builds candidate evidence separately. Current committed evidence remains usable until a complete candidate atomically replaces it.
- Plans bind an exact committed evidence revision and become stale only after a newer evidence revision successfully commits.
- UI refresh updates server-owned values without replacing operator-owned selection, tab, modal/picker, search, scroll, focus, or form-edit state.
- Activity/Diagnostics records queued/start/pause/resume/cancel/fail/complete/stale-discard, lifecycle transitions, evidence commits, plan binding/staleness, execution, worker exit/restart recovery, and conflict rejection.

## Recovery implementation order

1. Rebuild from the governed clean lineage, never from the rejected 2026-09-03 runtime.
2. Implement one transactional project-operation authority shared by index/re-index, plan and execute.
3. Keep replacement index evidence in operation-scoped candidate storage until atomic commit; no destructive deletion/update of current evidence before commit.
4. Bind plan eligibility and staleness exclusively to committed evidence revision.
5. Make pause/stop/restart transitions durable and generation-safe.
6. Replace project-wide polling rerender with targeted reconciliation; operator interaction state is never reconstructed from polling.
7. Expose the durable operation/event ledger in Activity/Diagnostics.
8. Preserve cross-project concurrency and the full protected Base product contract.
9. Build executable behavioral qualification before another owner handoff.

## Qualification floor — executable behavior required

Source inspection, marker searches, syntax checks, schema checks and capability strings are necessary but **cannot satisfy a behavioral gate**.

The exact generated candidate must be started against a disposable schema-5+ database and the automated harness must execute and assert:

1. **Same-project exclusion:** conflicting mutation is rejected without changing current state.
2. **Cross-project independence:** Project A and Project B both make observable progress while overlapping operations run.
3. **Committed-state durability:** completed Index remains current and plan-eligible after API refresh/reload/restart.
4. **Re-index atomicity:** with revision N committed, a replacement index is started and then failed/cancelled; revision N evidence remains queryable and plan-eligible. Only successful replacement advances to N+1.
5. **Plan truth:** plan binds exact revision N; remains current during replacement indexing; becomes stale only after N+1 commits.
6. **Stale worker:** old generation cannot commit after ownership changes.
7. **Pause/stop/restart:** each leaves an explicit durable state, retains prior committed evidence, and cannot silently resume stale mutation.
8. **Activity reconstruction:** operation history reconstructs every tested transition and rejection.
9. **UI reconciliation:** a real DOM/browser-state harness runs the exact generated UI while progress updates occur and asserts project selection, active tab, open picker/modal, search text, focus/input value and scroll remain unchanged.
10. Existing parse/boot/health/schema/public-byte identity/rollback/product-contract gates also pass.

A qualification workflow that merely searches generated source for these mechanisms is a failed qualification and must not emit readiness.

## 2026-09-04 corrected executable qualification result

The first nominally green run `33919314140` validly passed gates 1-8 and gate 10, but its original gate 9 was invalid: it conditionally called `backgroundPulse` only if that nonexistent function was present, so no actual progress update occurred. The subsequent WSL handoff correctly exposed the mismatch when the installer asserted `function backgroundPulse()` and exited before cutover. That false-positive qualification/handoff is rejected and recorded in GY-021.

Corrected qualification now consists of:

- **Core gates 1-8 and 10:** PASS on run `33919314140`, commit `141de8b2a46d705848462365473447e7e0827f45`.
- **Gate 9 real polling/browser reconciliation:** PASS on run `33922645501`, commit `b58920f014960c9b18b705a0fdcf0406c621fd5f`. The harness serves the exact generated UI at a real HTTP origin, drives the actual 3-second `/projects` + `/rollup` polling path, changes server-owned progress from 1 to 77 files, proves a new `/projects` request occurred, proves `state.projects` ingested the changed progress, and asserts selection, active tab, open modal, search text, focus/input value, and content/rail scroll remain unchanged.
- `compare 141de8b2...b58920f0` confirms no coordination backend/UI integrator, worker, coordinator, or migration file changed between the core-qualified commit and corrected gate-9 commit; intervening changes are workflow/governance/installer or unrelated repository projects.
- **Canonical installer qualification:** PASS on run `33922817854`, commit `3e073b545ad8c254e5a7636e28e030678dfc7c81`. Installer CI now reproduces the same clean-lineage backend/UI generation and the installer's pre-cutover candidate assertions, and explicitly rejects the nonexistent `backgroundPulse` marker.

No rejected generated runtime is used as an implementation ancestor.

## Current release boundary

Repository qualification is complete again after correcting the false-positive gate and installer assertion mismatch. The only remaining Base handoff boundary is the WSL host installer run. The canonical installer now:

- archives the current SOT runtime/database before cutover;
- regenerates backend and UI from the qualified clean lineage;
- validates the actual polling/reconciliation markers present in that exact UI;
- dry-runs schema 5 migration against a database copy;
- performs an SOT-scoped cutover with automatic rollback on any later failure;
- independently verifies live build/schema/capability, database integrity, public HTTP readback, byte identity, and public JavaScript parse;
- emits owner-test readiness only after those live host gates pass.

## Handoff rule

Owner testing occurs only after all executable repository gates above pass on the exact candidate and the canonical public URL serves byte-identical qualified UI. The WSL installer must independently verify live health/schema/public identity and rollback on failure.

Repository qualification has passed after correction. **No owner test URL is declared qualified until the WSL installer completes successfully and prints `=== TURN 01 BASE READY FOR OWNER TEST ===`.**
