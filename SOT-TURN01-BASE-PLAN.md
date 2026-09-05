# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** SINGLE-SURFACE REBUILD IN EXECUTABLE QUALIFICATION — QUALIFIED BACKEND RETAINED  
**Date:** 2026-09-04

## Recovery anchor

- Accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Accepted pre-base backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`.
- Clean Base UI integrators: Base-22 at `603e8a331b13b72a097e9ebb9640e33707279777` and Base-24 at `083aa1334208b1e6995fa18852e82722a815f331`.
- Canonical AI/storage-default integrator: `5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5/integrate-SOT-turn01-base-ai.py`.
- Canonical target remains `SOT/SOT-turn01-base.html` on the host; repository source is `SOT-turn01-base.html`.
- 2026-09-02 coordination failure remains rejected evidence: `SOT/archive/2026-09-02-turn01-coordination-owner-rejection/` / `GY-019.md`.
- 2026-09-03 build `2026.09.03.sot-turn01-coordination-1` is REJECTED evidence only. Owner gate failed 1, 3, 4, 5, 6 and 7; only same-project conflict blocking passed. Record: `SOT/archive/2026-09-03-turn01-coordination-owner-rejection/GY-020.md`.
- 2026-09-04 false-positive gate-9 / installer handoff failure is rejected qualification evidence at `SOT/archive/2026-09-04-turn01-qualified-installer-handoff-failure/GY-021.md`.
- The qualified coordination implementation remains pinned at `b58920f014960c9b18b705a0fdcf0406c621fd5f` with backend build `2026.09.03.sot-turn01-coordination-2`, schema 5.
- The mechanically qualified but owner-rejected old UI architecture is now recorded at `SOT/archive/2026-09-04-turn01-qualified-ui-owner-rejection/GY-022.md`.
- Single-surface prechange state is archived at `SOT/archive/2026-09-04-1840-turn01-single-surface-rebuild/ARCHIVE-MANIFEST.md`.

## Governance

1. `SOT-turn01-pre-base.html` remains the frozen recovery anchor. Failed generated HTML is evidence only and never becomes an implementation ancestor.
2. `install-SOT-turn01-base.sh` is the only active Base installer. Numbered installers are history only.
3. Before governed SOT files change, archive the current commit/path/blob state under `SOT/archive/`.
4. Product development proceeds from the pinned clean lineage above. Do not patch rejected coordination runtimes or the owner-rejected old navigation surface forward.
5. Rollback is SOT-scoped. Never rewind unrelated repository projects merely to recover SOT.
6. The owner is the browser/device product tester. Mechanical QA must remove mechanically reproducible failures before owner testing.
7. No forward feature work until coordination, observability, durable evidence/plan state, and UI reconciliation pass executable behavioral gates.

Prechange state for the initial executable qualification transition is archived at `SOT/archive/2026-09-04-1405-turn01-base-executable-qualification/ARCHIVE-MANIFEST.md`. The failed handoff and qualification defect are archived in GY-021 before the corrected workflow/installer changes.

## Base product contract

The canonical Base must retain: stable completed Index with 2-copy/3-copy/4+ findings; explicit current/stale Plan separation; one shared Source/Target/Backup/default storage selector; Default Target/Backup; dynamic Windows volume inventory; operational Venice/OpenRouter provider/model state; SOT supervisor prompt and exact evidence context; advisory AI proposal flow; responsive UI during work; cross-project concurrency with one mutation owner per project.

## Project surface architecture — authoritative

Each project is one continuous operational surface. The visible flow is:

`Scope / Storage → Index → Review → Plan → Execute → Activity`

There is no second project-step navigation model, no project-to-review context jump, and no buried `Open Review` action. Source, Target and Backup are directly editable from Scope / Storage through the same volume/folder selector. Index controls and live progress, deterministic Review findings, current/stale Plan truth, deterministic Execute/Certify controls, and durable Activity/Diagnostics all remain inside the same project surface.

Global SOT is limited to cross-project status, aggregate truth, scheduler/database state, project creation/deletion and configuration. Each project remains operationally independent and feeds the centralized SOT database and plan authority.

Background refresh may reconcile server-owned state in place but must not replace or reset operator-owned selected project, Omnisearch text, open picker/modal, focused input or edit value, scroll position, or expanded/collapsed surface state.

## Coordination architecture — authoritative

- Different projects may index/plan/execute concurrently subject only to global resource limits.
- One project has exactly one state-mutating lifecycle owner at a time.
- Indexing may use bounded read/hash workers under that owner.
- Lifecycle is backend truth: `idle -> indexing -> indexed -> planning -> planned -> executing`, with explicit `paused`, `failed`, `cancelled`/interrupted outcomes.
- Every mutation has durable operation ID + generation; stale completions are discarded and logged.
- Re-index builds candidate evidence separately. Current committed evidence remains usable until a complete candidate atomically replaces it.
- Plans bind an exact committed evidence revision and become stale only after a newer evidence revision successfully commits.
- UI refresh updates server-owned values without replacing operator-owned selection, modal/picker, search, scroll, focus, form-edit state, or surface expansion state.
- Activity/Diagnostics records queued/start/pause/resume/cancel/fail/complete/stale-discard, lifecycle transitions, evidence commits, plan binding/staleness, execution, worker exit/restart recovery, and conflict rejection.

## Recovery implementation order

1. Rebuild from the governed clean lineage, never from the rejected 2026-09-03 runtime or owner-rejected old UI surface.
2. Retain the qualified transactional project-operation authority shared by index/re-index, plan and execute.
3. Keep replacement index evidence in operation-scoped candidate storage until atomic commit; no destructive deletion/update of current evidence before commit.
4. Bind plan eligibility and staleness exclusively to committed evidence revision.
5. Make pause/stop/restart transitions durable and generation-safe.
6. Use one continuous project surface and targeted reconciliation; operator interaction state is never reconstructed from polling.
7. Expose the durable operation/event ledger in Activity/Diagnostics on the same project surface.
8. Preserve cross-project concurrency and the full protected Base product contract.
9. Build executable behavioral qualification before another owner handoff.

## Qualification floor — executable behavior required

Source inspection, marker searches, syntax checks, schema checks and capability strings are necessary but **cannot satisfy a behavioral gate**.

The exact candidate must be started against a disposable schema-5+ database and the automated harness must execute and assert:

1. **Same-project exclusion:** conflicting mutation is rejected without changing current state.
2. **Cross-project independence:** Project A and Project B both make observable progress while overlapping operations run.
3. **Committed-state durability:** completed Index remains current and plan-eligible after API refresh/reload/restart.
4. **Re-index atomicity:** with revision N committed, a replacement index is started and then failed/cancelled; revision N evidence remains queryable and plan-eligible. Only successful replacement advances to N+1.
5. **Plan truth:** plan binds exact revision N; remains current during replacement indexing; becomes stale only after N+1 commits.
6. **Stale worker:** old generation cannot commit after ownership changes.
7. **Pause/stop/restart:** each leaves an explicit durable state, retains prior committed evidence, and cannot silently resume stale mutation.
8. **Activity reconstruction:** operation history reconstructs every tested transition and rejection.
9. **Single-surface UI reconciliation:** a real DOM/browser-state harness runs the exact UI while real 3-second polling updates server-owned progress and asserts one continuous project flow plus preservation of selected project, open picker/modal, Omnisearch text, focus/input edit value, scroll, and surface state. The harness also proves rejected step-tabs/Open Review navigation is absent.
10. Existing parse/boot/health/schema/public-byte identity/rollback/product-contract gates also pass.

A qualification workflow that merely searches generated source for these mechanisms is a failed qualification and must not emit readiness.

## 2026-09-04 corrected executable coordination qualification result

The first nominally green run `33919314140` validly passed gates 1-8 and gate 10, but its original gate 9 was invalid: it conditionally called `backgroundPulse` only if that nonexistent function was present, so no actual progress update occurred. The subsequent WSL handoff correctly exposed the mismatch when the installer asserted `function backgroundPulse()` and exited before cutover. That false-positive qualification/handoff is rejected and recorded in GY-021.

Corrected coordination qualification consists of:

- **Core gates 1-8 and 10:** PASS on run `33919314140`, commit `141de8b2a46d705848462365473447e7e0827f45`.
- **Old-surface Gate 9 real polling/browser reconciliation:** PASS on run `33922645501`, commit `b58920f014960c9b18b705a0fdcf0406c621fd5f`. This remains evidence for the qualified coordination/reconciliation foundation, not acceptance of the old product architecture.
- `compare 141de8b2...b58920f0` confirms no coordination backend/UI integrator, worker, coordinator, or migration file changed between the core-qualified commit and corrected gate-9 commit; intervening changes are workflow/governance/installer or unrelated repository projects.
- **Prior canonical installer qualification:** PASS on run `33922817854`, commit `3e073b545ad8c254e5a7636e28e030678dfc7c81`.

No rejected generated runtime is used as an implementation ancestor.

## 2026-09-04 live cutover and owner rejection

The corrected canonical installer was executed successfully on the WSL host on 2026-09-04 at approximately 14:57 PT. It passed live backend/schema/database/public-byte qualification and served the qualified Base at `https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html` with backend build `2026.09.03.sot-turn01-coordination-2`, schema 5.

That successful mechanical/live qualification did **not** constitute owner UI acceptance. During owner testing the old surface was rejected because it still fragmented a project into separate project/step navigation and context changes. This product-architecture rejection is GY-022. The qualified backend/coordination foundation remains accepted and is retained.

## Single-surface replacement

The clean replacement source is `SOT-turn01-base.html`, build marker `SOT-turn01-base-single-surface-r2`. The exact UI bytes were introduced at commit `14d9f9670e1520668fab6786642e0abadc332faa`, blob `8125cc8df5bec3e47dd0be2edc922a128bf7bed4`.

The replacement directly exposes on every selected project:

- Scope / Storage with the shared Source/Target/Backup picker;
- Index controls and live progress;
- Review evidence with 2-copy, 3-copy and 4+ duplicate drill-down plus evidence-grounded AI POV;
- Current Plan versus Previous / Stale Plan truth;
- deterministic Execute and Certify actions;
- Activity / Diagnostics event reconstruction.

The canonical installer no longer regenerates the rejected old UI. It retains the exact qualified coordination backend generation and fetches the immutable single-surface UI bytes directly from the pinned UI commit. It archives prechange host state, dry-runs schema 5 migration, performs SOT-scoped rollback on failure, verifies live backend capabilities and database integrity, then requires byte-identical public serving and public JavaScript parse before declaring owner-test readiness.

Single-surface executable browser qualification is tracked by `.github/workflows/sot-single-surface-qualification.yml`. Installer source/generation qualification is tracked by `.github/workflows/sot-single-surface-installer-qualification.yml`. Their passing run IDs must be recorded here before publication to `main`.

## Current release boundary

The backend/coordination foundation is already mechanically and live qualified. The remaining release boundary is:

1. pass the new exact single-surface browser/reconciliation qualification;
2. pass the canonical single-surface installer source/generation qualification;
3. publish the governed SOT changes onto the then-current `main` without overwriting unrelated newer work;
4. execute the immutable canonical installer on the WSL host;
5. require the installer to verify live health/schema/database/public byte identity and print `=== TURN 01 BASE READY FOR OWNER TEST ===`.

## Handoff rule

Owner testing occurs only after the exact single-surface candidate passes executable repository gates and the canonical public URL serves byte-identical qualified UI. The WSL installer independently verifies live health/schema/public identity and rolls back on failure.

**No replacement owner test URL is declared qualified until the single-surface repository gates pass and the WSL installer completes successfully.**