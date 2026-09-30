# SOT Turn 02 Release D — Placement Refresh Spin Correction

**Decision date:** 2026-09-30  
**Status:** OWNER-REPORTED BLOCKER / MINIMAL CORRECTION

## Owner definition of working

> “it just spins”

The Database refresh blocker must terminate after one complete authoritative estate snapshot is loaded, even while Continuous SSOT is changing the live catalog.

## Measured cause

The current browser wrapper deliberately rejects a paged load when `catalog_revision` changes between pages and immediately retries the entire load. The current `/api/placements/page` endpoint reads each page and its revision independently from the live database. During active automatic SSOT work, the catalog can change between page requests, so a 30,324-row refresh can repeatedly restart and leave **Database refreshing / rebuilding** visible indefinitely.

This is a paging-consistency defect, not a database rebuild requirement and not an analysis/job failure.

## Baseline score

- complete estate exists in SQLite — PASS;
- paging beyond 10,000 rows — PASS;
- blocker prevents stale partial estate from becoming actionable — PASS;
- one multi-page request observes one immutable estate snapshot while the live catalog changes — FAIL;
- refresh terminates under catalog churn — FAIL.

## Change

1. Keep the accepted browser blocker and complete-placement wrapper unchanged.
2. Change only the Release D paging wrapper so page 1 captures an immutable in-memory snapshot of active placement rows plus its catalog revision.
3. Continuation pages are served from that same snapshot by monotonic `placement_no` cursor, even if the live catalog changes meanwhile.
4. A later request beginning at `after=0` captures a new current snapshot.
5. Snapshot cursor state expires after 120 seconds.
6. No schema migration, database rebuild, rehash, classification, source/job lifecycle, report math, AI behavior, or owner UI change.

## Mechanical acceptance

- start with 12,005 active placements at catalog revision 42;
- fetch page 1;
- mutate the live fixture to 12,006 placements and catalog revision 43 before page 2;
- pages 2 and 3 must still report revision 42, total 12,005, and return exactly the original 12,005 rows;
- a new page-1 request must report revision 43 and total 12,006;
- existing Continuous SSOT, complete-placement, owner UI and diagnostics gates remain green.

## Protected

The owner-visible navigation and behavior from the prior convergence build are unchanged. This correction is limited to making the already-required complete refresh finite and internally consistent.
