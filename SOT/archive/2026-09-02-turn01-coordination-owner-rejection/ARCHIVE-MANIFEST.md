# SOT Turn 01 Coordination Owner Rejection — Archive Manifest

**Recorded:** 2026-09-02
**Repository:** `acmeproducts/stuff`
**Branch:** `main`
**Pre-change main:** `4d694accab43adcea26fe35bfb6e224c5d6713f9`

## Owner-observed failure

The latest owner-tested SOT runtime is rejected as a release baseline because project/index/plan/UI state did not remain coherent under concurrent activity. Observed symptoms included indexed state apparently disappearing, re-index rediscovering records without producing durable plan-eligible evidence, contradictory evidence/plan revision display, and UI selection/navigation fighting background refresh.

## Pre-change governed blobs

- `SOT-TURN01-BASE-PLAN.md`: `f015e2f134732ca36d4c8652420c747a040b140d`
- `SOT-GRAVEYARD.md`: `91641ccb26d75c34c6e40a49cac710c53571dc13`
- `sot-worker.js`: `fd6dd279c245c90d82fc1f7b5111aae00b341a8d`

## Recovery rule

This failure is evidence only. Do not patch the failed owner-tested runtime forward. SOT recovery is scoped to SOT files; unrelated repository work on `main` must remain intact.

The replacement architecture must preserve real background concurrency while serializing state mutation per project, make UI refresh non-destructive, reject stale worker completions, and provide durable event/job observability sufficient to explain every lifecycle transition.