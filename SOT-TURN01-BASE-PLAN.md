# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE — COORDINATION RECOVERY  
**Date:** 2026-09-02

## Recovery anchor

- Accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Accepted pre-base backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`.
- Clean Base UI integrators: Base-22 at `603e8a331b13b72a097e9ebb9640e33707279777` and Base-24 at `083aa1334208b1e6995fa18852e82722a815f331`.
- Canonical AI/storage-default integrator: `5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5/integrate-SOT-turn01-base-ai.py`.
- Last declared live backend: build `2026.08.30.sot-turn01-base-22`, schema `4`.
- Canonical target remains `SOT/SOT-turn01-base.html`.
- 2026-09-02 owner-tested coordination release is REJECTED and is evidence only: `SOT/archive/2026-09-02-turn01-coordination-owner-rejection/`.
- Rejected architecture record: `SOT/archive/2026-09-02-turn01-coordination-owner-rejection/GY-019.md`.

## Governance

1. `SOT-turn01-pre-base.html` remains the frozen recovery anchor. Failed generated HTML is evidence only and never becomes an implementation ancestor.
2. `install-SOT-turn01-base.sh` is the only active Base installer. Numbered installers are history only.
3. Before governed SOT files change, archive the current commit/path/blob state under `SOT/archive/`.
4. Product development proceeds from the pinned clean lineage above. Do not patch the failed coordination runtime forward.
5. Rollback is SOT-scoped. Never rewind unrelated repository projects merely to recover SOT.
6. The owner is the browser/device product tester. Mechanical QA prevents broken handoffs but does not replace owner testing.
7. No forward feature work until coordination, observability, and durable evidence/plan state pass the Base recovery gates below.

## Base product contract

The canonical Base must retain all of the following:

1. Stable completed Index with `2-copy`, `3-copy`, and `4+ copy` findings and drill-down.
2. Current versus stale Plan separation with explicit re-index recovery.
3. One Source/Target/Backup/default selector with independent Available/Selected scrolling, local search, true move semantics, and footer commit action.
4. Default Target and Default Backup configuration.
5. Dynamic Windows volume inventory shared across Source, Target, Backup, and defaults; operation-boundary validation remains deterministic.
6. Operational Venice/OpenRouter model discovery, real completion validation, browser-local keys, and explicit active provider/model state.
7. Every inference begins with the SOT supervisor prompt, then exact project/evidence context, then conversation history and operator request.
8. AI remains advisory: `Inference -> structured proposal -> deterministic validation -> SOT Plan -> approval -> execution`.
9. UI interaction remains available while indexing, planning, execution, or work on another project is running.
10. Different projects may execute concurrently; one project may not have competing lifecycle mutations.

## Coordination architecture — authoritative

### Concurrency model

SOT is multi-process/multi-thread capable, but concurrency has boundaries:

- **Across projects:** concurrent indexing/planning/execution is allowed subject to global resource limits.
- **Within indexing:** bounded hash/read workers may run concurrently under one authoritative index operation.
- **Within one project lifecycle:** exactly one state-mutating coordinator operation owns the project at a time.
- **UI:** never waits synchronously for filesystem scan, hashing, planning, execution, or another project's work.

### Project lifecycle

The authoritative lifecycle is:

`idle -> indexing -> indexed -> planning -> planned -> executing`

with explicit terminal/interruption states:

`paused`, `failed`, `cancelled`.

A lifecycle transition is a backend transaction, not a UI inference. Every transition records prior state, new state, project token, operation ID, generation, timestamp, and relevant evidence/plan revision.

### Project lease and generation

Every state-mutating operation receives a durable operation ID and captures the project's current mutation generation. Starting a new accepted mutation increments/claims that generation atomically. A worker may do expensive work outside the database transaction, but it may commit final state only when its operation ID and generation still own the project.

Stale completion is therefore harmless: it is logged and discarded rather than overwriting newer evidence, plan, or project state.

### Evidence truth

Index/re-index builds candidate evidence separately from the currently committed evidence revision. `evidence_revision` advances atomically only after the full candidate index is successfully committed. Pause, failure, cancellation, service restart, or stale completion cannot replace the last committed evidence.

The UI must display the exact committed evidence revision supplied by the backend. It must not synthesize or optimistically advance revision state.

### Plan truth

A plan is immutable with respect to the evidence revision from which it was generated. Planning reads committed evidence only. A plan becomes stale only when a newer committed evidence revision exists. Re-index may run without destroying the currently usable evidence/plan until the new index commits.

### UI refresh contract

Background refresh patches server-owned data into the current view. It must not replace operator-owned interaction state. Polling/events may update counters, status, progress, activity, evidence revision, and button eligibility, but must preserve active project selection, tab, modal/picker state, search text, scroll position, focus, and in-progress form edits unless the operator explicitly changes context.

Completed-state rerender loops are prohibited.

## Observability contract

Durable logging is part of Base, not optional diagnostics. At minimum record:

- operation/job queued, started, paused, resumed, cancelled, failed, completed, stale-discarded;
- project lifecycle transition with before/after state;
- evidence candidate creation and atomic evidence commit;
- plan creation with bound evidence revision;
- plan stale transition caused by a newer committed evidence revision;
- execution start/end and plan/evidence identifiers;
- worker PID/exit/error where applicable;
- service restart recovery/interruption;
- rejected conflicting operation with the operation currently holding the project lease.

The operator-facing Activity/Diagnostics surface must make this history inspectable per project and globally without requiring terminal access.

## Recovery implementation order

1. Rebuild from the governed clean lineage; do not use the rejected owner-tested runtime as source.
2. Add durable project operation/lease + mutation generation state and migration.
3. Route index/re-index, plan, and execute through the same per-project coordinator.
4. Make index candidate evidence commit atomic and stale-safe.
5. Bind plan state to committed evidence revision only.
6. Make worker completion conditional on operation ownership/generation.
7. Replace destructive UI polling/rerender with data-only reconciliation preserving interaction state.
8. Expose durable Activity/Diagnostics from the event/job ledger.
9. Preserve cross-project concurrency and bounded hashing workers.
10. Re-integrate the protected Base product contract and mechanically qualify before owner handoff.

## Mechanical QA floor

Before owner handoff, the exact generated candidate and exact public read-back must pass the existing lightweight release gates plus these coordination gates:

- pinned clean-source SHA verification;
- Python integrator parse;
- protected product-contract checks;
- per-inline-script and combined JavaScript `node --check`;
- backend syntax/boot/health/schema verification before and after cutover;
- exact SHA-256 identity between generated candidate and canonical public read-back;
- automatic rollback if install/read-back/post-health fails;
- same-project conflict test: second mutating operation is rejected/queued without altering current state;
- cross-project concurrency test: two projects can make progress concurrently;
- stale-worker test: an older operation cannot commit after a newer generation owns the project;
- evidence atomicity test: failed/cancelled re-index leaves prior committed evidence revision usable;
- plan revision test: plan binds to exact committed evidence and becomes stale only after a newer evidence commit;
- UI reconciliation test: repeated progress refresh does not change selected project/tab/picker/search/scroll/focus state;
- restart test: interrupted operations become explicit durable interruption/failure state and cannot silently resume mutation;
- activity-ledger test: each tested transition can be reconstructed from durable events/jobs.

The WSL-to-Windows Chrome/Edge DOM harness, Windows browser-profile lifecycle, browser-process cleanup, and headless browser self-test remain non-gates. Owner browser/device testing occurs only after the coordination gates succeed.

## Handoff rule

A Base handoff occurs only after the coordination recovery candidate passes the mechanical floor and the canonical public URL serves the exact qualified bytes. The installer then emits:

`=== TURN 01 BASE READY FOR OWNER TEST ===`

Until then, the 2026-09-02 coordination release remains rejected evidence and is not a baseline.